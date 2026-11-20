# Mira Handoff — Art Production Phase 2

Repository: `sarantanyamongkolpong/comedy-fantasy-card-game`
Source data: **Card Battle Design Master v0.5** (preserve PROPOSED/PENDING statuses).
Art state: **GENERATED_REVIEW**, owner visual approval required before declaring production-ready.

## Deliverables

- `ASSET_MANIFEST.json` maps 42 proposed identifiers to independently replaceable PNG files.
- `housing/`: six transparent house tiers, one 1672x941 Cabin interior background, three modular furniture props, plus a housing-specific JSON manifest.
- `items_cards/`: eight item/furniture icons and six unframed Action card illustrations.
- `combat/`: four enemy cutouts, one 1672x941 tower scene, four transparent static VFX.
- `gacha_companions/`: three companions, one 1672x941 hall, three machines, two transparent static reveal VFX.

## Integration approach (staged, no implicit merge)

1. Treat the provided PNGs as immutable source originals. Produce optimized derived WebP (or other suitable web format) for browser distribution. Do not overwrite originals.
2. Add an asset registry/manifest mapping in a **separate Draft PR**. Reuse existing identifiers only after comparing them against game data; manifest IDs in this package are proposals.
3. Import independently layered houses, props, characters, monsters, machines and effects. In particular: Gacha Hall and battle stage are backdrops, not screenshots; graphics for entities must sit on separate layers.
4. The world map and backgrounds must retain their locked design aspect ratio; use uniform scale and letterboxing. Never stretch/crop to force fill the viewport. Every building and button anchor remains bound to the same scaled scene coordinates.
5. Use existing card frames/UI overlays for Action art; do **not** paint AP, ATK/DEF/SPD, ability text or rarity labels into those art images. Gameplay numbers still come from v0.5 data.
6. House purchase/unlock tier is visual progression only; installed furniture is what changes stash capacity. Prices and automatic grant/unlock rules remain unconfirmed.
7. Test landscape mobile at least 844x390 plus wider 16:9. Ensure no house/top edge clipping, 5-card hand covering player units, or illegible icons.
8. Static VFX are single PNG frames; animate with CSS/Canvas/Sprite layering only if engine permits. Do not mislabel them sprite sheets.
9. Lazy-load offscreen screens and convert/compress images; original source PNGs are too heavy for direct mobile release. Track visual and memory performance separately from Node unit tests.
10. No automatic approval or merging of art PR #9. Owner visual review remains the gate; keep this Phase 2 artwork additive and reversible.

## Visual acceptance notes

- Tier silhouette should read clearly as Cabin → Bungalow → Cottage → Loft → Villa → Penthouse.
- Inspect the Penthouse rooftop against top-edge safe margins; the exterior is tall and needs `contain` compositing.
- Gacha hall has three empty display pads intended for **separate** Avatar/Action/Companion machines; do not treat background decorative wall props as fourth machine.
- Companion cutouts and inventory icons should be readable at small landscape mobile scale; provide thumbnails or tighter alpha-trimmed derivatives as needed.
- Flag any art interpretation conflicting with v0.5 as an Owner decision, not a silently locked rule.
