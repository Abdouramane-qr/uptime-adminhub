import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, loading } = useAuth();
  const { roles, loading: rolesLoading, hasAnyRole } = useRole();

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length === 0) {
    return <Navigate to="/pending-access" replace />;
  }

  if (!hasAnyRole("admin", "moderator")) {
    return <Navigate to="/pending-access" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
