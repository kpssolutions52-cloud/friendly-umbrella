import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest, requireSuperAdmin } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import multer from 'multer';
import { uploadCategoryImage, deleteCategoryImage } from '../utils/supabase';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// Apply authentication and super admin check to all routes
router.use(authenticate, requireSuperAdmin());

// GET /api/v1/admin/categories - Get all categories
router.get(
  '/categories',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/admin/categories/:id - Get a single category
router.get(
  '/categories/:id',
  param('id').isUUID(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw createError(404, 'Category not found');
      }

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/admin/categories - Create a new category
router.post(
  '/categories',
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = createCategorySchema.parse(req.body);

      // Check if category with same name already exists
      const existing = await prisma.category.findUnique({
        where: { name: input.name },
      });

      if (existing) {
        throw createError(409, 'Category with this name already exists');
      }

      const category = await prisma.category.create({
        data: {
          name: input.name,
        },
      });

      res.status(201).json({
        message: 'Category created successfully',
        category,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// PUT /api/v1/admin/categories/:id - Update a category
router.put(
  '/categories/:id',
  param('id').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const input = updateCategorySchema.parse(req.body);

      // Check if category exists
      const existing = await prisma.category.findUnique({
        where: { id },
      });

      if (!existing) {
        throw createError(404, 'Category not found');
      }

      // If name is being updated, check for duplicates
      if (input.name && input.name !== existing.name) {
        const duplicate = await prisma.category.findUnique({
          where: { name: input.name },
        });

        if (duplicate) {
          throw createError(409, 'Category with this name already exists');
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name }),
        },
      });

      res.json({
        message: 'Category updated successfully',
        category,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// POST /api/v1/admin/categories/:id/image - Upload category image
router.post(
  '/categories/:id/image',
  param('id').isUUID(),
  upload.single('image'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw createError(404, 'Category not found');
      }

      // Check if file was uploaded
      if (!req.file) {
        throw createError(400, 'No file uploaded');
      }

      let imageUrl: string;

      try {
        // Delete old image if exists
        if (category.imageUrl) {
          await deleteCategoryImage(category.imageUrl);
        }

        // Upload new image
        imageUrl = await uploadCategoryImage(
          id,
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
      } catch (uploadError: any) {
        console.error('Image upload error:', uploadError);
        throw createError(500, `Failed to upload image: ${uploadError.message || 'Unknown error'}`);
      }

      // Update category with new image URL
      try {
        const updatedCategory = await prisma.category.update({
          where: { id },
          data: { imageUrl },
        });

        res.json({
          message: 'Category image uploaded successfully',
          category: updatedCategory,
        });
      } catch (dbError: any) {
        // Try to delete uploaded file if database save fails
        try {
          await deleteCategoryImage(imageUrl);
        } catch (deleteError) {
          console.error('Failed to cleanup uploaded file:', deleteError);
        }
        throw dbError;
      }
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/admin/categories/:id/image - Delete category image
router.delete(
  '/categories/:id/image',
  param('id').isUUID(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw createError(404, 'Category not found');
      }

      if (!category.imageUrl) {
        throw createError(400, 'Category has no image to delete');
      }

      // Delete image from storage
      try {
        await deleteCategoryImage(category.imageUrl);
      } catch (deleteError) {
        console.error('Failed to delete image from storage:', deleteError);
        // Continue with database update even if storage deletion fails
      }

      // Update category to remove image URL
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: { imageUrl: null },
      });

      res.json({
        message: 'Category image deleted successfully',
        category: updatedCategory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/admin/categories/:id - Delete a category
router.delete(
  '/categories/:id',
  param('id').isUUID(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw createError(404, 'Category not found');
      }

      // Check if category is used by any products
      const productCount = await prisma.product.count({
        where: {
          category: category.name,
        },
      });

      if (productCount > 0) {
        throw createError(400, `Cannot delete category. It is used by ${productCount} product(s).`);
      }

      // Delete image from storage if exists
      if (category.imageUrl) {
        try {
          await deleteCategoryImage(category.imageUrl);
        } catch (deleteError) {
          console.error('Failed to delete image from storage:', deleteError);
          // Continue with category deletion even if image deletion fails
        }
      }

      // Delete category
      await prisma.category.delete({
        where: { id },
      });

      res.json({
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

