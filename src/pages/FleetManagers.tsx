import { useEffect, useState } from "react";
import { Search, Building2, Truck, Eye, Mail, Phone, MapPin, TrendingUp, Activity, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface FleetManager {
  id: string | number; company: string; contact: string; email: string; phone: string; city: string;
  vehicles: number; activeInterventions: number; totalInterventions: number; status: string;
  joined: string; fleetTypes: string[]; avgMonthly: number;
}

const FleetManagers = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const [managers, setManagers] = useState<FleetManager[]>([]);
  const [apiBacked, setApiBacked] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<FleetManager | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FleetManager | null>(null);
  const [form, setForm] = useState({ company: "", contact: "", email: "", phone: "", city: "", vehicles: "0" });
  const [deleteTarget, setDeleteTarget] = useState<FleetManager | null>(null);

  useEffect(() => {
    const norm = (v: string | undefined) => String(v || "").trim().toLowerCase();
    const isFleet = (tnt: TenantDTO) => {
      const k = norm(tnt.tenant_type || tnt.type);
      return k.includes("fleet");
    };
    const isActiveStatus = (s: string | undefined) => {
      const k = norm(s);
      return !["completed", "cancelled"].includes(k);
    };

    const load = async () => {
      try {
        const [tenants, requests] = await Promise.all([listTenants(), listServiceRequests()]);
        const agg = new Map<string, { active: number; total: number }>();
        requests.forEach((r: ServiceRequestDTO) => {
          const key = norm(r.fleet_manager || r.client_name || r.client);
          if (!key) return;
          if (!agg.has(key)) agg.set(key, { active: 0, total: 0 });
          const bucket = agg.get(key)!;
          bucket.total += 1;
          if (isActiveStatus(r.status)) bucket.active += 1;
        });

        const mapped: FleetManager[] = tenants.filter(isFleet).map((tnt) => {
          const company = tnt.company_name || tnt.company || "Fleet";
          const stats = agg.get(norm(company)) || { active: 0, total: 0 };
          return {
            id: String(tnt.id),
            company,
            contact: tnt.owner_email || "N/A",
            email: tnt.email || tnt.owner_email || "N/A",
            phone: tnt.phone || "N/A",
            city: "N/A",
            vehicles: 0,
            activeInterventions: stats.active,
            totalInterventions: stats.total,
            status: String(tnt.status || "").toLowerCase().includes("active") ? "active" : "inactive",
            joined: tnt.created_at ? new Date(tnt.created_at).toLocaleDateString("fr-FR") : "N/A",
            fleetTypes: ["N/A"],
            avgMonthly: 0,
          };
        });

        setManagers(mapped);
        setApiBacked(true);
      } catch {
        setApiBacked(false);
        reportFallbackHit("FleetManagers");
        if (!allowFallback) setManagers([]);
      }
    };

    void load();
  }, [allowFallback]);

  const filtered = managers.filter((f) => {
    const matchSearch = f.company.toLowerCase().includes(search.toLowerCase()) || f.contact.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    vehicles: managers.reduce((a, f) => a + f.vehicles, 0),
    active: managers.filter((f) => f.activeInterventions > 0).length,
    interventions: managers.reduce((a, f) => a + f.activeInterventions, 0),
  };

  const openCreate = () => { setEditing(null); setForm({ company: "", contact: "", email: "", phone: "", city: "", vehicles: "0" }); setFormOpen(true); };
  const openEdit = (f: FleetManager) => { setEditing(f); setForm({ company: f.company, contact: f.contact, email: f.email, phone: f.phone, city: f.city, vehicles: String(f.vehicles) }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.company || !form.email) { toast({ title: t("fleet.required_fields"), description: t("fleet.required_fields_desc"), variant: "destructive" }); return; }
    if (editing) {
      if (apiBacked) {
        await updateTenant(String(editing.id), {
          company_name: form.company,
          tenant_type: "fleet_manager",
          email: form.email,
          phone: form.phone,
          status: "active",
        }).catch(() => {
          toast({ title: t("fleet.update_error"), description: "Backend update failed", variant: "destructive" });
        });
      }
      setManagers(prev => prev.map(m => m.id === editing.id ? { ...m, company: form.company, contact: form.contact, email: form.email, phone: form.phone, city: form.city, vehicles: Number(form.vehicles) } : m));
      toast({ title: t("fleet.updated"), description: `${form.company} ${t("fleet.updated_desc")}` });
    } else {
      if (apiBacked) {
        await createAccount({
          company_name: form.company,
          tenant_type: "fleet_manager",
          email: form.email,
          phone: form.phone,
          registration_number: null,
        }).catch(() => {
          toast({ title: t("fleet.create_error"), description: "Backend create failed", variant: "destructive" });
        });
      }
      setManagers(prev => [{ id: Date.now(), ...form, vehicles: Number(form.vehicles), activeInterventions: 0, totalInterventions: 0, status: "active", joined: "Mar 2026", fleetTypes: ["Utilitaires"], avgMonthly: 0 }, ...prev]);
      toast({ title: t("fleet.created"), description: `${form.company} ${t("fleet.created_desc")}` });
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (apiBacked) {
      await deleteTenant(String(deleteTarget.id)).catch(() => {
        toast({ title: t("fleet.delete_error"), description: "Backend delete failed", variant: "destructive" });
      });
    }
    setManagers(prev => prev.filter(m => m.id !== deleteTarget.id));
    toast({ title: t("fleet.deleted"), description: `${deleteTarget.company} ${t("fleet.deleted_desc")}` });
    setDeleteTarget(null); setSelected(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("fleet.title")}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span>{managers.length} {t("fleet.registered")}</span>
            <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("fleet.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56 rounded-xl" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("fleet.all")}</SelectItem><SelectItem value="active">{t("fleet.active")}</SelectItem><SelectItem value="inactive">{t("fleet.inactive")}</SelectItem></SelectContent>
          </Select>
          <Button onClick={openCreate} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> {t("fleet.add")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("fleet.total_vehicles"), value: totals.vehicles, icon: Truck, gradient: "from-primary/10 to-primary/5", iconBg: "bg-primary/15 text-primary" },
          { label: t("fleet.active_fleets"), value: totals.active, icon: Building2, gradient: "from-success/10 to-success/5", iconBg: "bg-success/15 text-success" },
          { label: t("fleet.ongoing_interventions"), value: totals.interventions, icon: Activity, gradient: "from-warning/10 to-warning/5", iconBg: "bg-warning/15 text-warning" },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-50`} />
            <div className={`relative h-11 w-11 rounded-xl flex items-center justify-center ${s.iconBg}`}><s.icon className="h-5 w-5" /></div>
            <div className="relative"><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {[t("fleet.company"), t("fleet.contact"), t("fleet.city"), t("fleet.vehicles"), t("fleet.active_col"), t("fleet.total"), t("fleet.status"), t("fleet.actions")].map(h => (
                <TableHead key={h} className={`text-xs font-semibold uppercase tracking-wider ${[t("fleet.vehicles"), t("fleet.active_col"), t("fleet.total")].includes(h) ? "text-center" : h === t("fleet.actions") ? "text-right" : ""}`}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f) => (
              <TableRow key={f.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelected(f)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-foreground shrink-0">{f.company.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                    <span className="font-medium text-foreground">{f.company}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{f.contact}</TableCell>
                <TableCell><div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" />{f.city}</div></TableCell>
                <TableCell className="text-center font-bold text-foreground">{f.vehicles}</TableCell>
                <TableCell className="text-center">
                  {f.activeInterventions > 0 ? <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-warning/10 text-warning">{f.activeInterventions}</span> : <span className="text-muted-foreground">0</span>}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{f.totalInterventions}</TableCell>
                <TableCell>
                  <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${f.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{f.status === "active" ? t("fleet.status_active") : t("fleet.status_inactive")}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={(e) => { e.stopPropagation(); setSelected(f); }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-info/10 hover:text-info" onClick={(e) => { e.stopPropagation(); openEdit(f); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(f); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? t("fleet.edit_title") : t("fleet.create_title")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("fleet.company_label")}</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground mb-1 block">{t("fleet.contact_label")}</label>
                <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none" /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">{t("fleet.city_label")}</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none" /></div>
            </div>
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("fleet.email_label")}</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground mb-1 block">{t("fleet.phone_label")}</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none" /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">{t("fleet.vehicles_label")}</label>
                <input type="number" value={form.vehicles} onChange={e => setForm(f => ({ ...f, vehicles: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setFormOpen(false)} className="h-10 px-4 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">{t("fleet.cancel")}</button>
              <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">{editing ? t("fleet.save") : t("fleet.create")}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>{t("fleet.delete_title")} {deleteTarget?.company} ?</AlertDialogTitle><AlertDialogDescription>{t("fleet.delete_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("fleet.cancel")}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("fleet.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
          {selected && (
            <>
              <SheetHeader className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-foreground">{selected.company.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                  <div><SheetTitle>{selected.company}</SheetTitle><p className="text-xs text-muted-foreground mt-0.5">{t("fleet.member_since")} {selected.joined}</p></div>
                </div>
              </SheetHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("fleet.contact")}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {selected.contact}</div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {selected.email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selected.phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {selected.city}</div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: t("fleet.vehicles_stat"), value: selected.vehicles, icon: Truck }, { label: t("fleet.active_stat"), value: selected.activeInterventions, icon: Activity }, { label: t("fleet.total_missions"), value: selected.totalInterventions, icon: TrendingUp }, { label: t("fleet.monthly_avg"), value: selected.avgMonthly, icon: TrendingUp }].map(m => (
                    <div key={m.label} className="bg-muted/40 rounded-xl p-3 border border-border/50"><m.icon className="h-3.5 w-3.5 text-muted-foreground mb-1" /><p className="text-lg font-bold text-foreground">{m.value}</p><p className="text-[11px] text-muted-foreground">{m.label}</p></div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("fleet.fleet_types")}</h4>
                  <div className="flex flex-wrap gap-2">{selected.fleetTypes.map(ft => (
                    <span key={ft} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-muted text-foreground font-medium"><Truck className="h-3.5 w-3.5 text-muted-foreground" />{ft}</span>
                  ))}</div>
                </div>
              </div>
              <div className="p-6 border-t border-border flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setSelected(null); openEdit(selected); }}><Pencil className="h-4 w-4 mr-1" /> {t("fleet.edit")}</Button>
                <Button variant="destructive" className="rounded-xl" onClick={() => { setSelected(null); setDeleteTarget(selected); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FleetManagers;
