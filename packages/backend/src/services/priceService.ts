import { prisma } from '../utils/prisma';
import createError from 'http-errors';
import { Decimal } from '@prisma/client/runtime/library';
import { broadcastPriceUpdate } from '../websocket/handlers/priceUpdates';
import { getSocketIO } from '../utils/socket';

/**
 * Calculate expiry date from duration or custom date range
 * Default: 1 year from now if no expiry specified
 */
export function calculateExpiryDate(
  expiry?: PriceExpiryInput,
  effectiveFrom?: Date
): Date | null {
  const fromDate = effectiveFrom || new Date();

  // If custom date range is provided
  if (expiry?.expiryUntil) {
    return expiry.expiryUntil;
  }

  // If duration is provided
  if (expiry?.expiryDuration) {
    const { value, unit } = expiry.expiryDuration;
    const expiryDate = new Date(fromDate);

    switch (unit) {
      case 'minutes':
        expiryDate.setMinutes(expiryDate.getMinutes() + value);
        break;
      case 'hours':
        expiryDate.setHours(expiryDate.getHours() + value);
        break;
      case 'days':
        expiryDate.setDate(expiryDate.getDate() + value);
        break;
      case 'months':
        expiryDate.setMonth(expiryDate.getMonth() + value);
        break;
    }

    return expiryDate;
  }

  // Default: 1 year from effectiveFrom or now
  const defaultExpiry = new Date(fromDate);
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
  return defaultExpiry;
}

export type ExpiryDurationUnit = 'minutes' | 'hours' | 'days' | 'months';

export interface ExpiryDuration {
  value: number;
  unit: ExpiryDurationUnit;
}

export interface PriceExpiryInput {
  // Either use duration or custom date range
  expiryDuration?: ExpiryDuration; // e.g., { value: 30, unit: 'days' }
  expiryFrom?: Date; // Custom date range start
  expiryUntil?: Date; // Custom date range end
}

export interface UpdateDefaultPriceInput {
  price: number;
  currency?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date | null;
  expiry?: PriceExpiryInput; // New expiry input
}

export interface CreatePrivatePriceInput {
  companyId: string;
  price?: number; // Optional if discountPercentage is provided
  discountPercentage?: number; // Optional if price is provided (0-100)
  currency?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date | null;
  expiry?: PriceExpiryInput; // New expiry input
  notes?: string;
}

export interface UpdatePrivatePriceInput {
  price?: number; // Optional if discountPercentage is provided
  discountPercentage?: number; // Optional if price is provided (0-100)
  currency?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date | null;
  expiry?: PriceExpiryInput; // New expiry input
  notes?: string;
  isActive?: boolean;
}

/**
 * Calculate expiry date from duration or custom date range
 * Default: 1 year from now if no expiry specified
 */
function calculateExpiryDate(
  expiry?: PriceExpiryInput,
  effectiveFrom?: Date
): Date | null {
  const fromDate = effectiveFrom || new Date();

  // If custom date range is provided
  if (expiry?.expiryUntil) {
    return expiry.expiryUntil;
  }

  // If duration is provided
  if (expiry?.expiryDuration) {
    const { value, unit } = expiry.expiryDuration;
    const expiryDate = new Date(fromDate);

    switch (unit) {
      case 'minutes':
        expiryDate.setMinutes(expiryDate.getMinutes() + value);
        break;
      case 'hours':
        expiryDate.setHours(expiryDate.getHours() + value);
        break;
      case 'days':
        expiryDate.setDate(expiryDate.getDate() + value);
        break;
      case 'months':
        expiryDate.setMonth(expiryDate.getMonth() + value);
        break;
    }

    return expiryDate;
  }

  // Default: 1 year from effectiveFrom or now
  const defaultExpiry = new Date(fromDate);
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
  return defaultExpiry;
}

export class PriceService {
  /**
   * Update or create default price for a product
   */
  async updateDefaultPrice(
    productId: string,
    supplierId: string,
    input: UpdateDefaultPriceInput,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Verify product belongs to supplier
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId,
      },
    });

    if (!product) {
      throw createError(404, 'Product not found');
    }

    return prisma.$transaction(async (tx) => {
      // Get current active default price
      const currentPrice = await tx.defaultPrice.findFirst({
        where: {
          productId,
          isActive: true,
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      const oldPrice = currentPrice ? Number(currentPrice.price) : null;
      const newPrice = input.price;

      // If price changed, create new price entry and deactivate old one
      if (currentPrice && Number(currentPrice.price) !== newPrice) {
        // Deactivate old price
        await tx.defaultPrice.update({
          where: { id: currentPrice.id },
          data: { isActive: false },
        });
      }

      // Calculate expiry date
      const effectiveFromDate = input.effectiveFrom || new Date();
      const effectiveUntil = input.effectiveUntil !== undefined 
        ? input.effectiveUntil 
        : (input.expiry 
            ? calculateExpiryDate(input.expiry, effectiveFromDate)
            : calculateExpiryDate(undefined, effectiveFromDate)); // Default 1 year

      // Create new price entry
      const defaultPrice = await tx.defaultPrice.create({
        data: {
          productId,
          price: new Decimal(newPrice),
          currency: input.currency || 'USD',
          effectiveFrom: effectiveFromDate,
          effectiveUntil: effectiveUntil,
          isActive: true,
        },
      });

      // Create audit log
      await tx.priceAuditLog.create({
        data: {
          productId,
          priceType: 'default',
          companyId: null,
          oldPrice: oldPrice ? new Decimal(oldPrice) : null,
          newPrice: new Decimal(newPrice),
          changedBy: userId,
          changeReason: `Default price ${oldPrice ? 'updated' : 'created'}`,
          ipAddress,
          userAgent,
        },
      });

      return defaultPrice;
    }).then(async (defaultPrice) => {
      // Broadcast price update via WebSocket (after transaction)
      const io = getSocketIO();
      if (io) {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { name: true },
        });

        if (product) {
          broadcastPriceUpdate(io, {
            productId,
            productName: product.name,
            priceType: 'default',
            newPrice: input.price,
            currency: input.currency || 'USD',
            supplierId,
          });
        }
      }

      return defaultPrice;
    });
  }

  /**
   * Create a private price for a company
   */
  async createPrivatePrice(
    productId: string,
    supplierId: string,
    input: CreatePrivatePriceInput,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Verify product belongs to supplier
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId,
      },
    });

    if (!product) {
      throw createError(404, 'Product not found');
    }

    // Verify company exists
    const company = await prisma.tenant.findFirst({
      where: {
        id: input.companyId,
        type: 'company',
        isActive: true,
      },
    });

    if (!company) {
      throw createError(404, 'Company not found');
    }

    // Validate: either price OR discountPercentage must be provided, but not both
    if ((!input.price && !input.discountPercentage) || (input.price && input.discountPercentage)) {
      throw createError(400, 'Either price or discountPercentage must be provided, but not both');
    }

    // Validate discountPercentage range (0-100)
    if (input.discountPercentage !== undefined) {
      if (input.discountPercentage < 0 || input.discountPercentage > 100) {
        throw createError(400, 'Discount percentage must be between 0 and 100');
      }
    }

    return prisma.$transaction(async (tx) => {
      // Deactivate existing private price for this product-company combination
      const existing = await tx.privatePrice.findFirst({
        where: {
          productId,
          companyId: input.companyId,
          isActive: true,
        },
      });

      if (existing) {
        await tx.privatePrice.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
      }

      // Calculate expiry date
      const effectiveFromDate = input.effectiveFrom || new Date();
      const effectiveUntil = input.effectiveUntil !== undefined 
        ? input.effectiveUntil 
        : (input.expiry 
            ? calculateExpiryDate(input.expiry, effectiveFromDate)
            : calculateExpiryDate(undefined, effectiveFromDate)); // Default 1 year

      // Create new private price
      const privatePrice = await tx.privatePrice.create({
        data: {
          productId,
          companyId: input.companyId,
          price: input.price ? new Decimal(input.price) : null,
          discountPercentage: input.discountPercentage !== undefined ? new Decimal(input.discountPercentage) : null,
          currency: input.currency || 'USD',
          effectiveFrom: effectiveFromDate,
          effectiveUntil: effectiveUntil,
          notes: input.notes,
          isActive: true,
        },
      });

      // Create audit log
      const priceForLog = input.price || (existing && existing.price ? existing.price : new Decimal(0));
      await tx.priceAuditLog.create({
        data: {
          productId,
          priceType: 'private',
          companyId: input.companyId,
          oldPrice: existing ? (existing.price || new Decimal(0)) : null,
          newPrice: priceForLog,
          changedBy: userId,
          changeReason: `Private price ${existing ? 'updated' : 'created'} for ${company.name}${input.discountPercentage ? ` (${input.discountPercentage}% discount)` : ''}`,
          ipAddress,
          userAgent,
        },
      });

      return privatePrice;
    }).then(async (privatePrice) => {
      // Broadcast price update via WebSocket (after transaction)
      const io = getSocketIO();
      if (io) {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { name: true },
        });

        if (product) {
          // Only broadcast if we have a price (not discount percentage)
          if (input.price !== undefined) {
            broadcastPriceUpdate(io, {
              productId,
              productName: product.name,
              priceType: 'private',
              newPrice: input.price,
              currency: input.currency || 'USD',
              companyId: input.companyId,
              supplierId,
            });
          }
        }
      }

      return privatePrice;
    });
  }

  /**
   * Update a private price
   */
  async updatePrivatePrice(
    privatePriceId: string,
    supplierId: string,
    input: UpdatePrivatePriceInput,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Get private price with product to verify ownership
    const privatePrice = await prisma.privatePrice.findUnique({
      where: { id: privatePriceId },
      include: {
        product: true,
      },
    });

    if (!privatePrice) {
      throw createError(404, 'Private price not found');
    }

    if (privatePrice.product.supplierId !== supplierId) {
      throw createError(403, 'Not authorized to update this price');
    }

    // Validate: if both price and discountPercentage are provided, or neither is provided, it's an error
    const hasPrice = input.price !== undefined;
    const hasDiscount = input.discountPercentage !== undefined;

    // If updating, at least one must remain or be set
    if (hasPrice && hasDiscount) {
      throw createError(400, 'Either price or discountPercentage must be provided, but not both');
    }

    // Validate discountPercentage range (0-100)
    if (hasDiscount && (input.discountPercentage! < 0 || input.discountPercentage! > 100)) {
      throw createError(400, 'Discount percentage must be between 0 and 100');
    }

    // Ensure at least one pricing method remains after update
    if (!hasPrice && !hasDiscount) {
      // No change to pricing method - this is okay
    } else if (hasPrice) {
      // Setting price - clear discount
      input.discountPercentage = undefined;
    } else if (hasDiscount) {
      // Setting discount - clear price
      input.price = undefined;
    }

    return prisma.$transaction(async (tx) => {
      const oldPrice = privatePrice.price ? Number(privatePrice.price) : null;
      const oldDiscount = privatePrice.discountPercentage ? Number(privatePrice.discountPercentage) : null;

      // Update private price
      const updated = await tx.privatePrice.update({
        where: { id: privatePriceId },
        data: {
          ...(input.price !== undefined && { price: input.price !== null ? new Decimal(input.price) : null }),
          ...(input.discountPercentage !== undefined && { discountPercentage: input.discountPercentage !== null ? new Decimal(input.discountPercentage) : null }),
          ...(input.currency && { currency: input.currency }),
          ...(input.effectiveFrom && { effectiveFrom: input.effectiveFrom }),
          ...(input.effectiveUntil !== undefined && { effectiveUntil: input.effectiveUntil }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });

      // Create audit log if price or discount changed
      const priceChanged = hasPrice && input.price !== undefined && input.price !== oldPrice;
      const discountChanged = hasDiscount && input.discountPercentage !== undefined && input.discountPercentage !== oldDiscount;

      if (priceChanged || discountChanged) {
        const newPriceValue = hasPrice && input.price !== undefined ? new Decimal(input.price) : (oldPrice ? new Decimal(oldPrice) : null);
        const oldPriceValue = oldPrice ? new Decimal(oldPrice) : null;
        
        await tx.priceAuditLog.create({
          data: {
            productId: privatePrice.productId,
            priceType: 'private',
            companyId: privatePrice.companyId,
            oldPrice: oldPriceValue,
            newPrice: newPriceValue || new Decimal(0),
            changedBy: userId,
            changeReason: input.notes || `Private price updated${hasDiscount ? ` (${input.discountPercentage}% discount)` : ''}`,
            ipAddress,
            userAgent,
          },
        });
      }

      return updated;
    }).then(async (updated) => {
      // Broadcast price update via WebSocket if price changed
      if (input.price !== undefined) {
        const io = getSocketIO();
        if (io) {
          const product = await prisma.product.findUnique({
            where: { id: privatePrice.productId },
            select: { name: true },
          });

          if (product) {
            broadcastPriceUpdate(io, {
              productId: privatePrice.productId,
              productName: product.name,
              priceType: 'private',
              newPrice: input.price,
              currency: input.currency || updated.currency,
              companyId: privatePrice.companyId,
              supplierId,
            });
          }
        }
      }

      return updated;
    });
  }

  /**
   * Delete a private price
   */
  async deletePrivatePrice(
    privatePriceId: string,
    supplierId: string,
    _userId: string
  ) {
    const privatePrice = await prisma.privatePrice.findUnique({
      where: { id: privatePriceId },
      include: {
        product: true,
      },
    });

    if (!privatePrice) {
      throw createError(404, 'Private price not found');
    }

    if (privatePrice.product.supplierId !== supplierId) {
      throw createError(403, 'Not authorized to delete this price');
    }

    // Soft delete
    return prisma.privatePrice.update({
      where: { id: privatePriceId },
      data: { isActive: false },
    });
  }

  /**
   * Get price for a product (for companies - returns best available price)
   */
  async getCompanyPrice(productId: string, companyId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product || !product.isActive) {
      throw createError(404, 'Product not found');
    }

    // Get private price for this company
    const privatePrice = await prisma.privatePrice.findFirst({
      where: {
        productId,
        companyId,
        isActive: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Get default price
    const defaultPrice = await prisma.defaultPrice.findFirst({
      where: {
        productId,
        isActive: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Track view (for analytics)
    await prisma.priceView.create({
      data: {
        productId,
        companyId,
        priceType: privatePrice ? 'private' : 'default',
      },
    }).catch(() => {
      // Ignore errors in view tracking
    });

    const price = privatePrice || defaultPrice;
    if (!price) {
      throw createError(404, 'No price available for this product');
    }

    return {
      productId: product.id,
      productName: product.name,
      supplierId: product.supplierId,
      supplierName: product.supplier.name,
      sku: product.sku,
      unit: product.unit,
      price: Number(price.price),
      priceType: privatePrice ? 'private' : 'default',
      currency: price.currency,
      hasPrivatePrice: !!privatePrice,
      effectiveFrom: price.effectiveFrom,
    };
  }

  /**
   * Get all private prices for a product (supplier view)
   */
  async getProductPrivatePrices(productId: string, supplierId: string) {
    // Verify product belongs to supplier
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId,
      },
    });

    if (!product) {
      throw createError(404, 'Product not found');
    }

    return prisma.privatePrice.findMany({
      where: {
        productId,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });
  }

  /**
   * Get price history/audit log for a product
   */
  async getPriceHistory(productId: string, supplierId: string) {
    // Verify product belongs to supplier
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId,
      },
    });

    if (!product) {
      throw createError(404, 'Product not found');
    }

    return prisma.priceAuditLog.findMany({
      where: {
        productId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
      take: 100, // Limit to last 100 changes
    });
  }

  /**
   * Clean up expired prices and revert to default prices
   * This should be called by a scheduled job
   */
  async cleanupExpiredPrices() {
    const now = new Date();
    
    return prisma.$transaction(async (tx) => {
      // Find all expired private prices
      const expiredPrivatePrices = await tx.privatePrice.findMany({
        where: {
          isActive: true,
          effectiveUntil: {
            lt: now,
          },
        },
        include: {
          product: {
            include: {
              defaultPrices: {
                where: {
                  isActive: true,
                  OR: [
                    { effectiveUntil: null },
                    { effectiveUntil: { gte: now } },
                  ],
                },
                orderBy: { effectiveFrom: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      // Deactivate expired private prices
      const expiredIds = expiredPrivatePrices.map(p => p.id);
      if (expiredIds.length > 0) {
        await tx.privatePrice.updateMany({
          where: {
            id: { in: expiredIds },
          },
          data: {
            isActive: false,
          },
        });

        // Log the cleanup
        for (const expiredPrice of expiredPrivatePrices) {
          const defaultPrice = expiredPrice.product.defaultPrices[0];
          if (defaultPrice) {
            await tx.priceAuditLog.create({
              data: {
                productId: expiredPrice.productId,
                priceType: 'private',
                companyId: expiredPrice.companyId,
                oldPrice: expiredPrice.price,
                newPrice: defaultPrice.price,
                changedBy: 'system',
                changeReason: `Private price expired and reverted to default price`,
              },
            }).catch(() => {
              // Ignore audit log errors
            });
          }
        }
      }

      // Find all expired default prices (shouldn't happen often, but handle it)
      const expiredDefaultPrices = await tx.defaultPrice.findMany({
        where: {
          isActive: true,
          effectiveUntil: {
            lt: now,
          },
        },
      });

      if (expiredDefaultPrices.length > 0) {
        await tx.defaultPrice.updateMany({
          where: {
            id: { in: expiredDefaultPrices.map(p => p.id) },
          },
          data: {
            isActive: false,
          },
        });
      }

      return {
        expiredPrivatePrices: expiredIds.length,
        expiredDefaultPrices: expiredDefaultPrices.length,
      };
    });
  }
}

export const priceService = new PriceService();

