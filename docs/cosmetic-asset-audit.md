# Cosmetic asset audit

Audit date: **2026-08-31**. Recommendation only: **no assets added to the Store**.

All 148 raw assets were inspected. Pixel/fantasy styling is accepted; assets were judged on small-size readability, silhouette, portrait clearance and variety, not on whether they look cyberpunk.

## Decision summary

| Type | Analyzed | KEEP | MAYBE | REJECT | Proposed first release |
|---|---:|---:|---:|---:|---:|
| Avatars | 48 | 28 | 19 | 1 | 16 |
| Frames | 100 | 51 | 34 | 15 | 22 |

**First release: 16 avatars + 22 frames = 38 new cosmetic candidates.** KEEP is a candidate pool, not an instruction to list all 79 KEEP assets. All raw files remain where they were.

There are **0 file-identical and 0 decoded-pixel-identical duplicate groups**, **0 broken images**, and **0 missing-transparency rejects**. Eleven frames are rejected as near-redundant visual variants; another four frames and one avatar are rejected for clutter, face-space intrusion or weak facial readability.

No readable text/logo or specific famous-character likeness was flagged. **Source/licensing remains unverified for all 148 files.** No source/license sidecars were found in the raw folders; avatar editing metadata does not establish permission. This visual audit does not establish provenance or clear usage rights.

## Category distribution

| Category | All assets | First release |
|---|---:|---:|
| Karanlık Kadro | 15 | 4 |
| Renkli Kadro | 15 | 5 |
| Pixel Operatörler | 12 | 4 |
| Özel Seri | 6 | 3 |
| Prestij | 21 | 4 |
| Elemental | 31 | 5 |
| Minimal | 9 | 4 |
| Arcane | 23 | 5 |
| Metal | 16 | 4 |

Categories describe the cosmetic collection, not gameplay classes. Metal includes material-led bronze/stone/mechanical frames; the carved brown 24/86 material reads as copper or wood and remains a provisional material label. Minimal refers to low ornament density, not the absence of pixel texture.

## Review method and integration caveats

- **Avatars:** all 48 are 32×32 RGBA pixel portraits with binary transparency. Inspected at native 32px, 96px nearest-neighbor enlargement and 64px over a checkerboard. The intentionally small pixel grid is not by itself a rejection reason.
- **Frames:** all 100 are 100×100 RGBA with transparent centers and backgrounds. Inspected at 140px nearest-neighbor plus 96px/48px over a neutral portrait on dark navy. Binary alpha can produce stair-step edges when resampled; this is not a broken transparency channel.
- **Pairing:** all 22 shortlisted frames were also inspected with three contrasting actual portraits (Icon3, Icon12, Icon30), at 72px and 48px: 66 pairings at two sizes. This is an offline approximation of current Store geometry, not a native/browser rendering test or an exhaustive 16×22 compatibility test.
- **Current renderer:** `CosmeticPreview.tsx` uses a roughly 0.8-stage avatar viewport, a 0.96-stage Store avatar/frame scale and a small downward avatar offset. Enlarging 32px portraits can soften pixels; cropping can flatten tall hair, ears or buns, and some circular frames allow hair outside their opening. Check actual compact/store/profile views before a later catalog change. No renderer, profile layout or source art was altered.
- **Colors:** listed hex values are measured from opaque foreground RGB buckets; dark outlines and skin can dominate area. Supplemental chromatic accents are also provided in JSON. The top-five area shares need not total 100%.
- **Center opacity:** the frame metric measures opaque pixels in the central 40% square, not a real face mask. It supports review but never automatically decides KEEP/REJECT. Visual overlap can occur outside that square.
- **Ratings:** 5 = strong within this pixel-art family; 4 = good; 3 = notable caveat or redundancy; 2 = poor small-size readability/obstruction; 1 = unusable. No rating claims high-resolution painted-art fidelity.

## Balanced first release

The selection keeps every category represented and limits each similarity family to at most two items. The two-avatar exceptions have visibly different silhouettes or roles: the bearded elder pair and the beret/bareheaded glasses pair. The elemental group includes leaves, flowers, fire and cool dragon/ice energy; the frame set includes circles, rectangles, shields and rounded squares, rather than filling every slot with a gold laurel.

| Type | standard | advanced | prestige | legendary | Price range | Mean proposed price |
|---|---:|---:|---:|---:|---|---:|
| Avatars | 6 | 5 | 4 | 1 | 1,000–4,200 | 1,868.75 |
| Frames | 6 | 9 | 5 | 2 | 1,000–5,200 | 2,377.27 |

Prices are **virtual Şirket Bütçesi recommendations only**. Standard entries provide affordable variety; prestige/legendary tiers reward distinctive visual compositions, not statistics or larger source dimensions. Only three of 38 proposed items are legendary. Existing paid avatars (2,500 / 4,000), frames (2,000 / 3,500), and free defaults remain unchanged. No new rarity system, unlock gate, discount or scarcity rule is being implemented. These bands have not been calibrated against player earning-rate telemetry.

**Release conditions:** confirm asset source/usage permission, approve pixel sampling/crop behavior on actual devices, and check all intended avatar/frame combinations. REJECT-item prices below are hypothetical only if an asset is repaired or reconsidered; they are not an invitation to list it.

### Avatar shortlist

| File | Suggested Turkish name | Category | Rarity | Proposed price | Variety contribution |
|---|---|---|---|---:|---|
| [Icon1.png](../assets/cosmetics/raw/avatars/Icon1.png) | Kızıl Nöbetçi | Karanlık Kadro | advanced | 1,600 | Frontal bust; crimson swept hair, olive face and raised dark collar. |
| [Icon3.png](../assets/cosmetics/raw/avatars/Icon3.png) | Turkuaz Kıvılcım | Renkli Kadro | advanced | 1,600 | Frontal smiling bust with wide teal hair spikes and a blue collar. |
| [Icon8.png](../assets/cosmetics/raw/avatars/Icon8.png) | Kızıl Sakallı Usta | Pixel Operatörler | standard | 1,000 | Side-facing bust with a short red cap or hair, orange beard and large pale nose. |
| [Icon10.png](../assets/cosmetics/raw/avatars/Icon10.png) | Pembe Rota | Renkli Kadro | standard | 1,200 | Three-quarter pale face with a broad pink side sweep and amber collar. |
| [Icon12.png](../assets/cosmetics/raw/avatars/Icon12.png) | Menekşe Bilge | Karanlık Kadro | prestige | 2,600 | Frontal narrow bald head, prominent ears, cool highlights and violet collar. |
| [Icon13.png](../assets/cosmetics/raw/avatars/Icon13.png) | Limon Yeşili İzci | Renkli Kadro | standard | 1,000 | Three-quarter light face with upward lime hair and green shoulder accents. |
| [Icon16.png](../assets/cosmetics/raw/avatars/Icon16.png) | Gece Vardiyası | Karanlık Kadro | advanced | 1,800 | Frontal dark-skinned portrait with navy side-swept hair, red highlight and icy shoulder points. |
| [Icon18.png](../assets/cosmetics/raw/avatars/Icon18.png) | Bahar Elçisi | Özel Seri | prestige | 2,800 | Three-quarter portrait with orange flower crown, green hair and pale face. |
| [Icon21.png](../assets/cosmetics/raw/avatars/Icon21.png) | Bere Teknisyeni | Pixel Operatörler | standard | 1,000 | Three-quarter smiling portrait with red beret, cyan hair and round glasses. |
| [Icon23.png](../assets/cosmetics/raw/avatars/Icon23.png) | Gümüş Topuz | Pixel Operatörler | standard | 1,200 | Frontal smiling face with a tall silver-blue bun and violet shoulders. |
| [Icon25.png](../assets/cosmetics/raw/avatars/Icon25.png) | Bakır Analist | Pixel Operatörler | standard | 1,100 | Three-quarter portrait with side-swept orange hair, pale glasses and blue collar. |
| [Icon28.png](../assets/cosmetics/raw/avatars/Icon28.png) | Mor Gececi | Karanlık Kadro | advanced | 1,800 | Three-quarter dark face with long violet hair and bright purple lips. |
| [Icon29.png](../assets/cosmetics/raw/avatars/Icon29.png) | Sinyal Tacı | Özel Seri | legendary | 4,200 | Three-quarter face with lime/cyan spikes, pale eyewear and blue clothing. |
| [Icon30.png](../assets/cosmetics/raw/avatars/Icon30.png) | Altın İkiz Topuz | Renkli Kadro | prestige | 2,600 | Frontal dark-skinned smiling portrait with two large golden buns and blue shoulders. |
| [Icon34.png](../assets/cosmetics/raw/avatars/Icon34.png) | Kızıl Örgü | Renkli Kadro | advanced | 1,600 | Frontal dark-skinned portrait with red braided hair and amber collar. |
| [Icon37.png](../assets/cosmetics/raw/avatars/Icon37.png) | Altın Bilge | Özel Seri | prestige | 2,800 | Three-quarter golden-bearded elder with swept hair, violet forehead mark and pale-blue collar. |

### Frame shortlist

| File | Suggested Turkish name | Category | Rarity | Proposed price | Variety contribution |
|---|---|---|---|---:|---|
| [01.png](../assets/cosmetics/raw/frames/01.png) | Turkuaz Mühür | Prestij | prestige | 3,000 | Gold rectangular surround, turquoise corners and an oval opening. |
| [04.png](../assets/cosmetics/raw/frames/04.png) | Yaprak Kapısı | Elemental | advanced | 1,800 | Rounded square of bright green leaves over a thin golden vine. |
| [06.png](../assets/cosmetics/raw/frames/06.png) | İnce Altın | Minimal | standard | 1,000 | Thin circular gold band with small top and bottom flourishes. |
| [07.png](../assets/cosmetics/raw/frames/07.png) | Astral Mekanizma | Arcane | legendary | 5,000 | Asymmetric circular blue/gold arcs, pale filigree and a blue radial medallion. |
| [09.png](../assets/cosmetics/raw/frames/09.png) | Safir Defne | Prestij | prestige | 3,400 | Round ivory/gold winged laurel with blue side stones and lower jewel. |
| [12.png](../assets/cosmetics/raw/frames/12.png) | Mor Akım | Arcane | advanced | 2,000 | Circular braided cyan/violet leaves with small pointed top and crossed base. |
| [16.png](../assets/cosmetics/raw/frames/16.png) | Bakır Kuşak | Metal | standard | 1,500 | Round bronze ring with stone-like top segments, top fastener and warm lower plates. |
| [21.png](../assets/cosmetics/raw/frames/21.png) | Pembe Kanat | Prestij | advanced | 2,400 | Bright pink circular ring with white-pink wings concentrated below the face. |
| [22.png](../assets/cosmetics/raw/frames/22.png) | Bakır Köşe | Minimal | standard | 1,200 | Thin orange/gold rectangular frame with small ridged corner details. |
| [24.png](../assets/cosmetics/raw/frames/24.png) | Oyma Bakır | Metal | standard | 1,400 | Rounded square with carved copper/wood-like grain and small top flourish. |
| [28.png](../assets/cosmetics/raw/frames/28.png) | Orman Ejderi | Elemental | advanced | 2,200 | Thin green circular coil with an orange dragon head at upper right and pale lower curl. |
| [30.png](../assets/cosmetics/raw/frames/30.png) | Çift İz | Minimal | standard | 1,000 | Simple near-circular red/gold split bands with very small segmented joints. |
| [33.png](../assets/cosmetics/raw/frames/33.png) | Ametist Mühür | Arcane | prestige | 3,200 | Tall oval/shield of gold-edged violet panels with top gem and pointed shoulders. |
| [38.png](../assets/cosmetics/raw/frames/38.png) | Çelik İz | Minimal | standard | 1,200 | Thin slate/silver circular band with small blue upper accents and a faceted lower tip. |
| [40.png](../assets/cosmetics/raw/frames/40.png) | Buz Ejderi | Elemental | legendary | 5,200 | Asymmetric pale-blue dragon flowing down the right of a silver circular border. |
| [48.png](../assets/cosmetics/raw/frames/48.png) | Gül Büyüsü | Arcane | advanced | 2,200 | Thin pale-pink circular band with a large rose-like arcane curl at upper right. |
| [52.png](../assets/cosmetics/raw/frames/52.png) | Gri Defne | Metal | advanced | 1,800 | Tall slate/silver oval laurel with a small pointed top crest. |
| [60.png](../assets/cosmetics/raw/frames/60.png) | Gümüş Geçit | Metal | prestige | 3,000 | Silver rounded-square frame with blue top/bottom stones and curled side fittings. |
| [93.png](../assets/cosmetics/raw/frames/93.png) | Altın Çiçek | Elemental | advanced | 1,800 | Thin rectangular vine with four yellow-orange flower clusters and small green leaves. |
| [95.png](../assets/cosmetics/raw/frames/95.png) | Ametist Yörünge | Arcane | advanced | 2,400 | Open circular copper chain with separated magenta orbs of varied sizes. |
| [98.png](../assets/cosmetics/raw/frames/98.png) | Hasat Tacı | Prestij | prestige | 3,200 | Gold/olive laurel shield with red top jewel and orange lower leaves. |
| [100.png](../assets/cosmetics/raw/frames/100.png) | Kor Kuşak | Elemental | advanced | 2,400 | Round ring with clear orange flame tips above a dark brown metal lower band. |

## Similarity and duplicate decisions

Similarity is based on manual comparison at useful and small sizes. These groups are related visual families, **not claims that files are identical**. Shared style alone does not make an asset a reject.

The largest avatar overlaps are crimson hair/collars (1/15/26), teal-haired faces (3/4/9), green-haired faces (13/20/36/42), pink hair (10/41/45), copper/red hair (7/24/32/43/46), soft caps (19/31/40/48), and glasses (21/25). The first release avoids adding all variants from any family.

| Rejected near-variant | Preferred retained representative(s) | Why |
|---|---|---|
| [20.png](../assets/cosmetics/raw/frames/20.png) | [18.png](../assets/cosmetics/raw/frames/18.png) | Close visual alternate to 18 using the same stone/orange vocabulary; retain the lighter asymmetric representative, not both. |
| [26.png](../assets/cosmetics/raw/frames/26.png) | [69.png](../assets/cosmetics/raw/frames/69.png) | Near-redundant with the clearer open laurel 69 and plain ring 06; do not add another almost identical gold-ring SKU. |
| [70.png](../assets/cosmetics/raw/frames/70.png) | [07.png](../assets/cosmetics/raw/frames/07.png) | Close doubled variant of 07; extra medallion and filigree add noise at 48px without a sufficiently different identity. |
| [74.png](../assets/cosmetics/raw/frames/74.png) | [54.png](../assets/cosmetics/raw/frames/54.png) | Very close composition to 54 with more cramped vertical ornament; keep one representative of this family. |
| [76.png](../assets/cosmetics/raw/frames/76.png) | [43.png](../assets/cosmetics/raw/frames/43.png) | Close small-size role to 43, with weaker tail/silhouette differentiation; reject as a redundant red-ring slot. |
| [78.png](../assets/cosmetics/raw/frames/78.png) | [40.png](../assets/cosmetics/raw/frames/40.png) | Very close to 40's blue-dragon identity; doubled sides reduce face space and variety, so keep the asymmetric version. |
| [84.png](../assets/cosmetics/raw/frames/84.png) | [56.png](../assets/cosmetics/raw/frames/56.png) | Near-redundant with 56's same palette and ring construction; extra vertical bosses reduce portrait headroom. |
| [86.png](../assets/cosmetics/raw/frames/86.png) | [24.png](../assets/cosmetics/raw/frames/24.png) | Very close to 24 but with heavier borders and less opening; keep the lighter carved-square representative. |
| [88.png](../assets/cosmetics/raw/frames/88.png) | [09.png](../assets/cosmetics/raw/frames/09.png), [29.png](../assets/cosmetics/raw/frames/29.png) | Close elongated variant of 29 and 09; tall repeated emblems add little launch variety and take more portrait space. |
| [91.png](../assets/cosmetics/raw/frames/91.png) | [30.png](../assets/cosmetics/raw/frames/30.png) | Very close to 30 at 48px; choose the more distinctive asymmetrical band treatment instead of near-identical inventory entries. |
| [94.png](../assets/cosmetics/raw/frames/94.png) | [51.png](../assets/cosmetics/raw/frames/51.png) | Doubled variant of 51's motif; paired heads crowd temples and make the same family less readable rather than more varied. |

Other dense frame families—red dragons, gold laurels, pink florals and red/green gates—mostly remain MAYBE or reserve KEEP rather than being rejected merely for sharing a theme. Full group membership and selected representatives are in the JSON.

### Quality / face-space rejects

| Asset | Rating | Reason |
|---|---:|---|
| [Icon46.png](../assets/cosmetics/raw/avatars/Icon46.png) | 2/5 | At 32px the face becomes a thin pale sliver and hair dominates recognition; Icon7 or Icon34 communicates identity more clearly. |
| [19.png](../assets/cosmetics/raw/frames/19.png) | 2/5 | Dense nearly continuous petals become noise at 48px and reduce portrait space; 17 or 93 offers clearer structure. |
| [42.png](../assets/cosmetics/raw/frames/42.png) | 2/5 | The central snout crowds the forehead and face opening at small size; 35 gives a safer red-shield silhouette. |
| [71.png](../assets/cosmetics/raw/frames/71.png) | 2/5 | Lower curls crowd the chin and the dark border becomes a heavy block; 35 is a more open shield option. |
| [89.png](../assets/cosmetics/raw/frames/89.png) | 2/5 | Highest central opacity in the set; thick inward plates crowd both temples and lower face. Prefer the less closed 25 only after fitting. |

Frame 89 has 19.5% opaque coverage in the central-square proxy, the highest in the set. Its rejection is also supported by visible inward plates. Frames 13/15/17/25/36/64/65/82 are held rather than selected because peripheral ornament needs more portrait clearance. None were rejected solely for being fantasy, using pixel art, or lacking a cyberpunk theme.

## Complete per-asset audit

The following entries include every raw file. Dimensions and transparency are measured; style, category, quality, rarity, price and names are editorial recommendations. All paths are unchanged. Every asset has an unverified source/license status even when KEEP.

## Avatars

### Icon1.png — Kızıl Nöbetçi · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon1.png](../assets/cosmetics/raw/avatars/Icon1.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (18.85% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0D0101` (27.6%), `#4B0515` (13.7%), `#79102F` (8.3%), `#5E0821` (7.9%), `#D18763` (6.4%). **Chromatic accents:** `#8E1C3A`, `#B46A49`, `#5C791E`, `#377000`.
- **Shape/style:** Frontal bust; crimson swept hair, olive face and raised dark collar. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_crimson_hair`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Strong hair silhouette and warm face stay legible on navy; lead the crimson family with this one.
- **Suggested rarity / price / name:** `advanced` / **1,600** / **Kızıl Nöbetçi** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon2.png — Mor Kâtip · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon2.png](../assets/cosmetics/raw/avatars/Icon2.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (26.95% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#07030C` (21.7%), `#2E1246` (8.3%), `#2F1706` (7.6%), `#210C31` (7.0%), `#441C65` (6.4%). **Chromatic accents:** `#904E32`, `#532778`, `#9A6E1B`, `#49217C`.
- **Shape/style:** Three-quarter pale face; purple hood, long nose and pale facial hair. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_hooded_mystics`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Distinct elder archetype, but the tiny eye and mouth merge at 32px; reserve behind the clearer dark portraits.
- **Suggested rarity / price / name:** `advanced` / **1,400** / **Mor Kâtip** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon3.png — Turkuaz Kıvılcım · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon3.png](../assets/cosmetics/raw/avatars/Icon3.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (10.06% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#00060A` (23.3%), `#0A2E51` (12.6%), `#031732` (12.6%), `#2D0804` (5.1%), `#B36B5A` (4.9%). **Chromatic accents:** `#367790`, `#9A5444`, `#A82C44`, `#2A6554`.
- **Shape/style:** Frontal smiling bust with wide teal hair spikes and a blue collar. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_teal_blue_hair`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Excellent expression and cyan silhouette; strong small-size representative of the cool-haired family.
- **Suggested rarity / price / name:** `advanced` / **1,600** / **Turkuaz Kıvılcım** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon4.png — Turkuaz Gözcü · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon4.png](../assets/cosmetics/raw/avatars/Icon4.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (31.93% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060605` (15.9%), `#144848` (10.8%), `#290603` (8.9%), `#C0816F` (8.0%), `#E6AF9C` (7.9%). **Chromatic accents:** `#2F7F8E`, `#914C3A`, `#2542AB`.
- **Shape/style:** Three-quarter bust; short swept teal hair and exposed pointed ears. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_teal_blue_hair`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clean short-hair alternative to Icon3; keep for a later drop rather than launching several teal faces together.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Turkuaz Gözcü** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon5.png — Gümüş Elçi · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon5.png](../assets/cosmetics/raw/avatars/Icon5.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (26.27% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#2D0E08` (10.7%), `#060808` (9.1%), `#D6B391` (8.9%), `#152B2B` (6.6%), `#F7DFC5` (6.0%). **Chromatic accents:** `#A26044`, `#B72D3F`, `#327370`, `#326438`.
- **Shape/style:** Three-quarter pale portrait with slick silver hair and a red upright collar. Style family: pixel-art fantasy character portrait.
- **Category:** Özel Seri; **similarity group:** `avatar_silver_hair`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Distinct formal silhouette and clear pale face; reserve to avoid overloading the first silver-haired group.
- **Suggested rarity / price / name:** `prestige` / **2,400** / **Gümüş Elçi** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon6.png — Altın Çırak · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon6.png](../assets/cosmetics/raw/avatars/Icon6.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.1% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#120300` (16.2%), `#AC702D` (15.5%), `#341102` (14.0%), `#CF9841` (12.8%), `#F0BF59` (6.8%). **Chromatic accents:** `#C68E3C`, `#953F21`, `#5C268A`.
- **Shape/style:** Frontal portrait with broad golden bangs and orange clothing. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `none (distinct within this batch)`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Hair dominates the eyes at native size; Icon30 and Icon37 supply more distinct golden silhouettes.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Altın Çırak** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon7.png — Bakır İzci · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon7.png](../assets/cosmetics/raw/avatars/Icon7.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.39% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0100` (13.2%), `#250401` (13.0%), `#500707` (11.5%), `#750D0F` (9.7%), `#9A1315` (8.1%). **Chromatic accents:** `#AF5C3D`, `#921417`, `#1850B6`, `#4282B8`.
- **Shape/style:** Frontal long copper hair, blue clothing and symmetrical exposed ears. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_copper_red_hair`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear face and warm/cool contrast; defer because the first release already includes several warm-haired portraits.
- **Suggested rarity / price / name:** `standard` / **1,100** / **Bakır İzci** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon8.png — Kızıl Sakallı Usta · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon8.png](../assets/cosmetics/raw/avatars/Icon8.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (24.41% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0C0400` (23.8%), `#300000` (20.5%), `#4D0100` (12.0%), `#670401` (9.3%), `#FDDAC7` (3.9%). **Chromatic accents:** `#8D2210`, `#84841B`, `#FFB35B`, `#275690`.
- **Shape/style:** Side-facing bust with a short red cap or hair, orange beard and large pale nose. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_bearded_veterans`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Readable beard and profile offer age and silhouette variety without needing a busy accessory.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Kızıl Sakallı Usta** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon9.png — Mavi Haberci · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon9.png](../assets/cosmetics/raw/avatars/Icon9.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (30.76% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040707` (28.9%), `#154B4B` (9.6%), `#2B6E72` (7.9%), `#6A2D26` (5.5%), `#995A53` (4.4%). **Chromatic accents:** `#34878F`, `#7E4039`, `#2C5286`, `#282186`.
- **Shape/style:** Frontal teal fringe, dark face and bright blue shoulder pieces. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_teal_blue_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Shares the broad teal-haired look of Icon3 with less facial separation; hold as an alternate, not a second launch look.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Mavi Haberci** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon10.png — Pembe Rota · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon10.png](../assets/cosmetics/raw/avatars/Icon10.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (27.25% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#2A0301` (16.9%), `#D56265` (10.9%), `#BB3D40` (8.9%), `#AD2C30` (8.3%), `#590D0E` (7.9%). **Chromatic accents:** `#AD393C`, `#974B2F`, `#FDCE6E`, `#20613E`.
- **Shape/style:** Three-quarter pale face with a broad pink side sweep and amber collar. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_pink_hair`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Pink hair remains distinct at 32px; simple facial structure makes this a strong accessible entry-price option.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Pembe Rota** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon11.png — Sinyal Gözlemcisi · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon11.png](../assets/cosmetics/raw/avatars/Icon11.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (32.13% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060706` (31.4%), `#712C19` (8.3%), `#213349` (6.8%), `#92482F` (6.3%), `#18273A` (6.0%). **Chromatic accents:** `#93482E`, `#6F9925`, `#446580`, `#F8BA42`.
- **Shape/style:** Dark tousled hair with bright yellow-green eyewear and olive/orange skin. Style family: pixel-art fantasy character portrait.
- **Category:** Özel Seri; **similarity group:** `avatar_neon_eyewear`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Small yellow facial marks become noisy; Icon29 has the clearer eyewear and hair silhouette for the first drop.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Sinyal Gözlemcisi** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon12.png — Menekşe Bilge · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon12.png](../assets/cosmetics/raw/avatars/Icon12.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (36.72% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0C0407` (26.7%), `#7F423A` (11.0%), `#985952` (9.6%), `#6C2F28` (8.6%), `#C77C73` (4.5%). **Chromatic accents:** `#81433C`, `#622A75`, `#2D466A`.
- **Shape/style:** Frontal narrow bald head, prominent ears, cool highlights and violet collar. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `none (distinct within this batch)`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Unusual head silhouette and high-contrast eyes add a distinct dark-series portrait.
- **Suggested rarity / price / name:** `prestige` / **2,600** / **Menekşe Bilge** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon13.png — Limon Yeşili İzci · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon13.png](../assets/cosmetics/raw/avatars/Icon13.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.0% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0A01` (13.8%), `#290903` (10.2%), `#535214` (9.5%), `#D6927E` (7.4%), `#2C2D05` (7.0%). **Chromatic accents:** `#995340`, `#889229`, `#7A792C`, `#8B0919`.
- **Shape/style:** Three-quarter light face with upward lime hair and green shoulder accents. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_green_hair`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Bright spiky silhouette separates well from navy and avoids another round fringe silhouette.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Limon Yeşili İzci** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon14.png — Yosun Pelerini · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon14.png](../assets/cosmetics/raw/avatars/Icon14.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (33.5% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#17310D` (26.4%), `#050600` (23.9%), `#304F23` (10.9%), `#6D2B15` (5.9%), `#92482F` (5.7%). **Chromatic accents:** `#944A2F`, `#4C7238`, `#F4B839`, `#42AE42`.
- **Shape/style:** Frontal amber face enclosed by a deep green hood or heavy hair. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_hooded_mystics`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Dark outer contour merges into navy and the face is cramped; review on-device before considering a later release.
- **Suggested rarity / price / name:** `advanced` / **1,400** / **Yosun Pelerini** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon15.png — Kızıl Ulak · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon15.png](../assets/cosmetics/raw/avatars/Icon15.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.98% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0306` (23.9%), `#290508` (12.0%), `#4B0617` (10.7%), `#C08270` (6.7%), `#770E2E` (5.3%). **Chromatic accents:** `#861537`, `#9A5A49`, `#526D1A`, `#FF51B1`.
- **Shape/style:** Frontal pale smiling face with floppy crimson hair and a dark collar. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_crimson_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Close crimson-hair/collar family with Icon1; the smaller eyes and broad grin read less cleanly at native size.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Kızıl Ulak** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon16.png — Gece Vardiyası · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon16.png](../assets/cosmetics/raw/avatars/Icon16.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.2% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#070103` (21.4%), `#031733` (16.4%), `#0A2E51` (11.5%), `#985952` (8.4%), `#6B2F28` (8.1%). **Chromatic accents:** `#83413A`, `#286494`, `#13376C`, `#AD3D45`.
- **Shape/style:** Frontal dark-skinned portrait with navy side-swept hair, red highlight and icy shoulder points. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_night_blue_hair`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Blue shoulder edges and warm face provide enough contrast despite dark hair; a strong dark-roster anchor.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Gece Vardiyası** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon17.png — Mor Keskin · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon17.png](../assets/cosmetics/raw/avatars/Icon17.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (34.18% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#070307` (21.2%), `#0D172D` (15.6%), `#D9AA97` (7.4%), `#213349` (6.5%), `#18263C` (6.5%). **Chromatic accents:** `#8541A6`, `#7D4B3C`, `#3C5D7A`, `#A16BE7`.
- **Shape/style:** Three-quarter pale face with a short violet undercut and tall dark collar. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_violet_hair`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Sharp side profile and purple edge light read well; reserve rather than competing with Icon28 at launch.
- **Suggested rarity / price / name:** `advanced` / **1,600** / **Mor Keskin** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon18.png — Bahar Elçisi · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon18.png](../assets/cosmetics/raw/avatars/Icon18.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (13.96% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#2C0500` (13.3%), `#030B00` (11.1%), `#162D0B` (8.5%), `#550600` (6.0%), `#B77F58` (5.9%). **Chromatic accents:** `#A44222`, `#6C8E22`, `#476F31`, `#FFCA56`.
- **Shape/style:** Three-quarter portrait with orange flower crown, green hair and pale face. Style family: pixel-art fantasy character portrait.
- **Category:** Özel Seri; **similarity group:** `none (distinct within this batch)`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Unique botanical headwear is recognizable even when petals merge; an expressive fantasy special-series choice.
- **Suggested rarity / price / name:** `prestige` / **2,800** / **Bahar Elçisi** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon19.png — Zeytin Gözcü · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon19.png](../assets/cosmetics/raw/avatars/Icon19.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (30.96% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0E0E0C` (23.2%), `#270703` (8.6%), `#B36B5A` (8.2%), `#313226` (7.2%), `#D6927E` (5.9%). **Chromatic accents:** `#9C5544`, `#6E418F`, `#54258A`, `#A7AE4E`.
- **Shape/style:** Three-quarter smiling face under an olive cap with violet shoulder highlights. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_soft_caps`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Good cap silhouette and face separation; defer to keep cap-wearing portraits from dominating the release.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Zeytin Gözcü** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon20.png — Yaprak Çırağı · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon20.png](../assets/cosmetics/raw/avatars/Icon20.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (28.61% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0503` (20.8%), `#848334` (8.5%), `#252406` (8.3%), `#67651D` (7.0%), `#585713` (6.0%). **Chromatic accents:** `#867C2C`, `#AC6442`, `#AAAA54`, `#3C348F`.
- **Shape/style:** Frontal pale face framed by long olive bangs and a green collar. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_green_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Bangs break up the eyes and duplicate the green-haired niche; Icon13 has a cleaner outer silhouette.
- **Suggested rarity / price / name:** `standard` / **900** / **Yaprak Çırağı** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon21.png — Bere Teknisyeni · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon21.png](../assets/cosmetics/raw/avatars/Icon21.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (27.34% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#090908` (21.5%), `#2F140B` (11.6%), `#D6B391` (7.8%), `#4E1213` (6.7%), `#F7DFC5` (6.0%). **Chromatic accents:** `#397B7E`, `#932628`, `#96663F`, `#276261`.
- **Shape/style:** Three-quarter smiling portrait with red beret, cyan hair and round glasses. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_glasses_operators`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Hat, eyewear and cool hair form a readable technician identity; distinct from the bareheaded orange-haired glasses option.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Bere Teknisyeni** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon22.png — Buz Saçlı Gözcü · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon22.png](../assets/cosmetics/raw/avatars/Icon22.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.78% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0B0B` (22.4%), `#4A817D` (9.2%), `#6BA7A4` (8.3%), `#3A706D` (8.2%), `#7F423A` (6.7%). **Chromatic accents:** `#824034`, `#337B76`, `#8F1626`, `#FFC244`.
- **Shape/style:** Three-quarter dark face with a rounded pale-cyan bob and visible teeth. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_silver_hair`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Strong pale-hair/dark-face contrast; keep for a later dark-series addition, with mouth readability checked at 32px.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Buz Saçlı Gözcü** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon23.png — Gümüş Topuz · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon23.png](../assets/cosmetics/raw/avatars/Icon23.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (36.52% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#03040A` (13.8%), `#260602` (11.4%), `#B36B5A` (9.2%), `#D6927E` (8.8%), `#30404A` (5.5%). **Chromatic accents:** `#9B5343`, `#473399`, `#3F1266`, `#416779`.
- **Shape/style:** Frontal smiling face with a tall silver-blue bun and violet shoulders. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_silver_buns`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Clear compact face and tall bun silhouette introduce a cool neutral into the launch palette.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Gümüş Topuz** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon24.png — Bakır Gülüş · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon24.png](../assets/cosmetics/raw/avatars/Icon24.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (31.64% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#2C0300` (12.9%), `#110501` (10.3%), `#B06745` (8.0%), `#D18763` (8.0%), `#AC3412` (6.6%). **Chromatic accents:** `#B65631`, `#9EA931`, `#E6973A`, `#094B6C`.
- **Shape/style:** Frontal orange-haired portrait with bright green clothing and a broad smile. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_copper_red_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Warm hair and friendly face repeat Icon7 and Icon25; do not launch several similar orange-haired faces.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Bakır Gülüş** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon25.png — Bakır Analist · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon25.png](../assets/cosmetics/raw/avatars/Icon25.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (31.84% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#250501` (18.6%), `#C9481A` (10.3%), `#AC3412` (8.9%), `#550500` (5.9%), `#871605` (5.7%). **Chromatic accents:** `#AE461F`, `#FA9A38`, `#0C5B8C`, `#1A3E6D`.
- **Shape/style:** Three-quarter portrait with side-swept orange hair, pale glasses and blue collar. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_glasses_operators`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Bareheaded, angular silhouette contrasts with Icon21's round beret; cap this eyewear family at two launch items.
- **Suggested rarity / price / name:** `standard` / **1,100** / **Bakır Analist** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon26.png — Kızıl Sakal · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon26.png](../assets/cosmetics/raw/avatars/Icon26.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (35.84% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#130303` (29.8%), `#4C0616` (11.1%), `#D9AA97` (8.7%), `#FDDAC7` (6.7%), `#79102F` (6.1%). **Chromatic accents:** `#851635`, `#995B38`, `#22336A`.
- **Shape/style:** Three-quarter pale face, swept crimson hair and short matching beard. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_crimson_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Acceptable art but overlaps the crimson-head family and the bearded role; Icon1 and Icon8 are more distinct together.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Kızıl Sakal** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon27.png — Altın Topuz · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon27.png](../assets/cosmetics/raw/avatars/Icon27.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (33.2% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#AA702E` (14.2%), `#250D01` (11.5%), `#0F0303` (10.2%), `#B77F58` (9.2%), `#8C5128` (7.6%). **Chromatic accents:** `#975E35`, `#C48C38`, `#A6333F`, `#5C1971`.
- **Shape/style:** Three-quarter pale face with a compact high golden bun and dark collar. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_gold_buns`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear elegant profile; hold behind Icon30 so launch does not include multiple golden-bun variations.
- **Suggested rarity / price / name:** `advanced` / **1,600** / **Altın Topuz** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon28.png — Mor Gececi · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon28.png](../assets/cosmetics/raw/avatars/Icon28.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.68% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#08020A` (30.0%), `#2E1246` (11.2%), `#210C31` (8.9%), `#1A0927` (7.9%), `#7F423A` (6.8%). **Chromatic accents:** `#7D4038`, `#511E75`, `#3E9B9B`.
- **Shape/style:** Three-quarter dark face with long violet hair and bright purple lips. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_violet_hair`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Long vertical hair silhouette and warm/cool separation broaden the dark roster; eyes remain identifiable at small size.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Mor Gececi** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon29.png — Sinyal Tacı · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon29.png](../assets/cosmetics/raw/avatars/Icon29.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (31.15% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040A02` (13.2%), `#C0816F` (8.7%), `#290804` (7.9%), `#E6AF9C` (6.4%), `#0B252F` (5.2%). **Chromatic accents:** `#35799B`, `#8C4C39`, `#84A02C`, `#368416`.
- **Shape/style:** Three-quarter face with lime/cyan spikes, pale eyewear and blue clothing. Style family: pixel-art fantasy character portrait.
- **Category:** Özel Seri; **similarity group:** `avatar_neon_eyewear`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Most distinctive technical/fantasy crossover silhouette; the sole suggested legendary avatar, not a resolution premium.
- **Suggested rarity / price / name:** `legendary` / **4,200** / **Sinyal Tacı** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon30.png — Altın İkiz Topuz · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon30.png](../assets/cosmetics/raw/avatars/Icon30.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (21.88% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0E0208` (26.5%), `#752E13` (11.5%), `#92482F` (7.0%), `#C17020` (6.2%), `#B26245` (6.2%). **Chromatic accents:** `#9E5027`, `#E8A23E`, `#1F1F79`, `#A11F22`.
- **Shape/style:** Frontal dark-skinned smiling portrait with two large golden buns and blue shoulders. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_gold_buns`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Symmetrical twin buns are highly recognizable and differ from the many single swept-hair portraits.
- **Suggested rarity / price / name:** `prestige` / **2,600** / **Altın İkiz Topuz** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon31.png — Yeşil Bere · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon31.png](../assets/cosmetics/raw/avatars/Icon31.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (17.77% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0905` (21.3%), `#4E6E0D` (8.7%), `#D9AA97` (6.9%), `#67851B` (6.1%), `#325206` (5.8%). **Chromatic accents:** `#688713`, `#5D3079`, `#825041`, `#004179`.
- **Shape/style:** Frontal pale portrait with green beret, violet hair and round bright eyes. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_soft_caps`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Friendly, readable cap option; reserve rather than adding a third hat/eyewear look to the first batch.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Yeşil Bere** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon32.png — Köz İzci · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon32.png](../assets/cosmetics/raw/avatars/Icon32.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (24.61% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0B0303` (20.7%), `#2F0200` (18.5%), `#4C0904` (10.2%), `#92482F` (9.1%), `#B26245` (8.2%). **Chromatic accents:** `#923C26`, `#006D00`.
- **Shape/style:** Side-facing dark-skinned portrait with swept red hair and orange collar. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_copper_red_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Face remains understandable, but warm side-profile repetition is high; defer in favor of Icon34's braided silhouette.
- **Suggested rarity / price / name:** `standard` / **900** / **Köz İzci** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon33.png — Gümüş Kıvılcım · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon33.png](../assets/cosmetics/raw/avatars/Icon33.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (26.37% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A100F` (20.2%), `#6BA7A4` (10.9%), `#B36B5A` (8.4%), `#4A817D` (7.4%), `#A0DEDE` (6.9%). **Chromatic accents:** `#9F553D`, `#3C716D`, `#8223A8`, `#E9BA74`.
- **Shape/style:** Broad frontal face with cyan-white swept hair, orange brow band and violet mouth. Style family: pixel-art fantasy character portrait.
- **Category:** Özel Seri; **similarity group:** `avatar_silver_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Strong palette but crowded eye/brow pixels; the expression loses clarity before the cleaner silver-haired alternatives.
- **Suggested rarity / price / name:** `prestige` / **2,400** / **Gümüş Kıvılcım** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon34.png — Kızıl Örgü · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon34.png](../assets/cosmetics/raw/avatars/Icon34.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (33.69% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0E0001` (22.4%), `#4C0808` (18.4%), `#995A53` (9.6%), `#760E10` (9.3%), `#7F423A` (8.2%). **Chromatic accents:** `#8E4533`, `#8D1316`, `#FFCB43`, `#072D7E`.
- **Shape/style:** Frontal dark-skinned portrait with red braided hair and amber collar. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `none (distinct within this batch)`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Tidy braid silhouette and centered face provide a distinct warm option without repeating long orange hair.
- **Suggested rarity / price / name:** `advanced` / **1,600** / **Kızıl Örgü** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon35.png — Mavi Perde · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon35.png](../assets/cosmetics/raw/avatars/Icon35.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (32.03% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#02060A` (22.4%), `#598EAD` (8.5%), `#D6B391` (6.6%), `#3D6B89` (6.3%), `#2F5772` (6.2%). **Chromatic accents:** `#3D6C89`, `#90603A`, `#298CFF`, `#5F0888`.
- **Shape/style:** Three-quarter pale face with long icy-blue fringe and dark collar. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_silver_hair`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Distinct pale fringe but one eye is partly hidden; keep as a later style option, not a first-release priority.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Mavi Perde** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon36.png — Zeytin Gezgin · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon36.png](../assets/cosmetics/raw/avatars/Icon36.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (33.01% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0E0807` (30.2%), `#B26245` (7.0%), `#92482F` (6.1%), `#702C18` (5.4%), `#848334` (5.2%). **Chromatic accents:** `#9A4F35`, `#706F25`, `#A4A451`, `#5D3EAC`.
- **Shape/style:** Frontal dark face with olive hair, pale eyes and purple clothing. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_green_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Eyes and mouth are busy at 32px; broad head shape overlaps several stronger frontal portraits.
- **Suggested rarity / price / name:** `advanced` / **1,400** / **Zeytin Gezgin** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon37.png — Altın Bilge · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon37.png](../assets/cosmetics/raw/avatars/Icon37.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (25.0% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0F0605` (13.5%), `#531706` (10.7%), `#C17020` (9.0%), `#B36B5A` (6.8%), `#E0902B` (6.6%). **Chromatic accents:** `#A1552B`, `#E49833`, `#370D8C`, `#048217`.
- **Shape/style:** Three-quarter golden-bearded elder with swept hair, violet forehead mark and pale-blue collar. Style family: pixel-art fantasy character portrait.
- **Category:** Özel Seri; **similarity group:** `avatar_bearded_veterans`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Expressive elder silhouette and cool accent distinguish it from Icon8's short red-bearded side profile.
- **Suggested rarity / price / name:** `prestige` / **2,800** / **Altın Bilge** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon38.png — Lacivert Gözcü · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon38.png](../assets/cosmetics/raw/avatars/Icon38.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (32.52% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060206` (20.8%), `#924A29` (10.4%), `#0E192F` (10.1%), `#D18763` (7.4%), `#2C0401` (6.9%). **Chromatic accents:** `#A45A3A`, `#476F8F`, `#E8B843`, `#7B1B60`.
- **Shape/style:** Three-quarter dark face, short navy hair and amber collar. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_night_blue_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Dark hair blends into the canvas; Icon16 adds clearer blue outer edges and a more distinct frontal composition.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Lacivert Gözcü** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon39.png — Bakır Topuz · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon39.png](../assets/cosmetics/raw/avatars/Icon39.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (34.47% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#2B0C05` (14.6%), `#C8481A` (7.3%), `#F7DFC5` (7.0%), `#030307` (6.7%), `#D6B391` (6.0%). **Chromatic accents:** `#A74720`, `#225F7D`, `#FA9A38`, `#2F467C`.
- **Shape/style:** Three-quarter pale face with high ginger bun and cool blue clothing. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `none (distinct within this batch)`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clean readable profile; keep for a later warm-color batch to avoid excessive copper/orange hair in launch.
- **Suggested rarity / price / name:** `standard` / **1,100** / **Bakır Topuz** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon40.png — Mor Şapkalı Ulak · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon40.png](../assets/cosmetics/raw/avatars/Icon40.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (30.08% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0B0804` (28.8%), `#290703` (7.8%), `#C0816F` (7.3%), `#E6AF9C` (6.3%), `#220F32` (4.1%). **Chromatic accents:** `#8C4D3C`, `#988729`, `#4B1D72`, `#FFFF83`.
- **Shape/style:** Three-quarter grinning pale face under a purple cap with yellow trim. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_soft_caps`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Cap and grin read, but facial marks are crowded and the role overlaps Icon19 and Icon31.
- **Suggested rarity / price / name:** `standard` / **900** / **Mor Şapkalı Ulak** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon41.png — Pembe Şafak · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon41.png](../assets/cosmetics/raw/avatars/Icon41.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (29.49% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#300303` (19.1%), `#D56467` (10.7%), `#0F0201` (7.5%), `#92482F` (7.2%), `#F18D90` (6.6%). **Chromatic accents:** `#AF3A3D`, `#984C33`, `#39407E`.
- **Shape/style:** Frontal dark-skinned laughing portrait with long pink waves and blue clothing. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_pink_hair`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Long waves and strong expression are distinct; reserve as the second pink-family option after Icon10.
- **Suggested rarity / price / name:** `advanced` / **1,600** / **Pembe Şafak** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon42.png — Orman Nöbeti · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon42.png](../assets/cosmetics/raw/avatars/Icon42.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (39.36% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030801` (22.1%), `#162E0B` (17.1%), `#220C02` (11.0%), `#304E23` (9.8%), `#B77F58` (8.1%). **Chromatic accents:** `#9E663E`, `#4C7138`, `#911777`.
- **Shape/style:** Frontal pale face, deep green fringe and light collar. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_green_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Eyes sit under a dark hair mass and outline disappears on navy; lower-price reserve pending small-size review.
- **Suggested rarity / price / name:** `standard` / **800** / **Orman Nöbeti** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon43.png — Kestane Kıvılcım · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon43.png](../assets/cosmetics/raw/avatars/Icon43.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (32.81% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0201` (32.0%), `#300100` (20.2%), `#490501` (9.0%), `#B16746` (7.4%), `#D28864` (5.8%). **Chromatic accents:** `#A14F35`, `#104B7A`.
- **Shape/style:** Frontal portrait with tousled chestnut hair, pale eyes and a broad grin. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_copper_red_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Lots of white facial pixels compete at 32px; other warm-haired portraits have clearer facial structure.
- **Suggested rarity / price / name:** `standard` / **900** / **Kestane Kıvılcım** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon44.png — Mavi Usta · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon44.png](../assets/cosmetics/raw/avatars/Icon44.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (31.45% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#031833` (20.7%), `#020207` (16.2%), `#092D50` (8.1%), `#230C01` (7.3%), `#8E4F29` (7.0%). **Chromatic accents:** `#935531`, `#275E8B`, `#1C4D98`, `#CA851B`.
- **Shape/style:** Three-quarter smiling face with broad navy hair, pale cheek and violet collar. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_night_blue_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Recognizable but outer hair blends into navy and it repeats the cool-haired side-profile family.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Mavi Usta** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon45.png — Pembe Pusula · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon45.png](../assets/cosmetics/raw/avatars/Icon45.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (33.01% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#2D0C05` (18.1%), `#D6B391` (9.3%), `#D56265` (7.6%), `#F7DFC5` (7.0%), `#9D1E22` (6.6%). **Chromatic accents:** `#AC363B`, `#986740`, `#426F82`.
- **Shape/style:** Frontal pale portrait with rounded pink hair and red clothing. Style family: pixel-art fantasy character portrait.
- **Category:** Renkli Kadro; **similarity group:** `avatar_pink_hair`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Very close color and face role to Icon10, with weaker eye separation; retain only as a later alternate.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Pembe Pusula** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon46.png — Kızıl Perde · REJECT

- **File:** [assets/cosmetics/raw/avatars/Icon46.png](../assets/cosmetics/raw/avatars/Icon46.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (31.05% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#4E0707` (27.8%), `#0F0201` (23.4%), `#760E10` (12.5%), `#9E1519` (8.9%), `#290603` (5.4%). **Chromatic accents:** `#951418`, `#8F5040`.
- **Shape/style:** Narrow side-facing portrait largely concealed by long red hair. Style family: pixel-art fantasy character portrait.
- **Category:** Karanlık Kadro; **similarity group:** `avatar_copper_red_hair`; **quality:** 2/5; **first release:** no.
- **Recommendation:** **REJECT** — At 32px the face becomes a thin pale sliver and hair dominates recognition; Icon7 or Icon34 communicates identity more clearly.
- **Suggested rarity / price / name:** `standard` / **800** / **Kızıl Perde** (hypothetical only; do not list).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

### Icon47.png — Mavi Bant · MAYBE

- **File:** [assets/cosmetics/raw/avatars/Icon47.png](../assets/cosmetics/raw/avatars/Icon47.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (35.06% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#2B0701` (15.9%), `#02040A` (12.8%), `#D9A47F` (7.5%), `#2F5773` (6.3%), `#8D5229` (6.2%). **Chromatic accents:** `#396C8D`, `#9E653D`, `#A82D32`, `#0B3F87`.
- **Shape/style:** Three-quarter face with pale-blue bun, red headband and orange collar. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_silver_buns`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Readable but closely repeats Icon23's tall cool bun; choose one in the first release.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Mavi Bant** (recommendation only).
- **Fit / risks:** Tall hair/headwear/ears may be clipped by the existing 0.8-stage avatar viewport; inspect before catalog integration.

### Icon48.png — Mor Seyyah · KEEP

- **File:** [assets/cosmetics/raw/avatars/Icon48.png](../assets/cosmetics/raw/avatars/Icon48.png); **type:** `avatar`; **dimensions:** 32×32; **has transparency:** yes (29.2% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#080209` (26.5%), `#583471` (13.8%), `#3A1551` (8.7%), `#2A0302` (7.6%), `#6A2D26` (6.1%). **Chromatic accents:** `#542E6E`, `#7C3F36`, `#E29F1E`, `#411595`.
- **Shape/style:** Three-quarter dark-skinned smiling portrait with purple cap and gold ear accents. Style family: pixel-art fantasy character portrait.
- **Category:** Pixel Operatörler; **similarity group:** `avatar_soft_caps`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — A useful dark-skinned cap option with clear cheeks; keep for a later batch rather than overloading launch hats.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Mor Seyyah** (recommendation only).
- **Fit / risks:** 32px pixel portrait is intentional; the current renderer enlarges/crops it. Check sampling and facial clarity before catalog integration.

## Avatar frames

### 01.png — Turkuaz Mühür · KEEP

- **File:** [assets/cosmetics/raw/frames/01.png](../assets/cosmetics/raw/frames/01.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.92% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000000` (21.4%), `#966F0C` (13.0%), `#623800` (10.1%), `#704C02` (9.6%), `#B4891D` (9.4%). **Chromatic accents:** `#986F11`, `#26A18A`, `#2F6D8B`.
- **Shape/style:** Gold rectangular surround, turquoise corners and an oval opening. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `none (distinct within this batch)`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Distinct square silhouette, restrained gem placement and fully clear center; strong first-release geometric option.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Turkuaz Mühür** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.0%.

### 02.png — Pembe Taç · MAYBE

- **File:** [assets/cosmetics/raw/frames/02.png](../assets/cosmetics/raw/frames/02.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.72% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000000` (21.8%), `#AF6A07` (9.3%), `#E8B51A` (8.8%), `#692401` (8.8%), `#8E5607` (8.5%). **Chromatic accents:** `#BF8414`, `#782A08`, `#BC15B5`, `#9E3E4D`.
- **Shape/style:** Circular gold laurel with pink crest and pink lower accents. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_gold_laurels`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **MAYBE** — Good art but repeats the gold-laurel role; select frame 09 for launch and hold this pink variation.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Pembe Taç** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 03.png — Kızıl Sarmal · MAYBE

- **File:** [assets/cosmetics/raw/frames/03.png](../assets/cosmetics/raw/frames/03.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (75.39% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050001` (27.1%), `#BA0E13` (7.6%), `#985139` (6.7%), `#500408` (6.5%), `#94040F` (6.5%). **Chromatic accents:** `#AC462A`, `#980717`, `#E3A63B`.
- **Shape/style:** Asymmetric bronze/red dragon curled around a round opening. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragons`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **MAYBE** — Readable dragon but one of many red coils; reserve behind the cleaner flame rail and stronger dragon alternatives.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Kızıl Sarmal** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 4.44%.

### 04.png — Yaprak Kapısı · KEEP

- **File:** [assets/cosmetics/raw/frames/04.png](../assets/cosmetics/raw/frames/04.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.38% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#020100` (21.1%), `#93B600` (10.1%), `#6A8D04` (9.7%), `#7FA401` (7.9%), `#8CCA00` (6.4%). **Chromatic accents:** `#7BA102`, `#AB4500`, `#CF8D01`, `#36810A`.
- **Shape/style:** Rounded square of bright green leaves over a thin golden vine. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_leaf_borders`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Clear corners and open center; a light botanical shape that differs from the many circular metal rings.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Yaprak Kapısı** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.12%.

### 05.png — Köz Siperi · MAYBE

- **File:** [assets/cosmetics/raw/frames/05.png](../assets/cosmetics/raw/frames/05.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (74.7% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050001` (25.6%), `#985139` (10.7%), `#BB0E14` (8.9%), `#95040F` (6.2%), `#6E3432` (6.2%). **Chromatic accents:** `#AA4D2F`, `#A50914`, `#E2A43B`.
- **Shape/style:** Rounded shield with paired red dragon heads above a bronze base. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragon_shields`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **MAYBE** — Top ornament crowds hair; keep as a later shield option rather than launching several red-dragon frames.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Köz Siperi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 2.88%.

### 06.png — İnce Altın · KEEP

- **File:** [assets/cosmetics/raw/frames/06.png](../assets/cosmetics/raw/frames/06.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (84.0% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010100` (25.5%), `#732706` (16.8%), `#E7B706` (12.8%), `#D2A506` (6.8%), `#E49F19` (5.0%). **Chromatic accents:** `#CA970A`, `#752906`.
- **Shape/style:** Thin circular gold band with small top and bottom flourishes. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `none (distinct within this batch)`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Simple bright outline, fully clear center and low visual competition; strong affordable baseline.
- **Suggested rarity / price / name:** `standard` / **1,000** / **İnce Altın** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.0%.

### 07.png — Astral Mekanizma · KEEP

- **File:** [assets/cosmetics/raw/frames/07.png](../assets/cosmetics/raw/frames/07.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.62% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000001` (18.7%), `#CCCCDA` (5.5%), `#CDB882` (5.1%), `#A85A11` (4.3%), `#6F350C` (4.2%). **Chromatic accents:** `#A27029`, `#3462C0`, `#1F17AA`, `#8C480F`.
- **Shape/style:** Asymmetric circular blue/gold arcs, pale filigree and a blue radial medallion. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_blue_white_arcana`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Distinct premium mechanism silhouette; decorative mass stays mostly at the edge and avoids the central eyes.
- **Suggested rarity / price / name:** `legendary` / **5,000** / **Astral Mekanizma** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 5.38%.

### 08.png — Karanlık Kızıl Halka · MAYBE

- **File:** [assets/cosmetics/raw/frames/08.png](../assets/cosmetics/raw/frames/08.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.58% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0303` (40.3%), `#D81D1B` (8.2%), `#BB1B25` (6.1%), `#E51A18` (5.5%), `#2E0606` (5.0%). **Chromatic accents:** `#C01B15`, `#AC1E28`.
- **Shape/style:** Dark red/black coiled dragon with inward lower curl. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragons`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Thin dark segments disappear on navy and lower curl crowds the chin; not a launch priority.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Karanlık Kızıl Halka** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 7.5%.

### 09.png — Safir Defne · KEEP

- **File:** [assets/cosmetics/raw/frames/09.png](../assets/cosmetics/raw/frames/09.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.68% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#B2893A` (16.6%), `#000000` (14.7%), `#E3C87C` (14.1%), `#BC9949` (10.5%), `#D5B56C` (9.0%). **Chromatic accents:** `#B79042`, `#4671B8`, `#783D09`, `#6EB4D3`.
- **Shape/style:** Round ivory/gold winged laurel with blue side stones and lower jewel. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_blue_gem_laurels`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Bright readable silhouette and good central clearance; select one representative from the 09/29/88 family.
- **Suggested rarity / price / name:** `prestige` / **3,400** / **Safir Defne** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.88%.

### 10.png — Bakır Devre · KEEP

- **File:** [assets/cosmetics/raw/frames/10.png](../assets/cosmetics/raw/frames/10.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (79.46% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040000` (27.9%), `#6E2E2F` (9.4%), `#480E0E` (7.7%), `#300309` (7.5%), `#501726` (6.7%). **Chromatic accents:** `#C78F2C`, `#8F4B2A`, `#692832`.
- **Shape/style:** Asymmetric brass circle with brown upper plate and small lower fittings. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `none (distinct within this batch)`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Good lightweight industrial/fantasy bridge; keep as a later alternative to the segmented bronze launch frame.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Bakır Devre** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 2.81%.

### 11.png — Altın Yörünge · MAYBE

- **File:** [assets/cosmetics/raw/frames/11.png](../assets/cosmetics/raw/frames/11.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.2% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010001` (37.7%), `#C69319` (10.5%), `#B47611` (10.4%), `#8C4A00` (7.0%), `#4F1002` (6.5%). **Chromatic accents:** `#BE8812`, `#7C2B03`, `#0A40D0`.
- **Shape/style:** Dark blue-edged gold ring with a broad gold crescent at the bottom. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_gold_laurels`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Lower mass dominates at 48px and repeats the gold-laurel offering; simpler 06 or clearer 09 is preferable at launch.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Altın Yörünge** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 3.12%.

### 12.png — Mor Akım · KEEP

- **File:** [assets/cosmetics/raw/frames/12.png](../assets/cosmetics/raw/frames/12.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (80.38% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#09020F` (18.5%), `#CB10CB` (7.6%), `#2C86F5` (7.3%), `#2B6ED7` (6.0%), `#1B51D9` (4.6%). **Chromatic accents:** `#215DD5`, `#BE0EB2`, `#930BAD`, `#251995`.
- **Shape/style:** Circular braided cyan/violet leaves with small pointed top and crossed base. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `none (distinct within this batch)`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — High separation on navy and a mostly open center; delivers energy color without a large face-blocking crest.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Mor Akım** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 1.12%.

### 13.png — Kafatası Nöbeti · MAYBE

- **File:** [assets/cosmetics/raw/frames/13.png](../assets/cosmetics/raw/frames/13.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (73.16% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050000` (27.1%), `#4C0404` (13.1%), `#D40000` (8.7%), `#280001` (7.5%), `#A8706F` (5.4%). **Chromatic accents:** `#AE0404`, `#75313D`, `#B7528D`.
- **Shape/style:** Red circular cord with two large pale skulls across the upper corners. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_skull_border`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Distinct dark-fantasy motif but skulls intrude near temples; reserve for larger-size testing, not the first selection.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Kafatası Nöbeti** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 12.25%.

### 14.png — Yosun Halkası · MAYBE

- **File:** [assets/cosmetics/raw/frames/14.png](../assets/cosmetics/raw/frames/14.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (82.94% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040200` (40.3%), `#31B004` (16.2%), `#51C901` (7.7%), `#391500` (6.0%), `#078600` (5.6%). **Chromatic accents:** `#34A603`, `#662302`, `#6FB70D`.
- **Shape/style:** Thin green round vine with broad leaf-like lower tips. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_leaf_borders`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Leaves form a readable outline, but the lower lobes compress the chin area; 04 offers a cleaner botanical launch shape.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Yosun Halkası** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 3.75%.

### 15.png — Çiçek Çelengi · MAYBE

- **File:** [assets/cosmetics/raw/frames/15.png](../assets/cosmetics/raw/frames/15.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (68.54% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060301` (23.9%), `#360501` (8.4%), `#296E01` (7.8%), `#531208` (7.2%), `#69BF07` (6.2%). **Chromatic accents:** `#378303`, `#9A2A14`, `#A33146`, `#69BF07`.
- **Shape/style:** Circular green vine with a dense pink/orange floral crown and curled base. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_pink_florals`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Top blooms crowd hair and turn into colored clusters at 48px; defer behind the lighter floral alternatives.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Çiçek Çelengi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 11.0%.

### 16.png — Bakır Kuşak · KEEP

- **File:** [assets/cosmetics/raw/frames/16.png](../assets/cosmetics/raw/frames/16.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (72.18% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030101` (23.4%), `#93310C` (16.5%), `#5B0800` (15.3%), `#B74B19` (12.5%), `#2A140A` (6.9%). **Chromatic accents:** `#90310D`, `#E3A43E`.
- **Shape/style:** Round bronze ring with stone-like top segments, top fastener and warm lower plates. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `none (distinct within this batch)`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Bold clean construction and open center; approachable metal option distinct from delicate gold rings.
- **Suggested rarity / price / name:** `standard` / **1,500** / **Bakır Kuşak** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 1.5%.

### 17.png — Bahar Penceresi · MAYBE

- **File:** [assets/cosmetics/raw/frames/17.png](../assets/cosmetics/raw/frames/17.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (58.51% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A0702` (16.9%), `#782B31` (10.9%), `#36090C` (7.6%), `#4F0E18` (5.8%), `#3B6F12` (5.4%). **Chromatic accents:** `#782C34`, `#3A7010`, `#6B9B1B`, `#AC5343`.
- **Shape/style:** Square wood/vine surround with thick pink flowers across top and bottom. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_pink_florals`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Useful square silhouette but dense petals squeeze the visible portrait; 93 provides a cleaner floral square.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Bahar Penceresi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 11.12%.

### 18.png — Köz Taşı · KEEP

- **File:** [assets/cosmetics/raw/frames/18.png](../assets/cosmetics/raw/frames/18.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.35% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040000` (25.6%), `#985A66` (8.3%), `#BB7879` (6.4%), `#EE2A01` (5.5%), `#E9C8B8` (4.9%). **Chromatic accents:** `#C32D0C`, `#7D2B3C`, `#F28D0B`.
- **Shape/style:** Thin asymmetrical rose-stone ring with orange glowing nodes near the upper right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_stone_orbits`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear open center and less repeated stonework than 20; preferred representative of this close pair for a later drop.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Köz Taşı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.5%.

### 19.png — Pembe Bahçe · REJECT

- **File:** [assets/cosmetics/raw/frames/19.png](../assets/cosmetics/raw/frames/19.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (61.72% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050302` (19.4%), `#D388A7` (15.9%), `#A53966` (10.9%), `#C5658A` (10.8%), `#B15473` (8.2%). **Chromatic accents:** `#AC4A6E`, `#3F820A`, `#50890D`, `#923F39`.
- **Shape/style:** Oval carpet of pink blossoms around a narrow opening. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_pink_florals`; **quality:** 2/5; **first release:** no.
- **Recommendation:** **REJECT** — Dense nearly continuous petals become noise at 48px and reduce portrait space; 17 or 93 offers clearer structure.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Pembe Bahçe** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 9.94%.

### 20.png — İkiz Köz Taşı · REJECT

- **File:** [assets/cosmetics/raw/frames/20.png](../assets/cosmetics/raw/frames/20.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (75.76% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040000` (25.8%), `#985B66` (8.1%), `#BA7879` (6.4%), `#F12901` (5.3%), `#C60F01` (5.0%). **Chromatic accents:** `#C32C0B`, `#7B2737`, `#F0890A`.
- **Shape/style:** Symmetric rose-stone ring with paired orange upper nodes and a segmented lower rim. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_stone_orbits`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Close visual alternate to 18 using the same stone/orange vocabulary; retain the lighter asymmetric representative, not both.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **İkiz Köz Taşı** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.88%.

### 21.png — Pembe Kanat · KEEP

- **File:** [assets/cosmetics/raw/frames/21.png](../assets/cosmetics/raw/frames/21.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (67.86% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000000` (14.3%), `#EF6DCC` (11.4%), `#EF095F` (10.1%), `#EC91D9` (8.8%), `#EFD3E8` (5.5%). **Chromatic accents:** `#E559B4`, `#D9115A`, `#F0B140`, `#D65D20`.
- **Shape/style:** Bright pink circular ring with white-pink wings concentrated below the face. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_pink_wings`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Adds a playful pastel prestige shape; the fully open face area matters more than strict cyberpunk styling.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Pembe Kanat** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.25%.

### 22.png — Bakır Köşe · KEEP

- **File:** [assets/cosmetics/raw/frames/22.png](../assets/cosmetics/raw/frames/22.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (78.92% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000000` (21.6%), `#C32430` (14.8%), `#8D251D` (10.6%), `#DF7438` (10.1%), `#C54524` (9.9%). **Chromatic accents:** `#C75629`, `#BE2531`, `#F3A839`.
- **Shape/style:** Thin orange/gold rectangular frame with small ridged corner details. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_warm_geometric`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Clear square opening and crisp simple border; an affordable angular alternative to circular rings.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Bakır Köşe** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.0%.

### 23.png — Kızıl Nişan · KEEP

- **File:** [assets/cosmetics/raw/frames/23.png](../assets/cosmetics/raw/frames/23.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (80.1% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040207` (29.2%), `#C32430` (21.1%), `#8D251D` (13.7%), `#C54524` (12.5%), `#EC7614` (6.8%). **Chromatic accents:** `#BD4E26`, `#BE2330`, `#F2A83D`.
- **Shape/style:** Red/gold four-lobed square surround with small top and bottom jewels. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_warm_geometric`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Distinct concave sides and open central face; reserve to avoid too many warm gold geometric shapes at launch.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Kızıl Nişan** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 24.png — Oyma Bakır · KEEP

- **File:** [assets/cosmetics/raw/frames/24.png](../assets/cosmetics/raw/frames/24.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.46% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#894836` (26.3%), `#BE6F4A` (20.3%), `#000000` (19.1%), `#ECAB50` (12.6%), `#5C2C28` (5.3%). **Chromatic accents:** `#A2593C`, `#EEAE4B`.
- **Shape/style:** Rounded square with carved copper/wood-like grain and small top flourish. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_carved_copper_square`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Useful earthy square silhouette with less border mass than 86; preferred member of that close family.
- **Suggested rarity / price / name:** `standard` / **1,400** / **Oyma Bakır** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.88%.

### 25.png — Buz Zırhı · MAYBE

- **File:** [assets/cosmetics/raw/frames/25.png](../assets/cosmetics/raw/frames/25.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (72.5% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#06040A` (27.8%), `#0069AA` (16.6%), `#0098DC` (15.1%), `#00396D` (11.5%), `#5D5D5D` (8.2%). **Chromatic accents:** `#006DAB`.
- **Shape/style:** Blue/black armoured shield with large top crest, side plates and lower gems. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_blue_armour`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Good cool silhouette, but plates occupy the temple area; substantially safer than 89 yet still needs portrait-specific fitting.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **Buz Zırhı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 12.75%.

### 26.png — Altın Filiz · REJECT

- **File:** [assets/cosmetics/raw/frames/26.png](../assets/cosmetics/raw/frames/26.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (80.48% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010001` (25.2%), `#ECAB50` (21.2%), `#FEC825` (10.7%), `#BE6F4A` (9.9%), `#894836` (7.6%). **Chromatic accents:** `#A75132`, `#F2B542`.
- **Shape/style:** Thin gold/orange circular laurel with small crest and low side leaves. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_gold_laurels`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Near-redundant with the clearer open laurel 69 and plain ring 06; do not add another almost identical gold-ring SKU.
- **Suggested rarity / price / name:** `standard` / **1,500** / **Altın Filiz** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 27.png — Bakır Defne · KEEP

- **File:** [assets/cosmetics/raw/frames/27.png](../assets/cosmetics/raw/frames/27.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (68.72% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#06030B` (28.5%), `#894836` (14.6%), `#BE6F4A` (12.7%), `#8D251D` (10.9%), `#C54524` (9.4%). **Chromatic accents:** `#AF5639`, `#1E6F50`, `#ECAB50`, `#33984B`.
- **Shape/style:** Oval orange/copper laurel with green lower leaves and a central crest. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_copper_laurels`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Warm earthy option with a readable silhouette; keep for a later drop rather than adding a second launch laurel.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Bakır Defne** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 28.png — Orman Ejderi · KEEP

- **File:** [assets/cosmetics/raw/frames/28.png](../assets/cosmetics/raw/frames/28.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (79.76% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060507` (29.6%), `#1E6F50` (7.8%), `#33984B` (6.0%), `#561C27` (5.9%), `#EC7614` (5.7%). **Chromatic accents:** `#B95C30`, `#1E6F50`, `#33984B`, `#5AC54F`.
- **Shape/style:** Thin green circular coil with an orange dragon head at upper right and pale lower curl. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_green_dragons`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Asymmetric organic silhouette and clear face center; avoid releasing similar green coils 58 and 80 alongside it.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Orman Ejderi** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 7.19%.

### 29.png — Kraliyet Safiri · KEEP

- **File:** [assets/cosmetics/raw/frames/29.png](../assets/cosmetics/raw/frames/29.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (68.64% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#B4B4B4` (17.3%), `#000000` (12.2%), `#858585` (12.2%), `#3002D9` (8.5%), `#894836` (8.0%). **Chromatic accents:** `#A66043`, `#3002D9`, `#EEAF4A`, `#0069AA`.
- **Shape/style:** Round ivory/gold leafy surround with large blue-gold lower emblem and small top crest. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_blue_gem_laurels`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Good premium art, but similar to 09; keep as a reserve upgrade, never bundle the whole 09/29/88 family in one drop.
- **Suggested rarity / price / name:** `prestige` / **3,800** / **Kraliyet Safiri** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 3.5%.

### 30.png — Çift İz · KEEP

- **File:** [assets/cosmetics/raw/frames/30.png](../assets/cosmetics/raw/frames/30.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.24% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#06030C` (32.3%), `#C32430` (16.7%), `#C54524` (10.7%), `#881E2B` (10.1%), `#E9323C` (9.2%). **Chromatic accents:** `#BC2632`, `#CD5020`, `#FCBC27`.
- **Shape/style:** Simple near-circular red/gold split bands with very small segmented joints. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_red_gold_rings`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Clear center, bright edge and low ornament density; stronger asymmetrical identity than the close 91 variant.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Çift İz** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.06%.

### 31.png — İnce Sarmaşık · KEEP

- **File:** [assets/cosmetics/raw/frames/31.png](../assets/cosmetics/raw/frames/31.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (82.04% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0B080E` (51.3%), `#5AC54F` (10.6%), `#33984B` (9.6%), `#894836` (7.8%), `#1E6F50` (5.5%). **Chromatic accents:** `#813E30`, `#5CC64F`, `#33984B`, `#1E6F50`.
- **Shape/style:** Thin oval brown vine interspersed with small dark green leaves. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_leaf_borders`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Open center and light border mass; useful later entry-level plant option, though green needs a dark-screen contrast check.
- **Suggested rarity / price / name:** `standard` / **1,200** / **İnce Sarmaşık** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 32.png — Gül Penceresi · MAYBE

- **File:** [assets/cosmetics/raw/frames/32.png](../assets/cosmetics/raw/frames/32.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (58.12% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A080D` (22.3%), `#C32430` (13.6%), `#561C27` (12.2%), `#F6CA9F` (10.0%), `#8D251D` (9.7%). **Chromatic accents:** `#B05B3F`, `#C32430`, `#1E6F50`, `#33984B`.
- **Shape/style:** Green square surround with four large red/cream flower clusters. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_floral_squares`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Distinct colors but corner blooms become heavy at 48px; prefer the cleaner yellow floral square 93 for launch.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Gül Penceresi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 8.0%.

### 33.png — Ametist Mühür · KEEP

- **File:** [assets/cosmetics/raw/frames/33.png](../assets/cosmetics/raw/frames/33.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (72.34% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060308` (24.1%), `#93388F` (11.6%), `#E59C69` (8.6%), `#8D251D` (6.6%), `#FEC825` (6.5%). **Chromatic accents:** `#B95F3C`, `#963A93`, `#FEC825`, `#881E2B`.
- **Shape/style:** Tall oval/shield of gold-edged violet panels with top gem and pointed shoulders. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_violet_gold_blades`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Clear gem-and-panel silhouette and adequate central opening; adds a vertical shape without a huge central crest.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **Ametist Mühür** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 4.62%.

### 34.png — Mor Örtü · MAYBE

- **File:** [assets/cosmetics/raw/frames/34.png](../assets/cosmetics/raw/frames/34.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (65.9% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030002` (17.4%), `#932C70` (13.3%), `#B8437E` (8.9%), `#AB367E` (6.6%), `#C74B78` (6.0%). **Chromatic accents:** `#982D73`, `#A84510`, `#B54168`, `#E9890D`.
- **Shape/style:** Purple draped circular border with long layered lower folds and angular top feathers. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_violet_drapes`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Lower fabric mass shrinks the portrait and details merge; 55 is the clearer asymmetric alternative.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Mor Örtü** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 3.88%.

### 35.png — Alev Siperi · KEEP

- **File:** [assets/cosmetics/raw/frames/35.png](../assets/cosmetics/raw/frames/35.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (67.18% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#07040A` (23.2%), `#881E2B` (18.1%), `#561C27` (15.9%), `#8D251D` (9.3%), `#C54524` (9.0%). **Chromatic accents:** `#AD4226`, `#962738`, `#622461`.
- **Shape/style:** Rounded rectangular red dragon border with broad top wings and warm lower corners. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragon_shields`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Strong shield alternative with clearer central space than 42/71; reserve rather than overfilling launch with red dragons.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Alev Siperi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.88%.

### 36.png — Dişli Nöbeti · MAYBE

- **File:** [assets/cosmetics/raw/frames/36.png](../assets/cosmetics/raw/frames/36.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (66.15% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A070D` (24.8%), `#858585` (14.3%), `#BE6F4A` (10.1%), `#391F21` (8.2%), `#894836` (7.9%). **Chromatic accents:** `#A35238`, `#ECAB50`.
- **Shape/style:** Copper/stone circle with stacked dark mechanical wheels on the upper right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_clockwork`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Interesting asymmetric machinery, but upper wheels intrude into the portrait; requires small-face overlap checks.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Dişli Nöbeti** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 10.31%.

### 37.png — Mavi Çiçek · KEEP

- **File:** [assets/cosmetics/raw/frames/37.png](../assets/cosmetics/raw/frames/37.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (68.52% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060607` (23.5%), `#1E6F50` (18.7%), `#33984B` (18.6%), `#5AC54F` (15.2%), `#134C4C` (6.7%). **Chromatic accents:** `#1E6F50`, `#33984B`, `#5AC54F`, `#0082C4`.
- **Shape/style:** Round green-leaf border with blue blossoms clustered at top and bottom. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_floral_squares`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Good cool botanical accent; hold behind 04 and 93 to avoid several simultaneous flower/leaf borders.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Mavi Çiçek** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 2.75%.

### 38.png — Çelik İz · KEEP

- **File:** [assets/cosmetics/raw/frames/38.png](../assets/cosmetics/raw/frames/38.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (82.16% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#06040A` (34.5%), `#5D5D5D` (19.1%), `#0069AA` (11.2%), `#3B3B3B` (9.4%), `#657392` (8.7%). **Chromatic accents:** `#0068A9`, `#10019A`.
- **Shape/style:** Thin slate/silver circular band with small blue upper accents and a faceted lower tip. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_silver_blue_lines`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Quiet, readable cool-neutral ring with a completely open center; strong low-cost alternative to gold.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Çelik İz** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.25%.

### 39.png — Kızıl Sarmaşık · MAYBE

- **File:** [assets/cosmetics/raw/frames/39.png](../assets/cosmetics/raw/frames/39.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.85% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040405` (21.1%), `#8D251D` (10.2%), `#33984B` (8.3%), `#393939` (8.0%), `#561C27` (7.5%). **Chromatic accents:** `#A23F2A`, `#A6212E`, `#33984B`, `#1E6F50`.
- **Shape/style:** Red/green ring with curved leaf segments and an asymmetric lower tendril. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_green_vines`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Clear enough, but closely repeats multiple green coils and red-green circles; defer for palette variety.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Kızıl Sarmaşık** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 8.25%.

### 40.png — Buz Ejderi · KEEP

- **File:** [assets/cosmetics/raw/frames/40.png](../assets/cosmetics/raw/frames/40.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.17% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050409` (25.5%), `#0098DC` (12.7%), `#424C6E` (11.0%), `#393939` (8.5%), `#657392` (8.5%). **Chromatic accents:** `#008FCB`, `#881E2B`.
- **Shape/style:** Asymmetric pale-blue dragon flowing down the right of a silver circular border. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_blue_dragons`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Clear bright contour, open eyes and distinct cool dragon silhouette; preferable to the denser mirrored 78.
- **Suggested rarity / price / name:** `legendary` / **5,200** / **Buz Ejderi** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 3.19%.

### 41.png — Altın Taç · KEEP

- **File:** [assets/cosmetics/raw/frames/41.png](../assets/cosmetics/raw/frames/41.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.9% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000000` (18.1%), `#B8740B` (9.3%), `#4E0A00` (8.6%), `#2E0200` (8.6%), `#8D4A05` (8.1%). **Chromatic accents:** `#B87B0F`, `#7F3507`.
- **Shape/style:** Gold shield/oval with a wing-like crest and broad lower ornamental base. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_warm_crests`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Readable ceremonial alternative; reserve because launch already has gold gems and a laurel.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Altın Taç** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 3.88%.

### 42.png — Kızıl Hüküm · REJECT

- **File:** [assets/cosmetics/raw/frames/42.png](../assets/cosmetics/raw/frames/42.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.6% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#08050A` (26.4%), `#881E2B` (24.3%), `#C32430` (20.5%), `#561C27` (8.5%), `#E9323C` (3.6%). **Chromatic accents:** `#AE2735`, `#AA472E`.
- **Shape/style:** Round red dragon crest with a large central head pointing down into the opening. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragon_shields`; **quality:** 2/5; **first release:** no.
- **Recommendation:** **REJECT** — The central snout crowds the forehead and face opening at small size; 35 gives a safer red-shield silhouette.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Kızıl Hüküm** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 11.75%.

### 43.png — Kızıl Kuyruk · KEEP

- **File:** [assets/cosmetics/raw/frames/43.png](../assets/cosmetics/raw/frames/43.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (84.17% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#08040C` (47.3%), `#C32430` (12.4%), `#E9323C` (7.0%), `#561C27` (6.0%), `#8D251D` (5.9%). **Chromatic accents:** `#C62733`, `#9F3D28`.
- **Shape/style:** Thin black/red circular coil with a pointed trailing flourish at lower right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_thin_red_coils`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Low border mass and distinct tail; good reserve, but weaker dark contrast than launch ring 30.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Kızıl Kuyruk** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 2.12%.

### 44.png — Altın Taş Yörüngesi · MAYBE

- **File:** [assets/cosmetics/raw/frames/44.png](../assets/cosmetics/raw/frames/44.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.19% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040000` (23.5%), `#E5AD06` (6.6%), `#8C6B69` (6.4%), `#E1CAAD` (5.4%), `#80515D` (5.4%). **Chromatic accents:** `#C08709`, `#692D15`, `#6E3647`.
- **Shape/style:** Thin gold circle with pale stone fittings and bright upper-right node. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_stone_orbits`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Very close construction to 18 with a warmer palette; defer rather than adding another stone-orbit variation.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Altın Taş Yörüngesi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.25%.

### 45.png — Mavi Altın İz · KEEP

- **File:** [assets/cosmetics/raw/frames/45.png](../assets/cosmetics/raw/frames/45.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.96% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#06030B` (27.7%), `#ECAB50` (17.0%), `#BE6F4A` (13.7%), `#894836` (11.2%), `#0069AA` (7.4%). **Chromatic accents:** `#9A553D`, `#EFB049`, `#0076B8`, `#1F02B8`.
- **Shape/style:** Fine blue-and-gold circle with small asymmetric lower leaf and top curl. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_silver_blue_lines`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear understated two-tone alternative; keep in reserve because launch already includes 06 and 38.
- **Suggested rarity / price / name:** `standard` / **1,400** / **Mavi Altın İz** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.56%.

### 46.png — Kızıl Kabuk · MAYBE

- **File:** [assets/cosmetics/raw/frames/46.png](../assets/cosmetics/raw/frames/46.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (67.28% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0C080D` (24.8%), `#8D251D` (14.3%), `#561C27` (12.8%), `#C54524` (11.7%), `#5C2C28` (9.8%). **Chromatic accents:** `#983E2B`, `#881E2B`.
- **Shape/style:** Broad red/brown rounded polygon with wing-like upper and lower bands. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragon_shields`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Thick bands and low dark contrast hide fine detail; less clear than the more open red borders.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Kızıl Kabuk** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 5.5%.

### 47.png — Köz Çemberi · KEEP

- **File:** [assets/cosmetics/raw/frames/47.png](../assets/cosmetics/raw/frames/47.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (81.26% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030000` (32.3%), `#2B0101` (14.7%), `#480102` (11.1%), `#CF1400` (7.9%), `#6B0300` (5.4%). **Chromatic accents:** `#A91A03`, `#FE8D00`, `#5D2329`.
- **Shape/style:** Angular round red/gold rim with small flame tips at the lower edge. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_flame_rims`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear center and readable flame shape; defer behind 100 so launch has one primary fire-rim option.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Köz Çemberi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.5%.

### 48.png — Gül Büyüsü · KEEP

- **File:** [assets/cosmetics/raw/frames/48.png](../assets/cosmetics/raw/frames/48.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.2% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030102` (25.1%), `#8D4E70` (10.6%), `#9A6384` (7.1%), `#E8CDC9` (6.6%), `#64314C` (5.5%). **Chromatic accents:** `#6F365C`, `#AC4268`, `#842815`.
- **Shape/style:** Thin pale-pink circular band with a large rose-like arcane curl at upper right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_pink_spell_orbits`; **quality:** 4/5; **first release:** yes.
- **Recommendation:** **KEEP** — Pastel asymmetry adds variety and remains readable; side ornament stays away from the central eye pair.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Gül Büyüsü** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 7.88%.

### 49.png — Bakır Hazine · MAYBE

- **File:** [assets/cosmetics/raw/frames/49.png](../assets/cosmetics/raw/frames/49.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (62.76% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0D0A0E` (27.0%), `#894836` (16.8%), `#5C2C28` (13.1%), `#BE6F4A` (7.1%), `#391F21` (6.4%). **Chromatic accents:** `#904F39`, `#EDAC4E`, `#622461`.
- **Shape/style:** Thick square copper blocks and purple circular corner stones. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_copper_gem_frames`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Solid square silhouette, but dense blocks dominate small portraits; 01 is a cleaner launch prestige square.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **Bakır Hazine** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 5.0%.

### 50.png — Ametist Devresi · KEEP

- **File:** [assets/cosmetics/raw/frames/50.png](../assets/cosmetics/raw/frames/50.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (72.19% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010000` (16.6%), `#290507` (10.5%), `#AB713A` (6.6%), `#663235` (5.4%), `#875348` (5.1%). **Chromatic accents:** `#8E5736`, `#CD9744`, `#663235`, `#66335A`.
- **Shape/style:** Asymmetric copper/gold circular band with purple stones and corner-like upper fitting. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_copper_gem_frames`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — More open and readable than 49; good later metal/gem alternative without taking a launch slot.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Ametist Devresi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.75%.

### 51.png — Boynuzlu Nöbet · KEEP

- **File:** [assets/cosmetics/raw/frames/51.png](../assets/cosmetics/raw/frames/51.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.5% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010000` (20.5%), `#BB7165` (10.1%), `#7A2637` (8.8%), `#D08665` (7.6%), `#36030C` (7.1%). **Chromatic accents:** `#832B3B`, `#B75F47`, `#DFA566`.
- **Shape/style:** Rose-copper oval with a large upper-left beast/skull motif and a thin opposite flourish. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_paired_beasts`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Asymmetry is clearer than doubled 94, but motif interpretation blurs at 48px; reserve pending close portrait pairing.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Boynuzlu Nöbet** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 4.75%.

### 52.png — Gri Defne · KEEP

- **File:** [assets/cosmetics/raw/frames/52.png](../assets/cosmetics/raw/frames/52.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (82.16% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#08060C` (44.2%), `#363636` (14.7%), `#5D5D5D` (12.7%), `#858585` (9.5%), `#B4B4B4` (6.2%). **Chromatic accents:** .
- **Shape/style:** Tall slate/silver oval laurel with a small pointed top crest. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `none (distinct within this batch)`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Clean cool-metal contour and fully open center; keeps the metal category from being entirely copper and gold.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Gri Defne** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.0%.

### 53.png — Bakır Tılsımlar · MAYBE

- **File:** [assets/cosmetics/raw/frames/53.png](../assets/cosmetics/raw/frames/53.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (67.38% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030000` (15.8%), `#CD240F` (10.0%), `#760B0C` (9.3%), `#912910` (9.0%), `#5F0907` (7.1%). **Chromatic accents:** `#AC3518`, `#760B0C`, `#E7A843`, `#472E79`.
- **Shape/style:** Copper/orange circular chain with purple medallions and a thick segmented right side. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_orb_chains`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Asymmetric side is bulky and beads read unevenly; 95 has clearer colored-orb rhythm.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Bakır Tılsımlar** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 3.75%.

### 54.png — Mor Boynuz · KEEP

- **File:** [assets/cosmetics/raw/frames/54.png](../assets/cosmetics/raw/frames/54.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (73.26% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060004` (34.6%), `#31012B` (8.7%), `#722969` (5.8%), `#9C4A8F` (5.7%), `#510849` (4.9%). **Chromatic accents:** `#903D86`, `#9D31A6`.
- **Shape/style:** Purple horned round/oval surround with paired curls and pointed sides. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_violet_horns`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Distinct dark-arcane option, but multiple inward points reduce breathing room; reserve behind launch 33.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Mor Boynuz** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 5.75%.

### 55.png — Mor Kanat · KEEP

- **File:** [assets/cosmetics/raw/frames/55.png](../assets/cosmetics/raw/frames/55.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.63% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040003` (24.0%), `#79237C` (12.4%), `#902B91` (10.4%), `#5E136A` (8.7%), `#A72DA3` (8.1%). **Chromatic accents:** `#7B2280`, `#B83DB1`, `#A54027`, `#8A2037`.
- **Shape/style:** Asymmetric violet feather/drape ring with a gold lower-right curl. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_violet_drapes`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Cleaner directional sweep than 34; keep for later, since launch already has two violet arcane shapes.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Mor Kanat** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 1.75%.

### 56.png — Zümrüt Geçit · KEEP

- **File:** [assets/cosmetics/raw/frames/56.png](../assets/cosmetics/raw/frames/56.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.12% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A090C` (25.8%), `#C32430` (16.2%), `#8D251D` (13.0%), `#561C27` (11.8%), `#33984B` (7.8%). **Chromatic accents:** `#B4222F`, `#91271E`, `#33984B`, `#1E6F50`.
- **Shape/style:** Thick round red/green segmented ring with two horizontal side bosses. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_red_green_gates`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Readable contrasting gate design and open center; choose it over close top/bottom variant 84 in any future drop.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Zümrüt Geçit** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 2.5%.

### 57.png — Kalp Nişanı · KEEP

- **File:** [assets/cosmetics/raw/frames/57.png](../assets/cosmetics/raw/frames/57.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (72.92% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#5D0711` (21.0%), `#9B3327` (15.6%), `#000000` (14.5%), `#711C03` (10.0%), `#81211D` (9.4%). **Chromatic accents:** `#A74126`, `#5D0711`.
- **Shape/style:** Warm copper oval/shield with a small heart crest and curled lower wings. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_warm_crests`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Friendly readable crest; reserve because 21 already covers playful prestige in launch.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Kalp Nişanı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 4.5%.

### 58.png — Yeşil Kıvrım · MAYBE

- **File:** [assets/cosmetics/raw/frames/58.png](../assets/cosmetics/raw/frames/58.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (81.19% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040403` (37.5%), `#991300` (6.0%), `#540800` (5.4%), `#670B00` (4.5%), `#270F0F` (3.9%). **Chromatic accents:** `#8F1F02`, `#C28E11`, `#228506`, `#85AD0A`.
- **Shape/style:** Thin green/orange dragon coil with a small upper-right head and dark lower arc. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_green_dragons`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Less ornate than 28 but very similar pose and palette; select one rather than stacking green dragons.
- **Suggested rarity / price / name:** `standard` / **1,500** / **Yeşil Kıvrım** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.25%.

### 59.png — Bakır Yakut · KEEP

- **File:** [assets/cosmetics/raw/frames/59.png](../assets/cosmetics/raw/frames/59.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.76% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030000` (19.1%), `#4F0902` (13.3%), `#A85413` (11.5%), `#974122` (10.2%), `#773014` (8.1%). **Chromatic accents:** `#934117`, `#D89531`, `#872464`, `#892D4E`.
- **Shape/style:** Warm copper oval with paired upper purple stones and curled lower points. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_copper_gem_frames`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear face area but familiar copper-gem role; reserve as a distinct oval rather than adding every gem variant.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Bakır Yakut** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.88%.

### 60.png — Gümüş Geçit · KEEP

- **File:** [assets/cosmetics/raw/frames/60.png](../assets/cosmetics/raw/frames/60.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.96% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040404` (29.5%), `#8F8991` (10.7%), `#ABA7AC` (10.0%), `#746F76` (9.6%), `#CECDCF` (8.8%). **Chromatic accents:** `#376EC7`, `#49B3FB`.
- **Shape/style:** Silver rounded-square frame with blue top/bottom stones and curled side fittings. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_silver_squircles`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — One of the strongest cool-metal noncircular shapes; clean opening and better clarity than the multi-stone 79.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Gümüş Geçit** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 3.25%.

### 61.png — Mor Hilal · MAYBE

- **File:** [assets/cosmetics/raw/frames/61.png](../assets/cosmetics/raw/frames/61.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.35% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000000` (18.7%), `#ECAB50` (12.1%), `#622461` (9.7%), `#93388F` (8.8%), `#BE6F4A` (6.2%). **Chromatic accents:** `#AA5330`, `#893587`, `#EEAE4C`, `#DB3FFD`.
- **Shape/style:** Asymmetric gold-edged purple circular blades with one broad upper-right panel. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_violet_gold_blades`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Close palette and point vocabulary to 33; defer so the first arcane group is not several gold-violet variants.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Mor Hilal** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 3.0%.

### 62.png — Döngü Tılsımı · MAYBE

- **File:** [assets/cosmetics/raw/frames/62.png](../assets/cosmetics/raw/frames/62.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.97% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030000` (18.1%), `#D47137` (8.1%), `#741B0C` (8.0%), `#93441D` (4.8%), `#B04F2A` (4.8%). **Chromatic accents:** `#AB4B23`, `#A12E57`, `#8C3BB8`, `#B83783`.
- **Shape/style:** Orange and magenta circular coils with large spiral beads around the rim. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_orb_chains`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Spirals merge at 48px and compete with the face; 95 supplies cleaner separate orbs.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Döngü Tılsımı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 5.06%.

### 63.png — Hasat Halkası · MAYBE

- **File:** [assets/cosmetics/raw/frames/63.png](../assets/cosmetics/raw/frames/63.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (75.12% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#020100` (22.4%), `#CD280F` (13.1%), `#460502` (9.6%), `#6C0803` (9.3%), `#A40C0C` (6.6%). **Chromatic accents:** `#AD1C0C`, `#718825`, `#951721`, `#BB8139`.
- **Shape/style:** Thin red/green vine with a dense lime cluster and orange pendant at right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_green_vines`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Colorful but top-right cluster reads unclearly at small size; weaker choice than the cleaner leaf frame 04.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Hasat Halkası** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 1.25%.

### 64.png — Boynuzlu Taç · MAYBE

- **File:** [assets/cosmetics/raw/frames/64.png](../assets/cosmetics/raw/frames/64.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (70.62% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#020101` (17.4%), `#D0870A` (7.9%), `#521305` (7.1%), `#2B0A07` (6.4%), `#8C7276` (6.0%). **Chromatic accents:** `#9E2E05`, `#CE8311`.
- **Shape/style:** Gold/silver shield with large horns and layered top and bottom plates. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `none (distinct within this batch)`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — High silhouette variety, but heavy forehead ornament compresses the face opening; exclude from first release.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **Boynuzlu Taç** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 10.38%.

### 65.png — Gümüş Kafatası · MAYBE

- **File:** [assets/cosmetics/raw/frames/65.png](../assets/cosmetics/raw/frames/65.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.39% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A070F` (41.2%), `#C32430` (9.8%), `#391F21` (6.2%), `#858585` (5.9%), `#E9323C` (5.4%). **Chromatic accents:** `#C32733`, `#8A251E`.
- **Shape/style:** Thin red/black circle with one large silver skull on the upper right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_skull_border`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Skull creates a strong hook but intrudes at the temple and dark ring fades on navy; reserve for pairing tests.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Gümüş Kafatası** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 9.88%.

### 66.png — Çiçek Kanadı · KEEP

- **File:** [assets/cosmetics/raw/frames/66.png](../assets/cosmetics/raw/frames/66.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (58.92% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#CA0B1D` (11.9%), `#000000` (11.3%), `#E395AA` (8.3%), `#DA7092` (7.4%), `#F0C8CE` (6.6%). **Chromatic accents:** `#C13658`, `#DA623D`.
- **Shape/style:** Pink/red circle with paired pale wings and orange flowers at top and bottom. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_pink_wings`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Readable but close pastel-wing role to 21; keep as a later alternative, not a simultaneous launch companion.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Çiçek Kanadı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.75%.

### 67.png — Altın Pencere · KEEP

- **File:** [assets/cosmetics/raw/frames/67.png](../assets/cosmetics/raw/frames/67.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.76% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#000000` (19.4%), `#742B00` (14.4%), `#F0B204` (12.8%), `#D3910A` (10.6%), `#954B01` (9.5%). **Chromatic accents:** `#CF8E05`, `#843400`.
- **Shape/style:** Gold rounded-square border with curled corner plaques and an oval opening. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_gold_squares`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clean ceremonial square; useful reserve, but too similar in color and role to launch 01 and 22.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Altın Pencere** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 68.png — Güneş Nişanı · KEEP

- **File:** [assets/cosmetics/raw/frames/68.png](../assets/cosmetics/raw/frames/68.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.94% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010000` (20.8%), `#550400` (16.4%), `#741305` (10.5%), `#932D03` (8.5%), `#E79910` (7.2%). **Chromatic accents:** `#8F2807`, `#E39010`.
- **Shape/style:** Gold rounded-square ring with a ray-like top crest and lower scrolls. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_gold_squares`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Distinct sun crest but repeats the warm geometric family; reserve to protect first-release shape/color balance.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Güneş Nişanı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.0%.

### 69.png — İnce Defne · KEEP

- **File:** [assets/cosmetics/raw/frames/69.png](../assets/cosmetics/raw/frames/69.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (75.87% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#080608` (31.2%), `#ECAB50` (16.2%), `#BE6F4A` (9.5%), `#894836` (9.1%), `#391F21` (7.0%). **Chromatic accents:** `#A95434`, `#F2B241`.
- **Shape/style:** Open circular gold laurel made from evenly spaced narrow leaves. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_gold_laurels`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Crisper open leaf rhythm than 26; good future entry-level prestige motif, not another launch gold ring.
- **Suggested rarity / price / name:** `standard` / **1,500** / **İnce Defne** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 70.png — İkiz Astral · REJECT

- **File:** [assets/cosmetics/raw/frames/70.png](../assets/cosmetics/raw/frames/70.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (66.94% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010101` (16.4%), `#D7B982` (10.9%), `#D7C2B7` (5.2%), `#2C0B03` (5.0%), `#5A92CC` (4.7%). **Chromatic accents:** `#3961BA`, `#742E0D`, `#896231`, `#3422A5`.
- **Shape/style:** Blue/gold circular arcs and dense white filigree with two radial blue medallions. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_blue_white_arcana`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Close doubled variant of 07; extra medallion and filigree add noise at 48px without a sufficiently different identity.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **İkiz Astral** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 5.69%.

### 71.png — Kızıl Kıvrımlı Siper · REJECT

- **File:** [assets/cosmetics/raw/frames/71.png](../assets/cosmetics/raw/frames/71.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (74.92% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040102` (31.1%), `#920414` (13.5%), `#B40E18` (13.4%), `#6D020B` (13.1%), `#4E0106` (7.5%). **Chromatic accents:** `#970A15`, `#CD1615`.
- **Shape/style:** Rounded red/black rectangle with dense upper wings and large inward lower curls. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragon_shields`; **quality:** 2/5; **first release:** no.
- **Recommendation:** **REJECT** — Lower curls crowd the chin and the dark border becomes a heavy block; 35 is a more open shield option.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Kızıl Kıvrımlı Siper** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 12.38%.

### 72.png — Mor Diken · MAYBE

- **File:** [assets/cosmetics/raw/frames/72.png](../assets/cosmetics/raw/frames/72.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.58% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#09050F` (42.8%), `#93388F` (21.2%), `#622461` (12.8%), `#3B1443` (11.4%), `#CA52C9` (10.0%). **Chromatic accents:** `#91388F`.
- **Shape/style:** Purple oval border with clustered thorn-like crests at top and bottom. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_violet_horns`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Recognizable but top/bottom spikes reduce headroom; do not release the entire 54/72/74 family together.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Mor Diken** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 5.0%.

### 73.png — İkiz Kızıl Kanat · MAYBE

- **File:** [assets/cosmetics/raw/frames/73.png](../assets/cosmetics/raw/frames/73.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (70.52% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#08050B` (27.3%), `#C32430` (27.3%), `#881E2B` (16.2%), `#561C27` (13.2%), `#8D251D` (9.1%). **Chromatic accents:** `#B2232F`, `#8D251D`.
- **Shape/style:** Round red wing ring with matching top and bottom horned clasps. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragons`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Geometrically open center, yet duplicates the red dragon vocabulary; lower clasp dominates the small silhouette.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **İkiz Kızıl Kanat** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 0.0%.

### 74.png — Mor İkiz Boynuz · REJECT

- **File:** [assets/cosmetics/raw/frames/74.png](../assets/cosmetics/raw/frames/74.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.76% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060004` (32.0%), `#722A69` (8.2%), `#9C4B8E` (8.2%), `#300129` (6.6%), `#B14BAE` (4.6%). **Chromatic accents:** `#903F85`, `#A945B1`.
- **Shape/style:** Tall violet horned oval with paired inward curls and pointed sides. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_violet_horns`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Very close composition to 54 with more cramped vertical ornament; keep one representative of this family.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Mor İkiz Boynuz** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 6.5%.

### 75.png — Dört Altın Gül · MAYBE

- **File:** [assets/cosmetics/raw/frames/75.png](../assets/cosmetics/raw/frames/75.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.48% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050000` (19.3%), `#742601` (12.1%), `#AA590E` (10.2%), `#521000` (9.2%), `#873B18` (8.3%). **Chromatic accents:** `#8C3D10`, `#CA832B`.
- **Shape/style:** Rounded gold square with four large scroll or rose-like corner bosses. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_gold_squares`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Corner mass becomes chunky at 48px; 67 offers a lighter gold square if this family expands later.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Dört Altın Gül** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 3.5%.

### 76.png — Kızıl Zincir · REJECT

- **File:** [assets/cosmetics/raw/frames/76.png](../assets/cosmetics/raw/frames/76.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (81.71% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A060D` (39.6%), `#881E2B` (15.3%), `#C32430` (11.9%), `#E9323C` (10.0%), `#8D251D` (7.7%). **Chromatic accents:** `#B52531`, `#86261F`.
- **Shape/style:** Simple dark red circular coil with an upper-right ridged segment. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_thin_red_coils`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Close small-size role to 43, with weaker tail/silhouette differentiation; reject as a redundant red-ring slot.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Kızıl Zincir** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.88%.

### 77.png — Bakır Saat · KEEP

- **File:** [assets/cosmetics/raw/frames/77.png](../assets/cosmetics/raw/frames/77.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (68.07% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050201` (22.8%), `#4D292A` (8.7%), `#603A37` (7.9%), `#4D0C0B` (6.7%), `#881A0A` (5.8%). **Chromatic accents:** `#A42106`, `#F08E00`, `#431E62`, `#933C3E`.
- **Shape/style:** Asymmetric bronze ring with a restrained upper-right gear and warm lower-left plating. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_clockwork`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — More distinct and less obstructive than 36/82; preferred clockwork reserve after the initial clean metal group.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Bakır Saat** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 6.12%.

### 78.png — İkiz Buz Ejderi · REJECT

- **File:** [assets/cosmetics/raw/frames/78.png](../assets/cosmetics/raw/frames/78.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (72.74% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030305` (22.2%), `#3B8FCB` (12.3%), `#3779B3` (9.8%), `#365785` (8.6%), `#68C4D0` (8.1%). **Chromatic accents:** `#4390BA`, `#345C91`, `#78E5BC`, `#4EA86E`.
- **Shape/style:** Mirrored blue dragon sides around a round opening with a heavy lower curl. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_blue_dragons`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Very close to 40's blue-dragon identity; doubled sides reduce face space and variety, so keep the asymmetric version.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **İkiz Buz Ejderi** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 6.12%.

### 79.png — Gümüş Bağlantı · MAYBE

- **File:** [assets/cosmetics/raw/frames/79.png](../assets/cosmetics/raw/frames/79.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (73.7% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#040404` (29.0%), `#8F8991` (10.5%), `#CECDCF` (9.4%), `#ABA7AB` (9.1%), `#746F75` (8.7%). **Chromatic accents:** `#927427`, `#346DC6`, `#4AB4FC`.
- **Shape/style:** Silver rounded square with three small upper gold nodes and a blue lower stone. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_silver_squircles`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Same structural family as 60 with busier top fittings; reserve rather than launching both silver squircles.
- **Suggested rarity / price / name:** `prestige` / **3,000** / **Gümüş Bağlantı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 6.62%.

### 80.png — Yeşil Ejder İzi · MAYBE

- **File:** [assets/cosmetics/raw/frames/80.png](../assets/cosmetics/raw/frames/80.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.23% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060507` (25.5%), `#5AC54F` (21.5%), `#1E6F50` (16.1%), `#33984B` (13.3%), `#134C4C` (4.4%). **Chromatic accents:** `#5FC850`, `#1E6F50`, `#33984B`, `#B55623`.
- **Shape/style:** Bright green circular coil with a long blue-green creature along the right edge. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_green_dragons`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Good color separation but overlaps 28's green-dragon role; side detail gets busy at 48px.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Yeşil Ejder İzi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 2.06%.

### 81.png — Orman Tılsımı · MAYBE

- **File:** [assets/cosmetics/raw/frames/81.png](../assets/cosmetics/raw/frames/81.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (66.67% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0C090D` (28.6%), `#1E6F50` (10.5%), `#391F21` (9.7%), `#5C2C28` (8.6%), `#ECAB50` (5.0%). **Chromatic accents:** `#884131`, `#1E6F50`, `#ECAB50`, `#33984B`.
- **Shape/style:** Dark green/red circular vines with pale ornament at top-left and orange lower-right figure. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_green_vines`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Peripheral motifs are hard to identify at small size and dark vines lose contrast; not a launch priority.
- **Suggested rarity / price / name:** `advanced` / **2,000** / **Orman Tılsımı** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 8.75%.

### 82.png — Altın Dişli · MAYBE

- **File:** [assets/cosmetics/raw/frames/82.png](../assets/cosmetics/raw/frames/82.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.45% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030000` (20.8%), `#964804` (10.8%), `#DA8F14` (9.7%), `#B3690A` (8.1%), `#561104` (7.9%). **Chromatic accents:** `#853309`, `#C77C0A`.
- **Shape/style:** Thin gold circle with a tall stack of golden gears along the upper right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_clockwork`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Bright readable ring, but gears intrude near the temple; 77 is the better-balanced clockwork reserve.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Altın Dişli** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 10.06%.

### 83.png — Pembe Tılsım · KEEP

- **File:** [assets/cosmetics/raw/frames/83.png](../assets/cosmetics/raw/frames/83.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (70.53% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#050001` (22.3%), `#911417` (9.2%), `#700C0F` (6.3%), `#8B1559` (5.4%), `#4A0204` (5.4%). **Chromatic accents:** `#A92384`, `#BC3A1A`, `#7C0F1D`, `#E19606`.
- **Shape/style:** Orange/magenta circular ring with an upper-left flower and lower-right violet flourish. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_pink_spell_orbits`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear asymmetric spell motif; reserve as an alternative to the lighter pink 48, not an extra launch near-neighbor.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Pembe Tılsım** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 4.56%.

### 84.png — Zümrüt Kilit · REJECT

- **File:** [assets/cosmetics/raw/frames/84.png](../assets/cosmetics/raw/frames/84.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (70.54% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#0A090C` (26.7%), `#8D251D` (12.7%), `#C32430` (11.8%), `#33984B` (9.6%), `#561C27` (9.4%). **Chromatic accents:** `#B2222F`, `#90281E`, `#33984B`, `#1E6F50`.
- **Shape/style:** Round red/green segmented gate with enlarged top and bottom bosses. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_red_green_gates`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Near-redundant with 56's same palette and ring construction; extra vertical bosses reduce portrait headroom.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Zümrüt Kilit** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 4.25%.

### 85.png — Alev Ejderi · KEEP

- **File:** [assets/cosmetics/raw/frames/85.png](../assets/cosmetics/raw/frames/85.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (67.47% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#020000` (21.3%), `#6A1017` (12.6%), `#4D040F` (7.3%), `#280404` (7.2%), `#AB0B05` (6.9%). **Chromatic accents:** `#8A1E28`, `#B63115`, `#DE9E29`.
- **Shape/style:** Asymmetric crimson dragon ring with a large orange horned head at upper right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_red_dragons`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Strong dragon silhouette and clear central eyes; reserve for a later premium fire-themed drop rather than crowding launch reds.
- **Suggested rarity / price / name:** `prestige` / **3,400** / **Alev Ejderi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 8.5%.

### 86.png — Kalın Bakır Oyma · REJECT

- **File:** [assets/cosmetics/raw/frames/86.png](../assets/cosmetics/raw/frames/86.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.64% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#752B01` (19.7%), `#000000` (17.8%), `#934402` (15.4%), `#AD5705` (13.2%), `#530907` (8.7%). **Chromatic accents:** `#8D3C03`, `#BB6602`, `#5B0102`.
- **Shape/style:** Thick copper/wood-like rounded square with matching carved top and bottom ridges. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_carved_copper_square`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Very close to 24 but with heavier borders and less opening; keep the lighter carved-square representative.
- **Suggested rarity / price / name:** `standard` / **1,400** / **Kalın Bakır Oyma** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.75%.

### 87.png — Gece Çiçekleri · KEEP

- **File:** [assets/cosmetics/raw/frames/87.png](../assets/cosmetics/raw/frames/87.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (75.0% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010101` (25.5%), `#9648AF` (6.8%), `#730707` (6.3%), `#0D096C` (5.1%), `#5D21B9` (4.7%). **Chromatic accents:** `#9C47B2`, `#941907`, `#371394`, `#620F17`.
- **Shape/style:** Thin blue/orange circular arcs with pale pink upper flowers and small inner side blooms. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_pink_spell_orbits`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Distinct cool/pastel combination; small inward flowers need pairing checks, so reserve behind launch 48.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **Gece Çiçekleri** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 4.25%.

### 88.png — Uzun Safir Defne · REJECT

- **File:** [assets/cosmetics/raw/frames/88.png](../assets/cosmetics/raw/frames/88.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (66.66% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#B4B4B4` (20.6%), `#030304` (14.3%), `#858585` (13.6%), `#ECAB50` (8.9%), `#5D5D5D` (8.5%). **Chromatic accents:** `#9A5135`, `#ECAB50`, `#3302DA`, `#0069AA`.
- **Shape/style:** Tall ivory/gold laurel oval with blue-gold top and bottom emblems. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_blue_gem_laurels`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Close elongated variant of 29 and 09; tall repeated emblems add little launch variety and take more portrait space.
- **Suggested rarity / price / name:** `prestige` / **3,400** / **Uzun Safir Defne** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 3.12%.

### 89.png — Kapalı Buz Zırhı · REJECT

- **File:** [assets/cosmetics/raw/frames/89.png](../assets/cosmetics/raw/frames/89.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.42% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#08050D` (34.8%), `#0069AA` (17.4%), `#0098DC` (14.6%), `#393939` (12.6%), `#424C6E` (10.8%). **Chromatic accents:** `#007EC1`.
- **Shape/style:** Blue/black circular armour packed with inward plates and a large lower crest. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_blue_armour`; **quality:** 2/5; **first release:** no.
- **Recommendation:** **REJECT** — Highest central opacity in the set; thick inward plates crowd both temples and lower face. Prefer the less closed 25 only after fitting.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **Kapalı Buz Zırhı** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Inward ornament substantially crowds head/temple/chin space; not a first-release choice. Face-space risk: high; central-square opacity: 19.5%.

### 90.png — Kızıl Altın Kuşak · KEEP

- **File:** [assets/cosmetics/raw/frames/90.png](../assets/cosmetics/raw/frames/90.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (81.36% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#07050A` (33.5%), `#561C27` (11.6%), `#391F21` (8.5%), `#C54524` (8.4%), `#8D251D` (8.2%). **Chromatic accents:** `#AA452D`, `#F5B236`, `#A2212E`.
- **Shape/style:** Thin orange upper ring with red articulated plates along the lower half. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `none (distinct within this batch)`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Clear eye region and strong simple split material; keep as a later warm-metal option.
- **Suggested rarity / price / name:** `standard` / **1,400** / **Kızıl Altın Kuşak** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 4.88%.

### 91.png — Dört İz · REJECT

- **File:** [assets/cosmetics/raw/frames/91.png](../assets/cosmetics/raw/frames/91.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (75.44% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#08040F` (37.2%), `#E9323C` (17.2%), `#FEC825` (8.5%), `#C54524` (7.2%), `#C32430` (6.8%). **Chromatic accents:** `#D52C37`, `#D6571F`, `#FBB728`.
- **Shape/style:** Symmetric red/gold circular bands divided by four small joints. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_red_gold_rings`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Very close to 30 at 48px; choose the more distinctive asymmetrical band treatment instead of near-identical inventory entries.
- **Suggested rarity / price / name:** `standard` / **1,000** / **Dört İz** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.0%.

### 92.png — Bakır Burgu · KEEP

- **File:** [assets/cosmetics/raw/frames/92.png](../assets/cosmetics/raw/frames/92.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (76.86% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#020000` (23.1%), `#300507` (12.1%), `#540B08` (8.8%), `#6F152B` (8.3%), `#D44C08` (4.8%). **Chromatic accents:** `#A03B1C`, `#8E2C45`, `#DD9A1B`, `#700F43`.
- **Shape/style:** Thin warm gold/red circle with small paired rose-like diagonal coils. Style family: pixel-art ornamental fantasy frame.
- **Category:** Minimal; **similarity group:** `frame_thin_red_coils`; **quality:** 4/5; **first release:** no.
- **Recommendation:** **KEEP** — Open readable face and restrained ornament; reserve to avoid another warm circular launch frame.
- **Suggested rarity / price / name:** `standard` / **1,200** / **Bakır Burgu** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.94%.

### 93.png — Altın Çiçek · KEEP

- **File:** [assets/cosmetics/raw/frames/93.png](../assets/cosmetics/raw/frames/93.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (69.32% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030100` (26.5%), `#EDB535` (5.5%), `#6F0E0A` (5.5%), `#510B03` (5.1%), `#92360D` (5.0%). **Chromatic accents:** `#98401A`, `#E1A92D`, `#288301`, `#8FB60B`.
- **Shape/style:** Thin rectangular vine with four yellow-orange flower clusters and small green leaves. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_floral_squares`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Square floral variety with better opening and petal separation than 17/19/32; suitable first botanical companion to 04.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Altın Çiçek** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 4.25%.

### 94.png — İkiz Boynuz Nöbeti · REJECT

- **File:** [assets/cosmetics/raw/frames/94.png](../assets/cosmetics/raw/frames/94.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (68.93% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030000` (20.9%), `#57020B` (11.3%), `#AC4C32` (9.3%), `#8A2C1E` (8.8%), `#6B0F11` (8.1%). **Chromatic accents:** `#B85435`, `#75121B`, `#F0AD63`.
- **Shape/style:** Rose-copper ring with two matching large beast/skull heads across the upper corners. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_paired_beasts`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **REJECT** — Doubled variant of 51's motif; paired heads crowd temples and make the same family less readable rather than more varied.
- **Suggested rarity / price / name:** `advanced` / **2,200** / **İkiz Boynuz Nöbeti** (hypothetical only; do not list).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 8.81%.

### 95.png — Ametist Yörünge · KEEP

- **File:** [assets/cosmetics/raw/frames/95.png](../assets/cosmetics/raw/frames/95.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.58% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#060101` (21.8%), `#4C0502` (7.7%), `#63100E` (7.2%), `#B35126` (6.0%), `#2A010C` (4.9%). **Chromatic accents:** `#A94E2E`, `#9A208D`, `#A8324A`, `#C52AC7`.
- **Shape/style:** Open circular copper chain with separated magenta orbs of varied sizes. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_orb_chains`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Distinct bead/orbit silhouette and bright accents, with less clutter than 53/62; good non-leaf arcane choice.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Ametist Yörünge** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 1.94%.

### 96.png — Yeşil Mühür · MAYBE

- **File:** [assets/cosmetics/raw/frames/96.png](../assets/cosmetics/raw/frames/96.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (73.38% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#030203` (20.3%), `#8D251D` (11.9%), `#33984B` (9.1%), `#C32430` (8.8%), `#C54524` (8.6%). **Chromatic accents:** `#A23B27`, `#A8212E`, `#33984B`, `#1E6F50`.
- **Shape/style:** Red/green ring with an enlarged upper crest and curved lower side fittings. Style family: pixel-art ornamental fantasy frame.
- **Category:** Arcane; **similarity group:** `frame_red_green_gates`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Adequate central clearance but same red-green gate niche as 56/84; hold instead of adding another palette clone.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Yeşil Mühür** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 1.38%.

### 97.png — Taş Çemberi · MAYBE

- **File:** [assets/cosmetics/raw/frames/97.png](../assets/cosmetics/raw/frames/97.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (72.4% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#070001` (25.4%), `#BB7879` (8.1%), `#985A66` (6.7%), `#C78F8D` (6.1%), `#74414E` (5.9%). **Chromatic accents:** `#A62D18`, `#7D3246`, `#F5930F`.
- **Shape/style:** Even circular chain of pale rose stones and orange nodes. Style family: pixel-art ornamental fantasy frame.
- **Category:** Metal; **similarity group:** `frame_stone_orbits`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Open but evenly repeated stones become speckled at 48px; 18 offers a clearer asymmetric focal point.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Taş Çemberi** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Opening is comparatively clear; actual avatar pairing still required before integration. Face-space risk: low; central-square opacity: 0.25%.

### 98.png — Hasat Tacı · KEEP

- **File:** [assets/cosmetics/raw/frames/98.png](../assets/cosmetics/raw/frames/98.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (77.18% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#020100` (24.4%), `#2E0401` (13.4%), `#510900` (8.2%), `#B61400` (6.8%), `#BFAD24` (6.1%). **Chromatic accents:** `#9B2001`, `#A5830D`, `#878F03`.
- **Shape/style:** Gold/olive laurel shield with red top jewel and orange lower leaves. Style family: pixel-art ornamental fantasy frame.
- **Category:** Prestij; **similarity group:** `frame_copper_laurels`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Distinct tapered ceremonial silhouette and earthy palette; complements the blue-gem round laurel without repeating it.
- **Suggested rarity / price / name:** `prestige` / **3,200** / **Hasat Tacı** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 1.38%.

### 99.png — Çiçekli Yörünge · MAYBE

- **File:** [assets/cosmetics/raw/frames/99.png](../assets/cosmetics/raw/frames/99.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (67.94% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#010101` (14.3%), `#CF8EB4` (6.4%), `#531B6A` (6.1%), `#D3B4C7` (5.7%), `#B73C00` (4.4%). **Chromatic accents:** `#A23614`, `#903D7B`, `#3D781B`, `#582173`.
- **Shape/style:** Brown/blue circular band with pink blossoms clustered at upper left and lower right. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_pink_florals`; **quality:** 3/5; **first release:** no.
- **Recommendation:** **MAYBE** — Lighter than 19 but petals still lose separation at 48px; keep as a later floral alternate, not another first-release cluster.
- **Suggested rarity / price / name:** `advanced` / **1,800** / **Çiçekli Yörünge** (recommendation only).
- **Fit / risks:** Checked over a neutral face at 96px and 48px. Peripheral ornament or density needs portrait-specific confirmation. Face-space risk: medium; central-square opacity: 5.5%.

### 100.png — Kor Kuşak · KEEP

- **File:** [assets/cosmetics/raw/frames/100.png](../assets/cosmetics/raw/frames/100.png); **type:** `avatar_frame`; **dimensions:** 100×100; **has transparency:** yes (71.5% fully transparent; 0.0% partial alpha).
- **Dominant foreground colors:** `#070409` (24.2%), `#5C2C28` (13.1%), `#C54524` (10.7%), `#8D251D` (10.4%), `#391F21` (10.1%). **Chromatic accents:** `#993821`, `#A9212E`, `#FEA214`.
- **Shape/style:** Round ring with clear orange flame tips above a dark brown metal lower band. Style family: pixel-art ornamental fantasy frame.
- **Category:** Elemental; **similarity group:** `frame_flame_rims`; **quality:** 5/5; **first release:** yes.
- **Recommendation:** **KEEP** — Strong two-part fire/metal silhouette, fully clear center and minimal face competition; best launch fire-rim choice.
- **Suggested rarity / price / name:** `advanced` / **2,400** / **Kor Kuşak** (recommendation only).
- **Fit / risks:** Selected: central eyes remained visible in approximate current-geometry composites with Icon3, Icon12 and Icon30 at 72px and 48px. Hair/ear overlap still varies by portrait. Face-space risk: low; central-square opacity: 0.0%.

## Validation and unchanged scope

- All 148 files decoded successfully and received a complete recommendation record; no files were skipped.
- JSON IDs and paths are unique; first-release references resolve to KEEP assets; counts and category/rarity totals match this report.
- Every proposed price falls inside the supplied rarity/type range; rejected prices are explicitly hypothetical.
- File and decoded-pixel hashes show no exact duplicates. All raw asset hashes and all existing `app/`, `src/`, package and lockfile hashes match their pre-audit values.
- No source assets moved, renamed, copied into live folders, edited or deleted. Temporary contact sheets are derived inspection views, not new store assets.
- No catalog, current prices, purchase/equip/inventory logic, persistence, economy, Supabase, auth, cloud save or profile rendering changes.
- Application build tests were not rerun: this change contains only a Markdown report and JSON audit data, with no application imports or runtime modifications.

Machine-readable companion: [cosmetic-asset-audit.json](../assets/cosmetics/cosmetic-asset-audit.json).
