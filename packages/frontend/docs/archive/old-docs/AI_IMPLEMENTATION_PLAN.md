# AI Implementation Plan - Step by Step

## 🎯 Goal

Implement AI QS Assistant with real-time supplier data integration using GPT-4.

---

## Phase 1: Basic AI Integration (Week 1)

### Step 1: Set Up OpenAI

```bash
# Install OpenAI SDK
cd packages/backend
npm install openai

# Add to .env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4-turbo-preview  # or gpt-3.5-turbo for cheaper
```

### Step 2: Basic AI Service

```typescript
// packages/backend/src/services/aiService.ts
// Already created - enhance with real-time data
```

### Step 3: Test Basic Integration

```typescript
// Test endpoint
POST /api/v1/chat/test
{
  "question": "What is cement?"
}

// Should return AI response
```

---

## Phase 2: Real-Time Data Integration (Week 1-2)

### Step 1: Data Retrieval Service

```typescript
// packages/backend/src/services/dataRetrievalService.ts

import { prisma } from '../utils/prisma';

export async function getSupplierPrices(productName: string) {
  return await prisma.product.findMany({
    where: {
      name: { contains: productName, mode: 'insensitive' },
    },
    include: { supplier: true },
    orderBy: { price: 'asc' },
    take: 10,
  });
}

export async function searchProducts(query: string) {
  // Full-text search
  return await prisma.product.findMany({
    where: {
      name: { search: query },
    },
    include: { supplier: true },
  });
}
```

### Step 2: Integrate with AI Service

```typescript
// Update aiService.ts to use real data
export async function processQSQuestion(question: string) {
  // Extract products
  const products = extractProductsFromQuestion(question);
  
  // Get real supplier data
  const supplierData = await getSupplierPrices(products[0]);
  
  // Generate AI response with real data
  return await askQSQuestion(question, supplierData);
}
```

---

## Phase 3: Caching Layer (Week 2)

### Step 1: Set Up Redis

```bash
# Install Redis client
npm install redis

# Add to .env
REDIS_URL=redis://localhost:6379
```

### Step 2: Cache Service

```typescript
// packages/backend/src/services/cacheService.ts

import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

export async function getCachedResponse(question: string) {
  const key = `ai:response:${hashQuestion(question)}`;
  return await redis.get(key);
}

export async function setCachedResponse(
  question: string,
  response: string,
  ttl: number = 60
) {
  const key = `ai:response:${hashQuestion(question)}`;
  await redis.setEx(key, ttl, response);
}

export async function invalidatePriceCache(productId: string) {
  // Invalidate when price updates
  await redis.del(`product:${productId}`);
}
```

---

## Phase 4: Vector Database (Week 3)

### Step 1: Set Up pgvector

```sql
-- In PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge base table
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY,
  content TEXT,
  category VARCHAR(100),
  embedding vector(1536),  -- OpenAI embedding dimension
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
```

### Step 2: Embedding Service

```typescript
// packages/backend/src/services/embeddingService.ts

import OpenAI from 'openai';

const openai = new OpenAI();

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

export async function searchKnowledgeBase(query: string) {
  const queryEmbedding = await getEmbedding(query);
  
  // Vector similarity search in PostgreSQL
  const results = await prisma.$queryRaw`
    SELECT content, category,
           1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM knowledge_base
    WHERE 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT 5
  `;
  
  return results;
}
```

### Step 3: Populate Knowledge Base

```typescript
// Seed knowledge base with construction specs
const knowledgeItems = [
  {
    content: 'M20 concrete has 20 MPa compressive strength...',
    category: 'concrete',
  },
  {
    content: 'M25 concrete has 25 MPa compressive strength...',
    category: 'concrete',
  },
  // ... more items
];

// Generate embeddings and store
for (const item of knowledgeItems) {
  const embedding = await getEmbedding(item.content);
  await prisma.knowledgeBase.create({
    data: {
      content: item.content,
      category: item.category,
      embedding: embedding,
    },
  });
}
```

---

## Phase 5: Advanced Features (Week 4+)

### Function Calling

```typescript
// Let GPT call database functions
const functions = [
  {
    name: 'get_product_prices',
    description: 'Get current prices for products',
    parameters: {
      type: 'object',
      properties: {
        product_name: { type: 'string' },
      },
    },
  },
  {
    name: 'calculate_total_cost',
    description: 'Calculate total cost for quantity',
    parameters: {
      type: 'object',
      properties: {
        product_name: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  },
];

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: question }],
  functions: functions,
  function_call: 'auto',
});
```

### Streaming Responses

```typescript
// Real-time streaming
export async function streamAIResponse(question: string, res: Response) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: question }],
    stream: true,
  });

  res.setHeader('Content-Type', 'text/event-stream');
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
  
  res.end();
}
```

---

## 📋 Implementation Checklist

### Week 1
- [ ] Set up OpenAI API key
- [ ] Install OpenAI SDK
- [ ] Create basic AI service
- [ ] Test AI integration
- [ ] Create data retrieval service
- [ ] Integrate supplier data with AI

### Week 2
- [ ] Set up Redis
- [ ] Implement caching layer
- [ ] Cache AI responses
- [ ] Cache supplier data
- [ ] Test caching performance

### Week 3
- [ ] Set up pgvector extension
- [ ] Create knowledge base table
- [ ] Implement embedding service
- [ ] Populate knowledge base
- [ ] Integrate vector search with AI

### Week 4
- [ ] Implement function calling
- [ ] Add streaming responses
- [ ] Optimize prompts
- [ ] Monitor costs
- [ ] Performance testing

---

## 🎯 Quick Start (Today)

1. **Get OpenAI API Key**
   - Sign up at https://platform.openai.com
   - Get API key
   - Add to `.env`: `OPENAI_API_KEY=sk-...`

2. **Install Dependencies**
   ```bash
   cd packages/backend
   npm install openai redis
   ```

3. **Test Basic AI**
   ```typescript
   // Test in Node.js
   import OpenAI from 'openai';
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   const response = await openai.chat.completions.create({
     model: 'gpt-4',
     messages: [{ role: 'user', content: 'What is cement?' }],
   });
   console.log(response.choices[0].message.content);
   ```

4. **Integrate with Existing Code**
   - Use `aiService.ts` already created
   - Add real supplier data
   - Test end-to-end

---

## 💰 Cost Estimates

### OpenAI GPT-4
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens
- Average query: ~500 tokens input, 200 tokens output
- Cost per query: ~$0.027
- With caching (80% hit rate): ~$0.005 per query

### Monthly Estimates
- 10,000 queries/month
- Without cache: ~$270/month
- With cache: ~$50/month

### Optimization
- Use GPT-3.5-turbo for simple queries: 90% cost reduction
- Aggressive caching: 80% cost reduction
- Combined: ~$5-10/month for 10K queries

---

## 🚀 Next Steps

1. **Start with Phase 1** (Basic AI integration)
2. **Test with real supplier data**
3. **Add caching** (Phase 2)
4. **Add knowledge base** (Phase 3)
5. **Optimize costs** (Phase 4)

**Start simple, add complexity as needed!**
