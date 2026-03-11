import { useEffect, useState } from "react";
import { Save, Bell, Lock, AlertTriangle, Building, Mail, Phone, MapPin, Globe, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EmptyState from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import { useSpOnboardingDraft } from "@/hooks/useSpOnboardingDraft";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type NotificationSettings = {
  newJobs: boolean;
  jobUpdates: boolean;
  invoiceReminders: boolean;
  technicianAlerts: boolean;
  marketingEmails: boolean;
  smsAlerts: boolean;
};

const defaultNotifications: NotificationSettings = {
  newJobs: true,
  jobUpdates: true,
  invoiceReminders: true,
  technicianAlerts: true,
  marketingEmails: false,
  smsAlerts: true,
};

const SpSettings = () => {
  const { user } = useAuth();
  const { detail, loading, error, saveDraft } = useSpOnboardingDraft();
  const [company, setCompany] = useState({
    name: "",
    email: "",
    phone: "",
    registrationNumber: "",
    website: "",
    address: "",
    description: "",
  });
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const metadata = (user?.user_metadata || {}) as Record<string, unknown>;
    const onboarding = detail?.onboarding;
    const rawNotifications = metadata.notification_preferences;
    const notificationOverrides =
      rawNotifications && typeof rawNotifications === "object"
        ? (rawNotifications as Partial<NotificationSettings>)
        : {};

    setCompany({
      name: onboarding?.company_name || String(metadata.company_name || ""),
      email: user?.email || onboarding?.contact_email || "",
      phone: onboarding?.contact_phone || String(metadata.company_phone || ""),
      registrationNumber:
        onboarding?.registration_number || String(metadata.registration_number || ""),
      website: String(metadata.company_website || ""),
      address: String(metadata.company_address || ""),
      description: String(metadata.company_description || ""),
    });
    setNotifications({ ...defaultNotifications, ...notificationOverrides });
  }, [detail?.onboarding, user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await saveDraft({
        company_name: company.name.trim(),
        contact_phone: company.phone.trim(),
        registration_number: company.registrationNumber.trim(),
      });

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          company_name: company.name.trim(),
          company_phone: company.phone.trim(),
          registration_number: company.registrationNumber.trim(),
          company_website: company.website.trim(),
          company_address: company.address.trim(),
          company_description: company.description.trim(),
          notification_preferences: notifications,
        },
      });

      if (metadataError) throw metadataError;

      toast({
        title: "Profile updated",
        description: "Your company profile has been saved.",
      });
    } catch (err) {
      toast({
        title: "Profile update failed",
        description: String((err as { message?: string })?.message || "Unable to save your settings."),
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Missing fields", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    const email = user?.email || company.email.trim();
    if (!email) {
      toast({ title: "Missing email", description: "No account email is available for password verification.", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: passwords.current,
      });
      if (signInError) throw signInError;

      const { error: updateError } = await supabase.auth.updateUser({ password: passwords.new });
      if (updateError) throw updateError;

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      toast({
        title: "Password update failed",
        description: String((err as { message?: string })?.message || "Unable to update your password."),
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Deletion unavailable",
      description: "Account deletion is not connected to the backend yet.",
      variant: "destructive",
    });
  };

  const toggleNotif = (key: keyof NotificationSettings) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  if (error) {
    return <EmptyState title="Settings unavailable" description={error} />;
  }

  if (!detail?.onboarding) {
    return (
      <EmptyState
        title="No SP record"
        description="Complete the onboarding flow before managing service-provider settings."
      />
    );
  }

  const PasswordInput = ({ label, value, field }: { label: string; value: string; field: "current" | "new" | "confirm" }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={showPassword[field] ? "text" : "password"}
          value={value}
          onChange={(e) => setPasswords((prev) => ({ ...prev, [field]: e.target.value }))}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))}
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

      <section className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-foreground">Company Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={company.name} onChange={(e) => setCompany((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={company.email} disabled className="pl-9 opacity-80" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={company.phone} onChange={(e) => setCompany((prev) => ({ ...prev, phone: e.target.value }))} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Registration Number</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={company.registrationNumber} onChange={(e) => setCompany((prev) => ({ ...prev, registrationNumber: e.target.value }))} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={company.website} onChange={(e) => setCompany((prev) => ({ ...prev, website: e.target.value }))} className="pl-9" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address / Zone</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={company.address} onChange={(e) => setCompany((prev) => ({ ...prev, address: e.target.value }))} className="pl-9" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={company.description} onChange={(e) => setCompany((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => void handleSaveProfile()} className="bg-amber-500 hover:bg-amber-600 text-white" disabled={savingProfile}>
            <Save className="h-4 w-4 mr-2" /> {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>

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
          <Button onClick={() => void handleChangePassword()} variant="outline" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </section>

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
                This action is not connected to the backend yet and remains blocked until a secure delete workflow is implemented.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
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
