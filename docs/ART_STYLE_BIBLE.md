# ART STYLE BIBLE — Comedy Fantasy Card Game · First 4 Avatars
Version: 1.0 (FROZEN 2026-11-18, Asia/Bangkok) · Owner: Pote · Art Director: Mira (pixel/shared system)
Status of this document: **FROZEN** for the First-4 prototype. Sections 1 and 2 (identity locks) must not change.
Numeric anchor values in §6 are *defaults*; the authoritative per-character numbers live in
`assets/characters/_rigs/*.json` and may be tuned during QA without changing identity.

---
## 1. Character identity locks (Card Art AND Pixel Sprite must share these)
The Owner reference PNGs in `assets/reference/sprites/` are the identity lock (face, hair, costume, palette, silhouette).
They are flat images, not layered assets. Card Art is a separate painted illustration (NOT pixel art), with
**no gameplay text baked in**. Do not redesign any character. Comedy comes from the equipment; the character
is otherwise played straight and heroic.

### AVT_AEG_001 — Sir Potlid / เซอร์ฝาหม้อ · Aegis Dominion · Tank · rig `humanoid_heavy`
- Stocky, broad, strong male knight; short brown hair with sideburns and a short brown beard; green eyes;
  stern, serious frown (never goofy).
- Headgear: **silver cooking pot worn as a helmet**, two loop handles on the sides, knob on the lid top,
  small dents/scratches. Variant V2 = the SAME pot in **gold** (equipment variant, same Character ID).
- Armor: silver plate (pauldrons with gold rivets, gauntlets, greaves, sabatons), royal-blue tabard with
  gold trim and a gold laurel emblem on chest + gold crest at the hem, brown leather belt with gold buckle,
  royal-blue cape with gold border and gold fleur/crown pattern.
- Off-hand: **large round silver pot-lid shield** with a bar handle across the middle and dents.
- Main-hand: **short straight sword**, silver blade, gold cross-guard and pommel, held in his right hand
  (viewer's left), shield on his left arm (viewer's right).
- Palette: steel silver/grey, royal blue, gold, warm skin, brown hair/leather.

### AVT_PHA_001 — Nox Squeak / น็อกซ์ รองเท้าดัง · Phantom Blades · DPS · rig `humanoid_standard`
- Lean, athletic young male assassin; messy spiky black hair with a **purple streak / purple headband**;
  violet eyes; cocky grin.
- Black sleeveless ninja top, long **purple scarf** trailing to the left, purple sash knotted at the waist with
  a gold medallion, baggy black/charcoal pants with purple trim, bandage wraps on forearms, black fingerless
  gloves, small pouches on belt.
- **Dual daggers** (kunai-style, pale violet steel, reverse/forward grip), one in each hand.
- Comedy: **ridiculously flashy high-top sneakers** — purple/magenta with a yellow star, pink/white laces,
  cyan little wings on the side, glowing pink soles with light-up dots, yellow "squeak" lines around them.
- Cool assassin first; the only joke is the shoes.
- Palette: black/charcoal, deep purple, violet, neon magenta, cyan accent, yellow.

### AVT_CEL_001 — Madame Meteor / มาดามดาวตก · Celestial Nexus · Magic · rig `humanoid_standard`
- Elegant older woman, silver-grey hair in an updo with a gold flower ornament, round gold glasses,
  serene closed-eye smile, gold drop earrings.
- **Huge purple witch/astrologer hat** with a wide brim, gold star pattern, starry-night inner brim and a
  gold ring orbiting it like a planet ring.
- Purple and gold celestial robes: off-shoulder purple gown with gold geometric embroidery, gold belt with a
  purple gem, wide sleeves lined with a starry blue-to-cyan gradient.
- Main-hand (her right, viewer's left): **tall dark staff topped by a ringed planet orb** (purple/blue
  glowing orb inside gold rings) with floating blue/gold sparkle stars and a hanging crystal.
- Off-hand (viewer's right): **cup of instant noodles** (white/red cup, yellow noodles, chopsticks) with
  purple magic steam — the comedy detail; must stay recognizable.
- Palette: royal purple, gold, star-blue/cyan, silver hair, white cup + red pattern.

### AVT_SAN_001 — Sister Plaster / ซิสเตอร์พลาสเตอร์ · Sanctuary Order · Support · rig `humanoid_standard`
- Young woman, brown hair in a side bun with loose locks, teal/green eyes, serious focused expression,
  small gold earrings.
- **White nurse/healer cap with a green cross** and white ribbon tails.
- White and gold layered robes with gold leaf embroidery, jade-green under-robe/lining, green cross on the
  tabard, gold collar brooch with a green gem.
- Main-hand (her right, viewer's left): **large healing staff shaped like a giant adhesive bandage**
  (peach bandage head on a wooden/gold pole, gold cross-medallion collar, green ribbon).
- Brown leather **medical satchel** with a white cross and potion bottles, worn on a strap across the body.
- Off-hand (viewer's right): **clipboard** with a green-cross chart.
- Palette: white/cream, gold, jade green, peach bandage, brown leather/hair.

---
## 2. Faction palette notes (pixel ramps are 3–5 tones each, light from top-left)
| Faction | Primary | Secondary | Accent | Mood |
|---|---|---|---|---|
| Aegis Dominion | royal blue | steel silver | gold | sturdy, heraldic |
| Phantom Blades | black/charcoal | deep purple | neon magenta + cyan (shoes only) | sharp, shadowy |
| Celestial Nexus | royal purple | gold | star-blue → cyan, sparkle white | majestic, cosmic |
| Sanctuary Order | white/cream | gold | jade green | clean, holy, clinical |

Card frames and UI tints use the same faction primaries.

---
## 3. Pixel sprite rules (16-bit JRPG)
- **Logical canvas: 128 × 128 px for EVERY character and every layer** (equipment layers placed on the
  character use the same canvas; standalone equipment items use their own small canvas + pivot, §7).
- **Ground / feet baseline: y = 122** (lowest opaque pixel of the feet sits on row 121; rows 122–127 free for
  shadow/VFX). Horizontal body center x = 64 (body_center may be offset per character).
- **Global scale:** all four characters are converted from the references with the same factor
  (≈ 0.09 logical px per reference px), so relative heights stay true: Potlid shorter/wider, Plaster tallest
  because of her staff, Meteor's hat adds height.
- View: consistent **3/4 front view, standing**, as in the references (body slightly turned toward viewer's right).
- Light: **top-left**. Highlights on upper-left edges, shadows lower-right.
- Outline: 1 px dark selective outline (darker hue of the local color, not pure black where avoidable).
- Palette: indexed, ≤ 48 colours per character body, ≤ 16 per equipment item. No gradients beyond ramps,
  no semi-transparency: **alpha is strictly 0 or 255**.
- Scaling: **nearest-neighbor only**, integer zoom (2×, 3×, 4×…). CSS `image-rendering: pixelated`.
- Transparent background; no baked shadow (the preview draws a separate ground shadow).

---
## 4. Layer order (bottom → top), same canvas, file naming
| # | Layer | Slot key | Notes |
|---|---|---|---|
| 01 | Base Body / Rig | `body` | skin, limbs, silhouette |
| 02 | Face / Hair | `face_hair` | |
| 03 | Outfit | `outfit` | robes, armor, capes may be split `outfit_back` (drawn behind body) |
| 04 | Headgear | `headgear` | pot helmet, hats, caps |
| 05 | Main-Hand | `main_hand` | sword, dagger, staff (viewer's-left hand = character's right hand) |
| 06 | Off-Hand | `off_hand` | shield, dagger, noodle cup, clipboard |
| 07 | Back | `back` | capes, satchels behind body (drawn **first**, under body, when behind) |
| 08 | Accessories | `accessory` | scarf, satchel, sneakers, ornaments |
| 09 | VFX | `vfx` | sparkles, steam, glow; drawn last, may animate separately |

Prototype simplification: layers 01–03 are baked together into one `body` layer per character
(`<ID>_L01_body.png`) because they come from a flat reference. Draw order in the compositor is defined per
character in its rig JSON (`draw_order`), e.g. a staff may be drawn *before* the gripping hand overlay.

File naming: `assets/characters/<ID>/sprite/<ID>_L<NN>_<slot>[_<variant>].png` for character-fitted layers,
`assets/characters/<ID>/equipment/EQ_<ID-short>_<ITEM>_<NNN>.png` for that character's own items as standalone
pivoted items, `assets/equipment/EQ_<ITEM>_<NNN>.png` for shared items,
`assets/vfx/VFX_<NAME>_<NNN>.png`.

---
## 5. Rigs
- `humanoid_heavy` — Sir Potlid. Short, wide stance, broad shoulders, big head-to-body ratio (~1:2.6).
- `humanoid_standard` — Nox, Meteor, Plaster. Slimmer, ~1:3.2–3.6. Extra costume layers allowed
  (robes, hats); silhouettes are NOT forced to be identical.
Rig files: `assets/characters/_rigs/humanoid_heavy.json`, `humanoid_standard.json` (defaults) +
per-character overrides inside each file under `characters`.

---
## 6. Anchor convention (logical px on the 128×128 canvas, origin top-left, x→right, y→down)
| Anchor | Meaning |
|---|---|
| `head` | top-center of the skull where headgear sits (headgear pivot = its inner-bottom center) |
| `main_hand` | center of the closed fist of the character's right hand (viewer's left) — weapon grip point |
| `off_hand` | center of the off-hand fist/palm (viewer's right) — shield grip / held item |
| `back` | upper spine between shoulder blades (cape/satchel hook) |
| `body_center` | pelvis/torso center — used for hit VFX, recoil pivot, KO rotation pivot |
| `feet` | midpoint between feet ON the baseline (y = 122) — idle bob and KO fall pivot |

Default values (humanoid_standard): head (64,26), main_hand (40,70), off_hand (88,70), back (64,52),
body_center (64,74), feet (64,122). humanoid_heavy: head (64,30), main_hand (38,72), off_hand (90,74),
back (64,56), body_center (64,80), feet (64,122). Per-character measured overrides are authoritative.

## 7. Equipment pivot convention
- Every standalone equipment PNG has its own small canvas and a **pivot** (`grip` for held items, `mount`
  for headgear) recorded in `docs/ASSET_MANIFEST.json` and in the item's sidecar JSON.
- **Equip = draw item so that item.pivot lands on character.anchor[slot]** (+ optional per-character
  `offset` and `flip_x`). No rotation in the prototype (rotation would break pixel crispness).
- Items that share a slot type share a grip convention: staffs grip at the shaft point the fist covers,
  swords/daggers at the grip center, shields at the inner handle center.
- Character-fitted layers (`L04/L05/L06` on the 128 canvas) are equivalent to pivoted items with pivot (0,0)
  placed at (0,0); both paths are supported by the preview compositor.

## 8. Animation convention (shared timing)
Shared timing JSON in `assets/animations/`: Idle, Attack, Defend, Hit, KO. Animations are procedural
per-layer transforms (integer-pixel offsets only, flashes, VFX overlays) applied per rig, NOT hand-drawn
frames. Idle is the only state tuned for quality in this prototype; others are PROTOTYPE.

## 9. Card Art (painted) — composition guide for the card worker
- Portrait card window, character full or 3/4 body, faction-colored atmospheric background, light from
  top-left to match sprites. No baked text, stats, rarity, or logos. Keep each character's main equipment
  visible (pot helmet + lid shield; dual daggers + sneakers; planet staff + noodle cup; bandage staff +
  satchel + clipboard). Stats shown on frames as POW / DEF / SPD = TBD; rarity = placeholder.
