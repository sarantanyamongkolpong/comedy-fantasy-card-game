# QA Report — Comedy Fantasy Card Game · First 4 Avatars (Art & Asset Pipeline Prototype v1)
Auditor: Mira (final audit), 2026-11-18 ICT. Sources: docs/PIXEL_PIPELINE_QA.md, docs/CARD_ART_NOTES.md, docs/qa/qa_checks.json, docs/qa/*.png (viewed).

## Acceptance checklist
| Item | Result | Evidence |
|---|---|---|
| Four recognizable characters | PASS | docs/qa/composite_base_sprites.png, card proofs |
| Four separate Card Art illustrations | PASS (PROTOTYPE) | assets/characters/*/card/*_card_v1.png, 864x1152 |
| Four Pixel Art sprites | PASS (PROTOTYPE, scripted conversion) | 128x128, feet y=122 |
| Transparent sprite backgrounds | PASS | qa_checks.json alpha_binary = 0 non-binary px on all layers |
| Consistent visual identity | PASS with notes | default-equipped composites = pixelized reference (0 px diff) |
| Distinct four Factions | PASS | 4 faction frames + emblems (emblems CONCEPT) |
| Reusable card frame structure | PASS | assets/card-art/frames/frame_layout.json, build_frames.py |
| Shared asset architecture documented | PASS | ART_STYLE_BIBLE.md, rigs/*.json, ASSET_MANIFEST.json |
| Golden Pot variant exists | PASS | EQ_AEG_POT_HELMET_GOLD_001 |
| Golden Pot swaps without replacing body | PASS | only L04 changes (497 px, all inside helmet); same ID |
| Shared staff works on two characters | PASS | EQ_STAFF_NEUTRAL_001 on Meteor + Plaster via anchor composition; signature staffs also cross-swap |
| Preview desktop | PASS | docs/qa/desk_1440_* |
| Preview mobile | PASS | docs/qa/mob_844x390_*, docs/qa/mob_390x844_* |
| Asset Manifest complete | PASS | 87 assets: 76 PROTOTYPE, 11 CONCEPT, 0 PRODUCTION_READY |
| No unrelated gameplay code modified | PASS | standalone folder; no battle engine, no stats/costs invented (TBD) |

## Honest limitations
- Body/face/hair/outfit are baked into one L01 layer per character (flat source); Plaster's satchel stays in body.
- Hidden areas (under shield, staffs, sneakers) are automated fills: fine when equipped, rough when slot empty.
- Held items don't rotate to arm angle.
- Only Idle is tuned; Attack/Defend/Hit/KO are procedural PROTOTYPE (KO clips tall characters).
- Sprites use 62–80 colours (Bible target ≤48); Meteor robe embroidery noisy.
- Gold-pot card art variant is CONCEPT (gold spread to pauldron). Potlid card light is backlit, not top-left.
- No Thai font on build machine for proofs; preview uses browser fonts.
Nothing is PRODUCTION_READY until Owner review and a hand-pixel cleanup pass.

<!-- EQUIPMENT_STRESS_BEGIN -->
## Cross-character equipment stress (t231)

Harness: `python3 tools/equipment_tests/run_equipment_stress.py`. Date of the rules: 2026-11-18 ICT.
Status of this section: **PROTOTYPE**. Not PRODUCTION_READY. Owner approval is required before any merge. No anchor, rig value, sprite, or item JSON was modified.

The compositor places every item with `origin = anchor[slot] − pivot + offset` and draws L01, accessory, headgear, main hand, L05f, off hand, L06f, L09. Headgear uses `head`. Accessories use `feet`. Alpha must be 0 or 255. An item that cannot sit on the fist without leaving the 128 canvas or the ground band (y ≥ 122) is **UNSUPPORTED**. The body is not scaled or rotated to force it.

### Matrix totals

| Status | Count |
|---|---:|
| PASS | 64 |
| PASS_WITH_ADJUSTMENT | 5 |
| UNSUPPORTED | 3 |
| FAIL | 0 |
| TOTAL | 72 |

### Named cases

| Case | Result | Detail |
|---|---|---|
| TC01 Silver Pot → Golden Pot | PASS | masks identical (497 px), recolored 497 px, 0 px outside the helmet, pivot [22, 10] unchanged, character id AVT_AEG_001 unchanged |
| TC02 Basic sword on compatible characters | PASS | AVT_AEG_001 PASS_WITH_ADJUSTMENT [-6, -2]; AVT_PHA_001 PASS [0, 0]; AVT_CEL_001 PASS [0, 0]; AVT_SAN_001 PASS [0, 0] |
| TC03 Shared dagger on main and off hand | PASS | AVT_AEG_001 main_hand PASS_WITH_ADJUSTMENT [-4, 0]; AVT_AEG_001 off_hand PASS [0, 0]; AVT_PHA_001 main_hand PASS [0, 0]; AVT_PHA_001 off_hand PASS [0, 0]; AVT_CEL_001 main_hand PASS [0, 0]; AVT_CEL_001 off_hand PASS [0, 0]; AVT_SAN_001 main_hand PASS [0, 0]; AVT_SAN_001 off_hand PASS [0, 0] |
| TC04 Neutral staff on Madame Meteor | PASS | Madame Meteor PASS offset [0, 0]; overflow 0; baseline 0 |
| TC05 Neutral staff on Sister Plaster | PASS | Sister Plaster PASS offset [0, 0]; overflow 0; baseline 0 |
| TC06 Buckler on humanoid rigs | PASS | AVT_AEG_001 PASS; AVT_PHA_001 PASS; AVT_CEL_001 PASS; AVT_SAN_001 PASS |
| TC07 Equipment removal reveals hidden body pixels | PASS | hidden body pixels revealed: EQ_AEG_POT_HELMET_SILVER_001 161/162, EQ_AEG_POT_HELMET_GOLD_001 162/162, EQ_AEG_SWORD_POTLID_001 54/54, EQ_AEG_SHIELD_POTLID_001 599/626, EQ_PHA_KUNAI_MAIN_001 31/31, EQ_PHA_KUNAI_OFF_001 1/1, EQ_PHA_SNEAKERS_SQUEAK_001 431/431, EQ_CEL_HAT_ASTRO_001 67/67, EQ_CEL_STAFF_PLANET_001 189/191, EQ_CEL_NOODLE_CUP_001 12/13, EQ_SAN_CAP_HEALER_001 60/60, EQ_SAN_STAFF_BANDAGE_001 263/266, EQ_SAN_CLIPBOARD_001 8/8 |
| TC08 Equipment replacement | PASS | EQ_AEG_SWORD_POTLID_001→EQ_SWORD_BASIC_001 stray 0; EQ_PHA_KUNAI_MAIN_001→EQ_DAGGER_BASIC_001 stray 0; EQ_CEL_STAFF_PLANET_001→EQ_STAFF_NEUTRAL_001 stray 0; EQ_SAN_STAFF_BANDAGE_001→EQ_STAFF_NEUTRAL_001 stray 0; EQ_AEG_POT_HELMET_SILVER_001→EQ_AEG_POT_HELMET_GOLD_001 stray 0 |
| TC09 Missing equipment fallback | PASS | unknown ids leave the slot empty and do not raise |
| TC10 Wrong-slot equipment rejection | PASS | 6 wrong-slot attempts rejected; legal sibling slots still draw |

### Offsets recorded

- `AVT_AEG_001` + `EQ_DAGGER_BASIC_001` (main_hand) offset [-4, 0] (rig_fit)
- `AVT_AEG_001` + `EQ_SWORD_BASIC_001` (main_hand) offset [-6, -2] (rig_fit)
- `AVT_PHA_001` + `EQ_CEL_STAFF_PLANET_001` (main_hand) offset [0, -3] (stress_search)
- `AVT_PHA_001` + `EQ_SAN_STAFF_BANDAGE_001` (main_hand) offset [0, -4] (stress_search)
- `AVT_PHA_001` + `EQ_STAFF_NEUTRAL_001` (main_hand) offset [0, -1] (stress_search)

### Unsupported (not forced)

- `AVT_AEG_001` + `EQ_CEL_STAFF_PLANET_001` (main_hand): UNSUPPORTED no integer offset within ±6 keeps the grip on the anchor and clears canvas overflow and the ground baseline. Body was not scaled. Remaining: overflow 8px past the 128 canvas; 27px cross the ground baseline y=122 (rows 122–127 are shadow/VFX).
- `AVT_AEG_001` + `EQ_SAN_STAFF_BANDAGE_001` (main_hand): UNSUPPORTED no integer offset within ±6 keeps the grip on the anchor and clears canvas overflow and the ground baseline. Body was not scaled. Remaining: overflow 47px past the 128 canvas; 37px cross the ground baseline y=122 (rows 122–127 are shadow/VFX).
- `AVT_AEG_001` + `EQ_STAFF_NEUTRAL_001` (main_hand): UNSUPPORTED humanoid_heavy is not in compatible_rigs ['humanoid_standard'] for EQ_STAFF_NEUTRAL_001. The body was not scaled to force a fit. At [0, 0]: overflow 14px past the 128 canvas; 30px cross the ground baseline y=122 (rows 122–127 are shadow/VFX).

### Harness failures

- None.

### Sheets (17, nearest-neighbour)

- `docs/qa/equipment_stress/tc01_silver_to_gold.png`
- `docs/qa/equipment_stress/tc02_basic_sword.png`
- `docs/qa/equipment_stress/tc03_shared_dagger.png`
- `docs/qa/equipment_stress/tc04_neutral_staff_meteor.png`
- `docs/qa/equipment_stress/tc05_neutral_staff_plaster.png`
- `docs/qa/equipment_stress/tc06_buckler.png`
- `docs/qa/equipment_stress/tc07_removal.png`
- `docs/qa/equipment_stress/tc08_replacement.png`
- `docs/qa/equipment_stress/tc09_missing_fallback.png`
- `docs/qa/equipment_stress/tc10_wrong_slot.png`
- `docs/qa/equipment_stress/matrix_AVT_AEG_001.png`
- `docs/qa/equipment_stress/matrix_AVT_PHA_001.png`
- `docs/qa/equipment_stress/matrix_AVT_CEL_001.png`
- `docs/qa/equipment_stress/matrix_AVT_SAN_001.png`
- `docs/qa/equipment_stress/overflow_padded.png`
- `docs/qa/equipment_stress/anchors.png`
- `docs/qa/equipment_stress/adjustments.png`

Full table: `docs/EQUIPMENT_COMPATIBILITY_MATRIX.md`. Anchor notes: `docs/ANCHOR_CORRECTION_RECOMMENDATIONS.md`.
<!-- EQUIPMENT_STRESS_END -->



