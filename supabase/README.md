# Supabase data setup

Ship It Ops uses two deliberately separate account tables:

- `public.player_saves` is private, account-owned progression. RLS restricts every normal client to its own row.
- `public.leaderboard_profiles` is the minimal public leaderboard projection. It never contains XP, İtibar, budget, inventories, recent questions, or achievement state.

## Manual migrations

If migrations are not connected to the Supabase project, run each file once in timestamp order:

1. Open the Ship It Ops project in Supabase Dashboard.
2. Open **SQL Editor** and choose **New query**.
3. Paste the complete contents of `supabase/migrations/20260829093000_create_leaderboard_profiles.sql`, then choose **Run**.
4. Create another query, paste the complete contents of `supabase/migrations/20260829150000_create_player_saves.sql`, then choose **Run**.

The player-save query should finish with `Success. No rows returned`. In **Table Editor**, verify `public.player_saves` exists with `user_id` as its primary key, `save_version`, typed progression/stat columns, JSONB inventory/history columns, and `created_at`/`updated_at`.

In **Authentication → Policies** (or the table policy panel), verify these three `player_saves` policies:

- `Users can read their own player save`
- `Users can insert their own player save`
- `Users can update their own player save`

There should be no authenticated DELETE policy and no anonymous table privileges. `leaderboard_profiles` should retain its separate authenticated-read and own-row write policies.

## Save ownership and migration

Cloud saves are authoritative when available. The app keeps an account-scoped device cache under `@shipit_account_save:<user_uuid>` for safe fallback; it never uses an email address as the namespace.

The first account on a device whose cloud row is missing may claim the legacy device-local progression. The claim is stored in `@shipit_legacy_save_claim_v1` with the owning user UUID and save version. Legacy keys are retained for rollback safety but are no longer active persistence, and a different account cannot import the same legacy save.

This phase uses whole-save last-write-wins snapshots and serialized, coalesced writes. It does not implement realtime sync, save slots, rollback history, or multi-device conflict resolution. If two devices play the same account concurrently, the last completed snapshot write wins.

## Trust boundary

RLS prevents normal clients from selecting or writing another user's private save. The app uses only the authenticated user UUID and the public Supabase client key; it does not require a service-role key and does not store auth secrets in `player_saves`.

Gameplay and ranking values are still computed by the client. Server-authoritative outcome verification remains future anti-cheat hardening.
