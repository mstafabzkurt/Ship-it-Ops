begin;

create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_version integer not null default 1,
  career_xp integer not null default 0,
  reputation integer not null default 0,
  company_budget integer not null default 1000,
  company_name text not null default 'ShipIt Inc.',
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  ranking_success_count integer not null default 0,
  ranking_partial_count integer not null default 0,
  ranking_fail_count integer not null default 0,
  ranking_timeout_count integer not null default 0,
  ranking_legacy_positive_count integer not null default 0,
  joker_inventory jsonb not null default '{"codeReview":3,"gitRevert":3,"serverScaleUp":3,"snapshotBackup":3}'::jsonb,
  owned_item_ids jsonb not null default '[]'::jsonb,
  owned_cosmetic_ids jsonb not null default '["avatar_default","avatar_frame_default"]'::jsonb,
  equipped_avatar_id text not null default 'avatar_default',
  equipped_avatar_frame_id text not null default 'avatar_frame_default',
  streak_days jsonb not null default '[false,false,false,false,false,false,false]'::jsonb,
  streak_last_date date,
  recent_question_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint player_saves_version_positive check (save_version > 0),
  constraint player_saves_career_xp_non_negative check (career_xp >= 0),
  constraint player_saves_reputation_non_negative check (reputation >= 0),
  constraint player_saves_budget_non_negative check (company_budget >= 0),
  constraint player_saves_company_name_length check (char_length(company_name) between 1 and 48),
  constraint player_saves_company_name_trimmed check (company_name = btrim(company_name)),
  constraint player_saves_correct_answers_non_negative check (correct_answers >= 0),
  constraint player_saves_wrong_answers_non_negative check (wrong_answers >= 0),
  constraint player_saves_ranking_success_non_negative check (ranking_success_count >= 0),
  constraint player_saves_ranking_partial_non_negative check (ranking_partial_count >= 0),
  constraint player_saves_ranking_fail_non_negative check (ranking_fail_count >= 0),
  constraint player_saves_ranking_timeout_non_negative check (ranking_timeout_count >= 0),
  constraint player_saves_ranking_legacy_non_negative check (ranking_legacy_positive_count >= 0),
  constraint player_saves_joker_inventory_object check (jsonb_typeof(joker_inventory) = 'object'),
  constraint player_saves_owned_item_ids_array check (jsonb_typeof(owned_item_ids) = 'array'),
  constraint player_saves_owned_cosmetic_ids_array check (jsonb_typeof(owned_cosmetic_ids) = 'array'),
  constraint player_saves_streak_days_array check (jsonb_typeof(streak_days) = 'array' and jsonb_array_length(streak_days) = 7),
  constraint player_saves_recent_question_ids_array check (jsonb_typeof(recent_question_ids) = 'array'),
  constraint player_saves_avatar_id_format check (equipped_avatar_id ~ '^[a-z0-9_]{1,64}$'),
  constraint player_saves_avatar_frame_id_format check (equipped_avatar_frame_id ~ '^[a-z0-9_]{1,64}$')
);

comment on table public.player_saves is
  'Private, versioned account-owned Ship It Ops progression. Public leaderboard projection remains in leaderboard_profiles.';
comment on column public.player_saves.save_version is
  'Application save schema version used by client-side normalization and future migrations.';

create or replace function public.set_player_save_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_saves_set_updated_at on public.player_saves;
create trigger player_saves_set_updated_at
before update on public.player_saves
for each row execute function public.set_player_save_updated_at();

revoke all on function public.set_player_save_updated_at() from public, anon, authenticated;

alter table public.player_saves enable row level security;

revoke all on table public.player_saves from anon;
revoke delete, truncate, references, trigger on table public.player_saves from authenticated;
grant select, insert, update on table public.player_saves to authenticated;

drop policy if exists "Users can read their own player save" on public.player_saves;
create policy "Users can read their own player save"
on public.player_saves
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own player save" on public.player_saves;
create policy "Users can insert their own player save"
on public.player_saves
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own player save" on public.player_saves;
create policy "Users can update their own player save"
on public.player_saves
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;
