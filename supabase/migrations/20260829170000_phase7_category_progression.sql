begin;

alter table public.game_incidents
  add column if not exists category_id text,
  add column if not exists difficulty_star smallint;

alter table public.game_incidents
  drop constraint if exists game_incidents_category_metadata_pair,
  add constraint game_incidents_category_metadata_pair
    check ((category_id is null and difficulty_star is null) or (category_id is not null and difficulty_star is not null)),
  drop constraint if exists game_incidents_category_id_format,
  add constraint game_incidents_category_id_format
    check (category_id is null or category_id ~ '^[a-z][a-z0-9_]{1,63}$'),
  drop constraint if exists game_incidents_difficulty_star_range,
  add constraint game_incidents_difficulty_star_range
    check (difficulty_star is null or difficulty_star between 1 and 3);

create index if not exists game_incidents_category_star_idx
  on public.game_incidents (category_id, difficulty_star, id)
  where category_id is not null and difficulty_star is not null;

comment on column public.game_incidents.category_id is
  'Optional Phase 7 category key. Rows without category metadata remain legacy-only and are excluded from category sessions.';
comment on column public.game_incidents.difficulty_star is
  'Phase 7 difficulty tier (1-3). The application validates exactly four distinct choices and treats optimal_text as the sole correct answer.';

alter table public.player_saves
  add column if not exists category_progress jsonb not null default '{}'::jsonb;

alter table public.player_saves
  alter column save_version set default 2,
  drop constraint if exists player_saves_category_progress_object,
  add constraint player_saves_category_progress_object
    check (jsonb_typeof(category_progress) = 'object');

comment on column public.player_saves.category_progress is
  'Account-owned per-category/per-star attempted question IDs and answer totals. Client save schema version 2.';

commit;
