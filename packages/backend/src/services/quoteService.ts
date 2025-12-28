import { QuoteStatus, Prisma } from '@prisma/client';
import createError from 'http-errors';
import { prisma } from '../utils/prisma';
import { broadcastQuoteUpdate, broadcastRFQCreated, findRelevantSuppliersForRFQ } from '../websocket/handlers/quoteUpdates';
import { getSocketIO } from '../utils/socket';

export class QuoteService {
  /**
   * Create a new quote request (Company) - Product-specific
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
   * Create a general RFQ (Request for Quote) - open to all suppliers or specific supplier
   * Uses a placeholder product approach since schema requires productId
   */
  async createGeneralRFQ(
    companyId: string,
    requestedBy: string,
    data: {
      title: string;
      description?: string;
      category?: string;
      supplierId?: string | null; // null = open to all suppliers
      quantity?: number;
      unit?: string;
      requestedPrice?: number;
      currency?: string;
      expiresAt?: Date;
    }
  ) {
    // Verify company exists and is active
    const company = await prisma.tenant.findFirst({
      where: { id: companyId, type: 'company', isActive: true },
    });

    if (!company) {
      throw createError(404, 'Company not found or inactive');
    }

    // If supplierId is provided, verify it exists
    let supplierId: string;
    if (data.supplierId) {
      const supplier = await prisma.tenant.findFirst({
        where: { 
          id: data.supplierId, 
          type: { in: ['supplier', 'service_provider'] },
          isActive: true 
        },
      });

      if (!supplier) {
        throw createError(404, 'Supplier not found or inactive');
      }
      supplierId = data.supplierId;
    } else {
      // Open RFQ - use first supplier as placeholder (we'll mark it in metadata)
      const firstSupplier = await prisma.tenant.findFirst({
        where: {
          type: { in: ['supplier', 'service_provider'] },
          isActive: true,
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstSupplier) {
        throw createError(400, 'No active suppliers available');
      }
      
      supplierId = firstSupplier.id; // Placeholder - actual filtering done in queries
    }

    // For general RFQs, we need a valid productId
    // We'll find or create a placeholder "General RFQ" product
    // First, try to find an existing placeholder product
    let placeholderProduct = await prisma.product.findFirst({
      where: {
        sku: 'GENERAL-RFQ-PLACEHOLDER',
        supplierId: supplierId,
      },
    });

    // If no placeholder exists, create one
    if (!placeholderProduct) {
      placeholderProduct = await prisma.product.create({
        data: {
          supplierId: supplierId,
          sku: 'GENERAL-RFQ-PLACEHOLDER',
          name: 'General RFQ Placeholder',
          description: 'Placeholder product for general RFQs',
          type: 'product',
          unit: 'RFQ',
          isActive: true,
        },
      });
    }
    
    // Store the RFQ title and details in the message field
    const rfqMessage = `RFQ: ${data.title}\n\n${data.description || ''}\n\nCategory: ${data.category || 'General'}`;

    // Create quote request with placeholder product
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        companyId,
        supplierId,
        productId: placeholderProduct.id,
        quantity: data.quantity ? new Prisma.Decimal(data.quantity) : null,
        unit: data.unit || null,
        requestedPrice: data.requestedPrice ? new Prisma.Decimal(data.requestedPrice) : null,
        currency: data.currency || 'USD',
        message: rfqMessage,
        requestedBy,
        expiresAt: data.expiresAt,
        status: QuoteStatus.pending,
      },
      include: {
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
      },
    });

    // Notify relevant suppliers via WebSocket
    const io = getSocketIO();
    if (io) {
      const isOpenToAll = !data.supplierId;
      let supplierIds: string[] = [];

      if (isOpenToAll) {
        // Find relevant suppliers based on category
        // Only notifies suppliers who have products matching the RFQ category
        supplierIds = await findRelevantSuppliersForRFQ(data.category, quoteRequest.company.address || undefined);
        
        // If no relevant suppliers found, log a warning but don't notify anyone
        // This ensures we only notify suppliers who can actually fulfill the RFQ
        if (supplierIds.length === 0) {
          console.warn(`No relevant suppliers found for RFQ category: ${data.category || 'General'}. RFQ will be visible in public listing but no notifications sent.`);
        }
      } else {
        // Specific supplier targeted
        supplierIds = [supplierId];
      }

      // Only broadcast if we have suppliers to notify
      if (supplierIds.length > 0) {
        await broadcastRFQCreated(io, {
          rfqId: quoteRequest.id,
          companyId: quoteRequest.company.id,
          companyName: quoteRequest.company.name,
          title: data.title,
          category: data.category,
          supplierIds,
          isOpenToAll,
        });
      }
    }

    return quoteRequest;
  }

  /**
   * Get RFQs for a specific supplier (their relevant RFQs)
   * Shows:
   * 1. RFQs specifically targeted to this supplier
   * 2. Open RFQs (all suppliers can see these)
   */
  async getSupplierRFQs(
    supplierId: string,
    filters?: {
      status?: QuoteStatus;
      category?: string;
      search?: string;
      sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'expiresAt';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      message: {
        startsWith: 'RFQ:', // General RFQs
      },
    };

    // Filter by status if provided
    if (filters?.status) {
      where.status = filters.status;
    }

    // Build message filter - combine category and search if both provided
    const messageFilters: any = {
      startsWith: 'RFQ:',
      mode: 'insensitive' as const,
    };

    if (filters?.category && filters?.search) {
      // If both category and search provided, search for RFQs containing both
      where.message = {
        startsWith: 'RFQ:',
        contains: `${filters.category} ${filters.search}`,
        mode: 'insensitive',
      };
    } else if (filters?.category) {
      where.message = {
        startsWith: 'RFQ:',
        contains: filters.category,
        mode: 'insensitive',
      };
    } else if (filters?.search) {
      where.message = {
        startsWith: 'RFQ:',
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Determine sort field and order
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    const orderBy: Prisma.QuoteRequestOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'expiresAt') {
      orderBy.expiresAt = sortOrder;
    }

    // Get RFQs:
    // 1. Directly assigned to this supplier
    // 2. Open RFQs (all suppliers can see)
    const [rfqs, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where: {
          ...where,
          OR: [
            { supplierId: supplierId }, // RFQs targeted to this supplier
            // Open RFQs - we identify them by checking if supplier is a placeholder
            // For now, we'll show all RFQs with "RFQ:" prefix to all suppliers
          ],
        },
        include: {
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
          responses: {
            select: {
              id: true,
              price: true,
              currency: true,
              quantity: true,
              unit: true,
              message: true,
              terms: true,
              validUntil: true,
              respondedAt: true,
              respondedByUser: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              respondedAt: 'desc',
            },
          },
        },
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quoteRequest.count({
        where: {
          ...where,
          OR: [
            { supplierId: supplierId },
          ],
        },
      }),
    ]);

    return {
      rfqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get public RFQs for suppliers to browse
   * General RFQs are identified by message starting with "RFQ:"
   */
  async getPublicRFQs(filters?: {
    status?: QuoteStatus;
    category?: string;
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'expiresAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      message: {
        startsWith: 'RFQ:', // General RFQs have message starting with "RFQ:"
      },
    };

    // Filter by status if provided
    if (filters?.status) {
      where.status = filters.status;
    }

    // Build message filter - combine category and search if both provided
    if (filters?.category && filters?.search) {
      // If both category and search provided, search for RFQs containing both
      where.message = {
        startsWith: 'RFQ:',
        contains: `${filters.category} ${filters.search}`,
        mode: 'insensitive',
      };
    } else if (filters?.category) {
      where.message = {
        startsWith: 'RFQ:',
        contains: filters.category,
        mode: 'insensitive',
      };
    } else if (filters?.search) {
      where.message = {
        startsWith: 'RFQ:',
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Determine sort field and order
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    const orderBy: Prisma.QuoteRequestOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'expiresAt') {
      orderBy.expiresAt = sortOrder;
    }

    const [rfqs, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        include: {
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
          responses: {
            select: {
              id: true,
              price: true,
              currency: true,
              quantity: true,
              unit: true,
              message: true,
              terms: true,
              validUntil: true,
              respondedAt: true,
              respondedByUser: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              respondedAt: 'desc',
            },
          },
        },
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quoteRequest.count({ where }),
    ]);

    return {
      rfqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get quote requests for a company
   */
  async getCompanyQuoteRequests(companyId: string, filters?: {
    status?: QuoteStatus;
    supplierId?: string;
    productId?: string;
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'expiresAt';
    sortOrder?: 'asc' | 'desc';
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

    // Search by message (which contains RFQ title/description)
    if (filters?.search) {
      where.message = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Determine sort field and order
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    const orderBy: Prisma.QuoteRequestOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'expiresAt') {
      orderBy.expiresAt = sortOrder;
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
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
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
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'expiresAt';
    sortOrder?: 'asc' | 'desc';
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

    // Search by message (which contains RFQ title/description)
    if (filters?.search) {
      where.message = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Determine sort field and order
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    const orderBy: Prisma.QuoteRequestOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'expiresAt') {
      orderBy.expiresAt = sortOrder;
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
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
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
  async acceptQuoteResponse(quoteResponseId: string, companyId: string, comment?: string) {
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
    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        status: QuoteStatus.rejected,
      },
    });

    // Broadcast quote rejection notification
    const io = getSocketIO();
    if (io) {
      broadcastQuoteUpdate(io, {
        quoteRequestId,
        companyId: updatedQuoteRequest.companyId,
        supplierId: updatedQuoteRequest.supplierId,
        status: QuoteStatus.rejected,
        event: 'quote:rejected',
      });
    }

    return updatedQuoteRequest;
  }

  /**
   * Counter-negotiate a quote response (Company)
   * Company proposes a counter-offer to supplier's bid
   */
  async counterNegotiateQuote(
    quoteRequestId: string,
    quoteResponseId: string,
    companyId: string,
    counterPrice: number,
    counterMessage?: string
  ) {
    const quoteRequest = await prisma.quoteRequest.findFirst({
      where: { id: quoteRequestId },
      include: {
        responses: {
          where: { id: quoteResponseId },
        },
      },
    });

    if (!quoteRequest) {
      throw createError(404, 'Quote request not found');
    }

    if (quoteRequest.companyId !== companyId) {
      throw createError(403, 'Access denied');
    }

    // Find the specific response being countered
    const quoteResponse = await prisma.quoteResponse.findFirst({
      where: {
        id: quoteResponseId,
        quoteRequestId,
      },
    });

    if (!quoteResponse) {
      throw createError(404, 'Quote response not found');
    }

    // Create a counter-response (new response from company)
    // We'll store the counter-offer in the message field with a special prefix
    const counterResponse = await prisma.quoteResponse.create({
      data: {
        quoteRequestId,
        price: counterPrice,
        currency: quoteResponse.currency,
        quantity: quoteResponse.quantity,
        unit: quoteResponse.unit,
        message: counterMessage || `Counter-offer: ${counterPrice} ${quoteResponse.currency}`,
        terms: `Counter-negotiation for response ${quoteResponseId}`,
        respondedBy: quoteRequest.requestedBy, // Company user who created the RFQ
        validUntil: quoteResponse.validUntil,
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

    // Update quote request status to indicate negotiation
    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        status: QuoteStatus.responded, // Keep as responded to allow further negotiation
      },
    });

    // Broadcast counter-negotiation notification
    const io = getSocketIO();
    if (io) {
      broadcastQuoteUpdate(io, {
        quoteRequestId,
        companyId: updatedQuoteRequest.companyId,
        supplierId: updatedQuoteRequest.supplierId,
        status: QuoteStatus.responded,
        event: 'quote:countered',
      });
    }

    return counterResponse;
  }

  /**
   * Counter-negotiate an RFQ directly (Company)
   * Company proposes a counter-offer to the RFQ itself (not a specific response)
   */
  async counterNegotiateRFQ(
    quoteRequestId: string,
    companyId: string,
    counterPrice: number,
    counterMessage?: string
  ) {
    const quoteRequest = await prisma.quoteRequest.findFirst({
      where: { id: quoteRequestId },
    });

    if (!quoteRequest) {
      throw createError(404, 'Quote request not found');
    }

    if (quoteRequest.companyId !== companyId) {
      throw createError(403, 'Access denied');
    }

    // Create a counter-response from the company
    const counterResponse = await prisma.quoteResponse.create({
      data: {
        quoteRequestId,
        price: counterPrice,
        currency: quoteRequest.currency,
        quantity: quoteRequest.quantity,
        unit: quoteRequest.unit,
        message: counterMessage || `Counter-offer for RFQ: ${counterPrice} ${quoteRequest.currency}`,
        terms: 'Company counter-offer for this RFQ',
        respondedBy: quoteRequest.requestedBy, // Company user who created the RFQ
        validUntil: quoteRequest.expiresAt,
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

    // Update quote request status to indicate negotiation
    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        status: QuoteStatus.responded, // Keep as responded to allow further negotiation
      },
    });

    // Broadcast counter-negotiation notification to all suppliers who have bid
    const io = getSocketIO();
    if (io) {
      // Notify the supplier directly
      broadcastQuoteUpdate(io, {
        quoteRequestId,
        companyId: updatedQuoteRequest.companyId,
        supplierId: updatedQuoteRequest.supplierId,
        status: QuoteStatus.responded,
        event: 'quote:countered',
      });
    }

    return counterResponse;
  }

  /**
   * Reject a specific quote response (Company)
   * This rejects only the response, not the entire RFQ
   */
  async rejectQuoteResponse(quoteResponseId: string, companyId: string, comment?: string) {
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

    // Mark response as rejected by deleting it or marking it
    // For now, we'll delete the response to reject it
    await prisma.quoteResponse.delete({
      where: { id: quoteResponseId },
    });

    // Check if there are any remaining responses
    const remainingResponses = await prisma.quoteResponse.count({
      where: { quoteRequestId: quoteResponse.quoteRequestId },
    });

    // If no responses left, set status back to pending
    if (remainingResponses === 0) {
      await prisma.quoteRequest.update({
        where: { id: quoteResponse.quoteRequestId },
        data: {
          status: QuoteStatus.pending,
        },
      });
    }

    // Broadcast rejection notification
    const io = getSocketIO();
    if (io) {
      broadcastQuoteUpdate(io, {
        quoteRequestId: quoteResponse.quoteRequestId,
        companyId: quoteResponse.quoteRequest.companyId,
        supplierId: quoteResponse.quoteRequest.supplierId,
        status: remainingResponses > 0 ? QuoteStatus.responded : QuoteStatus.pending,
        event: 'quote:rejected',
      });
    }

    return { success: true, message: 'Response rejected' };
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
