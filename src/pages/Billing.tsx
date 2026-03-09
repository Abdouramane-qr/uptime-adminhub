import { useEffect, useMemo, useState } from "react";
import { Search, DollarSign, TrendingUp, FileText, CreditCard, Users, ArrowRight, CheckCircle2, Clock, AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { exportCSV, exportPDF } from "@/lib/export";
import { toast } from "@/hooks/use-toast";
import EmptyState from "@/components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { listBillingInvoices, type BillingStatus } from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";

type PaymentStatus = BillingStatus;

interface Invoice {
  id: string; date: string; client: string; provider: string;
  interventionId: string; amount: number; commission: number; status: PaymentStatus;
}

const mockInvoices: Invoice[] = [
  { id: "INV-0501", date: "2026-03-08", client: "Metro Fleet Co", provider: "AutoFix Pro", interventionId: "INT-0401", amount: 450, commission: 67.5, status: "pending" },
  { id: "INV-0500", date: "2026-03-07", client: "GreenHaul Logistics", provider: "QuickTow Services", interventionId: "INT-0400", amount: 280, commission: 42, status: "paid" },
  { id: "INV-0499", date: "2026-03-06", client: "CityDrive Fleet", provider: "RoadStar Repairs", interventionId: "INT-0399", amount: 620, commission: 93, status: "paid" },
  { id: "INV-0498", date: "2026-03-05", client: "TransLog SA", provider: "SpeedFix Mobile", interventionId: "INT-0398", amount: 350, commission: 52.5, status: "overdue" },
  { id: "INV-0497", date: "2026-03-04", client: "Express Delivery Co", provider: "FleetGuard Pro", interventionId: "INT-0397", amount: 180, commission: 27, status: "paid" },
  { id: "INV-0496", date: "2026-03-03", client: "NordFleet SARL", provider: "UrbanFix Paris", interventionId: "INT-0396", amount: 890, commission: 133.5, status: "paid" },
  { id: "INV-0495", date: "2026-03-02", client: "Metro Fleet Co", provider: "MecaPlus Services", interventionId: "INT-0395", amount: 420, commission: 63, status: "cancelled" },
  { id: "INV-0494", date: "2026-03-01", client: "GreenHaul Logistics", provider: "AutoFix Pro", interventionId: "INT-0394", amount: 560, commission: 84, status: "paid" },
];

const formatCurrency = (v: number) => `${v.toFixed(2)} €`;

const Billing = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "all">("all");
  const [invoices, setInvoices] = useState<Invoice[]>(allowFallback ? mockInvoices : []);
  const [apiBacked, setApiBacked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await listBillingInvoices();
        if (payload.items.length > 0) {
          const mapped = payload.items.map((r, idx): Invoice => {
            const amount = Number(r.amount ?? 0) || 0;
            return {
              id: r.id || `INV-${String(5000 + idx)}`,
              date: r.date || new Date().toISOString().slice(0, 10),
              client: r.client || "Client",
              provider: r.provider || "Provider",
              interventionId: r.intervention_id || "N/A",
              amount,
              commission: Number(r.commission ?? Number((amount * 0.15).toFixed(2))),
              status: (r.status as PaymentStatus) || "pending",
            };
          });
          setInvoices(mapped);
          setApiBacked(true);
        }
      } catch {
        // Keep mock fallback
        setApiBacked(false);
        if (!allowFallback) setInvoices([]);
      }
    };

    void load();
  }, [allowFallback]);

  const paymentStatusConfig: Record<PaymentStatus, { label: string; bg: string; text: string; dot: string }> = {
    paid: { label: t("billing.paid"), bg: "bg-success/10", text: "text-success", dot: "bg-success" },
    pending: { label: t("billing.pending"), bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
    overdue: { label: t("billing.overdue"), bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
    cancelled: { label: t("billing.cancelled"), bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  };

  const filtered = invoices.filter(i => {
    const matchSearch = i.id.toLowerCase().includes(search.toLowerCase()) || i.client.toLowerCase().includes(search.toLowerCase()) || i.provider.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = useMemo(() => invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0), [invoices]);
  const totalCommissions = useMemo(() => invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.commission, 0), [invoices]);
  const pendingAmount = useMemo(() => invoices.filter(i => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0), [invoices]);

  const providerEarnings = invoices
    .filter(i => i.status === "paid")
    .reduce((acc, inv) => {
      if (!acc[inv.provider]) acc[inv.provider] = { provider: inv.provider, total: 0, commissions: 0, count: 0 };
      acc[inv.provider].total += inv.amount - inv.commission;
      acc[inv.provider].commissions += inv.commission;
      acc[inv.provider].count += 1;
      return acc;
    }, {} as Record<string, { provider: string; total: number; commissions: number; count: number }>);

  const handleExportCSV = () => {
    const data = invoices.map(i => ({
      [t("billing.invoice_id")]: i.id, [t("billing.date")]: i.date, [t("billing.client")]: i.client,
      [t("billing.provider")]: i.provider, [t("billing.intervention")]: i.interventionId,
      [t("billing.amount")]: i.amount.toFixed(2), [t("billing.commission")]: i.commission.toFixed(2),
      [t("billing.status")]: paymentStatusConfig[i.status].label,
    }));
    exportCSV(data, "factures");
    toast({ title: t("billing.csv_title"), description: t("billing.csv_desc") });
  };

  const handleExportPDF = () => {
    const headers = [t("billing.invoice_id"), t("billing.date"), t("billing.client"), t("billing.provider"), t("billing.amount"), t("billing.commission"), t("billing.status")];
    const rows = invoices.map(i => [i.id, i.date, i.client, i.provider, `${i.amount.toFixed(2)} €`, `${i.commission.toFixed(2)} €`, paymentStatusConfig[i.status].label]);
    exportPDF("Factures — Fleet Rescue", headers, rows, "factures-rapport");
    toast({ title: t("billing.pdf_title"), description: t("billing.pdf_desc") });
  };

  const tableHeaders = [t("billing.invoice_id"), t("billing.date"), t("billing.client"), t("billing.provider"), t("billing.intervention"), t("billing.amount"), t("billing.commission"), t("billing.status")];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("billing.title")}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span>{t("billing.subtitle")}</span>
            <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleExportCSV}><Download className="h-3.5 w-3.5" /> CSV</Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleExportPDF}><Download className="h-3.5 w-3.5" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-success" /></div>
            <p className="text-sm text-muted-foreground">{t("billing.total_paid")}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <p className="text-sm text-muted-foreground">{t("billing.commissions")}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommissions)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div>
            <p className="text-sm text-muted-foreground">{t("billing.pending_amount")}</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList className="bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="invoices" className="rounded-lg text-xs data-[state=active]:bg-card">{t("billing.invoices")}</TabsTrigger>
          <TabsTrigger value="earnings" className="rounded-lg text-xs data-[state=active]:bg-card">{t("billing.provider_revenue")}</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("billing.search")}
                className="h-10 w-full pl-9 pr-4 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "paid", "pending", "overdue", "cancelled"] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                    filterStatus === s ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30"
                  )}>{s === "all" ? t("billing.all") : paymentStatusConfig[s].label}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title={t("billing.no_results")} description={t("billing.no_results_desc")} actionLabel={t("billing.reset")} onAction={() => { setSearch(""); setFilterStatus("all"); }} />
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {tableHeaders.map(h => <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(inv => {
                      const cfg = paymentStatusConfig[inv.status];
                      return (
                        <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 text-sm font-mono font-medium text-primary">{inv.id}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{inv.date}</td>
                          <td className="px-4 py-3.5 text-sm font-medium text-foreground">{inv.client}</td>
                          <td className="px-4 py-3.5 text-sm text-foreground">{inv.provider}</td>
                          <td className="px-4 py-3.5"><span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{inv.interventionId}</span></td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-foreground">{formatCurrency(inv.amount)}</td>
                          <td className="px-4 py-3.5 text-sm text-success font-medium">{formatCurrency(inv.commission)}</td>
                          <td className="px-4 py-3.5">
                            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg", cfg.bg, cfg.text)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />{cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length > 1 ? t("billing.count_plural") : t("billing.count")}</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {[t("billing.provider"), t("billing.col_paid_missions"), t("billing.col_net_revenue"), t("billing.col_commissions")].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(providerEarnings).map(e => (
                    <tr key={e.provider} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 text-sm font-medium text-foreground">{e.provider}</td>
                      <td className="px-4 py-3.5 text-sm text-foreground">{e.count}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-success">{formatCurrency(e.total)}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-primary">{formatCurrency(e.commissions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
