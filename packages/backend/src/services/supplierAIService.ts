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
    // Update existing product price - handle both old and new schemas
    let product: any;

    try {
      // Try new schema first
      product = await prisma.product.findFirst({
        where: {
          supplierId,
          name: {
            contains: intent.productName,
            mode: 'insensitive',
          },
        },
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product search');
        try {
          const { Prisma } = await import('@prisma/client');
          const searchPattern = `%${intent.productName}%`;
          const result = await prisma.$queryRaw<any[]>(
            Prisma.sql`
              SELECT id, supplier_id as "supplierId", name, price, unit
              FROM products
              WHERE supplier_id::text = ${supplierId}::text
              AND LOWER(name) LIKE LOWER(${searchPattern})
              LIMIT 1
            `
          );

          if (result && result.length > 0) {
            product = result[0];
          } else {
            product = null;
          }
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product search failed:', oldSchemaError);
          product = null;
        }
      } else {
        throw error;
      }
    }

    if (!product) {
      return {
        answer: `I couldn't find a product named "${intent.productName}" in your inventory. Would you like to add it as a new product?`,
      };
    }

    // Update price - handle both old and new schemas
    let updatedProduct: any;

    try {
      // Try new schema first
      updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          price: intent.price,
          ...(intent.unit && { unit: intent.unit }),
        },
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product update');
        try {
          const { Prisma } = await import('@prisma/client');
          
          if (intent.unit) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET price = ${intent.price}, unit = ${intent.unit}, updated_at = NOW() WHERE id = ${product.id}`
            );
          } else {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET price = ${intent.price}, updated_at = NOW() WHERE id = ${product.id}`
            );
          }

          // Fetch updated product
          const result = await prisma.$queryRaw<any[]>(
            Prisma.sql`
              SELECT id, supplier_id as "supplierId", name, price, unit
              FROM products
              WHERE id = ${product.id}
            `
          );

          if (result && result.length > 0) {
            updatedProduct = result[0];
          } else {
            updatedProduct = product; // Fallback to original
          }
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product update failed:', oldSchemaError);
          throw new Error(`Failed to update product: ${oldSchemaError.message || 'Unknown error'}`);
        }
      } else {
        throw error;
      }
    }

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
    // Add new product - handle both old and new schemas
    let newProduct: any;

    try {
      // Try new schema first
      newProduct = await prisma.product.create({
        data: {
          supplierId,
          name: intent.productName,
          price: intent.price,
          unit: intent.unit || 'unit',
        },
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product creation');
        try {
          const { Prisma } = await import('@prisma/client');
          const result = await prisma.$queryRaw<any[]>(
            Prisma.sql`
              INSERT INTO products (id, supplier_id, name, price, unit, created_at, updated_at)
              VALUES (gen_random_uuid(), ${supplierId}::text, ${intent.productName}, ${intent.price}, ${intent.unit || 'unit'}, NOW(), NOW())
              RETURNING id, supplier_id as "supplierId", name, price, unit, created_at as "createdAt", updated_at as "updatedAt"
            `
          );

          if (result && result.length > 0) {
            newProduct = result[0];
          } else {
            throw new Error('Failed to create product in old schema');
          }
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product creation failed:', oldSchemaError);
          throw new Error(`Failed to create product: ${oldSchemaError.message || 'Unknown error'}`);
        }
      } else {
        throw error;
      }
    }

    return {
      answer: `✅ Added new product: ${newProduct.name} at $${Number(newProduct.price).toFixed(2)}/${newProduct.unit}`,
      action: {
        type: 'product_added',
        data: {
          product: newProduct,
        },
      },
    };
  } else if (intent.intent === 'view_products') {
    // List all products - handle both old and new schemas
    let products: any[] = [];

    try {
      // Try new schema first
      products = await prisma.product.findMany({
        where: { supplierId },
        orderBy: { name: 'asc' },
        take: 50,
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product list');
        try {
          const { Prisma } = await import('@prisma/client');
          const result = await prisma.$queryRaw<any[]>(
            Prisma.sql`
              SELECT id, supplier_id as "supplierId", name, price, unit
              FROM products
              WHERE supplier_id::text = ${supplierId}::text
              ORDER BY name ASC
              LIMIT 50
            `
          );

          products = result || [];
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product list failed:', oldSchemaError);
          products = [];
        }
      } else {
        throw error;
      }
    }

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
    // Delete product - handle both old and new schemas
    let product: any;

    try {
      // Try new schema first
      product = await prisma.product.findFirst({
        where: {
          supplierId,
          name: {
            contains: intent.productName,
            mode: 'insensitive',
          },
        },
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product search (delete)');
        try {
          const { Prisma } = await import('@prisma/client');
          const searchPattern = `%${intent.productName}%`;
          const result = await prisma.$queryRaw<any[]>(
            Prisma.sql`
              SELECT id, supplier_id as "supplierId", name, price, unit
              FROM products
              WHERE supplier_id::text = ${supplierId}::text
              AND LOWER(name) LIKE LOWER(${searchPattern})
              LIMIT 1
            `
          );

          if (result && result.length > 0) {
            product = result[0];
          } else {
            product = null;
          }
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product search failed (delete):', oldSchemaError);
          product = null;
        }
      } else {
        throw error;
      }
    }

    if (!product) {
      return {
        answer: `I couldn't find a product named "${intent.productName}" in your inventory.`,
      };
    }

    // Delete product - handle both old and new schemas
    try {
      // Try new schema first
      await prisma.product.delete({
        where: { id: product.id },
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product deletion');
        try {
          const { Prisma } = await import('@prisma/client');
          await prisma.$executeRaw(
            Prisma.sql`DELETE FROM products WHERE id = ${product.id}`
          );
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product deletion failed:', oldSchemaError);
          throw new Error(`Failed to delete product: ${oldSchemaError.message || 'Unknown error'}`);
        }
      } else {
        throw error;
      }
    }

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
    // Update product (name, unit, etc.) - handle both old and new schemas
    let product: any;

    try {
      // Try new schema first
      product = await prisma.product.findFirst({
        where: {
          supplierId,
          name: {
            contains: intent.productName,
            mode: 'insensitive',
          },
        },
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product search (update)');
        try {
          const { Prisma } = await import('@prisma/client');
          const searchPattern = `%${intent.productName}%`;
          const result = await prisma.$queryRaw<any[]>(
            Prisma.sql`
              SELECT id, supplier_id as "supplierId", name, price, unit
              FROM products
              WHERE supplier_id::text = ${supplierId}::text
              AND LOWER(name) LIKE LOWER(${searchPattern})
              LIMIT 1
            `
          );

          if (result && result.length > 0) {
            product = result[0];
          } else {
            product = null;
          }
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product search failed (update):', oldSchemaError);
          product = null;
        }
      } else {
        throw error;
      }
    }

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

    // Update product - handle both old and new schemas
    let updatedProduct: any;

    try {
      // Try new schema first
      updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: updateData,
      });
    } catch (error: any) {
      // If new schema fails, try old schema with raw SQL
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        console.log('[SupplierAIService] Trying old schema with raw SQL for product update');
        try {
          const { Prisma } = await import('@prisma/client');
          
          // Build SQL update based on what fields need updating
          if (updateData.name && updateData.unit && updateData.price !== undefined) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET name = ${updateData.name}, unit = ${updateData.unit}, price = ${updateData.price}, updated_at = NOW() WHERE id = ${product.id}`
            );
          } else if (updateData.name && updateData.unit) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET name = ${updateData.name}, unit = ${updateData.unit}, updated_at = NOW() WHERE id = ${product.id}`
            );
          } else if (updateData.name && updateData.price !== undefined) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET name = ${updateData.name}, price = ${updateData.price}, updated_at = NOW() WHERE id = ${product.id}`
            );
          } else if (updateData.unit && updateData.price !== undefined) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET unit = ${updateData.unit}, price = ${updateData.price}, updated_at = NOW() WHERE id = ${product.id}`
            );
          } else if (updateData.name) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET name = ${updateData.name}, updated_at = NOW() WHERE id = ${product.id}`
            );
          } else if (updateData.unit) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET unit = ${updateData.unit}, updated_at = NOW() WHERE id = ${product.id}`
            );
          } else if (updateData.price !== undefined) {
            await prisma.$executeRaw(
              Prisma.sql`UPDATE products SET price = ${updateData.price}, updated_at = NOW() WHERE id = ${product.id}`
            );
          }

          // Fetch updated product
          const result = await prisma.$queryRaw<any[]>(
            Prisma.sql`
              SELECT id, supplier_id as "supplierId", name, price, unit
              FROM products
              WHERE id = ${product.id}
            `
          );

          if (result && result.length > 0) {
            updatedProduct = result[0];
          } else {
            updatedProduct = { ...product, ...updateData }; // Fallback
          }
        } catch (oldSchemaError: any) {
          console.error('[SupplierAIService] Old schema product update failed:', oldSchemaError);
          throw new Error(`Failed to update product: ${oldSchemaError.message || 'Unknown error'}`);
        }
      } else {
        throw error;
      }
    }

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
