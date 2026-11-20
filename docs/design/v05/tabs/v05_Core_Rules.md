# v05_Core_Rules

> CARD GAME CORE — RULES v0.5 (20 Nov 2026)

Source: `docs/design/v05/source/Card_Battle_Design_Master_v0.5_20261120.xlsx` (sha256 `f4a23a97c11e8a1b…`). Verbatim import — do not edit here; edit the sheet and re-import.

| Rule ID | Area | Decision / Rule | Status | Evidence | Implementation Notes |
|---|---|---|---|---|---|
| CORE-001 | Project | Comedy-fantasy gacha card battle; no compulsory main storyline or Main Quest | LOCKED | Owner 16-20 Nov | MVP loop Gacha → Team/Deck → Battle → Rewards → Upgrade |
| CORE-002 | Avatar | Fights as an actual character/sprite on field; Action cards command units | LOCKED | Owner 18 Nov | Never treat avatar cards as Action deck consumables |
| CORE-003 | Team | 4 Avatars per player team | LOCKED | Owner 18 Nov | Can bring mixed factions |
| CORE-004 | Win/Lose | Win all enemies defeated; lose all 4 own avatars defeated | LOCKED | Owner 18 Nov | Handle simultaneous deaths explicitly |
| CORE-005 | Avatar stats | ATK / DEF / SPD | LOCKED | Owner 19-20 Nov | Migrate old POW and legacy stats safely |
| CORE-006 | Turn order | Higher team SPD takes first turn, then alternating sides | LOCKED | v0.4 18 Nov | Team aggregate and tie resolution remain PENDING |
| CORE-007 | AP | 5 base AP, reset at beginning of each own turn | LOCKED | Owner 18-20 Nov | No auto end turn at AP 0 |
| CORE-008 | Card AP Cost | Each Action Card cost is card data, allowed 0 to 5 AP | LOCKED | Owner 19-20 Nov | Do not assume cost for unassigned individual cards |
| CORE-009 | Action deck | 30 Action Cards in deck | LOCKED | Owner 19-20 Nov | Duplicate limit per card still PENDING |
| CORE-010 | Opening hand | 5 cards | LOCKED | Owner 18-20 Nov | Start of battle |
| CORE-011 | Turn start draw | Retain unplayed cards; draw until 5 at start of own turn | LOCKED | Owner 19-20 Nov | If draw deck empty, shuffle Discard to Draw |
| CORE-012 | Effect-based draw | Extra draw during turn may temporarily exceed five | LOCKED | Owner 19-20 Nov | Card effect decides extra draw |
| CORE-013 | Turn-end cap | Discard excess freely until hand ≤ 5 at end of round | LOCKED | Owner 19-20 Nov | Discard UI is required |
| CORE-014 | Manual discard | Optional discard during own turn costs 1 AP per card | LOCKED | Owner 19-20 Nov | No AP cost for mandatory end-of-round discard |
| CORE-015 | Manual end | Player explicitly presses End Turn | LOCKED | Owner 19-20 Nov | Never auto End Turn when no AP |
| CORE-016 | Used card | Normal played Action moves to Discard Pile | LOCKED | Owner 19-20 Nov | Except specific Void effects |
| CORE-017 | Recycle | When Draw empties, shuffle only Discard into Draw | LOCKED | Owner 19-20 Nov | Void never auto-recycles |
| CORE-018 | The Void | Active pile for cards exiled by effects; viewable any time | LOCKED | Owner 19-20 Nov | Supersedes v0.4 legacy status |
| CORE-019 | Pile retrieval | Some named card effects retrieve specified cards from Discard/Void | LOCKED | Owner 19-20 Nov | Destination per effect; no global return rule |
| CORE-020 | Action categories | ATK / DEF / Skill | LOCKED | v0.4 18 Nov | Action, not old Tactic |
| CORE-021 | Skill activation | Avatar Active fired using eligible Action Card (usually 1 Avatar per Action) | LOCKED | Owner 19-20 Nov | Explicit card text can override one-target default |
| CORE-022 | Generic Action | Works with any eligible Avatar regardless of faction | LOCKED | Owner 19-20 Nov | Deck not faction-exclusive |
| CORE-023 | FAC Action | Matching Faction Avatar required to activate, except card-specific override | LOCKED | Owner 19-20 Nov | Check both deck mixed faction and play gate |
| CORE-024 | Avatar rarity | N / R / Epic / EX | LOCKED | Owner 19-20 Nov | Supersedes five-rarity model |
| CORE-025 | Action rarity | N / R / Epic / EX / FAC; EX and FAC same top power tier | LOCKED | Owner 19-20 Nov | FAC is action rarity/category, not avatar faction |
| CORE-026 | N skill slots | Only base stats; a few N have small Active | LOCKED | Owner 19-20 Nov | No uniform active requirement |
| CORE-027 | R skill slots | Active OR Passive | LOCKED | Owner 19-20 Nov | Not both by default |
| CORE-028 | Epic skill slots | Active + Passive | LOCKED | Owner 19-20 Nov | All four example Avatars are Epic |
| CORE-029 | EX skill slots | Active + Passive + Ultimate | LOCKED | Owner 19-20 Nov | Activation conditions/data beyond this pending |
| CORE-030 | Avatar EXP level | Maximum level 5; separate from Stars/Rank | LOCKED | Prior Owner discussion | Keep Star cap PENDING |
| CORE-031 | Progression | Hero Synthesis for stars; Promotion Stones for rank promotion | LOCKED | Prior Owner discussion | Quantities/material recipes PENDING |
| CORE-032 | Companion relationship | Gifts and Relationship apply to Companions ONLY, not Avatars | LOCKED | v0.4 16 Nov | Separate character schema |
| CORE-033 | Rarity values | Common/Rare/Legendary/Mythic v0.4 values | SUPERSEDED | v0.4 archive | Do not use in new roster/gacha |
| CORE-034 | Old battle | 10+10 Tactic, 7 MP, Valhalla, no Void | SUPERSEDED | v0.1→v0.4 archive | Current Action deck=30, AP=5, Discard+Void |
| CORE-035 | Old Auto Battler | Autonomous AI fight is not current primary battle system | SUPERSEDED | v0.3→v0.4 | Current player-controlled turn-based |
| CORE-036 | Battle grid | Old Tactical 5×2 / front-back | PENDING | Early concept | Do not hardwire until Owner confirms |
| CORE-037 | VR Sync | 100% initial Sync from old concept | PENDING | Early concept | Lore/mode only until Owner confirms active stat |
| CORE-038 | Team SPD formula | Sum/Avg/Max and tie handling | PENDING | v0.4 | Keep configurable; avoid unapproved permanent rules |
| CORE-039 | Damage and HP | Exact formulas, heal cap and KO behavior | PENDING | v0.4 | Test and present chosen temporary defaults separately |
| CORE-040 | Card duplicates | Max duplicates in 30-card deck | PENDING | No confirmed cap | Do not carry v0.1 'no duplicates' forward |
