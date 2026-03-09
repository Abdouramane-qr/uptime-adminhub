import {
  Users, Clock, Zap, DollarSign, TrendingUp, TrendingDown,
  ArrowRight, Activity, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { useLanguage } from "@/hooks/useLanguage";

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `J${i + 1}`,
  interventions: Math.floor(20 + Math.random() * 30 + Math.sin(i / 3) * 10),
  completed: Math.floor(15 + Math.random() * 20 + Math.sin(i / 3) * 8),
}));

const pendingApprovals = [
  { company: "AutoFix Pro", type: "SP", date: "28 Fév", avatar: "AF" },
  { company: "Metro Fleet Co", type: "Fleet", date: "27 Fév", avatar: "MF" },
  { company: "QuickTow Services", type: "SP", date: "26 Fév", avatar: "QT" },
  { company: "GreenHaul Logistics", type: "Fleet", date: "25 Fév", avatar: "GH" },
];

const Dashboard = () => {
  const { t } = useLanguage();

  const kpis = [
    { titleKey: "dashboard.total_accounts", value: "248", trend: "+12%", trendLabel: t("dashboard.this_month"), up: true, icon: Users, gradient: "from-primary/10 to-primary/5", iconBg: "bg-primary/15 text-primary" },
    { titleKey: "dashboard.pending", value: "7", trend: `3 ${t("dashboard.new")}`, trendLabel: t("dashboard.today"), up: false, icon: Clock, gradient: "from-warning/10 to-warning/5", iconBg: "bg-warning/15 text-warning" },
    { titleKey: "dashboard.active_interventions", value: "34", trend: "+5", trendLabel: t("dashboard.today"), up: true, icon: Zap, gradient: "from-success/10 to-success/5", iconBg: "bg-success/15 text-success" },
    { titleKey: "dashboard.monthly_revenue", value: "€12,840", trend: "+8%", trendLabel: t("dashboard.vs_last_month"), up: true, icon: DollarSign, gradient: "from-accent/10 to-accent/5", iconBg: "bg-accent/15 text-accent" },
  ];

  const weeklyData = [
    { day: t("day.mon"), value: 42 },
    { day: t("day.tue"), value: 38 },
    { day: t("day.wed"), value: 55 },
    { day: t("day.thu"), value: 47 },
    { day: t("day.fri"), value: 63 },
    { day: t("day.sat"), value: 28 },
    { day: t("day.sun"), value: 15 },
  ];

  const recentActivity = [
    { account: "AutoFix Pro", action: t("activity.account_created"), time: t("activity.ago_5min"), status: "approved" },
    { account: "Metro Fleet Co", action: t("activity.submitted_review"), time: t("activity.ago_23min"), status: "pending" },
    { account: "QuickTow Services", action: t("activity.account_rejected"), time: t("activity.ago_1h"), status: "rejected" },
    { account: "GreenHaul Logistics", action: t("activity.account_created"), time: t("activity.ago_3h"), status: "approved" },
    { account: "RoadStar Repairs", action: t("activity.submitted_review"), time: t("activity.ago_5h"), status: "pending" },
  ];

  const statusStyles: Record<string, string> = {
    approved: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    rejected: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    approved: t("status.approved"),
    pending: t("status.pending"),
    rejected: t("status.rejected"),
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("dashboard.greeting")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg">
          <Activity className="h-3.5 w-3.5 text-success animate-pulse-soft" />
          <span>{t("dashboard.system_operational")}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.titleKey} className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all duration-300 group" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-50`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${kpi.iconBg} transition-transform group-hover:scale-110`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? "text-success" : "text-warning"}`}>
                  {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.trend}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{t(kpi.titleKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("dashboard.interventions")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.last_30_days")}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />{t("dashboard.total")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />{t("dashboard.completed")}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 69%, 41%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(152, 69%, 41%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="interventions" stroke="hsl(221, 83%, 53%)" strokeWidth={2} fill="url(#gradientPrimary)" dot={false} />
              <Area type="monotone" dataKey="completed" stroke="hsl(152, 69%, 41%)" strokeWidth={2} fill="url(#gradientSuccess)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("dashboard.this_week")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.per_day")}</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={25} />
              <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: "0.75rem" }} />
              <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("dashboard.pending_approval")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{pendingApprovals.length} {t("dashboard.requests")}</p>
            </div>
            <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              {t("dashboard.view_all")} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {pendingApprovals.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-foreground">{item.avatar}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.company}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.type === "SP" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>{item.type}</span>
                      <span className="text-[11px] text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">{t("dashboard.review")}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("dashboard.recent_activity")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.recent_activity_desc")}</p>
            </div>
            <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              {t("dashboard.history")} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((row, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{row.account}</span>
                      <span className="text-muted-foreground"> — {row.action}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{row.time}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusStyles[row.status]}`}>{statusLabels[row.status]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
