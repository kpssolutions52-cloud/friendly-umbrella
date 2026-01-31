# 🎯 Simple Database Setup - Choose ONE Option

## ⚠️ First: Check What You Have

```bash
psql -d your_database -f database/check-db-state.sql
```

This will tell you if you have old schema (tenant_id) or new schema (organization_id).

---

## Option A: Fresh Start (No Existing Data) ✅ SIMPLEST

**Use this if:** You're testing or don't need existing data

```bash
# Run this ONE script:
psql -d your_database -f database/mvp1-setup.sql

# Then:
cd packages/backend
npx prisma generate
```

**Done!** ✅

---

## Option B: You Have Existing Data (Production)

**Use this if:** You have data in tenants/users/products tables

### Step 1: Backup (IMPORTANT!)
```bash
psql -d your_database -f database/migration-01-backup-existing-data.sql
```

### Step 2: Create New Schema
```bash
psql -d your_database -f database/migration-02-create-new-schema.sql
```

### Step 3: Migrate Data
```bash
psql -d your_database -f database/migration-03-migrate-data.sql
```

### Step 4: Swap Tables
```bash
psql -d your_database -f database/migration-04-swap-tables.sql
```

### Step 5: Generate Prisma
```bash
cd packages/backend
npx prisma generate
```

**Done!** ✅

---

## Option C: Quick Fix (You're Getting Errors)

**Use this if:** You're getting "organization_id does not exist" error

```bash
# Run this ONE script:
psql -d your_database -f database/quick-fix-organization-id.sql

# Then:
cd packages/backend
npx prisma generate
```

**Done!** ✅

---

## 🎯 Which One Should I Use?

- **Testing/Development?** → **Option A** (Fresh Start)
- **Production with data?** → **Option B** (Full Migration)
- **Getting errors right now?** → **Option C** (Quick Fix)

---

## That's It!

Ignore all other scripts. Just pick ONE option above and follow it.
