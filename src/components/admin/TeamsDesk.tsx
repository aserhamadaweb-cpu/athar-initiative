"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  deleteOrgMember,
  deleteOrgTask,
  deleteOrgTeam,
  logout,
  saveOrgMember,
  saveOrgTask,
  saveOrgTeam,
  setOrgNotice,
} from "@/app/actions/admin";
import { LateMark } from "@/components/teams/LateMark";
import { NoticeIcon } from "@/components/teams/NoticeIcon";
import { Link, useRouter } from "@/i18n/navigation";
import type { AdminResult } from "@/lib/admin-types";
import { localToday, taskIsLate, type OrgMember, type OrgNotice, type OrgStatus, type OrgTask, type OrgTeam } from "@/lib/org";

const initial: AdminResult = { status: "idle" };

function fieldSnapshot(form: HTMLFormElement) {
  return [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[name], select[name], textarea[name]")]
    .filter((field) => !field.name.startsWith("$"))
    .map((field) => `${field.name}=${field.value}`)
    .join("\n");
}

function QuietForm({
  action,
  onDone,
  className,
  stored = false,
  children,
}: {
  action: (prev: AdminResult, formData: FormData) => Promise<AdminResult>;
  onDone?: (id?: string) => void;
  className?: string;
  stored?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const baseline = useRef("");
  const handled = useRef(initial);
  const [saved, setSaved] = useState(stored);
  const [state, run, pending] = useActionState(action, initial);

  useLayoutEffect(() => {
    if (formRef.current) baseline.current = fieldSnapshot(formRef.current);
  }, []);

  useEffect(() => {
    if (state.status !== "ok" || handled.current === state) return;
    handled.current = state;
    if (formRef.current) baseline.current = fieldSnapshot(formRef.current);
    setSaved(true);
    onDone?.(state.id);
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
    <form
      ref={formRef}
      action={run}
      className={className}
      onInput={(event) => {
        const form = event.currentTarget;
        setSaved(stored && fieldSnapshot(form) === baseline.current);
      }}
    >
      {children}
      {message ? <p role="alert" className="font-bold">{message}</p> : null}
      <button className="btn btn-primary md:justify-self-start" disabled={pending} aria-live="polite">
        {pending ? t("working") : saved ? t("savedNow") : t("save")}
      </button>
    </form>
  );
}

function Remove({
  id,
  action,
  label,
  confirmText,
}: {
  id: string;
  action: (id: string) => Promise<AdminResult>;
  label?: string;
  confirmText?: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      <button
        type="button"
        className="btn org-delete"
        disabled={pending}
        onClick={() => {
          if (!confirm(confirmText ?? t("confirmDelete"))) return;
          start(async () => {
            const result = await action(id);
            if (result.status === "ok") {
              router.refresh();
              return;
            }
            setMessage(result.code === "auth" ? t("errorAuth") : t("errorSave"));
          });
        }}
      >
        {pending ? t("working") : label ?? t("delete")}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </div>
  );
}

function StatusSelect({ value }: { value?: OrgStatus }) {
  const t = useTranslations("admin");
  const org = useTranslations("org");
  return (
    <label className="field">
      {t("taskStatus")}
      <select name="status" defaultValue={value ?? "assigned"}>
        <option value="assigned">{org("assigned")}</option>
        <option value="in_progress">{org("in_progress")}</option>
        <option value="completed">{org("completed")}</option>
      </select>
    </label>
  );
}

export function TeamsDesk({ teams, error }: { teams: OrgTeam[]; error?: boolean }) {
  const t = useTranslations("admin");
  const org = useTranslations("org");
  const locale = useLocale();
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [freshMember, setFreshMember] = useState(0);
  const [freshTask, setFreshTask] = useState<Record<string, number>>({});
  const [today, setToday] = useState("");
  const team = teams.find((item) => item.id === teamId) ?? teams[0] ?? null;
  const teamLate = team?.members.flatMap((member) => member.tasks).filter((task) => taskIsLate(task.deadline, task.status, today)).length ?? 0;

  useEffect(() => {
    setToday(localToday());
  }, []);

  useEffect(() => {
    if (teamId && teams.some((item) => item.id === teamId)) return;
    setTeamId(teams[0]?.id ?? "");
  }, [teamId, teams]);

  return (
    <div className="pb-16">
      <header className="shell pb-2 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">ATHAR</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">{t("teamsDesk")}</h1>
            <p className="mt-3 max-w-2xl text-muted">{t("teamsDeskLead")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-line" href="/admin">{t("backDesk")}</Link>
            <form action={logout}>
              <button className="btn btn-line">{t("logout")}</button>
            </form>
          </div>
        </div>
      </header>

      <div className="shell pt-6">
        {error ? <p className="panel mb-4 p-4 font-bold">{t("loadError")}</p> : null}
        <div className="org-desk">
          <aside className="grid content-start gap-3">
            <QuietForm
              action={saveOrgTeam}
              className="panel grid gap-3 p-4"
              onDone={(id) => {
                if (id) setTeamId(id);
              }}
            >
              <p className="font-extrabold">{t("newTeam")}</p>
              <label className="field">
                {t("teamNameAr")}
                <input name="name_ar" autoComplete="off" required />
              </label>
              <label className="field">
                {t("teamNameEn")}
                <input name="name_en" autoComplete="off" required />
              </label>
              <input type="hidden" name="sort_order" value={teams.length + 1} />
            </QuietForm>
            <div className="panel grid gap-2 p-3">
              {teams.map((item) => {
                const name = locale === "en" ? item.name_en : item.name_ar;
                const late = item.members.flatMap((member) => member.tasks).filter((task) => taskIsLate(task.deadline, task.status, today)).length;
                return (
                  <div key={item.id} className="org-team-row">
                    <button
                      type="button"
                      className="admin-chip org-team-pick"
                      data-active={team?.id === item.id}
                      onClick={() => setTeamId(item.id)}
                    >
                      <span>{name}</span>
                      <span className="flex items-center gap-1">
                        {late > 0 ? <LateMark count={late} /> : null}
                        <span>{item.members.length}</span>
                      </span>
                    </button>
                    <Remove
                      id={item.id}
                      action={deleteOrgTeam}
                      label={t("delete")}
                      confirmText={t("confirmTeam", { name })}
                    />
                  </div>
                );
              })}
              {teams.length === 0 ? <p className="text-sm text-muted">{t("noTeamYet")}</p> : null}
            </div>
          </aside>

          {team ? (
            <section className="grid gap-4">
              <div className="panel p-4 sm:p-5" key={team.id}>
                <h2 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold">
                  <span>{locale === "en" ? team.name_en : team.name_ar}</span>
                  {teamLate > 0 ? <LateMark count={teamLate} /> : null}
                </h2>
                <QuietForm action={saveOrgTeam} stored className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <input type="hidden" name="id" value={team.id} />
                  <input type="hidden" name="sort_order" value={team.sort_order} />
                  <label className="field">
                    {t("teamNameAr")}
                    <input name="name_ar" defaultValue={team.name_ar} autoComplete="off" required />
                  </label>
                  <label className="field">
                    {t("teamNameEn")}
                    <input name="name_en" defaultValue={team.name_en} autoComplete="off" required />
                  </label>
                </QuietForm>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">{t("deleteTeamNote")}</p>
                  <Remove
                    id={team.id}
                    action={deleteOrgTeam}
                    label={t("deleteTeam")}
                    confirmText={t("confirmTeam", { name: locale === "en" ? team.name_en : team.name_ar })}
                  />
                </div>
              </div>

              {team.members.length === 0 ? <p className="text-muted">{org("emptyTeam")}</p> : null}

              {team.members.map((member) => (
                <MemberCard
                  key={member.id}
                  teamId={team.id}
                  member={member}
                  today={today}
                  taskKey={freshTask[member.id] ?? 0}
                  onTaskAdded={() => setFreshTask((current) => ({ ...current, [member.id]: (current[member.id] ?? 0) + 1 }))}
                />
              ))}

              <QuietForm
                key={`${team.id}-${freshMember}`}
                action={saveOrgMember}
                className="panel grid gap-3 p-4 sm:p-5 md:grid-cols-[1fr_1fr_auto] md:items-end"
                onDone={() => setFreshMember((value) => value + 1)}
              >
                <p className="font-extrabold md:col-span-3">{t("addMemberHere")}</p>
                <input type="hidden" name="team_id" value={team.id} />
                <input type="hidden" name="sort_order" value={(team.members.at(-1)?.sort_order ?? 0) + 1} />
                <label className="field">
                  {t("name")}
                  <input name="name" autoComplete="off" required />
                </label>
                <label className="field">
                  {org("role")}
                  <input name="role" autoComplete="off" />
                </label>
              </QuietForm>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MemberCard({
  teamId,
  member,
  today,
  taskKey,
  onTaskAdded,
}: {
  teamId: string;
  member: OrgMember;
  today: string;
  taskKey: number;
  onTaskAdded: () => void;
}) {
  const t = useTranslations("admin");
  const org = useTranslations("org");

  return (
    <article className="panel p-4 sm:p-5">
      <QuietForm action={saveOrgMember} stored className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <input type="hidden" name="id" value={member.id} />
        <input type="hidden" name="team_id" value={teamId} />
        <input type="hidden" name="sort_order" value={member.sort_order} />
        <label className="field">
          {t("name")}
          <input name="name" defaultValue={member.name} autoComplete="off" required />
        </label>
        <label className="field">
          {org("role")}
          <input name="role" defaultValue={member.role} autoComplete="off" />
        </label>
        <Remove
          id={member.id}
          action={deleteOrgMember}
          label={t("deleteMember")}
          confirmText={t("confirmMember", { name: member.name })}
        />
      </QuietForm>

      <MemberNotice key={`${member.notice_kind ?? "none"}:${member.notice}`} member={member} />

      <div className="mt-4 grid gap-3">
        {member.tasks.map((task) => (
          <TaskRow key={task.id} task={task} memberId={member.id} today={today} />
        ))}
        <QuietForm
          key={taskKey}
          action={saveOrgTask}
          className="org-task-form"
          onDone={onTaskAdded}
        >
          <input type="hidden" name="member_id" value={member.id} />
          <input type="hidden" name="sort_order" value={(member.tasks.at(-1)?.sort_order ?? 0) + 1} />
          <label className="field">
            {t("newTask")}
            <input name="title" autoComplete="off" required />
          </label>
          <StatusSelect />
          <label className="field">
            {t("deadline")}
            <input name="deadline" type="date" />
          </label>
        </QuietForm>
      </div>
    </article>
  );
}

function MemberNotice({ member }: { member: OrgMember }) {
  const t = useTranslations("admin");
  const org = useTranslations("org");
  const router = useRouter();
  const [note, setNote] = useState(member.notice);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  function apply(kind: OrgNotice | "") {
    if (kind === "warning" && !confirm(t("confirmWarning", { name: member.name }))) return;
    if (kind === "promotion" && !confirm(t("confirmPromotion", { name: member.name }))) return;
    start(async () => {
      const result = await setOrgNotice(member.id, kind, kind ? note : "");
      if (result.status === "ok") {
        setMessage("");
        router.refresh();
        return;
      }
      setMessage(result.code === "auth" ? t("errorAuth") : result.code === "validation" ? t("errorValidation") : t("errorSave"));
    });
  }

  return (
    <div className="org-notice-edit">
      {member.notice_kind ? (
        <p className={`org-mark org-mark-${member.notice_kind}`}>
          <NoticeIcon kind={member.notice_kind} />
          {org(member.notice_kind)}
          {member.notice ? <span>{member.notice}</span> : null}
        </p>
      ) : null}
      <label className="field">
        {t("noticeNote")}
        <input value={note} maxLength={160} autoComplete="off" onChange={(event) => setNote(event.target.value)} />
      </label>
      <button type="button" className="btn org-warn" disabled={pending} onClick={() => apply("warning")}>
        <NoticeIcon kind="warning" />
        {pending ? t("working") : t("giveWarning")}
      </button>
      <button type="button" className="btn org-promote" disabled={pending} onClick={() => apply("promotion")}>
        <NoticeIcon kind="promotion" />
        {pending ? t("working") : t("givePromotion")}
      </button>
      {member.notice_kind ? (
        <button type="button" className="btn btn-line" disabled={pending} onClick={() => apply("")}>
          {t("clearNotice")}
        </button>
      ) : null}
      {message ? <p role="alert" className="w-full font-bold">{message}</p> : null}
    </div>
  );
}

function TaskRow({ task, memberId, today }: { task: OrgTask; memberId: string; today: string }) {
  const t = useTranslations("admin");
  const late = taskIsLate(task.deadline, task.status, today);
  return (
    <div className={late ? "org-task-edit org-task-late" : "org-task-edit"}>
      <QuietForm action={saveOrgTask} stored className="org-task-form">
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="member_id" value={memberId} />
        <input type="hidden" name="sort_order" value={task.sort_order} />
        <label className="field">
          {t("taskTitle")}
          <input name="title" defaultValue={task.title} autoComplete="off" required />
        </label>
        <StatusSelect value={task.status} />
          <label className="field">
            <span className="flex flex-wrap items-center gap-2">
              {t("deadline")}
              {late ? <LateMark /> : null}
            </span>
            <input name="deadline" type="date" defaultValue={task.deadline ?? ""} />
          </label>
      </QuietForm>
      <Remove
        id={task.id}
        action={deleteOrgTask}
        label={t("deleteTask")}
        confirmText={t("confirmTask", { name: task.title })}
      />
    </div>
  );
}
