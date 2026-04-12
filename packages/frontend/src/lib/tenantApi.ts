/**
 * Legacy tenant API helpers — thin wrappers over the /auth/organizations endpoint.
 * The old /auth/tenants endpoint no longer exists; requests are forwarded here.
 */
import { apiGet } from './api';

export interface Tenant {
  id: string;
  name: string;
  type: string;
  email?: string | null;
}

/**
 * Fetch active organizations by type.
 * Note: 'service_provider' is not a supported type in the current schema;
 * it falls back to an empty list.
 */
export async function getActiveTenants(
  type: 'company' | 'supplier' | 'service_provider'
): Promise<{ tenants: Tenant[] }> {
  if (type === 'service_provider') {
    return { tenants: [] };
  }
  const data = await apiGet<{ organizations: Tenant[] }>(
    `/api/v1/auth/organizations?type=${type}`
  );
  return { tenants: data.organizations };
}
