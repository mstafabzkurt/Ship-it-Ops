# Supabase data setup

Ship It Ops uses deliberately separated account tables:

- `public.player_saves` is private, account-owned progression. RLS restricts every normal client to its own row.
- `public.leaderboard_profiles` is the minimal public leaderboard projection. It never contains XP, İtibar, budget, inventories, recent questions, or achievement state.
- `public.leaderboard_score_events` is private, insert-only completed-session score history. Raw rows are not client-readable; weekly and monthly totals are exposed through an authenticated aggregate RPC. Calendar weeks start Monday.
- `public.company_name_identities` is the private, database-unique company-name claim for each account.
- `public.company_name_blocklist` is an operator-editable moderation source. Normal clients cannot list its rows.

## Manual migrations

If migrations are not connected to the Supabase project, run each file once in timestamp order:

1. Open the Ship It Ops project in Supabase Dashboard.
2. Open **SQL Editor** and choose **New query**.
3. Paste the complete contents of `supabase/migrations/20260829093000_create_leaderboard_profiles.sql`, then choose **Run**.
4. Create another query, paste the complete contents of `supabase/migrations/20260829150000_create_player_saves.sql`, then choose **Run**.
5. Run the remaining migrations in timestamp order, including `supabase/migrations/20260910160000_fix_embedded_severe_blocklist_matching.sql`.

The player-save query should finish with `Success. No rows returned`. In **Table Editor**, verify `public.player_saves` exists with `user_id` as its primary key, `save_version`, typed progression/stat columns, JSONB inventory/history/onboarding-interest columns, onboarding/tutorial completion flags, and `created_at`/`updated_at`.

In **Authentication → Policies** (or the table policy panel), verify these three `player_saves` policies:

- `Users can read their own player save`
- `Users can insert their own player save`
- `Users can update their own player save`

There should be no authenticated DELETE policy and no anonymous table privileges. `leaderboard_profiles` should retain its separate authenticated-read and own-row write policies.

The company-name migration adds the partial unique lookup index and the authenticated `check_company_name_availability` and `set_company_name` RPCs. Normal clients may read only their own identity row, cannot write identity rows directly, and cannot read the blocklist. The security-definer RPCs expose only status/message data and always scope writes to `auth.uid()`.

## Company-name blocklist maintenance

The blocklist is database-managed. Do not copy its terms into frontend validation, client bundles, or large explicit test fixtures. Add a term through a new timestamped migration that inserts into `public.company_name_blocklist`, computes `normalized_term` with `private.company_name_moderation_lookup(term)`, sets `severity = 'block'` and `is_active = true`, and uses `on conflict (normalized_term, match_type) do nothing` so repeated local runs are safe. Include a short source/category note for operator context.

Choose the narrowest match type that still addresses the abuse pattern:

- `exact`: whole display-name equality without separator/leet folding. Use for ambiguous slang, ordinary words with a risky secondary meaning, and short fragments where normalization could create false positives.
- `normalized_exact`: whole-name equality after Turkish case, separator, diacritic, and supported leetspeak folding. Use when the complete name is abusive and obvious obfuscations should also be rejected.
- `normalized_contains`: substring matching after moderation normalization. Reserve this for severe, unambiguous roots that should never occur inside a company name.
- `normalized_fuzzy_exact`: severe-term whole-name matching after moderation normalization and repeated-letter collapsing. Use for reviewed profanity whose stretched-letter variants must be blocked without applying substring matching.
- `normalized_fuzzy_contains`: severe-term substring matching with the same repeated-letter collapsing. It also catches prefix, suffix, and possessive forms when the relevant normalized root is seeded. Reserve it for reviewed, unambiguous roots with low collision risk.

Before using `normalized_contains` or `normalized_fuzzy_contains`, test representative clean Turkish words and brand-like names containing similar letter sequences. Fuzzy matching is never a default: it is limited to reviewed severe terms. Short roots such as `am`, `oc`, `pic`, `sik`, and `got` can collide with normal names after folding; keep them at whole-name scope without fuzzy substring matching. The legacy `contains` type remains supported by the RPC, but new seeds should require a specific justification before adding a raw substring rule.

Valid, non-default legacy company names are backfilled when their normalized lookup is unique. If multiple legacy rows collapse to the same lookup, the oldest row receives the claim and the remaining legacy names stay visible from `player_saves`; those accounts must choose an available name the next time they save it. This avoids migration failure and does not force existing users back through onboarding.

## Save ownership and migration

Cloud saves are authoritative when available. The app keeps an account-scoped device cache under `@shipit_account_save:<user_uuid>` for safe fallback; it never uses an email address as the namespace.

Generic legacy device-local progression is never imported into an authenticated account automatically. When a cloud row is missing, only the same user's account-scoped cache may initialize it; otherwise the account starts from clean defaults. Legacy keys and the old `@shipit_legacy_save_claim_v1` marker are left untouched for rollback safety and a possible future explicit import flow, but they are not active authenticated persistence.

This phase uses whole-save last-write-wins snapshots and serialized, coalesced writes. It does not implement realtime sync, save slots, rollback history, or multi-device conflict resolution. If two devices play the same account concurrently, the last completed snapshot write wins.

## Trust boundary

RLS prevents normal clients from selecting or writing another user's private save. The app uses only the authenticated user UUID and the public Supabase client key; it does not require a service-role key and does not store auth secrets in `player_saves`.

Gameplay and ranking values are still computed by the client. Server-authoritative outcome verification remains future anti-cheat hardening.
