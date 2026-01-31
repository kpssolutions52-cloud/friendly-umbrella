# Database Rollback Guide

## 🔄 How to Rollback to Previous Database Version

This guide explains how to revert your database to the previous schema if needed.

---

## ⚠️ Important Notes

1. **Backup First**: Always backup your current database before rollback
2. **Data Loss Risk**: Rollback may result in data loss if you've added new data after migration
3. **Application Restart**: You'll need to restart your application after rollback
4. **Prisma Schema**: You'll need to revert your Prisma schema to match the old database structure

---

## 📋 Rollback Options

### Option 1: Rollback After Migration (Before Step 4)

If you've run migrations 1-3 but **NOT** migration-04-swap-tables.sql:

**You're safe!** The old tables are still active. Just:
1. Drop the new tables:
```sql
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users_new CASCADE;
DROP TABLE IF EXISTS products_new CASCADE;
```

2. Drop backup tables (if you want):
```sql
DROP TABLE IF EXISTS tenants_backup CASCADE;
DROP TABLE IF EXISTS users_backup CASCADE;
DROP TABLE IF EXISTS products_backup CASCADE;
```

---

### Option 2: Rollback After Full Migration (After Step 4)

If you've completed all migrations including `migration-04-swap-tables.sql`:

**Use the rollback script:**

```bash
psql -d your_database_name -f database/migration-rollback.sql
```

Or manually:

```sql
-- Step 1: Rename new tables back
ALTER TABLE IF EXISTS users RENAME TO users_new;
ALTER TABLE IF EXISTS products RENAME TO products_new;
ALTER TABLE IF EXISTS organizations RENAME TO organizations_new;

-- Step 2: Restore old tables
ALTER TABLE IF EXISTS users_old RENAME TO users;
ALTER TABLE IF EXISTS products_old RENAME TO products;
ALTER TABLE IF EXISTS tenants_old RENAME TO tenants;
```

---

### Option 3: Restore from Backup Tables

If backup tables exist (`*_backup`), you can restore from them:

```sql
-- Restore tenants
TRUNCATE TABLE tenants;
INSERT INTO tenants 
SELECT * FROM tenants_backup;

-- Restore users
TRUNCATE TABLE users;
INSERT INTO users 
SELECT * FROM users_backup;

-- Restore products
TRUNCATE TABLE products;
INSERT INTO products 
SELECT * FROM products_backup;
```

---

## 🔍 Check Current Database State

Before rollback, check what tables exist:

```sql
-- Check if old tables exist (backup)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenants_old', 'users_old', 'products_old');

-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('organizations', 'users', 'products');

-- Check if backup tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%_backup';
```

---

## 📝 Step-by-Step Rollback Process

### 1. Check Current State

```bash
psql -d your_database_name -c "
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') 
    THEN 'New schema active' 
    ELSE 'Old schema active' 
  END as current_state;
"
```

### 2. Backup Current Data (Optional but Recommended)

```bash
pg_dump your_database_name > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Run Rollback Script

```bash
psql -d your_database_name -f database/migration-rollback.sql
```

### 4. Verify Rollback

```sql
-- Should return old table names
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'users', 'products')
ORDER BY table_name;
```

### 5. Update Prisma Schema

Revert `packages/backend/prisma/schema.prisma` to the old schema (if you have it in git history).

### 6. Regenerate Prisma Client

```bash
cd packages/backend
npm run db:generate
```

### 7. Restart Application

Restart your backend and frontend services.

---

## 🚨 Emergency Rollback (If Tables Are Missing)

If backup tables don't exist, you have these options:

### Option A: Restore from Database Backup

If you have a full database backup from before migration:

```bash
# Stop your application
# Drop current database
dropdb your_database_name

# Restore from backup
createdb your_database_name
psql your_database_name < backup_file.sql
```

### Option B: Recreate Old Schema

If you have the old schema scripts, recreate them:

```bash
# Run old schema creation scripts in order
psql -d your_database_name -f database/01-create-enums.sql
psql -d your_database_name -f database/02-create-tenants.sql
psql -d your_database_name -f database/03-create-users.sql
# ... etc
```

---

## ✅ Verification After Rollback

After rollback, verify everything works:

```sql
-- 1. Check table counts
SELECT 
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM products) as products;

-- 2. Check data integrity
SELECT 
  t.name as tenant_name,
  COUNT(u.id) as user_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
GROUP BY t.name;

-- 3. Test a query
SELECT * FROM tenants LIMIT 5;
SELECT * FROM users LIMIT 5;
```

---

## 📞 Need Help?

If rollback fails or you're unsure:

1. **Check logs**: Look for error messages in the rollback script output
2. **Check table state**: Use the verification queries above
3. **Restore from backup**: If you have a full database backup, restore it
4. **Contact support**: If data is critical, consider professional database recovery

---

## 🔄 Quick Reference

| Situation | Action |
|-----------|--------|
| Before migration-04 | Drop new tables, keep old tables |
| After migration-04 | Run `migration-rollback.sql` |
| Backup tables exist | Restore from `*_backup` tables |
| No backups | Restore from full database backup |
| Emergency | Recreate old schema from scripts |

---

**Remember**: Always backup before rollback! 🛡️
