/**
 * Enhanced Supplier AI Service with Function Calling and RAG
 * This version uses OpenAI function calling for better intelligence
 */

import OpenAI from 'openai';
import { prisma } from '../utils/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Tool definitions for function calling
 */
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_product_price',
      description: 'Get the current price and details of a product by name. Use this to find product information before calculations.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'The name of the product (can be partial match, e.g., "cement" will match "Portland Cement")',
          },
        },
        required: ['productName'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculate_total_price',
      description: 'Calculate the total price for a specific quantity of a product. Use this when user asks about total cost for multiple units.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'The name of the product',
          },
          quantity: {
            type: 'number',
            description: 'The quantity/amount needed',
          },
        },
        required: ['productName', 'quantity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_products',
      description: 'List all products in the inventory. Use this when user asks to see their products or wants a list.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of products to return (default: 50)',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculate_multi_product_total',
      description: 'Calculate total price for multiple different products with different quantities. Use this when user mentions multiple products.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Array of items with product name and quantity',
            items: {
              type: 'object',
              properties: {
                productName: { type: 'string' },
                quantity: { type: 'number' },
              },
              required: ['productName', 'quantity'],
            },
          },
        },
        required: ['items'],
      },
    },
  },
];

/**
 * Tool implementation functions
 */
async function executeTool(
  toolName: string,
  args: any,
  supplierId: string
): Promise<any> {
  switch (toolName) {
    case 'get_product_price': {
      const product = await prisma.product.findFirst({
        where: {
          supplierId,
          name: {
            contains: args.productName,
            mode: 'insensitive',
          },
        },
      });

      if (!product) {
        return {
          success: false,
          error: `Product "${args.productName}" not found in your inventory.`,
        };
      }

      const unitPrice = Number(product.price) || 0;
      const currency = 'USD'; // Default currency, can be extended later

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          unit: product.unit,
          price: unitPrice,
          currency: currency,
        },
      };
    }

    case 'calculate_total_price': {
      const product = await prisma.product.findFirst({
        where: {
          supplierId,
          name: {
            contains: args.productName,
            mode: 'insensitive',
          },
        },
      });

      if (!product) {
        return {
          success: false,
          error: `Product "${args.productName}" not found.`,
        };
      }

      const unitPrice = Number(product.price) || 0;
      const currency = 'USD'; // Default currency, can be extended later

      if (unitPrice <= 0) {
        return {
          success: false,
          error: `Product "${product.name}" doesn't have a valid price set.`,
        };
      }

      const total = unitPrice * args.quantity;

      return {
        success: true,
        product: {
          name: product.name,
          unit: product.unit,
        },
        unitPrice,
        quantity: args.quantity,
        total,
        currency,
      };
    }

    case 'list_products': {
      const limit = args.limit || 50;
      const products = await prisma.product.findMany({
        where: { supplierId },
        orderBy: { name: 'asc' },
        take: limit,
      });

      const productList = products.map((p) => {
        const price = Number(p.price) || 0;
        const currency = 'USD'; // Default currency, can be extended later

        return {
          name: p.name,
          unit: p.unit,
          price,
          currency,
        };
      });

      return {
        success: true,
        products: productList,
        count: productList.length,
      };
    }

    case 'calculate_multi_product_total': {
      const results = [];
      let grandTotal = 0;
      let currency = 'USD';

      for (const item of args.items) {
        const product = await prisma.product.findFirst({
          where: {
            supplierId,
            name: {
              contains: item.productName,
              mode: 'insensitive',
            },
          },
        });

        if (!product) {
          results.push({
            productName: item.productName,
            success: false,
            error: 'Product not found',
          });
          continue;
        }

        const unitPrice = Number(product.price) || 0;
        currency = 'USD'; // Default currency, can be extended later

        if (unitPrice <= 0) {
          results.push({
            productName: product.name,
            success: false,
            error: 'No valid price set',
          });
          continue;
        }

        const total = unitPrice * item.quantity;
        grandTotal += total;

        results.push({
          productName: product.name,
          unit: product.unit,
          unitPrice,
          quantity: item.quantity,
          total,
          success: true,
        });
      }

      return {
        success: true,
        items: results,
        grandTotal,
        currency,
      };
    }

    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
  }
}

/**
 * Enhanced process command with function calling and RAG
 */
export async function processSupplierCommandEnhanced(
  command: string,
  supplierId: string
): Promise<{
  answer: string;
  action?: {
    type: 'price_updated' | 'product_added' | 'products_listed' | 'product_deleted' | 'product_updated';
    data?: any;
  };
}> {
  // Step 1: RAG - Retrieve relevant products for context
  const allProducts = await prisma.product.findMany({
    where: { supplierId },
    take: 20, // Limit for context
    orderBy: { name: 'asc' },
  });

  const productContext = allProducts
    .map((p) => {
      const price = Number(p.price) || 0;
      const currency = 'USD'; // Default currency
      return `- ${p.name}: ${currency} ${price.toFixed(2)}/${p.unit}`;
    })
    .join('\n');

  // Step 2: System prompt with context
  const systemPrompt = `You are an intelligent assistant for suppliers managing their product inventory and prices.

You have access to the following tools:
- get_product_price: Get price details for a specific product
- calculate_total_price: Calculate total for a quantity of one product
- list_products: List all products
- calculate_multi_product_total: Calculate total for multiple different products

Your product inventory:
${productContext || 'No products yet'}

When answering questions:
1. Use tools to get accurate, up-to-date information
2. Perform calculations step by step
3. Provide clear, formatted responses
4. If a product isn't found, suggest similar products or ask for clarification
5. For complex queries involving multiple products, use calculate_multi_product_total

Be helpful, accurate, and concise. Always use tools to get real data rather than guessing.`;

  try {
    // Step 3: Initial AI call with function calling
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: command },
    ];

    let maxIterations = 5; // Prevent infinite loops
    let finalAnswer = '';

    while (maxIterations > 0) {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto', // Let AI decide when to use tools
        temperature: 0.3, // Lower temperature for more consistent results
      });

      const message = response.choices[0].message;
      messages.push(message);

      // If AI wants to use a tool
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Execute all tool calls
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          const toolResult = await executeTool(toolName, args, supplierId);

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }

        maxIterations--;
        continue; // Let AI process tool results
      }

      // AI provided final answer
      if (message.content) {
        finalAnswer = message.content;
        break;
      }

      maxIterations--;
    }

    if (!finalAnswer) {
      finalAnswer = 'I apologize, I encountered an error processing your request. Please try rephrasing your question.';
    }

    // Determine action type based on tools used (for UI updates)
    const toolsUsed = messages
      .filter((m) => m.role === 'assistant' && 'tool_calls' in m && m.tool_calls)
      .flatMap((m) => (m as any).tool_calls?.map((tc: any) => tc.function.name) || []);

    let action: any = undefined;
    if (toolsUsed.includes('list_products')) {
      action = {
        type: 'products_listed',
        data: { products: allProducts },
      };
    }

    return {
      answer: finalAnswer,
      action,
    };
  } catch (error: any) {
    console.error('Error in enhanced supplier command processing:', error);
    return {
      answer:
        'I apologize, I encountered an error processing your request. Please try again or use a specific command like "Show my products" or "How much is 10 cement?".',
    };
  }
}
