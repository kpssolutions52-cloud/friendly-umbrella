import { QuoteStatus, Prisma } from '@prisma/client';
import createError from 'http-errors';
import { prisma } from '../utils/prisma';
import { broadcastQuoteUpdate } from '../websocket/handlers/quoteUpdates';
import { getSocketIO } from '../utils/socket';

export class QuoteService {
  /**
   * Create a new quote request (Company)
   */
  async createQuoteRequest(
    companyId: string,
    productId: string,
    requestedBy: string,
    data: {
      quantity?: number;
      unit?: string;
      requestedPrice?: number;
      currency?: string;
      message?: string;
      expiresAt?: Date;
    }
  ) {
    // Verify product exists and get supplier info
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      throw createError(404, 'Product not found or inactive');
    }

    if (product.supplier.type !== 'supplier' && product.supplier.type !== 'service_provider') {
      throw createError(400, 'Product must belong to a supplier or service provider');
    }

    if (!product.supplier.isActive) {
      throw createError(400, 'Supplier is not active');
    }

    // Verify company exists and is active
    const company = await prisma.tenant.findFirst({
      where: { id: companyId, type: 'company', isActive: true },
    });

    if (!company) {
      throw createError(404, 'Company not found or inactive');
    }

    // Create quote request
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        companyId,
        supplierId: product.supplierId,
        productId,
        quantity: data.quantity ? new Prisma.Decimal(data.quantity) : null,
        unit: data.unit || product.unit,
        requestedPrice: data.requestedPrice ? new Prisma.Decimal(data.requestedPrice) : null,
        currency: data.currency || 'USD',
        message: data.message,
        requestedBy,
        expiresAt: data.expiresAt,
        status: QuoteStatus.pending,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return quoteRequest;
  }

  /**
   * Get quote requests for a company
   */
  async getCompanyQuoteRequests(companyId: string, filters?: {
    status?: QuoteStatus;
    supplierId?: string;
    productId?: string;
  }) {
    const where: Prisma.QuoteRequestWhereInput = {
      companyId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    const quoteRequests = await prisma.quoteRequest.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            type: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        responses: {
          orderBy: {
            respondedAt: 'desc',
          },
          include: {
            respondedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return quoteRequests;
  }

  /**
   * Get quote requests for a supplier
   */
  async getSupplierQuoteRequests(supplierId: string, filters?: {
    status?: QuoteStatus;
    companyId?: string;
    productId?: string;
  }) {
    const where: Prisma.QuoteRequestWhereInput = {
      supplierId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    const quoteRequests = await prisma.quoteRequest.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            type: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        responses: {
          orderBy: {
            respondedAt: 'desc',
          },
          include: {
            respondedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return quoteRequests;
  }

  /**
   * Get a single quote request by ID
   */
  async getQuoteRequestById(quoteRequestId: string, tenantId: string, tenantType: string) {
    const quoteRequest = await prisma.quoteRequest.findFirst({
      where: {
        id: quoteRequestId,
        OR: [
          { companyId: tenantId },
          { supplierId: tenantId },
        ],
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            type: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            logoUrl: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            logoUrl: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        respondedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        responses: {
          orderBy: {
            respondedAt: 'desc',
          },
          include: {
            respondedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!quoteRequest) {
      throw createError(404, 'Quote request not found');
    }

    // Verify access
    if (tenantType === 'company' && quoteRequest.companyId !== tenantId) {
      throw createError(403, 'Access denied');
    }

    if ((tenantType === 'supplier' || tenantType === 'service_provider') && quoteRequest.supplierId !== tenantId) {
      throw createError(403, 'Access denied');
    }

    return quoteRequest;
  }

  /**
   * Respond to a quote request (Supplier)
   */
  async respondToQuoteRequest(
    quoteRequestId: string,
    supplierId: string,
    respondedBy: string,
    data: {
      price: number;
      currency?: string;
      quantity?: number;
      unit?: string;
      validUntil?: Date;
      message?: string;
      terms?: string;
    }
  ) {
    // Verify quote request exists and belongs to supplier
    const quoteRequest = await prisma.quoteRequest.findFirst({
      where: {
        id: quoteRequestId,
        supplierId,
        status: QuoteStatus.pending,
      },
      include: {
        product: true,
      },
    });

    if (!quoteRequest) {
      throw createError(404, 'Quote request not found or already responded');
    }

    // Check if expired
    if (quoteRequest.expiresAt && quoteRequest.expiresAt < new Date()) {
      await prisma.quoteRequest.update({
        where: { id: quoteRequestId },
        data: { status: QuoteStatus.expired },
      });
      throw createError(400, 'Quote request has expired');
    }

    // Create quote response
    const quoteResponse = await prisma.quoteResponse.create({
      data: {
        quoteRequestId,
        price: new Prisma.Decimal(data.price),
        currency: data.currency || quoteRequest.currency,
        quantity: data.quantity ? new Prisma.Decimal(data.quantity) : quoteRequest.quantity,
        unit: data.unit || quoteRequest.unit || quoteRequest.product.unit,
        validUntil: data.validUntil,
        message: data.message,
        terms: data.terms,
        respondedBy,
      },
      include: {
        respondedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update quote request status
    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        status: QuoteStatus.responded,
        respondedBy,
        respondedAt: new Date(),
      },
    });

    // Broadcast quote response notification
    const io = getSocketIO();
    if (io) {
      broadcastQuoteUpdate(io, {
        quoteRequestId,
        companyId: updatedQuoteRequest.companyId,
        supplierId: updatedQuoteRequest.supplierId,
        status: QuoteStatus.responded,
        event: 'quote:responded',
      });
    }

    return quoteResponse;
  }

  /**
   * Accept a quote response (Company)
   */
  async acceptQuoteResponse(quoteResponseId: string, companyId: string) {
    const quoteResponse = await prisma.quoteResponse.findFirst({
      where: { id: quoteResponseId },
      include: {
        quoteRequest: true,
      },
    });

    if (!quoteResponse) {
      throw createError(404, 'Quote response not found');
    }

    if (quoteResponse.quoteRequest.companyId !== companyId) {
      throw createError(403, 'Access denied');
    }

    if (quoteResponse.isAccepted) {
      throw createError(400, 'Quote response already accepted');
    }

    // Update quote response
    await prisma.quoteResponse.update({
      where: { id: quoteResponseId },
      data: {
        isAccepted: true,
        acceptedAt: new Date(),
      },
    });

    // Update quote request status
    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id: quoteResponse.quoteRequestId },
      data: {
        status: QuoteStatus.accepted,
      },
    });

    // Broadcast quote acceptance notification
    const io = getSocketIO();
    if (io) {
      broadcastQuoteUpdate(io, {
        quoteRequestId: quoteResponse.quoteRequestId,
        companyId: updatedQuoteRequest.companyId,
        supplierId: updatedQuoteRequest.supplierId,
        status: QuoteStatus.accepted,
        event: 'quote:accepted',
      });
    }

    return quoteResponse;
  }

  /**
   * Reject a quote request or response
   */
  async rejectQuote(quoteRequestId: string, tenantId: string, tenantType: string) {
    const quoteRequest = await prisma.quoteRequest.findFirst({
      where: { id: quoteRequestId },
    });

    if (!quoteRequest) {
      throw createError(404, 'Quote request not found');
    }

    // Verify access
    if (tenantType === 'company' && quoteRequest.companyId !== tenantId) {
      throw createError(403, 'Access denied');
    }

    if ((tenantType === 'supplier' || tenantType === 'service_provider') && quoteRequest.supplierId !== tenantId) {
      throw createError(403, 'Access denied');
    }

    // Update status
    await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        status: QuoteStatus.rejected,
      },
    });

    return quoteRequest;
  }

  /**
   * Cancel a quote request (Company)
   */
  async cancelQuoteRequest(quoteRequestId: string, companyId: string) {
    const quoteRequest = await prisma.quoteRequest.findFirst({
      where: {
        id: quoteRequestId,
        companyId,
        status: QuoteStatus.pending,
      },
    });

    if (!quoteRequest) {
      throw createError(404, 'Quote request not found or cannot be cancelled');
    }

    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        status: QuoteStatus.cancelled,
      },
    });

    // Broadcast quote cancellation notification
    const io = getSocketIO();
    if (io) {
      broadcastQuoteUpdate(io, {
        quoteRequestId,
        companyId: updatedQuoteRequest.companyId,
        supplierId: updatedQuoteRequest.supplierId,
        status: QuoteStatus.cancelled,
        event: 'quote:cancelled',
      });
    }

    return updatedQuoteRequest;
  }

  /**
   * Get quote statistics for dashboard
   */
  async getQuoteStatistics(tenantId: string, tenantType: string) {
    const where: Prisma.QuoteRequestWhereInput = tenantType === 'company'
      ? { companyId: tenantId }
      : { supplierId: tenantId };

    const [total, pending, responded, accepted, rejected] = await Promise.all([
      prisma.quoteRequest.count({ where }),
      prisma.quoteRequest.count({ where: { ...where, status: QuoteStatus.pending } }),
      prisma.quoteRequest.count({ where: { ...where, status: QuoteStatus.responded } }),
      prisma.quoteRequest.count({ where: { ...where, status: QuoteStatus.accepted } }),
      prisma.quoteRequest.count({ where: { ...where, status: QuoteStatus.rejected } }),
    ]);

    return {
      total,
      pending,
      responded,
      accepted,
      rejected,
    };
  }
}

export const quoteService = new QuoteService();
