# World content decision log

Agent G records Owner answers here. This file lives in `docs/production/world/` because that is the owned docs path. `docs/production/g/` is outside that ownership.

These five answers are **OWNER_DECIDED**. They are not LOCKED, not OWNER_APPROVED, and not PRODUCTION_READY. Questions `OQ_G_01` through `OQ_G_08` stay **OPEN**.

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
