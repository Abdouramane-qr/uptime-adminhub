import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  callAdminPortal,
  createAccount,
  createServiceRequest,
  deleteTenant,
  listAuditLogs,
  listBillingInvoices,
  listProviderPresence,
  listServiceRequests,
  listTechnicians,
  listTenants,
  updateServiceRequestStatus,
  updateTenant,
} from "@/lib/adminPortalClient";

const { getSessionMock } = vi.hoisted(() => {
  const getSessionMock = vi.fn();
  return { getSessionMock };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}));

describe("adminPortalClient", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo-project.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "demo-anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws unauthorized when session token is missing", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    await expect(callAdminPortal("/tenants")).rejects.toMatchObject({
      code: "unauthorized",
      httpStatus: 401,
    });
  });

  it("throws admin_required on 403 response", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "token-403" } } });
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: "forbidden" }),
    } as Response);

    await expect(callAdminPortal("/dashboard")).rejects.toMatchObject({
      code: "admin_required",
      httpStatus: 403,
    });
  });

  it("returns payload on success", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "token-ok" } } });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, items: [{ id: "t1" }] }),
    } as Response);

    const out = await callAdminPortal<{ items: Array<{ id: string }> }>("/tenants");
    expect(out.items[0].id).toBe("t1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reads list wrappers for tenants/service_requests/provider_presence", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "token-lists" } } });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ tenants: [{ id: "tenant-1" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ service_requests: [{ id: "sr-1" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ providers: [{ provider_id: "p-1" }] }),
      } as Response);

    const tenants = await listTenants();
    const requests = await listServiceRequests();
    const providers = await listProviderPresence();

    expect(tenants[0].id).toBe("tenant-1");
    expect(requests[0].id).toBe("sr-1");
    expect(providers[0].provider_id).toBe("p-1");
  });

  it("reads list wrappers for billing/technicians/audit_logs", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "token-new-lists" } } });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [{ id: "INV-1" }], totals: { paid_revenue: 100 } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ technicians: [{ id: "T1", name: "Tech" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ logs: [{ id: "LOG-1", action: "update" }] }),
      } as Response);

    const billing = await listBillingInvoices();
    const technicians = await listTechnicians();
    const logs = await listAuditLogs();

    expect(billing.items[0].id).toBe("INV-1");
    expect(billing.totals?.paid_revenue).toBe(100);
    expect(technicians[0].id).toBe("T1");
    expect(logs[0].id).toBe("LOG-1");
  });

  it("calls Supabase edge function endpoints with auth headers", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "token-endpoint-check" } } });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      } as Response);

    await listBillingInvoices();
    await listTechnicians();
    await listAuditLogs();

    expect(fetch).toHaveBeenCalledTimes(3);

    const [billingUrl, billingInit] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const [techniciansUrl] = vi.mocked(fetch).mock.calls[1] as [string, RequestInit];
    const [auditUrl] = vi.mocked(fetch).mock.calls[2] as [string, RequestInit];

    expect(billingUrl).toBe("https://demo-project.supabase.co/functions/v1/admin-portal/billing/invoices");
    expect(techniciansUrl).toBe("https://demo-project.supabase.co/functions/v1/admin-portal/technicians");
    expect(auditUrl).toBe("https://demo-project.supabase.co/functions/v1/admin-portal/audit-logs");

    expect((billingInit.headers as Record<string, string>).Authorization).toBe("Bearer token-endpoint-check");
    expect((billingInit.headers as Record<string, string>).apikey).toBe("demo-anon-key");
  });

  it("keeps legacy migrated endpoints wired to Supabase edge functions", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "token-legacy-check" } } });

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response);

    await listTenants();
    await listServiceRequests();
    await listProviderPresence();
    await createAccount({ company_name: "A" });
    await updateTenant("tenant-1", { status: "approved" });
    await deleteTenant("tenant-1");
    await createServiceRequest({ service_type: "remorquage" });
    await updateServiceRequestStatus("sr-1", { status: "assigned", assigned_provider: "provider-a" });

    const urls = vi.mocked(fetch).mock.calls.map(([url]) => url as string);
    expect(urls).toEqual([
      "https://demo-project.supabase.co/functions/v1/admin-portal/tenants",
      "https://demo-project.supabase.co/functions/v1/admin-portal/service-requests",
      "https://demo-project.supabase.co/functions/v1/admin-portal/provider-presence",
      "https://demo-project.supabase.co/functions/v1/admin-portal/accounts",
      "https://demo-project.supabase.co/functions/v1/admin-portal/tenants/tenant-1",
      "https://demo-project.supabase.co/functions/v1/admin-portal/tenants/tenant-1",
      "https://demo-project.supabase.co/functions/v1/admin-portal/service-requests",
      "https://demo-project.supabase.co/functions/v1/admin-portal/service-requests/sr-1/status",
    ]);

    const postCall = vi.mocked(fetch).mock.calls[3] as [string, RequestInit];
    const patchCall = vi.mocked(fetch).mock.calls[4] as [string, RequestInit];
    const deleteCall = vi.mocked(fetch).mock.calls[5] as [string, RequestInit];

    expect(postCall[1].method).toBe("POST");
    expect(patchCall[1].method).toBe("PATCH");
    expect(deleteCall[1].method).toBe("DELETE");

    for (const [, init] of vi.mocked(fetch).mock.calls as Array<[string, RequestInit]>) {
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer token-legacy-check");
      expect(headers.apikey).toBe("demo-anon-key");
    }
  });

  it("normalizes Supabase base URL and request headers by method/body", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "token-normalize" } } });
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo-project.supabase.co/");

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response);

    await callAdminPortal("/tenants");
    await callAdminPortal("/accounts", { method: "POST", body: { company_name: "ACME" } });

    const [getUrl, getInit] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const [postUrl, postInit] = vi.mocked(fetch).mock.calls[1] as [string, RequestInit];

    expect(getUrl).toBe("https://demo-project.supabase.co/functions/v1/admin-portal/tenants");
    expect(postUrl).toBe("https://demo-project.supabase.co/functions/v1/admin-portal/accounts");

    const getHeaders = getInit.headers as Record<string, string>;
    const postHeaders = postInit.headers as Record<string, string>;

    expect(getInit.method).toBe("GET");
    expect(getHeaders["Content-Type"]).toBeUndefined();

    expect(postInit.method).toBe("POST");
    expect(postHeaders["Content-Type"]).toBe("application/json");
    expect(postInit.body).toBe(JSON.stringify({ company_name: "ACME" }));
  });
});
