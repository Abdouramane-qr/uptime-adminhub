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
      try {
        // Fetch from user_roles table
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        // Fetch from profiles table as fallback/complement
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const allRoles = new Set<AppRole>();
        if (userRoles) userRoles.forEach(r => allRoles.add(r.role as AppRole));
        if (profile?.role) allRoles.add(profile.role as AppRole);

        setRoles(Array.from(allRoles));
      } catch (e) {
        console.error("Error fetching roles:", e);
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
