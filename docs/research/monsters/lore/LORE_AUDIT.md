# Lore audit — existing world text (Agent 08)

Status of this file: **RESEARCH**. It quotes the repo. It does not add canon and it does not change core lore.

Audited commit: `research/monster-base` @ `6e2bffec082a4db190bd51087196d29b02555f4a` (`6e2bffe`).
Scope read: `docs/design/v05/**` (brief, requirements index, tabs, ref-card notes), `content/v05/source/**`, `content/v05/avatars/justin-avatars.json`, `content/v05/enemies/demo-battle.json`, `content/v05/hideout/house-tiers.json`, `docs/DESIGN_DECISION_RESEARCH.md`, `docs/DATA_SCHEMA.md`, `docs/audit/BASELINE_AUDIT_20261120.md`, `docs/qa/v05/REQUIREMENT_RECONCILIATION.md`, `docs/final_v05/**`, `src/schema/constants.js`, `src/schema/game.schema.json`, `src/schema/hideout.js`, `src/avatars/catalog.js`, `src/config/index.js`, `src/engine/model.js`, `src/engine/samples.js`, `web/js/sample-catalog.js`, `web/js/profile.js`, `web/js/screens/map.js`, `web/assets-manifest.json` (tower pin only).

How to read a quote below:

| Label | Meaning |
|---|---|
| CANON | Owner-locked wording or a locked identity string. Do not rewrite it. |
| LOCKED RULE, NOT LORE | A locked gameplay fact that lore must not contradict. It is not a story. |
| PROPOSED / SAMPLE | Sheet or code says the text is a sample. Not world canon. |
| PLACEHOLDER | Explicit stand-in so a screen can load. Not a creature. |
| SUPERSEDED | Older wording the sheet tells us not to use. |
| REJECTED | A later Owner decision dropped it. |
| UNKNOWN | Searched. No canon sentence exists. |

`content/v05/source/tabs/` is a verbatim copy of `docs/design/v05/tabs/` (`content/v05/source/PROVENANCE.md`). Quotes below cite the design tab. The source copy says the same thing.

---

## 1. What the world actually says

The locked world text is two map rows plus the tone row. There is no faction bible, no tower floor list, and no summoning procedure.

### World tone — CANON

`docs/design/v05/tabs/v05_Hideout_Map.md` MAP-08, also `docs/design/v05/tabs/v05_Hideout_Map.json`:

> Topic: World Tone. Specification: "Comedy Fantasy throughout". Status: LOCKED. Evidence/Theme: Owner 17 Nov. Implementation Notes: "No Main Story or Main Quest".

`docs/design/v05/tabs/v05_Core_Rules.md` CORE-001:

> Area: Project. Decision / Rule: "Comedy-fantasy gacha card battle; no compulsory main storyline or Main Quest". Status: LOCKED. Evidence: Owner 16-20 Nov. Implementation Notes: "MVP loop Gacha → Team/Deck → Battle → Rewards → Upgrade".

`docs/design/v05/BRIEF_20261120.md` §4, Owner brief t247u:

> Comedy Fantasy ทั้งเกม; Mysterious Tower เป็นแกน World Lore, Real People + Echo Hybrid Avatars; ไม่บังคับ Main Story / Quest; VR/Sync 100% และ Tactical 5×2 เป็นแนวคิดเก่าที่ยัง PENDING ไม่ใช่ข้อบังคับ MVP

Player-facing paraphrase, not a second lock. `web/js/screens/map.js` renders: "Comedy fantasy, no main quest. Wander on purpose."

### Mysterious Tower — CANON name and job, UNKNOWN interior

`docs/design/v05/tabs/v05_Hideout_Map.md` MAP-03:

> Topic: "Mysterious Tower". Specification: "PvE battle and Mystery Tower lore". Status: LOCKED. Evidence/Theme: Owner. Implementation Notes: "Map destination".

The same row is in `docs/design/v05/tabs/v05_Hideout_Map.json`, `content/v05/hideout/house-tiers.json` (`id: "mysterious-tower"`, `name: "Mysterious Tower"`, `summary: "PvE battle and Mystery Tower lore"`, `status: "LOCKED"`), and `src/schema/hideout.js` (`pin('mysterious-tower', 'Mysterious Tower', 'MAP-03', 'PvE battle and Mystery Tower lore')`).

`web/assets-manifest.json` asset `MAP_BLD_TOWER` hotspot label is `"Mysterious Tower"`, `action: "battle"`, `mode: "tower"`, `status: "CONCEPT"`, `placementStatus: "PROPOSED"`. The picture is concept art. It does not describe floors.

Both spellings are in the locked row: the **name** is `Mysterious Tower`; the **specification** says `Mystery Tower lore`. This audit does not pick a winner.

`docs/design/v05/tabs/v05_Open_Decisions.md` OPEN-07:

> Area: World progression. Open Choice: "Sync 100%, old 5×2, Tower floors, Sports games". Status: PENDING. Safe Implementation: "Keep non-core / optional".

`docs/qa/v05/REQUIREMENT_RECONCILIATION.md` keeps tower floors pending after Owner t261u: "The old 5×2 grid, Tower floors, and Sports games stay pending."

UNKNOWN: floor count, floor names, biomes, bosses, why the tower exists, who built it, whether it has a top.

### Hybrid Avatar / Echo — CANON phrase, UNKNOWN mechanic

`docs/design/v05/tabs/v05_Hideout_Map.md` MAP-09:

> Topic: World Lore. Specification: "Mystery Tower, Real People + Echo hybrid Avatar". Status: LOCKED. Evidence/Theme: Owner 16 Nov. Implementation Notes: "Lore depth optional, not gated narrative".

That is the whole locked sentence. It does not define Echo, hybrid, or summoning.

The research brief (`docs/research/monsters/BRIEF.md`) calls the same cluster "Hybrid Avatar / Echo Summoning". **That label is a research heading. It is not in the v0.5 sheet.** No file describes a summoning rite, a cost, a failure state, or what an Echo is made of.

Strings that look like lore and are not:

| String | Where | What it is |
|---|---|---|
| `Echo ${def.name}` | `web/js/profile.js` `buildMatchInput` | Enemy copies of the player's Justin roster so a match can start. Instance ids are `echo:${avatarId}`. |
| "Echoes" | `web/js/screens/battle.js` | Fallback label when the front enemy has no name. |
| "Echo hesitates (…)" | `web/js/mock-engine.js` | Error log line. |
| "Placeholder Echo Tank / Blade / Spark / Hymn" | `content/v05/enemies/demo-battle.json` | `contentTier: "draft"`, `status: "PLACEHOLDER"`, warning "PLACEHOLDER enemy team. Stats are not locked balance. Not PRODUCTION_READY." Enemy ids `ENM_DEMO_001`..`004`, rarity `N`, all stats 1. |

Those four placeholders are assigned the four faction ids and the four roles. They are not a bestiary and they are not proof that every Echo belongs to a faction.

UNKNOWN: whether a player avatar *is* an Echo, *wears* an Echo, or *fights* Echoes; whether "Real People" are the player, the Justins, the `*_001` art cast, or someone else; whether Corrupted Echo is a thing (it is not in any canon file; the monster brief allows it as a research category).

### VR Sync — REJECTED as a rule, not usable as monster lore

`docs/design/v05/tabs/v05_Core_Rules.md` CORE-037 still says PENDING: "100% initial Sync from old concept" / "Lore/mode only until Owner confirms active stat".

Later Owner decision overrides that pending state. `docs/qa/v05/REQUIREMENT_RECONCILIATION.md`:

> Owner t261u (20 Nov 2026, 17:07 ICT): CORE-037 SYNC — REJECTED. Out of scope. Not PENDING.

`src/config/index.js` `vrSync`: `value: null`, `status: 'REJECTED'`, note "SYNC is dropped. Out of scope, not a pending rule." Evidence `Owner t261u 20 Nov 2026`.

`docs/DATA_SCHEMA.md`: "CORE-037 SYNC | REJECTED, value null. Not pending".

Do not build monster origin, tower physics, or Echo rules on Sync.

### Old battle words — SUPERSEDED

`docs/design/v05/tabs/v05_Core_Rules.md` CORE-034: "10+10 Tactic, 7 MP, Valhalla, no Void" — SUPERSEDED. CORE-033: "Common/Rare/Legendary/Mythic v0.4 values" — SUPERSEDED, "Do not use in new roster/gacha". CORE-035: autonomous auto-battler is not the current primary battle. CORE-036 tactical 5×2 stays PENDING.

"Valhalla" is an archived rules word, not a place in current lore.

---

## 2. Aegis Dominion — CANON name and role only

Locked identity, every copy agrees:

| Field | Exact value | Sources |
|---|---|---|
| factionId | `FAC_AEG` | `src/schema/constants.js`, `src/engine/model.js`, `src/schema/game.schema.json` enum |
| name | `Aegis Dominion` | same; also `docs/DATA_SCHEMA.md`, `tools/ci/protected-constants.json` |
| role | `Tank` | same. `src/schema/validate.js` rejects any other role for this id |

`docs/design/v05/BRIEF_20261120.md` §1: "Factions: `Aegis Dominion` = Tank, `Phantom Blades` = DPS, `Celestial Nexus` = Magic, `Sanctuary Order` = Support".

`src/schema/constants.js` header: "Specified faction names and roles. Do not rename the name strings."

`src/config/index.js` factions note: "Aegis Dominion=Tank, Phantom Blades=DPS, Celestial Nexus=Magic, Sanctuary Order=Support". Status LOCKED, rule CORE-003. CORE-003's own sheet text is "4 Avatars per player team" / "Can bring mixed factions" (`v05_Core_Rules.md`). The faction map is stored on that config object; the sheet line that names the four factions is the brief §1 hard requirement, not a separate lore paragraph.

### People who carry the name

**Justin Case — CANON name and faction. Skills are samples.**

`docs/design/v05/tabs/v05_Avatar_Examples.md` AV_EX01:

> Name: JUSTIN CASE. Faction: Aegis Dominion. Role: Tank. Rarity: Epic. ATK 3 / DEF 8 / SPD 1. Active: "Shield +2; Taunt 1 Turn". Passive: "70% turn start: team DEF +1 for 1 Turn". Approval: "Name/Faction LOCKED; Stats/Skills PROPOSED". Notes: "4 stars on concept art are illustrative".

Repo id after Owner t253u: `AVT_AEG_002`, `designRef: "AV_EX01"`, `nameEn: "Justin Case"`. `content/v05/avatars/justin-avatars.json` warning: "SAMPLE. Name and faction are LOCKED (Owner t253u 20 Nov 2026). Stats and skills are PROPOSED except Justina Moment active, which is LOCKED."

`nameTh` in that file copies `nameEn` with `nameThNote`: "No Thai name in the v05 sheet. This copy of nameEn is not a locked localization." So there is **no locked Thai name** for Justin Case.

Reference card `docs/design/v05/ref_cards/README.md`: active printed "+2 Shield • Taunt 1 turn"; passive name "(as printed on card)". The README says printed art does **not** promote any stat or skill to LOCKED. `web/js/sample-catalog.js` says of the passive: "Passive name was not supplied on the sheet. Do not invent one." The baseline audit (`docs/audit/BASELINE_AUDIT_20261120.md` §3) says the passive name was not supplied. Do not treat a card-face nickname as canon lore.

**Sir Potlid — CANON identity of a different character. No biography.**

`src/avatars/catalog.js` and `docs/DATA_SCHEMA.md`:

> `AVT_AEG_001`. nameEn `Sir Potlid`. nameTh `เซอร์ฝาหม้อ`. factionId `FAC_AEG`. role `Tank`. rigId `humanoid_heavy`. stats TBD null. rarity null.

Equipment tied to him by id, not by a story: `EQ_AEG_POT_HELMET_SILVER_001` and `EQ_AEG_POT_HELMET_GOLD_001` (`variantOf` the silver helmet), slot `headgear`, `nativeAvatarId: AVT_AEG_001`. Stat modifiers are null. `docs/DESIGN_DECISION_RESEARCH.md` calls the starters "a pot-lid tank, a squeaky DPS, a meteor mage, a plaster support" inside a **proposals-only** file ("Nothing in this file is an approved rule."). The joke is readable from the names. It is not a written history.

`web/js/sample-catalog.js`: `battleLegal: false`, note "Existing art avatar. Stats TBD. Id is unchanged."

### What is unknown about Aegis Dominion

No creed, homeland, uniform, leader, monster, or relationship to the tower. "Dominion" and "Aegis" are not defined. Nothing says the faction owns shields, pots, or the Armory. Tank is a combat role (`CORE` faction map), not a territory.

FAC cards that require this faction (`src/engine/samples.js` and `web/js/sample-catalog.js`) are sample actions with a `factionRequirement` of `Aegis Dominion`. CORE-023: a FAC action needs a living avatar of that faction, "except card-specific override". CORE-022: generic actions work for any faction. "ห้ามล็อกทั้ง Deck ให้ใช้ได้ Faction เดียว" (`BRIEF_20261120.md` §1). A faction tag is a play gate, not membership lore.

---

## 3. Phantom Blades — CANON name and role only

| Field | Exact value |
|---|---|
| factionId | `FAC_PHA` |
| name | `Phantom Blades` |
| role | `DPS` |

Same sources as Aegis. Role is locked to DPS.

**Justin Time — CANON name and faction. Skills are samples.**

`v05_Avatar_Examples.md` AV_EX02:

> Name: JUSTIN TIME. Faction: Phantom Blades. Role: DPS. Rarity: Epic. ATK 8 / DEF 2 / SPD 9. Active: "Reckless Rush: next attack ATK +2 this Turn". Passive: "30% on attack: +2 Damage". Approval: "Name/Faction LOCKED; Stats/Skills PROPOSED". Notes: "Renamed from Barry Blitz".

`Barry Blitz` is a discarded draft name, not a second character and not lore.

Repo id: `AVT_PHA_002`. Reference card prints passive name "Lucky Slash". Sheet text does not name the passive. Treat "Lucky Slash" as card-face wording, not a locked lore title. No locked Thai name.

**Nox Squeak — CANON identity, separate person.**

`AVT_PHA_001`. nameEn `Nox Squeak`. nameTh `น็อกซ์ รองเท้าดัง`. role DPS. rigId `humanoid_standard`. rarity null. stats TBD.

UNKNOWN: what "Phantom" means, whether the faction is stealthy, undead, fast, or just the DPS label. No monster belongs to it in canon.

---

## 4. Celestial Nexus — CANON name and role only

| Field | Exact value |
|---|---|
| factionId | `FAC_CEL` |
| name | `Celestial Nexus` |
| role | `Magic` |

**Justin Theory — CANON name and faction. Skills are samples.**

`v05_Avatar_Examples.md` AV_EX03:

> Name: JUSTIN THEORY. Faction: Celestial Nexus. Role: Magic. Rarity: Epic. ATK 7 / DEF 3 / SPD 4. Active: "Arcane Formula: next attack ATK +3 this Turn". Passive: "40% turn start: self ATK +1 for 1 Turn". Approval: "Name/Faction LOCKED; Stats/Skills PROPOSED". Notes: "Science/magic comedy".

"Science/magic comedy" is a sheet note on this sample, not a doctrine of the faction. Repo id `AVT_CEL_002`. Reference card prints passive name "Eureka!". No locked Thai name.

**Madame Meteor — CANON identity, separate person.**

`AVT_CEL_001`. nameEn `Madame Meteor`. nameTh `มาดามดาวตก`. role Magic. rigId `humanoid_standard`. rarity null. stats TBD.

UNKNOWN: stars, gods, a nexus location, whether Magic is elemental. The schema has no element field (see §8).

---

## 5. Sanctuary Order — CANON name and role only

| Field | Exact value |
|---|---|
| factionId | `FAC_SAN` |
| name | `Sanctuary Order` |
| role | `Support` |

**Justina Moment — CANON name, gender, faction, and one active effect.**

`v05_Avatar_Examples.md` AV_EX04:

> Name: JUSTINA MOMENT. Faction: Sanctuary Order. Role: Support. Rarity: Epic. ATK 2 / DEF 5 / SPD 6. Active: "Saving Grace: All teammates Regen +3 for 2 Turns". Passive: "50% turn start: random ally ATK +1 for 1 Turn". Approval: "Female + Name + ACTIVE EFFECT LOCKED; other stats/skills PROPOSED". Notes: "Former male Justin Spirit SUPERSEDED".

`BRIEF_20261120.md` §3: "JUSTINA MOMENT เปลี่ยนจากเวอร์ชันชายเป็นหญิงแล้ว ชื่อเดิม Justin Spirit ไม่ใช้แล้ว; `Saving Grace` ต้องแทน Shield/buff เก่าทั้งหมด".

`Justin Spirit` is superseded. Do not bring that name back as a character, a title, or a monster.

Repo id `AVT_SAN_002`, `gender: "female"`. Saving Grace is the one locked active. The numbers +3 and 2 turns are part of that locked active text. Her other stats and her passive stay PROPOSED. Reference card prints passive name "Moral Support"; the sheet does not. No locked Thai name.

`docs/design/v05/tabs/v05_Core_Rules.md` CORE-032: "Gifts and Relationship apply to Companions ONLY, not Avatars". Justina is an Avatar. She is not a companion. No companion has a canon personal name in `content/v05/` (the companion gacha pool is a banner slot in `content/v05/gacha/TEST_ONLY_banners.json`, not a character).

**Sister Plaster — CANON identity, separate person.**

`AVT_SAN_001`. nameEn `Sister Plaster`. nameTh `ซิสเตอร์พลาสเตอร์`. role Support. rigId `humanoid_standard`. rarity null. stats TBD.

The word "Sister" is part of her name. It does not establish a church, a vow, or an order charter. "Sanctuary" and "Order" are likewise undefined.

UNKNOWN: healing theology, whether Regen is holy, whether the faction runs the Hideout infirmary. None of that is written.

---

## 6. The eight named people are eight people

`docs/qa/v05/REQUIREMENT_RECONCILIATION.md`:

> Owner t253u (20 Nov 2026, 16:10 ICT) locked three items the sheet or the baseline audit had still open: D-ID — Justins are new records AVT_AEG_002, AVT_PHA_002, AVT_CEL_002, AVT_SAN_002 (designRef AV_EX01..04). AVT_*_001 identities stay.

`src/config/index.js` `justinCharacters.value` is `'new-characters'`, status LOCKED, evidence `Owner t253u 20 Nov 2026`, `existingIdsUntouched`: the four `AVT_*_001` ids.

`docs/design/v05/ref_cards/README.md`: "Owner decision t253u (20 Nov 2026): the four Justins are NEW characters, separate from the existing `*_001` avatars."

The earlier audit `docs/audit/BASELINE_AUDIT_20261120.md` §3 asked D-ID as an open question and proposed distinct characters. t253u closed it. Do not merge Sir Potlid into Justin Case, Nox Squeak into Justin Time, Madame Meteor into Justin Theory, or Sister Plaster into Justina Moment.

Neither quartet has a backstory. The `*_001` names are comedy-readable labels with Thai names. The Justin names are locked English puns (`Justin Case`, `Justin Time`, `Justin Theory`, `Justina Moment`) with no sheet biography.

---

## 7. Other map pins (so monster lore does not squat in them)

All LOCKED as destinations in `v05_Hideout_Map.md`. None of them has a story.

| ID | Name | Specification |
|---|---|---|
| MAP-02 | Home | "Player hub / Hideout" |
| MAP-04 | Sports Complex | "Football, Basketball, Racing, MotoGP" — side battles deferred |
| MAP-05 | Tournament Arena | "Main battle/PvP venue" — "Modes & multiplayer specifics pending" |
| MAP-06 | Shopping Mall | "Furniture and cosmetics" |
| MAP-07 | Gachapon | "Avatar / Action / Companion pools" |

House tiers LOCKED as names only (`HOME-01`..`HOME-06`): Cabin, Bungalow, Cottage, Loft, Villa, Penthouse. Evidence themes "Base Home", "Rustic→simple", "Cozy", "Modern", "Luxury", "Ultra luxury" are visual notes, not regional lore. HOME-07: always display the current highest acquired tier.

The Hideout is the player hub. It is not described as a faction fortress.

---

## 8. Elements, attributes, rarities — what the schema actually has

Searched `src/schema/` for an element or attribute enum. **There is none.** `src/schema/game.schema.json` title: "Comedy Fantasy Card Game core data". Combat identity fields that do exist:

| Locked vocabulary | Values | Where |
|---|---|---|
| Avatar stats | `atk`, `def`, `spd` (legacy key `pow` migrates 1:1 and is kept) | CORE-005, `PRIMARY_STAT_KEYS`, `POW_TO_ATK` |
| Not stats | HP is not a catalog stat. `DATA_SCHEMA.md`: "HP is not a stat." Damage formulas are PENDING (CORE-039) | |
| Roles | `Tank`, `DPS`, `Magic`, `Support` | faction records. One role per faction, not a free tag |
| Action types | `ATK`, `DEF`, `Skill` | `CARD_ACTION_TYPES`, CORE-020 |
| Avatar rarity | `N`, `R`, `Epic`, `EX` | CORE-024, `AVATAR_RARITIES` |
| Action rarity | `N`, `R`, `Epic`, `EX`, `FAC` | CORE-025. "EX and FAC same top power tier". "FAC is action rarity/category, not avatar faction" |
| Superseded rarity words | Common, Rare, Legendary, Mythic | CORE-033. Do not use |
| Skill slots | N: base stats, a few have a small Active. R: Active **or** Passive. Epic: both. EX: both plus Ultimate | CORE-026..029 |
| The Void | A card pile for exiled cards. Not a plane, element, or creature type | CORE-018 |

`docs/DESIGN_DECISION_RESEARCH.md` proposes rarity names "Common, Rare, Epic, Legendary" under Q-RARITY and says the whole file is proposals only. CORE-024 already replaced that list. Do not import those four words as monster rarities.

Sample effect words that exist on proposed skills and are **not** elements: Shield, Taunt, Regen, ATK buff, DEF buff. Saving Grace is one avatar's locked active, not an attribute shared by the Sanctuary Order.

No creature-type enum exists. No monster schema exists in `src/`. The 22-field monster record in `docs/research/monsters/BRIEF.md` is the research assignment, not shipped game data.

---

## 9. `docs/DESIGN_DECISION_RESEARCH.md` and `docs/final_v05/`

`DESIGN_DECISION_RESEARCH.md` opens: "PROPOSALS ONLY. Nothing in this file is an approved rule." Its "fixed facts" list repeats party size 4, hand 5, base AP 5, the four faction name/role pairs, and the four `AVT_*_001` starter names. Those facts match the code it was written against. They do not add world prose.

It also suggests content directions (Aegis/Sir Potlid lean DEF, Phantom/Nox lean ATK, Celestial/Madame lean Pierce, Sanctuary/Sister lean Heal) and says "Those are content directions for a later card pass. They are not restrictions, and they are not new card ids." That paragraph is a proposal. It names the `*_001` cast, not the Justins. It must not be quoted as faction lore.

`docs/final_v05/PLAN.md`, `QA_REPORT.md`, and `MIRA_FINAL_MERGE_PROMPT_v03.md` are integration notes. They do not add a faction, a tower floor, or an Echo rule. The plan repeats that tower floors stay pending and that SYNC is rejected.

---

## 10. Unknown list (do not fill these in as canon)

1. Origin story of any faction. Who leads it. Whether factions are nations, guilds, schools, or only deck tags.
2. Any faction monster, mascot, enemy, or sacred beast.
3. What an Echo is. What "hybrid" changes about a real person. How Echo Summoning would work. The summoning name itself is not canon.
4. Tower floors, height, guardians, anomalies, biomes, loot, or a final boss.
5. An element or attribute wheel. A weakness chart.
6. A monster rarity scale. Avatar and action rarities are the only locked ladders, and they describe avatars and action cards.
7. Whether placeholder "Echo" enemies are diegetic.
8. Thai names for the four Justins.
9. Biographies for Sir Potlid, Nox Squeak, Madame Meteor, Sister Plaster, or the Justins.
10. Companion identities.
11. A main story, quest chain, or tower campaign. MAP-08 and CORE-001 forbid making one compulsory.
12. Any use of Sync, Valhalla, Justin Spirit, Barry Blitz, or the five-rarity words as current lore.

Research files under `docs/research/monsters/lore/` may propose answers. Those answers stay `PROPOSED` until the Owner approves them. They are not canon.
