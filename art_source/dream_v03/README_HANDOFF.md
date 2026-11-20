# Comedy Fantasy Card Game — Art Production Phase 3

Project: `sarantanyamongkolpong/comedy-fantasy-card-game`
Date: 2026-11-20 (Asia/Bangkok)
Status: `GENERATED_REVIEW`, not owner-approved and not integrated.
Planned final file count: **24 PNG artworks + 27 editable SVG assets = 51 modular visuals**, plus JSON manifest and handoff docs.

## Objective

Fill the remaining cross-screen visual gaps for a premium, humorous fantasy web card game while preserving modular assets. This is not a new game engine or a reimplementation of Mira's current Battle/Prep UI. All assets should be independently replaceable through manifests.

## Art streams

1. `inventory_ui/`: bag-themed inventory backdrop, standalone backpack cutout, one slot, item detail, category tab and tooltip frames. Live items and values must be DOM-rendered.
2. `furniture/`: seven additional transparent props for Hideout and Shopping Mall, no price or capacity assumptions. Does not replace the three Phase 2 props.
3. `vfx/`: six independent transparent gameplay VFX overlays; these are *static source frames*, not playable sprite animations.
4. `shop_rewards/`: Shopping Mall and Rewards backdrops, funny merchant character, movable counter and treasure prop.
5. `ui_vector/`: 27 crisp scalable SVG components, generated from included source script; global menus, inventory, shops and dialogs only.

## UI visual rules

- Premium, storybook fantasy-comedy direction: midnight navy, amethyst, pale gold, soft cyan glow. Humor is conveyed through expressive props rather than unreadable visual clutter.
- Target website, especially landscape mobile. Scale backgrounds uniformly and letterbox if needed; no stretched characters or scene anchors.
- Separate static art from interactive text, icons, selectable states, hit targets, numeric counters, card data and dynamic outcomes.
- Use CSS/DOM for button labels, focus and pointer handling. Decorative frames alone are not functional buttons.
- `ui_vector/` SVGs can be recolored and rerendered from `generate_ui_assets.mjs`; all source PNGs remain immutable originals while WebP derivatives may be used by the game.
- The four AI-generated raster inventory frames have stray colored fringe/low-alpha residue and are marked `REVIEW_FIX_NEEDED` in `ASSET_MANIFEST.json`. Prefer their four precisely drawn SVG alternatives in `ui_vector/` for implementation; keep the PNG originals only for concept review.
- Do not duplicate Mira's newer Battle/Prep stage art, gold HP/UI bars, AP gem or End Turn work. The current Phase 3 is cross-screen asset production and leaves those modules with Mira.
- VFX names are concepts only. Do not invent effects beyond the v0.5 gameplay sheet; visual effects can be mapped when actual card/status IDs are confirmed.
- Furniture inventory, placement permissions, stash capacity, prices and upgrades are not established by images. Preserve source row statuses from v0.5.

## Handoff / QA

The package includes a machine-readable manifest, source images, vector source script and per-stream notes. QA must check readability, transparency, dimensions, SVG XML validity, scale on 844x390 landscape, target sizes and integration conflicts. Artwork generation and isolated file QA do *not* constitute browser gameplay QA.

Do not merge any unapproved PR, including previously blocked old art PR #9. Place implementation in a Draft PR for owner visual review before committing it to production.
