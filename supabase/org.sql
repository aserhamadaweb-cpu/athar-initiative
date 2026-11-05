-- Teams, members, and tasks. Public read. Writes require private.is_admin().
-- Applied to the ATHAR project as migration org_teams_members_tasks.

create table public.org_teams (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint org_teams_name_ar_len check (char_length(name_ar) between 2 and 80),
  constraint org_teams_name_en_len check (char_length(name_en) between 2 and 80),
  constraint org_teams_sort_chk check (sort_order between 0 and 999)
);

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.org_teams(id) on delete cascade,
  name text not null,
  role text not null default '',
  notice_kind text,
  notice text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint org_members_name_len check (char_length(name) between 2 and 80),
  constraint org_members_role_len check (char_length(role) <= 120),
  constraint org_members_notice_kind_chk check (notice_kind is null or notice_kind in ('warning', 'promotion')),
  constraint org_members_notice_len check (char_length(notice) <= 160),
  constraint org_members_sort_chk check (sort_order between 0 and 999)
);

create table public.org_tasks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.org_members(id) on delete cascade,
  title text not null,
  status text not null default 'assigned',
  deadline date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint org_tasks_title_len check (char_length(title) between 2 and 300),
  constraint org_tasks_status_chk check (status in ('assigned', 'in_progress', 'completed')),
  constraint org_tasks_sort_chk check (sort_order between 0 and 999)
);

create index org_members_team_idx on public.org_members (team_id, sort_order);
create index org_tasks_member_idx on public.org_tasks (member_id, sort_order);

alter table public.org_teams enable row level security;
alter table public.org_members enable row level security;
alter table public.org_tasks enable row level security;

create policy "public read org teams"
on public.org_teams for select to anon, authenticated
using (true);

create policy "admin insert org teams"
on public.org_teams for insert to anon, authenticated
with check (private.is_admin());

create policy "admin update org teams"
on public.org_teams for update to anon, authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admin delete org teams"
on public.org_teams for delete to anon, authenticated
using (private.is_admin());

create policy "public read org members"
on public.org_members for select to anon, authenticated
using (true);

create policy "admin insert org members"
on public.org_members for insert to anon, authenticated
with check (private.is_admin());

create policy "admin update org members"
on public.org_members for update to anon, authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admin delete org members"
on public.org_members for delete to anon, authenticated
using (private.is_admin());

create policy "public read org tasks"
on public.org_tasks for select to anon, authenticated
using (true);

create policy "admin insert org tasks"
on public.org_tasks for insert to anon, authenticated
with check (private.is_admin());

create policy "admin update org tasks"
on public.org_tasks for update to anon, authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admin delete org tasks"
on public.org_tasks for delete to anon, authenticated
using (private.is_admin());

grant select, insert, update, delete on public.org_teams to anon, authenticated;
grant select, insert, update, delete on public.org_members to anon, authenticated;
grant select, insert, update, delete on public.org_tasks to anon, authenticated;

insert into public.org_teams (name_ar, name_en, sort_order) values
('الموارد البشرية', 'HR', 1),
('التسويق والميديا', 'Marketing & Media', 2),
('التصميم', 'Designers', 3),
('البرمجة', 'Programmers', 4),
('البحث', 'Researchers', 5),
('التشغيل', 'Operators', 6),
('العلاقات العامة', 'PR', 7);
