# Required art changes for Mira

These rows are the art-side edits that make the contract explicit. They were read from `feat/card-art-prototype-mira` at `d65c89dc87a9554d5611a108146b509c7aa7fcf0`. This branch does not edit those files.

The systems adapter already loads the current JSON. Placement for single-slot items matches recorded native origins. The dagger stays unresolved until a hand is chosen. Shared items resolve when the loader looks them up by object key.

Rows: 45. Status of every row: REQUIRES_ART_CHANGE.

## R-ANCHOR

| File | Record | Field | Current | Required | Note |
|---|---|---|---|---|---|
| assets/characters/AVT_AEG_001/equipment/items.json | EQ_AEG_POT_HELMET_GOLD_001 | anchor | absent | head | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_AEG_001/equipment/items.json | EQ_AEG_POT_HELMET_SILVER_001 | anchor | absent | head | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_AEG_001/equipment/items.json | EQ_AEG_SHIELD_POTLID_001 | anchor | absent | off_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_AEG_001/equipment/items.json | EQ_AEG_SWORD_POTLID_001 | anchor | absent | main_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_CEL_001/equipment/items.json | EQ_CEL_HAT_ASTRO_001 | anchor | absent | head | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_CEL_001/equipment/items.json | EQ_CEL_NOODLE_CUP_001 | anchor | absent | off_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_CEL_001/equipment/items.json | EQ_CEL_STAFF_PLANET_001 | anchor | absent | main_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_PHA_001/equipment/items.json | EQ_PHA_KUNAI_MAIN_001 | anchor | absent | main_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_PHA_001/equipment/items.json | EQ_PHA_KUNAI_OFF_001 | anchor | absent | off_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_PHA_001/equipment/items.json | EQ_PHA_SNEAKERS_SQUEAK_001 | anchor | absent | feet | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_SAN_001/equipment/items.json | EQ_SAN_CAP_HEALER_001 | anchor | absent | head | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_SAN_001/equipment/items.json | EQ_SAN_CLIPBOARD_001 | anchor | absent | off_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/characters/AVT_SAN_001/equipment/items.json | EQ_SAN_STAFF_BANDAGE_001 | anchor | absent | main_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/equipment/shared_items.json | EQ_SHIELD_BUCKLER_001 | anchor | absent | off_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/equipment/shared_items.json | EQ_STAFF_NEUTRAL_001 | anchor | absent | main_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| assets/equipment/shared_items.json | EQ_SWORD_BASIC_001 | anchor | absent | main_hand | Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig. |
| docs/ASSET_MANIFEST.json | EQ_AEG_POT_HELMET_GOLD_001 | anchor | absent | head | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_AEG_POT_HELMET_SILVER_001 | anchor | absent | head | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_AEG_SHIELD_POTLID_001 | anchor | absent | off_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_AEG_SWORD_POTLID_001 | anchor | absent | main_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_CEL_HAT_ASTRO_001 | anchor | absent | head | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_CEL_NOODLE_CUP_001 | anchor | absent | off_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_CEL_STAFF_PLANET_001 | anchor | absent | main_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_PHA_KUNAI_MAIN_001 | anchor | absent | main_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_PHA_KUNAI_OFF_001 | anchor | absent | off_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_PHA_SNEAKERS_SQUEAK_001 | anchor | absent | feet | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_SAN_CAP_HEALER_001 | anchor | absent | head | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_SAN_CLIPBOARD_001 | anchor | absent | off_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_SAN_STAFF_BANDAGE_001 | anchor | absent | main_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_SHIELD_BUCKLER_001 | anchor | absent | off_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_STAFF_NEUTRAL_001 | anchor | absent | main_hand | Same anchor name on the manifest equipment row. |
| docs/ASSET_MANIFEST.json | EQ_SWORD_BASIC_001 | anchor | absent | main_hand | Same anchor name on the manifest equipment row. |

## R-ASSET-ID

| File | Record | Field | Current | Required | Note |
|---|---|---|---|---|---|
| assets/equipment/shared_items.json | EQ_DAGGER_BASIC_001 | asset_id | absent | EQ_DAGGER_BASIC_001 | Same id as the object key, matching per-character items.json. |
| assets/equipment/shared_items.json | EQ_SHIELD_BUCKLER_001 | asset_id | absent | EQ_SHIELD_BUCKLER_001 | Same id as the object key, matching per-character items.json. |
| assets/equipment/shared_items.json | EQ_STAFF_NEUTRAL_001 | asset_id | absent | EQ_STAFF_NEUTRAL_001 | Same id as the object key, matching per-character items.json. |
| assets/equipment/shared_items.json | EQ_SWORD_BASIC_001 | asset_id | absent | EQ_SWORD_BASIC_001 | Same id as the object key, matching per-character items.json. |

## R-SLOTS

| File | Record | Field | Current | Required | Note |
|---|---|---|---|---|---|
| assets/equipment/shared_items.json | EQ_DAGGER_BASIC_001 | slot | main_hand\|off_hand | absent | Remove the pipe-delimited slot string. |
| assets/equipment/shared_items.json | EQ_DAGGER_BASIC_001 | slots | absent | ["main_hand","off_hand"] | Allowed slots. The loader does not choose one. |
| docs/ASSET_MANIFEST.json | EQ_DAGGER_BASIC_001 | slot | main_hand\|off_hand | absent | Remove the pipe-delimited slot string. |
| docs/ASSET_MANIFEST.json | EQ_DAGGER_BASIC_001 | slots | absent | ["main_hand","off_hand"] | Allowed slots on the manifest equipment row. |

## R-VARIANT

| File | Record | Field | Current | Required | Note |
|---|---|---|---|---|---|
| assets/characters/_rigs/humanoid_heavy.json | AVT_AEG_001 layer AVT_AEG_001_L04_headgear_gold.png | variant_of | absent | SPR_AVT_AEG_001_L04_headgear_silver | Keep the variant label "gold". variant_of is the base asset id. |
| docs/ASSET_MANIFEST.json | CARD_AVT_AEG_001_card_v1_variant_goldpot | variant_of | absent | CARD_AVT_AEG_001_card_v1 | Systems variant sample uses this base id. The manifest row has no variant_of. |
| docs/ASSET_MANIFEST.json | CARD_AVT_AEG_001_card_v1_variant_goldpot_web | variant_of | absent | CARD_AVT_AEG_001_card_v1_variant_goldpot | Base asset id implied by the variant label or the asset id. Existing equipment variants already store variant_of. |
| docs/ASSET_MANIFEST.json | SPR_AVT_AEG_001_BASE_COMPOSITE_GOLDPOT | variant_of | absent | SPR_AVT_AEG_001_BASE_COMPOSITE | Base asset id implied by the variant label or the asset id. Existing equipment variants already store variant_of. |
| docs/ASSET_MANIFEST.json | SPR_AVT_AEG_001_L04_headgear_gold | variant_of | absent | SPR_AVT_AEG_001_L04_headgear_silver | Base asset id implied by the variant label or the asset id. Existing equipment variants already store variant_of. |

## Machine-readable changes

```json
[
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_AEG_001/equipment/items.json",
    "record": "EQ_AEG_POT_HELMET_GOLD_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_AEG_001/equipment/items.json",
    "record": "EQ_AEG_POT_HELMET_SILVER_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_AEG_001/equipment/items.json",
    "record": "EQ_AEG_SHIELD_POTLID_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_AEG_001/equipment/items.json",
    "record": "EQ_AEG_SWORD_POTLID_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_CEL_001/equipment/items.json",
    "record": "EQ_CEL_HAT_ASTRO_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_CEL_001/equipment/items.json",
    "record": "EQ_CEL_NOODLE_CUP_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_CEL_001/equipment/items.json",
    "record": "EQ_CEL_STAFF_PLANET_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_PHA_001/equipment/items.json",
    "record": "EQ_PHA_KUNAI_MAIN_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_PHA_001/equipment/items.json",
    "record": "EQ_PHA_KUNAI_OFF_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_PHA_001/equipment/items.json",
    "record": "EQ_PHA_SNEAKERS_SQUEAK_001",
    "field": "anchor",
    "current": "absent",
    "required": "feet",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_SAN_001/equipment/items.json",
    "record": "EQ_SAN_CAP_HEALER_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_SAN_001/equipment/items.json",
    "record": "EQ_SAN_CLIPBOARD_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/AVT_SAN_001/equipment/items.json",
    "record": "EQ_SAN_STAFF_BANDAGE_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_SHIELD_BUCKLER_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_STAFF_NEUTRAL_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_SWORD_BASIC_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_AEG_POT_HELMET_GOLD_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_AEG_POT_HELMET_SILVER_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_AEG_SHIELD_POTLID_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_AEG_SWORD_POTLID_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_CEL_HAT_ASTRO_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_CEL_NOODLE_CUP_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_CEL_STAFF_PLANET_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_PHA_KUNAI_MAIN_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_PHA_KUNAI_OFF_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_PHA_SNEAKERS_SQUEAK_001",
    "field": "anchor",
    "current": "absent",
    "required": "feet",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_SAN_CAP_HEALER_001",
    "field": "anchor",
    "current": "absent",
    "required": "head",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_SAN_CLIPBOARD_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_SAN_STAFF_BANDAGE_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_SHIELD_BUCKLER_001",
    "field": "anchor",
    "current": "absent",
    "required": "off_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_STAFF_NEUTRAL_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ANCHOR",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_SWORD_BASIC_001",
    "field": "anchor",
    "current": "absent",
    "required": "main_hand",
    "note": "Same anchor name on the manifest equipment row."
  },
  {
    "issue": "R-ASSET-ID",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_DAGGER_BASIC_001",
    "field": "asset_id",
    "current": "absent",
    "required": "EQ_DAGGER_BASIC_001",
    "note": "Same id as the object key, matching per-character items.json."
  },
  {
    "issue": "R-ASSET-ID",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_SHIELD_BUCKLER_001",
    "field": "asset_id",
    "current": "absent",
    "required": "EQ_SHIELD_BUCKLER_001",
    "note": "Same id as the object key, matching per-character items.json."
  },
  {
    "issue": "R-ASSET-ID",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_STAFF_NEUTRAL_001",
    "field": "asset_id",
    "current": "absent",
    "required": "EQ_STAFF_NEUTRAL_001",
    "note": "Same id as the object key, matching per-character items.json."
  },
  {
    "issue": "R-ASSET-ID",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_SWORD_BASIC_001",
    "field": "asset_id",
    "current": "absent",
    "required": "EQ_SWORD_BASIC_001",
    "note": "Same id as the object key, matching per-character items.json."
  },
  {
    "issue": "R-SLOTS",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_DAGGER_BASIC_001",
    "field": "slot",
    "current": "main_hand|off_hand",
    "required": "absent",
    "note": "Remove the pipe-delimited slot string."
  },
  {
    "issue": "R-SLOTS",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/equipment/shared_items.json",
    "record": "EQ_DAGGER_BASIC_001",
    "field": "slots",
    "current": "absent",
    "required": "[\"main_hand\",\"off_hand\"]",
    "note": "Allowed slots. The loader does not choose one."
  },
  {
    "issue": "R-SLOTS",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_DAGGER_BASIC_001",
    "field": "slot",
    "current": "main_hand|off_hand",
    "required": "absent",
    "note": "Remove the pipe-delimited slot string."
  },
  {
    "issue": "R-SLOTS",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "EQ_DAGGER_BASIC_001",
    "field": "slots",
    "current": "absent",
    "required": "[\"main_hand\",\"off_hand\"]",
    "note": "Allowed slots on the manifest equipment row."
  },
  {
    "issue": "R-VARIANT",
    "status": "REQUIRES_ART_CHANGE",
    "file": "assets/characters/_rigs/humanoid_heavy.json",
    "record": "AVT_AEG_001 layer AVT_AEG_001_L04_headgear_gold.png",
    "field": "variant_of",
    "current": "absent",
    "required": "SPR_AVT_AEG_001_L04_headgear_silver",
    "note": "Keep the variant label \"gold\". variant_of is the base asset id."
  },
  {
    "issue": "R-VARIANT",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "CARD_AVT_AEG_001_card_v1_variant_goldpot",
    "field": "variant_of",
    "current": "absent",
    "required": "CARD_AVT_AEG_001_card_v1",
    "note": "Systems variant sample uses this base id. The manifest row has no variant_of."
  },
  {
    "issue": "R-VARIANT",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "CARD_AVT_AEG_001_card_v1_variant_goldpot_web",
    "field": "variant_of",
    "current": "absent",
    "required": "CARD_AVT_AEG_001_card_v1_variant_goldpot",
    "note": "Base asset id implied by the variant label or the asset id. Existing equipment variants already store variant_of."
  },
  {
    "issue": "R-VARIANT",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "SPR_AVT_AEG_001_BASE_COMPOSITE_GOLDPOT",
    "field": "variant_of",
    "current": "absent",
    "required": "SPR_AVT_AEG_001_BASE_COMPOSITE",
    "note": "Base asset id implied by the variant label or the asset id. Existing equipment variants already store variant_of."
  },
  {
    "issue": "R-VARIANT",
    "status": "REQUIRES_ART_CHANGE",
    "file": "docs/ASSET_MANIFEST.json",
    "record": "SPR_AVT_AEG_001_L04_headgear_gold",
    "field": "variant_of",
    "current": "absent",
    "required": "SPR_AVT_AEG_001_L04_headgear_silver",
    "note": "Base asset id implied by the variant label or the asset id. Existing equipment variants already store variant_of."
  }
]
```
