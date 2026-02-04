# AI Enhancement Setup Guide

## Overview

The enhanced AI service uses **OpenAI Function Calling** and **RAG (Retrieval Augmented Generation)** to provide more intelligent responses to complex queries.

## Features

✅ **Function Calling**: AI decides which tools to use based on the query  
✅ **RAG**: Products are loaded into context before AI responds  
✅ **Multi-Step Reasoning**: AI can call multiple tools in sequence  
✅ **Complex Query Handling**: Handles queries like "What's the total for 10 cement, 5 steel, and 3 paint?"

## Setup

### 1. Environment Variable

Add to your `.env` file in `packages/backend/`:

```bash
# Enable enhanced AI service with function calling
USE_ENHANCED_AI=true
```

**Default**: `false` (uses original intent-based service)

### 2. Verify OpenAI API Key

Make sure you have your OpenAI API key set:

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o for better results
```

### 3. Restart Backend

After setting the environment variable, restart your backend server:

```bash
cd packages/backend
npm run dev
```

## Usage

### Simple Queries (Both Services Handle)
- "How much is 10 cement?"
- "What's the price of steel?"
- "Show my products"

### Complex Queries (Enhanced Service Only)
- "What's the total if I buy 10 cement, 5 steel, and 3 paint?"
- "Compare prices of cement and steel"
- "What's cheaper, cement or paint?"
- "Calculate total for 20 bags of cement and 10 tons of steel"

## Testing

### Test Enhanced Service

1. Set `USE_ENHANCED_AI=true` in your `.env`
2. Restart backend
3. Try a complex query in the chat:
   ```
   "What's the total for 10 cement, 5 steel, and 3 paint?"
   ```

### Compare Results

You can switch between services by toggling the environment variable:

```bash
# Use enhanced service
USE_ENHANCED_AI=true

# Use original service
USE_ENHANCED_AI=false
```

## Performance

### Original Service
- ⚡ **Speed**: ~500ms per query
- 💰 **Cost**: ~$0.001 per query
- 🎯 **Best for**: Simple, predictable queries

### Enhanced Service
- ⚡ **Speed**: ~1-2s per query (1-3 API calls)
- 💰 **Cost**: ~$0.002-0.003 per query
- 🎯 **Best for**: Complex, varied queries

## Troubleshooting

### Issue: "Function calling not working"

**Solution**: Make sure you're using a model that supports function calling:
- ✅ `gpt-4o-mini` (recommended)
- ✅ `gpt-4o`
- ✅ `gpt-4-turbo`
- ❌ `gpt-3.5-turbo` (may have limited support)

### Issue: "Tool execution errors"

**Solution**: Check backend logs for detailed error messages. Common issues:
- Product not found: Check product names match
- Database connection: Verify Prisma connection
- API key: Verify OpenAI API key is valid

### Issue: "Slow responses"

**Solution**: 
- Enhanced service is slower by design (makes multiple API calls)
- Consider using `gpt-4o-mini` for faster responses
- For simple queries, use original service (`USE_ENHANCED_AI=false`)

## Architecture

```
User Query
    ↓
Enhanced AI Service
    ↓
1. Load products (RAG)
    ↓
2. AI decides which tools to use
    ↓
3. Execute tools (get_product_price, calculate_total, etc.)
    ↓
4. AI processes results
    ↓
5. Generate final answer
```

## Tools Available

1. **get_product_price**: Get price details for a product
2. **calculate_total_price**: Calculate total for quantity of one product
3. **list_products**: List all products
4. **calculate_multi_product_total**: Calculate total for multiple products

## Next Steps

1. ✅ Enable enhanced service (`USE_ENHANCED_AI=true`)
2. ✅ Test with various queries
3. ✅ Monitor performance and costs
4. ✅ Gather user feedback
5. 🔄 Iterate and improve based on usage

## Support

For issues or questions:
- Check logs: `packages/backend/logs/`
- Review documentation: `docs/AI_AGENT_ENHANCEMENT_GUIDE.md`
- Test with simple queries first
