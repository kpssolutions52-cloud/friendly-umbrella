/**
 * AI Service for QS Assistant
 * Integrates with OpenAI/Claude to provide AI-powered answers with real supplier data
 */

import OpenAI from 'openai';
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
 * Get supplier data for products
 */
export async function getSupplierData(
  productNames: string[]
): Promise<SupplierData[]> {
  if (!productNames || productNames.length === 0) {
    return [];
  }

  // Search for products by name (simple contains search)
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: productNames[0],
        mode: 'insensitive',
      },
    },
    include: {
      supplier: true,
    },
    orderBy: {
      price: 'asc', // Best price first
    },
    take: 10, // Top 10 suppliers
  });

  return products.map((p) => ({
    supplier: p.supplier.name,
    product: p.name,
    price: Number(p.price),
    unit: p.unit,
  }));
}

/**
 * Ask AI question with supplier data context
 */
export async function askQSQuestion(
  question: string,
  supplierData?: SupplierData[]
): Promise<string> {
  const systemPrompt = `You are a helpful Quantity Surveyor assistant. 
You help QS professionals with construction pricing, material specifications, 
and cost calculations.

${supplierData && supplierData.length > 0
    ? `Current supplier prices:
${formatSupplierData(supplierData)}

Always include these real supplier prices in your answer when relevant.`
    : 'You can provide general information about construction materials and pricing, but note that real-time supplier prices are not currently available.'}

Be concise, helpful, and always prioritize real supplier data when available.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || 'I apologize, I could not generate a response.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get AI response. Please try again.');
  }
}

/**
 * Main function to process QS question
 */
export async function processQSQuestion(question: string): Promise<string> {
  // Extract products if price-related
  let supplierData: SupplierData[] = [];
  
  if (isPriceQuery(question)) {
    const products = extractProductsFromQuestion(question);
    if (products.length > 0) {
      supplierData = await getSupplierData(products);
    }
  }

  // Get AI response
  const answer = await askQSQuestion(question, supplierData);
  return answer;
}
