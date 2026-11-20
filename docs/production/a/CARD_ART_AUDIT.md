# Card art audit — Agent A

Status: **GENERATED_REVIEW**. Nothing here is QA_PASSED, OWNER_APPROVED, LOCKED, or PRODUCTION_READY.

Base: `prod/wave-base` @ `7cbf071`. Branch: `prod/a-card-art`. Fragment: `web/manifests/cards.json`. The live manifest `web/assets-manifest.json` was not edited.

## How the 30-card starter was chosen

`content/v05/decks/demo-mixed-deck.json` is the published starter. `web/js/content-catalog.js` exposes it as `starterDeckIds`.

| Field | Value |
|---|---|
| Deck id | `DECK_DEMO_MIXED_001` |
| Slots | 30 (CORE-009) |
| Unique card ids | 14 |
| Why duplicates | CORE-040 (max copies) is PENDING_OWNER. The file allows repeats. |

`web/js/sample-catalog.js` still has a separate 30-id list (`STARTER_DECK_LIST`, ids `ACT_SAMPLE_*`). That list is the fallback used only when the v05 catalog is absent. The app loads v05, so those sample ids are not the starter and were not illustrated. No card, stat, cost, or skill was invented.

Illustrations are one subject per unique card id. The 30 slots reuse those 14 subjects.

## Existing art this audit checked

- `web/assets/illustrations`, `web/assets/frames`, `web/assets/icons`, `web/assets/badges`
- `web/assets/generated` (Dream stills, frames, icons)
- `web/assets-manifest.json` bindings and `frameInsets`
- PR #1 `feat/card-art-prototype-mira` (four avatar prototype, not on this branch)
- PR #10 `feat/pixel-animation-v2` (animation strips, not card stills)
- PR #14 `polish/card-art-v2` (v2 card paintings, not on this branch)
- PR #17 `art/dream-v01-drop` (approved reference cards, not copied onto this branch)
- PR #22 `art/dream-v02-drop` (action scenes bound on this branch)
- PR #23 `art/dream-v03-drop` (phase-3 pack; four UI PNGs marked REVIEW_FIX_NEEDED, SVG preferred)

Owner-approved full-card PNGs (`REF_CARD_*`, Dream reference cards) stay reference-only. They are not registered as card faces.

Style used for new subjects: the painterly comedic-fantasy stills already on this branch (`web/assets/generated/avatars/AVT_AEG_002.webp` and the Dream action scenes). New frames follow that same metal-window silhouette, with the red/yellow chroma matte removed.

## Action cards — the starter deck

Effect specs in `starter-actions.json` are the string `placeholder`. Costs and names below are the published fields. The face renderer (`playerFacingName`) hides the word "Placeholder" on the card; the data strings are unchanged.

| Card id | Copies | Published name | Type | Rarity | AP | Faction | Existing art | Quality | Defect or missing | This stream |
|---|---:|---|---|---|---:|---|---|---|---|---|
| ACT_GEN_ATK_001 | 3 | Placeholder Jab | ATK | N | 1 | — | `ILLUST_ACT_GEN_ATK_001` → `action_slash.webp`, plus `ILLUST_ACTION_GENERIC.svg` fallback | Scene is a finished painting | Opaque environment, depicts a sword slash rather than a jab, hides the interior layer. SVG fallback is a stick figure with baked "PLACEHOLDER" | New transparent subject `CARD_SUBJECT_ACT_GEN_ATK_001` |
| ACT_GEN_ATK_002 | 2 | Placeholder Smash | ATK | R | 2 | — | `action_heavy_strike.webp` | Finished painting of a heavy blow | Opaque full scene, not a transparent subject | New transparent subject |
| ACT_GEN_DEF_001 | 3 | Placeholder Guard | DEF | N | 1 | — | `action_guard.webp` | Finished painting of a guard | Opaque full scene | New transparent subject |
| ACT_GEN_DEF_002 | 2 | Placeholder Bulwark | DEF | R | 2 | — | `action_barrier.webp` | Finished painting of a barrier | Opaque full scene | New transparent subject |
| ACT_GEN_SKILL_001 | 2 | Placeholder Spark | Skill | N | 1 | — | none (falls through to generic stick figure) | — | Missing subject | New transparent subject |
| ACT_GEN_SKILL_002 | 2 | Placeholder Anthem | Skill | Epic | 2 | — | none | — | Missing subject | New transparent subject |
| ACT_FAC_AEG_001 | 2 | Placeholder Aegis Wall | DEF | FAC | 1 | FAC_AEG | none | — | Missing subject. Letter badge `BADGE_FAC_AEG.svg` | New subject + shield badge |
| ACT_FAC_AEG_002 | 2 | Placeholder Aegis Taunt | Skill | FAC | 2 | FAC_AEG | none | — | Missing subject | New subject |
| ACT_FAC_PHA_001 | 2 | Placeholder Phantom Cut | ATK | FAC | 1 | FAC_PHA | none | — | Missing subject. Letter badge | New subject + dagger badge |
| ACT_FAC_PHA_002 | 2 | Placeholder Phantom Rush | Skill | FAC | 2 | FAC_PHA | none | — | Missing subject | New subject |
| ACT_FAC_CEL_001 | 2 | Placeholder Star Bolt | ATK | FAC | 1 | FAC_CEL | none | — | Missing subject. Letter badge | New subject + star badge |
| ACT_FAC_CEL_002 | 2 | Placeholder Arcane Poke | Skill | FAC | 2 | FAC_CEL | none | — | Missing subject | New subject |
| ACT_FAC_SAN_001 | 2 | Placeholder Saving Ping | Skill | FAC | 1 | FAC_SAN | none | — | Missing subject. Letter badge | New subject + lantern badge |
| ACT_FAC_SAN_002 | 2 | Placeholder Sanctuary Ward | DEF | FAC | 2 | FAC_SAN | none | — | Missing subject | New subject |

Old Dream files were not deleted. Integration should prefer this fragment's illustration rows for these subject ids, because `findAsset` returns the first match.

## Shared frames and icons

| Asset | Existing file | Quality | Defect or missing | This stream |
|---|---|---|---|---|
| Frame N | `web/assets/generated/frames/FRAME_N.webp` | Ornate silver/gold, real art | Red/yellow chroma spill in the windows and sockets. SVG fallback says "PLACEHOLDER FRAME" | Clean-alpha `CARD_FRAME_N` |
| Frame R | `FRAME_R.webp` | Same family, blue | Same chroma spill | `CARD_FRAME_R` |
| Frame Epic | `FRAME_EPIC.webp` | Purple/gold | Same chroma spill | `CARD_FRAME_EPIC` |
| Frame EX | `FRAME_EX.webp` | White-gold | Same chroma spill. No EX action card exists in v05 | `CARD_FRAME_EX` shipped so the tier exists |
| Frame FAC | `FRAME_FAC.webp` | Iridescent rose-gold. Action-only tier | Same chroma spill | `CARD_FRAME_FAC` |
| Frame TBD | `FRAME_TBD.svg` | — | Placeholder stroke. No starter card uses TBD | Not redrawn |
| Interior | `CARD_INTERIOR.webp` | Soft sky/parchment painting | Composition was measured for the Dream frames | New plain parchment `CARD_INTERIOR` so text windows stay readable |
| ATK icon | `STAT_ICON_ATK.webp` | Crossed swords, transparent | None that requires a redraw | Borrowed |
| DEF icon | `STAT_ICON_DEF.webp` | Shield, transparent | None that requires a redraw | Borrowed |
| SPD icon | `STAT_ICON_SPD.svg` | — | Baked letters "SPD" | New winged boot `CARD_STAT_SPD` |
| Skill icon | `TYPE_ICON_SKILL.webp` | Crystal, transparent | None that requires a redraw | Borrowed as `CARD_TYPE_SKILL` |
| AP icon | `ICO_AP.svg` | — | Baked letters "AP" | New gem `CARD_ICON_AP` |
| Faction badges | `BADGE_FAC_*.svg`, `BADGE_GENERIC.svg` | — | Single baked letter on a flat circle | New emblems (shield, dagger, star, lantern, compass) |
| Type ATK / DEF | none as `type-icon` | — | Renderer only auto-attaches a type icon for Skill | Borrowed sword/shield registered as type icons |

## Avatars (not in the 30-card action deck)

| Id | Published name | Rarity | Stats (atk/def/spd) | Active / passive | Existing art | Quality | Defect or missing |
|---|---|---|---|---|---|---|---|
| AVT_AEG_002 | Justin Case | Epic | 3/8/1 PROPOSED | Shield +2; Taunt 1 Turn / 70% turn start team DEF +1 | `AVT_AEG_002.webp` | Painterly still, the style reference | SVG fallback is a stick figure with baked "PLACEHOLDER" and the name. WebP is the live file. Not redrawn |
| AVT_PHA_002 | Justin Time | Epic | 8/2/9 PROPOSED | Reckless Rush / Lucky Slash | `AVT_PHA_002.webp` | Same | Same SVG fallback defect. Not redrawn |
| AVT_CEL_002 | Justin Theory | Epic | 7/3/4 PROPOSED | Arcane Formula / Eureka | `AVT_CEL_002.webp` | Same | Same SVG fallback. Not redrawn |
| AVT_SAN_002 | Justina Moment | Epic | 2/5/6 PROPOSED | Saving Grace (active LOCKED in the sample catalog) / Moral Support | `AVT_SAN_002.webp` | Same | Same SVG fallback. Not redrawn |

`AVT_*_001` (Sir Potlid, Nox Squeak, Madame Meteor, Sister Plaster) are not rows in `content/v05/avatars`. On this branch their only illustrations are `WEB_ILLUST_AVT_*_001.svg`: stick figures, `placeholder: true`, baked "PLACEHOLDER" plus the name. PR #1 and PR #14 hold the real prototype paintings on other branches. Those files were not copied.

## Avatar skill card ids

These ids live inside the avatar records. They are not slots in `DECK_DEMO_MIXED_001` and have no `Asset_Ref`.

| Card id | Published name | Status |
|---|---|---|
| ACT_SKILL_AVT_AEG_002_ACTIVE | Shield +2; Taunt 1 Turn | PROPOSED. No separate illustration. Renders as text on the avatar |
| ACT_SKILL_AVT_AEG_002_PASSIVE | 70% turn start: team DEF +1 for 1 Turn | PROPOSED. No separate illustration |
| ACT_SKILL_AVT_PHA_002_ACTIVE | Reckless Rush | PROPOSED. No separate illustration |
| ACT_SKILL_AVT_PHA_002_PASSIVE | Lucky Slash | PROPOSED. No separate illustration |
| ACT_SKILL_AVT_CEL_002_ACTIVE | Arcane Formula | PROPOSED. No separate illustration |
| ACT_SKILL_AVT_CEL_002_PASSIVE | Eureka | PROPOSED. No separate illustration |
| ACT_SKILL_AVT_SAN_002_ACTIVE | Saving Grace | PROPOSED in the v05 file. No separate illustration |
| ACT_SKILL_AVT_SAN_002_PASSIVE | Moral Support | PROPOSED. No separate illustration |

## Enemies

`content/v05/enemies/demo-battle.json` is a placeholder team, not part of the 30-card deck.

| Id | Name | Rarity | Stats | Existing art | Gap |
|---|---|---|---|---|---|
| ENM_DEMO_001 | Placeholder Echo Tank | N | 1/1/1 | Battle sprite `enemy_security_skeleton.webp` | No card subject |
| ENM_DEMO_002 | Placeholder Echo Blade | N | 1/1/1 | `enemy_clipboard_goblin.webp` | No card subject |
| ENM_DEMO_003 | Placeholder Echo Spark | N | 1/1/1 | `enemy_salary_slime.webp` | No card subject |
| ENM_DEMO_004 | Placeholder Echo Hymn | N | 1/1/1 | none | No sprite and no card subject |

## What shipped

The fragment's `status` and every asset's `review_status` are `GENERATED_REVIEW`. Each asset's `status` is `CONCEPT`, because `src/schema/validate.js` only accepts CONCEPT, PROTOTYPE, QA_PASSED, PRODUCTION_READY, and INTEGRATED. The asset id for the new interior is `CARD_PARCHMENT` so it does not collide with the existing `CARD_INTERIOR` row.

Layers:

| Category | New files | Shipped WebP bytes | Original PNG bytes |
|---|---:|---:|---:|
| Subjects (14 card ids) | 14 | 909,002 | 14,951,897 |
| Frames (N, R, Epic, EX, FAC) | 5 | 226,082 | 2,533,808 |
| Icons and badges drawn for this stream | 7 | 55,578 | 7,644,034 |
| Interior | 1 | 1,676 | 6,072 |
| **New art total** | **27** | **1,192,338** | **25,135,811** |
| Borrowed icons (ATK, DEF, Skill, type ATK, type DEF) | 0 new files | 44,120 already on the branch | same files |

Shipped WebP is about 4.7% of the original PNG bytes. Originals are under `art-src/cards/`. Mobile files are under `web/assets/cards/`. Budgets enforced by `tests/prod/a`: subject ≤ 100 KB, frame ≤ 90 KB, icon ≤ 22 KB, interior ≤ 70 KB.

Text (name, type, rarity, AP) is HTML from `cardFace()` / `render-card.js`. Images have no gameplay words. Frame windows and subject corners are transparent.

Preview: `tools/art/cards/preview/index.html` (sheets `sheet-01.html` … `sheet-05.html`). Screenshots: `tools/art/cards/qa/844x390-deck-01.png` through `deck-05.png`, plus the same first sheet at 667×375, 915×412, 932×430, 1024×768, and 1280×720.

## Gaps left open

- `AVT_*_001` still have only placeholder SVGs on this branch. Their paintings live on PR #1 / #14.
- Avatar skill ids and all four enemies have no card-layer subjects. Enemy 004 also has no battle sprite.
- No published action card has rarity EX. The EX frame is ready; there is no EX illustration because there is no EX card id.
- `FRAME_TBD.svg` and the letter-badge / letter-icon SVGs remain in the old manifest as fallbacks. This fragment does not point at them.
- Dream v02 scene bindings and the chroma-spill frames remain in `web/assets-manifest.json` until integration prefers this fragment.
- Effect lines on the starter cards are still the published placeholder spec, so the rules window shows type and rarity only.
- Visual sign-off is still GENERATED_REVIEW.
