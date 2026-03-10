import { useState, useRef, useEffect } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";
import { listServiceRequests, type ServiceRequestDTO } from "@/lib/adminPortalClient";

type AlertLevel = "warning" | "critical";

interface OperationalAlert {
  id: string;
  type: string;
  level: AlertLevel;
  message: string;
  time: string;
  dismissed: boolean;
}

const initialAlerts: OperationalAlert[] = [
  {
    id: "1",
    type: "unassigned",
    level: "critical",
    message: "INT-0401 non assignée depuis 15 min",
    time: "Il y a 2 min",
    dismissed: false,
  },
  {
    id: "2",
    type: "late",
    level: "warning",
    message: "AutoFix Pro en retard — arrivée prévue dépassée",
    time: "Il y a 5 min",
    dismissed: false,
  },
  {
    id: "3",
    type: "stuck",
    level: "critical",
    message: "INT-0404 bloquée en statut 'en_route' depuis 30 min",
    time: "Il y a 8 min",
    dismissed: false,
  },
  {
    id: "4",
    type: "offline",
    level: "warning",
    message: "Technicien Luc Bernard passé offline",
    time: "Il y a 12 min",
    dismissed: false,
  },
  {
    id: "5",
    type: "unassigned",
    level: "warning",
    message: "INT-0402 non assignée depuis 8 min",
    time: "Il y a 3 min",
    dismissed: false,
  },
];

const levelConfig: Record<AlertLevel, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  warning: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30", icon: AlertTriangle },
  critical: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", icon: ShieldAlert },
};

const formatMinutesAgo = (minutes: number) => {
  if (minutes <= 0) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `Il y a ${hours} h`;
  return `Il y a ${hours} h ${remainder} min`;
};

const statusDescriptions: Record<string, (provider?: string) => string> = {
  pending: () => "en attente d'assignation",
  assigned: (provider) =>
    provider ? `assignée à ${provider}` : "assignée (prestataire non identifié)",
  en_route: () => "en route",
  arrived: () => "sur place",
  in_progress: () => "en intervention",
  completed: () => "terminée",
};

const monitoredStatuses = ["pending", "assigned", "en_route", "arrived", "in_progress"];

const buildAlertsFromRequests = (requests: ServiceRequestDTO[]): OperationalAlert[] => {
  const now = Date.now();
  const candidates = requests
    .map((request) => {
      const status = String(request.status || "pending").toLowerCase();
      if (!monitoredStatuses.includes(status)) return null;
      const provider =
        request.assigned_provider_name || request.provider_name || request.assigned_provider;
      const client =
        request.customer_tenant_name ||
        request.customer_name ||
        request.client_name ||
        request.client ||
        "Client";
      const location = request.location || request.address || "";
      const createdAt = request.created_at ? Date.parse(request.created_at) : now;
      const minutesAgo = Number.isFinite(createdAt) ? Math.max(0, Math.floor((now - createdAt) / 60000)) : 0;
      const level: AlertLevel =
        status === "pending" || (status === "assigned" && !provider) ? "critical" : "warning";
      const description = statusDescriptions[status]?.(provider) || status;
      const message = `${request.id || "INT"} ${description} • ${client}${
        location ? ` • ${location}` : ""
      }`;
      const time = formatMinutesAgo(minutesAgo);
      const priority = minutesAgo + (level === "critical" ? 2000 : 0);
      return { id: request.id || `alert-${Math.random().toString(36).slice(2, 8)}`, type: status, level, message, time, dismissed: false, priority };
    })
    .filter((alert): alert is OperationalAlert & { priority: number } => Boolean(alert))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)
    .map(({ priority, ...rest }) => rest);

  return candidates;
};

const cloneFallbackAlerts = () => initialAlerts.map((alert) => ({ ...alert }));

const AlertsPanel = () => {
  const allowFallback = allowMockFallback();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<OperationalAlert[]>(allowFallback ? cloneFallbackAlerts() : []);
  const ref = useRef<HTMLDivElement>(null);

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.level === "critical").length;

  const dismiss = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const requests = await listServiceRequests();
        setAlerts(buildAlertsFromRequests(requests));
      } catch {
        reportFallbackHit("AlertsPanel");
        if (allowFallback) {
          setAlerts(cloneFallbackAlerts());
        } else {
          setAlerts([]);
        }
      }
    };

    void load();
  }, [allowFallback]);

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
