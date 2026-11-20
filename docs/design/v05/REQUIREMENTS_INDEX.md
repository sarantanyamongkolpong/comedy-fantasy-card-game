# v0.5 Requirements Index

Generated from `source/Card_Battle_Design_Master_v0.5_20261120.xlsx` (sha256 `f4a23a97c11e8a1b6dcbac2e356dd18997fd4f67cdb3386c1d0555ff9134b493`) — v05_* tabs only (v0.4 tabs are archive). Status strings are copied **exactly**; nothing was promoted (PENDING never becomes LOCKED).

Legend: `Status (cell)` = the value in the sheet's status column. `Status (effective)` differs only when the sheet row is column-shifted (flagged ⚠); the raw cells are preserved verbatim in `tabs/*.json`.


## v05_Core_Rules

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| CORE-001 | Project | Comedy-fantasy gacha card battle; no compulsory main storyline or Main Quest | LOCKED | LOCKED |  |
| CORE-002 | Avatar | Fights as an actual character/sprite on field; Action cards command units | LOCKED | LOCKED |  |
| CORE-003 | Team | 4 Avatars per player team | LOCKED | LOCKED |  |
| CORE-004 | Win/Lose | Win all enemies defeated; lose all 4 own avatars defeated | LOCKED | LOCKED |  |
| CORE-005 | Avatar stats | ATK / DEF / SPD | LOCKED | LOCKED |  |
| CORE-006 | Turn order | Higher team SPD takes first turn, then alternating sides | LOCKED | LOCKED |  |
| CORE-007 | AP | 5 base AP, reset at beginning of each own turn | LOCKED | LOCKED |  |
| CORE-008 | Card AP Cost | Each Action Card cost is card data, allowed 0 to 5 AP | LOCKED | LOCKED |  |
| CORE-009 | Action deck | 30 Action Cards in deck | LOCKED | LOCKED |  |
| CORE-010 | Opening hand | 5 cards | LOCKED | LOCKED |  |
| CORE-011 | Turn start draw | Retain unplayed cards; draw until 5 at start of own turn | LOCKED | LOCKED |  |
| CORE-012 | Effect-based draw | Extra draw during turn may temporarily exceed five | LOCKED | LOCKED |  |
| CORE-013 | Turn-end cap | Discard excess freely until hand ≤ 5 at end of round | LOCKED | LOCKED |  |
| CORE-014 | Manual discard | Optional discard during own turn costs 1 AP per card | LOCKED | LOCKED |  |
| CORE-015 | Manual end | Player explicitly presses End Turn | LOCKED | LOCKED |  |
| CORE-016 | Used card | Normal played Action moves to Discard Pile | LOCKED | LOCKED |  |
| CORE-017 | Recycle | When Draw empties, shuffle only Discard into Draw | LOCKED | LOCKED |  |
| CORE-018 | The Void | Active pile for cards exiled by effects; viewable any time | LOCKED | LOCKED |  |
| CORE-019 | Pile retrieval | Some named card effects retrieve specified cards from Discard/Void | LOCKED | LOCKED |  |
| CORE-020 | Action categories | ATK / DEF / Skill | LOCKED | LOCKED |  |
| CORE-021 | Skill activation | Avatar Active fired using eligible Action Card (usually 1 Avatar per Action) | LOCKED | LOCKED |  |
| CORE-022 | Generic Action | Works with any eligible Avatar regardless of faction | LOCKED | LOCKED |  |
| CORE-023 | FAC Action | Matching Faction Avatar required to activate, except card-specific override | LOCKED | LOCKED |  |
| CORE-024 | Avatar rarity | N / R / Epic / EX | LOCKED | LOCKED |  |
| CORE-025 | Action rarity | N / R / Epic / EX / FAC; EX and FAC same top power tier | LOCKED | LOCKED |  |
| CORE-026 | N skill slots | Only base stats; a few N have small Active | LOCKED | LOCKED |  |
| CORE-027 | R skill slots | Active OR Passive | LOCKED | LOCKED |  |
| CORE-028 | Epic skill slots | Active + Passive | LOCKED | LOCKED |  |
| CORE-029 | EX skill slots | Active + Passive + Ultimate | LOCKED | LOCKED |  |
| CORE-030 | Avatar EXP level | Maximum level 5; separate from Stars/Rank | LOCKED | LOCKED |  |
| CORE-031 | Progression | Hero Synthesis for stars; Promotion Stones for rank promotion | LOCKED | LOCKED |  |
| CORE-032 | Companion relationship | Gifts and Relationship apply to Companions ONLY, not Avatars | LOCKED | LOCKED |  |
| CORE-033 | Rarity values | Common/Rare/Legendary/Mythic v0.4 values | SUPERSEDED | SUPERSEDED |  |
| CORE-034 | Old battle | 10+10 Tactic, 7 MP, Valhalla, no Void | SUPERSEDED | SUPERSEDED |  |
| CORE-035 | Old Auto Battler | Autonomous AI fight is not current primary battle system | SUPERSEDED | SUPERSEDED |  |
| CORE-036 | Battle grid | Old Tactical 5×2 / front-back | PENDING | PENDING |  |
| CORE-037 | VR Sync | 100% initial Sync from old concept | PENDING | PENDING |  |
| CORE-038 | Team SPD formula | Sum/Avg/Max and tie handling | PENDING | PENDING |  |
| CORE-039 | Damage and HP | Exact formulas, heal cap and KO behavior | PENDING | PENDING |  |
| CORE-040 | Card duplicates | Max duplicates in 30-card deck | PENDING | PENDING |  |

## v05_Avatar_Examples

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| AV_EX01 | JUSTIN CASE | JUSTIN CASE — Aegis Dominion Tank Epic ATK 3/DEF 8/SPD 1 | Name/Faction LOCKED; Stats/Skills PROPOSED | Name/Faction LOCKED; Stats/Skills PROPOSED |  |
| AV_EX02 | JUSTIN TIME | JUSTIN TIME — Phantom Blades DPS Epic ATK 8/DEF 2/SPD 9 | Name/Faction LOCKED; Stats/Skills PROPOSED | Name/Faction LOCKED; Stats/Skills PROPOSED |  |
| AV_EX03 | JUSTIN THEORY | JUSTIN THEORY — Celestial Nexus Magic Epic ATK 7/DEF 3/SPD 4 | Name/Faction LOCKED; Stats/Skills PROPOSED | Name/Faction LOCKED; Stats/Skills PROPOSED |  |
| AV_EX04 | JUSTINA MOMENT | JUSTINA MOMENT — Sanctuary Order Support Epic ATK 2/DEF 5/SPD 6 | Female + Name + ACTIVE EFFECT LOCKED; other stats/skills PROPOSED | Female + Name + ACTIVE EFFECT LOCKED; other stats/skills PROPOSED |  |

## v05_Gacha

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| GA-01 | Pools | Avatar / Action / Companion are separate | Owner 19-20 Nov | LOCKED | ⚠ sheet row column-shifted: status found in "Pity Pulls" |
| GA-02 | Currency | Avatar & Action use shared G currency | Owner 19-20 Nov | LOCKED | ⚠ sheet row column-shifted: status found in "Pity Pulls" |
| GA-03 | Avatar rarity | N / R / Epic / EX | Owner 19-20 Nov | LOCKED | ⚠ sheet row column-shifted: status found in "Pity Pulls" |
| GA-04 | Action rarity | N / R / Epic / EX / FAC | Owner 19-20 Nov | LOCKED | ⚠ sheet row column-shifted: status found in "Pity Pulls" |
| GA-05 | Avatar Epic pity | Guarantee by 100 pulls | LOCKED | LOCKED |  |
| GA-06 | Action Epic pity | Guarantee by 100 pulls | LOCKED | LOCKED |  |
| GA-07 | Avatar EX pity | Guarantee by 200 pulls | LOCKED | LOCKED |  |
| GA-08 | Action top EX/FAC pity | Guarantee by 200 pulls | LOCKED | LOCKED |  |
| GA-09 | Companion Epic pity | Guarantee by 100 pulls | LOCKED | LOCKED |  |
| GA-10 | Companion top pity | No top-tier pity | LOCKED | LOCKED |  |
| GA-11 | Drop rates, draw price | Not finalized | PENDING | PENDING |  |
| GA-12 | Pity reset/rule | Reset on target? banner-specific/shared? overlapping guarantees? | PENDING | PENDING |  |
| GA-13 | Duplicate usage | Hero Synthesis uses duplicates; protection for locked/in-deck | LOCKED | LOCKED |  |

## v05_Hideout_Map

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| HOME-01 | House tier 1 | Cabin | LOCKED | LOCKED |  |
| HOME-02 | House tier 2 | Bungalow | LOCKED | LOCKED |  |
| HOME-03 | House tier 3 | Cottage | LOCKED | LOCKED |  |
| HOME-04 | House tier 4 | Loft | LOCKED | LOCKED |  |
| HOME-05 | House tier 5 | Villa | LOCKED | LOCKED |  |
| HOME-06 | House tier 6 | Penthouse | LOCKED | LOCKED |  |
| HOME-07 | Visual home | Always display current highest acquired house tier | LOCKED | LOCKED |  |
| HOME-08 | Storage | Capacity from actually installed storage furniture, pooled globally | LOCKED | LOCKED |  |
| HOME-09 | Furniture purchase | Shopping Mall sells/unlocks furniture with home requirements | LOCKED | LOCKED |  |
| HOME-10 | Furniture layout | Auto-place into beautiful predefined blocks | LOCKED | LOCKED |  |
| HOME-11 | Cabin storage | Starting base storage capacity | PENDING | PENDING |  |
| MAP-01 | Main Map | Separate from home; Isometric Pixel Art 2.5D | LOCKED | LOCKED |  |
| MAP-02 | Home | Player hub / Hideout | LOCKED | LOCKED |  |
| MAP-03 | Mysterious Tower | PvE battle and Mystery Tower lore | LOCKED | LOCKED |  |
| MAP-04 | Sports Complex | Football, Basketball, Racing, MotoGP | LOCKED | LOCKED |  |
| MAP-05 | Tournament Arena | Main battle/PvP venue | LOCKED | LOCKED |  |
| MAP-06 | Shopping Mall | Furniture and cosmetics | LOCKED | LOCKED |  |
| MAP-07 | Gachapon | Avatar / Action / Companion pools | LOCKED | LOCKED |  |
| MAP-08 | World Tone | Comedy Fantasy throughout | LOCKED | LOCKED |  |
| MAP-09 | World Lore | Mystery Tower, Real People + Echo hybrid Avatar | LOCKED | LOCKED |  |

## v05_Action_Schema

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| Action_ID | string | Unique ID (P0) | REQUIRED | REQUIRED |  |
| Name | string | Card display name (P0) | REQUIRED | REQUIRED |  |
| Type | enum | ATK / DEF / Skill (P0) | REQUIRED | REQUIRED |  |
| Rarity | enum | N / R / Epic / EX / FAC (P0) | REQUIRED | REQUIRED |  |
| Faction_Requirement | enum\|null | One of four factions if faction-locked (P0) | OPTIONAL | OPTIONAL |  |
| Cost_AP | integer | 0..5 AP (P0) | REQUIRED | REQUIRED |  |
| Target_Rule | enum | Self / Ally / All_Allies / Enemy / All_Enemies / Card / Pile (P0) | PENDING | PENDING |  |
| Effect_Spec | object | typed effect list, conditional triggers, values (P0) | REQUIRED | REQUIRED |  |
| Duration_Turns | integer\|null | Timed statuses e.g. Regen 2 (P0) | OPTIONAL | OPTIONAL |  |
| On_Resolve_Zone | enum | Discard or Void (P0) | REQUIRED | REQUIRED |  |
| Zone_Recovery | object\|null | Select retrieval from Discard/Void and destination (P0) | OPTIONAL | OPTIONAL |  |
| Can_Play | predicate | Faction match / target / AP / effect conditions (P0) | REQUIRED | REQUIRED |  |
| Asset_Ref | string\|null | Verified artwork path in repository (P1) | OPTIONAL | OPTIONAL |  |
| Version_And_Status | string | Data version and LOCKED/PROPOSED/PENDING (P0) | REQUIRED | REQUIRED |  |

## v05_Open_Decisions

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| OPEN-01 | Turn & position | Team SPD aggregation/ties and 5×2/front-back geometry | PENDING | PENDING |  |
| OPEN-02 | Damage and Recovery | HP formula, Regen tick timing, cap, stacking, KO healing | PENDING | PENDING |  |
| OPEN-03 | Action Deck limits | Same-card duplicate max, forced vs optional discard timing phrasing | PENDING | PENDING |  |
| OPEN-04 | Progression | Rarity Star cap, EXP curve, synthesis materials, promotion recipes | PENDING | PENDING |  |
| OPEN-05 | Gacha economy | Exact drop probabilities, G costs, pity-reset semantics | PENDING | PENDING |  |
| OPEN-06 | Storage economy | Cabin base capacity, furniture grant vs unlock-to-buy, prices | PENDING | PENDING |  |
| OPEN-07 | World progression | Sync 100%, old 5×2, Tower floors, Sports games | PENDING | PENDING |  |
| OPEN-08 | Four sample balance | Stats and passives other than Justina's active | PROPOSED | PROPOSED |  |
| OPEN-09 | Existing PRs | PR #9, #11, 14 other drafts status may have changed | PENDING | PENDING |  |
| OPEN-10 | Repo identity | Card game repository URL not verified in this Master | PENDING | PENDING |  |

## v05_QA

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| QA-01 | Deck/Hand | 30 cards, 5 initial, leftover retain, draw to 5, draw>5 via effect | NOT RUN | NOT RUN |  |
| QA-02 | Discard | Mandatory over-cap free; voluntary own turn 1 AP | NOT RUN | NOT RUN |  |
| QA-03 | Recycle/Void | Draw empty shuffles only Discard, Void remains excluded | NOT RUN | NOT RUN |  |
| QA-04 | Faction | Mixed team and deck, generic action, FAC faction gate | NOT RUN | NOT RUN |  |
| QA-05 | AP/Turn | AP resets 5; cost 0-5; manual End even at AP=0 | NOT RUN | NOT RUN |  |
| QA-06 | Skill/Regen | Active requires Action; Justina Regen +3 over two turns | NOT RUN | NOT RUN |  |
| QA-07 | Win/Lose | All enemy dead win; all own 4 dead lose | NOT RUN | NOT RUN |  |
| QA-08 | Gacha | Epic pity 100, top 200, Companion Epic 100 | NOT RUN | NOT RUN |  |
| QA-09 | Storage | No capacity boost solely from house tier; installed furniture pools | NOT RUN | NOT RUN |  |
| QA-10 | UI/Mobile | Map→Home/Gacha/Battle→Rewards, touch controls, piles viewer | NOT RUN | NOT RUN |  |
| QA-11 | Git/PR | No unapproved merge/deploy, all commits pushed, conflict map | NOT RUN | NOT RUN |  |

## v05_Mira_Handoff

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| 1. Audit | Inspect actual Card Game repo/PR #9/#11; merge conflict dry run | Inspect actual Card Game repo/PR #9/#11; merge conflict dry run | NOT STARTED | NOT STARTED |  |
| 2. Core | Implement deterministic Battle engine and Action/Avatar schemas | Implement deterministic Battle engine and Action/Avatar schemas | NOT STARTED | NOT STARTED |  |
| 3. Loop | Connect Hideout/Deck/Gacha/Tower/UI | Connect Hideout/Deck/Gacha/Tower/UI | NOT STARTED | NOT STARTED |  |
| 4. QA | Run unit/integration/smoke/regression and document failing cases | Run unit/integration/smoke/regression and document failing cases | NOT STARTED | NOT STARTED |  |
| 5. Handoff | Commit/push authorized branches and provide Draft PR links | Commit/push authorized branches and provide Draft PR links | NOT STARTED | NOT STARTED |  |
| Source | Read linked master prompt MIRA_CARD_GAME_CORE_MASTER_PROMPT_20261120.md | Read linked master prompt MIRA_CARD_GAME_CORE_MASTER_PROMPT_20261120.md | READY | READY |  |

## Owner platform addendum (t250u, 20 Nov 2026) — not in the xlsx; recorded from Owner message

| ID | Area/Topic | Rule (short) | Status (cell) | Status (effective) | Note |
|---|---|---|---|---|---|
| OWNER-PLAT-01 | Platform | Web-playable game | LOCKED | LOCKED | Owner t250u |
| OWNER-PLAT-02 | Platform | Optimized for mobile LANDSCAPE | LOCKED | LOCKED | Owner t250u |
| OWNER-PLAT-03 | Assets | All visuals swappable/editable via manifest asset refs; no baked-in art in code | LOCKED | LOCKED | Owner t250u |
| OWNER-PLAT-04 | World map | Fixed-aspect design canvas; uniform scale + letterbox/pillarbox; never stretch; buildings never off-edge; UI anchored to same canvas | LOCKED | LOCKED | Owner t250u |

## Counts (effective status)

| Tab | Status | Count |
|---|---|---|
| v05_Action_Schema | OPTIONAL | 4 |
| v05_Action_Schema | PENDING | 1 |
| v05_Action_Schema | REQUIRED | 9 |
| v05_Avatar_Examples | Female + Name + ACTIVE EFFECT LOCKED; other stats/skills PROPOSED | 1 |
| v05_Avatar_Examples | Name/Faction LOCKED; Stats/Skills PROPOSED | 3 |
| v05_Core_Rules | LOCKED | 32 |
| v05_Core_Rules | PENDING | 5 |
| v05_Core_Rules | SUPERSEDED | 3 |
| v05_Gacha | LOCKED | 11 |
| v05_Gacha | PENDING | 2 |
| v05_Hideout_Map | LOCKED | 19 |
| v05_Hideout_Map | PENDING | 1 |
| v05_Mira_Handoff | NOT STARTED | 5 |
| v05_Mira_Handoff | READY | 1 |
| v05_Open_Decisions | PENDING | 9 |
| v05_Open_Decisions | PROPOSED | 1 |
| v05_QA | NOT RUN | 11 |

## Owner-only PENDING items (do not lock in code)

CORE-036, CORE-037, CORE-038, CORE-039, CORE-040, GA-11, GA-12, HOME-11, OPEN-01..OPEN-07, OPEN-09, OPEN-10 (OPEN-09/10 resolved by Mira audit, see `docs/audit/BASELINE_AUDIT_20261120.md`), Action_Schema.Target_Rule (PENDING). Implement each as a `RuleConfig` flag with no production default where the sheet says "do not invent".
