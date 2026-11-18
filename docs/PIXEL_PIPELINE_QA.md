# PIXEL PIPELINE + PREVIEW QA (Agent A/B/C/E self-QA) — 2026-11-18 (Asia/Bangkok)
Independent final audit (Agent F / docs/QA_REPORT.md) is separate; this file records what the pixel/preview owner verified.

## Automated checks (tools/qa_checks.py → docs/qa/qa_checks.json)
| Check | Result |
|---|---|
| All pixel PNGs alpha strictly 0/255 (55 files) | PASS — 0 partial-alpha pixels |
| Every character layer is 128×128 | PASS |
| Default loadout composite vs pixelized reference (round-trip) | PASS — 0 px difference on all 4 |
| Silver→Gold swap changes only helmet pixels | PASS — 497 px changed, 0 outside the helmet layer |
| Unique asset IDs in manifest | PASS (87 entries) |
| Preview console/page errors (desktop + mobile, local + standalone) | PASS — none |
| Standalone HTML: broken images | PASS — 0; no horizontal overflow at 1440, 844×390, 390×844 |

## Visual checks (stills in docs/qa/)
- Desktop 1440×900: `desk_1440_potlid_silver.png`, `desk_1440_potlid_gold.png`, `desk_1440_meteor_neutral_staff.png`,
  `desk_1440_plaster_neutral_staff.png`, `desk_1440_nox_anchors.png`, `desk_1440_fullpage.png`, `desk_1440_card_zoom.png`,
  `desk_1440_attack_frame.png`, `desk_1440_ko.png`, `standalone_desk_1440.png`.
- Phone landscape 844×390: `mob_844x390_landscape_potlid.png`, `..._gold.png`, `..._plaster_neutral.png`, `mob_844x390_staff_test.png`, `standalone_mob_844x390.png`.
- Phone portrait 390×844: `mob_390x844_portrait.png`, `mob_390x844_portrait_meteor_neutral.png` (full page).
- Composites (reference compositor, 4×): `composite_base_sprites.png`, `composite_potlid_silver_vs_gold.png`,
  `composite_shared_staff_test.png`, `composite_shared_equipment_test.png`. Sections: `section_*.png`. Animation stills: `anim_*.png`, `anchors_AVT_PHA_001.png`.

## Issues found and fixed during QA
- Sister Plaster staff shaft was mis-classified as skin → shaft left in body; re-traced polyline mask.
- Stray orphan pixels after cuts → re-assigned to the adjacent item layer (32–80 px per character).
- Mirror-fill behind Potlid's shield produced a dark smear at the rim → fallback removed (left transparent).
- Hair caps leaked 2–4 px outside the helmet → restricted to under-headgear pixels (round-trip now exact).
- Neutral staff poked below the baseline → shortened (15×102).
- Basic sword sat over Potlid's forearm → per-character fit (−6,−2).
- KO fall rotated off-canvas → pivot moved to body_center + post-rotation settle offset.
- Mobile: equipment table forced 518 px width on a 390 px screen → fixed table layout; landscape card sized to viewport height.

## Known weaknesses (not fixed)
- Sprites are scripted downscales (area + k-means palette + selective outline) of AI-made flat references: some noisy
  clusters (Meteor's robe embroidery), not clean hand-placed pixel clusters. 62–80 colours per character vs the Bible's ≤48 target.
- L01 contains body + face/hair + outfit together (no separate L02/L03).
- Repainted hidden areas are rough: Potlid without shield (mirrored arm), Nox without sneakers (blob feet),
  Plaster/Meteor without staff (inpaint smear on robe), hair caps under headgear are simple shaded domes.
- No rotation of held items: the vertical neutral staff and vertical sword do not follow each pose's arm angle.
- Attack/Defend/Hit/KO are whole-sprite transforms + flashes + VFX, not hand-drawn frames; KO rotation of pixel art is jaggy; tall figures clip at the 128 canvas edge when lying down.
- Card art lighting for Potlid is back/right (see CARD_ART_NOTES).
