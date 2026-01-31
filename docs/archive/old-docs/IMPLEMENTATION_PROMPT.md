# Single Implementation Prompt for Cursor

Copy and paste this entire prompt to Cursor to implement the AI QS Assistant:

---

## 🎯 IMPLEMENTATION REQUEST: AI QS Assistant (ConstructGPT/QSGPT)

Transform this construction pricing platform into an **AI-first QS Assistant** where Quantity Surveyors can ask questions in natural language and get instant answers powered by real-time supplier pricing data.

### Core Vision
**"ChatGPT for Quantity Surveyors - with real-time supplier pricing data"**

QS professionals should be able to:
- Ask: "What's the price of cement?" → Get real supplier prices instantly
- Ask: "How much for 100 bags of cement and 50 steel bars?" → Get calculated total
- Ask: "What's the difference between M20 and M25 concrete?" → Get specs with current prices

---

## 📋 REQUIREMENTS

### 1. Simplified User System (2 Types Only)

**Remove all complex roles and approvals. Keep only:**

- **Company Users (QS Professionals)**
  - Type: `qs`
  - Can: Use AI chat, ask questions, view prices
  - Cannot: Add/edit products

- **Supplier Users**
  - Type: `supplier`
  - Can: Add/edit/delete products and prices
  - Cannot: Use AI chat

**No roles, no approvals, instant access after registration.**

### 2. Simplified Database Schema

**Replace current complex schema with 3 simple tables:**

```prisma
// Organizations (Companies and Suppliers)
model Organization {
  id        String   @id @default(uuid())
  name      String
  type      OrgType  // company | supplier
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users    User[]
  products Product[] @relation("SupplierProducts")
}

enum OrgType {
  company
  supplier
}

// Users (QS and Suppliers)
model User {
  id             String       @id @default(uuid())
  organizationId String
  email          String       @unique
  passwordHash   String
  name           String?
  type           UserType     // qs | supplier
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

enum UserType {
  qs
  supplier
}

// Products (from Suppliers only)
model Product {
  id         String      @id @default(uuid())
  supplierId String
  name       String
  price      Decimal
  unit       String
  updatedAt  DateTime    @updatedAt
  createdAt  DateTime    @default(now())

  supplier Organization @relation("SupplierProducts", fields: [supplierId], references: [id], onDelete: Cascade)
  
  @@index([name])
  @@index([supplierId])
}
```

**Remove all other tables:**
- ❌ DefaultPrice, PrivatePrice
- ❌ PriceAuditLog, PriceView
- ❌ QuoteRequest, QuoteResponse
- ❌ ProductCategory, ServiceCategory
- ❌ ProductImage
- ❌ All approval/status fields

### 3. Simplified Registration

**Replace complex 7-option registration with simple 2-step flow:**

**Step 1: Choose User Type**
- Radio button: "I'm a QS Professional" or "I'm a Supplier"

**Step 2: Organization**
- Radio button: "Create new [company/supplier]" or "Join existing [company/supplier]"
- If create: Input organization name
- If join: Dropdown to select existing organization

**Step 3: User Info**
- Email, Password, Name (optional)

**No phone, address, postal code. No approval workflows. Instant access after registration.**

### 4. AI Chat Interface (Primary Feature)

**Create ChatGPT-like interface for QS users:**

**Location:** `/qs/chat` or `/chat` (for QS users)

**Features:**
- Chat interface with message history
- Input field for questions
- AI responses with real supplier data
- Format supplier prices in responses
- Show calculations when asked

**Example Flow:**
```
QS: "What's the price of cement?"
AI: "Based on current supplier data:
     - ABC Supplies: $50/bag
     - DEF Materials: $52/bag
     - GHI Builders: $48/bag
     Best price: $48/bag from GHI Builders"
```

**Backend API:**
- `POST /api/v1/chat` - Send question, get AI response
- Integrate OpenAI/Claude API
- Extract products from questions
- Query supplier database
- Generate AI response with real data

### 5. Supplier Dashboard (Secondary Feature)

**Simple product management for suppliers:**

**Location:** `/supplier/products` (for supplier users)

**Features:**
- Add product form (name, price, unit)
- List of products
- Edit product prices
- Delete products

**No categories, no SKUs, no images. Just name, price, unit.**

### 6. AI Integration

**Backend AI Service:**

```typescript
// packages/backend/src/services/aiService.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function askQSQuestion(
  question: string,
  supplierData?: any[]
): Promise<string> {
  const systemPrompt = `You are a helpful Quantity Surveyor assistant. 
You help QS professionals with construction pricing, material specifications, 
and cost calculations.

${supplierData ? `Current supplier prices:
${formatSupplierData(supplierData)}` : ''}

Always include real supplier prices when available. Be concise and helpful.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4', // or 'gpt-3.5-turbo'
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || '';
}
```

**Query Processing:**
- Extract products/materials from questions
- Search supplier database
- Get real-time prices
- Format for AI response
- Generate answer with data

### 7. Permission System

**Simple type-based access control:**

```typescript
// Middleware
export function requireQS(req, res, next) {
  if (req.user?.type !== 'qs') {
    return res.status(403).json({ error: 'QS access required' });
  }
  next();
}

export function requireSupplier(req, res, next) {
  if (req.user?.type !== 'supplier') {
    return res.status(403).json({ error: 'Supplier access required' });
  }
  next();
}
```

**Route Protection:**
- `/api/v1/chat` → requireQS
- `/api/v1/products` (POST/PUT/DELETE) → requireSupplier
- `/api/v1/products/search` → requireQS

### 8. Remove/Simplify

**Remove:**
- ❌ All approval workflows
- ❌ Super admin, tenant admin features
- ❌ Complex role system
- ❌ Private pricing
- ❌ RFQ/Quote system
- ❌ Real-time WebSocket (use polling or simple refresh)
- ❌ Analytics/audit logging
- ❌ Categories
- ❌ Product images
- ❌ Service providers (keep only company/supplier)

**Simplify:**
- ✅ Registration: 2 user types, instant access
- ✅ Database: 3 tables only
- ✅ Permissions: Type-based checks
- ✅ UI: Focus on chat interface for QS, simple form for suppliers

---

## 🎨 UI/UX Requirements

### QS Dashboard (Primary)
- **Main Page:** AI chat interface (ChatGPT-like)
- Clean, modern design
- Message history
- Input field at bottom
- Mobile responsive

### Supplier Dashboard (Secondary)
- **Main Page:** Product management
- Simple form to add products
- List of products with edit/delete
- No complex features

### Registration Page
- **Step 1:** Radio buttons for user type
- **Step 2:** Radio buttons for create/join organization
- **Step 3:** Simple form (email, password, name)
- Clean, minimal design

---

## 🔧 Technical Requirements

### Backend
- Node.js/Express
- Prisma ORM with simplified schema
- OpenAI/Claude API integration
- JWT authentication (simplified, no roles)
- Type-based permission middleware

### Frontend
- Next.js 14
- React components
- Tailwind CSS
- Chat interface component
- Simple forms

### Database
- PostgreSQL
- 3 tables only (Organizations, Users, Products)
- Simple relationships
- Indexes for search

---

## 📋 Implementation Checklist

### Phase 1: Database & Auth
- [ ] Update Prisma schema (3 tables)
- [ ] Create migration
- [ ] Simplify auth service (remove approvals)
- [ ] Update registration endpoint (2 types)
- [ ] Add type-based permission middleware

### Phase 2: AI Integration
- [ ] Set up OpenAI/Claude API
- [ ] Create AI service
- [ ] Create chat endpoint
- [ ] Product extraction from questions
- [ ] Supplier data integration

### Phase 3: Frontend
- [ ] Simplify registration page
- [ ] Create QS chat interface
- [ ] Create supplier product dashboard
- [ ] Update routing (based on user type)
- [ ] Mobile responsive

### Phase 4: Testing & Polish
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] UI polish
- [ ] Documentation

---

## 🎯 Success Criteria

### Must Work
- ✅ QS can register and use AI chat immediately
- ✅ Suppliers can register and add products immediately
- ✅ AI answers include real supplier prices
- ✅ QS can ask calculation questions
- ✅ Suppliers can update prices

### Nice to Have
- 📊 Quote generation from chat
- 📝 Quantity takeoff assistance
- 🔍 Advanced product search

---

## 💡 Key Principles

1. **Simple First** - 2 user types, 3 tables, instant access
2. **AI-First** - Chat interface is primary feature
3. **Real Data** - All AI answers include actual supplier prices
4. **No Friction** - No approvals, no waiting, instant value
5. **Mobile Ready** - Responsive design, works on all devices

---

## 🚀 Expected Outcome

After implementation:
- QS professionals can sign up and ask questions in < 2 minutes
- Suppliers can sign up and add products in < 1 minute
- AI provides instant answers with real supplier data
- Simple, focused, fast product

---

**Start with database schema simplification, then auth, then AI integration, then frontend. Test each phase before moving to next.**
