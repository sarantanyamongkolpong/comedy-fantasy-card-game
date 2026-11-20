# Mira — Phase 3 Asset Integration Brief

1. Source location is the `Art Production v0.3 - Inventory Furniture UI FX - 2026-11-20` folder under Card Battle in Google Drive. Use the included `ASSET_MANIFEST.json` as a proposed lookup; compare keys with actual code IDs.
2. This is a new set of review art. Keep it in a separate integration Preview/Draft PR and avoid merging automatically. Owner visual sign-off is required.
3. Inventory: overlay live 2D item grid on top of empty inventory room, slot/detail/tooltip frames. Bag asset is an independent cutout. Render counts, prices, attributes, sort/filter, item descriptions and click targets in HTML/JS, never from generated raster art.
4. Furniture: the seven props are additional display items; use the current v0.5 furniture schema to map types. Do not assume hardcoded capacity or price values based on visual richness.
5. VFX: six static transparent PNG overlays (Taunt, Critical, Draw, Discard, Upgrade, Reward Coins). Animate positional timing with code if desired, but don't claim these are finished sprite sheets.
6. Shopping Mall/Rewards scenes: preserve separately replaceable merchant, counter and treasure on top of their backgrounds. Add actual UI layers from browser components.
7. SVG pack: render vector files unaltered as independent assets; support hover/focus/pressed/disabled with CSS, and meet mobile touch targets. Do not use this generic pack to overwrite Mira's Battle/Prep-specific decorated HUD, AP gems or End Turn.
8. Compress derived images for mobile, retain source originals, lazy-load views, and run Playwright landscape QA (at least 844×390 + wider phones). Keep fixed scene aspect ratio and safe padding around interactive elements.
9. Add screenshots and explicit QA evidence in the Draft PR, including broken asset fallback, bag scroll, click-through overlays, furniture positioning and rewards after a win/loss. Report all unmapped art as `GENERATED_REVIEW`, not `INTEGRATED`.
