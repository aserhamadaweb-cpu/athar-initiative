"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { joinMembers } from "@/app/actions/members";
import { useRouter } from "@/i18n/navigation";
import type { AdminResult } from "@/lib/admin-types";

const initial: AdminResult = { status: "idle" };

export function JoinForm() {
  const t = useTranslations("org");
  const router = useRouter();
  const [state, action, pending] = useActionState(joinMembers, initial);
  const handled = useRef(initial);

  useEffect(() => {
    if (state.status !== "ok" || handled.current === state) return;
    handled.current = state;
    router.refresh();
  }, [router, state]);

  const message =
    state.status === "error" ? (state.code === "limited" ? t("limited") : t("bad")) : null;

  return (
    <form action={action} className="panel mx-auto grid w-full max-w-md gap-4 p-6 sm:p-8">
      <h2 className="text-3xl font-extrabold">{t("joinTitle")}</h2>
      <p className="text-muted">{t("joinLead")}</p>
      <label className="field">
        {t("password")}
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {message ? <p role="alert" className="font-bold">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? t("working") : t("enter")}
      </button>
    </form>
  );
}
