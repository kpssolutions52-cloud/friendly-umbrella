import { apiGet, apiPost, apiRequest, API_URL } from './api';

/** Import confirm sends full parsed rows + can insert many suppliers; default api timeout is 10s and is too low. */
const IMPORT_CONFIRM_TIMEOUT_MS = 180_000;

export type SupplierHubSourceType = 'excel' | 'manual' | 'web' | 'imported';
export type SupplierHubStatus = 'active' | 'inactive' | 'preferred' | 'blacklisted';

export interface SupplierHubContact {
  id: string;
  supplierHubEntryId: string;
  contactName?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  whatsappNumber?: string | null;
  designation?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierHubEntry {
  id: string;
  organizationId: string;
  category?: string | null;
  companyName: string;
  address?: string | null;
  trade?: string | null;
  remark?: string | null;
  sourceType: SupplierHubSourceType;
  status: SupplierHubStatus;
  isPreferred: boolean;
  isFavorite: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: SupplierHubContact[];
  completenessScore?: number;
  primaryContact?: SupplierHubContact | null;
}

export interface ListParams {
  q?: string;
  category?: string;
  trade?: string;
  status?: SupplierHubStatus;
  sourceType?: SupplierHubSourceType;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWhatsapp?: boolean;
  preferred?: boolean;
  country?: string;
  updatedSince?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
  sort?: 'updatedAt' | 'companyName' | 'createdAt';
  order?: 'asc' | 'desc';
}

function toQuery(p: ListParams): string {
  const u = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v === undefined || v === false || v === '') return;
    if (typeof v === 'boolean') {
      if (v) u.set(k, 'true');
      return;
    }
    u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : '';
}

export async function listSupplierHub(p: ListParams) {
  return apiGet<{ suppliers: SupplierHubEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/api/v1/supplier-hub/suppliers${toQuery(p)}`
  );
}

export async function getSupplierHub(id: string) {
  return apiGet<{ supplier: SupplierHubEntry & { activities?: any[] } }>(`/api/v1/supplier-hub/suppliers/${id}`);
}

export type CreateSupplierHubBody = Omit<Partial<SupplierHubEntry>, 'contacts'> & {
  contacts?: Partial<SupplierHubContact>[];
};

export async function createSupplierHub(body: CreateSupplierHubBody) {
  return apiPost<{ supplier: SupplierHubEntry }>(`/api/v1/supplier-hub/suppliers`, body);
}

export async function updateSupplierHub(id: string, body: Partial<SupplierHubEntry>) {
  return apiRequest<{ supplier: SupplierHubEntry }>(`/api/v1/supplier-hub/suppliers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function archiveSupplierHub(id: string) {
  return apiRequest(`/api/v1/supplier-hub/suppliers/${id}`, { method: 'DELETE' });
}

export async function previewImportSupplierHub(file: File) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const fd = new FormData();
  fd.append('file', file);
  const controller = new AbortController();
  const previewTimeout = setTimeout(() => controller.abort(), IMPORT_CONFIRM_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/v1/supplier-hub/import/preview`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
      signal: controller.signal,
    }).finally(() => clearTimeout(previewTimeout));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || res.statusText);
    }
    return res.json() as Promise<{
    preview: any[];
    headers: string[];
    warnings: string[];
    duplicateHints: { companyName: string; matches: { id: string; companyName: string }[] }[];
  }>;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Import preview timed out — try a smaller file or check your connection.');
    }
    throw e;
  }
}

export async function confirmImportSupplierHub(suppliers: any[], mode: 'create' | 'skip_duplicates') {
  return apiPost<{ created: number; skipped: number; errors: string[] }>(
    `/api/v1/supplier-hub/import/confirm`,
    { suppliers, mode },
    true,
    IMPORT_CONFIRM_TIMEOUT_MS
  );
}

export async function exportSupplierHubBlob(params: ListParams): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), IMPORT_CONFIRM_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/v1/supplier-hub/export${toQuery(params)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Export timed out — try filtering to fewer suppliers or retry.');
    }
    throw e;
  }
}

export async function upsertContactHub(supplierId: string, body: Partial<SupplierHubContact> & { id?: string }) {
  if (body.id) {
    return apiRequest<{ contact: SupplierHubContact }>(`/api/v1/supplier-hub/contacts/${body.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
  return apiPost<{ contact: SupplierHubContact }>(`/api/v1/supplier-hub/suppliers/${supplierId}/contacts`, body);
}

export async function deleteContactHub(contactId: string) {
  return apiRequest(`/api/v1/supplier-hub/contacts/${contactId}`, { method: 'DELETE' });
}
