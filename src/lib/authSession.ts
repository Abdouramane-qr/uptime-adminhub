import type { Session } from "@supabase/supabase-js";

let currentSession: Session | null = null;

export function getCachedSession(): Session | null {
  return currentSession;
}

export function setCachedSession(session: Session | null): void {
  currentSession = session;
}

export function clearCachedSession(): void {
  currentSession = null;
}
