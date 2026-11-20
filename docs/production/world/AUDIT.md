# World content audit — Agent G

Owner order t270u. Base `prod/wave-base` at `7cbf071a15d2da747ba5f9c100696a805860271e` (`docs(production): wave ownership and contracts`). This audit is read-only with respect to canon: it does not change the map, the hideout, cards, enemies, or the client.

Agent G owns `content/prod/world/**`, `docs/production/world/**`, `tools/content/world/**`, and `tests/prod/g/**`. No shared file was edited (`web/index.html`, `web/js/app.js`, `web/css/app.css`, `web/js/assets.js`, `web/assets-manifest.json`). The pack is not imported by `web/` or `src/`. Status on every new record is `GENERATED_REVIEW` / `PROPOSED`. Nothing here is `OWNER_APPROVED`, `QA_PASSED`, `LOCKED`, or `PRODUCTION_READY`.

`docs/final_v05/SLOT_MAPPING_PROPOSAL.md` is not in this tree. It was not recreated.

## Map

The live map is a fixed 1672×941 canvas (`web/assets-manifest.json` `designCanvas`). `web/js/map-layout.js` reads `slot: "building"` hotspots. `web/js/screens/map.js` draws them and handles five actions: `home`, `gacha`, `battle`, `mall`, `locked`. The title copy is already the rule: "Comedy fantasy, no main quest. Wander on purpose." UI anchors on that canvas are `map-title` (24, 12, 640×88) and `map-back` (1476, 808, 176×116). The back control is labeled Hideout and routes to the home screen.

| Asset | Hotspot | Site id | Locked destination id | Label | Action | Mode | Locked |
|---|---|---|---|---|---|---|---|
| `MAP_BLD_HIDEOUT` | `hideout` | `home` | `home` | Hideout | `home` | — | no |
| `MAP_BLD_TOWER` | `tower` | `tower` | `mysterious-tower` | Mysterious Tower | `battle` | `tower` | no |
| `MAP_BLD_ARENA` | `arena` | `arena` | `tournament-arena` | Tournament Arena | `battle` | `arena` | no |
| `MAP_BLD_SPORTS` | `sports` | `sports` | `sports-complex` | Sports Complex | `locked` | — | yes |
| `MAP_BLD_GACHA` | `gacha` | `gachapon` | `gachapon` | Gachapon | `gacha` | — | no |
| `MAP_BLD_MALL` | `mall` | `mall` | `shopping-mall` | Shopping Mall | `mall` | — | no |

Hotspot `siteId` and the locked destination id in `content/v05/hideout/house-tiers.json` differ for the tower, arena, mall, and sports pin. Both ids are canon. This pack stores both and renames neither. The alias is recorded in `tools/content/world/canon.js` so a later edit cannot "fix" one side by dropping the other.

Every building hotspot is `placementStatus: PROPOSED`. Shipped art is WebP with an SVG fallback, `review_status: GENERATED_REVIEW`. The mall hotspot carries an existing fit note: the dream box crossed the top of the master, so the shipped width is 280 and the anchor stays on the proposed pad. That note was not edited.

The sports pin shows the existing notice: football, basketball, racing, and MotoGP are stretching off-screen. `MAP-04` keeps the pin and leaves the four games `OUT_OF_SCOPE`. This pack does not add those games.

## Hideout

`web/js/screens/home.js` is the Hideout. There is no second hideout route. The ladder is the locked names Cabin → Bungalow → Cottage → Loft → Villa → Penthouse (`HOME-01`…`HOME-06`). `HOME-07` shows only the highest acquired tier. Peeking is a brochure and does not purchase. `HOME-08` takes stash capacity from installed furniture, pooled, and a tier upgrade adds no slots. `HOME-09` says the mall sells or unlocks furniture. `HOME-10` is auto-placement, no freehand editor. `HOME-11` (Cabin base capacity) and `OPEN-06` (grant versus unlock-to-buy, and prices) stay open. Sheet capacities already live in `content/v05/hideout/house-tiers.json`. They were not copied into this pack.

Phase 3 furniture (`content/v05/hideout/phase3-furniture-art.json`) is art-only: seven asset ids, `capacity` null, `price` null, `PENDING_OWNER`. The mall screen lists those seven plus the five sheet pieces and prints PENDING on every row. Reference names on the sheet and labels on the mall screen are not identical (`Box` versus `Cottage box`, and different capitalization on the cabinet and counter). Offers keep the sheet name in `displayName` and the mall screen string in `mallScreenLabel`.

The companion room is a modal. Gifts and relationship are companions only (`CORE-032`). No named companion catalog exists, so none was invented. Stash filters are Avatars, Actions, and TEST tokens. The capacity line already says furniture slots and the Cabin base are pending.

## Quest and content systems

There is no quest runtime, no quest file, and no quest id in the save. `MAP-08` and `CORE-001` forbid a compulsory main story or main quest. `OPEN-07` leaves tower floors, the old 5×2 grid, and VR Sync open. This pack does not turn those into rules.

Side events are optional copy. Each one has `kind: "side_event"`, `mainQuest: false`, `mandatory: false`, `gatesCoreLoop: false`, and `questId: null`. The encounter order is `proposedOrderOnly` and `enforcedByClient: false`. Hideout, mall, and gachapon stay available from the start. The sports pin stays out of the unlock chain.

## Battles, enemies, and cards

The only enemy battle record is `DEMO_BATTLE_001` in `content/v05/enemies/demo-battle.json`:

| Enemy id | Display name | Faction | Role |
|---|---|---|---|
| `ENM_DEMO_001` | Placeholder Echo Tank | `FAC_AEG` | Tank |
| `ENM_DEMO_002` | Placeholder Echo Blade | `FAC_PHA` | DPS |
| `ENM_DEMO_003` | Placeholder Echo Spark | `FAC_CEL` | Magic |
| `ENM_DEMO_004` | Placeholder Echo Hymn | `FAC_SAN` | Support |

Stats on that file are placeholders. This pack cites the ids and display names and does not add a fifth enemy or a new stat block.

The live fight does not load that file. `web/js/profile.js` `buildMatchInput` fields echo copies of the four Justin avatars (`AVT_AEG_002`, `AVT_PHA_002`, `AVT_CEL_002`, `AVT_SAN_002`) and the demo action deck `DECK_DEMO_MIXED_001`. `web/js/app.js` says so out loud: the tower opponent is a practice echo, and the arena opponent is an echo, not a second player. Battle sprites for enemy roles point at `ENM_DEMO_001` through `ENM_DEMO_003`. `ENM_DEMO_004` has no battle sprite (`tests/web/dream-v02-slots.test.js`). Stages set `rosterWiredToWebBattle: false` and record both the catalog team and the runtime echo roster. They do not retarget the builder.

Starter action names in `content/v05/actions/starter-actions.json` are still placeholders (`Placeholder Jab`, `Placeholder Spark`, and the rest). Justin names, factions, and Justina Moment's active name Saving Grace are the locked identity. This pack does not rename cards, does not restate heal numbers, and does not copy gacha weights. The three banners it may cite are the existing test banners `TEST_BANNER_AVATAR`, `TEST_BANNER_ACTION`, and `TEST_BANNER_COMPANION`. Their `costG` stays null. `GA-11` remains the open price and rate decision. Pity caps stay on `docs/design/v05/tabs/v05_Gacha.md` and are not copied here.

The comedy already in the client is dry and slightly apologetic: the echo takes a nap, the kettle is on, the gachapon coughs politely, FAC cards complain later, the mall tags are blank, and the Justins are puns. New lines stay in that voice. They talk about placeholders as placeholders instead of inventing finished names for the echo roster.

## Loop the tutorials describe

The prompts follow screens that already exist. They do not add buttons.

1. Map (`renderMap`) — six pins, no quest.
2. Prep Battle (`renderPrep`) — team of 4, deck of 30, `START BATTLE` / `BACK`.
3. Battle (`renderBattle`) — action cards command avatars, 5 AP, manual `END TURN`, Draw / Discard / The Void.
4. Rewards (`renderRewards`) — nap or kettle, G / loot / items pending, claim once, back to the Hideout.
5. Hideout / Stash / Team & Deck — Cabin, peek is not a purchase, stash filters, exactly 30 cards, mixed factions legal, duplicate cap still `CORE-040`.
6. Gachapon — three booths, Pull 1 / Pull 10, no amount stored.
7. Mall — pending tags, back to the map.

`CORE-001`'s loop note also names Upgrade. Material recipes are still open (`CORE-031`, `OPEN-04`). The client does not sell an upgrade. This pack does not add an upgrade step or an amount.

## What this pack refuses to overwrite

- House tier names and the "show only the current tier" rule.
- The six map destinations, including the locked sports pin.
- No main quest (`MAP-08`, `CORE-001`).
- Justin identity, Justina's gender, and Saving Grace as already recorded on the avatar file.
- Deck size, team size, AP, piles, and faction gates. Tutorials cite those rules. They do not add a duplicate cap or a price.
- Gacha pity, test weights, and `costG`. Weights are not copied.
- Sheet furniture capacities and Cabin base capacity.
- Save version, combat formulas, card stats, and the asset manifest.
- Sports Complex implementation. Coach Stretch stretches. The door stays locked.
- `main`, PR #9, other agents' branches, and hunter-life. Not touched.

## Pack

| File | Records |
|---|---|
| `content/prod/world/npcs.json` | 6 speakers, one per building |
| `content/prod/world/shopkeepers.json` | 2 counters, 15 offers, checkout off |
| `content/prod/world/side-events.json` | 6 optional events, one per building |
| `content/prod/world/tutorials.json` | 10 prompts for the live loop |
| `content/prod/world/progression.json` | 2 chapters, 4 stages, 3 facilities, 1 locked node |
| `content/prod/world/catalog.json` | pack index and 13 owner questions |

Shop offers are exactly the mall screen rows, in that order, then the three test banners in file order. Battle stages all reuse `DEMO_BATTLE_001` and say so (`distinctFloorRoster: false`). The proposed chain is orientation → tower rematch → arena exhibition → arena encore. Nothing in the chain gates the hideout, the mall, or the gachapon.

```bash
node tools/content/world/validate.js
node tools/content/world/preview.js
node --test tests/prod/g
```

`tools/content/world/schema.json` is the JSON Schema. `tools/content/world/validate.js` checks that schema, unique ids, canon references, the building alias, and the absence of economy numbers. `tools/content/world/preview.html` is a read-only rendering of the same data. It has no script and it is not linked from the game.

## Open questions for the Owner

The same list is `catalog.json` `openQuestions`, ids `OQ_G_01` through `OQ_G_13`. Questions 1–8 remain OPEN. Questions 9–13 are OWNER_DECIDED on 2026-11-20 from t276u, not LOCKED. The wording is in `docs/production/world/DECISION_LOG.md`.

1. Should the map stay ungated, with this encounter order only as a suggestion, or should clearing a tower stage ever hide a pin?
2. How many tower floors should exist, and will later floors get new enemy records? Only `DEMO_BATTLE_001` exists today.
3. Should live battles keep using echo copies of the four Justins, or load the catalog enemy team? This pack does not retarget the builder.
4. Mall prices, furniture grant versus buy, gacha amounts for the currency named G, and companion currency are open. Every amount here is empty. Which of those should be decided before a counter can charge?
5. What is the Cabin base capacity, if the Cabin has one? `HOME-11` is untouched.
6. Should a second player exist before the arena is anything besides practice? `MAP-05` multiplayer is still open.
7. Should Sports Complex copy keep saying coming soon, or stay silent until the four games exist?
8. Which id is canonical when hotspot `siteId` and the locked destination id differ? This pack stores both.
9. OWNER_DECIDED. Side-event rewards may be G, materials, and decorations, capped by difficulty. Avoid large premium-currency grants. Amounts stay PENDING. No number was invented.
10. OWNER_DECIDED. The tutorial script stays. Only the basic play path is first-round. Hideout, stash, deck, gacha, and mall prompts are tagged later.
11. OWNER_DECIDED. Unique names are for characters with dialogue or a story role. Generic characters may use temporary names. No companion was named.
12. OWNER_DECIDED. `ENM_DEMO_004` stays so references do not break. It uses an existing placeholder image and is tagged Missing Artwork.
13. OWNER_DECIDED. Upgrade may be mentioned in story terms. No recipes, materials, or numbers until crafting is finalized.
