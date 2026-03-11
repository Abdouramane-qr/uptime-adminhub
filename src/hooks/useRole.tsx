import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "admin" | "moderator" | "user";

export const useRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      setLoading(true);
      try {
        // 1. Check if user is in the auditable admin_users table (Canonical Admin)
        const { data: adminGrant } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .is("revoked_at", null)
          .maybeSingle();

        // 2. Fetch from profiles table (Contextual Role)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        // 3. Fetch explicit app roles maintained by admin role management.
        const { data: explicitRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (profileError || rolesError) {
          throw profileError || rolesError;
        }

        const allRoles = new Set<AppRole>();
        
        // If present in admin_users, they are definitely an admin
        if (adminGrant) {
          allRoles.add("admin");
        }

        (explicitRoles || []).forEach((row) => {
          if (row.role === "admin" || row.role === "moderator" || row.role === "user") {
            allRoles.add(row.role);
          }
        });

        if (profile?.role) {
          if (profile.role === "admin") allRoles.add("admin");
          else if (profile.role === "moderator") allRoles.add("moderator");
          else if (profile.role === "owner" || profile.role === "member" || profile.role === "user") allRoles.add("user");
        }

        setRoles(Array.from(allRoles));
      } catch (e) {
        console.error("Error fetching roles:", e);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (...checkRoles: AppRole[]) => checkRoles.some((r) => roles.includes(r));
  const isAdmin = hasRole("admin");
  const isModerator = hasAnyRole("admin", "moderator");

  return { roles, loading, hasRole, hasAnyRole, isAdmin, isModerator };
};
