import { useEffect, useMemo, useState } from "react";
import { Activity, Clock, Users, Zap } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/hooks/useLanguage";
import {
  getDashboardCounts,
  listServiceRequests,
  listTenants,
  type DashboardCountsDTO,
  type ServiceRequestDTO,
} from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";

type KPI = { label: string; value: string; icon: React.ElementType };

const Dashboard = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const [apiBacked, setApiBacked] = useState(false);
  const [counts, setCounts] = useState<DashboardCountsDTO>({});
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestDTO[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, requests, tenants] = await Promise.all([
          getDashboardCounts(),
          listServiceRequests(),
          listTenants(),
        ]);
        setCounts({
          providers: dashboard.providers ?? tenants.filter((tnt) => String(tnt.tenant_type || tnt.type || "").includes("service")).length,
          jobsLive: dashboard.jobsLive ?? requests.filter((r) => !["completed", "cancelled"].includes(String(r.status || "").toLowerCase())).length,
          customers: dashboard.customers ?? tenants.filter((tnt) => String(tnt.tenant_type || tnt.type || "").includes("fleet")).length,
          alerts: dashboard.alerts ?? requests.filter((r) => String(r.status || "").toLowerCase() === "pending").length,
        });
        setServiceRequests(requests);
        setApiBacked(true);
      } catch {
        setApiBacked(false);
        reportFallbackHit("Dashboard");
        if (!allowFallback) {
          setCounts({});
          setServiceRequests([]);
        }
      }
    };

    void load();
  }, [allowFallback]);

  const kpis: KPI[] = [
    { label: t("dashboard.total_accounts"), value: String((counts.providers || 0) + (counts.customers || 0)), icon: Users },
    { label: t("dashboard.pending"), value: String(counts.alerts || 0), icon: Clock },
    { label: t("dashboard.active_interventions"), value: String(counts.jobsLive || 0), icon: Zap },
    { label: t("dashboard.active_providers"), value: String(counts.providers || 0), icon: Activity },
  ];

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    serviceRequests.forEach((r) => {
      const key = r.created_at ? String(r.created_at).slice(0, 10) : "";
      if (!key) return;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([day, value]) => ({ day: day.slice(5), value }));
  }, [serviceRequests]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("dashboard.greeting")}</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <span>{t("dashboard.subtitle")}</span>
          <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t("dashboard.interventions")}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
