-- Load catalog data from CSV files (run in psql)
-- Example:
--   psql -f database/26-load-catalog-from-csv.sql

-- Adjust paths if running from a different working directory
\copy catalog_units(code, name, symbol, unit_type) FROM 'database/catalog/catalog_units.csv' WITH (FORMAT csv, HEADER true);

CREATE TEMP TABLE tmp_catalog_categories (
  code TEXT,
  name TEXT,
  parent_code TEXT,
  level INTEGER,
  display_order INTEGER,
  source TEXT
);

\copy tmp_catalog_categories(code, name, parent_code, level, display_order, source) FROM 'database/catalog/catalog_categories.csv' WITH (FORMAT csv, HEADER true);

-- Insert level 1 categories
INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
SELECT code, name, NULL, level, display_order, source
FROM tmp_catalog_categories
WHERE parent_code IS NULL OR parent_code = '';

-- Insert level 2 and 3 categories using parent_code mapping
INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
SELECT child.code, child.name, parent.id, child.level, child.display_order, child.source
FROM tmp_catalog_categories child
JOIN catalog_categories parent ON parent.code = child.parent_code
WHERE child.parent_code IS NOT NULL AND child.parent_code != '';

-- Map category codes to IDs and load items
CREATE TEMP TABLE tmp_catalog_items (
  category TEXT,
  subcategory TEXT,
  item_group TEXT,
  item_name TEXT,
  unit TEXT,
  description TEXT,
  tags TEXT,
  source TEXT
);

\copy tmp_catalog_items(category, subcategory, item_group, item_name, unit, description, tags, source) FROM 'database/catalog/catalog_items.csv' WITH (FORMAT csv, HEADER true);

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

DROP TABLE tmp_catalog_items;
DROP TABLE tmp_catalog_categories;
