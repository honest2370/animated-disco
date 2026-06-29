import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./types";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    full_name: string,
    phone: string
  ) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateMyProfile: (p: {
    full_name: string;
    phone: string;
    avatar_url: string | null;
  }) => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (uid: string, retries = 6): Promise<Profile | null> => {
      for (let i = 0; i < retries; i++) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        const p = (data as Profile) ?? null;
        if (p) {
          setProfile(p);
          return p;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      return null;
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const s = data.session;
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
      }
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id, 3);
  }, [session, loadProfile]);

  // Sign-in : onAuthStateChange se charge du profil en arrière-plan.
  // Aucun blocage — l'app s'affiche immédiatement.
  const signIn: AuthState["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: translateError(error.message) };
    return {};
  };

  const signUp: AuthState["signUp"] = async (
    email,
    password,
    full_name,
    phone
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, phone } },
    });
    if (error) return { error: translateError(error.message) };

    // Si confirmation e-mail désactivée, on obtient une session directement.
    if (data.session) return {};

    // Sinon on tente une connexion immédiate.
    const { error: liErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (liErr) return { needsConfirm: true };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const updateMyProfile: AuthState["updateMyProfile"] = async (p) => {
    await supabase.rpc("update_my_profile", {
      p_full_name: p.full_name,
      p_phone: p.phone,
      p_avatar_url: p.avatar_url,
    });
    if (session) await loadProfile(session.user.id, 3);
  };

  return (
    <Ctx.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateMyProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (m.includes("not confirmed")) return "Veuillez confirmer votre adresse e-mail.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Cet e-mail est déjà utilisé.";
  if (m.includes("password") && m.includes("weak"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("rate limit")) return "Trop de tentatives. Réessayez dans un instant.";
  return msg;
}
