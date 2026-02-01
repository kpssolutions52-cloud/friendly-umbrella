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
  intent: 'update_price' | 'add_product' | 'view_products' | 'delete_product' | 'update_product' | 'general';
  productName?: string;
  newProductName?: string; // For renaming products
  price?: number;
  unit?: string;
  companyId?: string; // For company-specific pricing
  productId?: string; // For delete/update operations
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
- delete_product: Delete/remove a product
- update_product: Update product name or other details (not just price)
- general: General question or command

Return JSON with this structure:
{
  "intent": "update_price" | "add_product" | "view_products" | "delete_product" | "update_product" | "general",
  "productName": "cement" (if product mentioned for search),
  "newProductName": "Portland Cement" (if renaming product),
  "price": 48.50 (if price mentioned),
  "unit": "bag" (if unit mentioned),
  "companyId": "uuid" (if company-specific price mentioned)
}

Examples:
- "Update cement price to $48" → {"intent": "update_price", "productName": "cement", "price": 48}
- "Set steel price to $500 per ton" → {"intent": "update_price", "productName": "steel", "price": 500, "unit": "ton"}
- "Add new product: paint at $25 per gallon" → {"intent": "add_product", "productName": "paint", "price": 25, "unit": "gallon"}
- "Show my products" → {"intent": "view_products"}
- "Delete cement product" → {"intent": "delete_product", "productName": "cement"}
- "Remove steel from my inventory" → {"intent": "delete_product", "productName": "steel"}
- "Rename cement to Portland Cement" → {"intent": "update_product", "productName": "cement", "newProductName": "Portland Cement"}
- "Change cement unit to kg" → {"intent": "update_product", "productName": "cement", "unit": "kg"}
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
      // max_tokens: 200, // Removed - let OpenAI use default
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
    type: 'price_updated' | 'product_added' | 'products_listed' | 'product_deleted' | 'product_updated';
    data?: any;
  };
}> {
  // Extract intent
  const intent = await extractPriceUpdateIntent(command);

  // Handle different intents
  if (intent.intent === 'update_price' && intent.productName && intent.price !== undefined) {
    // Update existing product price - NEW SCHEMA ONLY
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

    // Update price - NEW SCHEMA ONLY
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
    // Add new product - NEW SCHEMA ONLY
    // First, verify the supplier organization exists and is of type 'supplier'
    console.log('[supplierAIService] Adding product with supplierId:', supplierId);
    
    const supplierOrg = await prisma.organization.findUnique({
      where: { id: supplierId },
      select: { id: true, type: true, name: true },
    });

    console.log('[supplierAIService] Supplier organization lookup result:', supplierOrg);

    if (!supplierOrg) {
      console.error('[supplierAIService] Organization not found:', supplierId);
      return {
        answer: `❌ Error: Your supplier organization (ID: ${supplierId}) was not found in the database. Please contact support.`,
      };
    }

    if (supplierOrg.type !== 'supplier') {
      console.error('[supplierAIService] Organization type mismatch:', supplierOrg.type);
      return {
        answer: `❌ Error: Your organization "${supplierOrg.name}" is of type "${supplierOrg.type}", but products can only be created for supplier organizations. Please contact support.`,
      };
    }

    // Generate SKU automatically: first 3 letters of product name (uppercase) + timestamp
    const productNamePrefix = intent.productName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD';
    const sku = `${productNamePrefix}-${Date.now().toString().slice(-6)}`;
    
    // Verify the organization one more time right before creating
    const finalCheck = await prisma.organization.findUnique({
      where: { id: supplierOrg.id },
      select: { id: true, type: true, name: true },
    });

    if (!finalCheck) {
      return {
        answer: `❌ Error: Organization was deleted between validation and creation. Please try again.`,
      };
    }

    if (finalCheck.type !== 'supplier') {
      return {
        answer: `❌ Error: Organization type changed to "${finalCheck.type}". Please contact support.`,
      };
    }

    console.log('[supplierAIService] Creating product with data:', {
      supplierId: supplierOrg.id,
      supplierIdType: typeof supplierOrg.id,
      supplierIdLength: supplierOrg.id?.length,
      organizationName: finalCheck.name,
      organizationType: finalCheck.type,
      name: intent.productName,
      sku,
      price: intent.price,
      unit: intent.unit || 'unit',
    });
    
    let newProduct;
    try {
      newProduct = await prisma.product.create({
        data: {
          supplierId: finalCheck.id, // Use the re-verified organization ID
          name: intent.productName,
          sku,
          price: intent.price,
          unit: intent.unit || 'unit',
        },
      });
      
      console.log('[supplierAIService] Product created successfully:', newProduct.id);

      return {
        answer: `✅ Added new product: ${newProduct.name} at $${Number(newProduct.price).toFixed(2)}/${newProduct.unit}`,
        action: {
          type: 'product_added',
          data: {
            product: newProduct,
          },
        },
      };
    } catch (error: any) {
      console.error('Error creating product:', error);
      console.error('Error details:', {
        supplierId,
        productName: intent.productName,
        price: intent.price,
        unit: intent.unit,
        errorCode: error.code,
        errorMessage: error.message,
      });

      // Handle foreign key constraint violation
      if (error.code === 'P2003') {
        console.error('[supplierAIService] Foreign key constraint violation details:', {
          errorCode: error.code,
          errorMessage: error.message,
          meta: error.meta,
          supplierId: supplierOrg.id,
          supplierIdFromParam: supplierId,
        });

        // Double-check the organization still exists
        const recheckOrg = await prisma.organization.findUnique({
          where: { id: supplierOrg.id },
          select: { id: true, type: true, name: true },
        });
        
        if (!recheckOrg) {
          return {
            answer: `❌ Error: Your supplier organization (ID: ${supplierOrg.id}) was not found. This may indicate a data inconsistency. Please contact support.`,
          };
        }

        // Check if the constraint is about supplierId
        const constraintInfo = error.meta?.field_name || error.meta?.target || 'unknown';
        
        return {
          answer: `❌ Error: Database constraint violation (${constraintInfo}). Your organization "${recheckOrg.name}" (ID: ${recheckOrg.id}) exists. This may be a database schema issue. Please contact support.`,
        };
      }

      // Handle other Prisma errors
      if (error.code && error.code.startsWith('P')) {
        return {
          answer: `❌ Error creating product: ${error.message}. Please try again or contact support.`,
        };
      }

      throw error; // Re-throw unexpected errors
    }
  } else if (intent.intent === 'view_products') {
    // List all products - NEW SCHEMA ONLY
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
  } else if (intent.intent === 'delete_product' && intent.productName) {
    // Delete product - NEW SCHEMA ONLY
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
        answer: `I couldn't find a product named "${intent.productName}" in your inventory.`,
      };
    }

    // Delete product
    await prisma.product.delete({
      where: { id: product.id },
    });

    return {
      answer: `✅ Deleted product: ${product.name}`,
      action: {
        type: 'product_deleted',
        data: {
          product: product,
        },
      },
    };
  } else if (intent.intent === 'update_product' && intent.productName) {
    // Update product (name, unit, etc.) - NEW SCHEMA ONLY
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
        answer: `I couldn't find a product named "${intent.productName}" in your inventory.`,
      };
    }

    // Build update data
    const updateData: any = {};
    if (intent.newProductName) {
      updateData.name = intent.newProductName;
    }
    if (intent.unit) {
      updateData.unit = intent.unit;
    }
    if (intent.price !== undefined) {
      updateData.price = intent.price;
    }

    if (Object.keys(updateData).length === 0) {
      return {
        answer: `What would you like to update about "${product.name}"? You can change the name, unit, or price.`,
      };
    }

    // Update product - NEW SCHEMA ONLY
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });

    const changes: string[] = [];
    if (intent.newProductName) changes.push(`name to "${updatedProduct.name}"`);
    if (intent.unit) changes.push(`unit to "${updatedProduct.unit}"`);
    if (intent.price !== undefined) changes.push(`price to $${Number(updatedProduct.price).toFixed(2)}`);

    return {
      answer: `✅ Updated ${product.name}: ${changes.join(', ')}`,
      action: {
        type: 'product_updated',
        data: {
          product: updatedProduct,
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
- Delete products
- Update product names and units
- Answer questions about their inventory

Be concise and helpful. If the supplier wants to update a price, guide them on the correct format.
Examples of commands you can help with:
- "Add cement at $48 per bag"
- "Update cement price to $50"
- "Delete steel product"
- "Rename cement to Portland Cement"
- "Change cement unit to kg"
- "Show my products"`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command },
        ],
        temperature: 0.7,
        // max_tokens: 500, // Removed - let OpenAI use default
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
