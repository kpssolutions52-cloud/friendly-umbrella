/**
 * Supplier AI Service for MVP 1
 * Handles natural language price updates from suppliers
 */

import OpenAI from 'openai';
import { prisma } from '../utils/prisma';
import { getCachedResponse, setCachedResponse } from './cacheService';
import { priceService } from './priceService';
import { PriceExpiryInput } from './priceService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PriceUpdateIntent {
  intent: 'update_price' | 'add_product' | 'view_products' | 'delete_product' | 'update_product' | 'calculate_price' | 'general';
  productName?: string;
  newProductName?: string; // For renaming products
  price?: number;
  unit?: string;
  companyId?: string; // For company-specific pricing
  productId?: string; // For delete/update operations
  quantity?: number; // For price calculations
  expiryDuration?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'months';
  }; // For price expiry (e.g., { value: 2, unit: 'days' })
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
- calculate_price: Calculate total price for a quantity of a product
- general: General question or command

Return JSON with this structure:
{
  "intent": "update_price" | "add_product" | "view_products" | "delete_product" | "update_product" | "calculate_price" | "general",
  "productName": "cement" (if product mentioned for search),
  "newProductName": "Portland Cement" (if renaming product),
  "price": 48.50 (if price mentioned),
  "unit": "bag" (if unit mentioned),
  "companyId": "uuid" (if company-specific price mentioned),
  "quantity": 10 (if quantity mentioned for calculations),
  "expiryDuration": {"value": 2, "unit": "days"} (if expiry mentioned, unit can be "minutes", "hours", "days", or "months")
}

Examples:
- "Update cement price to $48" → {"intent": "update_price", "productName": "cement", "price": 48}
- "Set steel price to $500 per ton" → {"intent": "update_price", "productName": "steel", "price": 500, "unit": "ton"}
- "Set Ambuja Cement price expiry 2 days from now" → {"intent": "update_price", "productName": "Ambuja Cement", "expiryDuration": {"value": 2, "unit": "days"}}
- "Update cement price to $48 with expiry in 30 days" → {"intent": "update_price", "productName": "cement", "price": 48, "expiryDuration": {"value": 30, "unit": "days"}}
- "Set cement price expiry to 3 months" → {"intent": "update_price", "productName": "cement", "expiryDuration": {"value": 3, "unit": "months"}}
- "Add new product: paint at $25 per gallon" → {"intent": "add_product", "productName": "paint", "price": 25, "unit": "gallon"}
- "Show my products" → {"intent": "view_products"}
- "Delete cement product" → {"intent": "delete_product", "productName": "cement"}
- "Remove steel from my inventory" → {"intent": "delete_product", "productName": "steel"}
- "Rename cement to Portland Cement" → {"intent": "update_product", "productName": "cement", "newProductName": "Portland Cement"}
- "Change cement unit to kg" → {"intent": "update_product", "productName": "cement", "unit": "kg"}
- "How much is the price total of 10 Cement" → {"intent": "calculate_price", "productName": "Cement", "quantity": 10}
- "What's the total cost for 5 bags of cement?" → {"intent": "calculate_price", "productName": "cement", "quantity": 5}
- "Calculate price for 20 units of steel" → {"intent": "calculate_price", "productName": "steel", "quantity": 20}
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
  supplierId: string,
  userId?: string
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
  if (intent.intent === 'update_price' && intent.productName && (intent.price !== undefined || intent.expiryDuration)) {
    // Update existing product price or expiry - NEW SCHEMA ONLY
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

    // Get current default price to preserve price if only updating expiry
    const currentDefaultPrice = await prisma.defaultPrice.findFirst({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    const priceToUse = intent.price !== undefined ? intent.price : (currentDefaultPrice ? Number(currentDefaultPrice.price) : Number(product.price));

    // Build expiry input if provided
    let expiryInput: PriceExpiryInput | undefined;
    if (intent.expiryDuration) {
      expiryInput = {
        expiryDuration: {
          value: intent.expiryDuration.value,
          unit: intent.expiryDuration.unit,
        },
      };
    }

    // Update product price in product table if price changed
    if (intent.price !== undefined) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          price: intent.price,
          ...(intent.unit && { unit: intent.unit }),
        },
      });
    } else if (intent.unit) {
      // Update unit only if no price change
      await prisma.product.update({
        where: { id: product.id },
        data: { unit: intent.unit },
      });
    }

    // Update default price using price service (supports expiry)
    // Use provided userId or fallback to supplierId (for audit logging)
    const effectiveUserId = userId || supplierId;
    
    try {
      await priceService.updateDefaultPrice(
        product.id,
        supplierId,
        {
          price: priceToUse,
          currency: currentDefaultPrice?.currency || 'USD',
          expiry: expiryInput,
        },
        effectiveUserId
      );
    } catch (error: any) {
      console.error('Error updating default price with expiry:', error);
      // If price service fails, at least the product price was updated
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
            price: priceToUse,
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
                data: { price: priceToUse },
              });
            }
          } else {
            throw error;
          }
        });

        const expiryMsg = intent.expiryDuration 
          ? ` with expiry in ${intent.expiryDuration.value} ${intent.expiryDuration.unit}`
          : '';
        
        return {
          answer: `✅ Updated ${product.name} price to $${priceToUse}/${product.unit}${expiryMsg} for ${company.name}. This special price is now active.`,
          action: {
            type: 'price_updated',
            data: {
              product: product,
              company: company,
              price: priceToUse,
            },
          },
        };
      }
    }

    // Build response message
    let answerMsg = '';
    if (intent.price !== undefined && intent.expiryDuration) {
      answerMsg = `✅ Updated ${product.name} price to $${priceToUse}/${product.unit} with expiry in ${intent.expiryDuration.value} ${intent.expiryDuration.unit}. All companies will see this new price and expiry date.`;
    } else if (intent.price !== undefined) {
      answerMsg = `✅ Updated ${product.name} price to $${priceToUse}/${product.unit}. All companies will see this new price.`;
    } else if (intent.expiryDuration) {
      answerMsg = `✅ Updated ${product.name} price expiry to ${intent.expiryDuration.value} ${intent.expiryDuration.unit} from now. The current price of $${priceToUse}/${product.unit} will expire on the new date.`;
    } else {
      answerMsg = `✅ Updated ${product.name}.`;
    }

    return {
      answer: answerMsg,
      action: {
        type: 'price_updated',
        data: {
          product: product,
          price: priceToUse,
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
  } else if (intent.intent === 'calculate_price' && intent.productName && intent.quantity !== undefined) {
    // Calculate total price for a quantity of a product
    const quantity = intent.quantity;
    
    // Validate quantity
    if (quantity <= 0 || !Number.isFinite(quantity)) {
      return {
        answer: `⚠️ Please provide a valid positive quantity. For example: "How much is the price total of 10 Cement"`,
      };
    }

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
        answer: `I couldn't find a product named "${intent.productName}" in your inventory. Please check the product name and try again.`,
      };
    }

    // Get the current price from product.price
    const unitPrice = Number(product.price) || 0;
    const currency = 'USD'; // Default currency, can be extended later

    if (unitPrice <= 0) {
      return {
        answer: `⚠️ Product "${product.name}" doesn't have a valid price set. Please set a price first using "Update ${product.name} price to $X".`,
      };
    }

    // Calculate total
    const totalPrice = unitPrice * quantity;

    // Format the answer
    const answer = `💰 Price Calculation for ${product.name}:\n\n` +
      `• Unit Price: ${currency} ${unitPrice.toFixed(2)}/${product.unit}\n` +
      `• Quantity: ${quantity} ${product.unit}${quantity !== 1 ? 's' : ''}\n` +
      `• Total Price: ${currency} ${totalPrice.toFixed(2)}\n\n` +
      `Calculation: ${quantity} × ${currency} ${unitPrice.toFixed(2)} = ${currency} ${totalPrice.toFixed(2)}`;

    return {
      answer,
      action: {
        type: 'products_listed', // Reuse this action type for calculation results
        data: {
          product: product,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          currency: currency,
        },
      },
    };
  } else {
    // General question - use AI to answer
    const systemPrompt = `You are a helpful assistant for suppliers managing their product inventory and prices.
You CAN and SHOULD help suppliers:
- ✅ Update product prices (e.g., "Update steel price to $500" or "Update cement price to $48")
- ✅ Set price expiry dates (e.g., "Set Ambuja Cement price expiry 2 days from now" or "Update cement price expiry to 30 days")
- ✅ Update price and expiry together (e.g., "Update cement price to $48 with expiry in 30 days")
- ✅ Add new products (e.g., "Add paint at $25 per gallon")
- ✅ View their product list (e.g., "Show my products")
- ✅ Delete products (e.g., "Delete steel product")
- ✅ Update product names and units (e.g., "Rename cement to Portland Cement")
- ✅ Calculate total prices for quantities of products (e.g., "How much is 10 bags of cement?")

IMPORTANT: You CAN update prices AND set expiry dates! If a supplier asks to update a price or set expiry, guide them to use the correct format:
- "Update [product name] price to $[amount]"
- "Set [product name] price to $[amount] per [unit]"
- "Set [product name] price expiry [X] days/months from now"
- "Update [product name] price to $[amount] with expiry in [X] days"
- "Change [product name] price to $[amount]"

If they ask "why can't you update prices" or "can you set expiry", explain that you CAN do both and show them the correct command format.

Be concise and helpful. Always guide suppliers to use the correct command format.
Examples of commands:
- "Add cement at $48 per bag"
- "Update cement price to $50"
- "Set Ambuja Cement price expiry 2 days from now"
- "Update cement price to $48 with expiry in 30 days"
- "Set steel price expiry to 3 months"
- "Update steel price to $500 per ton"
- "Delete steel product"
- "Rename cement to Portland Cement"
- "Change cement unit to kg"
- "Show my products"
- "How much is the price total of 10 Cement"
- "Calculate price for 5 bags of cement"
- "What's the total cost for 20 units of steel?"`;

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
