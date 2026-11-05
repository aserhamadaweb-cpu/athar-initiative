create table public.updates (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  body_ar text not null,
  body_en text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  body text not null,
  locale text not null,
  created_at timestamptz not null default now(),
  constraint messages_name_len check (char_length(name) between 2 and 80),
  constraint messages_body_len check (char_length(body) between 5 and 2000),
  constraint messages_email_len check (email is null or char_length(email) between 3 and 160),
  constraint messages_locale_chk check (locale in ('ar', 'en'))
);

create table public.best_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_ar text not null,
  role_en text not null,
  note_ar text not null default '',
  note_en text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.updates enable row level security;
alter table public.messages enable row level security;
alter table public.best_members enable row level security;

create policy "published updates are public"
on public.updates for select to anon, authenticated
using (published = true);

create policy "published members are public"
on public.best_members for select to anon, authenticated
using (published = true);

create policy "visitors can leave a message"
on public.messages for insert to anon, authenticated
with check (
  char_length(name) between 2 and 80
  and char_length(body) between 5 and 2000
  and locale in ('ar', 'en')
  and (email is null or char_length(email) between 3 and 160)
);

-- Editable links, forms, and team names. The full grants,
-- admin policies, and private password gate are in admin_controls.sql.
create table public.site_links (
  key text primary key,
  group_name text not null,
  label_ar text not null,
  label_en text not null,
  url text not null,
  note_ar text not null default '',
  note_en text not null default '',
  sort_order integer not null default 0
);

create table public.site_people (
  id uuid primary key default gen_random_uuid(),
  role_ar text not null,
  role_en text not null,
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  published boolean not null default true
);
