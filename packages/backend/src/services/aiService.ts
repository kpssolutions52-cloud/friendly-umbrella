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
 * Extract product/material names from question using AI and database lookup
 */
export async function extractProductsFromQuestion(
  question: string
): Promise<string[]> {
  const lowerQuestion = question.toLowerCase();
  
  // First, try to find products in the database that match keywords in the question
  try {
    // Extract potential product keywords (single words that might be products)
    const words = lowerQuestion.split(/\s+/).filter(w => w.length > 3);
    
    // Query database for products that contain these words
    const dbProducts = await prisma.product.findMany({
      where: {
        name: {
          contains: words.join(' '),
          mode: 'insensitive',
        },
        supplier: {
          type: 'supplier',
        },
      },
      select: {
        name: true,
      },
      take: 20,
      distinct: ['name'],
    });

    if (dbProducts.length > 0) {
      // Extract unique product names and check if they're mentioned in the question
      const foundProducts = dbProducts
        .map(p => p.name.toLowerCase())
        .filter(productName => {
          // Check if the product name or its key words appear in the question
          const productWords = productName.split(/\s+/);
          return productWords.some(word => lowerQuestion.includes(word)) || 
                 lowerQuestion.includes(productName);
        });
      
      if (foundProducts.length > 0) {
        return [...new Set(foundProducts)]; // Remove duplicates
      }
    }
  } catch (error) {
    console.error('Error querying database for products:', error);
  }

  // Fallback: Use AI to extract product names
  try {
    const extractionPrompt = `Extract all product/material names from this construction-related question. 
Return only a JSON array of product names (use common construction material names), nothing else.

Question: "${question}"

Examples:
- "I need cement and steel" → ["cement", "steel"]
- "What's the price of roofing materials?" → ["roofing", "roofing materials"]
- "Show me suppliers for tiles and paint" → ["tiles", "paint"]

Return JSON array only:`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a product name extractor. Return only valid JSON arrays.' },
        { role: 'user', content: extractionPrompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content?.trim();
    if (content) {
      try {
        const products = JSON.parse(content);
        if (Array.isArray(products) && products.length > 0) {
          return products.map((p: string) => p.toLowerCase());
        }
      } catch {
        // If JSON parsing fails, continue to keyword matching
      }
    }
  } catch (error) {
    console.error('Error extracting products with AI:', error);
  }

  // Final fallback: Simple keyword matching
  const commonMaterials = [
    'cement', 'steel', 'sand', 'gravel', 'brick', 'tile', 'paint', 'wood',
    'concrete', 'rebar', 'wire', 'pipe', 'plaster', 'mortar', 'aggregate',
    'roofing', 'insulation', 'drywall', 'lumber', 'plywood', 'hardware',
    'electrical', 'plumbing', 'fixtures', 'windows', 'doors', 'flooring',
  ];

  return commonMaterials.filter((material) => lowerQuestion.includes(material));
}

/**
 * Analyze query intent and complexity using AI
 */
export async function analyzeQueryIntent(question: string): Promise<{
  intent: 'price' | 'supplier' | 'product' | 'comparison' | 'calculation' | 'contact' | 'general';
  complexity: 'simple' | 'complex' | 'multi-step';
  entities: {
    products?: string[];
    suppliers?: string[];
    quantities?: Array<{ product: string; quantity: number; unit?: string }>;
  };
  requiresMultiStep: boolean;
}> {
  try {
    const analysisPrompt = `Analyze this construction-related question and return a JSON object with:
- intent: one of "price", "supplier", "product", "comparison", "calculation", "contact", "general"
- complexity: "simple" (single question) or "complex" (needs reasoning) or "multi-step" (needs multiple queries)
- entities: object with products (array), suppliers (array), quantities (array of {product, quantity, unit})
- requiresMultiStep: boolean

Question: "${question}"

Examples:
- "What's the price of cement?" → {"intent": "price", "complexity": "simple", "entities": {"products": ["cement"]}, "requiresMultiStep": false}
- "Compare prices of cement from all suppliers" → {"intent": "comparison", "complexity": "complex", "entities": {"products": ["cement"]}, "requiresMultiStep": true}
- "Which supplier has the cheapest steel and what's their contact?" → {"intent": "comparison", "complexity": "multi-step", "entities": {"products": ["steel"]}, "requiresMultiStep": true}

Return JSON only:`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a query analyzer. Return only valid JSON objects.' },
        { role: 'user', content: analysisPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content?.trim();
    if (content) {
      try {
        const analysis = JSON.parse(content);
        return {
          intent: analysis.intent || 'general',
          complexity: analysis.complexity || 'simple',
          entities: analysis.entities || {},
          requiresMultiStep: analysis.requiresMultiStep || false,
        };
      } catch {
        // Fall through to default
      }
    }
  } catch (error) {
    console.error('Error analyzing query intent:', error);
  }

  // Fallback to simple analysis
  const lowerQuestion = question.toLowerCase();
  return {
    intent: isPriceQuery(question) ? 'price' : isSupplierQuery(question) ? 'supplier' : 'general',
    complexity: lowerQuestion.includes('compare') || lowerQuestion.includes('best') || lowerQuestion.includes('cheapest') ? 'complex' : 'simple',
    entities: {
      products: [],
      suppliers: [],
    },
    requiresMultiStep: false,
  };
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
 * Message interface for conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Ask AI question with supplier data context and conversation history
 */
export async function askQSQuestion(
  question: string,
  supplierData?: SupplierData[],
  additionalContext?: string,
  conversationHistory?: ConversationMessage[]
): Promise<string> {
  let systemPrompt = `You are an intelligent Quantity Surveyor assistant with access to a real construction materials database.

**YOUR CAPABILITIES:**
1. Answer questions about suppliers, products, prices, and contact information
2. Compare prices across multiple suppliers
3. Calculate total costs for multiple products/quantities
4. Find best prices and recommend suppliers
5. Provide detailed supplier information including contact details
6. Handle complex multi-part questions
7. Understand context from previous conversation messages

**CONVERSATION CONTEXT:**
- You have access to the conversation history (previous messages in this chat)
- Use this context to understand follow-up questions, references, and incomplete questions
- If a user says "what about that supplier?" or "show me their contact", refer back to previous messages
- For incomplete questions, use conversation context to understand what the user is asking
- Maintain context across the conversation - remember what was discussed earlier

**CRITICAL RULES:**
- ALWAYS use REAL data from the database when available
- NEVER make up or guess supplier names, prices, or contact information
- NEVER invent supplier names like "Test Supplier Inc" or any other fake names
- NEVER create fake product prices or product names
- If data is not in the system, clearly state "No data found in the system database" and DO NOT invent information
- Only provide generic educational information if explicitly allowed by the user
- For comparisons, analyze all available data and provide clear recommendations
- For calculations, show your work step-by-step
- For complex questions, break them down and answer each part systematically
- Use conversation history to understand context and provide coherent, contextual answers

**FOLLOW-UP QUESTIONS:**
When users ask follow-up questions or incomplete questions:
- Reference previous messages in the conversation
- Use context to understand what "it", "that", "they", "them" refers to
- If a question seems incomplete, use conversation history to complete it
- Example: If user previously asked about "cement suppliers" and now asks "what about their contact?", understand "their" refers to those suppliers

**DATA FORMAT:**
- Prices are marked with "⭐ BEST PRICE" for the lowest price
- Supplier information includes organization email and contact person emails
- Product information includes name, price, unit, and supplier

**COMPLEX QUERY HANDLING:**
When users ask complex questions (e.g., "Compare prices and find the cheapest supplier with contact info"):
1. Break down the question into sub-questions
2. Answer each part systematically
3. Synthesize the information into a comprehensive answer
4. Provide clear recommendations when appropriate

**EXAMPLES OF GOOD ANSWERS:**
- "Based on the system data, Supplier A offers cement at $50/bag (⭐ BEST PRICE), while Supplier B offers it at $55/bag. Supplier A's contact email is..."
- "For your project requiring 100 bags of cement and 50 tons of steel, the total cost would be: [calculation with breakdown]"
- "I found 3 suppliers for tiles. Here's a comparison: [detailed comparison with prices and contacts]"

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
    
    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided (limit to last 10 messages to avoid token limits)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10); // Keep last 10 messages
      recentHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current question
    messages.push({ role: 'user', content: question });
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
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
  allowGenericAnswers: boolean = false,
  conversationHistory?: ConversationMessage[]
): Promise<QSQuestionResponse> {
  // Check cache first (but only if no conversation history, as context matters)
  // For questions with conversation history, skip cache to ensure context is used
  if (!conversationHistory || conversationHistory.length === 0) {
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
  }

  // Analyze query intent and complexity
  const queryAnalysis = await analyzeQueryIntent(question);
  
  // Extract products using AI-enhanced extraction
  const products = await extractProductsFromQuestion(question);
  const quantities = extractQuantities(question);
  
  // Extract supplier names if mentioned
  const mentionedSuppliers = queryAnalysis.entities.suppliers || [];
  const extractedSupplierName = extractSupplierName(question);
  if (extractedSupplierName && !mentionedSuppliers.includes(extractedSupplierName)) {
    mentionedSuppliers.push(extractedSupplierName);
  }
  
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

  // Handle comparison queries - get comprehensive data for all mentioned products
  if (queryAnalysis.intent === 'comparison' && products.length > 0) {
    // For comparison, we want all suppliers for all products
    const comparisonData: Array<{
      product: string;
      suppliers: Array<{
        supplier: string;
        price: number;
        unit: string;
      }>;
    }> = [];

    for (const product of products) {
      const prices = await getSupplierPrices(product);
      if (prices.length > 0) {
        hasSystemData = true;
        comparisonData.push({
          product,
          suppliers: prices.map((p) => ({
            supplier: p.supplier,
            price: p.price,
            unit: p.unit,
          })),
        });
        
        // Add to supplierData
        supplierData.push(...prices.map((p) => ({
          supplier: p.supplier,
          product: p.product,
          price: p.price,
          unit: p.unit,
        })));
      }
    }

    if (comparisonData.length > 0) {
      supplierListContext += `**Price Comparison Data:**\n`;
      comparisonData.forEach((item) => {
        const sortedSuppliers = item.suppliers.sort((a, b) => a.price - b.price);
        const bestPrice = sortedSuppliers[0];
        supplierListContext += `\n${item.product}:\n`;
        sortedSuppliers.forEach((s, idx) => {
          const marker = idx === 0 ? '⭐ BEST PRICE' : '';
          supplierListContext += `  ${idx + 1}. ${s.supplier}: $${s.price}/${s.unit} ${marker}\n`;
        });
      });
      supplierListContext += '\n';
    }
  }

  // Handle multi-step queries (e.g., "find cheapest supplier for cement and their contact")
  if (queryAnalysis.requiresMultiStep && products.length > 0) {
    // Step 1: Find best prices
    for (const product of products) {
      const prices = await getSupplierPrices(product);
      if (prices.length > 0) {
        hasSystemData = true;
        // Sort by price and get the cheapest
        const sortedPrices = prices.sort((a, b) => a.price - b.price);
        const cheapest = sortedPrices[0];
        
        // Step 2: Get contact info for cheapest supplier
        const cheapestSuppliers = await getSupplierByName(cheapest.supplier);
        if (cheapestSuppliers.length > 0) {
          supplierListContext += `**Best Price for ${product}:**\n`;
          supplierListContext += `- Supplier: ${cheapest.supplier}\n`;
          supplierListContext += `- Price: $${cheapest.price}/${cheapest.unit} (⭐ BEST PRICE)\n`;
          cheapestSuppliers.forEach((s) => {
            supplierListContext += `- Contact: ${s.email}\n`;
            if (s.contactUsers && s.contactUsers.length > 0) {
              s.contactUsers.forEach((u) => {
                supplierListContext += `  • ${u.name || 'Contact'}: ${u.email}\n`;
              });
            }
          });
          supplierListContext += '\n';
        }
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
      answer: `❌ No data found in system database for "${productList}".\n\nI cannot provide specific supplier names, prices, or contact information because there is no data in the system database.\n\nWould you like me to provide general educational information about construction materials instead? (This will NOT include specific supplier names or prices)\n\nPlease reply with "yes" to proceed with general information, or ask a different question about suppliers/products that exist in the system.`,
      requiresPermission: true,
      hasSystemData: false,
      systemDataSummary: systemDataSummary.trim() || 'No data found in system database.',
    };
  }

  // Build enhanced context with query analysis
  let context = '';
  
  // Add query analysis context for complex queries
  if (queryAnalysis.complexity === 'complex' || queryAnalysis.complexity === 'multi-step') {
    context += `**Query Analysis:**\n`;
    context += `- Intent: ${queryAnalysis.intent}\n`;
    context += `- Complexity: ${queryAnalysis.complexity}\n`;
    context += `- This is a ${queryAnalysis.complexity} query that may require ${queryAnalysis.requiresMultiStep ? 'multiple steps' : 'careful analysis'}.\n\n`;
  }
  
  // Add supplier list context if available
  if (supplierListContext) {
    context += supplierListContext;
  }
  
  if (supplierData.length > 0) {
    context += `**Current Supplier Prices from Database:**\n${formatSupplierData(supplierData)}\n\n`;
    
    // For comparison queries, add analysis
    if (queryAnalysis.intent === 'comparison' && supplierData.length > 1) {
      const uniqueSuppliers = [...new Set(supplierData.map(d => d.supplier))];
      const uniqueProducts = [...new Set(supplierData.map(d => d.product))];
      context += `**Comparison Summary:**\n`;
      context += `- Found ${uniqueSuppliers.length} supplier(s) for ${uniqueProducts.length} product(s)\n`;
      context += `- Suppliers: ${uniqueSuppliers.join(', ')}\n`;
      context += `- Products: ${uniqueProducts.join(', ')}\n\n`;
    }
  }
  
  if (calculationResult) {
    context += `**Calculation Results:**\n`;
    calculationResult.items.forEach((item) => {
      if (item.bestPrice) {
        context += `- ${item.productName}: ${item.quantity} ${item.bestPrice.unit} × $${item.bestPrice.price}/${item.bestPrice.unit} = $${item.total.toFixed(2)} (from ${item.bestPrice.supplier})\n`;
      } else {
        context += `- ${item.productName}: No price data available\n`;
      }
    });
    context += `**Grand Total: $${calculationResult.grandTotal.toFixed(2)}**\n\n`;
  }
  
  // Add comprehensive data summary for complex queries
  if (queryAnalysis.complexity === 'complex' || queryAnalysis.complexity === 'multi-step') {
    context += `**Available Data Summary:**\n`;
    context += `- Products found: ${products.length > 0 ? products.join(', ') : 'None specified'}\n`;
    context += `- Suppliers found: ${supplierData.length > 0 ? [...new Set(supplierData.map(d => d.supplier))].join(', ') : 'None'}\n`;
    context += `- Total price records: ${supplierData.length}\n`;
    if (mentionedSuppliers.length > 0) {
      context += `- Mentioned suppliers: ${mentionedSuppliers.join(', ')}\n`;
    }
    context += `\nUse this comprehensive data to provide a detailed, well-structured answer.\n\n`;
  }

  // Update system prompt to indicate if we're using generic data
  let additionalPromptContext = '';
  if (allowGenericAnswers && !hasSystemData) {
    additionalPromptContext = '\n\nCRITICAL: You are providing general information from your knowledge base because NO DATA was found in the system database. DO NOT make up specific supplier names, product names, or prices. Only provide general educational information about construction materials. NEVER invent supplier names like "Test Supplier Inc" or specific product prices. If asked about specific suppliers or products, clearly state that no data exists in the system database.';
  }

  // Get AI response with enhanced context and conversation history
  const answer = await askQSQuestion(question, supplierData, context + additionalPromptContext, conversationHistory);

  // Cache the response
  await setCachedResponse(question, answer, 60); // 1 minute cache

  return {
    answer,
    requiresPermission: false,
    hasSystemData,
    systemDataSummary: systemDataSummary.trim() || (hasSystemData ? 'Data found in system database.' : 'No data found in system database.'),
  };
}
