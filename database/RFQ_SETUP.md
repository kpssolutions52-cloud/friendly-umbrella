# RFQ (Request for Quote) Database Setup

This document provides SQL queries to create the necessary database tables for the RFQ feature.

## Tables Required

The RFQ system requires the following database tables:

1. **QuoteStatus Enum** - Defines the status of quote requests
2. **quote_requests** - Stores RFQ submissions from companies
3. **quote_responses** - Stores supplier responses to RFQs

## Execution Order

Execute these SQL scripts in order:

1. **20-create-quote-status-enum.sql** - Create QuoteStatus enum
2. **21-create-quote-requests.sql** - Create quote_requests table
3. **22-create-quote-responses.sql** - Create quote_responses table

## Prerequisites

These tables depend on existing tables:
- `tenants` (for companies and suppliers)
- `users` (for requested_by and responded_by)
- `products` (for product_id reference)

Make sure you have already run:
- 01-create-enums.sql
- 02-create-tenants.sql
- 03-create-users.sql
- 04-create-products.sql

## Quick Setup

### Option 1: Run Individual Files

```bash
# In Supabase SQL Editor or psql
psql "your-connection-string" -f database/20-create-quote-status-enum.sql
psql "your-connection-string" -f database/21-create-quote-requests.sql
psql "your-connection-string" -f database/22-create-quote-responses.sql
```

### Option 2: Run All at Once

```sql
-- Copy and paste all three files in order in your SQL editor
```

## Verification

After running the scripts, verify the tables were created:

```sql
-- Check if enum exists
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'QuoteStatus');

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('quote_requests', 'quote_responses')
ORDER BY table_name;

-- Check table structure
\d quote_requests
\d quote_responses
```

## Table Relationships

```
tenants (company)
    └── quote_requests (company_id)
            │
            ├── products (product_id)
            │
            ├── tenants (supplier_id)
            │
            ├── users (requested_by)
            │
            └── quote_responses
                    │
                    └── users (responded_by)
```

## Notes

- **General RFQs**: For RFQs that are not product-specific, the system uses a placeholder product with SKU `GENERAL-RFQ-PLACEHOLDER`. This placeholder product is automatically created when needed.

- **Message Field**: The `message` field in `quote_requests` stores RFQ details in a structured format:
  ```
  RFQ: [Title]
  
  [Description]
  
  Category: [Category]
  ```

- **Status Flow**: 
  - `pending` → Initial state when RFQ is created
  - `responded` → When supplier submits a response
  - `accepted` → When company accepts a quote
  - `rejected` → When company rejects a quote
  - `expired` → When RFQ expires
  - `cancelled` → When company cancels the RFQ
