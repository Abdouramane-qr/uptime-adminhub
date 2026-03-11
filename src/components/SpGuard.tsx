import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRole } from "@/hooks/useRole";

interface SpGuardProps {
  children: ReactNode;
}

const SpGuard = ({ children }: SpGuardProps) => {
  const { roles, loading, hasAnyRole } = useRole();
  const location = useLocation();
  const pathname = location.pathname;
  const isOnboardingRoute = pathname === "/sp" || pathname.startsWith("/sp/onboarding");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAnyRole("user")) {
    return <>{children}</>;
  }

  if (roles.length === 0) {
    if (pathname === "/sp") {
      return <Navigate to="/sp/onboarding" replace />;
    }

    if (isOnboardingRoute) {
      return <>{children}</>;
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-card rounded-2xl border border-border p-12 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">SP workspace restricted</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This workspace is reserved for service-provider accounts and onboarding flows.
        </p>
      </div>
    </div>
  );
};

export default SpGuard;
