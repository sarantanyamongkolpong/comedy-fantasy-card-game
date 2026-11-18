# Data schema

Runtime checks live in `src/schema/validate.js`. The JSON Schema document is `src/schema/game.schema.json` (draft 2020-12). Samples live in `src/avatars/catalog.js`, `src/avatars/ownership.js`, and `src/cards/catalog.js`.

Shipped samples keep POW, DEF, SPD, rarity, and AP cost empty. The schema allows an integer in those fields once the Owner sets a value. A record with any numeric stat uses `valueStatus: "SET"` on all three of POW, DEF, and SPD together. A record that is still undecided uses `null` and `valueStatus: "TBD"`.

## Faction

| factionId | name | role |
|---|---|---|
| `FAC_AEG` | Aegis Dominion | Tank |
| `FAC_PHA` | Phantom Blades | DPS |
| `FAC_CEL` | Celestial Nexus | Magic |
| `FAC_SAN` | Sanctuary Order | Support |

`name` and `role` are the specified strings. `factionId` is the systems key for those names.

## Stats

```json
{ "pow": null, "def": null, "spd": null, "valueStatus": "TBD" }
```

Keys are `pow`, `def`, and `spd` only. HP is not a stat. See Q-HP.

## Avatar

| Field | Sample rule |
|---|---|
| `avatarId` | `AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, `AVT_SAN_001` |
| `nameEn` / `nameTh` | Sir Potlid / เซอร์ฝาหม้อ, Nox Squeak / น็อกซ์ รองเท้าดัง, Madame Meteor / มาดามดาวตก, Sister Plaster / ซิสเตอร์พลาสเตอร์ |
| `factionId` / `role` | Must match the faction table |
| `rigId` | `humanoid_heavy` for Sir Potlid, `humanoid_standard` for the other three (from the art rigs) |
| `stats` | TBD nulls |
| `rarity` | `null` |
| `assetIds` | Manifest ids for card art. Optional. |

## Avatar card

`cardKind` is `avatar_card`. One sample exists per starter avatar (`AVC_` plus the avatar id). It repeats identity, TBD stats, `rarity: null`, and the card-art asset id.

An avatar card is not an action card. The play check rejects it with `NOT_ACTION_CARD`.

## Action card

`cardKind` is `action_card`. `actionType` is `ATK`, `DEF`, or `Skill`.

| Field | Empty sample |
|---|---|
| `name` | `null` |
| `apCost` | `null` |
| `costStatus` | `TBD` |
| `effectId` | `null` |
| `rarity` | `null` |

The three sample ids `ACT_SCHEMA_ATK`, `ACT_SCHEMA_DEF`, and `ACT_SCHEMA_SKILL` are schema examples. They are not a designed card list. A future integer cost uses `costStatus: "SET"`. The default cost rule still throws Q-AP-COST when `apCost` is null.

## Equipment

Identity plus empty modifiers.

| Field | Meaning |
|---|---|
| `equipmentId` / `assetId` | Art asset id, such as `EQ_AEG_POT_HELMET_SILVER_001` |
| `slot` | Art slot string, such as `headgear` or `main_hand` |
| `nativeAvatarId` | Avatar id, or `null` for a shared item |
| `variantOf` | Base equipment id, or `null` |
| `statModifiers` | POW/DEF/SPD, TBD nulls in samples |
| `upgrade` | `null` |
| `upgradeStatus` | `BLOCKED_BY_DESIGN` |

The sample set is the silver pot helmet, the gold pot helmet (`variantOf` the silver one), and the shared neutral staff. The art branch has more items. This catalog does not invent stat bonuses for them.

## Ownership

```json
{
  "ownershipId": "OWN_SAMPLE_AVT_AEG_001",
  "ownerId": "PLAYER_SAMPLE",
  "subjectKind": "avatar",
  "subjectId": "AVT_AEG_001",
  "quantity": null,
  "source": null,
  "sourceStatus": "TBD"
}
```

`subjectKind` is `avatar`, `avatar_card`, `action_card`, or `equipment`. `source` stays null. `rollAcquisition` throws Q-GACHA.

## Variant

| Field | Meaning |
|---|---|
| `variantId` | Systems id |
| `baseId` | Id of the base equipment or asset |
| `subjectKind` | `equipment`, `card_art`, or `sprite_layer` |
| `label` | Short label such as `gold` or `goldpot`, or null |
| `assetId` | Manifest id of this variant |
| `status` | Art status: `CONCEPT`, `PROTOTYPE`, `QA_PASSED`, `PRODUCTION_READY`, `INTEGRATED` |

Samples: gold pot helmet (`PROTOTYPE`, base silver helmet) and the gold-pot card art (`CONCEPT`, base `CARD_AVT_AEG_001_card_v1`). Those statuses are copied from the art manifest.

## Asset manifest entry

Matches the art manifest so `docs/ASSET_MANIFEST.json` from PR #1 can be loaded.

Required: `asset_id`, `path`, `type`, `owner`, `status`.

`status` uses the same five-value legend. Extra art fields (`pivot`, `anchors`, `sha256`, `bytes`, `slot`, `variant_of`, and others) are kept. The loader does not require them on every entry.

`asset_id` values in one manifest must be unique. The validator reports duplicates. The loader keeps the first row and records a warning, so a bad manifest still resolves the other ids.
