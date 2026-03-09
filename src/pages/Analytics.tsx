import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Clock, TrendingUp, CheckCircle2, Users, Activity, Zap,
  CalendarDays, MapPin, Timer, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportCSV, exportPDF } from "@/lib/export";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";

const missionsPerDay = [
  { date: "01 Mar", missions: 12, completed: 10 },
  { date: "02 Mar", missions: 18, completed: 16 },
  { date: "03 Mar", missions: 15, completed: 14 },
  { date: "04 Mar", missions: 22, completed: 19 },
  { date: "05 Mar", missions: 20, completed: 18 },
  { date: "06 Mar", missions: 28, completed: 25 },
  { date: "07 Mar", missions: 25, completed: 23 },
  { date: "08 Mar", missions: 16, completed: 14 },
];

const responseTimeData = [
  { date: "01 Mar", avgMinutes: 22 }, { date: "02 Mar", avgMinutes: 18 },
  { date: "03 Mar", avgMinutes: 25 }, { date: "04 Mar", avgMinutes: 15 },
  { date: "05 Mar", avgMinutes: 20 }, { date: "06 Mar", avgMinutes: 12 },
  { date: "07 Mar", avgMinutes: 17 }, { date: "08 Mar", avgMinutes: 19 },
];

const zoneData = [
  { zone: "Paris Centre", count: 45 }, { zone: "Paris Est", count: 32 },
  { zone: "Paris Ouest", count: 28 }, { zone: "Paris Nord", count: 22 },
  { zone: "Paris Sud", count: 18 }, { zone: "Banlieue", count: 11 },
];

const ZONE_COLORS = ["hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(152, 69%, 41%)", "hsl(38, 92%, 50%)", "hsl(199, 89%, 48%)", "hsl(0, 84%, 60%)"];

const topProviders = [
  { name: "UrbanFix Paris", missions: 301, rating: 4.95, avgTime: 14 },
  { name: "RoadStar Repairs", missions: 215, rating: 4.9, avgTime: 16 },
  { name: "MecaPlus Services", missions: 178, rating: 4.7, avgTime: 18 },
  { name: "AutoFix Pro", missions: 142, rating: 4.8, avgTime: 15 },
  { name: "QuickTow Services", missions: 89, rating: 4.6, avgTime: 22 },
];

const interventionsByType = [
  { type: "Remorquage", count: 38 }, { type: "Changement pneu", count: 29 },
  { type: "Batterie", count: 24 }, { type: "Diagnostic", count: 18 },
  { type: "Réparation moteur", count: 15 }, { type: "Assistance routière", count: 12 },
  { type: "Livraison carburant", count: 8 }, { type: "Ouverture", count: 6 },
];

const hourlyDistribution = [
  { hour: "06h", missions: 2 }, { hour: "07h", missions: 5 }, { hour: "08h", missions: 12 },
  { hour: "09h", missions: 18 }, { hour: "10h", missions: 15 }, { hour: "11h", missions: 10 },
  { hour: "12h", missions: 8 }, { hour: "13h", missions: 7 }, { hour: "14h", missions: 14 },
  { hour: "15h", missions: 16 }, { hour: "16h", missions: 13 }, { hour: "17h", missions: 19 },
  { hour: "18h", missions: 22 }, { hour: "19h", missions: 11 }, { hour: "20h", missions: 6 },
  { hour: "21h", missions: 3 },
];

const KPICard = ({ icon: Icon, label, value, subtext, trend, iconBg }: {
  icon: React.ElementType; label: string; value: string; subtext?: string;
  trend?: { value: string; positive: boolean }; iconBg: string;
}) => (
  <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", iconBg)}><Icon className="h-5 w-5" /></div>
      {trend && (
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const Analytics = () => {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const totalMissions = missionsPerDay.reduce((s, d) => s + d.missions, 0);
  const totalCompleted = missionsPerDay.reduce((s, d) => s + d.completed, 0);
  const successRate = Math.round((totalCompleted / totalMissions) * 100);
  const avgResponseTime = Math.round(responseTimeData.reduce((s, d) => s + d.avgMinutes, 0) / responseTimeData.length);
  const avgPerDay = Math.round(totalMissions / missionsPerDay.length);

  const handleExportCSV = () => {
    exportCSV(missionsPerDay.map(d => ({ ...d })), "analytics-missions");
    toast({ title: t("analytics.csv_title"), description: t("analytics.csv_desc") });
  };

  const handleExportPDF = () => {
    const headers = [t("common.date"), t("analytics.missions"), t("analytics.completed")];
    const rows = missionsPerDay.map(d => [d.date, String(d.missions), String(d.completed)]);
    exportPDF("Rapport Analytics — Fleet Rescue", headers, rows, "analytics-rapport");
    toast({ title: t("analytics.pdf_title"), description: t("analytics.pdf_desc") });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("analytics.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {(["7d", "30d", "90d"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all",
                  period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>{p === "7d" ? t("analytics.7_days") : p === "30d" ? t("analytics.30_days") : t("analytics.90_days")}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleExportCSV}><Download className="h-3.5 w-3.5" /> CSV</Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleExportPDF}><Download className="h-3.5 w-3.5" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Timer} label={t("analytics.avg_time")} value={`${avgResponseTime} min`} iconBg="bg-info/10 text-info" trend={{ value: "12%", positive: true }} />
        <KPICard icon={CalendarDays} label={t("analytics.missions_per_day")} value={String(avgPerDay)} subtext={`${totalMissions} ${t("analytics.this_week")}`} iconBg="bg-primary/10 text-primary" trend={{ value: "8%", positive: true }} />
        <KPICard icon={CheckCircle2} label={t("analytics.success_rate")} value={`${successRate}%`} subtext={`${totalCompleted}/${totalMissions} ${t("analytics.completed").toLowerCase()}`} iconBg="bg-success/10 text-success" trend={{ value: "3%", positive: true }} />
        <KPICard icon={Users} label={t("analytics.active_providers")} value="8" subtext={`6 ${t("analytics.on_mission_today")}`} iconBg="bg-accent/10 text-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />{t("analytics.daily_missions")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={missionsPerDay} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="missions" name={t("analytics.total")} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name={t("analytics.completed")} fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-info" />{t("analytics.response_time")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={responseTimeData}>
              <defs><linearGradient id="gradientResponse" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit=" min" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avgMinutes" name={t("analytics.avg_time")} stroke="hsl(var(--info))" fill="url(#gradientResponse)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />{t("analytics.zone_distribution")}</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={zoneData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="count" nameKey="zone" strokeWidth={2} stroke="hsl(var(--card))">
                  {zoneData.map((_, i) => <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {zoneData.map((z, i) => (
                <div key={z.zone} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: ZONE_COLORS[i] }} />
                  <span className="text-xs text-muted-foreground flex-1">{z.zone}</span>
                  <span className="text-xs font-semibold text-foreground">{z.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-warning" />{t("analytics.hourly_distribution")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="missions" name={t("analytics.missions")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />{t("analytics.top_providers")}</h3>
          </div>
          <div className="divide-y divide-border">
            {topProviders.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  i === 0 ? "bg-warning/10 text-warning" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-accent/10 text-accent" : "bg-muted/50 text-muted-foreground"
                )}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.missions} {t("analytics.missions")} · ⭐ {p.rating}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{p.avgTime} min</p>
                  <p className="text-[10px] text-muted-foreground">{t("analytics.avg_time_label")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />{t("analytics.by_service_type")}</h3>
          <div className="space-y-3">
            {interventionsByType.map((item, i) => {
              const max = interventionsByType[0].count;
              const pct = Math.round((item.count / max) * 100);
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 truncate shrink-0">{item.type}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ZONE_COLORS[i % ZONE_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
