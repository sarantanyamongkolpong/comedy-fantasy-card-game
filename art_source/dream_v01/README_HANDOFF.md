# Comedy Fantasy Card Game — Art Production v0.1

Date: 2026-11-20 (Asia/Bangkok)
Project: `sarantanyamongkolpong/comedy-fantasy-card-game`
Source-of-truth requirements: game design master v0.5 (`v05_*` tabs), latest owner decisions.

## Scope

Independent artwork workstreams only. No battle, save, gacha or page code was changed. No Git PR was merged.

- `reference_cards/` — the four **owner-approved** original Justin full-card renders, used strictly as art references.
- `avatars/` — standalone transparent **static** battle character illustrations. Not animated sprite sheets.
- `world/` — fixed-landscape master map terrain without baked buildings, and independent transparent building illustrations. Exact positions should be wired through a single coordinate system and tested on mobile landscape.
- `card_ui/` — modular transparent rarity frames and separate UI decoration or type icons. Text, numbers, image art and gameplay data are NOT baked into the frame PNG.

## Approval and status rules

1. The four original Justin cards in `reference_cards/` are **APPROVED ART REFERENCE**. Generated derivative assets in `avatars/`, `world/`, and `card_ui/` are **NEW ART FOR REVIEW** until Potae explicitly approves them.
2. Card stats and skills remain **PROPOSED** wherever the v0.5 sheet says so; art approval does not lock data.
3. Potae explicitly changed **Justina Moment** active skill to **All teammates Regen +3 — 2 Turns**.
4. The Justin characters should not replace existing avatar identities/IDs without owner signoff. Mira's provisional `AVT_*_002` mapping may stay configurable.
5. Do not merge the unapproved art PR #9 as a side effect. Work via an isolated asset branch / Draft PR, subject to Potae's review.

## Suggested responsive integration

- Use the world map raster as a fixed **master scene**. Its native image size is approximately 16:9; retain the actual pixel ratio, do not independently stretch X and Y.
- Compute one scale factor: `scale = min(viewportWidth / masterWidth, viewportHeight / masterHeight)`.
- Place every building and map-linked UI marker in the **same scaled scene container**, using fixed map-relative coordinates. Keep the visual midpoint centered; letterbox any unused area.
- Keep each building positioned via an anchor `(x, y)` in image/normalized coordinates; center the building's base/footprint on its intended pad, not its PNG bounding box center.
- Card rendering order: card background (if any), character illustration, rarity frame, icon/type slots, data-driven name, stats, active/passive labels.
- Keep alpha PNGs unpremultiplied where possible, allow lossless WebP/AVIF derivatives after visual QA, and preserve original PNGs for future edits.
- On narrow landscape phones, verify tap target size and that no building/UI drifts relative to map when zoom/letterboxing changes.
- Rarity frames are the same nominal 1024×1536 canvas, but their transparency masks differ slightly (about 5.5–12.5% of pixels compared with N); DO NOT treat them as pixel-perfect interlocking frame masks or use one tier's alpha as another tier's hitbox.
- The world art is richly illustrated / pixel-inspired, rather than tile-perfect pixel art. If the owner later requires strict tile/pixel-grid assets, a style conversion pass is needed.

## Integration handoff to Mira

1. Download and extract the ZIP; retain relative paths.
2. Import images through a declarative asset manifest and add a missing-asset fallback; never use index-based image guesses.
3. Do not use the full-card reference PNGs as a shortcut for modular in-game cards.
4. Display new artwork behind a feature flag or preview environment for Potae to review before production usage.
5. Report each asset as `ART_REFERENCE_APPROVED`, `GENERATED_REVIEW`, `QA_PASSED`, or `INTEGRATED` independently.

This package contains authentic generated PNG image files, not prompt-only descriptions. Asset references are relative to this folder.
