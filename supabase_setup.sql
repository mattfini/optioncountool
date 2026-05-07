-- Run this in the Supabase SQL Editor for project: uiurkbkltisrfmuzqjzh.supabase.co

create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  submitted_at timestamptz not null default now(),
  week_commencing text,
  submitted_by text,
  lines jsonb
);

alter table public.submissions enable row level security;

create policy "anon_select" on public.submissions
  for select to anon using (true);

create policy "anon_insert" on public.submissions
  for insert to anon with check (true);

create policy "anon_delete" on public.submissions
  for delete to anon using (true);
