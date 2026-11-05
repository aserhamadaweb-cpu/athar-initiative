import { createAdminSupabase } from "@/lib/admin-supabase";
import type { AdminSnapshot } from "@/lib/admin-types";
import { orgSelect, shapeOrg } from "@/lib/org";

const empty: AdminSnapshot = {
  updates: [],
  links: [],
  messages: [],
  messageCount: 0,
  members: [],
  org: [],
  error: true,
};

export async function loadAdminData(): Promise<AdminSnapshot> {
  const supabase = createAdminSupabase();
  if (!supabase) return empty;

  const [updates, links, messages, members, org] = await Promise.all([
    supabase
      .from("updates")
      .select("id, title_ar, title_en, body_ar, body_en, published, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("site_links")
      .select("key, group_name, label_ar, label_en, url, note_ar, note_en, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("messages")
      .select("id, name, email, body, locale, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("best_members")
      .select("id, name, role_ar, role_en, note_ar, note_en, sort_order, published")
      .order("sort_order", { ascending: true }),
    supabase.from("org_teams").select(orgSelect).order("sort_order", { ascending: true }),
  ]);

  if (updates.error || links.error || messages.error || members.error || org.error) {
    console.error(
      "admin load",
      updates.error?.message,
      links.error?.message,
      messages.error?.message,
      members.error?.message,
      org.error?.message,
    );
    return empty;
  }

  return {
    updates: updates.data ?? [],
    links: links.data ?? [],
    messages: messages.data ?? [],
    messageCount: messages.count ?? messages.data?.length ?? 0,
    members: members.data ?? [],
    org: shapeOrg(org.data),
    error: false,
  };
}
