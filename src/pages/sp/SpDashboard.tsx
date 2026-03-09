import { TrendingUp, Clock, Zap, DollarSign, ClipboardList } from "lucide-react";

const kpis = [
  { title: "Active Technicians", value: "6", trend: "2 on mission", icon: Zap, colorClass: "bg-accent/10 text-accent" },
  { title: "Jobs This Month", value: "42", trend: "+8 vs last month", icon: ClipboardList, colorClass: "bg-primary/10 text-primary" },
  { title: "Avg Response Time", value: "18 min", trend: "-3 min", icon: Clock, colorClass: "bg-success/10 text-success" },
  { title: "Revenue This Month", value: "€6,240", trend: "+12%", icon: DollarSign, colorClass: "bg-info/10 text-info" },
];

const SpDashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, AutoFix Pro</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-card rounded-xl shadow-sm p-5 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-muted-foreground">{kpi.trend}</span>
                </div>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${kpi.colorClass}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
        <p className="text-muted-foreground">Additional dashboard widgets coming soon.</p>
      </div>
    </div>
  );
};

export default SpDashboard;