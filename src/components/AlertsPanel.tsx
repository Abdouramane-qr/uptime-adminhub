import { useState, useRef, useEffect } from "react";
import { AlertTriangle, X, Clock, Truck, User, Wrench, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertLevel = "warning" | "critical";

interface OperationalAlert {
  id: number;
  type: string;
  level: AlertLevel;
  message: string;
  time: string;
  dismissed: boolean;
}

const initialAlerts: OperationalAlert[] = [
  { id: 1, type: "unassigned", level: "critical", message: "INT-0401 non assignée depuis 15 min", time: "Il y a 2 min", dismissed: false },
  { id: 2, type: "late", level: "warning", message: "AutoFix Pro en retard — arrivée prévue dépassée", time: "Il y a 5 min", dismissed: false },
  { id: 3, type: "stuck", level: "critical", message: "INT-0404 bloquée en statut 'en_route' depuis 30 min", time: "Il y a 8 min", dismissed: false },
  { id: 4, type: "offline", level: "warning", message: "Technicien Luc Bernard passé offline", time: "Il y a 12 min", dismissed: false },
  { id: 5, type: "unassigned", level: "warning", message: "INT-0402 non assignée depuis 8 min", time: "Il y a 3 min", dismissed: false },
];

const levelConfig: Record<AlertLevel, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  warning: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30", icon: AlertTriangle },
  critical: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", icon: ShieldAlert },
};

const AlertsPanel = () => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(initialAlerts);
  const ref = useRef<HTMLDivElement>(null);

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.level === "critical").length;

  const dismiss = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
          criticalCount > 0 ? "hover:bg-destructive/10" : "hover:bg-muted"
        )}
      >
        <AlertTriangle className={cn("h-5 w-5", criticalCount > 0 ? "text-destructive" : "text-muted-foreground")} />
        {activeAlerts.length > 0 && (
          <span className={cn(
            "absolute top-1 right-1 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center",
            criticalCount > 0 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-warning text-warning-foreground"
          )}>
            {activeAlerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-card rounded-xl shadow-lg border border-border z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Alertes opérationnelles
            </h4>
            <span className="text-xs text-muted-foreground">{activeAlerts.length} active{activeAlerts.length > 1 ? "s" : ""}</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Aucune alerte active</div>
            ) : (
              activeAlerts.map(alert => {
                const cfg = levelConfig[alert.level];
                const Icon = cfg.icon;
                return (
                  <div
                    key={alert.id}
                    className={cn("px-4 py-3 border-b border-border last:border-0 flex items-start gap-3", cfg.bg)}
                  >
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.text)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", cfg.text)}>{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase", cfg.bg, cfg.text, cfg.border, "border")}>
                          {alert.level}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(alert.id)}
                      className="p-1 rounded hover:bg-muted transition-colors shrink-0"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
