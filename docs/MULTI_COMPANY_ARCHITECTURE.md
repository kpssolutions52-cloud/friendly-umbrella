# Multi-Company Architecture - QS AI Agent

## 🎯 Key Capability

**Yes! The QS AI Agent supports:**

✅ **Multiple companies** - Each company has its own QS professionals  
✅ **Independent projects** - Each company manages projects separately  
✅ **Shared supplier data** - All companies see the same real-time supplier products  
✅ **Company-specific pricing** - Suppliers can offer special prices to specific companies  

---

## 🏗️ How It Works

### 1. Multiple Companies with Independent Projects

```
Company A (ABC Construction)
├── QS User 1
│   ├── Project: Office Building
│   └── Project: Warehouse
└── QS User 2
    └── Project: Residential Complex

Company B (XYZ Builders)
├── QS User 3
│   ├── Project: Shopping Mall
│   └── Project: Hotel
└── QS User 4
    └── Project: Apartment Building
```

**Each company:**
- Has its own QS users
- Manages projects independently
- Cannot see other companies' projects
- Has its own quote history

### 2. Shared Real-Time Supplier Data

```
All Companies See:
├── Supplier 1 Products
│   ├── Cement: $50/bag (base price)
│   ├── Steel: $200/unit (base price)
│   └── Sand: $2/kg (base price)
└── Supplier 2 Products
    ├── Cement: $48/bag (base price)
    └── Steel: $195/unit (base price)
```

**All QS professionals from all companies:**
- See the same supplier products
- See base/default prices
- Get real-time price updates
- Can query any product

### 3. Company-Specific Special Prices

```
Supplier 1 offers:
├── Cement
│   ├── Base Price: $50/bag (all companies see this)
│   ├── Company A Special: $45/bag (only Company A sees this)
│   └── Company B Special: $47/bag (only Company B sees this)
└── Steel
    ├── Base Price: $200/unit (all companies see this)
    └── Company A Special: $190/unit (only Company A sees this)
```

**When QS from Company A asks for cement price:**
- AI Agent checks: "Is there a special price for Company A?"
- If yes: Shows $45/bag (special price)
- If no: Shows $50/bag (base price)

**When QS from Company B asks for cement price:**
- AI Agent checks: "Is there a special price for Company B?"
- If yes: Shows $47/bag (special price)
- If no: Shows $50/bag (base price)

---

## 📊 Database Schema

### Core Structure

```prisma
// Organizations (Companies and Suppliers)
model Organization {
  id        String
  name      String
  type      OrgType  // company | supplier
  // ...
  projects  Project[]      // Each company has its own projects
  companyPrices CompanyPrice[] // Company-specific prices
}

// Products (Shared across all companies)
model Product {
  id         String
  supplierId String
  name       String
  price      Decimal  // Base price (all companies see this)
  // ...
  companyPrices CompanyPrice[] // Special prices for specific companies
}

// Company-Specific Prices
model CompanyPrice {
  id         String
  productId  String
  companyId  String  // Which company gets this price
  price      Decimal // Special price for this company
  effectiveFrom DateTime
  effectiveUntil DateTime? // Optional expiration
}

// Projects (Company-specific)
model Project {
  id        String
  companyId String  // Each project belongs to one company
  ownerId   String  // QS user who owns the project
  // ...
}
```

---

## 🔄 How It Works in Practice

### Scenario 1: QS from Company A Queries Price

```
QS (Company A): "What's the price of cement?"

AI Agent:
1. Gets user's companyId (Company A)
2. Queries Product: "cement" → Base price: $50/bag
3. Checks CompanyPrice: "cement + Company A" → Special: $45/bag
4. Returns: "$45/bag (special price for your company)"
```

### Scenario 2: QS from Company B Queries Same Product

```
QS (Company B): "What's the price of cement?"

AI Agent:
1. Gets user's companyId (Company B)
2. Queries Product: "cement" → Base price: $50/bag
3. Checks CompanyPrice: "cement + Company B" → Special: $47/bag
4. Returns: "$47/bag (special price for your company)"
```

### Scenario 3: QS from Company C (No Special Price)

```
QS (Company C): "What's the price of cement?"

AI Agent:
1. Gets user's companyId (Company C)
2. Queries Product: "cement" → Base price: $50/bag
3. Checks CompanyPrice: "cement + Company C" → None found
4. Returns: "$50/bag (standard price)"
```

### Scenario 4: Supplier Sets Special Price

```
Supplier: "Set special price for Company A: $45/bag for cement"

System:
1. Creates CompanyPrice record:
   - productId: "cement-id"
   - companyId: "company-a-id"
   - price: $45
2. Next time Company A QS queries:
   - Shows $45 (special price)
3. Other companies still see $50 (base price)
```

---

## 🎯 Key Features

### For QS Professionals

1. **Independent Projects**
   - Each company's projects are separate
   - Cannot see other companies' projects
   - Each company has its own quote history

2. **Shared Supplier Data**
   - See all supplier products
   - See base prices
   - Real-time updates

3. **Company-Specific Prices**
   - Automatically see special prices for your company
   - AI Agent uses best available price (special or base)
   - Transparent pricing

### For Suppliers

1. **Set Base Prices**
   - One price visible to all companies
   - Easy to manage

2. **Set Company-Specific Prices**
   - Offer special deals to specific companies
   - Set effective dates (temporary discounts)
   - Manage multiple company prices

3. **Price Management**
   - Update base prices (affects all companies)
   - Update company prices (affects specific company)
   - Track price history

---

## 💡 Example Use Cases

### Use Case 1: Volume Discount

**Supplier offers:**
- Base price: $50/bag (all companies)
- Company A (large volume): $45/bag (special)
- Company B (medium volume): $47/bag (special)

**Result:**
- Company A QS sees: $45/bag
- Company B QS sees: $47/bag
- Company C QS sees: $50/bag

### Use Case 2: Temporary Promotion

**Supplier offers:**
- Base price: $50/bag
- Company A special: $40/bag (valid until Dec 31)

**Result:**
- Before Dec 31: Company A sees $40/bag
- After Dec 31: Company A sees $50/bag (base price)

### Use Case 3: Project-Based Quotes

**Company A QS:**
- Creates "Office Building" project
- Generates quote using Company A's special prices
- Quote saved to Company A's project
- Company B cannot see this quote

---

## 🔒 Data Isolation

### Company Data Isolation

- ✅ Projects are company-specific
- ✅ Quotes are company-specific
- ✅ Each company only sees its own data
- ✅ QS users can only access their company's projects

### Shared Data

- ✅ Supplier products (all companies see)
- ✅ Base prices (all companies see)
- ✅ Supplier information (all companies see)

### Company-Specific Data

- ✅ Company prices (only that company sees)
- ✅ Projects (only that company sees)
- ✅ Quotes (only that company sees)

---

## ✅ Summary

**The QS AI Agent supports:**

1. ✅ **Multiple Companies** - Each with independent QS users
2. ✅ **Independent Projects** - Each company manages separately
3. ✅ **Shared Supplier Data** - All companies see same products/prices
4. ✅ **Company-Specific Pricing** - Suppliers can offer special prices
5. ✅ **Data Isolation** - Companies cannot see each other's data
6. ✅ **Real-Time Updates** - All prices update in real-time

**Perfect for multi-company environments!**
