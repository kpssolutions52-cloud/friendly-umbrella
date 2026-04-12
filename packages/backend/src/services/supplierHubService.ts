/**
 * Supplier Intelligence Hub — CRUD, search, duplicates, completeness.
 */

import { Prisma, SupplierHubImportJobStatus, SupplierHubSourceType, SupplierHubStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import type { ParsedContact, ParsedSupplier } from './supplierHubExcel';

export interface ListFilters {
  q?: string;
  category?: string;
  trade?: string;
  status?: SupplierHubStatus;
  sourceType?: SupplierHubSourceType;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWhatsapp?: boolean;
  preferred?: boolean;
  countryHint?: string;
  updatedSince?: Date;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
  sort?: 'updatedAt' | 'companyName' | 'createdAt';
  order?: 'asc' | 'desc';
}

function completenessScore(entry: {
  category: string | null;
  address: string | null;
  trade: string | null;
  remark: string | null;
  contacts: Array<{
    contactName: string | null;
    phone: string | null;
    email: string | null;
    whatsappNumber: string | null;
  }>;
}): number {
  let score = 0;
  const max = 12;
  if (entry.category) score += 1;
  if (entry.address) score += 2;
  if (entry.trade) score += 1;
  if (entry.remark) score += 1;
  const c = entry.contacts[0];
  if (c?.contactName) score += 1;
  if (c?.phone) score += 2;
  if (c?.email) score += 2;
  if (c?.whatsappNumber) score += 2;
  if (entry.contacts.length > 1) score += 1;
  return Math.round((score / max) * 100);
}

function normalizeCompanyKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\b(pte|ltd|sdn|bhd|inc|llc|co|corp|limited)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function logSupplierActivity(
  supplierId: string,
  userId: string | undefined,
  action: string,
  details?: string | null
) {
  await prisma.supplierHubActivity.create({
    data: { supplierHubEntryId: supplierId, userId: userId ?? null, action, details: details ?? undefined },
  });
}

export async function listSuppliers(organizationId: string, filters: ListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
  const skip = (page - 1) * limit;

  const where: Prisma.SupplierHubEntryWhereInput = {
    organizationId,
  };

  if (!filters.includeArchived) {
    where.archivedAt = null;
  }

  if (filters.status) where.status = filters.status;
  if (filters.sourceType) where.sourceType = filters.sourceType;
  if (filters.preferred === true) where.isPreferred = true;

  if (filters.updatedSince) {
    where.updatedAt = { gte: filters.updatedSince };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { trade: { contains: q, mode: 'insensitive' } },
      { remark: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
      {
        contacts: {
          some: {
            OR: [
              { contactName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { fax: { contains: q, mode: 'insensitive' } },
              { whatsappNumber: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      },
    ];
  }

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }
  if (filters.trade) {
    where.trade = { contains: filters.trade, mode: 'insensitive' };
  }
  if (filters.countryHint) {
    where.address = { contains: filters.countryHint, mode: 'insensitive' };
  }

  const contactAnd: Prisma.SupplierHubContactWhereInput[] = [];
  if (filters.hasEmail === true) {
    contactAnd.push({ email: { not: '' } });
  }
  if (filters.hasPhone === true) {
    contactAnd.push({ phone: { not: '' } });
  }
  if (filters.hasWhatsapp === true) {
    contactAnd.push({ whatsappNumber: { not: '' } });
  }
  if (contactAnd.length > 0) {
    where.contacts = { some: { AND: contactAnd } };
  }

  const sortField = filters.sort ?? 'updatedAt';
  const order = filters.order ?? 'desc';

  const [total, rows] = await Promise.all([
    prisma.supplierHubEntry.count({ where }),
    prisma.supplierHubEntry.findMany({
      where,
      // Fetch only the primary contact for list view to avoid over-fetching
      include: { contacts: { where: { isPrimary: true }, take: 1 } },
      orderBy: { [sortField]: order },
      skip,
      take: limit,
    }),
  ]);

  return {
    suppliers: rows.map((e) => ({
      ...e,
      completenessScore: completenessScore(e),
      primaryContact: e.contacts[0] ?? null,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getSupplier(organizationId: string, id: string) {
  const e = await prisma.supplierHubEntry.findFirst({
    where: { id, organizationId },
    include: {
      contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
      activities: { orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!e) return null;
  return {
    ...e,
    completenessScore: completenessScore(e),
  };
}

export async function findPotentialDuplicates(organizationId: string, companyName: string, excludeId?: string) {
  const key = normalizeCompanyKey(companyName);
  if (key.length < 3) return [];
  // Use a DB-level prefix filter so we don't scan the full table in application code
  const prefix = companyName.slice(0, 8);
  const rows = await prisma.supplierHubEntry.findMany({
    where: {
      organizationId,
      archivedAt: null,
      id: excludeId ? { not: excludeId } : undefined,
      companyName: { contains: prefix, mode: 'insensitive' },
    },
    select: { id: true, companyName: true, category: true },
    take: 10,
  });
  return rows.filter((r) => normalizeCompanyKey(r.companyName) === key || r.companyName.toLowerCase().includes(companyName.toLowerCase().slice(0, 8)));
}

export async function createSupplier(
  organizationId: string,
  userId: string | undefined,
  data: {
    category?: string | null;
    companyName: string;
    address?: string | null;
    trade?: string | null;
    remark?: string | null;
    sourceType?: SupplierHubSourceType;
    status?: SupplierHubStatus;
    isPreferred?: boolean;
    isFavorite?: boolean;
    contacts: ParsedContact[];
  }
) {
  const created = await prisma.supplierHubEntry.create({
    data: {
      organizationId,
      category: data.category ?? null,
      companyName: data.companyName.trim(),
      address: data.address ?? null,
      trade: data.trade ?? null,
      remark: data.remark ?? null,
      sourceType: data.sourceType ?? 'manual',
      status: data.status ?? 'active',
      isPreferred: data.isPreferred ?? false,
      isFavorite: data.isFavorite ?? false,
      contacts: {
        create: data.contacts.map((c, i) => ({
          contactName: c.contactName ?? null,
          phone: c.phone ?? null,
          fax: c.fax ?? null,
          email: c.email ?? null,
          whatsappNumber: c.whatsappNumber ?? null,
          designation: c.designation ?? null,
          notes: c.notes ?? null,
          isPrimary: c.isPrimary === true || (i === 0 && !data.contacts.some((x) => x.isPrimary)),
        })),
      },
    },
    include: { contacts: true },
  });
  await logSupplierActivity(created.id, userId, 'created', JSON.stringify({ companyName: data.companyName }));
  return created;
}

export async function updateSupplier(
  organizationId: string,
  userId: string | undefined,
  id: string,
  patch: Partial<{
    category: string | null;
    companyName: string;
    address: string | null;
    trade: string | null;
    remark: string | null;
    sourceType: SupplierHubSourceType;
    status: SupplierHubStatus;
    isPreferred: boolean;
    isFavorite: boolean;
  }>
) {
  const existing = await prisma.supplierHubEntry.findFirst({ where: { id, organizationId } });
  if (!existing) throw new Error('Supplier not found');

  const updated = await prisma.supplierHubEntry.update({
    where: { id },
    data: {
      ...('category' in patch ? { category: patch.category } : {}),
      ...('companyName' in patch ? { companyName: patch.companyName } : {}),
      ...('address' in patch ? { address: patch.address } : {}),
      ...('trade' in patch ? { trade: patch.trade } : {}),
      ...('remark' in patch ? { remark: patch.remark } : {}),
      ...('sourceType' in patch ? { sourceType: patch.sourceType } : {}),
      ...('status' in patch ? { status: patch.status } : {}),
      ...('isPreferred' in patch ? { isPreferred: patch.isPreferred } : {}),
      ...('isFavorite' in patch ? { isFavorite: patch.isFavorite } : {}),
    },
    include: { contacts: true },
  });
  await logSupplierActivity(id, userId, 'updated', JSON.stringify(patch));
  return updated;
}

export async function archiveSupplier(organizationId: string, userId: string | undefined, id: string) {
  const existing = await prisma.supplierHubEntry.findFirst({ where: { id, organizationId } });
  if (!existing) throw new Error('Supplier not found');
  await prisma.supplierHubEntry.update({
    where: { id },
    data: { archivedAt: new Date(), status: 'inactive' },
  });
  await logSupplierActivity(id, userId, 'archived');
}

export async function upsertContact(
  organizationId: string,
  userId: string | undefined,
  supplierId: string,
  contact: ParsedContact & { id?: string; isPrimary?: boolean }
) {
  const sup = await prisma.supplierHubEntry.findFirst({ where: { id: supplierId, organizationId } });
  if (!sup) throw new Error('Supplier not found');

  if (contact.id) {
    const updated = await prisma.supplierHubContact.update({
      where: { id: contact.id },
      data: {
        contactName: contact.contactName ?? null,
        phone: contact.phone ?? null,
        fax: contact.fax ?? null,
        email: contact.email ?? null,
        whatsappNumber: contact.whatsappNumber ?? null,
        designation: contact.designation ?? null,
        notes: contact.notes ?? null,
        isPrimary: contact.isPrimary ?? false,
      },
    });
    if (contact.isPrimary) {
      await prisma.supplierHubContact.updateMany({
        where: { supplierHubEntryId: supplierId, id: { not: contact.id } },
        data: { isPrimary: false },
      });
    }
    await logSupplierActivity(supplierId, userId, 'contact_updated', contact.id);
    return updated;
  }

  if (contact.isPrimary) {
    await prisma.supplierHubContact.updateMany({
      where: { supplierHubEntryId: supplierId },
      data: { isPrimary: false },
    });
  }

  const created = await prisma.supplierHubContact.create({
    data: {
      supplierHubEntryId: supplierId,
      contactName: contact.contactName ?? null,
      phone: contact.phone ?? null,
      fax: contact.fax ?? null,
      email: contact.email ?? null,
      whatsappNumber: contact.whatsappNumber ?? null,
      designation: contact.designation ?? null,
      notes: contact.notes ?? null,
      isPrimary: contact.isPrimary ?? false,
    },
  });
  await logSupplierActivity(supplierId, userId, 'contact_added', created.id);
  return created;
}

export async function deleteContact(organizationId: string, userId: string | undefined, contactId: string) {
  const c = await prisma.supplierHubContact.findFirst({
    where: { id: contactId, supplier: { organizationId } },
    include: { supplier: true },
  });
  if (!c) throw new Error('Contact not found');
  await prisma.supplierHubContact.delete({ where: { id: contactId } });
  await logSupplierActivity(c.supplierHubEntryId, userId, 'contact_removed', contactId);
}

/** Same rule as database/41-dedupe-supplier-hub-entries.sql */
async function findEntryIdByNormalizedCompanyName(
  organizationId: string,
  companyName: string
): Promise<string | null> {
  const name = companyName.trim();
  if (!name) return null;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM supplier_hub_entries
    WHERE organization_id = ${organizationId}::uuid
      AND archived_at IS NULL
      AND lower(trim(company_name)) = lower(trim(${name}))
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

/** Replace hub row + contacts from an Excel row (normalized company name match). */
async function replaceSupplierFromImport(
  organizationId: string,
  userId: string | undefined,
  entryId: string,
  p: ParsedSupplier
) {
  const contacts: ParsedContact[] = p.contacts.length > 0 ? p.contacts : [{ contactName: undefined }];

  await prisma.$transaction(async (tx) => {
    await tx.supplierHubContact.deleteMany({ where: { supplierHubEntryId: entryId } });
    await tx.supplierHubEntry.update({
      where: { id: entryId },
      data: {
        companyName: p.companyName.trim(),
        category: p.category?.trim() ? p.category.trim() : null,
        address: p.address?.trim() ? p.address.trim() : null,
        trade: p.trade?.trim() ? p.trade.trim() : null,
        remark: p.remark?.trim() ? p.remark.trim() : null,
        sourceType: 'excel',
        status: 'active',
        archivedAt: null,
        contacts: {
          create: contacts.map((c, i) => ({
            contactName: c.contactName ?? null,
            phone: c.phone ?? null,
            fax: c.fax ?? null,
            email: c.email ?? null,
            whatsappNumber: c.whatsappNumber ?? null,
            designation: c.designation ?? null,
            notes: c.notes ?? null,
            isPrimary: c.isPrimary === true || (i === 0 && !contacts.some((x) => x.isPrimary)),
          })),
        },
      },
    });
  });

  await logSupplierActivity(entryId, userId, 'import_replaced', JSON.stringify({ companyName: p.companyName }));
}

/** When import skips a duplicate, still apply category from the file if the row is empty or different. */
async function backfillCategoryFromImport(
  organizationId: string,
  userId: string | undefined,
  companyName: string,
  category: string | undefined
): Promise<number> {
  const cat = category?.trim();
  if (!cat) return 0;
  const rows = await prisma.$queryRaw<{ id: string; category: string | null }[]>`
    SELECT id, category FROM supplier_hub_entries
    WHERE organization_id = ${organizationId}::uuid
      AND archived_at IS NULL
      AND lower(trim(company_name)) = lower(trim(${companyName.trim()}))
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return 0;
  if ((row.category ?? '').trim() === cat) return 0;
  await prisma.supplierHubEntry.update({
    where: { id: row.id },
    data: { category: cat },
  });
  await logSupplierActivity(row.id, userId, 'import_backfill_category', JSON.stringify({ category: cat }));
  return 1;
}

export async function importSuppliers(
  organizationId: string,
  userId: string | undefined,
  parsed: ParsedSupplier[],
  mode: 'create' | 'skip_duplicates' | 'replace_existing'
) {
  const results: {
    created: number;
    skipped: number;
    backfilled: number;
    replaced: number;
    errors: string[];
  } = {
    created: 0,
    skipped: 0,
    backfilled: 0,
    replaced: 0,
    errors: [],
  };

  for (const p of parsed) {
    try {
      if (!p.companyName?.trim()) {
        results.errors.push('Skipped row with empty company name');
        continue;
      }

      const exactId = await findEntryIdByNormalizedCompanyName(organizationId, p.companyName);

      if (exactId && mode === 'replace_existing') {
        await replaceSupplierFromImport(organizationId, userId, exactId, p);
        results.replaced += 1;
        continue;
      }

      if (exactId && mode === 'skip_duplicates') {
        results.backfilled += await backfillCategoryFromImport(
          organizationId,
          userId,
          p.companyName,
          p.category
        );
        results.skipped += 1;
        continue;
      }

      if (exactId && mode === 'create') {
        results.errors.push(`${p.companyName}: already exists (normalized name matches existing row)`);
        continue;
      }

      if (mode === 'skip_duplicates') {
        const dups = await findPotentialDuplicates(organizationId, p.companyName);
        if (dups.length) {
          results.backfilled += await backfillCategoryFromImport(
            organizationId,
            userId,
            p.companyName,
            p.category
          );
          results.skipped += 1;
          continue;
        }
      }

      const contacts: ParsedContact[] =
        p.contacts.length > 0 ? p.contacts : [{ contactName: undefined }];

      await createSupplier(organizationId, userId, {
        category: p.category ?? null,
        companyName: p.companyName,
        address: p.address ?? null,
        trade: p.trade ?? null,
        remark: p.remark ?? null,
        sourceType: 'excel',
        status: 'active',
        contacts: contacts.map((c, i) => ({
          ...c,
          isPrimary: i === 0,
        })),
      });
      results.created += 1;
    } catch (e: any) {
      results.errors.push(`${p.companyName}: ${e.message}`);
    }
  }

  return results;
}

export async function createImportJob(
  organizationId: string,
  userId: string | undefined,
  parsed: ParsedSupplier[],
  mode: 'create' | 'skip_duplicates' | 'replace_existing'
) {
  return prisma.supplierHubImportJob.create({
    data: {
      organizationId,
      userId: userId ?? null,
      status: SupplierHubImportJobStatus.pending,
      mode,
      payload: parsed as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function getImportJob(organizationId: string, jobId: string) {
  return prisma.supplierHubImportJob.findFirst({
    where: { id: jobId, organizationId },
  });
}

/** Runs after HTTP response; processes payload and updates job row. */
export async function runImportJob(jobId: string) {
  const job = await prisma.supplierHubImportJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== SupplierHubImportJobStatus.pending) return;

  await prisma.supplierHubImportJob.update({
    where: { id: jobId },
    data: { status: SupplierHubImportJobStatus.processing },
  });

  try {
    const suppliers = job.payload as unknown as ParsedSupplier[];
    const importMode: 'create' | 'skip_duplicates' | 'replace_existing' =
      job.mode === 'skip_duplicates'
        ? 'skip_duplicates'
        : job.mode === 'create'
          ? 'create'
          : 'replace_existing';
    const result = await importSuppliers(
      job.organizationId,
      job.userId ?? undefined,
      suppliers,
      importMode
    );
    await prisma.supplierHubImportJob.update({
      where: { id: jobId },
      data: {
        status: SupplierHubImportJobStatus.completed,
        resultCreated: result.created,
        resultSkipped: result.skipped,
        resultBackfilled: result.backfilled,
        resultReplaced: result.replaced,
        resultErrors: result.errors,
      },
    });
  } catch (e: any) {
    await prisma.supplierHubImportJob.update({
      where: { id: jobId },
      data: {
        status: SupplierHubImportJobStatus.failed,
        errorMessage: e?.message || String(e),
      },
    });
  }
}

/** Stop words for QS chat → hub keyword search (keep list tight to avoid empty matches). */
const HUB_AI_STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'from', 'that', 'this', 'what', 'which', 'who', 'how', 'are', 'is',
  'do', 'does', 'did', 'have', 'has', 'had', 'my', 'our', 'me', 'we', 'you', 'your', 'their', 'there', 'here',
  'list', 'show', 'find', 'tell', 'give', 'get', 'please', 'can', 'could', 'would', 'should', 'will', 'just',
  'into', 'than', 'then', 'them', 'when', 'where', 'why', 'also', 'only', 'even', 'very', 'being', 'were', 'been',
  'some', 'such', 'same', 'both', 'each', 'other', 'another', 'any', 'all', 'much', 'many', 'more', 'most', 'few',
  'about', 'using', 'use', 'used', 'based', 'data', 'sheet', 'excel', 'file', 'import', 'imported',
]);

/**
 * Tokens from a natural-language question for OR-style hub search (company, trade, remarks, contacts…).
 */
export function extractSupplierHubSearchTokens(question: string): string[] {
  const raw = question
    .toLowerCase()
    .replace(/[^\w\s@.+()-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-z0-9@.+()-]+|[^a-z0-9@.+()-]+$/gi, ''))
    .filter(Boolean);

  const out: string[] = [];
  for (const t of raw) {
    if (t.length < 2) continue;
    if (HUB_AI_STOP.has(t)) continue;
    // Skip bare tiny integers (avoid matching everything)
    if (/^\d+$/.test(t) && t.length < 4) continue;
    out.push(t);
  }
  return [...new Set(out)].slice(0, 14);
}

function hubTokenOrClause(tokens: string[]): Prisma.SupplierHubEntryWhereInput[] {
  const clauses: Prisma.SupplierHubEntryWhereInput[] = [];
  for (const tok of tokens) {
    clauses.push(
      { companyName: { contains: tok, mode: 'insensitive' } },
      { category: { contains: tok, mode: 'insensitive' } },
      { trade: { contains: tok, mode: 'insensitive' } },
      { remark: { contains: tok, mode: 'insensitive' } },
      { address: { contains: tok, mode: 'insensitive' } },
      {
        contacts: {
          some: {
            OR: [
              { contactName: { contains: tok, mode: 'insensitive' } },
              { email: { contains: tok, mode: 'insensitive' } },
              { phone: { contains: tok, mode: 'insensitive' } },
              { whatsappNumber: { contains: tok, mode: 'insensitive' } },
            ],
          },
        },
      }
    );
  }
  return clauses;
}

/** Broad “show my directory / hub” style questions → return more rows without strict keyword match. */
export function wantsSupplierHubWideList(question: string): boolean {
  const q = question.toLowerCase();
  return (
    /\b(list|show|display|give)\s+(me\s+)?(all|every|entire|full|whole|complete)\b/.test(q) ||
    /\b(all|every)\s+(supplier|suppliers|entry|entries|contact|contacts|row|rows)\b/.test(q) ||
    /\b(supplier\s+hub|intelligence\s+hub|hub\s+supplier|supplier\s+directory|my\s+directory)\b/.test(q) ||
    /\b(from|in)\s+(my\s+)?(excel|import|sheet|spreadsheet)\b/.test(q) ||
    /\bhow many\b[\s\S]{0,80}\b(supplier|suppliers|contacts?|entries|rows)\b/.test(q) ||
    /\b(count|total|number)\s+(of\s+)?(supplier|suppliers|contacts?|entries)\b/.test(q)
  );
}

export type SupplierHubEntryForAi = Awaited<ReturnType<typeof listSuppliers>>['suppliers'][number];

/**
 * Rows from Supplier Intelligence Hub (Excel/manual directory) to inject into QS assistant context.
 */
export async function fetchSupplierHubForAiContext(
  organizationId: string,
  question: string,
  opts?: { maxRows?: number }
): Promise<{ entries: SupplierHubEntryForAi[]; mode: 'wide' | 'search' | 'empty' }> {
  const maxRows = Math.min(100, Math.max(1, opts?.maxRows ?? 50));

  if (wantsSupplierHubWideList(question)) {
    const res = await listSuppliers(organizationId, {
      page: 1,
      limit: maxRows,
      sort: 'companyName',
      order: 'asc',
    });
    return { entries: res.suppliers, mode: 'wide' };
  }

  const tokens = extractSupplierHubSearchTokens(question);
  if (tokens.length === 0) {
    return { entries: [], mode: 'empty' };
  }

  const rows = await prisma.supplierHubEntry.findMany({
    where: {
      organizationId,
      archivedAt: null,
      OR: hubTokenOrClause(tokens),
    },
    // Only primary contact needed for AI context formatting
    include: { contacts: { where: { isPrimary: true }, take: 1 } },
    orderBy: { updatedAt: 'desc' },
    take: maxRows,
  });

  const suppliers = rows.map((e) => ({
    ...e,
    completenessScore: completenessScore(e),
    primaryContact: e.contacts.find((c) => c.isPrimary) ?? e.contacts[0] ?? null,
  }));

  return { entries: suppliers, mode: 'search' };
}
