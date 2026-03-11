import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Users, MapPin } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useSpOnboardingDraft } from "@/hooks/useSpOnboardingDraft";
import { listProviderPresence, type ProviderPresenceDTO } from "@/lib/adminPortalClient";
import ProviderMarker from "@/components/map/ProviderMarker";
import MissionPanel from "@/components/map/MissionPanel";
import { type MissionStatus, type ProviderPosition } from "@/types/map";
import DataSourceBadge from "@/components/DataSourceBadge";
import { toast } from "@/hooks/use-toast";

const normalize = (value: string | undefined | null) => String(value || "").trim().toLowerCase();

const SpMap = () => {
  const { user } = useAuth();
  const { detail, loading, error } = useSpOnboardingDraft();
  const [providers, setProviders] = useState<ProviderPosition[]>([]);
  const [selected, setSelected] = useState<ProviderPosition | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [apiBacked, setApiBacked] = useState(false);

  const providerId = user?.id || "";
  const providerName = detail?.onboarding?.company_name || "";

  const loadProviders = useCallback(async () => {
    if (!providerId) {
      setProviders([]);
      setLoadingProviders(false);
      setApiBacked(false);
      return;
    }

    setLoadingProviders(true);
    try {
      const rows = await listProviderPresence();
      const mapped = rows
        .filter((row: ProviderPresenceDTO) =>
          String(row.provider_id || "").trim() === providerId,
        )
        .map((row): ProviderPosition => {
          const status = String(row.status || "").toLowerCase();
          const normalizedStatus: MissionStatus =
            status === "pending" ||
            status === "assigned" ||
            status === "en_route" ||
            status === "arrived" ||
            status === "in_progress" ||
            status === "completed"
              ? (status as MissionStatus)
              : row.is_available
                ? "pending"
                : "in_progress";

          return {
            id: String(row.provider_id || row.id || providerName),
            name: row.display_name || row.name || providerName,
            status: normalizedStatus,
            lat: Number(row.lat) || 12.3714,
            lng: Number(row.lng) || -1.5197,
            phone: row.phone || "N/A",
            currentMission: null,
            completedMissions: 0,
          };
        });

      setProviders(mapped);
      setApiBacked(true);
    } catch (err) {
      console.error("Failed to load SP map data:", err);
      setProviders([]);
      setApiBacked(false);
      toast({
        title: "Map unavailable",
        description: String((err as { message?: string })?.message || "Unable to load provider presence."),
        variant: "destructive",
      });
    } finally {
      setLoadingProviders(false);
    }
  }, [providerId, providerName]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const center = useMemo<[number, number]>(() => {
    if (providers.length > 0) return [providers[0].lat, providers[0].lng];
    return [12.3714, -1.5197];
  }, [providers]);

  if (loading || loadingProviders) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  if (error) {
    return <EmptyState title="Map unavailable" description={error} />;
  }

  if (!detail?.onboarding) {
    return <EmptyState title="No SP record" description="Complete the onboarding flow before viewing the map." />;
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        title="No live position"
        description="This service provider has no active presence record yet."
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Map View</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span>{providerName}</span>
            <DataSourceBadge backend={apiBacked} fallbackAllowed={false} />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{providers.length}</span>
            <span className="text-xs text-muted-foreground">tracked units</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Live provider presence</span>
          </div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: "calc(100vh - 240px)", minHeight: "400px" }}>
        <MapContainer center={center} zoom={13} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {providers.map((provider) => (
            <ProviderMarker key={provider.id} provider={provider} onSelect={setSelected} />
          ))}
        </MapContainer>
        <MissionPanel provider={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
};

export default SpMap;
