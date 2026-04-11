/**
 * Supplier Discovery Service
 * Finds relevant suppliers from:
 *  1. Internal DB (Organization table, type=supplier)
 *  2. Google Custom Search API (web-discovered suppliers)
 * Deduplicates and ranks candidates by price, proximity, and past performance.
 */

import { prisma } from '../utils/prisma';
import type { ProcurementIntent } from './procurementNLPService';

export interface SupplierCandidate {
  companyName: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  website?: string;
  address?: string;
  source: 'internal' | 'web';
  organizationId?: string;
  rankScore: number;
}

export interface DiscoveryResult {
  candidates: SupplierCandidate[];
  webSearchEnabled: boolean;
  webSearchQuery?: string;
  internalCount: number;
  webCount: number;
}

// ─── Internal DB Discovery ────────────────────────────────────────────────────

async function discoverFromInternalDB(
  intent: ProcurementIntent,
  limit: number
): Promise<SupplierCandidate[]> {
  const keywords = intent.product
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Find suppliers whose products match the intent keywords
  const suppliers = await prisma.organization.findMany({
    where: {
      type: 'supplier',
      products: {
        some: {
          isActive: true,
          OR: keywords.map((kw) => ({
            name: { contains: kw, mode: 'insensitive' as const },
          })),
        },
      },
    },
    include: {
      products: {
        where: {
          isActive: true,
          OR: keywords.map((kw) => ({
            name: { contains: kw, mode: 'insensitive' as const },
          })),
        },
        include: {
          defaultPrices: {
            where: { isActive: true },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
        take: 5,
      },
    },
    take: limit * 2,
  });

  // Also look up Tenant records (which have phone/address) matched by email
  const orgEmails = suppliers.map((s) => s.email);
  const tenants = orgEmails.length
    ? await prisma.tenant.findMany({
        where: { email: { in: orgEmails } },
        select: { email: true, phone: true, address: true },
      })
    : [];
  const tenantByEmail = new Map(tenants.map((t) => [t.email, t]));

  return suppliers.map((org) => {
    let rankScore = 50; // base score for internal suppliers
    const tenant = tenantByEmail.get(org.email);

    // Boost score if price is within constraint
    const maxPrice = intent.constraints.maxPricePerUnit;
    if (maxPrice && org.products.length > 0) {
      const prices = org.products
        .flatMap((p) => p.defaultPrices)
        .map((dp) => Number(dp.price));
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        if (minPrice <= maxPrice) {
          rankScore += 30;
          rankScore += Math.min(20, ((maxPrice - minPrice) / maxPrice) * 20);
        }
      }
    }

    // Boost for location match
    if (intent.location) {
      const loc = intent.location.toLowerCase();
      const addr = (tenant?.address || '').toLowerCase();
      if (addr.includes(loc)) rankScore += 15;
    }

    // Boost for more matching products
    rankScore += Math.min(10, org.products.length * 2);

    return {
      companyName: org.name,
      contactEmail: org.email,
      contactPhone: tenant?.phone ?? undefined,
      // Use phone as WhatsApp fallback if it looks like a mobile number
      contactWhatsapp: tenant?.phone?.replace(/\D/g, '').length === 8 ? tenant.phone : undefined,
      address: tenant?.address ?? undefined,
      source: 'internal' as const,
      organizationId: org.id,
      rankScore,
    };
  });
}

// ─── Google Custom Search Discovery ──────────────────────────────────────────

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
  };
}

async function discoverFromWeb(
  intent: ProcurementIntent,
  limit: number
): Promise<SupplierCandidate[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    console.warn('[SupplierDiscovery] Google Search not configured (GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_CX missing)');
    return [];
  }

  const location = intent.location || 'Singapore';
  const query = encodeURIComponent(
    `${intent.product} supplier ${location} contact email`
  );
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=${Math.min(limit, 10)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[SupplierDiscovery] Google Search API error:', res.status, res.statusText);
      return [];
    }
    const data = (await res.json()) as { items?: GoogleSearchItem[] };
    const items: GoogleSearchItem[] = data.items || [];

    return items.map((item) => {
      const emailMatch = item.snippet.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      const phoneMatch = item.snippet.match(/(?:\+65[\s-]?)?\d{4}[\s-]?\d{4}/);

      return {
        companyName: item.title.split(' - ')[0].split(' | ')[0].trim(),
        contactEmail: emailMatch?.[0],
        contactPhone: phoneMatch?.[0],
        website: item.link,
        source: 'web' as const,
        rankScore: 30, // lower base score for web-discovered
      };
    });
  } catch (err) {
    console.error('[SupplierDiscovery] Web search failed:', err);
    return [];
  }
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateCandidates(candidates: SupplierCandidate[]): SupplierCandidate[] {
  const seen = new Map<string, SupplierCandidate>();

  for (const c of candidates) {
    const key = normalizeKey(c.companyName);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, c);
    } else {
      // Merge: keep internal source, take higher rank score, merge contact info
      const merged: SupplierCandidate = {
        ...existing,
        source: existing.source === 'internal' ? 'internal' : c.source,
        rankScore: Math.max(existing.rankScore, c.rankScore),
        contactEmail: existing.contactEmail || c.contactEmail,
        contactPhone: existing.contactPhone || c.contactPhone,
        contactWhatsapp: existing.contactWhatsapp || c.contactWhatsapp,
        website: existing.website || c.website,
        address: existing.address || c.address,
      };
      seen.set(key, merged);
    }
  }

  return Array.from(seen.values());
}

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(pte|ltd|sdn|bhd|inc|llc|co|corp|limited|private)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function discoverSuppliers(
  intent: ProcurementIntent,
  maxCandidates = 10
): Promise<DiscoveryResult> {
  const webSearchEnabled = !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX);
  const location = intent.location || 'Singapore';
  const webSearchQuery = webSearchEnabled
    ? `${intent.product} supplier ${location} contact email`
    : undefined;

  const internalCandidates = await discoverFromInternalDB(intent, maxCandidates);
  const webLimit = Math.max(5, maxCandidates - internalCandidates.length);
  const webCandidates = await discoverFromWeb(intent, webLimit);

  const all = deduplicateCandidates([...internalCandidates, ...webCandidates]);
  all.sort((a, b) => b.rankScore - a.rankScore);

  return {
    candidates: all.slice(0, maxCandidates),
    webSearchEnabled,
    webSearchQuery,
    internalCount: internalCandidates.length,
    webCount: webCandidates.length,
  };
}
