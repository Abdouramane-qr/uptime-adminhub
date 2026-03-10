import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearCachedSession, setCachedSession } from "@/lib/authSession";

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

function isJwtLikeToken(token: string | null | undefined): token is string {
  return typeof token === "string" && token.split(".").length === 3;
}

async function waitForPersistedSession(attempts = 10, delayMs = 120): Promise<Session | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}

async function validateSession(activeSession: Session | null): Promise<Session | null> {
  if (!activeSession?.access_token || !isJwtLikeToken(activeSession.access_token)) {
    clearCachedSession();
    return null;
  }

  const { data, error } = await supabase.auth.getUser(activeSession.access_token);
  if (error || !data.user) {
    await supabase.auth.signOut();
    clearCachedSession();
    return null;
  }

  setCachedSession(activeSession);
  return activeSession;
}

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
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
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
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, company_code, tenant_id, role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const validSession = await validateSession(session);
        setSession(validSession);
        setUser(validSession?.user ?? null);
        setAdminLoading(true);
        if (validSession?.user) {
          setTimeout(() => fetchProfile(validSession.user.id), 0);
          setTimeout(() => verifyAdminAccess(validSession), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setAdminLoading(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const validSession = await validateSession(session);
      setSession(validSession);
      setUser(validSession?.user ?? null);
      setAdminLoading(true);
      if (validSession?.user) {
        fetchProfile(validSession.user.id);
        verifyAdminAccess(validSession);
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
    clearCachedSession();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setAdminLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;

    const activeSession = data.session ?? (await waitForPersistedSession());

    if (!activeSession?.user || !isJwtLikeToken(activeSession.access_token)) {
      await supabase.auth.signOut();
      clearCachedSession();
      throw new Error("Session Supabase invalide apres connexion. Reessayez.");
    }

    const { data: verifiedUser, error: verifyError } = await supabase.auth.getUser(activeSession.access_token);
    if (verifyError || !verifiedUser.user) {
      await supabase.auth.signOut();
      clearCachedSession();
      throw new Error("Jeton Supabase invalide apres connexion. Reessayez.");
    }

    setCachedSession(activeSession);
    setSession(activeSession);
    setUser(activeSession.user);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, adminLoading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
