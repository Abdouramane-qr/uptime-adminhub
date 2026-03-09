import { Clock, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

const PendingAccess = () => {
  const { signOut } = useAuth();
  const { roles, loading } = useRole();

  if (!loading && roles.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Clock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Pending approval</h1>
        <p className="text-muted-foreground">
          Your account is authenticated but has no assigned portal role yet. An administrator must approve and assign your access rights.
        </p>
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground flex items-start gap-3 text-left">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Once your role is assigned in <code>public.user_roles</code>, refresh this page or sign in again.
          </span>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mx-auto inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default PendingAccess;
