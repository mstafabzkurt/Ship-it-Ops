# Ship It Ops Design Constitution

This document is the long-form visual and interaction reference for Ship It Ops. It protects a distinctive product identity while allowing the interface to evolve across mobile browsers, desktop browsers, and future native Expo/React Native distribution.

## 1. Product identity

Ship It Ops is a software-engineering crisis management game. The interface should feel technical, deliberate, premium, modern, and game-like. Normal states are calm and controlled; actual crisis moments may become intense.

The product should derive its identity from engineering operations, decision-making, interaction feedback, and clear hierarchy. Avoid generic AI-generated cyberpunk dashboards, permanent emergency styling, gratuitous neon, and decoration that is unrelated to the player's task.

The desired impression is an operations environment built for meaningful choices—not a collection of fashionable dashboard components.

## 2. Decision priority

When design guidance conflicts, resolve it in this order:

1. Existing product behavior and gameplay semantics
2. Ship It Ops project-specific rules in this constitution
3. Existing shared design system, semantic tokens, and reusable components
4. `ui-ux-pro-max` general UI/UX, accessibility, and responsive recommendations
5. Generic design conventions

Use `ui-ux-pro-max` as a complement. Its general recommendations should improve accessibility, interaction quality, and responsive implementation without erasing the product identity. Follow this constitution when a generic visual recommendation conflicts with Ship It Ops, except where doing so would harm accessibility or usability.

## 3. Information hierarchy

Every screen and major state must have one clear primary purpose. Information earns permanent space by supporting that purpose—not because room is available.

- Do not repeat the same information across several sections unless repetition directly supports the current task.
- Keep primary actions visible and unmistakable.
- Prefer compact controls, popovers, expandable areas, sheets, dialogs, or floating feedback for secondary information.
- Use progressive disclosure to reduce permanent dashboard height and cognitive load.
- Preserve whitespace when it improves grouping or focus. Never fill it with fake metrics, decorative cards, or invented status data.

If removing an element makes the task clearer, removal is often preferable to replacing it with another decorated block.

## 4. Surface roles

Use three conceptual surface roles.

### Primary surfaces

Primary surfaces contain questions, answers, important progression, and major actions. They should be mostly opaque, have the highest readability, and remain visually stable under theme changes.

### Secondary surfaces

Secondary surfaces contain HUD elements, statistics, inventories, and supporting widgets. They may use a lightly translucent smoked-acrylic treatment, restrained borders, and moderate depth.

### Floating surfaces

Floating surfaces contain streak popovers, joker activation overlays, dialogs, and temporary feedback. They may use the strongest frosted or smoked transparency, provided the foreground remains legible and the scrim clearly separates it from background content.

Transparency is an accent, not the default treatment for every card. Avoid stacking multiple translucent surfaces, which weakens hierarchy and muddies contrast.

## 5. Transparency and depth

The preferred transparent treatment is smoked glass or frosted acrylic:

- dark translucent surfaces
- subtle blur where supported
- thin, restrained borders
- soft, controlled depth

Avoid bright stereotypical glassmorphism, glossy reflections, excessive blur, or repeated transparent layers. Cross-platform compatibility takes precedence over web-only visual effects. When blur is not reliable, reproduce the hierarchy with opacity, tonal separation, borders, and elevation rather than platform-specific hacks.

## 6. Color system

Default semantic roles:

- Graphite or deep navy: base canvas and structural depth
- Warm off-white: primary text
- Restrained violet or indigo: product accent and primary action
- Amber: budget, important progress, or caution
- Teal or mint: success, healthy, or available
- Crisis red: failure, critical state, or real urgency
- Muted blue: informational or technical state

Use no more than one or two strong accent colors during a normal screen state. Do not show every semantic color simultaneously. Red must remain relatively rare so it retains impact during genuine failure or crisis states.

Color must not be the only state indicator. Pair semantic color with clear labels, icons, shapes, or hierarchy. Maintain readable contrast in every supported theme.

## 7. Themes

Themes are identities, not simple palette swaps. A theme may change:

- surface treatment
- border character
- icon personality
- texture and background treatment
- accent behavior
- typography accents
- button depth
- subtle motion personality

Themes must preserve information architecture, semantic meaning, accessibility, and interaction patterns. A success state remains success and a crisis state remains crisis even when their exact tones change.

Existing or future identities may include Default/Core, Cyberpunk, Hardware, Nebula, Terminal, Datacenter, Retro Workstation, and Industrial Ops. These names suggest character; they do not authorize rebuilding screens or overwhelming content with decoration.

## 8. Typography

Use three conceptual roles where appropriate:

- **Display:** distinctive heading typography, used selectively for screen or state emphasis
- **UI:** highly readable sans-serif for normal interface copy
- **Technical:** monospace for timers, XP, budgets, code fragments, counts, and appropriate operational values

Do not make the entire application monospace. Do not use oversized typography merely to create visual drama, especially on mobile. Maintain a clear hierarchy through consistent shared type roles rather than screen-specific arbitrary sizes.

Allow labels and explanatory text to wrap when truncation would hide useful meaning. Technical values should remain stable and readable, using tabular or monospaced figures where appropriate.

## 9. Responsive behavior

Primary targets are mobile and desktop browsers, with architecture suitable for future native Expo/React Native distribution.

### Mobile

- Design the mobile composition intentionally; do not merely shrink desktop.
- Surface the primary action early.
- Reduce unnecessary vertical stacking and oversized headings.
- Move secondary information into compact disclosures where appropriate.
- Maintain accessible touch targets and comfortable spacing between controls.
- Respect notches, browser chrome, bottom navigation, and gesture safe areas.
- Prevent horizontal overflow around 360–430px widths.
- Keep important answer and action copy readable without forcing excessive scrolling.

### Desktop

- Multi-column compositions and stronger HUD arrangements are allowed.
- Preserve breathing room and readable content widths.
- Avoid stretching cards or text simply because more width exists.
- Ensure the layout feels deliberately composed rather than a scaled-up phone screen.

Responsive changes should normally be expressed through shared tokens, reusable helpers, and component behavior rather than scattered magic numbers.

## 10. Cards and containment

Cards are not the default solution. Before adding a card, determine whether spacing, typography, grouping, separators, or a compact row would communicate the hierarchy more cleanly.

Avoid excessive nesting such as:

`card → card → badge → pill → bordered button`

Use nested containment only when each layer communicates a distinct and necessary hierarchy. Reduce borders, shadows, and competing radii when grouping already makes the relationship obvious.

## 11. CTA hierarchy

Each screen or major state should normally have one clear primary CTA. Known examples include:

- Dashboard: `Şirketi Büyüt`
- Game decision: `Müdahaleyi Uygula`
- Resolved Game state: `Sonraki Soru`
- Store: the relevant purchase or equip action

Secondary actions must visually step back. Do not present several equally dominant controls or repeat the same route as multiple primary cards.

## 12. Game interaction

The Game screen should feel like crisis decision-making rather than a generic quiz. Important decisions should be intentional.

Preferred answer flow:

1. The player selects an answer.
2. The selected state becomes unmistakable.
3. The player confirms the decision.
4. The outcome is shown.

Question content, answer semantics, joker effects, timing, progression, and session logic are product behavior. Visual work must not silently change them. Feedback should reinforce the cause and effect of a decision without delaying or obscuring the next required action.

## 13. Motion and feedback

Animation must communicate activation, transition, reward, progression, or state change. Existing valid examples include:

- joker activation overlay
- joker count decrement
- milestone feedback
- question transition
- result transition

Do not add constant decorative animation. Normal UI should remain calm. Crisis moments may intensify motion, but it must remain controlled and must not block input.

Animations must be cancellable and cleaned up safely. Respect reduced-motion preferences. Prefer Expo/React Native-compatible animation primitives; do not depend on DOM animation events or web-only APIs for correctness.

## 14. Language and terminology

Keep established engineering and game feature names in English:

- Code Review
- Git Revert
- Scale Up
- Snapshot
- Uptime

Use Turkish primarily for ordinary explanatory and navigation language:

- Şirket Bütçesi
- Kariyer XP
- İtibar
- Sonraki Hedef
- Ana Sayfa
- Oyun
- Kariyer
- Mağaza
- Profil

Do not awkwardly translate common engineering terminology. Do not invent alternate labels for established concepts without an explicit product decision.

## 15. Visual attention and crisis states

Treat attention as a limited resource. Do not simultaneously overuse glow, gradients, large text, badges, bright colors, shadows, and animation. If everything is emphasized, nothing is emphasized.

Normal application UI should remain relatively calm. Actual crisis states may introduce crisis red, stronger borders, urgency, timer emphasis, and stronger controlled glow. Do not permanently style the whole application like an emergency state.

## 16. Assets and icons

Emoji may be temporary development placeholders. Final product surfaces should prefer a coherent asset and icon system for lifelines, achievements, ranks, and store items.

Components should allow placeholders to be replaced with image or vector assets without architectural rewrites. Maintain consistent icon personality, sizing, and semantic labeling across themes and platforms.

## 17. Development UI

Debug and test functionality must remain development-only. It must not influence production layout, CTA hierarchy, information priority, or responsive spacing. Development controls should be clearly separated and removable without affecting the product surface.

## 18. Established Ship It Ops decisions

Treat these as current product invariants unless the user explicitly changes them:

- Career XP determines rank.
- İtibar is separate performance information.
- Şirket Bütçesi is the economy and resource metric.
- Uptime represents short-term momentum and milestones.
- Dashboard remains compact.
- The large Dashboard crisis card was intentionally removed.
- Dashboard primary CTA is `Şirketi Büyüt`.
- Daily streak uses a compact trigger and popup, not a permanent large card.
- Game lifelines use activation feedback rather than passive count-only feedback.
- Mobile efficiency is a priority.

Do not reintroduce removed patterns merely because a generic dashboard convention suggests them.

## 19. Design review checklist

Before implementing or approving a significant UI change, evaluate:

- Is the screen's primary purpose obvious?
- Is any information unnecessarily repeated?
- Can secondary information be hidden or disclosed progressively?
- Are there competing primary CTAs?
- Are there too many cards or nested containers?
- Is transparency selective and readable?
- Are too many accent colors competing?
- Is typography appropriately scaled for mobile?
- Does the layout work around 360–430px without horizontal overflow?
- Does desktop still feel intentional?
- Are touch targets, safe areas, contrast, and reduced motion handled?
- Is the implementation Expo/React Native friendly?
- Is theme compatibility preserved?
- Does the result look specifically like Ship It Ops?
- Does it avoid generic AI-dashboard styling?

If several answers are unfavorable, simplify the structure before adding decoration.

## 20. Implementation workflow

For significant UI tasks:

1. Inspect the existing implementation and identify the current product behavior.
2. Read `SKILL.md` and this constitution.
3. Use `ui-ux-pro-max` when available for relevant general UX, accessibility, responsive, and interaction guidance.
4. Inspect existing shared tokens, themes, and reusable components.
5. Briefly explain the intended design change and the constraints being preserved.
6. Implement the smallest coherent change.
7. Do not alter product or game logic unless explicitly requested.
8. Test relevant mobile and desktop sizes, theme variants, safe areas, and interaction states.
9. Run `npx tsc --noEmit` and `npx expo export --platform web` for application UI changes.

For minor visual fixes, do not over-engineer, create unnecessary components, or broaden the scope into a redesign.
