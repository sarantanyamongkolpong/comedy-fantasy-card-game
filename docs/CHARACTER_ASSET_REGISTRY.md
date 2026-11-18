# CHARACTER ASSET REGISTRY — First 4 Avatars (pixel / modular side)
Generated 2026-11-18 (Asia/Bangkok). Source of truth for numbers: `assets/characters/_rigs/*.json`, `docs/ASSET_MANIFEST.json`.
Status legend: CONCEPT · PROTOTYPE · QA_PASSED · PRODUCTION_READY · INTEGRATED. **Nothing below is PRODUCTION_READY.**

## Common conventions
- Logical canvas **128 × 128**, feet baseline **y = 122**, scale 0.09 × reference, alpha 0/255, nearest-neighbour only.
- Compositor order: `L01 body` → `L08 accessory` → `L04 headgear` → `L05 main-hand item` → `L05f main-hand grip overlay`
  → `L06 off-hand item` → `L06f off-hand grip overlay` → `L09 vfx`.
- Equip rule: item drawn at `anchor[slot] − item.pivot (+ fit offset)`; headgear uses `head`, accessories use `feet`.
- `L05f/L06f` grip overlays = the character's original fist pixels; drawn above any held item so it reads as gripped.
- Real vs approximated: L01 is ONE layer containing Base Body + Face/Hair + Outfit (the flat reference cannot be
  separated reliably at 128 px). Equipment layers are real cuts. Pixels hidden behind each removed item were repainted
  by script (details per character). Sprites are scripted conversions of the Owner's references, not hand-pixelled.

## AVT_AEG_001 — Sir Potlid / เซอร์ฝาหม้อ · Aegis Dominion · Tank · rig `humanoid_heavy`
Anchors: head (66,34) · main_hand (46,75) · off_hand (86,76) · back (60,58) · body_center (62,80) · feet (64,122)
| Layer / item | File | Status | Notes |
|---|---|---|---|
| L01 body | sprite/AVT_AEG_001_L01_body.png | PROTOTYPE | 162 px hair cap painted under the pot; 54 px of fist/guard area inpainted; 1114 px behind shield mirror-filled from the sword-side half (pauldron/arm/cape; approximate) |
| L04 headgear V1 | sprite/AVT_AEG_001_L04_headgear_silver.png · item EQ_AEG_POT_HELMET_SILVER_001 (pivot 22,10) | PROTOTYPE | real cut of the silver pot incl. handles + knob; covers the painted hair cap fully |
| L04 headgear V2 | sprite/AVT_AEG_001_L04_headgear_gold.png · item EQ_AEG_POT_HELMET_GOLD_001 (pivot 22,10) | PROTOTYPE | recolour of OUR silver layer by luminance rank; gold ramp sampled from the Owner gold ref palette. Same shape/pivot. Verified: swapping changes 497 px, **0 px outside the helmet** |
| L05 main hand | sprite/..._L05_main_hand.png · EQ_AEG_SWORD_POTLID_001 (pivot 17,31) | PROTOTYPE | short sword, gold guard + pommel |
| L05f | sprite/..._L05f_main_hand_front.png | PROTOTYPE | gauntlet grip overlay |
| L06 off hand | sprite/..._L06_off_hand.png · EQ_AEG_SHIELD_POTLID_001 (pivot 18,24) | PROTOTYPE | pot-lid shield |
| fit | EQ_SWORD_BASIC_001 [-6,-2], EQ_DAGGER_BASIC_001 [-4,0] | | QA-tuned per-character offsets |

## AVT_PHA_001 — Nox Squeak / น็อกซ์ รองเท้าดัง · Phantom Blades · DPS · rig `humanoid_standard`
Anchors: head (70,30) · main_hand (40,66) · off_hand (88,60) · back (60,52) · body_center (64,74) · feet (64,122)
| Layer / item | File | Status | Notes |
|---|---|---|---|
| L01 body | sprite/AVT_PHA_001_L01_body.png | PROTOTYPE | scarf, hair, outfit baked; 431 px placeholder dark "tabi" feet painted under the sneakers (crude, only visible with sneakers removed) |
| L05 / L05f | EQ_PHA_KUNAI_MAIN_001 (pivot 5,-3) + grip overlay | PROTOTYPE | pivot y is negative = grip is above the cropped blade (inside the fist); valid |
| L06 / L06f | EQ_PHA_KUNAI_OFF_001 (pivot 1,-3) + grip overlay | PROTOTYPE | |
| L08 accessory | EQ_PHA_SNEAKERS_SQUEAK_001 (pivot 34,21 → feet) | PROTOTYPE | both sneakers as one item (pair) |
| L09 vfx | sprite/AVT_PHA_001_L09_vfx_squeak.png (VFX_PHA_SQUEAK_001) | PROTOTYPE | yellow squeak lines, animated by offset; hidden when sneakers are removed |

## AVT_CEL_001 — Madame Meteor / มาดามดาวตก · Celestial Nexus · Magic · rig `humanoid_standard`
Anchors: head (68,32) · main_hand (44,62) · off_hand (89,58) · back (64,56) · body_center (66,78) · feet (64,122)
| Layer / item | File | Status | Notes |
|---|---|---|---|
| L01 body (no staff) | sprite/AVT_CEL_001_L01_body.png | PROTOTYPE | staff removed: 191 px of robe/sleeve under the shaft inpainted; 67 px grey hair cap under the hat; small notch remains in the hat-brim/hair edge where the staff top overlapped |
| L04 headgear | EQ_CEL_HAT_ASTRO_001 (pivot 24,16) | PROTOTYPE | hat + orbit ring |
| L05 signature staff | EQ_CEL_STAFF_PLANET_001 (pivot 19,45) | PROTOTYPE | ringed-planet staff incl. sparkles; equippable on Sister Plaster |
| L05f | grip overlay | PROTOTYPE | |
| L06 off hand | EQ_CEL_NOODLE_CUP_001 (pivot 3,14) | PROTOTYPE | instant-noodle cup |
| L09 vfx | VFX_CEL_NOODLE_STEAM_001 | PROTOTYPE | steam, hidden when the cup is unequipped |

## AVT_SAN_001 — Sister Plaster / ซิสเตอร์พลาสเตอร์ · Sanctuary Order · Support · rig `humanoid_standard`
Anchors: head (68,18) · main_hand (48,61) · off_hand (93,60) · back (62,54) · body_center (66,78) · feet (64,122)
| Layer / item | File | Status | Notes |
|---|---|---|---|
| L01 body (no staff) | sprite/AVT_SAN_001_L01_body.png | PROTOTYPE | staff removed: 266 px robe under the shaft inpainted (slightly smeared near the hem); satchel + strap stay baked in L01 (not split — the strap crosses the whole torso); 60 px hair cap under the cap |
| L04 headgear | EQ_SAN_CAP_HEALER_001 (pivot 12,5) | PROTOTYPE | cap ribbons stay in L01 (visible when the cap is removed) |
| L05 signature staff | EQ_SAN_STAFF_BANDAGE_001 (pivot 24,52) | PROTOTYPE | bandage staff + ribbon; equippable on Madame Meteor |
| L05f | grip overlay | PROTOTYPE | |
| L06 off hand | EQ_SAN_CLIPBOARD_001 (pivot 9,16) | PROTOTYPE | clipboard |

## Shared assets (cross-character reuse)
| Asset | Pivot | Tested on | Status |
|---|---|---|---|
| EQ_STAFF_NEUTRAL_001 (15×102) | grip (7,45) | **Madame Meteor + Sister Plaster** (main_hand, no per-character fit needed) | PROTOTYPE |
| EQ_SWORD_BASIC_001 (11×36) | grip (5,29) | Sir Potlid (fit −6,−2), Nox Squeak | PROTOTYPE |
| EQ_DAGGER_BASIC_001 (7×22) | grip (3,4) | Nox main+off hand, Sir Potlid | PROTOTYPE |
| EQ_SHIELD_BUCKLER_001 (24×24) | grip (12,12) | Sir Potlid, Sister Plaster (off_hand) | PROTOTYPE |
| Signature staffs cross-equipped | — | Planet staff on Plaster, Bandage staff on Meteor | PROTOTYPE |
| VFX_SLASH_001 / VFX_HIT_SPARK_001 / VFX_HEAL_SPARKLE_001 / VFX_MAGIC_PARTICLE_001 / VFX_GUARD_RING_001 | per-frame pivot | all 4 via ANIM_SHARED_001 | PROTOTYPE |
| ANIM_SHARED_001 (idle/attack/defend/hit/ko timing) | — | all 4; rig_scale for heavy | Idle PROTOTYPE (tuned) · others PROTOTYPE (procedural) |
| Rigs humanoid_heavy / humanoid_standard | default + per-character anchors | — | PROTOTYPE |

## Card art (produced by the Card Art worker — see docs/CARD_ART_NOTES.md)
`assets/characters/<ID>/card/<ID>_card_v1.png` (+ `_web.webp`), frames `assets/card-art/frames/factions/FRAME_<FACTION>_001.png`,
emblems `EMBLEM_<FACTION>_001.png`, layout `assets/card-art/frames/frame_layout.json`. The preview loads these paths directly.
