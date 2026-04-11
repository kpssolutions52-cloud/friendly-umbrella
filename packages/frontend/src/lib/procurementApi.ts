/**
 * Procurement API client
 * Wraps all /api/v1/procurement/* endpoints.
 */

import { apiGet, apiPost } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupplierCandidate {
  id: string;
  companyName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  website?: string | null;
  address?: string | null;
  source: 'internal' | 'web';
  rankScore: number;
  isSelected: boolean;
}

export interface RfqCommunication {
  id: string;
  direction: 'outbound' | 'inbound';
  channel: 'email' | 'whatsapp';
  toAddress?: string | null;
  subject?: string | null;
  body: string;
  deliveryStatus?: string | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
}

export interface QuotationResponse {
  id: string;
  supplierCandidateId: string;
  supplierCandidate?: SupplierCandidate;
  unitPrice?: number | null;
  currency?: string | null;
  unit?: string | null;
  availability?: string | null;
  deliveryDays?: number | null;
  deliveryTerms?: string | null;
  paymentTerms?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  confidence?: number | null;
  isAwarded: boolean;
  createdAt: string;
}

export type ProcurementStatus =
  | 'draft'
  | 'searching'
  | 'rfq_sent'
  | 'evaluating'
  | 'awarded'
  | 'closed';

export interface ProcurementRequest {
  id: string;
  rawPrompt: string;
  product: string;
  location?: string | null;
  constraints?: Record<string, any>;
  status: ProcurementStatus;
  rfqSubject?: string | null;
  rfqBody?: string | null;
  createdAt: string;
  updatedAt: string;
  supplierCandidates: SupplierCandidate[];
  communications: RfqCommunication[];
  quotationResponses: QuotationResponse[];
}

export interface ProcurementIntent {
  product: string;
  location?: string;
  constraints: Record<string, any>;
  supplierCount?: number;
  isProcurementIntent: boolean;
  confidence: number;
}

export interface DiscoveryMeta {
  webSearchEnabled: boolean;
  webSearchQuery?: string;
  internalCount: number;
  webCount: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createProcurementRequest(prompt: string): Promise<{
  request: ProcurementRequest;
  intent: ProcurementIntent;
  candidatesCount: number;
  discovery: DiscoveryMeta;
}> {
  return apiPost('/api/v1/procurement/requests', { prompt });
}

export interface ProcurementConfigCheck {
  email: { configured: boolean; reachable: boolean; from: string | null; hint: string | null };
  whatsapp: { configured: boolean; from: string | null; hint: string | null };
  openai: { configured: boolean; model: string; hint: string | null };
  webSearch: { configured: boolean; hint: string | null };
}

export async function checkProcurementConfig(): Promise<ProcurementConfigCheck> {
  return apiGet('/api/v1/procurement/config/check');
}

export async function updateCandidateContact(
  candidateId: string,
  contact: { contactEmail?: string; contactPhone?: string; contactWhatsapp?: string }
): Promise<{ candidate: SupplierCandidate }> {
  return apiPost(`/api/v1/procurement/candidates/${candidateId}/contact`, contact);
}

export async function listProcurementRequests(): Promise<{ requests: ProcurementRequest[] }> {
  return apiGet('/api/v1/procurement/requests');
}

export async function getProcurementRequest(id: string): Promise<{ request: ProcurementRequest }> {
  return apiGet(`/api/v1/procurement/requests/${id}`);
}

export async function updateRfqDraft(
  id: string,
  subject: string,
  body: string
): Promise<{ request: ProcurementRequest }> {
  return apiPost(`/api/v1/procurement/requests/${id}/rfq`, { subject, body });
}

export async function sendRfq(
  id: string,
  channel: 'email' | 'whatsapp' | 'both',
  candidateIds?: string[]
): Promise<{ sent: number; failed: number; details: any[] }> {
  return apiPost(`/api/v1/procurement/requests/${id}/send`, { channel, candidateIds });
}

export async function updateRequestStatus(
  id: string,
  status: ProcurementStatus
): Promise<{ request: ProcurementRequest }> {
  return apiPost(`/api/v1/procurement/requests/${id}/status`, { status });
}

export async function awardQuotation(
  requestId: string,
  quotationId: string
): Promise<{ success: boolean }> {
  return apiPost(`/api/v1/procurement/requests/${requestId}/award/${quotationId}`, {});
}

export async function toggleCandidateSelection(
  candidateId: string,
  isSelected: boolean
): Promise<{ candidate: SupplierCandidate }> {
  return apiPost(`/api/v1/procurement/candidates/${candidateId}/select`, { isSelected });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ProcurementStatus, string> = {
  draft: 'Draft',
  searching: 'Searching',
  rfq_sent: 'RFQ Sent',
  evaluating: 'Evaluating',
  awarded: 'Awarded',
  closed: 'Closed',
};

export const STATUS_COLORS: Record<ProcurementStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  searching: 'bg-blue-100 text-blue-700',
  rfq_sent: 'bg-yellow-100 text-yellow-700',
  evaluating: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-500',
};
