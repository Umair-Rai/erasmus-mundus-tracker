import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthDialog, type AuthMode } from "./components/AuthDialog";
import { accountsEnabled, getSupabase } from "./supabase";

interface AuthValue {
  enabled: boolean;
  user: User | null;
  loading: boolean;
  promptSignIn: (reason?: string, mode?: AuthMode) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(accountsEnabled);
  const [dialog, setDialog] = useState<{ mode: AuthMode; reason?: string } | null>(null);

  useEffect(() => {
    if (!accountsEnabled) return;
    let cancelled = false;
    let unsubscribe = () => {};
    getSupabase().then((supabase) => {
      if (cancelled) return;
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (event === "PASSWORD_RECOVERY") setDialog({ mode: "reset" });
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }).catch(() => setLoading(false));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && dialog && dialog.mode !== "reset") setDialog(null);
  }, [user, dialog]);

  const promptSignIn = useCallback((reason?: string, mode: AuthMode = "signin") => setDialog({ mode, reason }), []);
  const signOut = useCallback(async () => {
    await (await getSupabase()).auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ enabled: accountsEnabled, user, loading, promptSignIn, signOut }),
    [user, loading, promptSignIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {dialog && <AuthDialog mode={dialog.mode} reason={dialog.reason} onClose={() => setDialog(null)} />}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
