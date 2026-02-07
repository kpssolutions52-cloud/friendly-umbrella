import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/catalog/categories - Get all catalog categories with hierarchy
router.get(
  '/catalog/categories',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const categories = await prisma.$queryRaw<Array<{
        id: string;
        code: string;
        name: string;
        parent_id: string | null;
        level: number;
        display_order: number;
        parent_name: string | null;
        parent_code: string | null;
      }>>`
        SELECT 
          c.id,
          c.code,
          c.name,
          c.parent_id,
          c.level,
          c.display_order,
          p.name as parent_name,
          p.code as parent_code
        FROM catalog_categories c
        LEFT JOIN catalog_categories p ON c.parent_id = p.id
        WHERE c.is_active = true
        ORDER BY c.level, c.display_order, c.name
      `;

      res.json({ categories });
    } catch (error: any) {
      console.error('Error fetching catalog categories:', error);
      res.status(500).json({ error: { message: 'Failed to fetch categories', statusCode: 500 } });
    }
  }
);

// GET /api/v1/catalog/items - Get catalog items with category hierarchy
router.get(
  '/catalog/items',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { categoryId, search } = req.query;

      let query = `
        SELECT 
          ci.id,
          ci.code,
          ci.name,
          ci.unit_code,
          cu.name as unit_name,
          cu.symbol as unit_symbol,
          ci.category_id,
          c3.name as category_name,
          c3.code as category_code,
          c2.name as subcategory_name,
          c2.code as subcategory_code,
          c1.name as main_category_name,
          c1.code as main_category_code,
          ci.description,
          ci.tags
        FROM catalog_items ci
        JOIN catalog_units cu ON ci.unit_code = cu.code
        JOIN catalog_categories c3 ON ci.category_id = c3.id
        LEFT JOIN catalog_categories c2 ON c3.parent_id = c2.id
        LEFT JOIN catalog_categories c1 ON c2.parent_id = c1.id
        WHERE ci.is_active = true
      `;

      const params: any[] = [];

      if (categoryId) {
        query += ` AND ci.category_id = $${params.length + 1}`;
        params.push(categoryId);
      }

      if (search) {
        query += ` AND (ci.name ILIKE $${params.length + 1} OR ci.description ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY c1.display_order, c2.display_order, c3.display_order, ci.name`;

      const items = await prisma.$queryRawUnsafe<Array<{
        id: string;
        code: string | null;
        name: string;
        unit_code: string;
        unit_name: string;
        unit_symbol: string;
        category_id: string;
        category_name: string;
        category_code: string;
        subcategory_name: string | null;
        subcategory_code: string | null;
        main_category_name: string | null;
        main_category_code: string | null;
        description: string | null;
        tags: string[];
      }>>(query, ...params);

      res.json({ items });
    } catch (error: any) {
      console.error('Error fetching catalog items:', error);
      res.status(500).json({ error: { message: 'Failed to fetch items', statusCode: 500 } });
    }
  }
);

// GET /api/v1/catalog/supplier-items - Get supplier's products mapped to catalog items
router.get(
  '/catalog/supplier-items',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.tenantId) {
        return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
      }

      const supplierItems = await prisma.$queryRawUnsafe<Array<{
        product_id: string;
        product_name: string;
        product_sku: string;
        catalog_item_id: string | null;
        catalog_item_name: string | null;
        category_id: string | null;
        category_name: string | null;
        category_code: string | null;
        subcategory_name: string | null;
        subcategory_code: string | null;
        main_category_name: string | null;
        main_category_code: string | null;
        unit: string;
        stock_availability: string | null;
        default_price: number | null;
        currency: string | null;
      }>>(`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.sku as product_sku,
          p.catalog_item_id,
          ci.name as catalog_item_name,
          p.category_id,
          c3.name as category_name,
          c3.code as category_code,
          c2.name as subcategory_name,
          c2.code as subcategory_code,
          c1.name as main_category_name,
          c1.code as main_category_code,
          p.unit,
          p.stock_availability,
          dp.price as default_price,
          dp.currency
        FROM products p
        LEFT JOIN catalog_items ci ON p.catalog_item_id = ci.id
        LEFT JOIN catalog_categories c3 ON p.category_id = c3.id OR ci.category_id = c3.id
        LEFT JOIN catalog_categories c2 ON c3.parent_id = c2.id
        LEFT JOIN catalog_categories c1 ON c2.parent_id = c1.id
        LEFT JOIN LATERAL (
          SELECT price, currency
          FROM default_prices
          WHERE product_id = p.id
            AND is_active = true
            AND (effective_until IS NULL OR effective_until >= CURRENT_TIMESTAMP)
          ORDER BY effective_from DESC
          LIMIT 1
        ) dp ON true
        WHERE p.supplier_id = $1
        ORDER BY c1.display_order NULLS LAST, c2.display_order NULLS LAST, c3.display_order NULLS LAST, p.name
      `, req.tenantId);

      res.json({ items: supplierItems });
    } catch (error: any) {
      console.error('Error fetching supplier catalog items:', error);
      res.status(500).json({ error: { message: 'Failed to fetch supplier items', statusCode: 500 } });
    }
  }
);

export default router;
