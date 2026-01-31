# Database Migration Checklist

## ⚠️ Pre-Migration Checklist

- [ ] **Backup your database** (full backup, not just SQL dumps)
- [ ] **Test migrations on a development/staging database first**
- [ ] **Review all migration scripts** in the `database/` folder
- [ ] **Ensure you have rollback plan** (see `migration-rollback.sql`)
- [ ] **Schedule maintenance window** (migrations may take 10-30 minutes)
- [ ] **Notify team** about the migration

## 📋 Migration Execution Order

### Step 1: Backup (REQUIRED)
```bash
psql -d your_database -f database/migration-01-backup-existing-data.sql
```
**Verify:** Check that backup tables were created
```sql
SELECT COUNT(*) FROM tenants_backup;
SELECT COUNT(*) FROM users_backup;
SELECT COUNT(*) FROM products_backup;
```

### Step 2: Create New Schema
```bash
psql -d your_database -f database/migration-02-create-new-schema.sql
```
**Verify:** Check that new tables exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('organizations', 'users_new', 'products_new');
```

### Step 3: Migrate Data
```bash
psql -d your_database -f database/migration-03-migrate-data.sql
```
**Verify:** Check data counts
```sql
SELECT 'organizations' as table_name, COUNT(*) FROM organizations
UNION ALL
SELECT 'users_new', COUNT(*) FROM users_new
UNION ALL
SELECT 'products_new', COUNT(*) FROM products_new;
```

### Step 4: Swap Tables (POINT OF NO RETURN)
```bash
psql -d your_database -f database/migration-04-swap-tables.sql
```
**⚠️ WARNING:** This is the point of no return. Old tables are renamed.
**Verify:** Check that production tables exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('organizations', 'users', 'products');
```

### Step 5: Update Prisma (After Migration)
```bash
cd packages/backend
npx prisma generate
```

### Step 6: Test Application
- [ ] Test user registration (QS and Supplier)
- [ ] Test login
- [ ] Test AI chat (for QS users)
- [ ] Test product management (for suppliers)
- [ ] Verify data integrity

### Step 7: Cleanup (OPTIONAL - After Full Verification)
```bash
# Only after 2+ weeks of successful operation
psql -d your_database -f database/migration-05-cleanup-optional.sql
```

## 🔄 Rollback Procedure

If you need to rollback:

```bash
psql -d your_database -f database/migration-rollback.sql
```

Then:
1. Restart your application
2. Verify old functionality works
3. Investigate issues
4. Plan re-migration

## ✅ Post-Migration Verification

Run these queries to verify migration:

```sql
-- Check organization distribution
SELECT type, COUNT(*) as count 
FROM organizations 
GROUP BY type;

-- Check user distribution
SELECT type, COUNT(*) as count 
FROM users 
GROUP BY type;

-- Check products per supplier
SELECT o.name, COUNT(p.id) as product_count 
FROM organizations o 
LEFT JOIN products p ON o.id = p.supplier_id 
WHERE o.type = 'supplier'
GROUP BY o.name
ORDER BY product_count DESC;

-- Check for orphaned users
SELECT COUNT(*) as orphaned_users
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE o.id IS NULL;

-- Check for orphaned products
SELECT COUNT(*) as orphaned_products
FROM products p
LEFT JOIN organizations o ON p.supplier_id = o.id
WHERE o.id IS NULL OR o.type != 'supplier';
```

## 📊 Expected Results

After successful migration:
- ✅ All active suppliers → organizations (type='supplier')
- ✅ All active companies → organizations (type='company')
- ✅ All active QS users → users (type='qs')
- ✅ All active supplier users → users (type='supplier')
- ✅ All active products → products (with prices)
- ✅ No orphaned records
- ✅ All foreign keys valid

## 🚨 Troubleshooting

### Issue: Foreign key errors during migration
**Solution:** Ensure Step 2 completed successfully before Step 3

### Issue: Data not appearing in new tables
**Solution:** Check that source tables have active records. Verify filters in migration-03.

### Issue: Application errors after migration
**Solution:** 
1. Run `npx prisma generate`
2. Restart application
3. Check logs for specific errors
4. Consider rollback if critical

### Issue: Need to restore from backup
**Solution:** Use backup tables (tenants_backup, users_backup, products_backup) to restore data

## 📝 Notes

- Backup tables are kept permanently (until you manually drop them)
- Old tables (users_old, products_old, tenants_old) are kept for safety
- You can restore from backups at any time
- Keep old tables for at least 2 weeks before cleanup
