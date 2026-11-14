-- FOXY initial schema — private per-user records, no public access.
-- Apply through Supabase migrations after connecting a Supabase project.
create table if not exists public.foxy_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('program','schedule','session','measurement','settings')),
  entry_id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, category, entry_id)
);
create index if not exists foxy_entries_user_category_idx
  on public.foxy_entries (user_id, category);
alter table public.foxy_entries enable row level security;
revoke all on public.foxy_entries from anon;
grant select, insert, update, delete on public.foxy_entries to authenticated;

drop policy if exists "foxy select own" on public.foxy_entries;
create policy "foxy select own" on public.foxy_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "foxy insert own" on public.foxy_entries;
create policy "foxy insert own" on public.foxy_entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "foxy update own" on public.foxy_entries;
create policy "foxy update own" on public.foxy_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "foxy delete own" on public.foxy_entries;
create policy "foxy delete own" on public.foxy_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);
