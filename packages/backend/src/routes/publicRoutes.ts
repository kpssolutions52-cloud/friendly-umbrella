import { Router, Response, NextFunction } from 'express';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { query, param, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = Router();

// GET /api/v1/products/public/:id - Get single product by ID (public access)
// IMPORTANT: This route must be defined BEFORE /products/public to avoid route conflicts
router.get(
  '/products/public/:id',
  optionalAuthenticate,
  param('id').isUUID().withMessage('Invalid product ID'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const productId = req.params.id;

      // Check if category_id column exists
      let includeCategory = true;
      try {
        await prisma.$queryRaw`SELECT category_id FROM products LIMIT 1`;
      } catch (testError: any) {
        if (testError.code === 'P2022' || testError.message?.includes('category_id')) {
          includeCategory = false;
        }
      }

      // Get product with supplier and prices
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,
        },
        include: {
          ...(includeCategory && {
            category: {
              include: {
                parent: {
                  select: {
                    id: true,
                    name: true,
                    iconUrl: true,
                  },
                },
              },
              select: {
                id: true,
                name: true,
                iconUrl: true,
                parentId: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    iconUrl: true,
                  },
                },
              },
            },
          }),
          supplier: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          images: {
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true,
              imageUrl: true,
              displayOrder: true,
            },
          },
          defaultPrices: {
            where: {
              isActive: true,
              OR: [
                { effectiveUntil: null },
                { effectiveUntil: { gte: new Date() } },
              ],
            },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      });

      if (!product) {
        return res.status(404).json({ error: { message: 'Product not found', statusCode: 404 } });
      }

      // Use product image if available, otherwise use category default image
      // Fallback chain: product image → subcategory image → main category image
      const productImageUrl = product.images[0]?.imageUrl || null;
      let finalImageUrl = productImageUrl;
      
      if (!finalImageUrl && includeCategory && product.category && typeof product.category !== 'string') {
        const category = product.category as any;
        // First try subcategory image (if product is in a subcategory)
        if (category.iconUrl) {
          finalImageUrl = category.iconUrl;
        } else if (category.parent && category.parent.iconUrl) {
          // If no subcategory image, try parent (main category) image
          finalImageUrl = category.parent.iconUrl;
        }
      }

      // Get private prices for customers if logged in (future: customer-specific pricing)
      let privatePriceMap = new Map();
      // For now, customers see default prices only
      // Future: Implement customer-specific pricing if needed

      const privatePrice = privatePriceMap.get(product.id);
      const defaultPrice = product.defaultPrices[0];

      // Calculate prices
      let finalPrice: number | null = null;
      let finalCurrency: string | null = null;
      let discountPercentage: number | null = null;
      let calculatedPrice: number | null = null;

      // For customers, show private prices if available
      if (req.userRole === 'customer' && privatePrice) {
        if (privatePrice.discountPercentage !== null && privatePrice.discountPercentage !== undefined && defaultPrice) {
          discountPercentage = Number(privatePrice.discountPercentage);
          const defaultPriceValue = Number(defaultPrice.price);
          calculatedPrice = defaultPriceValue * (1 - discountPercentage / 100);
          calculatedPrice = Math.round(calculatedPrice * 100) / 100;
          finalPrice = calculatedPrice;
          finalCurrency = privatePrice.currency || defaultPrice.currency;
        } else if (privatePrice.price !== null) {
          finalPrice = Number(privatePrice.price);
          finalCurrency = privatePrice.currency;
        }
      } else if (defaultPrice) {
        // Show default price for guests or if no private price
        finalPrice = Number(defaultPrice.price);
        finalCurrency = defaultPrice.currency;
      }

      const productWithPrices = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: includeCategory && product.category && typeof product.category !== 'string'
          ? (('parent' in product.category && (product.category as any).parent) 
              ? `${(product.category as any).parent.name} > ${(product.category as any).name}` 
              : (product.category as any).name)
          : (product as any).category || null, // Fallback to old category field if available
        unit: product.unit,
        supplierId: product.supplier.id,
        supplierName: product.supplier.name,
        supplierLogoUrl: product.supplier.logoUrl,
        productImageUrl: finalImageUrl,
        defaultPrice: defaultPrice ? {
          price: Number(defaultPrice.price),
          currency: defaultPrice.currency,
        } : null,
        privatePrice: (req.userRole === 'customer' && privatePrice) ? {
          price: privatePrice.price ? Number(privatePrice.price) : null,
          discountPercentage: privatePrice.discountPercentage !== null && privatePrice.discountPercentage !== undefined 
            ? Number(privatePrice.discountPercentage) 
            : null,
          calculatedPrice: calculatedPrice,
          currency: privatePrice.currency,
        } : null,
        price: finalPrice,
        priceType: (req.userRole === 'customer' && privatePrice) ? 'private' : defaultPrice ? 'default' : null,
        currency: finalCurrency,
        images: product.images.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder,
        })),
      };

      res.json({ product: productWithPrices });
    } catch (error) {
      next(error);
    }
  }
);

// Public products endpoint - shows default prices for guests, special prices for logged-in customers
router.get(
  '/products/public',
  optionalAuthenticate,
  query('q').optional().isString().withMessage('Query must be a string'),
  query('category').optional().isString(),
  query('supplierId').optional().isUUID().withMessage('Invalid supplier ID'),
  query('page')
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .toInt()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const query = (req.query.q as string) || '';
      const category = req.query.category as string | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        isActive: true,
      };

      if (supplierId) {
        where.supplierId = supplierId;
      }

      // Check if category_id column exists (do this early)
      let includeCategory = true;
      try {
        await prisma.$queryRaw`SELECT category_id FROM products LIMIT 1`;
      } catch (testError: any) {
        if (testError.code === 'P2022' || testError.message?.includes('category_id')) {
          includeCategory = false;
        }
      }

      // Handle category filtering: if main category, include all subcategories
      // Only apply if category_id column exists
      if (category && includeCategory) {
        try {
          // Test if product_categories table exists
          await prisma.$queryRaw`SELECT id FROM product_categories LIMIT 1`;
          
          // Use proper Prisma model (regenerate Prisma Client if this fails)
          const categoryObj = await prisma.productCategory.findUnique({
            where: { id: category },
            include: {
              children: {
                where: { isActive: true },
                select: { id: true },
              },
            },
          });

          if (categoryObj) {
            // If it's a main category (has no parent), include products from main category and all subcategories
            if (!categoryObj.parentId) {
              const subcategoryIds = categoryObj.children.map((child) => child.id);
              // Include products assigned to the main category OR any of its subcategories
              // The 'in' operator automatically excludes null values
              where.categoryId = {
                in: [category, ...subcategoryIds],
              };
            } else {
              // It's a subcategory, filter by exact match
              // Setting to a value automatically excludes null
              where.categoryId = category;
            }
          } else {
            // Category not found, filter by exact ID (will return no results)
            where.categoryId = category;
          }
        } catch (categoryError: any) {
          // If category lookup fails (table doesn't exist, Prisma Client not regenerated, or other error)
          console.error('Category filtering error:', categoryError.message);
          console.error('Error code:', categoryError.code);
          console.error('Error stack:', categoryError.stack);
          
          // Fall back to simple category ID filter
          // This will still work if categoryId column exists but table query fails
          // Setting to a value automatically excludes null in Prisma
          try {
            where.categoryId = category;
          } catch (fallbackError: any) {
            // If even that fails, skip category filtering entirely
            console.warn('Category filtering completely unavailable, skipping category filter');
            // Remove categoryId from where clause if it was set
            if (where.categoryId) {
              delete where.categoryId;
            }
          }
        }
      }

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }

      // Get all categories for fallback images (only if product_categories table exists)
      // Map includes both category ID, parent ID, and parent iconUrl for fallback chain
      let categoryImageMap = new Map<string, { iconUrl: string | null; parentId: string | null; parentIconUrl: string | null }>();
      if (includeCategory) {
        try {
          // Test if Prisma Client supports productCategory before querying
          await prisma.productCategory.findFirst({ take: 1 });
          const categories = await prisma.productCategory.findMany({
            where: { isActive: true },
            include: {
              parent: {
                select: {
                  id: true,
                  iconUrl: true,
                },
              },
            },
          });
          categoryImageMap = new Map(
            categories.map((cat: any) => [
              cat.id, 
              { 
                iconUrl: cat.iconUrl, 
                parentId: cat.parentId,
                parentIconUrl: cat.parent?.iconUrl || null
              }
            ])
          );
        } catch (categoryError: any) {
          // Categories table might not exist yet or Prisma Client not regenerated - continue without category images
          console.warn('Failed to load categories for images:', categoryError.message);
          console.warn('Error code:', categoryError.code);
        }
      }

      // Get products with suppliers and prices
      // Remove categoryId from where if we can't filter by it
      const finalWhere = { ...where };
      if (!includeCategory && finalWhere.categoryId) {
        delete finalWhere.categoryId;
      }

      // Try to detect if Prisma Client supports productCategory model
      // This only affects whether we can include category relation in results
      // We can still filter by categoryId even if the model isn't available
      let canIncludeCategory = includeCategory;
      if (includeCategory) {
        try {
          // Test if we can query productCategory (Prisma Client must be regenerated)
          await prisma.productCategory.findFirst({ take: 1 });
        } catch (prismaClientError: any) {
          console.warn('Prisma Client does not support productCategory model:', prismaClientError.message);
          console.warn('Please regenerate Prisma Client: npm run db:generate');
          console.warn('Category filtering will still work, but category details will not be included in results');
          canIncludeCategory = false;
          // DO NOT remove categoryId from where clause - filtering should still work
          // We just can't include the category relation in the query results
        }
      }

      // Try to fetch products with category relation, fallback to without if Prisma Client issue
      let products: any[];
      let total: number;
      
      try {
        [products, total] = await Promise.all([
          prisma.product.findMany({
            where: finalWhere,
            include: {
              ...(canIncludeCategory && {
                category: {
                  include: {
                    parent: {
                      select: {
                        id: true,
                        name: true,
                        iconUrl: true,
                      },
                    },
                  },
                  select: {
                    id: true,
                    name: true,
                    iconUrl: true,
                    parentId: true,
                    parent: {
                      select: {
                        id: true,
                        name: true,
                        iconUrl: true,
                      },
                    },
                  },
                },
              }),
              supplier: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
              images: {
                orderBy: { displayOrder: 'asc' },
                take: 1, // Only get first image for list view
                select: {
                  id: true,
                  imageUrl: true,
                },
              },
              defaultPrices: {
                where: {
                  isActive: true,
                  OR: [
                    { effectiveUntil: null },
                    { effectiveUntil: { gte: new Date() } },
                  ],
                },
                orderBy: { effectiveFrom: 'desc' },
                take: 1,
              },
            },
            skip,
            take: limit,
            orderBy: {
              name: 'asc',
            },
          }),
          prisma.product.count({ where: finalWhere }),
        ]);
      } catch (queryError: any) {
        // If query fails (e.g., Prisma Client doesn't have productCategory model), retry without category relation
        console.error('Product query failed, retrying without category relation:', queryError.message);
        console.error('Error code:', queryError.code);
        
        // Keep categoryId in where clause for filtering - we just can't include category relation in results
        // Only remove it if the error is specifically about categoryId column not existing
        const fallbackWhere = { ...finalWhere };
        if (queryError.code === 'P2022' || (queryError.message && queryError.message.includes('category_id'))) {
          // Column doesn't exist, remove filter
          if (fallbackWhere.categoryId) {
            delete fallbackWhere.categoryId;
          }
        }
        // Otherwise, keep categoryId filter even if we can't include category relation
        
        [products, total] = await Promise.all([
          prisma.product.findMany({
            where: fallbackWhere,
            include: {
              supplier: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
              images: {
                orderBy: { displayOrder: 'asc' },
                take: 1,
                select: {
                  id: true,
                  imageUrl: true,
                },
              },
              defaultPrices: {
                where: {
                  isActive: true,
                  OR: [
                    { effectiveUntil: null },
                    { effectiveUntil: { gte: new Date() } },
                  ],
                },
                orderBy: { effectiveFrom: 'desc' },
                take: 1,
              },
            },
            skip,
            take: limit,
            orderBy: {
              name: 'asc',
            },
          }),
          prisma.product.count({ where: fallbackWhere }),
        ]);
        
        // Set canIncludeCategory to false to skip category-related code below
        canIncludeCategory = false;
        includeCategory = false;
      }

      // Get private prices for customers if logged in
      // Note: Private prices are company-specific, so customers won't see them
      // This is a placeholder for future customer-specific pricing logic
      let privatePriceMap = new Map();
      // For now, customers see default prices only
      // Future: Implement customer-specific pricing if needed

      // Combine products with prices
      const productsWithPrices = products.map((product) => {
        const privatePrice = privatePriceMap.get(product.id);
        const defaultPrice = product.defaultPrices[0];
        
        // Use product image if available, otherwise use category default image
        // Fallback chain: product image → subcategory image → main category image
        const productImageUrl = product.images[0]?.imageUrl || null;
        let finalImageUrl = productImageUrl;
        
        if (!finalImageUrl && canIncludeCategory && includeCategory && (product as any).categoryId) {
          const categoryId = (product as any).categoryId;
          const categoryInfo = categoryImageMap.get(categoryId);
          
          if (categoryInfo) {
            // First try subcategory image (if product is in a subcategory)
            if (categoryInfo.iconUrl) {
              finalImageUrl = categoryInfo.iconUrl;
            } else if (categoryInfo.parentIconUrl) {
              // If no subcategory image, try parent (main category) image
              finalImageUrl = categoryInfo.parentIconUrl;
            }
          }
        }

        // Calculate prices
        let finalPrice: number | null = null;
        let finalCurrency: string | null = null;
        let discountPercentage: number | null = null;
        let calculatedPrice: number | null = null;

        // For customers, show private prices if available
        if (req.userRole === 'customer' && privatePrice) {
          if (privatePrice.discountPercentage !== null && privatePrice.discountPercentage !== undefined && defaultPrice) {
            discountPercentage = Number(privatePrice.discountPercentage);
            const defaultPriceValue = Number(defaultPrice.price);
            calculatedPrice = defaultPriceValue * (1 - discountPercentage / 100);
            calculatedPrice = Math.round(calculatedPrice * 100) / 100;
            finalPrice = calculatedPrice;
            finalCurrency = privatePrice.currency || defaultPrice.currency;
          } else if (privatePrice.price !== null) {
            finalPrice = Number(privatePrice.price);
            finalCurrency = privatePrice.currency;
          }
        } else if (defaultPrice) {
          // Show default price for guests or if no private price
          finalPrice = Number(defaultPrice.price);
          finalCurrency = defaultPrice.currency;
        }

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: canIncludeCategory && includeCategory && product.category && typeof product.category !== 'string'
            ? (('parent' in product.category && (product.category as any).parent) 
                ? `${(product.category as any).parent.name} > ${(product.category as any).name}` 
                : (product.category as any).name)
            : (product as any).category || null, // Fallback to old category field if available
          unit: product.unit,
          supplierId: product.supplier.id,
          supplierName: product.supplier.name,
          supplierLogoUrl: product.supplier.logoUrl,
          productImageUrl: finalImageUrl,
          defaultPrice: defaultPrice ? {
            price: Number(defaultPrice.price),
            currency: defaultPrice.currency,
          } : null,
          privatePrice: (req.userRole === 'customer' && privatePrice) ? {
            price: privatePrice.price ? Number(privatePrice.price) : null,
            discountPercentage: privatePrice.discountPercentage !== null && privatePrice.discountPercentage !== undefined 
              ? Number(privatePrice.discountPercentage) 
              : null,
            calculatedPrice: calculatedPrice,
            currency: privatePrice.currency,
          } : null,
          price: finalPrice,
          priceType: (req.userRole === 'customer' && privatePrice) ? 'private' : defaultPrice ? 'default' : null,
          currency: finalCurrency,
        };
      });

      res.json({
        products: productsWithPrices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error in /products/public endpoint:', error);
      console.error('Error stack:', error.stack);
      // Log more details for debugging
      if (error.code) {
        console.error('Prisma error code:', error.code);
      }
      if (error.meta) {
        console.error('Prisma error meta:', JSON.stringify(error.meta, null, 2));
      }
      if (error.message) {
        console.error('Error message:', error.message);
      }
      // Return a more user-friendly error response
      if (error.code === 'P2021' || error.code === '42P01') {
        // Table doesn't exist
        return res.status(500).json({ 
          error: { 
            message: 'Database schema not initialized. Please run migrations.',
            statusCode: 500 
          } 
        });
      }
      next(error);
    }
  }
);

// Public categories endpoint - fetch from categories table managed by super admin
router.get(
  '/products/public/categories',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Fetch categories from the product_categories table (managed by super admin)
      const categories = await prisma.productCategory.findMany({
        where: { isActive: true },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { parentId: 'asc' },
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      // Format as flat list with hierarchical names
      const categoryList = categories.map((cat: any) => 
        cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name
      );

      res.json({ categories: categoryList });
    } catch (error: any) {
      // Handle case where categories table might not exist
      if (error.code === 'P2021' || error.code === '42P01') {
        // Table doesn't exist - return empty array
        console.warn('Categories table not found, returning empty array');
        return res.json({ categories: [] });
      }
      console.error('Error fetching categories:', error);
      next(error);
    }
  }
);

// Public suppliers endpoint
router.get(
  '/suppliers/public',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const suppliers = await prisma.tenant.findMany({
        where: {
          type: 'supplier',
          isActive: true,
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({ suppliers });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/suppliers/public/:id - Get supplier details (public access)
router.get(
  '/suppliers/public/:id',
  optionalAuthenticate,
  param('id').isUUID().withMessage('Invalid supplier ID'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const supplier = await prisma.tenant.findFirst({
        where: {
          id: req.params.id,
          type: 'supplier',
          isActive: true,
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          logoUrl: true,
          _count: {
            select: {
              products: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({ error: { message: 'Supplier not found', statusCode: 404 } });
      }

      res.json({ supplier });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

