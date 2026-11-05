export type OrgStatus = "assigned" | "in_progress" | "completed";
export type OrgNotice = "warning" | "promotion";

export type OrgTask = {
  id: string;
  title: string;
  status: OrgStatus;
  deadline: string | null;
  sort_order: number;
};

export type OrgMember = {
  id: string;
  name: string;
  role: string;
  sort_order: number;
  notice_kind: OrgNotice | null;
  notice: string;
  tasks: OrgTask[];
};

export type OrgTeam = {
  id: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  members: OrgMember[];
};

type RawTask = {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  sort_order: number;
};

type RawMember = {
  id: string;
  name: string;
  role: string;
  sort_order: number;
  notice_kind: string | null;
  notice: string | null;
  org_tasks: RawTask[] | null;
};

type RawTeam = {
  id: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  org_members: RawMember[] | null;
};

export function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${date}`;
}

export function taskIsLate(deadline: string | null, status: OrgStatus, today: string) {
  if (!today || !deadline || status === "completed") return false;
  return deadline < today;
}

function statusOf(value: string): OrgStatus {
  if (value === "in_progress" || value === "completed") return value;
  return "assigned";
}

function noticeOf(value: string | null): OrgNotice | null {
  if (value === "warning" || value === "promotion") return value;
  return null;
}

function byOrder<T extends { sort_order: number }>(rows: T[]) {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

export function shapeOrg(rows: RawTeam[] | null): OrgTeam[] {
  return byOrder(rows ?? []).map((team) => ({
    id: team.id,
    name_ar: team.name_ar,
    name_en: team.name_en,
    sort_order: team.sort_order,
    members: byOrder(team.org_members ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      sort_order: member.sort_order,
      notice_kind: noticeOf(member.notice_kind),
      notice: member.notice?.trim() ?? "",
      tasks: byOrder(member.org_tasks ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        status: statusOf(task.status),
        deadline: task.deadline,
        sort_order: task.sort_order,
      })),
    })),
  }));
}

export const orgSelect = `
  id, name_ar, name_en, sort_order,
  org_members (
    id, name, role, sort_order, notice_kind, notice,
    org_tasks ( id, title, status, deadline, sort_order )
  )
`;
