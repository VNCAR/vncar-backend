import { Router, Request, Response } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import prisma from '../config/prisma';
import { KycStatus } from '@prisma/client';

const router = Router();

router.post('/kyc', verifyFirebaseToken, async (req: Request, res: Response): Promise<void> => {
  console.log(`\n[User Route] Received POST /kyc request`);
  const user = req.user;

  if (!user) {
    console.log('[User Route] ❌ KYC failed: No user attached to request (Unauthorized).');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    frontIdCardUrl,
    backIdCardUrl,
    selfieUrl,
    vehicleFrontUrl,
    vehicleBackUrl,
    vehicleLeftUrl,
    vehicleRightUrl,
    businessLicenseUrl
  } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { uid: user.uid },
      data: {
        frontIdCardUrl,
        backIdCardUrl,
        selfieUrl,
        vehicleFrontUrl,
        vehicleBackUrl,
        vehicleLeftUrl,
        vehicleRightUrl,
        businessLicenseUrl,
        kycStatus: KycStatus.pending, // Set status to pending after submission
      },
    });

    console.log(`[User Route] ✅ User KYC updated successfully for UID: ${user.uid}`);
    res.status(200).json({
      message: 'KYC submitted successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating KYC data:', error);
    if (error.code === 'P2025') {
      // Prisma error for Record not found
      res.status(404).json({ error: 'User not found in database. Please sync first.' });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;
