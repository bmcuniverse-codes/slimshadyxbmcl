-- RCCGSC Food Pantry database schema
-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text,
  phone text not null,
  email text,
  family_size integer not null check (family_size > 0 and family_size <= 30),
  distribution_date text,
  food_options text[] not null default '{}',
  archived_at timestamptz,
  status text not null default 'registered' check (status in ('registered','attended','cancelled'))
);

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  registration_id uuid references public.registrations(id) on delete set null,
  experience text not null,
  rating integer not null check (rating between 1 and 5),
  preferences text[] not null default '{}',
  comments text,
  archived_at timestamptz
);

-- Safe migration for installations created with the previous schema.
alter table public.registrations alter column last_name drop not null;
alter table public.registrations add column if not exists food_options text[] not null default '{}';
alter table public.registrations add column if not exists archived_at timestamptz;
alter table public.surveys add column if not exists archived_at timestamptz;

create table if not exists public.distribution_dates (
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  slot integer not null check (slot in (1,2)),
  date date not null,
  time text not null default '10:00 AM – 1:00 PM',
  primary key (month,slot),
  unique(date),
  check (to_char(date,'YYYY-MM')=month),
  check (extract(dow from date)=6)
);
alter table public.distribution_dates enable row level security;
drop policy if exists "everyone can see dates" on public.distribution_dates;
create policy "everyone can see dates" on public.distribution_dates for select to anon,authenticated using (true);
drop policy if exists "admins can set dates" on public.distribution_dates;
create policy "admins can set dates" on public.distribution_dates for all to authenticated using (true) with check (true);

create or replace function public.pantry_date(p_month text,p_slot integer) returns date
language plpgsql stable set search_path = public as $$
declare first_saturday date; chosen date;
begin
  select date into chosen from public.distribution_dates where month=p_month and slot=p_slot;
  if chosen is not null then return chosen; end if;
  first_saturday:=to_date(p_month||'-01','YYYY-MM-DD');
  first_saturday:=first_saturday+((6-extract(dow from first_saturday)::integer+7)%7);
  return first_saturday+case when p_slot=2 then 14 else 0 end;
end $$;

create or replace function public.validate_pantry_registration() returns trigger
language plpgsql set search_path = public as $$
declare chosen date; first_day date; month_key text; local_day date;
begin
  chosen:=new.distribution_date::date;
  month_key:=to_char(chosen,'YYYY-MM');
  local_day:=(now() at time zone 'Africa/Lagos')::date;
  first_day:=public.pantry_date(month_key,1);
  if chosen<local_day or (chosen<>first_day and chosen<>public.pantry_date(month_key,2))
     or (chosen=public.pantry_date(month_key,2) and local_day<=first_day) then
    raise exception 'This distribution date is not available';
  end if;
  return new;
end $$;
drop trigger if exists validate_pantry_registration on public.registrations;
create trigger validate_pantry_registration before insert on public.registrations
for each row execute function public.validate_pantry_registration();

alter table public.registrations enable row level security;
alter table public.surveys enable row level security;

-- Public users may submit registrations and feedback, but cannot read them.
drop policy if exists "public can register" on public.registrations;
create policy "public can register" on public.registrations for insert to anon, authenticated with check (true);

drop policy if exists "public can submit survey" on public.surveys;
create policy "public can submit survey" on public.surveys for insert to anon, authenticated with check (true);

-- Signed-in admins can read and manage records. In production, restrict this to a dedicated admin role/profile if multiple user types are introduced.
drop policy if exists "authenticated can read registrations" on public.registrations;
create policy "authenticated can read registrations" on public.registrations for select to authenticated using (true);
drop policy if exists "authenticated can update registrations" on public.registrations;
create policy "authenticated can update registrations" on public.registrations for update to authenticated using (true) with check (true);
drop policy if exists "authenticated can delete registrations" on public.registrations;
create policy "authenticated can delete registrations" on public.registrations for delete to authenticated using (true);

drop policy if exists "authenticated can read surveys" on public.surveys;
create policy "authenticated can read surveys" on public.surveys for select to authenticated using (true);
drop policy if exists "authenticated can update surveys" on public.surveys;
create policy "authenticated can update surveys" on public.surveys for update to authenticated using (true) with check (true);
drop policy if exists "authenticated can delete surveys" on public.surveys;
create policy "authenticated can delete surveys" on public.surveys for delete to authenticated using (true);

-- Archived rows remain in the tables for historical analytics, but leave active totals.
create or replace function public.archive_pantry_now() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.role()<>'authenticated' then raise exception 'Admin sign-in required'; end if;
  update public.registrations set archived_at=now() where archived_at is null;
  update public.surveys set archived_at=now() where archived_at is null;
end $$;
revoke all on function public.archive_pantry_now() from public,anon;
grant execute on function public.archive_pantry_now() to authenticated;

create or replace function public.archive_due_cycles() returns void
language plpgsql security definer set search_path = public as $$
declare local_now timestamp := now() at time zone 'Africa/Lagos';
begin
  update public.registrations r set archived_at=now()
  where r.archived_at is null and r.distribution_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    and local_now >= public.pantry_date(left(r.distribution_date,7),2)::timestamp + interval '1 day 23 hours 59 minutes';
  update public.surveys s set archived_at=now()
  where s.archived_at is null and (
    (s.registration_id is not null and exists (select 1 from public.registrations r where r.id=s.registration_id and r.archived_at is not null))
    or (s.registration_id is null and local_now >= public.pantry_date(to_char(s.created_at at time zone 'Africa/Lagos','YYYY-MM'),2)::timestamp + interval '1 day 23 hours 59 minutes')
  );
end $$;
revoke all on function public.archive_due_cycles() from public,anon,authenticated;

-- Enable Supabase Cron in Database > Extensions before running this script.
-- 22:59 UTC is 23:59 Africa/Lagos. The function itself checks whether the
-- Sunday after the third distribution date has passed (including overrides).
create extension if not exists pg_cron with schema extensions;
select cron.schedule('pantry-archive', '59 22 * * *', 'select public.archive_due_cycles()');

-- Optional reporting views for Supabase SQL / future analytics.
create or replace view public.pantry_summary as
select count(*)::int as registrations, coalesce(sum(family_size),0)::int as family_members
from public.registrations where status <> 'cancelled' and archived_at is null;
revoke all on public.pantry_summary from anon;
