# Mobile onboarding stability QA

Device QA remains pending. Desktop browser emulation does not reproduce a real
Brave Mobile keyboard or browser URL bar transition.

For the earlier viewport fix, local rendered company-step fixtures were checked at 390×430, 360×360 (Daylight),
1280×900, and 1280×390. The input computed to 16px, fixture/scroll widths showed no
horizontal overflow, and scrolling exposed the complete CTA in the short mobile
and desktop fixtures. These fixtures use the actual component and React Native Web
styles with local context/status/icon stubs and fallback fonts; they validate layout,
not authentication, availability requests, or device keyboard behavior.

For this company-name keyboard/validation fix, TypeScript, Expo web export,
diff whitespace, and all four onboarding/viewport/company-input/company-name
invariant scripts passed. Browser security policy blocked opening the new local
HTML fixtures, so current rendered browser QA and real iPhone QA remain pending.

## Checklist

- On iPhone / iOS Safari or Brave Mobile, start with a clean onboarding state.
- Reach the company-name step and tap the initially empty input.
- Confirm the keyboard opens without a large white gap, clipped title/input, or horizontal overflow.
- Confirm the input remains visible and usable and both CTA buttons are reachable by scrolling.
- Confirm focusing alone does not show “Şirket adı boş bırakılamaz.” or a red input border.
- Press Continue while empty; confirm the error appears and the step does not advance.
  Empty Continue attempts now accept taps solely to show feedback. Non-empty candidates
  still disable Continue until the existing availability check permits saving.
- Tap dice/random; confirm a suggestion fills the field and the empty-name error clears.
- Confirm Continue waits for availability, then advances normally for an available suggestion.
- Repeat at 390px mobile viewport and desktop width; also test a first blur while empty.
- Use Brave Mobile / mobile Chromium at approximately 390px width (also check 360px).
- Start with a clean test account/site state and open onboarding.
- Reach the company name step, tap the input, and type a company name.
- Confirm the keyboard opens without breaking the layout; the input remains readable.
- Scroll to the primary CTA and confirm it is reachable while the keyboard is open.
- Tap the browser URL bar, then return to the app without navigating or reloading.
- Confirm the company name and current step remain intact.
- Repeat after pinch zooming; restore normal zoom and check the screen fits again.
- Open/close the keyboard and rotate the device; confirm drafts and step remain intact.
- At normal zoom, confirm there is no horizontal scroll or clipped primary control.
- Repeat at desktop width (approximately 1280px), including a short window height.
- Check both existing onboarding themes, long button labels, and back/continue controls.

## Automated validation

- `npx tsc --noEmit`
- `npx expo export --platform web`
- `git diff --check`
- `node tests/onboarding-invariants.cjs`
- `node tests/onboarding-viewport-invariants.cjs`
- `node tests/onboarding-company-input-invariants.cjs`
- `node tests/company-name-validation-invariants.cjs`

The viewport checks simulate keyboard height changes and iOS pan offsets, normalized pinch zoom,
inactive/zero/non-finite browser measurements, browser focus/pageshow return, orientation,
desktop resize, browsers without VisualViewport, listener cleanup, and native fallback.
They do not establish that a real browser navigation/reload preserves unsaved drafts.

The company-input checks exercise the actual component render and event handlers
with local context/availability stubs: clean initial feedback, empty submit and blur,
dice clearing stale feedback, availability/retry gates, keyboard-viewport draft
stability, 16px input font, and CTA placement inside the scroll content. They do not
perform real availability requests or reproduce an iOS software keyboard.
