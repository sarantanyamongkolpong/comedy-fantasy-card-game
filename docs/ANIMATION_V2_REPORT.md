# Animation v2 — four starter avatars

Status: **PROTOTYPE**. Nothing in this pass is PRODUCTION_READY. Owner approval is required before any merge. This branch must not be merged on its own.

Characters, unchanged IDs: AVT_AEG_001 Sir Potlid, AVT_PHA_001 Nox Squeak, AVT_CEL_001 Madame Meteor, AVT_SAN_001 Sister Plaster.

Timing template: `assets/animations/ANIM_SHARED_002.json` (ANIM_SHARED_001 is untouched).
Per-character tracks: `assets/characters/<ID>/anim/<ID>_tracks_v2.json`.

## What changed

v1 Idle was a tuned 1px bob. Attack, Defend, Hit, and KO were whole-sprite nudges. KO rotated inside a 128 buffer and then shoved the body downward, so pixels that swung outside the buffer were destroyed. On the padded measurement of that same pose:

| Character | v1 KO frames with pixels outside 128 | Worst frame | Pixels outside |
|---|---|---|---|
| Sir Potlid | 1 of 7 | 40°, bbox bottom y=129 | 7 |
| Nox Squeak | 3 of 7 | 40°, bbox bottom y=133 | 54 |
| Madame Meteor | 3 of 7 | 40°, bbox bottom y=130 | 11 |
| Sister Plaster | 4 of 7 | 65°, bbox left x=−10 | 142 |

Full table: `docs/qa/animation_v2/audit_v1.json`.

v2 keeps every state on the shared **128×128** canvas. KO is rotated in a padded buffer with nearest-neighbour sampling, then shifted by the smallest integer that leaves a 1px margin (opaque pixels stay in x/y 1..126). Once a shift is applied it is held, so the figure does not snap back toward the origin. The largest step is 3px, on Sister Plaster while her bandage staff swings across the left edge. At 0° and 90° the opaque count matches the standing sprite exactly (Potlid 4718, Nox 3841, Meteor 5402, Plaster 5792), so the fallen pose is the whole body, including the staff head and the planet orb.

Feet-as-pivot was measured and not used. Planting the feet and then shoving the sprite back into the frame takes a 17px-or-larger jump in one frame. Rotation is about `body_center`, which is the recoil pivot already in the rig.

## Placement — what a person wrote, and what the script drew

No frame is hand-placed pixel art. Every raster is the standing equipped composite, transformed.

| State | Frames × ms | Loop | What was written by hand | What the pixels are |
|---|---|---|---|---|
| Idle | 6 × 180 | yes | The v1 bob, copied forward. Body/head/hands move together; L09 (squeak marks, noodle steam) drifts a pixel or two. | The standing sprite, shifted. |
| Attack | 8 × 80 | no | A short offset curve per character. | Same sprite, shifted. Last frame is the rest pose. |
| Defend | 6 × 100 | no | A brace. The shield, cup, and clipboard share the body's offset. | Same sprite, shifted. |
| Hit | 6 × 60 | no | A recoil. Flash and the red tint are data, not baked colour. | Same sprite, shifted. |
| KO | 12 × 90 | no, hold last | The angle list. Potlid resists then drops. Nox tips sooner. Meteor and Plaster share one controlled curve. | Nearest-neighbour rotation plus the held translation. |

Hand-placed pixel frames: **0**. Procedural frames: **6+8+6+6+12 = 38 per character**.

Character motion stays small, because the comedy is the equipment and the acting is straight:

- **Sir Potlid** — rooted knight. Attack is a 3px thrust. Defend is a 2px brace with a 1px crouch. Hit recoil peaks at 2px. The pot, sword, and lid shield move with him.
- **Nox Squeak** — the jab reaches 6px. On the strike, the yellow squeak marks hop 2px off the shoes. The sneakers and both daggers stay on the body.
- **Madame Meteor** — a cast, not a lunge. She rises 1px and steps 1px. The planet staff and the noodle cup stay in her hands.
- **Sister Plaster** — a 2px presentation of the bandage staff, and a small flinch she holds one extra frame. No flourish.

v1 Defend gave Potlid's shield its own offset, which slid the lid off the arm. v2 does not. Body, head, main hand, and off hand share one offset on every non-KO frame. The grip overlay (L05f / L06f) uses that same offset, so the fist stays on the weapon. KO is one rigid rotation of the already-equipped sprite, so a weapon cannot leave the hand.

Combat flashes, guard tint, and the KO dim are render hints in the timing file. Baking them would need partial alpha, which the style bible forbids. The GIF previews are the exception: they stamp a hard white (alpha still 0 or 255) and the existing combat VFX on the frames that ask for them. The PNG strips do not.

## Files

Added:

- `assets/animations/ANIM_SHARED_002.json`
- `assets/characters/<ID>/anim/<ID>_tracks_v2.json` — per-frame anchors and `draw_xy = anchor − pivot + fit`
- `assets/characters/<ID>/anim/<ID>_<state>_strip_v2.png` — canonical strip, transparent
- `assets/characters/<ID>/anim/<ID>_<state>_v2.gif` — preview
- `tools/animation/lib_v2.py`, `build_v2.py`, `check_animation_v2.py`
- `docs/ANIMATION_V2_REPORT.md`
- `docs/manifest_additions/animation_v2.json` — 45 PROTOTYPE entries for Mira to fold into the manifest
- `docs/qa/animation_v2/` — v1 audit, 4× old-vs-new sheets, 2× anchor proofs, summary board, check results

Not modified, on purpose: sprite layers, idle sheets, `docs/ASSET_MANIFEST.json`, rigs, `preview/`, `src/`, `tests/`, card art. The in-browser preview still plays ANIM_SHARED_001. `preview/` belongs to the mobile QA pass. The GIF files are the v2 preview until that preview is pointed at the new template.

Default loadout is the native kit (silver pot, not gold). The gold pot uses the same anchors and the same tracks.

## Checks

One command, from the repo root:

```bash
python3 tools/animation/check_animation_v2.py
```

Rebuild, if the template or the sprites change:

```bash
python3 tools/animation/build_v2.py
python3 tools/animation/check_animation_v2.py
```

Result of this pass: **passed 2062, failed 0**. Log: `docs/qa/animation_v2/check_results.json`.

The command checks:

- Idle frame 0 equals Idle frame 5 (the loop is exact).
- Attack, Defend, and Hit end on that same rest pose. KO starts on it and ends at 90°.
- Alpha is only 0 or 255. Canvas is 128×128. KO keeps a 1px margin, and the held translation never steps more than 3px.
- Body, head, main hand, and off hand share one offset. Each item's recorded draw position is `anchor − pivot + fit`.
- KO anchors match the same rounding as the raster. Strips match a fresh render. GIF duration expands back to the authored clock (Pillow joins identical neighbours and adds their durations; playback time is unchanged).
- New asset IDs do not collide with `docs/ASSET_MANIFEST.json`. Every listed hash matches the file. Every entry is PROTOTYPE.

## Known issues

- Intermediate KO angles alias under nearest-neighbour sampling. Opaque counts wobble by a few pixels between 0° and 90°. The silhouette is the rotated sprite, and it is jaggy. A hand-drawn fall would be a later pass.
- Sister Plaster's KO slides up to +11px on x so the bandage staff stays inside 128. The slide is gradual (max 3px per frame) and then holds.
- Nox's KO holds a −4px lift after his feet would otherwise leave the bottom of the frame.
- Held items do not turn to follow the arm. The arm is baked into L01. Giving the weapon its own offset would pull it out of the fist.
- Source sprites are still the scripted downscales from the first art pass (colour count above the bible's 48, rough hidden fills). This pass does not repaint them.
- The idle bob still touches row 122, one pixel into the shadow rows. That is the tuned v1 bob, kept as-is.
- GIF previews bake a hard white flash and combat VFX. Canonical strips do not. Dim and the guard tint are data only.
- The battle preview HTML does not play v2 yet.

## Previews

4× old-vs-new contact for every state: `docs/qa/animation_v2/compare_<ID>_<state>.png`.
Key-frame board: `docs/qa/animation_v2/summary_board.png`.
Anchor crosses (head, main hand, off hand, back, body center, feet) on Attack and KO: `docs/qa/animation_v2/anchors_<ID>.png`.
