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
