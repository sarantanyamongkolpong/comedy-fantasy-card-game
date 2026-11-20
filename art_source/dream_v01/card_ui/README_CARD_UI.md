# Comedy Fantasy Card Game — Modular Card UI v0.1

Generated raster artwork set for the browser game. Original assets are standalone files and are not yet connected to the game engine.

## Assets

| File | Layer | Dimensions | Transparency |
| --- | --- | --- | --- |
| `frame_n.png` | Normal rarity frame | 1024×1536 | RGBA; art window transparent |
| `frame_r.png` | Rare rarity frame | 1024×1536 | RGBA; art window transparent |
| `frame_epic.png` | Epic rarity frame | 1024×1536 | RGBA; art window transparent |
| `frame_ex.png` | EX rarity frame | 1024×1536 | RGBA; art window transparent |
| `frame_fac.png` | FAC rarity frame | 1024×1536 | RGBA; art window transparent |
| `card_interior_neutral.png` | Swappable interior backdrop | 1024×1536 | Opaque texture |
| `icon_atk.png` | Attack icon (crossed swords) | 1254×1254 | RGBA |
| `icon_def.png` | Defense icon (blue shield) | 1254×1254 | RGBA |
| `icon_skill.png` | Skill icon (purple magic crystal) | 1261×1247 | RGBA |

## Suggested compositing order

1. `card_interior_neutral.png` or a per-card backdrop, fitted to the card master coordinate system (1024×1536).
2. Character artwork in a layout-controlled cropped window, approximately middle two-thirds of the card; layer masking is the UI implementation's responsibility.
3. ONE frame matching the rarity, drawing over backdrop and art.
4. Separately typeset card name, faction, cost, ATK/DEF/SPD, active/passive skill body, and icon assets as UI text and images. Do not bake dynamic data into frame PNGs.

## QA and limitations

- The five frames share a **1024×1536 master canvas** and a similar composition, but because the variants were image-generated, their opaque alpha outlines are **not pixel-identical** (R: 5.54%, Epic: 7.30%, EX: 8.86%, FAC: 12.54% binary alpha-mask difference compared with N). For a locked production template, build a shared mask/frame geometry or redraw in native layered design software and recolor. Do not depend on exact alpha identity across the images.
- All frame images have transparent central illustration window and transparent center of name/description sections; no hard-coded text or numbers.
- All icon PNGs have transparent exterior corners. Their canvas sizes differ; size via a common CSS square bounding box with `object-fit: contain`.
- This is art prototype v0.1, not technical animation or runtime QA certification.

## Generation instructions / prompt provenance

Produced using the built-in image generation tool.

- Base frame N: portrait 2:3 transparent trading-card frame; front-on, symmetrical, muted slate silver and bronze; reserved art cutout, title and description fields; no text or numbers; whimsical anime JRPG fantasy style.
- R / Epic / EX / FAC: edit base N, preserving overall frame structure and transparent windows while recoloring, respectively, teal-blue silver, purple-gold amethyst, crimson-black platinum, and prismatic opalescent gold.
- ATK icon: isolated crossed silver swords with red rubies, polished game UI aesthetic, genuine transparency.
- DEF icon: isolated golden-rimmed cobalt shield with sunburst, same aesthetic, transparency.
- Skill icon: isolated violet arcane crystal/star with subtle spell wisps, same aesthetic, transparency.
- Interior: full-bleed vertical fantasy parchment and blue-violet smoke with low-contrast engraving, warmer bottom text zone, no frame/text/character.

