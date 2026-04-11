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
import { verifyEmailConfig } from '../services/emailService';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * GET /api/v1/procurement/config/check
 * Returns which procurement integrations are configured and working.
 * Useful for verifying setup before a real test.
 */
router.get('/procurement/config/check', requireAuth, requireQS, async (_req: Request, res: Response) => {
  const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const whatsappConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const openaiConfigured = !!process.env.OPENAI_API_KEY;
  const webSearchConfigured = !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX);

  // Actually verify SMTP can connect (non-blocking)
  let emailReachable = false;
  if (emailConfigured) {
    emailReachable = await verifyEmailConfig().catch(() => false);
  }

  return res.json({
    email: {
      configured: emailConfigured,
      reachable: emailReachable,
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || null,
      hint: emailConfigured ? null : 'Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env',
    },
    whatsapp: {
      configured: whatsappConfigured,
      from: whatsappConfigured ? (process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886') : null,
      hint: whatsappConfigured ? null : 'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env',
    },
    openai: {
      configured: openaiConfigured,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      hint: openaiConfigured ? null : 'Set OPENAI_API_KEY in .env (fallback NLP still works without it)',
    },
    webSearch: {
      configured: webSearchConfigured,
      hint: webSearchConfigured ? null : 'Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX to enable internet supplier search',
    },
  });
});

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
      discovery: {
        webSearchEnabled: result.discovery.webSearchEnabled,
        webSearchQuery: result.discovery.webSearchQuery,
        internalCount: result.discovery.internalCount,
        webCount: result.discovery.webCount,
      },
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
    const user = (req as any).user;
    const { isSelected } = req.body as { isSelected: boolean };

    // Verify ownership via the parent procurement request
    const candidate = await prisma.rfqSupplierCandidate.findUnique({
      where: { id: req.params.id },
      include: { procurementRequest: { select: { organizationId: true } } },
    });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (candidate.procurementRequest.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

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

/**
 * POST /api/v1/procurement/candidates/:id/contact
 * Update contact details (email, phone, whatsapp) for a supplier candidate.
 */
router.post('/procurement/candidates/:id/contact', requireAuth, requireQS, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contactEmail, contactPhone, contactWhatsapp } = req.body as {
      contactEmail?: string;
      contactPhone?: string;
      contactWhatsapp?: string;
    };

    const candidate = await prisma.rfqSupplierCandidate.findUnique({
      where: { id: req.params.id },
      include: { procurementRequest: { select: { organizationId: true } } },
    });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (candidate.procurementRequest.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.rfqSupplierCandidate.update({
      where: { id: req.params.id },
      data: {
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactWhatsapp !== undefined && { contactWhatsapp }),
      },
    });
    return res.json({ candidate: updated });
  } catch (err: any) {
    console.error('[ProcurementRoutes] updateContact error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
