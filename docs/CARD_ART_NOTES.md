# CARD ART NOTES — Comedy Fantasy Card Game · First 4 Avatars
Owner of this file and of `assets/characters/<ID>/card/` + `assets/card-art/frames/`: Card Art worker (Agent D).
Consistent with `docs/ART_STYLE_BIBLE.md` §1 (identity locks), §2 (faction palettes), §9 (card composition).
Generated 2026-11-18 (Asia/Bangkok) with the built-in image tool, each with the Owner reference sprite as reference image.

## 1. Composition guidelines (all card art)
- Painted / cel-shaded fantasy illustration, NOT pixel art. Portrait 3:4, native 864 × 1152 px.
- Character full or 3/4 body, centred, readable silhouette; main equipment always visible.
- Faction-themed background: Aegis = castle rampart at golden hour; Phantom = moonlit purple rooftops;
  Celestial = cosmic observatory / nebula; Sanctuary = white-gold cathedral infirmary with jade light.
- No text, logos, stats, rarity or watermarks baked in.
- Frame safe zones (see `assets/card-art/frames/frame_layout.json`, 750 × 1050 card):
  - art is scaled 864×1152 → 690×920 into `art_window` (x30 y30), exact 3:4, no cropping;
  - top-left ~110 px circle (emblem) and top-right 150×40 strip (rarity) overlap the art: keep faces out;
  - name plate (y 896–946) overlaps the bottom ~6 % of the art: keep key features above card y≈890.
- Draw order: card art → faction frame PNG → emblem → runtime text (name, POW/DEF/SPD, rarity gems).

## 2. Per-character identity checklist (vs `assets/reference/sprites/*`)
| ID | Check | Result |
|---|---|---|
| AVT_AEG_001 Sir Potlid | silver pot helmet w/ knob + 2 loop handles + dents | ✅ |
| | brown hair/sideburns, short beard, green eyes, stern frown | ✅ |
| | silver plate, gold rivets, royal-blue tabard w/ gold laurel + hem crest, belt w/ gold buckle, blue cape | ✅ |
| | round pot-lid shield w/ bar handle (viewer's right), short sword w/ gold guard (viewer's left) | ✅ |
| AVT_PHA_001 Nox Squeak | spiky black hair + purple streak/headband, violet eyes, cocky grin | ✅ |
| | purple tattered scarf, sleeveless black top, bandaged forearms, fingerless gloves, sash + gold medallion | ✅ |
| | dual violet-steel kunai, one per hand | ✅ |
| | purple high-tops, yellow star, pink laces, cyan wings, glowing pink LED soles, yellow squeak lines | ✅ |
| AVT_CEL_001 Madame Meteor | silver updo + gold flower, round gold glasses, closed-eye smile, gold earrings | ✅ |
| | huge purple star hat with gold orbit ring | ✅ |
| | purple/gold off-shoulder robe, gold belt w/ gem, starry blue sleeve lining | ✅ |
| | dark staff topped by ringed planet orb + sparkles (viewer's left) | ✅ |
| | white/red instant-noodle cup w/ chopsticks + purple steam (viewer's right) — recognizable | ✅ |
| AVT_SAN_001 Sister Plaster | brown side bun + loose locks, green eyes, serious expression, gold earrings | ✅ |
| | white healer cap with green cross + ribbons | ✅ |
| | white/gold robes, jade lining, green cross tabard, gold brooch w/ green gem | ✅ |
| | giant adhesive-bandage staff w/ gold cross collar + green ribbon (viewer's left) | ✅ |
| | brown satchel w/ white cross + potion bottles; clipboard w/ green-cross chart (viewer's right) | ✅ |

Anatomy check (zoomed crops of all hands): fingers/grips correct on all four; no extra digits found.
No legible text anywhere (Sister Plaster's clipboard has abstract grey "chart lines" only).

## 3. Attempts used
| ID | Attempts | Kept | Notes |
|---|---|---|---|
| AVT_AEG_001 | 1 (+1 variant edit) | try 1 | Variant gold pot = edit of try 1 with the gold-helmet sprite as 2nd reference. |
| AVT_PHA_001 | 2 | try 1 | Try 2 asked to zoom out so sneakers clear the name plate; tool returned a near-duplicate → rejected (`card/_rejected/`). Fixed instead by lowering/slimming the frame name plate. |
| AVT_CEL_001 | 1 | try 1 | — |
| AVT_SAN_001 | 1 | try 1 | — |

## 4. Files, status, sha256
Status legend: CONCEPT | PROTOTYPE | QA_PASSED | PRODUCTION_READY | INTEGRATED. Generated art is at most
PROTOTYPE until Owner review. Card art is a flat illustration (not a modular asset).

| File | Size (B) | Status | sha256 |
|---|---|---|---|
| characters/AVT_AEG_001/card/AVT_AEG_001_card_v1.png (864×1152) | 1565117 | PROTOTYPE | d76154a694635ca19e9f0f0dfc005dd8e570e3a0b210e60c41c1b24c934e2b75 |
| characters/AVT_AEG_001/card/AVT_AEG_001_card_v1_web.webp (512×683) | 86144 | PROTOTYPE | f6e087e7976e58d808b3f1a468469085ddbc24317739631b802eabdb2e0ff65c |
| characters/AVT_AEG_001/card/AVT_AEG_001_card_v1_variant_goldpot.png (optional V2 variant, same ID) | 1500861 | CONCEPT | 61ab7f81220fb974b588edd474735da2cc980020bbe10ec8a23404b09b77ef51 |
| characters/AVT_AEG_001/card/AVT_AEG_001_card_v1_variant_goldpot_web.webp | 85918 | CONCEPT | 888d304fd1fe31c1ab382a276aab6489a606c238fdc25c1dab8a14a404e5e23f |
| characters/AVT_PHA_001/card/AVT_PHA_001_card_v1.png | 1314529 | PROTOTYPE | f28032a87ea50202c04759bb121281836bee19f3390c8a61476e17580cefafef |
| characters/AVT_PHA_001/card/AVT_PHA_001_card_v1_web.webp | 66218 | PROTOTYPE | 832c1795f8bd96018c74df7faf03a6c588a6ad271a1f69536c79cc684d683a32 |
| characters/AVT_CEL_001/card/AVT_CEL_001_card_v1.png | 1814705 | PROTOTYPE | 29dfac1b185f41b3d6845263f94bc0efb51cde7f84b937a728ceca8ea72f0479 |
| characters/AVT_CEL_001/card/AVT_CEL_001_card_v1_web.webp | 115768 | PROTOTYPE | 5281949cf1c984b9952995339ebe153f4b4742422e992a946f954f12bb9c911c |
| characters/AVT_SAN_001/card/AVT_SAN_001_card_v1.png | 1513111 | PROTOTYPE | d8a9cca51e04a273997328f41327d7250f2273ef3c29ffa6fb49fa0a4da66944 |
| characters/AVT_SAN_001/card/AVT_SAN_001_card_v1_web.webp | 90290 | PROTOTYPE | 95e64543b8a8058ad1f657d7c9cafec7552d0054a93694051f8e20b062ac8d49 |
| assets/card-art/frames/shared/FRAME_BASE_001.png (750×1050 RGBA) | 38549 | PROTOTYPE | 3317354ddd1cfc041313e4ad184da2987d116755d96252644ed3e2e3fd33603f |
| assets/card-art/frames/shared/build_frames.py (editable source) | 9077 | PROTOTYPE | 6acbaed9b897424df26faceafefbfba78ca34a4745d2feb5021413f81ae15f5c |
| assets/card-art/frames/factions/FRAME_AEGIS_001.png | 38320 | PROTOTYPE | 4e1dfea73659afd48fd27b95fd91b30927a94755a8dca99d694874dc7391e188 |
| assets/card-art/frames/factions/FRAME_PHANTOM_001.png | 37726 | PROTOTYPE | 2541f973e39f95d47ae47287755452edbc1967b8135089a4e84d09b1a21e4fa0 |
| assets/card-art/frames/factions/FRAME_CELESTIAL_001.png | 38681 | PROTOTYPE | eb803b72a57eac4f62a2423be9e39dae5d19a295d9cb120478c0605179fff414 |
| assets/card-art/frames/factions/FRAME_SANCTUARY_001.png | 39172 | PROTOTYPE | 9350a0f59cad144d7f709a7f2ce7cb6a729bd95866e68ff2b2deb00ad8a4d640 |
| assets/card-art/frames/factions/EMBLEM_AEGIS_001.png (256² RGBA) | 26552 | CONCEPT | 4c1a6100e79a0f14bf819ada6f339b8b3e9bb73c3a06351ccafbe398cea9ee56 |
| assets/card-art/frames/factions/EMBLEM_PHANTOM_001.png | 25980 | CONCEPT | 2cf77f44ecb591ad63d9990dea9cdfba64c64dff4964e922377228ecf4bc2875 |
| assets/card-art/frames/factions/EMBLEM_CELESTIAL_001.png | 18195 | CONCEPT | f8394fee0881a4a05d233728e1ed3a85d9b446d6a016f9dbf5dec1fedc1dcef8 |
| assets/card-art/frames/factions/EMBLEM_SANCTUARY_001.png | 14971 | CONCEPT | 09dc1ebe6cec423fca2c1cd2382e361e60c30c554b3cb92e13c47539c30f2851 |
| assets/card-art/frames/frame_layout.json | 1162 | PROTOTYPE | a9a3d23415b6c917ce75d3c19c0828d0782f76a40839f15be0acd0d3e7c7b423 |

Proofs (review only, not deliverable assets): `assets/card-art/frames/_proofs/PROOF_<file>.png` ×5, `PROOF_contact_sheet.png`,
`FRAMES_and_EMBLEMS_sheet.png`, `EMBLEMS_sheet.png`, generator `_proofs/make_proofs.py`.

## 5. Known flaws / remaining production work
- Resolution: tool output is 864×1152 (not 1024×1536). Sufficient for the 690×920 art window; a print/hi-DPI
  version would need regeneration or upscaling.
- Style: crisp anime/cel-painted look rather than fully painterly; consistent across all four.
- Sir Potlid: pose is a sturdy guard stance (less dynamic than the others); key light is warm back/right golden
  hour, not strictly top-left as the Bible's sprite lighting. Boots partially under the name plate.
- Gold-pot variant: the edit also turned his viewer's-left pauldron gold (drift) — hence CONCEPT, optional only.
  The authoritative Silver→Gold swap is the sprite layer swap, not this card.
- Nox Squeak: viewer's-left sneaker sole sits near the name plate (just clear after the plate fix).
- Sister Plaster: pose fairly static (close to sprite); emblem socket overlaps the bandage staff top edge slightly.
- Emblems are simple original vector-style icons (CONCEPT); no Thai font on the box, so proofs use English names.
- Frames are text-free; POW / DEF / SPD = TBD and rarity gems are empty placeholders (no values assigned).
