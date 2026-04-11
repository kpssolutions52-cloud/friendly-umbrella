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
    '### Supplier Intelligence Hub (your organization directory — includes rows imported from Excel)\n';
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
  options: {
    hasSystemData: boolean;
    allowGenericAnswers: boolean;
    conversationHistory?: ConversationMessage[];
  }
): Promise<string> {
  const { hasSystemData, allowGenericAnswers, conversationHistory } = options;

  let systemPrompt = `You are a Quantity Surveyor (QS) AI assistant.

**Primary focus — Supplier Intelligence Hub (Excel-backed directory)**  
Your organization maintains supplier records in the Supplier Intelligence Hub: companies, category, trade, contact names, phone, email, WhatsApp, address, remarks (often from Excel imports), and status.

**How to answer**
1. **When directory rows are provided in context below** — They are authoritative for that organization. Summarize or list them accurately. Never invent companies, phone numbers, emails, addresses, or remarks that are not in those rows.
2. **When the user asks something broader** (QS methods, materials, standards, definitions, etc.) — You may use general knowledge. Clearly separate what comes from the supplied directory rows versus general information.
3. **When no directory rows matched** — State that no matching Supplier Hub entries were included for this question. Then, if helpful, answer from general knowledge and label it as such. Never claim specific suppliers or contacts exist in their hub unless they appeared in context.

Use conversation history for follow-ups ("that company", "their email", etc.). Be concise and actionable.`;

  if (!allowGenericAnswers) {
    systemPrompt += `

**Strict mode (no general knowledge)**  
If the question is not answerable from the directory data in context, say you cannot answer outside the Supplier Hub and ask the user to rephrase or import/update their directory.`;
  } else if (hasSystemData) {
    systemPrompt += `

**General knowledge**  
You may add brief general context when it helps the QS, as long as you do not contradict or fabricate hub/contact facts.`;
  }

  if (context.trim()) {
    systemPrompt += `\n\n---\n${context}`;
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
  allowGenericAnswers: boolean = true,
  conversationHistory?: ConversationMessage[],
  organizationId?: string | null
): Promise<QSQuestionResponse> {
  const cacheScopeKey = `hub::${organizationId ?? ''}::gen:${allowGenericAnswers ? '1' : '0'}::${question.trim()}`;

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
    : 'No matching Supplier Hub (Excel directory) rows for this question.';

  if (!hasSystemData && !allowGenericAnswers) {
    return {
      answer:
        '❌ No matching Supplier Hub directory entries for this question.\n\nStrict mode is on: I only answer from your Supplier Intelligence Hub (Excel-backed) data. Would you like general information instead?\n\nReply with "yes" or use **Yes, provide general information** below.',
      requiresPermission: true,
      hasSystemData: false,
      systemDataSummary,
    };
  }

  const directoryContext = hasSystemData
    ? formatSupplierHubDirectoryContext(hubResult.entries)
    : '';
  const context = directoryContext
    ? `${directoryContext}\nAnswer using the Supplier Hub directory rows above where relevant.`
    : 'Context: No Supplier Intelligence Hub rows were retrieved for this query (try broader keywords or confirm your Excel import in the hub). You may still help with general QS or construction knowledge if allowed.';

  const answer = await askQSQuestion(question, context, {
    hasSystemData,
    allowGenericAnswers,
    conversationHistory,
  });

  const response: QSQuestionResponse = {
    answer,
    requiresPermission: false,
    hasSystemData,
    systemDataSummary,
  };

  await setCachedResponse(cacheScopeKey, JSON.stringify(response), 60);
  return response;
}
