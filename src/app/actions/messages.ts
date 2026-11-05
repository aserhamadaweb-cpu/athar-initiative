"use server";

import { createSupabase } from "@/lib/supabase";

export type MessageState = {
  status: "idle" | "success" | "error";
  code?: "validation" | "email" | "save";
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendMessage(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  if (String(formData.get("company") ?? "").trim()) {
    return { status: "success" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const locale = String(formData.get("locale") ?? "");
  const email = emailRaw.length > 0 ? emailRaw : null;

  if (
    name.length < 2 ||
    name.length > 80 ||
    body.length < 5 ||
    body.length > 2000 ||
    (locale !== "ar" && locale !== "en")
  ) {
    return { status: "error", code: "validation" };
  }

  if (email && (email.length > 160 || !emailPattern.test(email))) {
    return { status: "error", code: "email" };
  }

  const supabase = createSupabase();
  if (!supabase) return { status: "error", code: "save" };

  const { error } = await supabase.from("messages").insert({
    name,
    email,
    body,
    locale,
  });

  if (error) {
    console.error("messages", error.message);
    return { status: "error", code: "save" };
  }

  return { status: "success" };
}
