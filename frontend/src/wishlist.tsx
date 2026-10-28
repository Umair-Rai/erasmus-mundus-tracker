import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { getSupabase } from "./supabase";
import type { CatalogueEntry, Programme } from "./types";

export type Status = "planning" | "applying" | "applied" | "accepted" | "rejected";
export const STATUSES: Status[] = ["planning", "applying", "applied", "accepted", "rejected"];
export const STATUS_LABELS: Record<Status, string> = {
  planning: "Planning",
  applying: "Applying",
  applied: "Applied",
  accepted: "Accepted",
  rejected: "Rejected",
};

export interface Entry {
  status: Status;
  notes: string;
}

export const trackerKey = (p: Programme) => `${p.id.slice(0, p.id.lastIndexOf("-"))}:${p.acronym ?? p.title}`;
export const catalogueKey = (e: CatalogueEntry) => `catalogue:${e.acronym ?? ""}|${e.title}|${e.cycle}`;

const SAVE_ERROR = "Couldn't save your changes. Check your connection.";

interface WishlistValue {
  entries: Record<string, Entry>;
  error: string;
  toggle: (key: string) => void;
  setStatus: (key: string, status: Status) => void;
  setNotes: (key: string, notes: string) => void;
}

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [error, setError] = useState("");
  const latest = useRef(entries);
  const activeUser = useRef(userId);
  activeUser.current = userId;
  const queue = useRef<Promise<void>>(Promise.resolve());

  const replace = useCallback((next: Record<string, Entry>) => {
    latest.current = next;
    setEntries(next);
  }, []);

  useEffect(() => {
    replace({});
    setError("");
    if (!userId) return;
    let cancelled = false;
    getSupabase().then(async (supabase) => {
      const { data, error: failure } = await supabase.from("wishlist").select("programme_key,status,notes");
      if (cancelled) return;
      if (failure) {
        setError("Couldn't load your wishlist.");
        return;
      }
      replace(Object.fromEntries(data.map((row) => [row.programme_key, { status: row.status as Status, notes: row.notes }])));
    });
    return () => {
      cancelled = true;
    };
  }, [userId, replace]);

  // Saves run one at a time and always send the newest local state for the key,
  // so quick successive edits can't land on the server out of order.
  const persist = useCallback(
    (key: string) => {
      queue.current = queue.current
        .then(async () => {
          if (!userId || activeUser.current !== userId) return;
          const supabase = await getSupabase();
          const entry = latest.current[key];
          const { error: failure } = entry
            ? await supabase
                .from("wishlist")
                .upsert(
                  { user_id: userId, programme_key: key, status: entry.status, notes: entry.notes, updated_at: new Date().toISOString() },
                  { onConflict: "user_id,programme_key" },
                )
            : await supabase.from("wishlist").delete().eq("user_id", userId).eq("programme_key", key);
          setError(failure ? SAVE_ERROR : "");
        })
        .catch(() => setError(SAVE_ERROR));
    },
    [userId],
  );

  const update = useCallback(
    (key: string, change: (current: Entry | undefined) => Entry | null) => {
      const next = { ...latest.current };
      const result = change(next[key]);
      if (result) next[key] = result;
      else delete next[key];
      replace(next);
      persist(key);
    },
    [persist, replace],
  );

  const toggle = useCallback((key: string) => update(key, (e) => (e ? null : { status: "planning", notes: "" })), [update]);
  const setStatus = useCallback((key: string, status: Status) => update(key, (e) => ({ notes: "", ...e, status })), [update]);
  const setNotes = useCallback((key: string, notes: string) => update(key, (e) => ({ status: "planning", ...e, notes })), [update]);

  const value = useMemo(() => ({ entries, error, toggle, setStatus, setNotes }), [entries, error, toggle, setStatus, setNotes]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistValue {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
