import { Router, Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/categoryService';

const router = Router();

// GET /api/v1/categories - Get all active categories (hierarchical) - Public endpoint
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getAllCategories(false); // Only active categories
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/categories/flat - Get flat list of categories for dropdowns - Public endpoint
router.get('/categories/flat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getFlatCategories(false); // Only active categories
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/categories/main - Get only main categories - Public endpoint
router.get('/categories/main', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getMainCategories(false); // Only active categories
    res.json({ categories });
  } catch (error: any) {
    console.error('Error in /categories/main endpoint:', error);
    console.error('Error stack:', error.stack);
    if (error.code) {
      console.error('Prisma error code:', error.code);
    }
    if (error.meta) {
      console.error('Prisma error meta:', JSON.stringify(error.meta, null, 2));
    }
    // Return empty array if table doesn't exist (graceful degradation)
    if (error.code === 'P2021' || error.code === '42P01') {
      console.warn('ProductCategory table not found, returning empty array');
      return res.json({ categories: [] });
    }
    next(error);
  }
});

// GET /api/v1/categories/:parentId/subcategories - Get subcategories for a main category - Public endpoint
router.get('/categories/:parentId/subcategories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parentId } = req.params;
    const subcategories = await categoryService.getSubcategories(parentId, false); // Only active
    res.json({ categories: subcategories });
  } catch (error) {
    next(error);
  }
});

export { router as publicCategoryRoutes };

