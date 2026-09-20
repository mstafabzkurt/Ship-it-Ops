begin;

alter table public.player_saves
  add column if not exists completed_sessions integer not null default 0;

update public.player_saves
set completed_sessions = greatest(
  completed_sessions,
  floor((correct_answers + wrong_answers)::numeric / 10)::integer
);

alter table public.player_saves
  drop constraint if exists player_saves_completed_sessions_non_negative;
alter table public.player_saves
  add constraint player_saves_completed_sessions_non_negative
  check (completed_sessions >= 0);

create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  avatar_id text not null default 'avatar_default',
  avatar_frame_id text not null default 'avatar_frame_default',
  career_rank text not null default 'Junior Mühendis I',
  career_xp integer not null default 0,
  reputation integer not null default 0,
  success_rate numeric(5, 2) not null default 0,
  completed_sessions integer not null default 0,
  selected_badge_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),

  constraint public_profiles_company_name_length
    check (char_length(company_name) between 1 and 48),
  constraint public_profiles_company_name_trimmed
    check (company_name = btrim(company_name)),
  constraint public_profiles_avatar_id_format
    check (avatar_id ~ '^[a-z0-9_]{1,64}$'),
  constraint public_profiles_avatar_frame_id_format
    check (avatar_frame_id ~ '^[a-z0-9_]{1,64}$'),
  constraint public_profiles_career_rank_length
    check (char_length(career_rank) between 1 and 80),
  constraint public_profiles_career_rank_trimmed
    check (career_rank = btrim(career_rank)),
  constraint public_profiles_career_xp_non_negative check (career_xp >= 0),
  constraint public_profiles_reputation_non_negative check (reputation >= 0),
  constraint public_profiles_success_rate_range check (success_rate between 0 and 100),
  constraint public_profiles_completed_sessions_non_negative check (completed_sessions >= 0),
  constraint public_profiles_selected_badges_array check (jsonb_typeof(selected_badge_ids) = 'array')
);

comment on table public.public_profiles is
  'Authenticated-readable safe profile projection. Contains no email, auth metadata, economy, inventory, settings, consent, telemetry, or raw player save JSON.';
comment on column public.public_profiles.user_id is
  'Internal route key. The client uses it for navigation and never renders it as profile content.';
comment on column public.public_profiles.selected_badge_ids is
  'Reserved safe allowlist of up to three explicitly public achievement IDs; empty until badge selection ships.';

create or replace function private.set_public_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists public_profiles_set_updated_at on public.public_profiles;
create trigger public_profiles_set_updated_at
before update on public.public_profiles
for each row execute function private.set_public_profile_updated_at();

create index if not exists public_profiles_company_name_casefold_prefix_idx
  on public.public_profiles ((private.company_name_casefold(company_name)) text_pattern_ops);

alter table public.public_profiles enable row level security;

revoke all on table public.public_profiles from public, anon, authenticated;
grant select, insert, update on table public.public_profiles to authenticated;

drop policy if exists "Authenticated users can read public profiles" on public.public_profiles;
create policy "Authenticated users can read public profiles"
on public.public_profiles
for select
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Users can insert their public profile" on public.public_profiles;
create policy "Users can insert their public profile"
on public.public_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.company_name_identities as identity
    where identity.user_id = (select auth.uid())
      and identity.company_name_display = company_name
  )
);

drop policy if exists "Users can update their public profile" on public.public_profiles;
create policy "Users can update their public profile"
on public.public_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.company_name_identities as identity
    where identity.user_id = (select auth.uid())
      and identity.company_name_display = company_name
  )
);

create or replace function private.sync_public_profile_from_player_save()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rank_name text;
  resolved_count integer := greatest(0, new.correct_answers) + greatest(0, new.wrong_answers);
begin
  if tg_op = 'UPDATE'
    and new.company_name is not distinct from old.company_name
    and new.equipped_avatar_id is not distinct from old.equipped_avatar_id
    and new.equipped_avatar_frame_id is not distinct from old.equipped_avatar_frame_id
    and new.career_xp is not distinct from old.career_xp
    and new.reputation is not distinct from old.reputation
    and new.correct_answers is not distinct from old.correct_answers
    and new.wrong_answers is not distinct from old.wrong_answers
    and new.completed_sessions is not distinct from old.completed_sessions then
    return new;
  end if;

  rank_name := case
    when new.career_xp >= 89000 then 'CTO III'
    when new.career_xp >= 79000 then 'CTO II'
    when new.career_xp >= 70000 then 'CTO I'
    when new.career_xp >= 62000 then 'Direktör III'
    when new.career_xp >= 54500 then 'Direktör II'
    when new.career_xp >= 47500 then 'Direktör I'
    when new.career_xp >= 41000 then 'Müh. Müdürü III'
    when new.career_xp >= 35000 then 'Müh. Müdürü II'
    when new.career_xp >= 29500 then 'Müh. Müdürü I'
    when new.career_xp >= 24500 then 'Takım Lideri III'
    when new.career_xp >= 20000 then 'Takım Lideri II'
    when new.career_xp >= 16000 then 'Takım Lideri I'
    when new.career_xp >= 12500 then 'Kıdemli Mühendis III'
    when new.career_xp >= 9500 then 'Kıdemli Mühendis II'
    when new.career_xp >= 7000 then 'Kıdemli Mühendis I'
    when new.career_xp >= 4800 then 'Mühendis III'
    when new.career_xp >= 3200 then 'Mühendis II'
    when new.career_xp >= 2000 then 'Mühendis I'
    when new.career_xp >= 1200 then 'Junior Mühendis III'
    when new.career_xp >= 500 then 'Junior Mühendis II'
    else 'Junior Mühendis I'
  end;

  insert into public.public_profiles (
    user_id,
    company_name,
    avatar_id,
    avatar_frame_id,
    career_rank,
    career_xp,
    reputation,
    success_rate,
    completed_sessions
  ) values (
    new.user_id,
    btrim(new.company_name),
    new.equipped_avatar_id,
    new.equipped_avatar_frame_id,
    rank_name,
    greatest(0, new.career_xp),
    greatest(0, new.reputation),
    case
      when resolved_count = 0 then 0
      else round((greatest(0, new.correct_answers)::numeric / resolved_count::numeric) * 100, 2)
    end,
    greatest(0, new.completed_sessions)
  )
  on conflict (user_id) do update set
    company_name = excluded.company_name,
    avatar_id = excluded.avatar_id,
    avatar_frame_id = excluded.avatar_frame_id,
    career_rank = excluded.career_rank,
    career_xp = excluded.career_xp,
    reputation = excluded.reputation,
    success_rate = excluded.success_rate,
    completed_sessions = excluded.completed_sessions;

  return new;
end;
$$;

drop trigger if exists player_saves_sync_public_profile on public.player_saves;
create trigger player_saves_sync_public_profile
after insert or update of
  company_name,
  equipped_avatar_id,
  equipped_avatar_frame_id,
  career_xp,
  reputation,
  correct_answers,
  wrong_answers,
  completed_sessions
on public.player_saves
for each row execute function private.sync_public_profile_from_player_save();

insert into public.public_profiles (
  user_id,
  company_name,
  avatar_id,
  avatar_frame_id,
  career_rank,
  career_xp,
  reputation,
  success_rate,
  completed_sessions
)
select
  save.user_id,
  btrim(save.company_name),
  save.equipped_avatar_id,
  save.equipped_avatar_frame_id,
  case
    when save.career_xp >= 89000 then 'CTO III'
    when save.career_xp >= 79000 then 'CTO II'
    when save.career_xp >= 70000 then 'CTO I'
    when save.career_xp >= 62000 then 'Direktör III'
    when save.career_xp >= 54500 then 'Direktör II'
    when save.career_xp >= 47500 then 'Direktör I'
    when save.career_xp >= 41000 then 'Müh. Müdürü III'
    when save.career_xp >= 35000 then 'Müh. Müdürü II'
    when save.career_xp >= 29500 then 'Müh. Müdürü I'
    when save.career_xp >= 24500 then 'Takım Lideri III'
    when save.career_xp >= 20000 then 'Takım Lideri II'
    when save.career_xp >= 16000 then 'Takım Lideri I'
    when save.career_xp >= 12500 then 'Kıdemli Mühendis III'
    when save.career_xp >= 9500 then 'Kıdemli Mühendis II'
    when save.career_xp >= 7000 then 'Kıdemli Mühendis I'
    when save.career_xp >= 4800 then 'Mühendis III'
    when save.career_xp >= 3200 then 'Mühendis II'
    when save.career_xp >= 2000 then 'Mühendis I'
    when save.career_xp >= 1200 then 'Junior Mühendis III'
    when save.career_xp >= 500 then 'Junior Mühendis II'
    else 'Junior Mühendis I'
  end,
  greatest(0, save.career_xp),
  greatest(0, save.reputation),
  case
    when save.correct_answers + save.wrong_answers = 0 then 0
    else round((save.correct_answers::numeric / (save.correct_answers + save.wrong_answers)::numeric) * 100, 2)
  end,
  greatest(0, save.completed_sessions)
from public.player_saves as save
on conflict (user_id) do update set
  company_name = excluded.company_name,
  avatar_id = excluded.avatar_id,
  avatar_frame_id = excluded.avatar_frame_id,
  career_rank = excluded.career_rank,
  career_xp = excluded.career_xp,
  reputation = excluded.reputation,
  success_rate = excluded.success_rate,
  completed_sessions = excluded.completed_sessions;

create or replace function public.search_public_profiles(
  search_query text,
  result_limit integer default 10
)
returns table (
  user_id uuid,
  company_name text,
  avatar_id text,
  avatar_frame_id text,
  career_rank text,
  career_xp integer,
  reputation integer,
  success_rate numeric,
  completed_sessions integer,
  selected_badge_ids jsonb,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  folded_query text := private.company_name_casefold(private.company_name_display(coalesce(search_query, '')));
  escaped_query text;
  safe_limit integer := least(10, greatest(1, coalesce(result_limit, 10)));
begin
  if caller_id is null or char_length(folded_query) < 2 then
    return;
  end if;

  escaped_query := replace(replace(replace(folded_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_');

  return query
  select
    profile.user_id,
    profile.company_name,
    profile.avatar_id,
    profile.avatar_frame_id,
    profile.career_rank,
    profile.career_xp,
    profile.reputation,
    profile.success_rate,
    profile.completed_sessions,
    profile.selected_badge_ids,
    profile.updated_at
  from public.public_profiles as profile
  inner join public.company_name_identities as identity
    on identity.user_id = profile.user_id
    and identity.company_name_display = profile.company_name
  where profile.user_id <> caller_id
    and private.company_name_casefold(profile.company_name) like escaped_query || '%' escape E'\\'
  order by
    case when private.company_name_casefold(profile.company_name) = folded_query then 0 else 1 end,
    char_length(profile.company_name),
    private.company_name_casefold(profile.company_name),
    profile.user_id
  limit safe_limit;
end;
$$;

revoke all on function private.set_public_profile_updated_at() from public, anon, authenticated;
revoke all on function private.sync_public_profile_from_player_save() from public, anon, authenticated;
revoke all on function public.search_public_profiles(text, integer) from public, anon;
grant execute on function public.search_public_profiles(text, integer) to authenticated;

commit;
