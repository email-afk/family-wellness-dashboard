create extension if not exists pgcrypto;

create type provider_name as enum ('oura', 'whoop');
create type connection_status as enum ('connected', 'expired', 'revoked', 'error');
create type visibility_level as enum ('hidden', 'summary', 'exact');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_memberships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table public.member_privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  recovery_visibility visibility_level not null default 'summary',
  sleep_visibility visibility_level not null default 'summary',
  hrv_visibility visibility_level not null default 'summary',
  resting_heart_rate_visibility visibility_level not null default 'summary',
  activity_visibility visibility_level not null default 'summary',
  alerts_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider provider_name not null,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  status connection_status not null default 'connected',
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  unique (user_id, provider)
);

create table public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider provider_name not null,
  state text not null unique,
  redirect_uri text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider provider_name not null,
  metric_date date not null,
  recovery_score numeric,
  readiness_score numeric,
  sleep_score numeric,
  sleep_performance numeric,
  hrv_rmssd_ms numeric,
  resting_heart_rate_bpm numeric,
  strain_score numeric,
  activity_score numeric,
  recovery_index numeric,
  sleep_index numeric,
  activity_index numeric,
  status_label text not null default 'Unknown',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, metric_date)
);

create table public.alert_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  metric_date date not null,
  alert_type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  unique (user_id, family_id, metric_date, alert_type)
);

alter table public.families enable row level security;
alter table public.family_memberships enable row level security;
alter table public.member_privacy_settings enable row level security;
alter table public.provider_connections enable row level security;
alter table public.oauth_states enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.alert_events enable row level security;

create policy "members can view their families"
on public.families for select
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = id and m.user_id = auth.uid()
  )
);

create policy "members can view family memberships"
on public.family_memberships for select
using (
  exists (
    select 1 from public.family_memberships viewer
    where viewer.family_id = family_id and viewer.user_id = auth.uid()
  )
);

create policy "users manage own privacy"
on public.member_privacy_settings for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users view own provider connections"
on public.provider_connections for select
using (user_id = auth.uid());

create policy "users view own metrics"
on public.daily_metrics for select
using (user_id = auth.uid());

create or replace view public.family_dashboard_summary as
select
  m.family_id,
  m.user_id,
  m.display_name,
  m.avatar_url,
  coalesce(p.recovery_visibility, 'summary') as recovery_visibility,
  coalesce(p.sleep_visibility, 'summary') as sleep_visibility,
  coalesce(p.hrv_visibility, 'summary') as hrv_visibility,
  coalesce(p.resting_heart_rate_visibility, 'summary') as resting_heart_rate_visibility,
  coalesce(p.activity_visibility, 'summary') as activity_visibility,
  coalesce(p.alerts_enabled, false) as alerts_enabled,
  array_remove(array_agg(distinct c.provider), null) as providers,
  case
    when latest.id is null then null
    else jsonb_build_object(
      'metric_date', latest.metric_date,
      'provider', latest.provider,
      'status_label', latest.status_label,
      'recovery_index', case when coalesce(p.recovery_visibility, 'summary') = 'exact' then latest.recovery_index else null end,
      'sleep_index', case when coalesce(p.sleep_visibility, 'summary') = 'exact' then latest.sleep_index else null end,
      'hrv_rmssd_ms', case when coalesce(p.hrv_visibility, 'summary') = 'exact' then latest.hrv_rmssd_ms else null end,
      'resting_heart_rate_bpm', case when coalesce(p.resting_heart_rate_visibility, 'summary') = 'exact' then latest.resting_heart_rate_bpm else null end,
      'activity_index', case when coalesce(p.activity_visibility, 'summary') = 'exact' then latest.activity_index else null end,
      'summary', jsonb_build_object(
        'recovery', case
          when coalesce(p.recovery_visibility, 'summary') = 'hidden' then null
          else latest.status_label
        end,
        'sleep', case
          when coalesce(p.sleep_visibility, 'summary') = 'hidden' then null
          when latest.sleep_index is null then 'No sleep data'
          when latest.sleep_index < 60 then 'Poor sleep'
          else 'Sleep ok'
        end,
        'activity', case
          when coalesce(p.activity_visibility, 'summary') = 'hidden' then null
          when latest.activity_index is null then 'No activity data'
          when latest.activity_index > 70 then 'High activity'
          else 'Balanced activity'
        end
      )
    )
  end as today
from public.family_memberships m
left join public.member_privacy_settings p on p.user_id = m.user_id
left join public.provider_connections c on c.user_id = m.user_id and c.status = 'connected'
left join lateral (
  select dm.*
  from public.daily_metrics dm
  where dm.user_id = m.user_id
  order by dm.metric_date desc, dm.updated_at desc
  limit 1
) latest on true
where exists (
  select 1 from public.family_memberships viewer
  where viewer.family_id = m.family_id and viewer.user_id = auth.uid()
)
group by
  m.family_id,
  m.user_id,
  m.display_name,
  m.avatar_url,
  p.recovery_visibility,
  p.sleep_visibility,
  p.hrv_visibility,
  p.resting_heart_rate_visibility,
  p.activity_visibility,
  p.alerts_enabled,
  latest.id,
  latest.metric_date,
  latest.provider,
  latest.status_label,
  latest.recovery_index,
  latest.sleep_index,
  latest.hrv_rmssd_ms,
  latest.resting_heart_rate_bpm,
  latest.activity_index;
