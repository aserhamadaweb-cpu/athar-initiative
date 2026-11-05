"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { completeOrgTask } from "@/app/actions/members";
import { useRouter } from "@/i18n/navigation";
import { LateMark } from "@/components/teams/LateMark";
import { NoticeIcon } from "@/components/teams/NoticeIcon";
import { localToday, taskIsLate, type OrgStatus, type OrgTeam } from "@/lib/org";

function day(locale: string, value: string) {
  const [year, month, date] = value.split("-").map(Number);
  if (!year || !month || !date) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", { dateStyle: "medium" }).format(
    new Date(year, month - 1, date),
  );
}

export function TeamsBoard({ teams }: { teams: OrgTeam[] }) {
  const t = useTranslations("org");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [teamId, setTeamId] = useState("all");
  const [today, setToday] = useState("");
  const needle = query.trim().toLowerCase();

  useEffect(() => {
    setToday(localToday());
  }, []);

  const visible = useMemo(() => {
    return teams
      .filter((team) => teamId === "all" || team.id === teamId)
      .map((team) => {
        if (!needle) return team;
        const members = team.members
          .map((member) => {
            const person = `${member.name} ${member.role} ${member.notice}`.toLowerCase();
            if (person.includes(needle)) return member;
            const tasks = member.tasks.filter((task) => task.title.toLowerCase().includes(needle));
            return tasks.length > 0 ? { ...member, tasks } : null;
          })
          .filter((member) => member !== null);
        return { ...team, members };
      })
      .filter((team) => (needle ? team.members.length > 0 : true));
  }, [needle, teamId, teams]);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <label className="field">
          {t("search")}
          <input value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
        </label>
        <p className="text-sm font-bold text-muted">{t("checkHint")}</p>
        <div className="admin-filters" aria-label={t("all")}>
          <button type="button" className="admin-chip" data-active={teamId === "all"} onClick={() => setTeamId("all")}>
            {t("all")}
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              className="admin-chip"
              data-active={teamId === team.id}
              onClick={() => setTeamId(team.id)}
            >
              {locale === "en" ? team.name_en : team.name_ar}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? <p className="text-muted">{t("noMatch")}</p> : null}

      {visible.map((team) => {
        const tasks = team.members.flatMap((member) => member.tasks);
        const done = tasks.filter((task) => task.status === "completed").length;
        const late = tasks.filter((task) => taskIsLate(task.deadline, task.status, today)).length;
        const width = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
        return (
          <section key={team.id} className="panel p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-extrabold">{locale === "en" ? team.name_en : team.name_ar}</h2>
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
                <span>{tasks.length === 0 ? t("noTasks") : t("progress", { done, total: tasks.length })}</span>
                {late > 0 ? <LateMark count={late} /> : null}
              </p>
            </div>
            <div className="org-progress mt-3" aria-hidden="true">
              <span style={{ width: `${width}%` }} />
            </div>

            {team.members.length === 0 ? <p className="mt-4 text-muted">{t("emptyTeam")}</p> : null}

            {team.members.length > 0 ? (
              <div className="org-table mt-4">
                <div className="org-head">
                  <span>{t("member")}</span>
                  <span>{t("role")}</span>
                  <span>{t("task")}</span>
                  <span>{t("status")}</span>
                  <span>{t("deadline")}</span>
                </div>
                {team.members.map((member) => {
                  const rows = member.tasks.length > 0 ? member.tasks : [null];
                  return rows.map((task, index) => {
                    const lateTask = task ? taskIsLate(task.deadline, task.status, today) : false;
                    return (
                    <div className={lateTask ? "org-line org-line-late" : "org-line"} key={task?.id ?? member.id}>
                      <div className={index === 0 ? undefined : "hidden md:block"}>
                        <span className="org-label">{t("member")}</span>
                        <p className="font-extrabold">{index === 0 ? member.name : ""}</p>
                        {index === 0 && member.notice_kind ? <MemberMark kind={member.notice_kind} note={member.notice} /> : null}
                      </div>
                      <div className={index === 0 ? undefined : "hidden md:block"}>
                        <span className="org-label">{t("role")}</span>
                        <p>{index === 0 ? member.role || t("none") : ""}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        {task ? <TaskCheck id={task.id} done={task.status === "completed"} /> : null}
                        <div>
                          <span className="org-label">{t("task")}</span>
                          <p className={task?.status === "completed" ? "org-task-done" : undefined}>
                            {task ? task.title : t("none")}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="org-label">{t("status")}</span>
                        {task ? <Status value={task.status} label={t(task.status)} /> : <p>{t("none")}</p>}
                      </div>
                      <div>
                        <span className="org-label">{t("deadline")}</span>
                        <p>
                          {task?.deadline ? day(locale, task.deadline) : t("none")}
                          {lateTask ? <LateMark /> : null}
                        </p>
                      </div>
                    </div>
                    );
                  });
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function MemberMark({ kind, note }: { kind: "warning" | "promotion"; note: string }) {
  const t = useTranslations("org");
  return (
    <p className={`org-mark org-mark-${kind}`}>
      <NoticeIcon kind={kind} />
      {t(kind)}
      {note ? <span>{note}</span> : null}
    </p>
  );
}

function Status({ value, label }: { value: OrgStatus; label: string }) {
  return <span className={`org-status org-status-${value}`}>{label}</span>;
}

function TaskCheck({ id, done }: { id: string; done: boolean }) {
  const t = useTranslations("org");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className="org-check"
      aria-pressed={done}
      aria-label={done ? t("completed") : t("markDone")}
      disabled={pending}
      onClick={() => {
        start(async () => {
          await completeOrgTask(id, !done);
          router.refresh();
        });
      }}
    >
      <span aria-hidden="true">{done ? "✓" : ""}</span>
      <span>{done ? t("completed") : t("doneWord")}</span>
    </button>
  );
}
