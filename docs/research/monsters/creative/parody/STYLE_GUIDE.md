# Parody style guide — Agent 06

Status: **PROPOSED**. This file is a writing rulebook for `docs/research/monsters/creative/parody/**`. It does not lock names, lore, rarity, or combat numbers. Nothing here is `LOCKED` or `OWNER_APPROVED`.

Owner brief: `docs/research/monsters/BRIEF.md` (t273u). World rules this guide is not allowed to rewrite:

- Comedy fantasy throughout the game (`MAP-08`, `CORE-001`). No compulsory main story.
- Factions stay `Aegis Dominion` (Tank), `Phantom Blades` (DPS), `Celestial Nexus` (Magic), `Sanctuary Order` (Support). Ids in `src/schema/constants.js`. Do not rename them.
- The Mysterious Tower is the PvE place. World lore seed is "Real People + Echo hybrid Avatar" (`MAP-09`). Depth is optional. That sentence does not define what an Echo is.
- Avatar rarity words are `N` / `R` / `Epic` / `EX`. `FAC` is an action-card rarity, not a monster rank. Do not use the superseded words Common, Rare, Legendary, or Mythic.
- The Void is a card pile (`CORE-018`). Do not use "Void" as an element name, a plane, or a creature type.
- HP is not a catalog stat. Do not print HP, ATK, DEF, SPD, AP, or damage numbers on monster abilities.
- SYNC is rejected. Valhalla is a superseded rules word. Justin Spirit and Barry Blitz are discarded names. Do not bring any of them back.

## Alignment with Agent 08

Read at `research/m08-lore` commit `4d1f584`, file `docs/research/monsters/lore/LORE_AUDIT.md` (status RESEARCH; it quotes the repo and does not add canon). Parody copy follows it:

- Do not write a main story, a quest chain, or a tower campaign into a lore summary. `MAP-08` and `CORE-001` keep story optional.
- The locked place name is Mysterious Tower. The locked specification also says "Mystery Tower lore". Do not pick a new name. Floor counts, builders, biomes, and a top are UNKNOWN, and tower floors stay PENDING (`OPEN-07`). A `towerEnvironment` string is a provisional postcard mood for the art prompt. It is not a floor that now exists.
- Do not define Echo, hybrid, or summoning. The brief's heading "Echo Summoning" is a research label, not a v0.5 rule. No rite, no cost, no recipe.
- `Wild Creature`, `Corrupted Echo`, `Tower Guardian`, and `Tower Anomaly` are buckets the brief allows. They are not canon factions. The demo enemies "Placeholder Echo Tank / Blade / Spark / Hymn" are load stand-ins, not creatures to parody. A match fixture named `echo:` plus an avatar id is code, not lore.
- The eight named people are eight people (Owner t253u). Do not merge Sir Potlid with Justin Case, Nox Squeak with Justin Time, Madame Meteor with Justin Theory, or Sister Plaster with Justina Moment, and do not turn any of them into a monster.
- "Sister" is part of Sister Plaster's name. It does not found a church. Sanctuary Order has no theology in canon. Celestial Nexus has no star doctrine. Aegis Dominion and Phantom Blades have a name and a role and nothing else. A monster may be an embarrassment near a faction. It may not give that faction a god, a homeland, a mascot, or a creed.
- The game schema has no element enum and no weakness chart. Element and weakness in this folder are creative labels for art and for a later designer. They are not a damage wheel.
- If Agent 08 later proposes lore, prefer that wording over this guide's postcard moods, and keep the result PROPOSED.

House voice already on the cards (do not reuse these names, Thai forms, or their exact jokes):

| English | Thai | What the joke does |
|---|---|---|
| Sir Potlid | เซอร์ฝาหม้อ | A rank in front of a kitchen object. Thai translates the object. |
| Nox Squeak | น็อกซ์ รองเท้าดัง | A grave loanword, then a petty problem. Thai rewrites the petty half instead of transliterating "squeak". |
| Madame Meteor | มาดามดาวตก | A borrowed title plus a plain picture. |
| Sister Plaster | ซิสเตอร์พลาสเตอร์ | A job-title costume plus a loanword Thai already says (พลาสเตอร์). |
| Justin Case, Justin Time, Justin Theory, Justina Moment | (sheet copies English; that copy is not a localization) | An English idiom becomes a person. The avatars own this trick. |

New monsters should feel like they could stand next to that party. They should not sound like a second set of Justins, and they should not extend the pot, the squeaky shoe, the meteor, or the plaster.

## What a good monster name is

A player can say it once, spell it after hearing it, and guess the tradition it came from without being handed the original name. The creature still has its own job, wardrobe, and problem. Funny is one option. Cool, scary, and weird are equal options. A quiet name that paints a clear silhouette beats a loud name that needs a footnote.

Write for a phone screen and for someone reading aloud in Thai. Two to four English words, or one portmanteau of two to four syllables. No internal capitals, no apostrophes, no "the" buried in the middle of a word.

## Naming formulas

Use one primary formula per creature. Say which formula you used when you draft, then delete the label from the player-facing name.

1. **Title + object.** A comedy rank in front of a concrete noun. Ranks that fit this game: Sir, Dame, Madame, Sister, Brother, Captain, Clerk, Intern, Chef, Coach, Auntie, Uncle. The noun is a thing you could pick up or trip over. Sir Potlid is the locked proof that this works. Do not add a second title.
2. **Bathos pair.** One grave, foreign, or ceremonial word, then one embarrassing word. Nox Squeak is the locked proof. The second word has to be milder than the first, or there is no fall.
3. **Idiom person.** A phrase people already say, turned into a name. The avatar row spent this formula (`Justin Case` and the rest). Use it at most once in a batch, and only when Thai has a twin joke. Do not make another Justin.
4. **Portmanteau.** Two words blended so both are still audible when spoken once. Prefer a blend a player can respell. Reject a blend that needs three roots or a capital in the middle.
5. **Honest occupation.** The job title admits what the creature actually does. "Intern" and "clerk" and "inspector" are funnier here than "lord", because the tower is a place that files people.
6. **Spoonerism.** Swap two easy syllables, in English or in Thai, and only when both the broken form and the repaired form are everyday words. One per batch at most.
7. **Thai-led name.** The Thai line holds the pun. The English line is a clean caption so card layout still has a short Latin label. This is the right formula when the English pun would be a stretch.

Elite names may add one subtitle after an em dash when the subtitle is the joke ("assistant manager", "night shift"). The subtitle is not a power rating. Normal monsters do not get subtitles.

Banned as the whole joke: Lord, King, Dark, Shadow, Omni, Ultra, Super, Mega, Prime, God, Alpha, Mk II, or a Roman numeral. Those are either boss inflation (Agent 07's problem) or a recolour in disguise.

## Pun types

| Type | How it works | Keep | Drop |
|---|---|---|---|
| Homophone | Two meanings, one sound (knight / night, slay / sleigh). | Both meanings are common. | The second meaning needs a dictionary. |
| Picture swap | A famous prop is replaced by a household prop. | The new prop is drawable in one silhouette. | The new prop is only a word. |
| Portmanteau | See formula 4. | Survives being said aloud. | Only works written down. |
| Literalized idiom | A figure of speech is now a body. | The idiom is widely known. | It duplicates Justin Case. |
| Bathos | Epic shape, petty problem. | The problem is specific (one sock, one form, one lid). | The problem is "haha, weak". |
| Occupational satire | RPG, gacha, or tower paperwork is the target. | The player recognizes the chore. | The joke punches the player. |
| Thai rhyme or คำพ้องเสียง | A Thai pair that already sounds like a joke. | Readable with normal tone marks. | A pile of tone marks to force a pun. |
| Bilingual handoff | English sets up, Thai lands, or the reverse. | Each side is a real phrase. | Transliterated English with no Thai picture. |

Not every name needs a pun. A cool or eerie name still needs a concrete image. "Recognisable" can live in the silhouette and the signature trait when the name itself stays straight.

## The four humor types

Every sample entry picks one primary type. A second type may tint it. Do not blend all four into one creature. That reads as noise.

### Absurd Comedy

The creature follows a silly rule and treats it as nature. It is not an idiot. The rule is what is wrong.

Pattern, retired, do not enter this into the database: a bridge troll who charges a toll in library cards, because the river is a reading room and wet pages are the tragedy he prevents. The joke is the rule, told straight.

Use this type for category errors, polite monsters, and physics that work the same way every fight.

### Dark Fantasy Comedy

The lighting is grim. The problem is small. Dread comes from the silhouette, the empty hallway, the wrong smile. The laugh comes from the errand.

Pattern, retired: a headless rider who will not start the haunting until he finishes the lost-and-found form for his own head. The body can still be frightening. The motive is clerical.

Do not use blood, torture, or a real tragedy as the punchline. Scary is allowed. Cruel is not.

### Satirical Fantasy

The target is the genre, the gacha habit, the tower's filing, or the self-importance of adventuring. It is not a real religion, a real people, a real player, or a real workplace.

Pattern, retired: a goblin quartermaster who will not aggro until the party files an incident report, then fights exactly within the reported hours. The satire is dungeon bureaucracy.

Faction satire is allowed only as an embarrassment around the locked factions (a wild creature Aegis refuses to claim). Do not invent a new doctrine for a faction, and do not make the faction the villain of a culture.

### Epic but Ridiculous

Play a domestic crisis with full ceremony. The silhouette should still look paintable on a tall card. The mouth of the name can be grand if the last word trips it.

Pattern, retired: a sea serpent whose legend is one stolen sock per ship, sung by a choir that does not know it is singing about laundry. The scale is epic. The stake is not.

Agent 07 owns bosses. On normals and elites, stop before the entrance, the phase change, and the loot theme. Those fields are boss fields. An elite may feel like a mini-boss in the doorway and still stay inside the 22 shared fields.

## Recognisable, but distinct

The player should be able to name the tradition in conversation ("that one is the kappa", "that one is the chest"). The card must not help them by printing the protected name.

Four tests, all of them required:

1. **Glance.** Creature type, one famous trait, and the silhouette point at the inspiration. A kappa-like creature can have a water dish, a beak, and a cucumber problem. It cannot be named Kappa.
2. **Cover.** Hide the research block. The name, clothes, prop, and motive should not appear in the source work.
3. **Costume.** Do not collect a copyrighted hair shape, weapon, and palette on the same body. One echoed trait is recognition. Three are a copy.
4. **Letter.** Changing, adding, or dropping one letter of a protected name fails. So does spelling it in Thai letters.

Generic genre nouns may appear in the creature-type field: slime, golem, ghost, dragon, goblin, skeleton, wolf, witch. They are not automatically safe as the parody name. "Slime" as a type is fine. A smiling teardrop in one flat color is a specific character's silhouette and is not fine, even under a new name.

Public domain means the old story can be retold. It does not mean the most famous modern costume, catchphrase, or attack name is free. A medusa-like woman with snake hair evokes a myth. Giving her the pose, dress, and weapon of a living game's version of that myth fails the costume test.

"Mimic" is a good example of the line. A container that bites is recognisable. The player-facing name should not be Mimic, and the art prompt should not ask for the familiar wooden chest with a tongue if that is the whole design. Move the bite to a different container and give it a job the original does not have.

## Banned patterns

Reject the entry. Do not "fix" it by adding an adjective.

- **Recolours.** Fire, ice, and thunder versions of one body. "Same as the last one, but blue." A shared species is allowed only when silhouette, job, and joke all change.
- **Number suffixes.** II, III, Prime, Alpha, Beta, Mk 2, 01–99, or "returns" as the only new idea.
- **Protected proper names**, including one-letter escapes and Thai transliterations of them. Treat as protected until a source says otherwise: Pokémon, Digimon, and Yu-Gi-Oh! names; Final Fantasy summons and mascots (Ifrit, Shiva, Bahamut, Chocobo, Moogle, Tonberry, Cactuar, Malboro, and the rest); Dragon Quest's named mascots; Wizards of the Coast product identity (Beholder, Mind Flayer, Illithid, Displacer Beast, Gith, Yuan-ti, Owlbear); Warhammer and Blizzard character names (Murloc and the rest); miHoYo / Kuro / Type-Moon servant and character names; Shonen attack names and protagonist names; Disney, Pixar, and Ghibli character names; creepypasta character names (Slender Man included). When unsure, assume protected and invent from the job, not from the spelling.
- **Slurs**, older fantasy words used as ethnic stand-ins, mocked accents, and "primitive tribe" design.
- **Mocking a real religion or ethnicity.** No punchline whose target is believers, clergy, temples, or a people. Do not use พระสงฆ์, วัด, or sacred figures as a gag. Folklore creatures are allowed. Deities and saints are not the joke. If a historical legend is also worshipped, the joke has to land on the tower's bad filing or on an adventure trope, never on devotion. When that line is hard to hold, pick a different inspiration.
- **Living celebrities**, real private persons, and current political figures.
- **Sexualized monsters**, body-shaming as the joke, and disability as the joke. A round slime can be round because it is a slime.
- **Copied character bibles.** No source catchphrase, attack name, tragic backstory, or costume description pasted into lore.
- **Gore and cruelty** as comedy.
- **Empty dark prefixes** (Dark, Shadow, Blood, Death) used to make a normal monster sound elite.
- **Reuse of locked cast jokes**, including pot lids, squeaky shoes, meteors, plaster, and any new Justin. The eight named people are not monster material.

## Thai-name guidelines

The Thai name is a name, not a subtitle and not a phonetic dump of the English. The Justin sheet copied English into Thai and marked that copy as not a localization. New monsters do not get that escape.

Write Thai script only. No Latin letters, no emoji, no hashtags. Two to five words, or one compound about as long as เซอร์ฝาหม้อ or มาดามดาวตก. A player should say it in one breath.

Pick one strategy and stick to it on that entry:

1. **แปลภาพ.** Translate the physical noun. Use this when the joke is an object. ฝาหม้อ and ดาวตก are the house examples.
2. **มุกคู่ขนาน.** Write a different Thai joke that points at the same creature. Use this when the English line is an idiom. Do not ship a note that says the pun could not be translated.
3. **ทับศัพท์ครึ่งเดียว.** Transliterate the rank or the cool half. Rewrite the silly half in Thai words that already mean something. น็อกซ์ รองเท้าดัง is the house example. Do not transliterate the whole name.
4. **คำยืมที่มีชีวิต.** A loanword is legal only when Thai already uses it in ordinary speech (พลาสเตอร์). Do not coin a loanword to save a weak pun. Do not transliterate "slime" if a Thai picture-word is clearer, and do not assume สไลม์ is funny by itself.

The read-aloud test is the gate. Read only the Thai name. The listener should see the creature or hear the joke without asking which English word it copies. If they have to ask, rewrite.

Do not:

- Mock a dialect, an accent, or a regional vocabulary.
- Use royal ranks as a joke.
- Use crude words, slurs, or meme spellings.
- Stack tone marks so a pun barely exists.
- Hide the joke in a parenthesis.
- Mix English words written in Thai letters when those syllables mean nothing in Thai.

Titles in Thai follow the same costume rule as English. เซอร์, มาดาม, ซิสเตอร์, กัปตัน, อาจารย์, คุณ, พี่, ป้า, ลุง are comedy costumes. They are not permission to joke about real institutions. If the English title is "Sister", do not "correct" it to แม่ชี. That correction moves the joke onto real religious life. Keep the costume as a costume, the way ซิสเตอร์พลาสเตอร์ already does.

Record, in the creative block, which language holds the joke: `en`, `th`, or `both`. Localizers need that so they do not "fix" a parallel pun back into a literal translation.

## Elements, archetypes, factions, rarity, tower

Agent 08 proposed a vocabulary at `research/m08-lore` commit `35c6d36` (`MONSTER_WORLD_FRAMEWORK.md` and `framework.json`). It is **PROPOSED**, not canon. This folder uses it so the sample can be linked later. If that file changes, follow the newer proposal.

**Element / attribute** is one primary id from that list, not a damage type:

| Id | Name | Use |
|---|---|---|
| `ATTR_GUARD` | Guard | Brace, stall, wrong-object armor. Lines up with Tank. |
| `ATTR_STRIKE` | Strike | Rush, nick, arrive early. Lines up with DPS. |
| `ATTR_ARCANE` | Arcane | A grand effect told as bad math. Lines up with Magic. Not a pantheon. |
| `ATTR_AID` | Aid | Help that overstays. Not the name Saving Grace. Lines up with Support. |
| `ATTR_WILD` | Wild | Beasts and plants. |
| `ATTR_ECHO` | Echo | Looks like a person or a legend done wrong. Does not define hybrid avatars. |
| `ATTR_NEUTRAL` | Neutral | No faction color. |

Do not use Void, Sync, Holiness, Fire, Ice, Lightning, or Mythic as the attribute. A bird may still be drawn with ash and flame. The picture is not an element wheel. Weakness concepts are comedy and situation (a bowl tips, a lamp goes out, a form is filled in). They are not "weak to ice".

`ORG-FACTION` entries take that faction's attribute: Guard, Strike, Arcane, or Aid.

**Origin** (one), separate from attribute:

| Id | Name |
|---|---|
| `ORG-WILD` | Wild Creature |
| `ORG-ECHO` | Corrupted Echo |
| `ORG-GUARD` | Tower Guardian |
| `ORG-ANOM` | Tower Anomaly |
| `ORG-FACTION` | Faction-aligned. Requires `FAC_AEG`, `FAC_PHA`, `FAC_CEL`, or `FAC_SAN`. |

The other four origins leave faction null unless the joke truly wears one existing role's colors. A color does not make it a member. Most of the sample should not be faction-aligned. One or two is enough to show the bucket.

**Combat archetype** (one) is a staging word for a four-seat fight. It has to agree with the attribute, not invent a seventh role:

| Archetype | Attribute it agrees with | Reads as |
|---|---|---|
| Wall | Guard, sometimes Wild | Stands in front and refuses to move. |
| Striker | Strike | One big commitment. |
| Skirmisher | Strike or Wild | Faster, peskier. |
| Artillery | Arcane or Wild | Hits from the back. |
| Hexer | Arcane or Echo | Changes the fight's rules. |
| Chanter | Aid or Echo | Helps the other monsters, usually too much. |

Elites use the same six. They do not get a word that means "stronger".

**Suggested rarity**, from the same proposal: Normal monsters are `N`. Elites are `R`. A funnier normal stays `N`. Do not spend `Epic` or `EX` on this normal/elite sample. Do not use `FAC`. Do not use Common, Rare, Legendary, or Mythic.

**Tower environment** is one `ENV-TWR-01` … `ENV-TWR-15` id from that proposal. They are biomes the tower might wear, not floor numbers, not the top, and not a quest order. Prefer the biome whose humor type matches the creature. Repeat a biome only when two creatures would share a postcard. Say "Mysterious Tower" when the prose needs the real place name. Do not send a monster to live at the Shopping Mall, the Arena, or the Gachapon. The Gift Shop of the Conquered is not the Shopping Mall.

## Research block versus creative block

Every monster record has two blocks.

**`research`** holds only sourced facts. Copy them from Agent 01–05 when their `inspirations.json` is on the remote. Copy `inspirationId`, the original name, the origin, the kind, the facts you actually used, `protectedName`, `publicDomain`, and the source objects (url, title, accessed, supports). Do not polish their facts. Do not treat `pitches.json` as research. Pitches are someone else's creative ideas. A pitch may be rejected on craft grounds.

If a fact the parody needs is not in those records, fetch it, confirm the page supports that fact, and cite the fetched URL. Never type a URL from memory. Never invent a publisher, a date, or a quotation. If two sources disagree, keep both and set `researchConfidence` to `medium` or `low`.

Agent 06 does not mint `INS-0X-NNN` ids for creatures those agents have already claimed. If their files are absent and a sample must still proceed, a self-verified inspiration uses a clearly separate id prefix, `SELF-06-NNN`, and is replaced by their id when their record arrives.

**`creative`** holds everything invented: parody name, Thai name, visual identity, personality, signature trait, comedy concept, element, archetype, ability concept, weakness concept, lore summary, faction, rarity, tower environment, artwork prompt. Abilities and weaknesses are concepts in prose. No numbers.

`IP Similarity Risk` is the writer's judgment, not a sourced fact. Keep it beside the creative block with a one-sentence reason. `Research Confidence` stays in `research`.

Status on every record is `PROPOSED`.

## IP similarity

Rate after the creative pass, against the closest protected thing you can name.

| Rate | Meaning | What to do |
|---|---|---|
| low | Generic tradition plus an original job, wardrobe, and problem. The name shares no distinctive word with a protected title. | Eligible for the sample. |
| medium | A fan will name the franchise or the famous modern version immediately. The name, costume, and catchphrase still miss. | Eligible only with the reason written down. Do not stack many mediums from the same franchise. |
| high | The name, the silhouette, or the ability could be confused with a specific protected character. | Redesign. Do not ship a high in the sample or the name bank. |

The reason has to name the closest protected thing and the distance ("shares a water dish with the folklore kappa; does not use the name, the cucumber-only diet as identity, or any game's kappa costume"). "Original enough" is not a reason.

Spread the sample across all five research domains and all four humor types. Two creatures that share a domain still need different traditions. No pair should read as a recolour.

## Artwork prompts

A prompt is a concept, not a production asset and not a request to copy a painting. Describe silhouette, materials, expression, and one prop. Ask for an original comedy-fantasy card illustration. Do not name a living artist as the style to imitate. Do not name a copyrighted character as the reference. Do not ask for a film still, a game screenshot, or a famous costume.

State the floor mood in one phrase so the lighting matches the tower environment.

## Self-check before a record is PROPOSED

1. Read the English name aloud. It is two to four words, or one short blend, and it does not contain the original name.
2. Read the Thai name aloud. It passes the listener test above.
3. The primary humor type is exactly one of the four.
4. The inspiration is recognisable from type and trait, and absent from the name.
5. IP risk is `low` or `medium`, with a reason that names the closest protected thing.
6. No recolour, no number suffix, no banned prefix, no locked-cast joke.
7. Ability and weakness contain no combat numbers.
8. Faction, if set, does not rewrite a locked faction.
9. The research facts and URLs were copied from an agent record or fetched in this session.
10. The name is not already in the sample, the name bank, or the locked cast.

## Field keys used until Agent 09 publishes a schema

These keys are **PROPOSED**. If `docs/research/monsters/schema/**` on `research/m09-db` defines different names, remap without changing the words of the joke.

| # | Brief field | Where it sits |
|---|---|---|
| 1 | Monster ID | `monsterId` |
| 2 | Parody Name (EN) | `creative.parodyNameEn` |
| 3 | Thai name | `creative.thaiName` |
| 4 | Original Inspiration/Source | `research.originalInspiration` |
| 5 | Source URL | `research.sources[].url` |
| 6 | Monster Category | `category` |
| 7 | Creature Type | `creative.creatureType` |
| 8 | Visual Identity | `creative.visualIdentity` |
| 9 | Personality | `creative.personality` |
| 10 | Signature Trait | `creative.signatureTrait` |
| 11 | Comedy Concept | `creative.comedyConcept` |
| 12 | Element/Attribute | `creative.element` as `{ "attributeId", "name" }` from Agent 08's list |
| 13 | Combat Archetype | `creative.combatArchetype` |
| 14 | Signature Ability Concept | `creative.signatureAbilityConcept` |
| 15 | Weakness Concept | `creative.weaknessConcept` |
| 16 | Lore Summary | `creative.loreSummary` |
| 17 | Faction Affiliation | `creative.factionAffiliation` (`factionId` or null) plus `creative.originId` |
| 18 | Suggested Rarity | `creative.suggestedRarity` |
| 19 | Suggested Tower Environment | `creative.towerEnvironment` (`environmentId` and `name`) |
| 20 | Artwork Prompt Concept | `creative.artworkPromptConcept` |
| 21 | IP Similarity Risk | `ipSimilarityRisk` plus `ipSimilarityReason` |
| 22 | Research Confidence | `research.confidence` |

Ids for this sample, until Agent 09 says otherwise: `M06-N-001` … `M06-N-010` for normals, `M06-E-001` … `M06-E-005` for elites. Name-bank rows use `M06-NB-001` upward and are not monsters yet. They carry a parody name, a Thai name, a humor type, a creature type, one line of concept, an IP rating, and an `inspirationId`.

Boss titles, entrances, phase changes, defeat animations, and loot themes are out of scope in this folder.
