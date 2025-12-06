# Database Setup Scripts

Execute these SQL scripts in order in your Supabase SQL Editor or PostgreSQL client.

## Execution Order

1. **01-create-enums.sql** - Create custom types/enums
2. **02-create-tenants.sql** - Create tenants table
3. **03-create-users.sql** - Create users table (depends on tenants)
4. **04-create-products.sql** - Create products table (depends on tenants)
5. **05-create-default-prices.sql** - Create default prices (depends on products)
6. **06-create-private-prices.sql** - Create private prices (depends on products and tenants)
7. **07-create-price-audit-log.sql** - Create audit log (depends on products and users)
8. **08-create-price-views.sql** - Create price views (depends on products, tenants, and users)

## How to Execute

### Option 1: Supabase SQL Editor
1. Go to Supabase Dashboard → Your Project
2. Click **SQL Editor** in the left sidebar
3. Copy and paste each script one by one
4. Click **Run** after each script

### Option 2: PostgreSQL Client (psql)
```bash
psql "your-connection-string" -f 01-create-enums.sql
psql "your-connection-string" -f 02-create-tenants.sql
# ... and so on
```

### Option 3: All at Once
If you want to run all scripts together:
```bash
cat database/*.sql | psql "your-connection-string"
```

## Verification

After running all scripts, verify the tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- tenants
- users
- products
- default_prices
- private_prices
- price_audit_log
- price_views

