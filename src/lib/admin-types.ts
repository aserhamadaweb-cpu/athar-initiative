import type { OrgTeam } from "@/lib/org";

export type AdminResult = {
  status: "idle" | "ok" | "error";
  code?: "auth" | "validation" | "save" | "bad" | "limited";
  id?: string;
};

export type AdminUpdate = {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  published: boolean;
  created_at: string;
};

export type AdminLink = {
  key: string;
  group_name: string;
  label_ar: string;
  label_en: string;
  url: string;
  note_ar: string;
  note_en: string;
  sort_order: number;
};

export type AdminMessage = {
  id: string;
  name: string;
  email: string | null;
  body: string;
  locale: string;
  created_at: string;
};

export type AdminMember = {
  id: string;
  name: string;
  role_ar: string;
  role_en: string;
  note_ar: string;
  note_en: string;
  sort_order: number;
  published: boolean;
};

export type AdminSnapshot = {
  updates: AdminUpdate[];
  links: AdminLink[];
  messages: AdminMessage[];
  messageCount: number;
  members: AdminMember[];
  org: OrgTeam[];
  error: boolean;
};
