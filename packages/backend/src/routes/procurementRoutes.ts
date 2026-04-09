/**
 * Procurement Routes
 * Handles the full RFQ lifecycle for QS users.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireQS } from '../middleware/permissionsMiddleware';
import {
  createProcurementRequest,
  updateRfqDraft,
  sendRfqToSuppliers,
  awardQuotation,
  getProcurementRequests,
  getProcurementRequestById,
} from '../services/procurementOrchestrator';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * POST /api/v1/procurement/requests
 * Create a new procurement request from a natural language prompt.
 */
router.post('/procurement/requests', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return res.status(400).json({ error: 'prompt is required (min 5 characters)' });
    }

    const user = (req as any).user;
    const result = await createProcurementRequest({
      rawPrompt: prompt.trim(),
      organizationId: user.organizationId,
      createdById: user.id,
      companyName: user.organizationName,
      contactEmail: user.email,
    });

    return res.status(201).json({
      request: result.request,
      intent: result.intent,
      candidatesCount: result.candidates.length,
    });
  } catch (err: any) {
    console.error('[ProcurementRoutes] createRequest error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/v1/procurement/requests
 * List all procurement requests for the authenticated organization.
 */
router.get('/procurement/requests', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const requests = await getProcurementRequests(user.organizationId);
    return res.json({ requests });
  } catch (err: any) {
    console.error('[ProcurementRoutes] listRequests error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/v1/procurement/requests/:id
 * Get a single procurement request with all details.
 */
router.get('/procurement/requests/:id', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const request = await getProcurementRequestById(req.params.id);

    if (!request) return res.status(404).json({ error: 'Procurement request not found' });
    if (request.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json({ request });
  } catch (err: any) {
    console.error('[ProcurementRoutes] getRequest error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/v1/procurement/requests/:id/rfq
 * Update the RFQ draft (subject + body) before sending.
 */
router.post('/procurement/requests/:id/rfq', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const { subject, body } = req.body as { subject: string; body: string };
    if (!subject || !body) {
      return res.status(400).json({ error: 'subject and body are required' });
    }

    const user = (req as any).user;
    const existing = await prisma.procurementRequest.findUnique({
      where: { id: req.params.id },
      select: { organizationId: true },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await updateRfqDraft(req.params.id, subject, body);
    return res.json({ request: updated });
  } catch (err: any) {
    console.error('[ProcurementRoutes] updateRfq error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/v1/procurement/requests/:id/send
 * Send the RFQ to selected suppliers via email, whatsapp, or both.
 */
router.post('/procurement/requests/:id/send', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const { channel = 'email', candidateIds } = req.body as {
      channel?: 'email' | 'whatsapp' | 'both';
      candidateIds?: string[];
    };

    const user = (req as any).user;
    const existing = await prisma.procurementRequest.findUnique({
      where: { id: req.params.id },
      select: { organizationId: true },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await sendRfqToSuppliers(req.params.id, channel, candidateIds);
    return res.json(result);
  } catch (err: any) {
    console.error('[ProcurementRoutes] sendRfq error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/v1/procurement/requests/:id/status
 * Manually update request status.
 */
router.post('/procurement/requests/:id/status', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: string };
    const validStatuses = ['draft', 'searching', 'rfq_sent', 'evaluating', 'awarded', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const user = (req as any).user;
    const existing = await prisma.procurementRequest.findUnique({
      where: { id: req.params.id },
      select: { organizationId: true },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.procurementRequest.update({
      where: { id: req.params.id },
      data: { status: status as any },
    });
    return res.json({ request: updated });
  } catch (err: any) {
    console.error('[ProcurementRoutes] updateStatus error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/v1/procurement/requests/:id/award/:quotationId
 * Award a quotation response.
 */
router.post(
  '/procurement/requests/:id/award/:quotationId',
  requireAuth,
  requireQS,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const existing = await prisma.procurementRequest.findUnique({
        where: { id: req.params.id },
        select: { organizationId: true },
      });
      if (!existing) return res.status(404).json({ error: 'Not found' });
      if (existing.organizationId !== user.organizationId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await awardQuotation(req.params.id, req.params.quotationId);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[ProcurementRoutes] award error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

/**
 * POST /api/v1/procurement/candidates/:id/select
 * Toggle supplier candidate selection.
 */
router.post('/procurement/candidates/:id/select', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const { isSelected } = req.body as { isSelected: boolean };
    const updated = await prisma.rfqSupplierCandidate.update({
      where: { id: req.params.id },
      data: { isSelected },
    });
    return res.json({ candidate: updated });
  } catch (err: any) {
    console.error('[ProcurementRoutes] selectCandidate error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
