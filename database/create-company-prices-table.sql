-- Create company_prices table if it doesn't exist
-- This table stores company-specific pricing for products

CREATE TABLE IF NOT EXISTS company_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  company_id UUID NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_company_prices_product 
    FOREIGN KEY (product_id) 
    REFERENCES products(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_company_prices_company 
    FOREIGN KEY (company_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE,
  
  -- Unique constraint: one price per product-company-effectiveFrom
  CONSTRAINT unique_product_company_effective_from 
    UNIQUE (product_id, company_id, effective_from)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_prices_product_id ON company_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_company_prices_company_id ON company_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_company_prices_effective_from ON company_prices(effective_from);

-- Add comment
COMMENT ON TABLE company_prices IS 'Company-specific pricing for products. Allows suppliers to offer special prices to specific companies.';
