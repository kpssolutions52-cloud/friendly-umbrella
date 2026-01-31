# Database Schema - QS AI Agent

## 🗄️ Complete Database Structure

This document describes the complete database schema for the QS AI Agent system.

---

## 📊 Schema Overview

### Core Tables (3 Main Tables)

1. **Organizations** - Companies and Suppliers
2. **Users** - QS Professionals and Suppliers
3. **Products** - Supplier products and prices

### Extended Tables (For AI Agent Features)

4. **Projects** - QS projects
5. **Quotes** - Generated quotes
6. **QuoteItems** - Items in quotes
7. **PriceHistory** - Price change tracking (for learning)
8. **UserPreference** - AI learning data
9. **AIInteraction** - Interaction history (for learning)

---

## 📋 Complete Schema

### Organizations Table

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  type      OrgType  // company | supplier
  email     String   @unique @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users    User[]
  products Product[] @relation("SupplierProducts")
  projects Project[] @relation("CompanyProjects")

  @@index([type])
  @@map("organizations")
}

enum OrgType {
  company
  supplier
}
```

**Purpose:** Stores companies (QS organizations) and suppliers

**Key Fields:**
- `type` - Distinguishes companies from suppliers
- `email` - Primary contact email
- `name` - Organization name

---

### Users Table

```prisma
model User {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  email          String   @unique @db.VarChar(255)
  passwordHash   String   @map("password_hash") @db.VarChar(255)
  name           String?  @db.VarChar(255)
  type           UserType // qs | supplier
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  projects      Project[]       @relation("ProjectOwner")
  quotes        Quote[]         @relation("QuoteCreator")
  preferences   UserPreference?
  interactions AIInteraction[]

  @@index([organizationId])
  @@index([email])
  @@index([type])
  @@map("users")
}

enum UserType {
  qs
  supplier
}
```

**Purpose:** Stores QS professionals and supplier users

**Key Fields:**
- `type` - QS or Supplier
- `organizationId` - Links to organization
- `name` - User's name

---

### Products Table

```prisma
model Product {
  id         String   @id @default(uuid())
  supplierId String   @map("supplier_id")
  name       String   @db.VarChar(255)
  price      Decimal  @db.Decimal(12, 2)
  unit       String   @db.VarChar(50)
  updatedAt  DateTime @updatedAt @map("updated_at")
  createdAt  DateTime @default(now()) @map("created_at")

  supplier    Organization @relation("SupplierProducts", fields: [supplierId], references: [id], onDelete: Cascade)
  quoteItems  QuoteItem[]
  priceHistory PriceHistory[]

  @@index([name])
  @@index([supplierId])
  @@map("products")
}
```

**Purpose:** Stores supplier products with prices

**Key Fields:**
- `name` - Product name (searchable)
- `price` - Current price
- `unit` - Price unit (bag, kg, etc.)
- `supplierId` - Links to supplier organization

---

### Projects Table

```prisma
model Project {
  id          String        @id @default(uuid())
  companyId   String        @map("company_id")
  ownerId     String        @map("owner_id")
  name        String        @db.VarChar(255)
  description String?       @db.Text
  type        String?       @db.VarChar(100) // commercial, residential, etc.
  location    String?       @db.VarChar(255)
  status      ProjectStatus @default(planning)
  metadata    Json?         // Additional project data
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  company Organization @relation("CompanyProjects", fields: [companyId], references: [id], onDelete: Cascade)
  owner   User         @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  quotes  Quote[]

  @@index([companyId])
  @@index([ownerId])
  @@index([status])
  @@map("projects")
}

enum ProjectStatus {
  planning
  active
  completed
  cancelled
}
```

**Purpose:** Stores QS projects

**Key Fields:**
- `name` - Project name
- `type` - Project type (commercial, residential, etc.)
- `status` - Project status
- `companyId` - Links to company organization
- `ownerId` - Links to QS user who owns the project

---

### Quotes Table

```prisma
model Quote {
  id          String      @id @default(uuid())
  projectId   String?     @map("project_id")
  createdById String      @map("created_by_id")
  title       String      @db.VarChar(255)
  description String?     @db.Text
  totalAmount Decimal     @db.Decimal(12, 2)
  status      QuoteStatus @default(draft)
  metadata    Json?       // Additional quote data
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  project Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)
  creator User        @relation("QuoteCreator", fields: [createdById], references: [id], onDelete: Cascade)
  items   QuoteItem[]

  @@index([projectId])
  @@index([createdById])
  @@index([status])
  @@map("quotes")
}

enum QuoteStatus {
  draft
  sent
  accepted
  rejected
}
```

**Purpose:** Stores generated quotes

**Key Fields:**
- `projectId` - Links to project (optional, can be standalone)
- `totalAmount` - Total quote amount
- `status` - Quote status
- `createdById` - QS user who created the quote

---

### QuoteItems Table

```prisma
model QuoteItem {
  id        String   @id @default(uuid())
  quoteId   String   @map("quote_id")
  productId String?  @map("product_id")
  name      String   @db.VarChar(255)
  quantity  Decimal  @db.Decimal(10, 2)
  unit      String   @db.VarChar(50)
  price     Decimal  @db.Decimal(12, 2)
  total     Decimal  @db.Decimal(12, 2)
  supplier  String?  @db.VarChar(255) // Supplier name
  createdAt DateTime @default(now()) @map("created_at")

  quote   Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([quoteId])
  @@index([productId])
  @@map("quote_items")
}
```

**Purpose:** Stores items (materials) in quotes

**Key Fields:**
- `quoteId` - Links to quote
- `name` - Material name
- `quantity` - Quantity needed
- `price` - Price per unit
- `total` - Quantity × Price
- `supplier` - Supplier name

---

### PriceHistory Table (For AI Learning)

```prisma
model PriceHistory {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  price     Decimal  @db.Decimal(12, 2)
  changedAt DateTime @default(now()) @map("changed_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([changedAt])
  @@map("price_history")
}
```

**Purpose:** Tracks price changes for AI learning

**Key Fields:**
- `productId` - Links to product
- `price` - Price at this point in time
- `changedAt` - When price changed

**Used for:**
- Learning price patterns
- Detecting price trends
- Understanding market changes

---

### UserPreference Table (For AI Learning)

```prisma
model UserPreference {
  id         String   @id @default(uuid())
  userId     String   @unique @map("user_id")
  preferences Json    // Learned preferences
  patterns   Json     // Usage patterns
  context    Json     // Project context
  updatedAt  DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}
```

**Purpose:** Stores AI learning data for each user

**JSON Structure:**
```json
{
  "preferences": {
    "preferredSuppliers": {
      "cement": "GHI Builders",
      "steel": "Metal Works"
    },
    "commonMaterials": ["cement", "steel", "sand"]
  },
  "patterns": {
    "projectPatterns": {
      "office": ["cement", "steel", "sand"],
      "residential": ["cement", "brick", "tile"]
    },
    "queryPatterns": {
      "mostCommon": ["price", "quote", "project"]
    }
  },
  "context": {
    "currentProject": "Office Building",
    "recentQueries": ["cement", "steel"]
  }
}
```

---

### AIInteraction Table (For AI Learning)

```prisma
model AIInteraction {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  query       String   @db.Text
  intent      String   @db.VarChar(100) // price_query, quote_generation, project_management
  entities    Json     // Extracted entities
  response    String   @db.Text
  context     Json?    // Project context, etc.
  feedback    Json?    // User feedback for learning
  createdAt   DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([intent])
  @@index([createdAt])
  @@map("ai_interactions")
}
```

**Purpose:** Stores all AI interactions for learning

**Key Fields:**
- `query` - User's question
- `intent` - Detected intent (price_query, quote_generation, etc.)
- `entities` - Extracted entities (products, quantities, projects)
- `response` - AI's response
- `context` - Project context, user context
- `feedback` - User feedback (for learning)

**Used for:**
- Learning user patterns
- Improving responses
- Understanding common queries
- Building knowledge base

---

## 🔗 Relationships

### Entity Relationship Diagram

```
Organizations (Companies & Suppliers)
    │
    ├── Users (QS & Suppliers)
    │       │
    │       ├── Projects (QS Projects)
    │       │       │
    │       │       └── Quotes (Project Quotes)
    │       │               │
    │       │               └── QuoteItems (Materials)
    │       │                       │
    │       │                       └── Products (Supplier Products)
    │       │
    │       ├── UserPreference (AI Learning)
    │       │
    │       └── AIInteraction (Interaction History)
    │
    └── Products (Supplier Products)
            │
            ├── PriceHistory (Price Tracking)
            │
            └── QuoteItems (Used in Quotes)
```

---

## 📊 Table Summary

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **Organizations** | Companies & Suppliers | Simple, 2 types |
| **Users** | QS & Supplier users | 2 types, no roles |
| **Products** | Supplier products | Name, price, unit |
| **Projects** | QS projects | Project management |
| **Quotes** | Generated quotes | Project-based |
| **QuoteItems** | Quote materials | Links products to quotes |
| **PriceHistory** | Price tracking | AI learning data |
| **UserPreference** | User preferences | AI learning data |
| **AIInteraction** | Interaction history | AI learning data |

**Total: 9 tables** (3 core + 6 extended for AI Agent features)

---

## 🎯 Key Design Principles

### 1. Simplicity
- **3 core tables** for basic functionality
- **6 extended tables** for AI Agent features
- Clear relationships
- Easy to understand

### 2. Scalability
- Indexed for performance
- JSON fields for flexible data
- Efficient queries
- Ready for growth

### 3. Learning Support
- PriceHistory for price patterns
- UserPreference for user patterns
- AIInteraction for interaction patterns
- All support self-learning

---

## 🔄 Data Flow

### Price Update Flow

```
Supplier updates price
    │
    ▼
Update Product.price
    │
    ▼
Create PriceHistory record
    │
    ▼
AI Agent learns price change
    │
    ▼
Update knowledge base
    │
    ▼
Next query uses new price
```

### Quote Generation Flow

```
QS requests quote
    │
    ▼
Create Quote record
    │
    ▼
Query Products for materials
    │
    ▼
Create QuoteItem records
    │
    ▼
Calculate total
    │
    ▼
Update Quote.totalAmount
    │
    ▼
Link to Project (if project-based)
```

### Learning Flow

```
User interacts with AI
    │
    ▼
Create AIInteraction record
    │
    ▼
Extract patterns
    │
    ▼
Update UserPreference
    │
    ▼
Improve future responses
```

---

## 📋 Migration Notes

### From Old Schema

**Removed:**
- Complex roles (5+ roles → 2 types)
- Approval workflows (status fields)
- Private pricing (single price now)
- RFQ system (quotes replace it)
- Categories (simple search)
- Service providers (just suppliers)

**Added:**
- Projects table
- Quotes table
- QuoteItems table
- PriceHistory table (for learning)
- UserPreference table (for learning)
- AIInteraction table (for learning)

**Simplified:**
- Organizations (from Tenants)
- Users (removed roles, status, approvals)
- Products (removed categories, SKU, types)

---

## ✅ Schema Benefits

1. **Simple** - Easy to understand
2. **Scalable** - Ready for growth
3. **Learning-Ready** - Supports AI learning
4. **Project-Based** - Organized by projects
5. **Real-Time** - Fast price updates
6. **Flexible** - JSON fields for extensibility

---

**This schema supports the complete QS AI Agent system!**
