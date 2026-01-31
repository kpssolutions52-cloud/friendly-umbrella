# MVP 1 Database Setup Guide

## ⚠️ IMPORTANT: Backup First!

**Before running any migration scripts, backup your database!**

```bash
# Create a full database backup
pg_dump -h your_host -U your_user -d your_database -F c -f backup_before_mvp1_$(date +%Y%m%d_%H%M%S).dump
```

## Current Database State

Your database likely has:
- `tenants` table (old structure)
- `users` table (old structure with tenant_id)
- `products` table (old structure)

## MVP 1 Required Tables

MVP 1 needs:
- `organizations` table (replaces `tenants`)
- `users` table (updated structure with `organization_id` and `type` enum)
- `products` table (simplified structure)
- `company_prices` table (for company-specific pricing)
- Plus all the quote workflow tables (already in schema)

## Migration Options

### Option 1: Fresh Start (Recommended for Testing)

If you're starting fresh or can lose existing data:

```sql
-- 1. Drop existing tables (if they exist)
DROP TABLE IF EXISTS company_prices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 2. Create new schema using Prisma
cd packages/backend
npx prisma db push
```

### Option 2: Migrate Existing Data (Production)

If you have existing data to preserve:

**Step 1: Backup Existing Data**
```bash
psql -d your_database -f database/migration-01-backup-existing-data.sql
```

This creates backup tables:
- `tenants_backup`
- `users_backup`
- `products_backup`

**Step 2: Create New Schema**
```bash
psql -d your_database -f database/migration-02-create-new-schema.sql
```

**Step 3: Migrate Data**
```bash
psql -d your_database -f database/migration-03-migrate-data.sql
```

**Step 4: Swap Tables (Production)**
```bash
psql -d your_database -f database/migration-04-swap-tables.sql
```

**Step 5: Update Prisma Client**
```bash
cd packages/backend
npx prisma generate
```

## Quick Setup for MVP 1 (Fresh Database)

If you're setting up a fresh database for MVP 1:

```bash
# 1. Navigate to backend
cd packages/backend

# 2. Make sure DATABASE_URL is set in .env
# DATABASE_URL="postgresql://user:password@host:port/database"

# 3. Push schema to database
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Verify tables were created
npx prisma studio
```

## Verify Setup

After migration, verify tables exist:

```sql
-- Check organizations table
SELECT COUNT(*) FROM organizations;

-- Check users table
SELECT type, COUNT(*) FROM users GROUP BY type;

-- Check products table
SELECT COUNT(*) FROM products;

-- Check company_prices table
SELECT COUNT(*) FROM company_prices;
```

## Required Enums

Make sure these enums exist:

```sql
-- Check if enums exist
SELECT typname FROM pg_type WHERE typname IN ('org_type', 'user_type', 'project_status', 'quote_status', 'quote_request_status', 'quote_response_status', 'negotiation_status', 'order_status', 'delivery_status', 'quality_status', 'certificate_type', 'certificate_status', 'payment_status');

-- If missing, create them (Prisma should create these automatically)
```

## MVP 1 Specific Tables

For MVP 1, you need these core tables:

1. **organizations** - Companies and Suppliers
2. **users** - QS and Supplier users
3. **products** - Supplier products
4. **company_prices** - Company-specific pricing

All other tables (projects, quotes, orders, etc.) are for future MVP phases but are already in the schema.

## Troubleshooting

### Error: Table already exists
**Solution:** The table might be from old schema. Check if you need to migrate or drop first.

### Error: Enum type does not exist
**Solution:** Run `npx prisma db push` to create all enums automatically.

### Error: Foreign key constraint fails
**Solution:** Make sure you create tables in order: organizations → users → products → company_prices

### Need to Rollback
**Solution:** If you used migration scripts, run:
```bash
psql -d your_database -f database/migration-rollback.sql
```

## Next Steps After Database Setup

1. ✅ Verify tables exist
2. ✅ Test registration: Create a QS user and Supplier user
3. ✅ Test product creation: Supplier adds products
4. ✅ Test AI chat: QS asks for prices
5. ✅ Test price updates: Supplier updates via chat

## Safety Checklist

- [ ] Database backup created
- [ ] Migration scripts reviewed
- [ ] Prisma schema matches database
- [ ] Prisma client generated
- [ ] Test registration works
- [ ] Test chat works
- [ ] Test product management works
