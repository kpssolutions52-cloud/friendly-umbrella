import { Server } from 'socket.io';
import { prisma } from '../../utils/prisma';

// Helper function to broadcast quote updates
export function broadcastQuoteUpdate(
  io: Server,
  data: {
    quoteRequestId: string;
    companyId: string;
    supplierId: string;
    status: string;
    event: 'quote:created' | 'quote:responded' | 'quote:accepted' | 'quote:rejected' | 'quote:cancelled' | 'quote:countered' | 'quote:deleted';
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

// Helper function to broadcast RFQ creation to relevant suppliers
export async function broadcastRFQCreated(
  io: Server,
  data: {
    rfqId: string;
    companyId: string;
    companyName: string;
    title: string;
    category?: string;
    supplierIds: string[]; // Array of supplier IDs to notify (empty = all suppliers)
    isOpenToAll: boolean;
  }
) {
  const rfqData = {
    event: 'rfq:created',
    data: {
      rfqId: data.rfqId,
      companyId: data.companyId,
      companyName: data.companyName,
      title: data.title,
      category: data.category,
      createdAt: new Date().toISOString(),
    },
  };

  if (data.isOpenToAll) {
    // Broadcast to all suppliers
    io.to('suppliers').emit('rfq:created', rfqData);
  } else {
    // Broadcast only to specified suppliers
    data.supplierIds.forEach((supplierId) => {
      io.to(`tenant:${supplierId}`).emit('rfq:created', rfqData);
    });
  }
}

// Helper function to find relevant suppliers for an RFQ based on category
// Only returns suppliers who have products matching the RFQ category
export async function findRelevantSuppliersForRFQ(
  category?: string,
  location?: string
): Promise<string[]> {
  const suppliers: string[] = [];

  // Find suppliers that have products in the RFQ category
  if (category) {
    const suppliersWithCategory = await prisma.tenant.findMany({
      where: {
        type: { in: ['supplier', 'service_provider'] },
        isActive: true,
        products: {
          some: {
            isActive: true,
            OR: [
              { category: { name: { contains: category, mode: 'insensitive' } } },
              { serviceCategory: { name: { contains: category, mode: 'insensitive' } } },
              { name: { contains: category, mode: 'insensitive' } },
              { description: { contains: category, mode: 'insensitive' } },
            ],
          },
        },
      },
      select: { id: true },
    });

    suppliers.push(...suppliersWithCategory.map((s) => s.id));
  }

  // If no category provided or no matches found, return empty array
  // This ensures we only notify relevant suppliers, not all suppliers
  // Companies can explicitly target specific suppliers if they want broader reach

  // Remove duplicates
  return [...new Set(suppliers)];
}



