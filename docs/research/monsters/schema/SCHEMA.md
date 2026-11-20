# Monster research schema

This is the database contract for the monster and boss parody research project. It is not a combat catalog, not a gacha banner, and not a production content file.

`monster.schema.json` is JSON Schema draft 2020-12, the same draft as `src/schema/game.schema.json`. A record splits **sourced facts** (`research`) from **agent-written parody** (`creative`). Status is only `RESEARCH`, `PROPOSED`, or `QA_PASSED`.

The six rows in `examples/sample-database.json` are structural fixtures. Their `example.com` URLs were not fetched and do not support a research claim. Real records must use pages an agent actually opened.

## Field map

| # | Brief field | JSON |
|---|---|---|
| 1 | Monster ID | `monsterId` |
| 2 | Parody Name (EN) | `creative.nameEn` |
| 3 | Thai name | `creative.nameTh` |
| 4 | Original Inspiration/Source | `research.originalInspiration` |
| 5 | Source URL | `research.sourceUrl` |
| 6 | Monster Category | `category` |
| 7 | Creature Type | `creative.creatureType` |
| 8 | Visual Identity | `creative.visualIdentity` |
| 9 | Personality | `creative.personality` |
| 10 | Signature Trait | `creative.signatureTrait` |
| 11 | Comedy Concept | `creative.comedyConcept` |
| 12 | Element/Attribute | `creative.element` |
| 13 | Combat Archetype | `creative.combatArchetype` |
| 14 | Signature Ability Concept | `creative.signatureAbilityConcept` |
| 15 | Weakness Concept | `creative.weaknessConcept` |
| 16 | Lore Summary | `creative.loreSummary` |
| 17 | Faction Affiliation | `creative.factionAffiliation` |
| 18 | Suggested Rarity | `creative.suggestedRarity` |
| 19 | Suggested Tower Environment | `creative.suggestedTowerEnvironment` |
| 20 | Artwork Prompt Concept | `creative.artworkPromptConcept` |
| 21 | IP Similarity Risk | `ipRisk` |
| 22 | Research Confidence | `research.confidence` |

`research.sourceUrl` must also appear in `research.sources[].url`. Each source is `{ url, title, accessed, supports }`. `accessed` is a real calendar date (`YYYY-MM-DD`). `supports` says which fact the page backs. The tools check that shape. They do not fetch the URL. Agents 01–05 fetch. Agent 10 checks the claim.

`creative.humorType` is optional: Absurd Comedy, Dark Fantasy Comedy, Satirical Fantasy, Epic but Ridiculous. It is not one of the 22 fields.

`creative.element` is free text. `src/schema/constants.js` has no element list, so this string is not a damage type. Use `None` when the creature is untyped.

`creative.combatArchetype` is free text. The only battle-role bridge is `hooks.role`.

`creative.suggestedTowerEnvironment` is flavor inside the Mysterious Tower (MAP-03). It does not add a map pin.

## Boss fields

Required when category is Mini Boss, Main Boss, World Boss, or Secret Boss. `boss` is `null` for Normal and Elite.

| Brief field | JSON |
|---|---|
| Boss Title | `boss.bossTitle` |
| Entrance Concept | `boss.entranceConcept` |
| Signature Silhouette | `boss.signatureSilhouette` |
| Personality/Motivation | `boss.personalityMotivation` |
| Signature Mechanic | `boss.signatureMechanic` |
| Phase Transformation Concept | `boss.phaseTransformationConcept` |
| Defeat Animation Concept | `boss.defeatAnimationConcept` |
| Unique Loot Theme | `boss.uniqueLootTheme` |

Loot theme is a phrase, not a drop table. Phase text describes a change, not a stat jump.

The target table's "Secret / Comedy Boss" is the category value `Secret Boss`.

## IDs

| Category | Prefix | Example |
|---|---|---|
| Normal | `NRM` | `MON-NRM-0001` |
| Elite | `ELT` | `MON-ELT-0001` |
| Mini Boss | `MNB` | `MON-MNB-0001` |
| Main Boss | `MJB` | `MON-MJB-0001` |
| World Boss | `WLB` | `MON-WLB-0001` |
| Secret Boss | `SCB` | `MON-SCB-0001` |

The number is four digits. The prefix must match `category`. Inspiration ids from agents 01–05 stay `INS-01-001` shaped (`INS-` plus two digits, a hyphen, three digits). Agent 06 also uses `SELF-06-001` for a stand-in inspiration. Both shapes are accepted on `research.inspirationId`. `sensitivity` on an agent 06 research block is not stored; `ipRisk` is the field the audit reads.

## Status, risk, confidence

| Field | Values |
|---|---|
| `status` | `RESEARCH`, `PROPOSED`, `QA_PASSED` |
| `ipRisk` | `low`, `medium`, `high`, `blocked` |
| `research.confidence` | `high`, `medium`, `low` |

`LOCKED` and `OWNER_APPROVED` are rejected. This project does not record owner sign-off.

`blocked` means do not produce the entry. `high` means a reader can still see a protected source too clearly, so QA should look again. `low` and `medium` are the ordinary range.

Confidence uses the same three words as the inspiration records in the brief.

## World fields that already exist

Faction names and ids are the four in `src/schema/constants.js`:

| Name | Id | Role on that faction |
|---|---|---|
| Aegis Dominion | `FAC_AEG` | Tank |
| Phantom Blades | `FAC_PHA` | DPS |
| Celestial Nexus | `FAC_CEL` | Magic |
| Sanctuary Order | `FAC_SAN` | Support |

`creative.factionAffiliation` may also be `Wild Creature`, `Corrupted Echo`, `Tower Guardian`, `Tower Anomaly`, or `null`. Tower Anomaly is the brief's tower-anomaly creature. Null means unaffiliated. These four labels are not new factions and do not get a `FAC_` id.

Suggested rarity uses the avatar set from CORE-024: `N`, `R`, `Epic`, `EX`, or `null`. `FAC` is an action-card rarity (CORE-025) and is rejected. The demo enemies in `content/v05/enemies/demo-battle.json` use the same letters (`N` in the sample) plus `rarityStatus`.

`hooks.role` uses the demo enemy roles: `Tank`, `DPS`, `Magic`, `Support`, or `null`.

`hooks.gachaPool` may name `avatar`, `action`, or `companion`, the `GachaBanner.pool` vocabulary. Naming a pool does not add a weight, a rate, or a pity counter. Those stay in `src/gacha`.

## Future hooks

`hooks` is optional.

| Hook | Meaning |
|---|---|
| `cardId` | Reserved card id, or `null`. Pattern `^[A-Z][A-Z0-9_]*$`, the same kind of id as `ACT_` / `AVC_` ids. Not an action card and not a banner row. |
| `enemyId` | Reserved id in the demo enemy shape `ENM_...`, or `null`. |
| `rarity` | `N` / `R` / `Epic` / `EX` / `null`. The import uses this when it is set, otherwise `creative.suggestedRarity`. |
| `role` | Battle role, or `null`. |
| `factionId` | `FAC_AEG`, `FAC_PHA`, `FAC_CEL`, `FAC_SAN`, or `null`. |
| `gachaPool` | Pool name or `null`. |

If `factionAffiliation` is one of the four faction names, `hooks.factionId` must match that name or be empty. The export then fills the id from the name. If affiliation is Wild Creature, Corrupted Echo, Tower Guardian, or Tower Anomaly, `hooks.factionId` must be null. A null affiliation may still reserve a faction id for later.

## Game import

`export-json.mjs` writes one JSON document. `records` are the research rows. `gameImport` is the future loader shape. The whole file validates against `$defs/importFile`.

Enemy rows follow `content/v05/enemies/demo-battle.json`:

| Demo enemy field | Research import |
|---|---|
| `enemyId` | `hooks.enemyId`, or `ENM_<prefix>_<nnnn>` derived from the monster id (`MON-NRM-0001` becomes `ENM_NRM_0001`) |
| `displayName` | `creative.nameEn` |
| `factionId` | Resolved faction id, or `null` |
| `role` | `hooks.role`, or the combat archetype when it is exactly Tank, DPS, Magic, or Support. Otherwise `null` |
| `rarity` | Hook rarity, else suggested rarity, else `null` |
| `rarityStatus` | Always `PROPOSED`. The letter is a suggestion, not locked balance |
| `stats` | **Omitted.** The demo file has `atk` / `def` / `spd`. This export does not. |

Extra enemy keys, kept beside the demo shape: `nameTh`, `monsterId`, `category`, `status`.

The battle wrapper keeps `contentTier`, `warning`, `battle.battleId`, `battle.status`, `battle.note`, and `battle.enemies`. `contentTier` is `research` (not `draft` or `production`). `battleId` is `null` until a battle stream assigns an encounter. `battle.status` is `PROPOSED`.

Card rows have `cardId`, `cardIdStatus` (`UNASSIGNED` or `RESERVED`), names, and rarity. They have no `cardKind`, so they are not action cards or avatar cards.

`gameImport.gacha.included` is `false`. Suggestions, when a pool and a rarity letter are both present, are `{ monsterId, pool, rarity }` only. Weights, pity, and rates are not in the file.

`gameImport.encounters` lists reserved enemy ids per category. It is not a playable wave.

Do not copy the export into `content/v05/enemies` or `src/gacha`. Do not load it in the battle engine.

## What this schema refuses

No `hp`, `atk`, `def`, `spd`, `pow`, `damage`, weights, rates, or pity fields. A number anywhere in a monster record is an error. Prose in `creative` or `boss` that says things like `50 damage` or `ATK 12` is an error. Research facts are not scanned that way, so a sourced measurement can stay a sentence.

Every object sets `additionalProperties: false`. A new field is a schema change, not a silent extra key.

## Canonical file

```json
{
  "schemaVersion": "monster-research-1",
  "contentTier": "research",
  "records": []
}
```

`contentTier` is optional. When present it must be `research`, so the repo data check does not treat the file as draft or production content.

## Agent files

Watched on 2026-11-20: `research/m06-parody` is on origin and `research/m07-boss` is not. The adapter reads agent 06's real sample. An unmapped key is dropped and reported as `UNKNOWN_FIELD`.

Agent 06 ids `M06-N-001` and `M06-E-001` become `MON-NRM-0001` and `MON-ELT-0001`. The letter map is N→NRM, E→ELT, M/MB→MNB, B/MJ→MJB, W/WB→WLB, S/SC→SCB, and the number is padded to four digits. The same map applies to `M07-` when that branch publishes. A canonical `MON-` id is left as written.

`Normal Monster` and `Elite Monster` are the categories `Normal` and `Elite`. `Secret / Comedy Boss` is `Secret Boss`.

Inside `creative`, `parodyNameEn` is the English name and `thaiName` is the Thai name. An element object `{ attributeId, name }` becomes the name string (`Strike`, not a damage type). A `towerEnvironment` object becomes its `name`. `originId` fills faction affiliation when that field is empty: `ORG-WILD` Wild Creature, `ORG-ECHO` Corrupted Echo, `ORG-GUARD` Tower Guardian, `ORG-ANOM` Tower Anomaly. A faction object `{ factionId, name, role }` sets the affiliation name plus `hooks.factionId` and `hooks.role`. `ipSimilarityRisk` is `ipRisk`. `research.sourceUrl` is copied from the first source when the record only lists `sources`. `domain`, `copiedFrom`, `punLanguage`, `creativeBoundary`, and `ipSimilarityReason` are provenance and are not stored. `boss` is set to `null` for Normal and Elite when the record omits it.

`docs/research/monsters/lore/sample_lore_links.json` on `research/m08-lore` is a framework document whose `entries` list was empty, because no boss sample had been published. Passing it with `--lore` warns `LORE_EMPTY` and applies no links. A later entry is a lore link when it names a monster and carries `originId`, `environmentId`, `attributeId`, `hook`, or the three lore fields. `hook` is written into the lore summary. Lore still overwrites only affiliation, lore summary, and tower environment.

Accepted monster wrappers: `records`, `entries`, `monsters`, `bosses`, `pitches`, `samples`, a bare array, one monster object, or arrays keyed by category (`Normal`, `Elite`, `mini_boss`, `Secret / Comedy Boss`, and the other category aliases).

| Agent | Expected file | What the tool reads |
|---|---|---|
| 06 | `docs/research/monsters/creative/parody/sample_normal_elite.json` | `entries` or `records`, brief column titles or canonical records |
| 07 | `docs/research/monsters/creative/bosses/sample_bosses.json` | `bosses`, with the eight boss fields at the top or under `boss` |
| 08 | `docs/research/monsters/lore/sample_lore_links.json` | `links`: `monsterId` or parody name, plus `factionAffiliation`, `loreSummary`, `suggestedTowerEnvironment` |
| 10 | `docs/research/monsters/qa/` | `reviews`: `monsterId`, `status`, `ipRisk`, `confidence`, `notes` |
| 01–05 | `inspirations.json` | The brief's inspiration objects, or `{ "inspirations": [...] }` |

Join order:

1. Monster files create records. A repeated `monsterId` keeps the first copy and errors with `DUPLICATE_ID`.
2. Inspirations fill empty research fields only. They do not overwrite a fact, a source, or a flag the monster file already set. `parodyPotential` is not copied into `creative`.
3. Lore overwrites affiliation, lore summary, and tower environment. A status on a lore link is ignored.
4. QA overwrites `status`, `ipRisk`, and `research.confidence`. `LOCKED` and `OWNER_APPROVED` are rejected and not applied. Notes go to the audit sheet as INFO. They are not errors.
5. Schema and the duplicate / IP audit run.

A thin pitch that lacks sources stays invalid. The tool does not invent a title, a date, or a `supports` line.

## Duplicate and IP audit

Names are folded with NFKC, lowercased, punctuation turned into spaces, and one leading the/a/an removed. Equality then ignores spaces, so Thai text is kept and `Mopwick` matches `Mopwick!`.

| Code | When | Level |
|---|---|---|
| `DUPLICATE_NAME` | Folded English or Thai names match | error |
| `DUPLICATE_NAME_SUFFIX` | Names match once a trailing number is removed | error |
| `RECOLOUR` | Names match once a colour word is removed (`red`, `blue`, `gold`, …) | error |
| `SIMILAR_NAME` | Character-bigram Dice ≥ 0.86, or ≥ 0.75 | error, or warning |
| `SIMILAR_CONCEPT` | Token Jaccard on concept text ≥ 0.72, or ≥ 0.50 | error, or warning |
| `IP_BLOCKED` | `ipRisk` is `blocked` | error |
| `IP_HIGH` | `ipRisk` is `high` | warning |
| `IP_PROTECTED_NAME` | `protectedName` is true and the parody name still contains a non-generic word from the inspiration | error, unless risk is already high or blocked |
| `FACTION_MISMATCH` | `hooks.factionId` disagrees with affiliation | error |
| `RARITY_FAC` | Someone used `FAC` | error |
| `SOURCE_URL_NOT_LISTED` | Primary URL is not in `sources` | error |
| `STAT_NUMBER`, `FORBIDDEN_FIELD`, `PROSE_STAT` | A combat number or stat field slipped in | error |

Concept text is the comedy concept, signature trait, ability, visual identity, creature type, and the boss title, entrance, silhouette, mechanic, phase, and loot theme. Lore and the tower sentence are left out so every tower creature does not look like a duplicate.

Colour words and number suffixes are errors because the brief forbids padding by recolours or number suffixes.

## Workbook

`build-workbook.mjs` writes these sheets, in this order:

1. Master Monster Database
2. Normal Monsters
3. Elite Monsters
4. Mini Bosses
5. Main Bosses
6. World Bosses
7. Secret Bosses
8. Research Sources
9. Duplicate & IP Risk Audit (renamed from 'Duplicate / IP Risk Audit': Excel forbids '/' in sheet names)

Category sheets use the same columns as the master sheet and only the rows for that category. Research Sources has one row per source. The audit sheet lists errors, warnings, and QA notes.

The ninth title is the brief's title, including the slash. OOXML forbids `/ \ ? * [ ] :` in a sheet name. The file still uses that exact title. If a spreadsheet app offers to repair the workbook, that is the slash.

exceljs and openpyxl are not installed, and this stream does not edit `package.json`. The writer is a small OOXML builder on Node's `zlib`.

## Commands

From the repo root:

```bash
node tools/research/monsters/validate.mjs \
  --input docs/research/monsters/schema/examples/sample-database.json

node tools/research/monsters/build-workbook.mjs \
  --input docs/research/monsters/creative/parody/sample_normal_elite.json \
  --input docs/research/monsters/creative/bosses/sample_bosses.json \
  --lore docs/research/monsters/lore/sample_lore_links.json \
  --qa docs/research/monsters/qa/sample_qa.json \
  --inspirations docs/research/monsters/sources/01-classic-rpg/inspirations.json \
  --out monsters.xlsx

node tools/research/monsters/export-json.mjs \
  --input docs/research/monsters/creative/parody/sample_normal_elite.json \
  --input docs/research/monsters/creative/bosses/sample_bosses.json \
  --lore docs/research/monsters/lore/sample_lore_links.json \
  --qa docs/research/monsters/qa/sample_qa.json \
  --out monsters.import.json
```

Repeat `--input`, `--lore`, `--qa`, and `--inspirations` for every file. Positional paths are extra inputs. `--schema` defaults to this directory's `monster.schema.json`.

Exit 0 when there is no error. Exit 1 when schema, duplicate, or IP checks fail. A workbook is still written so the audit sheet is visible. An import JSON is not written unless `--allow-invalid` is set, because a broken record cannot satisfy `$defs/importFile`. Exit 2 means a bad argument or a missing path. `--strict` turns warnings into failures. `--json` makes `validate.mjs` print a JSON report.

Tests:

```bash
node --test tests/research/monsters/database.test.js
```
