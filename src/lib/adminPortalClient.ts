import { supabase } from "@/integrations/supabase/client";
import { clearCachedSession, getCachedSession, setCachedSession } from "@/lib/authSession";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type ApiPayload = Record<string, unknown> | null;

export class AdminPortalError extends Error {
  constructor(
    message: string,
    public code?: "unauthorized" | "admin_required" | "admin_portal_error",
    public httpStatus?: number
  ) {
    super(message);
    this.name = "AdminPortalError";
  }
}

function createApiError(
  message: string,
  opts: { code?: AdminPortalError["code"]; httpStatus?: number } = {}
): AdminPortalError {
  return new AdminPortalError(message, opts.code, opts.httpStatus);
}

let refreshPromise: Promise<string | null> | null = null;
let signOutPromise: Promise<void> | null = null;
let sessionMarkedInvalid = false;

function getRuntimeConfig() {
  const baseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw createApiError("Configuration Supabase manquante.", {
      code: "admin_portal_error",
      httpStatus: 500,
    });
  }

  return { baseUrl, anonKey };
}

function buildFunctionUrl(functionName: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getRuntimeConfig().baseUrl}/functions/v1/${functionName}${normalizedPath}`;
}

function shouldRefreshSession(session: { expires_at?: number | null }): boolean {
  const expiresAt = session.expires_at;
  if (!expiresAt) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const refreshBufferSeconds = 90;
  return expiresAt - now <= refreshBufferSeconds;
}

async function parsePayload(res: Response): Promise<ApiPayload> {
  const contentType = res.headers?.get?.("content-type") || "";

  if (contentType.includes("application/json") || typeof res.json === "function") {
    return (await res.json().catch(() => null)) as ApiPayload;
  }

  if (typeof res.text !== "function") {
    return null;
  }

  const raw = await res.text().catch(() => "");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ApiPayload;
  } catch {
    return { message: raw };
  }
}

function getErrorMessage(payload: ApiPayload, fallback: string): string {
  if (!payload) {
    return fallback;
  }

  const message = payload.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  const error = payload.error;
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  const description = payload.error_description;
  if (typeof description === "string" && description.trim()) {
    return description;
  }

  return fallback;
}

function isJwtError(payload: ApiPayload): boolean {
  if (!payload) {
    return false;
  }

  const parts = [payload.message, payload.error, payload.error_description]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  return parts.some(
    (value) =>
      value.includes("invalid jwt") ||
      value.includes("jwt expired") ||
      value.includes("invalid token") ||
      value.includes("invalid signature") ||
      value.includes("unauthorized"),
  );
}

function isJwtLikeToken(token: string | null | undefined): token is string {
  return typeof token === "string" && token.split(".").length === 3;
}

async function invalidateSession(reason: string): Promise<void> {
  if (sessionMarkedInvalid) {
    if (signOutPromise) {
      await signOutPromise;
    }
    return;
  }

  sessionMarkedInvalid = true;
  signOutPromise = (async () => {
    console.error("[Auth] Invalid session detected. Clearing local session.", { reason });
    clearCachedSession();
    await supabase.auth.signOut();
  })().finally(() => {
    signOutPromise = null;
  });

  return signOutPromise;
}

/**
 * Retrieves a valid access token and proactively refreshes it before expiry.
 */
async function getValidToken(): Promise<string | null> {
  const cachedSession = getCachedSession();
  if (cachedSession?.access_token) {
    if (!isJwtLikeToken(cachedSession.access_token)) {
      console.error("[Auth] Malformed cached access token.");
      await invalidateSession("malformed_cached_token");
      return null;
    }

    sessionMarkedInvalid = false;
    if (shouldRefreshSession(cachedSession)) {
      return forceRefreshSession();
    }

    return cachedSession.access_token;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[Auth] Error getting session:", error);
    return null;
  }

  if (!session?.access_token) {
    return null;
  }

  if (!isJwtLikeToken(session.access_token)) {
    console.error("[Auth] Malformed access token in session storage.");
    await invalidateSession("malformed_session_token");
    return null;
  }

  sessionMarkedInvalid = false;
  setCachedSession(session);

  if (shouldRefreshSession(session)) {
    return forceRefreshSession();
  }

  return session.access_token;
}

/**
 * Ensures only one refresh call is in flight even when many requests fail at once.
 */
async function forceRefreshSession(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error || !session) {
        console.error("[Auth] Refresh failed:", error?.message || "No session returned");
        return null;
      }

      if (!isJwtLikeToken(session.access_token)) {
        console.error("[Auth] Refresh returned malformed access token.");
        await invalidateSession("malformed_refresh_token");
        return null;
      }

      sessionMarkedInvalid = false;
      setCachedSession(session);
      return session.access_token;
    } catch (err) {
      console.error("[Auth] Unexpected refresh error:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function callAdminPortal<T = unknown>(
  path: string,
  opts: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  return callSupabaseFunction<T>("admin-portal", path, opts);
}

export async function callSupabaseFunction<T = unknown>(
  functionName: string,
  path: string,
  opts: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const endpoint = buildFunctionUrl(functionName, path);
  const { anonKey } = getRuntimeConfig();

  const makeRequest = async (authToken: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${authToken}`,
      apikey: anonKey,
      "X-Client-Info": "uptime-adminhub",
    };

    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    try {
      return await fetch(endpoint, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (error) {
      console.error("[API] Network error while calling edge function.", { endpoint, error });
      throw createApiError("Erreur reseau lors de l'appel admin-portal.", {
        code: "admin_portal_error",
        httpStatus: 0,
      });
    }
  };

  let token = await getValidToken();
  if (!token) {
    token = await forceRefreshSession();
  }

  if (!token) {
    await invalidateSession("missing_session");
    throw createApiError("Session expiree. Veuillez vous reconnecter.", {
      code: "unauthorized",
      httpStatus: 401,
    });
  }

  let res = await makeRequest(token);
  let payload = await parsePayload(res);

  if (res.status === 401) {
    const refreshedToken = await forceRefreshSession();

    if (refreshedToken && refreshedToken !== token) {
      res = await makeRequest(refreshedToken);
      payload = await parsePayload(res);
    }
  }

  if (res.status === 401) {
    if (isJwtError(payload)) {
      await invalidateSession("invalid_jwt");
    }

    throw createApiError(getErrorMessage(payload, "Session expiree."), {
      code: "unauthorized",
      httpStatus: 401,
    });
  }

  if (res.status === 403) {
    throw createApiError(getErrorMessage(payload, "Acces admin requis."), {
      code: "admin_required",
      httpStatus: 403,
    });
  }

  if (!res.ok || payload?.ok === false) {
    throw createApiError(getErrorMessage(payload, `Erreur admin-portal (${res.status})`), {
      code: "admin_portal_error",
      httpStatus: res.status,
    });
  }

  return (payload ?? {}) as T;
}

// --- DTOs ---

export interface TenantDTO {
  id: string;
  name?: string;
  code?: string;
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
  user_id?: string;
  customer_user_id?: string;
  customer_name?: string;
  customer_tenant_id?: string;
  customer_tenant_name?: string;
  customer_email?: string;
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
  assigned_provider_id?: string;
  assigned_provider_name?: string;
  assigned_provider_email?: string;
  assigned_provider_tenant_id?: string;
  assigned_provider_tenant_name?: string;
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

export interface ServiceRequestStatusUpdateBody {
  status: string;
  assigned_provider_id?: string | null;
}

export interface CreateServiceRequestBody {
  service_type: string;
  breakdown_details?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  customer_user_id?: string | null;
  customer_tenant_id?: string | null;
  assigned_provider_id?: string | null;
  status?: "pending" | "assigned";
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
  provider_id?: string;
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

export interface DashboardCountsDTO {
  providers?: number;
  jobsLive?: number;
  customers?: number;
  alerts?: number;
}

export interface NotificationDTO {
  id: string;
  user_id?: string;
  type?: string;
  title?: string;
  body?: string;
  payload?: Record<string, unknown>;
  read_at?: string;
  created_at?: string;
}

export interface ChatMessageDTO {
  id: string;
  request_id: string;
  sender_id: string;
  message_type: "text" | "audio";
  content?: string;
  media_url?: string;
  created_at: string;
}

export interface TeamMemberDTO {
  id?: string;
  full_name?: string;
  email?: string;
  role?: string;
  created_at?: string;
}

export interface OnboardingItemDTO {
  id: string;
  status?: string;
  account_type?: string;
  company_name?: string;
  created_at?: string;
}

// --- API Functions ---

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

export async function deleteServiceRequest(id: string): Promise<unknown> {
  return callAdminPortal(`/service-requests/${id}`, { method: "DELETE" });
}

export async function resetTenantOwnerPassword(id: string, newPassword: string): Promise<unknown> {
  return callAdminPortal(`/tenants/${id}/owner-password`, { method: "PATCH", body: { newPassword } });
}

export async function listTeamMembers(tenantId: string): Promise<TeamMemberDTO[]> {
  const payload = await callAdminPortal<{ items?: TeamMemberDTO[]; members?: TeamMemberDTO[] }>(
    `/tenants/${tenantId}/members`,
  );
  return payload.items || payload.members || [];
}

export async function addTeamMember(tenantId: string, body: { fullName: string; email: string }): Promise<unknown> {
  return callAdminPortal(`/tenants/${tenantId}/members`, { method: "POST", body });
}

export async function listServiceRequests(): Promise<ServiceRequestDTO[]> {
  const payload = await callAdminPortal<{ items?: ServiceRequestDTO[]; service_requests?: ServiceRequestDTO[] }>(
    "/service-requests",
  );
  return payload.items || payload.service_requests || [];
}

export async function updateServiceRequestStatus(
  id: string,
  body: ServiceRequestStatusUpdateBody | Record<string, unknown>,
): Promise<unknown> {
  return callAdminPortal(`/service-requests/${id}/status`, { method: "PATCH", body });
}

export async function createServiceRequest(body: CreateServiceRequestBody | Record<string, unknown>): Promise<unknown> {
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

export async function listNotifications(limit?: number): Promise<NotificationDTO[]> {
  const qp = new URLSearchParams();
  if (limit) qp.set("limit", String(limit));
  const path = qp.toString() ? `/notifications?${qp.toString()}` : "/notifications";
  const payload = await callAdminPortal<{ items?: NotificationDTO[]; notifications?: NotificationDTO[] }>(path);
  return payload.items || payload.notifications || [];
}

export async function getDashboardCounts(): Promise<DashboardCountsDTO> {
  const payload = await callAdminPortal<{ counts?: DashboardCountsDTO; items?: DashboardCountsDTO }>("/dashboard");
  return payload.counts || payload.items || {};
}

export async function listOnboardingQueue(params?: {
  status?: string;
  accountType?: string;
  q?: string;
}): Promise<OnboardingItemDTO[]> {
  const qp = new URLSearchParams();
  if (params?.status) qp.set("status", params.status);
  if (params?.accountType) qp.set("accountType", params.accountType);
  if (params?.q) qp.set("q", params.q);
  const path = qp.toString() ? `/onboarding?${qp.toString()}` : "/onboarding";
  const payload = await callSupabaseFunction<{ items?: OnboardingItemDTO[] }>("onboarding-crud", path);
  return payload.items || [];
}

export async function getOnboardingDetail(onboardingId: string): Promise<Record<string, unknown>> {
  return callSupabaseFunction("onboarding-crud", `/onboarding/${onboardingId}`);
}

export async function getCurrentOnboardingDetail(params?: {
  accountType?: string;
}): Promise<Record<string, unknown>> {
  const qp = new URLSearchParams();
  if (params?.accountType) qp.set("accountType", params.accountType);
  const path = qp.toString() ? `/onboarding/current?${qp.toString()}` : "/onboarding/current";
  return callSupabaseFunction("onboarding-crud", path);
}

export async function onboardingAction(
  onboardingId: string,
  action: "approve" | "reject" | "submit",
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return callSupabaseFunction("onboarding-crud", `/onboarding/${onboardingId}/${action}`, { method: "POST", body });
}

export async function updateOnboarding(
  onboardingId: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return callSupabaseFunction("onboarding-crud", `/onboarding/${onboardingId}`, { method: "PATCH", body });
}

export async function onboardingCreateResource(
  onboardingId: string,
  resource: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return callSupabaseFunction("onboarding-crud", `/onboarding/${onboardingId}/${resource}`, { method: "POST", body });
}

export async function onboardingUpdateResource(
  onboardingId: string,
  resource: string,
  itemId: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return callSupabaseFunction("onboarding-crud", `/onboarding/${onboardingId}/${resource}/${itemId}`, {
    method: "PATCH",
    body,
  });
}

export async function onboardingDeleteResource(
  onboardingId: string,
  resource: string,
  itemId: string,
): Promise<Record<string, unknown>> {
  return callSupabaseFunction("onboarding-crud", `/onboarding/${onboardingId}/${resource}/${itemId}`, {
    method: "DELETE",
  });
}

export async function listMessages(requestId: string): Promise<ChatMessageDTO[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as ChatMessageDTO[];
}

export async function sendChatMessage(requestId: string, content: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No user found");

  const { error } = await supabase.from("messages").insert({
    request_id: requestId,
    sender_id: user.id,
    message_type: "text",
    content,
  });

  if (error) throw error;
}

export function subscribeMessages(requestId: string, onMessage: () => void) {
  return supabase
    .channel(`chat_${requestId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` },
      () => onMessage(),
    )
    .subscribe();
}
