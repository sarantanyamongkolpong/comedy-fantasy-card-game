# MONSTER & BOSS PARODY RESEARCH PROJECT — Owner brief (Pote, t273u, 2026-11-20 19:57 ICT)
Mode: Deep Research + Creative Design. RESEARCH & DATABASE DESIGN ONLY. Lead orchestrator: Mira.
Base branch: research/monster-base (from prod/wave-base 7cbf071).

## Objective
Monster & Boss database for the card/gacha/tower game, inspired by: Classic RPG/JRPG, Fantasy games, Mythology & Folklore, Anime/Manga, Urban Legends, Pop Culture, Historical Legends.
Parody names players can recognise the inspiration of, but with their own identity. Mix of funny, cool, scary and weird.
NEVER copy artwork, protected proper names, or original character details verbatim.

## Targets (full) — Phase 1 delivers a 30-entry SAMPLE only; expand to 370 only after Owner approval
| Category | Target | Phase-1 sample |
|---|---|---|
| Normal Monster | 200 | 10 |
| Elite Monster | 60 | 5 |
| Mini Boss | 40 | 5 |
| Main Boss | 30 | 5 |
| World Boss | 20 | 3 |
| Secret / Comedy Boss | 20 | 2 |
| TOTAL | 370 | 30 |
No padding by recolours or number suffixes; every entry distinct.

## Schema per monster (22 fields)
1 Monster ID, 2 Parody Name (EN), 3 Thai name, 4 Original Inspiration/Source, 5 Source URL, 6 Monster Category, 7 Creature Type, 8 Visual Identity, 9 Personality, 10 Signature Trait, 11 Comedy Concept, 12 Element/Attribute, 13 Combat Archetype, 14 Signature Ability Concept, 15 Weakness Concept, 16 Lore Summary, 17 Faction Affiliation (optional), 18 Suggested Rarity, 19 Suggested Tower Environment, 20 Artwork Prompt Concept, 21 IP Similarity Risk, 22 Research Confidence.
Clearly separate RESEARCH FACTS (sourced) from AGENT-CREATED content (each record has `research` and `creative` blocks).

## Boss extra fields (Mini/Main/World/Secret)
Boss Title, Entrance Concept, Signature Silhouette, Personality/Motivation, Signature Mechanic, Phase Transformation Concept, Defeat Animation Concept, Unique Loot Theme. NO HP/ATK/DEF/damage numbers.

## Parody rules
Easy to read/remember; understandable pun or wordplay; not every one must be funny; artable; distinctive; not too close to the original.
Humor types: Absurd Comedy, Dark Fantasy Comedy, Satirical Fantasy, Epic but Ridiculous. Bosses grander than regular enemies even with funny names.

## World integration
Existing lore: Aegis Dominion, Phantom Blades, Celestial Nexus, Sanctuary Order, Mysterious Tower, Hybrid Avatar / Echo Summoning (see docs/design/v05/*, docs/DESIGN_DECISION_RESEARCH.md, src/schema/constants.js). Not every monster needs a faction; may be Wild Creature, Corrupted Echo, Tower Guardian, or tower-anomaly creature. Do not change core lore without approval.

## Deliverables (editable)
A. Excel workbook sheets: Master Monster Database, Normal Monsters, Elite Monsters, Mini Bosses, Main Bosses, World Bosses, Secret Bosses, Research Sources, Duplicate / IP Risk Audit.
B. JSON for future game import. C. Research Summary (interesting concepts + which to produce art for first). D. Top 30 Showcase with visual concepts.

## Execution rules
Check repo + latest world lore first; parallel research; verifiable sources only; NEVER fabricate sources (every URL must be fetched and confirmed to support the claim); dedupe names & concepts; IP similarity check; Mira merges + QA; send first 30 to Owner; expand to 370 only after approval; do NOT touch battle engine, gacha logic or production assets.
Status words: RESEARCH / PROPOSED / QA_PASSED. Never LOCKED / OWNER_APPROVED.

## Ownership (exclusive, one branch + Draft PR into research/monster-base each)
| Agent | Branch | Owns |
|---|---|---|
| 01 Classic RPG | research/m01-classic-rpg | docs/research/monsters/sources/01-classic-rpg/** |
| 02 Western Fantasy | research/m02-western | docs/research/monsters/sources/02-western/** |
| 03 Eastern Mythology | research/m03-eastern | docs/research/monsters/sources/03-eastern/** |
| 04 World Mythology | research/m04-world-myth | docs/research/monsters/sources/04-world-myth/** |
| 05 Anime & Pop Culture | research/m05-anime-pop | docs/research/monsters/sources/05-anime-pop/** (incl. urban legends & historical legends) |
| 06 Comedy & Parody Writer | research/m06-parody | docs/research/monsters/creative/parody/** |
| 07 Boss Designer | research/m07-boss | docs/research/monsters/creative/bosses/** |
| 08 Lore & Faction | research/m08-lore | docs/research/monsters/lore/** |
| 09 Database Architect | research/m09-db | docs/research/monsters/schema/**, tools/research/monsters/**, tests/research/monsters/** |
| 10 Research QA & IP | research/m10-qa | docs/research/monsters/qa/**, tools/research/monsters-qa/** |

## Research record format (agents 01-05) — docs/research/monsters/sources/<dir>/inspirations.json
[{ "inspirationId":"INS-0X-NNN", "name":"<original name>", "origin":"<franchise/culture>", "kind":"game|myth|folklore|anime|urban_legend|pop|historical", "facts":["<sourced fact>"], "sources":[{"url":"...","title":"...","accessed":"2026-11-20","supports":"<which fact>"}], "archetypeTags":[], "protectedName":true|false, "publicDomain":true|false, "parodyPotential":"<1 line>", "confidence":"high|medium|low" }]
Plus pitches.json: 8-12 creative candidate pitches (agent-created, clearly marked) spanning categories.
