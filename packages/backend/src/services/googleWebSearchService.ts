/**
 * Google Custom Search JSON API — used when Supplier Hub (Excel-backed DB) lacks an answer.
 * Configure GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX (see env.example).
 */

export interface WebSearchHit {
  title: string;
  link: string;
  snippet: string;
}

export function isGoogleWebSearchConfigured(): boolean {
  const key = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_SEARCH_CX?.trim();
  return Boolean(key && cx);
}

/**
 * Run a single web search query (up to `num` results, max 10 per Google API).
 */
export async function searchWeb(query: string, num: number = 5): Promise<WebSearchHit[]> {
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
    console.warn('[googleWebSearch] Custom Search failed:', res.status, text.slice(0, 200));
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

export function formatWebSearchHitsForPrompt(hits: WebSearchHit[]): string {
  if (hits.length === 0) return '';
  let s =
    '### Web search results (public web — not from your Supplier Hub / Excel import)\n';
  hits.forEach((h, i) => {
    s += `${i + 1}. **${h.title}**\n   URL: ${h.link}\n   ${h.snippet}\n\n`;
  });
  return s.trimEnd();
}
