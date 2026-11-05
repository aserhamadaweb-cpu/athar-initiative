"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { login } from "@/app/actions/admin";
import { useRouter } from "@/i18n/navigation";
import type { AdminResult } from "@/lib/admin-types";

const initial: AdminResult = { status: "idle" };

export function LoginForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [state, action, pending] = useActionState(login, initial);
  const handled = useRef(initial);

  useEffect(() => {
    if (state.status !== "ok" || handled.current === state) return;
    handled.current = state;
    router.refresh();
  }, [router, state]);

  const message =
    state.status === "error" ? (state.code === "limited" ? t("limited") : t("bad")) : null;

  return (
    <section className="shell grid min-h-[60vh] place-items-center py-16">
      <form action={action} className="panel grid w-full max-w-md gap-4 p-8">
        <p className="kicker">ATHAR</p>
        <h1 className="display text-4xl">{t("title")}</h1>
        <p className="text-muted">{t("loginLead")}</p>
        <label className="field">
          {t("password")}
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {message ? (
          <p role="alert" className="font-bold">
            {message}
          </p>
        ) : null}
        <button className="btn btn-primary" disabled={pending}>
          {pending ? t("working") : t("enter")}
        </button>
      </form>
    </section>
  );
}
