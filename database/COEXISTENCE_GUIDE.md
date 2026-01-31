# Database Schema Coexistence Guide

## 🎯 Can New and Old Schemas Coexist?

**Yes!** You can have both the new schema (organizations, users_new, products_new) and the old schema (tenants, users, products) in the same database.

---

## ✅ Benefits of Coexistence

1. **Zero Downtime Migration**: Gradually migrate applications
2. **Data Safety**: Keep old tables as backup
3. **Gradual Rollout**: Test new schema while old one still works
4. **Easy Rollback**: Old tables are always available
5. **Data Comparison**: Compare data between old and new schemas

---

## 📋 Current State After Migration Steps 1-3

After running migrations 1-3 (but NOT migration-04), you have:

### Old Tables (Still Active)
- `tenants` - Original tenant table
- `users` - Original user table  
- `products` - Original product table

### New Tables (Created, Not Active)
- `organizations` - New organization table
- `users_new` - New user table
- `products_new` - New product table

### Backup Tables
- `tenants_backup` - Backup of tenants
- `users_backup` - Backup of users
- `products_backup` - Backup of products

**This is the perfect coexistence state!** ✅

---

## 🔧 How to Use Both Schemas

### Option 1: Keep Both, Use New Schema in Application

**Prisma Schema Configuration:**

```prisma
// Use new table names with @@map directive
model Organization {
  id   String @id @default(uuid())
  name String
  // ... other fields
  
  @@map("organizations")  // Maps to 'organizations' table
}

model User {
  id             String @id @default(uuid())
  organizationId String
  // ... other fields
  
  @@map("users_new")  // Maps to 'users_new' table
}

model Product {
  id         String @id @default(uuid())
  supplierId String
  // ... other fields
  
  @@map("products_new")  // Maps to 'products_new' table
}
```

**Old tables remain untouched** - you can query them directly with raw SQL if needed.

---

### Option 2: Dual Schema Support (Advanced)

Create views or functions to sync data between schemas:

```sql
-- Create a view that shows data from both schemas
CREATE OR REPLACE VIEW unified_users AS
SELECT 
  'old' as source,
  id,
  email,
  tenant_id as organization_id,
  first_name || ' ' || last_name as name,
  role as type
FROM users
UNION ALL
SELECT 
  'new' as source,
  id,
  email,
  organization_id,
  name,
  type::text
FROM users_new;
```

---

### Option 3: Application-Level Coexistence

Have your application support both schemas:

```typescript
// In your service layer
async function getUser(userId: string, useNewSchema = true) {
  if (useNewSchema) {
    return prisma.user.findUnique({ where: { id: userId } });
  } else {
    // Query old schema using raw SQL
    return prisma.$queryRaw`
      SELECT * FROM users WHERE id = ${userId}
    `;
  }
}
```

---

## 📊 Data Synchronization (Optional)

If you want to keep both schemas in sync:

### One-Way Sync: Old → New

```sql
-- Sync new data from old to new (run periodically)
INSERT INTO users_new (id, organization_id, email, password_hash, name, type)
SELECT 
  u.id,
  (SELECT o.id FROM organizations o 
   INNER JOIN tenants t ON o.email = t.email 
   WHERE t.id = u.tenant_id LIMIT 1),
  u.email,
  u.password_hash,
  COALESCE(u.first_name || ' ' || u.last_name, u.email),
  CASE 
    WHEN u.role IN ('company_admin', 'company_staff') THEN 'qs'
    WHEN u.role IN ('supplier_admin', 'supplier_staff') THEN 'supplier'
  END
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM users_new un WHERE un.id = u.id
)
ON CONFLICT (id) DO NOTHING;
```

### Two-Way Sync (Complex - Not Recommended)

Two-way sync is complex and can cause conflicts. Better to choose one schema as primary.

---

## 🎯 Recommended Approach

### For MVP 1 (Current State)

**Keep both schemas, use new schema in application:**

1. ✅ Don't run `migration-04-swap-tables.sql` (keeps old tables active)
2. ✅ Use `@@map` in Prisma to point to new tables
3. ✅ Old tables remain as backup/reference
4. ✅ Can query old tables with raw SQL if needed

**Prisma Schema Example:**

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  type      OrgType
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users    User[]
  products Product[]

  @@map("organizations")  // Explicitly map to 'organizations' table
}

model User {
  id             String       @id @default(uuid())
  organizationId String
  email          String       @unique
  passwordHash   String
  name           String?
  type           UserType
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])

  @@map("users_new")  // Explicitly map to 'users_new' table
}

model Product {
  id         String      @id @default(uuid())
  supplierId String
  name       String
  price      Decimal
  unit       String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  supplier Organization @relation(fields: [supplierId], references: [id])

  @@map("products_new")  // Explicitly map to 'products_new' table
}
```

---

## 🔍 Verification Queries

Check both schemas exist:

```sql
-- Check old schema
SELECT 
  'tenants' as table_name, COUNT(*) as row_count FROM tenants
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products;

-- Check new schema
SELECT 
  'organizations' as table_name, COUNT(*) as row_count FROM organizations
UNION ALL
SELECT 'users_new', COUNT(*) FROM users_new
UNION ALL
SELECT 'products_new', COUNT(*) FROM products_new;

-- Compare counts
SELECT 
  (SELECT COUNT(*) FROM users) as old_users,
  (SELECT COUNT(*) FROM users_new) as new_users,
  (SELECT COUNT(*) FROM products) as old_products,
  (SELECT COUNT(*) FROM products_new) as new_products;
```

---

## ⚠️ Important Considerations

### 1. Storage Space
- Both schemas use disk space
- Monitor database size

### 2. Data Consistency
- If you modify data, decide which schema is "source of truth"
- Don't modify both - choose one as primary

### 3. Application Code
- Make sure Prisma uses correct table names via `@@map`
- Don't accidentally query old tables in new code

### 4. Migration Path
- Eventually, you'll want to fully migrate
- Keep coexistence as temporary state
- Plan for final cutover

---

## 🚀 Migration Strategy with Coexistence

### Phase 1: Coexistence (Current)
- ✅ Both schemas exist
- ✅ Application uses new schema
- ✅ Old schema as backup

### Phase 2: Verification (1-2 weeks)
- ✅ Test new schema thoroughly
- ✅ Compare data between schemas
- ✅ Fix any issues

### Phase 3: Final Cutover (When Ready)
- Run `migration-04-swap-tables.sql` to make new tables primary
- Or keep both indefinitely if needed

### Phase 4: Cleanup (Optional, Later)
- Run `migration-05-cleanup-optional.sql` to remove old tables
- Only after full confidence in new schema

---

## 💡 Best Practice

**For your current situation:**

1. ✅ **Keep both schemas** - Don't run migration-04 yet
2. ✅ **Use new schema in Prisma** - Map to `organizations`, `users_new`, `products_new`
3. ✅ **Old tables as backup** - Available for rollback or reference
4. ✅ **Monitor both** - Compare data to ensure consistency
5. ✅ **When confident** - Run migration-04 to swap (or keep both)

---

## 📝 Example: Querying Both Schemas

```sql
-- Query old schema
SELECT * FROM users WHERE email = 'user@example.com';

-- Query new schema  
SELECT * FROM users_new WHERE email = 'user@example.com';

-- Compare data
SELECT 
  u.email as old_email,
  un.email as new_email,
  u.role as old_role,
  un.type as new_type
FROM users u
FULL OUTER JOIN users_new un ON u.id = un.id;
```

---

## ✅ Summary

**Yes, you can absolutely coexist both schemas!**

- ✅ Keep old tables (`tenants`, `users`, `products`)
- ✅ Keep new tables (`organizations`, `users_new`, `products_new`)
- ✅ Use Prisma `@@map` to point to new tables
- ✅ Old tables remain as backup/reference
- ✅ No need to run migration-04 until you're ready
- ✅ Can query both with raw SQL if needed

**This is actually the safest approach!** 🛡️
