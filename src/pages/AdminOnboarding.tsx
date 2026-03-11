import { useCallback, useEffect, useState } from "react";
import { 
  Check, X, Eye, Search, Filter, Building, Mail, Phone, 
  MapPin, Calendar, ClipboardCheck, AlertCircle, Clock,
  User, Truck, BadgeEuro
} from "lucide-react";
import { 
  listOnboardingQueue, 
  getOnboardingDetail, 
  onboardingAction,
  onboardingCreateResource,
  type OnboardingItemDTO 
} from "@/lib/adminPortalClient";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import DataSourceBadge from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";
import { serviceCatalog } from "@/lib/serviceCatalog";

const AdminOnboarding = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<OnboardingItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rejectDialogOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activationForm, setActivationForm] = useState({
    displayName: "",
    lat: "",
    lng: "",
    serviceIds: "",
    isAvailable: true,
  });
  const [techForm, setTechForm] = useState({ full_name: "", phone: "", skill: "" });
  const [driverForm, setDriverForm] = useState({ full_name: "", phone: "", license_no: "" });
  const [assetForm, setAssetForm] = useState({
    service_id: "",
    base_price: "",
    label: "",
    plate: "",
    vehicle_type: "",
    full_name: "",
    phone: "",
    license_no: "",
  });

  const loadDetail = useCallback(async (id: string) => {
    const data = await getOnboardingDetail(id);
    setDetail(data);
    setActivationForm({
      displayName: data?.onboarding?.company_name || "",
      lat: "",
      lng: "",
      serviceIds: "",
      isAvailable: true,
    });
    setTechForm({ full_name: "", phone: "", skill: "" });
    setDriverForm({ full_name: "", phone: "", license_no: "" });
    setAssetForm({
      service_id: "",
      base_price: "",
      label: "",
      plate: "",
      vehicle_type: "",
      full_name: "",
      phone: "",
      license_no: "",
    });
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (accountTypeFilter !== "all") params.accountType = accountTypeFilter;
      if (search) params.q = search;
      
      const data = await listOnboardingQueue(params);
      setItems(data);
    } catch (e) {
      console.error("Failed to load onboarding queue:", e);
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger la file d'attente.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [accountTypeFilter, search, statusFilter]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadQueue();
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    setDetail(null);
    try {
      await loadDetail(id);
    } catch (e) {
      toast({ title: "Erreur", description: "Détails introuvables.", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAction = async (action: "approve" | "reject" | "submit") => {
    if (!selectedId) return;
    try {
      let body: Record<string, unknown> = action === "reject" ? { reason: rejectReason } : {};

      if (action === "approve" && detail?.onboarding?.account_type === "sp") {
        const lat = activationForm.lat.trim();
        const lng = activationForm.lng.trim();
        const hasLatLng = lat.length > 0 || lng.length > 0;

        if (hasLatLng) {
          const parsedLat = Number(lat);
          const parsedLng = Number(lng);
          if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
            toast({
              title: "Coordonnees invalides",
              description: "Utilisez des nombres valides pour la latitude et la longitude.",
              variant: "destructive",
            });
            return;
          }
          if (Math.abs(parsedLat) < 0.000001 && Math.abs(parsedLng) < 0.000001) {
            toast({
              title: "Coordonnees invalides",
              description: "La position 0,0 n'est pas autorisee. Laissez vide pour utiliser la zone ou renseignez une position reelle.",
              variant: "destructive",
            });
            return;
          }
        }

        body = {
          activation: {
            display_name: activationForm.displayName.trim() || detail?.onboarding?.company_name || "Service Provider",
            lat: lat.length > 0 ? Number(lat) : null,
            lng: lng.length > 0 ? Number(lng) : null,
            service_ids: activationForm.serviceIds
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean),
            is_available: activationForm.isAvailable,
          },
        };
      }

      await onboardingAction(selectedId, action, body);
      toast({ 
        title:
          action === "approve"
            ? "Dossier approuvé"
            : action === "submit"
              ? "Dossier soumis"
              : "Dossier rejeté",
        description: `Le dossier a été mis à jour avec succès.`
      });
      setRejectOpen(false);
      await loadDetail(selectedId);
      void loadQueue();
    } catch (e) {
      toast({
        title: "Erreur",
        description: String((e as { message?: string })?.message || "L'action a échoué."),
        variant: "destructive",
      });
    }
  };

  const handleAddResource = async (resource: "technicians" | "pricing" | "vehicles" | "drivers") => {
    if (!selectedId) return;

    try {
      if (resource === "technicians") {
        if (!techForm.full_name.trim()) throw new Error("Le nom du technicien est requis.");
        await onboardingCreateResource(selectedId, "technicians", {
          full_name: techForm.full_name.trim(),
          phone: techForm.phone.trim() || null,
          skill: techForm.skill.trim() || null,
        });
        setTechForm({ full_name: "", phone: "", skill: "" });
      }

      if (resource === "pricing") {
        const serviceId = assetForm.service_id.trim();
        const basePrice = Number(assetForm.base_price);
        if (!serviceId || !Number.isFinite(basePrice)) {
          throw new Error("Le service et le prix de base sont requis.");
        }
        await onboardingCreateResource(selectedId, "pricing", {
          service_id: serviceId,
          base_price: basePrice,
          currency: "XOF",
        });
        setAssetForm((prev) => ({ ...prev, service_id: "", base_price: "" }));
      }

      if (resource === "vehicles") {
        if (!assetForm.label.trim()) throw new Error("Le libellé du véhicule est requis.");
        await onboardingCreateResource(selectedId, "vehicles", {
          label: assetForm.label.trim(),
          plate: assetForm.plate.trim() || null,
          vehicle_type: assetForm.vehicle_type.trim() || null,
        });
        setAssetForm((prev) => ({ ...prev, label: "", plate: "", vehicle_type: "" }));
      }

      if (resource === "drivers") {
        if (!driverForm.full_name.trim()) throw new Error("Le nom du conducteur est requis.");
        await onboardingCreateResource(selectedId, "drivers", {
          full_name: driverForm.full_name.trim(),
          phone: driverForm.phone.trim() || null,
          license_no: driverForm.license_no.trim() || null,
        });
        setDriverForm({ full_name: "", phone: "", license_no: "" });
      }

      await loadDetail(selectedId);
      void loadQueue();
      toast({ title: "Ressource ajoutée", description: "Le dossier a été enrichi." });
    } catch (e) {
      toast({
        title: "Erreur",
        description: String((e as { message?: string })?.message || "Impossible d'ajouter la ressource."),
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (resource: string, itemId: string) => {
    if (!selectedId || !confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    
    try {
      const { onboardingDeleteResource } = await import("@/lib/adminPortalClient");
      await onboardingDeleteResource(selectedId, resource, itemId);
      await loadDetail(selectedId);
      void loadQueue();
      toast({ title: "Ressource supprimée", description: "L'élément a été retiré du dossier." });
    } catch (e) {
      toast({
        title: "Erreur",
        description: String((e as { message?: string })?.message || "Échec de la suppression."),
        variant: "destructive",
      });
    }
  };

  const statusMap: any = {
    draft: { label: "Brouillon", color: "bg-muted text-muted-foreground", icon: Clock },
    pending_review: { label: "En révision", color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
    approved: { label: "Approuvé", color: "bg-success/10 text-success border-success/20", icon: Check },
    rejected: { label: "Rejeté", color: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
  };

  const teamMembers = detail?.onboarding?.account_type === 'sp' 
    ? (detail?.resources?.technicians ?? [])
    : (detail?.resources?.drivers ?? []);

  const assetItems = detail?.onboarding?.account_type === 'sp'
    ? (detail?.resources?.pricing ?? [])
    : (detail?.resources?.vehicles ?? []);

  const draftRequirementsMet = detail?.onboarding?.account_type === "sp"
    ? teamMembers.length > 0 && assetItems.length > 0
    : detail?.onboarding?.account_type === "fleet_manager"
      ? teamMembers.length > 0 && assetItems.length > 0
      : true;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("onboarding.title")}</h1>
          <div className="text-muted-foreground mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>{t("onboarding.subtitle")}</span>
              <DataSourceBadge backend={true} fallbackAllowed={false} />
            </div>
            <p className="text-sm max-w-3xl opacity-80 italic">
              {t("onboarding.scope_note")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder={t("onboarding.search_placeholder")}
            className="pl-9"
          />
        </form>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none transition-all"
        >
          <option value="all">{t("onboarding.all_status")}</option>
          <option value="pending_review">{t("onboarding.status_pending")}</option>
          <option value="approved">{t("onboarding.status_approved")}</option>
          <option value="rejected">{t("onboarding.status_rejected")}</option>
          <option value="draft">{t("onboarding.status_draft")}</option>
        </select>
        <select
          value={accountTypeFilter}
          onChange={(e) => setAccountTypeFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none transition-all"
        >
          <option value="all">{t("onboarding.all_types")}</option>
          <option value="sp">{t("onboarding.sp")}</option>
          <option value="fleet_manager">{t("onboarding.fleet")}</option>
        </select>
        <Button onClick={() => loadQueue()} variant="outline" className="rounded-xl">
          {t("onboarding.refresh")}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          title="Aucun dossier" 
          description="Aucune demande d'onboarding ne correspond à vos critères."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const status = statusMap[item.status || 'draft'] || statusMap.draft;
            return (
              <div 
                key={item.id} 
                className="group bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer"
                onClick={() => openDetail(item.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className={cn("rounded-lg px-2 py-0.5", status.color)}>
                    <status.icon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                
                <h3 className="font-bold text-foreground text-lg truncate mb-1">
                  {item.company_name || "Sans nom"}
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BadgeEuro className="h-3.5 w-3.5 mr-2" />
                    {item.account_type === 'sp' ? 'Prestataire (SP)' : 'Gestionnaire de Flotte'}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 mr-2" />
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </div>
                </div>

                <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 text-primary group-hover:translate-x-1 transition-transform">
                  Voir le dossier <Eye className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <SheetTitle className="text-2xl flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Détails du dossier
            </SheetTitle>
            <SheetDescription>
              Vérifiez les informations fournies avant de valider le compte.
            </SheetDescription>
          </SheetHeader>

          {loadingDetail ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Chargement des données...</p>
            </div>
          ) : detail ? (
            <div className="py-6 space-y-8">
              {/* Infos générales */}
              <section className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" /> Informations Entreprise
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground">Raison sociale</p>
                    <p className="font-medium">{detail.onboarding?.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type de compte</p>
                    <p className="font-medium capitalize">{detail.onboarding?.account_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Code</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{detail.onboarding?.code}</code>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Zone</p>
                    <p className="font-medium">{detail.onboarding?.zone || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Ressources (Onglets) */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="tech">{detail.onboarding?.account_type === 'sp' ? 'Techniciens' : 'Conducteurs'}</TabsTrigger>
                  <TabsTrigger value="assets">{detail.onboarding?.account_type === 'sp' ? 'Services' : 'Véhicules'}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-xl">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Email de contact</p>
                        <p>{detail.onboarding?.contact_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-xl">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Téléphone</p>
                        <p>{detail.onboarding?.contact_phone || 'Non renseigné'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tech">
                  <div className="space-y-3">
                    {['draft', 'approved'].includes(detail.onboarding?.status) && detail.onboarding?.account_type === 'sp' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border">
                        <Input
                          value={techForm.full_name}
                          onChange={(e) => setTechForm((prev) => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Nom complet"
                        />
                        <Input
                          value={techForm.phone}
                          onChange={(e) => setTechForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Téléphone"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={techForm.skill}
                            onChange={(e) => setTechForm((prev) => ({ ...prev, skill: e.target.value }))}
                            placeholder="Spécialité"
                          />
                          <Button type="button" onClick={() => handleAddResource("technicians")}>Ajouter</Button>
                        </div>
                      </div>
                    )}
                    {['draft', 'approved'].includes(detail.onboarding?.status) && detail.onboarding?.account_type === 'fleet_manager' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border">
                        <Input
                          value={driverForm.full_name}
                          onChange={(e) => setDriverForm((prev) => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Nom complet"
                        />
                        <Input
                          value={driverForm.phone}
                          onChange={(e) => setDriverForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Téléphone"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={driverForm.license_no}
                            onChange={(e) => setDriverForm((prev) => ({ ...prev, license_no: e.target.value }))}
                            placeholder="No permis"
                          />
                          <Button type="button" onClick={() => handleAddResource("drivers")}>Ajouter</Button>
                        </div>
                      </div>
                    )}
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">Aucun membre enregistré.</p>
                    ) : (
                      teamMembers.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {t.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{t.full_name}</p>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                {t.phone && <span>{t.phone}</span>}
                                {t.skill && <span>• {t.skill}</span>}
                                {t.license_no && <span>• {t.license_no}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="assets">
                  <div className="space-y-3">
                    {['draft', 'approved'].includes(detail.onboarding?.status) && detail.onboarding?.account_type === 'sp' && (
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-2 p-3 rounded-lg border border-border">
                        <select
                          value={assetForm.service_id}
                          onChange={(e) => setAssetForm((prev) => ({ ...prev, service_id: e.target.value }))}
                          className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                        >
                          <option value="">Choisir un service</option>
                          {serviceCatalog.map((service) => (
                            <option key={service.id} value={service.id}>{service.label}</option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          value={assetForm.base_price}
                          onChange={(e) => setAssetForm((prev) => ({ ...prev, base_price: e.target.value }))}
                          placeholder="Prix de base"
                        />
                        <Button type="button" onClick={() => handleAddResource("pricing")}>Ajouter</Button>
                      </div>
                    )}
                    {['draft', 'approved'].includes(detail.onboarding?.status) && detail.onboarding?.account_type === 'fleet_manager' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg border border-border">
                        <Input
                          value={assetForm.label}
                          onChange={(e) => setAssetForm((prev) => ({ ...prev, label: e.target.value }))}
                          placeholder="Libellé véhicule"
                        />
                        <Input
                          value={assetForm.plate}
                          onChange={(e) => setAssetForm((prev) => ({ ...prev, plate: e.target.value }))}
                          placeholder="Immatriculation"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={assetForm.vehicle_type}
                            onChange={(e) => setAssetForm((prev) => ({ ...prev, vehicle_type: e.target.value }))}
                            placeholder="Type véhicule"
                          />
                          <Button type="button" onClick={() => handleAddResource("vehicles")}>Ajouter</Button>
                        </div>
                      </div>
                    )}
                    {assetItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">Aucun élément enregistré.</p>
                    ) : (
                      assetItems.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                          <div className="flex items-center gap-3">
                            {a.service_id ? <BadgeEuro className="h-4 w-4 text-primary" /> : <Truck className="h-4 w-4 text-primary" />}
                            <div>
                              <p className="text-sm font-medium">
                                {a.service_id ? (serviceCatalog.find(s => s.id === a.service_id)?.label || a.service_id) : a.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {a.base_price ? `${a.base_price} €` : `${a.plate || ''} ${a.vehicle_type ? `• ${a.vehicle_type}` : ''}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              {detail.onboarding?.status === 'pending_review' && detail.onboarding?.account_type === 'sp' && (
                <section className="space-y-4 pt-2 border-t">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Activation provider presence
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Nom affiche sur la carte</p>
                      <Input
                        value={activationForm.displayName}
                        onChange={(e) => setActivationForm((prev) => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Nom visible sur la carte"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Latitude optionnelle</p>
                      <Input
                        value={activationForm.lat}
                        onChange={(e) => setActivationForm((prev) => ({ ...prev, lat: e.target.value }))}
                        placeholder="12.3714"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Longitude optionnelle</p>
                      <Input
                        value={activationForm.lng}
                        onChange={(e) => setActivationForm((prev) => ({ ...prev, lng: e.target.value }))}
                        placeholder="-1.5197"
                      />
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Service IDs optionnels (separes par virgule)</p>
                      <Input
                        value={activationForm.serviceIds}
                        onChange={(e) => setActivationForm((prev) => ({ ...prev, serviceIds: e.target.value }))}
                        placeholder="towing, tire_change"
                      />
                    </div>
                    <label className="col-span-2 flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={activationForm.isAvailable}
                        onChange={(e) => setActivationForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      Rendre le provider disponible apres approbation
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Si les coordonnees ou les services sont laisses vides, le backend utilisera la zone et les services pricing disponibles.
                  </p>
                </section>
              )}

              {detail.onboarding?.status === 'pending_review' && (
                <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-destructive text-destructive hover:bg-destructive/5"
                    onClick={() => setRejectOpen(true)}
                  >
                    <X className="h-4 w-4 mr-2" /> Rejeter le dossier
                  </Button>
                  <Button 
                    className="rounded-xl"
                    onClick={() => handleAction("approve")}
                  >
                    <Check className="h-4 w-4 mr-2" /> Approuver et Activer
                  </Button>
                </div>
              )}

              {detail.onboarding?.status === 'draft' && (
                <div className="pt-6 border-t">
                  <Button
                    className="w-full rounded-xl"
                    onClick={() => handleAction("submit")}
                    disabled={!draftRequirementsMet}
                  >
                    <Check className="h-4 w-4 mr-2" /> Soumettre pour revue
                  </Button>
                  {!draftRequirementsMet && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {detail.onboarding?.account_type === "sp"
                        ? "Ajoutez au moins un technicien et un service tarifé avant soumission."
                        : "Ajoutez au moins un conducteur et un véhicule avant soumission."}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter le dossier</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet. Celle-ci sera transmise au demandeur.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-card text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Ex: Documents manquants, informations erronées..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => handleAction("reject")}>Confirmer le rejet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOnboarding;
