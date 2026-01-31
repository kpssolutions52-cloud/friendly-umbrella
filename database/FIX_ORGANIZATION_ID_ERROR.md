# Fix: "column organization_id does not exist" Error

## 🔍 Problem

You're getting this error because your database still has the **old schema** with `tenant_id` instead of the **new schema** with `organization_id`.

## ✅ Solution Options

### Option 1: Check Current State First

```bash
# Run this to see what you have
psql -d your_database -f database/check-db-state.sql

# Or run the diagnostic script
psql -d your_database -f database/fix-organization-id-error.sql
```

### Option 2: Fresh Start (If you don't need existing data)

```bash
# 1. Create MVP 1 tables with new schema
psql -d your_database -f database/mvp1-setup.sql

# 2. Generate Prisma client
cd packages/backend
npx prisma generate

# 3. Verify it worked
psql -d your_database -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id';"
```

### Option 3: Migrate Existing Data (If you have data to preserve)

```bash
# Step 1: BACKUP FIRST!
psql -d your_database -f database/migration-01-backup-existing-data.sql

# Step 2: Create new schema (creates organizations, users_new, products_new)
psql -d your_database -f database/migration-02-create-new-schema.sql

# Step 3: Migrate data from old to new tables
psql -d your_database -f database/migration-03-migrate-data.sql

# Step 4: Swap tables (renames users_new → users, products_new → products)
psql -d your_database -f database/migration-04-swap-tables.sql

# Step 5: Generate Prisma client
cd packages/backend
npx prisma generate

# Step 6: Verify
psql -d your_database -c "SELECT COUNT(*) FROM organizations;"
psql -d your_database -c "SELECT COUNT(*) FROM users;"
```

## 🔧 Quick Fix Script

If you just need to add the column temporarily (not recommended, but works):

```sql
-- ONLY if you have old schema and want a quick workaround
-- Better to run full migration!

-- Check if you have old schema
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tenant_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
    ) THEN
        RAISE NOTICE 'Old schema detected. You need to run migration scripts.';
    END IF;
END $$;
```

## 📋 Verification

After fixing, verify the new schema exists:

```sql
-- Should return: organization_id
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('organization_id', 'tenant_id');

-- Should return: organizations
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'organizations';
```

## 🎯 Recommended Action

**If you're testing/developing:**
```bash
psql -d your_database -f database/mvp1-setup.sql
cd packages/backend && npx prisma generate
```

**If you have production data:**
```bash
# Follow Option 3 above (migrate existing data)
```

## ⚠️ Important Notes

- The old schema uses `tenant_id` → `tenants` table
- The new schema uses `organization_id` → `organizations` table
- MVP 1 requires the new schema
- Always backup before migrating!
