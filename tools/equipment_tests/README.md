# Equipment stress harness

Cross-character reuse check for every equipment item on every avatar. It does not edit sprites, rig JSON, item JSON, or `docs/ASSET_MANIFEST.json`. Recommended anchor moves are written up and not applied.

## Run

From the repo root, with Python 3 and Pillow:

```bash
python3 tools/equipment_tests/run_equipment_stress.py
```

Exit 0 means the named cases and invariants passed. `UNSUPPORTED` is a normal result: the item does not fit that character, and the body was not scaled to force it. `FAIL` means a broken asset or compositor (partial alpha, size mismatch, identity change outside the item).

## What it writes

| Output | Role |
|---|---|
| `docs/EQUIPMENT_COMPATIBILITY_MATRIX.md` | One row per item × character × declared slot |
| `docs/EQUIPMENT_COMPATIBILITY_MATRIX.json` | Same table, plus metrics |
| `docs/EQUIPMENT_COMPATIBILITY_MATRIX.csv` | Same table |
| `docs/ANCHOR_CORRECTION_RECOMMENDATIONS.md` | Measured anchors. No value is applied |
| `assets/characters/_rigs/equipment_offsets.json` | Integer offsets the harness actually uses |
| `docs/qa/equipment_stress/*.png` | 4× nearest-neighbour sheets (overflow sheet is 3× on a padded canvas) |
| `docs/QA_REPORT.md` | Replaces the section between the equipment-stress markers |

## Placement

`origin = anchor[slot] − item.pivot + offset`

Headgear uses `head`. Accessories use `feet`. Draw order is L01, accessory, headgear, main hand, L05f, off hand, L06f, L09. Wrong-slot ids are rejected. Unknown ids leave the slot empty.

An offset is recorded only when the authored rig fit already passes, or when a shift of at most 6 px is required to stay inside the 128 canvas and off the ground baseline (y ≥ 122) while the grip stays in the fist. Larger problems are `UNSUPPORTED`.
