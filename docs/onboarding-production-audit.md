# Onboarding production audit — 2026-09-15

## Finding

**Production does not contain the pending local onboarding keyboard or empty-name
feedback fix.** This is a confirmed code-delivery mismatch; the reported iPhone
behavior cannot establish whether that pending fix works on iOS.

Inspected public HTML and its actual JavaScript bundle at
https://ship-it-ops.vercel.app. A second HTML request with a unique query string
and `Cache-Control: no-cache` referenced the same bundle. No authenticated data
was accessed and nothing was deployed.

| Evidence | Production | Fresh local export |
| --- | --- | --- |
| Bundle | `entry-c497aaf5cc87c850719e316b58afcde2.js` | `entry-df44b64e42ca45da66ef4c7f1f48cbaa.js` |
| Onboarding transparent web modal / canvas backdrop | Absent | Present |
| Hook reads `offsetTop` | No | Yes |
| Hook subscribes to visual viewport `scroll` | No | Yes |
| Empty-input feedback guard | Absent | Present |
| Short company-step natural scroll content | Absent | Present |

Production JavaScript SHA-256:
`3451db22aeeaa591acf39e1ba40d346ad704473888871630f6df8ebb3aad3251`

Local JavaScript SHA-256:
`6f584cbb0b39c5cc4e7fb326c1679ad30f4eaa46195433d978af2d980ae07bcc`

The inspected HTML reported `Last-Modified: Tue, 15 Sep 2026 14:11:34 GMT`,
`x-vercel-cache: HIT`, and `cache-control: public, must-revalidate, max-age=0`.
A cache hit alone does not establish an incorrect Vercel cache. No deployment
commit SHA was exposed by the inspected responses.

## Root-cause evidence

### Layout

The served onboarding Modal omits `transparent`. The React Native Web Modal
implementation in that same bundle uses a fixed full-layout-viewport container
with `backgroundColor: 'white'` for opaque modals. Its onboarding SafeAreaView
uses `flex: undefined` and a separately measured height. The hook measures
`Math.min(layoutHeight, Math.round(visualViewport.height * visualViewport.scale))`
and returns only width/height, with no origin or visual-viewport scroll updates.
Thus the inner dark content can shrink while the white outer modal still covers
the remaining layout viewport. The served HTML also sets no html/body/root
background. These are concrete ways the reported white region can be exposed;
the exact iPhone scroll/pan sequence was not reproduced here.

The keyboard can shrink the visual viewport without shrinking the layout
viewport; offsets locate the visible rectangle within it. Reference:
[MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).

### Empty-name error

Production passes the hook result directly:

```js
companyMessage: ie?.message ?? ue.message,
companyStatus: ie?.status ?? ue.status
```

It has no submitted/touched guard. The hook's initial invalid empty value is
therefore presented to the user immediately. This directly explains the early
error without requiring a focus event.

## Repository / deployment risk

At inspection, local HEAD was `00e3d98` (`Improve mobile Play screen browsing and
category details`). Its committed onboarding component and viewport hook still
contain the older patterns observed in production. The later attempted fix
exists only in uncommitted working-tree changes to:

- `src/components/onboarding/OnboardingExperience.tsx`
- `src/hooks/useOnboardingViewport.ts`
- `tests/onboarding-viewport-invariants.cjs`
- `tests/onboarding-company-input-invariants.cjs` (untracked)
- `docs/mobile-onboarding-qa.md`

Deploying the current committed HEAD again would not include those changes.
Do not interpret this audit as proof of production's exact commit: the relevant
code matches the older committed implementation, but deployment metadata was
not independently obtained.

Following the user's instruction to avoid unnecessary new code if production
is stale, the additional implementation started during this audit was removed.
The pre-existing pending fix was preserved. This report is the only new tracked
deliverable from the audit; downloaded comparison artifacts remain in ignored
`.expo/` and generated exports in ignored `dist/`.

## Pending local solution and limits

The existing local fix adds a transparent web modal, a canvas-colored outer
backdrop, offset-aware inner SafeAreaView, short-height scroll content, and an
empty-feedback guard. The footer remains inside the same ScrollView as the
company field. It does not modify auth, save, moderation, availability, gameplay,
or step order.

It is **not yet proven correct on iPhone**. It still sizes the inner SafeAreaView
separately from the outer modal, normalizes pinch scale, and does not read
`offsetLeft`. Its validation state is blur-based: initial focus is quiet, but a
blur/refocus can show the required error before submission, and clearing after
a previous touch can show it again. Existing tests explicitly allow blur
validation. If the retest requires submission-only feedback in all those cases,
that is a further validation-state change, not something already delivered by
the pending patch. No new single-owner shell or submission-only model was kept
after production was confirmed stale.

## Automated validation

All passed against the preserved pending local fix:

- `npx tsc --noEmit`
- `npx expo export --platform web`
- `git diff --check` (line-ending normalization warnings only)
- `node tests/onboarding-invariants.cjs`
- `node tests/onboarding-viewport-invariants.cjs`
- `node tests/onboarding-company-input-invariants.cjs`
- `node tests/company-name-validation-invariants.cjs`

These checks do not reproduce a physical iOS keyboard or prove that production
received the local fix. No claim of a physical-device fix is made.

## Exact physical iPhone retest

1. Include the pending onboarding source and test files in the intended release,
   build it, and deploy that release through the normal deployment process.
   Verify production references its new bundle and contains the backdrop,
   offset/scroll handling, and empty-feedback guard before testing the device.
2. On the same iPhone, record iOS version, Safari/Brave version, orientation, URL,
   and release bundle. Start a fresh tab/reload against that verified release.
   Use a test account with onboarding incomplete; do not reset a real player's save.
3. Reach the company-name step. Before touching the field, confirm no required
   error. Tap the untouched empty field and confirm the same with the keyboard open.
4. With the keyboard open, scroll both directions through the step and toward
   its boundaries. Confirm continuous onboarding background down to the keyboard,
   no blank page scroll region, no horizontal overflow, and reachable input/CTA.
5. Scroll back to the beginning and verify the step heading is not clipped.
   Tap the browser address bar, return to the field, and repeat the boundary test.
6. Press Continue while empty: the required error should appear and the step
   should remain unchanged. Tap dice: stale required feedback should clear while
   normal availability checking proceeds. Try a valid candidate, then clear it;
   explicitly record whether the remaining blur-based model meets the requested UX.
7. Dismiss/reopen the keyboard; blur/refocus without submission; rotate; pinch
   zoom and pan, then restore normal zoom. Confirm step and draft persist and
   record viewport height/width/offsetTop/offsetLeft/scale via Safari remote
   inspection if any gap returns.
8. Repeat in Safari and Brave, then check desktop at 1280px. Capture a screen
   recording of any remaining failure with the verified release identifier.
