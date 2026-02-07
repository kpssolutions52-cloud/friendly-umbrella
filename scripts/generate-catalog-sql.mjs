import fs from "fs";
import path from "path";

const catalogDir = path.resolve("database/catalog");
const outputFile = path.resolve("database/28-load-catalog-inserts.sql");

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeSql(str) {
  if (str === null || str === undefined) return "NULL";
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function escapeSqlArray(arr) {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]";
  return "ARRAY[" + arr.map((v) => escapeSql(v)).join(",") + "]";
}

const units = parseCsv(fs.readFileSync(path.join(catalogDir, "catalog_units.csv"), "utf8"));
const categories = parseCsv(fs.readFileSync(path.join(catalogDir, "catalog_categories.csv"), "utf8"));
const items = parseCsv(fs.readFileSync(path.join(catalogDir, "catalog_items.csv"), "utf8"));

let sql = `-- Generated SQL script to load catalog data
-- Run this in Supabase SQL Editor

BEGIN;

-- Reset existing data (optional - comment out if you want to keep existing)
UPDATE "products" SET "category_id" = NULL;
UPDATE "products" SET "catalog_item_id" = NULL;
TRUNCATE TABLE "catalog_item_synonyms" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "catalog_items" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "catalog_categories" RESTART IDENTITY CASCADE;

-- Insert Units
INSERT INTO catalog_units (code, name, symbol, unit_type) VALUES
${units.map((u) => `(${escapeSql(u.code)}, ${escapeSql(u.name)}, ${escapeSql(u.symbol)}, ${escapeSql(u.unit_type || "")})`).join(",\n")}
ON CONFLICT (code) DO NOTHING;

-- Insert Level 1 Categories (no parent)
${(() => {
  const level1 = categories.filter((c) => !c.parent_code);
  return `INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source) VALUES
${level1.map((c) => `(${escapeSql(c.code)}, ${escapeSql(c.name)}, NULL, ${Number(c.level)}, ${Number(c.display_order)}, ${escapeSql(c.source || "")})`).join(",\n")}
ON CONFLICT (code) DO NOTHING;`;
})()}

-- Insert Level 2 Categories (parent = Level 1)
${(() => {
  const level2 = categories.filter((c) => c.parent_code && categories.find((p) => p.code === c.parent_code && !p.parent_code));
  return `INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
SELECT ${escapeSql(level2[0]?.code || "")}, ${escapeSql(level2[0]?.name || "")}, 
       (SELECT id FROM catalog_categories WHERE code = ${escapeSql(level2[0]?.parent_code || "")}),
       ${Number(level2[0]?.level || 0)}, ${Number(level2[0]?.display_order || 0)}, ${escapeSql(level2[0]?.source || "")}
WHERE NOT EXISTS (SELECT 1 FROM catalog_categories WHERE code = ${escapeSql(level2[0]?.code || "")})
${level2.slice(1).map((c) => `
UNION ALL
SELECT ${escapeSql(c.code)}, ${escapeSql(c.name)}, 
       (SELECT id FROM catalog_categories WHERE code = ${escapeSql(c.parent_code)}),
       ${Number(c.level)}, ${Number(c.display_order)}, ${escapeSql(c.source || "")}
WHERE NOT EXISTS (SELECT 1 FROM catalog_categories WHERE code = ${escapeSql(c.code)})`).join("")};
`;
})()}

-- Insert Level 3 Categories (parent = Level 2)
${(() => {
  const level3 = categories.filter((c) => {
    const parent = categories.find((p) => p.code === c.parent_code);
    return parent && parent.parent_code;
  });
  return `INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
SELECT ${escapeSql(level3[0]?.code || "")}, ${escapeSql(level3[0]?.name || "")}, 
       (SELECT id FROM catalog_categories WHERE code = ${escapeSql(level3[0]?.parent_code || "")}),
       ${Number(level3[0]?.level || 0)}, ${Number(level3[0]?.display_order || 0)}, ${escapeSql(level3[0]?.source || "")}
WHERE NOT EXISTS (SELECT 1 FROM catalog_categories WHERE code = ${escapeSql(level3[0]?.code || "")})
${level3.slice(1).map((c) => `
UNION ALL
SELECT ${escapeSql(c.code)}, ${escapeSql(c.name)}, 
       (SELECT id FROM catalog_categories WHERE code = ${escapeSql(c.parent_code)}),
       ${Number(c.level)}, ${Number(c.display_order)}, ${escapeSql(c.source || "")}
WHERE NOT EXISTS (SELECT 1 FROM catalog_categories WHERE code = ${escapeSql(c.code)})`).join("")};
`;
})()}

-- Insert Missing Level 3 Categories (for item_groups that don't exist) and Catalog Items
${(() => {
  // Build itemGroups map from existing categories
  const itemGroups = new Map();
  categories.forEach((c) => {
    if (c.level === "3") {
      const parent2 = categories.find((p) => p.code === c.parent_code);
      const parent1 = parent2 ? categories.find((p) => p.code === parent2.parent_code) : null;
      if (parent1 && parent2) {
        const key = `${parent1.name}|||${parent2.name}|||${c.name}`;
        itemGroups.set(key, c.code);
      }
    }
  });

  // Find missing item groups and create category codes for them
  const missingCategories = [];
  const seenKeys = new Set();
  const generatedCodes = new Map(); // Track generated codes per parent to avoid duplicates
  
  items.forEach((item) => {
    const key = `${item.category}|||${item.subcategory}|||${item.item_group}`;
    if (!itemGroups.has(key) && !seenKeys.has(key)) {
      seenKeys.add(key);
      const parent1 = categories.find((c) => !c.parent_code && c.name === item.category);
      const parent2 = parent1 ? categories.find((c) => c.parent_code === parent1.code && c.name === item.subcategory) : null;
      
      if (parent1 && parent2) {
        // Get existing children from CSV
        const existingChildren = categories.filter((c) => c.parent_code === parent2.code);
        const maxCode = existingChildren
          .map((c) => {
            const match = c.code.match(/-(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          })
          .reduce((max, n) => Math.max(max, n), 0);
        
        // Track generated codes for this parent
        if (!generatedCodes.has(parent2.code)) {
          generatedCodes.set(parent2.code, maxCode);
        }
        
        // Increment for this new category
        const nextCode = generatedCodes.get(parent2.code) + 1;
        generatedCodes.set(parent2.code, nextCode);
        
        const newCode = `${parent2.code}-${String(nextCode).padStart(2, "0")}`;
        missingCategories.push({
          code: newCode,
          name: item.item_group,
          parent_code: parent2.code,
          level: 3,
          display_order: nextCode,
          source: item.source || categories.find((c) => c.code === parent2.code)?.source || ""
        });
        itemGroups.set(key, newCode);
      }
    }
  });

  // Generate SQL for missing categories
  const missingCategoriesSql = missingCategories.length > 0
    ? `-- Auto-create missing level 3 categories for item groups
INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source) VALUES
${missingCategories.map((c) => `(${escapeSql(c.code)}, ${escapeSql(c.name)}, 
       (SELECT id FROM catalog_categories WHERE code = ${escapeSql(c.parent_code)}),
       ${c.level}, ${c.display_order}, ${escapeSql(c.source)})`).join(",\n")}
ON CONFLICT (code) DO NOTHING;
`
    : "";

  // Generate SQL for items
  const inserts = items.map((item) => {
    const key = `${item.category}|||${item.subcategory}|||${item.item_group}`;
    let categoryCode = itemGroups.get(key);
    
    // Fallback: if still not found, use parent subcategory
    if (!categoryCode) {
      const parent1 = categories.find((c) => !c.parent_code && c.name === item.category);
      const parent2 = parent1 ? categories.find((c) => c.parent_code === parent1.code && c.name === item.subcategory) : null;
      if (parent2) {
        categoryCode = parent2.code;
        console.warn(`Using parent category for item: ${key} -> ${categoryCode}`);
      } else {
        console.warn(`Missing category for item: ${key}`);
        return null;
      }
    }
    
    const tags = item.tags && item.tags.length > 0
      ? item.tags.split(";").map((t) => t.trim()).filter(Boolean)
      : [];
    return `(${escapeSql(item.item_name)}, ${escapeSql(item.unit)}, 
       (SELECT id FROM catalog_categories WHERE code = ${escapeSql(categoryCode)}),
       ${escapeSql(item.description || "")}, ${escapeSqlArray(tags)}, ${escapeSql(item.source || "")})`;
  }).filter(Boolean);

  const itemsSql = `INSERT INTO catalog_items (name, unit_code, category_id, description, tags, source) VALUES
${inserts.join(",\n")}
ON CONFLICT DO NOTHING;`;

  return missingCategoriesSql + itemsSql;
})()}

COMMIT;

-- Verification
SELECT 
  (SELECT COUNT(*) FROM catalog_units) as units_count,
  (SELECT COUNT(*) FROM catalog_categories) as categories_count,
  (SELECT COUNT(*) FROM catalog_items) as items_count;
`;

fs.writeFileSync(outputFile, sql);
console.log(`Generated SQL file: ${outputFile}`);
console.log(`Contains ${units.length} units, ${categories.length} categories, ${items.length} items`);
console.log(`\nYou can now copy and paste this file into Supabase SQL Editor to load the catalog.`);
