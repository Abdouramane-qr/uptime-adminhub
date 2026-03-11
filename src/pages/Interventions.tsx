import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  Search, Eye, MapPin, CalendarIcon, CheckCircle2, Circle,
  Truck, User, Wrench, Navigation, Flag, Clock, ArrowRight,
  Zap, Activity, Plus, ChevronRight, Trash2, Edit,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  createServiceRequest,
  deleteServiceRequest,
  listProviderPresence,
  listServiceRequests,
  listTenants,
  type ProviderPresenceDTO,
  type ServiceRequestDTO,
  type TenantDTO,
  updateServiceRequestStatus,
} from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";
import ChatPanel from "@/components/ChatPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type InterventionStatus = "pending" | "assigned" | "en_route" | "arrived" | "in_progress" | "completed" | "cancelled";

interface TimelineStep {
  label: string;
  date: string;
  done: boolean;
  icon: React.ElementType;
}

interface Intervention {
  id: string;
  fleetManager: string;
  serviceProvider: string;
  technician: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: number;
  serviceType: string;
  status: InterventionStatus;
  created: string;
  location: string;
  timeline: TimelineStep[];
}

interface TenantOption {
  id: string;
  name: string;
}

interface ProviderOption {
  id: string;
  name: string;
}

const hasValidCoordinates = (coords: { lat: number; lng: number } | null) => {
  if (!coords) return false;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return false;
  if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) return false;
  if (Math.abs(coords.lat) < 0.000001 && Math.abs(coords.lng) < 0.000001) return false;
  return true;
};

const fullTimeline = (status: InterventionStatus, dates: Record<string, string>, labels: Record<string, string>): TimelineStep[] => {
  const steps: { key: string; labelKey: string; icon: React.ElementType }[] = [
    { key: "created", labelKey: "created", icon: Circle },
    { key: "assigned", labelKey: "assigned", icon: User },
    { key: "en_route", labelKey: "en_route", icon: Navigation },
    { key: "arrived", labelKey: "arrived", icon: Flag },
    { key: "in_progress", labelKey: "in_progress", icon: Wrench },
    { key: "completed", labelKey: "completed", icon: CheckCircle2 },
  ];

  if (status === "cancelled") {
    return [
      { label: labels.created || "Créé", date: dates.created || "", done: true, icon: Circle },
      { label: labels.cancelled || "Annulé", date: dates.cancelled || "", done: true, icon: CheckCircle2 },
    ];
  }

  const statusOrder = ["pending", "assigned", "en_route", "arrived", "in_progress", "completed"];
  const currentIdx = statusOrder.indexOf(status);

  return steps.map((step, i) => ({
    label: labels[step.labelKey] || step.labelKey,
    date: dates[step.key] || "",
    done: i <= currentIdx,
    icon: step.icon,
  }));
};

const now = () => format(new Date(), "d MMM, HH:mm");

const serviceTypes = ["Remorquage", "Changement pneu", "Batterie", "Réparation moteur", "Livraison carburant", "Ouverture"];
const fallbackFleetManagers: TenantOption[] = [
  { id: "fleet-1", name: "Metro Fleet Solutions" },
  { id: "fleet-2", name: "GreenHaul Logistics" },
  { id: "fleet-3", name: "CityDrive Fleet" },
  { id: "fleet-4", name: "TransEurope Carriers" },
];
const fallbackServiceProviders: ProviderOption[] = [
  { id: "provider-1", name: "AutoFix Pro Services" },
  { id: "provider-2", name: "QuickTow Emergency" },
  { id: "provider-3", name: "RoadStar Repairs" },
  { id: "provider-4", name: "TurboMech Garage" },
];
const fallbackTechnicians = ["Jean Dupont", "Marie Laurent", "Pierre Martin", "Luc Bernard", "Sophie Moreau"];

const emptyForm = {
  fleetManager: "", serviceProvider: "", technician: "", vehiclePlate: "", vehicleModel: "", vehicleYear: "2024", serviceType: "", location: "",
};

const extractBreakdownDetail = (details: string | undefined, label: string) => {
  if (!details) return null;
  const part = details
    .split("|")
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  if (!part) return null;
  return part.slice(label.length + 1).trim() || null;
};

const parseVehicleDetails = (details: string | undefined) => {
  const rawVehicle = extractBreakdownDetail(details, "Vehicle");
  const rawVehicleYear = extractBreakdownDetail(details, "Vehicle year");
  const rawTechnician = extractBreakdownDetail(details, "Technician");

  const vehicleText = rawVehicle || "";
  const segments = vehicleText.split(/\s+/).filter(Boolean);
  const platePattern = /^[A-Z0-9-]{5,}$/i;
  let plate = "N/A";

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (platePattern.test(segments[index])) {
      plate = segments[index];
      break;
    }
  }

  const model = vehicleText && plate !== "N/A"
    ? vehicleText.replace(plate, "").trim() || "N/A"
    : vehicleText || "N/A";
  const parsedYear = Number(rawVehicleYear || "");

  return {
    technician: rawTechnician || "Affectation technicien geree par le prestataire",
    vehiclePlate: plate,
    vehicleModel: model,
    vehicleYear: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : new Date().getFullYear(),
  };
};

const Interventions = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();

  const statusLabels: Record<string, string> = useMemo(() => ({
    created: t("interventions.created"),
    assigned: t("interventions.assigned"),
    en_route: t("interventions.en_route"),
    arrived: t("interventions.arrived"),
    in_progress: t("interventions.in_progress"),
    completed: t("interventions.completed"),
    cancelled: t("interventions.cancelled"),
  }), [t]);

  const makeInitial = (): Intervention[] => [
    {
      id: "INT-2026-0341", fleetManager: "Metro Fleet Solutions", serviceProvider: "AutoFix Pro Services",
      technician: "Jean Dupont", vehiclePlate: "AB-123-CD", vehicleModel: "Renault Master", vehicleYear: 2023,
      serviceType: "Remorquage", status: "in_progress", created: "28 Fév 2026", location: "Paris 12e, France",
      timeline: fullTimeline("in_progress", { created: "28 Fév, 10:15", assigned: "28 Fév, 10:32", en_route: "28 Fév, 10:50", arrived: "28 Fév, 11:00", in_progress: "28 Fév, 11:05" }, statusLabels),
    },
    {
      id: "INT-2026-0340", fleetManager: "GreenHaul Logistics", serviceProvider: "QuickTow Emergency",
      technician: "Marie Laurent", vehiclePlate: "EF-456-GH", vehicleModel: "Mercedes Sprinter", vehicleYear: 2022,
      serviceType: "Changement pneu", status: "completed", created: "27 Fév 2026", location: "Lyon 3e, France",
      timeline: fullTimeline("completed", { created: "27 Fév, 08:20", assigned: "27 Fév, 08:35", en_route: "27 Fév, 08:50", arrived: "27 Fév, 09:05", in_progress: "27 Fév, 09:10", completed: "27 Fév, 10:45" }, statusLabels),
    },
    {
      id: "INT-2026-0339", fleetManager: "CityDrive Fleet", serviceProvider: "RoadStar Repairs",
      technician: "Pierre Martin", vehiclePlate: "IJ-789-KL", vehicleModel: "Fiat Ducato", vehicleYear: 2024,
      serviceType: "Batterie", status: "pending", created: "27 Fév 2026", location: "Marseille 1er, France",
      timeline: fullTimeline("pending", { created: "27 Fév, 14:30" }, statusLabels),
    },
    {
      id: "INT-2026-0338", fleetManager: "TransEurope Carriers", serviceProvider: "TurboMech Garage",
      technician: "Luc Bernard", vehiclePlate: "MN-012-OP", vehicleModel: "Iveco Daily", vehicleYear: 2021,
      serviceType: "Réparation moteur", status: "en_route", created: "26 Fév 2026", location: "Toulouse, France",
      timeline: fullTimeline("en_route", { created: "26 Fév, 16:00", assigned: "26 Fév, 16:20", en_route: "26 Fév, 16:35" }, statusLabels),
    },
    {
      id: "INT-2026-0337", fleetManager: "Metro Fleet Solutions", serviceProvider: "AutoFix Pro Services",
      technician: "Sophie Moreau", vehiclePlate: "QR-345-ST", vehicleModel: "Peugeot Boxer", vehicleYear: 2023,
      serviceType: "Remorquage", status: "arrived", created: "25 Fév 2026", location: "Bordeaux, France",
      timeline: fullTimeline("arrived", { created: "25 Fév, 07:45", assigned: "25 Fév, 08:00", en_route: "25 Fév, 08:15", arrived: "25 Fév, 08:30" }, statusLabels),
    },
    {
      id: "INT-2026-0336", fleetManager: "GreenHaul Logistics", serviceProvider: "RoadStar Repairs",
      technician: "Jean Dupont", vehiclePlate: "UV-678-WX", vehicleModel: "Citroën Jumper", vehicleYear: 2022,
      serviceType: "Livraison carburant", status: "cancelled", created: "24 Fév 2026", location: "Nice, France",
      timeline: fullTimeline("cancelled", { created: "24 Fév, 11:00", cancelled: "24 Fév, 11:30" }, statusLabels),
    },
    {
      id: "INT-2026-0335", fleetManager: "CityDrive Fleet", serviceProvider: "QuickTow Emergency",
      technician: "Marie Laurent", vehiclePlate: "YZ-901-AB", vehicleModel: "Volkswagen Crafter", vehicleYear: 2024,
      serviceType: "Ouverture", status: "assigned", created: "23 Fév 2026", location: "Strasbourg, France",
      timeline: fullTimeline("assigned", { created: "23 Fév, 13:20", assigned: "23 Fév, 13:45" }, statusLabels),
    },
    {
      id: "INT-2026-0334", fleetManager: "TransEurope Carriers", serviceProvider: "TurboMech Garage",
      technician: "Pierre Martin", vehiclePlate: "CD-234-EF", vehicleModel: "Renault Trafic", vehicleYear: 2023,
      serviceType: "Changement pneu", status: "pending", created: "22 Fév 2026", location: "Nantes, France",
      timeline: fullTimeline("pending", { created: "22 Fév, 09:50" }, statusLabels),
    },
  ];

  const statusConfig: Record<InterventionStatus, { dot: string; bg: string; text: string; label: string; icon: React.ElementType }> = {
    pending: { dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground", label: t("status.pending"), icon: Clock },
    assigned: { dot: "bg-info", bg: "bg-info/10", text: "text-info", label: t("status.assigned"), icon: User },
    en_route: { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", label: t("status.en_route"), icon: Navigation },
    arrived: { dot: "bg-primary", bg: "bg-primary/10", text: "text-primary", label: t("status.arrived"), icon: Flag },
    in_progress: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: t("status.in_progress"), icon: Wrench },
    completed: { dot: "bg-primary", bg: "bg-primary/10", text: "text-primary", label: t("status.completed"), icon: CheckCircle2 },
    cancelled: { dot: "bg-destructive", bg: "bg-destructive/10", text: "text-destructive", label: t("status.cancelled"), icon: Circle },
  };

  const allStatuses: InterventionStatus[] = ["pending", "assigned", "en_route", "arrived", "in_progress", "completed", "cancelled"];
  const statusFlow: InterventionStatus[] = ["pending", "assigned", "en_route", "arrived", "in_progress", "completed"];

  const [data, setData] = useState<Intervention[]>(allowFallback ? makeInitial : []);
  const [apiBacked, setApiBacked] = useState(false);
  const [fleetManagerOptions, setFleetManagerOptions] = useState<TenantOption[]>(allowFallback ? fallbackFleetManagers : []);
  const [serviceProviderOptions, setServiceProviderOptions] = useState<ProviderOption[]>(allowFallback ? fallbackServiceProviders : []);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<InterventionStatus>>(new Set());
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "chat">("details");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Intervention | null>(null);
  const [locationType, setLocationType] = useState<"address" | "gps">("address");
  const [form, setForm] = useState(emptyForm);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Erreur", description: "Géolocalisation non supportée", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const val = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setForm(f => ({ ...f, location: val }));
        setLocationType("gps");
        toast({ title: "Position récupérée", description: val });
      },
      () => {
        toast({ title: "Erreur", description: "Impossible de récupérer votre position", variant: "destructive" });
      }
    );
  };

  const mapServiceRequest = useMemo(
    () => (r: ServiceRequestDTO): Intervention => {
      const status = (() => {
        const s = String(r.status || "").toLowerCase();
        if (s === "pending" || s === "assigned" || s === "en_route" || s === "arrived" || s === "in_progress" || s === "completed" || s === "cancelled") {
          return s as InterventionStatus;
        }
        return "pending";
      })();
      const details = parseVehicleDetails(r.breakdown_details);
      return {
        id: r.id,
        fleetManager: r.customer_tenant_name || r.client_name || r.customer_name || r.client || "N/A",
        serviceProvider: r.assigned_provider_name || r.provider_name || r.assigned_provider || "N/A",
        technician: details.technician,
        vehiclePlate: details.vehiclePlate,
        vehicleModel: details.vehicleModel,
        vehicleYear: details.vehicleYear,
        serviceType: r.service_type || r.type || "Assistance",
        status,
        created: r.created_at ? format(new Date(r.created_at), "d MMM yyyy") : format(new Date(), "d MMM yyyy"),
        location: r.location || r.address || extractBreakdownDetail(r.breakdown_details, "Location") || "N/A",
        timeline: fullTimeline(status, { created: r.created_at ? format(new Date(r.created_at), "d MMM, HH:mm") : now() }, statusLabels),
      };
    },
    [statusLabels],
  );

  useEffect(() => {
    const isFleetTenant = (tenant: TenantDTO) => {
      const type = String(tenant.tenant_type || tenant.type || "").toLowerCase();
      return type.includes("fleet");
    };
    const mapProviderOption = (row: ProviderPresenceDTO): ProviderOption | null => {
      const providerId = String(row.provider_id || "").trim();
      if (!providerId || row.assignable === false) {
        return null;
      }

      return {
        id: providerId,
        name: row.display_name || row.name || "Provider",
      };
    };

    const load = async () => {
      try {
        const [rows, tenants, providers] = await Promise.all([
          listServiceRequests(),
          listTenants(),
          listProviderPresence(),
        ]);

        setData(rows.map(mapServiceRequest));
        setFleetManagerOptions(
          tenants
            .filter(isFleetTenant)
            .map((tenant) => ({
              id: String(tenant.id),
              name: tenant.company_name || tenant.company || "Fleet",
            })),
        );
        setServiceProviderOptions(
          providers
            .map(mapProviderOption)
            .filter((provider): provider is ProviderOption => provider !== null),
        );
        setApiBacked(true);
      } catch (e) {
        console.error("Failed to load interventions data:", e);
        setApiBacked(false);
        reportFallbackHit("Interventions");
        if (!allowFallback) {
          setData([]);
          setFleetManagerOptions([]);
          setServiceProviderOptions([]);
        }
      }
    };

    void load();
  }, [allowFallback, mapServiceRequest]);

  const toggleFilter = (status: InterventionStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const filtered = data.filter((i) => {
    const matchSearch =
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.fleetManager.toLowerCase().includes(search.toLowerCase()) ||
      i.serviceProvider.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeFilters.size === 0 || activeFilters.has(i.status);
    return matchSearch && matchStatus;
  });

  const countByStatus = (s: InterventionStatus) => data.filter((i) => i.status === s).length;

  const openModal = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setActiveTab("details");
    setModalOpen(true);
  };

  const activeCount = data.filter(i => ["en_route", "arrived", "in_progress"].includes(i.status)).length;
  const completedCount = data.filter(i => i.status === "completed").length;

  const parseLatLng = (raw: string) => {
    const match = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!match) return null;
    return {
      lat: Number(match[1]),
      lng: Number(match[2]),
    };
  };

  const handleCreate = async () => {
    const technicianRequired = !(apiBacked || !allowFallback);
    if (!form.fleetManager || !form.serviceProvider || (technicianRequired && !form.technician) || !form.serviceType || !form.vehiclePlate || !form.vehicleModel || !form.location) {
      toast({ title: t("interventions.required_fields"), description: t("interventions.fill_all"), variant: "destructive" });
      return;
    }
    const selectedFleetManager = fleetManagerOptions.find((item) => item.id === form.fleetManager);
    const selectedServiceProvider = serviceProviderOptions.find((item) => item.id === form.serviceProvider);
    if (!selectedFleetManager || !selectedServiceProvider) {
      toast({ title: t("interventions.required_fields"), description: t("interventions.fill_all"), variant: "destructive" });
      return;
    }

    const parsedCoords = parseLatLng(form.location);
    
    try {
      if (apiBacked || !allowFallback) {
        if (!hasValidCoordinates(parsedCoords)) {
          toast({ 
            title: "Coordonnees requises", 
            description: "Utilisez une position GPS valide au format 'Latitude, Longitude' ou le bouton de geolocalisation.", 
            variant: "destructive" 
          });
          return;
        }

        const lat = parsedCoords.lat;
        const lng = parsedCoords.lng;

        const created = await createServiceRequest({
          service_type: form.serviceType,
          breakdown_details: [
            `Vehicle: ${form.vehicleModel} ${form.vehiclePlate}`.trim(),
            `Vehicle year: ${form.vehicleYear}`.trim(),
            `Location: ${form.location}`,
          ].join(" | "),
          pickup_lat: lat,
          pickup_lng: lng,
          customer_tenant_id: selectedFleetManager.id,
          assigned_provider_id: selectedServiceProvider.id,
          status: "assigned",
        }) as { item?: ServiceRequestDTO };

        if (!created.item) {
          throw new Error("service_request_create_missing_item");
        }
        
        setData((prev) => [mapServiceRequest(created.item!), ...prev]);
        toast({ title: t("interventions.created_success"), description: `${created.item.id}` });
      } else {
        // Pure mock mode
        const nextId = `INT-2026-${String(data.length + 1).padStart(4, "0")}`;
        const newIntervention: Intervention = {
          id: nextId, fleetManager: selectedFleetManager.name, serviceProvider: selectedServiceProvider.name,
          technician: form.technician, vehiclePlate: form.vehiclePlate, vehicleModel: form.vehicleModel,
          vehicleYear: Number(form.vehicleYear), serviceType: form.serviceType, location: form.location,
          status: "assigned", created: format(new Date(), "d MMM yyyy"),
          timeline: fullTimeline("assigned", { created: now(), assigned: now() }, statusLabels),
        };
        setData([newIntervention, ...data]);
        toast({ title: t("interventions.created_success"), description: `${nextId}` });
      }
      
      setCreateOpen(false);
      setForm(emptyForm);
    } catch (e) {
      console.error("Create intervention error:", e);
      toast({ title: t("interventions.create_error"), description: t("interventions.create_error_desc"), variant: "destructive" });
    }
  };

  const advanceStatus = async (intervention: Intervention) => {
    const idx = statusFlow.indexOf(intervention.status);
    if (idx < 0 || idx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[idx + 1];
    
    try {
      if (apiBacked || !allowFallback) {
        const res = await updateServiceRequestStatus(intervention.id, { status: nextStatus }) as { item?: ServiceRequestDTO };
        const updated = res?.item ? mapServiceRequest(res.item) : null;
        
        if (updated) {
          setData(data.map(d => d.id === intervention.id ? updated : d));
          setSelectedIntervention(updated);
        } else {
          // Fallback if API ok but no item returned
          const stepKeyMap: Record<string, string> = { pending: "created", assigned: "assigned", en_route: "en_route", arrived: "arrived", in_progress: "in_progress", completed: "completed" };
          const dates: Record<string, string> = {};
          statusFlow.forEach((s, i) => {
            if (i <= idx + 1) dates[stepKeyMap[s]] = i <= idx ? (intervention.timeline[i]?.date || now()) : now();
          });
          const localUpdated: Intervention = { ...intervention, status: nextStatus, timeline: fullTimeline(nextStatus, dates, statusLabels) };
          setData(data.map(d => d.id === intervention.id ? localUpdated : d));
          setSelectedIntervention(localUpdated);
        }
      } else {
        // Pure mock mode
        const stepKeyMap: Record<string, string> = { pending: "created", assigned: "assigned", en_route: "en_route", arrived: "arrived", in_progress: "in_progress", completed: "completed" };
        const dates: Record<string, string> = {};
        statusFlow.forEach((s, i) => {
          if (i <= idx + 1) dates[stepKeyMap[s]] = i <= idx ? (intervention.timeline[i]?.date || now()) : now();
        });
        const updated: Intervention = { ...intervention, status: nextStatus, timeline: fullTimeline(nextStatus, dates, statusLabels) };
        setData(data.map(d => d.id === intervention.id ? updated : d));
        setSelectedIntervention(updated);
      }
      toast({ title: t("interventions.status_updated"), description: `${intervention.id} → ${statusConfig[nextStatus].label}` });
    } catch (e) {
      console.error("Update status error:", e);
      toast({ title: t("interventions.update_error"), description: t("interventions.update_error_desc"), variant: "destructive" });
    }
  };

  const cancelIntervention = async (intervention: Intervention) => {
    try {
      if (apiBacked || !allowFallback) {
        const res = await updateServiceRequestStatus(intervention.id, { status: "cancelled" }) as { item?: ServiceRequestDTO };
        const updated = res?.item ? mapServiceRequest(res.item) : null;
        
        if (updated) {
          setData(data.map(d => d.id === intervention.id ? updated : d));
          setSelectedIntervention(updated);
        } else {
          const localUpdated: Intervention = {
            ...intervention, status: "cancelled",
            timeline: fullTimeline("cancelled", { created: intervention.timeline[0]?.date || now(), cancelled: now() }, statusLabels),
          };
          setData(data.map(d => d.id === intervention.id ? localUpdated : d));
          setSelectedIntervention(localUpdated);
        }
      } else {
        const updated: Intervention = {
          ...intervention, status: "cancelled",
          timeline: fullTimeline("cancelled", { created: intervention.timeline[0]?.date || now(), cancelled: now() }, statusLabels),
        };
        setData(data.map(d => d.id === intervention.id ? updated : d));
        setSelectedIntervention(updated);
      }
      toast({ title: t("interventions.cancelled_success"), description: `${intervention.id}` });
    } catch (e) {
      console.error("Cancel intervention error:", e);
      toast({ title: t("interventions.update_error"), description: t("interventions.update_error_desc"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (apiBacked || !allowFallback) {
        await deleteServiceRequest(deleteTarget.id);
      }
      setData(data.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      setModalOpen(false);
      setSelectedIntervention(null);
      toast({ title: t("interventions.deleted_success"), description: `${deleteTarget.id}` });
    } catch (e) {
      console.error("Delete intervention error:", e);
      toast({ title: t("interventions.update_error"), description: t("interventions.update_error_desc"), variant: "destructive" });
    }
  };

  const tableHeaders = [
    t("interventions.col_id"), t("interventions.col_manager"), t("interventions.col_provider"),
    t("interventions.col_technician"), t("interventions.col_service"), t("interventions.col_status"),
    t("interventions.col_progress"), t("interventions.col_date"), "",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("interventions.title")}</h1>
          <div className="text-muted-foreground mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>{t("interventions.subtitle")}</span>
              <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
            </div>
            <p className="text-sm max-w-3xl opacity-80 italic">
              {t("interventions.scope_note")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-success">{activeCount} {t("interventions.active")}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{completedCount} {t("interventions.finished")}</span>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            {t("interventions.new")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("interventions.search")}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <DatePicker label={t("interventions.start_date")} date={dateFrom} onChange={setDateFrom} />
        <DatePicker label={t("interventions.end_date")} date={dateTo} onChange={setDateTo} />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {allStatuses.map((s) => {
          const cfg = statusConfig[s];
          const active = activeFilters.has(s);
          const count = countByStatus(s);
          return (
            <button key={s} onClick={() => toggleFilter(s)}
              className={cn("inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200",
                active ? `${cfg.bg} ${cfg.text} border-current shadow-sm` : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30 hover:bg-muted/50"
              )}>
              <span className={cn("h-2 w-2 rounded-full", active ? cfg.dot : "bg-muted-foreground/30")} />
              {cfg.label}
              <span className="font-bold">{count}</span>
            </button>
          );
        })}
        {activeFilters.size > 0 && (
          <button onClick={() => setActiveFilters(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground px-2 transition-colors underline underline-offset-2">
            {t("interventions.reset_filters")}
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title={t("interventions.no_results")}
          description={t("interventions.no_results_desc")}
          actionLabel={t("interventions.reset_filters")}
          onAction={() => { setSearch(""); setActiveFilters(new Set()); }}
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {tableHeaders.map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 whitespace-nowrap uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const cfg = statusConfig[row.status];
                  const doneSteps = row.timeline.filter((s) => s.done).length;
                  const totalSteps = row.timeline.length;
                  const pct = Math.round((doneSteps / totalSteps) * 100);

                  return (
                    <tr key={row.id} onClick={() => openModal(row)} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group">
                      <td className="px-4 py-3.5"><span className="text-sm font-mono font-medium text-primary">{row.id}</span></td>
                      <td className="px-4 py-3.5 text-sm text-foreground font-medium">{row.fleetManager}</td>
                      <td className="px-4 py-3.5 text-sm text-foreground">{row.serviceProvider}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{row.technician}</td>
                      <td className="px-4 py-3.5"><span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground font-medium">{row.serviceType}</span></td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg", cfg.bg, cfg.text)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-[11px] text-muted-foreground font-medium w-8">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{row.created}</td>
                      <td className="px-4 py-3.5">
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">{filtered.length} {t("interventions.of_total")} {data.length} interventions</p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          {selectedIntervention && (() => {
            const cfg = statusConfig[selectedIntervention.status];
            const doneSteps = selectedIntervention.timeline.filter((s) => s.done).length;
            const totalSteps = selectedIntervention.timeline.length;
            const pct = Math.round((doneSteps / totalSteps) * 100);
            const canAdvance = statusFlow.indexOf(selectedIntervention.status) >= 0 && statusFlow.indexOf(selectedIntervention.status) < statusFlow.length - 1;
            const canCancel = selectedIntervention.status !== "completed" && selectedIntervention.status !== "cancelled";
            const nextStatus = canAdvance ? statusConfig[statusFlow[statusFlow.indexOf(selectedIntervention.status) + 1]] : null;

            return (
              <>
                <div className="p-6 border-b border-border">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <DialogTitle className="text-lg font-bold text-foreground font-mono">{selectedIntervention.id}</DialogTitle>
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-lg", cfg.bg, cfg.text)}>{cfg.label}</span>
                    </div>
                    <DialogDescription className="sr-only">
                      Détails de l'intervention {selectedIntervention.id}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-xs font-bold text-foreground">{pct}%</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canAdvance && nextStatus && (
                      <Button size="sm" className="rounded-xl gap-2" onClick={() => advanceStatus(selectedIntervention)}>
                        <ChevronRight className="h-3.5 w-3.5" />
                        {t("interventions.move_to").replace("{status}", nextStatus.label)}
                      </Button>
                    )}
                    {canCancel && (
                      <Button size="sm" variant="outline" className="rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => cancelIntervention(selectedIntervention)}>
                        {t("interventions.cancel")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="rounded-xl gap-2 text-destructive ml-auto" onClick={() => { setDeleteTarget(selectedIntervention); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("interventions.delete")}
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <div className="px-6 border-b border-border bg-muted/10">
                    <TabsList className="h-11 w-full bg-transparent justify-start gap-6 rounded-none p-0 border-none">
                      <TabsTrigger value="details" className="relative h-11 rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all">
                        Détails
                      </TabsTrigger>
                      <TabsTrigger value="chat" className="relative h-11 rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all gap-2">
                        Chat
                        <Badge variant="secondary" className="h-4 px-1 text-[9px] font-bold bg-primary/10 text-primary border-primary/20">LIVE</Badge>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="details" className="p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-2 gap-3">
                    <InfoCard icon={Truck} title={t("interventions.fleet_manager")} value={selectedIntervention.fleetManager} />
                    <InfoCard icon={Wrench} title={t("interventions.service_provider")} value={selectedIntervention.serviceProvider} />
                    <InfoCard icon={User} title={t("interventions.technician")} value={selectedIntervention.technician} />
                    <InfoCard icon={MapPin} title={t("interventions.location")} value={selectedIntervention.location} />
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">{t("interventions.vehicle")}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div><p className="text-[11px] text-muted-foreground">{t("interventions.vehicle_plate")}</p><p className="text-sm font-bold text-foreground font-mono">{selectedIntervention.vehiclePlate}</p></div>
                      <div><p className="text-[11px] text-muted-foreground">{t("interventions.vehicle_model")}</p><p className="text-sm font-semibold text-foreground">{selectedIntervention.vehicleModel}</p></div>
                      <div><p className="text-[11px] text-muted-foreground">{t("interventions.vehicle_year")}</p><p className="text-sm font-semibold text-foreground">{selectedIntervention.vehicleYear}</p></div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-4 font-semibold uppercase tracking-wider">{t("interventions.timeline")}</p>
                    <div className="space-y-0">
                      {selectedIntervention.timeline.map((step, i) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={i} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                step.done ? "bg-gradient-to-br from-primary/20 to-accent/20 text-primary" : "bg-muted text-muted-foreground"
                              )}>
                                <StepIcon className="h-4 w-4" />
                              </div>
                              {i < selectedIntervention.timeline.length - 1 && (
                                <div className={cn("w-0.5 h-7", step.done ? "bg-primary/30" : "bg-border")} />
                              )}
                            </div>
                            <div className="pb-5 pt-1.5">
                              <p className={cn("text-sm font-medium", step.done ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                              {step.date ? (
                                <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground/40 mt-0.5 italic">{t("interventions.waiting")}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="p-6 pt-2 animate-in fade-in slide-in-from-bottom-2">
                  <ChatPanel 
                    requestId={selectedIntervention.id} 
                    customerName={selectedIntervention.fleetManager}
                    providerName={selectedIntervention.serviceProvider}
                  />
                </TabsContent>
              </Tabs>
            </>
          );
        })()}
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{t("interventions.new")}</DialogTitle>
            <DialogDescription>
              Créez une nouvelle demande d'assistance pour une flotte.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("interventions.fleet_manager")}</Label>
              <Select value={form.fleetManager} onValueChange={v => setForm({ ...form, fleetManager: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("interventions.select")} /></SelectTrigger>
                <SelectContent>{fleetManagerOptions.map((fleet) => <SelectItem key={fleet.id} value={fleet.id}>{fleet.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("interventions.service_provider")}</Label>
              <Select value={form.serviceProvider} onValueChange={v => setForm({ ...form, serviceProvider: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("interventions.select")} /></SelectTrigger>
                <SelectContent>{serviceProviderOptions.map((provider) => <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("interventions.technician")}</Label>
              {apiBacked ? (
                <Input
                  className="rounded-xl"
                  value="Affectation technicien geree ensuite par le prestataire"
                  disabled
                />
              ) : (
                <Select value={form.technician} onValueChange={v => setForm({ ...form, technician: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("interventions.select")} /></SelectTrigger>
                  <SelectContent>{fallbackTechnicians.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("interventions.service_type")}</Label>
              <Select value={form.serviceType} onValueChange={v => setForm({ ...form, serviceType: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("interventions.select")} /></SelectTrigger>
                <SelectContent>{serviceTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("interventions.vehicle_plate")}</Label>
              <Input className="rounded-xl" placeholder="AB-123-CD" value={form.vehiclePlate} onChange={e => setForm({ ...form, vehiclePlate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("interventions.vehicle_model")}</Label>
              <Input className="rounded-xl" placeholder="Renault Master" value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("interventions.vehicle_year")}</Label>
              <Input className="rounded-xl" type="number" value={form.vehicleYear} onChange={e => setForm({ ...form, vehicleYear: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("interventions.location")}</Label>
                <div className="flex bg-muted p-1 rounded-lg gap-1">
                  <button 
                    onClick={() => setLocationType("address")}
                    className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", locationType === "address" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                  >
                    {t("interventions.location_address")}
                  </button>
                  <button 
                    onClick={() => setLocationType("gps")}
                    className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", locationType === "gps" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                  >
                    {t("interventions.location_gps")}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 rounded-xl" 
                    placeholder={locationType === "address" ? "Paris 12e, France" : t("interventions.location_placeholder_gps")} 
                    value={form.location} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl shrink-0" 
                  title={t("interventions.get_my_location")}
                  onClick={getCurrentLocation}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setCreateOpen(false); setForm(emptyForm); }}>{t("common.cancel")}</Button>
            <Button className="rounded-xl" onClick={handleCreate}>{t("interventions.create_intervention")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("interventions.confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("interventions.delete_warning").replace("{id}", deleteTarget?.id || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const InfoCard = ({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: string }) => (
  <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[11px] text-muted-foreground font-medium">{title}</p>
    </div>
    <p className="text-sm font-semibold text-foreground">{value}</p>
  </div>
);

const DatePicker = ({ label, date, onChange }: { label: string; date?: Date; onChange: (d?: Date) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className={cn("h-10 px-4 rounded-xl border border-input bg-card text-sm flex items-center gap-2 transition-all hover:border-primary/30", date ? "text-foreground" : "text-muted-foreground")}>
        <CalendarIcon className="h-3.5 w-3.5" />
        {date ? format(date, "d MMM yyyy") : label}
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={date} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
    </PopoverContent>
  </Popover>
);

export default Interventions;
