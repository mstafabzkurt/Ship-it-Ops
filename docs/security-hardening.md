# Security Hardening

## Automated baseline

The GitHub security workflow runs on pull requests, pushes to `main`, and weekly. CodeQL checks JavaScript/TypeScript source for known code-level security patterns; `npm run security:audit` checks the lockfile's production dependencies against npm advisories and fails on high or critical findings (without applying fixes). After a push, see **Actions** for both job results and **Security → Code scanning** for CodeQL alerts. These checks complement, not replace, later Supabase/RLS review and runtime security testing.

## Release mode

Ship It Ops is currently prepared for a limited public playtest. The leaderboard and economy are not treated as secure competitive systems yet because scoring, economy changes, and session results are currently client-authoritative.

No real-money rewards or official competition should rely on the current scoring model. A future hardening phase should move score, economy, and session-result validation server-side before these systems are used competitively.

## Deferred controls

- The password minimum remains 6 for now. Revisit an 8+ character minimum after the public test or before a broader release.
- CAPTCHA or Turnstile is deferred until signup abuse appears or the signup risk materially increases.
- Cloudflare or additional WAF controls are deferred until a custom domain is introduced or abuse risk increases.
- Content Security Policy is enforced after production validation of authentication, Google OAuth, Supabase Realtime, assets and fonts, and analytics consent flows found no actionable violations.

## Secret handling

Never commit Supabase `service_role` keys, OAuth client secrets, Vercel tokens, GitHub tokens, SMTP passwords, or private API keys.

Public client configuration may be exposed by design, but `.env` must stay out of future commits if it ever contains any non-public value. If a private credential is exposed, stop distribution, rotate it through the owning provider, remove it from the active configuration, and assess repository history.

## Manual Supabase release checks

Manual production checks remain required for Row Level Security and grants. Before broader release, verify the effective RLS state, policies, table and column grants, and function execution privileges for `anon` and `authenticated`, with particular attention to gameplay, leaderboard, save, telemetry, and company-name tables.
