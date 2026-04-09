/**
 * RFQ Response Parser Service
 * Parses unstructured supplier reply text (email body / WhatsApp message)
 * into a structured QuotationResponse using OpenAI function-calling.
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedQuotation {
  unitPrice?: number;
  currency?: string;
  unit?: string;
  availability?: string;
  deliveryDays?: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  validUntil?: string;
  notes?: string;
  confidence: number;
  isQuotation: boolean;
}

const parseFunction = {
  type: 'function',
  function: {
    name: 'parse_supplier_quotation',
    description:
      'Extract structured quotation data from a supplier reply message. ' +
      'Set isQuotation=false if the message does not contain pricing or quotation information.',
    parameters: {
      type: 'object',
      properties: {
        isQuotation: {
          type: 'boolean',
          description: 'True if the message contains a price quote or quotation information',
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-1 for the extraction accuracy',
        },
        unitPrice: {
          type: 'number',
          description: 'Price per unit (numeric value only)',
        },
        currency: {
          type: 'string',
          description: 'Currency code (SGD, USD, MYR, etc.)',
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement (m3, tonne, kg, pcs, etc.)',
        },
        availability: {
          type: 'string',
          description: 'Stock availability description (e.g. "In stock", "2 weeks lead time")',
        },
        deliveryDays: {
          type: 'number',
          description: 'Delivery lead time in days',
        },
        deliveryTerms: {
          type: 'string',
          description: 'Delivery terms (e.g. "FOB Singapore", "Delivered to site")',
        },
        paymentTerms: {
          type: 'string',
          description: 'Payment terms (e.g. "30 days net", "50% upfront")',
        },
        validUntil: {
          type: 'string',
          description: 'Quote validity date in ISO format (YYYY-MM-DD)',
        },
        notes: {
          type: 'string',
          description: 'Any additional notes or conditions from the supplier',
        },
      },
      required: ['isQuotation', 'confidence'],
    },
  },
};

export async function parseSupplierReply(
  replyText: string,
  productContext?: string
): Promise<ParsedQuotation> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackParse(replyText);
  }

  const systemPrompt = `You are an expert procurement analyst specializing in construction materials in Singapore. 
Extract structured quotation data from supplier reply messages. 
Be precise about prices, units, and delivery terms. 
Handle various formats: formal emails, WhatsApp messages, and informal replies.`;

  const userPrompt = productContext
    ? `Context: We requested a quotation for "${productContext}".\n\nSupplier reply:\n${replyText}`
    : `Supplier reply:\n${replyText}`;

  try {
    const createParams: any = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools: [parseFunction],
      tool_choice: { type: 'function', function: { name: 'parse_supplier_quotation' } },
      temperature: 0.1,
    };
    const completion = await openai.chat.completions.create(createParams);

    const msg = completion.choices[0]?.message as any;
    const toolCall = msg?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return fallbackParse(replyText);
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return {
      isQuotation: parsed.isQuotation ?? false,
      confidence: parsed.confidence ?? 0.5,
      unitPrice: parsed.unitPrice,
      currency: parsed.currency ?? 'SGD',
      unit: parsed.unit,
      availability: parsed.availability,
      deliveryDays: parsed.deliveryDays,
      deliveryTerms: parsed.deliveryTerms,
      paymentTerms: parsed.paymentTerms,
      validUntil: parsed.validUntil,
      notes: parsed.notes,
    };
  } catch (err) {
    console.error('[RFQResponseParser] OpenAI parsing failed:', err);
    return fallbackParse(replyText);
  }
}

function fallbackParse(text: string): ParsedQuotation {
  const lower = text.toLowerCase();

  // Detect if it looks like a quotation
  const isQuotation =
    /\b(price|quote|quotation|sgd|usd|\$|per\s+\w+|delivery|available|lead\s+time|payment)\b/.test(lower);

  if (!isQuotation) {
    return { isQuotation: false, confidence: 0.3 };
  }

  // Price extraction: $120/m3, SGD 120 per m3, 120 SGD/tonne
  const priceMatch =
    text.match(/(?:SGD|USD|MYR|\$)\s*([\d,]+(?:\.\d+)?)\s*(?:\/|\s+per\s+)(\w+)/i) ||
    text.match(/([\d,]+(?:\.\d+)?)\s*(?:SGD|USD|MYR)\s*(?:\/|\s+per\s+)(\w+)/i) ||
    text.match(/\$\s*([\d,]+(?:\.\d+)?)/);

  const unitPrice = priceMatch
    ? parseFloat(priceMatch[1].replace(',', ''))
    : undefined;

  const unitMatch = text.match(/per\s+(m3|m²|m2|tonne|kg|pcs?|unit|bag|roll|sheet|litre|liter)/i);
  const deliveryMatch = lower.match(/(\d+)\s*(?:working\s+)?(?:business\s+)?days?\s*(?:delivery|lead|time)/);
  const currencyMatch = text.match(/\b(SGD|USD|MYR|AUD|GBP)\b/i);

  return {
    isQuotation: true,
    confidence: 0.5,
    unitPrice,
    currency: currencyMatch?.[1]?.toUpperCase() ?? 'SGD',
    unit: unitMatch?.[1],
    deliveryDays: deliveryMatch ? parseInt(deliveryMatch[1]) : undefined,
  };
}

/**
 * Batch parse multiple supplier replies and return structured results.
 */
export async function batchParseReplies(
  replies: Array<{ id: string; text: string; productContext?: string }>
): Promise<Array<{ id: string; quotation: ParsedQuotation }>> {
  const results = await Promise.allSettled(
    replies.map((r) => parseSupplierReply(r.text, r.productContext))
  );

  return replies.map((r, i) => ({
    id: r.id,
    quotation:
      results[i].status === 'fulfilled'
        ? (results[i] as PromiseFulfilledResult<ParsedQuotation>).value
        : { isQuotation: false, confidence: 0 },
  }));
}
