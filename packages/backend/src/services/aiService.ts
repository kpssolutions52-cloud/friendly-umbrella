/**
 * AI Service for QS Assistant.
 * Supplier Hub-focused implementation (Products/RFQ logic removed).
 */

import OpenAI from 'openai';
import { getCachedResponse, setCachedResponse } from './cacheService';
import {
  fetchSupplierHubForAiContext,
  wantsSupplierHubWideList,
  type SupplierHubEntryForAi,
} from './supplierHubService';
import {
  formatWebSearchHitsForPrompt,
  getActiveWebSearchProvider,
  isWebSearchConfigured,
  searchWeb,
  type WebSearchHit,
} from './webSearchService';

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
  /** True when live web search snippets were added (Tavily or Google; hub/Excel DB did not suffice). */
  usedWebSearch?: boolean;
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
    '### Supplier Intelligence Hub (database rows imported from Excel supplier lists)\n';
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

function buildHubSummaryForPlanner(
  entries: SupplierHubEntryForAi[],
  mode: 'wide' | 'search' | 'empty'
): Record<string, unknown> {
  if (entries.length === 0) {
    return {
      matchedSuppliers: [],
      note: 'No Supplier Intelligence Hub rows matched this question (data normally comes from Excel upload into the hub database).',
    };
  }

  const cap = mode === 'wide' ? 28 : 12;
  const slice = entries.slice(0, cap);

  return {
    directoryMatchMode: mode,
    supplierRowsInAiContext: entries.length,
    suppliers: slice.map((e) => {
      const p = e.contacts.find((c) => c.isPrimary) ?? e.contacts[0];
      return {
        companyName: e.companyName,
        category: e.category,
        trade: e.trade,
        address: e.address,
        remark: e.remark ? e.remark.slice(0, 400) : null,
        hasPhone: Boolean(p?.phone),
        hasEmail: Boolean(p?.email),
        hasWhatsapp: Boolean(p?.whatsappNumber),
        contactName: p?.contactName ?? null,
      };
    }),
  };
}

function parsePlannerJson(content: string): { needsWebSearch: boolean; queries: string[] } {
  const raw = content.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const jsonStr = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  const parsed = JSON.parse(jsonStr) as { needsWebSearch?: boolean; queries?: unknown };
  const queries = Array.isArray(parsed.queries)
    ? parsed.queries
        .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
        .map((q) => q.trim().slice(0, 240))
        .slice(0, 2)
    : [];
  return { needsWebSearch: Boolean(parsed.needsWebSearch), queries };
}

/**
 * Decide if we should call web search (Tavily or Google) to supplement Excel-backed hub data.
 */
async function planSupplierWebEnrichment(
  question: string,
  hubSummary: Record<string, unknown>
): Promise<{ needsWebSearch: boolean; queries: string[] }> {
  const model = process.env.OPENAI_WEB_ENRICHMENT_MODEL || 'gpt-4o-mini';

  const system = `You decide whether live web search would help a Quantity Surveyor assistant.

Context:
- Supplier records come from the organization's **database**, populated by **Excel imports** into the Supplier Intelligence Hub (same kind of data as columns in supplier list spreadsheets: company name, category, trade, contacts, remarks, address — not live web).
- The user may ask for facts **not stored** in those rows (e.g. official website, product catalog, certifications, news, registration, broader company profile).

Your job: output **JSON only** with shape:
{"needsWebSearch": boolean, "queries": string[]}

Rules:
- Set needsWebSearch **true** when the user wants information about a **specific supplier/company** (or compares suppliers) and that information is **unlikely** to be fully answered from the hub fields listed in "suppliers" (or when no suppliers matched but the question clearly names a company to look up).
- Set needsWebSearch **false** for pure general QS/construction theory, generic material prices without a named supplier, or when the hub data already clearly contains what they asked (e.g. they only asked for phone/email and hasPhone/hasEmail is true).
- Provide **at most 2** search queries; each should include a **company name** if relevant plus concise keywords (e.g. Singapore construction supplier if address suggests SG).
- needsWebSearch **false** if the user only asked to list/export/count hub rows with no external research need.`;

  const user = `User question:\n${question}\n\nHub summary (from database / Excel import):\n${JSON.stringify(hubSummary)}`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });
    const text = response.choices[0]?.message?.content ?? '{}';
    return parsePlannerJson(text);
  } catch (e) {
    console.warn('[aiService] planSupplierWebEnrichment failed:', e);
    return { needsWebSearch: false, queries: [] };
  }
}

async function maybeFetchWebEnrichment(
  question: string,
  entries: SupplierHubEntryForAi[],
  mode: 'wide' | 'search' | 'empty'
): Promise<{ contextBlock: string; hits: WebSearchHit[] }> {
  if (!isWebSearchConfigured()) {
    return { contextBlock: '', hits: [] };
  }

  // Broad directory-only questions rarely need web crawl unless user signals external research.
  if (
    wantsSupplierHubWideList(question) &&
    !/\b(website|official|url|linkedin|news|certif|iso|product|catalog|catalogue|about\s+(the\s+)?(company|firm)|registration|acra|who\s+are|background|reputation|review)\b/i.test(
      question
    )
  ) {
    return { contextBlock: '', hits: [] };
  }

  const hubSummary = buildHubSummaryForPlanner(entries, mode);
  const plan = await planSupplierWebEnrichment(question, hubSummary);
  if (!plan.needsWebSearch || plan.queries.length === 0) {
    return { contextBlock: '', hits: [] };
  }

  const byLink = new Map<string, WebSearchHit>();
  const batches = await Promise.all(plan.queries.map((q) => searchWeb(q, 5)));
  for (const batch of batches) {
    for (const h of batch) {
      if (h.link && !byLink.has(h.link)) byLink.set(h.link, h);
    }
  }

  const hits = [...byLink.values()].slice(0, 10);
  if (hits.length === 0) {
    return { contextBlock: '', hits: [] };
  }

  return {
    contextBlock: formatWebSearchHitsForPrompt(hits),
    hits,
  };
}

async function askQSQuestion(
  question: string,
  context: string,
  options: {
    hasSystemData: boolean;
    allowGenericAnswers: boolean;
    hasWebSnippets: boolean;
    conversationHistory?: ConversationMessage[];
  }
): Promise<string> {
  const { hasSystemData, allowGenericAnswers, hasWebSnippets, conversationHistory } = options;

  let systemPrompt = `You are a Quantity Surveyor (QS) AI assistant.

**Primary focus — Supplier Intelligence Hub (Excel → database)**  
Your organization stores supplier records in the **Supplier Intelligence Hub database**, loaded from **Excel imports** (supplier list spreadsheets: company names, category, trade, contacts, remarks, address, status). This is the authoritative internal directory — not the public web.

**How to answer**
1. **When hub directory rows appear in context** — They are authoritative for that organization. Report them accurately. Never invent phone numbers, emails, or addresses that are not in those rows.
2. **When web search snippets appear in context** — They are **public web** results (from a web search API such as Tavily or Google Custom Search), **not** from the Excel import. Use them to answer gaps (e.g. website, products, certifications) and **clearly label** them as web-sourced. Prefer hub contacts for outreach; treat web snippets as unverified until the user confirms.
3. **General QS/construction knowledge** — You may use it when appropriate; separate it from hub data and from web snippets.
4. **When no hub rows matched** — Say so. Then use web snippets (if any) and/or general knowledge as appropriate.

Use conversation history for follow-ups ("that company", "their email", etc.). Be concise and actionable.`;

  if (!allowGenericAnswers) {
    systemPrompt += `

**Strict mode (no general knowledge)**  
If the question is not answerable from the directory data in context, say you cannot answer outside the Supplier Hub and ask the user to rephrase or import/update their directory.`;
  } else if (hasSystemData || hasWebSnippets) {
    systemPrompt += `

**General knowledge**  
You may add brief general context when it helps the QS, as long as you do not contradict hub facts or present web snippets as database facts.`;
  }

  if (context.trim()) {
    systemPrompt += `\n\n---\n${context}`;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
  organizationId?: string | null,
  allowWebSearch: boolean = true
): Promise<QSQuestionResponse> {
  const cacheScopeKey = `hub::${organizationId ?? ''}::gen:${allowGenericAnswers ? '1' : '0'}::web:${
    allowWebSearch ? '1' : '0'
  }::wsp:${getActiveWebSearchProvider()}::${question.trim()}`;

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

  let webContextBlock = '';
  let usedWebSearch = false;
  if (allowGenericAnswers && allowWebSearch && organizationId) {
    const webResult = await maybeFetchWebEnrichment(
      question,
      hubResult.entries,
      hubResult.mode
    );
    webContextBlock = webResult.contextBlock;
    usedWebSearch = webResult.hits.length > 0;
  }

  const contextParts: string[] = [];
  if (directoryContext) {
    contextParts.push(
      `${directoryContext}\nUse these Supplier Hub rows (Excel-sourced database) as the source of truth for contacts and remarks.`
    );
  } else {
    contextParts.push(
      'Context: No Supplier Intelligence Hub rows matched this query. Hub data is loaded from Excel into your organization database — try company names or keywords from your sheet, or confirm the import.'
    );
  }
  if (webContextBlock) {
    contextParts.push(webContextBlock);
  }
  const context = contextParts.join('\n\n');

  const answer = await askQSQuestion(question, context, {
    hasSystemData,
    allowGenericAnswers,
    hasWebSnippets: Boolean(webContextBlock),
    conversationHistory,
  });

  const response: QSQuestionResponse = {
    answer,
    requiresPermission: false,
    hasSystemData,
    systemDataSummary,
    usedWebSearch,
  };

  if (!conversationHistory || conversationHistory.length === 0) {
    if (!usedWebSearch) {
      await setCachedResponse(cacheScopeKey, JSON.stringify(response), 300); // 5 minutes
    }
  }
  return response;
}
