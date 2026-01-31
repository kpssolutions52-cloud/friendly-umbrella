# 🚀 START HERE - Database Setup for MVP 1

## ⚠️ You're Getting "organization_id does not exist" Error?

**Run this ONE script:**

```bash
psql -d your_database -f database/quick-fix-organization-id.sql
cd packages/backend && npx prisma generate
```

**That's it!** ✅

---

## 📋 What This Script Does

1. ✅ Creates `organizations` table (if missing)
2. ✅ Migrates `tenants` → `organizations` (handles UUID/TEXT id types)
3. ✅ Adds `organization_id` column to `users` table
4. ✅ Adds `type` column to `users` table
5. ✅ Copies data from `tenant_id` → `organization_id`
6. ✅ Sets user types (qs/supplier) based on roles

---

## 🎯 After Running

1. The error should be gone
2. Your database will have the new schema
3. MVP 1 features will work

---

## ❓ Still Confused?

**Just run this:**
```bash
psql -d your_database -f database/quick-fix-organization-id.sql
cd packages/backend && npx prisma generate
```

**Ignore all other scripts for now.**
