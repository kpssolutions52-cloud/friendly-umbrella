import { Server } from 'socket.io';

// Helper function to broadcast quote updates
export function broadcastQuoteUpdate(
  io: Server,
  data: {
    quoteRequestId: string;
    companyId: string;
    supplierId: string;
    status: string;
    event: 'quote:created' | 'quote:responded' | 'quote:accepted' | 'quote:rejected' | 'quote:cancelled';
  }
) {
  // Notify the company
  io.to(`tenant:${data.companyId}`).emit('quote:updated', {
    event: data.event,
    data: {
      quoteRequestId: data.quoteRequestId,
      status: data.status,
      updatedAt: new Date().toISOString(),
    },
  });

  // Notify the supplier
  io.to(`tenant:${data.supplierId}`).emit('quote:updated', {
    event: data.event,
    data: {
      quoteRequestId: data.quoteRequestId,
      status: data.status,
      updatedAt: new Date().toISOString(),
    },
  });
}
