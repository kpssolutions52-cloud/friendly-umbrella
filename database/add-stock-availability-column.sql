-- Add stock_availability column to products table
-- This field allows suppliers to track stock availability for their products
-- Can be updated via AI chat or manual updates

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_availability VARCHAR(100);

-- Add comment
COMMENT ON COLUMN products.stock_availability IS 'Stock availability status or quantity info. Common values: "in_stock", "out_of_stock", "low_stock", or specific quantity/status information.';

-- Create index for filtering by stock availability
CREATE INDEX IF NOT EXISTS idx_products_stock_availability ON products(stock_availability) WHERE stock_availability IS NOT NULL;
