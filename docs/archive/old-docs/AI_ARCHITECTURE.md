# AI Technology Architecture for QS Assistant

## 🎯 Overview

This document outlines the AI technology stack and architecture for feeding real-time supplier and company data to GPT for QS professionals.

---

## 🏗️ Architecture Components

### 1. LLM Provider (Core AI Engine)

#### Option 1: OpenAI GPT-4 (Recommended for MVP)
```typescript
// Pros: Best quality, easy integration, fast
// Cons: Cost per token, API rate limits
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview', // or 'gpt-4' for best quality
});
```

#### Option 2: Anthropic Claude (Alternative)
```typescript
// Pros: Great for structured data, longer context
// Cons: Slightly more complex setup
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

#### Option 3: Open-Source (Self-Hosted)
```typescript
// Pros: No API costs, full control
// Cons: Requires infrastructure, setup complexity
// Options: Llama 3, Mistral, Ollama
```

**Recommendation:** Start with **OpenAI GPT-4** for MVP, consider self-hosted later.

---

## 2. Real-Time Data Integration

### Architecture Flow

```
QS Question → AI Service → Data Retrieval Layer → Database → Format → AI Response
```

### Data Sources

1. **Supplier Database** (PostgreSQL)
   - Products table (name, price, unit)
   - Real-time price updates
   - Supplier information

2. **Company Database** (PostgreSQL)
   - Company profiles
   - Historical quotes
   - Project data (future)

3. **Knowledge Base** (Vector Database)
   - Construction specifications
   - Material properties
   - QS best practices
   - Industry standards

---

## 3. Retrieval Augmented Generation (RAG) Architecture

### Why RAG?

- **Real-time data:** Supplier prices change frequently
- **Large knowledge base:** Construction specs, standards
- **Context-aware:** Answers based on actual data, not just training data

### RAG Components

```
┌─────────────────────────────────────────────────────────┐
│                    QS Question                          │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Query Understanding                        │
│  - Extract intent (price query, calculation, spec)      │
│  - Extract entities (products, materials, quantities)   │
└──────────────────┬────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│  Database    │      │  Vector DB   │
│  Retrieval   │      │  Retrieval   │
│  (Products)  │      │  (Knowledge) │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           Context Assembly                              │
│  - Combine supplier data + knowledge base              │
│  - Format for AI prompt                                │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              LLM Generation                             │
│  - GPT-4 with context                                   │
│  - Generate answer with real data                       │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Response to QS                             │
│  - Formatted answer with supplier prices                │
│  - Calculations, comparisons, recommendations           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Vector Database (Knowledge Base)

### Option 1: Pinecone (Recommended)
```typescript
// Pros: Managed, easy setup, good performance
// Cons: Cost per vector
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
```

### Option 2: Weaviate (Self-Hosted)
```typescript
// Pros: Open-source, self-hosted option
// Cons: Requires infrastructure
import weaviate from 'weaviate-ts-client';
```

### Option 3: PostgreSQL with pgvector (Simplest)
```sql
-- Use existing PostgreSQL with pgvector extension
-- Pros: No additional infrastructure
-- Cons: Less optimized for vector search
CREATE EXTENSION IF NOT EXISTS vector;
```

**Recommendation:** Start with **PostgreSQL + pgvector** (simplest), upgrade to Pinecone if needed.

---

## 5. Data Pipeline Architecture

### Real-Time Data Flow

```
┌─────────────────┐
│  Supplier       │
│  Updates Price  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Products)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cache Layer    │
│  (Redis)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Service     │
│  (Query Cache)  │
└─────────────────┘
```

### Implementation

```typescript
// Real-time price updates
// When supplier updates price:
1. Update PostgreSQL
2. Invalidate Redis cache
3. Next AI query uses fresh data

// Caching strategy
- Cache product prices for 30 seconds
- Cache AI responses for 1 minute (if same question)
- Invalidate on price updates
```

---

## 6. Technology Stack Recommendations

### Backend AI Service

```typescript
// Core Stack
- Node.js/Express (API server)
- OpenAI SDK (GPT-4)
- Prisma (Database ORM)
- Redis (Caching)
- PostgreSQL (Primary database + pgvector)

// Optional
- LangChain (LLM orchestration)
- LlamaIndex (RAG framework)
```

### Data Processing

```typescript
// For complex queries
- LangChain: Chain multiple AI calls
- Function Calling: Let AI call database functions
- Streaming: Real-time response streaming
```

---

## 7. Implementation Architecture

### Service Layer Structure

```
packages/backend/src/
├── services/
│   ├── aiService.ts          # Core AI integration
│   ├── dataRetrievalService.ts # Database queries
│   ├── vectorService.ts      # Vector DB operations
│   ├── cacheService.ts       # Redis caching
│   └── queryProcessor.ts    # Query understanding
├── routes/
│   └── chatRoutes.ts        # Chat API endpoints
└── utils/
    ├── promptBuilder.ts     # Build AI prompts
    └── dataFormatter.ts     # Format data for AI
```

### Example: Complete AI Service

```typescript
// packages/backend/src/services/aiService.ts

import OpenAI from 'openai';
import { getSupplierData } from './dataRetrievalService';
import { searchKnowledgeBase } from './vectorService';
import { getCachedResponse, setCachedResponse } from './cacheService';
import { extractIntent, extractEntities } from './queryProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processQSQuestion(question: string): Promise<string> {
  // 1. Check cache
  const cached = await getCachedResponse(question);
  if (cached) return cached;

  // 2. Understand query
  const intent = await extractIntent(question);
  const entities = extractEntities(question);

  // 3. Retrieve data
  let supplierData = null;
  let knowledgeBase = null;

  if (intent === 'price_query' || intent === 'calculation') {
    supplierData = await getSupplierData(entities.products);
  }

  if (intent === 'specification' || intent === 'general') {
    knowledgeBase = await searchKnowledgeBase(question);
  }

  // 4. Build context
  const context = buildContext(supplierData, knowledgeBase);

  // 5. Generate AI response
  const response = await generateAIResponse(question, context);

  // 6. Cache response
  await setCachedResponse(question, response, 60); // 1 minute cache

  return response;
}

function buildContext(supplierData: any, knowledgeBase: any): string {
  let context = '';

  if (supplierData) {
    context += `Current Supplier Prices:\n${formatSupplierData(supplierData)}\n\n`;
  }

  if (knowledgeBase) {
    context += `Relevant Information:\n${knowledgeBase}\n\n`;
  }

  return context;
}

async function generateAIResponse(
  question: string,
  context: string
): Promise<string> {
  const systemPrompt = `You are a helpful Quantity Surveyor assistant.
You help QS professionals with construction pricing, material specifications, and cost calculations.

${context}

Always include real supplier prices when available. Be concise, accurate, and helpful.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0].message.content || '';
}
```

---

## 8. Advanced Features

### Function Calling (Let AI Query Database)

```typescript
// Let GPT call functions directly
const functions = [
  {
    name: 'get_product_prices',
    description: 'Get current prices for products from suppliers',
    parameters: {
      type: 'object',
      properties: {
        product_name: { type: 'string' },
      },
    },
  },
];

// GPT can decide to call this function when needed
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: question }],
  functions: functions,
  function_call: 'auto',
});
```

### Streaming Responses

```typescript
// Real-time streaming for better UX
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: question }],
  stream: true,
});

for await (const chunk of stream) {
  // Send chunks to frontend in real-time
  res.write(chunk.choices[0]?.delta?.content || '');
}
```

### Multi-Step Reasoning

```typescript
// For complex calculations
// Step 1: Extract requirements
// Step 2: Get prices
// Step 3: Calculate
// Step 4: Format response
```

---

## 9. Data Sources Integration

### Supplier Data (Real-Time)

```typescript
// Direct database queries
async function getSupplierData(productNames: string[]) {
  return await prisma.product.findMany({
    where: {
      name: { contains: productNames[0], mode: 'insensitive' },
    },
    include: { supplier: true },
    orderBy: { price: 'asc' },
    take: 10,
  });
}
```

### Knowledge Base (Vector Search)

```typescript
// Search construction knowledge
async function searchKnowledgeBase(query: string) {
  // Embed query
  const embedding = await getEmbedding(query);
  
  // Vector search
  const results = await vectorDB.similaritySearch(embedding, {
    topK: 5,
    filter: { category: 'construction' },
  });
  
  return results.map(r => r.content).join('\n');
}
```

### Company Data (Future)

```typescript
// Historical quotes, projects
async function getCompanyContext(companyId: string) {
  // Get company's past quotes, preferences
  // Use for personalized recommendations
}
```

---

## 10. Recommended Tools & Services

### Core Stack (MVP)

1. **OpenAI GPT-4** - Primary LLM
   - Cost: ~$0.03 per 1K input tokens, $0.06 per 1K output tokens
   - Best quality, easy integration

2. **PostgreSQL + pgvector** - Database + Vector Search
   - Cost: Free (self-hosted) or managed service
   - Single database for everything

3. **Redis** - Caching
   - Cost: Free (self-hosted) or managed
   - Fast response times

### Advanced Stack (Scale)

1. **Pinecone** - Vector Database
   - Cost: ~$70/month for starter
   - Better vector search performance

2. **LangChain** - LLM Orchestration
   - Cost: Free (library)
   - Complex multi-step reasoning

3. **Anthropic Claude** - Alternative LLM
   - Cost: Similar to GPT-4
   - Good for structured data

---

## 11. Cost Optimization

### Strategies

1. **Caching**
   - Cache AI responses (1-5 minutes)
   - Cache supplier data (30 seconds)
   - Reduce API calls by 70-80%

2. **Model Selection**
   - Use GPT-3.5-turbo for simple queries
   - Use GPT-4 only for complex queries
   - Save 90% on costs

3. **Prompt Optimization**
   - Shorter prompts = lower costs
   - Reuse system prompts
   - Batch similar queries

4. **Function Calling**
   - Let AI decide when to query database
   - Avoid unnecessary data retrieval

---

## 12. Implementation Phases

### Phase 1: MVP (Week 1-2)
- ✅ OpenAI GPT-4 integration
- ✅ Direct database queries
- ✅ Simple caching (Redis)
- ✅ Basic prompt engineering

### Phase 2: Enhanced (Week 3-4)
- 📊 Vector database (pgvector)
- 📊 Knowledge base embedding
- 📊 Function calling
- 📊 Response streaming

### Phase 3: Advanced (Week 5+)
- 🚀 LangChain integration
- 🚀 Multi-step reasoning
- 🚀 Company context integration
- 🚀 Advanced caching strategies

---

## 13. Example: Complete Flow

```typescript
// QS asks: "What's the price of cement and how much for 100 bags?"

// Step 1: Query Understanding
const intent = 'price_calculation';
const entities = { products: ['cement'], quantity: 100 };

// Step 2: Data Retrieval
const supplierData = await getSupplierData(['cement']);
// Returns: [{ supplier: 'ABC', price: 50, unit: 'bag' }, ...]

// Step 3: Knowledge Base (optional)
const knowledge = await searchKnowledgeBase('cement specifications');

// Step 4: Build Context
const context = `
Current Supplier Prices for Cement:
- ABC Supplies: $50/bag
- DEF Materials: $52/bag
- GHI Builders: $48/bag

Quantity: 100 bags
`;

// Step 5: AI Generation
const prompt = `Calculate total cost for 100 bags of cement using best price.`;
const answer = await generateAIResponse(prompt, context);

// Response:
// "Based on current supplier prices, the best price for cement is $48/bag from GHI Builders.
// For 100 bags, the total cost would be $4,800."
```

---

## 14. Security & Privacy

### Data Protection

1. **API Keys**
   - Store in environment variables
   - Use secrets management (AWS Secrets Manager, etc.)

2. **Data Isolation**
   - Company data only visible to that company
   - Supplier data visible to all QS users
   - Row-level security in database

3. **Rate Limiting**
   - Limit API calls per user
   - Prevent abuse
   - Cost control

---

## 15. Monitoring & Analytics

### Metrics to Track

1. **AI Performance**
   - Response time
   - Token usage
   - Cost per query
   - User satisfaction

2. **Data Accuracy**
   - Price freshness
   - Query success rate
   - Cache hit rate

3. **System Health**
   - API availability
   - Database performance
   - Error rates

---

## 🎯 Recommended Architecture for MVP

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                  │
│              Chat Interface for QS                     │
└──────────────────┬────────────────────────────────────┘
                   │ HTTP/WebSocket
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Express)                      │
│  - Chat endpoint                                        │
│  - Authentication                                       │
└──────────────────┬────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│  AI Service  │      │  Data Layer  │
│  (OpenAI)   │      │  (Prisma)    │
└──────┬──────┘      └──────┬───────┘
       │                     │
       │                     ▼
       │            ┌──────────────┐
       │            │  PostgreSQL  │
       │            │  + pgvector  │
       │            └──────────────┘
       │
       ▼
┌──────────────┐
│    Redis     │
│   (Cache)    │
└──────────────┘
```

**Tech Stack:**
- **LLM:** OpenAI GPT-4
- **Database:** PostgreSQL + pgvector
- **Cache:** Redis
- **Framework:** LangChain (optional, for complex flows)

---

## 📋 Next Steps

1. **Set up OpenAI API key**
2. **Install dependencies:** `npm install openai @pinecone-database/pinecone`
3. **Implement data retrieval service**
4. **Set up vector database** (start with pgvector)
5. **Build AI service with RAG**
6. **Add caching layer**
7. **Test and optimize**

---

**This architecture provides real-time data integration with GPT while maintaining cost efficiency and scalability.**
