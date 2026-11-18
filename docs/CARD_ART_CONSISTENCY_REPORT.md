# CARD ART CONSISTENCY REPORT — v2 quality pass

Date: 2026-11-18 (Asia/Bangkok). Base: `feat/card-art-prototype-mira` @ `d65c89d`.
Scope: the four starter avatar cards and their frames/emblems.
Character IDs are unchanged: `AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, `AVT_SAN_001`.

**No image-generation model was used.** v2 does not regenerate any character.
Silver card paintings are the v1 files, copied byte-for-byte. The gold-pot file is a
deterministic recolour of that silver painting inside a measured pot mask
(`tools/card_art/goldpot_recolor.py`). Identity (face, costume, pose, shield) is the
v1 silver illustration.

Status used here: CONCEPT, PROTOTYPE, QA_PASSED. Nothing in this pass is
PRODUCTION_READY, and nothing is marked QA_PASSED. Owner review is still required.

## 1. What changed

| Asset | v2 treatment | Status |
|---|---|---|
| Four base card PNGs | Byte-identical to v1. Audit only. | PROTOTYPE |
| `AVT_AEG_001` gold pot | Pot helmet recoloured gold. Pauldrons and shield left silver. | PROTOTYPE |
| `FRAME_*_v2.png`, `FRAME_BASE_v2.png` | Same geometry as v1, opaque chrome brighter at the top-left. Art window still transparent. | PROTOTYPE |
| `EMBLEM_AEGIS_v2.png` | Pot-lid redraw. Bar, knob and rivets enlarged so they survive the 96px socket. | CONCEPT |
| Phantom, Celestial, Sanctuary emblems | Unchanged v1. They already read at 96px. | CONCEPT |

v1 files were not overwritten. Their sha256 values still match `docs/CARD_ART_NOTES.md`.
New paths and hashes: `docs/manifest_additions/card_art_v2.json`.
`docs/ASSET_MANIFEST.json` was not edited.

## 2. Audit

Checked against `docs/ART_STYLE_BIBLE.md` §1 and the Owner reference sprites.
Card art stays a painted illustration. It is not mixed with the pixel battle sprites.

| Check | AVT_AEG_001 Sir Potlid | AVT_PHA_001 Nox Squeak | AVT_CEL_001 Madame Meteor | AVT_SAN_001 Sister Plaster |
|---|---|---|---|---|
| Face / expression | Stern frown, green eyes, brown beard. Unchanged from v1. | Cocky grin, violet eyes, purple streak. | Closed-eye smile, gold glasses, silver updo. | Serious, teal eyes, brown side bun. |
| Costume | Silver plate, royal-blue tabard, gold laurel, blue cape. | Black sleeveless top, purple scarf, sash, bandages. | Purple/gold off-shoulder robe, star hat, orbit ring. | White/gold robes, jade lining, healer cap with green cross. |
| Equipment | Pot helmet, pot-lid shield, short sword. Gold variant: pot only. | Dual kunai, flashy high-tops with star, wings, LED soles. | Planet staff (viewer's left), noodle cup (viewer's right). | Bandage staff, satchel, clipboard. |
| Faction ground | Castle, royal blue banners, golden hour. | Moonlit purple rooftops. | Star field and observatory towers. | Cathedral infirmary, jade light. |
| Light vs bible (top-left) | Key light is warm and from the right. Not relit. | Cool moon light, local neon from the shoes. | Star light from above and behind. | Window light from the right. |
| Mobile read at 120px | Silhouette, pot, shield and sword read. Gold pot reads at 180px. | Hair, scarf, daggers and sneakers read. | Hat, staff and cup read; cup is small. | Cap, bandage staff, satchel and clipboard read. |
| Safe zone | Boot soles cross the name plate. | LED soles sit on the name plate. | Staff tip and hem meet the name plate. | Shoes and staff tip meet the name plate. Bandage top enters the emblem socket. |

No gameplay numbers are painted into the art. Proof stat boxes say `POW  TBD`, `DEF  TBD`, `SPD  TBD`.

## 3. Gold pot (the concrete art fix)

v1 `AVT_AEG_001_card_v1_variant_goldpot.png` is a full-image edit. It gilds the
viewer's-left pauldron as well as the pot. The reference sprite
`assets/reference/sprites/aegis_sir_potlid_gold_helmet.png` keeps gold on the pot
only. There is no shield variant.

v2 starts from the silver painting and recolours only the pot:

- Body of the lid is a metal flood stopped by the outline, clipped above the pauldrons.
- Knob, stem and both loop handles are separate measured zones.
- Handle holes stay sky. The bright cap of the knob is an enclosed gap and is filled.
- Colour is a smoothed gold ramp indexed by the silver pixel's luminance, so dents
  and star glints stay. The ramp is sampled from pot-coloured pixels of the v1 edit
  and pulled toward a canonical gold so dark bins do not go crimson. v1 pixels are
  not copied.

Machine check (`tools/card_art/qa_card_art_v2.py`), silver v1 vs gold v2:

| Region | Changed pixels |
|---|---|
| Outside the pot mask | **0** |
| Inside the pot mask | 32516 |
| Pauldron rect (220,330)–(480,500) | **0** |
| Shield rect (560,430)–(840,760) | **0** |
| Face rect (410,235)–(540,330) | **0** |
| Pot rect (320,90)–(620,220) | 26217 |

Before/after (left silver, middle v2 gold, right v1 gold with the pauldron bug):
`docs/qa/card_art_v2/compare/AVT_AEG_001_pauldron.png`,
`AVT_AEG_001_shield.png`, `AVT_AEG_001_head.png`,
`AVT_AEG_001_goldpot_silver_v2_v1gold.png`.
Mask: `docs/qa/card_art_v2/masks/AVT_AEG_001_goldpot_mask.png`.

Residual: the underside of the viewer's-left loop still has a narrow silver rim.
The mask stops there so it does not paint the background under the loop. The
pauldron and the shield are not affected.

## 4. Frames and emblems

Frames (v1 and v2): 750×1050, art window transparent (center alpha 0), no baked
text, rarity gems empty, stat boxes empty. `frame_layout.json` rects are unchanged
(`art_window` 30,30,690,920 and the rest). A `v2` key was added.

v2 frames are the v1 draw with a multiply of about 1.07 at the top-left to 0.95
at the bottom-right, on RGB only. Alpha is untouched. This is the frame-level
answer to the bible's top-left light. It is a chrome pass, not a new design.

Emblems at the 96px socket:

| Emblem | 96px read | Action |
|---|---|---|
| Aegis v1 | Handle and knob collapse into a white blob. Does not read as a pot lid. | Fixed in `EMBLEM_AEGIS_v2.png`. Inner ring removed; bar, knob and two rivets enlarged. Still CONCEPT. |
| Phantom v1 | Crescent and crossed kunai read. | Left as v1. |
| Celestial v1 | Ringed planet and star read. The ring's back half is hidden; the front crosses the planet. | Left as v1. |
| Sanctuary v1 | Bandage and green cross read. | Left as v1. |

Compare: `docs/qa/card_art_v2/compare/EMBLEM_AEGIS_96_v1_v2.png`.

## 5. Safe zones (documented, not reframed)

Art is 864×1152, placed in the 690×920 window at card (30, 30).

- Name plate starts at source y = (896−30) × 1152/920 ≈ **1084**. The bottom ~68px of each painting sits under the plate.
- Emblem socket outer ring covers about source x 8–143, y 8–143.
- Rarity strip covers about source x 664–849, y 23–73. Faces are clear of it.

Moving the figures would mean cropping and cloning background. That was not done.
The overlaps above are the same ones already noted for v1.

## 6. Proofs

Full card proofs (750×1050, v2 frame, TBD stats, no numbers):
`docs/qa/card_art_v2/proofs/PROOF_*.png` and `PROOF_contact_sheet.png`.

Mobile: `docs/qa/card_art_v2/thumbs/*_180.png` (180×252) and `*_120.png` (120×168).

Rebuild: `python3 tools/card_art/build_card_art_v2.py`
Checks: `python3 tools/card_art/qa_card_art_v2.py` (42 passed, 0 failed on this pass).
