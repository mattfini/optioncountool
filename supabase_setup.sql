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

-- Single-row table holding the current product data uploaded via Excel
create table if not exists public.product_data (
  id int primary key default 1,
  uploaded_at timestamptz not null default now(),
  stores jsonb,
  variants jsonb,
  constraint single_row check (id = 1)
);

alter table public.product_data enable row level security;

create policy "anon_select" on public.product_data
  for select to anon using (true);

create policy "anon_insert" on public.product_data
  for insert to anon with check (true);

create policy "anon_update" on public.product_data
  for update to anon using (true);
