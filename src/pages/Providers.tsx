import { useEffect, useState } from "react";
import { Search, Star, MapPin, Phone, Mail, Eye, Shield, Wrench, Truck, Zap, KeyRound, TrendingUp, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import {
  createAccount,
  deleteTenant,
  listServiceRequests,
  listTenants,
  type ServiceRequestDTO,
  type TenantDTO,
  updateTenant,
} from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";

interface Provider {
  id: string | number; name: string; contact: string; email: string; phone: string; city: string; radius: number;
  rating: number; reviews: number; technicians: number; completedJobs: number; activeJobs: number;
  services: string[]; status: string; joined: string; responseTime: string;
}

const serviceIcons: Record<string, typeof Wrench> = { Dépannage: Wrench, Remorquage: Truck, Pneu: Shield, Électrique: Zap, Serrurerie: KeyRound };
const allServices = ["Dépannage", "Remorquage", "Pneu", "Électrique", "Serrurerie"];

const Providers = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [apiBacked, setApiBacked] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Provider | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "", city: "", radius: "30", services: [] as string[] });
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);

  const norm = (v: string | undefined) => String(v || "").trim().toLowerCase();
  const isProviderTenant = (tnt: TenantDTO) => {
    const k = norm(tnt.tenant_type || tnt.type);
    return k.includes("service") || k === "sp" || k.includes("provider");
  };
  const isCompleted = (s: string | undefined) => {
    const k = norm(s);
    return k === "completed" || k === "cancelled";
  };

  const loadProviders = async () => {
    try {
      const [tenants, requests] = await Promise.all([listTenants(), listServiceRequests()]);
      const agg = new Map<string, { completed: number; active: number; services: Set<string> }>();

      requests.forEach((r: ServiceRequestDTO) => {
        const key = norm(r.provider_name || r.assigned_provider);
        if (!key) return;
        if (!agg.has(key)) agg.set(key, { completed: 0, active: 0, services: new Set<string>() });
        const bucket = agg.get(key)!;
        if (r.service_type || r.type) bucket.services.add(String(r.service_type || r.type));
        if (isCompleted(r.status)) bucket.completed += 1;
        else bucket.active += 1;
      });

      const mapped: Provider[] = tenants.filter(isProviderTenant).map((tnt) => {
        const name = tnt.company_name || tnt.company || "Provider";
        const key = norm(name);
        const stats = agg.get(key) || { completed: 0, active: 0, services: new Set<string>() };
        return {
          id: String(tnt.id),
          name,
          contact: tnt.owner_email || "N/A",
          email: tnt.email || tnt.owner_email || "N/A",
          phone: tnt.phone || "N/A",
          city: "Backend non raccorde",
          radius: 0,
          rating: 0,
          reviews: 0,
          technicians: 0,
          completedJobs: stats.completed,
          activeJobs: stats.active,
          services: Array.from(stats.services),
          status: String(tnt.status || "pending").toLowerCase().includes("approved") ? "approved" : "pending",
          joined: tnt.created_at ? new Date(tnt.created_at).toLocaleDateString("fr-FR") : "N/A",
          responseTime: "Backend non raccorde",
        };
      });

      setProviders(mapped);
      setApiBacked(true);
    } catch {
      setApiBacked(false);
      reportFallbackHit("Providers");
      if (!allowFallback) setProviders([]);
    }
  };

  useEffect(() => {
    void loadProviders();
  }, [allowFallback]);

  const filtered = providers.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditing(null); setForm({ name: "", contact: "", email: "", phone: "", city: "", radius: "30", services: [] }); setFormOpen(true); };
  const openEdit = (p: Provider) => { setEditing(p); setForm({ name: p.name, contact: p.contact, email: p.email, phone: p.phone, city: p.city, radius: String(p.radius), services: [...p.services] }); setFormOpen(true); };
  const toggleService = (s: string) => { setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] })); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast({ title: t("providers.required_fields"), description: t("providers.required_fields_desc"), variant: "destructive" }); return; }
    try {
      if (editing) {
        if (apiBacked) {
          await updateTenant(String(editing.id), {
            company_name: form.name,
            tenant_type: "service_provider",
            email: form.email,
            phone: form.phone,
          });
          await loadProviders();
        } else {
          setProviders(prev => prev.map(p => p.id === editing.id ? { ...p, name: form.name, contact: form.contact, email: form.email, phone: form.phone, city: form.city, radius: Number(form.radius), services: form.services } : p));
        }
        toast({ title: t("providers.updated"), description: `${form.name} ${t("providers.updated_desc")}` });
      } else {
        if (apiBacked) {
          await createAccount({
            company_name: form.name,
            tenant_type: "service_provider",
            email: form.email,
            phone: form.phone,
            registration_number: null,
          });
          await loadProviders();
        } else {
          setProviders(prev => [{ id: Date.now(), ...form, radius: Number(form.radius), rating: 0, reviews: 0, technicians: 0, completedJobs: 0, activeJobs: 0, status: "pending", joined: "Mar 2026", responseTime: "N/A" }, ...prev]);
        }
        toast({ title: t("providers.created"), description: `${form.name} ${t("providers.created_desc")}` });
      }
      setFormOpen(false);
    } catch {
      toast({
        title: editing ? t("providers.update_error") : t("providers.create_error"),
        description: editing ? "Backend update failed" : "Backend create failed",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (apiBacked) {
        await deleteTenant(String(deleteTarget.id));
        await loadProviders();
      } else {
        setProviders(prev => prev.filter(p => p.id !== deleteTarget.id));
      }
      toast({ title: t("providers.deleted"), description: `${deleteTarget.name} ${t("providers.deleted_desc")}` });
      setDeleteTarget(null); setSelected(null);
    } catch {
      toast({ title: t("providers.delete_error"), description: "Backend delete failed", variant: "destructive" });
    }
  };

  const renderStars = (rating: number, reviews?: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
      ))}
      <span className="text-sm font-bold text-foreground ml-1">{rating}</span>
      {reviews !== undefined && <span className="text-xs text-muted-foreground">({reviews})</span>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("providers.title")}</h1>
          <div className="text-muted-foreground mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>{providers.length} {t("providers.registered")}</span>
              <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
            </div>
            <p className="text-sm max-w-3xl opacity-80 italic">
              {t("providers.scope_note")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("providers.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56 rounded-xl" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("providers.all")}</SelectItem><SelectItem value="approved">{t("providers.approved")}</SelectItem><SelectItem value="pending">{t("providers.pending")}</SelectItem></SelectContent>
          </Select>
          <Button onClick={openCreate} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> {t("providers.add")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((p) => (
          <div key={p.id} className="bg-card rounded-2xl border border-border p-5 space-y-4 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-foreground shrink-0">{p.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><MapPin className="h-3 w-3" /> {p.city} · {p.radius} km</div>
                </div>
              </div>
              <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${p.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                {p.status === "approved" ? t("providers.status_approved") : t("providers.status_pending")}
              </span>
            </div>
            {renderStars(p.rating, p.reviews)}
            <div className="flex flex-wrap gap-1.5">
              {p.services.map((s) => { const Icon = serviceIcons[s] || Wrench; return (
                <span key={s} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-muted text-muted-foreground font-medium"><Icon className="h-3 w-3" />{s}</span>
              ); })}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-xl py-2.5"><p className="text-lg font-bold text-foreground">{p.technicians}</p><p className="text-[10px] text-muted-foreground">{t("providers.technicians")}</p></div>
              <div className="bg-muted/50 rounded-xl py-2.5"><p className="text-lg font-bold text-foreground">{p.completedJobs}</p><p className="text-[10px] text-muted-foreground">{t("providers.completed")}</p></div>
              <div className="bg-primary/5 rounded-xl py-2.5"><p className="text-lg font-bold text-primary">{p.activeJobs}</p><p className="text-[10px] text-muted-foreground">{t("providers.active")}</p></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setSelected(p)}><Eye className="h-4 w-4 mr-1" /> {t("providers.view")}</Button>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(p)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? t("providers.edit_title") : t("providers.create_title")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("providers.name_label")}</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder={t("providers.name_placeholder")} /></div>
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("providers.contact_label")}</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder={t("providers.contact_placeholder")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground mb-1 block">{t("providers.email_label")}</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none" /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">{t("providers.city_label")}</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none" /></div>
            </div>
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("providers.services_label")}</label>
              <div className="flex flex-wrap gap-2">
                {allServices.map(s => (
                  <button key={s} onClick={() => toggleService(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.services.includes(s) ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-input hover:border-primary/20"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setFormOpen(false)} className="h-10 px-4 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">{t("providers.cancel")}</button>
              <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">{editing ? t("providers.save") : t("providers.create")}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>{t("providers.delete_title")} {deleteTarget?.name} ?</AlertDialogTitle><AlertDialogDescription>{t("providers.delete_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("providers.cancel")}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("providers.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
          {selected && (
            <>
              <SheetHeader className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-foreground">{selected.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <SheetTitle>{selected.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("providers.member_since")} {selected.joined}</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="p-6 space-y-6">
                {renderStars(selected.rating, selected.reviews)}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("providers.contact")}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {selected.email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selected.phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {selected.city}</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("providers.coverage_zone")}</h4>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t("providers.radius")}</span><span className="font-medium text-foreground">{selected.radius} km</span></div>
                  <Progress value={selected.radius} className="h-2" />
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("providers.performance")}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: t("providers.completed_label"), value: selected.completedJobs, icon: TrendingUp }, { label: t("providers.active_label"), value: selected.activeJobs, icon: Zap }, { label: t("providers.technicians_label"), value: selected.technicians, icon: Wrench }, { label: t("providers.response_time"), value: selected.responseTime, icon: Clock }].map(m => (
                      <div key={m.label} className="bg-muted/50 rounded-xl p-3"><m.icon className="h-3.5 w-3.5 text-muted-foreground mb-1" /><p className="text-lg font-bold text-foreground">{m.value}</p><p className="text-[11px] text-muted-foreground">{m.label}</p></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setSelected(null); openEdit(selected); }}><Pencil className="h-4 w-4 mr-1" /> {t("providers.edit")}</Button>
                <Button variant="destructive" className="rounded-xl" onClick={() => { setSelected(null); setDeleteTarget(selected); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Providers;
