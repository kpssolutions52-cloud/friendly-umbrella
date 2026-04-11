/**
 * Supplier Intelligence Hub API (QS only)
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleware';
import { requireQS } from '../middleware/permissionsMiddleware';
import { prisma } from '../utils/prisma';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  archiveSupplier,
  upsertContact,
  deleteContact,
  findPotentialDuplicates,
  createImportJob,
  getImportJob,
  runImportJob,
} from '../services/supplierHubService';
import { normalizeSupplierRows, parseSupplierExcelBuffer, buildExportWorkbook } from '../services/supplierHubExcel';
import type { SupplierHubSourceType, SupplierHubStatus } from '@prisma/client';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

function orgId(req: Request): string {
  return (req as any).user?.organizationId as string;
}

function userId(req: Request): string | undefined {
  return (req as any).user?.id as string | undefined;
}

/** GET /supplier-hub/suppliers */
router.get('/supplier-hub/suppliers', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const updatedSince = q.updatedSince ? new Date(q.updatedSince) : undefined;
    if (updatedSince && Number.isNaN(updatedSince.getTime())) {
      return res.status(400).json({ error: 'Invalid updatedSince' });
    }
    const result = await listSuppliers(orgId(req), {
      q: q.q,
      category: q.category,
      trade: q.trade,
      status: q.status as SupplierHubStatus | undefined,
      sourceType: q.sourceType as SupplierHubSourceType | undefined,
      hasEmail: q.hasEmail === 'true',
      hasPhone: q.hasPhone === 'true',
      hasWhatsapp: q.hasWhatsapp === 'true',
      preferred: q.preferred === 'true',
      countryHint: q.country,
      updatedSince,
      includeArchived: q.includeArchived === 'true',
      page: q.page ? parseInt(q.page, 10) : 1,
      limit: q.limit ? parseInt(q.limit, 10) : 25,
      sort: (q.sort as 'updatedAt' | 'companyName' | 'createdAt') || 'updatedAt',
      order: (q.order as 'asc' | 'desc') || 'desc',
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[supplier-hub] list', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

/** GET /supplier-hub/suppliers/:id */
router.get('/supplier-hub/suppliers/:id', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const row = await getSupplier(orgId(req), req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json({ supplier: row });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /supplier-hub/suppliers */
router.post('/supplier-hub/suppliers', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const body = req.body as any;
    if (!body.companyName?.trim()) return res.status(400).json({ error: 'companyName required' });
    const contacts = Array.isArray(body.contacts) ? body.contacts : [{}];
    const created = await createSupplier(orgId(req), userId(req), {
      category: body.category,
      companyName: body.companyName,
      address: body.address,
      trade: body.trade,
      remark: body.remark,
      sourceType: body.sourceType,
      status: body.status,
      isPreferred: body.isPreferred,
      isFavorite: body.isFavorite,
      contacts,
    });
    return res.status(201).json({ supplier: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /supplier-hub/suppliers/:id */
router.patch('/supplier-hub/suppliers/:id', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const updated = await updateSupplier(orgId(req), userId(req), req.params.id, req.body);
    return res.json({ supplier: updated });
  } catch (err: any) {
    if (err.message === 'Supplier not found') return res.status(404).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
});

/** DELETE /supplier-hub/suppliers/:id — archive */
router.delete('/supplier-hub/suppliers/:id', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    await archiveSupplier(orgId(req), userId(req), req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === 'Supplier not found') return res.status(404).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
});

/** POST /supplier-hub/suppliers/:id/contacts */
router.post('/supplier-hub/suppliers/:id/contacts', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const c = await upsertContact(orgId(req), userId(req), req.params.id, req.body);
    return res.status(201).json({ contact: c });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /supplier-hub/contacts/:contactId */
router.patch('/supplier-hub/contacts/:contactId', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.supplierHubContact.findFirst({
      where: { id: req.params.contactId },
      include: { supplier: true },
    });
    if (!existing || existing.supplier.organizationId !== orgId(req)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const c = await upsertContact(orgId(req), userId(req), existing.supplierHubEntryId, {
      ...req.body,
      id: req.params.contactId,
    });
    return res.json({ contact: c });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** DELETE /supplier-hub/contacts/:contactId */
router.delete('/supplier-hub/contacts/:contactId', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    await deleteContact(orgId(req), userId(req), req.params.contactId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /supplier-hub/import/preview */
router.post('/supplier-hub/import/preview', requireAuth, requireQS, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.buffer) return res.status(400).json({ error: 'file required' });
    const { rows, headers, warnings } = parseSupplierExcelBuffer(file.buffer);
    const normalized = normalizeSupplierRows(rows);
    const dupHints: { companyName: string; matches: { id: string; companyName: string }[] }[] = [];
    for (const p of normalized) {
      const matches = await findPotentialDuplicates(orgId(req), p.companyName);
      if (matches.length) dupHints.push({ companyName: p.companyName, matches });
    }
    return res.json({ preview: normalized, headers, warnings, duplicateHints: dupHints });
  } catch (err: any) {
    console.error('[supplier-hub] import preview', err);
    return res.status(500).json({ error: err.message || 'Import parse failed' });
  }
});

/** POST /supplier-hub/import/confirm — queues background job, returns jobId (202) */
router.post('/supplier-hub/import/confirm', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const { suppliers, mode } = req.body as {
      suppliers: any[];
      mode?: 'create' | 'skip_duplicates' | 'replace_existing';
    };
    if (!Array.isArray(suppliers)) return res.status(400).json({ error: 'suppliers array required' });
    const importMode: 'create' | 'skip_duplicates' | 'replace_existing' =
      mode === 'skip_duplicates'
        ? 'skip_duplicates'
        : mode === 'replace_existing'
          ? 'replace_existing'
          : 'create';
    const job = await createImportJob(orgId(req), userId(req), suppliers, importMode);
    setImmediate(() => {
      runImportJob(job.id).catch((err) => console.error('[supplier-hub] import job', job.id, err));
    });
    return res.status(202).json({ jobId: job.id, status: 'pending' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /supplier-hub/import/jobs/:jobId — poll import job status */
router.get('/supplier-hub/import/jobs/:jobId', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const job = await getImportJob(orgId(req), req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json({
      id: job.id,
      status: job.status,
      mode: job.mode,
      resultCreated: job.resultCreated,
      resultSkipped: job.resultSkipped,
      resultBackfilled: job.resultBackfilled,
      resultReplaced: job.resultReplaced,
      resultErrors: job.resultErrors,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /supplier-hub/export */
router.get('/supplier-hub/export', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const { suppliers } = await listSuppliers(orgId(req), {
      q: q.q,
      category: q.category,
      trade: q.trade,
      status: q.status as SupplierHubStatus | undefined,
      includeArchived: q.includeArchived === 'true',
      page: 1,
      limit: 10000,
      sort: 'companyName',
      order: 'asc',
    });

    const flat: Parameters<typeof buildExportWorkbook>[0] = [];
    for (const s of suppliers as any[]) {
      const contacts = s.contacts?.length ? s.contacts : [null];
      for (const c of contacts) {
        flat.push({
          category: s.category,
          companyName: s.companyName,
          contactName: c?.contactName,
          phone: c?.phone,
          fax: c?.fax,
          email: c?.email,
          whatsappNumber: c?.whatsappNumber,
          address: s.address,
          trade: s.trade,
          remark: s.remark,
          status: s.status,
          updatedAt: new Date(s.updatedAt),
        });
      }
    }

    const buf = buildExportWorkbook(flat);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="supplier-intelligence-export.xlsx"');
    return res.send(buf);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /supplier-hub/duplicates/check */
router.post('/supplier-hub/duplicates/check', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const { companyName, excludeId } = req.body as { companyName?: string; excludeId?: string };
    if (!companyName?.trim()) return res.status(400).json({ error: 'companyName required' });
    const matches = await findPotentialDuplicates(orgId(req), companyName, excludeId);
    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
