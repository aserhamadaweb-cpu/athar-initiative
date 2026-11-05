import { cacheLife, cacheTag } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { orgSelect, shapeOrg, type OrgTeam } from "@/lib/org";

export type UpdateRow = {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  created_at: string;
};

export type MemberRow = {
  id: string;
  name: string;
  role_ar: string;
  role_en: string;
  note_ar: string;
  note_en: string;
  sort_order: number;
};

export function createSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getPublishedUpdates(): Promise<UpdateRow[]> {
  "use cache";
  cacheTag("updates");
  cacheLife("minutes");

  const supabase = createSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("updates")
    .select("id, title_ar, title_en, body_ar, body_en, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("updates", error.message);
    return [];
  }

  return data ?? [];
}

export async function getPublishedMembers(): Promise<MemberRow[]> {
  "use cache";
  cacheTag("members");
  cacheLife("minutes");

  const supabase = createSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("best_members")
    .select("id, name, role_ar, role_en, note_ar, note_en, sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("best_members", error.message);
    return [];
  }

  return data ?? [];
}

export async function getOrgBoard(): Promise<OrgTeam[]> {
  "use cache";
  cacheTag("org");
  cacheLife("minutes");

  const supabase = createSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.from("org_teams").select(orgSelect).order("sort_order", { ascending: true });

  if (error) {
    console.error("org", error.message);
    return [];
  }

  return shapeOrg(data);
}
