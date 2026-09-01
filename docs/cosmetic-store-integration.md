# Cosmetic store integration and polish

Selection source of truth: `assets/cosmetics/cosmetic-asset-audit.json`, specifically `firstReleaseSelection`. The original audit remains unchanged. The subsequent user-approved rarity/type price curve supersedes its price suggestions.

## Catalog and organization

- `src/config/cosmetics.ts` contains exactly **16 new avatars and 22 new frames**. IDs use the audit's `assetId`; names, categories, rarities and source paths match the selection exactly. Static asset requires allow Expo to package only the selected raw files.
- All six existing cosmetics retain their IDs, names, prices and assets. They appear under **Klasik**. Total live catalog: **19 avatars / 25 frames**.
- Store → Kozmetik has a prominent **Avatarlar / Çerçeveler** segmented control and lighter category chips below a subtle **KATEGORİ** label. Below 600px, categories scroll inside a horizontal rail; desktop uses a compact wrapping row. Every category remains available. Switching type resets the category to Tümü and the rail to its beginning.
- Visible items sort by **price ascending → standard/advanced/prestige/legendary → Turkish name → ID**. Missing rarity is standard; missing category is Klasik. Sorting uses a filtered copy and never mutates the catalog or promotes owned/equipped items. Purchases and equips preserve the current filter and item positions. Result text stays non-interactive, with a separate **Fiyat: artan** hint.
- Profile adds a collapsible **Kozmetik Envanterim** panel with owned items only, a type switch, equip actions and inline feedback. The rest of Profile is unchanged.

| Type | First-release category counts |
| --- | --- |
| Avatar | Pixel Operatörler 4; Karanlık Kadro 4; Renkli Kadro 5; Özel Seri 3 |
| Frame | Elemental 5; Arcane 5; Metal 4; Minimal 4; Prestij 4 |

No assets skipped. No raw assets copied, renamed, resized or modified. No additional KEEP/MAYBE/REJECT assets integrated.

## Final price curve

`FIRST_RELEASE_COSMETIC_PRICES` in the live catalog supplies every selected item's price. The six legacy cosmetics retain their existing prices, including both free defaults. Existing ownership is independent of price and receives neither an extra charge nor a refund.

| Rarity | Avatar | Frame |
| --- | ---: | ---: |
| standard | 900 | 1,100 |
| advanced | 1,400 | 1,800 |
| prestige | 2,200 | 3,000 |
| legendary | 3,500 | 4,500 |

## Rendering and behavior

`CosmeticPreview` supports explicit `avatarOnly`, `frameOnly`, and `equippedCombo` modes. Store and Profile inventory cards render only their own asset; frames have empty transparent centers, with no real avatar or placeholder inside. Profile summary and DashboardHeader render the equipped combination. Legacy identity callers retain the default combo mode, without changing leaderboard code.

The preview preserves contain sizing, alpha transparency and icon fallbacks. Standalone avatars use a larger unclipped stage. Web pixel art uses pixelated sampling; existing combination geometry remains intact. The dashboard badge keeps the previous 46px mobile / 52px desktop footprint. Missing cosmetics or either asset's image-load failure restore the original company-initial mark; changing to a valid identity resets that error state.

Cosmetic cards now use dark terminal surfaces, a technical type header, a stronger preview stage with a subtle corner marker, rarity rails/chips, distinct ownership/equipped chips, and a clearer price/action footer. Standard stays neutral, advanced uses the theme's secondary accent, prestige uses amber, and legendary adds a restrained primary-color wash. Existing acquisition sweeps, captions and the single item-named purchase/equip receipt remain unchanged.

The mobile filtering follow-up changes no prices. It emphasizes the existing curve through a slightly stronger prestige/legendary rail, subtle premium preview borders, and **FİYAT · ŞİRKET BÜTÇESİ** beside the action. Category pills are visually about 30px high inside 44px touch targets; the primary type buttons are 48px high within a shared segmented surface. Web controls explicitly announce the selected type and pressed category.

Purchases and equip actions call the existing ReputationContext methods. Purchase still adds ownership without auto-equipping. Existing budget checks, transaction guards, normalization and save behavior are unchanged. No schema, migration, auth, cloud service, leaderboard, progression, reward or gameplay changes; no dependencies added.

## Validation

- `node tests/cosmetic-catalog-invariants.cjs`: passed. Exact selection and non-price metadata; final rarity/type curve; 44 unique IDs; 38 selected paths; unchanged legacy prices and free/owned defaults; purchase/equip eligibility; no auto-equip; duplicate purchase and insufficient-budget guards; every selected ID survives save normalization; existing owners retain ownership/budget after repricing. Render assertions cover standalone Store/Profile cards for all 44 items, both explicit and legacy combo mode, and icon fallback. Platform Image is represented by a source-bearing image element in these server-rendered assertions; browser checks use the real React Native Web Image.
- `npx tsc --noEmit`: passed.
- `npx expo export --platform web`: passed; all 38 selected raw assets bundled.
- `git diff --check`: passed (Git emits existing line-ending normalization warnings).
- Browser checks at **360px** and **1440px**: type switching, category counts, compact horizontal mobile chips, no horizontal page overflow, readable desktop grid, and distinct owned/equipped labels. Default and Hardware themes were inspected during the preceding card-polish pass.
- Bought Kızıl Nöbetçi for 1,400 and Çelik İz for 1,100. Each purchase generated one receipt naming the item and did not auto-equip. Store equip updated the dashboard badge. Profile equipment changes, reload, and simulated sign-out/sign-in preserved ownership, budget and equipped IDs.
- Dashboard missing-asset and failed-load scenarios both restored the initial letter. Restoring valid selection recovered the combined badge. Profile summary rendered two assets while each inventory card rendered one.
- Profile with the full owned collection displayed 19 avatars and 25 frames without mobile overflow. Existing empty-state branches remain intact.
- All 38 selected items were rendered independently at **96px and 48px** on dark UI: 76 previews, 76 images, no broken image loads. No second cosmetic was included in any standalone preview.
- Start-of-task hashes confirmed provider, save/auth services, other economy files, assets, audit, navigation/layout files, leaderboard and progression were untouched. Store theme/joker/cosmetic action handlers match the previous integration verbatim. No page/tab transitions or dependencies were added.

Browser validation used an isolated local fixture containing copies of the actual Store/Profile screens, DashboardHeader and ReputationProvider, with local auth/save adapters and adjusted imports. Production shared components, catalog and save normalization were used directly. **No real account or Supabase data was accessed or altered.** Reload and simulated account-boundary checks verify provider/UI hydration, not production login or live cloud sync. Native iOS/Android rendering and all 16 × 22 combinations remain untested. The audit's source-license/provenance caveat remains unresolved; integration is not a license clearance.

## Latest mobile filtering and ordering validation

- Catalog invariants now cover ascending price in every type/category, rarity ties, Turkish C/Ç and I/İ name ordering, a final ID tie-break, missing rarity, shuffled input, ownership-independent ordering, and a non-mutated catalog. Render checks also assert one selected type and one pressed category.
- Existing 16-avatar / 22-frame selection and all prices remain unchanged. No reward, joker, theme, schema, auth, persistence, navigation or preview-mode changes.
- On a 360px viewport, the avatar rail measured 336px wide with 501px of scrollable content. A horizontal gesture scrolled the rail to the final categories while document width remained 360px.
- Full avatar and frame lists were checked in ascending displayed price. Free defaults appear first; legacy paid items take their natural price position. Buying/equipping Bere Teknisyeni and İnce Altın preserved Pixel Operatörler / Minimal filters and exact item order. A single named receipt appeared per action; ownership and equipped combination survived reload.
- Dashboard/Profile still rendered two identity assets; item cards rendered one asset each. Desktop category chips remain smaller than the main type control.
- The existing tab bar is in normal layout flow, not positioned over Store content. The local fixture reserved matching tab-bar space, including a simulated 34px mobile bottom inset. At 360 × 800, both last-item action buttons measured 48px high and ended 38px above the 98px tab bar. Existing scroll padding was sufficient; no padding or button-size change was made.
- TypeScript, Expo web export, cosmetic invariants, and `git diff --check` passed. Browser checks used local fixture data and representative tab-bar geometry; native-device safe areas, live login/cloud sync and the full production navigator were not exercised.

Latest changed files: `app/(tabs)/store.tsx`, `src/components/cosmetics/CosmeticFilters.tsx`, `src/components/store/CosmeticStoreCard.tsx`, `src/config/cosmetics.ts`, `tests/cosmetic-catalog-invariants.cjs`, and this document.

## Files from the preceding card/identity polish pass

- `src/config/cosmetics.ts`: central first-release price curve.
- `src/components/cosmetics/CosmeticPreview.tsx`: preview modes, standalone sizing and image-error callback.
- `src/components/cosmetics/CosmeticFilters.tsx`: uniform mobile category layout.
- `src/components/store/CosmeticStoreCard.tsx`: standalone assets and terminal presentation.
- `app/(tabs)/store.tsx`: terminal eyebrow; removed equipped-counterpart preview props.
- `src/components/dashboard/DashboardHeader.tsx`: equipped operator badge and initial fallback.
- `app/(tabs)/index.tsx`: connects equipped avatar/frame to the header.
- `src/components/profile/ProfileSummaryCard.tsx`: explicit combo mode.
- `src/components/profile/ProfileCosmetics.tsx`: standalone inventory card previews.
- `tests/cosmetic-catalog-invariants.cjs`: pricing, ownership and rendered-preview assertions.
- `docs/cosmetic-store-integration.md`: updated behavior and validation record.
