-- RCCGSC Food Pantry database schema
-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  family_size integer not null check (family_size > 0 and family_size <= 30),
  distribution_date text,
  status text not null default 'registered' check (status in ('registered','attended','cancelled'))
);

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  registration_id uuid references public.registrations(id) on delete set null,
  experience text not null,
  rating integer not null check (rating between 1 and 5),
  preferences text[] not null default '{}',
  comments text
);

alter table public.registrations enable row level security;
alter table public.surveys enable row level security;

-- Public users may submit registrations and feedback, but cannot read them.
drop policy if exists "public can register" on public.registrations;
create policy "public can register" on public.registrations for insert to anon with check (true);

drop policy if exists "public can submit survey" on public.surveys;
create policy "public can submit survey" on public.surveys for insert to anon with check (true);

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

-- Optional reporting views for Supabase SQL / future analytics.
create or replace view public.pantry_summary as
select count(*)::int as registrations, coalesce(sum(family_size),0)::int as family_members
from public.registrations where status <> 'cancelled';
