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
          // Note: Product model doesn't have isActive field in current schema
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // Category relations not in current schema
        },
      });

      if (!product) {
        return res.status(404).json({ error: { message: 'Product not found', statusCode: 404 } });
      }

      // Product image handling - simplified for current schema
      let finalImageUrl: string | null = null;
      
      // Try category icon fallback if available
      if (includeCategory) {
        // Load category map only when needed (lazy loading)
        categoryImageMap = await getCategoryImageMap(prisma);
        const categoryId = (product as any).categoryId;
        if (categoryId) {
          const categoryInfo = categoryImageMap.get(categoryId);
          if (categoryInfo) {
            // First try subcategory icon
              if (categoryInfo.iconUrl) {
                finalImageUrl = categoryInfo.iconUrl || null;
              } else if (categoryInfo.parentIconUrl) {
                // If no subcategory icon, try parent (main category) icon
                finalImageUrl = categoryInfo.parentIconUrl || null;
            }
          }
        }
      }

      // Get private prices for customers if logged in (future: customer-specific pricing)
      let privatePriceMap = new Map();
      // For now, customers see default prices only
      // Future: Implement customer-specific pricing if needed

      const privatePrice = privatePriceMap.get(product.id);
      // Use product price directly (no defaultPrices in current schema)
      const defaultPrice = { price: product.price, currency: 'USD' };

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

      // Category name - simplified for current schema (no category relations)
      let categoryName: string | null = null;
      // Try to get category name from categoryId if available
      if (includeCategory) {
        const categoryId = (product as any).categoryId;
        if (categoryId) {
          // Could load category name from cache if needed, but for now just use null
          categoryName = null;
        }
      }

      // Location not available in current schema
      const location = null;

      const productWithPrices = {
        id: product.id,
        sku: (product as any).sku || product.id || '', // sku may not be in include
        name: product.name,
        description: null, // Description not in current Product schema
        type: 'product', // Product model doesn't have type field
        category: categoryName,
        unit: product.unit,
        ratePerHour: (product as any).type === 'service' ? ((product as any).ratePerHour ? Number((product as any).ratePerHour) : null) : undefined,
        rateType: (product as any).type === 'service' ? ((product as any).rateType || null) : undefined,
        location: location,
        supplierId: product.supplier.id,
        supplierName: product.supplier.name,
        supplierLogoUrl: null, // logoUrl not in current Organization schema
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
        images: [], // Images not in current Product schema
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
        // Note: Product model doesn't have isActive or type fields in current schema
      };

      // Filter by type (product or service) - removed as Product model doesn't have type field
      // if (type) {
      //   where.type = type;
      // }

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
              name: true,
              unit: true,
              price: true,
              supplierId: true,
              // sku, description, type not in current Product schema
              // categoryId, serviceCategoryId, metadata not in current Product schema
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
                  email: true,
                },
              },
              // images and defaultPrices not in current Product schema
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
              name: true,
              unit: true,
              price: true,
              supplierId: true,
              supplier: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              // sku, images, and defaultPrices not in current Product schema
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
        // Use product price directly (no defaultPrices in current schema)
      const defaultPrice = { price: product.price, currency: 'USD' };
        
        // Use product image if available, otherwise use category default image
        // Fallback chain: product image → subcategory icon → main category icon
        const productImageUrl = null; // images not in current Product schema
        let finalImageUrl: string | null = productImageUrl;
        
        // Try category icon fallback if no product image
        if (!finalImageUrl) {
          // First try using category relation if available (based on type)
          // Category image handling simplified - no category relations in current schema
          if (canIncludeCategory && includeCategory) {
            // Could load from category cache if needed, but for now skip
          }
          
          // If still no image and we have categoryId, try categoryImageMap (for products only)
          if (!finalImageUrl && (product as any).categoryId && product.type === 'product') {
            const categoryId = (product as any).categoryId;
            const categoryInfo = categoryImageMap.get(categoryId);
            
            if (categoryInfo) {
              // First try subcategory icon (if product is in a subcategory)
              if (categoryInfo.iconUrl) {
                finalImageUrl = categoryInfo.iconUrl || null;
              } else if (categoryInfo.parentIconUrl) {
                // If no subcategory icon, try parent (main category) icon
                finalImageUrl = categoryInfo.parentIconUrl || null;
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
          // Category name - simplified for current schema (no category relations)
          categoryName = null;
        }

        // Use supplier address as location
        const location = null; // address not in current Organization schema

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: null, // description not in current Product schema
          type: product.type,
          category: categoryName,
          unit: product.unit,
          ratePerHour: product.type === 'service' ? (product.ratePerHour ? Number(product.ratePerHour) : null) : undefined,
          rateType: product.type === 'service' ? (product.rateType || null) : undefined,
          location: location,
          supplierId: product.supplier.id,
          supplierName: product.supplier.name,
          supplierLogoUrl: null, // logoUrl not in current Organization schema
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
      // Fetch categories - ProductCategory model doesn't exist in current schema
      const categories: any[] = [];
      // const categories = await (prisma as any).productCategory.findMany({
      //   where: { isActive: true },
      //   include: {
      //     parent: {
      //       select: {
      //         id: true,
      //         name: true,
      //       },
      //     },
      //   },
      //   orderBy: [
      //     { parentId: 'asc' },
      //     { displayOrder: 'asc' },
      //     { name: 'asc' },
      //   },
      // });

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const suppliers = await prisma.organization.findMany({
        where: {
          type: 'supplier',
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({ suppliers });
    } catch (error: any) {
      console.error('Error in /suppliers/public:', error);
      // Return empty array on error instead of failing
      res.json({ suppliers: [] });
    }
  }
);

// Public service providers endpoint
router.get(
  '/service-providers/public',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceProviders = await prisma.organization.findMany({
        where: {
          type: 'supplier', // Note: In current schema, service providers might also be 'supplier' type
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({ suppliers: serviceProviders }); // Use 'suppliers' key for consistency with frontend
    } catch (error: any) {
      console.error('Error in /service-providers/public:', error);
      // Return empty array on error instead of failing
      res.json({ suppliers: [] });
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

      const supplier = await prisma.organization.findFirst({
        where: {
          id: req.params.id,
          type: 'supplier',
          // isActive not in current schema
          // status not in current Organization schema
        },
        select: {
          id: true,
          name: true,
          email: true,
          // phone, address, logoUrl not in current Organization schema
          _count: {
            select: {
              products: {
                // isActive not in current Product schema
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

