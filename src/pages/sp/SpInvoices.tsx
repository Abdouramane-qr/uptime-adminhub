import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Download, CalendarIcon, DollarSign, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useSpOnboardingDraft } from "@/hooks/useSpOnboardingDraft";
import { listBillingInvoices, listServiceRequests, type BillingStatus } from "@/lib/adminPortalClient";
import { exportCSV, exportPDF } from "@/lib/export";
import { toast } from "@/hooks/use-toast";
import DataSourceBadge from "@/components/DataSourceBadge";

type InvoiceStatus = Extract<BillingStatus, "paid" | "pending" | "overdue" | "cancelled">;

interface Invoice {
  id: string;
  client: string;
  interventionId: string;
  amount: number;
  commission: number;
  issued: string;
  due: string;
  status: InvoiceStatus;
}

const statusStyles: Record<InvoiceStatus, { dot: string; bg: string; text: string }> = {
  paid: { dot: "bg-success", bg: "bg-success/10", text: "text-success" },
  pending: { dot: "bg-accent", bg: "bg-accent/10", text: "text-accent" },
  overdue: { dot: "bg-destructive", bg: "bg-destructive/10", text: "text-destructive" },
  cancelled: { dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground" },
};

const normalize = (value: string | undefined | null) => String(value || "").trim().toLowerCase();

const SpInvoices = () => {
  const { user } = useAuth();
  const { detail, loading, error } = useSpOnboardingDraft();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [apiBacked, setApiBacked] = useState(false);

  const providerId = user?.id || "";
  const providerName = detail?.onboarding?.company_name || "";

  const loadInvoices = useCallback(async () => {
    if (!providerId) {
      setInvoices([]);
      setLoadingInvoices(false);
      setApiBacked(false);
      return;
    }

    setLoadingInvoices(true);
    try {
      const [payload, requests] = await Promise.all([listBillingInvoices(), listServiceRequests()]);
      const requestIds = new Set(
        requests
          .filter((row) => String(row.assigned_provider_id || "").trim() === providerId)
          .map((row) => row.id),
      );
      const scoped = payload.items
        .filter((item) => {
          const invoiceProviderId = String(item.provider_id || "").trim();
          if (invoiceProviderId) {
            return invoiceProviderId === providerId;
          }
          return requestIds.has(String(item.intervention_id || ""));
        })
        .map((item): Invoice => {
          const amount = Number(item.amount ?? 0) || 0;
          const commission = Number(item.commission ?? 0) || 0;
          const issued = item.date || new Date().toISOString().slice(0, 10);
          const dueDate = new Date(issued);
          dueDate.setDate(dueDate.getDate() + 15);

          return {
            id: item.id,
            client: item.client || "Client",
            interventionId: item.intervention_id || "N/A",
            amount,
            commission,
            issued,
            due: dueDate.toISOString().slice(0, 10),
            status: (item.status as InvoiceStatus) || "pending",
          };
        });

      setInvoices(scoped);
      setApiBacked(true);
    } catch (err) {
      console.error("Failed to load SP invoices:", err);
      setInvoices([]);
      setApiBacked(false);
      toast({
        title: "Invoices unavailable",
        description: String((err as { message?: string })?.message || "Unable to load provider invoices."),
        variant: "destructive",
      });
    } finally {
      setLoadingInvoices(false);
    }
  }, [providerId]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const issuedDate = new Date(invoice.issued);
      const matchSearch =
        invoice.id.toLowerCase().includes(search.toLowerCase()) ||
        invoice.client.toLowerCase().includes(search.toLowerCase()) ||
        invoice.interventionId.toLowerCase().includes(search.toLowerCase());
      const matchFrom = !dateFrom || issuedDate >= dateFrom;
      const matchTo = !dateTo || issuedDate <= dateTo;
      return matchSearch && matchFrom && matchTo;
    });
  }, [dateFrom, dateTo, invoices, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, invoice) => {
        if (invoice.status === "paid") acc.paid += invoice.amount - invoice.commission;
        if (invoice.status === "pending") acc.pending += invoice.amount;
        if (invoice.status === "overdue") acc.overdue += invoice.amount;
        return acc;
      },
      { paid: 0, pending: 0, overdue: 0 },
    );
  }, [filtered]);

  const handleExportCSV = () => {
    exportCSV(
      filtered.map((invoice) => ({
        Invoice: invoice.id,
        Client: invoice.client,
        Intervention: invoice.interventionId,
        Amount: invoice.amount.toFixed(2),
        Commission: invoice.commission.toFixed(2),
        Issued: invoice.issued,
        Due: invoice.due,
        Status: invoice.status,
      })),
      "sp-invoices",
    );
    toast({ title: "CSV export", description: "Invoices exported to CSV." });
  };

  const handleExportPDF = () => {
    exportPDF(
      `Invoices - ${providerName}`,
      ["Invoice", "Client", "Intervention", "Amount", "Commission", "Issued", "Due", "Status"],
      filtered.map((invoice) => [
        invoice.id,
        invoice.client,
        invoice.interventionId,
        invoice.amount.toFixed(2),
        invoice.commission.toFixed(2),
        invoice.issued,
        invoice.due,
        invoice.status,
      ]),
      "sp-invoices",
    );
    toast({ title: "PDF export", description: "Invoices exported to PDF." });
  };

  if (loading || loadingInvoices) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  if (error) {
    return <EmptyState title="Invoices unavailable" description={error} />;
  }

  if (!detail?.onboarding) {
    return <EmptyState title="No SP record" description="Complete the onboarding flow before viewing invoices." />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span>{providerName}</span>
              <DataSourceBadge backend={apiBacked} fallbackAllowed={false} />
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="h-9 pl-9 pr-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-56"
            />
          </div>
          <DatePicker label="From" date={dateFrom} onChange={setDateFrom} />
          <DatePicker label="To" date={dateTo} onChange={setDateTo} />
          <button onClick={handleExportCSV} className="h-9 px-4 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button onClick={handleExportPDF} className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Paid", amount: totals.paid, color: "text-success", bg: "bg-success/10" },
          { title: "Pending", amount: totals.pending, color: "text-accent", bg: "bg-accent/10" },
          { title: "Overdue", amount: totals.overdue, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((card) => (
          <div key={card.title} className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.bg}`}>
              <DollarSign className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className={`text-xl font-bold ${card.color}`}>{card.amount.toLocaleString()} XOF</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No invoices found" description="No provider invoice matches your filters." actionLabel="Clear filters" onAction={() => { setSearch(""); setDateFrom(undefined); setDateTo(undefined); }} />
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Invoice #", "Client", "Intervention", "Amount", "Commission", "Issued", "Due Date", "Status"].map((header) => (
                    <th key={header} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{invoice.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{invoice.client}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.interventionId}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{invoice.amount.toLocaleString()} XOF</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.commission.toLocaleString()} XOF</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{invoice.issued}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{invoice.due}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[invoice.status].bg} ${statusStyles[invoice.status].text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[invoice.status].dot}`} />
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const DatePicker = ({ label, date, onChange }: { label: string; date?: Date; onChange: (d?: Date) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className={cn("h-9 px-3 rounded-lg border border-input bg-card text-sm flex items-center gap-2", date ? "text-foreground" : "text-muted-foreground")}>
        <CalendarIcon className="h-3.5 w-3.5" />
        {date ? format(date, "MMM d, yyyy") : label}
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={date} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
    </PopoverContent>
  </Popover>
);

export default SpInvoices;
