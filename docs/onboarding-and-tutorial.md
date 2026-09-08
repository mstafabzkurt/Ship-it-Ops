# First-run onboarding and tutorial

Ship It Ops stores first-run state in the existing private, account-owned `public.player_saves` row and its matching `@shipit_account_save:<user_uuid>` device cache. Save schema v3 adds:

- `onboarding_completed`
- `tutorial_completed`
- `selected_interest_areas`

Whether the company name was set is derived from `company_name !== 'ShipIt Inc.'`; no duplicate flag is stored. The same player-save RLS policies continue to apply, so no public profile or cross-account data is introduced.

## Compatibility

A completely clean save with no completion flags is treated as a new account. A pre-v3 save is treated as an existing player—and both first-run experiences are considered complete—when it has a custom company name or meaningful activity such as XP, reputation, answer history, a changed budget, streak/category activity, inventory, or acquired cosmetics. This handles the `false` database defaults added to old rows without forcing established players through onboarding.

The first-run experience is mounted only after the authenticated account's save has hydrated. Both onboarding and the guided tour are keyed by the authenticated user ID, while the save provider clears runtime state before switching accounts. Tour display is additionally suppressed on the active `/game` route and resumes after leaving the game.

## Behavior

Onboarding collects a trimmed company name (32-character first-run limit), an owned free starter avatar and frame, and zero or more category interests. Explicit skip commits the existing safe defaults and marks onboarding complete. Completion or skip then enters the real Home screen with a compact guided-tour overlay. The tour navigates through Home, Game Hub, Career, Ranking, Store, and Profile while leaving each live screen visible beneath a dim scrim. Completing or skipping the tour writes the same durable `tutorial_completed` flag so it is not shown again.

Company names are locally validated and checked through the secure Supabase availability RPC before onboarding can advance. Final onboarding completion claims the name through `set_company_name`; a taken, moderated, stale, or unreachable claim leaves onboarding incomplete and returns the user to the inline company-name field. Skipping onboarding continues to use the shared `ShipIt Inc.` placeholder and does not create a unique company-name claim.

Interests are stored for future personalization and can be edited in Profile. They currently do not reorder, hide, unlock, or otherwise change game categories, questions, rewards, checkpoints, or ranking.
