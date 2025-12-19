import { prisma } from '../utils/prisma';
import createError from 'http-errors';
import OpenAI from 'openai';

// Initialize OpenAI client (will be undefined if API key is not set)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface ProductMatch {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  type: 'product' | 'service';
  categoryName: string | null;
  supplierName: string;
  supplierId: string;
  unit: string;
  price: number | null;
  priceType: 'default' | 'private' | null;
  currency: string | null;
  relevanceScore?: number;
  reasoning?: string;
}

interface AIQuoteResponse {
  products: ProductMatch[];
  summary: string;
  reasoning: string;
  suggestions?: string[];
}

export class AIQuoteService {
  /**
   * Analyze user prompt and return matching products/services using LLM
   */
  async searchWithAI(prompt: string, companyId: string): Promise<AIQuoteResponse> {
    if (!openai) {
      throw createError(500, 'AI service is not configured. Please set OPENAI_API_KEY environment variable.');
    }

    // First, get all available products/services with prices
    const products = await this.getAllAvailableProducts(companyId);

    if (products.length === 0) {
      return {
        products: [],
        summary: 'No products or services are currently available in the system.',
        reasoning: 'The database does not contain any active products or services with pricing information.',
      };
    }

    // Prepare product data for LLM analysis
    const productData = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      sku: p.sku,
      type: p.type,
      category: p.categoryName || '',
      supplier: p.supplierName,
      unit: p.unit,
      price: p.price,
      currency: p.currency,
    }));

    try {
      // Use OpenAI to analyze the prompt and match products
      const systemPrompt = `You are an intelligent product matching assistant for a construction pricing platform. 
Your job is to analyze user requirements and match them with available products and services from the database.

Context: This platform connects construction companies with suppliers/service providers. Products can be physical materials or services (like plumbing, electrical work, etc.).

Rules:
1. Understand the user's requirement from their natural language prompt
2. Match products/services that are relevant to their needs
3. Consider product names, descriptions, categories, and suppliers
4. Be smart about synonyms and related terms (e.g., "concrete" matches "cement", "construction materials")
5. Return a JSON object with:
   - productIds: Array of product IDs that match (prioritize most relevant first, max 20)
   - summary: A brief 2-3 sentence summary of what the user is looking for in natural language
   - reasoning: Brief explanation (1-2 sentences) of why these products were selected
   - suggestions: Optional array of 1-3 suggestions for refining the search or alternative terms

Be precise and only include products that genuinely match the requirement. If no good matches, return an empty productIds array and explain why.`;

      const userPrompt = `User requirement: "${prompt}"

Available products and services:
${JSON.stringify(productData, null, 2)}

Analyze the requirement and return matching products in JSON format as specified.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent results
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from AI service');
      }

      const aiResponse = JSON.parse(responseContent);
      const matchedProductIds: string[] = aiResponse.productIds || [];
      const summary: string = aiResponse.summary || 'Products matched based on your requirements.';
      const reasoning: string = aiResponse.reasoning || 'Products were selected based on relevance to your query.';
      const suggestions: string[] = aiResponse.suggestions || [];

      // Get full product details for matched IDs
      const matchedProducts = products.filter(p => matchedProductIds.includes(p.id));

      // Sort by relevance (order from AI response)
      const sortedProducts = matchedProductIds
        .map(id => matchedProducts.find(p => p.id === id))
        .filter((p): p is ProductMatch => p !== undefined);

      return {
        products: sortedProducts,
        summary,
        reasoning,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (error: any) {
      console.error('AI Quote Service Error:', error);
      
      // Fallback to keyword-based search if AI fails
      return this.fallbackKeywordSearch(prompt, products, companyId);
    }
  }

  /**
   * Fallback keyword-based search if AI fails
   */
  private async fallbackKeywordSearch(
    prompt: string,
    products: ProductMatch[],
    companyId: string
  ): Promise<AIQuoteResponse> {
    const keywords = prompt.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    const matched = products.filter(product => {
      const searchableText = [
        product.name,
        product.description,
        product.sku,
        product.categoryName,
        product.supplierName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return keywords.some(keyword => searchableText.includes(keyword));
    });

    return {
      products: matched.slice(0, 20),
      summary: `Found ${matched.length} products matching keywords from your query.`,
      reasoning: 'Products matched using keyword search as fallback method.',
    };
  }

  /**
   * Get all available products/services with prices for a company
   */
  private async getAllAvailableProducts(companyId: string): Promise<ProductMatch[]> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        supplier: {
          isActive: true,
          type: { in: ['supplier', 'service_provider'] },
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        serviceCategory: {
          select: {
            name: true,
          },
        },
        defaultPrices: {
          where: {
            isActive: true,
            OR: [
              { effectiveUntil: null },
              { effectiveUntil: { gte: new Date() } },
            ],
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
        privatePrices: {
          where: {
            companyId,
            isActive: true,
            OR: [
              { effectiveUntil: null },
              { effectiveUntil: { gte: new Date() } },
            ],
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    return products.map(product => {
      // Get best available price (private price preferred, fallback to default)
      const privatePrice = product.privatePrices[0];
      const defaultPrice = product.defaultPrices[0];
      
      let finalPrice: number | null = null;
      let priceType: 'default' | 'private' | null = null;
      let currency: string | null = null;

      if (privatePrice) {
        priceType = 'private';
        currency = privatePrice.currency;
        // Calculate price: if discountPercentage exists, use it; otherwise use direct price
        if (privatePrice.discountPercentage !== null && defaultPrice) {
          const basePrice = Number(defaultPrice.price);
          const discount = Number(privatePrice.discountPercentage);
          finalPrice = basePrice * (1 - discount / 100);
        } else if (privatePrice.price !== null) {
          finalPrice = Number(privatePrice.price);
        }
      } else if (defaultPrice) {
        priceType = 'default';
        currency = defaultPrice.currency;
        finalPrice = Number(defaultPrice.price);
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        sku: product.sku,
        type: product.type,
        categoryName: product.category?.name || product.serviceCategory?.name || null,
        supplierName: product.supplier.name,
        supplierId: product.supplier.id,
        unit: product.unit,
        price: finalPrice,
        priceType,
        currency,
      };
    })
    .filter(product => product.price !== null); // Only return products with prices
  }
}

export const aiQuoteService = new AIQuoteService();
