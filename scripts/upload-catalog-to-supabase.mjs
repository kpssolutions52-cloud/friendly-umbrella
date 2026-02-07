import fs from "fs";
import path from "path";
import { Client } from "pg";

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL env var.");
  process.exit(1);
}

const shouldReset = process.argv.includes("--reset");
const catalogDir = path.resolve("database/catalog");

const files = {
  units: path.join(catalogDir, "catalog_units.csv"),
  categories: path.join(catalogDir, "catalog_categories.csv"),
  items: path.join(catalogDir, "catalog_items.csv"),
};

Object.entries(files).forEach(([key, file]) => {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${key} file: ${file}`);
    process.exit(1);
  }
});

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

function loadCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return parseCsv(content);
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const units = loadCsv(files.units);
  const categories = loadCsv(files.categories);
  const items = loadCsv(files.items);

  try {
    await client.query("BEGIN");

    if (shouldReset) {
      await client.query('UPDATE "products" SET "category_id" = NULL');
      await client.query('UPDATE "products" SET "catalog_item_id" = NULL');
      await client.query('TRUNCATE TABLE "catalog_item_synonyms" RESTART IDENTITY CASCADE');
      await client.query('TRUNCATE TABLE "catalog_items" RESTART IDENTITY CASCADE');
      await client.query('TRUNCATE TABLE "catalog_categories" RESTART IDENTITY CASCADE');
    }

    for (const batch of chunk(units, 200)) {
      const values = [];
      const placeholders = batch.map((row, index) => {
        const base = index * 4;
        values.push(row.code, row.name, row.symbol, row.unit_type);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      });
      await client.query(
        `INSERT INTO catalog_units (code, name, symbol, unit_type)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (code) DO NOTHING`,
        values
      );
    }

    const level1 = categories.filter((row) => !row.parent_code);
    const rest = categories.filter((row) => row.parent_code);

    for (const batch of chunk(level1, 200)) {
      const values = [];
      const placeholders = batch.map((row, index) => {
        const base = index * 5;
        values.push(row.code, row.name, Number(row.level), Number(row.display_order), row.source);
        return `($${base + 1}, $${base + 2}, NULL, $${base + 3}, $${base + 4}, $${base + 5})`;
      });
      await client.query(
        `INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (code) DO NOTHING`,
        values
      );
    }

    for (const row of rest) {
      const parent = await client.query(
        `SELECT id FROM catalog_categories WHERE code = $1`,
        [row.parent_code]
      );
      if (parent.rows.length === 0) {
        throw new Error(`Missing parent category code: ${row.parent_code}`);
      }
      await client.query(
        `INSERT INTO catalog_categories (code, name, parent_id, level, display_order, source)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO NOTHING`,
        [row.code, row.name, parent.rows[0].id, Number(row.level), Number(row.display_order), row.source]
      );
    }

    const categoryMapResult = await client.query(
      `SELECT c1.name AS category, c2.name AS subcategory, c3.name AS item_group, c3.id AS category_id
       FROM catalog_categories c1
       JOIN catalog_categories c2 ON c2.parent_id = c1.id
       JOIN catalog_categories c3 ON c3.parent_id = c2.id`
    );
    const categoryMap = new Map(
      categoryMapResult.rows.map((row) => [
        `${row.category}|||${row.subcategory}|||${row.item_group}`,
        row.category_id,
      ])
    );

    for (const batch of chunk(items, 200)) {
      const values = [];
      const placeholders = batch.map((row, index) => {
        const key = `${row.category}|||${row.subcategory}|||${row.item_group}`;
        const categoryId = categoryMap.get(key);
        if (!categoryId) {
          throw new Error(`Missing category mapping for ${key}`);
        }
        const tags =
          row.tags && row.tags.length > 0
            ? row.tags.split(";").map((tag) => tag.trim()).filter(Boolean)
            : [];
        const base = index * 6;
        values.push(row.item_name, row.unit, categoryId, row.description || null, tags, row.source);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      });

      await client.query(
        `INSERT INTO catalog_items (name, unit_code, category_id, description, tags, source)
         VALUES ${placeholders.join(",")}
         ON CONFLICT DO NOTHING`,
        values
      );
    }

    await client.query("COMMIT");
    console.log(`Uploaded ${units.length} units, ${categories.length} categories, ${items.length} items.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
