import { useState } from "react";
import { Save, Bell, Lock, AlertTriangle, Building2, Mail, Phone, MapPin, Globe, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const SpSettings = () => {
  const [company, setCompany] = useState({
    name: "AutoFix Pro",
    email: "contact@autofixpro.com",
    phone: "+33 1 42 68 53 00",
    address: "14 Rue de Rivoli, 75004 Paris, France",
    website: "https://autofixpro.fr",
    description: "Professional roadside assistance and vehicle repair services operating across the Île-de-France region since 2018.",
  });

  const [notifications, setNotifications] = useState({
    newJobs: true,
    jobUpdates: true,
    invoiceReminders: true,
    technicianAlerts: true,
    marketingEmails: false,
    smsAlerts: true,
  });

  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const handleSaveProfile = () => {
    toast({ title: "Profile updated", description: "Your company profile has been saved." });
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Missing fields", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    toast({ title: "Password changed", description: "Your password has been updated successfully." });
    setPasswords({ current: "", new: "", confirm: "" });
  };

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((p) => ({ ...p, [key]: !p[key] }));

  const PasswordInput = ({ label, value, field }: { label: string; value: string; field: "current" | "new" | "confirm" }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={showPassword[field] ? "text" : "password"}
          value={value}
          onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => ({ ...p, [field]: !p[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const NotifRow = ({ label, description, checked, onToggle }: { label: string; description: string; checked: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Company Profile */}
      <section className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-foreground">Company Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={company.name} onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={company.email} onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={company.phone} onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={company.website} onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))} className="pl-9" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={company.address} onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))} className="pl-9" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={company.description} onChange={(e) => setCompany((p) => ({ ...p, description: e.target.value }))} rows={3} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
        </div>
        <NotifRow label="New job requests" description="Get notified when a new intervention is assigned" checked={notifications.newJobs} onToggle={() => toggleNotif("newJobs")} />
        <Separator />
        <NotifRow label="Job status updates" description="Receive updates when job status changes" checked={notifications.jobUpdates} onToggle={() => toggleNotif("jobUpdates")} />
        <Separator />
        <NotifRow label="Invoice reminders" description="Reminders for pending and overdue invoices" checked={notifications.invoiceReminders} onToggle={() => toggleNotif("invoiceReminders")} />
        <Separator />
        <NotifRow label="Technician alerts" description="Alerts when technicians go offline or change status" checked={notifications.technicianAlerts} onToggle={() => toggleNotif("technicianAlerts")} />
        <Separator />
        <NotifRow label="SMS alerts" description="Receive critical alerts via SMS" checked={notifications.smsAlerts} onToggle={() => toggleNotif("smsAlerts")} />
        <Separator />
        <NotifRow label="Marketing emails" description="Product updates and promotional content" checked={notifications.marketingEmails} onToggle={() => toggleNotif("marketingEmails")} />
      </section>

      {/* Password */}
      <section className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        </div>
        <div className="space-y-4 max-w-sm">
          <PasswordInput label="Current Password" value={passwords.current} field="current" />
          <PasswordInput label="New Password" value={passwords.new} field="new" />
          <PasswordInput label="Confirm New Password" value={passwords.confirm} field="confirm" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleChangePassword} variant="outline">Update Password</Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-card rounded-xl shadow-sm border border-destructive/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data including technicians, services, and invoices. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your AutoFix Pro account, remove all technicians, services, and invoice history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
};

export default SpSettings;