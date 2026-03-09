import { useState, useEffect, useCallback } from "react";
import { Shield, UserCheck, Search, Loader2, Crown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AppRole = "admin" | "moderator" | "user";

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: AppRole;
  role_id: string;
}

const roleConfig: Record<AppRole, { label: string; color: string; icon: typeof Crown }> = {
  admin: { label: "Admin", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Crown },
  moderator: { label: "Modérateur", color: "bg-accent/10 text-accent border-accent/20", icon: Shield },
  user: { label: "Utilisateur", color: "bg-muted text-muted-foreground border-border", icon: Users },
};

const AdminRoles = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadUsers = useCallback(async () => {
    // Get profiles with compatibility between schemas (`id` vs `user_id`)
    let profiles: Array<Record<string, unknown>> = [];
    let profilesError: Error | null = null;

    const byId = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url");

    if (byId.error) {
      const byUserId = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url");
      profilesError = byUserId.error as Error | null;
      profiles = (byUserId.data as Array<Record<string, unknown>> | null) || [];
    } else {
      profiles = (byId.data as Array<Record<string, unknown>> | null) || [];
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("id, user_id, role");

    if (profilesError || rolesError) {
      const details = profilesError?.message || rolesError?.message || "Unknown error";
      toast.error(`Erreur lors du chargement des utilisateurs: ${details}`);
      return;
    }

    const combined: UserWithRole[] = profiles.map((p) => {
      const userId = String(p.id || p.user_id || "");
      if (!userId) return null;
      const userRole = (roles || []).find((r) => r.user_id === userId);
      return {
        user_id: userId,
        full_name: (p.full_name as string | null) || null,
        avatar_url: (p.avatar_url as string | null) || null,
        email: String(p.full_name || userId),
        role: (userRole?.role as AppRole) || "user",
        role_id: userRole?.id || "",
      };
    }).filter((u): u is UserWithRole => !!u);

    setUsers(combined);
  }, []);

  const checkAdminAndLoad = useCallback(async () => {
    if (!user) return;

    // Check if current user is admin
    const { data: adminCheck } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    setIsAdmin(!!adminCheck);

    if (adminCheck) {
      await loadUsers();
    }
    setLoading(false);
  }, [loadUsers, user]);

  useEffect(() => {
    void checkAdminAndLoad();
  }, [checkAdminAndLoad]);

  const handleRoleChange = async (userId: string, roleId: string, newRole: AppRole) => {
    setUpdating(userId);

    if (roleId) {
      // Update existing role
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("id", roleId);

      if (error) {
        toast.error("Erreur: " + error.message);
      } else {
        toast.success("Rôle mis à jour !");
        await loadUsers();
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) {
        toast.error("Erreur: " + error.message);
      } else {
        toast.success("Rôle attribué !");
        await loadUsers();
      }
    }

    setUpdating(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Administration</h1>
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">
            Vous devez avoir le rôle Admin pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Gestion des rôles</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les permissions des utilisateurs de la plateforme.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["admin", "moderator", "user"] as AppRole[]).map((role) => {
          const config = roleConfig[role];
          const count = users.filter((u) => u.role === role).length;
          return (
            <div key={role} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${config.color}`}>
                  <config.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}s</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10 rounded-xl"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilisateur</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Rôle actuel</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-44">Action</p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const config = roleConfig[u.role];
            const initials = (u.full_name || "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={u.user_id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-border/50 items-center last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                {/* User info */}
                <div className="flex items-center gap-3">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-xl object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.full_name || "Sans nom"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}...</p>
                  </div>
                </div>

                {/* Current role badge */}
                <div className="w-40">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.color}`}>
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>

                {/* Role selector */}
                <div className="w-44">
                  {u.user_id === user?.id ? (
                    <span className="text-xs text-muted-foreground italic">Vous-même</span>
                  ) : (
                    <Select
                      value={u.role}
                      onValueChange={(val) => handleRoleChange(u.user_id, u.role_id, val as AppRole)}
                      disabled={updating === u.user_id}
                    >
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        {updating === u.user_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Modérateur</SelectItem>
                        <SelectItem value="user">Utilisateur</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminRoles;
