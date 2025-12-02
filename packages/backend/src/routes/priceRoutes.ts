import { Router } from 'express';
import { priceService } from '../services/priceService';
import { authenticate, AuthRequest, requireTenantType } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const router = Router();

// Define schemas locally
const defaultPriceSchema = z.object({
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').optional().default('USD'),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional().nullable(),
});

const privatePriceSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').optional().default('USD'),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

// All routes require authentication
router.use(authenticate);

const updateDefaultPriceSchema = defaultPriceSchema;
const createPrivatePriceSchema = privatePriceSchema;
const updatePrivatePriceSchema = privatePriceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ========== DEFAULT PRICE ROUTES (Supplier only) ==========

// PUT /api/v1/products/:id/default-price - Update default price
router.put(
  '/products/:id/default-price',
  requireTenantType('supplier'),
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be 3 characters'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = updateDefaultPriceSchema.parse({
        ...req.body,
        effectiveFrom: req.body.effectiveFrom
          ? new Date(req.body.effectiveFrom)
          : undefined,
        effectiveUntil: req.body.effectiveUntil
          ? req.body.effectiveUntil === null
            ? null
            : new Date(req.body.effectiveUntil)
          : undefined,
      });

      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;

      const defaultPrice = await priceService.updateDefaultPrice(
        req.params.id,
        req.tenantId!,
        input,
        req.userId!,
        ipAddress,
        userAgent
      );

      res.json({ defaultPrice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// ========== PRIVATE PRICE ROUTES (Supplier only) ==========

// POST /api/v1/products/:id/private-prices - Create private price
router.post(
  '/products/:id/private-prices',
  requireTenantType('supplier'),
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('companyId').isUUID().withMessage('Invalid company ID'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = createPrivatePriceSchema.parse({
        ...req.body,
        effectiveFrom: req.body.effectiveFrom
          ? new Date(req.body.effectiveFrom)
          : undefined,
        effectiveUntil: req.body.effectiveUntil
          ? req.body.effectiveUntil === null
            ? null
            : new Date(req.body.effectiveUntil)
          : undefined,
      });

      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;

      const privatePrice = await priceService.createPrivatePrice(
        req.params.id,
        req.tenantId!,
        input,
        req.userId!,
        ipAddress,
        userAgent
      );

      res.status(201).json({ privatePrice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// GET /api/v1/products/:id/private-prices - List all private prices for a product
router.get(
  '/products/:id/private-prices',
  requireTenantType('supplier'),
  [param('id').isUUID().withMessage('Invalid product ID')],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const privatePrices = await priceService.getProductPrivatePrices(
        req.params.id,
        req.tenantId!
      );

      res.json({ privatePrices });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/private-prices/:id - Update private price
router.put(
  '/private-prices/:id',
  requireTenantType('supplier'),
  [
    param('id').isUUID().withMessage('Invalid private price ID'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = updatePrivatePriceSchema.parse({
        ...req.body,
        effectiveFrom: req.body.effectiveFrom
          ? new Date(req.body.effectiveFrom)
          : undefined,
        effectiveUntil: req.body.effectiveUntil !== undefined
          ? req.body.effectiveUntil === null
            ? null
            : new Date(req.body.effectiveUntil)
          : undefined,
      });

      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;

      const privatePrice = await priceService.updatePrivatePrice(
        req.params.id,
        req.tenantId!,
        input,
        req.userId!,
        ipAddress,
        userAgent
      );

      res.json({ privatePrice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// DELETE /api/v1/private-prices/:id - Delete private price
router.delete(
  '/private-prices/:id',
  requireTenantType('supplier'),
  [param('id').isUUID().withMessage('Invalid private price ID')],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await priceService.deletePrivatePrice(req.params.id, req.tenantId!, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/products/:id/price-history - Get price history
router.get(
  '/products/:id/price-history',
  requireTenantType('supplier'),
  [param('id').isUUID().withMessage('Invalid product ID')],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const history = await priceService.getPriceHistory(
        req.params.id,
        req.tenantId!
      );

      res.json({ history });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/companies - List all active companies (for suppliers to select when creating private prices)
router.get(
  '/companies',
  requireTenantType('supplier'),
  async (req: AuthRequest, res, next) => {
    try {
      const companies = await prisma.tenant.findMany({
        where: {
          type: 'company',
          isActive: true,
          status: 'active',
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

      res.json({ companies });
    } catch (error) {
      next(error);
    }
  }
);

export { router as priceRoutes };


