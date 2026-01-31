# QS AI Agent - Complete Technical Architecture

## 🎯 System Overview

A self-learning AI Agent system for Quantity Surveyors that combines:
- **Natural Language Processing** (GPT-4)
- **Real-Time Data Integration** (Supplier prices)
- **Self-Learning Engine** (Improves over time)
- **Project Management** (Project-based quotes)
- **Quote Generation** (Automatic quote creation)

---

## 🏗️ Complete Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    QS AI Agent System                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  QS Interface     │              │ Supplier Interface│       │
│  │  (Next.js)        │              │ (Next.js)         │       │
│  │                   │              │                   │       │
│  │  - AI Chat UI     │              │  - Product Form   │       │
│  │  - Project View   │              │  - Price Updates  │       │
│  │  - Quote View     │              │  - Analytics      │       │
│  │  - Dashboard      │              │                   │       │
│  └──────────────────┘              └──────────────────┘        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                      │
│  │  AI Agent API    │  │  Project API     │                      │
│  │  /api/v1/agent   │  │  /api/v1/projects│                    │
│  │                  │  │                  │                     │
│  │  - Chat          │  │  - CRUD          │                     │
│  │  - Actions       │  │  - Quotes        │                     │
│  │  - Learning      │  │  - Tracking      │                     │
│  └──────────────────┘  └──────────────────┘                      │
│  ┌──────────────────┐  ┌──────────────────┐                      │
│  │  Product API    │  │  Supplier API    │                      │
│  │  /api/v1/products│ │  /api/v1/suppliers│                   │
│  └──────────────────┘  └──────────────────┘                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent Core Engine                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Natural Language Processor                              │  │
│  │  - Intent Recognition (price, quote, project, etc.)       │  │
│  │  - Entity Extraction (products, quantities, projects)    │  │
│  │  - Context Understanding (project context, history)      │  │
│  │  - Multi-turn Conversations                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Self-Learning Engine                                     │  │
│  │  - Interaction Learning (learns from QS queries)         │  │
│  │  - Preference Learning (remembers supplier preferences)   │  │
│  │  - Pattern Recognition (identifies usage patterns)         │  │
│  │  - Response Improvement (gets better over time)          │  │
│  │  - Context Memory (remembers project context)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Action Executor                                         │  │
│  │  - Query Supplier Data (get real-time prices)           │  │
│  │  - Generate Quotes (create formatted quotes)            │  │
│  │  - Manage Projects (CRUD operations)                    │  │
│  │  - Calculate Costs (quantity calculations)              │  │
│  │  - Compare Suppliers (best price analysis)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LLM Integration (OpenAI GPT-4)                          │  │
│  │  - Natural Language Generation                           │  │
│  │  - Context-Aware Responses                               │  │
│  │  - Multi-step Reasoning                                 │  │
│  │  - Function Calling (database queries)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────┐                  ┌──────────────┐
│  Data Layer  │                  │  Learning    │
│              │                  │  Storage     │
│  - Suppliers │                  │              │
│  - Products   │                  │  - Patterns  │
│  - Projects  │                  │  - Preferences│
│  - Quotes    │                  │  - Context   │
│  - Users     │                  │  - History   │
└──────────────┘                  └──────────────┘
```

---

## 🧠 Self-Learning Architecture

### Learning Components

```
┌─────────────────────────────────────────────────────────────┐
│              Self-Learning System                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Interaction Learning                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Input: QS asks "What's the price of cement?"         │  │
│  │  Action: AI queries database, generates response     │  │
│  │  Learning:                                            │  │
│  │    - Remembers this query pattern                    │  │
│  │    - Learns QS prefers certain suppliers             │  │
│  │    - Adapts response format                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Preference Learning                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pattern: QS always selects GHI Builders            │  │
│  │  Learning:                                           │  │
│  │    - Stores preference: GHI Builders for cement      │  │
│  │    - Shows GHI Builders first in future queries     │  │
│  │    - Explains why (preferred supplier)              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Pattern Recognition                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pattern: Office projects always use Cement+Steel   │  │
│  │  Learning:                                           │  │
│  │    - Recognizes project type patterns                │  │
│  │    - Suggests materials for similar projects        │  │
│  │    - Pre-fills quote templates                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Knowledge Base Update                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Stores:                                            │  │
│  │    - User preferences                                │  │
│  │    - Usage patterns                                  │  │
│  │    - Project templates                               │  │
│  │    - Supplier relationships                          │  │
│  │    - Price patterns                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Data Flow

### AI Agent Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│  QS Request: "Generate quote for Office Building project"  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Natural Language Processing                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Intent: generate_quote                              │  │
│  │  Entities:                                          │  │
│  │    - project: "Office Building"                     │  │
│  │    - action: "generate quote"                        │  │
│  │  Context: Project exists, has materials              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Context Retrieval                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Get project details                              │  │
│  │  - Get project materials                            │  │
│  │  - Get user preferences                             │  │
│  │  - Get learning patterns                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Supplier Data Query                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  For each material in project:                       │  │
│  │    - Query supplier database                        │  │
│  │    - Get best prices                                 │  │
│  │    - Apply user preferences                          │  │
│  │    - Get real-time data                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Quote Generation                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Calculate quantities × prices                    │  │
│  │  - Apply best suppliers                             │  │
│  │  - Format quote structure                           │  │
│  │  - Include project context                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: AI Response Generation                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Build context for LLM                            │  │
│  │  - Generate natural language response               │  │
│  │  - Include quote data                                │  │
│  │  - Add recommendations                               │  │
│  └──────────────────────────────────────────────────────┘
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Learning Update                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Store interaction                                 │  │
│  │  - Update preferences                                │  │
│  │  - Learn patterns                                    │  │
│  │  - Improve knowledge base                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Response to QS                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  {                                                    │  │
│  │    "answer": "Here's your quote for Office Building",│  │
│  │    "quote": { ... },                                  │  │
│  │    "recommendations": [ ... ]                         │  │
│  │  }                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Enhanced Database Schema

### Complete Schema for AI Agent

```prisma
// Organizations
model Organization {
  id        String   @id @default(uuid())
  name      String
  type      OrgType  // company | supplier
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users    User[]
  products Product[] @relation("SupplierProducts")
  projects Project[] @relation("CompanyProjects")
}

enum OrgType {
  company
  supplier
}

// Users
model User {
  id             String   @id @default(uuid())
  organizationId String
  email          String   @unique
  passwordHash   String
  name           String?
  type           UserType // qs | supplier
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization    @relation(fields: [organizationId], references: [id])
  projects      Project[]       @relation("ProjectOwner")
  quotes        Quote[]         @relation("QuoteCreator")
  preferences   UserPreference?
  interactions  AIInteraction[] // Learning data
}

enum UserType {
  qs
  supplier
}

// Products
model Product {
  id         String   @id @default(uuid())
  supplierId String
  name       String
  price      Decimal
  unit       String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  supplier   Organization @relation("SupplierProducts", fields: [supplierId], references: [id])
  quoteItems QuoteItem[]
  priceHistory PriceHistory[] // Track price changes for learning
}

// Price History (for AI learning)
model PriceHistory {
  id        String   @id @default(uuid())
  productId String
  price     Decimal
  changedAt DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@index([changedAt])
}

// Projects
model Project {
  id          String        @id @default(uuid())
  companyId   String
  ownerId     String
  name        String
  description String?
  type        String?       // commercial, residential, etc.
  location    String?
  status      ProjectStatus @default(planning)
  metadata    Json?         // Additional project data
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  company Organization @relation("CompanyProjects", fields: [companyId], references: [id])
  owner   User         @relation("ProjectOwner", fields: [ownerId], references: [id])
  quotes  Quote[]
}

enum ProjectStatus {
  planning
  active
  completed
  cancelled
}

// Quotes
model Quote {
  id          String      @id @default(uuid())
  projectId   String?
  createdById String
  title       String
  description String?
  totalAmount Decimal
  status      QuoteStatus @default(draft)
  metadata    Json?       // Additional quote data
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  project Project?    @relation(fields: [projectId], references: [id])
  creator User        @relation("QuoteCreator", fields: [createdById], references: [id])
  items   QuoteItem[]
}

enum QuoteStatus {
  draft
  sent
  accepted
  rejected
}

// Quote Items
model QuoteItem {
  id        String   @id @default(uuid())
  quoteId   String
  productId String?
  name      String
  quantity  Decimal
  unit      String
  price     Decimal
  total     Decimal
  supplier  String?  // Supplier name
  createdAt DateTime @default(now())

  quote   Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id])
}

// AI Learning: User Preferences
model UserPreference {
  id         String   @id @default(uuid())
  userId     String   @unique
  preferences Json   // { preferredSuppliers: {...}, commonMaterials: [...] }
  patterns   Json    // { projectPatterns: {...}, queryPatterns: [...] }
  context    Json    // { currentProject: {...}, recentQueries: [...] }
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// AI Learning: Interactions
model AIInteraction {
  id          String   @id @default(uuid())
  userId      String
  query       String
  intent      String
  entities    Json     // Extracted entities
  response    String
  context     Json?    // Project context, etc.
  feedback    Json?    // User feedback for learning
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([intent])
  @@index([createdAt])
}
```

---

## 🔧 Technology Stack

### Core Technologies

1. **LLM: OpenAI GPT-4**
   - Natural language understanding
   - Context-aware responses
   - Function calling
   - Multi-step reasoning

2. **Database: PostgreSQL**
   - Primary data storage
   - Projects, quotes, products
   - Learning data storage

3. **Cache: Redis**
   - Fast response caching
   - Session management
   - Real-time data cache

4. **Vector Database (Future): pgvector/Pinecone**
   - Knowledge base storage
   - Semantic search
   - Pattern matching

5. **Backend: Node.js/Express**
   - API server
   - AI Agent engine
   - Business logic

6. **Frontend: Next.js**
   - Chat interface
   - Project management UI
   - Quote views

---

## 🧠 Self-Learning Implementation

### Learning Mechanisms

#### 1. Interaction Learning

```typescript
// Store every interaction
interface AIInteraction {
  userId: string;
  query: string;
  intent: string;
  entities: any;
  response: string;
  context: any;
  feedback?: any;
}

// Learn from patterns
- Most common queries
- Preferred suppliers
- Project types
- Material combinations
```

#### 2. Preference Learning

```typescript
// Track user preferences
interface UserPreference {
  preferredSuppliers: {
    [product: string]: string; // product -> supplier
  };
  commonMaterials: string[];
  projectPatterns: {
    [projectType: string]: string[]; // type -> materials
  };
}

// Update based on usage
- Track supplier selections
- Learn material preferences
- Remember project patterns
```

#### 3. Pattern Recognition

```typescript
// Identify patterns
- Office projects → Cement + Steel + Sand
- Residential → Different material mix
- User always asks for best price first
- User prefers certain suppliers

// Apply patterns
- Suggest materials for new projects
- Pre-fill quote templates
- Show preferred suppliers first
```

---

## 📊 Project Management Flow

### Project Lifecycle

```
Create Project
    │
    ▼
Add Materials
    │
    ▼
Generate Quote
    │
    ▼
Compare Quotes
    │
    ▼
Select Best Quote
    │
    ▼
Track Project
    │
    ▼
Complete Project
```

### Quote Generation Flow

```
QS: "Generate quote for Office Building"
    │
    ▼
AI Agent: Get project materials
    │
    ▼
AI Agent: Query suppliers for each material
    │
    ▼
AI Agent: Apply user preferences
    │
    ▼
AI Agent: Calculate totals
    │
    ▼
AI Agent: Generate formatted quote
    │
    ▼
AI Agent: Save to project
    │
    ▼
Return quote to QS
```

---

## 🎯 Implementation Phases

### Phase 1: Core AI Agent (Week 1-2)
- ✅ Natural language interface
- ✅ Real-time supplier data integration
- ✅ Basic quote generation
- ✅ Simple project management

### Phase 2: Self-Learning (Week 3-4)
- 📊 Interaction tracking
- 📊 Preference learning
- 📊 Pattern recognition
- 📊 Knowledge base

### Phase 3: Advanced Features (Week 5-6)
- 🚀 Project-based quotes
- 🚀 Quote comparison
- 🚀 Project analytics
- 🚀 Advanced learning

### Phase 4: Optimization (Week 7-8)
- ⚡ Performance optimization
- ⚡ Learning accuracy
- ⚡ User experience polish
- ⚡ Production readiness

---

## 📋 Key Components to Build

### Backend Services

1. **AI Agent Service**
   - Natural language processing
   - Intent recognition
   - Action execution
   - Response generation

2. **Learning Service**
   - Interaction tracking
   - Preference management
   - Pattern recognition
   - Knowledge base updates

3. **Project Service**
   - Project CRUD
   - Project context
   - Project quotes
   - Project tracking

4. **Quote Service**
   - Quote generation
   - Quote formatting
   - Quote comparison
   - Quote management

5. **Data Service**
   - Supplier data queries
   - Real-time price updates
   - Product search
   - Data caching

---

## 🎯 This is the Complete Architecture

**A self-learning AI Agent that:**
- Understands natural language
- Accesses real-time data
- Learns from every interaction
- Manages projects
- Generates quotes
- Improves over time

**Ready to build!**
