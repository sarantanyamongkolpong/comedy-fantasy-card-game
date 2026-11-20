# World content decision log

Agent G records Owner answers here. This file lives in `docs/production/world/` because that is the owned docs path. `docs/production/g/` is outside that ownership.

All thirteen answers are **OWNER_DECIDED**. They are not LOCKED, not OWNER_APPROVED, and not PRODUCTION_READY. None remain OPEN.

| Field | Value |
| --- | --- |
| Date | 2026-11-20 |
| Source | t276u |
| Status | OWNER_DECIDED |

## OQ_G_09 — Side event rewards

Rewards may be in-game currency (G), materials, and decorations, capped by difficulty. Avoid handing out premium currency in large amounts. Exact numbers are not invented. Amounts are **PENDING**.

Applied in the pack: every side-event and stage reward lists those three kinds, keeps every amount null, and marks the amount and the difficulty cap PENDING. No premium-currency quantity is set.

## OQ_G_10 — Tutorial scope

Keep writing the tutorial script and structure. Only the basic tutorial needed to actually play is in scope for the first round. Tag the rest as later.

Applied in the pack: `TUT_MAP_WANDER`, `TUT_MAP_TOWER`, `TUT_PREP_READY`, `TUT_BATTLE_TURN`, and `TUT_REWARDS_ONCE` are `first`. `TUT_HIDEOUT_CABIN`, `TUT_STASH_FILTERS`, `TUT_DECK_THIRTY`, `TUT_GACHA_BOOTHS`, and `TUT_MALL_TAGS` are `later`. No prompt was deleted.

## OQ_G_11 — Companion names

Give unique names only to characters with dialogue or a story role. Generic characters may use temporary names.

Applied in the pack: the six speaking NPCs keep their unique names and are marked `unique_dialogue_role`. No new companion was named. The companion bed stays furniture.

## OQ_G_12 — ENM_DEMO_004

Keep the id so references do not break. Use a placeholder image. Tag it Missing Artwork.

Applied in the pack: every stage still cites `ENM_DEMO_004` in catalog order. The tag is `Missing Artwork`. The image is the existing placeholder `web/assets/illustrations/ILLUST_ACTION_GENERIC.svg` (`ILLUST_ACTION_GENERIC`). No new art was added. The tower side event that mentions the id carries the same tag.

## OQ_G_13 — Upgrade lore

Upgrading may be mentioned in story terms. No recipes, materials, or numbers until the crafting system is finalized.

Applied in the pack: no upgrade recipe, material list, or crafting number was added. Existing house-tier peek copy does not state a recipe or an amount.

## t279u — 2026-11-20

Status OWNER_DECIDED, not LOCKED.

### OQ_G_03 — Enemies

Use `ENM_DEMO_*` for testing now. Keep the four Justin echo copies as Placeholder until a real enemy set exists.

Applied in the pack: stages still cite `ENM_DEMO_001` through `ENM_DEMO_004`. The Justin echo copies are named Placeholder. The web battle builder is not retargeted.

### OQ_G_04 — Economy order

Decide currencies and how they are earned first, then gacha prices, shop prices, then the companion system. No real charging until an Economy Balance review passes.

Applied in the pack: counters stay off. Amounts stay null and PENDING. No price was written.

### OQ_G_05 — Cabin

Starting Stash is 50 slots, Decks are 3, and Companions are 2. Each system has its own separate capacity.

Applied in the pack: the hideout copy states those three starting figures. Sheet tier capacities and prices were not copied.

### OQ_G_06 — Arena

Training mode versus AI comes first. Keep the structure ready for PvP later.

Applied in the pack: arena copy says training against the AI. No PvP match was added.

### OQ_G_07 — Sports Complex

Keep "Coming Soon" only on activities that are not yet playable. Opened activities are accessible immediately.

Applied in the pack: the four sports stay Coming Soon because none is playable. The pin stays locked. No sport was added.

### OQ_G_08 — Building id

The locked destination id is canonical. Align map hotspot `siteId`s to it. Never create duplicate ids.

Map code is outside this ownership, so the live hotspot `siteId`s are not renamed here. This pack still stores the manifest `siteId` beside the canonical destination id and does not add a third id.

Mismatches (hotspot `siteId` versus canonical destination id):

| Hotspot siteId | Canonical destination id |
| --- | --- |
| `tower` | `mysterious-tower` |
| `arena` | `tournament-arena` |
| `sports` | `sports-complex` |
| `mall` | `shopping-mall` |

`home` and `gachapon` already match.

## t280u — 2026-11-20

Status OWNER_DECIDED, not LOCKED.

### OQ_G_01 — Map

All main areas are open from the start. Special areas and some dungeons unlock by tower progress.

Applied in the pack: hideout, tower, arena, mall, and gachapon stay open from the start. No special area or dungeon was added.

### OQ_G_02 — Tower

The structure is 100 floors in 10 zones of 10 floors each, with new enemies and a zone boss per zone, developed one zone at a time.

No enemy records and no floor content were created. The existing four stages still reuse `DEMO_BATTLE_001`.
