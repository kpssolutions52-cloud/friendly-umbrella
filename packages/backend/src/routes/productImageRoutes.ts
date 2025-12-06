import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireTenantType } from '../middleware/auth';
import { param, validationResult } from 'express-validator';
import createError from 'http-errors';
import multer from 'multer';
import { uploadProductImage, deleteProductImage } from '../utils/supabase';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Require supplier tenant type
const requireSupplier = requireTenantType('supplier');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET /api/v1/products/:id/images - Get all images for a product
router.get(
  '/products/:id/images',
  [param('id').isUUID().withMessage('Invalid product ID')],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const productId = req.params.id;

      // Verify product exists and user has access
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          supplierId: true,
        },
      });

      if (!product) {
        throw createError(404, 'Product not found');
      }

      // Check access: supplier can only see their own products, companies can see all
      if (req.tenantType === 'supplier' && product.supplierId !== req.tenantId) {
        throw createError(403, 'Access denied');
      }

      const images = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          imageUrl: true,
          displayOrder: true,
          createdAt: true,
        },
      });

      res.json({ images });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/products/:id/images - Upload product image
router.post(
  '/products/:id/images',
  requireSupplier,
  upload.single('image'),
  [param('id').isUUID().withMessage('Invalid product ID')],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.tenantId) {
        throw createError(403, 'Tenant ID not found');
      }

      if (!req.file) {
        throw createError(400, 'No file uploaded');
      }

      const productId = req.params.id;

      // Verify product exists and belongs to this supplier
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          supplierId: req.tenantId,
        },
      });

      if (!product) {
        throw createError(404, 'Product not found or access denied');
      }

      // Get current max display order
      const maxOrder = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });

      const nextOrder = (maxOrder?.displayOrder ?? -1) + 1;

      // Upload image
      const imageUrl = await uploadProductImage(
        productId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Save image record
      const image = await prisma.productImage.create({
        data: {
          productId,
          imageUrl,
          displayOrder: nextOrder,
        },
        select: {
          id: true,
          imageUrl: true,
          displayOrder: true,
          createdAt: true,
        },
      });

      res.json({
        image,
        message: 'Image uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/products/:id/images/:imageId - Delete product image
router.delete(
  '/products/:id/images/:imageId',
  requireSupplier,
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    param('imageId').isUUID().withMessage('Invalid image ID'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.tenantId) {
        throw createError(403, 'Tenant ID not found');
      }

      const productId = req.params.id;
      const imageId = req.params.imageId;

      // Verify product exists and belongs to this supplier
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          supplierId: req.tenantId,
        },
      });

      if (!product) {
        throw createError(404, 'Product not found or access denied');
      }

      // Get image record
      const image = await prisma.productImage.findFirst({
        where: {
          id: imageId,
          productId,
        },
      });

      if (!image) {
        throw createError(404, 'Image not found');
      }

      // Delete from storage
      await deleteProductImage(image.imageUrl).catch((err) => {
        console.error('Failed to delete image from storage:', err);
      });

      // Delete from database
      await prisma.productImage.delete({
        where: { id: imageId },
      });

      res.json({
        message: 'Image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/products/:id/images/:imageId/order - Update image display order
router.put(
  '/products/:id/images/:imageId/order',
  requireSupplier,
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    param('imageId').isUUID().withMessage('Invalid image ID'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.tenantId) {
        throw createError(403, 'Tenant ID not found');
      }

      const productId = req.params.id;
      const imageId = req.params.imageId;
      const { displayOrder } = req.body;

      if (typeof displayOrder !== 'number' || displayOrder < 0) {
        throw createError(400, 'Invalid display order');
      }

      // Verify product exists and belongs to this supplier
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          supplierId: req.tenantId,
        },
      });

      if (!product) {
        throw createError(404, 'Product not found or access denied');
      }

      // Update image order
      const image = await prisma.productImage.update({
        where: { id: imageId },
        data: { displayOrder },
        select: {
          id: true,
          imageUrl: true,
          displayOrder: true,
        },
      });

      res.json({
        image,
        message: 'Image order updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

