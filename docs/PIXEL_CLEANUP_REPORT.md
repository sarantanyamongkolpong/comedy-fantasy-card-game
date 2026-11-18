# Pixel cleanup report — t230

Date: 2026-11-18 (Asia/Bangkok). Branch: `polish/pixel-art-cleanup`. Base: `feat/card-art-prototype-mira` (`d65c89d`).

**Status of every cleaned sprite: PROTOTYPE.** Not QA_PASSED. Not PRODUCTION_READY. Owner review is still required before any merge.

This pass is **deterministic and scripted** (`tools/pixel_cleanup/clean.py`). It is not hand-placed pixel art. Where a step is automated, it is named below.

## What changed

Original prototype PNGs were copied, byte-for-byte, to `assets/characters/<ID>/sprite/_source_v1/` before any edit. `docs/qa/pixel_cleanup/source_v1_sha256.json` records those hashes. The checker refuses to pass if a backup byte changes.

Cleaned files stay on the 128×128 canvas. Alpha is strictly 0 or 255. Anchors were not edited (rigs were not touched). Feet anchors remain `y = 122`. No opaque body pixel sits on row 122 or below.

`L01_body.png` is still the rig's body layer, so the existing compositor keeps working. It is now also the exact composite of four new layers:

| New file | Layer | Slot | What it holds |
|---|---|---|---|
| `<ID>_L01b_skin.png` | L01b | skin | Peach face and bare hands |
| `<ID>_L02_face.png` | L02 | face | Eyes, brows, mouth, glasses |
| `<ID>_L02_hair.png` | L02 | hair | Hair, beard, Meteor's grey hair, Nox's purple streak |
| `<ID>_L03_outfit.png` | L03 | outfit | Armour, robes, scarf, wraps |

The four masks do not overlap. Compositing them reproduces `L01_body.png` exactly (checked). The split is a colour-and-region heuristic, not a hand paint. Nox's scarf stays in outfit. Gauntlets stay in outfit. Draw order, if a future rig uses the parts: skin, outfit, hair, face. Rigs were not updated; that is a coordination request below.

## Method (all automated)

1. **Pinhole fill.** A transparent pixel with many opaque neighbours, inside the silhouette, is filled with the neighbour majority. Counts: Potlid 3, Nox 7, Meteor 3, Plaster 5.
2. **Hidden regions** (pixels of L01 that sit under the current equipment masks):
   - Hair under headgear: reshade with the cap's own colours, dark on the outline, light toward the top-left. Potlid 162 px, Meteor 68 px, Plaster 46 px.
   - Meteor and Plaster staff gaps: each hidden pixel copies the nearest real robe pixel on the same row (the inpaint smear is replaced by the cloth beside it). Meteor 184 px, Plaster 265 px.
   - Nox feet: the flat tabi blobs get a darker sole, a wrap line, and a top-left highlight, using three shades of the original foot colour. Both soles are planted on row 121 (11 new pixels). The 2 px spike on the right foot was removed first.
   - Potlid sabatons: the two foot clusters on row 120 are copied down onto row 121 (22 px) so both feet meet the baseline. The mirror-fill behind the shield was **not** redrawn; it was only despeckled. It is still an approximate arm.
   - Small occlusions (fists, cup, clipboard): nearest non-hidden body colour.
3. **Face unify.** Each small component inside the face box (eyes, mouth, brows, glasses) is snapped to its median colour.
4. **Despeckle.** One pass, read from a copy so it cannot cascade. A pixel is rewritten only when it has no neighbour of its own colour and the majority neighbour is within CIE76 ΔE 16. Hair sitting on skin is left alone.
5. **Outline.** An exterior pixel much lighter than its neighbours is replaced with the darkest neighbour colour. No new colours.
6. **Palette.** Greedy merge in Lab down to 48 colours for the sprite stack. Body pixels are weighted ×4. Up to 8 face colours are locked so they cannot be merged away. Each dropped colour follows the merge chain (it does not jump to an unrelated survivor). Last merge ΔE: Potlid 6.1, Nox 8.1, Meteor 11.8, Plaster 7.6.
7. **Golden pot.** Silver helmet alpha is unchanged. Gold is a luminance remap of that silver layer onto five gold colours already in Potlid's 48-colour palette: `(174,103,57)`, `(196,154,88)`, `(205,142,63)`, `(231,159,68)`, `(248,186,80)`. Masks match. Swapping silver for gold changes 497 pixels, all inside the helmet.

Equipment-layer **alpha masks are unchanged**, so a later recrop at the same `native_origin` still lines up. Only RGB changed on those layers.

## Palette, before → after

The Style Bible target is ≤48 colours per character and ≤16 per equipment item. Counts below are unique RGB values on opaque pixels.

"Sprite stack" is L01 plus the fitted layers (silver helmet, not gold) composited on the 128 canvas. That is the set this pass controls.

"Equipped composite" is what `tools/compose.py` draws: cleaned L01 / grips / VFX plus the **original** equipment PNGs. Those PNGs were not edited.

| Character | L01 before | L01 after | Stack before | Stack after | Stack with gold | Equipped before | Equipped after | Visible mean L1 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Sir Potlid `AVT_AEG_001` | 62 | 48 | 63 | **48** | **48** | 62 | 63 | 4.83 |
| Nox Squeak `AVT_PHA_001` | 49 | 33 | 68 | **48** | 48 | 67 | 65 | 14.59 |
| Madame Meteor `AVT_CEL_001` | 78 | 48 | 81 | **48** | 48 | 80 | 80 | 6.66 |
| Sister Plaster `AVT_SAN_001` | 73 | 47 | 77 | **48** | 48 | 76 | 73 | 7.16 |

The documented 62–80 range is the equipped composite. That number does **not** fall to 48, because the equipment PNGs still carry the old colours. Potlid's equipped count goes 62 → 63: the cleaned body palette and the untouched helmet PNG no longer share every grey. Nox's visible mean L1 (14.59) is the largest shade shift; the 68 → 48 merge flattened some dark costume steps. Identity (spiky hair, purple scarf, violet eyes, neon sneakers) is still there.

### Per fitted layer (≤16 was attempted, not forced)

Forcing every item to 16 colours raised mean channel error enough to flatten stars, sneaker neon, and robe embroidery. Layers were only reduced as part of the shared 48. Honest leftovers above 16:

| Layer | Before | After | ≤16 |
|---|---:|---:|---|
| Potlid silver pot | 32 | 24 | no |
| Potlid gold pot | 6 | 5 | yes |
| Potlid sword | 40 | 31 | no |
| Potlid shield | 36 | 31 | no |
| Potlid grip | 25 | 25 | no |
| Nox main kunai | 15 | 10 | yes |
| Nox off kunai | 22 | 14 | yes |
| Nox grips | 17 / 16 | 12 / 11 | yes |
| Nox sneakers | 51 | 44 | no |
| Nox squeak VFX | 2 | 2 | yes |
| Meteor hat | 68 | 41 | no |
| Meteor staff | 64 | 41 | no |
| Meteor noodle cup | 26 | 18 | no |
| Meteor steam | 32 | 20 | no |
| Meteor grip | 8 | 8 | yes |
| Plaster cap | 23 | 19 | no |
| Plaster bandage staff | 55 | 40 | no |
| Plaster clipboard | 40 | 28 | no |
| Plaster grip | 33 | 25 | no |

## Checks

`python3 tools/pixel_cleanup/check.py` — **ALL CHECKS PASSED**

- Every `L*.png` and split layer is 128×128.
- Alpha is 0 or 255. Transparent pixels have RGB 0.
- Feet anchors are unchanged and `y = 122`.
- Lowest opaque body row: Potlid 121 (22 px), Nox 121 (11 px), Meteor 120 (robe hem, not a foot), Plaster 119 (robe hem). None cross into y ≥ 122.
- Split composite equals L01 for all four.
- Non-body fitted layers keep their original alpha masks.
- Sprite-stack colour count ≤ 48 for all four.
- Silver and gold helmet masks are equal. Stack swap changes 497 px, 0 outside the helmet.
- `_source_v1` hashes match the recorded backup (33 files).

Sheets (nearest-neighbour ×4) are in `docs/qa/pixel_cleanup/`:

- `<ID>_before_after_stack_x4.png` — fitted layers, before | after
- `<ID>_before_after_equipped_x4.png` — compositor with equipment PNGs
- `<ID>_before_after_body_x4.png` — L01 with slots empty (hidden repairs)
- `<ID>_face_x8.png` — face crop
- `<ID>_split_layers_x4.png` — skin / face / hair / outfit
- `AVT_AEG_001_silver_vs_gold_x4.png` — cleaned stack silver | cleaned stack gold | equipped silver | equipped gold
- `all_after_equipped_x4.png`

## Coordination requests (not done here)

1. **Equipment crops are stale.** `assets/characters/<ID>/equipment/*.png` are exact crops of the pre-cleanup sprite layers (`native_origin` + size). This pass did not edit `equipment/**`. The preview compositor still draws those PNGs, so cleaned helmets, weapons, hats, and sneakers show up in the sprite-stack sheets but not in the equipped composite. Recrop from the cleaned layers if the preview should match. File ownership: not this branch.
2. **Rigs still draw a single L01.** `assets/characters/_rigs/*.json` was not edited. The new L01b/L02/L03 files are unused by the compositor until a rig lists them. L01 remains a compatible composite, so nothing breaks if the rig stays as it is.
3. **Preview was not regenerated.** `preview/**` and `tools/build_preview.py` belong to `qa/art-preview-mobile`. Sheets in `docs/qa/pixel_cleanup/` are the review surface.
4. **`anim/**` and `card/**` were not touched.**

## Re-run

```bash
python3 tools/pixel_cleanup/clean.py
python3 tools/pixel_cleanup/sheets.py
python3 tools/pixel_cleanup/update_manifest.py
python3 tools/pixel_cleanup/check.py
```

`clean.py` always reads `_source_v1`, so a second run does not bake the cleanup twice.
