# Code Migration Guide - Old Schema to New Schema

## 🚨 Critical: Build Failing Due to Schema Mismatch

The Prisma schema has been updated to the new simplified structure, but the codebase still references the old schema. This guide helps fix the migration.

---

## 📋 Schema Changes Summary

### Old Schema → New Schema

| Old | New | Notes |
|-----|-----|-------|
| `tenant` | `organization` | Table renamed |
| `TenantType` | `OrgType` | Enum renamed |
| `UserRole` | `UserType` | Enum changed (qs/supplier instead of roles) |
| `tenantId` | `organizationId` | Field renamed |
| `firstName`, `lastName` | `name` | Combined into single field |
| `role` | `type` | Field renamed and simplified |
| `status`, `isActive` | **Removed** | No longer in schema |
| `permissions` | **Removed** | No longer in schema |

### Removed Tables

These tables no longer exist in the new schema:
- `priceView`
- `priceAuditLog`
- `privatePrice`
- `defaultPrice`
- `productImage`
- `serviceCategory`
- `productCategory`
- `quoteRequest`
- `quoteResponse`

---

## 🔧 Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { UserRole, UserStatus, TenantType, TenantStatus } from '@prisma/client';
```

**After:**
```typescript
import { UserType, OrgType } from '@prisma/client';
```

### Step 2: Update User Queries

**Before:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { tenant: true },
});
// Access: user.role, user.tenantId, user.firstName, user.lastName
```

**After:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { organization: true },
});
// Access: user.type, user.organizationId, user.name
```

### Step 3: Update Organization Queries

**Before:**
```typescript
const tenant = await prisma.tenant.findUnique({
  where: { id: tenantId },
});
```

**After:**
```typescript
const organization = await prisma.organization.findUnique({
  where: { id: organizationId },
});
```

### Step 4: Update Role Checks

**Before:**
```typescript
if (user.role === 'company_admin' || user.role === 'company_staff') {
  // QS user
}
```

**After:**
```typescript
if (user.type === 'qs') {
  // QS user
}
```

### Step 5: Remove Status/Active Checks

**Before:**
```typescript
if (!user.isActive || user.status !== 'active') {
  throw new Error('User inactive');
}
```

**After:**
```typescript
// Status checks removed - all users are active
if (!user) {
  throw new Error('User not found');
}
```

### Step 6: Update Product Queries

**Before:**
```typescript
const products = await prisma.product.findMany({
  where: { isActive: true },
  include: {
    supplier: true,
    category: true,
    images: true,
    defaultPrices: true,
    privatePrices: true,
  },
});
```

**After:**
```typescript
const products = await prisma.product.findMany({
  include: {
    supplier: true,
  },
});
// Note: category, images, prices removed - simplified schema
```

---

## 🚫 Removed Features

These features need to be removed or refactored:

1. **Price Management**
   - `privatePrice` table → Use single `price` field
   - `defaultPrice` table → Use single `price` field
   - `priceAuditLog` → Remove logging (or implement differently)

2. **Product Images**
   - `productImage` table → Remove or use external storage

3. **Categories**
   - `productCategory` table → Remove or use simple search
   - `serviceCategory` table → Remove

4. **Quote System**
   - `quoteRequest` table → Use new `Quote` table
   - `quoteResponse` table → Use new `Quote` table

---

## ✅ Files Already Fixed

- ✅ `src/middleware/authMiddleware.ts` - New simplified auth
- ✅ `src/middleware/permissionsMiddleware.ts` - Type-based permissions
- ✅ `src/routes/chatRoutes.ts` - Uses new middleware
- ✅ `src/services/cacheService.ts` - Optional Redis

---

## 📝 Files That Need Fixing

### High Priority (Blocking Build)

1. **Authentication & Middleware**
   - `src/middleware/auth.ts` - Update to use new schema
   - `src/services/authService.ts` - Update user creation/login

2. **Routes**
   - All routes using `tenant` → Change to `organization`
   - All routes using `role` → Change to `type`
   - Remove references to old tables

3. **Services**
   - `src/services/productService.ts` - Remove category/image/price references
   - `src/services/priceService.ts` - Simplify to single price
   - `src/services/quoteService.ts` - Update to new Quote model

### Medium Priority

4. **Test Files**
   - `src/__tests__/**` - Update test helpers and fixtures
   - Remove references to old schema

5. **Utils**
   - `src/utils/db.ts` - Update helper functions

---

## 🎯 Quick Fix Strategy

### Option 1: Comment Out Old Code (Temporary)

For files with many errors, comment out the problematic code temporarily:

```typescript
// TODO: Migrate to new schema
// const products = await prisma.product.findMany({
//   include: { category: true } // category no longer exists
// });
```

### Option 2: Create Stubs

Create stub functions that return empty data:

```typescript
// Stub for removed feature
async function getProductCategories() {
  return []; // Categories removed in new schema
}
```

### Option 3: Remove Entire Files

If a file is entirely for removed features, delete it:
- Files only dealing with `productImage` → Delete
- Files only dealing with `priceAuditLog` → Delete

---

## 🔄 Migration Checklist

- [ ] Update all imports (`UserRole` → `UserType`, etc.)
- [ ] Replace `tenant` with `organization` everywhere
- [ ] Replace `tenantId` with `organizationId`
- [ ] Replace `role` with `type`
- [ ] Replace `firstName`/`lastName` with `name`
- [ ] Remove `status` and `isActive` checks
- [ ] Remove references to old tables
- [ ] Update test files
- [ ] Update documentation

---

## ⚠️ Important Notes

1. **No Backward Compatibility** - Old code will not work with new schema
2. **Database Migration Required** - Run migration scripts first
3. **Test Thoroughly** - Many features simplified or removed
4. **Update Frontend** - Frontend also needs updates

---

## 🚀 Next Steps

1. Fix critical build-blocking files first
2. Update authentication and middleware
3. Update core routes and services
4. Remove or stub out old features
5. Update tests
6. Test end-to-end

---

**This is a major refactoring. Take it step by step!**
