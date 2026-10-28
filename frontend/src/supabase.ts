import type { SupabaseClient } from "@supabase/supabase-js";

const url: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const anonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const accountsEnabled = Boolean(url && anonKey);

let client: Promise<SupabaseClient> | undefined;

// Loaded on demand so a site without accounts configured never downloads the SDK.
export function getSupabase(): Promise<SupabaseClient> {
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url!, anonKey!, { auth: { flowType: "pkce" } }),
  );
  return client;
}
