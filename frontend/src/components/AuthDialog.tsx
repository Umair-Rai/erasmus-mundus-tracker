import { useState, type FormEvent } from "react";
import { accountsEnabled, getSupabase } from "../supabase";
import { Dialog } from "./Dialog";

export type AuthMode = "signin" | "signup" | "forgot" | "reset";

const TITLES: Record<AuthMode, string> = {
  signin: "Sign in",
  signup: "Create your account",
  forgot: "Reset your password",
  reset: "Choose a new password",
};
const SUBMIT: Record<AuthMode, string> = {
  signin: "Sign in",
  signup: "Create account",
  forgot: "Send reset link",
  reset: "Save password",
};

const MIN_PASSWORD = 8;
const returnUrl = () => window.location.origin + window.location.pathname;
const KNOWN_ERRORS: Record<string, string> = {
  email_address_invalid: "That email address was rejected as invalid. Please use a real address that you can receive mail at.",
  over_email_send_rate_limit: "Too many emails have been sent recently, so no more can go out right now. Please try again in about an hour.",
  over_request_rate_limit: "Too many attempts. Please wait a minute and try again.",
  email_not_confirmed: "Please confirm your email first: open the link we sent to your inbox, then sign in.",
  user_already_exists: "That email already has an account. Try signing in.",
  weak_password: "That password is too weak. Try a longer one with a mix of letters and numbers.",
};

function describe(failure: unknown): string {
  const code = (failure as { code?: string } | null)?.code;
  if (code && KNOWN_ERRORS[code]) return KNOWN_ERRORS[code];
  const message = failure instanceof Error ? failure.message : "Something went wrong.";
  return /fetch|network/i.test(message) ? "Couldn't reach the server. Check your connection and try again." : message;
}

export function AuthDialog({ mode: initialMode, reason, onClose }: { mode: AuthMode; reason?: string; onClose: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const switchTo = (next: AuthMode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!accountsEnabled) return;
    if ((mode === "signup" || mode === "reset") && password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    setBusy(true);
    try {
      const { auth } = await getSupabase();
      if (mode === "signin") {
        const { error: failure } = await auth.signInWithPassword({ email, password });
        if (failure) throw failure;
      } else if (mode === "signup") {
        const { data, error: failure } = await auth.signUp({ email, password, options: { emailRedirectTo: returnUrl() } });
        if (failure) throw failure;
        if (!data.session) {
          setNotice(
            data.user?.identities?.length === 0
              ? "That email already has an account. Try signing in."
              : "Almost done! Check your inbox for a confirmation link, then sign in.",
          );
        }
      } else if (mode === "forgot") {
        const { error: failure } = await auth.resetPasswordForEmail(email, { redirectTo: returnUrl() });
        if (failure) throw failure;
        setNotice("If that email has an account, a reset link is on its way.");
      } else {
        const { error: failure } = await auth.updateUser({ password });
        if (failure) throw failure;
        onClose();
      }
    } catch (failure) {
      setError(describe(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog label={TITLES[mode]} onClose={onClose}>
      <form className="auth detail" onSubmit={submit}>
        <h2>{mode === "signin" || mode === "signup" ? "Your account" : TITLES[mode]}</h2>
        {(mode === "signin" || mode === "signup") && (
          <div className="auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => switchTo("signin")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => switchTo("signup")}>Create account</button>
          </div>
        )}
        {reason && mode === "signin" && <p className="subtitle">{reason}</p>}
        {!accountsEnabled && (
          <p className="auth-info" role="status">
            Accounts aren't switched on for this site yet. Once the site owner connects them, you'll be able to sign in and keep a wishlist here.
          </p>
        )}
        {mode !== "reset" && (
          <label className="field">
            <span>Email</span>
            <input type="email" required autoFocus disabled={!accountsEnabled} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        )}
        {mode !== "forgot" && (
          <label className="field">
            <span>{mode === "reset" ? "New password" : "Password"}</span>
            <input
              type="password"
              required
              disabled={!accountsEnabled}
              autoFocus={mode === "reset"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button className="button primary" type="submit" disabled={busy || !accountsEnabled}>{busy ? "Please wait…" : SUBMIT[mode]}</button>
        <div className="auth-links">
          {mode === "signin" && (
            <button type="button" className="text-button" onClick={() => switchTo("forgot")}>Forgot password?</button>
          )}
          {mode === "forgot" && (
            <button type="button" className="text-button" onClick={() => switchTo("signin")}>Back to sign in</button>
          )}
        </div>
        {mode === "signup" && <p className="auth-fine">Your wishlist and notes are private to your account.</p>}
      </form>
    </Dialog>
  );
}
