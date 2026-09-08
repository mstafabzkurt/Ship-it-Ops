begin;

alter table public.player_saves
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists tutorial_completed boolean not null default false,
  add column if not exists selected_interest_areas jsonb not null default '[]'::jsonb;

alter table public.player_saves
  alter column save_version set default 3,
  drop constraint if exists player_saves_interest_areas_array,
  add constraint player_saves_interest_areas_array
    check (jsonb_typeof(selected_interest_areas) = 'array');

comment on column public.player_saves.onboarding_completed is
  'True after the account owner completes or explicitly skips first-run onboarding.';
comment on column public.player_saves.tutorial_completed is
  'True after the account owner completes or explicitly skips the guided tutorial.';
comment on column public.player_saves.selected_interest_areas is
  'Optional category IDs selected for future personalization. Client save schema version 3.';

commit;
