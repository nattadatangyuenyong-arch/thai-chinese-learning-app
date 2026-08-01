import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SupabaseSession, SupabaseUser, supabaseClient } from "../services/supabaseClient";

type AuthContextValue = {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  loading: boolean;
  configured: boolean;
  signUp(email: string, password: string): Promise<{ confirmationRequired: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = supabaseClient.isConfigured();

  async function reloadSession() {
    const current = configured ? await supabaseClient.getValidSession() : null;
    setSession(current);
    setLoading(false);
  }

  useEffect(() => {
    void reloadSession();
    const listener = () => void reloadSession();
    window.addEventListener("cizhi-auth-change", listener);
    return () => window.removeEventListener("cizhi-auth-change", listener);
  }, [configured]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured,
    async signUp(email, password) {
      const result = await supabaseClient.signUp(email, password);
      if (result.session) setSession(result.session);
      return { confirmationRequired: !result.session };
    },
    async signIn(email, password) {
      const next = await supabaseClient.signIn(email, password);
      setSession(next);
    },
    async signOut() {
      await supabaseClient.signOut();
      setSession(null);
    },
    async resetPassword(email) {
      await supabaseClient.resetPassword(email);
    },
  }), [session, loading, configured]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
