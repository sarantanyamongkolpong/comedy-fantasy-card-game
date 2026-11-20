# Agent 01 — Classic RPG monsters

Status: **RESEARCH**. Nothing here is `LOCKED` or `OWNER_APPROVED`. Pitches are **PROPOSED** and `creative: true`. They are not research facts.

Scope owned by this file set: `docs/research/monsters/sources/01-classic-rpg/`. Branch `research/m01-classic-rpg`, based on `research/monster-base` at `6e2bffe`. No engine, gacha, production art, or hunter-life edits.

World this research is aiming at, read only, not changed: comedy-fantasy card battles in the Mysterious Tower. Factions stay Aegis Dominion (tank), Phantom Blades (DPS), Celestial Nexus (magic), Sanctuary Order (support). Avatars are real people mixed with Echoes. Monsters may be Wild Creatures, Corrupted Echoes, Tower Guardians, or tower-anomalies. Starter color in the existing cast includes Sir Potlid's pot lid; pitches may nod at that without rewriting the cast.

## What was collected

`inspirations.json` is a research array. Each record separates sourced `facts` from the one-line `parodyPotential` (agent judgment). `suggestedTiers` is an extra agent tag for Normal / Elite / Mini / Main / World / Secret spread. It is not a fact from the sources. A record may fit more than one tier.

`pitches.json` holds 12 original parody candidates. Names, bodies, and jokes in that file were invented for this game. They cite inspiration ids so QA can see the distance.

Every URL in `inspirations.json` was fetched on **2026-11-20** (Wikipedia API extracts, Dragon Quest Wiki pages, Final Fantasy Wiki pages, iRO Wiki, the iRO monster database, MapleStory Wiki, and Bulbapedia). Facts are paraphrases of those pages. If a page marked a detail "citation needed", that detail was left out or the record was kept thin and marked `medium`.

## Counts (this pass)

Regenerate is not required to read these; they describe the file as committed.

- Inspirations: 83 distinct names.
- Unique source URLs: 62.
- Confidence: 54 high, 29 medium, 0 low.
- `protectedName: true`: 64. Those names are franchise titles or coined proper names. Do not put them on cards.
- Tier tags overlap on purpose. The set includes early fodder, rare jackpots, fusion and timed hunts, story villains, raid-scale calamities, and comedy secrets.

Franchise spread: Dragon Quest, Final Fantasy, Chrono Trigger, Secret of Mana, EarthBound, Breath of Fire, Phantasy Star, Lunar, Lufia, Tales of Phantasia, Golden Sun, Suikoden II, MapleStory, Ragnarok Online, and Pokémon **only as creature-collection archetypes** (first partner trio, legendary/mythical, powerhouse). No Pokémon species is proposed as a monster to adapt.

Left to other agents on purpose: Diablo and the wider western action-RPG bestiary (agent 02). Deeper mythology of shared names such as Osiris, Ifrit, and Beelzebub was not re-fetched here, so those RO records do **not** claim the myth. Agent 04 can take the gods. Agent 05 can take anime-only faces.

## Archetype patterns worth keeping

These are the shapes, not the costumes.

1. **Tutorial beloved.** The first fight is weak, readable, and strangely merchandise-shaped: a blob, a bouncing fungus, a snail, a passive looter. Players feel slightly bad. Later games let the same creature be a friend or a nation.
2. **The jackpot that looks like trash.** A rare twin of the tutorial monster that runs away and pays for the whole evening. The joke is recognition plus frustration.
3. **Fusion monarch.** Small fry stack into a boss while a crown, lid, or pin stays on. Remove the token and the boss is a crowd again.
4. **Slow grudge.** Something cute walks toward you and settles a bill based on what you have already done. Mercy is the counterplay.
5. **Self-destruct and bad breath.** A round body that would rather explode, or a plant that exhales an entire status list.
6. **Elemental gatekeepers.** Four themed bosses, one per element, who are really one plan. A Grass/Fire/Water triangle is the friendly version of the same lesson.
7. **False ending.** Celebrate, then the master walks in. Or the mentor takes off the teacher mask. Or the king you beat was a puppet.
8. **The offer.** A final boss tries to hire you. Accepting is a loss. The second form is the insult.
9. **Container villains.** A tree full of sealed evil. A light-mage whose experiment curdled. A body-thief shopping for a healthier host. A goddess whose wish split a people.
10. **Buried calamity.** A parasite under history, a planetary antibody, a parent wearing a natural disaster. World-boss scale without needing a human face.
11. **Multi-part raid.** A statue or a many-headed body. Breaking limbs deletes patterns. The summon rite is an object you carry in, not a cutscene you skip.
12. **Timed MVP.** A named boss on a clock, free-for-all, calling adds, leaving a tomb that says who got the prize. Some are rituals (put out four fires) or quest doors instead of clocks. A GM-only "the mascot, but enormous" is the secret version.
13. **Wrong summon.** The rite asked for the dark lord and the cute outsider clocked in, then turned out to be worse.
14. **Incomprehensible last boss.** Not a dragon. A feeling, a film trauma, a boss the player cannot parse, still pitiable.
15. **Summon as a verb.** A borrowed myth shows up, does one cinematic action, leaves. The names are older than the games. The bodies are not.
16. **Late bloomer.** A three-stage investment that sits near the legendaries in power and far from them in effort.

## What makes these iconic

- **Silhouette first.** Teardrop, running cactus, robed knife, yellow bird, pom-pom, red sphere, tentacle maw, three-headed dragon, pipe-armed statue. If the silhouette is the brand, we do not use it.
- **One verb.** Flee. Fuse. Self-destruct. Bad breath. 1000-style fixed poke. Slow walk then ruin. Hire the hero. Split into six. Revive via a charm you can pull.
- **Repetition across sequels.** A monster that survives a change of hero becomes the mascot. The hero changes; the blob does not.
- **The feeling around the fight.** Metal hunting is a slot machine. Tonberries are dread in a costume. Pink Bean is a raid that lounges. Giygas is dread with no costume. Kefka is a joke that becomes weather.
- **Place.** Culvert, pyramid, toy clocktower, mine statue, ice dungeon fires, a field timer everyone can crash. The address is part of the monster.

## IP cautions

This is not a legal opinion. It is a research flag for QA.

**Treat as off-limits for names, catchphrases, and distinctive designs**

- Square Enix (and the older Enix/Square credits on the same pages) owns Dragon Quest and Final Fantasy as franchises. The Cactuar article states the Final Fantasy franchise is owned by Square Enix. Toriyama's teardrop slime, the metal twin, the crowned fusion, the dracky's grin, cactuars, tonberries, chocobos, moogles, bombs, malboros, and the named villains (Dragonlord, Baramos, Zoma, Psaro, Estark, Hargon, Malroth, Dhoulmagus, Mordegon, Exdeath, Kefka, Chaos-as-Garland, the Four Fiends as a set, Golbez, Jenova, Sephiroth, Sin, Weapon, Lavos, Magus, Mana Beast, Thanatos) are `protectedName` or are called out in facts.
- Do not reuse speech tics or attack names from the sources (`slurp`, the "not a bad slime" greeting, 1000 Needles, Bad Breath, Self-Destruct as a titled move).
- Gravity owns Ragnarok Online. Poring and the coined MVP names (Eddga, Phreeoni, Hatii, Detardeurus, Ktullanux, Golden Thief Bug, Moonlight Flower, Poring the Conqueror, Memory of Thanatos) are protected names in this file. Individual iRO monster articles 404'd during this pass, and the database page for Poring does not describe the body in text. **Do not draw the famous jelly from memory.**
- Wizet / Nexon own MapleStory. Orange Mushroom, Mushmom, Zombie Mushroom, Zakum, Horntail, Pink Bean, Papulatus, Black Mage (this character, not the generic job word), and Lucid are protected. The MapleStory Wiki's Taiwan row says Pink Bean was formerly labeled with a Pokémon-like name. That collision is a warning. Do not repeat it.
- Pokémon, the Pokédex, Poké Balls, and every species name belong to the Pokémon Company side of Nintendo / Creatures / Game Freak, per the Wikipedia franchise article. The three archetype records exist so designers can use "elemental starter", "mythic you mostly hear about", and "slow three-stage powerhouse" **without naming a species**. Pitches must not say Pokémon.

**`publicDomain: true` does not mean the sprite is free**

It means a fetched page shows the **name or folklore** is older than the game:

- Biblical Behemoth (Job). Final Fantasy's purple horned beast is still Square's.
- Baphomet as a name from crusade chronicles and Templar trials, and Lévi's 1856 goat. Ragnarok Online's labyrinth MVP is still Gravity's, and Lévi's drawing is not a template for our chapel boss either. The pitch `Pulpit Argument` avoids the goat on purpose.
- Bahamut in Arabic cosmography is a giant fish under the world. Final Fantasy lists Bahamut as a recurring summon and does not, on the page used here, describe that fish. Do not draw the FF dragon and call it public domain.

`publicDomain: false` on Osiris, the RO Ifrit, Beelzebub, and Doppelganger means this pass did **not** re-fetch the myth pages. It does not mean those words were coined by Gravity. Agent 04 should attach the folklore before anyone flips the flag.

**Generic words are still dangerous as a costume**

Slime, bomb, flan, drake, orc, dark lord, and mistress are ordinary words (`protectedName: false` where noted). The specific bodies, crowns, and attack kits are not ordinary. Pitches use pot lids, coin purses, fans, spoons, stovepipes, and rubber stamps so the card can be read as "that kind of monster" without being that monster.

**Marlboro.** The Malboro article itself suggests a cigarette-brand pun. That brand is someone else's trademark. Do not make the joke again.

## Gaps (honest)

Not in this file, because the page did not load or did not support the detail:

- Fandom wikis for Chrono Trigger, Secret of Mana, and Final Fantasy returned 403. So Ozzie, Flea, Slash, Spekkio, Nu, Rabite, Mantis Ant, and a lot of sprite-level FF bestiary text are absent rather than guessed.
- `dragon-quest.org` timed out on Golem, Killing Machine, and several other classic entries. Healslime and Bubble Slime are one-sentence records from the Wikipedia slime article. Liquid Metal Slime is only the sourced "derived from the Bubble Slime" note, not its own record.
- Iron Giant is named once in a recurring-monster list and was not given a record.
- Emerald, Ruby, and Ultimate Weapon are not separate records. Only the sentence that a planetary defense called Weapon attacks an island is in the Final Fantasy VII article used here.
- Sephiroth's one-wing silhouette was not in the sentences this pass relied on. It is not treated as verified here.
- Dhoulmagus's outfit was not described by the Dragon Quest VIII article used here. No jester claim.
- Most Ragnarok MVPs have a place, a timer, and the shared MVP rules, and **no sourced anatomy**. Parody potential says so. Confidence on those is `medium` except where a second page (Baphomet, Ktullanux's ritual, Memory of Thanatos, Poring the Conqueror, the Poring database) raised it.
- Golden Sun, Suikoden II, Lufia, and Tales records are plot-level boss roles. They are thinner than the mascot pages on purpose.

## How QA should read a record

- `facts` and `sources[].supports` are the only claims that need to match a page.
- `parodyPotential`, `suggestedTiers`, and `recordStatus` are this agent's notes.
- `pitches.json` is fiction for the tower. If a pitch and a fact disagree, the fact wins and the pitch should change.
- Dedupe targets for other agents: Bahamut / Behemoth / Baphomet / Ifrit (myth and Final Fantasy summon versus Ragnarok MVP), Black Mage as a job name versus MapleStory's character, "dragon" and "orc" as generic fantasy.

## Notable candidates to show the Owner first

Research, not a production lock:

- **Shy Ingot** and **Lidling / Crown Collapse** — the mascot, the jackpot, and the fusion, rebuilt around pot lids.
- **Ledger Lantern** — the slow grudge, with mercy as the weakness.
- **Half-Stair Sovereign** — the hire-the-hero offer and a second form made of stairs.
- **Eight-Pipe Idol** — limb-by-limb raid without the mine statue.
- **Misfile Bean** — cute wrong summon, secret floor, no pink and no headphones.
- **Drain Sovereign** — timed sewer monarch made of litter.
- **Pulpit Argument** — the labyrinth chapel hunt with the goat removed.

Strong research patterns that are not pitches yet: Exdeath's prison-tree and Neo form, Lavos as a buried calendar, Sin as a disaster that is a parent, the four elemental fiends, Zombie Mushroom's pull-the-pin, Ktullanux's four-flame ritual, and the powerhouse "late bloomer" as an elite growth fantasy with no species attached.
