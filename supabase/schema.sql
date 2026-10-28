-- Run once in the Supabase dashboard: SQL Editor > New query > paste this file > Run.
-- It is safe to run again; it only (re)creates the table and its policies.

create table if not exists public.wishlist (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  programme_key text not null check (char_length(programme_key) between 1 and 300),
  status text not null default 'planning' check (status in ('planning', 'applying', 'applied', 'accepted', 'rejected')),
  notes text not null default '' check (char_length(notes) <= 5000),
  updated_at timestamptz not null default now(),
  primary key (user_id, programme_key)
);

-- Row level security: every query is limited to the signed-in user's own rows,
-- so one person can never read or change another person's wishlist or notes.
alter table public.wishlist enable row level security;

drop policy if exists "Users read their own wishlist" on public.wishlist;
create policy "Users read their own wishlist" on public.wishlist
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users add to their own wishlist" on public.wishlist;
create policy "Users add to their own wishlist" on public.wishlist
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own wishlist" on public.wishlist;
create policy "Users update their own wishlist" on public.wishlist
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete from their own wishlist" on public.wishlist;
create policy "Users delete from their own wishlist" on public.wishlist
  for delete to authenticated using ((select auth.uid()) = user_id);
