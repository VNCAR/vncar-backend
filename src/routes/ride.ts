import { Router, Request, Response } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import prisma from '../config/prisma';
import { RideStatus, Role } from '@prisma/client';

const router = Router();

// Lấy danh sách chuyến đi (Tài xế xem)
router.get('/', verifyFirebaseToken, async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Chỉ trả về các chuyến đi đang "pending" (đang tìm tài xế)
    const rides = await prisma.ride.findMany({
      where: {
        status: RideStatus.pending,
      },
      include: {
        creator: {
          select: {
            name: true,
            phone: true,
            rating: true,
          }
        },
        bids: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ rides });
  } catch (error: any) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Khách hàng tạo chuyến đi mới
router.post('/', verifyFirebaseToken, async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    originLat,
    originLng,
    originAddress,
    destinationLat,
    destinationLng,
    destinationAddress,
    pickupTime,
    priceRangeMin,
    priceRangeMax,
    carType,
    notes
  } = req.body;

  // Basic validation (Assuming validation is handled strictly in prod, simple for now)
  if (!originLat || !originLng || !destinationLat || !destinationLng) {
    res.status(400).json({ error: 'Missing coordinates for origin or destination' });
    return;
  }

  try {
    const newRide = await prisma.ride.create({
      data: {
        creatorId: user.uid,
        originLat,
        originLng,
        originAddress,
        destinationLat,
        destinationLng,
        destinationAddress,
        pickupTime: pickupTime ? new Date(pickupTime) : undefined,
        priceRangeMin,
        priceRangeMax,
        carType,
        notes,
        status: RideStatus.pending,
      },
    });

    res.status(201).json({
      message: 'Ride created successfully',
      ride: newRide,
    });
  } catch (error: any) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride', details: error.message });
  }
});

export default router;
