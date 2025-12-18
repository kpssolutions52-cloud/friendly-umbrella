import { Router, Response, NextFunction } from 'express';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { query, param, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import {
  checkCategoryColumnExists,
  getCategoryImageMap,
  getCategoryHierarchy,
  checkProductCategoryModelSupport,
} from '../utils/categoryCache';

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

      // Check if category_id column exists (using cache)
      const includeCategory = await checkCategoryColumnExists(prisma);

      // Load category image map for fallback images (using cache)
      // Only load if needed - when product doesn't have image, we'll check if category map is needed
      let categoryImageMap = new Map<string, { iconUrl: string | null; parentId: string | null; parentIconUrl: string | null }>();

      // Get product with supplier and prices
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,
        },
        include: {
          ...(includeCategory && {
            category: {
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
            serviceCategory: {
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

      // Use product image if available, otherwise use category icon as fallback
      // Fallback chain: product image → subcategory icon → main category icon
      const productImageUrl = product.images[0]?.imageUrl || null;
      let finalImageUrl = productImageUrl;
      
      // Try category icon fallback if no product image
      if (!finalImageUrl) {
        // First try using category relation if available (based on type)
        if (includeCategory) {
          if ((product as any).type === 'service' && product.serviceCategory && typeof product.serviceCategory !== 'string') {
            const serviceCategory = product.serviceCategory as any;
            if (serviceCategory.iconUrl) {
              finalImageUrl = serviceCategory.iconUrl;
            } else if (serviceCategory.parent && serviceCategory.parent.iconUrl) {
              finalImageUrl = serviceCategory.parent.iconUrl;
            }
          } else if (product.category && typeof product.category !== 'string') {
            const category = product.category as any;
            // First try subcategory icon (if product is in a subcategory)
            if (category.iconUrl) {
              finalImageUrl = category.iconUrl;
            } else if (category.parent && category.parent.iconUrl) {
              // If no subcategory icon, try parent (main category) icon
              finalImageUrl = category.parent.iconUrl;
            }
          }
        }
        
        // If still no image, load category map and try (works even when category relation isn't included)
        if (!finalImageUrl && includeCategory) {
          // Load category map only when needed (lazy loading)
          categoryImageMap = await getCategoryImageMap(prisma);
          const categoryId = (product as any).categoryId;
          if (categoryId) {
            const categoryInfo = categoryImageMap.get(categoryId);
            
            if (categoryInfo) {
              // First try subcategory icon
              if (categoryInfo.iconUrl) {
                finalImageUrl = categoryInfo.iconUrl;
              } else if (categoryInfo.parentIconUrl) {
                // If no subcategory icon, try parent (main category) icon
                finalImageUrl = categoryInfo.parentIconUrl;
              }
            }
          }
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

      // Determine category name based on type
      let categoryName: string | null = null;
      if ((product as any).type === 'service') {
        categoryName = includeCategory && product.serviceCategory && typeof product.serviceCategory !== 'string'
          ? (('parent' in product.serviceCategory && (product.serviceCategory as any).parent) 
              ? `${(product.serviceCategory as any).parent.name} > ${(product.serviceCategory as any).name}` 
              : (product.serviceCategory as any).name)
          : null;
      } else {
        categoryName = includeCategory && product.category && typeof product.category !== 'string'
          ? (('parent' in product.category && (product.category as any).parent) 
              ? `${(product.category as any).parent.name} > ${(product.category as any).name}` 
              : (product.category as any).name)
          : (product as any).category || null;
      }

      // Extract location from metadata
      const metadata = (product as any).metadata as Record<string, any> | null;
      const location = metadata?.location || null;

      const productWithPrices = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        type: (product as any).type || 'product',
        category: categoryName,
        unit: product.unit,
        ratePerHour: (product as any).type === 'service' ? ((product as any).ratePerHour ? Number((product as any).ratePerHour) : null) : undefined,
        rateType: (product as any).type === 'service' ? ((product as any).rateType || null) : undefined,
        location: location,
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
  query('serviceCategoryId').optional().isString(),
  query('type').optional().isIn(['product', 'service']).withMessage('Type must be product or service'),
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
      const serviceCategoryId = req.query.serviceCategoryId as string | undefined;
      const type = req.query.type as 'product' | 'service' | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        isActive: true,
      };

      // Filter by type (product or service)
      if (type) {
        where.type = type;
      }

      if (supplierId) {
        where.supplierId = supplierId;
      }

      // Check if category_id column exists (using cache)
      const includeCategory = await checkCategoryColumnExists(prisma);

      // Handle service category filtering (for services)
      if (serviceCategoryId && (type === 'service' || !type)) {
        where.serviceCategoryId = serviceCategoryId;
      }

      // Handle category filtering: if main category, include all subcategories
      // Only apply if category_id column exists (for products)
      if (category && includeCategory && (type === 'product' || !type)) {
        try {
          // Use cached category hierarchy lookup
          const categoryHierarchy = await getCategoryHierarchy(prisma, category);

          if (categoryHierarchy) {
            // If it's a main category (has no parent), include products from main category and all subcategories
            if (!categoryHierarchy.parentId) {
              const subcategoryIds = categoryHierarchy.children.map((child) => child.id);
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
          // If category lookup fails, fall back to simple category ID filter
          console.warn('Category filtering error, using simple filter:', categoryError.message);
          try {
            where.categoryId = category;
          } catch (fallbackError: any) {
            // If even that fails, skip category filtering entirely
            console.warn('Category filtering completely unavailable, skipping category filter');
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

      // Category image map will be loaded lazily only if products don't have images (using cache)
      let categoryImageMap = new Map<string, { iconUrl: string | null; parentId: string | null; parentIconUrl: string | null }>();

      // Get products with suppliers and prices
      // Remove categoryId from where if we can't filter by it
      const finalWhere = { ...where };
      if (!includeCategory && finalWhere.categoryId) {
        delete finalWhere.categoryId;
      }

      // Check if Prisma Client supports productCategory model (using cache)
      // This only affects whether we can include category relation in results
      // We can still filter by categoryId even if the model isn't available
      const canIncludeCategory =
        includeCategory && (await checkProductCategoryModelSupport(prisma));

      // Try to fetch products with category relation, fallback to without if Prisma Client issue
      let products: any[];
      let total: number;
      
      try {
        // Use select instead of include for better performance
        [products, total] = await Promise.all([
          prisma.product.findMany({
            where: finalWhere,
            select: {
              id: true,
              sku: true,
              name: true,
              description: true,
              unit: true,
              type: true,
              categoryId: true,
              serviceCategoryId: true,
              metadata: true,
              ...(canIncludeCategory && {
                category: {
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
                serviceCategory: {
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
                select: {
                  price: true,
                  currency: true,
                },
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
        
        // Use select instead of include for better performance
        [products, total] = await Promise.all([
          prisma.product.findMany({
            where: fallbackWhere,
            select: {
              id: true,
              sku: true,
              name: true,
              description: true,
              unit: true,
              type: true,
              categoryId: true,
              serviceCategoryId: true,
              metadata: true,
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
                select: {
                  price: true,
                  currency: true,
                },
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
        // Note: canIncludeCategory was already set earlier, but we need to ensure it's false here
        // Since canIncludeCategory is const, we'll handle this in the mapping logic
      }

      // Get private prices for customers if logged in
      // Note: Private prices are company-specific, so customers won't see them
      // This is a placeholder for future customer-specific pricing logic
      let privatePriceMap = new Map();
      // For now, customers see default prices only
      // Future: Implement customer-specific pricing if needed

      // Check if we need to load category map (only if products don't have images)
      const needsCategoryMap = includeCategory && products.some((p: any) => !p.images || p.images.length === 0);
      if (needsCategoryMap) {
        // Load category map using cache (only when needed)
        categoryImageMap = await getCategoryImageMap(prisma);
      }

      // Combine products with prices
      const productsWithPrices = products.map((product) => {
        const privatePrice = privatePriceMap.get(product.id);
        const defaultPrice = product.defaultPrices[0];
        
        // Use product image if available, otherwise use category default image
        // Fallback chain: product image → subcategory icon → main category icon
        const productImageUrl = product.images[0]?.imageUrl || null;
        let finalImageUrl = productImageUrl;
        
        // Try category icon fallback if no product image
        if (!finalImageUrl) {
          // First try using category relation if available
          if (canIncludeCategory && includeCategory && product.category && typeof product.category !== 'string') {
            const category = product.category as any;
            // First try subcategory icon (if product is in a subcategory)
            if (category.iconUrl) {
              finalImageUrl = category.iconUrl;
            } else if (category.parent && category.parent.iconUrl) {
              // If no subcategory icon, try parent (main category) icon
              finalImageUrl = category.parent.iconUrl;
            }
          }
          
          // If still no image and we have categoryId, try categoryImageMap
          if (!finalImageUrl && (product as any).categoryId) {
            const categoryId = (product as any).categoryId;
            const categoryInfo = categoryImageMap.get(categoryId);
            
            if (categoryInfo) {
              // First try subcategory icon (if product is in a subcategory)
              if (categoryInfo.iconUrl) {
                finalImageUrl = categoryInfo.iconUrl;
              } else if (categoryInfo.parentIconUrl) {
                // If no subcategory icon, try parent (main category) icon
                finalImageUrl = categoryInfo.parentIconUrl;
              }
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

        // Determine category name based on type
        let categoryName: string | null = null;
        if (product.type === 'product') {
          categoryName = canIncludeCategory && includeCategory && product.category && typeof product.category !== 'string'
            ? (('parent' in product.category && (product.category as any).parent) 
                ? `${(product.category as any).parent.name} > ${(product.category as any).name}` 
                : (product.category as any).name)
            : (product as any).category || null;
        } else if (product.type === 'service') {
          categoryName = canIncludeCategory && includeCategory && product.serviceCategory && typeof product.serviceCategory !== 'string'
            ? (('parent' in product.serviceCategory && (product.serviceCategory as any).parent) 
                ? `${(product.serviceCategory as any).parent.name} > ${(product.serviceCategory as any).name}` 
                : (product.serviceCategory as any).name)
            : null;
        }

        // Extract location from metadata
        const metadata = (product as any).metadata as Record<string, any> | null;
        const location = metadata?.location || null;

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          type: product.type,
          category: categoryName,
          unit: product.unit,
          ratePerHour: product.type === 'service' ? (product.ratePerHour ? Number(product.ratePerHour) : null) : undefined,
          rateType: product.type === 'service' ? (product.rateType || null) : undefined,
          location: location,
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

// Public service providers endpoint
router.get(
  '/service-providers/public',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const serviceProviders = await prisma.tenant.findMany({
        where: {
          type: 'service_provider',
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

      res.json({ suppliers: serviceProviders }); // Use 'suppliers' key for consistency with frontend
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

