"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  deleteMember,
  deleteMessage,
  deleteUpdate,
  logout,
  saveLink,
  saveMember,
  saveUpdate,
} from "@/app/actions/admin";
import { Link, useRouter } from "@/i18n/navigation";
import type { AdminLink, AdminMember, AdminMessage, AdminResult, AdminSnapshot, AdminUpdate } from "@/lib/admin-types";

const initial: AdminResult = { status: "idle" };

type Filter = "all" | "news" | "links" | "messages" | "members";

type Panel =
  | { type: "pick" }
  | { type: "news"; item: AdminUpdate | null }
  | { type: "member"; item: AdminMember | null }
  | { type: "link"; item: AdminLink }
  | { type: "message"; item: AdminMessage };

function when(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Editor({
  action,
  onDone,
  children,
}: {
  action: (prev: AdminResult, formData: FormData) => Promise<AdminResult>;
  onDone: (id?: string) => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const handled = useRef(initial);
  const [state, run, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.status !== "ok" || handled.current === state) return;
    handled.current = state;
    onDone(state.id);
    router.refresh();
  }, [onDone, router, state]);

  const message =
    state.status === "error"
      ? state.code === "validation"
        ? t("errorValidation")
        : state.code === "auth"
          ? t("errorAuth")
          : t("errorSave")
      : null;

  return (
    <form action={run} className="mt-4 grid gap-3">
      {children}
      {message ? <p role="alert" className="font-bold">{message}</p> : null}
      <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? t("working") : t("save")}
      </button>
    </form>
  );
}

function RemoveButton({
  id,
  action,
  onDone,
}: {
  id: string;
  action: (id: string) => Promise<AdminResult>;
  onDone?: () => void;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn btn-line"
        disabled={pending}
        onClick={() => {
          if (!confirm(t("confirmDelete"))) return;
          start(async () => {
            const result = await action(id);
            if (result.status === "ok") {
              onDone?.();
              router.refresh();
              return;
            }
            setMessage(result.code === "auth" ? t("errorAuth") : t("errorSave"));
          });
        }}
      >
        {pending ? t("working") : t("delete")}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </div>
  );
}

function Published({ checked }: { checked?: boolean }) {
  const t = useTranslations("admin");
  return (
    <label className="flex min-h-11 items-center gap-2 font-bold">
      <input type="checkbox" name="published" defaultChecked={checked ?? true} />
      {t("published")}
    </label>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const ref = useRef<HTMLDialogElement>(null);
  const ignoreClose = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      ignoreClose.current = true;
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="admin-sheet"
      onClose={() => {
        if (ignoreClose.current) return;
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="admin-sheet-body">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <button type="button" className="btn btn-line" onClick={onClose}>
            {t("close")}
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function Row({
  badge,
  title,
  meta,
  editLabel,
  onEdit,
  remove,
}: {
  badge: string;
  title: string;
  meta: string;
  editLabel?: string;
  onEdit?: () => void;
  remove?: React.ReactNode;
}) {
  return (
    <article className="panel admin-row p-4">
      <span className="admin-badge">{badge}</span>
      <div className="min-w-0">
        <h3 className="truncate text-lg font-extrabold">{title}</h3>
        <p className="truncate text-sm text-muted">{meta}</p>
      </div>
      <div className="admin-actions">
        {onEdit ? (
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            {editLabel}
          </button>
        ) : null}
        {remove}
      </div>
    </article>
  );
}

export function AdminDesk({ data }: { data: AdminSnapshot }) {
  const t = useTranslations("admin");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [panel, setPanel] = useState<Panel | null>(null);
  const [notice, setNotice] = useState("");
  const close = () => setPanel(null);
  const saved = () => {
    setNotice(t("saved"));
    setPanel(null);
  };

  const filters = [
    ["all", t("all")],
    ["news", t("news")],
    ["links", t("links")],
    ["messages", t("messages")],
    ["members", t("members")],
  ] as const;

  function openAdd() {
    if (filter === "news") setPanel({ type: "news", item: null });
    else if (filter === "members") setPanel({ type: "member", item: null });
    else setPanel({ type: "pick" });
  }

  const showNews = filter === "all" || filter === "news";
  const showLinks = filter === "all" || filter === "links";
  const showMessages = filter === "all" || filter === "messages";
  const showMembers = filter === "all" || filter === "members";
  const empty =
    (showNews ? data.updates.length : 0) +
      (showLinks ? data.links.length : 0) +
      (showMessages ? data.messages.length : 0) +
      (showMembers ? data.members.length : 0) ===
    0;

  const sheetTitle =
    panel?.type === "pick"
      ? t("addWhat")
      : panel?.type === "news"
        ? panel.item
          ? t("edit")
          : t("newUpdate")
        : panel?.type === "member"
          ? panel.item
            ? t("edit")
            : t("newMember")
            : panel?.type === "link"
              ? t("edit")
              : panel?.type === "message"
                ? panel.item.name
                : "";

  return (
    <div className="pb-16">
      <header className="shell pb-2 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">ATHAR</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">{t("title")}</h1>
            <p className="mt-3 max-w-2xl text-muted">{t("lead")}</p>
          </div>
          <form action={logout}>
            <button className="btn btn-line">{t("logout")}</button>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="nav-link" href="/">{nav("home")}</Link>
          <Link className="nav-link" href="/volunteer">{nav("volunteer")}</Link>
          <Link className="nav-link" href="/updates">{nav("updates")}</Link>
          <Link className="nav-link" href="/teams">{nav("teams")}</Link>
          <Link className="nav-link" href="/game">{nav("game")}</Link>
        </div>
      </header>

      <div className="shell">
        <Link href="/admin/teams" className="panel mb-4 block p-5">
          <p className="kicker">{t("orgTeams")}</p>
          <p className="mt-2 text-2xl font-extrabold">{t("teamsDesk")}</p>
          <p className="mt-2 text-muted">{t("teamsDeskLead")}</p>
        </Link>

        <div className="admin-tools">
          <div className="admin-filters" role="tablist" aria-label={t("all")}>
            {filters.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="admin-chip"
                data-active={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={openAdd}>
            {t("add")}
          </button>
        </div>

        {data.error ? <p className="panel mb-4 p-4 font-bold">{t("loadError")}</p> : null}
        {notice ? <p role="status" className="mb-4 font-bold">{notice}</p> : null}

        <section className="grid gap-3 pb-8" aria-label={t("title")}>
          {empty ? <p className="text-muted">{t("emptyList")}</p> : null}

          {showNews
            ? data.updates.map((item) => (
                <Row
                  key={item.id}
                  badge={t("news")}
                  title={locale === "en" ? item.title_en : item.title_ar}
                  meta={`${item.published ? t("visible") : t("draft")} · ${when(locale, item.created_at)}`}
                  editLabel={t("edit")}
                  onEdit={() => setPanel({ type: "news", item })}
                  remove={<RemoveButton id={item.id} action={deleteUpdate} />}
                />
              ))
            : null}

          {showLinks
            ? data.links.map((item) => (
                <Row
                  key={item.key}
                  badge={t("links")}
                  title={locale === "en" ? item.label_en : item.label_ar}
                  meta={item.url}
                  editLabel={t("edit")}
                  onEdit={() => setPanel({ type: "link", item })}
                />
              ))
            : null}

          {showMessages
            ? data.messages.map((item) => (
                <Row
                  key={item.id}
                  badge={t("messages")}
                  title={item.name}
                  meta={`${when(locale, item.created_at)}${item.email ? ` · ${item.email}` : ""}`}
                  editLabel={t("view")}
                  onEdit={() => setPanel({ type: "message", item })}
                  remove={<RemoveButton id={item.id} action={deleteMessage} />}
                />
              ))
            : null}

          {showMembers
            ? data.members.map((item) => (
                <Row
                  key={item.id}
                  badge={t("members")}
                  title={item.name}
                  meta={`${item.published ? t("visible") : t("draft")} · ${locale === "en" ? item.role_en : item.role_ar}`}
                  editLabel={t("edit")}
                  onEdit={() => setPanel({ type: "member", item })}
                  remove={<RemoveButton id={item.id} action={deleteMember} />}
                />
              ))
            : null}
        </section>
      </div>

      {panel ? (
        <Sheet title={sheetTitle} onClose={close}>
          {panel.type === "pick" ? (
            <div className="mt-5 grid gap-3">
              <button type="button" className="btn btn-primary w-full" onClick={() => setPanel({ type: "news", item: null })}>
                {t("newUpdate")}
              </button>
              <button type="button" className="btn btn-line w-full" onClick={() => setPanel({ type: "member", item: null })}>
                {t("newMember")}
              </button>
            </div>
          ) : null}

          {panel.type === "news" ? (
            <Editor action={saveUpdate} onDone={saved}>
              {panel.item ? <input type="hidden" name="id" value={panel.item.id} /> : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="field">
                  {t("titleAr")}
                  <input name="title_ar" defaultValue={panel.item?.title_ar} autoComplete="off" required />
                </label>
                <label className="field">
                  {t("titleEn")}
                  <input name="title_en" defaultValue={panel.item?.title_en} autoComplete="off" required />
                </label>
              </div>
              <label className="field">
                {t("bodyAr")}
                <textarea name="body_ar" rows={4} defaultValue={panel.item?.body_ar} autoComplete="off" required />
              </label>
              <label className="field">
                {t("bodyEn")}
                <textarea name="body_en" rows={4} defaultValue={panel.item?.body_en} autoComplete="off" required />
              </label>
              <Published checked={panel.item?.published} />
            </Editor>
          ) : null}

          {panel.type === "link" ? (
            <Editor action={saveLink} onDone={saved}>
              <input type="hidden" name="key" value={panel.item.key} />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="field">
                  {t("labelAr")}
                  <input name="label_ar" defaultValue={panel.item.label_ar} autoComplete="off" required />
                </label>
                <label className="field">
                  {t("labelEn")}
                  <input name="label_en" defaultValue={panel.item.label_en} autoComplete="off" required />
                </label>
              </div>
              <label className="field">
                {t("url")}
                <input name="url" dir="ltr" defaultValue={panel.item.url} autoComplete="off" required />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="field">
                  {t("noteAr")}
                  <input name="note_ar" defaultValue={panel.item.note_ar} autoComplete="off" />
                </label>
                <label className="field">
                  {t("noteEn")}
                  <input name="note_en" defaultValue={panel.item.note_en} autoComplete="off" />
                </label>
              </div>
              <a className="font-bold text-gold-deep" href={panel.item.url} target="_blank" rel="noreferrer">
                {t("openLink")}
              </a>
            </Editor>
          ) : null}

          {panel.type === "message" ? (
            <div className="mt-4 grid gap-3">
              <p className="text-sm text-muted">
                {when(locale, panel.item.created_at)} · {panel.item.locale === "en" ? "English" : "العربية"}
              </p>
              {panel.item.email ? (
                <a dir="ltr" href={`mailto:${panel.item.email}`}>{panel.item.email}</a>
              ) : null}
              <p className="whitespace-pre-line leading-8">{panel.item.body}</p>
              <RemoveButton id={panel.item.id} action={deleteMessage} onDone={close} />
            </div>
          ) : null}

          {panel.type === "member" ? (
            <Editor action={saveMember} onDone={saved}>
              {panel.item ? <input type="hidden" name="id" value={panel.item.id} /> : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="field">
                  {t("name")}
                  <input name="name" defaultValue={panel.item?.name} autoComplete="off" required />
                </label>
                <label className="field">
                  {t("sort")}
                  <input
                    name="sort_order"
                    type="number"
                    min={0}
                    max={999}
                    defaultValue={panel.item?.sort_order ?? data.members.length + 1}
                  />
                </label>
                <label className="field">
                  {t("roleAr")}
                  <input name="role_ar" defaultValue={panel.item?.role_ar} autoComplete="off" required />
                </label>
                <label className="field">
                  {t("roleEn")}
                  <input name="role_en" defaultValue={panel.item?.role_en} autoComplete="off" required />
                </label>
              </div>
              <label className="field">
                {t("noteAr")}
                <textarea name="note_ar" rows={2} defaultValue={panel.item?.note_ar} autoComplete="off" />
              </label>
              <label className="field">
                {t("noteEn")}
                <textarea name="note_en" rows={2} defaultValue={panel.item?.note_en} autoComplete="off" />
              </label>
              <Published checked={panel.item?.published} />
            </Editor>
          ) : null}
        </Sheet>
      ) : null}
    </div>
  );
}
