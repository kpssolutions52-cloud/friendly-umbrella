# MVP 1 Quick Database Setup

## 🎯 Quick Answer

**Yes, we have backup scripts!** ✅

**For MVP 1, you have 2 options:**

### Option 1: Fresh Start (Recommended for Testing)
If you don't need existing data:

```bash
# 1. Check current database state
psql -d your_database -f database/check-db-state.sql

# 2. Create MVP 1 tables
psql -d your_database -f database/mvp1-setup.sql

# 3. Generate Prisma client
cd packages/backend
npx prisma generate
```

### Option 2: Migrate Existing Data (Production)
If you have existing data to preserve:

```bash
# 1. BACKUP FIRST (IMPORTANT!)
psql -d your_database -f database/migration-01-backup-existing-data.sql

# 2. Check backup was created
psql -d your_database -c "SELECT COUNT(*) FROM tenants_backup;"

# 3. Create new schema
psql -d your_database -f database/migration-02-create-new-schema.sql

# 4. Migrate data
psql -d your_database -f database/migration-03-migrate-data.sql

# 5. Swap tables (production)
psql -d your_database -f database/migration-04-swap-tables.sql

# 6. Generate Prisma client
cd packages/backend
npx prisma generate
```

## 📋 Scripts Available

### Backup Scripts ✅
- `migration-01-backup-existing-data.sql` - **BACKUP YOUR DATA FIRST!**
  - Creates: `tenants_backup`, `users_backup`, `products_backup`

### Setup Scripts
- `mvp1-setup.sql` - **Quick setup for MVP 1** (fresh database)
- `migration-02-create-new-schema.sql` - Create new tables
- `migration-03-migrate-data.sql` - Migrate existing data
- `migration-04-swap-tables.sql` - Swap old/new tables

### Utility Scripts
- `check-db-state.sql` - Check what tables exist in your database

## ⚠️ Important Notes

1. **ALWAYS backup first** if you have existing data
2. **Check database state** before running migrations
3. **Test in development** before production
4. **Keep backup tables** for at least 2 weeks

## 🚀 Recommended Flow

```bash
# Step 1: Check what you have
psql -d your_database -f database/check-db-state.sql

# Step 2: If you have data, backup it
psql -d your_database -f database/migration-01-backup-existing-data.sql

# Step 3: Setup MVP 1 tables
# Option A: Fresh start
psql -d your_database -f database/mvp1-setup.sql

# Option B: Migrate existing data
psql -d your_database -f database/migration-02-create-new-schema.sql
psql -d your_database -f database/migration-03-migrate-data.sql
psql -d your_database -f database/migration-04-swap-tables.sql

# Step 4: Generate Prisma client
cd packages/backend
npx prisma generate

# Step 5: Verify
psql -d your_database -c "SELECT COUNT(*) FROM organizations;"
psql -d your_database -c "SELECT COUNT(*) FROM users;"
psql -d your_database -c "SELECT COUNT(*) FROM products;"
```

## ✅ Verification

After setup, verify tables exist:

```sql
-- Should return counts > 0 if data exists
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'company_prices', COUNT(*) FROM company_prices;
```

## 🆘 Need Help?

- Check `database/MVP1_DATABASE_SETUP.md` for detailed guide
- Check `database/MIGRATION_README.md` for full migration process
- Run `check-db-state.sql` to see current state
