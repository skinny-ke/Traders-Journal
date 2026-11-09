import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export function getSupabaseConfigStatus() {
  const missing = [];
  if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  return {
    configured: missing.length === 0,
    missing,
    urlPresent: Boolean(supabaseUrl),
  };
}

let client = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else if (import.meta.env.DEV) {
  console.info(
    "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env. Local development data will be used until then.",
  );
}

export const supabase = client;

export function isSupabaseConfigured() {
  return Boolean(client);
}

export async function getAuthSession() {
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.warn("Failed to read Supabase session", error.message);
      return null;
    }
    return data.session || null;
  } catch (err) {
    console.warn("Failed to read Supabase session", err);
    return null;
  }
}

export async function getCurrentUserId() {
  const session = await getAuthSession();
  return session?.user?.id || null;
}
