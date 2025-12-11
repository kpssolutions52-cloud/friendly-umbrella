import { Router, Request, Response, NextFunction } from 'express';
import { serviceCategoryService } from '../services/serviceCategoryService';

const router = Router();

// GET /api/v1/service-categories - Get all active service categories (hierarchical) - Public endpoint
router.get('/service-categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await serviceCategoryService.getAllCategories(false); // Only active categories
    res.json({ categories });
  } catch (error: any) {
    // Return empty array if table doesn't exist (graceful degradation)
    if (error.code === 'P2021' || error.code === '42P01') {
      console.warn('ServiceCategory table not found, returning empty array');
      return res.json({ categories: [] });
    }
    next(error);
  }
});

// GET /api/v1/service-categories/flat - Get flat list of service categories for dropdowns - Public endpoint
router.get('/service-categories/flat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await serviceCategoryService.getFlatCategories(false); // Only active categories
    res.json({ categories });
  } catch (error: any) {
    if (error.code === 'P2021' || error.code === '42P01') {
      console.warn('ServiceCategory table not found, returning empty array');
      return res.json({ categories: [] });
    }
    next(error);
  }
});

// GET /api/v1/service-categories/main - Get only main service categories - Public endpoint
router.get('/service-categories/main', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await serviceCategoryService.getMainCategories(false); // Only active categories
    res.json({ categories });
  } catch (error: any) {
    console.error('Error in /service-categories/main endpoint:', error);
    // Return empty array if table doesn't exist (graceful degradation)
    if (error.code === 'P2021' || error.code === '42P01') {
      console.warn('ServiceCategory table not found, returning empty array');
      return res.json({ categories: [] });
    }
    next(error);
  }
});

// GET /api/v1/service-categories/:parentId/subcategories - Get subcategories for a main service category - Public endpoint
router.get('/service-categories/:parentId/subcategories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parentId } = req.params;
    const subcategories = await serviceCategoryService.getSubcategories(parentId, false); // Only active
    res.json({ categories: subcategories });
  } catch (error: any) {
    if (error.code === 'P2021' || error.code === '42P01') {
      console.warn('ServiceCategory table not found, returning empty array');
      return res.json({ categories: [] });
    }
    next(error);
  }
});

export { router as publicServiceCategoryRoutes };
