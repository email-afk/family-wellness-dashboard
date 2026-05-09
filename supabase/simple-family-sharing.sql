create extension if not exists pgcrypto;

alter table if exists public.families
  drop column if exists created_by;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

do $$
begin
  if to_regclass('public.family_memberships') is not null then
    insert into public.family_members (family_id, user_id, display_name, created_at)
    select family_id, user_id, display_name, created_at
    from public.family_memberships
    on conflict (family_id, user_id) do nothing;
  end if;
end $$;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.daily_metrics enable row level security;

create or replace function public.current_user_family_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id
  from public.family_members
  where user_id = auth.uid()
$$;

create or replace function public.users_share_family(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.family_members viewer
    join public.family_members target
      on target.family_id = viewer.family_id
    where viewer.user_id = auth.uid()
      and target.user_id = target_user_id
  )
$$;

drop policy if exists "members can view their families" on public.families;
drop policy if exists "members can read their family" on public.families;
create policy "members can read their family"
on public.families for select
using (id in (select public.current_user_family_ids()));

drop policy if exists "users can read members in their family" on public.family_members;
create policy "users can read members in their family"
on public.family_members for select
using (family_id in (select public.current_user_family_ids()));

drop policy if exists "users can insert own family member row" on public.family_members;
create policy "users can insert own family member row"
on public.family_members for insert
with check (user_id = auth.uid());

drop policy if exists "users can update own family member row" on public.family_members;
create policy "users can update own family member row"
on public.family_members for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users view own metrics" on public.daily_metrics;
drop policy if exists "users can view same-family metrics" on public.daily_metrics;
create policy "users can view same-family metrics"
on public.daily_metrics for select
using (public.users_share_family(user_id));

drop policy if exists "users can insert own metrics" on public.daily_metrics;
create policy "users can insert own metrics"
on public.daily_metrics for insert
with check (user_id = auth.uid());

drop policy if exists "users can update own metrics" on public.daily_metrics;
create policy "users can update own metrics"
on public.daily_metrics for update
using (user_id = auth.uid())
with check (user_id = auth.uid());