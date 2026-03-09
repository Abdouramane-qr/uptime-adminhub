import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { mockProviders } from "@/data/mockProviders";
import { ProviderPosition, STATUS_CONFIG, MissionStatus } from "@/types/map";
import ProviderMarker from "@/components/map/ProviderMarker";
import MissionPanel from "@/components/map/MissionPanel";
import { cn } from "@/lib/utils";
import { Users, Activity, CheckCircle2, MapPin } from "lucide-react";
import { listProviderPresence, type ProviderPresenceDTO } from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";

const allStatuses: MissionStatus[] = ["pending", "assigned", "en_route", "arrived", "in_progress", "completed"];

const Map = () => {
  const allowFallback = allowMockFallback();
  const [selected, setSelected] = useState<ProviderPosition | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MissionStatus>>(new Set());
  const [providers, setProviders] = useState<ProviderPosition[]>(allowFallback ? mockProviders : []);
  const [apiBacked, setApiBacked] = useState(false);

  useEffect(() => {
    const mapStatus = (row: ProviderPresenceDTO): MissionStatus => {
      const s = String(row.status || "").toLowerCase();
      if (s === "pending" || s === "assigned" || s === "en_route" || s === "arrived" || s === "in_progress" || s === "completed") {
        return s;
      }
      return row.is_available ? "pending" : "in_progress";
    };

    const mapProvider = (row: ProviderPresenceDTO): ProviderPosition => ({
      id: String(row.provider_id || row.id || `provider-${Math.random().toString(36).slice(2, 8)}`),
      name: row.display_name || row.name || "Provider",
      status: mapStatus(row),
      lat: Number(row.lat) || 48.8566,
      lng: Number(row.lng) || 2.3522,
      phone: row.phone || "N/A",
      currentMission: null,
      completedMissions: 0,
    });

    const load = async () => {
      try {
        const rows = await listProviderPresence();
        if (rows.length > 0) {
          setProviders(rows.map(mapProvider));
          setApiBacked(true);
        }
      } catch {
        // Keep mock fallback for non-configured envs.
        setApiBacked(false);
        if (!allowFallback) setProviders([]);
      }
    };

    void load();
  }, [allowFallback]);

  const toggleFilter = (status: MissionStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const filteredProviders = useMemo(
    () => activeFilters.size === 0 ? providers : providers.filter((p) => activeFilters.has(p.status)),
    [activeFilters, providers]
  );

  const totalActive = providers.filter((p) => ["en_route", "arrived", "in_progress"].includes(p.status)).length;
  const totalMissions = providers.filter((p) => p.currentMission).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carte de suivi</h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>Suivi en temps réel des prestataires</span>
            <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{providers.length}</span>
            <span className="text-xs text-muted-foreground">prestataires</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-medium text-success">{totalActive}</span>
            <span className="text-xs text-success/70">actifs</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{totalMissions}</span>
            <span className="text-xs text-primary/70">missions</span>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Filtrer :</span>
        {allStatuses.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const active = activeFilters.has(s);
          const count = providers.filter((p) => p.status === s).length;
          return (
            <button
              key={s}
              onClick={() => toggleFilter(s)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                active
                  ? "border-current shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-muted-foreground/40"
              )}
              style={active ? { color: cfg.color, backgroundColor: `${cfg.color}15`, borderColor: cfg.color } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: active ? cfg.color : "hsl(var(--muted-foreground) / 0.3)" }} />
              {cfg.label}
              <span className="font-bold">{count}</span>
            </button>
          );
        })}
        {activeFilters.size > 0 && (
          <button
            onClick={() => setActiveFilters(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground px-2 underline transition-colors"
          >
            Tout afficher
          </button>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: "calc(100vh - 240px)", minHeight: "400px" }}>
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredProviders.map((provider) => (
            <ProviderMarker key={provider.id} provider={provider} onSelect={setSelected} />
          ))}
        </MapContainer>

        <MissionPanel provider={selected} onClose={() => setSelected(null)} />

        {/* Legend (bottom-left) */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-xl shadow-md p-3">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Statuts</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {allStatuses.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_CONFIG[s].color }} />
                <span className="text-[11px] text-muted-foreground">{STATUS_CONFIG[s].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider count overlay */}
        <div className="absolute top-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-xl shadow-md px-3 py-2">
          <span className="text-xs font-semibold text-foreground">{filteredProviders.length}</span>
          <span className="text-xs text-muted-foreground ml-1">
            {filteredProviders.length === providers.length ? "prestataires" : `/ ${providers.length} affichés`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Map;
