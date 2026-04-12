-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS "categories_name_idx" ON "categories"("name");

