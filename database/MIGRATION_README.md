# Database Migration Guide - AI QS Assistant Transformation

## ⚠️ IMPORTANT: Read Before Running

This migration transforms the database from a complex multi-table schema to a simplified 3-table schema for the AI QS Assistant.

**Backup your database before starting!**

## Migration Steps (Run in Order)

### Step 1: Backup Existing Data
```bash
psql -d your_database -f migration-01-backup-existing-data.sql
```
**Purpose:** Creates backup tables with all current data
**Time:** ~1-5 minutes depending on data size

### Step 2: Create New Schema
```bash
psql -d your_database -f migration-02-create-new-schema.sql
```
**Purpose:** Creates new simplified tables (organizations, users_new, products_new)
**Time:** ~30 seconds

### Step 3: Migrate Data
```bash
psql -d your_database -f migration-03-migrate-data.sql
```
**Purpose:** Migrates data from old tables to new tables
**Time:** ~2-10 minutes depending on data size

### Step 4: Swap Tables (Production)
```bash
psql -d your_database -f migration-04-swap-tables.sql
```
**Purpose:** Makes new tables active, renames old tables as backup
**Time:** ~10 seconds
**⚠️ WARNING:** This is the point of no return. Old tables are renamed.

### Step 5: Cleanup (Optional - Later)
```bash
psql -d your_database -f migration-05-cleanup-optional.sql
```
**Purpose:** Removes old tables (only after full verification)
**Time:** ~30 seconds
**⚠️ WARNING:** Only run after verifying everything works!

## Rollback Instructions

If you need to rollback:

```bash
psql -d your_database -f migration-rollback.sql
```

This restores the old table names. You may need to restart your application.

## What Gets Migrated

### Organizations (from Tenants)
- ✅ Active suppliers → organizations (type='supplier')
- ✅ Active companies → organizations (type='company')
- ❌ Service providers → Skipped
- ❌ Pending/rejected tenants → Skipped

### Users (from Users)
- ✅ company_admin, company_staff → users (type='qs')
- ✅ supplier_admin, supplier_staff → users (type='supplier')
- ❌ super_admin → Skipped
- ❌ Inactive/pending users → Skipped

### Products (from Products)
- ✅ Active products from suppliers → products_new
- ✅ Uses default_price if available, otherwise private_price
- ❌ Products from service providers → Skipped
- ❌ Inactive products → Skipped

## Verification Queries

After migration, run these to verify:

```sql
-- Check organization counts
SELECT type, COUNT(*) FROM organizations GROUP BY type;

-- Check user counts
SELECT type, COUNT(*) FROM users GROUP BY type;

-- Check product counts
SELECT COUNT(*) as total_products FROM products;

-- Check products per supplier
SELECT o.name, COUNT(p.id) as product_count 
FROM organizations o 
LEFT JOIN products p ON o.id = p.supplier_id 
WHERE o.type = 'supplier'
GROUP BY o.name;
```

## Troubleshooting

### Issue: Foreign key constraint errors
**Solution:** Make sure Step 2 (create new schema) completed successfully before Step 3.

### Issue: Data not migrating
**Solution:** Check that source tables exist and have data. Verify backup tables were created.

### Issue: Need to rollback
**Solution:** Run `migration-rollback.sql` to restore old tables.

## Post-Migration Tasks

1. ✅ Update Prisma schema to match new structure
2. ✅ Run `npx prisma generate` to update Prisma client
3. ✅ Update application code to use new schema
4. ✅ Test registration flow
5. ✅ Test AI chat functionality
6. ✅ Test supplier product management
7. ✅ Verify all data migrated correctly

## Safety Notes

- Backup tables are kept: `tenants_backup`, `users_backup`, `products_backup`
- Old tables are renamed (not deleted): `users_old`, `products_old`, `tenants_old`
- You can restore from backups if needed
- Keep old tables for at least 2 weeks before cleanup

## Support

If you encounter issues:
1. Check the error messages in PostgreSQL logs
2. Verify each step completed successfully
3. Use rollback script if needed
4. Check backup tables for data integrity
