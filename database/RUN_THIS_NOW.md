# 🎯 RUN THIS NOW

## One Command:

```bash
psql -d your_database -f database/quick-fix-organization-id.sql
```

Then:

```bash
cd packages/backend
npx prisma generate
```

## That's It!

This ONE script will:
- ✅ Create the `org_type` enum
- ✅ Create `organizations` table
- ✅ Migrate `tenants` → `organizations` (handles UUID/TEXT)
- ✅ Add `organization_id` column to `users`
- ✅ Add `type` column to `users`
- ✅ Copy all data correctly

**Ignore all other scripts. Just run this one.**
