begin;

create table if not exists public.leaderboard_score_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score_delta integer not null,
  category_id text,
  difficulty_star integer,
  session_id text not null,
  created_at timestamptz not null default now(),

  constraint leaderboard_score_events_score_delta_range
    check (score_delta between 1 and 1000),
  constraint leaderboard_score_events_category_format
    check (category_id is null or category_id ~ '^[a-z0-9_]{1,64}$'),
  constraint leaderboard_score_events_difficulty_range
    check (difficulty_star is null or difficulty_star between 1 and 3),
  constraint leaderboard_score_events_session_id_format
    check (session_id ~ '^[a-zA-Z0-9_-]{8,120}$'),
  constraint leaderboard_score_events_user_session_unique
    unique (user_id, session_id)
);

comment on table public.leaderboard_score_events is
  'Private, insert-only completed-session score history. Read access is exposed only through an aggregate leaderboard RPC.';
comment on column public.leaderboard_score_events.session_id is
  'Stable client session identifier used with user_id to make completed-session score writes idempotent.';

create index if not exists leaderboard_score_events_created_at_user_idx
  on public.leaderboard_score_events (created_at, user_id);
create index if not exists leaderboard_score_events_user_created_at_idx
  on public.leaderboard_score_events (user_id, created_at);

alter table public.leaderboard_score_events enable row level security;

revoke all on table public.leaderboard_score_events from public, anon, authenticated;
grant insert (user_id, score_delta, category_id, difficulty_star, session_id)
  on public.leaderboard_score_events to authenticated;

drop policy if exists "Users can insert their own leaderboard score events" on public.leaderboard_score_events;
create policy "Users can insert their own leaderboard score events"
on public.leaderboard_score_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.get_period_leaderboard(
  p_period text,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  company_name text,
  avatar_id text,
  avatar_frame_id text,
  career_rank text,
  ranking_score bigint,
  success_rate numeric,
  success_count integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with period_bounds as (
    select case
      when p_period = 'weekly'
        then date_trunc('week', timezone('Europe/Istanbul', now())) at time zone 'Europe/Istanbul'
      when p_period = 'monthly'
        then date_trunc('month', timezone('Europe/Istanbul', now())) at time zone 'Europe/Istanbul'
      else null
    end as period_start
  ), period_scores as (
    select
      event.user_id,
      sum(event.score_delta)::bigint as ranking_score
    from public.leaderboard_score_events as event
    cross join period_bounds
    where (select auth.uid()) is not null
      and p_period in ('weekly', 'monthly')
      and event.created_at >= period_bounds.period_start
      and event.created_at <= now()
    group by event.user_id
  )
  select
    profile.user_id,
    profile.company_name,
    profile.avatar_id,
    profile.avatar_frame_id,
    profile.career_rank,
    score.ranking_score,
    profile.success_rate,
    profile.success_count,
    profile.updated_at
  from period_scores as score
  join public.leaderboard_profiles as profile on profile.user_id = score.user_id
  order by
    score.ranking_score desc,
    profile.success_rate desc,
    profile.success_count desc,
    profile.updated_at asc,
    profile.user_id asc
  limit least(50, greatest(1, coalesce(p_limit, 50)));
$$;

comment on function public.get_period_leaderboard(text, integer) is
  'Returns authenticated aggregate weekly or monthly leaderboard rows using Europe/Istanbul calendar boundaries. PostgreSQL calendar weeks start Monday.';

revoke all on function public.get_period_leaderboard(text, integer) from public, anon;
grant execute on function public.get_period_leaderboard(text, integer) to authenticated;

commit;
