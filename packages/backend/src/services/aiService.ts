/**
 * AI Service for QS Assistant.
 * Supplier Hub-focused implementation (Products/RFQ logic removed).
 */

import OpenAI from 'openai';
import { getCachedResponse, setCachedResponse } from './cacheService';
import { fetchSupplierHubForAiContext } from './supplierHubService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QSQuestionResponse {
  answer: string;
  requiresPermission?: boolean;
  hasSystemData?: boolean;
  systemDataSummary?: string;
}

function formatSupplierHubDirectoryContext(
  entries: Array<{
    companyName: string;
    category: string | null;
    trade: string | null;
    remark: string | null;
    address: string | null;
    status: string;
    contacts: Array<{
      contactName: string | null;
      phone: string | null;
      email: string | null;
      whatsappNumber: string | null;
      isPrimary: boolean;
    }>;
  }>
): string {
  if (entries.length === 0) return '';

  let s =
    '### Supplier Intelligence Hub (organization directory — includes Excel-imported supplier rows)\n';
  entries.forEach((e, i) => {
    const primary = e.contacts.find((c) => c.isPrimary) ?? e.contacts[0];
    s += `${i + 1}. **${e.companyName}**`;
    if (e.category) s += ` · Category: ${e.category}`;
    if (e.trade) s += ` · Trade: ${e.trade}`;
    s += ` · Status: ${e.status}\n`;
    if (e.address) s += `   Address: ${e.address}\n`;
    if (e.remark) s += `   Remarks: ${e.remark}\n`;
    if (primary) {
      const parts = [
        primary.contactName ? `Name: ${primary.contactName}` : null,
        primary.phone ? `Phone: ${primary.phone}` : null,
        primary.email ? `Email: ${primary.email}` : null,
        primary.whatsappNumber ? `WhatsApp: ${primary.whatsappNumber}` : null,
      ].filter(Boolean);
      if (parts.length) s += `   ${parts.join(' | ')}\n`;
    }
    s += '\n';
  });
  return s;
}

async function askQSQuestion(
  question: string,
  context: string,
  conversationHistory?: ConversationMessage[]
): Promise<string> {
  let systemPrompt = `You are an intelligent Quantity Surveyor assistant.

You answer strictly using system data provided in context, especially:
- Supplier company details
- Trades/categories
- Contact names, phone, email, WhatsApp
- Remarks imported from Excel

Rules:
- Do not invent suppliers or contact data.
- If data is missing, clearly say it is not found in the system database.
- Use conversation history to resolve follow-up references ("that supplier", "their contact", etc.).
- Be concise and actionable.`;

  if (context.trim()) {
    systemPrompt += `\n\n${context}`;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: question });

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.4,
    });
    return response.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
  } catch (error: any) {
    if (error?.status === 401) {
      throw new Error('OpenAI API key is invalid. Please check your configuration.');
    } else if (error?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error?.status === 500) {
      throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
    }
    throw new Error('Failed to get AI response. Please try again.');
  }
}

/**
 * Main function to process QS question using Supplier Intelligence Hub data.
 */
export async function processQSQuestion(
  question: string,
  allowGenericAnswers: boolean = false,
  conversationHistory?: ConversationMessage[],
  organizationId?: string | null
): Promise<QSQuestionResponse> {
  const cacheScopeKey = `hub::${organizationId ?? ''}::${question.trim()}`;

  // Skip cache for contextual conversation turns.
  if (!conversationHistory || conversationHistory.length === 0) {
    const cached = await getCachedResponse(cacheScopeKey);
    if (cached) {
      try {
        return JSON.parse(cached) as QSQuestionResponse;
      } catch {
        return { answer: cached, hasSystemData: false };
      }
    }
  }

  const hubResult = organizationId
    ? await fetchSupplierHubForAiContext(organizationId, question, { maxRows: 60 })
    : { entries: [], mode: 'empty' as const };

  const hasSystemData = hubResult.entries.length > 0;
  const systemDataSummary = hasSystemData
    ? `Supplier Intelligence Hub: ${hubResult.entries.length} entr${hubResult.entries.length === 1 ? 'y' : 'ies'} (${hubResult.mode === 'wide' ? 'directory snapshot' : 'matching keywords'}).`
    : 'No data found in system database.';

  if (!hasSystemData && !allowGenericAnswers) {
    return {
      answer:
        '❌ No data found in system database for this question.\n\nI can only answer from your system data. Would you like general information instead?\n\nReply with "yes" to proceed with general information.',
      requiresPermission: true,
      hasSystemData: false,
      systemDataSummary,
    };
  }

  const directoryContext = hasSystemData
    ? formatSupplierHubDirectoryContext(hubResult.entries)
    : '';
  const context = directoryContext
    ? `${directoryContext}\nUse the supplier directory data above to answer the question.`
    : 'No supplier records matched this question.';

  const answer = await askQSQuestion(question, context, conversationHistory);

  const response: QSQuestionResponse = {
    answer,
    requiresPermission: false,
    hasSystemData,
    systemDataSummary,
  };

  await setCachedResponse(cacheScopeKey, JSON.stringify(response), 60);
  return response;
}
