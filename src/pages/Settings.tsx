import { useState } from "react";
import { Save, Users, Shield, Globe, Bell, Palette, Database, Plus, Trash2, Eye, EyeOff, Mail, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

const adminUsers = [
  { id: 1, name: "Sarah Mitchell", email: "sarah@fleetrescue.com", role: "Super Admin", lastLogin: "Mar 7, 2026 09:14", status: "active" },
  { id: 2, name: "James Cooper", email: "james@fleetrescue.com", role: "Admin", lastLogin: "Mar 6, 2026 17:42", status: "active" },
  { id: 3, name: "Nadia Benali", email: "nadia@fleetrescue.com", role: "Support", lastLogin: "Mar 5, 2026 11:08", status: "active" },
  { id: 4, name: "Tom Richards", email: "tom@fleetrescue.com", role: "Admin", lastLogin: "Feb 28, 2026 08:30", status: "inactive" },
];

const Settings = () => {
  const { t } = useLanguage();

  const [platform, setPlatform] = useState({
    name: "Fleet Rescue", supportEmail: "support@fleetrescue.com", timezone: "Europe/Paris",
    currency: "EUR", language: "en", maintenanceMode: false, autoApprove: false,
    maxRadius: "50", sessionTimeout: "30",
  });

  const [notifications, setNotifications] = useState({
    newRegistrations: true, interventionAlerts: true, systemErrors: true,
    weeklyReports: true, dailyDigest: false, slackIntegration: false,
  });

  const [users, setUsers] = useState(adminUsers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Admin");

  const handleSave = (section: string) => {
    toast({ title: `${section} ${t("settings.saved")}`, description: t("settings.saved_desc") });
  };

  const handleInvite = () => {
    if (!inviteEmail) { toast({ title: t("settings.email_required"), description: t("settings.email_required_desc"), variant: "destructive" }); return; }
    setUsers(prev => [...prev, { id: Date.now(), name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole, lastLogin: "Never", status: "pending" }]);
    setInviteEmail("");
    toast({ title: t("settings.invitation_sent"), description: t("settings.invited_as").replace("{email}", inviteEmail).replace("{role}", inviteRole) });
  };

  const handleRemoveUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({ title: t("settings.user_removed"), description: t("settings.user_removed_desc") });
  };

  const toggleNotif = (key: keyof typeof notifications) => setNotifications(p => ({ ...p, [key]: !p[key] }));

  const NotifRow = ({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between py-3">
      <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );

  const statusColor = (s: string) => s === "active" ? "bg-emerald-100 text-emerald-800" : s === "pending" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList>
          <TabsTrigger value="platform" className="gap-1.5"><Globe className="h-4 w-4" /> {t("settings.platform")}</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> {t("settings.users")}</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" /> {t("settings.notifications")}</TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5"><Database className="h-4 w-4" /> {t("settings.system")}</TabsTrigger>
        </TabsList>

        <TabsContent value="platform">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-5 max-w-3xl">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.platform_config")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("settings.platform_name")}</Label><Input value={platform.name} onChange={e => setPlatform(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("settings.support_email")}</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={platform.supportEmail} onChange={e => setPlatform(p => ({ ...p, supportEmail: e.target.value }))} className="pl-9" /></div></div>
              <div className="space-y-2"><Label>{t("settings.timezone")}</Label>
                <Select value={platform.timezone} onValueChange={v => setPlatform(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem><SelectItem value="Europe/London">Europe/London (GMT)</SelectItem><SelectItem value="America/New_York">America/New_York (EST)</SelectItem><SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("settings.currency")}</Label>
                <Select value={platform.currency} onValueChange={v => setPlatform(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="EUR">€ EUR</SelectItem><SelectItem value="USD">$ USD</SelectItem><SelectItem value="GBP">£ GBP</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("settings.default_language")}</Label>
                <Select value={platform.language} onValueChange={v => setPlatform(p => ({ ...p, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="fr">Français</SelectItem><SelectItem value="es">Español</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("settings.coverage_radius")}</Label><Input type="number" value={platform.maxRadius} onChange={e => setPlatform(p => ({ ...p, maxRadius: e.target.value }))} /></div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-foreground">{t("settings.auto_approve")}</p><p className="text-xs text-muted-foreground">{t("settings.auto_approve_desc")}</p></div>
              <Switch checked={platform.autoApprove} onCheckedChange={v => setPlatform(p => ({ ...p, autoApprove: v }))} />
            </div>
            <div className="flex justify-end"><Button onClick={() => handleSave(t("settings.platform"))}><Save className="h-4 w-4 mr-2" /> {t("settings.save_changes")}</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6 max-w-3xl">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{t("settings.invite_admin")}</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input placeholder={t("settings.invite_email")} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1" />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Super Admin">Super Admin</SelectItem><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Support">Support</SelectItem></SelectContent>
                </Select>
                <Button onClick={handleInvite}><Plus className="h-4 w-4 mr-1" /> {t("settings.invite")}</Button>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{t("settings.admin_users")}</h2>
              <div className="divide-y divide-border">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">{u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                      <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{u.name}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className="hidden sm:inline-flex">{u.role}</Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(u.status)}`}>{u.status}</span>
                      <span className="text-xs text-muted-foreground hidden md:block whitespace-nowrap">{u.lastLogin}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>{t("settings.remove_user").replace("{name}", u.name)}</AlertDialogTitle><AlertDialogDescription>{t("settings.remove_desc")}</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveUser(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("settings.remove")}</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-1 max-w-3xl">
            <h2 className="text-lg font-semibold text-foreground mb-3">{t("settings.admin_notifications")}</h2>
            <NotifRow label={t("settings.notif_registrations")} desc={t("settings.notif_registrations_desc")} checked={notifications.newRegistrations} onToggle={() => toggleNotif("newRegistrations")} />
            <Separator />
            <NotifRow label={t("settings.notif_interventions")} desc={t("settings.notif_interventions_desc")} checked={notifications.interventionAlerts} onToggle={() => toggleNotif("interventionAlerts")} />
            <Separator />
            <NotifRow label={t("settings.notif_errors")} desc={t("settings.notif_errors_desc")} checked={notifications.systemErrors} onToggle={() => toggleNotif("systemErrors")} />
            <Separator />
            <NotifRow label={t("settings.notif_weekly")} desc={t("settings.notif_weekly_desc")} checked={notifications.weeklyReports} onToggle={() => toggleNotif("weeklyReports")} />
            <Separator />
            <NotifRow label={t("settings.notif_daily")} desc={t("settings.notif_daily_desc")} checked={notifications.dailyDigest} onToggle={() => toggleNotif("dailyDigest")} />
            <Separator />
            <NotifRow label={t("settings.notif_slack")} desc={t("settings.notif_slack_desc")} checked={notifications.slackIntegration} onToggle={() => toggleNotif("slackIntegration")} />
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6 max-w-3xl">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">{t("settings.system_prefs")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t("settings.session_timeout")}</Label><div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" value={platform.sessionTimeout} onChange={e => setPlatform(p => ({ ...p, sessionTimeout: e.target.value }))} className="pl-9" /></div></div>
                <div className="space-y-2"><Label>{t("settings.data_retention")}</Label><Input type="number" defaultValue="365" /></div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{t("settings.maintenance_mode")}</p><p className="text-xs text-muted-foreground">{t("settings.maintenance_desc")}</p></div>
                <Switch checked={platform.maintenanceMode} onCheckedChange={v => setPlatform(p => ({ ...p, maintenanceMode: v }))} />
              </div>
              <div className="flex justify-end"><Button onClick={() => handleSave(t("settings.system"))}><Save className="h-4 w-4 mr-2" /> {t("settings.save_changes")}</Button></div>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-destructive/30 p-6 space-y-4">
              <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-destructive" /><h2 className="text-lg font-semibold text-destructive">{t("settings.danger_zone")}</h2></div>
              <p className="text-sm text-muted-foreground">{t("settings.danger_desc")}</p>
              <div className="flex gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive">{t("settings.reset_platform")}</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{t("settings.reset_confirm")}</AlertDialogTitle><AlertDialogDescription>{t("settings.reset_desc")}</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("settings.reset_action")}</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
