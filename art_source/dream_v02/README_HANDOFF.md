# Comedy Fantasy Card Game — Art Production Phase 2

Project: `sarantanyamongkolpong/comedy-fantasy-card-game`
Owner: Potae
Started: 2026-11-20 (Asia/Bangkok)
Status: `GENERATED_REVIEW` — not owner approved, not integrated into the web game.

Current core asset count: **42 PNG images**, plus JSON manifests and handoff documents.

## Scope

Independent image production only. Four parallel asset categories:

1. `housing/` — Six tiers of house exterior, Cabin interior and selected modular furniture.
2. `items_cards/` — Reusable transparent inventory/furniture icons, and unframed action illustrations.
3. `combat/` — Enemy character cutouts, a Tower battle stage, and independent VFX overlays.
4. `gacha_companions/` — Three Companion cutouts, the Gacha Hall background, three independent machine props and reveal effects.

## Established style

Consistent with the preceding Art Production v0.1: polished, readable, deliberately funny fantasy JRPG visual identity; blue/purple/gold highlights, storybook painted / pixel-inspired environments, expressive anime-like characters. Comedy belongs in character design and small props, not in unreadable UI or game data.

## Rules for Mira's integration

- Keep each character, building, furniture object, icon and card illustration as an independently replaceable asset referenced by a manifest.
- House tiers are six locked names: Cabin, Bungalow, Cottage, Loft, Villa and Penthouse. Exterior upgrade display shows only the highest acquired tier. Buying a higher house tier does **not** itself increase stash capacity; installed furniture does.
- The Shopping Mall sells or unlocks furniture; furniture pricing and whether granting vs unlocking is automatic remain undecided. Generated image assets must not imply prices or specific effects.
- Three Gacha pools are Avatar, Action and Companion. Do not generate a new Equipment banner as an established system. Exact drop probabilities and prices remain subject to the v0.5 owner decisions.
- Action art is concept illustration for ATK/DEF/Skill archetypes; no individual AP cost or card identity is locked by a picture.
- The four approved Justin card reference images and four existing battle character cutouts in Phase 1 are unaffected; this is an additive package.
- Transparent cutouts should be composited over DOM/CSS layouts at runtime, never flatten entire gameplay UI into an uneditable screenshot.
- Preserve the independent UI team/engine branches. Do not merge unapproved art PR #9 or make other code changes as part of this image production.
- **Deduplication note (20 Nov, after Mira update):** Mira has already drawn new Battle and Prep backgrounds. Treat this package's `combat/tower_battle_arena.png` as an **alternate scene**, not an overlay for those new backgrounds. Mira is also producing ornate gold UI frames, AP gems and End Turn controls; do not ship duplicate decorations unless explicitly selected after comparison.

## Review gates

1. Validate file readability, dimensions and transparent corner alpha for cutouts.
2. Review silhouette and consistency of every house tier, monster, Companion, and Gacha prop.
3. Only after owner approves this artwork should Mira import and optimize derived WebP files, keeping original PNGs available.
4. All assigned IDs, price figures, material effects, balance values and drop rates remain governed by v0.5 sheet and later explicit owner decisions.

Real screenshots and source artwork must remain distinct from code/UI integration acceptance. Image generation alone does not pass gameplay or responsive UI QA.
