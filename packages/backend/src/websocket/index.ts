import { Server as SocketIOServer } from 'socket.io';
import { authenticateSocket } from './auth';
import { handlePriceUpdates } from './handlers/priceUpdates';

export function setupWebSocket(io: SocketIOServer) {
  // Authentication middleware for WebSocket connections
  io.use(authenticateSocket);

  io.on('connection', (socket: any) => {
    const userId = socket.userId;
    const tenantId = socket.tenantId;
    const tenantType = socket.tenantType;

    console.log(`User ${userId} (${tenantType}) connected`);

    // Join tenant-specific room for targeted notifications
    socket.join(`tenant:${tenantId}`);

    // Handle price update events
    handlePriceUpdates(socket, io);

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  // Export io instance for use in other modules
  (global as any).io = io;
}

