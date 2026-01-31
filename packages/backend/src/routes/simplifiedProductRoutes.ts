/**
 * Simplified Product Routes for MVP 1
 * Works with Organization/User model (not Tenant)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth } from '../middleware/authMiddleware';
import { requireSupplier } from '../middleware/permissionsMiddleware';
import { body, param, validationResult } from 'express-validator';
import { z } from 'zod';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
});

// GET /api/v1/products?supplier=true - Get supplier's products
router.get(
  '/products',
  requireAuth,
  requireSupplier,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID not found' });
      }

      // Get products - NEW SCHEMA ONLY
      const products = await prisma.product.findMany({
        where: { supplierId: organizationId },
        orderBy: { name: 'asc' },
      });

      res.json({ products });
    } catch (error: any) {
      console.error('Product list error:', error);
      next(error);
    }
  }
);

// POST /api/v1/products - Create product
router.post(
  '/products',
  requireAuth,
  requireSupplier,
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('unit').notEmpty().withMessage('Unit is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = productSchema.parse(req.body);
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID not found' });
      }

      // Create product - NEW SCHEMA ONLY
      const product = await prisma.product.create({
        data: {
          supplierId: organizationId,
          name: input.name,
          price: input.price,
          unit: input.unit,
        },
      });

      res.status(201).json({ product });
    } catch (error: any) {
      console.error('Product creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// PUT /api/v1/products/:id - Update product
router.put(
  '/products/:id',
  requireAuth,
  requireSupplier,
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('unit').optional().notEmpty().withMessage('Unit cannot be empty'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const productId = req.params.id;
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID not found' });
      }

      // Verify product belongs to supplier
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          supplierId: organizationId,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.price !== undefined) updateData.price = req.body.price;
      if (req.body.unit) updateData.unit = req.body.unit;

      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData,
      });

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/products/:id - Delete product
router.delete(
  '/products/:id',
  requireAuth,
  requireSupplier,
  [param('id').isUUID().withMessage('Invalid product ID')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const productId = req.params.id;
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID not found' });
      }

      // Verify product belongs to supplier
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          supplierId: organizationId,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await prisma.product.delete({
        where: { id: productId },
      });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
