import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Clock, MapPin, Search, Wrench } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useSpOnboardingDraft } from "@/hooks/useSpOnboardingDraft";
import { listServiceRequests, type ServiceRequestDTO } from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { toast } from "@/hooks/use-toast";

type SpIntervention = {
  id: string;
  client: string;
  serviceType: string;
  location: string;
  status: string;
  createdAt: string;
};

const normalize = (value: string | undefined | null) => String(value || "").trim().toLowerCase();

const SpInterventions = () => {
  const { user } = useAuth();
  const { detail, loading, error } = useSpOnboardingDraft();
  const [rows, setRows] = useState<SpIntervention[]>([]);
  const [search, setSearch] = useState("");
  const [loadingRows, setLoadingRows] = useState(true);
  const [apiBacked, setApiBacked] = useState(false);

  const providerId = user?.id || "";
  const providerName = detail?.onboarding?.company_name || "";

  const loadRows = useCallback(async () => {
    if (!providerId) {
      setRows([]);
      setLoadingRows(false);
      setApiBacked(false);
      return;
    }

    setLoadingRows(true);
    try {
      const requests = await listServiceRequests();
      const mapped = requests
        .filter((row: ServiceRequestDTO) => {
          return String(row.assigned_provider_id || "").trim() === providerId;
        })
        .map((row) => ({
          id: row.id,
          client: row.customer_tenant_name || row.client_name || row.customer_name || row.client || "Client",
          serviceType: row.service_type || row.type || "Assistance",
          location: row.location || row.address || "Unknown location",
          status: String(row.status || "pending"),
          createdAt: row.created_at ? new Date(row.created_at).toLocaleString("fr-FR", { hour12: false }) : "N/A",
        }));

      setRows(mapped);
      setApiBacked(true);
    } catch (err) {
      console.error("Failed to load SP interventions:", err);
      setRows([]);
      setApiBacked(false);
      toast({
        title: "Interventions unavailable",
        description: String((err as { message?: string })?.message || "Unable to load assigned interventions."),
        variant: "destructive",
      });
    } finally {
      setLoadingRows(false);
    }
  }, [providerId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    return rows.filter((row) =>
      [row.id, row.client, row.serviceType, row.location].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [rows, search]);

  if (loading || loadingRows) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  if (error) {
    return <EmptyState title="Interventions unavailable" description={error} />;
  }

  if (!detail?.onboarding) {
    return <EmptyState title="No SP record" description="Complete the onboarding flow before viewing interventions." />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interventions</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span>{providerName}</span>
            <DataSourceBadge backend={apiBacked} fallbackAllowed={false} />
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interventions..."
            className="h-9 pl-9 pr-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none w-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Assigned", value: filtered.length, icon: ClipboardList },
          { label: "Pending", value: filtered.filter((row) => normalize(row.status) === "pending").length, icon: Clock },
          { label: "In progress", value: filtered.filter((row) => ["assigned", "en_route", "arrived", "in_progress"].includes(normalize(row.status))).length, icon: Wrench },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No interventions found" description="No assigned intervention matches your current filters." actionLabel="Clear filters" onAction={() => setSearch("")} />
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["ID", "Client", "Service", "Location", "Status", "Created"].map((header) => (
                    <th key={header} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{row.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.client}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.serviceType}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {row.location}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground capitalize">{row.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpInterventions;
