# Architecture Overview - QS AI Agent

## 🏗️ Complete System Architecture

This document provides a high-level overview of the QS AI Agent architecture.

---

## 🎯 System Components

### 1. Frontend Layer

**Next.js Application**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  QS Interface    │        │ Supplier Interface│         │
│  │                  │        │                  │          │
│  │  - AI Chat UI    │        │  - Product Form   │          │
│  │  - Project View  │        │  - Price Updates  │          │
│  │  - Quote View    │        │  - Analytics      │          │
│  │  - Dashboard     │        │                  │          │
│  └──────────────────┘        └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Technologies:**
- Next.js 14 (React framework)
- React Components
- Tailwind CSS (styling)
- Real-time updates

---

### 2. API Layer

**Express.js Backend**

```
┌─────────────────────────────────────────────────────────────┐
│                    API Server (Express)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  AI Agent API    │  │  Project API     │                 │
│  │  /api/v1/agent   │  │  /api/v1/projects│               │
│  │                  │  │                  │                │
│  │  - Chat          │  │  - CRUD          │                │
│  │  - Actions       │  │  - Quotes        │                │
│  │  - Learning      │  │  - Tracking      │                │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Product API     │  │  Auth API        │                 │
│  │  /api/v1/products│  │  /api/v1/auth   │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

**Technologies:**
- Express.js (API server)
- TypeScript
- JWT authentication
- Type-based permissions

---

### 3. AI Agent Core

**The Brain of the System**

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Core                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Natural Language Processor                            │ │
│  │  - Intent Recognition                                  │ │
│  │  - Entity Extraction                                  │ │
│  │  - Context Understanding                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Self-Learning Engine                                  │ │
│  │  - Interaction Learning                                │ │
│  │  - Preference Learning                                 │ │
│  │  - Pattern Recognition                                 │ │
│  │  - Knowledge Base Updates                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Action Executor                                       │ │
│  │  - Query Supplier Data                                 │ │
│  │  - Generate Quotes                                     │ │
│  │  - Manage Projects                                     │ │
│  │  - Calculate Costs                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  LLM Integration (OpenAI GPT-4)                        │ │
│  │  - Natural Language Generation                         │ │
│  │  - Context-Aware Responses                            │ │
│  │  - Multi-step Reasoning                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Technologies:**
- OpenAI GPT-4 (LLM)
- Custom learning algorithms
- Pattern recognition
- Knowledge base management

---

### 4. Data Layer

**PostgreSQL Database**

```
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Core Tables:                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Organizations │  │    Users     │  │   Products   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Extended Tables:                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Projects    │  │   Quotes     │  │ QuoteItems   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Learning Tables:                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │PriceHistory  │  │UserPreference│  │AIInteraction │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Technologies:**
- PostgreSQL 15+
- Prisma ORM
- Indexed for performance
- JSON fields for flexibility

---

### 5. Cache Layer

**Redis Cache**

```
┌─────────────────────────────────────────────────────────────┐
│                    Cache (Redis)                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  AI Responses    │  │  Supplier Data   │                │
│  │  TTL: 60 seconds │  │  TTL: 30 seconds │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  User Sessions   │  │  Project Cache   │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

**Technologies:**
- Redis 7+
- Fast caching
- Session management
- Real-time data cache

---

## 🔄 Complete Data Flow

### End-to-End Flow

```
┌─────────────────────────────────────────────────────────────┐
│  QS Professional                                            │
│  Types: "Generate quote for Office Building"                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                         │
│  - Sends request to API                                      │
│  - Shows loading state                                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP POST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  API Layer (Express)                                        │
│  - Authenticates user                                       │
│  - Checks permissions (requireQS)                           │
│  - Routes to AI Agent service                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Agent Core                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Natural Language Processing                      │  │
│  │     - Intent: generate_quote                         │  │
│  │     - Entity: project "Office Building"             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. Context Retrieval                                │  │
│  │     - Get project details                            │  │
│  │     - Get project materials                          │  │
│  │     - Get user preferences                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. Supplier Data Query                              │  │
│  │     - Query products database                        │  │
│  │     - Get real-time prices                           │  │
│  │     - Apply user preferences                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  4. Quote Generation                                 │  │
│  │     - Calculate totals                               │  │
│  │     - Format quote                                   │  │
│  │     - Save to database                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  5. AI Response Generation                            │  │
│  │     - Build context for LLM                          │  │
│  │     - Generate natural language                      │  │
│  │     - Include quote data                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  6. Learning Update                                   │  │
│  │     - Store interaction                               │  │
│  │     - Update preferences                              │  │
│  │     - Learn patterns                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────┐              ┌──────────────┐
│  Database    │              │    Cache     │
│  (PostgreSQL)│              │   (Redis)    │
│              │              │              │
│  - Save quote│              │  - Cache     │
│  - Store     │              │    response  │
│    interaction│              │  - Cache     │
│              │              │    data      │
└──────────────┘              └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Response to Frontend                                       │
│  {                                                          │
│    "answer": "Here's your quote...",                       │
│    "quote": { ... },                                        │
│    "project": { ... }                                       │
│  }                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Displays                                           │
│  - Shows AI response                                         │
│  - Displays quote                                            │
│  - Updates project view                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 Self-Learning Architecture

### Learning Components

```
┌─────────────────────────────────────────────────────────────┐
│              Self-Learning System                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Interaction Tracking                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Every user interaction stored in AIInteraction      │  │
│  │  - Query text                                         │  │
│  │  - Detected intent                                    │  │
│  │  - Extracted entities                                 │  │
│  │  - AI response                                        │  │
│  │  - User context                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Pattern Analysis                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Analyze interactions to find patterns:              │  │
│  │  - Common queries                                     │  │
│  │  - Supplier preferences                               │  │
│  │  - Project patterns                                   │  │
│  │  - Material combinations                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Knowledge Base Update                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Update UserPreference:                               │  │
│  │  - Store learned preferences                          │  │
│  │  - Update usage patterns                              │  │
│  │  - Save project context                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Improved Responses                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next interaction uses learned data:                  │  │
│  │  - Shows preferred suppliers first                    │  │
│  │  - Suggests based on patterns                         │  │
│  │  - Uses project context                               │  │
│  │  - Provides personalized recommendations              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

### Backend
- **Node.js** - Runtime
- **Express.js** - API framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM

### AI & Learning
- **OpenAI GPT-4** - LLM
- **Custom Learning Engine** - Pattern recognition
- **Vector Database** (future) - Knowledge base

### Database
- **PostgreSQL 15+** - Primary database
- **Redis 7+** - Caching
- **pgvector** (future) - Vector search

### Infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Vercel/Railway** - Deployment

---

## 📊 System Scalability

### Current Architecture
- **Single server** - Handles all requests
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **OpenAI API** - External AI service

### Future Scalability
- **Horizontal scaling** - Multiple API servers
- **Database replication** - Read replicas
- **CDN** - Static asset delivery
- **Load balancing** - Distribute traffic
- **Vector database** - Separate knowledge base

---

## 🔒 Security Architecture

### Authentication
- **JWT tokens** - Stateless authentication
- **Password hashing** - bcrypt
- **Session management** - Redis

### Authorization
- **Type-based** - QS vs Supplier
- **Organization isolation** - Data separation
- **Project ownership** - User-specific projects

### Data Protection
- **HTTPS** - Encrypted connections
- **Input validation** - Prevent injection
- **Rate limiting** - Prevent abuse
- **API keys** - Secure storage

---

## 📈 Performance Architecture

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Browser Cache                                     │
│  - Static assets                                            │
│  - UI components                                            │
│                                                              │
│  Layer 2: Redis Cache                                        │
│  - AI responses (60 seconds)                                │
│  - Supplier data (30 seconds)                               │
│  - User sessions                                            │
│                                                              │
│  Layer 3: Database                                           │
│  - Persistent data                                           │
│  - Indexed queries                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Performance Targets

- **AI Response Time:** < 2 seconds (with cache: < 100ms)
- **Database Queries:** < 50ms
- **Page Load Time:** < 1 second
- **Quote Generation:** < 1 second

---

## 🎯 Key Architecture Principles

1. **Simplicity** - Simple, focused architecture
2. **Scalability** - Ready for growth
3. **Learning** - Self-improving system
4. **Real-Time** - Always current data
5. **Performance** - Fast responses
6. **Security** - Secure by design

---

## 📋 Component Breakdown

### Backend Services

1. **AI Agent Service**
   - Natural language processing
   - Intent recognition
   - Action execution
   - Response generation

2. **Learning Service**
   - Interaction tracking
   - Pattern analysis
   - Preference management
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
   - Supplier queries
   - Product search
   - Price updates
   - Data caching

---

## ✅ Architecture Summary

**This architecture supports:**
- ✅ Natural language AI (GPT-4)
- ✅ Real-time supplier data
- ✅ Self-learning capabilities
- ✅ Project management
- ✅ Quote generation
- ✅ Scalable design
- ✅ High performance

**Ready for implementation!**
