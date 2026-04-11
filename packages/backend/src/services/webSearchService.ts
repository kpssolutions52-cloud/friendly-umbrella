/**
 * Web search for QS chat enrichment (Supplier Hub / Excel DB gaps).
 *
 * - **Tavily** (`TAVILY_API_KEY`): searches the open web — use this when Google
 *   Programmable Search cannot cover “whole internet” for your engine.
 * - **Google Custom Search** (`GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_CX`): optional fallback.
 *
 * `WEB_SEARCH_PROVIDER`: `tavily` | `google` | `auto` (default `auto`: Tavily if key set, else Google).
 */

export interface WebSearchHit {
  title: string;
  link: string;
  snippet: string;
}

export type WebSearchProviderName = 'tavily' | 'google' | 'none';

function providerFromEnv(): 'tavily' | 'google' | 'auto' {
  const p = (process.env.WEB_SEARCH_PROVIDER || 'auto').toLowerCase().trim();
  if (p === 'tavily' || p === 'google' || p === 'auto') return p;
  return 'auto';
}

function tavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SEARCH_API_KEY?.trim() && process.env.GOOGLE_SEARCH_CX?.trim());
}

/** Which backend will run for `searchWeb` (for logging / ops). */
export function getActiveWebSearchProvider(): WebSearchProviderName {
  const mode = providerFromEnv();
  if (mode === 'tavily') return tavilyConfigured() ? 'tavily' : 'none';
  if (mode === 'google') return googleConfigured() ? 'google' : 'none';
  if (tavilyConfigured()) return 'tavily';
  if (googleConfigured()) return 'google';
  return 'none';
}

export function isWebSearchConfigured(): boolean {
  return getActiveWebSearchProvider() !== 'none';
}

async function searchTavily(query: string, num: number): Promise<WebSearchHit[]> {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key || !query.trim()) return [];

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query: query.trim(),
      search_depth: 'basic',
      max_results: Math.min(20, Math.max(1, num)),
      include_answer: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[webSearch] Tavily failed:', res.status, text.slice(0, 200));
    return [];
  }

  const data = (await res.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  const rows = data.results ?? [];
  return rows
    .filter((r) => r.url && (r.title || r.content))
    .map((r) => ({
      title: (r.title ?? 'Result').trim(),
      link: r.url!.trim(),
      snippet: (r.content ?? '').trim().slice(0, 2000),
    }));
}

async function searchGoogle(query: string, num: number): Promise<WebSearchHit[]> {
  const key = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_SEARCH_CX?.trim();
  if (!key || !cx || !query.trim()) return [];

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', key);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', query.trim());
  url.searchParams.set('num', String(Math.min(10, Math.max(1, num))));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[webSearch] Google Custom Search failed:', res.status, text.slice(0, 200));
    return [];
  }

  const data = (await res.json()) as {
    items?: Array<{ title?: string; link?: string; snippet?: string }>;
  };

  const items = data.items ?? [];
  return items
    .filter((i) => i.link && (i.title || i.snippet))
    .map((i) => ({
      title: (i.title ?? 'Result').trim(),
      link: i.link!.trim(),
      snippet: (i.snippet ?? '').trim(),
    }));
}

/**
 * Run web search using the configured provider (Tavily preferred in `auto` mode).
 */
export async function searchWeb(query: string, num: number = 5): Promise<WebSearchHit[]> {
  const mode = providerFromEnv();
  if (mode === 'tavily') {
    if (tavilyConfigured()) return searchTavily(query, num);
    if (googleConfigured()) return searchGoogle(query, num);
    return [];
  }
  if (mode === 'google') {
    if (googleConfigured()) return searchGoogle(query, num);
    if (tavilyConfigured()) return searchTavily(query, num);
    return [];
  }
  // auto
  if (tavilyConfigured()) return searchTavily(query, num);
  if (googleConfigured()) return searchGoogle(query, num);
  return [];
}

export function formatWebSearchHitsForPrompt(hits: WebSearchHit[]): string {
  if (hits.length === 0) return '';
  const label =
    getActiveWebSearchProvider() === 'tavily'
      ? '### Web search results (Tavily — open web; not from your Supplier Hub / Excel import)'
      : '### Web search results (public web — not from your Supplier Hub / Excel import)';
  let s = `${label}\n`;
  hits.forEach((h, i) => {
    s += `${i + 1}. **${h.title}**\n   URL: ${h.link}\n   ${h.snippet}\n\n`;
  });
  return s.trimEnd();
}
