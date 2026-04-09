/**
 * RFQ Generator Service
 * Generates professional RFQ (Request for Quotation) messages using OpenAI.
 * Produces both an email-ready version and a concise WhatsApp version.
 */

import OpenAI from 'openai';
import type { ProcurementIntent } from './procurementNLPService';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RfqDraft {
  subject: string;
  emailBody: string;
  whatsappBody: string;
}

const DEFAULT_COMPANY_NAME = process.env.COMPANY_NAME || 'ConstructionGuru';
const DEFAULT_CONTACT_EMAIL = process.env.EMAIL_FROM || 'procurement@constructionguru.com';

export async function generateRfqDraft(
  intent: ProcurementIntent,
  companyName: string = DEFAULT_COMPANY_NAME,
  contactEmail: string = DEFAULT_CONTACT_EMAIL
): Promise<RfqDraft> {
  if (!process.env.OPENAI_API_KEY) {
    return generateFallbackRfq(intent, companyName, contactEmail);
  }

  const constraintLines: string[] = [];
  const c = intent.constraints;
  if (c.quantity && c.quantityUnit) constraintLines.push(`- Required quantity: ${c.quantity} ${c.quantityUnit}`);
  if (c.maxPricePerUnit) constraintLines.push(`- Target price: ≤ ${c.currency ?? 'SGD'} ${c.maxPricePerUnit} per ${c.quantityUnit ?? 'unit'}`);
  if (c.deliveryByDate) constraintLines.push(`- Required delivery by: ${c.deliveryByDate}`);
  if (c.deliveryDays) constraintLines.push(`- Maximum lead time: ${c.deliveryDays} days`);
  if (c.certifications?.length) constraintLines.push(`- Required certifications: ${c.certifications.join(', ')}`);
  if (c.notes) constraintLines.push(`- Additional notes: ${c.notes}`);

  const constraintText = constraintLines.length
    ? `\n\nRequirements:\n${constraintLines.join('\n')}`
    : '';

  const systemPrompt = `You are a professional procurement specialist writing RFQ (Request for Quotation) messages for a construction company in Singapore. 
Write formal, concise, and professional messages. Always include a clear call to action asking for a quotation.
Return a JSON object with keys: subject (string), emailBody (string, formal multi-paragraph email), whatsappBody (string, concise 3-5 line WhatsApp message).`;

  const userPrompt = `Generate an RFQ for the following procurement request:

Product/Service: ${intent.product}
Location: ${intent.location || 'Singapore'}${constraintText}

Requesting company: ${companyName}
Reply-to email: ${contactEmail}

The email body should be formal and include:
1. Introduction of the company
2. Description of what is needed
3. All constraints/requirements
4. Request for quotation with price, availability, delivery timeline, and payment terms
5. Deadline for response (suggest 5 business days from today)
6. Contact information

The WhatsApp message should be brief and friendly, covering the key request in 3-5 lines.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return generateFallbackRfq(intent, companyName, contactEmail);

    const parsed = JSON.parse(content);
    return {
      subject: parsed.subject || `RFQ: ${intent.product} - ${companyName}`,
      emailBody: parsed.emailBody || parsed.email_body || '',
      whatsappBody: parsed.whatsappBody || parsed.whatsapp_body || '',
    };
  } catch (err) {
    console.error('[RFQGenerator] OpenAI generation failed:', err);
    return generateFallbackRfq(intent, companyName, contactEmail);
  }
}

function generateFallbackRfq(
  intent: ProcurementIntent,
  companyName: string,
  contactEmail: string
): RfqDraft {
  const c = intent.constraints;
  const today = new Date();
  const deadline = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
  const deadlineStr = deadline.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const qtyLine = c.quantity && c.quantityUnit
    ? `\n- Required quantity: ${c.quantity} ${c.quantityUnit}`
    : '';
  const priceLine = c.maxPricePerUnit
    ? `\n- Target price: ≤ ${c.currency ?? 'SGD'} ${c.maxPricePerUnit} per ${c.quantityUnit ?? 'unit'}`
    : '';
  const deliveryLine = c.deliveryByDate
    ? `\n- Required delivery by: ${c.deliveryByDate}`
    : c.deliveryDays
    ? `\n- Maximum lead time: ${c.deliveryDays} days`
    : '';

  const subject = `RFQ: ${intent.product} Supply – ${companyName}`;

  const emailBody = `Dear Sir/Madam,

We are writing on behalf of ${companyName} to request a formal quotation for the supply of the following:

Product/Material: ${intent.product}
Delivery Location: ${intent.location || 'Singapore'}${qtyLine}${priceLine}${deliveryLine}

We kindly request you to provide us with your best quotation including:
1. Unit price (${c.currency ?? 'SGD'} per ${c.quantityUnit ?? 'unit'})
2. Stock availability and lead time
3. Delivery terms and conditions
4. Payment terms
5. Validity period of the quotation

Please submit your quotation by ${deadlineStr}.

For any clarifications, please contact us at ${contactEmail}.

We look forward to your prompt response and the possibility of establishing a mutually beneficial business relationship.

Best regards,
Procurement Team
${companyName}
${contactEmail}`;

  const whatsappBody = `Hi, I'm from ${companyName}. We're looking to source *${intent.product}*${intent.location ? ` in ${intent.location}` : ''}${c.quantity ? ` (${c.quantity} ${c.quantityUnit ?? 'units'})` : ''}${c.maxPricePerUnit ? `, budget ≤ ${c.currency ?? 'SGD'}${c.maxPricePerUnit}/${c.quantityUnit ?? 'unit'}` : ''}. Could you please send us your best quotation including price, availability, and delivery timeline? Thank you!`;

  return { subject, emailBody, whatsappBody };
}
