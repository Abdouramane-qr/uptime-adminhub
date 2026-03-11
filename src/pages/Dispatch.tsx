import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { mockProviders } from "@/data/mockProviders";
import { ProviderPosition, STATUS_CONFIG, MissionStatus } from "@/types/map";
import ProviderMarker from "@/components/map/ProviderMarker";
import InterventionMarker from "@/components/map/InterventionMarker";
import MissionPanel from "@/components/map/MissionPanel";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search, Clock, User, MapPin, Wrench, CheckCircle2, Navigation,
  Flag, Circle, AlertTriangle, Zap, ChevronRight, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";
import {
  AdminPortalError,
  listProviderPresence,
  listServiceRequests,
  type ProviderPresenceDTO,
  type ServiceRequestDTO,
  updateServiceRequestStatus,
} from "@/lib/adminPortalClient";
import { supabase } from "@/integrations/supabase/client";

type InterventionStatus = "pending" | "assigned" | "en_route" | "arrived" | "in_progress" | "completed";

interface DispatchIntervention {
  id: string;
  client: string;
  location: string;
  lat: number;
  lng: number;
  type: string;
  status: InterventionStatus;
  createdAt: Date;
  assignedProvider?: string;
  urgency: "normal" | "high" | "critical";
}

interface DispatchProviderPosition extends ProviderPosition {
  backendProviderId?: string;
}

const initialInterventions: DispatchIntervention[] = [
  { id: "INT-0401", client: "Metro Fleet Co", location: "12 Rue de Rivoli, Paris", lat: 48.8566, lng: 2.3522, type: "Remorquage", status: "pending", createdAt: new Date(Date.now() - 15 * 60000), urgency: "critical" },
  { id: "INT-0402", client: "GreenHaul Logistics", location: "45 Av. Champs-Élysées", lat: 48.8738, lng: 2.295, type: "Changement pneu", status: "pending", createdAt: new Date(Date.now() - 8 * 60000), urgency: "high" },
  { id: "INT-0403", client: "CityDrive Fleet", location: "1 Place du Louvre", lat: 48.8606, lng: 2.3376, type: "Batterie", status: "assigned", createdAt: new Date(Date.now() - 25 * 60000), assignedProvider: "RoadStar Repairs", urgency: "normal" },
  { id: "INT-0404", client: "TransLog SA", location: "Jardin du Luxembourg", lat: 48.8484, lng: 2.3462, type: "Diagnostic", status: "en_route", createdAt: new Date(Date.now() - 35 * 60000), assignedProvider: "SpeedFix Mobile", urgency: "normal" },
  { id: "INT-0405", client: "Express Delivery Co", location: "Gare de Lyon", lat: 48.845, lng: 2.37, type: "Assistance routière", status: "in_progress", createdAt: new Date(Date.now() - 50 * 60000), assignedProvider: "FleetGuard Pro", urgency: "high" },
  { id: "INT-0406", client: "NordFleet SARL", location: "Sacré-Cœur", lat: 48.8867, lng: 2.3431, type: "Changement pneu", status: "arrived", createdAt: new Date(Date.now() - 40 * 60000), assignedProvider: "UrbanFix Paris", urgency: "normal" },
];

const timeSince = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2, "0") : ""}`;
};

const Dispatch = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();

  const statusConfig: Record<InterventionStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: t("status.pending"), color: "hsl(var(--muted-foreground))", icon: Clock },
    assigned: { label: t("status.assigned"), color: "hsl(var(--info))", icon: User },
    en_route: { label: t("status.en_route"), color: "hsl(var(--accent))", icon: Navigation },
    arrived: { label: t("status.arrived"), color: "hsl(var(--warning, 38 92% 50%))", icon: Flag },
    in_progress: { label: t("status.in_progress"), color: "hsl(var(--success))", icon: Wrench },
    completed: { label: t("status.completed"), color: "hsl(var(--primary))", icon: CheckCircle2 },
  };

  const urgencyConfig = {
    normal: { label: t("dispatch.urgency_normal"), bg: "bg-muted", text: "text-muted-foreground" },
    high: { label: t("dispatch.urgency_high"), bg: "bg-warning/10", text: "text-warning" },
    critical: { label: t("dispatch.urgency_critical"), bg: "bg-destructive/10", text: "text-destructive" },
  };

  const [interventions, setInterventions] = useState<DispatchIntervention[]>(allowFallback ? initialInterventions : []);
  const [apiBacked, setApiBacked] = useState(false);
  const [providers, setProviders] = useState<DispatchProviderPosition[]>(allowFallback ? mockProviders : []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InterventionStatus | "all">("all");
  const [selectedIntervention, setSelectedIntervention] = useState<DispatchIntervention | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignProvider, setAssignProvider] = useState("");
  const [selectedMapProvider, setSelectedMapProvider] = useState<ProviderPosition | null>(null);

  const loadInterventions = useCallback(async () => {
    const extractDetail = (details: string | undefined, label: string) => {
      if (!details) return null;
      const part = details.split("|").map((item) => item.trim()).find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
      if (!part) return null;
      return part.slice(label.length + 1).trim() || null;
    };

    const toNum = (v: unknown, fallback: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const mapStatus = (v: string | undefined): InterventionStatus => {
      const s = String(v || "").toLowerCase();
      if (s === "pending" || s === "assigned" || s === "en_route" || s === "arrived" || s === "in_progress" || s === "completed") {
        return s as InterventionStatus;
      }
      return "pending";
    };

    const mapItem = (r: ServiceRequestDTO): DispatchIntervention => ({
      id: r.id,
      client: r.customer_tenant_name || r.client_name || r.customer_name || r.client || r.fleet_manager || "Client",
      location: r.location || r.address || extractDetail(r.breakdown_details, "Location") || "Location inconnue",
      lat: toNum(r.pickup_lat ?? r.lat, 48.8566),
      lng: toNum(r.pickup_lng ?? r.lng, 2.3522),
      type: r.service_type || r.type || "Assistance",
      status: mapStatus(r.status),
      createdAt: new Date(r.created_at || Date.now()),
      assignedProvider: r.assigned_provider_name || r.provider_name || r.assigned_provider || undefined,
      urgency: (["normal", "high", "critical"].includes(String(r.urgency || "").toLowerCase())
        ? String(r.urgency).toLowerCase()
        : "normal") as "normal" | "high" | "critical",
    });

    try {
      const rows = await listServiceRequests();
      setInterventions(rows.map(mapItem));
      setApiBacked(true);
    } catch {
      setApiBacked(false);
      reportFallbackHit("Dispatch:interventions");
      if (!allowFallback) setInterventions([]);
    }
  }, [allowFallback]);

  const loadProviders = useCallback(async () => {
    const mapStatus = (row: ProviderPresenceDTO): MissionStatus => {
      const s = String(row.status || "").toLowerCase();
      if (s === "pending" || s === "assigned" || s === "en_route" || s === "arrived" || s === "in_progress" || s === "completed") {
        return s as MissionStatus;
      }
      return row.is_available ? "pending" : "in_progress";
    };

    const mapProvider = (row: ProviderPresenceDTO): DispatchProviderPosition | null => {
      const providerId = String(row.provider_id || "").trim();
      if (!providerId || row.assignable === false) {
        return null;
      }

      return {
        id: providerId,
        backendProviderId: providerId,
        name: row.display_name || row.name || "Provider",
        status: mapStatus(row),
        lat: Number(row.lat) || 48.8566,
        lng: Number(row.lng) || 2.3522,
        phone: row.phone || "N/A",
        currentMission: null,
        completedMissions: 0,
      };
    };

    try {
      const rows = await listProviderPresence();
      setProviders(rows.map(mapProvider).filter((provider): provider is DispatchProviderPosition => provider !== null));
    } catch {
      reportFallbackHit("Dispatch:providers");
      if (!allowFallback) setProviders([]);
    }
  }, [allowFallback]);

  useEffect(() => {
    void loadInterventions();
    void loadProviders();
  }, [loadInterventions, loadProviders]);

  useEffect(() => {
    if (!apiBacked) return;

    const srChannel = supabase
      .channel('dispatch_service_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        void loadInterventions();
      })
      .subscribe();

    const ppChannel = supabase
      .channel('dispatch_provider_presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_presence' }, () => {
        void loadProviders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(srChannel);
      supabase.removeChannel(ppChannel);
    };
  }, [apiBacked, loadInterventions, loadProviders]);

  const availableProviders = useMemo(
    () => providers.filter((p) => p.status === "pending" || p.status === "completed"),
    [providers],
  );

  const filtered = useMemo(() => {
    return interventions.filter(i => {
      const matchSearch = i.id.toLowerCase().includes(search.toLowerCase()) ||
        i.client.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || i.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [interventions, search, filterStatus]);

  const pendingCount = interventions.filter(i => i.status === "pending").length;
  const activeCount = interventions.filter(i => ["en_route", "arrived", "in_progress"].includes(i.status)).length;

  const mapCenter = useMemo(() => {
    if (filtered.length > 0) return [filtered[0].lat, filtered[0].lng] as [number, number];
    if (providers.length > 0) return [providers[0].lat, providers[0].lng] as [number, number];
    return [12.3714, -1.5197] as [number, number]; // Default to Ouagadougou
  }, [filtered, providers]);

  const handleAssign = async () => {
    if (!selectedIntervention || !assignProvider) return;
    const selectedProvider = providers.find((provider) => provider.id === assignProvider);
    const backendProviderId = selectedProvider?.backendProviderId || assignProvider;
    if (!selectedProvider || !backendProviderId.trim()) {
      toast({
        title: t("dispatch.update_error"),
        description: "Le prestataire selectionne ne possede pas d'identifiant backend valide.",
        variant: "destructive",
      });
      return;
    }
    const assignedProviderName = selectedProvider?.name || assignProvider;
    try {
      if (apiBacked) {
        await updateServiceRequestStatus(selectedIntervention.id, {
          status: "assigned",
          assigned_provider_id: backendProviderId,
        });
      }
      setInterventions(prev => prev.map(i =>
        i.id === selectedIntervention.id
          ? { ...i, status: "assigned" as const, assignedProvider: assignedProviderName }
          : i
      ));
      toast({ title: t("dispatch.mission_assigned"), description: `${selectedIntervention.id} → ${assignedProviderName}` });
      setAssignOpen(false);
      setAssignProvider("");
      setSelectedIntervention(null);
    } catch (error) {
      const invalidProvider =
        error instanceof AdminPortalError
        && error.message.toLowerCase().includes("invalid_assigned_provider");
      toast({
        title: t("dispatch.update_error"),
        description: invalidProvider
          ? "Le prestataire visible n'est pas encore raccorde comme owner SP actif. Verifie son onboarding/profil avant assignation."
          : String((error as { message?: string })?.message || t("dispatch.update_error_desc")),
        variant: "destructive",
      });
    }
  };

  const advanceStatus = async (intervention: DispatchIntervention) => {
    const flow: InterventionStatus[] = ["pending", "assigned", "en_route", "arrived", "in_progress", "completed"];
    const idx = flow.indexOf(intervention.status);
    if (idx < 0 || idx >= flow.length - 1) return;
    const next = flow[idx + 1];
    try {
      if (apiBacked) {
        await updateServiceRequestStatus(intervention.id, { status: next });
      }
      setInterventions(prev => prev.map(i => i.id === intervention.id ? { ...i, status: next } : i));
      toast({ title: t("dispatch.status_updated"), description: `${intervention.id} → ${statusConfig[next].label}` });
    } catch (error) {
      toast({
        title: t("dispatch.update_error"),
        description: String((error as { message?: string })?.message || t("dispatch.update_error_desc")),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("dispatch.title")}</h1>
          <div className="text-sm text-muted-foreground mt-0.5 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>{t("dispatch.subtitle")}</span>
              <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
            </div>
            <p className="max-w-2xl opacity-80 italic">
              {t("dispatch.scope_note")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">{pendingCount} {pendingCount > 1 ? t("dispatch.unassigned_plural") : t("dispatch.unassigned")}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20">
            <Zap className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-success">{activeCount} {t("dispatch.in_progress")}</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
        <div className="lg:col-span-2 flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("dispatch.search")}
                className="h-9 w-full pl-9 pr-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(["all", ...Object.keys(statusConfig)] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s as any)}
                  className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                    filterStatus === s ? "bg-primary/10 text-primary border-primary/30" : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30"
                  )}>
                  {s === "all" ? t("dispatch.all") : statusConfig[s as InterventionStatus].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">{t("dispatch.no_intervention")}</div>
            ) : (
              filtered.map(i => {
                const cfg = statusConfig[i.status];
                const urg = urgencyConfig[i.urgency];
                const isSelected = selectedIntervention?.id === i.id;
                const isOld = i.status === "pending" && (Date.now() - i.createdAt.getTime()) > 10 * 60000;

                return (
                  <div key={i.id} onClick={() => setSelectedIntervention(i)}
                    className={cn("p-3 border-b border-border cursor-pointer transition-all hover:bg-muted/30",
                      isSelected && "bg-primary/5 border-l-2 border-l-primary",
                      isOld && "bg-destructive/5"
                    )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">{i.id}</span>
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", urg.bg, urg.text)}>{urg.label}</span>
                          {isOld && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        </div>
                        <p className="text-sm font-medium text-foreground mt-0.5 truncate">{i.client}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{i.location}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ background: cfg.color }}>{cfg.label}</span>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">{timeSince(i.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                        {i.status === "pending" ? (
                          <Button size="sm" className="rounded-lg text-xs h-7 gap-1" onClick={(e) => { e.stopPropagation(); setAssignOpen(true); }}>
                            <User className="h-3 w-3" /> {t("dispatch.assign")}
                          </Button>
                        ) : i.status !== "completed" ? (
                          <Button size="sm" className="rounded-lg text-xs h-7 gap-1" onClick={(e) => { e.stopPropagation(); advanceStatus(i); }}>
                            <ChevronRight className="h-3 w-3" /> {t("dispatch.advance")}
                          </Button>
                        ) : null}
                        <span className="text-[10px] text-muted-foreground ml-auto">{i.type}</span>
                        {i.assignedProvider && <span className="text-[10px] text-info font-medium">{i.assignedProvider}</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-border text-center">
            <span className="text-xs text-muted-foreground">{filtered.length} intervention{filtered.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-border">
          <MapContainer 
            key={`${providers.length}-${filtered.length}-${mapCenter[0]}`}
            center={mapCenter} 
            zoom={13} 
            className="h-full w-full" 
            zoomControl={false}
          >
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {providers.map(p => <ProviderMarker key={p.id} provider={p} onSelect={setSelectedMapProvider} />)}
            {filtered.map(i => (
              <InterventionMarker 
                key={i.id} 
                intervention={i} 
                onSelect={(id) => {
                  const item = filtered.find(x => x.id === id);
                  if (item) setSelectedIntervention(item);
                }} 
              />
            ))}
          </MapContainer>
          <MissionPanel provider={selectedMapProvider} onClose={() => setSelectedMapProvider(null)} />
          <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-xl shadow-md p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">{t("dispatch.providers")}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {(Object.keys(STATUS_CONFIG) as MissionStatus[]).map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: STATUS_CONFIG[s].color }} />
                  <span className="text-[10px] text-muted-foreground">{STATUS_CONFIG[s].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{t("dispatch.assign_provider")}</DialogTitle>
          </DialogHeader>
          {selectedIntervention && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground">{t("dispatch.intervention")}</p>
                <p className="text-sm font-bold text-foreground font-mono">{selectedIntervention.id}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedIntervention.client} — {selectedIntervention.type}</p>
              </div>
              <div className="space-y-2">
                <Label>{t("dispatch.available_provider")}</Label>
                <Select value={assignProvider} onValueChange={setAssignProvider}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("dispatch.select_provider")} /></SelectTrigger>
                  <SelectContent>
                    {availableProviders.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: STATUS_CONFIG[p.status].color }} />
                          {p.name} — {STATUS_CONFIG[p.status].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAssignOpen(false)}>{t("common.cancel")}</Button>
            <Button className="rounded-xl" onClick={handleAssign} disabled={!assignProvider}>{t("dispatch.assign")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dispatch;
