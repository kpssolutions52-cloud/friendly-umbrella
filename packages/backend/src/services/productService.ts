import { prisma } from '../utils/prisma';
import createError from 'http-errors';
import { Decimal } from '@prisma/client/runtime/library';

export interface SpecialPriceInput {
  companyId: string;
  price?: number; // Optional if discountPercentage is provided
  discountPercentage?: number; // Optional if price is provided (0-100)
  currency?: string;
  notes?: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  type?: 'product' | 'service'; // Defaults to 'product'
  categoryId?: string; // Reference to ProductCategory (for products)
  serviceCategoryId?: string; // Reference to ServiceCategory (for services)
  unit: string;
  defaultPrice?: number;
  currency?: string;
  // Service-specific pricing
  ratePerHour?: number | null; // For services: hourly rate
  rateType?: 'per_hour' | 'per_project' | 'fixed' | 'negotiable' | null; // Pricing type for services
  specialPrices?: SpecialPriceInput[];
  metadata?: Record<string, any>;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  type?: 'product' | 'service';
  categoryId?: string | null; // Reference to ProductCategory (for products)
  serviceCategoryId?: string | null; // Reference to ServiceCategory (for services)
  unit?: string;
  // Service-specific pricing
  ratePerHour?: number | null; // For services: hourly rate
  rateType?: 'per_hour' | 'per_project' | 'fixed' | 'negotiable' | null; // Pricing type for services
  isActive?: boolean;
  metadata?: Record<string, any>;
  specialPrices?: SpecialPriceInput[]; // Optional: add/update special prices
}

export class ProductService {
  /**
   * Get all products/services for a supplier or service provider
   */
  async getSupplierProducts(supplierId: string, includeInactive = false, page = 1, limit = 20, type?: 'product' | 'service') {
    const where: any = {
      supplierId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(type ? { type } : {}),
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
      include: {
        category: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceCategory: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        defaultPrices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            privatePrices: {
              where: { isActive: true },
            },
          },
        },
      },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single product by ID (supplier only)
   */
  async getProductById(productId: string, supplierId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId,
      },
      include: {
        category: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceCategory: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        defaultPrices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' },
        },
        privatePrices: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    if (!product) {
      throw createError(404, 'Product not found');
    }

    return product;
  }

  /**
   * Create a new product
   */
  async createProduct(supplierId: string, input: CreateProductInput) {
    // Check if SKU already exists for this supplier
    const existing = await prisma.product.findUnique({
      where: {
        supplierId_sku: {
          supplierId,
          sku: input.sku,
        },
      },
    });

    if (existing) {
      throw createError(409, `Product with SKU "${input.sku}" already exists`);
    }

    const productType = input.type || 'product';
    
    // Validate category based on type
    if (productType === 'product') {
      if (input.categoryId) {
        const category = await prisma.productCategory.findUnique({
          where: { id: input.categoryId },
        });
        if (!category || !category.isActive) {
          throw createError(400, 'Invalid or inactive product category');
        }
      }
      if (input.serviceCategoryId) {
        throw createError(400, 'serviceCategoryId should not be provided for products');
      }
    } else if (productType === 'service') {
      if (input.serviceCategoryId) {
        const serviceCategory = await prisma.serviceCategory.findUnique({
          where: { id: input.serviceCategoryId },
        });
        if (!serviceCategory || !serviceCategory.isActive) {
          throw createError(400, 'Invalid or inactive service category');
        }
      }
      if (input.categoryId) {
        throw createError(400, 'categoryId should not be provided for services');
      }
    }

    // Create product with optional default price in transaction
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          supplierId,
          sku: input.sku,
          name: input.name,
          description: input.description,
          type: productType,
          categoryId: productType === 'product' ? (input.categoryId || null) : null,
          serviceCategoryId: productType === 'service' ? (input.serviceCategoryId || null) : null,
          unit: input.unit,
          ratePerHour: productType === 'service' ? (input.ratePerHour ? new Decimal(input.ratePerHour) : null) : null,
          rateType: productType === 'service' ? (input.rateType || null) : null,
          metadata: input.metadata || {},
          isActive: true,
        },
        include: {
          category: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Create default price if provided
      if (input.defaultPrice !== undefined) {
        await tx.defaultPrice.create({
          data: {
            productId: product.id,
            price: new Decimal(input.defaultPrice),
            currency: input.currency || 'USD',
            isActive: true,
          },
        });
      }

      // Create special prices if provided
      if (input.specialPrices && input.specialPrices.length > 0) {
        // Check for duplicate company IDs
        const companyIds = input.specialPrices.map((sp) => sp.companyId);
        const uniqueCompanyIds = new Set(companyIds);
        if (companyIds.length !== uniqueCompanyIds.size) {
          throw createError(400, 'Duplicate company IDs found in special prices');
        }

        // Verify all companies exist and are active
        const companies = await tx.tenant.findMany({
          where: {
            id: { in: Array.from(uniqueCompanyIds) },
            type: 'company',
            isActive: true,
          },
        });

        if (companies.length !== uniqueCompanyIds.size) {
          throw createError(400, 'One or more companies not found or inactive');
        }

        // Get default price currency if it exists (for discount percentage)
        const defaultPriceCurrency = input.currency || 'USD';
        if (input.defaultPrice !== undefined) {
          // We already know the currency from input.currency
        }

        // Create private prices for each company
        for (const specialPrice of input.specialPrices) {
          // Validate: either price OR discountPercentage must be provided, but not both
          if ((!specialPrice.price && !specialPrice.discountPercentage) || 
              (specialPrice.price && specialPrice.discountPercentage)) {
            throw createError(400, 'Each special price must have either price or discountPercentage, but not both');
          }

          // Validate discountPercentage range (0-100)
          if (specialPrice.discountPercentage !== undefined) {
            if (specialPrice.discountPercentage < 0 || specialPrice.discountPercentage > 100) {
              throw createError(400, 'Discount percentage must be between 0 and 100');
            }
          }

          // For discount percentage, use the product's default currency if currency not provided
          let finalCurrency = specialPrice.currency || input.currency || 'USD';
          if (specialPrice.discountPercentage !== undefined && !specialPrice.currency) {
            // When using discount percentage without explicit currency, use product's default currency
            finalCurrency = defaultPriceCurrency;
          }

          await tx.privatePrice.create({
            data: {
              productId: product.id,
              companyId: specialPrice.companyId,
              price: specialPrice.price ? new Decimal(specialPrice.price) : null,
              discountPercentage: specialPrice.discountPercentage !== undefined 
                ? new Decimal(specialPrice.discountPercentage) 
                : null,
              currency: finalCurrency,
              notes: specialPrice.notes,
              isActive: true,
            },
          });
        }
      }

      // Return product with default price and category
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          serviceCategory: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          defaultPrices: {
            where: { isActive: true },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      });
    });
  }

  /**
   * Update a product
   */
  async updateProduct(productId: string, supplierId: string, input: UpdateProductInput) {
    // Verify product belongs to supplier
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId,
      },
      include: {
        defaultPrices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!existing) {
      throw createError(404, 'Product not found');
    }

    // Check SKU uniqueness if SKU is being updated
    if (input.sku && input.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({
        where: {
          supplierId_sku: {
            supplierId,
            sku: input.sku,
          },
        },
      });

      if (skuExists) {
        throw createError(409, `Product with SKU "${input.sku}" already exists`);
      }
    }

    const productType = input.type || existing.type;
    
    // Validate category based on type
    if (input.categoryId !== undefined || input.serviceCategoryId !== undefined || input.type) {
      if (productType === 'product') {
        if (input.categoryId !== undefined) {
          if (input.categoryId) {
            const category = await prisma.productCategory.findUnique({
              where: { id: input.categoryId },
            });
            if (!category || !category.isActive) {
              throw createError(400, 'Invalid or inactive product category');
            }
          }
        }
        if (input.serviceCategoryId !== undefined && input.serviceCategoryId !== null) {
          throw createError(400, 'serviceCategoryId should not be provided for products');
        }
      } else if (productType === 'service') {
        if (input.serviceCategoryId !== undefined) {
          if (input.serviceCategoryId) {
            const serviceCategory = await prisma.serviceCategory.findUnique({
              where: { id: input.serviceCategoryId },
            });
            if (!serviceCategory || !serviceCategory.isActive) {
              throw createError(400, 'Invalid or inactive service category');
            }
          }
        }
        if (input.categoryId !== undefined && input.categoryId !== null) {
          throw createError(400, 'categoryId should not be provided for services');
        }
      }
    }

    // Get default price currency for discount percentage calculations
    const defaultPriceCurrency = existing.defaultPrices[0]?.currency || 'USD';

    // Update product and handle special prices in transaction
    return prisma.$transaction(async (tx) => {
      // Update product basic info
      const updateData: any = {
        ...(input.sku && { sku: input.sku }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.unit && { unit: input.unit }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
      };
      
      // Handle type change
      if (input.type) {
        updateData.type = input.type;
        // Clear the opposite category when type changes
        if (input.type === 'product') {
          updateData.categoryId = input.categoryId !== undefined ? input.categoryId : null;
          updateData.serviceCategoryId = null;
          updateData.ratePerHour = null;
          updateData.rateType = null;
        } else if (input.type === 'service') {
          updateData.serviceCategoryId = input.serviceCategoryId !== undefined ? input.serviceCategoryId : null;
          updateData.categoryId = null;
        }
      } else {
        // No type change, update categories based on existing type
        if (productType === 'product') {
          if (input.categoryId !== undefined) {
            updateData.categoryId = input.categoryId;
          }
        } else if (productType === 'service') {
          if (input.serviceCategoryId !== undefined) {
            updateData.serviceCategoryId = input.serviceCategoryId;
          }
        }
      }
      
      // Handle service-specific pricing fields
      if (productType === 'service' || input.type === 'service') {
        if (input.ratePerHour !== undefined) {
          updateData.ratePerHour = input.ratePerHour !== null ? new Decimal(input.ratePerHour) : null;
        }
        if (input.rateType !== undefined) {
          updateData.rateType = input.rateType;
        }
      }
      
      const product = await tx.product.update({
        where: { id: productId },
        data: updateData,
      });

      // Handle special prices if provided
      if (input.specialPrices && input.specialPrices.length > 0) {
        // Check for duplicate company IDs
        const companyIds = input.specialPrices.map((sp) => sp.companyId);
        const uniqueCompanyIds = new Set(companyIds);
        if (companyIds.length !== uniqueCompanyIds.size) {
          throw createError(400, 'Duplicate company IDs found in special prices');
        }

        // Verify all companies exist and are active
        const companies = await tx.tenant.findMany({
          where: {
            id: { in: Array.from(uniqueCompanyIds) },
            type: 'company',
            isActive: true,
          },
        });

        if (companies.length !== uniqueCompanyIds.size) {
          throw createError(400, 'One or more companies not found or inactive');
        }

        // Process each special price
        for (const specialPrice of input.specialPrices) {
          // Validate: either price OR discountPercentage must be provided, but not both
          if ((!specialPrice.price && !specialPrice.discountPercentage) || 
              (specialPrice.price && specialPrice.discountPercentage)) {
            throw createError(400, 'Each special price must have either price or discountPercentage, but not both');
          }

          // Validate discountPercentage range (0-100)
          if (specialPrice.discountPercentage !== undefined) {
            if (specialPrice.discountPercentage < 0 || specialPrice.discountPercentage > 100) {
              throw createError(400, 'Discount percentage must be between 0 and 100');
            }
          }

          // For discount percentage, use the product's default currency if currency not provided
          let finalCurrency = specialPrice.currency || defaultPriceCurrency;
          if (specialPrice.discountPercentage !== undefined && !specialPrice.currency) {
            finalCurrency = defaultPriceCurrency;
          }

          // Check if a private price already exists for this company and product
          const existingPrivatePrice = await tx.privatePrice.findFirst({
            where: {
              productId: product.id,
              companyId: specialPrice.companyId,
              isActive: true,
            },
            orderBy: { effectiveFrom: 'desc' },
          });

          if (existingPrivatePrice) {
            // Deactivate the old price
            await tx.privatePrice.update({
              where: { id: existingPrivatePrice.id },
              data: { isActive: false },
            });
          }

          // Create new private price entry
          await tx.privatePrice.create({
            data: {
              productId: product.id,
              companyId: specialPrice.companyId,
              price: specialPrice.price ? new Decimal(specialPrice.price) : null,
              discountPercentage: specialPrice.discountPercentage !== undefined 
                ? new Decimal(specialPrice.discountPercentage) 
                : null,
              currency: finalCurrency,
              notes: specialPrice.notes,
              isActive: true,
            },
          });
        }
      }

      // Return updated product with default price and category
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          serviceCategory: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          defaultPrices: {
            where: { isActive: true },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      });
    });
  }

  /**
   * Delete a product (soft delete by setting isActive to false)
   */
  async deleteProduct(productId: string, supplierId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        supplierId,
      },
    });

    if (!product) {
      throw createError(404, 'Product not found');
    }

    // Soft delete
    return prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  /**
   * Get product statistics for supplier dashboard
   */
  async getSupplierStats(supplierId: string, type?: 'product' | 'service') {
    const baseWhere: any = { supplierId };
    if (type) {
      baseWhere.type = type;
    }

    const [totalProducts, activeProducts, productsWithPrices, productsWithPrivatePrices] =
      await Promise.all([
        prisma.product.count({
          where: baseWhere,
        }),
        prisma.product.count({
          where: {
            ...baseWhere,
            isActive: true,
          },
        }),
        prisma.product.count({
          where: {
            ...baseWhere,
            isActive: true,
            defaultPrices: {
              some: { isActive: true },
            },
          },
        }),
        prisma.product.count({
          where: {
            ...baseWhere,
            isActive: true,
            privatePrices: {
              some: { isActive: true },
            },
          },
        }),
      ]);

    return {
      totalProducts,
      activeProducts,
      productsWithPrices,
      productsWithPrivatePrices,
    };
  }
}

export const productService = new ProductService();









