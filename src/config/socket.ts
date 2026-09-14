import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import prisma from './prisma';
import { RideStatus } from '@prisma/client';

let io: Server;

export const setupSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] 🟢 User connected: ${socket.id}`);

    // Khách hàng tham gia phòng của chuyến đi để lắng nghe Bids
    socket.on('join_ride', (rideId: string) => {
      socket.join(`ride_${rideId}`);
      console.log(`[Socket] 👤 Client joined ride room: ride_${rideId}`);
    });

    // Tài xế gửi một mức giá (Bid)
    socket.on('place_bid', async (data: { rideId: string; driverId: string; price: number }) => {
      try {
        console.log(`[Socket] 💰 Bid received for ride ${data.rideId} by driver ${data.driverId} - Price: ${data.price}`);
        
        // 1. Lưu Bid vào DB
        const newBid = await prisma.bid.create({
          data: {
            rideId: data.rideId,
            driverId: data.driverId,
            price: data.price,
          },
          include: {
            driver: {
              select: {
                name: true,
                phone: true,
                rating: true,
                vehicleFrontUrl: true,
              }
            }
          }
        });

        // 2. Bắn sự kiện 'new_bid' về lại cho Khách hàng trong phòng rideId
        io.to(`ride_${data.rideId}`).emit('new_bid', newBid);
        
      } catch (error) {
        console.error('[Socket] ❌ Error placing bid:', error);
        socket.emit('error', { message: 'Không thể gửi mức giá.' });
      }
    });

    // Khách hàng chấp nhận 1 mức giá
    socket.on('accept_bid', async (data: { rideId: string; bidId: string; driverId: string }) => {
      try {
        console.log(`[Socket] ✅ Ride ${data.rideId} accepted bid ${data.bidId} from driver ${data.driverId}`);
        
        // 1. Cập nhật trạng thái chuyến đi
        await prisma.ride.update({
          where: { id: data.rideId },
          data: { status: RideStatus.accepted },
        });

        // 2. Có thể cập nhật trạng thái Bid thành 'accepted' (Cần thêm field status vào Bid schema nếu muốn)
        // Hiện tại ta chỉ cần báo cho tất cả mọi người trong phòng biết chuyến đi đã được nhận
        io.to(`ride_${data.rideId}`).emit('ride_accepted', {
          rideId: data.rideId,
          acceptedBidId: data.bidId,
          driverId: data.driverId,
        });

      } catch (error) {
        console.error('[Socket] ❌ Error accepting bid:', error);
        socket.emit('error', { message: 'Không thể chấp nhận mức giá này.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] 🔴 User disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
