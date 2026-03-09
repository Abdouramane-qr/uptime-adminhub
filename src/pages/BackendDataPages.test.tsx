import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Billing from "./Billing";
import Technicians from "./Technicians";
import AuditLogs from "./AuditLogs";

const {
  listBillingInvoicesMock,
  listTechniciansMock,
  listAuditLogsMock,
} = vi.hoisted(() => ({
  listBillingInvoicesMock: vi.fn(),
  listTechniciansMock: vi.fn(),
  listAuditLogsMock: vi.fn(),
}));

vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/lib/runtimeFlags", () => ({
  allowMockFallback: () => false,
}));

vi.mock("@/lib/adminPortalClient", () => ({
  listBillingInvoices: listBillingInvoicesMock,
  listTechnicians: listTechniciansMock,
  listAuditLogs: listAuditLogsMock,
}));

describe("Backend-linked pages", () => {
  beforeEach(() => {
    listBillingInvoicesMock.mockReset();
    listTechniciansMock.mockReset();
    listAuditLogsMock.mockReset();
  });

  it("renders billing rows from dedicated backend endpoint", async () => {
    listBillingInvoicesMock.mockResolvedValue({
      items: [
        {
          id: "INV-BE-1",
          date: "2026-03-09",
          client: "Backend Client",
          provider: "Backend Provider",
          intervention_id: "INT-BE-1",
          amount: 400,
          commission: 60,
          status: "paid",
        },
      ],
    });

    render(<Billing />);

    expect(await screen.findByText("INV-BE-1")).toBeInTheDocument();
    expect(screen.getByText("Backend Client")).toBeInTheDocument();
    expect(listBillingInvoicesMock).toHaveBeenCalledTimes(1);
  });

  it("renders technicians from dedicated backend endpoint", async () => {
    listTechniciansMock.mockResolvedValue([
      {
        id: "T-BE-1",
        name: "Tech Backend",
        provider: "Provider Backend",
        status: "online",
        phone: "+33 6 00 00 00 00",
        location: "Paris",
        completed_interventions: 12,
        rating: 4.7,
        specialties: ["Remorquage"],
      },
    ]);

    render(<Technicians />);

    expect(await screen.findByText("T-BE-1")).toBeInTheDocument();
    expect(screen.getByText("Tech Backend")).toBeInTheDocument();
    expect(listTechniciansMock).toHaveBeenCalledTimes(1);
  });

  it("renders audit logs from dedicated backend endpoint", async () => {
    listAuditLogsMock.mockResolvedValue([
      {
        id: "LOG-BE-1",
        date: "2026-03-09T09:00:00Z",
        actor: "Admin Backend",
        action: "update",
        description: "Backend audit event",
        target: "INT-BE-1",
      },
    ]);

    render(<AuditLogs />);

    expect(await screen.findByText("Backend audit event")).toBeInTheDocument();
    expect(screen.getByText("Admin Backend")).toBeInTheDocument();
    await waitFor(() => expect(listAuditLogsMock).toHaveBeenCalledTimes(1));
  });
});
