# v0.5 requirement reconciliation

Source sheet index: `docs/design/v05/REQUIREMENTS_INDEX.md` on `core/v05-design-source` @ `51df543`. Status strings below are the sheet's effective status. This branch does not promote PENDING to LOCKED.

Owner t253u (20 Nov 2026, 16:10 ICT) locked three items the sheet or the baseline audit had still open:

| Decision | Locked behavior | Test |
| --- | --- | --- |
| D-ID | Justins are new records AVT_AEG_002, AVT_PHA_002, AVT_CEL_002, AVT_SAN_002 (designRef AV_EX01..04). AVT_*_001 identities stay. | tests/acceptance/v05/qa-04-faction.test.js |
| GA-12 | Per-banner counters. Epic and top are separate. Epic hit resets Epic only. EX/FAC hit resets both. Companion Epic is separate. Thresholds 100 / 200 / companion Epic 100. | tests/acceptance/v05/qa-08-gacha.test.js and pending-owner.test.js |
| CORE-005 migration | pow maps to atk 1:1 and legacy.pow is preserved. | tests/acceptance/v05/core-005-migration.test.js |

Editable PROPOSED values live on the sample records (`stats.valueStatus` / skill status) and must stay marked PROPOSED. Pending flags live in `src/config/index.js` `defaultRuleConfig()`. The current matrix is `docs/qa/v05/ACCEPTANCE_STATUS.md`. Todo is not pass.

## Rows

| ID | Sheet effective | This build | Rule | Test | Owner decision still required |
| --- | --- | --- | --- | --- | --- |
| CORE-001 | LOCKED | LOCKED | Comedy-fantasy gacha card battle; no compulsory main storyline or Main Quest | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-002 | LOCKED | LOCKED | Fights as an actual character/sprite on field; Action cards command units | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-003 | LOCKED | LOCKED | 4 Avatars per player team | tests/acceptance/v05/baseline-constants.test.js and qa-04-faction.test.js |  |
| CORE-004 | LOCKED | LOCKED | Win all enemies defeated; lose all 4 own avatars defeated | tests/acceptance/v05/qa-07-win-lose.test.js |  |
| CORE-005 | LOCKED | LOCKED | ATK / DEF / SPD | tests/acceptance/v05/core-005-migration.test.js | Migration ratio is locked 1:1 by Owner t253u. legacy.pow stays. |
| CORE-006 | LOCKED | LOCKED | Higher team SPD takes first turn, then alternating sides | tests/acceptance/v05/qa-05-ap-turn.test.js |  |
| CORE-007 | LOCKED | LOCKED | 5 base AP, reset at beginning of each own turn | tests/acceptance/v05/baseline-constants.test.js and qa-05-ap-turn.test.js |  |
| CORE-008 | LOCKED | LOCKED | Each Action Card cost is card data, allowed 0 to 5 AP | tests/acceptance/v05/qa-05-ap-turn.test.js |  |
| CORE-009 | LOCKED | LOCKED | 30 Action Cards in deck | tests/acceptance/v05/qa-01-deck-hand.test.js |  |
| CORE-010 | LOCKED | LOCKED | 5 cards | tests/acceptance/v05/baseline-constants.test.js and qa-01-deck-hand.test.js |  |
| CORE-011 | LOCKED | LOCKED | Retain unplayed cards; draw until 5 at start of own turn | tests/acceptance/v05/qa-01-deck-hand.test.js |  |
| CORE-012 | LOCKED | LOCKED | Extra draw during turn may temporarily exceed five | tests/acceptance/v05/qa-01-deck-hand.test.js |  |
| CORE-013 | LOCKED | LOCKED | Discard excess freely until hand ≤ 5 at end of round | tests/acceptance/v05/qa-02-discard.test.js |  |
| CORE-014 | LOCKED | LOCKED | Optional discard during own turn costs 1 AP per card | tests/acceptance/v05/qa-02-discard.test.js |  |
| CORE-015 | LOCKED | LOCKED | Player explicitly presses End Turn | tests/acceptance/v05/qa-05-ap-turn.test.js |  |
| CORE-016 | LOCKED | LOCKED | Normal played Action moves to Discard Pile | tests/acceptance/v05/qa-03-recycle-void.test.js |  |
| CORE-017 | LOCKED | LOCKED | When Draw empties, shuffle only Discard into Draw | tests/acceptance/v05/qa-03-recycle-void.test.js |  |
| CORE-018 | LOCKED | LOCKED | Active pile for cards exiled by effects; viewable any time | tests/acceptance/v05/qa-03-recycle-void.test.js |  |
| CORE-019 | LOCKED | LOCKED | Some named card effects retrieve specified cards from Discard/Void | tests/acceptance/v05/qa-03-recycle-void.test.js |  |
| CORE-020 | LOCKED | LOCKED | ATK / DEF / Skill | tests/acceptance/v05/baseline-constants.test.js |  |
| CORE-021 | LOCKED | LOCKED | Avatar Active fired using eligible Action Card (usually 1 Avatar per Action) | tests/acceptance/v05/qa-06-skill-regen.test.js |  |
| CORE-022 | LOCKED | LOCKED | Works with any eligible Avatar regardless of faction | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-023 | LOCKED | LOCKED | Matching Faction Avatar required to activate, except card-specific override | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-024 | LOCKED | LOCKED | N / R / Epic / EX | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-025 | LOCKED | LOCKED | N / R / Epic / EX / FAC; EX and FAC same top power tier | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-026 | LOCKED | LOCKED | Only base stats; a few N have small Active | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-027 | LOCKED | LOCKED | Active OR Passive | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-028 | LOCKED | LOCKED | Active + Passive | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-029 | LOCKED | LOCKED | Active + Passive + Ultimate | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-030 | LOCKED | LOCKED | Maximum level 5; separate from Stars/Rank | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-031 | LOCKED | LOCKED | Hero Synthesis for stars; Promotion Stones for rank promotion | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-032 | LOCKED | LOCKED | Gifts and Relationship apply to Companions ONLY, not Avatars | tests/acceptance/v05/qa-04-faction.test.js |  |
| CORE-033 | SUPERSEDED | SUPERSEDED | Common/Rare/Legendary/Mythic v0.4 values | tests/acceptance/v05/baseline-constants.test.js and qa-04-faction.test.js | Do not reintroduce this rule. |
| CORE-034 | SUPERSEDED | SUPERSEDED | 10+10 Tactic, 7 MP, Valhalla, no Void | tests/acceptance/v05/baseline-constants.test.js | Do not reintroduce this rule. |
| CORE-035 | SUPERSEDED | SUPERSEDED | Autonomous AI fight is not current primary battle system | tests/acceptance/v05/baseline-constants.test.js | Do not reintroduce this rule. |
| CORE-036 | PENDING | PENDING | Old Tactical 5×2 / front-back | tests/acceptance/v05/pending-owner.test.js | Adopt the old 5×2 grid, reject it, or leave it unused? |
| CORE-037 | PENDING | PENDING | 100% initial Sync from old concept | tests/acceptance/v05/pending-owner.test.js | Is VR Sync an active stat, lore only, or dropped? |
| CORE-038 | PENDING | PENDING | Sum/Avg/Max and tie handling | tests/acceptance/v05/pending-owner.test.js | Team SPD aggregate (sum, average, or max) and which side wins a tie. |
| CORE-039 | PENDING | PENDING | Exact formulas, heal cap and KO behavior | tests/acceptance/v05/pending-owner.test.js | Damage formula, HP model, heal cap, and whether Regen ticks on a defeated unit. |
| CORE-040 | PENDING | PENDING | Max duplicates in 30-card deck | tests/acceptance/v05/pending-owner.test.js | Maximum copies of one Action card in a 30-card deck. |
| AV_EX01 | Name/Faction LOCKED; Stats/Skills PROPOSED | Name/Faction LOCKED; Stats/Skills PROPOSED | JUSTIN CASE — Aegis Dominion Tank Epic ATK 3/DEF 8/SPD 1 | tests/acceptance/v05/qa-04-faction.test.js | Keep the value editable and labelled PROPOSED. Location: sample record field status, not a production constant. |
| AV_EX02 | Name/Faction LOCKED; Stats/Skills PROPOSED | Name/Faction LOCKED; Stats/Skills PROPOSED | JUSTIN TIME — Phantom Blades DPS Epic ATK 8/DEF 2/SPD 9 | tests/acceptance/v05/qa-04-faction.test.js | Keep the value editable and labelled PROPOSED. Location: sample record field status, not a production constant. |
| AV_EX03 | Name/Faction LOCKED; Stats/Skills PROPOSED | Name/Faction LOCKED; Stats/Skills PROPOSED | JUSTIN THEORY — Celestial Nexus Magic Epic ATK 7/DEF 3/SPD 4 | tests/acceptance/v05/qa-04-faction.test.js | Keep the value editable and labelled PROPOSED. Location: sample record field status, not a production constant. |
| AV_EX04 | Female + Name + ACTIVE EFFECT LOCKED; other stats/skills PROPOSED | Female + Name + ACTIVE EFFECT LOCKED; other stats/skills PROPOSED | JUSTINA MOMENT — Sanctuary Order Support Epic ATK 2/DEF 5/SPD 6 | tests/acceptance/v05/qa-04-faction.test.js | Keep the value editable and labelled PROPOSED. Location: sample record field status, not a production constant. |
| GA-01 | LOCKED | LOCKED | Avatar / Action / Companion are separate | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-02 | LOCKED | LOCKED | Avatar & Action use shared G currency | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-03 | LOCKED | LOCKED | N / R / Epic / EX | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-04 | LOCKED | LOCKED | N / R / Epic / EX / FAC | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-05 | LOCKED | LOCKED | Guarantee by 100 pulls | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-06 | LOCKED | LOCKED | Guarantee by 100 pulls | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-07 | LOCKED | LOCKED | Guarantee by 200 pulls | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-08 | LOCKED | LOCKED | Guarantee by 200 pulls | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-09 | LOCKED | LOCKED | Guarantee by 100 pulls | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-10 | LOCKED | LOCKED | No top-tier pity | tests/acceptance/v05/qa-08-gacha.test.js |  |
| GA-11 | PENDING | PENDING | Not finalized | tests/acceptance/v05/qa-08-gacha.test.js and tests/acceptance/v05/qa-12-playable-web.test.js | Drop rates and the G price stay unset. On `core/v05-playable` @ `6be1689` the web TEST banners and the string pull seed are rejected by `src/gacha`. |
| GA-12 | PENDING | LOCKED by Owner t253u (sheet cell was PENDING) | Reset on target? banner-specific/shared? overlapping guarantees? | tests/acceptance/v05/qa-08-gacha.test.js | None. The sheet cell can be updated by the Owner; the behavior is locked. |
| GA-13 | LOCKED | LOCKED | Hero Synthesis uses duplicates; protection for locked/in-deck | tests/acceptance/v05/save-inventory.test.js |  |
| HOME-01 | LOCKED | LOCKED | Cabin | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-02 | LOCKED | LOCKED | Bungalow | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-03 | LOCKED | LOCKED | Cottage | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-04 | LOCKED | LOCKED | Loft | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-05 | LOCKED | LOCKED | Villa | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-06 | LOCKED | LOCKED | Penthouse | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-07 | LOCKED | LOCKED | Always display current highest acquired house tier | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-08 | LOCKED | LOCKED | Capacity from actually installed storage furniture, pooled globally | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-09 | LOCKED | LOCKED | Shopping Mall sells/unlocks furniture with home requirements | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-10 | LOCKED | LOCKED | Auto-place into beautiful predefined blocks | tests/acceptance/v05/qa-09-storage.test.js |  |
| HOME-11 | PENDING | PENDING | Starting base storage capacity | tests/acceptance/v05/qa-09-storage.test.js | Cabin storage before any furniture is installed. |
| MAP-01 | LOCKED | LOCKED | Separate from home; Isometric Pixel Art 2.5D | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-02 | LOCKED | LOCKED | Player hub / Hideout | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-03 | LOCKED | LOCKED | PvE battle and Mystery Tower lore | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-04 | LOCKED | LOCKED | Football, Basketball, Racing, MotoGP | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-05 | LOCKED | LOCKED | Main battle/PvP venue | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-06 | LOCKED | LOCKED | Furniture and cosmetics | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-07 | LOCKED | LOCKED | Avatar / Action / Companion pools | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-08 | LOCKED | LOCKED | Comedy Fantasy throughout | tests/acceptance/v05/qa-10-ui.test.js |  |
| MAP-09 | LOCKED | LOCKED | Mystery Tower, Real People + Echo hybrid Avatar | tests/acceptance/v05/qa-10-ui.test.js |  |
| Action_ID | REQUIRED | REQUIRED | Unique ID (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Name | REQUIRED | REQUIRED | Card display name (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Type | REQUIRED | REQUIRED | ATK / DEF / Skill (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Rarity | REQUIRED | REQUIRED | N / R / Epic / EX / FAC (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Faction_Requirement | OPTIONAL | OPTIONAL | One of four factions if faction-locked (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Cost_AP | REQUIRED | REQUIRED | 0..5 AP (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Target_Rule | PENDING | PENDING | Self / Ally / All_Allies / Enemy / All_Enemies / Card / Pile (P0) | tests/acceptance/v05/action-schema.test.js and pending-owner.test.js | Which Target_Rule vocabulary values are legal. |
| Effect_Spec | REQUIRED | REQUIRED | typed effect list, conditional triggers, values (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Duration_Turns | OPTIONAL | OPTIONAL | Timed statuses e.g. Regen 2 (P0) | tests/acceptance/v05/action-schema.test.js |  |
| On_Resolve_Zone | REQUIRED | REQUIRED | Discard or Void (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Zone_Recovery | OPTIONAL | OPTIONAL | Select retrieval from Discard/Void and destination (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Can_Play | REQUIRED | REQUIRED | Faction match / target / AP / effect conditions (P0) | tests/acceptance/v05/action-schema.test.js |  |
| Asset_Ref | OPTIONAL | OPTIONAL | Verified artwork path in repository (P1) | tests/acceptance/v05/action-schema.test.js |  |
| Version_And_Status | REQUIRED | REQUIRED | Data version and LOCKED/PROPOSED/PENDING (P0) | tests/acceptance/v05/action-schema.test.js |  |
| OPEN-01 | PENDING | PENDING | Team SPD aggregation/ties and 5×2/front-back geometry | tests/acceptance/v05/pending-owner.test.js | Same as CORE-036 and CORE-038. |
| OPEN-02 | PENDING | PENDING | HP formula, Regen tick timing, cap, stacking, KO healing | tests/acceptance/v05/pending-owner.test.js | Regen tick phase, heal cap, and KO healing. |
| OPEN-03 | PENDING | PENDING | Same-card duplicate max, forced vs optional discard timing phrasing | tests/acceptance/v05/pending-owner.test.js | Duplicate cap, and the exact wording of forced versus optional discard. |
| OPEN-04 | PENDING | PENDING | Rarity Star cap, EXP curve, synthesis materials, promotion recipes | tests/acceptance/v05/pending-owner.test.js | Star cap per rarity, EXP curve, synthesis cost, promotion cost. Do not assume N2/R3/Epic4/EX5. |
| OPEN-05 | PENDING | PENDING | Exact drop probabilities, G costs, pity-reset semantics | tests/acceptance/v05/pending-owner.test.js and tests/acceptance/v05/qa-12-playable-web.test.js | Rates and G price stay open. Pity reset is locked by Owner t253u. The playable web booth does not meet the test-banner or integer-seed contract. |
| OPEN-06 | PENDING | PENDING | Cabin base capacity, furniture grant vs unlock-to-buy, prices | tests/acceptance/v05/pending-owner.test.js | Whether reference furniture is granted or only unlocked to buy, and any price. |
| OPEN-07 | PENDING | PENDING | Sync 100%, old 5×2, Tower floors, Sports games | tests/acceptance/v05/pending-owner.test.js | Whether Sync 100%, the old 5×2 grid, Tower floors, or Sports games are in this core. |
| OPEN-08 | PROPOSED | PROPOSED | Stats and passives other than Justina's active | tests/acceptance/v05/pending-owner.test.js | Keep the value editable and labelled PROPOSED. Location: sample record field status, not a production constant. |
| OPEN-09 | PENDING | PENDING | PR #9, #11, 14 other drafts status may have changed | tests/acceptance/v05/pending-owner.test.js | Sheet cell is still PENDING. The 20 Nov baseline audit already re-checked PR state. Do not promote the sheet cell from this branch. |
| OPEN-10 | PENDING | PENDING | Card game repository URL not verified in this Master | tests/acceptance/v05/pending-owner.test.js | Sheet cell is still PENDING. The baseline audit identified this repository. Do not promote the sheet cell from this branch. |
| QA-01 | NOT RUN | NOT RUN | 30 cards, 5 initial, leftover retain, draw to 5, draw>5 via effect | tests/acceptance/v05/qa-01-deck-hand.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-02 | NOT RUN | NOT RUN | Mandatory over-cap free; voluntary own turn 1 AP | tests/acceptance/v05/qa-02-discard.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-03 | NOT RUN | NOT RUN | Draw empty shuffles only Discard, Void remains excluded | tests/acceptance/v05/qa-03-recycle-void.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-04 | NOT RUN | NOT RUN | Mixed team and deck, generic action, FAC faction gate | tests/acceptance/v05/qa-04-faction.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-05 | NOT RUN | NOT RUN | AP resets 5; cost 0-5; manual End even at AP=0 | tests/acceptance/v05/qa-05-ap-turn.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-06 | NOT RUN | NOT RUN | Active requires Action; Justina Regen +3 over two turns | tests/acceptance/v05/qa-06-skill-regen.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-07 | NOT RUN | NOT RUN | All enemy dead win; all own 4 dead lose | tests/acceptance/v05/qa-07-win-lose.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-08 | NOT RUN | NOT RUN | Epic pity 100, top 200, Companion Epic 100 | tests/acceptance/v05/qa-08-gacha.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-09 | NOT RUN | NOT RUN | No capacity boost solely from house tier; installed furniture pools | tests/acceptance/v05/qa-09-storage.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| QA-10 | NOT RUN | NOT RUN | Map→Home/Gacha/Battle→Rewards, touch controls, piles viewer | tests/acceptance/v05/qa-10-ui.test.js, tests/acceptance/v05/qa-12-playable-web.test.js, tests/e2e/smoke-guard.test.js | On `core/v05-playable` @ `6be1689` the engine win/lose smoke passed. Gacha banners, the string pull seed, and save reload failed. See INTEGRATION_LOG.md. |
| QA-11 | NOT RUN | NOT RUN | No unapproved merge/deploy, all commits pushed, conflict map | tests/acceptance/v05/qa-11-git.test.js | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| 1. Audit | NOT STARTED | NOT STARTED | Inspect actual Card Game repo/PR #9/#11; merge conflict dry run | docs/qa/v05/REQUIREMENT_RECONCILIATION.md (process row, no gameplay lock) | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| 2. Core | NOT STARTED | NOT STARTED | Implement deterministic Battle engine and Action/Avatar schemas | docs/qa/v05/REQUIREMENT_RECONCILIATION.md (process row, no gameplay lock) | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| 3. Loop | NOT STARTED | NOT STARTED | Connect Hideout/Deck/Gacha/Tower/UI | docs/qa/v05/REQUIREMENT_RECONCILIATION.md (process row, no gameplay lock) | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| 4. QA | NOT STARTED | NOT STARTED | Run unit/integration/smoke/regression and document failing cases | docs/qa/v05/REQUIREMENT_RECONCILIATION.md (process row, no gameplay lock) | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| 5. Handoff | NOT STARTED | NOT STARTED | Commit/push authorized branches and provide Draft PR links | docs/qa/v05/REQUIREMENT_RECONCILIATION.md (process row, no gameplay lock) | Acceptance row. Result is in ACCEPTANCE_STATUS.md. |
| Source | READY | READY | Read linked master prompt MIRA_CARD_GAME_CORE_MASTER_PROMPT_20261120.md | docs/qa/v05/REQUIREMENT_RECONCILIATION.md (process row, no gameplay lock) |  |
| OWNER-PLAT-01 | LOCKED | LOCKED | Web-playable game | tests/acceptance/v05/qa-10-ui.test.js |  |
| OWNER-PLAT-02 | LOCKED | LOCKED | Optimized for mobile LANDSCAPE | tests/acceptance/v05/qa-10-ui.test.js |  |
| OWNER-PLAT-03 | LOCKED | LOCKED | All visuals swappable/editable via manifest asset refs; no baked-in art in code | tests/acceptance/v05/qa-10-ui.test.js |  |
| OWNER-PLAT-04 | LOCKED | LOCKED | Fixed-aspect design canvas; uniform scale + letterbox/pillarbox; never stretch; buildings never off-edge; UI anchored to same canvas | tests/acceptance/v05/owner-plat-04-map.test.js and tests/acceptance/v05/qa-12-playable-web.test.js | On `core/v05-playable` @ `6be1689` the 1672×941 stage scales uniformly. `MAP_BLD_MALL` is 50px above the canvas. |

## Platform rows (not in the xlsx)

| ID | Status | Test | Note |
| --- | --- | --- | --- |
| OWNER-PLAT-01 | LOCKED | tests/acceptance/v05/qa-10-ui.test.js | Web entry. Todo until web/ exists. |
| OWNER-PLAT-02 | LOCKED | tests/acceptance/v05/qa-10-ui.test.js | Landscape, portrait rotate overlay. |
| OWNER-PLAT-03 | LOCKED | tests/acceptance/v05/qa-10-ui.test.js | Manifest asset refs. No data:image. |
| OWNER-PLAT-04 | LOCKED | tests/acceptance/v05/owner-plat-04-map.test.js and tests/acceptance/v05/qa-12-playable-web.test.js | 1672×941 stage. On playable, the mall sprite box starts at y=-50. |
| D-ID | LOCKED Owner t253u | tests/acceptance/v05/qa-04-faction.test.js | New Justin ids. *_001 unchanged test passes on this branch today. |
