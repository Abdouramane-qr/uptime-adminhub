import { useEffect, useState } from "react";
import { Search, Filter, User, Settings, Truck, Wrench, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { listAuditLogs } from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";

type ActionType = "assign" | "status_change" | "create" | "delete" | "update" | "login";

interface AuditLog {
  id: string; date: string; actor: string; action: ActionType; description: string; target: string;
}

const mockLogs: AuditLog[] = [
  { id: "LOG-001", date: "2026-03-08 14:32", actor: "Admin User", action: "assign", description: "Mission INT-0401 assignée à AutoFix Pro", target: "INT-0401" },
  { id: "LOG-002", date: "2026-03-08 14:15", actor: "Admin User", action: "status_change", description: "Mission INT-0403 → En route", target: "INT-0403" },
  { id: "LOG-003", date: "2026-03-08 13:50", actor: "Admin User", action: "create", description: "Nouveau prestataire MecaPlus créé", target: "MecaPlus Services" },
  { id: "LOG-004", date: "2026-03-08 12:00", actor: "Admin User", action: "delete", description: "Intervention INT-0320 supprimée", target: "INT-0320" },
  { id: "LOG-005", date: "2026-03-08 11:30", actor: "Admin User", action: "update", description: "Compte Metro Fleet Solutions modifié", target: "Metro Fleet Solutions" },
  { id: "LOG-006", date: "2026-03-08 09:00", actor: "Admin User", action: "login", description: "Connexion admin depuis Paris", target: "Session" },
  { id: "LOG-007", date: "2026-03-07 17:45", actor: "Admin User", action: "assign", description: "Mission INT-0399 assignée à QuickTow", target: "INT-0399" },
  { id: "LOG-008", date: "2026-03-07 16:20", actor: "Admin User", action: "status_change", description: "Mission INT-0398 → Terminé", target: "INT-0398" },
  { id: "LOG-009", date: "2026-03-07 15:00", actor: "Admin User", action: "create", description: "Nouveau compte GreenHaul Logistics", target: "GreenHaul Logistics" },
  { id: "LOG-010", date: "2026-03-07 10:30", actor: "Admin User", action: "update", description: "Paramètres de facturation mis à jour", target: "Settings" },
  { id: "LOG-011", date: "2026-03-06 14:00", actor: "Admin User", action: "delete", description: "Technicien T009 désactivé", target: "T009" },
  { id: "LOG-012", date: "2026-03-06 09:15", actor: "Admin User", action: "login", description: "Connexion admin depuis Lyon", target: "Session" },
];

const allActions: ActionType[] = ["assign", "status_change", "create", "delete", "update", "login"];

const AuditLogs = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<ActionType | "all">("all");
  const [logs, setLogs] = useState<AuditLog[]>(allowFallback ? mockLogs : []);
  const [apiBacked, setApiBacked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const auditRows = await listAuditLogs();
        if (auditRows.length > 0) {
          const mapped: AuditLog[] = auditRows.map((r, idx) => ({
            id: r.id || `LOG-${idx + 1}`,
            date: r.date
              ? new Date(r.date).toLocaleString("fr-FR", { hour12: false })
              : new Date().toLocaleString("fr-FR", { hour12: false }),
            actor: r.actor || "Admin User",
            action: (r.action as ActionType) || "update",
            description: r.description || `Audit log ${r.id || idx + 1}`,
            target: r.target || "N/A",
          }));
          setLogs(mapped);
          setApiBacked(true);
        }
      } catch {
        // Keep mock fallback
        setApiBacked(false);
        reportFallbackHit("AuditLogs");
        if (!allowFallback) setLogs([]);
      }
    };

    void load();
  }, [allowFallback]);

  const actionConfig: Record<ActionType, { label: string; icon: React.ElementType; bg: string; text: string }> = {
    assign: { label: t("audit.assign"), icon: User, bg: "bg-info/10", text: "text-info" },
    status_change: { label: t("audit.status_change"), icon: Wrench, bg: "bg-warning/10", text: "text-warning" },
    create: { label: t("audit.create"), icon: FileText, bg: "bg-success/10", text: "text-success" },
    delete: { label: t("audit.delete"), icon: Truck, bg: "bg-destructive/10", text: "text-destructive" },
    update: { label: t("audit.update"), icon: Settings, bg: "bg-primary/10", text: "text-primary" },
    login: { label: t("audit.login"), icon: User, bg: "bg-muted", text: "text-muted-foreground" },
  };

  const filtered = logs.filter(l => {
    const matchSearch = l.description.toLowerCase().includes(search.toLowerCase()) || l.target.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "all" || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const tableHeaders = [t("audit.date"), t("audit.actor"), t("audit.action"), t("audit.description"), t("audit.target")];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("audit.title")}</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <span>{t("audit.subtitle")}</span>
          <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("audit.search")}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterAction("all")}
            className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all",
              filterAction === "all" ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30"
            )}>{t("audit.all_actions")}</button>
          {allActions.map(a => {
            const cfg = actionConfig[a];
            return (
              <button key={a} onClick={() => setFilterAction(a)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  filterAction === a ? `${cfg.bg} ${cfg.text} border-current` : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30"
                )}>{cfg.label}</button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("audit.no_results")} description={t("audit.no_results_desc")} actionLabel={t("audit.reset")} onAction={() => { setSearch(""); setFilterAction("all"); }} />
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
                {filtered.map(log => {
                  const cfg = actionConfig[log.action];
                  const Icon = cfg.icon;
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground whitespace-nowrap">{log.date}</span></div></td>
                      <td className="px-4 py-3.5 text-sm font-medium text-foreground">{log.actor}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg", cfg.bg, cfg.text)}>
                          <Icon className="h-3 w-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-foreground">{log.description}</td>
                      <td className="px-4 py-3.5"><span className="text-xs font-mono font-medium text-primary bg-primary/5 px-2 py-1 rounded">{log.target}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length > 1 ? t("audit.count_plural") : t("audit.count")}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
