"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  clearMemberSession,
  passwordsMatch,
  readMemberSession,
  writeMemberSession,
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

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function joinMembers(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const ip = await clientIp();
  if (limited(ip)) return bad("limited");

  const password = String(formData.get("password") ?? "");
  const expected = process.env.MEMBER_PASSWORD ?? "";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (password.length === 0 || password.length > 100 || !expected || !sessionSecret || !passwordsMatch(password, expected)) {
    recordFailure(ip);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return bad(limited(ip) ? "limited" : "bad");
  }

  fails.delete(ip);
  await writeMemberSession();
  return { status: "ok" };
}

export async function leaveMembers() {
  await clearMemberSession();
  const locale = await getLocale();
  redirect(locale === "ar" ? "/ar/teams" : "/teams");
}

export async function completeOrgTask(id: string, done: boolean): Promise<AdminResult> {
  if (!(await readMemberSession()) || !uuid(id)) return bad("auth");
  const supabase = createAdminSupabase();
  if (!supabase) return bad("save");

  const result = await supabase
    .from("org_tasks")
    .update({ status: done ? "completed" : "assigned" })
    .eq("id", id)
    .select("id");

  if (result.error || !result.data?.length) return bad("save");
  updateTag("org");
  return { status: "ok" };
}
