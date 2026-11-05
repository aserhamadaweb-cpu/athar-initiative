import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

const COOKIE = "athar_admin";
const MEMBER_COOKIE = "athar_member";
const WEEK = 60 * 60 * 24 * 7;

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

export function passwordsMatch(input: string, expected: string) {
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export async function readAdminSession() {
  await connection();
  if (!sessionSecret()) return false;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value ?? "";
  const [version, exp, mac] = raw.split(".");
  if (version !== "v1" || !exp || !mac) return false;

  const expected = sign(`${version}.${exp}`);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  const expires = Number(exp);
  return Number.isFinite(expires) && expires > Date.now();
}

export async function writeAdminSession() {
  const payload = `v1.${Date.now() + WEEK * 1000}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

async function readSignedCookie(name: string, version: string) {
  await connection();
  if (!sessionSecret()) return false;
  const jar = await cookies();
  const raw = jar.get(name)?.value ?? "";
  const [found, exp, mac] = raw.split(".");
  if (found !== version || !exp || !mac) return false;

  const expected = sign(`${found}.${exp}`);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  const expires = Number(exp);
  return Number.isFinite(expires) && expires > Date.now();
}

function writeSignedCookie(name: string, version: string) {
  const payload = `${version}.${Date.now() + WEEK * 1000}`;
  return cookies().then((jar) => {
    jar.set(name, `${payload}.${sign(payload)}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: WEEK,
    });
  });
}

export async function readMemberSession() {
  return readSignedCookie(MEMBER_COOKIE, "m1");
}

export async function writeMemberSession() {
  await writeSignedCookie(MEMBER_COOKIE, "m1");
}

export async function clearMemberSession() {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
}
