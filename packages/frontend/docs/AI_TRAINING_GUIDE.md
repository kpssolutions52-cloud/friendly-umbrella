# AI Training Guide: Training LLM with Construction Data

This guide explains how to train/fine-tune an LLM with your construction data for better query understanding and consultancy services.

## Overview of Approaches

### 1. **RAG (Retrieval Augmented Generation) with Embeddings** ⭐ RECOMMENDED
- **Best for**: Real-time data, frequently updated databases, construction-specific queries
- **How it works**: Converts your data into embeddings, retrieves relevant context, then uses LLM to generate responses
- **Pros**: Fast to implement, uses current data, no retraining needed, cost-effective
- **Cons**: Requires embedding storage, slightly higher latency

### 2. **Fine-Tuning Existing Models**
- **Best for**: Domain-specific language patterns, specialized terminology
- **How it works**: Train OpenAI's models on your construction data
- **Pros**: Better understanding of construction terminology
- **Cons**: Expensive, requires training data, model becomes static, slower to update

### 3. **Custom Model Training**
- **Best for**: Highly specialized requirements, complete control
- **How it works**: Train a model from scratch
- **Pros**: Complete customization
- **Cons**: Very expensive, requires ML expertise, time-consuming

---

## Recommended: RAG Implementation with Embeddings

### Step 1: Install Required Dependencies

```bash
cd packages/backend
npm install @pinecone-database/pinecone openai
# OR for vector storage, you can use:
# - PostgreSQL with pgvector extension (recommended for your setup)
# - Pinecone (cloud vector DB)
# - Weaviate
# - Chroma
```

### Step 2: Setup Vector Database (PostgreSQL with pgvector)

Since you're already using PostgreSQL, we can use `pgvector` extension:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- The text that was embedded (name + description + category)
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  metadata JSONB, -- Store additional info (price, supplier, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON product_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create service_embeddings table
CREATE TABLE IF NOT EXISTS service_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Step 3: Create Embedding Service

Create `packages/backend/src/services/embeddingService.ts`:

```typescript
import { prisma } from '../utils/prisma';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export class EmbeddingService {
  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002', // or 'text-embedding-3-small' for newer models
      input: text.trim().replace(/\n/g, ' '),
    });

    return response.data[0].embedding;
  }

  /**
   * Generate embedding and store in database
   */
  async embedProduct(productId: string, content: string, metadata: Record<string, any>) {
    const embedding = await this.generateEmbedding(content);
    
    // Store embedding in database
    // Note: You'll need to use raw SQL or a pgvector client
    await prisma.$executeRaw`
      INSERT INTO product_embeddings (product_id, content, embedding, metadata)
      VALUES (${productId}::uuid, ${content}, ${embedding}::vector, ${JSON.stringify(metadata)}::jsonb)
      ON CONFLICT (product_id) 
      DO UPDATE SET 
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;
  }

  /**
   * Search for similar products/services using embeddings
   */
  async searchSimilar(
    query: string,
    limit: number = 20,
    type?: 'product' | 'service'
  ): Promise<Array<{ productId: string; similarity: number; metadata: any }>> {
    const queryEmbedding = await this.generateEmbedding(query);

    // Search using cosine similarity
    const table = type === 'service' ? 'service_embeddings' : 'product_embeddings';
    
    const results = await prisma.$queryRaw<Array<{
      product_id: string;
      similarity: number;
      metadata: any;
    }>>`
      SELECT 
        product_id,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity,
        metadata
      FROM ${Prisma.raw(table)}
      WHERE ${type ? Prisma.sql`metadata->>'type' = ${type}` : Prisma.sql`1=1`}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results.map(r => ({
      productId: r.product_id,
      similarity: r.similarity,
      metadata: r.metadata,
    }));
  }

  /**
   * Batch generate embeddings for all products
   */
  async embedAllProducts() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        serviceCategory: true,
        supplier: true,
      },
    });

    console.log(`Generating embeddings for ${products.length} products...`);

    for (const product of products) {
      // Create rich content for embedding
      const content = [
        product.name,
        product.description || '',
        product.sku,
        product.category?.name || product.serviceCategory?.name || '',
        product.supplier.name,
        product.type === 'service' ? 'service' : 'product',
        product.unit,
      ].filter(Boolean).join(' ');

      const metadata = {
        id: product.id,
        name: product.name,
        type: product.type,
        category: product.category?.name || product.serviceCategory?.name,
        supplier: product.supplier.name,
        unit: product.unit,
      };

      try {
        await this.embedProduct(product.id, content, metadata);
        console.log(`✓ Embedded: ${product.name}`);
      } catch (error) {
        console.error(`✗ Failed to embed ${product.name}:`, error);
      }

      // Rate limiting - OpenAI has rate limits
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }
  }
}
```

### Step 4: Update AI Quote Service to Use RAG

Update `packages/backend/src/services/aiQuoteService.ts`:

```typescript
import { embeddingService } from './embeddingService';

export class AIQuoteService {
  async searchWithAI(
    prompt: string,
    tenantId: string | null = null,
    tenantType: 'company' | 'supplier' | 'service_provider' | 'guest' = 'guest'
  ): Promise<AIQuoteResponse> {
    // Step 1: Use embeddings to find most relevant products/services
    const similarProducts = await embeddingService.searchSimilar(prompt, 30);
    const similarServices = await embeddingService.searchSimilar(prompt, 30, 'service');
    
    // Step 2: Get full product details for matched IDs
    const productIds = [
      ...similarProducts.map(p => p.productId),
      ...similarServices.map(s => s.productId),
    ];
    
    const products = await this.getProductsByIds(productIds, tenantId, tenantType);
    
    // Step 3: Use LLM to refine and rank results
    const systemPrompt = `You are a construction expert AI assistant...`; // Your existing prompt
    
    const userPrompt = `Based on this query: "${prompt}"
    
    Here are the top matching products/services found using semantic search:
    ${JSON.stringify(products.slice(0, 20), null, 2)}
    
    Select the most relevant items (max 20) and provide a helpful response.`;
    
    // Rest of your existing LLM logic...
  }
}
```

### Step 5: Add Embedding Generation Script

Create `packages/backend/src/scripts/generateEmbeddings.ts`:

```typescript
import { EmbeddingService } from '../services/embeddingService';

async function main() {
  const embeddingService = new EmbeddingService();
  await embeddingService.embedAllProducts();
  console.log('Embedding generation complete!');
}

main().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "generate-embeddings": "ts-node src/scripts/generateEmbeddings.ts"
  }
}
```

---

## Alternative: Fine-Tuning OpenAI Models

### Step 1: Prepare Training Data

Create training examples in OpenAI's format:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a construction pricing expert..."
    },
    {
      "role": "user",
      "content": "I need concrete for building construction"
    },
    {
      "role": "assistant",
      "content": "Based on your requirement for concrete, I found these products:\n1. Ready-Mix Concrete - $X/unit\n2. Portland Cement - $Y/unit\n..."
    }
  ]
}
```

### Step 2: Upload Training File

```bash
# Install OpenAI CLI
pip install openai

# Upload training file
openai api fine_tunes.create \
  -t training_data.jsonl \
  -m gpt-3.5-turbo \
  --n_epochs 3 \
  --learning_rate_multiplier 0.1
```

### Step 3: Use Fine-Tuned Model

```typescript
const completion = await openai.chat.completions.create({
  model: 'ft:gpt-3.5-turbo:your-org:custom-model:xxxx', // Your fine-tuned model ID
  messages: [...],
});
```

---

## Implementation Steps (RAG Approach)

1. **Install pgvector extension** in your PostgreSQL database
2. **Run migration** to create embeddings tables
3. **Install dependencies**: `npm install @prisma/client pgvector` (or use raw SQL)
4. **Generate initial embeddings**: Run `npm run generate-embeddings`
5. **Update AI service** to use semantic search first, then LLM refinement
6. **Set up cron job** to update embeddings when products change

---

## Benefits of RAG Approach

1. **Always current**: Uses your latest database data
2. **Better accuracy**: Semantic search finds relevant items even with different wording
3. **Cost-effective**: Only pay for embeddings generation + LLM calls
4. **Fast**: Vector search is very fast (milliseconds)
5. **Scalable**: Handles large datasets efficiently

---

## Next Steps

1. Choose your approach (RAG recommended)
2. Set up vector database (pgvector in PostgreSQL)
3. Implement embedding service
4. Update AI Quote service to use embeddings
5. Generate initial embeddings for existing data
6. Test and iterate

---

## Resources

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [RAG Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)