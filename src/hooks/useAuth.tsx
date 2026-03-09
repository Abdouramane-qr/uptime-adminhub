import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  company_code?: string | null;
  tenant_id?: string | null;
  role: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  adminLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  adminLoading: true,
  isAdmin: false,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const verifyAdminAccess = async (activeSession: Session | null) => {
    if (!activeSession?.access_token) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    try {
      // Primary admin gate: DB role helper (supports migrated role model).
      const { data: isAdminByRole } = await supabase.rpc("is_admin");
      if (isAdminByRole === true) {
        setIsAdmin(true);
        return;
      }

      // Compatibility gate: legacy edge-function dashboard check.
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const endpoint = `${String(baseUrl).replace(/\/$/, "")}/functions/v1/admin-portal/dashboard`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${activeSession.access_token}`,
        },
      });

      if (res.status === 403) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(res.ok);
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, company_code, tenant_id, role")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAdminLoading(true);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          setTimeout(() => verifyAdminAccess(session), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setAdminLoading(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAdminLoading(true);
      if (session?.user) {
        fetchProfile(session.user.id);
        verifyAdminAccess(session);
      } else {
        setIsAdmin(false);
        setAdminLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setAdminLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, adminLoading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
