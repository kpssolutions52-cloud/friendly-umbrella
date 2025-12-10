-- Script 16: Insert Product Categories
-- This script inserts 13 main categories and their subcategories into product_categories table
-- Run this after 15-update-product-categories.sql

BEGIN;

-- ============================================
-- Insert Main Categories
-- ============================================

-- Main Category 1: Cement & Concrete Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Cement & Concrete Materials',
    'Cement, concrete, and related materials',
    NULL,
    true,
    0,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 0,
    "updated_at" = NOW();

-- Main Category 2: Steel & Metal Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Steel & Metal Materials',
    'Steel and metal construction materials',
    NULL,
    true,
    1,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 1,
    "updated_at" = NOW();

-- Main Category 3: Bricks, Blocks & Masonry
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Bricks, Blocks & Masonry',
    'Bricks, blocks, and masonry products',
    NULL,
    true,
    2,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 2,
    "updated_at" = NOW();

-- Main Category 4: Timber & Wood Products
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Timber & Wood Products',
    'Timber and wood-based products',
    NULL,
    true,
    3,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 3,
    "updated_at" = NOW();

-- Main Category 5: Roofing Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Roofing Materials',
    'Roofing materials and accessories',
    NULL,
    true,
    4,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 4,
    "updated_at" = NOW();

-- Main Category 6: Plumbing & Sanitary
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Plumbing & Sanitary',
    'Plumbing and sanitary products',
    NULL,
    true,
    5,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 5,
    "updated_at" = NOW();

-- Main Category 7: Electrical Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Electrical Materials',
    'Electrical materials and components',
    NULL,
    true,
    6,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 6,
    "updated_at" = NOW();

-- Main Category 8: Flooring Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Flooring Materials',
    'Flooring materials and products',
    NULL,
    true,
    7,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 7,
    "updated_at" = NOW();

-- Main Category 9: Paints & Finishing Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Paints & Finishing Materials',
    'Paints and finishing materials',
    NULL,
    true,
    8,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 8,
    "updated_at" = NOW();

-- Main Category 10: Glass, Windows & Doors
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Glass, Windows & Doors',
    'Glass, windows, and door products',
    NULL,
    true,
    9,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 9,
    "updated_at" = NOW();

-- Main Category 11: Hardware & Tools
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Hardware & Tools',
    'Hardware and construction tools',
    NULL,
    true,
    10,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 10,
    "updated_at" = NOW();

-- Main Category 12: Waterproofing & Insulation
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Waterproofing & Insulation',
    'Waterproofing and insulation materials',
    NULL,
    true,
    11,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 11,
    "updated_at" = NOW();

-- Main Category 13: Landscaping & Outdoor Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES (
    COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL), gen_random_uuid()::text),
    'Landscaping & Outdoor Materials',
    'Landscaping and outdoor construction materials',
    NULL,
    true,
    12,
    COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL), NOW()),
    NOW()
)
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "description" = EXCLUDED.description,
    "is_active" = true,
    "display_order" = 12,
    "updated_at" = NOW();

-- ============================================
-- Insert Subcategories
-- ============================================

-- Subcategories for Cement & Concrete Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Cement' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Cement', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Cement' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Ready-mix concrete' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Ready-mix concrete', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Ready-mix concrete' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Sand, gravel, aggregates' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Sand, gravel, aggregates', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Sand, gravel, aggregates' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Mortar mix, plaster mix' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Mortar mix, plaster mix', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Mortar mix, plaster mix' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Cement & Concrete Materials' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Steel & Metal Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Reinforcement steel (rebar)' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Reinforcement steel (rebar)', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Reinforcement steel (rebar)' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Structural steel (I-beam, H-beam, channels, angles)' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Structural steel (I-beam, H-beam, channels, angles)', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Structural steel (I-beam, H-beam, channels, angles)' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Steel plates, sheets' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Steel plates, sheets', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Steel plates, sheets' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'GI sheets' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'GI sheets', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'GI sheets' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Steel & Metal Materials' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Bricks, Blocks & Masonry
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Clay bricks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Clay bricks', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Clay bricks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Cement blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Cement blocks', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Cement blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'AAC blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'AAC blocks', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'AAC blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Paving blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Paving blocks', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Paving blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Stone / masonry blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Stone / masonry blocks', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL), true, 4, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Stone / masonry blocks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Bricks, Blocks & Masonry' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Timber & Wood Products
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Timber / lumber' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Timber / lumber', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Timber / lumber' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Plywood' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Plywood', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Plywood' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'MDF, chipboard' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'MDF, chipboard', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'MDF, chipboard' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Formwork wood' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Formwork wood', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Formwork wood' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Doors / frames' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Doors / frames', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL), true, 4, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Doors / frames' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Timber & Wood Products' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Roofing Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Roof sheets (metal, zinc, GI, aluminum)' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Roof sheets (metal, zinc, GI, aluminum)', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Roof sheets (metal, zinc, GI, aluminum)' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Roof tiles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Roof tiles', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Roof tiles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Shingles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Shingles', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Shingles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Purlins' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Purlins', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Purlins' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Roofing Materials' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Plumbing & Sanitary
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'PVC pipes & fittings' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'PVC pipes & fittings', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'PVC pipes & fittings' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'GI pipes' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'GI pipes', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'GI pipes' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Water tanks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Water tanks', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Water tanks' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Taps, sinks, WC, bathroom items' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Taps, sinks, WC, bathroom items', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Taps, sinks, WC, bathroom items' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Plumbing & Sanitary' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Electrical Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Cables & wiring' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Cables & wiring', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Cables & wiring' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Switches, sockets' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Switches, sockets', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Switches, sockets' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Breakers, DB box' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Breakers, DB box', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Breakers, DB box' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Conduits, trunking' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Conduits, trunking', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Conduits, trunking' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Electrical Materials' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Flooring Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Floor tiles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Floor tiles', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Floor tiles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Ceramic / porcelain tiles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Ceramic / porcelain tiles', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Ceramic / porcelain tiles' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Vinyl flooring' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Vinyl flooring', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Vinyl flooring' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Wood flooring' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Wood flooring', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Wood flooring' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Flooring Materials' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Paints & Finishing Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Paint, primer, putty' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Paint, primer, putty', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Paint, primer, putty' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Varnish' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Varnish', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Varnish' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Adhesives & chemicals' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Adhesives & chemicals', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Adhesives & chemicals' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Paints & Finishing Materials' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Glass, Windows & Doors
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Glass panels' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Glass panels', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Glass panels' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Aluminum frames' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Aluminum frames', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Aluminum frames' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Doors, windows' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Doors, windows', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Doors, windows' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Shower screens' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Shower screens', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Shower screens' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Glass, Windows & Doors' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Hardware & Tools
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Nails, screws, bolts' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Nails, screws, bolts', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Nails, screws, bolts' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Hand tools' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Hand tools', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Hand tools' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Power tools' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Power tools', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Power tools' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Safety gear' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Safety gear', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Safety gear' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Hardware & Tools' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Waterproofing & Insulation
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Membranes' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Membranes', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Membranes' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproof coatings' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Waterproof coatings', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Waterproof coatings' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Insulation boards' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Insulation boards', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Insulation boards' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Rockwool / glasswool' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Rockwool / glasswool', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL), true, 3, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Rockwool / glasswool' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Waterproofing & Insulation' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

-- Subcategories for Landscaping & Outdoor Materials
INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
VALUES 
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Pavers' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Pavers', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL), true, 0, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Pavers' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Garden stones' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Garden stones', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL), true, 1, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Garden stones' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL)), NOW()), NOW()),
    (COALESCE((SELECT "id" FROM "product_categories" WHERE "name" = 'Fencing materials' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL)), gen_random_uuid()::text), 'Fencing materials', NULL, (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL), true, 2, COALESCE((SELECT "created_at" FROM "product_categories" WHERE "name" = 'Fencing materials' AND "parent_id" = (SELECT "id" FROM "product_categories" WHERE "name" = 'Landscaping & Outdoor Materials' AND "parent_id" IS NULL)), NOW()), NOW())
ON CONFLICT ("name", "parent_id") 
DO UPDATE SET 
    "is_active" = true,
    "display_order" = EXCLUDED.display_order,
    "updated_at" = NOW();

COMMIT;

-- Display summary
DO $$
DECLARE
    main_category_count INTEGER;
    subcategory_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO main_category_count FROM "product_categories" WHERE "parent_id" IS NULL;
    SELECT COUNT(*) INTO subcategory_count FROM "product_categories" WHERE "parent_id" IS NOT NULL;
    SELECT COUNT(*) INTO total_count FROM "product_categories";
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Product Categories Insert Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Main categories inserted: %', main_category_count;
    RAISE NOTICE 'Subcategories inserted: %', subcategory_count;
    RAISE NOTICE 'Total categories: %', total_count;
    RAISE NOTICE '========================================';
END $$;

