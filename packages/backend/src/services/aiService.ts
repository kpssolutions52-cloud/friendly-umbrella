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
 */
function formatSupplierData(supplierData: SupplierData[]): string {
  if (!supplierData || supplierData.length === 0) {
    return 'No supplier data available.';
  }

  return supplierData
    .map(
      (item) =>
        `- ${item.supplier}: ${item.product} - $${item.price}/${item.unit}`
    )
    .join('\n');
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

`;

  if (supplierData && supplierData.length > 0) {
    systemPrompt += `Current supplier prices:
${formatSupplierData(supplierData)}

Always include these real supplier prices in your answer when relevant. Highlight the best price.`;
  } else {
    systemPrompt += `You can provide general information about construction materials and pricing, but note that real-time supplier prices are not currently available.`;
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
      maxTokens: 1500,
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
 * Main function to process QS question with caching and enhanced data retrieval
 */
export async function processQSQuestion(question: string): Promise<string> {
  // Check cache first
  const cached = await getCachedResponse(question);
  if (cached) {
    return cached;
  }

  // Extract products and quantities
  const products = extractProductsFromQuestion(question);
  const quantities = extractQuantities(question);
  
  let supplierData: SupplierData[] = [];
  let calculationResult = null;

  // Handle calculation queries
  if (isCalculationQuery(question) && quantities.length > 0) {
    const items = quantities.map((q) => ({
      productName: q.product,
      quantity: q.quantity,
    }));
    
    calculationResult = await calculateTotalCost(items);
    supplierData = calculationResult.items
      .filter((item) => item.bestPrice)
      .map((item) => ({
        supplier: item.bestPrice!.supplier,
        product: item.productName,
        price: item.bestPrice!.price,
        unit: item.bestPrice!.unit,
      }));
  } else if (isPriceQuery(question) && products.length > 0) {
    // Get supplier data for price queries
    for (const product of products) {
      const prices = await getSupplierPrices(product);
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

  // Build enhanced context
  let context = '';
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

  // Get AI response with enhanced context
  const answer = await askQSQuestion(question, supplierData, context);

  // Cache the response
  await setCachedResponse(question, answer, 60); // 1 minute cache

  return answer;
}
