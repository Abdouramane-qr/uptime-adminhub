import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Loader2, Truck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

const features = [
  "Real-time fleet tracking and intervention management",
  "Comprehensive service provider network oversight",
  "Advanced analytics and reporting dashboard",
];

type AuthMode = "login" | "signup" | "forgot";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.error(t("auth.google") + " error");
    }
  };

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.verify_email"));
      setMode("login");
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

  const onSubmit = mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword;

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
            {mode === "login" ? t("auth.welcome") : mode === "signup" ? t("auth.signup_title") : t("auth.forgot_title")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "login"
              ? t("auth.welcome_subtitle")
              : mode === "signup"
              ? t("auth.signup_subtitle")
              : t("auth.forgot_subtitle")}
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.name")}</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

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
                  {mode === "login" ? t("auth.logging_in") : mode === "signup" ? t("auth.signing_up") : t("auth.sending")}
                </>
              ) : mode === "login" ? (
                t("auth.login")
              ) : mode === "signup" ? (
                t("auth.signup")
              ) : (
                t("auth.send_link")
              )}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full mt-4 h-11 rounded-lg border border-input bg-card text-foreground font-medium hover:bg-muted transition-colors flex items-center justify-center gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t("auth.google")}
              </button>
            </>
          )}

          <div className="text-center mt-6 space-y-2">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline block mx-auto">
                  {t("auth.forgot_password")}
                </button>
                <p className="text-sm text-muted-foreground">
                  {t("auth.no_account")}{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                    {t("auth.signup")}
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-sm text-muted-foreground">
                {t("auth.has_account")}{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline">
                  {t("auth.login")}
                </button>
              </p>
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
