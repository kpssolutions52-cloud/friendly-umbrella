# AI Agent Intelligence Enhancement Guide

## Current Architecture

The current system uses:
- **Intent Extraction**: GPT-4o-mini with JSON mode for parsing commands
- **Rule-Based Execution**: Simple if/else logic based on extracted intents
- **Basic Prompting**: Single-shot prompts with examples

## Advanced Techniques to Improve Intelligence

### 1. **Function Calling / Tool Use** ⭐ (Recommended First Step)

Instead of intent extraction, let the AI directly call functions/tools:

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "get_product_price",
      description: "Get the current price of a product by name",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string" },
          supplierId: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_total_price",
      description: "Calculate total price for a quantity of products",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string" },
          quantity: { type: "number" },
          supplierId: { type: "string" }
        }
      }
    }
  }
];
```

**Benefits:**
- AI decides what tools to use based on query
- Handles complex multi-step queries automatically
- More reliable than intent extraction
- Better for ambiguous queries

### 2. **RAG (Retrieval Augmented Generation)** ⭐⭐

Provide context from database before generating response:

```typescript
// Step 1: Retrieve relevant products
const products = await searchProducts(query, supplierId);

// Step 2: Include in context
const context = `Your products:
${products.map(p => `- ${p.name}: $${p.price}/${p.unit}`).join('\n')}`;

// Step 3: Generate response with context
const response = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: systemPrompt + context },
    { role: 'user', content: query }
  ]
});
```

**Benefits:**
- AI has actual data to work with
- Can answer questions about specific products
- Reduces hallucinations
- Better for complex queries

### 3. **Chain-of-Thought (CoT) Reasoning**

Encourage step-by-step thinking:

```typescript
const systemPrompt = `When answering questions, think step by step:

1. Understand what the user is asking
2. Identify what information you need
3. Retrieve that information
4. Perform any calculations
5. Format your response clearly

Example:
User: "What's the total for 10 cement and 5 steel?"

Your thinking:
1. User wants total cost for multiple products
2. Need prices for: cement, steel
3. Need quantities: 10 cement, 5 steel
4. Calculate: (cement_price × 10) + (steel_price × 5)
5. Present total with breakdown`;
```

### 4. **Few-Shot Learning with Examples**

Provide diverse examples in the prompt:

```typescript
const examples = [
  {
    query: "How much is 10 cement?",
    steps: [
      "Find product 'cement'",
      "Get price per unit",
      "Calculate: 10 × price",
      "Return formatted result"
    ],
    answer: "10 bags of Cement: $480.00 (10 × $48.00)"
  },
  {
    query: "What's cheaper, cement or steel?",
    steps: [
      "Find both products",
      "Compare prices",
      "Return comparison"
    ],
    answer: "Cement: $48/bag, Steel: $500/ton. Cement is cheaper per unit."
  }
];
```

### 5. **Semantic Product Search**

Use embeddings for better product matching:

```typescript
// Instead of simple name matching
const product = await prisma.product.findFirst({
  where: { name: { contains: productName } }
});

// Use vector similarity
const productEmbedding = await generateEmbedding(productName);
const products = await prisma.$queryRaw`
  SELECT *, 
    embedding <-> ${productEmbedding}::vector AS distance
  FROM products
  WHERE supplier_id = ${supplierId}
  ORDER BY distance
  LIMIT 5
`;
```

**Benefits:**
- Finds products even with typos
- Understands synonyms (e.g., "cement" = "concrete")
- Better for natural language queries

### 6. **Multi-Step Reasoning with Memory**

Track conversation context:

```typescript
interface ConversationContext {
  messages: Message[];
  productsMentioned: string[];
  lastCalculation?: {
    product: string;
    quantity: number;
    total: number;
  };
}

// Use in prompt
const contextPrompt = `Previous conversation:
${context.messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

Current query: ${query}`;
```

### 7. **Fine-Tuning on Domain Data**

Train a model specifically for your use case:

```typescript
// Create training data
const trainingData = [
  {
    messages: [
      { role: "system", content: "You are a supplier assistant..." },
      { role: "user", content: "How much is 10 cement?" },
      { role: "assistant", content: "10 bags of Cement: $480.00..." }
    ]
  }
];

// Fine-tune model
const fineTunedModel = await openai.fineTuning.jobs.create({
  training_file: trainingDataFile,
  model: "gpt-4o-mini"
});
```

### 8. **ReAct Pattern (Reasoning + Acting)**

Combine reasoning with tool use:

```typescript
const systemPrompt = `You are a helpful assistant. You can:
1. Think about what the user needs
2. Use tools to get information
3. Reason about the results
4. Provide a clear answer

Available tools:
- get_product_price(productName)
- calculate_total(productName, quantity)
- list_products()
- update_price(productName, price)

Format your reasoning as:
Thought: [your thinking]
Action: [tool name]
Action Input: [parameters]
Observation: [tool result]
... (repeat if needed)
Final Answer: [your response]`;
```

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. ✅ **Function Calling** - Most impactful, easiest to implement
2. ✅ **RAG with Product Context** - Provide actual data to AI
3. ✅ **Better Error Handling** - Graceful degradation

### Phase 2: Medium Effort (1 week)
4. **Semantic Search** - Better product matching
5. **Chain-of-Thought** - Better reasoning
6. **Conversation Memory** - Context awareness

### Phase 3: Advanced (2-4 weeks)
7. **Fine-Tuning** - Domain-specific model
8. **Vector Database** - For large-scale semantic search
9. **Multi-Agent System** - Specialized agents for different tasks

## Recommended Approach

Start with **Function Calling + RAG**:

1. Define tools/functions the AI can call
2. Retrieve relevant products before generating response
3. Let AI decide which tools to use
4. Provide context in the prompt

This gives you:
- ✅ Better handling of complex queries
- ✅ More reliable results
- ✅ Easier to extend with new capabilities
- ✅ Better user experience

## Example: Enhanced Query Handling

**Before (Current):**
```
User: "How much is 10 cement?"
→ Intent extraction → calculate_price
→ Manual calculation
→ Response
```

**After (With Function Calling):**
```
User: "How much is 10 cement?"
→ AI decides to call: get_product_price("cement")
→ Tool returns: { price: 48, unit: "bag" }
→ AI calculates: 10 × 48 = 480
→ AI formats response with reasoning
```

**Complex Query:**
```
User: "What's the total if I buy 10 cement, 5 steel, and 3 paint?"
→ AI calls: get_product_price for each
→ AI calculates: (10 × 48) + (5 × 500) + (3 × 25)
→ AI provides breakdown and total
```

## Next Steps

1. Implement function calling in `supplierAIService.ts`
2. Add RAG to retrieve products before responding
3. Test with complex queries
4. Iterate based on results
