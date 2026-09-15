# Bottom tab navigation QA

## Change

- The selected tab expands into a rounded pill with its icon and Turkish label.
- Inactive tabs show icons only and retain explicit Turkish accessibility labels.
- The navigator continues to expose the selected state to assistive technology.
- Existing tab order, routes, career notification dot, safe-area clearance, and gameplay hide rule are preserved.
- The pill uses existing `secondary`, `secondarySoft`, `borderStrong`, and radius tokens. Inactive icons use `textMuted`.
- Default dark uses a restrained teal accent on the dark surface. Daylight Ops uses its blue information accent on a light tinted surface.
- Items are 48px high with a 44px minimum width. The active item receives extra width and is capped at 160px on wide screens.
- Labels use Inter Semibold at 12px and allow up to 1.2× font scaling within the compact navigation.
- No dependencies or animations were added.

## Validation performed

- `npx tsc --noEmit`: passed.
- `npx expo export --platform web`: passed.
- `git diff --check`: passed (existing Windows line-ending warnings only).
- `node tests/run-typescript-invariant.cjs tests/game-session-ux-invariants.cjs`: passed.
- Browser smoke check: exported app loaded the login screen. No authenticated session was available, so navigation visual and interaction QA below remains pending.
- Source review: the existing `game` screen still has `href: null` and `tabBarStyle: { display: 'none' }`.
- Theme compatibility is based on existing token mappings; both themes still need visual confirmation in an authenticated session.

## Manual checklist

Run every item in both **Klasik · Koyu** and **Daylight Ops · Açık**.

1. [ ] Check the bottom navigation at **390px** width; also spot-check 360px and 430px.
2. [ ] Check the bottom navigation at desktop width when visible.
3. [ ] Visit all six destinations in the existing order:
   - Ana Sayfa
   - Oyun Merkezi (tab label: Oyun)
   - Kariyer
   - Sıralama
   - Mağaza
   - Profil
4. [ ] Confirm the active tab shows its icon and full Turkish label inside a rounded highlighted pill.
5. [ ] Confirm inactive tabs show only icons and remain readable.
6. [ ] Switch through every tab and back; confirm exactly one pill follows the selection.
7. [ ] Confirm there is no horizontal overflow or horizontal scrolling.
8. [ ] Confirm no labels clip, especially Ana Sayfa and Sıralama, including enlarged text.
9. [ ] Enter an active game session and confirm the entire tab bar is hidden; return to a normal destination and confirm it reappears.

Additional accessibility checks:

- [ ] Verify comfortable touch targets and bottom safe-area clearance.
- [ ] Verify keyboard focus remains visible and activating a tab updates selection.
- [ ] Verify a screen reader announces each Turkish tab name and the selected state; Kariyer should still announce an unseen badge when applicable.

## Scope

Application changes are confined to `app/(tabs)/_layout.tsx`. Existing budget, rewards, game session, authentication, database, question, category, analytics/consent, and onboarding changes were left untouched.
