/**
 * Procurement NLP Service
 * Parses QS natural language prompts into structured procurement intent
 * using OpenAI function-calling.
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProcurementConstraints {
  maxPricePerUnit?: number;
  currency?: string;
  quantity?: number;
  quantityUnit?: string;
  deliveryByDate?: string;
  deliveryDays?: number;
  certifications?: string[];
  notes?: string;
}

export interface ProcurementIntent {
  product: string;
  productCategory?: string;
  location?: string;
  constraints: ProcurementConstraints;
  supplierCount?: number;
  isProcurementIntent: boolean;
  confidence: number;
}

const extractionFunction = {
  type: 'function',
  function: {
    name: 'extract_procurement_intent',
    description:
      'Extract structured procurement intent from a QS (Quantity Surveyor) natural language request. ' +
      'Return isProcurementIntent=false if the message is not a procurement/sourcing request.',
    parameters: {
      type: 'object',
      properties: {
        isProcurementIntent: {
          type: 'boolean',
          description: 'True if the message is a procurement or supplier-sourcing request',
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-1 that this is a procurement intent',
        },
        product: {
          type: 'string',
          description: 'The product or material being sourced (e.g. "ready-mix concrete", "steel rebar")',
        },
        productCategory: {
          type: 'string',
          description: 'Broad category (e.g. "concrete", "steel", "electrical", "plumbing")',
        },
        location: {
          type: 'string',
          description: 'Geographic location or market (e.g. "Singapore", "Jurong", "Central Region")',
        },
        supplierCount: {
          type: 'number',
          description: 'How many suppliers the user wants to contact (default 5 if not specified)',
        },
        constraints: {
          type: 'object',
          description: 'Constraints and requirements',
          properties: {
            maxPricePerUnit: {
              type: 'number',
              description: 'Maximum acceptable price per unit',
            },
            currency: {
              type: 'string',
              description: 'Currency code (SGD, USD, etc.)',
            },
            quantity: {
              type: 'number',
              description: 'Required quantity',
            },
            quantityUnit: {
              type: 'string',
              description: 'Unit of quantity (m3, tonnes, kg, etc.)',
            },
            deliveryByDate: {
              type: 'string',
              description: 'Required delivery date (ISO format if possible)',
            },
            deliveryDays: {
              type: 'number',
              description: 'Maximum acceptable delivery lead time in days',
            },
            certifications: {
              type: 'array',
              items: { type: 'string' },
              description: 'Required certifications (e.g. ["BCA", "ISO 9001"])',
            },
            notes: {
              type: 'string',
              description: 'Any other requirements or notes',
            },
          },
        },
      },
      required: ['isProcurementIntent', 'confidence', 'product'],
    },
  },
};

export async function extractProcurementIntent(
  prompt: string
): Promise<ProcurementIntent> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackExtract(prompt);
  }

  try {
    const createParams: any = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a procurement assistant for a construction platform in Singapore. ' +
            'Extract structured procurement intent from QS (Quantity Surveyor) messages. ' +
            'Be precise about product names, quantities, prices, and locations.',
        },
        { role: 'user', content: prompt },
      ],
      tools: [extractionFunction],
      tool_choice: { type: 'function', function: { name: 'extract_procurement_intent' } },
      temperature: 0.1,
    };
    const completion = await openai.chat.completions.create(createParams);

    const msg = completion.choices[0]?.message as any;
    const toolCall = msg?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return fallbackExtract(prompt);
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return {
      isProcurementIntent: parsed.isProcurementIntent ?? true,
      confidence: parsed.confidence ?? 0.8,
      product: parsed.product ?? extractProductFallback(prompt),
      productCategory: parsed.productCategory,
      location: parsed.location,
      supplierCount: parsed.supplierCount ?? 5,
      constraints: {
        maxPricePerUnit: parsed.constraints?.maxPricePerUnit,
        currency: parsed.constraints?.currency ?? 'SGD',
        quantity: parsed.constraints?.quantity,
        quantityUnit: parsed.constraints?.quantityUnit,
        deliveryByDate: parsed.constraints?.deliveryByDate,
        deliveryDays: parsed.constraints?.deliveryDays,
        certifications: parsed.constraints?.certifications,
        notes: parsed.constraints?.notes,
      },
    };
  } catch (err) {
    console.error('[ProcurementNLP] OpenAI extraction failed:', err);
    return fallbackExtract(prompt);
  }
}

function extractProductFallback(prompt: string): string {
  const lower = prompt.toLowerCase();
  const patterns = [
    /(?:for|supply|source|find|get)\s+([a-z\s\-]+?)(?:\s+under|\s+at|\s+in|\s+from|$)/i,
    /(?:suppliers?|vendors?)\s+(?:for|of)\s+([a-z\s\-]+?)(?:\s+under|\s+at|\s+in|$)/i,
  ];
  for (const p of patterns) {
    const m = lower.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return prompt.slice(0, 80);
}

function fallbackExtract(prompt: string): ProcurementIntent {
  const lower = prompt.toLowerCase();
  const isProcurement =
    /\b(supplier|vendor|rfq|quote|quotation|source|procure|buy|purchase|find.*supplier|ready.mix|concrete|steel|rebar|timber|tiles|paint|pipe|cable|cement)\b/.test(
      lower
    );

  const priceMatch = lower.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(?:\/|per)\s*(\w+)/);
  const qtyMatch = lower.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(m3|m²|m2|tonnes?|kg|pcs?|units?|bags?)/i);
  const countMatch = lower.match(/(\d+)\s+suppliers?/i);
  const locationMatch = lower.match(/\b(singapore|jurong|tampines|woodlands|ang mo kio|central|east|west|north|south)\b/i);

  return {
    isProcurementIntent: isProcurement,
    confidence: isProcurement ? 0.6 : 0.2,
    product: extractProductFallback(prompt),
    location: locationMatch?.[1],
    supplierCount: countMatch ? parseInt(countMatch[1]) : 5,
    constraints: {
      maxPricePerUnit: priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : undefined,
      currency: 'SGD',
      quantity: qtyMatch ? parseFloat(qtyMatch[1].replace(',', '')) : undefined,
      quantityUnit: qtyMatch?.[2],
    },
  };
}
