-- Supabase SQL Editor friendly load script (no \copy)
-- Step 0: Use Supabase Table Editor to import CSVs into these temp tables:
--   tmp_catalog_units (from catalog_units.csv)
--   tmp_catalog_categories (from catalog_categories.csv)
--   tmp_catalog_items (from catalog_items.csv)

BEGIN;

-- 1) Create temp tables (run once)
CREATE TEMP TABLE IF NOT EXISTS tmp_catalog_units (
  code TEXT,
  name TEXT,
  symbol TEXT,
  unit_type TEXT
);

CREATE TEMP TABLE IF NOT EXISTS tmp_catalog_categories (
  code TEXT,
  name TEXT,
  parent_code TEXT,
  level INTEGER,
  display_order INTEGER,
  source TEXT
);

CREATE TEMP TABLE IF NOT EXISTS tmp_catalog_items (
  category TEXT,
  subcategory TEXT,
  item_group TEXT,
  item_name TEXT,
  unit TEXT,
  description TEXT,
  tags TEXT,
  source TEXT
);

-- 2) Insert units
INSERT INTO catalog_units (code, name, symbol, unit_type)
SELECT code, name, symbol, unit_type
FROM tmp_catalog_units
ON CONFLICT (code) DO NOTHING;

-- 3) Insert categories (L1 -> L3)
INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
SELECT code, name, NULL, level, display_order, source
FROM tmp_catalog_categories
WHERE parent_code IS NULL OR parent_code = '';

INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
SELECT child.code, child.name, parent.id, child.level, child.display_order, child.source
FROM tmp_catalog_categories child
JOIN catalog_categories parent ON parent.code = child.parent_code
WHERE child.parent_code IS NOT NULL AND child.parent_code != '';

-- 4) Insert catalog items
WITH category_map AS (
  SELECT
    c3.id AS category_id,
    c1.name AS category,
    c2.name AS subcategory,
    c3.name AS item_group
  FROM catalog_categories c1
  JOIN catalog_categories c2 ON c2.parent_id = c1.id
  JOIN catalog_categories c3 ON c3.parent_id = c2.id
)
INSERT INTO catalog_items (name, unit_code, category_id, description, tags, source)
SELECT
  t.item_name,
  t.unit,
  cm.category_id,
  NULLIF(t.description, ''),
  CASE
    WHEN t.tags IS NULL OR t.tags = '' THEN '{}'::text[]
    ELSE string_to_array(t.tags, ';')
  END,
  t.source
FROM tmp_catalog_items t
JOIN category_map cm
  ON cm.category = t.category
 AND cm.subcategory = t.subcategory
 AND cm.item_group = t.item_group;

COMMIT;
