import { Router, Request, Response } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import prisma from '../config/prisma';
import { Role } from '@prisma/client';

const router = Router();

router.post('/sync', verifyFirebaseToken, async (req: Request, res: Response): Promise<void> => {
  console.log(`\n[Auth Route] Received POST /sync request`);
  const user = req.user;
  const { role } = req.body; // e.g. 'driver' or 'customer'

  if (!user) {
    console.log('[Auth Route] ❌ Sync failed: No user attached to request (Unauthorized).');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let mappedRole: Role = Role.customer;
  if (role === 'driver') {
    mappedRole = Role.driver;
  }

  try {
    const { uid, phone_number, name } = user;
    console.log(`[Auth Route] 🔄 Processing sync for UID: ${uid} | Phone: ${phone_number || 'N/A'} | Role: ${mappedRole}`);

    if (!phone_number) {
      console.log('[Auth Route] ❌ Sync failed: No phone number in Firebase token.');
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const upsertedUser = await prisma.user.upsert({
      where: { uid: uid },
      update: {
        name: name || null,
        phone: phone_number,
        role: mappedRole,
      },
      create: {
        uid: uid,
        name: name || null,
        phone: phone_number,
        role: mappedRole,
      },
    });

    console.log(`[Auth Route] ✅ User synchronized successfully in Prisma:`, upsertedUser);
    res.status(200).json({
      message: 'User synchronized successfully',
      user: upsertedUser,
    });
  } catch (error: any) {
    console.error('Error syncing user to Prisma:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;
