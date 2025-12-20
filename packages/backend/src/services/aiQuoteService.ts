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
  supplierEmail?: string | null;
  supplierPhone?: string | null;
  supplierAddress?: string | null;
  supplierLogoUrl?: string | null;
  unit: string;
  price: number | null;
  priceType: 'default' | 'private' | null;
  currency: string | null;
  metadata?: any; // Enriched metadata for advanced analysis
  relevanceScore?: number;
  reasoning?: string;
}

interface ProjectInsights {
  projectType?: string;
  estimatedScope?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  timeline?: string;
  budgetConsiderations?: string[];
  requiredExpertise?: string[];
}

interface CostEstimate {
  estimatedRange?: {
    min: number;
    max: number;
    currency: string;
    confidence: 'low' | 'medium' | 'high';
  };
  costBreakdown?: Array<{
    category: string;
    estimatedCost: number;
    currency: string;
    notes?: string;
  }>;
  costSavingTips?: string[];
}

interface MarketInsights {
  priceTrends?: string;
  supplierRecommendations?: string;
  marketAvailability?: string;
  qualityConsiderations?: string[];
}

interface AIQuoteResponse {
  products: ProductMatch[];
  summary: string;
  reasoning: string;
  suggestions?: string[];
  // Enhanced insights
  projectInsights?: ProjectInsights;
  costEstimate?: CostEstimate;
  marketInsights?: MarketInsights;
  bestPractices?: string[];
  riskConsiderations?: string[];
}

export class AIQuoteService {
  /**
   * Analyze user prompt and return matching products/services using LLM
   * @param prompt - User's search query
   * @param tenantId - Optional tenant ID (company for companies, null for guests/suppliers)
   * @param tenantType - Type of tenant making the request
   */
  async searchWithAI(prompt: string, tenantId: string | null = null, tenantType: 'company' | 'supplier' | 'service_provider' | 'guest' = 'guest'): Promise<AIQuoteResponse> {
    if (!openai) {
      throw createError(500, 'AI service is not configured. Please set OPENAI_API_KEY environment variable.');
    }

    // First, get all available products/services with prices
    let products: ProductMatch[];
    try {
      products = await this.getAllAvailableProducts(tenantId, tenantType);
    } catch (error: any) {
      console.error('Error fetching products for AI search:', error);
      // Return empty result if we can't fetch products
      return {
        products: [],
        summary: 'Unable to search products at this time. Please try again later.',
        reasoning: 'An error occurred while fetching products from the database.',
      };
    }

    if (products.length === 0) {
      return {
        products: [],
        summary: 'No products or services are currently available in the system.',
        reasoning: 'The database does not contain any active products or services with pricing information.',
      };
    }

    // Gather statistics and metadata about available products/services
    const categories = [...new Set(products.map(p => p.categoryName).filter(Boolean))];
    const suppliers = [...new Set(products.map(p => p.supplierName))];
    const productTypes = products.filter(p => p.type === 'product').length;
    const serviceTypes = products.filter(p => p.type === 'service').length;
    // Only include items with prices for price range calculation
    const prices = products.filter(p => p.price !== null).map(p => p.price!);
    const currencies = [...new Set(products.filter(p => p.currency).map(p => p.currency!))];
    const primaryCurrency = currencies.length > 0 ? currencies[0] : 'USD';
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      currency: primaryCurrency,
    } : null;

    // Prepare enriched product data for LLM analysis
    // Include metadata if available for advanced analysis
    const productData = products.map(p => {
      const baseData: any = {
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
        priceType: p.priceType, // Include price type (default/private)
      };

      // Include metadata if available (specifications, availability, usage, etc.)
      // This enables advanced matching based on technical specs, location, lead times, etc.
      if (p.metadata && typeof p.metadata === 'object') {
        const metadata = p.metadata as Record<string, any>;
        
        // Include specifications for technical matching
        if (metadata.specifications) {
          baseData.specifications = metadata.specifications;
        }
        
        // Include availability and lead times
        if (metadata.availability) {
          baseData.availability = metadata.availability;
        }
        
        // Include usage context and applications
        if (metadata.usage) {
          baseData.usage = metadata.usage;
        }
        
        // Include quality ratings
        if (metadata.quality) {
          baseData.quality = metadata.quality;
        }
        
        // Include location/geographic data
        if (metadata.location || metadata.availability?.warehouseLocations) {
          baseData.location = metadata.location || { warehouseLocations: metadata.availability?.warehouseLocations };
        }
        
        // Include pricing tiers for bulk analysis
        if (metadata.pricingTiers || metadata.pricing) {
          baseData.pricing = metadata.pricingTiers || metadata.pricing;
        }
        
        // Include relationships for alternative/compatible suggestions
        if (metadata.relationships) {
          baseData.relationships = metadata.relationships;
        }
        
        // Include technical requirements
        if (metadata.technical) {
          baseData.technical = metadata.technical;
        }
        
        // Include environmental data
        if (metadata.environmental) {
          baseData.environmental = metadata.environmental;
        }
      }

      return baseData;
    });

    // Build context summary
    const contextSummary = {
      totalProducts: products.length,
      productsCount: productTypes,
      servicesCount: serviceTypes,
      categoriesCount: categories.length,
      categories: categories.slice(0, 20), // Limit to first 20 categories
      suppliersCount: suppliers.length,
      suppliers: suppliers.slice(0, 20), // Limit to first 20 suppliers
      priceRange: priceRange,
    };

    try {
      // Enhanced system prompt with deep analysis capabilities
      const systemPrompt = `You are an expert AI assistant for a construction pricing platform called ConstructionGuru.
Your expertise includes construction materials, building services, project planning, cost estimation, supplier relationships, and construction industry best practices.

PLATFORM CONTEXT:
- This platform connects construction companies with suppliers and service providers
- Products: Physical materials (concrete, steel, lumber, tiles, pipes, electrical components, etc.)
- Services: Professional services (plumbing, electrical work, HVAC installation, roofing, painting, etc.)
- Companies can get quotes and compare prices from multiple suppliers
- Private pricing may be available for specific companies

YOUR CAPABILITIES:
1. Deeply analyze user prompts to understand project requirements, scope, and context
2. Match user requirements with relevant products/services from the database
3. Provide project insights: identify project type, scope, complexity, timeline considerations
4. Estimate costs: provide rough cost estimates based on industry knowledge and available pricing
5. Market insights: analyze price trends, supplier recommendations, market availability
6. Best practices: suggest industry best practices and recommendations
7. Risk considerations: identify potential risks or issues to consider
8. Understand construction industry terminology, synonyms, and related concepts

ANALYSIS DEPTH:
- Extract project details: project type (residential, commercial, industrial), scale, location hints
- Identify complexity: simple (single item), moderate (multiple related items), complex (full project)
- Estimate timeline: consider project duration based on scope
- Budget analysis: identify budget considerations, cost-saving opportunities
- Required expertise: identify what skills/services might be needed

COST ESTIMATION:
- Use available product prices to estimate total project costs when quantities are mentioned
- Provide cost ranges with confidence levels (high: specific quantities, medium: estimated quantities, low: vague requirements)
- Break down costs by category when multiple items are involved
- Suggest cost-saving tips based on industry knowledge

MARKET INSIGHTS:
- Analyze price competitiveness based on available supplier prices
- Recommend suppliers based on price, availability, or specialization
- Note market availability and lead times if relevant
- Consider quality vs. price trade-offs

RESPONSE FORMAT:
Return a JSON object with:
- productIds: Array of product IDs that match (prioritize most relevant first, max 20)
- summary: A natural, conversational 2-3 sentence summary of what the user needs, written as if you're a helpful construction expert
- reasoning: Clear explanation (2-3 sentences) of why these specific products/services were selected, mentioning key matching criteria
- suggestions: Optional array of 1-3 helpful suggestions
- projectInsights: Object with:
  * projectType: Type of project identified (e.g., "residential renovation", "commercial construction")
  * estimatedScope: Brief description of project scope
  * complexity: "simple", "moderate", or "complex"
  * timeline: Estimated timeline considerations
  * budgetConsiderations: Array of budget-related insights
  * requiredExpertise: Array of skills/services that might be needed
- costEstimate: Object with:
  * estimatedRange: {min, max, currency, confidence} - if quantities can be estimated
  * costBreakdown: Array of {category, estimatedCost, currency, notes} - for multi-item projects
  * costSavingTips: Array of cost-saving recommendations
- marketInsights: Object with:
  * priceTrends: Brief note on price competitiveness
  * supplierRecommendations: Recommendations on supplier selection
  * marketAvailability: Notes on availability/lead times
  * qualityConsiderations: Array of quality-related insights
- bestPractices: Array of industry best practices relevant to this project
- riskConsiderations: Array of potential risks or issues to consider

QUALITY STANDARDS:
- Be precise: Only include products that genuinely match the requirement
- Be insightful: Provide deep analysis even when exact matches aren't found
- Be helpful: Provide actionable recommendations and considerations
- Be realistic: Don't overestimate capabilities, acknowledge when information is limited`;

      const userPrompt = `DATABASE SUMMARY:
Total items: ${contextSummary.totalProducts} (${contextSummary.productsCount} products, ${contextSummary.servicesCount} services)
Categories available: ${contextSummary.categoriesCount} (${contextSummary.categories.slice(0, 10).join(', ')}${contextSummary.categories.length > 10 ? '...' : ''})
Suppliers/Providers: ${contextSummary.suppliersCount}
${priceRange ? `Price range: ${priceRange.currency || 'USD'} ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)} (avg: ${priceRange.avg.toFixed(2)})` : 'Pricing varies'}

USER REQUIREMENT: "${prompt}"

AVAILABLE PRODUCTS AND SERVICES (${products.length} items):
${JSON.stringify(productData, null, 2)}

TASK: Analyze the user's requirement and match it with the most relevant products/services from the database.
Consider synonyms, related terms, and construction industry context.
Return your analysis in the specified JSON format.`;

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

      // Try to parse JSON response, fallback to keyword search if parsing fails
      let aiResponse: any;
      try {
        aiResponse = JSON.parse(responseContent);
      } catch (parseError: any) {
        // Invalid JSON response - fallback to keyword search
        console.warn('AI Quote Service: Invalid JSON response from AI, falling back to keyword search:', parseError.message);
        return this.fallbackKeywordSearch(prompt, products);
      }

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

      // Extract enhanced insights
      const projectInsights: ProjectInsights | undefined = aiResponse.projectInsights || undefined;
      const costEstimate: CostEstimate | undefined = aiResponse.costEstimate || undefined;
      const marketInsights: MarketInsights | undefined = aiResponse.marketInsights || undefined;
      const bestPractices: string[] | undefined = aiResponse.bestPractices || undefined;
      const riskConsiderations: string[] | undefined = aiResponse.riskConsiderations || undefined;

      return {
        products: sortedProducts,
        summary,
        reasoning,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        projectInsights,
        costEstimate,
        marketInsights,
        bestPractices: bestPractices && bestPractices.length > 0 ? bestPractices : undefined,
        riskConsiderations: riskConsiderations && riskConsiderations.length > 0 ? riskConsiderations : undefined,
      };
    } catch (error: any) {
      // Log error but don't throw - fallback to keyword search
      console.warn('AI Quote Service Error, falling back to keyword search:', error.message);
      
      // Fallback to keyword-based search if AI fails
      return this.fallbackKeywordSearch(prompt, products);
    }
  }

  /**
   * Fallback keyword-based search if AI fails
   */
  private async fallbackKeywordSearch(
    prompt: string,
    products: ProductMatch[]
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
   * Get all available products/services with prices
   * @param tenantId - Optional tenant ID (company for companies, null for guests/suppliers)
   * @param tenantType - Type of tenant requesting products
   */
  private async getAllAvailableProducts(tenantId: string | null, tenantType: 'company' | 'supplier' | 'service_provider' | 'guest' = 'guest'): Promise<ProductMatch[]> {
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
            email: true,
            phone: true,
            address: true,
            logoUrl: true,
            metadata: true, // Include supplier metadata for location, performance, etc.
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
        ...(tenantId && tenantType === 'company' ? {
          privatePrices: {
            where: {
              companyId: tenantId,
              isActive: true,
              OR: [
                { effectiveUntil: null },
                { effectiveUntil: { gte: new Date() } },
              ],
            },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        } : {}),
      },
    });

    return products.map(product => {
      // Get best available price (private price preferred for companies, fallback to default)
      const privatePrice = (tenantId && tenantType === 'company' && 'privatePrices' in product && product.privatePrices) ? product.privatePrices[0] : undefined;
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
        supplierEmail: product.supplier.email || null,
        supplierPhone: product.supplier.phone || null,
        supplierAddress: product.supplier.address || null,
        supplierLogoUrl: product.supplier.logoUrl || null,
        unit: product.unit,
        price: finalPrice,
        priceType,
        currency,
        metadata: product.metadata, // Include metadata for enriched analysis
      };
    });
    // Include all products/services, even without prices
    // Services especially may not have prices configured yet but should still be searchable
  }
}

export const aiQuoteService = new AIQuoteService();
