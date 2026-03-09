import { useEffect, useMemo, useState } from "react";
import { Activity, Download, Timer } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { exportCSV, exportPDF } from "@/lib/export";
import { toast } from "@/hooks/use-toast";
import { listServiceRequests, type ServiceRequestDTO } from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";

const Analytics = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const [apiBacked, setApiBacked] = useState(false);
  const [rows, setRows] = useState<ServiceRequestDTO[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = await listServiceRequests();
        setRows(requests);
        setApiBacked(true);
      } catch {
        setApiBacked(false);
        reportFallbackHit("Analytics");
        if (!allowFallback) setRows([]);
      }
    };
    void load();
  }, [allowFallback]);

  const daily = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const d = r.created_at ? String(r.created_at).slice(0, 10) : "";
      if (!d) return;
      counts.set(d, (counts.get(d) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, missions]) => ({ date: date.slice(5), missions }));
  }, [rows]);

  const completed = rows.filter((r) => String(r.status || "").toLowerCase() === "completed").length;
  const total = rows.length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const k = String(r.service_type || r.type || "N/A");
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [rows]);

  const handleExportCSV = () => {
    exportCSV(rows.map((r) => ({ id: r.id, status: r.status || "", type: r.service_type || r.type || "", created_at: r.created_at || "" })), "analytics-service-requests");
    toast({ title: t("analytics.csv_title"), description: t("analytics.csv_desc") });
  };

  const handleExportPDF = () => {
    exportPDF("Analytics - Service requests", ["ID", "Status", "Type", "Created at"], rows.map((r) => [r.id, String(r.status || ""), String(r.service_type || r.type || ""), String(r.created_at || "")]), "analytics-service-requests");
    toast({ title: t("analytics.pdf_title"), description: t("analytics.pdf_desc") });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("analytics.title")}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span>{t("analytics.subtitle")}</span>
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
          <p className="text-sm text-muted-foreground">{t("analytics.missions")}</p>
          <p className="text-3xl font-bold text-foreground">{total}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">{t("analytics.completed")}</p>
          <p className="text-3xl font-bold text-foreground">{completed}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">{t("analytics.success_rate")}</p>
          <p className="text-3xl font-bold text-foreground">{successRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />{t("analytics.daily_missions")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="missions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Timer className="h-4 w-4 text-primary" />{t("analytics.by_service_type")}</h3>
          <div className="space-y-3">
            {byType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.type}</span>
                <span className="text-sm font-semibold text-primary">{item.count}</span>
              </div>
            ))}
            {byType.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée backend disponible.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
