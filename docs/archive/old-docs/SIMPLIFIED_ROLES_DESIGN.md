# Simplified Role-Based Access for AI QS Assistant

## 🎯 Core Principle

**Two user types, two simple roles:**
1. **Company Users (QS Professionals)** - Use AI chat
2. **Supplier Users** - Add/update products and prices

**No complex roles, no approvals, instant access.**

---

## 👥 User Types & Permissions

### 1. Company Users (QS Professionals)

**What they can do:**
- ✅ Use AI chat interface
- ✅ Ask questions about construction pricing
- ✅ Get real-time supplier prices
- ✅ Generate quotes
- ✅ View supplier information

**What they CANNOT do:**
- ❌ Add or edit products
- ❌ Update prices
- ❌ Manage other users

**Registration:**
- Sign up as "Company" → Create new company OR join existing company
- Instant access (no approval needed)

### 2. Supplier Users

**What they can do:**
- ✅ Add products (name, price, unit)
- ✅ Update product prices
- ✅ Delete products
- ✅ View their own products
- ✅ See which products are being queried (optional)

**What they CANNOT do:**
- ❌ Use AI chat (they're data providers)
- ❌ See other suppliers' prices
- ❌ Manage company users

**Registration:**
- Sign up as "Supplier" → Create new supplier OR join existing supplier
- Instant access (no approval needed)

---

## 🏗️ Simplified Database Schema

### Organizations Table
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String   // Company or Supplier name
  type      OrgType  // company | supplier
  email     String   @unique // Primary contact email
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users    User[]
  products Product[] @relation("SupplierProducts") // Only for suppliers

  @@index([type])
  @@map("organizations")
}

enum OrgType {
  company   // Has QS professionals
  supplier  // Provides products and prices
}
```

### Users Table
```prisma
model User {
  id             String       @id @default(uuid())
  organizationId String        // Required - user belongs to an organization
  email          String       @unique
  passwordHash   String
  name           String?       // Full name (optional)
  type           UserType      // qs | supplier
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([email])
  @@index([type])
  @@map("users")
}

enum UserType {
  qs       // Quantity Surveyor (works for a company)
  supplier // Supplier user (works for a supplier)
}
```

### Products Table
```prisma
model Product {
  id         String      @id @default(uuid())
  supplierId String      // Only suppliers have products
  name       String
  price      Decimal
  unit       String
  updatedAt  DateTime    @updatedAt // Track when price last updated
  createdAt  DateTime    @default(now())

  supplier Organization @relation("SupplierProducts", fields: [supplierId], references: [id], onDelete: Cascade)
  
  @@index([name]) // For AI search
  @@index([supplierId])
  @@map("products")
}
```

**That's it. 3 tables. Simple relationships.**

---

## 🔐 Access Control Rules

### For Company Users (QS)
```typescript
// Middleware check
if (user.type === 'qs') {
  // Can access:
  - GET /api/v1/chat (AI chat)
  - POST /api/v1/chat (Ask questions)
  - GET /api/v1/products/search (Search products)
  // Cannot access:
  - POST /api/v1/products (Add products)
  - PUT /api/v1/products/:id (Update products)
}
```

### For Supplier Users
```typescript
// Middleware check
if (user.type === 'supplier') {
  // Can access:
  - GET /api/v1/products (View their products)
  - POST /api/v1/products (Add products)
  - PUT /api/v1/products/:id (Update products)
  - DELETE /api/v1/products/:id (Delete products)
  // Cannot access:
  - POST /api/v1/chat (AI chat - not for suppliers)
}
```

---

## 📝 Simplified Registration Flow

### Option 1: New Company Registration
```
1. User selects "I'm a QS Professional"
2. Chooses "Create new company" or "Join existing company"
3. If new: Enter company name, email, password
4. If existing: Select company from list, enter email, password
5. ✅ Instant access - can use AI chat immediately
```

### Option 2: New Supplier Registration
```
1. User selects "I'm a Supplier"
2. Chooses "Create new supplier" or "Join existing supplier"
3. If new: Enter supplier name, email, password
4. If existing: Select supplier from list, enter email, password
5. ✅ Instant access - can add products immediately
```

**No approvals. No waiting. Instant access.**

---

## 🎨 Simplified Registration UI

### Step 1: Choose User Type
```
┌─────────────────────────────────────┐
│  I'm a QS Professional             │  ← Radio button
│  I'm a Supplier                     │  ← Radio button
└─────────────────────────────────────┘
```

### Step 2: Choose Organization
```
If QS Professional:
┌─────────────────────────────────────┐
│  ○ Create new company              │
│  ○ Join existing company           │
└─────────────────────────────────────┘

If Supplier:
┌─────────────────────────────────────┐
│  ○ Create new supplier             │
│  ○ Join existing supplier          │
└─────────────────────────────────────┘
```

### Step 3: Fill Form
```
If "Create new":
- Organization name (Company/Supplier name)
- Your email
- Password
- Your name (optional)

If "Join existing":
- Select organization from dropdown
- Your email
- Password
- Your name (optional)
```

**That's it. Simple. No complex dropdowns.**

---

## 🔄 Migration from Current System

### Current System
- 7 registration types
- 5+ user roles
- Approval workflows
- Complex permissions

### New System
- 2 user types (QS, Supplier)
- 2 organization types (Company, Supplier)
- No roles (just user type)
- No approvals (instant access)

### Migration Steps
1. Map existing roles:
   - `company_admin`, `company_staff` → `qs`
   - `supplier_admin`, `supplier_staff` → `supplier`
   - Remove: `super_admin`, `service_provider_*`, `customer`

2. Simplify organizations:
   - Keep `company` and `supplier` types
   - Remove `service_provider` type
   - Remove status fields (pending/active/rejected)

3. Update permissions:
   - QS users: AI chat access only
   - Supplier users: Product management only

---

## 💡 Why This Works

### 1. Simple for Users
- Clear choice: "I'm a QS" or "I'm a Supplier"
- No confusion about roles
- Instant access

### 2. Simple for Developers
- 2 user types (not 5+ roles)
- Simple permission checks
- Less code to maintain

### 3. Flexible
- Companies can have multiple QS users
- Suppliers can have multiple users
- Easy to add features later

### 4. Secure
- QS users can't modify products
- Supplier users can't use AI chat
- Clear separation of concerns

---

## 📋 Implementation Checklist

### Backend
- [ ] Update Prisma schema (simplify to 3 tables)
- [ ] Remove role enums (keep only UserType)
- [ ] Simplify auth service (remove approval logic)
- [ ] Update registration endpoint (2 types only)
- [ ] Create permission middleware (check user type)
- [ ] Update routes (separate QS and Supplier routes)

### Frontend
- [ ] Simplify registration page (2 radio buttons)
- [ ] Remove complex registration type dropdown
- [ ] Add organization selection (create/join)
- [ ] Update dashboard routing (based on user type)
- [ ] Create QS dashboard (AI chat interface)
- [ ] Create Supplier dashboard (product management)

### Database
- [ ] Create migration to simplify schema
- [ ] Migrate existing users to new types
- [ ] Remove unused tables/fields

---

## 🎯 Example User Flows

### QS Professional Flow
```
1. Sign up → Select "I'm a QS Professional"
2. Choose "Create new company" → Enter company name
3. Enter email, password
4. ✅ Logged in → See AI chat interface
5. Ask: "What's the price of cement?"
6. ✅ Get answer with real supplier prices
```

### Supplier Flow
```
1. Sign up → Select "I'm a Supplier"
2. Choose "Create new supplier" → Enter supplier name
3. Enter email, password
4. ✅ Logged in → See product management dashboard
5. Add product: "Cement", $50, "bag"
6. ✅ Product live in AI answers immediately
```

---

## 🔒 Security Considerations

### Data Isolation
- QS users can only see products (not edit)
- Supplier users can only edit their own products
- Organizations are isolated (company A can't see company B's data)

### API Security
```typescript
// Example middleware
export function requireQSAccess(req, res, next) {
  if (req.user.type !== 'qs') {
    return res.status(403).json({ error: 'QS access required' });
  }
  next();
}

export function requireSupplierAccess(req, res, next) {
  if (req.user.type !== 'supplier') {
    return res.status(403).json({ error: 'Supplier access required' });
  }
  next();
}
```

---

## 📊 Comparison

| Aspect | Current System | Simplified System |
|--------|---------------|-------------------|
| **User Types** | 7+ roles | 2 types |
| **Registration Types** | 7 options | 2 options |
| **Approval Required** | Yes (2 levels) | No (instant) |
| **Complexity** | High | Low |
| **Time to Access** | Days (pending approval) | Seconds (instant) |
| **Code Complexity** | High | Low |

---

## 🚀 Next Steps

1. **Review this design** - Does it meet your needs?
2. **Update schema** - Simplify to 3 tables
3. **Update registration** - 2 simple options
4. **Update permissions** - Simple type checks
5. **Test thoroughly** - Ensure QS and Suppliers work correctly

---

**Remember:** Simple is better. Two user types, two clear purposes, instant access.
