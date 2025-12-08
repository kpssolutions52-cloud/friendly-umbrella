import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { priceService } from '../services/priceService';
import { authenticate, AuthRequest, requireTenantType } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import createError from 'http-errors';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply tenant type check
const requireCompany = requireTenantType('company');

interface ProductRequirement {
  productName?: string;
  sku?: string;
  quantity: number;
}

interface SupplierMatch {
  productId: string;
  productName: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  supplierLogoUrl: string | null;
  unit: string;
  price: number;
  currency: string;
  priceType: 'default' | 'private';
  totalPrice: number;
  productImageUrl: string | null;
  category: string | null;
}

// POST /api/v1/company/product-requirements - Find best suppliers for product requirements
router.post(
  '/product-requirements',
  requireCompany,
  [
    body('requirements').isArray({ min: 1 }).withMessage('Requirements must be a non-empty array'),
    body('requirements.*.productName').optional().isString().withMessage('Product name must be a string'),
    body('requirements.*.sku').optional().isString().withMessage('SKU must be a string'),
    body('requirements.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, 'Validation failed', { errors: errors.array() }));
      }

      const { requirements }: { requirements: ProductRequirement[] } = req.body;
      const companyId = req.user!.tenantId!;

      if (!companyId) {
        return next(createError(403, 'Company ID not found'));
      }

      const results: Array<{
        requirement: ProductRequirement;
        matches: SupplierMatch[];
        bestMatch: SupplierMatch | null;
      }> = [];

      // Process each requirement
      for (const requirement of requirements) {
        const matches: SupplierMatch[] = [];

        // Build search query
        const searchConditions: any[] = [];
        if (requirement.productName) {
          searchConditions.push({
            name: {
              contains: requirement.productName,
              mode: 'insensitive' as const,
            },
          });
        }
        if (requirement.sku) {
          searchConditions.push({
            sku: {
              contains: requirement.sku,
              mode: 'insensitive' as const,
            },
          });
        }

        if (searchConditions.length === 0) {
          results.push({
            requirement,
            matches: [],
            bestMatch: null,
          });
          continue;
        }

        // Find matching products across all suppliers
        const products = await prisma.product.findMany({
          where: {
            isActive: true,
            OR: searchConditions,
          },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                isActive: true,
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
              orderBy: {
                effectiveFrom: 'desc',
              },
              take: 1,
            },
            privatePrices: {
              where: {
                companyId: companyId,
                isActive: true,
                OR: [
                  { effectiveUntil: null },
                  { effectiveUntil: { gte: new Date() } },
                ],
              },
              orderBy: {
                effectiveFrom: 'desc',
              },
              take: 1,
            },
            images: {
              orderBy: {
                displayOrder: 'asc',
              },
              take: 1,
            },
          },
        });

        // Process each product and get best price
        for (const product of products) {
          if (!product.supplier.isActive) continue;

          // Get best available price (private price takes precedence over default)
          let price: number | null = null;
          let currency: string = 'USD';
          let priceType: 'default' | 'private' = 'default';

          if (product.privatePrices.length > 0) {
            const privatePrice = product.privatePrices[0];
            price = privatePrice.price;
            currency = privatePrice.currency;
            priceType = 'private';
          } else if (product.defaultPrices.length > 0) {
            const defaultPrice = product.defaultPrices[0];
            price = defaultPrice.price;
            currency = defaultPrice.currency;
            priceType = 'default';
          }

          // Skip if no price available
          if (price === null) continue;

          const totalPrice = price * requirement.quantity;
          const productImageUrl = product.images.length > 0 ? product.images[0].imageUrl : null;

          matches.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            supplierId: product.supplier.id,
            supplierName: product.supplier.name,
            supplierLogoUrl: product.supplier.logoUrl,
            unit: product.unit,
            price,
            currency,
            priceType,
            totalPrice,
            productImageUrl,
            category: product.category,
          });
        }

        // Sort matches by total price (best price first)
        matches.sort((a, b) => a.totalPrice - b.totalPrice);

        // Get best match (lowest total price)
        const bestMatch = matches.length > 0 ? matches[0] : null;

        results.push({
          requirement,
          matches,
          bestMatch,
        });
      }

      res.json({
        results,
        summary: {
          totalRequirements: requirements.length,
          matchedRequirements: results.filter((r) => r.matches.length > 0).length,
          unmatchedRequirements: results.filter((r) => r.matches.length === 0).length,
        },
      });
    } catch (error: any) {
      console.error('Error finding product requirements:', error);
      next(createError(500, `Failed to find product requirements: ${error.message || 'Unknown error'}`));
    }
  }
);

export default router;
