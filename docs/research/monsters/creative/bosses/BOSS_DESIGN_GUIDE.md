# Boss Design Guide

Status: **PROPOSED**. Research and design only. Not `LOCKED`. Not `OWNER_APPROVED`.

| | |
|---|---|
| Agent | 07 — Boss Designer |
| Branch | `research/m07-boss` |
| Base | `research/monster-base` @ `6e2bffe` |
| Scope | `docs/research/monsters/creative/bosses/**` |
| Sample | [`sample_bosses.json`](sample_bosses.json) — Phase-1 bosses only (5 Mini, 5 Main, 3 World, 2 Secret / Comedy) |
| Accessed | 2026-11-20 |

This guide separates two kinds of sentence. A **sourced fact** names a fetched page and says only what that page supports. A **proposal** is a rule for this game's boss records. Proposals are not claims about other games, and they assign no HP, ATK, DEF, or damage numbers.

On 2026-11-20, `research/m02-western`, `m03-eastern`, `m04-world-myth`, and `m05-anime-pop` were on `origin` and were read with `git show` only. Where a boss uses one of their records, `research.inspirationId` is that id and the facts are pages agent 07 also fetched. `research/m01-classic-rpg` and `research/m09-db` were not on `origin`. Classic-RPG bosses keep the pages agent 07 fetched, and `inspirationId` stays empty rather than inventing an id. Lore (`research/m08-lore`) and the parody style guide (`research/m06-parody`) had landed as **PROPOSED** files. This sample follows those proposals for names, origins, attributes, environments, and rarity. They are not canon. If `m09` publishes a schema, the field names can be renamed to match it.

## What a boss is for here

The locked game is a comedy-fantasy gacha card battle with no compulsory main story (CORE-001, MAP-08). The Mysterious Tower is the PvE destination and the lore axis: real people and Echoes as hybrid Avatars (MAP-03, MAP-09). The four factions stay what they already are: Aegis Dominion (Tank), Phantom Blades (DPS), Celestial Nexus (Magic), Sanctuary Order (Support). Bosses do not rename those factions and do not add a fifth one.

A regular tower creature is one problem in a crowd. A boss is the climax of a stretch of tower: stronger in role than the creatures before it, staged so the player can see the office before the joke, and fought with a pattern the player can learn. That reading comes from the usual definition of a video-game boss: a significantly more powerful opponent placed at the end of a section or on a guarded objective, generally harder than the enemies met so far, and often larger in presentation. A miniboss is weaker or less significant than the main boss of the same area, while still above ordinary opponents. A superboss is optional, sometimes hidden behind a task, and generally beyond the bosses on the main path. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)), accessed 2026-11-20.)

This game's four tiers use those distinctions, then fit them to a 4-versus-4 card battle. They are not copies of any one commercial mode.

## Tiers

| Tier | Phase-1 count | Full target (not this pass) | Job in the tower | How it is grander than a normal creature |
|---|---|---|---|---|
| Mini Boss | 5 | 40 | Mid-floor climax. Guards a landing, a door, or a lesson. | One readable trick, a title, a short entrance. Often a stronger shape of a creature the floor already suggested. |
| Main Boss | 5 | 30 | End of a floor or a district. The test that the floor was teaching. | Full entrance, a phase the eye can see, a defeat ceremony, a loot motif. |
| World Boss | 3 | 20 | A tower-wide spectacle. Rare on the route. The whole floor is about this body. | Silhouette bigger than one portrait. Announcement and loot feel public. The fight is still one party. |
| Secret / Comedy Boss | 2 | 20 | Optional. Missable. The punchline is allowed to be the premise, and the staging still has to be a climax. | Hidden approach, a form announcement or a private ceremony, a loot motif that does not appear on the main path. |

### Mini Boss

Sourced pattern: a miniboss is a boss-like enemy weaker than the area's main boss. Some are stronger versions of regular enemies. "Guardian" is sometimes used when the miniboss protects an item. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)).)

A 2016 design article sorts mini-bosses as mid-point encounters that guard a door, an item, or another objective, a small climax on the way up. In many Zelda dungeons, beating the mini-boss gives an item the player then learns before the temple boss. Mini-bosses can be built like other enemies and can show up again later as ordinary foes. ([Building Better Bosses](https://www.gamedeveloper.com/design/building-better-bosses), Attila Branyiczky, 20 June 2016.)

Proposal for this game:

- One signature trick, taught cleanly. The floor's Main Boss may use that same trick in a messier way.
- The "item" is not a new dungeon-item system. It is a card pattern the party already has: Taunt, Shield, Regen, a next-attack Skill, a retrieve, or a card that resolves to the Void.
- Entrance is a name plate and one pose. A speech longer than a line is for Main Bosses and above.
- The other three seats may be parts or attendants of this same record. They are not extra database monsters.

### Main Boss

Sourced pattern: bosses sit at climax points, and many fights move through phases in which the boss produces different hazards, often with a change of appearance or a show of rising frustration. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)), citing Theodore Agriogianis, *The Roles, Mechanics, and Evolution of Boss Battles in Video Games*, Long Island University, 2018.)

Zelda-like dungeons are known for a boss that is vulnerable to an item found in that dungeon, after the player has practiced the item on puzzles and weaker foes. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)).)

Branyiczky's "temple boss" is the guardian of an area and a test that the player is ready for the next tier. He describes a common shape in which the player first learns the pattern, proves the first success was not a fluke, and then meets an "enraged" stretch — faster, more aggressive, or on a new pattern — so the last success feels like mastery rather than a long identical grind. He also argues that a boss fight is a bad moment to teach a brand-new mechanic, and that a short cinematic can show the design and even demonstrate an attack while the player is safe. Repeat the cinematic only the first time. ([Building Better Bosses](https://www.gamedeveloper.com/design/building-better-bosses).)

Agriogianis writes that a phase change has to be obvious, usually because the body or the place changes, and that the new phase should build on tells the player already learned. He points at Cuphead as a fight where the last phase is an elaborate transformation. ([Agriogianis 2018](https://digitalcommons.liu.edu/cgi/viewcontent.cgi?article=1042&context=post_honors_theses), phase discussion.)

The first video-game boss often named in this history is the Gold Dragon at the bottom of *dnd* (1975), guarding the orb that completes the game. Agriogianis treats a treasure-guarding dragon as the pattern that boss inherits: tougher than the other enemies, teased before the fight, and waiting as a final test the player can reach too early. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)); [Agriogianis 2018](https://digitalcommons.liu.edu/cgi/viewcontent.cgi?article=1042&context=post_honors_theses).) That is a structural ancestor. It is not a license to copy that dragon's name or any later copyrighted dragon.

Proposal:

- A Main Boss closes a floor. The Mini Boss on that fantasy "district" has already shown the verb.
- Two readable stretches, not a new engine phase flag. See Phases below.
- Entrance plays in full once. A return visit keeps the name plate and one line.
- No new rule is introduced in the fight. Every trick is an existing card op, status, or pile.

### World Boss

Sourced pattern, from a different genre on purpose: in *World of Warcraft*, a world boss is a raid-level monster that appears in the shared world rather than in an instance capped to a fixed group. Early examples were part of end-game progression and were fought by raid-sized groups. ([World boss](https://warcraft.wiki.gg/wiki/World_boss), Warcraft Wiki, accessed 2026-11-20.) Blizzard's Mists of Pandaria preview said world bosses spawn in the open world, can be attacked by players who cross their path, take a full raid to bring down, and pay out in achievements, items, and bragging rights. ([World Boss Preview Now Available!](https://worldofwarcraft.blizzard.com/en-us/news/6871747/world-boss-preview-now-available), by Frost, dated on the page as August 6.)

This game is not that game. The battle engine is one side of four avatars against another side. There is no shared server health bar, no raid size, and no open-world spawn system in the locked rules. MAP-05 leaves multiplayer specifics pending. A world boss in this sample does **not** propose those systems.

Proposal — the part of the pattern that still fits:

- The body reads as larger than a floor boss. One illustration can wrap all four portraits, while the seats stay four units.
- The encounter is rare in the tower route and is announced like weather over the tower, as presentation copy. It does not edit the map system.
- The loot motif is a trophy of "we were there," still with no stat numbers and no drop rate.
- The fight is still won by clearing the enemy side (CORE-004). Grandeur is silhouette, title, announcement, and trophy theme.

### Secret / Comedy Boss

Sourced pattern: a superboss is optional, does not have to be beaten to finish the game, is generally harder than the bosses on the plot path, and often asks for a side condition before it appears. Unique rewards show up in some games; the Wikipedia summary gives rare loot as one observed payoff, not a rule of this project. Not every optional fight is a superboss. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)).)

Branyiczky's secret boss sits off the planned path, above the skill the story expected, and is itself behind a gauntlet. He treats it as a capstone on the whole game rather than on the story route. ([Building Better Bosses](https://www.gamedeveloper.com/design/building-better-bosses).)

Comedy precedent, cited only for structure: Agriogianis describes *Conker's Bad Fur Day*'s Great Mighty Poo as an absurd boss that is still staged with a performance and interludes between phases. ([Agriogianis 2018](https://digitalcommons.liu.edu/cgi/viewcontent.cgi?article=1042&context=post_honors_theses).) This project does not use that subject. The useful observation is that a ridiculous premise can still be staged as a climax.

Proposal:

- Missing it does not block the tower. CORE-001 already says there is no compulsory main quest.
- The way in is a content condition (an unlisted door, a wrong count of landings). It is not a new engine flag.
- The joke may be the creature's whole job. The title, silhouette, phase, and defeat still follow the same ceremony as a Main Boss.
- Difficulty, in this sample, means a nastier use of existing ops (Void-bound cards, retrieve, a long tell). It does not mean invented numbers.

## Engine fit

Read from `docs/engine/RULES.md` and `src/engine/model.js` on this base. Signature mechanics in the sample are concepts for content that already fits. They are not patches.

A side is four living units. The side loses when all four are gone (CORE-004). Each turn refreshes 5 AP (CORE-007). Action cards are ATK, DEF, or Skill (CORE-020). A Skill fires an avatar Active; there is no free Active (CORE-021). Cards resolve to Discard, or to the Void when that card says so (CORE-016, CORE-018). A retrieve pulls matching cards from the **acting side's** Discard or Void, one retrieve effect on a card, with an explicit permit (`validateRetrieve` in `src/engine/match.js`).

Effect ops the engine accepts: `damage`, `shield`, `taunt`, `buff` (ATK or DEF, timed), `regen`, `draw`, `next_attack`, `trigger_active`, `retrieve`. Passives trigger on `turn_start` or `on_attack`, may roll a chance, and may add `bonus_damage`. Shields pool. Taunt limits legal enemy targets. Regen ticks on later turns of that side and skips the defeated. AUTO's proposed `balanced` policy already likes a next-attack Skill before a hit, then damage, then a real shield or taunt if a hit can knock out, then a non-regen heal when an ally is low (`docs/engine/RULES.md`).

So a boss whose identity is "announces, then hits" or "stands in front and shields" will be played in character by the current AUTO policy. A boss that needs a custom script, a new status, or a mid-fight spawn will not.

`normalizeAvatar` currently requires one of the four faction ids, and the role must match that faction. The brief allows a creature to be a Wild Creature, a Corrupted Echo, a Tower Guardian, or a tower anomaly, with faction optional. These records leave `factionAffiliation` null and name a `towerPresence` plus an `engineRoleShape` (Tank, DPS, Magic, or Support). A future adapter could seat that shape on a faction id without making the creature a member of the faction. This guide does not add a faction and does not change the loader.

### Phase patterns that fit

There is no phase object in the engine. A "phase" in these records is one of two content patterns.

**Pattern A — the same seats change the verb.** The deck leads with one kind of card (Shield, Taunt, Regen) and follows with another (next_attack, a wider ATK). The transformation the player sees is the illustration and the name of the Skill. AUTO will follow a next-attack Skill into a hit on its own. Use this when the body is one person who powers up.

**Pattern B — the other seats are the next phase.** They are on the field from the start, because nothing in the effect list summons a unit. While the front seats live, they Taunt or Regen. When they are gone, what remains is the rest of the body, and the fight feels different because the board is different. Use this for many-headed, segmented, or duplicated bosses. A cluster of heads, or a world-wrapping coil, can be the painting; the seats are still four.

A chained second match, as a floor that starts another battle after the first side is wiped, would be tower flow outside one `createMatch`. These records do not depend on that flow.

Adds, in the Wikipedia sense, are extra enemies a boss brings in, sometimes to buy time or to recover. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)).) Here the adds are the other seats at the opening of the match.

### Attributes

`elementAttribute` is one id from the agent 08 proposal, not a damage type: `ATTR_GUARD`, `ATTR_STRIKE`, `ATTR_ARCANE`, `ATTR_AID`, `ATTR_WILD`, `ATTR_ECHO`, `ATTR_NEUTRAL`. The locked combat words remain ATK, DEF, and SPD. Nothing in that list modifies damage.

Do not use Void, Sync, Holiness, Fire, Ice, Lightning, or Mythic as the attribute. Void is the card pile (CORE-016, CORE-018). A boss may still be drawn in ash, ink, or bronze. That color is `notes.pictureColor`, not an element wheel. `ATTR_ECHO` means a person or a legend done wrong. It does not define hybrid avatars or Echo summoning.

Origin is separate and lives in `notes.originId`: `ORG-WILD`, `ORG-ECHO`, `ORG-GUARD`, `ORG-ANOM`. `ORG-FACTION` is unused in this sample. Faction affiliation stays null. Wild Creature is an origin, not a fifth faction.

`combatArchetype` uses the six staging words from the same proposal: Wall, Striker, Skirmisher, Artillery, Hexer, Chanter. `notes.engineRoleShape` still names the seat a future adapter might use (Tank, DPS, Magic, Support). The adapter is not built here, and the loader is not patched.

Tower place is one `ENV-TWR-01` … `ENV-TWR-15` id. They are postcard biomes, not floor numbers and not a quest order. A boss that needs water, and finds no sea in the fifteen, says so in `notes.environmentConflict` instead of minting a sixteenth room.

### Rarity words

Suggested rarity uses the locked avatar ladder N / R / Epic / EX as **encounter prestige**. The agent 08 proposal, which this sample follows, steps bosses above normals and elites: Mini Boss `Epic`, Main Boss `EX`, World Boss `EX`, Secret / Comedy Boss `EX` when the secret has a real phase. Both secrets in this file have a phase, so both are `EX`. That is not a drop rate, a pity rule, or a stat. FAC stays an action-card category (CORE-025), not a creature rank. Common, Rare, Legendary, and Mythic are not used.

## Entrance

Sourced pattern: boss fights are treated as dramatic events, with theatrical scenes before and after, and often their own music. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)).) Branyiczky recommends a short cinematic that shows power or demonstrates a tell, and that shows off design the player will miss once the cards start. Play the long version once. ([Building Better Bosses](https://www.gamedeveloper.com/design/building-better-bosses).)

Proposal, scaled to a mobile landscape card battle:

| Tier | Entrance |
|---|---|
| Mini | Name plate, title, one pose that shows the signature prop. No speech. |
| Main | Once per boss: a few seconds, the prop, and one line in the voice of the title. Later visits: plate and line only. |
| World | The plate is larger than the portraits. The body is shown crossing more than one seat before the seats resolve into four. One line. |
| Secret | The door or the cabinet is the entrance. The title card can look like the wrong UI (a boot screen, a compact mirror) and then become a boss plate. |

The entrance demonstrates the tell: the bow, the belt pose, the abacus, the vat. It does not deal damage and does not spend AP.

## Silhouette

Sourced pattern: Valve's Team Fortress 2 paper says the nine classes had to be identifiable at a glance, at different distances, so the player could judge a threat. Body proportions, weapons, and the outline of hats, footwear, and clothing folds were designed to make each silhouette unique. Clothing folds inside the shape echo the outline. The team checked the designs as pure silhouettes, with no interior shading, during the concept phase. (Jason L. Mitchell, Moby Francke, Dhabih Eng, "Illustrative Rendering in Team Fortress 2," NPAR 2007; chapter text read at [pixelmaven PDF](http://www.pixelmaven.com/jason/articles/ATI/Chapter3-Mitchell-Illustrative_Rendering_in_Team_Fortress2.pdf), accessed 2026-11-20.)

Riot's *League of Legends* clarity notes say the silhouette is the main way a champion is recognized: one primary characteristic that stays put even on a skin; the outline should also point at the source of power (a bow, a staff); bulk can suggest a tank or fighter; and the facing direction should read in outline alone. Animation can help, and should not be the only way two similar bodies are told apart. ([Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/), 12 March 2021.)

Proposal:

- Every boss has one **primary mass** that survives a black fill test at card size: clay bulk, red cap, dish-and-shell, rooster-serpent, spring heels and cloak, waistcoated dragon, green axe and hatbox, masked necks and vats, spider and quill, megaphone visor and time-clock belt, a coil around the frame, staff and cloud and boot-circlet, a beast lying across the dock, a black cabinet, a compact and a ribbon comet.
- The joke is a **secondary prop** on that mass (a sticky note, a clipboard, a punch card). If the joke is deleted, the office is still obvious.
- The primary mass is not the primary mass of a copyrighted character. A staff-and-cloud can evoke a pilgrim monkey without copying a specific costume. A full-face helmet can evoke a transforming hero without copying a compound-eye helmet.
- Four bosses in one row must not share an outline. The sample set was checked against that rule: no two are "human in a cape" with the same hat.
- Facing reads toward the party. A coil shows which end is the clasp.

## Phases, in presentation

Use Pattern A or Pattern B from the engine section. The change is announced by the body:

- Something falls, burns, clamps, stands up, hatches, or is shouted.
- The new outline still contains the primary mass. League's note on transformations is the caution: a lasting change that hides identity makes the fight harder to read. ([Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/).) A shouted form-name is allowed when the outline actually changes with it.
- The second stretch uses a verb the first stretch already taught. Enrage, in Branyiczky's sense, is this content shift. It is not a status kind.

## Defeat

Sourced pattern: the theatrical frame includes a scene after the fight as well as before. Final bosses in particular are described as generally larger, more detailed, or better animated than lesser enemies, so the meeting feels grand. ([Boss (video games)](https://en.wikipedia.org/wiki/Boss_(video_games)).) The proposal below uses that staging idea on every tier, scaled down for a Mini Boss and up for a World Boss. The source itself is talking about final bosses.

Proposal:

- The defeat is one shot, played on the win, not on each retry. It is longer than a normal creature's pop and shorter than the entrance.
- Order: the primary mass breaks in a way that matches the office (the note flies off, the ladle was already empty, the coil lets go of its tail, the compact cracks), then one comedy beat (the clipboard, the wrong red dye, the unplugged cord), then the loot motif is visible as an object left on the floor.
- No combat numbers appear in the animation description. No new reward formula. `uniqueLootTheme` is a family of objects for a later content pass.

## How a funny name stays grand

Nothing in the sources says "pun names are inherently grand." The proposal below is built out of the patterns above, for this comedy-fantasy tone (MAP-08) and for the brief's rule that bosses stay grander than regular enemies even when the name is funny.

1. **The name may joke. The title holds the office.** Field `parodyNameEn` is two to four words, or one short portmanteau, sayable in one breath. The joke sits in that name. Field `bossTitle` is the post: Hoard Accountant, Waist of the Unfinished Tower, Knight of the Hatbox Head. The plate shows both, title second and set in the same ceremonial type as any other boss. Lord, King, Marshal, and the other inflation words are not the personal name. Sir, Dame, Captain, Clerk, and Auditor are costumes, the way the starter cast already uses Sir and Sister. The Thai name is Thai script, a picture or a parallel joke, not a phonetic dump of the English.
2. **The outline shows the office before the joke.** TF2 and League: one primary characteristic, readable as a threat. The sticky note is small. The clay body is the silhouette.
3. **The entrance is a ceremony.** Branyiczky: a short scene for power and design. A Mini Boss gets a plate. A Main Boss gets one line in character. The line can be funny and still be a herald, because it is delivered as a herald.
4. **The phase is announced like a rank, and the body changes with it.** Agriogianis: the shift has to be visible. "Encore" is a joke and a second form only because the visor and the belt actually change.
5. **The defeat bows before it shrugs.** The mass falls first. The punchline is the last beat, one object, not a second speech.
6. **Ridiculous premises can still be staged as bosses.** The Conker example in Agriogianis is the structural citation. Our premises stay inside comedy fantasy: ink that will not set, a bite that cannot close, a ladle with a hole, a cabinet that was never stocked, a compact that becomes a fine.

Starter avatars already joke in the name and keep a job in the role (Sir Potlid the tank, Sister Plaster the support; see `docs/DESIGN_DECISION_RESEARCH.md`). Bosses go one step further: the joke name plus a title, because they have to read as the climax of a floor rather than as a party member.

Names in the sample were checked for these qualities: sayable in one breath, a visible pun, not a protected proper name, and not a number suffix.

## Parody, IP, and what the research block may contain

The brief forbids copied artwork, protected proper names, and original character details copied verbatim. Players should still be able to tell what the spark was.

Rules used on the sample:

- Folklore and myth may be cited in `research` with the URL that was fetched. The creative name is a new name. Anansi, Sun Wukong, Jörmungandr, Behemoth, Polybius, Bertilak, and Kamen Rider are inspirations, not the names on the plate.
- A divine name, a sacred inscription, or a regalia object that the source treats as unique stays in the research notes. The art prompt uses a mundane stand-in (a sticky note that says nothing holy, a parking boot, a brewing paddle).
- Sexual violence, slurs, and gore that appear in some source pages are not imported into facts lists, visuals, or jokes. The redcap record cites the cap, the ruined-tower haunt, the iron boots, and the pike, and then dyes the cap in ink. The Spring-heeled Jack record cites the leaps, the cloak, the gentleman shape, and the flames, and does not restage the assaults described in the same article.
- Dungeons & Dragons text is not public domain. The golem record cites the Wikipedia statement that golems appear in that game and in video games because of it, and that the game's clay golem shifted the folklore defender into an unthinking hulk. ([Golem](https://en.wikipedia.org/wiki/Golem).) The sample does not copy that game's stat block, setting, or flesh-golem design. A chest-mimic was considered and left unused: the Wikipedia page on the mimic describes it as an original monster from the 1977 *Monster Manual*, usually a chest, with an adhesive and pseudopods, later reused across many games. ([Mimic (Dungeons & Dragons)](https://en.wikipedia.org/wiki/Mimic_(Dungeons_%26_Dragons)).) That specific trap is too close to one product's monster to be this sample's classic-RPG boss.
- IP risk on each record is `low`, `medium`, or `high`, with a reason. Medium means a player will recognize the spark from the silhouette and should still see a new character.

## Record shape

Each object in `sample_bosses.json` has:

- `monsterId`, `status: "PROPOSED"`
- `research` — sourced facts and URLs only
- `creative` — the parody, the staging, and the mechanic concept
- `notes` — engine role shape, phase pattern, tower presence, and the reminders that rarity and element are not combat math

Schema fields, numbered as in the brief:

| # | Field | Lives in |
|---|---|---|
| 1 | Monster ID | `monsterId` |
| 2 | Parody Name (EN) | `creative.parodyNameEn` |
| 3 | Thai name | `creative.thaiName` |
| 4 | Original Inspiration/Source | `research.originalInspiration` |
| 5 | Source URL | `research.sourceUrl` (primary). Extra pages are in `research.sources` |
| 6 | Monster Category | `creative.monsterCategory` |
| 7 | Creature Type | `creative.creatureType` |
| 8 | Visual Identity | `creative.visualIdentity` |
| 9 | Personality | `creative.personality` |
| 10 | Signature Trait | `creative.signatureTrait` |
| 11 | Comedy Concept | `creative.comedyConcept` |
| 12 | Element/Attribute | `creative.elementAttribute` |
| 13 | Combat Archetype | `creative.combatArchetype` |
| 14 | Signature Ability Concept | `creative.signatureAbilityConcept` |
| 15 | Weakness Concept | `creative.weaknessConcept` |
| 16 | Lore Summary | `creative.loreSummary` |
| 17 | Faction Affiliation | `creative.factionAffiliation` (null unless a later lore pass assigns one) |
| 18 | Suggested Rarity | `creative.suggestedRarity` |
| 19 | Suggested Tower Environment | `creative.suggestedTowerEnvironment` |
| 20 | Artwork Prompt Concept | `creative.artworkPromptConcept` |
| 21 | IP Similarity Risk | `creative.ipSimilarityRisk` |
| 22 | Research Confidence | `research.researchConfidence` |

Boss fields, all under `creative`: Boss Title, Entrance Concept, Signature Silhouette, Personality/Motivation, Signature Mechanic, Phase Transformation Concept, Defeat Animation Concept, Unique Loot Theme.

`signatureMechanic` names ops and patterns. It does not give amounts.

## Sample map

Domains are the five research streams. Each boss has one home domain so the set does not collapse into a single mythology.

| ID | Category | Name | Title | Domain |
|---|---|---|---|---|
| BOS-MIN-01 | Mini Boss | Clerk Claypunch | Warden of Lost Tickets | 01 Classic RPG (folklore golem, later an RPG monster) |
| BOS-MIN-02 | Mini Boss | Capper Crimson | Knight of the Unset Cap | 02 Western (INS-02-013) |
| BOS-MIN-03 | Mini Boss | Clerk Nochin | Mask of the Unfinished Bite | 03 Eastern (INS-03-005) |
| BOS-MIN-04 | Mini Boss | Dame Glasspeck | The Ledger Hen | 02 Western (INS-02-007) |
| BOS-MIN-05 | Mini Boss | Auditor Leapwell | Night-Shift Bounder | 05 Urban legend |
| BOS-MAIN-01 | Main Boss | Sir Cindervest | Hoard Accountant | 01 Classic RPG (hoard-guardian dragon; 1975 bottom-of-dungeon boss) |
| BOS-MAIN-02 | Main Boss | Sir Verdant Gale | Knight of the Hatbox Head | 02 Western |
| BOS-MAIN-03 | Main Boss | Clerk Forkwater | The Flood That Will Not Pick a Gutter | 03 Eastern (INS-03-010) |
| BOS-MAIN-04 | Main Boss | Sir Stairweb | Story-Broker of the Stair | 04 World myth |
| BOS-MAIN-05 | Main Boss | Captain Encore | Rival Who Announces His Form | 05 Anime / tokusatsu (INS-05-014) |
| BOS-WORLD-01 | World Boss | Sir Yarncoil | Waist of the Unfinished Tower | 04 World myth (INS-04-018) |
| BOS-WORLD-02 | World Boss | Dame Dryladle | The Giant Who Asked for a Ladle | 03 Eastern (INS-03-035) |
| BOS-WORLD-03 | World Boss | Sir Lotusbulk | Unhookable Beast of the Dock | 04 World myth |
| BOS-SECRET-01 | Secret / Comedy Boss | Zero Cabinet | The Game Never Stocked | 05 Urban legend / pop |
| BOS-SECRET-02 | Secret / Comedy Boss | Dame Compact | She Who Transforms Into the Fine | 05 Anime (INS-05-016) |

Count check: classic RPG 2, western 3, eastern 3, world myth 3, anime and urban/pop 4. All five streams appear. Classic RPG is the thin one because `research/m01-classic-rpg` was not on `origin`, and a third classic boss was not invented to fill the gap.

World-boss coverage note: Sir Lotusbulk's facts are the biblical beast, not a video-game bestiary entry. He is filed under world myth. Sir Cindervest carries the classic-RPG boss pattern (the teased guardian of a prize). That split is deliberate so a "world" body is not pretended to be a JRPG archfiend without a source for that archfiend.

## Alignment notes

These are proposals followed, not canon.

- **Do not parody.** Agent 03's INS-03-053 says not to parody the eight-headed serpent, because of imperial regalia and local veneration. That creature is not in the sample. Clerk Forkwater uses INS-03-010 instead, the nine-headed flood whose own record offers a disagreement joke. The older woodcut (heads clustered on one neck, facing three directions) is the picture. The deity, the blood, and the poison are not.
- **Do not repeat a sibling pitch.** Agent 03 already wrote a kappa mini boss, PITCH-03-07 Dish Auditor. Clerk Nochin uses the bronze mask (INS-03-005) so this sample does not ship a second dish clerk. The missing jaw is the tell. The card does not eat the player's cards, and it does not joke about ancestor rites.
- **Veneration stays out of the joke.** An earlier pilgrim-monkey draft was dropped. Dame Dryladle uses the ladle and the hole from INS-03-035. The literal gloss of that source's name, the drowned-priest reading, and the drowning are research-only.
- **Cockatrice filing.** Agent 02 recorded the cockatrice as western (INS-02-007). Dame Glasspeck moved with that filing. The ledger hen is this card. Their dawn-crowing sentence is not.
- **Names.** Personal names dropped Lord and Marshal. The boss title keeps the office. Thai names are pictures or parallel jokes (`กัปตันอีกรอบ` for the encore, `ดามกระบวยรั่ว` for the holed ladle).
- **Rarity and attributes.** Mini Boss is Epic. Main, World, and these two Secrets are EX. Zero Cabinet's attribute is `ATTR_ECHO`. The word Void on that card means the card pile.
- **Environments.** Each boss has one `ENV-TWR-*` id. Dame Dryladle's cellar is a partial fit, written on the record: the biome's name says retired, and she is a current world boss. There is no sea in the fifteen, and no sixteenth room was added. Clerk Forkwater's elevator is the same kind of note: the room is the indecision, not a flood floor.
- **Schema.** `research/m09-db` had not landed. The 22 fields plus the 8 boss fields are unchanged. Origin, attribute id, environment id, humor, and which language holds the joke sit in `notes` so a later schema pass can lift them.

## Sources fetched for this guide

All of these were opened and read on 2026-11-20. Creature pages that support a single boss are repeated on that boss's record.

- Boss vocabulary, miniboss, superboss, phases, entrances and exits, adds, the 1975 Gold Dragon, Zelda dungeon items: <https://en.wikipedia.org/wiki/Boss_(video_games)>
- Mini-boss, temple boss, enrage, secret boss, first-time cinematic: <https://www.gamedeveloper.com/design/building-better-bosses>
- Phase readability, Cuphead's final transformation, the Gold Dragon as a teased test, a ridiculous boss still staged as a boss: <https://digitalcommons.liu.edu/cgi/viewcontent.cgi?article=1042&context=post_honors_theses>
- Silhouette test during concepting: <http://www.pixelmaven.com/jason/articles/ATI/Chapter3-Mitchell-Illustrative_Rendering_in_Team_Fortress2.pdf>
- Silhouette, primary characteristic, bulk, facing, transformation clarity: <https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/>
- World boss as a shared-world raid monster: <https://warcraft.wiki.gg/wiki/World_boss>
- Official preview of roaming world bosses, raid effort, and bragging-rights rewards: <https://worldofwarcraft.blizzard.com/en-us/news/6871747/world-boss-preview-now-available>
- Chest-mimic as a 1977 game original, considered and not used: <https://en.wikipedia.org/wiki/Mimic_(Dungeons_%26_Dragons)>
- Taotie, the symmetrical bronze mask with no lower jaw, fetched for Clerk Nochin: <https://en.wikipedia.org/wiki/Taotie>
- Xiangliu, nine heads, and the older woodcuts that cluster those heads on one neck facing three directions, fetched for Clerk Forkwater: <https://en.wikipedia.org/wiki/Xiangliu>
- Umibōzu, the giant who demands a ladle and is answered with one that has no bottom, fetched for Dame Dryladle: <https://en.wikipedia.org/wiki/Umib%C5%8Dzu>

Game rules cited from this repo, not from the web: `docs/engine/RULES.md`, `docs/design/v05/tabs/v05_Core_Rules.md`, `docs/design/v05/tabs/v05_Hideout_Map.md`, `docs/DESIGN_DECISION_RESEARCH.md`, `src/schema/constants.js`, `src/engine/model.js`.
