create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table private.gate (
  id integer primary key check (id = 1),
  token text not null check (char_length(token) >= 32)
);

alter table private.gate enable row level security;
revoke all on table private.gate from anon, authenticated, public;

create policy "no api access"
on private.gate
for all
to anon, authenticated
using (false)
with check (false);

create or replace function private.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  raw text;
  headers json;
  presented text;
begin
  presented := coalesce(pg_catalog.current_setting('request.header.x-athar-admin', true), '');
  if presented = '' then
    raw := pg_catalog.current_setting('request.headers', true);
    if raw is not null and raw <> '' then
      begin
        headers := raw::json;
        presented := coalesce(headers ->> 'x-athar-admin', '');
      exception when others then
        presented := '';
      end;
    end if;
  end if;

  if presented = '' then
    return false;
  end if;

  return exists (
    select 1
    from private.gate
    where id = 1
      and token = presented
  );
end;
$fn$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create table public.site_links (
  key text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  group_name text not null check (group_name in ('social', 'form', 'community')),
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

alter table public.site_links enable row level security;
alter table public.site_people enable row level security;

create policy "public read links"
on public.site_links for select
to anon, authenticated
using (true);

create policy "admin update links"
on public.site_links for update
to anon, authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "published people are public"
on public.site_people for select
to anon, authenticated
using (published = true);

create policy "admin read people"
on public.site_people for select
to anon, authenticated
using (private.is_admin());

create policy "admin insert people"
on public.site_people for insert
to anon, authenticated
with check (private.is_admin());

create policy "admin update people"
on public.site_people for update
to anon, authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admin delete people"
on public.site_people for delete
to anon, authenticated
using (private.is_admin());

create policy "admin read updates"
on public.updates for select
to anon, authenticated
using (private.is_admin());

create policy "admin insert updates"
on public.updates for insert
to anon, authenticated
with check (private.is_admin());

create policy "admin update updates"
on public.updates for update
to anon, authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admin delete updates"
on public.updates for delete
to anon, authenticated
using (private.is_admin());

create policy "admin read messages"
on public.messages for select
to anon, authenticated
using (private.is_admin());

create policy "admin delete messages"
on public.messages for delete
to anon, authenticated
using (private.is_admin());

create policy "admin read members"
on public.best_members for select
to anon, authenticated
using (private.is_admin());

create policy "admin insert members"
on public.best_members for insert
to anon, authenticated
with check (private.is_admin());

create policy "admin update members"
on public.best_members for update
to anon, authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admin delete members"
on public.best_members for delete
to anon, authenticated
using (private.is_admin());

grant select, update on public.site_links to anon, authenticated;
grant select, insert, update, delete on public.site_people to anon, authenticated;
grant insert, update, delete on public.updates to anon, authenticated;
grant select, delete on public.messages to anon, authenticated;
grant insert, update, delete on public.best_members to anon, authenticated;

insert into public.site_links (key, group_name, label_ar, label_en, url, note_ar, note_en, sort_order) values
('form_organizer', 'form', 'فريق التنظيم', 'Organizer team', 'https://www.jotform.com/262558313687063', 'المتاح حاليًا: العلاقات العامة فقط', 'Open now: PR only', 1),
('form_leaders', 'form', 'فورم الليدرز', 'Leaders form', 'https://docs.google.com/forms/d/e/1FAIpQLSf18CITON5Dhny5fLXz-YKQkCdPeiWd9hsBQ5D1yWtRiAneGw/viewform?usp=dialog', 'متاح: دروس تقوية ومساعدة ذوي الاحتياجات وSTEM', 'Open: tutoring, disability support, and STEM', 2),
('form_offline', 'form', 'تطوع أوفلاين', 'Offline volunteers', 'https://docs.google.com/forms/d/e/1FAIpQLSdrLxAtNz42ks17cbQvcGNPumV_Hnj87NHLqc3BLFmLn_BRvA/viewform?usp=sharing', 'التطوع والخدمة المجتمعية على أرض الواقع', 'Community service on the ground', 3),
('form_online', 'form', 'تطوع أونلاين', 'Online volunteers', 'https://docs.google.com/forms/d/e/1FAIpQLSdiS8U50dhVOXPWO8BrTeHOwvw0q_E1mdFLJ0Iz5-LoYq0prA/viewform?usp=sharing', 'التعليم والمهارات واللغات والدعم الأكاديمي', 'Education, skills, languages, and academic support', 4),
('whatsapp_channel', 'social', 'واتساب', 'WhatsApp', 'https://whatsapp.com/channel/0029Vb9rVWTIHphEB6D5sq0q', '', '', 10),
('instagram', 'social', 'إنستغرام', 'Instagram', 'https://www.instagram.com/atharinitiative26', '', '', 11),
('tiktok', 'social', 'تيك توك', 'TikTok', 'https://www.tiktok.com/@moazmessi102012', '', '', 12),
('facebook', 'social', 'فيسبوك', 'Facebook', 'https://www.facebook.com/share/1coLCvkNqM/', '', '', 13),
('governorates', 'community', 'جروبات المحافظات', 'Governorate groups', 'https://chat.whatsapp.com/GJfpknKPHeT6wTwPgZGZeW', '', '', 20);

insert into public.site_people (role_ar, role_en, name_ar, name_en, sort_order, published) values
('مؤسس مبادرة أثر', 'Founder', 'مازن محمد مختار', 'Mazin Mohammed Mokhtar', 1, true),
('مساعد المؤسس', 'Founder assistant', 'حنين عبدالغني', 'Haneen Abdelghani', 2, true),
('رئيس الفريق في مصر', 'Egypt president', 'جنى محمد', 'Jana Mohammed', 3, true),
('رئيس التطوع الأونلاين', 'Online volunteering president', 'معاذ أيمن', 'Mouaz Ayman', 4, true),
('مدير الموارد البشرية', 'HR manager', 'فارس وائل', 'Fares Wael', 5, true),
('فريق الموارد البشرية', 'HR team', 'جنى كمال · مريم صموئيل', 'Jana Kamal · Mariam Samweel', 6, true),
('التسويق', 'Marketing', 'معاذ محمد · حور', 'Moaz Mohammed · Hoor', 7, true),
('الميديا والمحتوى', 'Media and content', 'زياد مصطفى · مريم', 'Zyad Mustafa · Mariam', 8, true),
('العلاقات العامة', 'Public relations', 'هنا ياسر', 'Hana Yasser', 9, true);
