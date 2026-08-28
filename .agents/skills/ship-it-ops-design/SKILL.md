---
name: ship-it-ops-design
description: Preserve the distinctive Ship It Ops visual identity when designing, reviewing, or changing its UI across Expo, React Native, and web. Use for Ship It Ops layout, styling, responsive behavior, themes, components, motion, and design reviews; do not use for work unrelated to this product's interface.
---

# Ship It Ops Design

Keep Ship It Ops recognizable as a premium software-engineering crisis management game. Favor deliberate hierarchy, calm technical surfaces, selective game feedback, and mobile efficiency over generic AI-dashboard or permanent-cyberpunk styling.

## Authority

When guidance conflicts, use this order:

1. Existing product behavior and gameplay semantics
2. Ship It Ops project-specific design rules
3. Existing shared design system and tokens
4. `ui-ux-pro-max` general UI/UX guidance
5. Generic design conventions

Use `ui-ux-pro-max` alongside this skill when available for accessibility, responsive, and general UX expertise. This skill overrides generic visual recommendations when needed to preserve the Ship It Ops identity, unless that would harm accessibility or usability. Never modify `ui-ux-pro-max` as part of using this skill.

## Required reference

For significant UI implementation, redesign, responsive work, theme work, or design review, read [references/design-constitution.md](references/design-constitution.md) completely before deciding on changes. For a minor visual correction, consult only the relevant section when the product rule is already clear.

## Operating rules

- Preserve requested product behavior, progression, gameplay, terminology, routing, persistence, and theme semantics.
- Inspect the existing implementation, shared tokens, and reusable components before proposing UI changes.
- Give each screen or major state one obvious purpose and normally one primary CTA.
- Prefer hierarchy, spacing, separators, compact rows, popovers, or temporary surfaces over adding permanent cards.
- Use transparency selectively: primary content stays highly readable; supporting surfaces may be smoked acrylic; floating feedback may use the strongest frost.
- Keep normal states calm. Reserve red, urgency, strong glow, and intensified motion for real crisis states.
- Use at most one or two strong accents in a normal screen state; do not display every semantic color merely because it exists.
- Use display typography selectively, readable sans-serif for UI copy, and monospace for appropriate technical values. Avoid oversized mobile type and whole-app monospace.
- Design mobile intentionally rather than shrinking desktop. Surface the primary action early, reduce unnecessary stacking, preserve touch targets and safe areas, and prevent horizontal overflow.
- Avoid nested card chains, filler metrics, decorative badges, and simultaneous overuse of glow, gradients, shadows, large type, color, and animation.
- Keep established engineering/game names in English and ordinary explanatory interface language primarily in Turkish.
- Use motion only to communicate activation, transition, reward, progression, or state change; respect reduced motion and avoid constant decoration.
- Keep components compatible with Expo and React Native. Do not introduce web-only interaction or styling when a cross-platform approach is available.
- Keep debug and test controls development-only and outside the production information hierarchy.

## Existing product invariants

- Career XP determines rank.
- İtibar remains separate performance information.
- Şirket Bütçesi is the economy/resource metric.
- Uptime represents short-term momentum and milestones.
- Dashboard stays compact; its primary CTA is `Şirketi Büyüt`.
- The removed large Dashboard crisis card must not be recreated by default.
- Daily streak uses a compact trigger and popup, not a permanent large card.
- Game lifelines use activation feedback, not passive count-only feedback.
- Mobile efficiency is a product priority.

## Workflow

For significant UI work:

1. Inspect the current implementation and behavior.
2. Read this skill and the design constitution.
3. Use `ui-ux-pro-max` when available for relevant general expertise.
4. Inspect shared tokens and components.
5. Briefly state the intended change and preserved constraints.
6. Implement the smallest coherent change without altering product logic unless explicitly requested.
7. Check approximately 360–430px mobile widths and an intentional desktop layout.
8. Validate theme compatibility, safe areas, overflow, touch accessibility, and reduced motion where relevant.
9. Run `npx tsc --noEmit` and `npx expo export --platform web` for application UI changes.

For minor visual fixes, avoid new abstractions or components unless they materially improve consistency.

## Review gate

Before finishing, ask whether the primary purpose is obvious, information is repeated, secondary content can be disclosed progressively, CTAs compete, card nesting or transparency is excessive, accents or motion are noisy, mobile and desktop both feel intentional, Expo compatibility and themes are preserved, and the result looks specifically like Ship It Ops. Simplify if several answers are unfavorable.
