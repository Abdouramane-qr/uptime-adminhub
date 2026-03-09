import { useState, useRef } from "react";
import { User, Mail, Shield, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const email = user?.email || "";
  const avatarUrl = profile?.avatar_url;
  const initials = (fullName || email).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error(t("profile.update_error")); } else { setEditing(false); toast.success(t("profile.update_success")); window.location.reload(); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    setUploading(true);
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { setUploading(false); toast.error(t("profile.upload_error")); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
    setUploading(false);
    if (updateError) { toast.error(t("profile.avatar_error")); } else { toast.success(t("profile.avatar_updated")); window.location.reload(); }
  };

  const handleChangePassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); } else { toast.success(t("profile.reset_sent")); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("profile.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("profile.subtitle")}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-2xl object-cover shadow-glow" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-glow">{initials}</div>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="absolute inset-0 rounded-2xl bg-foreground/0 group-hover:bg-foreground/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
              {uploading ? <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" /> : <Camera className="h-5 w-5 text-primary-foreground" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{fullName || email}</h2>
            <p className="text-muted-foreground text-sm">{profile?.role || "user"}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs text-accent font-medium">{t("profile.online")}</span>
            </div>
          </div>
          <div className="ml-auto">
            {editing ? (
              <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("profile.save")}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)} className="rounded-xl">{t("profile.edit")}</Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("profile.personal_info")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" />{t("profile.full_name")}</Label>
            {editing ? <Input className="rounded-xl" value={fullName} onChange={e => setFullName(e.target.value)} /> : <p className="text-sm font-medium text-foreground px-3 py-2.5">{fullName || "—"}</p>}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{t("profile.email")}</Label>
            <p className="text-sm font-medium text-foreground px-3 py-2.5">{email}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("profile.security")}</h3>
        <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Shield className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("profile.password")}</p>
              <p className="text-xs text-muted-foreground">{t("profile.password_desc")}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handleChangePassword}>{t("profile.change_password")}</Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
