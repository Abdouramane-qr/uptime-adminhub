import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Loader2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

const features = [
  "Real-time fleet tracking and intervention management",
  "Comprehensive service provider network oversight",
  "Advanced analytics and reporting dashboard",
];

type AuthMode = "login" | "forgot";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Login failed";
      const lower = raw.toLowerCase();
      const message =
        lower.includes("email not confirmed")
          ? "Email non confirmé. Vérifie ta boîte mail (spam inclus) ou demande un renvoi de confirmation."
          : lower.includes("invalid login credentials")
            ? "Identifiants invalides. Vérifie email/mot de passe, puis utilise \"Mot de passe oublié\" si besoin."
            : raw;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.reset_sent"));
      setMode("login");
    }
  };

  const onSubmit = mode === "login" ? handleLogin : handleForgotPassword;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[60%] bg-gradient-to-br from-foreground to-primary relative flex-col justify-center px-16 text-primary-foreground">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">Fleet Rescue</h1>
          </div>
          <p className="text-lg text-primary-foreground/70 mb-12">Platform Administration</p>

          <div className="space-y-5">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                <p className="text-primary-foreground/90">{feature}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-primary-foreground/5" />
        <div className="absolute bottom-20 right-40 h-40 w-40 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Fleet Rescue</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {mode === "login" ? t("auth.welcome") : t("auth.forgot_title")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "login"
              ? t("auth.welcome_subtitle")
              : t("auth.forgot_subtitle")}
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fleetrescue.com"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.password")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "login" ? t("auth.logging_in") : t("auth.sending")}
                </>
              ) : mode === "login" ? (
                t("auth.login")
              ) : (
                t("auth.send_link")
              )}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline block mx-auto">
                  {t("auth.forgot_password")}
                </button>
                <p className="text-sm text-muted-foreground">
                  Les comptes sont provisionnes par l administration. Aucun signup public n est autorise sur ce portail.
                </p>
              </>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                {t("auth.back_to_login")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
