begin;

create table if not exists public.leaderboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  avatar_id text not null,
  avatar_frame_id text not null,
  career_rank text not null,
  ranking_score integer not null default 0,
  success_rate numeric(5, 2) not null default 0,
  success_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint leaderboard_profiles_company_name_length
    check (char_length(company_name) between 1 and 48),
  constraint leaderboard_profiles_company_name_trimmed
    check (company_name = btrim(company_name)),
  constraint leaderboard_profiles_avatar_id_format
    check (avatar_id ~ '^[a-z0-9_]{1,64}$'),
  constraint leaderboard_profiles_avatar_frame_id_format
    check (avatar_frame_id ~ '^[a-z0-9_]{1,64}$'),
  constraint leaderboard_profiles_career_rank_length
    check (char_length(career_rank) between 1 and 80),
  constraint leaderboard_profiles_career_rank_trimmed
    check (career_rank = btrim(career_rank)),
  constraint leaderboard_profiles_ranking_score_non_negative
    check (ranking_score >= 0),
  constraint leaderboard_profiles_success_rate_range
    check (success_rate between 0 and 100),
  constraint leaderboard_profiles_success_count_non_negative
    check (success_count >= 0)
);

comment on table public.leaderboard_profiles is
  'Public leaderboard identity projected from device-local gameplay. No email, auth metadata, economy, inventory, or private progression fields.';
comment on column public.leaderboard_profiles.ranking_score is
  'Client-derived in Phase 5C. Server-authoritative outcome verification is a future anti-cheat hardening step.';

create or replace function public.set_leaderboard_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leaderboard_profiles_set_updated_at on public.leaderboard_profiles;
create trigger leaderboard_profiles_set_updated_at
before update on public.leaderboard_profiles
for each row execute function public.set_leaderboard_profile_updated_at();

revoke all on function public.set_leaderboard_profile_updated_at() from public, anon, authenticated;

create index if not exists leaderboard_profiles_global_order_idx
  on public.leaderboard_profiles (
    ranking_score desc,
    success_rate desc,
    success_count desc,
    updated_at asc,
    user_id asc
  );

alter table public.leaderboard_profiles enable row level security;

revoke all on table public.leaderboard_profiles from anon;
revoke delete, truncate, references, trigger on table public.leaderboard_profiles from authenticated;
grant select, insert, update on table public.leaderboard_profiles to authenticated;

drop policy if exists "Authenticated users can read leaderboard" on public.leaderboard_profiles;
create policy "Authenticated users can read leaderboard"
on public.leaderboard_profiles
for select
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Users can insert their leaderboard profile" on public.leaderboard_profiles;
create policy "Users can insert their leaderboard profile"
on public.leaderboard_profiles
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

drop policy if exists "Users can update their leaderboard profile" on public.leaderboard_profiles;
create policy "Users can update their leaderboard profile"
on public.leaderboard_profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

commit;
