# Production auth, save isolation, and route refresh audit

Date: 2026-09-02

## Findings and fixes

### Vercel nested-route refresh

`app.json` leaves `expo.web.output` at Expo's default [`single` mode](https://docs.expo.dev/guides/publishing-websites/#output-targets). A production export contains one HTML document (`dist/index.html`) plus root-relative `/_expo/...` assets; it does not emit HTML files for `/play`, `/reputation`, or the other client routes. The deployed root returned HTTP 200 while `/play` and `/reputation` returned Vercel `NOT_FOUND` responses.

`vercel.json` now applies [Vercel's standard SPA rewrite](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404#ensure-rewrites-are-configured-for-spas) from `/(.*)` to `/index.html`. Existing static files remain served as files, while direct client-route requests receive the Expo entry document. `/leaderboard` is also a hidden compatibility route that redirects to the existing `/ranking` screen; this preserves the current tab and leaderboard behavior.

### Google/Supabase OAuth

The existing web implementation did not contain a hardcoded localhost or a native custom-scheme redirect. Web Google sign-in derives the redirect from `window.location.origin`, returns to `/`, lets Supabase perform the browser redirect, and enables `detectSessionInUrl` on web. Native continues to use the `shipit://` Expo link path separately.

The redirect construction is now isolated in a tested helper. The Vercel fallback also prevents a future client callback path from failing at the hosting layer. The reported Safari connection error cannot be declared fixed by code alone because Supabase's hosted redirect allowlist and Google provider configuration are external settings.

Verify in Supabase Dashboard under Authentication URL configuration. Supabase requires `redirectTo` to match the configured [Redirect URLs allowlist](https://supabase.com/docs/guides/auth/redirect-urls):

- Site URL: `https://ship-it-ops.vercel.app`
- Redirect URLs include `https://ship-it-ops.vercel.app`
- Redirect URLs include `https://ship-it-ops.vercel.app/**`
- Keep only the local development origins actually used by the team, such as `http://localhost:8081/**`

Also verify that the Google provider is enabled and its Google OAuth client callback points to the Supabase callback URL shown in the Dashboard, as described in [Supabase's Google login setup](https://supabase.com/docs/guides/auth/social-login/auth-google). Test with Safari after these settings are saved.

### Account/save isolation

The leak was caused by authenticated initialization calling `claimAndLoadLegacySave` when both the cloud row and user-scoped cache were absent. That assigned generic device progression to the first account created or signed in on that device.

Authenticated hydration now has exactly three ordered sources:

1. The authenticated user's cloud row.
2. That same user UUID's `@shipit_account_save:<user_uuid>` device cache when the cloud row is missing.
3. Clean defaults for a genuinely new account.

Generic legacy keys remain untouched for rollback safety, but they are never read by authenticated hydration and are never silently imported. A future explicit consent-based guest import can use them without weakening the current boundary.

On every auth identity change, the provider invalidates hydration, cancels pending debounce work, clears the runtime to clean defaults, and blocks protected screens until the new user's source is loaded. Logout therefore cannot expose the previous authenticated state as guest state.

### Hydration and write safety

Cloud autosave requires all three conditions: the queued write targets the active user, that same user is hydrated, and a cloud baseline has been fetched or intentionally initialized. Account-cache writes also require the queued target to still be the active hydrated user. These checks stop delayed user-A work after a switch to user B.

New-account creation uses an insert, not an upsert. If another client creates the row concurrently, the app fetches that row instead of overwriting it with defaults. Existing cloud state remains authoritative and cannot be replaced by clean startup state.

The existing telemetry path now emits `save_hydration_started`, `save_hydration_completed`, and `save_hydration_failed`. Metadata contains only the source label or a cache-fallback boolean; it contains no email, name, token, or save contents. Events are fire-and-forget and telemetry failures do not block auth or save loading.

## Validation and limits

Automated coverage lives in `tests/production-readiness-invariants.cjs` and checks clean new-account state, no generic legacy import, cloud precedence, account switching, logout visibility, pre-hydration write rejection, per-user cache keys, production OAuth redirect construction, the Vercel fallback, the `/leaderboard` alias, and exported asset presence when `dist` exists. A real Supabase authorization URL was also generated without starting a login; it correctly contained `provider=google` and `redirect_to=https://ship-it-ops.vercel.app/`.

The rebuilt export returned HTTP 200 for `/`, `/play`, `/game`, `/reputation`, `/leaderboard`, `/store`, and `/profile`; its hashed JavaScript asset also returned HTTP 200 with a JavaScript content type. Browser checks confirmed that every unauthenticated direct route booted the client, resolved safely to `/login`, rendered the login screen, showed no framework error overlay, and emitted no console warnings or errors.

Production Google login and real multi-account cloud rows require developer-owned Supabase/Google accounts and Dashboard access, so those checks remain manual. Source changes are not live until a new Vercel deployment is built from this revision.
