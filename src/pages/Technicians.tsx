import { useEffect, useState } from "react";
import { Search, Star, Phone, MapPin, Filter, ChevronRight, X, Wrench, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import EmptyState from "@/components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { listTechnicians, type TechnicianDTO } from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";
import { loadApprovedSpProjection } from "@/lib/onboardingResourceProjection";

type TechStatus = "online" | "offline" | "on_job";

interface Technician {
  id: string; name: string; provider: string; status: TechStatus; phone: string;
  location: string; completedInterventions: number; rating: number;
  specialties: string[]; currentMission?: string; joinedAt: string;
}

const mockTechnicians: Technician[] = [
  { id: "T001", name: "Jean Dupont", provider: "AutoFix Pro", status: "on_job", phone: "+33 6 12 34 56 78", location: "Paris", completedInterventions: 142, rating: 4.8, specialties: ["Remorquage", "Batterie"], currentMission: "INT-0401", joinedAt: "Jan 2024" },
  { id: "T002", name: "Marie Laurent", provider: "QuickTow Services", status: "online", phone: "+33 6 98 76 54 32", location: "Lyon", completedInterventions: 89, rating: 4.6, specialties: ["Changement pneu", "Diagnostic"], joinedAt: "Mar 2024" },
  { id: "T003", name: "Pierre Martin", provider: "RoadStar Repairs", status: "online", phone: "+33 6 55 44 33 22", location: "Marseille", completedInterventions: 215, rating: 4.9, specialties: ["Réparation moteur", "Remorquage", "Batterie"], joinedAt: "Nov 2023" },
  { id: "T004", name: "Luc Bernard", provider: "SpeedFix Mobile", status: "offline", phone: "+33 6 11 22 33 44", location: "Toulouse", completedInterventions: 67, rating: 4.3, specialties: ["Diagnostic"], joinedAt: "Jun 2024" },
  { id: "T005", name: "Sophie Moreau", provider: "FleetGuard Pro", status: "on_job", phone: "+33 6 77 88 99 00", location: "Bordeaux", completedInterventions: 178, rating: 4.7, specialties: ["Changement pneu", "Assistance routière"], currentMission: "INT-0405", joinedAt: "Sep 2023" },
  { id: "T006", name: "Antoine Lefevre", provider: "UrbanFix Paris", status: "online", phone: "+33 6 66 55 44 33", location: "Paris", completedInterventions: 301, rating: 4.95, specialties: ["Remorquage", "Batterie", "Changement pneu", "Diagnostic"], joinedAt: "May 2023" },
  { id: "T007", name: "Claire Dubois", provider: "MecaPlus Services", status: "offline", phone: "+33 6 22 33 44 55", location: "Nantes", completedInterventions: 56, rating: 4.1, specialties: ["Livraison carburant"], joinedAt: "Aug 2024" },
  { id: "T008", name: "Hugo Garnier", provider: "AutoFix Pro", status: "online", phone: "+33 6 33 44 55 66", location: "Strasbourg", completedInterventions: 124, rating: 4.5, specialties: ["Réparation moteur", "Diagnostic"], joinedAt: "Feb 2024" },
];

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating) ? "text-warning fill-warning" : "text-muted-foreground/30")} />
    ))}
    <span className="text-xs font-medium text-foreground ml-1">{rating.toFixed(1)}</span>
  </div>
);

const Technicians = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TechStatus | "all">("all");
  const [selected, setSelected] = useState<Technician | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [apiBacked, setApiBacked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [techniciansRows, onboardingProjection] = await Promise.all([
          listTechnicians(),
          loadApprovedSpProjection().catch(() => ({ byCompanyName: new Map(), technicians: [] })),
        ]);
        const mapped = techniciansRows.map((row: TechnicianDTO, idx): Technician => ({
          id: row.id || `T${String(idx + 1).padStart(3, "0")}`,
          name: row.name || `Technicien ${idx + 1}`,
          provider: row.provider || row.name || "Provider",
          status: (row.status as TechStatus) || "offline",
          phone: row.phone || "N/A",
          location: row.location || "N/A",
          completedInterventions: row.completed_interventions || 0,
          rating: row.rating || 4.5,
          specialties: row.specialties?.length ? row.specialties : ["Assistance routière"],
          currentMission: row.current_mission,
          joinedAt: row.joined_at || "N/A",
        }));
        const existingKeys = new Set(
          mapped.map((tech) => `${tech.provider.toLowerCase()}::${tech.name.toLowerCase()}`),
        );
        onboardingProjection.technicians.forEach((tech, idx) => {
          const key = `${tech.provider.toLowerCase()}::${tech.name.toLowerCase()}`;
          if (existingKeys.has(key)) return;
          mapped.push({
            id: tech.id || `ONB-T${String(idx + 1).padStart(3, "0")}`,
            name: tech.name,
            provider: tech.provider,
            status: "offline",
            phone: tech.phone,
            location: "Onboarding approuve",
            completedInterventions: 0,
            rating: 4.5,
            specialties: tech.skill ? [tech.skill] : ["Assistance routière"],
            currentMission: undefined,
            joinedAt: "Onboarding",
          });
        });
        setTechnicians(mapped);
        setApiBacked(true);
      } catch {
        setApiBacked(false);
        reportFallbackHit("Technicians");
        if (!allowFallback) {
          setTechnicians([]);
        } else {
          setTechnicians(mockTechnicians);
        }
      }
    };

    void load();
  }, [allowFallback]);

  const techStatusConfig: Record<TechStatus, { label: string; dot: string; bg: string; text: string }> = {
    online: { label: t("tech.online"), dot: "bg-success", bg: "bg-success/10", text: "text-success" },
    offline: { label: t("tech.offline"), dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground" },
    on_job: { label: t("tech.on_job"), dot: "bg-warning", bg: "bg-warning/10", text: "text-warning" },
  };

  const filtered = technicians.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.provider.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const onlineCount = technicians.filter(t => t.status === "online").length;
  const onJobCount = technicians.filter(t => t.status === "on_job").length;

  const tableHeaders = [t("tech.col_id"), t("tech.col_name"), t("tech.col_provider"), t("tech.col_status"), t("tech.col_specialties"), t("tech.col_missions"), t("tech.col_rating"), t("tech.col_location"), ""];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("tech.title")}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span>{t("tech.subtitle")}</span>
            <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
          </p>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {t("tech.scope_note")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs font-semibold text-success">{onlineCount} {t("tech.online").toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning/10 border border-warning/20">
            <Wrench className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning">{onJobCount} {t("tech.on_job").toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("tech.search")}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>
        <div className="flex gap-2">
          {(["all", "online", "on_job", "offline"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                filterStatus === s ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30"
              )}>{s === "all" ? t("tech.all") : techStatusConfig[s].label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("tech.no_results")} description={t("tech.no_results_desc")} actionLabel={t("tech.reset")} onAction={() => { setSearch(""); setFilterStatus("all"); }} />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {tableHeaders.map(h => <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 whitespace-nowrap uppercase tracking-wider">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tech => {
                  const cfg = techStatusConfig[tech.status];
                  return (
                    <tr key={tech.id} onClick={() => setSelected(tech)} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group">
                      <td className="px-4 py-3.5 text-sm font-mono font-medium text-primary">{tech.id}</td>
                      <td className="px-4 py-3.5"><p className="text-sm font-medium text-foreground">{tech.name}</p></td>
                      <td className="px-4 py-3.5 text-sm text-foreground">{tech.provider}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg", cfg.bg, cfg.text)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {tech.specialties.slice(0, 2).map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>)}
                          {tech.specialties.length > 2 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{tech.specialties.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-foreground">{tech.completedInterventions}</td>
                      <td className="px-4 py-3.5"><RatingStars rating={tech.rating} /></td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{tech.location}</td>
                      <td className="px-4 py-3.5"><ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length > 1 ? t("tech.count_plural") : t("tech.count")}</p>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          {selected && (
            <>
              <div className="p-6 border-b border-border">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {selected.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground">{selected.name}</DialogTitle>
                      <p className="text-sm text-muted-foreground">{selected.provider}</p>
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-lg mt-1", techStatusConfig[selected.status].bg, techStatusConfig[selected.status].text)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", techStatusConfig[selected.status].dot)} />{techStatusConfig[selected.status].label}
                      </span>
                    </div>
                  </div>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                    <p className="text-[11px] text-muted-foreground">{t("tech.missions_completed")}</p>
                    <p className="text-2xl font-bold text-foreground">{selected.completedInterventions}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                    <p className="text-[11px] text-muted-foreground">{t("tech.rating")}</p>
                    <RatingStars rating={selected.rating} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> {selected.phone}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {selected.location}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {t("tech.joined")} {selected.joinedAt}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("tech.specialties")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.specialties.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">{s}</span>)}
                  </div>
                </div>
                {selected.currentMission && (
                  <div className="p-3 bg-warning/10 rounded-xl border border-warning/20">
                    <p className="text-xs text-warning font-semibold">{t("tech.current_mission")}</p>
                    <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selected.currentMission}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Technicians;
