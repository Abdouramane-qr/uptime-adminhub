import { supabase } from "@/integrations/supabase/client";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface AdminPortalError extends Error {
  code?: "unauthorized" | "admin_required" | "admin_portal_error";
  httpStatus?: number;
}

function createApiError(message: string, opts: { code?: AdminPortalError["code"]; httpStatus?: number } = {}): AdminPortalError {
  const err = new Error(message) as AdminPortalError;
  err.code = opts.code;
  err.httpStatus = opts.httpStatus;
  return err;
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    throw createApiError("Session expirée. Veuillez vous reconnecter.", { code: "unauthorized", httpStatus: 401 });
  }
  return token;
}

export async function callAdminPortal<T = unknown>(
  path: string,
  opts: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const token = await getAccessToken();
  const baseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const endpoint = `${baseUrl}/functions/v1/admin-portal${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(endpoint, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const payload = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw createApiError(payload?.error || "Session expirée.", { code: "unauthorized", httpStatus: 401 });
  }
  if (res.status === 403) {
    throw createApiError(payload?.error || "Accès admin requis.", { code: "admin_required", httpStatus: 403 });
  }
  if (!res.ok || payload?.ok === false) {
    throw createApiError(payload?.message || payload?.error || `Erreur admin-portal (${res.status})`, {
      code: "admin_portal_error",
      httpStatus: res.status,
    });
  }

  return payload as T;
}

export interface TenantDTO {
  id: string;
  company?: string;
  company_name?: string;
  type?: string;
  tenant_type?: string;
  email?: string;
  owner_email?: string;
  phone?: string;
  registration_number?: string;
  reg_number?: string;
  submitted_at?: string;
  created_at?: string;
  status?: string;
}

export interface ServiceRequestDTO {
  id: string;
  client?: string;
  client_name?: string;
  fleet_manager?: string;
  location?: string;
  address?: string;
  lat?: number | string;
  lng?: number | string;
  pickup_lat?: number | string;
  pickup_lng?: number | string;
  type?: string;
  service_type?: string;
  status?: string;
  created_at?: string;
  assigned_provider?: string;
  provider_name?: string;
  urgency?: string;
}

export interface ProviderPresenceDTO {
  id?: string;
  provider_id?: string;
  name?: string;
  display_name?: string;
  status?: string;
  is_available?: boolean;
  lat?: number | string;
  lng?: number | string;
  phone?: string;
  updated_at?: string;
}

export type BillingStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface BillingInvoiceDTO {
  id: string;
  date?: string;
  client?: string;
  provider?: string;
  intervention_id?: string;
  amount?: number | string;
  commission?: number | string;
  status?: BillingStatus | string;
}

export interface BillingTotalsDTO {
  paid_revenue?: number | string;
  commissions?: number | string;
  pending_amount?: number | string;
}

export interface TechnicianDTO {
  id?: string;
  name?: string;
  provider?: string;
  status?: "online" | "offline" | "on_job" | string;
  phone?: string;
  location?: string;
  completed_interventions?: number;
  rating?: number;
  specialties?: string[];
  current_mission?: string;
  joined_at?: string;
}

export interface AuditLogDTO {
  id: string;
  date?: string;
  actor?: string;
  action?: "assign" | "status_change" | "create" | "delete" | "update" | "login" | string;
  description?: string;
  target?: string;
}

export async function listTenants(): Promise<TenantDTO[]> {
  const payload = await callAdminPortal<{ items?: TenantDTO[]; tenants?: TenantDTO[] }>("/tenants");
  return payload.items || payload.tenants || [];
}

export async function createAccount(body: Record<string, unknown>): Promise<unknown> {
  return callAdminPortal("/accounts", { method: "POST", body });
}

export async function updateTenant(id: string, body: Record<string, unknown>): Promise<unknown> {
  return callAdminPortal(`/tenants/${id}`, { method: "PATCH", body });
}

export async function deleteTenant(id: string): Promise<unknown> {
  return callAdminPortal(`/tenants/${id}`, { method: "DELETE" });
}

export async function listServiceRequests(): Promise<ServiceRequestDTO[]> {
  const payload = await callAdminPortal<{ items?: ServiceRequestDTO[]; service_requests?: ServiceRequestDTO[] }>(
    "/service-requests",
  );
  return payload.items || payload.service_requests || [];
}

export async function updateServiceRequestStatus(
  id: string,
  body: { status: string; assigned_provider?: string } | Record<string, unknown>,
): Promise<unknown> {
  return callAdminPortal(`/service-requests/${id}/status`, { method: "PATCH", body });
}

export async function createServiceRequest(body: Record<string, unknown>): Promise<unknown> {
  return callAdminPortal("/service-requests", { method: "POST", body });
}

export async function listProviderPresence(): Promise<ProviderPresenceDTO[]> {
  const payload = await callAdminPortal<{ items?: ProviderPresenceDTO[]; providers?: ProviderPresenceDTO[] }>(
    "/provider-presence",
  );
  return payload.items || payload.providers || [];
}

export async function listBillingInvoices(): Promise<{ items: BillingInvoiceDTO[]; totals?: BillingTotalsDTO }> {
  const payload = await callAdminPortal<{
    items?: BillingInvoiceDTO[];
    invoices?: BillingInvoiceDTO[];
    totals?: BillingTotalsDTO;
  }>("/billing/invoices");
  return {
    items: payload.items || payload.invoices || [],
    totals: payload.totals,
  };
}

export async function listTechnicians(): Promise<TechnicianDTO[]> {
  const payload = await callAdminPortal<{ items?: TechnicianDTO[]; technicians?: TechnicianDTO[] }>("/technicians");
  return payload.items || payload.technicians || [];
}

export async function listAuditLogs(): Promise<AuditLogDTO[]> {
  const payload = await callAdminPortal<{ items?: AuditLogDTO[]; logs?: AuditLogDTO[] }>("/audit-logs");
  return payload.items || payload.logs || [];
}
