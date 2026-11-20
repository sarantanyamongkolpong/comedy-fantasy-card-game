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

## v0.5 records

Legacy samples above are unchanged: `AVT_*_001` still use `pow` / `def` / `spd` with `valueStatus: "TBD"`. v0.5 records set `schemaVersion` to `"v05"` and use `atk` / `def` / `spd`.

`migratePowToAtk` copies `pow` to `atk` one-to-one and stores the old number at `stats.legacy.pow`. It does not delete `pow` and it does not mutate the input. The mapping is LOCKED (`Owner t253u 20 Nov 2026`, CORE-005). A second call is a no-op.

### Locked in this pass

| Rule | Value | Where |
|---|---|---|
| CORE-009 deck size | 30 | `DECK_SIZE`, `defaultRuleConfig().deckSize` |
| CORE-007 / CORE-010 AP and hand | 5 | existing `BASE_AP`, `HAND_SIZE` |
| CORE-024 / CORE-025 rarities | Avatar N/R/Epic/EX; Action N/R/Epic/EX/FAC | `validateAvatar`, `validateActionCard` |
| CORE-026..029 skill slots | N optional Active; R exactly one of Active or Passive; Epic both; EX both plus Ultimate | `validateSkillSlots` |
| GA-12 pity | Per banner. Epic and top counters are separate. Epic resets Epic only. EX/FAC resets both. Companion has its own Epic counter and no top counter. Thresholds 100 / 200 / 100 | `src/gacha` |
| Justin identity | New characters `AVT_AEG_002`, `AVT_PHA_002`, `AVT_CEL_002`, `AVT_SAN_002` | `V05_JUSTIN_AVATARS` |
| AUTO battle | Required (`autoBattle.value` true). Policy is not locked | `defaultRuleConfig().autoBattle` |
| CORE-037 SYNC | REJECTED, value null. Not pending | `defaultRuleConfig().vrSync` |

Justina Moment's active, Saving Grace (Regen +3 for 2 turns, all teammates), is LOCKED. Her other numbers, and the other three Justins' stats and skills, stay PROPOSED. Starter action costs and the demo enemy stats are PLACEHOLDER. They are not locked balance and they are not `PRODUCTION_READY`.

AUTO uses the engine field `autoPolicy`. The proposed default is `balanced` (`autoPolicy.value`). Playback speed is `autoPolicy.speed` (`normal`, options `slow` / `normal` / `fast`), also PROPOSED. The player toggle is `preferences.autoBattle` on the save profile. New profiles start at false. A version 1 save with no preference migrates to false. `setAutoBattle(profile, enabled)` writes the boolean. Evidence for both the rejection and the AUTO requirement is `Owner t261u 20 Nov 2026`.

### Still PENDING_OWNER

Team SPD aggregation and ties (CORE-038), damage and HP (CORE-039), duplicate cap inside the 30-card deck (CORE-040), regen tick timing (OPEN-02), star cap (OPEN-04), gacha rates and G cost (GA-11), which card a pity pull picks inside the guaranteed rarity (GA-11), companion currency (GA-02 note), cabin base storage (HOME-11), and whether reference furniture is granted or only unlocked for sale (OPEN-06). `pendingOwnerFlags()` lists them. Target_Rule's vocabulary is stored and its sheet state stays pending.

GA-01..GA-04 in the imported sheet are column-shifted: the LOCKED token sits in Pity Pulls. Effective status is LOCKED. The verbatim JSON is in `content/v05/source/tabs/v05_Gacha.json`.

### Public entry points

- `defaultRuleConfig()`
- `validateDeck(deck, { cardsById, teamFactions, enforceFac })` reports FAC legality. Mixed factions are allowed. Size must be 30. `enforceFac` is off unless the caller asks.
- `createBannerState(banner, saved)`, `pull(state, { seed, count, profile, costG })`
- `serialize(profile)`, `deserialize(json)`, `createMemoryAdapter()`, `createLocalStorageAdapter(storage)`
- `applyBattleReward(profile, { matchId, rewards })` runs once per `matchId`
- Stream A names `createMatch`, `startTurn`, `playAction`, `discardVoluntary`, `endTurn`, `resolveEndOfRoundDiscard`, `getZones`, and `getOutcome` are exported from `src/index.js` and throw `ENGINE_NOT_LANDED` until `src/engine` exists. Do not treat that as the battle implementation.

`rollAcquisition` still throws Q-GACHA. The new pull path refuses a banner that is not marked `TEST_ONLY_NOT_PRODUCTION`.

### Contract requests for other streams

- Stream D: add `deckSize` to `PROTECTED_KEYS` in `tools/ci/lib/repository-structure.mjs` and stop requiring `tools/ci/protected-constants.json` to omit `deckSize`. The runtime constant is already 30. The snapshot hash was left unchanged so the existing check keeps passing.
- Stream A: replace the `ENGINE_NOT_LANDED` stubs in `src/index.js` with `export { ... } from './engine/index.js'` when that module exists. `endTurn` stays the current `src/battle/battle.js` export because `src/debug/execute.js` imports it from `src/index.js`. Demo enemy team: `DEMO_ENEMY_TEAM` (`DEMO_BATTLE_001`), field `displayName`. Read `Cost_AP` / `apCost` from v05 action cards.
- Stream C: call `defaultRuleConfig`, `validateDeck`, `createBannerState` / `pull`, and `serialize` / `deserialize`. House display uses `displayHouseTier`. Storage uses `storageFromFurniture` only. Do not add slots because the house tier changed.
