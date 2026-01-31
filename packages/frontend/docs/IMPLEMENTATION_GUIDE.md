# Implementation Guide - QS AI Agent

## 🎯 Implementation Overview

This guide provides step-by-step instructions for implementing the QS AI Agent system.

---

## 📋 Prerequisites

### Required Knowledge
- Node.js/TypeScript
- Next.js/React
- PostgreSQL
- Redis
- OpenAI API

### Required Accounts
- OpenAI API key
- PostgreSQL database
- Redis instance

---

## 🏗️ Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Database Setup

**Step 1: Create Database Schema**

```sql
-- Run migration scripts in order:
-- 1. migration-01-backup-existing-data.sql
-- 2. migration-02-create-new-schema.sql
-- 3. migration-03-migrate-data.sql
-- 4. migration-04-swap-tables.sql
```

**Step 2: Update Prisma Schema**

```bash
cd packages/backend
npx prisma generate
npx prisma db push
```

**Step 3: Verify Schema**

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### 1.2 Backend Setup

**Step 1: Install Dependencies**

```bash
cd packages/backend
npm install openai redis ioredis
npm install --save-dev @types/ioredis
```

**Step 2: Environment Variables**

```env
# .env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4"
```

**Step 3: Core Services**

Create these services:
- `aiService.ts` - AI Agent core
- `learningService.ts` - Self-learning engine
- `projectService.ts` - Project management
- `quoteService.ts` - Quote generation
- `cacheService.ts` - Redis caching

#### 1.3 Frontend Setup

**Step 1: Install Dependencies**

```bash
cd packages/frontend
npm install
```

**Step 2: Create Pages**

- `/app/chat/page.tsx` - AI Chat interface
- `/app/projects/page.tsx` - Project management
- `/app/quotes/page.tsx` - Quote views

---

### Phase 2: AI Agent Core (Week 2)

#### 2.1 Natural Language Processing

**File: `packages/backend/src/services/aiService.ts`**

```typescript
import OpenAI from 'openai';
import { prisma } from '../utils/prisma';
import { getLearningContext } from './learningService';
import { getProjectContext } from './projectService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processQSQuery(
  userId: string,
  query: string
): Promise<{
  answer: string;
  action?: any;
  quote?: any;
  project?: any;
}> {
  // 1. Get context
  const learningContext = await getLearningContext(userId);
  const projectContext = await getProjectContext(userId);
  
  // 2. Detect intent
  const intent = await detectIntent(query);
  
  // 3. Extract entities
  const entities = await extractEntities(query);
  
  // 4. Execute action
  const actionResult = await executeAction(intent, entities, userId);
  
  // 5. Generate response
  const response = await generateResponse(
    query,
    intent,
    actionResult,
    learningContext,
    projectContext
  );
  
  // 6. Learn from interaction
  await learnFromInteraction(userId, query, intent, entities, response);
  
  return response;
}
```

#### 2.2 Intent Recognition

```typescript
async function detectIntent(query: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier. Classify the user's query into one of:
        - price_query: Asking about prices
        - quote_generation: Requesting quote generation
        - project_management: Creating/managing projects
        - cost_calculation: Calculating costs
        - general_question: General QS questions
        
        Respond with only the intent name.`
      },
      { role: 'user', content: query }
    ],
    temperature: 0.1,
  });
  
  return response.choices[0].message.content?.trim() || 'general_question';
}
```

#### 2.3 Entity Extraction

```typescript
async function extractEntities(query: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Extract entities from the query. Return JSON:
        {
          "products": ["cement", "steel"],
          "quantities": {"cement": 100, "steel": 50},
          "project": "Office Building",
          "units": {"cement": "bags", "steel": "units"}
        }`
      },
      { role: 'user', content: query }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });
  
  return JSON.parse(response.choices[0].message.content || '{}');
}
```

---

### Phase 3: Self-Learning Engine (Week 3)

#### 3.1 Interaction Tracking

**File: `packages/backend/src/services/learningService.ts`**

```typescript
export async function learnFromInteraction(
  userId: string,
  query: string,
  intent: string,
  entities: any,
  response: any
) {
  // 1. Store interaction
  await prisma.aIInteraction.create({
    data: {
      userId,
      query,
      intent,
      entities,
      response: response.answer,
      context: {
        project: entities.project,
        timestamp: new Date().toISOString(),
      },
    },
  });
  
  // 2. Update preferences
  await updateUserPreferences(userId, intent, entities, response);
  
  // 3. Learn patterns
  await learnPatterns(userId, intent, entities);
}
```

#### 3.2 Preference Learning

```typescript
async function updateUserPreferences(
  userId: string,
  intent: string,
  entities: any,
  response: any
) {
  const existing = await prisma.userPreference.findUnique({
    where: { userId },
  });
  
  const preferences = existing?.preferences || {};
  
  // Learn supplier preferences
  if (intent === 'quote_generation' && response.quote) {
    response.quote.items.forEach((item: any) => {
      if (item.supplier) {
        preferences.preferredSuppliers = preferences.preferredSuppliers || {};
        preferences.preferredSuppliers[item.name] = item.supplier;
      }
    });
  }
  
  // Learn material patterns
  if (entities.products) {
    preferences.commonMaterials = preferences.commonMaterials || [];
    entities.products.forEach((product: string) => {
      if (!preferences.commonMaterials.includes(product)) {
        preferences.commonMaterials.push(product);
      }
    });
  }
  
  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      preferences,
      patterns: existing?.patterns || {},
      context: existing?.context || {},
    },
    update: {
      preferences,
    },
  });
}
```

#### 3.3 Pattern Recognition

```typescript
async function learnPatterns(
  userId: string,
  intent: string,
  entities: any
) {
  // Analyze recent interactions
  const recentInteractions = await prisma.aIInteraction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  
  // Find patterns
  const projectPatterns: any = {};
  
  recentInteractions.forEach((interaction) => {
    const project = interaction.entities?.project;
    const products = interaction.entities?.products || [];
    
    if (project && products.length > 0) {
      projectPatterns[project] = projectPatterns[project] || [];
      products.forEach((product: string) => {
        if (!projectPatterns[project].includes(product)) {
          projectPatterns[project].push(product);
        }
      });
    }
  });
  
  // Update patterns
  await prisma.userPreference.update({
    where: { userId },
    data: {
      patterns: {
        projectPatterns,
      },
    },
  });
}
```

---

### Phase 4: Project Management (Week 4)

#### 4.1 Project Service

**File: `packages/backend/src/services/projectService.ts`**

```typescript
export async function createProject(
  userId: string,
  name: string,
  description?: string,
  type?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });
  
  if (!user || user.organization.type !== 'company') {
    throw new Error('Only QS users can create projects');
  }
  
  return await prisma.project.create({
    data: {
      companyId: user.organizationId,
      ownerId: userId,
      name,
      description,
      type,
      status: 'planning',
    },
  });
}

export async function getProjectContext(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
      status: { in: ['planning', 'active'] },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });
  
  return {
    activeProjects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      status: p.status,
    })),
    currentProject: projects[0]?.name,
  };
}
```

---

### Phase 5: Quote Generation (Week 5)

#### 5.1 Quote Service

**File: `packages/backend/src/services/quoteService.ts`**

```typescript
export async function generateQuote(
  userId: string,
  projectId: string | null,
  materials: Array<{ name: string; quantity: number; unit: string }>
) {
  // 1. Get user preferences
  const preferences = await getUserPreferences(userId);
  
  // 2. Query products for each material
  const quoteItems = [];
  let totalAmount = 0;
  
  for (const material of materials) {
    // Query products
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: material.name,
          mode: 'insensitive',
        },
      },
      include: { supplier: true },
      orderBy: { price: 'asc' },
      take: 1, // Best price
    });
    
    if (products.length > 0) {
      const product = products[0];
      const itemTotal = Number(product.price) * material.quantity;
      
      quoteItems.push({
        productId: product.id,
        name: material.name,
        quantity: material.quantity,
        unit: material.unit,
        price: Number(product.price),
        total: itemTotal,
        supplier: product.supplier.name,
      });
      
      totalAmount += itemTotal;
    }
  }
  
  // 3. Create quote
  const quote = await prisma.quote.create({
    data: {
      projectId,
      createdById: userId,
      title: `Quote for ${projectId ? 'Project' : 'Materials'}`,
      totalAmount,
      status: 'draft',
      items: {
        create: quoteItems,
      },
    },
    include: {
      items: true,
      project: true,
    },
  });
  
  return quote;
}
```

---

### Phase 6: Frontend Implementation (Week 6)

#### 6.1 AI Chat Interface

**File: `packages/frontend/src/app/chat/page.tsx`**

```typescript
'use client';

import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setMessages([...messages, { role: 'user', content: input }]);
    
    try {
      const response = await fetch('/api/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });
      
      const data = await response.json();
      
      setMessages([
        ...messages,
        { role: 'user', content: input },
        { role: 'assistant', content: data.answer },
      ]);
      
      setInput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-2 border rounded"
            placeholder="Ask the AI Agent anything..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
// tests/services/aiService.test.ts
describe('AI Service', () => {
  it('should detect price query intent', async () => {
    const intent = await detectIntent('What is the price of cement?');
    expect(intent).toBe('price_query');
  });
  
  it('should extract entities correctly', async () => {
    const entities = await extractEntities('100 bags of cement');
    expect(entities.products).toContain('cement');
    expect(entities.quantities.cement).toBe(100);
  });
});
```

### Integration Tests

```typescript
// tests/integration/chat.test.ts
describe('Chat API', () => {
  it('should generate quote for project', async () => {
    const response = await request(app)
      .post('/api/v1/agent/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        question: 'Generate quote for Office Building project',
      });
    
    expect(response.status).toBe(200);
    expect(response.body.quote).toBeDefined();
  });
});
```

---

## 🚀 Deployment

### Environment Setup

```bash
# Production environment variables
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
OPENAI_API_KEY="sk-..."
NODE_ENV="production"
```

### Build Commands

```bash
# Backend
cd packages/backend
npm run build

# Frontend
cd packages/frontend
npm run build
```

### Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Build Applications**
   ```bash
   npm run build
   ```

3. **Deploy to Production**
   - Backend: Deploy to Railway/Render
   - Frontend: Deploy to Vercel
   - Database: PostgreSQL (managed)
   - Cache: Redis (managed)

---

## 📋 Implementation Checklist

### Week 1: Core Infrastructure
- [ ] Database schema created
- [ ] Prisma schema updated
- [ ] Backend dependencies installed
- [ ] Environment variables configured
- [ ] Core services created

### Week 2: AI Agent Core
- [ ] Natural language processing
- [ ] Intent recognition
- [ ] Entity extraction
- [ ] Action execution
- [ ] Response generation

### Week 3: Self-Learning
- [ ] Interaction tracking
- [ ] Preference learning
- [ ] Pattern recognition
- [ ] Knowledge base updates

### Week 4: Project Management
- [ ] Project CRUD operations
- [ ] Project context retrieval
- [ ] Project-based quotes

### Week 5: Quote Generation
- [ ] Quote generation logic
- [ ] Supplier data queries
- [ ] Quote formatting
- [ ] Quote saving

### Week 6: Frontend
- [ ] AI Chat interface
- [ ] Project management UI
- [ ] Quote views
- [ ] Dashboard

### Week 7: Testing & Polish
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] UI/UX polish

### Week 8: Deployment
- [ ] Production environment setup
- [ ] Database migration
- [ ] Application deployment
- [ ] Monitoring setup

---

## ✅ Implementation Summary

**This guide covers:**
- ✅ Complete implementation steps
- ✅ Code examples for all components
- ✅ Testing strategies
- ✅ Deployment process
- ✅ Week-by-week checklist

**Ready to start building!**
