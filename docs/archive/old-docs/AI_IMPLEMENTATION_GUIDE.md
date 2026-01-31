# AI QS Assistant - Implementation Guide

## 🎯 Quick Start: Build ConstructGPT in 2-3 Weeks

This guide shows exactly how to build the AI-first QS assistant.

---

## 📋 Week 1: Foundation & AI Integration

### Day 1-2: AI Setup

#### 1. Choose AI Provider
```bash
# Option 1: OpenAI (Recommended for MVP)
npm install openai

# Option 2: Anthropic Claude
npm install @anthropic-ai/sdk

# Option 3: Open-source (self-hosted)
# Use Ollama or similar
```

#### 2. Create AI Service
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
    model: 'gpt-4', // or 'gpt-3.5-turbo' for faster/cheaper
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || '';
}
```

#### 3. Create Chat API Endpoint
```typescript
// packages/backend/src/routes/chatRoutes.ts
router.post('/chat', async (req, res) => {
  const { question } = req.body;
  const userId = req.user.id;

  // Extract product/material from question (simple keyword matching)
  const products = await extractProductsFromQuestion(question);
  
  // Get supplier data if price-related
  let supplierData = null;
  if (isPriceQuery(question)) {
    supplierData = await getSupplierData(products);
  }

  // Generate AI response
  const answer = await askQSQuestion(question, supplierData);

  res.json({ answer, supplierData });
});
```

### Day 3-4: Simplified Database

#### Update Prisma Schema
```prisma
// Keep it simple - 3 tables only
model Organization {
  id        String   @id @default(uuid())
  name      String
  type      OrgType  // supplier | qs
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users    User[]
  products Product[] @relation("SupplierProducts")
}

model User {
  id             String       @id @default(uuid())
  organizationId String?
  email          String       @unique
  passwordHash   String
  name           String?
  type           UserType     // qs | supplier
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization Organization? @relation(fields: [organizationId], references: [id])
}

model Product {
  id         String      @id @default(uuid())
  supplierId String
  name       String
  price      Decimal
  unit       String
  updatedAt  DateTime    @updatedAt
  createdAt  DateTime    @default(now())

  supplier Organization @relation("SupplierProducts", fields: [supplierId], references: [id])
  
  @@index([name])
}
```

### Day 5: Basic Chat UI

#### Create Chat Component
```tsx
// packages/frontend/components/ChatInterface.tsx
'use client';

import { useState } from 'react';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500">Thinking...</div>}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-2 border rounded"
            placeholder="Ask me anything about construction pricing..."
          />
          <button
            onClick={sendMessage}
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

## 📋 Week 2: Core Features

### Day 1-2: Price Query Handling

#### Extract Products from Question
```typescript
// packages/backend/src/services/queryService.ts
export async function extractProductsFromQuestion(question: string): Promise<string[]> {
  // Simple keyword matching (can be enhanced with AI later)
  const commonMaterials = [
    'cement', 'steel', 'sand', 'gravel', 'brick', 'tile',
    'paint', 'wood', 'concrete', 'rebar', 'wire', 'pipe'
  ];

  const found = commonMaterials.filter(material => 
    question.toLowerCase().includes(material)
  );

  return found;
}

export function isPriceQuery(question: string): boolean {
  const priceKeywords = ['price', 'cost', 'how much', 'quote', 'pricing'];
  return priceKeywords.some(keyword => 
    question.toLowerCase().includes(keyword)
  );
}
```

#### Get Supplier Data
```typescript
// packages/backend/src/services/supplierService.ts
export async function getSupplierData(productNames: string[]) {
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: productNames[0], // Simple search
        mode: 'insensitive',
      },
    },
    include: {
      supplier: true,
    },
    orderBy: {
      price: 'asc', // Best price first
    },
    take: 5, // Top 5 suppliers
  });

  return products.map(p => ({
    supplier: p.supplier.name,
    product: p.name,
    price: p.price,
    unit: p.unit,
  }));
}
```

### Day 3-4: Cost Calculations

#### Handle Calculation Queries
```typescript
// packages/backend/src/services/calculationService.ts
export async function calculateCost(question: string): Promise<string> {
  // Extract quantities and products
  // Example: "100 bags of cement and 50 steel bars"
  const quantities = extractQuantities(question);
  const products = extractProducts(question);

  // Get prices
  const prices = await getSupplierPrices(products);

  // Calculate totals
  const breakdown = quantities.map(qty => {
    const price = prices.find(p => p.product === qty.product);
    return {
      product: qty.product,
      quantity: qty.quantity,
      unit: qty.unit,
      pricePerUnit: price?.price || 0,
      total: qty.quantity * (price?.price || 0),
      supplier: price?.supplier || 'N/A',
    };
  });

  const grandTotal = breakdown.reduce((sum, item) => sum + item.total, 0);

  // Format for AI response
  return formatCalculationResponse(breakdown, grandTotal);
}
```

### Day 5: Supplier Dashboard

#### Simple Product Form
```tsx
// packages/frontend/app/supplier/products/page.tsx
export default function SupplierProducts() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: '',
  });

  const addProduct = async () => {
    await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    // Refresh list
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">My Products</h1>
      
      {/* Add Product Form */}
      <div className="mb-6 p-4 border rounded">
        <input
          placeholder="Product name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="mb-2 p-2 border rounded w-full"
        />
        <input
          placeholder="Price"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          className="mb-2 p-2 border rounded w-full"
        />
        <input
          placeholder="Unit (bag, kg, piece)"
          value={formData.unit}
          onChange={(e) => setFormData({...formData, unit: e.target.value})}
          className="mb-2 p-2 border rounded w-full"
        />
        <button onClick={addProduct} className="px-4 py-2 bg-blue-500 text-white rounded">
          Add Product
        </button>
      </div>

      {/* Product List */}
      <div>
        {products.map(product => (
          <div key={product.id} className="p-4 border rounded mb-2">
            {product.name} - ${product.price}/{product.unit}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📋 Week 3: Enhanced Features

### Day 1-2: Quote Generation

#### Generate Quote from Chat
```typescript
// packages/backend/src/services/quoteService.ts
export async function generateQuote(projectDescription: string) {
  // Extract materials and quantities from description
  const materials = await extractMaterials(projectDescription);
  
  // Get best prices
  const quote = await Promise.all(
    materials.map(async (material) => {
      const bestPrice = await getBestPrice(material.name);
      return {
        material: material.name,
        quantity: material.quantity,
        unit: material.unit,
        pricePerUnit: bestPrice.price,
        supplier: bestPrice.supplier,
        total: material.quantity * bestPrice.price,
      };
    })
  );

  const grandTotal = quote.reduce((sum, item) => sum + item.total, 0);

  return {
    items: quote,
    total: grandTotal,
    generatedAt: new Date(),
  };
}
```

### Day 3-4: UI Polish

#### Enhanced Chat UI
- Add typing indicators
- Show supplier prices in cards
- Add "Generate Quote" button
- Add copy/share functionality
- Mobile responsive

### Day 5: Testing & Bug Fixes

---

## 🚀 Quick Implementation Checklist

### Backend
- [ ] Set up OpenAI/Claude API
- [ ] Create AI service
- [ ] Create chat endpoint
- [ ] Simplify database (3 tables)
- [ ] Product search function
- [ ] Cost calculation function
- [ ] Quote generation function

### Frontend
- [ ] Chat interface component
- [ ] Message display
- [ ] Input handling
- [ ] Supplier dashboard
- [ ] Product form
- [ ] Quote display
- [ ] Mobile responsive

### Integration
- [ ] Connect AI to supplier data
- [ ] Handle price queries
- [ ] Handle calculations
- [ ] Format AI responses
- [ ] Error handling

---

## 💡 Key Implementation Tips

### 1. Start Simple
- Use GPT-3.5-turbo first (cheaper, faster)
- Simple keyword matching for product extraction
- Basic chat UI (can enhance later)

### 2. Focus on Core Flow
- QS asks question → AI answers with supplier data
- That's the core value - everything else is secondary

### 3. Iterate Based on Usage
- See what questions users ask most
- Add features for common patterns
- Don't build features nobody uses

### 4. Keep Supplier Entry Simple
- One form: name, price, unit
- No categories, no SKUs, no complexity
- Suppliers can add products in 30 seconds

---

## 🎯 MVP Success Criteria

### Must Work
- ✅ QS can ask price questions
- ✅ AI responds with real supplier prices
- ✅ QS can ask calculation questions
- ✅ AI calculates and shows breakdown
- ✅ Suppliers can add products
- ✅ Prices appear in AI answers

### Nice to Have
- 📊 Quote generation
- 📝 Quantity takeoff help
- 🔍 Advanced queries
- 📄 Export features

---

## 🚀 Launch Strategy

1. **Week 1-2:** Build core chat + supplier data
2. **Week 3:** Test with 5-10 QS professionals
3. **Week 4:** Onboard 3-5 suppliers
4. **Launch:** Open beta

---

**Remember:** The goal is to be "ChatGPT for QS" - simple, fast, and always up-to-date.
