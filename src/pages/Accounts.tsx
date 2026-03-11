import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import {
  Search, Download, Eye, Check, X, ChevronLeft, ChevronRight,
  Building, Mail, Phone, FileText, Calendar, UserPlus, Pencil, Trash2,
  Smartphone, KeyRound, Copy, RotateCcw,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { AdminPortalError, createAccount, deleteTenant, listTeamMembers, listTenants, type TeamMemberDTO, type TenantDTO, updateTenant, resetTenantOwnerPassword } from "@/lib/adminPortalClient";
import DataSourceBadge from "@/components/DataSourceBadge";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "@/lib/exportUtils";

type AccountStatus = "pending" | "approved" | "rejected";
type AccountType = "SP" | "Fleet";

interface Account {
  id: string;
  company: string;
  type: AccountType;
  ownerId?: string;
  ownerName?: string;
  email: string;
  phone: string;
  regNumber: string;
  submitted: string;
  approvedAt?: string;
  status: AccountStatus;
  code?: string;
  mobileAccessReady: boolean;
}

const PAGE_SIZE = 10;

const initialAccounts: Account[] = [
  { id: 1, company: "AutoFix Pro Services", type: "SP", email: "contact@autofixpro.com", phone: "+33 1 42 68 53 00", regNumber: "FR-SP-2024-0142", submitted: "28 Fév 2026", status: "pending", mobileAccessReady: true },
  { id: 2, company: "Metro Fleet Solutions", type: "Fleet", email: "admin@metrofleet.com", phone: "+33 1 55 34 78 12", regNumber: "FR-FM-2024-0088", submitted: "27 Fév 2026", status: "approved", mobileAccessReady: true },
  { id: 3, company: "QuickTow Emergency", type: "SP", email: "ops@quicktow.eu", phone: "+33 6 12 45 78 90", regNumber: "FR-SP-2024-0139", submitted: "26 Fév 2026", status: "rejected", mobileAccessReady: true },
  { id: 4, company: "GreenHaul Logistics", type: "Fleet", email: "fleet@greenhaul.fr", phone: "+33 1 48 92 33 17", regNumber: "FR-FM-2024-0091", submitted: "25 Fév 2026", status: "approved", mobileAccessReady: true },
  { id: 5, company: "RoadStar Repairs", type: "SP", email: "info@roadstar.com", phone: "+33 4 78 63 22 10", regNumber: "FR-SP-2024-0135", submitted: "24 Fév 2026", status: "pending", mobileAccessReady: true },
  { id: 6, company: "CityDrive Fleet Management", type: "Fleet", email: "hello@citydrive.fr", phone: "+33 1 40 20 15 88", regNumber: "FR-FM-2024-0094", submitted: "23 Fév 2026", status: "approved", mobileAccessReady: true },
  { id: 7, company: "TurboMech Garage", type: "SP", email: "service@turbomech.eu", phone: "+33 3 88 45 67 23", regNumber: "FR-SP-2024-0128", submitted: "22 Fév 2026", status: "pending", mobileAccessReady: true },
  { id: 8, company: "TransEurope Carriers", type: "Fleet", email: "dispatch@transeurope.com", phone: "+33 1 53 76 44 90", regNumber: "FR-FM-2024-0097", submitted: "21 Fév 2026", status: "approved", mobileAccessReady: true },
];

const Accounts = () => {
  const { t } = useLanguage();
  const allowFallback = allowMockFallback();
  const navigate = useNavigate();

  const mapTenant = (t: TenantDTO): Account => {
    const rawType = (t.tenant_type || t.type || "").toLowerCase();
    const type: AccountType = rawType.includes("fleet") ? "Fleet" : "SP";
    const rawStatus = (t.status || "").toLowerCase();
    const status: AccountStatus =
      rawStatus.includes("approved") || rawStatus.includes("active")
        ? "approved"
        : rawStatus.includes("rejected") || rawStatus.includes("suspend")
          ? "rejected"
          : "pending";
    const submittedAt = t.submitted_at || t.created_at;
    return {
      id: String(t.id),
      company: t.company_name || t.company || "N/A",
      type,
      ownerId: t.owner_id || t.user_id || undefined,
      ownerName: t.owner_name || t.owner_email || t.email || undefined,
      email: t.owner_email || t.email || "N/A",
      phone: t.phone || "N/A",
      regNumber: t.registration_number || t.reg_number || "N/A",
      submitted: submittedAt ? new Date(submittedAt).toLocaleDateString("fr-FR") : "N/A",
      approvedAt: t.approved_at ? new Date(t.approved_at).toLocaleDateString("fr-FR") : undefined,
      status,
      code: t.code || undefined,
      mobileAccessReady: Boolean(t.mobile_access_ready ?? ((t.code || (t.owner_email || t.email)))),
    };
  };

  const statusStyles: Record<AccountStatus, { dot: string; bg: string; text: string; label: string }> = {
    pending: { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", label: t("status.pending") },
    approved: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: t("status.approved") },
    rejected: { dot: "bg-destructive", bg: "bg-destructive/10", text: "text-destructive", label: t("status.rejected") },
  };

  const typeBadge: Record<AccountType, string> = {
    SP: "bg-primary/10 text-primary",
    Fleet: "bg-info/10 text-info",
  };

  const [accounts, setAccounts] = useState<Account[]>(
    allowFallback ? initialAccounts.map((a) => ({ ...a, id: String(a.id) })) : [],
  );
  const [apiBacked, setApiBacked] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDTO[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({ company: "", type: "SP" as AccountType, email: "", phone: "", regNumber: "" });
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordModalOpen, setTempPasswordModalOpen] = useState(false);

  const filtered = accounts.filter((a) => {
    const matchSearch = a.company.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || (typeFilter === "Service Providers" && a.type === "SP") || (typeFilter === "Fleet Managers" && a.type === "Fleet");
    const matchStatus = statusFilter === "All" || statusFilter.toLowerCase() === a.status;
    return matchSearch && matchType && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedAccounts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportCSV = () => {
    const dataToExport = filtered.map(a => ({
      ID: a.id,
      Entreprise: a.company,
      Type: a.type,
      Email: a.email,
      Telephone: a.phone,
      Code: a.code || "",
      Status: a.status,
      "Date Soumission": a.submitted,
      "Numero Inscription": a.regNumber
    }));
    exportToCSV(dataToExport, "comptes_uptime");
    toast({ title: t("common.success"), description: "Fichier CSV généré." });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const items = await listTenants();
        setAccounts(items.map(mapTenant));
        setApiBacked(true);
      } catch (e) {
        console.error("Failed to load tenants:", e);
        setApiBacked(false);
        reportFallbackHit("Accounts");
        if (!allowFallback) setAccounts([]);
      }
    };

    void load();
  }, [allowFallback]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!drawerOpen || !selectedAccount) {
      setTeamMembers([]);
      setLoadingTeamMembers(false);
      return;
    }

    let cancelled = false;

    const loadMembers = async () => {
      setLoadingTeamMembers(true);
      try {
        const members = await listTeamMembers(selectedAccount.id);
        if (!cancelled) {
          setTeamMembers(members);
        }
      } catch (e) {
        if (!cancelled) {
          setTeamMembers([]);
          toast({
            title: t("accounts.update_error"),
            description: String((e as { message?: string })?.message || "Impossible de charger les membres."),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingTeamMembers(false);
        }
      }
    };

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [drawerOpen, selectedAccount, t]);

  const openDrawer = (account: Account) => { setSelectedAccount(account); setDrawerOpen(true); };
  const toggleRow = (id: string) => { setSelectedRows((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  const countByStatus = (s: AccountStatus) => accounts.filter((a) => a.status === s).length;
  const applyAccountUpdate = (updatedAccount: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    setSelectedAccount((prev) => (prev?.id === updatedAccount.id ? updatedAccount : prev));
  };

  const openCreate = () => { setEditingAccount(null); setForm({ company: "", type: "SP", email: "", phone: "", regNumber: "" }); setFormOpen(true); };
  const openEdit = (a: Account) => { setEditingAccount(a); setForm({ company: a.company, type: a.type, email: a.email, phone: a.phone, regNumber: a.regNumber }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.company || !form.email) {
      toast({ title: t("accounts.required_fields"), description: t("accounts.required_fields_desc"), variant: "destructive" });
      return;
    }
    
    try {
      if (editingAccount) {
        let updatedAccount = { ...editingAccount, ...form };
        
        // Attempt API call if we suspect backend is available or fallback is not allowed
        if (apiBacked || !allowFallback) {
          const res = await updateTenant(editingAccount.id, {
            company_name: form.company,
            tenant_type: form.type === "Fleet" ? "fleet_manager" : "service_provider",
            email: form.email,
            phone: form.phone,
            registration_number: form.regNumber,
          }) as { item?: TenantDTO };
          
          if (res?.item) {
            updatedAccount = mapTenant(res.item);
          }
        }

        applyAccountUpdate(updatedAccount);
        toast({ title: t("accounts.updated"), description: `${form.company} ${t("accounts.updated_desc")}` });
      } else {
        let newAccount: Account;
        let generatedPassword: string | null = null;
        
        if (apiBacked || !allowFallback) {
          const res = await createAccount({
            company_name: form.company,
            tenant_type: form.type === "Fleet" ? "fleet_manager" : "service_provider",
            email: form.email,
            phone: form.phone,
            registration_number: form.regNumber || null,
          }) as { 
            ok: boolean; 
            account?: TenantDTO & { tempPassword?: string }; 
            item?: TenantDTO & { tempPassword?: string } 
          };
          
          const serverItem = res?.account || res?.item;
          if (serverItem) {
            newAccount = mapTenant(serverItem);
            generatedPassword = serverItem.tempPassword || null;
          } else {
            throw new Error("account_create_missing_item");
          }
        } else {
          // Pure mock mode
          newAccount = { 
            id: String(Date.now()), 
            ...form, 
            regNumber: form.regNumber || `FR-${form.type === "SP" ? "SP" : "FM"}-${Date.now()}`, 
            submitted: new Date().toLocaleDateString("fr-FR"), 
            status: "pending",
            mobileAccessReady: Boolean(form.email),
          };
          generatedPassword = "MOCK-TEMP-PASS-123";
        }
        
        setAccounts((prev) => [newAccount, ...prev]);
        toast({ title: t("accounts.created"), description: `${form.company} ${t("accounts.created_desc")}` });
        
        if (generatedPassword) {
          setTempPassword(generatedPassword);
          setTempPasswordModalOpen(true);
        }
      }
      setFormOpen(false);
    } catch (e) {
      console.error("Save error:", e);
      const duplicateEmail =
        e instanceof AdminPortalError
        && e.httpStatus === 409
        && e.message.toLowerCase().includes("email");
      toast({
        title: editingAccount ? t("accounts.update_error") : t("accounts.create_error"),
        description: duplicateEmail
          ? "Cet email existe deja. Ouvre le compte existant puis utilise 'Reset password' pour le mobile."
          : String((e as { message?: string })?.message || "API error"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (apiBacked || !allowFallback) {
        await deleteTenant(deleteTarget.id);
      }
      setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast({ title: t("accounts.deleted"), description: `${deleteTarget.company} ${t("accounts.deleted_desc")}` });
      setDeleteTarget(null); setDrawerOpen(false);
    } catch (e) {
      toast({ title: t("accounts.delete_error"), description: String((e as { message?: string })?.message || "API error"), variant: "destructive" });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      if (apiBacked || !allowFallback) {
        toast({
          title: "Utiliser Onboarding",
          description: "L'approbation d'un dossier se fait depuis la page Onboarding pour rester aligné avec le workflow mobile.",
        });
        navigate("/onboarding");
        return;
      } else {
        const current = accounts.find((a) => a.id === id) || selectedAccount;
        if (current) applyAccountUpdate({ ...current, status: "approved" });
      }
      toast({ title: t("accounts.approved_toast"), description: t("accounts.approved_toast_desc") });
    } catch (e) {
      toast({ title: t("accounts.update_error"), description: String((e as { message?: string })?.message || "API error"), variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      if (apiBacked || !allowFallback) {
        toast({
          title: "Utiliser Onboarding",
          description: "Le rejet d'un dossier se fait depuis la page Onboarding pour rester aligné avec le workflow mobile.",
        });
        navigate("/onboarding");
        return;
      } else {
        const current = accounts.find((a) => a.id === id) || selectedAccount;
        if (current) applyAccountUpdate({ ...current, status: "rejected" });
      }
      toast({ title: t("accounts.rejected_toast"), description: t("accounts.rejected_toast_desc") });
    } catch (e) {
      toast({ title: t("accounts.update_error"), description: String((e as { message?: string })?.message || "API error"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("accounts.title")}</h1>
          <div className="text-muted-foreground mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>{t("accounts.subtitle")}</span>
              <DataSourceBadge backend={apiBacked} fallbackAllowed={allowFallback} />
            </div>
            <p className="text-sm max-w-3xl opacity-80 italic">
              L'administration des comptes permet de gérer les entités SP et Fleet. L'approbation finale et l'activation des ressources métier s'effectuent via le workflow Onboarding.
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 w-fit">
          <UserPlus className="h-4 w-4" /> {t("accounts.new")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["pending", "approved", "rejected"] as AccountStatus[]).map((s) => {
          const cfg = statusStyles[s];
          return (
            <div key={s} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg}`}><span className={`h-3 w-3 rounded-full ${cfg.dot}`} /></div>
              <div><p className="text-2xl font-bold text-foreground">{countByStatus(s)}</p><p className="text-xs text-muted-foreground">{cfg.label}</p></div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("accounts.search")}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none">
          <option value="All">{t("accounts.filter_all")}</option><option value="Service Providers">{t("accounts.filter_sp")}</option><option value="Fleet Managers">{t("accounts.filter_fm")}</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none">
          <option value="All">{t("accounts.filter_all_status")}</option><option value="Pending">{t("status.pending")}</option><option value="Approved">{t("status.approved")}</option><option value="Rejected">{t("status.rejected")}</option>
        </select>
        <button 
          onClick={handleExportCSV}
          className="h-10 px-4 rounded-xl border border-input bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> {t("accounts.export_csv")}
        </button>
        </div>
      {filtered.length === 0 ? (
        <EmptyState title={t("accounts.no_results")} description={t("accounts.no_results_desc")} actionLabel={t("accounts.reset")}
          onAction={() => { setSearch(""); setTypeFilter("All"); setStatusFilter("All"); }} />
      ) : (
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-10 px-4 py-3.5"><input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" /></th>
                {[t("accounts.company"), t("accounts.type"), t("accounts.email"), t("accounts.submitted"), t("accounts.status"), t("accounts.actions")].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.map((account) => (
                <tr key={account.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3.5"><input type="checkbox" checked={selectedRows.has(account.id)} onChange={() => toggleRow(account.id)} className="h-4 w-4 rounded border-input accent-primary" /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-foreground shrink-0">{account.company.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                      <span className="text-sm font-medium text-foreground">{account.company}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${typeBadge[account.type]}`}>{account.type === "SP" ? t("accounts.type_sp") : t("accounts.type_fm")}</span></td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{account.email}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{account.submitted}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${statusStyles[account.status].bg} ${statusStyles[account.status].text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[account.status].dot}`} />
                      {statusStyles[account.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDrawer(account)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title={t("accounts.view")}><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(account)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-info/10 hover:text-info transition-colors" title={t("accounts.edit")}><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleApprove(account.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-success/10 hover:text-success transition-colors" title={t("accounts.approve")}><Check className="h-4 w-4" /></button>
                      <button onClick={() => handleReject(account.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title={t("accounts.reject")}><X className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(account)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title={t("accounts.delete")}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-border">
          <p className="text-sm text-muted-foreground">{paginatedAccounts.length} {t("accounts.of")} {filtered.length} {t("accounts.accounts")}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="h-8 px-3 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> {t("accounts.previous")}</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className="h-8 px-3 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1">{t("accounts.next")} <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? t("accounts.edit_title") : t("accounts.create_title")}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Modifiez les informations du compte existant." : "Remplissez les informations pour créer un nouveau compte entreprise."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("accounts.company_label")}</label>
              <input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder={t("accounts.company_placeholder")} /></div>
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("accounts.type_label")}</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as AccountType }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary outline-none">
                <option value="SP">{t("accounts.type_sp")}</option><option value="Fleet">{t("accounts.type_fleet")}</option>
              </select></div>
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("accounts.email_label")}</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="contact@example.com" /></div>
            <div><label className="text-sm font-medium text-foreground mb-1 block">{t("accounts.phone_label")}</label>
              <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-input bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="+33 1 00 00 00 00" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setFormOpen(false)} className="h-10 px-4 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">{t("accounts.cancel")}</button>
              <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">{editingAccount ? t("accounts.save") : t("accounts.create")}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("accounts.delete_title")} {deleteTarget?.company} ?</AlertDialogTitle>
            <AlertDialogDescription>{t("accounts.delete_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("accounts.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("accounts.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={tempPasswordModalOpen} onOpenChange={setTempPasswordModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-success flex flex-col items-center gap-2">
              <Check className="h-10 w-10 p-2 bg-success/10 rounded-full" />
              {t("accounts.temp_password_title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-center text-muted-foreground">
              {t("accounts.temp_password_desc")}
            </p>
            <div className="bg-muted p-4 rounded-xl border border-border flex items-center justify-between">
              <code className="text-lg font-bold font-mono tracking-wider">{tempPassword}</code>
              <button 
                onClick={() => {
                  if (tempPassword) {
                    navigator.clipboard.writeText(tempPassword);
                    toast({ title: t("accounts.copy"), description: "Copié !" });
                  }
                }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Download className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setTempPasswordModalOpen(false)}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Ok
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto p-0">
          {selectedAccount && (
            <>
              <SheetHeader className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-foreground">{selectedAccount.company.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                  <div>
                    <SheetTitle className="text-lg font-bold text-foreground">{selectedAccount.company}</SheetTitle>
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-lg mt-1 ${typeBadge[selectedAccount.type]}`}>{selectedAccount.type === "SP" ? t("accounts.type_sp") : t("accounts.type_fm")}</span>
                  </div>
                </div>
              </SheetHeader>
              <Tabs defaultValue="overview" className="flex flex-col h-full">
                <TabsList className="mx-6 mt-4 bg-muted">
                  <TabsTrigger value="overview">{t("accounts.overview")}</TabsTrigger>
                  <TabsTrigger value="technicians">{t("accounts.technicians_tab")}</TabsTrigger>
                  <TabsTrigger value="services">{t("accounts.services_tab")}</TabsTrigger>
                  <TabsTrigger value="documents">{t("accounts.documents_tab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="p-6 space-y-5 flex-1">
                  <DetailField icon={Building} label={t("accounts.company")} value={selectedAccount.company} />
                  <DetailField icon={Smartphone} label="Compte proprietaire" value={selectedAccount.ownerName || "Owner non projete"} />
                  <DetailField icon={Mail} label={t("accounts.email")} value={selectedAccount.email} />
                  <DetailField icon={Phone} label={t("accounts.phone_label")} value={selectedAccount.phone} />
                  <DetailField icon={FileText} label={t("accounts.reg_number")} value={selectedAccount.regNumber} />
                  <DetailField icon={Calendar} label={t("accounts.submission_date")} value={selectedAccount.submitted} />
                  <DetailField icon={KeyRound} label="Owner user ID" value={selectedAccount.ownerId || "N/A"} />
                  <DetailField icon={Calendar} label="Date d'activation" value={selectedAccount.approvedAt || "N/A"} />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("accounts.status")}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${statusStyles[selectedAccount.status].bg} ${statusStyles[selectedAccount.status].text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[selectedAccount.status].dot}`} />
                      {statusStyles[selectedAccount.status].label}
                    </span>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{t("accounts.mobile_access_title")}</h4>
                            <p className="text-[11px] text-muted-foreground">{t("accounts.mobile_access_desc")}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${selectedAccount.mobileAccessReady ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${selectedAccount.mobileAccessReady ? "bg-success" : "bg-warning"}`} />
                          {selectedAccount.mobileAccessReady ? "Infos disponibles" : "Infos incompletes"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-[10px] text-muted-foreground leading-none mb-1">{t("accounts.company_code")}</p>
                            <p className="text-sm font-bold font-mono text-foreground leading-none">{selectedAccount.code || "N/A"}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedAccount.code || "");
                            toast({ title: t("accounts.copy"), description: "Code copié !" });
                          }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <InfoCard icon={Mail} label={t("accounts.email")} value={selectedAccount.email} />
                        <InfoCard icon={Phone} label={t("accounts.phone_label")} value={selectedAccount.phone} />
                        <InfoCard icon={FileText} label={t("accounts.reg_number")} value={selectedAccount.regNumber} />
                        <InfoCard icon={Smartphone} label="Statut mobile" value={selectedAccount.status === "approved" ? "Autorisable" : "En attente workflow"} />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-[10px] text-muted-foreground leading-none mb-1">{t("accounts.email")}</p>
                            <p className="text-sm font-medium text-foreground leading-none">{selectedAccount.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedAccount.email);
                            toast({ title: t("accounts.copy"), description: "Email copié !" });
                          }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-xl h-10 text-xs font-semibold gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                          onClick={() => {
                            const text = `App: Fleet Rescue\nCode: ${selectedAccount.code || "N/A"}\nEmail: ${selectedAccount.email}\nPhone: ${selectedAccount.phone}\nRegistration: ${selectedAccount.regNumber}`;
                            navigator.clipboard.writeText(text);
                            toast({ title: t("accounts.copy_all"), description: t("accounts.credentials_copied") });
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" /> {t("accounts.copy_all")}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="rounded-xl h-10 w-10 p-0 border-info/20 text-info hover:bg-info/5 hover:text-info transition-all"
                          title={t("accounts.reset_password")}
                          onClick={async () => {
                            if (confirm(t("accounts.reset_password_confirm"))) {
                              try {
                                const newPass = Math.random().toString(36).slice(-12);
                                await resetTenantOwnerPassword(selectedAccount.id, newPass);
                                setTempPassword(newPass);
                                setTempPasswordModalOpen(true);
                                toast({ title: t("common.success"), description: t("accounts.updated") });
                              } catch {
                                toast({ title: t("common.error"), description: "Échec de réinitialisation", variant: "destructive" });
                              }
                            }
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="technicians" className="p-6">
                  {loadingTeamMembers ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p>Chargement des membres...</p>
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p>Aucun membre backend rattaché à ce compte.</p>
                      <p className="mt-1 text-xs">Cette section affiche uniquement les membres réels du tenant.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id || member.email} className="rounded-xl border border-border bg-muted/20 p-3">
                          <p className="text-sm font-medium text-foreground">{member.full_name || "Sans nom"}</p>
                          <p className="text-xs text-muted-foreground">{member.email || "Email indisponible"}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{member.role || "member"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="services" className="p-6">
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>Section non raccordée au backend dans AdminHub.</p>
                    <p className="mt-1 text-xs">Les services et tarifs restent pilotés par le workflow Onboarding.</p>
                  </div>
                </TabsContent>
                <TabsContent value="documents" className="p-6">
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>Section non raccordée au backend dans AdminHub.</p>
                    <p className="mt-1 text-xs">Les justificatifs doivent être consultés depuis le dossier Onboarding tant que cette vue n'est pas migrée.</p>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="p-6 border-t border-border flex gap-3">
                <button onClick={() => { setDrawerOpen(false); openEdit(selectedAccount); }} className="flex-1 h-10 rounded-xl border border-input font-medium hover:bg-muted transition-colors text-sm flex items-center justify-center gap-2"><Pencil className="h-4 w-4" /> {t("accounts.edit")}</button>
                <button onClick={() => handleApprove(selectedAccount.id)} className="flex-1 h-10 rounded-xl bg-success text-success-foreground font-medium hover:opacity-90 transition-opacity text-sm">{t("accounts.approve")}</button>
                <button onClick={() => { setDrawerOpen(false); setDeleteTarget(selectedAccount); }} className="h-10 px-4 rounded-xl bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity text-sm"><Trash2 className="h-4 w-4" /></button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DetailField = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>
  </div>
);

const InfoCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="p-3 bg-card rounded-xl border border-border">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
    </div>
    <p className="text-sm font-medium text-foreground break-words">{value}</p>
  </div>
);

export default Accounts;
