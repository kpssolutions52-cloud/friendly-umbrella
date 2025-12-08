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

      // Get product with supplier and prices
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,
        },
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

      // Get category image if available
      let categoryImageUrl: string | null = null;
      if (product.category) {
        try {
          const category = await prisma.category.findFirst({
            where: { name: product.category },
            select: { imageUrl: true },
          });
          categoryImageUrl = category?.imageUrl || null;
        } catch (categoryError) {
          // Category might not exist, that's okay
        }
      }

      // Use product image if available, otherwise use category default image
      const productImageUrl = product.images[0]?.imageUrl || categoryImageUrl;

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
        category: product.category,
        unit: product.unit,
        supplierId: product.supplier.id,
        supplierName: product.supplier.name,
        supplierLogoUrl: product.supplier.logoUrl,
        productImageUrl: productImageUrl,
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
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
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

      if (category) {
        where.category = category;
      }

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }

      // Get all categories for fallback images
      let categoryImageMap = new Map<string, string | null>();
      try {
        const categories = await prisma.category.findMany({
          select: {
            name: true,
            imageUrl: true,
          },
        });
        categoryImageMap = new Map(
          categories.map((cat) => [cat.name, cat.imageUrl])
        );
      } catch (categoryError) {
        // Categories table might not exist yet - continue without category images
        console.warn('Failed to load categories for images:', categoryError);
      }

      // Get products with suppliers and prices
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
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
        }).catch((error) => {
          console.error('Error fetching products:', error);
          throw error;
        }),
        prisma.product.count({ where }).catch((error) => {
          console.error('Error counting products:', error);
          throw error;
        }),
      ]);

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
        const productImageUrl = product.images[0]?.imageUrl || null;
        const categoryImageUrl = product.category ? categoryImageMap.get(product.category) || null : null;
        const finalImageUrl = productImageUrl || categoryImageUrl;

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
          category: product.category,
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
    } catch (error) {
      next(error);
    }
  }
);

// Public categories endpoint - fetch from categories table managed by super admin
router.get(
  '/products/public/categories',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Fetch categories from the categories table (managed by super admin)
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
        select: {
          name: true,
        },
      });

      const categoryList = categories.map((c) => c.name);

      res.json({ categories: categoryList });
    } catch (error) {
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

