"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  passwordsMatch,
  readAdminSession,
  writeAdminSession,
} from "@/lib/admin-session";
import { createAdminSupabase } from "@/lib/admin-supabase";
import type { AdminResult } from "@/lib/admin-types";

const fails = new Map<string, { count: number; reset: number }>();

function bad(code: NonNullable<AdminResult["code"]>): AdminResult {
  return { status: "error", code };
}

async function clientIp() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "local"
  );
}

function limited(ip: string) {
  const row = fails.get(ip);
  if (!row) return false;
  if (Date.now() > row.reset) {
    fails.delete(ip);
    return false;
  }
  return row.count >= 5;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const row = fails.get(ip);
  if (!row || now > row.reset) {
    fails.set(ip, { count: 1, reset: now + 30 * 60 * 1000 });
    return;
  }
  row.count += 1;
}

async function adminClient() {
  if (!(await readAdminSession())) return null;
  return createAdminSupabase();
}

function text(value: FormDataEntryValue | null, min: number, max: number, keepLines = false) {
  const raw = String(value ?? "").replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  const clean = keepLines ? raw : raw.replace(/[ \t\f\v]+/g, " ");
  if (clean.length < min || clean.length > max) return null;
  return clean;
}

function siteUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (raw.length < 8 || raw.length > 500 || /\s/.test(raw)) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }
  return raw;
}

function uuid(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)
    ? raw
    : null;
}

function sortOrder(value: FormDataEntryValue | null) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 999) return null;
  return number;
}

export async function login(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const ip = await clientIp();
  if (limited(ip)) return bad("limited");

  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (password.length === 0 || password.length > 100 || !expected || !sessionSecret || !passwordsMatch(password, expected)) {
    recordFailure(ip);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return bad(limited(ip) ? "limited" : "bad");
  }

  fails.delete(ip);
  await writeAdminSession();
  return { status: "ok" };
}

export async function logout() {
  await clearAdminSession();
  const locale = await getLocale();
  redirect(locale === "ar" ? "/ar/admin" : "/admin");
}

export async function saveUpdate(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase) return bad("auth");

  const titleAr = text(formData.get("title_ar"), 2, 140);
  const titleEn = text(formData.get("title_en"), 2, 140);
  const bodyAr = text(formData.get("body_ar"), 2, 4000, true);
  const bodyEn = text(formData.get("body_en"), 2, 4000, true);
  if (!titleAr || !titleEn || !bodyAr || !bodyEn) return bad("validation");

  const row = {
    title_ar: titleAr,
    title_en: titleEn,
    body_ar: bodyAr,
    body_en: bodyEn,
    published: formData.get("published") === "on",
  };
  const id = String(formData.get("id") ?? "");
  const result = id
    ? await supabase.from("updates").update(row).eq("id", uuid(id) ?? "").select("id")
    : await supabase.from("updates").insert(row).select("id");

  if (result.error || !result.data?.length) {
    console.error("save update", result.error?.message);
    return bad("save");
  }

  updateTag("updates");
  return { status: "ok" };
}

export async function deleteUpdate(id: string): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase || !uuid(id)) return bad("auth");
  const result = await supabase.from("updates").delete().eq("id", id).select("id");
  if (result.error || !result.data?.length) return bad("save");
  updateTag("updates");
  return { status: "ok" };
}

export async function saveLink(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase) return bad("auth");

  const key = String(formData.get("key") ?? "");
  const url = siteUrl(formData.get("url"));
  const labelAr = text(formData.get("label_ar"), 1, 80);
  const labelEn = text(formData.get("label_en"), 1, 80);
  const noteAr = text(formData.get("note_ar"), 0, 300);
  const noteEn = text(formData.get("note_en"), 0, 300);
  if (!/^[a-z0-9_]{2,40}$/.test(key) || !url || !labelAr || !labelEn || noteAr === null || noteEn === null) {
    return bad("validation");
  }

  const result = await supabase
    .from("site_links")
    .update({ url, label_ar: labelAr, label_en: labelEn, note_ar: noteAr, note_en: noteEn })
    .eq("key", key)
    .select("key");

  if (result.error || !result.data?.length) {
    console.error("save link", result.error?.message);
    return bad("save");
  }

  updateTag("site-links");
  return { status: "ok" };
}

export async function deleteMessage(id: string): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase || !uuid(id)) return bad("auth");
  const result = await supabase.from("messages").delete().eq("id", id).select("id");
  if (result.error || !result.data?.length) return bad("save");
  return { status: "ok" };
}

export async function saveMember(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase) return bad("auth");

  const name = text(formData.get("name"), 2, 80);
  const roleAr = text(formData.get("role_ar"), 2, 120);
  const roleEn = text(formData.get("role_en"), 2, 120);
  const noteAr = text(formData.get("note_ar"), 0, 300);
  const noteEn = text(formData.get("note_en"), 0, 300);
  const order = sortOrder(formData.get("sort_order"));
  if (!name || !roleAr || !roleEn || noteAr === null || noteEn === null || order === null) return bad("validation");

  const row = {
    name,
    role_ar: roleAr,
    role_en: roleEn,
    note_ar: noteAr,
    note_en: noteEn,
    sort_order: order,
    published: formData.get("published") === "on",
  };
  const id = String(formData.get("id") ?? "");
  const result = id
    ? await supabase.from("best_members").update(row).eq("id", uuid(id) ?? "").select("id")
    : await supabase.from("best_members").insert(row).select("id");

  if (result.error || !result.data?.length) {
    console.error("save member", result.error?.message);
    return bad("save");
  }

  updateTag("members");
  return { status: "ok" };
}

function taskStatus(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");
  if (raw === "assigned" || raw === "in_progress" || raw === "completed") return raw;
  return null;
}

function deadline(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return raw;
}

export async function saveOrgTeam(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase) return bad("auth");

  const nameAr = text(formData.get("name_ar"), 2, 80);
  const nameEn = text(formData.get("name_en"), 2, 80);
  const order = sortOrder(formData.get("sort_order"));
  if (!nameAr || !nameEn || order === null) return bad("validation");

  const row = { name_ar: nameAr, name_en: nameEn, sort_order: order };
  const id = String(formData.get("id") ?? "");
  const result = id
    ? await supabase.from("org_teams").update(row).eq("id", uuid(id) ?? "").select("id")
    : await supabase.from("org_teams").insert(row).select("id");

  if (result.error || !result.data?.length) {
    console.error("save team", result.error?.message);
    return bad("save");
  }

  updateTag("org");
  return { status: "ok", id: result.data[0].id };
}

export async function deleteOrgTeam(id: string): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase || !uuid(id)) return bad("auth");
  const result = await supabase.from("org_teams").delete().eq("id", id).select("id");
  if (result.error || !result.data?.length) return bad("save");
  updateTag("org");
  return { status: "ok" };
}

export async function saveOrgMember(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase) return bad("auth");

  const teamId = uuid(formData.get("team_id"));
  const name = text(formData.get("name"), 2, 80);
  const role = text(formData.get("role"), 0, 120);
  const order = sortOrder(formData.get("sort_order"));
  if (!teamId || !name || role === null || order === null) return bad("validation");

  const row = { team_id: teamId, name, role, sort_order: order };
  const id = String(formData.get("id") ?? "");
  const result = id
    ? await supabase.from("org_members").update(row).eq("id", uuid(id) ?? "").select("id")
    : await supabase.from("org_members").insert(row).select("id");

  if (result.error || !result.data?.length) {
    console.error("save org member", result.error?.message);
    return bad("save");
  }

  updateTag("org");
  return { status: "ok", id: result.data[0].id };
}

export async function setOrgNotice(id: string, kind: string, note: string): Promise<AdminResult> {
  const supabase = await adminClient();
  const memberId = uuid(id);
  if (!supabase || !memberId) return bad("auth");

  const noticeKind = kind === "warning" || kind === "promotion" ? kind : kind === "" ? null : undefined;
  const notice = text(note, 0, 160);
  if (noticeKind === undefined || notice === null) return bad("validation");

  const result = await supabase
    .from("org_members")
    .update({ notice_kind: noticeKind, notice: noticeKind ? notice : "" })
    .eq("id", memberId)
    .select("id");

  if (result.error || !result.data?.length) {
    console.error("set org notice", result.error?.message);
    return bad("save");
  }

  updateTag("org");
  return { status: "ok" };
}

export async function deleteOrgMember(id: string): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase || !uuid(id)) return bad("auth");
  const result = await supabase.from("org_members").delete().eq("id", id).select("id");
  if (result.error || !result.data?.length) return bad("save");
  updateTag("org");
  return { status: "ok" };
}

export async function saveOrgTask(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase) return bad("auth");

  const memberId = uuid(formData.get("member_id"));
  const title = text(formData.get("title"), 2, 300);
  const status = taskStatus(formData.get("status"));
  const due = deadline(formData.get("deadline"));
  const order = sortOrder(formData.get("sort_order"));
  if (!memberId || !title || !status || due === undefined || order === null) return bad("validation");

  const row = { member_id: memberId, title, status, deadline: due, sort_order: order };
  const id = String(formData.get("id") ?? "");
  const result = id
    ? await supabase.from("org_tasks").update(row).eq("id", uuid(id) ?? "").select("id")
    : await supabase.from("org_tasks").insert(row).select("id");

  if (result.error || !result.data?.length) {
    console.error("save task", result.error?.message);
    return bad("save");
  }

  updateTag("org");
  return { status: "ok", id: result.data[0].id };
}

export async function deleteOrgTask(id: string): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase || !uuid(id)) return bad("auth");
  const result = await supabase.from("org_tasks").delete().eq("id", id).select("id");
  if (result.error || !result.data?.length) return bad("save");
  updateTag("org");
  return { status: "ok" };
}

export async function deleteMember(id: string): Promise<AdminResult> {
  const supabase = await adminClient();
  if (!supabase || !uuid(id)) return bad("auth");
  const result = await supabase.from("best_members").delete().eq("id", id).select("id");
  if (result.error || !result.data?.length) return bad("save");
  updateTag("members");
  return { status: "ok" };
}
