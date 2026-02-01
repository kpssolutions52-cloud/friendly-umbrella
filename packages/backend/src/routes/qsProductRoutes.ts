/**
 * QS Product Routes
 * Routes for QS professionals to browse products and suppliers
 * Works with Organization/User model
 */

import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { param, query, validationResult } from 'express-validator';
import createError from 'http-errors';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Middleware to allow QS users or company organizations
function requireQSOrCompany(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return next(createError(401, 'Authentication required'));
  }

  // Allow QS users or company organizations
  if (req.userType === 'qs' || req.organizationType === 'company') {
    return next();
  }

  return next(createError(403, 'QS user or company organization required'));
}

// GET /api/v1/suppliers - List all active suppliers
router.get('/suppliers', requireQSOrCompany, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const suppliers = await prisma.organization.findMany({
      where: {
        type: 'supplier',
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ suppliers: suppliers.map(s => ({
      id: s.id,
      name: s.name,
      logoUrl: null, // Add logoUrl if available in Organization model
      productCount: s._count.products,
    })) });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/search - Search products across all suppliers
router.get(
  '/products/search',
  requireQSOrCompany,
  [
    query('q').optional().isString().withMessage('Query must be a string'),
    query('supplierId').optional().isString(),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const searchQuery = (req.query.q as string) || '';
      const supplierId = req.query.supplierId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      console.log('[products/search] Starting query with params:', { searchQuery, supplierId, page, limit });
      
      // Build where clause - simplified approach
      // First, get all supplier organizations
      const suppliers = await prisma.organization.findMany({
        where: { type: 'supplier' },
        select: { id: true },
      });
      const supplierIds = suppliers.map(s => s.id);
      
      console.log('[products/search] Found supplier IDs:', supplierIds.length);
      
      if (supplierIds.length === 0) {
        return res.json({
          products: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      // Build where clause
      const where: any = {
        supplierId: { in: supplierIds },
      };

      if (supplierId) {
        // Verify supplierId is in the list
        if (supplierIds.includes(supplierId)) {
          where.supplierId = supplierId;
        } else {
          return res.status(404).json({ error: 'Supplier not found' });
        }
      }

      if (searchQuery) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { sku: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      // Log for debugging
      console.log('[products/search] Where clause:', JSON.stringify(where, null, 2));

      // Get products with suppliers
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        prisma.product.count({ where }),
      ]);
      
      console.log('[products/search] Found products:', products.length, 'Total:', total);

      // Get company-specific prices if user is from a company organization
      let companyPricesMap = new Map();
      if (req.organizationType === 'company' && req.organizationId) {
        const productIds = products.map((p) => p.id);
        const companyPrices = await prisma.companyPrice.findMany({
          where: {
            productId: { in: productIds },
            companyId: req.organizationId,
            OR: [
              { effectiveUntil: null },
              { effectiveUntil: { gte: new Date() } },
            ],
          },
          orderBy: { effectiveFrom: 'desc' },
        });
        companyPricesMap = new Map(
          companyPrices.map((cp) => [cp.productId, cp])
        );
      }

      // Combine products with prices
      const productsWithPrices = products.map((product: any) => {
        const companyPrice = companyPricesMap.get(product.id);
        const defaultPrice = Number(product.price);

        return {
          id: product.id,
          sku: product.sku || '', // SKU exists in schema but TypeScript type might be outdated
          name: product.name,
          description: null,
          category: null,
          unit: product.unit,
          supplierId: product.supplier.id,
          supplierName: product.supplier.name,
          supplierLogoUrl: null,
          productImageUrl: null,
          defaultPrice: {
            price: defaultPrice,
            currency: 'USD', // Default currency
          },
          privatePrice: companyPrice ? {
            price: Number(companyPrice.price),
            discountPercentage: null,
            calculatedPrice: null,
            currency: 'USD',
          } : null,
          price: companyPrice ? Number(companyPrice.price) : defaultPrice,
          priceType: companyPrice ? 'private' : 'default',
          currency: 'USD',
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

// GET /api/v1/products/categories - Get all product categories (placeholder for now)
router.get('/products/categories', requireQSOrCompany, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Return empty array for now - categories can be added later
    res.json({ categories: [] });
  } catch (error) {
    next(error);
  }
});

export default router;
