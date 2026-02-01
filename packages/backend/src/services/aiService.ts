/**
 * AI Service for QS Assistant
 * Integrates with OpenAI/Claude to provide AI-powered answers with real supplier data
 */

import OpenAI from 'openai';
import {
  getCachedResponse,
  setCachedResponse,
} from './cacheService';
import {
  getSupplierPrices,
  getBestPrice,
  calculateTotalCost,
  SupplierPriceData,
} from './dataRetrievalService';
import { prisma } from '../utils/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SupplierData {
  supplier: string;
  product: string;
  price: number;
  unit: string;
}

/**
 * Format supplier data for AI context
 * Marks the best (lowest) price
 */
function formatSupplierData(supplierData: SupplierData[]): string {
  if (!supplierData || supplierData.length === 0) {
    return 'No supplier data available.';
  }

  // Find best price (lowest)
  const bestPrice = Math.min(...supplierData.map((item) => item.price));

  return supplierData
    .map((item) => {
      const isBest = item.price === bestPrice;
      const marker = isBest ? '⭐ BEST PRICE' : '';
      return `- ${item.supplier}: ${item.product} - $${item.price}/${item.unit} ${marker}`;
    })
    .join('\n');
}

/**
 * Format supplier list for AI context
 */
function formatSupplierList(suppliers: Array<{
  supplierId: string;
  supplierName: string;
  productName: string;
  price: number;
  unit: string;
}>): string {
  if (!suppliers || suppliers.length === 0) {
    return 'No suppliers found for this product.';
  }

  // Group by supplier name
  const supplierMap = new Map<string, Array<{ productName: string; price: number; unit: string }>>();
  
  suppliers.forEach((s) => {
    if (!supplierMap.has(s.supplierName)) {
      supplierMap.set(s.supplierName, []);
    }
    supplierMap.get(s.supplierName)!.push({
      productName: s.productName,
      price: s.price,
      unit: s.unit,
    });
  });

  // Format as list
  const result: string[] = [];
  supplierMap.forEach((products, supplierName) => {
    const productList = products.map((p) => `${p.productName} ($${p.price}/${p.unit})`).join(', ');
    result.push(`- **${supplierName}**: ${productList}`);
  });

  return result.join('\n');
}

/**
 * Extract product/material names from question
 * Simple keyword matching - can be enhanced with AI later
 */
export function extractProductsFromQuestion(
  question: string
): string[] {
  const commonMaterials = [
    'cement',
    'steel',
    'sand',
    'gravel',
    'brick',
    'tile',
    'paint',
    'wood',
    'concrete',
    'rebar',
    'wire',
    'pipe',
    'plaster',
    'mortar',
    'aggregate',
  ];

  const lowerQuestion = question.toLowerCase();
  return commonMaterials.filter((material) =>
    lowerQuestion.includes(material)
  );
}

/**
 * Check if question is price-related
 */
export function isPriceQuery(question: string): boolean {
  const priceKeywords = [
    'price',
    'cost',
    'how much',
    'quote',
    'pricing',
    'rate',
    'charge',
  ];
  const lowerQuestion = question.toLowerCase();
  return priceKeywords.some((keyword) => lowerQuestion.includes(keyword));
}

/**
 * Get supplier data for products (deprecated - use dataRetrievalService)
 * Kept for backward compatibility
 */
export async function getSupplierData(
  productNames: string[]
): Promise<SupplierData[]> {
  if (!productNames || productNames.length === 0) {
    return [];
  }

  const prices = await getSupplierPrices(productNames[0]);
  return prices.map((p) => ({
    supplier: p.supplier,
    product: p.product,
    price: p.price,
    unit: p.unit,
  }));
}

/**
 * Ask AI question with supplier data context
 */
export async function askQSQuestion(
  question: string,
  supplierData?: SupplierData[],
  additionalContext?: string
): Promise<string> {
  let systemPrompt = `You are a helpful Quantity Surveyor assistant. 
You help QS professionals with construction pricing, material specifications, 
and cost calculations.

IMPORTANT: You have access to REAL supplier data from the database. 
ALWAYS use this real data when answering questions. Do NOT provide generic 
or hypothetical supplier information when real data is available.

When answering questions about suppliers, you can provide:
- Supplier names
- Supplier contact information:
  * Organization email addresses
  * Contact person names and emails (from supplier users)
  * Note: Mobile phone and WhatsApp numbers are not currently stored in the system - only email contacts are available
- Supplier product lists and prices
- Product availability from specific suppliers
- Supplier product counts

Always prioritize real data from the system database over generic information.
When users ask about mobile, phone, or WhatsApp, explain that only email contact information is available in the system.

`;

  if (supplierData && supplierData.length > 0) {
    systemPrompt += `Current supplier prices from the database:
${formatSupplierData(supplierData)}

IMPORTANT: Always include these REAL supplier prices in your answer when relevant. 
The price marked with "⭐ BEST PRICE" is the lowest price available. 
Always mention this best price prominently in your response, for example: 
"The best price is $X from Supplier Y (⭐ BEST PRICE)".`;
  } else if (additionalContext && additionalContext.includes('Suppliers for')) {
    systemPrompt += `You have supplier information from the database. Use this information to answer the question.`;
  } else {
    systemPrompt += `Note: Real-time supplier prices are not currently available for this query. 
You can provide general information, but make it clear that you're providing general 
information and suggest the user check the database for specific suppliers.`;
  }

  if (additionalContext) {
    systemPrompt += `\n\n${additionalContext}`;
  }

  systemPrompt += `\n\nBe concise, helpful, and always prioritize real supplier data when available. 
Format prices clearly with currency symbols. For calculations, show your work step by step.`;

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      // max_tokens: 1500, // Removed - let OpenAI use default
    });

    return response.choices[0].message.content || 'I apologize, I could not generate a response.';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('OpenAI API key is invalid. Please check your configuration.');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.status === 500) {
      throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
    }
    
    throw new Error('Failed to get AI response. Please try again.');
  }
}

/**
 * Extract quantities from question (e.g., "100 bags of cement")
 */
export function extractQuantities(question: string): Array<{
  product: string;
  quantity: number;
  unit?: string;
}> {
  const quantityPattern = /(\d+(?:\.\d+)?)\s*(bag|bags|kg|kg|unit|units|piece|pieces|ton|tons|m3|cubic\s*meter|square\s*meter|sq\s*m|m2)\s+of\s+(\w+)/gi;
  const matches = question.matchAll(quantityPattern);
  const results: Array<{ product: string; quantity: number; unit?: string }> = [];

  for (const match of matches) {
    results.push({
      quantity: parseFloat(match[1]),
      unit: match[2],
      product: match[3],
    });
  }

  return results;
}

/**
 * Check if question requires calculation
 */
export function isCalculationQuery(question: string): boolean {
  const calcKeywords = [
    'calculate',
    'total',
    'how much',
    'cost',
    'price for',
    'quantity',
  ];
  const lowerQuestion = question.toLowerCase();
  return calcKeywords.some((keyword) => lowerQuestion.includes(keyword));
}

/**
 * Check if question is asking about suppliers
 */
export function isSupplierQuery(question: string): boolean {
  const supplierKeywords = [
    'supplier',
    'suppliers',
    'who has',
    'who sells',
    'who provides',
    'list suppliers',
    'show suppliers',
    'find suppliers',
    'supplier for',
    'suppliers for',
    'available suppliers',
    'which supplier',
    'which suppliers',
    'supplier name',
    'supplier contact',
    'supplier location',
    'supplier address',
    'supplier email',
    'supplier phone',
    'supplier mobile',
    'supplier whatsapp',
    'supplier details',
    'supplier information',
    'what suppliers',
    'tell me about suppliers',
    'show me suppliers',
    'contact info',
    'contact information',
    'phone number',
    'mobile number',
    'whatsapp number',
  ];
  const lowerQuestion = question.toLowerCase();
  return supplierKeywords.some((keyword) => lowerQuestion.includes(keyword));
}

/**
 * Extract supplier name from question
 */
export function extractSupplierName(question: string): string | null {
  // Patterns to match supplier names in questions
  const patterns = [
    /(?:supplier|from|by)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|$|,|\.|\?)/,
    /([A-Z][a-zA-Z\s&]+?)\s+(?:supplier|suppliers)/,
    /(?:what|which|show|list|tell me about)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+supplier|$)/,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common words that aren't supplier names
      if (name.length > 2 && !['The', 'What', 'Which', 'Show', 'List', 'Tell'].includes(name)) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Get suppliers that have a specific product
 */
export async function getSuppliersForProduct(productName: string): Promise<Array<{
  supplierId: string;
  supplierName: string;
  productName: string;
  price: number;
  unit: string;
}>> {
  try {
    // Query products that match the product name and get their suppliers
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: productName,
          mode: 'insensitive',
        },
        supplier: {
          type: 'supplier',
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    });

    // Filter out products with null suppliers and map to result
    return products
      .filter((p) => p.supplier !== null)
      .map((p) => ({
        supplierId: p.supplierId,
        supplierName: p.supplier!.name,
        productName: p.name,
        price: Number(p.price),
        unit: p.unit,
      }));
  } catch (error) {
    console.error('Error getting suppliers for product:', error);
    return [];
  }
}

/**
 * Get all suppliers in the system with full details including contact info
 */
export async function getAllSuppliers(): Promise<Array<{
  id: string;
  name: string;
  email: string;
  productCount: number;
  contactUsers?: Array<{
    name: string | null;
    email: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
  }>;
}>> {
  try {
    const suppliers = await prisma.organization.findMany({
      where: {
        type: 'supplier',
      },
      select: {
        id: true,
        name: true,
        email: true,
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        users: {
          where: {
            type: 'supplier',
          },
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      productCount: s.products?.length || 0,
      contactUsers: s.users.map((u) => ({
        name: u.name,
        email: u.email,
      })),
      products: s.products?.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        unit: p.unit,
      })),
    }));
  } catch (error) {
    console.error('Error getting all suppliers:', error);
    return [];
  }
}

/**
 * Get supplier by name (fuzzy search) with contact information
 */
export async function getSupplierByName(supplierName: string): Promise<Array<{
  id: string;
  name: string;
  email: string;
  productCount: number;
  contactUsers?: Array<{
    name: string | null;
    email: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
  }>;
}>> {
  try {
    const suppliers = await prisma.organization.findMany({
      where: {
        type: 'supplier',
        name: {
          contains: supplierName,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        users: {
          where: {
            type: 'supplier',
          },
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      productCount: s.products?.length || 0,
      contactUsers: s.users.map((u) => ({
        name: u.name,
        email: u.email,
      })),
      products: s.products?.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        unit: p.unit,
      })) || [],
    }));
  } catch (error) {
    console.error('Error getting supplier by name:', error);
    return [];
  }
}

/**
 * Get products for a specific supplier
 */
export async function getSupplierProducts(supplierId: string): Promise<Array<{
  id: string;
  name: string;
  price: number;
  unit: string;
}>> {
  try {
    const products = await prisma.product.findMany({
      where: {
        supplierId,
        supplier: {
          type: 'supplier',
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
    }));
  } catch (error) {
    console.error('Error getting supplier products:', error);
    return [];
  }
}

/**
 * Format supplier details for AI context including contact information
 */
function formatSupplierDetails(suppliers: Array<{
  id: string;
  name: string;
  email: string;
  productCount: number;
  contactUsers?: Array<{
    name: string | null;
    email: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
  }>;
}>): string {
  if (!suppliers || suppliers.length === 0) {
    return 'No suppliers found in the system.';
  }

  return suppliers.map((s) => {
    let details = `**${s.name}**\n`;
    
    // Contact Information
    details += `**Contact Information:**\n`;
    details += `- Organization Email: ${s.email}\n`;
    
    if (s.contactUsers && s.contactUsers.length > 0) {
      details += `- Contact Persons:\n`;
      s.contactUsers.forEach((user) => {
        details += `  • ${user.name || 'Contact'}: ${user.email}\n`;
      });
    }
    
    details += `\n**Products:** ${s.productCount} products available\n`;
    
    if (s.products && s.products.length > 0) {
      details += `**Product List:**\n`;
      s.products.slice(0, 10).forEach((p) => {
        details += `  • ${p.name} - $${p.price}/${p.unit}\n`;
      });
      if (s.products.length > 10) {
        details += `  ... and ${s.products.length - 10} more products\n`;
      }
    }
    
    return details;
  }).join('\n\n');
}

/**
 * Format supplier contact information specifically
 */
function formatSupplierContactInfo(suppliers: Array<{
  id: string;
  name: string;
  email: string;
  contactUsers?: Array<{
    name: string | null;
    email: string;
  }>;
}>): string {
  if (!suppliers || suppliers.length === 0) {
    return 'No suppliers found in the system.';
  }

  return suppliers.map((s) => {
    let contact = `**${s.name}**\n`;
    contact += `- Organization Email: ${s.email}\n`;
    
    if (s.contactUsers && s.contactUsers.length > 0) {
      contact += `- Contact Persons:\n`;
      s.contactUsers.forEach((user) => {
        contact += `  • ${user.name || 'Contact'}: ${user.email}\n`;
      });
    }
    
    contact += `\nNote: Mobile phone and WhatsApp numbers are not currently stored in the system. Please contact via email.`;
    
    return contact;
  }).join('\n\n');
}

/**
 * Response type for processQSQuestion
 */
export interface QSQuestionResponse {
  answer: string;
  requiresPermission?: boolean;
  hasSystemData?: boolean;
  systemDataSummary?: string;
}

/**
 * Main function to process QS question with caching and enhanced data retrieval
 */
export async function processQSQuestion(
  question: string,
  allowGenericAnswers: boolean = false
): Promise<QSQuestionResponse> {
  // Check cache first
  const cached = await getCachedResponse(question);
  if (cached) {
    // Parse cached response - it's stored as JSON string
    try {
      return JSON.parse(cached) as QSQuestionResponse;
    } catch {
      // If parsing fails, return as answer string
      return {
        answer: cached,
        hasSystemData: false,
      };
    }
  }

  // Extract products and quantities
  const products = extractProductsFromQuestion(question);
  const quantities = extractQuantities(question);
  
  let supplierData: SupplierData[] = [];
  let calculationResult = null;
  let supplierListContext = '';

  // Track if we found any system data
  let hasSystemData = false;
  let systemDataSummary = '';

  // Handle supplier queries (e.g., "list cement suppliers", "show supplier contact", etc.)
  if (isSupplierQuery(question)) {
    // Check if asking about a specific supplier by name
    const supplierName = extractSupplierName(question);
    
    if (supplierName) {
      // User is asking about a specific supplier
      const specificSuppliers = await getSupplierByName(supplierName);
      if (specificSuppliers.length > 0) {
        hasSystemData = true;
        
        // Check if specifically asking for contact info
        const lowerQuestion = question.toLowerCase();
        const wantsContactInfo = lowerQuestion.includes('contact') || 
                                lowerQuestion.includes('email') || 
                                lowerQuestion.includes('phone') || 
                                lowerQuestion.includes('mobile') ||
                                lowerQuestion.includes('whatsapp') ||
                                lowerQuestion.includes('number');
        
        if (wantsContactInfo) {
          supplierListContext += `Contact Information for ${supplierName}:\n${formatSupplierContactInfo(specificSuppliers)}\n\n`;
        } else {
          supplierListContext += `Supplier Details:\n${formatSupplierDetails(specificSuppliers)}\n\n`;
        }
        
        systemDataSummary += `Found ${specificSuppliers.length} supplier(s) matching "${supplierName}" in the system database.\n`;
        
        // Also add products to supplierData
        specificSuppliers.forEach((s) => {
          if (s.products) {
            supplierData.push(...s.products.map((p) => ({
              supplier: s.name,
              product: p.name,
              price: p.price,
              unit: p.unit,
            })));
          }
        });
      } else {
        systemDataSummary += `No supplier found matching "${supplierName}" in the system database.\n`;
      }
    } else if (products.length > 0) {
      // User is asking for suppliers of a specific product
      for (const product of products) {
        const suppliers = await getSuppliersForProduct(product);
        if (suppliers.length > 0) {
          hasSystemData = true;
          supplierListContext += `Suppliers for ${product}:\n${formatSupplierList(suppliers)}\n\n`;
          systemDataSummary += `Found ${suppliers.length} supplier(s) for ${product} in the system database.\n`;
          // Also add to supplierData for price display
          supplierData.push(...suppliers.map((s) => ({
            supplier: s.supplierName,
            product: s.productName,
            price: s.price,
            unit: s.unit,
          })));
        } else {
          systemDataSummary += `No suppliers found for ${product} in the system database.\n`;
        }
      }
    } else {
      // User is asking for all suppliers or general supplier information
      // Check if asking about contact, location, or products
      const lowerQuestion = question.toLowerCase();
      const wantsContactInfo = lowerQuestion.includes('contact') || 
                              lowerQuestion.includes('email') || 
                              lowerQuestion.includes('phone') || 
                              lowerQuestion.includes('mobile') ||
                              lowerQuestion.includes('whatsapp') ||
                              lowerQuestion.includes('number');
      const wantsDetails = wantsContactInfo ||
                          lowerQuestion.includes('location') || 
                          lowerQuestion.includes('address') ||
                          lowerQuestion.includes('products') ||
                          lowerQuestion.includes('what') ||
                          lowerQuestion.includes('details') ||
                          lowerQuestion.includes('information');
      
      const allSuppliers = await getAllSuppliers();
      if (allSuppliers.length > 0) {
        hasSystemData = true;
        if (wantsContactInfo) {
          // Focus on contact information
          supplierListContext = `Supplier Contact Information:\n${formatSupplierContactInfo(allSuppliers)}\n\n`;
        } else if (wantsDetails) {
          // Include full details with contact info and products
          supplierListContext = `All Suppliers in the System:\n${formatSupplierDetails(allSuppliers)}\n\n`;
        } else {
          // Just list names and product counts
          supplierListContext = `All suppliers in the system:\n${allSuppliers.map((s) => `- **${s.name}** (${s.productCount} products, Email: ${s.email})`).join('\n')}\n\n`;
        }
        systemDataSummary = `Found ${allSuppliers.length} supplier(s) in the system database.\n`;
        
        // Add all products to supplierData for comprehensive context
        allSuppliers.forEach((s) => {
          if (s.products) {
            supplierData.push(...s.products.map((p) => ({
              supplier: s.name,
              product: p.name,
              price: p.price,
              unit: p.unit,
            })));
          }
        });
      } else {
        systemDataSummary = `No suppliers found in the system database.\n`;
      }
    }
  }

  // Handle calculation queries
  if (isCalculationQuery(question) && quantities.length > 0) {
    const items = quantities.map((q) => ({
      productName: q.product,
      quantity: q.quantity,
    }));
    
    calculationResult = await calculateTotalCost(items);
    const itemsWithData = calculationResult.items.filter((item) => item.bestPrice);
    if (itemsWithData.length > 0) {
      hasSystemData = true;
      systemDataSummary += `Found pricing data for ${itemsWithData.length} product(s) in the system.\n`;
    }
    supplierData.push(...itemsWithData.map((item) => ({
      supplier: item.bestPrice!.supplier,
      product: item.productName,
      price: item.bestPrice!.price,
      unit: item.bestPrice!.unit,
    })));
  } else if (isPriceQuery(question) && products.length > 0) {
    // Get supplier data for price queries
    for (const product of products) {
      const prices = await getSupplierPrices(product);
      if (prices.length > 0) {
        hasSystemData = true;
        systemDataSummary += `Found ${prices.length} price(s) for ${product} in the system database.\n`;
      }
      supplierData.push(...prices.map((p) => ({
        supplier: p.supplier,
        product: p.product,
        price: p.price,
        unit: p.unit,
      })));
    }
    // Remove duplicates
    supplierData = supplierData.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.product === item.product && t.supplier === item.supplier)
    );
  } else if (products.length > 0 && !isSupplierQuery(question)) {
    // If product is mentioned but not a price/supplier query, still get supplier data
    for (const product of products) {
      const prices = await getSupplierPrices(product);
      if (prices.length > 0) {
        hasSystemData = true;
        systemDataSummary += `Found ${prices.length} supplier(s) for ${product} in the system database.\n`;
      }
      supplierData.push(...prices.map((p) => ({
        supplier: p.supplier,
        product: p.product,
        price: p.price,
        unit: p.unit,
      })));
    }
    // Remove duplicates
    supplierData = supplierData.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.product === item.product && t.supplier === item.supplier)
    );
  }

  // Handle questions about specific supplier's products (e.g., "what products does ABC have?")
  const questionLower = question.toLowerCase();
  if (questionLower.includes('products') && (questionLower.includes('does') || questionLower.includes('has') || questionLower.includes('sell'))) {
    const supplierName = extractSupplierName(question);
    if (supplierName) {
      const suppliers = await getSupplierByName(supplierName);
      if (suppliers.length > 0) {
        hasSystemData = true;
        suppliers.forEach((s) => {
          if (s.products && s.products.length > 0) {
            supplierListContext += `Products from ${s.name}:\n`;
            s.products.forEach((p) => {
              supplierListContext += `- ${p.name} - $${p.price}/${p.unit}\n`;
            });
            supplierListContext += '\n';
            systemDataSummary += `Found ${s.products.length} product(s) from ${s.name} in the system database.\n`;
          }
        });
      }
    }
  }

  // Check if this is a supplier-related question and we have no data
  const isSupplierRelated = isSupplierQuery(question) || products.length > 0;
  const needsPermission = isSupplierRelated && !hasSystemData && !allowGenericAnswers;

  // If we need permission and don't have it, return permission request
  if (needsPermission) {
    const productList = products.length > 0 ? products.join(', ') : 'the requested information';
    return {
      answer: `I don't have any supplier data for "${productList}" in the system database.\n\nWould you like me to provide general information about suppliers from my knowledge base instead?\n\nPlease reply with "yes" or "allow generic answers" to proceed with general information, or ask a different question about suppliers that are in the system.`,
      requiresPermission: true,
      hasSystemData: false,
      systemDataSummary: systemDataSummary.trim() || 'No data found in system database.',
    };
  }

  // Build enhanced context
  let context = '';
  
  // Add supplier list context if available
  if (supplierListContext) {
    context += supplierListContext;
  }
  
  if (supplierData.length > 0) {
    context += `Current Supplier Prices:\n${formatSupplierData(supplierData)}\n\n`;
  }
  
  if (calculationResult) {
    context += `Calculation Results:\n`;
    calculationResult.items.forEach((item) => {
      if (item.bestPrice) {
        context += `- ${item.productName}: ${item.quantity} ${item.bestPrice.unit} × $${item.bestPrice.price}/${item.bestPrice.unit} = $${item.total.toFixed(2)}\n`;
      }
    });
    context += `Grand Total: $${calculationResult.grandTotal.toFixed(2)}\n\n`;
  }

  // Update system prompt to indicate if we're using generic data
  let additionalPromptContext = '';
  if (allowGenericAnswers && !hasSystemData) {
    additionalPromptContext = '\n\nIMPORTANT: You are providing general information from your knowledge base because no data was found in the system database. Make it clear in your response that this is general information, not specific to the user\'s system.';
  }

  // Get AI response with enhanced context
  const answer = await askQSQuestion(question, supplierData, context + additionalPromptContext);

  // Cache the response
  await setCachedResponse(question, answer, 60); // 1 minute cache

  return {
    answer,
    requiresPermission: false,
    hasSystemData,
    systemDataSummary: systemDataSummary.trim() || (hasSystemData ? 'Data found in system database.' : 'No data found in system database.'),
  };
}
