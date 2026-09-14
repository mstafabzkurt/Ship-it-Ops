begin;

alter table public.player_saves
  add column if not exists claimed_badge_reward_ids jsonb not null default '[]'::jsonb,
  add column if not exists unseen_badge_ids jsonb not null default '[]'::jsonb;

alter table public.player_saves
  alter column save_version set default 4,
  drop constraint if exists player_saves_claimed_badge_rewards_array,
  add constraint player_saves_claimed_badge_rewards_array
    check (jsonb_typeof(claimed_badge_reward_ids) = 'array'),
  drop constraint if exists player_saves_unseen_badges_array,
  add constraint player_saves_unseen_badges_array
    check (jsonb_typeof(unseen_badge_ids) = 'array');

comment on column public.player_saves.claimed_badge_reward_ids is
  'Stable achievement IDs whose one-time company-budget reward has been granted. Client save schema version 4.';
comment on column public.player_saves.unseen_badge_ids is
  'Earned achievement IDs not yet viewed in the Career badges tab. Client save schema version 4.';

commit;
