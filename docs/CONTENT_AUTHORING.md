# Content authoring

This pipeline fills authoring templates and checks the records against the schema in `src/schema`. That schema is the authority. The CLI imports `validateAvatar`, `validateAvatarCard`, `validateActionCard`, `validateEquipment`, and `validateAssetManifest`. It does not change those files.

No packages are required. Node.js 18 or newer:

```bash
node tools/authoring/cli.js --help
node --test
```

`npm test` runs the same test command. This branch does not edit `package.json`.

The Owner's Excel master stays outside the repo. CSV is a bridge for that sheet. This tool does not create, overwrite, or sync the workbook.

Starter content is not production content. POW, DEF, SPD, rarity, AP cost, and effect stay null or `TBD`. The validator does not mark records `PRODUCTION_READY`.

## Templates

Templates live in `content/templates/`. A record sets `"extends": "<templateId>"` and writes only the fields that are specific to that record.

| Template | Record | What the author writes | What the template fills |
|---|---|---|---|
| `tbd-stats` | shared parent | — | `stats` null / `valueStatus: "TBD"`, `rarity: null` |
| `avatar` | avatar | `avatarId`, `nameEn`, `nameTh`, `factionId`, `rigId` | role from the faction, `assetIds.cardArt` as `CARD_<avatarId>_card_v1` |
| `avatar-card` | avatar card | `avatarId` | names, faction, role, and card art copied from the avatar; `cardId` `AVC_<avatarId>` |
| `action-card` | action card | `cardId`, `actionType` | `name`, `apCost`, `effectId`, and `rarity` null; `costStatus: "TBD"` |
| `equipment` | equipment | `equipmentId`, `slot`, `nativeAvatarId` | `assetId` from `equipmentId`; modifiers null; `upgrade: null`; `upgradeStatus: "BLOCKED_BY_DESIGN"` |

A missing key takes the default. An explicit `null` stays `null`. A template does not replace `null` with `0` or with a placeholder string.

`derive` steps use `"when": "missing"`, which means the key is absent. They do not overwrite `null`. Nested `null` is kept too: `"assetIds": null` is not turned into an object.

Avatar cards are materialized after avatars, so one Thai name is written on the avatar and copied. The shipped examples are `content/examples/starter-catalog.json`.

`node tools/authoring/cli.js materialize content/examples/starter-catalog.json` prints the schema-shaped records.

## Null and TBD

| Authoring value | Stored value |
|---|---|
| key omitted | template default |
| JSON `null` | `null` |
| `"TBD"` | `"TBD"` |
| integer `0` | `0` (only when the cell or JSON value is the digit 0) |
| empty CSV cell on a scalar column | `null` |
| token `null` in a scalar CSV cell | `null` |
| `"TBD"` in a numeric CSV cell | the string `"TBD"`, then a schema error |
| empty CSV cell on `assetIds` or `labels` | key omitted |
| JSON `null` in those columns | `null` |

`valueStatus: "TBD"` is the schema pair for null POW, DEF, and SPD. `costStatus: "TBD"` is the schema pair for a null AP cost. A number in either place requires `"SET"`. The importer does not invent `SET` or a number.

Drop rate is not a field (`Q-GACHA`). A `dropRate` key is an unknown field and fails validation.

## Identifiers

Character IDs are `AVT_<FAC>_NNN`. `FAC` is `AEG`, `PHA`, `CEL`, or `SAN`. `NNN` is three digits. The faction code in the id must match `factionId`.

| Kind | Authoring pattern | Where it comes from |
|---|---|---|
| Character | `AVT_<FAC>_NNN` | This task, and the four starter ids |
| Avatar card | `AVC_` plus the character id | `docs/DATA_SCHEMA.md` |
| Action card | `ACT_<TOKEN>` uppercase | Shipped schema samples `ACT_SCHEMA_ATK`, `ACT_SCHEMA_DEF`, `ACT_SCHEMA_SKILL` |
| Equipment | `EQ_<TOKEN>` | Art manifest ids |

An equipment id `EQ_AEG_…`, `EQ_PHA_…`, `EQ_CEL_…`, or `EQ_SAN_…` must name an `AVT_` id of that same faction in `nativeAvatarId`. Shared items such as `EQ_SWORD_BASIC_001` have no faction infix. Their `nativeAvatarId` is `null`. `variantOf` is an equipment id in the same catalog, or `null`.

The schema's `avatarId` pattern is `^AVT_[A-Z0-9_]+$`. Its `cardId` and `equipmentId` rules are "non-empty string". The authoring patterns above are stricter. See Coordination.

## Factions

Do not rename these. The strings come from `src/schema/constants.js`.

| factionId | name | role |
|---|---|---|
| `FAC_AEG` | Aegis Dominion | Tank |
| `FAC_PHA` | Phantom Blades | DPS |
| `FAC_CEL` | Celestial Nexus | Magic |
| `FAC_SAN` | Sanctuary Order | Support |

A record may put either the id or the official name in `factionId`. The official name is stored as the id. Any other string fails. Role is filled from the faction when the author omits it. A role that disagrees with the faction fails.

## Action categories

`actionType` is `ATK`, `DEF`, or `Skill`. The three example action cards use the schema sample ids. Their names, costs, and effects are null. They are not a designed card list.

## Assets

The checker looks up:

- every string in `avatar.assetIds`
- `avatarCards[].assetId`
- `equipment[].assetId`

`rigId` (`humanoid_heavy`, `humanoid_standard`) is not an asset id. The manifest id for the heavy rig is `RIG_HUMANOID_HEAVY_001`. `variantOf` is an equipment id, not an asset lookup.

```bash
node tools/authoring/cli.js validate content/examples \
  --manifest tests/fixtures/asset-manifest.snapshot.json
```

That file is the default. It is a 13-of-87 snapshot from `feat/card-art-prototype-mira` at `d65c89d`. Starter records cite real manifest ids that are outside those 13, so this command reports `ASSET_REF` for the missing ones and nothing else.

To check the ids the examples cite, without the rest of the art tree:

```bash
node tools/authoring/cli.js validate content/examples \
  --manifest tests/authoring/fixtures/example-asset-index.json
```

`tests/authoring/fixtures/example-asset-index.json` lists those ids. It is a test index copied from `docs/ASSET_MANIFEST.json` on the art branch. It is not the full manifest.

When the art branch file is available, point `--manifest` at it. The tool only reads that path.

`--no-manifest` skips asset checks and still runs the schema and id checks.

CONCEPT and PROTOTYPE assets are reported in a note. They are not treated as missing, and they are not marked `PRODUCTION_READY`.

## CSV bridge

Export writes UTF-8 CSV, one file per kind. Import reads UTF-8 and accepts a leading BOM. Thai names round-trip. A field that contains a comma, quote, or newline is quoted.

```bash
node tools/authoring/cli.js export --out-dir content/examples/csv content/examples/starter-catalog.json
node tools/authoring/cli.js export --kind avatar --out avatars.csv content/examples/starter-catalog.json
node tools/authoring/cli.js import --kind avatar content/examples/csv/avatars.csv
```

`--bom` writes a leading BOM for Excel. The committed samples have no BOM.

Committed samples:

- `content/examples/csv/avatars.csv`
- `content/examples/csv/avatar-cards.csv`
- `content/examples/csv/action-cards.csv`
- `content/examples/csv/equipment.csv`

Empty scalar cells become `null`. They do not become `0` or `""`. The column has to be absent for a template default to fill it. JSON `extends` is the inheritance format. CSV is the flat form of a materialized record.

`assetIds` and `labels` are JSON in one cell.

## Commands

```text
node tools/authoring/cli.js validate [--manifest <file>] [--no-manifest] [--format text|json|both] <file-or-dir>...
node tools/authoring/cli.js materialize [--out <file>] <file-or-dir>...
node tools/authoring/cli.js export (--kind <kind> --out <file.csv> | --out-dir <dir>) [--bom] <catalog.json>
node tools/authoring/cli.js import --kind <kind> [--out <file.json>] <file.csv>
```

Kinds: `avatar`, `avatar-card`, `action-card`, `equipment`.

A directory load reads `*.json` in that directory and does not recurse. CSV files next to the catalog are not loaded twice.

Exit codes: `0` valid, `1` validation errors, `2` usage or unreadable input.

## Report

`--format text` is the default. `--format json` prints the same report as JSON. `--format both` prints the text, a `---` line, then the JSON.

```text
Comedy Fantasy Card Game — content validation
Result: OK
Sources: content/examples/starter-catalog.json
Manifest: tests/authoring/fixtures/example-asset-index.json — 22 assets

Records
  avatars        4
  avatar cards   4
  action cards   3
  equipment      17

Errors: 0
Duplicates: 0
Warnings: 0

Notes
  Referenced assets include CONCEPT or PROTOTYPE art. This report does not mark content PRODUCTION_READY.
```

Each error has a code, a path, and a message. Codes include `AVATAR_ID`, `CARD_ID`, `EQUIPMENT_ID`, `FACTION`, `ACTION_TYPE`, `DUPLICATE`, `ASSET_REF`, `BROKEN_REF`, `SCHEMA`, `MANIFEST`, and `TEMPLATE`.

Duplicate checks cover `avatarId`, `cardId` across avatar cards and action cards, and `equipmentId`.

## Starter examples

Only the four starter characters are in the catalog:

| avatarId | English | Thai | Faction | Rig |
|---|---|---|---|---|
| `AVT_AEG_001` | Sir Potlid | เซอร์ฝาหม้อ | Aegis Dominion | `humanoid_heavy` |
| `AVT_PHA_001` | Nox Squeak | น็อกซ์ รองเท้าดัง | Phantom Blades | `humanoid_standard` |
| `AVT_CEL_001` | Madame Meteor | มาดามดาวตก | Celestial Nexus | `humanoid_standard` |
| `AVT_SAN_001` | Sister Plaster | ซิสเตอร์พลาสเตอร์ | Sanctuary Order | `humanoid_standard` |

Equipment ids are the ones on the art manifest, including the shared sword, dagger, staff, and buckler. The gold pot helmet's `variantOf` is `EQ_AEG_POT_HELMET_SILVER_001`. The dagger slot string is `main_hand|off_hand`, copied from the manifest.

Materialized avatars, avatar cards, the three schema action cards, and the three equipment rows already in `src/avatars/catalog.js` match those samples. The other equipment rows are the remaining manifest ids, still with null modifiers.

## Coordination

These are schema gaps. This branch does not edit `src/schema` to close them.

1. `avatarId` in the schema is `^AVT_[A-Z0-9_]+$`. Authoring requires `AVT_<FAC>_NNN` with the four faction codes and three digits, and the code must match `factionId`.
2. `cardId` and `equipmentId` in the schema are non-empty strings. Authoring requires `AVC_<avatarId>`, `ACT_<TOKEN>`, and `EQ_<TOKEN>` so the shipped samples and the art ids keep their shape. The `ACT_` rule should be confirmed before a designed action-card list exists.
3. `tests/fixtures/asset-manifest.snapshot.json` has 13 of 87 assets. Full asset checks need `--manifest` pointed at `docs/ASSET_MANIFEST.json` on `feat/card-art-prototype-mira`.
4. There is no drop-rate field (`Q-GACHA`) and no upgrade formula (`Q-UPGRADE`). Unknown keys and a non-null `upgrade` fail.
5. The Excel master is outside the repo. CSV does not claim to be that file.
6. Variant records stay in `src/avatars/catalog.js`. This pipeline does not add a variant template. `variantOf` on equipment is the link the art file already uses.

## Status

The authoring CLI, templates, examples, and tests are in place and covered by `node --test`. Starter stats, rarity, AP costs, and effects are still null or `TBD`. That content is not `PRODUCTION_READY`.
