/**
 * Simplified Product Routes for MVP 1
 * Works with Organization/User model (not Tenant)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
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

      let products: any[] = [];

      try {
        // Try new schema first
        products = await prisma.product.findMany({
          where: { supplierId: organizationId },
          orderBy: { name: 'asc' },
        });
      } catch (error: any) {
        // If new schema fails, try old schema with raw SQL
        if (error.message?.includes('relation') || error.message?.includes('column')) {
          console.log('[ProductRoutes] Trying old schema with raw SQL for product list');
          try {
            const result = await prisma.$queryRaw<any[]>(
              Prisma.sql`
                SELECT 
                  id,
                  supplier_id as "supplierId",
                  name,
                  price,
                  unit,
                  created_at as "createdAt",
                  updated_at as "updatedAt"
                FROM products
                WHERE supplier_id::text = ${organizationId}::text
                ORDER BY name ASC
              `
            );

            products = result || [];
          } catch (oldSchemaError: any) {
            console.error('[ProductRoutes] Old schema product list failed:', oldSchemaError);
            products = [];
          }
        } else {
          throw error;
        }
      }

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

      let product: any;

      try {
        // Try new schema first
        product = await prisma.product.create({
          data: {
            supplierId: organizationId,
            name: input.name,
            price: input.price,
            unit: input.unit,
          },
        });
      } catch (error: any) {
        // If new schema fails, try old schema with raw SQL
        if (error.message?.includes('relation') || error.message?.includes('column')) {
          console.log('[ProductRoutes] Trying old schema with raw SQL for product creation');
          try {
            const result = await prisma.$queryRaw<any[]>(
              Prisma.sql`
                INSERT INTO products (id, supplier_id, name, price, unit, created_at, updated_at)
                VALUES (gen_random_uuid(), ${organizationId}::text, ${input.name}, ${input.price}, ${input.unit}, NOW(), NOW())
                RETURNING id, supplier_id as "supplierId", name, price, unit, created_at as "createdAt", updated_at as "updatedAt"
              `
            );

            if (result && result.length > 0) {
              product = result[0];
            } else {
              throw new Error('Failed to create product in old schema');
            }
          } catch (oldSchemaError: any) {
            console.error('[ProductRoutes] Old schema product creation failed:', oldSchemaError);
            throw oldSchemaError;
          }
        } else {
          throw error;
        }
      }

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
