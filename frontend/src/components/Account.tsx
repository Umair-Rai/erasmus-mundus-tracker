import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth";
import { STATUSES, STATUS_LABELS, useWishlist, type Entry, type Status } from "../wishlist";
import { Icon } from "./Icon";

const NOTES_SAVE_DELAY = 700;

function confirmRemoval(entry: Entry | undefined) {
  return !entry?.notes.trim() || window.confirm("Remove this programme from your list? Your notes for it will be deleted.");
}

export function AccountMenu() {
  const { user, loading, promptSignIn, signOut } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <>
        <button className="account-btn account-secondary" onClick={() => promptSignIn(undefined, "signup")}>Create account</button>
        <button className="account-btn primary" onClick={() => promptSignIn()}>Sign in</button>
      </>
    );
  }
  return (
    <div className="account">
      <span className="account-email" title={user.email}>{user.email}</span>
      <button className="account-btn" onClick={signOut}>Sign out</button>
    </div>
  );
}

export function WishlistStar({ itemKey, name }: { itemKey: string; name: string }) {
  const { enabled, user, promptSignIn } = useAuth();
  const { entries, toggle } = useWishlist();
  if (!enabled) return null;
  const saved = Boolean(entries[itemKey]);
  const label = saved ? `Remove ${name} from my list` : `Add ${name} to my list`;
  const onClick = () => {
    if (!user) promptSignIn("Sign in to save programmes to your list.");
    else if (!saved || confirmRemoval(entries[itemKey])) toggle(itemKey);
  };
  return (
    <button className="star" aria-pressed={saved} aria-label={label} title={label} onClick={onClick}>
      <Icon name="star" filled={saved} />
    </button>
  );
}

function NotesEditor({ itemKey, saved }: { itemKey: string; saved: string }) {
  const { setNotes } = useWishlist();
  const [text, setText] = useState(saved);
  const latestText = useRef(text);
  const latestSaved = useRef(saved);
  latestText.current = text;
  latestSaved.current = saved;

  const flush = () => {
    if (latestText.current !== latestSaved.current) setNotes(itemKey, latestText.current);
  };

  useEffect(() => {
    if (text === saved) return;
    const timer = setTimeout(flush, NOTES_SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [text]);

  // Closing the dialog right after typing must not lose the last edit.
  useEffect(() => flush, []);

  return (
    <label className="field notes-field">
      <span>Private notes <em>{text === saved ? "Saved" : "Saving…"}</em></span>
      <textarea
        value={text}
        maxLength={5000}
        rows={4}
        placeholder="Deadlines, documents to prepare, contacts, anything you want to remember…"
        onChange={(e) => setText(e.target.value)}
      />
    </label>
  );
}

export function MyPlan({ itemKey }: { itemKey: string }) {
  const { enabled, user, loading, promptSignIn } = useAuth();
  const { entries, error, toggle, setStatus } = useWishlist();
  if (!enabled || loading) return null;

  const entry = entries[itemKey];
  return (
    <section className="my-plan">
      <div className="fee-head">
        <h3>My plan</h3>
        {entry && <button className="text-button" onClick={() => confirmRemoval(entry) && toggle(itemKey)}>Remove from my list</button>}
      </div>
      {!user && (
        <>
          <p>Sign in to save this programme, track where you are with it, and keep private notes.</p>
          <button className="button primary" onClick={() => promptSignIn("Sign in to save programmes to your list.")}>Sign in</button>
        </>
      )}
      {user && !entry && <button className="button primary" onClick={() => toggle(itemKey)}>Add to my list</button>}
      {user && entry && (
        <>
          <label className="field">
            <span>Status</span>
            <select value={entry.status} onChange={(e) => setStatus(itemKey, e.target.value as Status)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <NotesEditor itemKey={itemKey} saved={entry.notes} />
        </>
      )}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </section>
  );
}
