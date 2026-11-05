"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type MessageState } from "@/app/actions/messages";

const initial: MessageState = { status: "idle" };

export function MessageForm() {
  const t = useTranslations("home");
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(sendMessage, initial);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const error =
    state.status === "error"
      ? state.code === "email"
        ? t("errorEmail")
        : state.code === "save"
          ? t("errorSave")
          : t("errorValidation")
      : null;

  return (
    <section className="shell py-8" id="message">
      <div className="panel stage-card grid gap-8 p-6 md:grid-cols-[0.8fr_1.2fr] md:p-10">
        <div>
          <p className="kicker">{t("formKicker")}</p>
          <h2 className="display mt-3 text-4xl">{t("formTitle")}</h2>
          <p className="mt-4 text-muted">{t("formLead")}</p>
        </div>
        <form ref={formRef} action={action} className="grid gap-4">
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <input type="hidden" name="locale" value={locale} />
          <label className="field">
            {t("name")}
            <input name="name" required minLength={2} maxLength={80} placeholder={t("namePlaceholder")} />
          </label>
          <label className="field">
            <span>{t("email")} <span className="font-medium text-muted">({t("emailHint")})</span></span>
            <input name="email" type="email" maxLength={160} autoComplete="email" />
          </label>
          <label className="field">
            {t("message")}
            <textarea name="body" required minLength={5} maxLength={2000} rows={5} placeholder={t("messagePlaceholder")} />
          </label>
          <button className="btn btn-primary w-full sm:w-auto sm:justify-self-start" type="submit" disabled={pending}>
            {pending ? t("sending") : t("submit")}
          </button>
          {state.status === "success" ? <p role="status">{t("sent")}</p> : null}
          {error ? <p role="alert">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}
