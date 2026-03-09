import { ReactNode } from "react";
import { Shield } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "moderator" | "user";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { roles, loading, hasAnyRole } = useRole();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAnyRole(...allowedRoles)) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">{t("guard.restricted")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{t("guard.no_permission")}</p>
          <p className="text-xs text-muted-foreground mt-4">
            {t("guard.required_roles")} : {allowedRoles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
