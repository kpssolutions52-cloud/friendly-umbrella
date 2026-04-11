/**
 * Procurement Orchestrator
 * Coordinates the full RFQ lifecycle:
 *   NLP → supplier discovery → RFQ generation → dispatch → track → parse
 */

import { prisma } from '../utils/prisma';
import { extractProcurementIntent, type ProcurementIntent } from './procurementNLPService';
import { discoverSuppliers, type SupplierCandidate, type DiscoveryResult } from './supplierDiscoveryService';
import { generateRfqDraft } from './rfqGeneratorService';
import { sendRfqEmail } from './emailService';
import { sendWhatsAppRfq } from './whatsappService';
import { parseSupplierReply } from './rfqResponseParserService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateProcurementRequestInput {
  rawPrompt: string;
  organizationId: string;
  createdById: string;
  companyName?: string;
  contactEmail?: string;
}

export interface ProcurementRequestWithDetails {
  id: string;
  rawPrompt: string;
  product: string;
  location: string | null;
  constraints: any;
  status: string;
  rfqSubject: string | null;
  rfqBody: string | null;
  createdAt: Date;
  updatedAt: Date;
  supplierCandidates: any[];
  communications: any[];
  quotationResponses: any[];
}

export type SendChannel = 'email' | 'whatsapp' | 'both';

// ─── Step 1: Create Procurement Request from NL prompt ───────────────────────

export async function createProcurementRequest(
  input: CreateProcurementRequestInput
): Promise<{ request: any; intent: ProcurementIntent; candidates: SupplierCandidate[]; discovery: DiscoveryResult }> {
  // 1. Parse intent
  const intent = await extractProcurementIntent(input.rawPrompt);

  // 2. Discover suppliers
  const discovery = await discoverSuppliers(intent, intent.supplierCount ?? 10);
  const { candidates } = discovery;

  // 3. Generate RFQ draft
  const rfqDraft = await generateRfqDraft(
    intent,
    input.companyName,
    input.contactEmail
  );

  // 4. Persist ProcurementRequest
  const request = await prisma.procurementRequest.create({
    data: {
      organizationId: input.organizationId,
      createdById: input.createdById,
      rawPrompt: input.rawPrompt,
      product: intent.product,
      location: intent.location ?? null,
      constraints: intent.constraints as any,
      status: 'searching',
      rfqSubject: rfqDraft.subject,
      rfqBody: rfqDraft.emailBody,
    },
  });

  // 5. Persist supplier candidates
  if (candidates.length > 0) {
    await prisma.rfqSupplierCandidate.createMany({
      data: candidates.map((c) => ({
        procurementRequestId: request.id,
        organizationId: c.organizationId ?? null,
        companyName: c.companyName,
        contactEmail: c.contactEmail ?? null,
        contactPhone: c.contactPhone ?? null,
        contactWhatsapp: c.contactWhatsapp ?? null,
        website: c.website ?? null,
        address: c.address ?? null,
        source: c.source,
        rankScore: c.rankScore,
        isSelected: true,
      })),
    });
  }

  const requestWithCandidates = await prisma.procurementRequest.findUnique({
    where: { id: request.id },
    include: {
      supplierCandidates: true,
      communications: true,
      quotationResponses: true,
    },
  });

  return { request: requestWithCandidates, intent, candidates, discovery };
}

// ─── Step 2: Update RFQ draft (QS edits before sending) ──────────────────────

export async function updateRfqDraft(
  requestId: string,
  subject: string,
  body: string
): Promise<any> {
  return prisma.procurementRequest.update({
    where: { id: requestId },
    data: { rfqSubject: subject, rfqBody: body },
  });
}

// ─── Step 3: Send RFQ to selected suppliers ───────────────────────────────────

export async function sendRfqToSuppliers(
  requestId: string,
  channel: SendChannel,
  selectedCandidateIds?: string[]
): Promise<{ sent: number; failed: number; details: any[] }> {
  const request = await prisma.procurementRequest.findUnique({
    where: { id: requestId },
    include: { supplierCandidates: true },
  });

  if (!request) throw new Error(`Procurement request ${requestId} not found`);

  const candidates = request.supplierCandidates.filter(
    (c) =>
      c.isSelected &&
      (!selectedCandidateIds || selectedCandidateIds.includes(c.id))
  );

  const results: any[] = [];
  let sent = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const sendEmail =
      (channel === 'email' || channel === 'both') && !!candidate.contactEmail;
    const sendWA =
      (channel === 'whatsapp' || channel === 'both') &&
      !!(candidate.contactWhatsapp || candidate.contactPhone);

    if (sendEmail) {
      const result = await sendRfqEmail({
        to: candidate.contactEmail!,
        subject: request.rfqSubject ?? `RFQ: ${request.product}`,
        body: request.rfqBody ?? '',
        replyTo: process.env.EMAIL_FROM,
      });

      const comm = await prisma.rfqCommunication.create({
        data: {
          procurementRequestId: requestId,
          supplierCandidateId: candidate.id,
          direction: 'outbound',
          channel: 'email',
          toAddress: candidate.contactEmail!,
          subject: request.rfqSubject ?? null,
          body: request.rfqBody ?? '',
          externalMessageId: result.messageId ?? null,
          deliveryStatus: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : null,
        },
      });

      results.push({ candidateId: candidate.id, channel: 'email', ...result, commId: comm.id });
      result.success ? sent++ : failed++;
    }

    if (sendWA) {
      const phone = candidate.contactWhatsapp || candidate.contactPhone!;
      const waBody = getWhatsAppBody(request);
      const result = await sendWhatsAppRfq({ to: phone, body: waBody });

      const comm = await prisma.rfqCommunication.create({
        data: {
          procurementRequestId: requestId,
          supplierCandidateId: candidate.id,
          direction: 'outbound',
          channel: 'whatsapp',
          toAddress: phone,
          body: waBody,
          externalMessageId: result.messageSid ?? null,
          deliveryStatus: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : null,
        },
      });

      results.push({ candidateId: candidate.id, channel: 'whatsapp', ...result, commId: comm.id });
      result.success ? sent++ : failed++;
    }
  }

  // Update status to rfq_sent if at least one was sent
  if (sent > 0) {
    await prisma.procurementRequest.update({
      where: { id: requestId },
      data: { status: 'rfq_sent' },
    });
  }

  return { sent, failed, details: results };
}

function getWhatsAppBody(request: any): string {
  // Use the user-edited rfqBody, truncated to WhatsApp-friendly length (~1000 chars)
  const body = request.rfqBody ?? `RFQ: ${request.product}${request.location ? ` in ${request.location}` : ''}. Please provide your best quote.`;
  return body.length > 1000 ? body.slice(0, 997) + '...' : body;
}

// ─── Step 4: Record inbound reply and parse it ────────────────────────────────

export async function recordInboundReply(params: {
  procurementRequestId: string;
  supplierCandidateId: string;
  channel: 'email' | 'whatsapp';
  fromAddress: string;
  body: string;
  externalMessageId?: string;
}): Promise<{ communication: any; quotation: any | null }> {
  const request = await prisma.procurementRequest.findUnique({
    where: { id: params.procurementRequestId },
    select: { product: true },
  });

  // Save the raw communication
  const communication = await prisma.rfqCommunication.create({
    data: {
      procurementRequestId: params.procurementRequestId,
      supplierCandidateId: params.supplierCandidateId,
      direction: 'inbound',
      channel: params.channel,
      toAddress: params.fromAddress,
      body: params.body,
      externalMessageId: params.externalMessageId ?? null,
      deliveryStatus: 'received',
      rawReply: params.body,
      receivedAt: new Date(),
    },
  });

  // Parse the reply with AI
  const parsed = await parseSupplierReply(params.body, request?.product);

  let quotation = null;
  if (parsed.isQuotation) {
    quotation = await prisma.quotationResponse.create({
      data: {
        procurementRequestId: params.procurementRequestId,
        supplierCandidateId: params.supplierCandidateId,
        unitPrice: parsed.unitPrice ?? null,
        currency: parsed.currency ?? 'SGD',
        unit: parsed.unit ?? null,
        availability: parsed.availability ?? null,
        deliveryDays: parsed.deliveryDays ?? null,
        deliveryTerms: parsed.deliveryTerms ?? null,
        paymentTerms: parsed.paymentTerms ?? null,
        validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
        notes: parsed.notes ?? null,
        rawText: params.body,
        confidence: parsed.confidence,
      },
    });

    // Update request status to evaluating
    await prisma.procurementRequest.update({
      where: { id: params.procurementRequestId },
      data: { status: 'evaluating' },
    });
  }

  return { communication, quotation };
}

// ─── Step 5: Award a quotation ────────────────────────────────────────────────

export async function awardQuotation(
  procurementRequestId: string,
  quotationResponseId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.quotationResponse.update({
      where: { id: quotationResponseId },
      data: { isAwarded: true },
    }),
    prisma.procurementRequest.update({
      where: { id: procurementRequestId },
      data: { status: 'awarded' },
    }),
  ]);
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function getProcurementRequests(organizationId: string) {
  return prisma.procurementRequest.findMany({
    where: { organizationId },
    include: {
      supplierCandidates: { orderBy: { rankScore: 'desc' } },
      communications: { orderBy: { createdAt: 'desc' }, take: 10 },
      quotationResponses: { orderBy: { unitPrice: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProcurementRequestById(id: string) {
  return prisma.procurementRequest.findUnique({
    where: { id },
    include: {
      supplierCandidates: { orderBy: { rankScore: 'desc' } },
      communications: { orderBy: { createdAt: 'desc' } },
      quotationResponses: {
        orderBy: { unitPrice: 'asc' },
        include: { supplierCandidate: true },
      },
    },
  });
}
