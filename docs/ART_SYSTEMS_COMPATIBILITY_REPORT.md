# Art / systems compatibility report

Cross-check of the Mira art prototype and the systems loader. No art file is copied into this branch. The branches are not merged.

| | |
|---|---|
| Art branch | `feat/card-art-prototype-mira` |
| Art commit | `d65c89dc87a9554d5611a108146b509c7aa7fcf0` |
| Art pull request | #1, open, not merged |
| Systems base | `feat/card-systems-cursor` `dba87d708f456f9059f9df3da3cb6f3e219795cd` |
| Systems pull request | #2, open, not merged |
| Integration branch | `integration/art-systems-contract` |
| Manifest rows | 87 |
| Status counts | CONCEPT 11, PROTOTYPE 76, QA_PASSED 0, PRODUCTION_READY 0, INTEGRATED 0 |
| Check tally | PASS 9, REQUIRES_ART_CHANGE 3 |
| Implementation | Tested adapter and audit. Not PRODUCTION_READY. |

The adapter in `src/integration/` copies shared item keys into `asset_id`, bundles the two rig files, and resolves rig layer basenames to `assets/characters/<ID>/sprite/<file>`. It leaves pipe-delimited slots unchanged, so the loader still returns `AMBIGUOUS_SLOT` until the caller passes a hand. It does not add stats, rarity, or AP costs.

## Per-check status

| # | Check | Status |
|---|---|---|
| 1 | Character ID compatibility | PASS |
| 2 | Equipment ID compatibility | PASS |
| 3 | Asset Manifest format | PASS |
| 4 | rig definitions | PASS |
| 5 | equipment slots | REQUIRES_ART_CHANGE |
| 6 | anchor names | REQUIRES_ART_CHANGE |
| 7 | pivot coordinates | PASS |
| 8 | character variant references | REQUIRES_ART_CHANGE |
| 9 | card frame layout data | PASS |
| 10 | asset status handling | PASS |
| 11 | path resolution | PASS |
| 12 | missing asset behaviour | PASS |

## Specific issues

| Issue | Status | Evidence |
|---|---|---|
| Item anchor naming | REQUIRES_ART_CHANGE | Single-slot equipment has no anchor name. The slot map supplies head, main_hand, off_hand, back, and feet. |
| Shared equipment slot arrays | REQUIRES_ART_CHANGE | EQ_DAGGER_BASIC_001 uses slot "main_hand\|off_hand" in shared_items.json and in the manifest. |
| Asset ID inside item records | REQUIRES_ART_CHANGE | Four shared item bodies omit asset_id. Per-character items.json already stores it. The key still matches the manifest. |
| variant_of compatibility | REQUIRES_ART_CHANGE | EQ_AEG_POT_HELMET_GOLD_001.variant_of is EQ_AEG_POT_HELMET_SILVER_001. Card, sprite, and composite variants omit variant_of. |
| Manifest status enums | PASS | Legend CONCEPT, PROTOTYPE, QA_PASSED, PRODUCTION_READY, INTEGRATED. Live counts CONCEPT 11, PROTOTYPE 76, QA_PASSED 0, PRODUCTION_READY 0, INTEGRATED 0. |
| Duplicate IDs | PASS | The real manifest has no duplicate asset_id. |

## Check evidence

### 1. Character ID compatibility

Status: **PASS**

- Manifest character ids match the systems catalog: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001.
- English name, Thai name, faction, role, and rig id on each manifest line match the systems sample.
- Starter-pack slugs in assets/reference/asset_manifest.json pair by Thai name and are not loader ids: aegis_sir_potlid → AVT_AEG_001; phantom_nox_squeak → AVT_PHA_001; celestial_madame_meteor → AVT_CEL_001; sanctuary_sister_plaster → AVT_SAN_001.

### 2. Equipment ID compatibility

Status: **PASS**

- 17 equipment ids match across docs/ASSET_MANIFEST.json and the item JSON files.
- Rig native_items objects match each character items.json.
- Shared item bodies omit asset_id (EQ_STAFF_NEUTRAL_001, EQ_SWORD_BASIC_001, EQ_DAGGER_BASIC_001, EQ_SHIELD_BUCKLER_001). The object key matches the manifest id. Keyed loader lookup still resolves. R-ASSET-ID records the field to add.
- The systems sample lists 3 of 17 art equipment ids. No stats were added for the rest.

### 3. Asset Manifest format

Status: **PASS**

- asset_count 87 equals assets.length. validateAssetManifest structural errors: 0.
- 0 duplicate asset_id values. The loader keeps the first row and records DUPLICATE_ID when a copy is introduced.
- Loader warnings on the real manifest: none.
- Entry types: animation_timing, card_art, card_emblem, card_frame, card_frame_layout, equipment_item, metadata, owner_reference_flat, preview, rig_definition, sprite_composite_flattened, sprite_layer, sprite_sheet_idle, vfx_strip.
- assets/reference/asset_manifest.json has no assets array (manifest.assets array is required). The loader manifest is docs/ASSET_MANIFEST.json.

### 4. rig definitions

Status: **PASS**

- Rig files match manifest rig_definition paths: assets/characters/_rigs/humanoid_heavy.json, assets/characters/_rigs/humanoid_standard.json.
- Per-character anchors are the placement source. default_anchors differ from those anchors on 4 character blocks. The adapter does not copy default_anchors over a character.
- ANIM_SHARED_001 asset_id matches its manifest row.
- Clip status strings stay descriptive (PROTOTYPE (tuned, loopable); PROTOTYPE (procedural lunge); PROTOTYPE (procedural brace); PROTOTYPE (procedural recoil + flash); PROTOTYPE (procedural tilt/fall, nearest rotation about body_center, settles on baseline)). The manifest row status is PROTOTYPE.

### 5. equipment slots

Status: **REQUIRES_ART_CHANGE**

- EQ_DAGGER_BASIC_001 slot is the string "main_hand|off_hand". Placement without a chosen hand returns AMBIGUOUS_SLOT.
- 16 equipment rows use one slot name that the slot map knows. Pipe-delimited slots are listed as R-SLOTS.

### 6. anchor names

Status: **REQUIRES_ART_CHANGE**

- Anchor name set from the starter pack: head, main_hand, off_hand, back, body_center, feet.
- Animation "at" targets are rig anchor names: main_hand, body_center, off_hand.
- Equipment JSON stores slot and pivot. It does not store an anchor name. R-ANCHOR is that field. Placement uses src/assets/slot-anchor-map.json until the field exists.

### 7. pivot coordinates

Status: **PASS**

- 13 placements match a recorded native origin. 0 disagree.
- Negative pivot components are grip points above a crop: EQ_PHA_KUNAI_MAIN_001 [5, -3]; EQ_PHA_KUNAI_OFF_001 [1, -3].

### 8. character variant references

Status: **REQUIRES_ART_CHANGE**

- EQ_AEG_POT_HELMET_GOLD_001 variant_of EQ_AEG_POT_HELMET_SILVER_001 matches the systems sample. Status PROTOTYPE.
- 1 manifest row(s) already store variant_of. Rows with a variant label, "_variant_" in the id, or a _GOLDPOT suffix and no variant_of are R-VARIANT. Plain _web exports of a base card are format siblings and are not variant rows.

### 9. card frame layout data

Status: **PASS**

- frame_layout.json rects art_window, faction_emblem, rarity, name, stat_pow, stat_def, stat_spd match layoutRect. Canvas 750×1050. Units: px, [x, y, w, h], origin top-left.

### 10. asset status handling

Status: **PASS**

- status_legend matches the systems enum: CONCEPT, PROTOTYPE, QA_PASSED, PRODUCTION_READY, INTEGRATED.
- Counts: CONCEPT 11, PROTOTYPE 76, QA_PASSED 0, PRODUCTION_READY 0, INTEGRATED 0. productionReady rows: 0. Nothing is PRODUCTION_READY. Sprite layers are real separate PNGs on a shared 128x128 canvas but were cut from flat Owner references by script; occluded pixels are repainted approximations.

### 11. path resolution

Status: **PASS**

- Rig layer file names are sprite-folder basenames. Resolved path is assets/characters/<ID>/sprite/<file>, matching tools/build_manifest.py. 24 layers resolve to a manifest path.
- 87 manifest paths exist and their sha256 and byte length match the blobs. Prefixes: rigs 2, character 56, equipment 5, vfx 6, animations 1, card-art 10, reference 5, preview 2.
- Shared item bodies omit file. The manifest path is the repo-relative PNG.

### 12. missing asset behaviour

Status: **PASS**

- Animation vfx ids resolve in the manifest: VFX_SLASH_001, VFX_GUARD_RING_001, VFX_HIT_SPARK_001, VFX_MAGIC_PARTICLE_001, VFX_HEAL_SPARKLE_001.
- An unknown id returns found false, reason MISSING_ID, productionReady false.
- CARD_AVT_AEG_001_card_v1_variant_goldpot is CONCEPT and still resolves. The loader keeps advisory rows.

## Placement sample

`origin = anchor − pivot + fit`. `matches` compares that origin to `native_origin` when the item records one.

| Equipment | Avatar | Slot | Anchor | Matches | Reason |
|---|---|---|---|---|---|
| EQ_AEG_POT_HELMET_SILVER_001 | AVT_AEG_001 | headgear | head | true |  |
| EQ_AEG_POT_HELMET_GOLD_001 | AVT_AEG_001 | headgear | head | true |  |
| EQ_AEG_SWORD_POTLID_001 | AVT_AEG_001 | main_hand | main_hand | true |  |
| EQ_AEG_SHIELD_POTLID_001 | AVT_AEG_001 | off_hand | off_hand | true |  |
| EQ_PHA_KUNAI_MAIN_001 | AVT_PHA_001 | main_hand | main_hand | true |  |
| EQ_PHA_KUNAI_OFF_001 | AVT_PHA_001 | off_hand | off_hand | true |  |
| EQ_PHA_SNEAKERS_SQUEAK_001 | AVT_PHA_001 | accessory | feet | true |  |
| EQ_CEL_HAT_ASTRO_001 | AVT_CEL_001 | headgear | head | true |  |
| EQ_CEL_STAFF_PLANET_001 | AVT_CEL_001 | main_hand | main_hand | true |  |
| EQ_CEL_NOODLE_CUP_001 | AVT_CEL_001 | off_hand | off_hand | true |  |
| EQ_SAN_CAP_HEALER_001 | AVT_SAN_001 | headgear | head | true |  |
| EQ_SAN_STAFF_BANDAGE_001 | AVT_SAN_001 | main_hand | main_hand | true |  |
| EQ_SAN_CLIPBOARD_001 | AVT_SAN_001 | off_hand | off_hand | true |  |
| EQ_STAFF_NEUTRAL_001 | AVT_CEL_001 | main_hand | main_hand |  |  |
| EQ_STAFF_NEUTRAL_001 | AVT_SAN_001 | main_hand | main_hand |  |  |
| EQ_SWORD_BASIC_001 | AVT_AEG_001 | main_hand | main_hand |  |  |
| EQ_SWORD_BASIC_001 | AVT_PHA_001 | main_hand | main_hand |  |  |
| EQ_DAGGER_BASIC_001 | AVT_PHA_001 |  |  |  | AMBIGUOUS_SLOT |
| EQ_DAGGER_BASIC_001 | AVT_PHA_001 | main_hand | main_hand |  |  |
| EQ_DAGGER_BASIC_001 | AVT_PHA_001 | off_hand | off_hand |  |  |
| EQ_DAGGER_BASIC_001 | AVT_AEG_001 | main_hand | main_hand |  |  |
| EQ_DAGGER_BASIC_001 | AVT_AEG_001 | off_hand | off_hand |  |  |
| EQ_SHIELD_BUCKLER_001 | AVT_AEG_001 | off_hand | off_hand |  |  |
| EQ_SHIELD_BUCKLER_001 | AVT_SAN_001 | off_hand | off_hand |  |  |

## Art changes

45 rows are listed in `docs/REQUIRED_CHANGES_FOR_MIRA.md`.

- R-ANCHOR: 32
- R-ASSET-ID: 4
- R-SLOTS: 4
- R-VARIANT: 5

## Known issues

- compatible_rigs on shared items is preserved on the normalized copy. The loader has no rejection rule for it, and this audit does not add one.
- A no-commit merge of the art branch into the systems branch conflicts on README.md and tests/README.md. This branch does not resolve those files and does not commit a merge.
- assets/reference/asset_manifest.json keeps slug ids (aegis_sir_potlid and the other three). The live ids are the AVT_* keys in docs/ASSET_MANIFEST.json.
- Nothing in the manifest is QA_PASSED, PRODUCTION_READY, or INTEGRATED. This audit is not PRODUCTION_READY.

## How to run

From the repository root, with the art ref available locally:

```bash
node --test --test-reporter spec
node tools/integration/fetch-art-contract.mjs
```

`node --test` reads the pinned art commit with `git show`. The fetch script checks that commit out into a temporary worktree, runs `git merge --no-commit`, runs the same suite against the files on disk, aborts the merge, and deletes the worktree.

## CLI preview

```text
Comedy Fantasy Card Game — art/systems contract
art: d65c89dc87a9554d5611a108146b509c7aa7fcf0 (feat/card-art-prototype-mira, PR #1)
systems base: dba87d708f456f9059f9df3da3cb6f3e219795cd (feat/card-systems-cursor, PR #2)
assets 87; CONCEPT 11, PROTOTYPE 76, QA_PASSED 0, PRODUCTION_READY 0, INTEGRATED 0
checks: PASS 9, REQUIRES_ART_CHANGE 3
This audit is not PRODUCTION_READY.

 #  Check                            Status
 1  Character ID compatibility       PASS
 2  Equipment ID compatibility       PASS
 3  Asset Manifest format            PASS
 4  rig definitions                  PASS
 5  equipment slots                  REQUIRES_ART_CHANGE
 6  anchor names                     REQUIRES_ART_CHANGE
 7  pivot coordinates                PASS
 8  character variant references     REQUIRES_ART_CHANGE
 9  card frame layout data           PASS
10  asset status handling            PASS
11  path resolution                  PASS
12  missing asset behaviour          PASS

Specific issues
- Item anchor naming                   REQUIRES_ART_CHANGE
- Shared equipment slot arrays         REQUIRES_ART_CHANGE
- Asset ID inside item records         REQUIRES_ART_CHANGE
- variant_of compatibility             REQUIRES_ART_CHANGE
- Manifest status enums                PASS
- Duplicate IDs                        PASS

REQUIRES_ART_CHANGE rows: 45
R-ANCHOR 32, R-ASSET-ID 4, R-SLOTS 4, R-VARIANT 5
```
