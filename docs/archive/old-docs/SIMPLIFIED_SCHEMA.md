# Simplified Database Schema - Core MVP Only

## 🎯 Goal: 3 Tables Instead of 10+

**Current:** 10+ tables with complex relationships  
**Simplified:** 3 core tables  
**Reduction:** 70% less complexity

---

## ✅ SIMPLIFIED SCHEMA (Keep Only These)

### 1. Organizations Table
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  type      OrgType  // supplier | company
  email     String   @unique @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users    User[]
  products Product[] @relation("SupplierProducts")

  @@index([type])
  @@map("organizations")
}

enum OrgType {
  supplier
  company
}
```

**Removed from Tenant:**
- ❌ status (pending/active/rejected)
- ❌ isActive
- ❌ approvedBy, approvedAt
- ❌ rejectedBy, rejectedAt
- ❌ rejectionReason
- ❌ phone, address, postalCode, logoUrl
- ❌ metadata
- ❌ service_provider type

---

### 2. Users Table
```prisma
model User {
  id           String   @id @default(uuid())
  organizationId String @map("organization_id")
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  name         String?  @db.VarChar(255) // Optional: full name
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([email])
  @@map("users")
}
```

**Removed from User:**
- ❌ role (super_admin, supplier_admin, etc.)
- ❌ status (pending/active/rejected)
- ❌ isActive
- ❌ approvedBy, approvedAt
- ❌ rejectedBy, rejectedAt
- ❌ rejectionReason
- ❌ permissions (JSON)
- ❌ firstName, lastName (replaced with single name)
- ❌ lastLoginAt
- ❌ tenantId (renamed to organizationId for clarity)

---

### 3. Products Table
```prisma
model Product {
  id             String   @id @default(uuid())
  supplierId     String   @map("supplier_id")
  name           String   @db.VarChar(255)
  price          Decimal  @db.Decimal(12, 2) // Single price, no default/private
  unit           String   @db.VarChar(50)    // e.g., "bag", "kg", "piece"
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  supplier Organization @relation("SupplierProducts", fields: [supplierId], references: [id], onDelete: Cascade)

  @@index([supplierId])
  @@index([name]) // For search
  @@map("products")
}
```

**Removed from Product:**
- ❌ type (product/service)
- ❌ sku (not needed for MVP)
- ❌ description
- ❌ categoryId, serviceCategoryId
- ❌ ratePerHour, rateType (service-specific)
- ❌ isActive
- ❌ metadata
- ❌ All relations to: DefaultPrice, PrivatePrice, PriceAuditLog, PriceView, QuoteRequest, ProductImage

---

## ❌ REMOVE THESE TABLES (Not Needed for MVP)

### 1. DefaultPrice ❌
- **Why:** Products have one price field directly
- **Replacement:** `Product.price`

### 2. PrivatePrice ❌
- **Why:** Not needed for MVP. Add later if users request it.
- **Replacement:** None (add later)

### 3. PriceAuditLog ❌
- **Why:** Not needed for MVP. Add later if needed.
- **Replacement:** None (add later)

### 4. PriceView ❌
- **Why:** Analytics not needed for MVP.
- **Replacement:** None (add later)

### 5. QuoteRequest ❌
- **Why:** RFQ system is not core to price viewing.
- **Replacement:** None (add later)

### 6. QuoteResponse ❌
- **Why:** Part of RFQ system.
- **Replacement:** None (add later)

### 7. ProductCategory ❌
- **Why:** Search by name is sufficient for MVP.
- **Replacement:** None (add later)

### 8. ServiceCategory ❌
- **Why:** Not supporting services in MVP.
- **Replacement:** None (add later)

### 9. ProductImage ❌
- **Why:** Not needed for MVP. Add later.
- **Replacement:** None (add later)

---

## 📊 COMPARISON

| Aspect | Current Schema | Simplified Schema | Reduction |
|--------|---------------|------------------|-----------|
| **Tables** | 10+ tables | 3 tables | -70% |
| **Enums** | 6 enums | 1 enum | -83% |
| **Relations** | 20+ relations | 3 relations | -85% |
| **Indexes** | 30+ indexes | 5 indexes | -83% |
| **Fields per User** | 15+ fields | 6 fields | -60% |
| **Fields per Product** | 15+ fields | 5 fields | -67% |
| **Complexity** | High | Low | -70% |

---

## 🔄 MIGRATION STRATEGY

### Option 1: Fresh Start (Recommended for MVP)
1. Create new simplified schema
2. Export existing data (if any)
3. Migrate to new schema
4. Import essential data only

### Option 2: Gradual Removal
1. Mark unused tables as deprecated
2. Stop using them in code
3. Remove after MVP launch

---

## 📝 SIMPLIFIED PRISMA SCHEMA (Complete)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Organizations (suppliers and companies)
model Organization {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  type      OrgType
  email     String   @unique @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users    User[]
  products Product[] @relation("SupplierProducts")

  @@index([type])
  @@map("organizations")
}

enum OrgType {
  supplier
  company
}

// Users
model User {
  id             String       @id @default(uuid())
  organizationId String       @map("organization_id")
  email          String       @unique @db.VarChar(255)
  passwordHash   String       @map("password_hash") @db.VarChar(255)
  name           String?      @db.VarChar(255)
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([email])
  @@map("users")
}

// Products (only from suppliers)
model Product {
  id         String      @id @default(uuid())
  supplierId String      @map("supplier_id")
  name       String      @db.VarChar(255)
  price      Decimal     @db.Decimal(12, 2)
  unit       String      @db.VarChar(50)
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")

  supplier Organization @relation("SupplierProducts", fields: [supplierId], references: [id], onDelete: Cascade)

  @@index([supplierId])
  @@index([name])
  @@map("products")
}
```

---

## 🎯 WHAT THIS ENABLES

### Supplier Flow
1. Sign up → Create Organization (type: supplier)
2. Create User → Link to organization
3. Add Product → name, price, unit
4. Done → Companies can see it

### Company Flow
1. Sign up → Create Organization (type: company)
2. Create User → Link to organization
3. Search Products → By name
4. See Prices → From all suppliers

---

## ✅ BENEFITS

1. **Faster Development**
   - 70% less code to write
   - 70% less database queries
   - 70% less testing

2. **Easier to Understand**
   - 3 tables vs 10+
   - Simple relationships
   - No complex enums

3. **Faster Queries**
   - Fewer joins
   - Simpler indexes
   - Better performance

4. **Easier Maintenance**
   - Less code to maintain
   - Fewer bugs
   - Faster iterations

5. **Faster Launch**
   - 2-3 weeks instead of 8 weeks
   - Launch and get feedback
   - Add features based on real needs

---

## 🚀 NEXT STEPS

1. **Review this schema** with team
2. **Create migration** to simplified schema
3. **Update backend code** to use new schema
4. **Update frontend** to match simplified model
5. **Test thoroughly** with simplified data
6. **Launch MVP** and gather feedback

---

**Remember:** Start simple. Add complexity only when users ask for it.
