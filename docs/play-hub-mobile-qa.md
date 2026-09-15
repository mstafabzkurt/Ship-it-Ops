# Oyun Merkezi mobile category browser

## Implementation

- `app/(tabs)/play.tsx`: local Turkish-locale name search, clear/reset controls,
  progress filters, compact mobile cards, and a focused detail sheet.
- Below 680px: two columns; below 340px: one column. At 390px, cards measure
  approximately 172px wide and 152–160px tall (long names can grow naturally).
- Cards retain the configured category order and show icon, full course name,
  attempted-question coverage out of 60, and a short status when applicable.
- `Devam Eden` uses recorded attempted questions or passed operations, excluding
  completed categories. `Tamamlanan` uses all six passed operation checkpoints,
  matching the existing category mastery achievements. Question coverage and
  operation completion remain distinct.
- The sheet reuses the existing tier rendering and primary-tier selection. It
  adds per-tier attempted questions and passed-operation counts, plus existing
  unlock targets. Close, backdrop, and system back/Escape dismiss it.
- Motion: 0.98 card press scale, selected border, and a cancellable 180ms sheet
  entrance fade. Reduced motion disables the scale and fade. No page transitions,
  result staggering, pulsing, or new dependencies.
- At 680px and above, descriptive cards, tier details, per-card CTAs, and header
  metrics remain visible. Search/filter controls are available there too. Tier
  toplines can wrap, keeping the existing `SIRADAKİ` label intact.

## Validation results

Passed on 2026-09-15:

- `npx tsc --noEmit`
- `npx expo export --platform web`
- `git diff --check` (Git emits existing LF/CRLF normalization warnings)
- `node tests/run-typescript-invariant.cjs tests/phase7-invariants.ts`
- `node tests/run-typescript-invariant.cjs tests/game-session-ux-invariants.cjs`

## Browser and visual QA

Used installed headless Edge and bundled Playwright, with the actual screen,
React Native Web components, progress helpers, theme tokens, exported fonts, and
Ionicons glyphs. Temporary harness and screenshots are in `.expo/play-hub-qa/`.
Provider state, availability requests, telemetry, and router calls were stubbed
locally. SafeAreaView used a View stand-in; the existing info asset was omitted
from the fixture. No account or backend state was changed.

Passed:

- 390×844 two-column grid; screenshots inspected in default and Daylight themes.
- 1280×900 desktop retains all 15 descriptive cards and tier sections.
- 320, 360, 390, 430, 600, 679, 680, and 1280px: no horizontal text overflow.
- All 15 Turkish names searchable, including `İŞLETİM` case conversion; each card
  opens the matching heading and detail.
- Fresh, in-progress (12/60), completed (six passed checkpoints), no-match,
  combined search/filter, and reset states.
- Locked tiers display feedback without calling the router. Missing availability
  shows `İçerik eksik` and disables `Hazır Değil`.
- Primary CTAs preserve route strings for Kolay, Orta, and completed-tier Zor
  replay, including `/(tabs)/game?category=web_programming&star=1`.
- Search/browsing emit no selection analytics; starting retains the existing
  `category_selected` and `tier_selected` calls.
- Escape closes the sheet; short 390×430 viewport can scroll to the CTA;
  reduced-motion mode remains usable. No JavaScript page errors.

Live authenticated navigation, real Supabase availability, physical-device safe
areas/keyboards, and screen-reader behavior were not exercised by this fixture.
The active game screen, route builder, category IDs/order, question data,
checkpoint and unlock utilities, auth/save/economy/consent/analytics services,
and Supabase code are unchanged.
