/**
 * Supplier AI Service for MVP 1
 * Handles natural language price updates from suppliers
 */

import OpenAI from 'openai';
import { prisma } from '../utils/prisma';
import { getCachedResponse, setCachedResponse } from './cacheService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PriceUpdateIntent {
  intent: 'update_price' | 'add_product' | 'view_products' | 'general';
  productName?: string;
  price?: number;
  unit?: string;
  companyId?: string; // For company-specific pricing
}

/**
 * Extract price update intent from supplier's natural language command
 */
async function extractPriceUpdateIntent(
  command: string
): Promise<PriceUpdateIntent> {
  const systemPrompt = `You are a command parser for a supplier price management system.
Extract the intent and details from the supplier's command.

Possible intents:
- update_price: Update price of an existing product
- add_product: Add a new product
- view_products: View list of products
- general: General question or command

Return JSON with this structure:
{
  "intent": "update_price" | "add_product" | "view_products" | "general",
  "productName": "cement" (if product mentioned),
  "price": 48.50 (if price mentioned),
  "unit": "bag" (if unit mentioned),
  "companyId": "uuid" (if company-specific price mentioned)
}

Examples:
- "Update cement price to $48" → {"intent": "update_price", "productName": "cement", "price": 48}
- "Set steel price to $500 per ton" → {"intent": "update_price", "productName": "steel", "price": 500, "unit": "ton"}
- "Add new product: paint at $25 per gallon" → {"intent": "add_product", "productName": "paint", "price": 25, "unit": "gallon"}
- "Show my products" → {"intent": "view_products"}
- "What's my current cement price?" → {"intent": "general"}

Return only valid JSON, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { intent: 'general' };
    }

    return JSON.parse(content) as PriceUpdateIntent;
  } catch (error) {
    console.error('Error extracting price update intent:', error);
    return { intent: 'general' };
  }
}

/**
 * Process supplier command and execute price update
 */
export async function processSupplierCommand(
  command: string,
  supplierId: string
): Promise<{
  answer: string;
  action?: {
    type: 'price_updated' | 'product_added' | 'products_listed';
    data?: any;
  };
}> {
  // Extract intent
  const intent = await extractPriceUpdateIntent(command);

  // Handle different intents
  if (intent.intent === 'update_price' && intent.productName && intent.price !== undefined) {
    // Update existing product price
    const product = await prisma.product.findFirst({
      where: {
        supplierId,
        name: {
          contains: intent.productName,
          mode: 'insensitive',
        },
      },
    });

    if (!product) {
      return {
        answer: `I couldn't find a product named "${intent.productName}" in your inventory. Would you like to add it as a new product?`,
      };
    }

    // Update price
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        price: intent.price,
        ...(intent.unit && { unit: intent.unit }),
      },
    });

    // Handle company-specific pricing if companyId is provided
    if (intent.companyId) {
      // Check if company exists
      const company = await prisma.organization.findUnique({
        where: { id: intent.companyId },
      });

      if (company && company.type === 'company') {
        // For MVP 1, create new company price entry (simplified - no upsert with complex unique constraint)
        // In production, you'd want to handle effective dates properly
        await prisma.companyPrice.create({
          data: {
            productId: product.id,
            companyId: intent.companyId,
            price: intent.price,
            effectiveFrom: new Date(),
          },
        }).catch(async (error) => {
          // If unique constraint violation, update existing
          if (error.code === 'P2002') {
            // Find existing and update
            const existing = await prisma.companyPrice.findFirst({
              where: {
                productId: product.id,
                companyId: intent.companyId,
              },
              orderBy: { effectiveFrom: 'desc' },
            });
            if (existing) {
              await prisma.companyPrice.update({
                where: { id: existing.id },
                data: { price: intent.price },
              });
            }
          } else {
            throw error;
          }
        });

        return {
          answer: `✅ Updated ${updatedProduct.name} price to $${intent.price}/${updatedProduct.unit} for ${company.name}. This special price is now active.`,
          action: {
            type: 'price_updated',
            data: {
              product: updatedProduct,
              company: company,
              price: intent.price,
            },
          },
        };
      }
    }

    return {
      answer: `✅ Updated ${updatedProduct.name} price to $${intent.price}/${updatedProduct.unit}. All companies will see this new price.`,
      action: {
        type: 'price_updated',
        data: {
          product: updatedProduct,
          price: intent.price,
        },
      },
    };
  } else if (intent.intent === 'add_product' && intent.productName && intent.price !== undefined) {
    // Add new product
    const newProduct = await prisma.product.create({
      data: {
        supplierId,
        name: intent.productName,
        price: intent.price,
        unit: intent.unit || 'unit',
      },
    });

    return {
      answer: `✅ Added new product: ${newProduct.name} at $${newProduct.price}/${newProduct.unit}`,
      action: {
        type: 'product_added',
        data: {
          product: newProduct,
        },
      },
    };
  } else if (intent.intent === 'view_products') {
    // List all products
    const products = await prisma.product.findMany({
      where: { supplierId },
      orderBy: { name: 'asc' },
      take: 50,
    });

    if (products.length === 0) {
      return {
        answer: 'You don\'t have any products yet. Add your first product by saying something like "Add cement at $48 per bag".',
      };
    }

    const productList = products
      .map((p) => `- ${p.name}: $${p.price}/${p.unit}`)
      .join('\n');

    return {
      answer: `Here are your products:\n\n${productList}\n\nYou have ${products.length} product(s) in total.`,
      action: {
        type: 'products_listed',
        data: {
          products,
        },
      },
    };
  } else {
    // General question - use AI to answer
    const systemPrompt = `You are a helpful assistant for suppliers managing their product inventory and prices.
You help suppliers:
- Update product prices
- Add new products
- View their product list
- Answer questions about their inventory

Be concise and helpful. If the supplier wants to update a price, guide them on the correct format.`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return {
        answer: response.choices[0].message.content || 'I apologize, I could not process your request.',
      };
    } catch (error) {
      console.error('Error processing general supplier command:', error);
      return {
        answer: 'I apologize, I encountered an error processing your request. Please try again or use a specific command like "Update cement price to $48".',
      };
    }
  }
}
