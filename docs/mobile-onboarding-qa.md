# Mobile onboarding stability QA

Device QA remains pending. Desktop browser emulation does not reproduce a real
Brave Mobile keyboard or browser URL bar transition.

Local rendered company-step fixtures were checked at 390×430, 360×360 (Daylight),
1280×900, and 1280×390. The input computed to 16px, fixture/scroll widths showed no
horizontal overflow, and scrolling exposed the complete CTA in the short mobile
and desktop fixtures. These fixtures use the actual component and React Native Web
styles with local context/status/icon stubs and fallback fonts; they validate layout,
not authentication, availability requests, or device keyboard behavior.

## Checklist

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

The viewport checks simulate keyboard height changes, normalized pinch zoom,
inactive/zero browser measurements, browser focus/pageshow return, orientation,
desktop resize, browsers without VisualViewport, listener cleanup, and native fallback.
They do not establish that a real browser navigation/reload preserves unsaved drafts.
