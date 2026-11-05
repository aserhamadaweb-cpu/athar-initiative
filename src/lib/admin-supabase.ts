import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const gate = process.env.ADMIN_GATE;
  if (!url || !key || !gate) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-athar-admin": gate } },
  });
}
