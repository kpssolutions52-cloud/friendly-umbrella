import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest, requireSuperAdmin } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import { z } from 'zod';
import createError from 'http-errors';
import multer from 'multer';
import { uploadCategoryImage, deleteCategoryImage } from '../utils/supabase';
import { serviceCategoryService } from '../services/serviceCategoryService';

const router = Router();

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

const createServiceCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  displayOrder: z.number().int().optional(),
});

const updateServiceCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

// Apply authentication and super admin check to all routes
router.use(authenticate, requireSuperAdmin());

// GET /api/v1/admin/service-categories - Get all service categories (hierarchical)
router.get(
  '/service-categories',
  query('includeInactive').optional().isBoolean(),
  query('flat').optional().isBoolean(), // Return flat list for dropdowns
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const includeInactive = req.query.includeInactive === 'true';
      const flat = req.query.flat === 'true';

      if (flat) {
        const categories = await serviceCategoryService.getFlatCategories(includeInactive);
        return res.json({ categories });
      }

      const categories = await serviceCategoryService.getAllCategories(includeInactive);
      res.json({ categories });
    } catch (error: any) {
      console.error('Error fetching service categories:', error);
      next(createError(500, `Failed to fetch service categories: ${error.message || 'Unknown error'}`));
    }
  }
);

// GET /api/v1/admin/service-categories/main - Get only main service categories
router.get(
  '/service-categories/main',
  query('includeInactive').optional().isBoolean(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await serviceCategoryService.getMainCategories(includeInactive);
      res.json({ categories });
    } catch (error: any) {
      next(createError(500, `Failed to fetch main service categories: ${error.message || 'Unknown error'}`));
    }
  }
);

// GET /api/v1/admin/service-categories/:parentId/subcategories - Get subcategories for a main service category
router.get(
  '/service-categories/:parentId/subcategories',
  [param('parentId').isUUID(), query('includeInactive').optional().isBoolean()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const includeInactive = req.query.includeInactive === 'true';
      const subcategories = await serviceCategoryService.getSubcategories(req.params.parentId, includeInactive);
      res.json({ categories: subcategories });
    } catch (error: any) {
      next(createError(500, `Failed to fetch service subcategories: ${error.message || 'Unknown error'}`));
    }
  }
);

// GET /api/v1/admin/service-categories/:id - Get a single service category
router.get(
  '/service-categories/:id',
  [param('id').isUUID()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = await serviceCategoryService.getCategoryById(req.params.id);
      res.json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/admin/service-categories - Create a new service category (main or subcategory)
router.post(
  '/service-categories',
  [
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isString(),
    body('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
    body('displayOrder').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = createServiceCategorySchema.parse(req.body);
      const category = await serviceCategoryService.createCategory(input);

      res.status(201).json({
        message: 'Service category created successfully',
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

// PUT /api/v1/admin/service-categories/:id - Update a service category
router.put(
  '/service-categories/:id',
  [
    param('id').isUUID(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isString(),
    body('parentId').optional().custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }),
    body('isActive').optional().isBoolean(),
    body('displayOrder').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = updateServiceCategorySchema.parse(req.body);
      const category = await serviceCategoryService.updateCategory(req.params.id, input);

      res.json({
        message: 'Service category updated successfully',
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

// POST /api/v1/admin/service-categories/:id/icon - Upload service category icon
router.post(
  '/service-categories/:id/icon',
  [param('id').isUUID(), upload.single('icon')],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        throw createError(400, 'No file uploaded');
      }

      const category = await serviceCategoryService.getCategoryById(req.params.id);

      let iconUrl: string;

      try {
        // Delete old icon if exists
        if (category.iconUrl) {
          await deleteCategoryImage(category.iconUrl);
        }

        // Upload new icon
        iconUrl = await uploadCategoryImage(
          req.params.id,
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
      } catch (uploadError: any) {
        console.error('Icon upload error:', uploadError);
        throw createError(500, `Failed to upload icon: ${uploadError.message || 'Unknown error'}`);
      }

      // Update category with new icon URL
      try {
        const updatedCategory = await serviceCategoryService.updateCategory(req.params.id, { iconUrl });

        res.json({
          message: 'Service category icon uploaded successfully',
          category: updatedCategory,
        });
      } catch (dbError: any) {
        // Try to delete uploaded file if database save fails
        try {
          await deleteCategoryImage(iconUrl);
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

// DELETE /api/v1/admin/service-categories/:id/icon - Delete service category icon
router.delete(
  '/service-categories/:id/icon',
  [param('id').isUUID()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = await serviceCategoryService.getCategoryById(req.params.id);

      if (!category.iconUrl) {
        throw createError(400, 'Service category has no icon to delete');
      }

      // Delete icon from storage
      try {
        await deleteCategoryImage(category.iconUrl);
      } catch (deleteError) {
        console.error('Failed to delete icon from storage:', deleteError);
        // Continue with database update even if storage deletion fails
      }

      // Update category to remove icon URL
      const updatedCategory = await serviceCategoryService.updateCategory(req.params.id, { iconUrl: null });

      res.json({
        message: 'Service category icon deleted successfully',
        category: updatedCategory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/admin/service-categories/:id - Delete a service category
router.delete(
  '/service-categories/:id',
  [param('id').isUUID()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = await serviceCategoryService.getCategoryById(req.params.id);

      // Delete icon from storage if exists
      if (category.iconUrl) {
        try {
          await deleteCategoryImage(category.iconUrl);
        } catch (deleteError) {
          console.error('Failed to delete icon from storage:', deleteError);
          // Continue with category deletion even if icon deletion fails
        }
      }

      await serviceCategoryService.deleteCategory(req.params.id);

      res.json({
        message: 'Service category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
