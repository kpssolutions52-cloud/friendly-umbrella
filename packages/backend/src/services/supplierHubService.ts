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
      include: { contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } },
      orderBy: { [sortField]: order },
      skip,
      take: limit,
    }),
  ]);

  return {
    suppliers: rows.map((e) => ({
      ...e,
      completenessScore: completenessScore(e),
      primaryContact: e.contacts.find((c) => c.isPrimary) ?? e.contacts[0] ?? null,
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
  const rows = await prisma.supplierHubEntry.findMany({
    where: {
      organizationId,
      archivedAt: null,
      id: excludeId ? { not: excludeId } : undefined,
    },
    select: { id: true, companyName: true, category: true },
    take: 50,
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
async function hasExactNormalizedCompanyName(organizationId: string, companyName: string): Promise<boolean> {
  const name = companyName.trim();
  if (!name) return false;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM supplier_hub_entries
    WHERE organization_id = ${organizationId}::uuid
      AND archived_at IS NULL
      AND lower(trim(company_name)) = lower(trim(${name}))
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function importSuppliers(
  organizationId: string,
  userId: string | undefined,
  parsed: ParsedSupplier[],
  mode: 'create' | 'skip_duplicates'
) {
  const results: { created: number; skipped: number; errors: string[] } = { created: 0, skipped: 0, errors: [] };

  for (const p of parsed) {
    try {
      if (!p.companyName?.trim()) {
        results.errors.push('Skipped row with empty company name');
        continue;
      }
      if (await hasExactNormalizedCompanyName(organizationId, p.companyName)) {
        if (mode === 'skip_duplicates') {
          results.skipped += 1;
          continue;
        }
        results.errors.push(`${p.companyName}: already exists (normalized name matches existing row)`);
        continue;
      }
      const dups = await findPotentialDuplicates(organizationId, p.companyName);
      if (dups.length && mode === 'skip_duplicates') {
        results.skipped += 1;
        continue;
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
  mode: 'create' | 'skip_duplicates'
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
    const result = await importSuppliers(
      job.organizationId,
      job.userId ?? undefined,
      suppliers,
      job.mode === 'skip_duplicates' ? 'skip_duplicates' : 'create'
    );
    await prisma.supplierHubImportJob.update({
      where: { id: jobId },
      data: {
        status: SupplierHubImportJobStatus.completed,
        resultCreated: result.created,
        resultSkipped: result.skipped,
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
