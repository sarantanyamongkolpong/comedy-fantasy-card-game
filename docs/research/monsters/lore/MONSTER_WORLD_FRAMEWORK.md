# Monster world framework

**Status: PROPOSED.** This file is a research extension for monster and boss entries. It is not canon. It does not change core lore, faction names, faction roles, the Mysterious Tower's locked job, rarity ladders, or the battle schema.

Read `LORE_AUDIT.md` in this folder before using anything here. Machine-readable copy: `framework.json` (same status: `PROPOSED`).

Base of the audit: `research/monster-base` @ `6e2bffe`.

If a sentence below is not marked **CANON** in the audit, it is a proposal. Owner approval would be required before any of it became a rule. This document must not be labelled LOCKED or OWNER_APPROVED.

---

## What stays true while monsters are added

These are reminders, not new facts. The quotes live in the audit.

- The tone is Comedy Fantasy, and there is no compulsory main story or main quest (MAP-08, CORE-001).
- The map pin is named **Mysterious Tower**. Its locked job is "PvE battle and Mystery Tower lore" (MAP-03). Tower floors are still PENDING (OPEN-07).
- The only locked lore sentence is "Mystery Tower, Real People + Echo hybrid Avatar" (MAP-09). Lore depth is optional and does not gate play.
- "Echo Summoning" is a heading in the monster research brief. The sheet never uses it. This framework does not define a summoning rite.
- Four factions, fixed names, fixed roles: Aegis Dominion Tank, Phantom Blades DPS, Celestial Nexus Magic, Sanctuary Order Support. Mixed teams are allowed. A deck must not be locked to one faction.
- Justin Case, Justin Time, Justin Theory, and Justina Moment are new characters (`AVT_*_002`, Owner t253u). Sir Potlid, Nox Squeak, Madame Meteor, and Sister Plaster stay the `AVT_*_001` cast. They are not renames of each other.
- Avatar rarities are `N` / `R` / `Epic` / `EX`. Action rarities add `FAC`. `Common` / `Rare` / `Legendary` / `Mythic` are superseded. Sync is rejected. The Void is a card pile.

A monster entry may leave faction blank. The research brief already allows Wild Creature, Corrupted Echo, Tower Guardian, and tower-anomaly creatures. The classes below give those permissions an id and a boundary. The boundary is the proposal.

---

## Origin classes (PROPOSED)

Every research monster picks **one** origin id. Faction is a separate optional field, except for `ORG-FACTION`, which requires one of the four existing faction ids.

| ID | Name | Proposal | Hard boundary |
|---|---|---|---|
| `ORG-WILD` | Wild Creature | A beast, plant, or odd animal. It was not built as a copy of a person and it was not posted as tower staff. | Not an Avatar and not a Companion. |
| `ORG-ECHO` | Corrupted Echo | A tower creature that looks like a person done wrong: the wrong badge, a reflection that clocked in early, a legend that copied the punchline and missed the person. | Does **not** define the player's Echo hybrid Avatar. Do not narrate Justin, Sir Potlid, or the player as this class. |
| `ORG-GUARD` | Tower Guardian | Something that behaves as if it works here: tickets, landings, a song that must not stop. The job is a comedy pose. | Not an org chart. The tower still has no published staff list and no locked floors. |
| `ORG-ANOM` | Tower Anomaly | The floor itself misbehaving: weather with manners, a theorem with legs, a throne that is unsure it is final. | Not a new element. Not The Void. |
| `ORG-FACTION` | Faction-aligned | The silhouette and the joke are about one existing faction's locked role. | `factionId` is required and must be `FAC_AEG`, `FAC_PHA`, `FAC_CEL`, or `FAC_SAN`. The creature is not an Avatar and not a FAC action card. No fifth faction. No swapped role. |

Optional faction on the other four origins means "this joke wears that role's colors." It does not make the creature a member, a citizen, or a summon.

---

## How the existing factions meet monsters (PROPOSED)

No faction has a canon creed. The relations below only stretch the locked **role** into a monster joke. They do not add history.

### Aegis Dominion — Tank — `FAC_AEG`

Canon people: Justin Case (`AVT_AEG_002`) and, separately, Sir Potlid (`AVT_AEG_001`, pot-lid name, heavy rig, pot helmets as equipment ids). Justin's shield and taunt numbers are still a proposed sample.

**Proposed relation.** Faction-aligned monsters brace, stall, and wear armor that is slightly the wrong object. They buy time for everything else on the floor. They do not rule a dominion, because no dominion is written. The Armory of Wrong Sizes (`ENV-TWR-03`) can host them without becoming their capital.

**Do not.** Merge the pot helmet into Justin Case. Call the faction a kingdom. Invent a fifth "shield element."

### Phantom Blades — DPS — `FAC_PHA`

Canon people: Justin Time (`AVT_PHA_002`; the draft name Barry Blitz is dead) and, separately, Nox Squeak (`AVT_PHA_001`).

**Proposed relation.** Faction-aligned monsters rush, nick, and arrive before the introduction is over. "Phantom" may be played as a comic almost-there — the blow lands, the person is still tying a shoe — and must not be locked as "this faction is undead."

**Do not.** Revive Barry Blitz. Decide the faction is a ghost species. Identify the Corridor of Uninvited Footsteps with Nox Squeak himself.

### Celestial Nexus — Magic — `FAC_CEL`

Canon people: Justin Theory (`AVT_CEL_002`) and, separately, Madame Meteor (`AVT_CEL_001`). The sheet note "Science/magic comedy" belongs to Justin Theory's sample row, not to a school charter.

**Proposed relation.** Faction-aligned monsters mis-cast something grand. Stars that missed the quiz. A formula that grew legs. Meteor manners. The Observatory of Bad Math (`ENV-TWR-05`) is a suggested habitat, not Justin's campus.

**Do not.** Publish a pantheon. Turn Magic into a rock-paper-scissors element list. The schema has no element field.

### Sanctuary Order — Support — `FAC_SAN`

Canon people: Justina Moment (`AVT_SAN_002`, female; Saving Grace is her locked active; Justin Spirit is superseded) and, separately, Sister Plaster (`AVT_SAN_001`).

**Proposed relation.** Faction-aligned monsters help too hard. A bandage with opinions. Soup that heals and then scolds. A hymn that will not let anyone leave until they look cheered up. The Infirmary of Too Much Care (`ENV-TWR-06`) can hold that joke.

**Do not.** Found a church. Treat "Sister" as a rank outside Sister Plaster's name. Rename the Aid attribute to Saving Grace. Revive Justin Spirit as a boss, a title, or a ghost.

### Factions that are not monster factions

Home, the Shopping Mall, the Tournament Arena, the Sports Complex, and the Gachapon are map pins. Monsters do not need a mall faction or an arena faction. Companions remain a separate pool (CORE-032). A monster writeup does not become a companion.

---

## Tower environments (PROPOSED biomes, not floors)

OPEN-07 still says tower floors are pending. These fifteen ids are **floors the tower might wear**, not floor 1 through floor 15. A later pass may stack them, skip them, or repeat them. None of them is the top of the tower, and none of them gates a quest.

`sequenceHint` in `framework.json` is a color note (arrival, mid, set-piece). It is not a number.

| ID | Name | Visual mood | Comedy angle | Humor | Likely origins |
|---|---|---|---|---|---|
| `ENV-TWR-01` | The Lobby of Lost Badges | Cracked marble, a velvet rope, a desk lamp used as a spotlight, a heap of badges | The tower checks you in under someone else's name, then acts offended | Satirical Fantasy | Guardian, Corrupted Echo |
| `ENV-TWR-02` | The Pantry of Living Leftovers | Copper pots, heroic steam, cutting boards used as shields | Dinner got ambitious and now it has opinions | Absurd Comedy | Wild, Anomaly |
| `ENV-TWR-03` | The Armory of Wrong Sizes | Shields one size off, helmets that fit a mood instead of a head | Armor that is almost protective and completely embarrassing | Epic but Ridiculous | Guardian, faction-aligned Guard |
| `ENV-TWR-04` | The Corridor of Uninvited Footsteps | A carpet that is too long, portraits that blink late, floorboards that file reports | Stealth fails because the floor is a gossip | Satirical Fantasy | Wild, Echo, optional Phantom colors |
| `ENV-TWR-05` | The Observatory of Bad Math | A cracked orrery, chalk stars that disagree with the ceiling | The stars failed the quiz and want a retake | Absurd Comedy | Anomaly, optional Celestial colors |
| `ENV-TWR-06` | The Infirmary of Too Much Care | White tile, glowing bandages, soup steam, a bell for tired people | The cure waits for a thank-you card | Dark Fantasy Comedy | Guardian, optional Sanctuary colors |
| `ENV-TWR-07` | The Mirror Well | A shaft of reflections, each face half a second behind | Your reflection clocked in early and is already disappointed | Dark Fantasy Comedy | Corrupted Echo, Anomaly |
| `ENV-TWR-08` | The Menagerie of Unfiled Beasts | Straw, open gates, signs on the wrong cages | The animals updated their own job titles | Absurd Comedy | Wild |
| `ENV-TWR-09` | The Ballroom Stuck on One Dance | Chandeliers, confetti that will not land, a band of armored instruments | The song will not end, and neither will the bow | Epic but Ridiculous | Anomaly, Guardian |
| `ENV-TWR-10` | The Basement of Retired Bosses | Folding chairs, a throne used as a coat rack, scratched nameplates | Former final bosses run a support group and still enter like the world depends on it | Satirical Fantasy | Guardian, Echo |
| `ENV-TWR-11` | The Roof Garden of Indoor Weather | Rain that falls only on the plants, thunder that apologizes | The storm has indoor shoes and a curfew | Absurd Comedy | Wild, Anomaly |
| `ENV-TWR-12` | The Archive of Unfinished Legends | Books with the last page torn into confetti, index cards that outrank the books | Every epic ends in "to be continued" and a grocery list | Satirical Fantasy | Echo, Anomaly |
| `ENV-TWR-13` | The Service Elevator Between Moods | A brass car whose indicator shows feelings instead of numbers | You pressed "ominous" and the car stopped at "brunch" | Absurd Comedy | Anomaly, Guardian |
| `ENV-TWR-14` | The Throne Landing of Maybe | A door that is also a stage, an empty throne with a reserved sign and a second sign that says "maybe not" | The final floor is not sure it is final, but it already hired a drumroll | Epic but Ridiculous | Guardian, Anomaly |
| `ENV-TWR-15` | The Gift Shop of the Conquered | Keychains of bosses you have not met, mugs that spoil the ending | The souvenir knows the fight better than the fighter | Satirical Fantasy | Anomaly, Echo |

`ENV-TWR-15` is not the Shopping Mall. MAP-06 stays the furniture and cosmetics pin.

`ENV-TWR-07` is where Corrupted Echo entries belong most naturally. A hook set there still must not explain how a real person becomes a hybrid avatar.

---

## Attributes (PROPOSED tags, not a combat system)

`src/schema` has no element enum. Research field "Element/Attribute" should use one primary tag from this list and, if needed, one secondary tag. The tags point at roles the game already has. They do not add Fire, Ice, Lightning, a weakness chart, or a damage formula.

| ID | Name | Lines up with | Use |
|---|---|---|---|
| `ATTR_GUARD` | Guard | Tank, DEF, `FAC_AEG` | Brace, stall, wrong-object armor |
| `ATTR_STRIKE` | Strike | DPS, ATK, `FAC_PHA` | Rush, nick, arrive early |
| `ATTR_ARCANE` | Arcane | Magic, Skill, `FAC_CEL` | Grand effect, bad math, not a pantheon |
| `ATTR_AID` | Aid | Support, `FAC_SAN` | Help that overstays. Not the name Saving Grace |
| `ATTR_WILD` | Wild | no schema row | Beasts and plants. No new stat |
| `ATTR_ECHO` | Echo | no schema row | "Person done wrong" look. Not a definition of hybrid avatars |
| `ATTR_NEUTRAL` | Neutral | no faction color | When a role joke would over-claim |

Faction-aligned entries take that faction's primary attribute: Guard, Strike, Arcane, or Aid.

Do not use these words as attributes: Void, Sync, Holiness, Fire, Ice, Lightning, Mythic. The Void stays the exile pile (CORE-018).

---

## Rarity suggestions (PROPOSED)

Borrow the **avatar** ladder. Monsters are creature suggestions, closer to avatars than to action cards. Do not borrow `FAC`. `FAC` means "this action needs a matching faction avatar," and it shares the top tier with `EX`. A monster that likes a faction uses `factionId`. It does not become rarity FAC.

Do not use Common, Rare, Legendary, or Mythic.

Nothing sits above `EX`. A world boss is not a new rank.

Rarity tracks how large the presence is, not how funny the name is. A brilliant normal monster stays `N`.

| Research category | Suggested rarity | Why this rhyme |
|---|---|---|
| Normal Monster | `N` | Smallest presence. N avatars are mostly base stats. |
| Elite Monster | `R` | One signature trait, the way an R avatar has Active or Passive, not both by default. |
| Mini Boss | `Epic` | A scene, grander than an elite, not a campaign. |
| Main Boss | `EX` | A phase change rhymes with the EX Ultimate slot. Still no HP or damage numbers. |
| World Boss | `EX` | Top of the ladder that exists. |
| Secret / Comedy Boss | `Epic`, or `EX` if it truly has a phase | A one-scene joke stays Epic. Never FAC. |

These rhymes are writing aids. They do not change CORE-026..029, and they do not give monsters skill slots.

---

## How to attach a sample (for Agents 06 and 07)

Each sample link in `sample_lore_links.json` carries:

- one `originId`
- `factionId` or `null` (`ORG-FACTION` cannot be null)
- one primary `attributeId`
- one `environmentId` from the table above
- `suggestedRarity` from the avatar ladder
- a 1–2 sentence hook

The hook stays inside Comedy Fantasy, names no new faction, starts no compulsory quest, and does not explain Echo Summoning.

Flag the link when the sample does any of these:

- adds or renames a faction, or swaps a role
- treats a Justin as the same person as the matching `*_001` avatar
- uses Justin Spirit, Barry Blitz, Valhalla, or Sync as current lore
- uses Common, Rare, Legendary, Mythic, or FAC as the monster rarity
- makes The Void a place or an element
- requires a main story
- uses a protected proper name from another work as the creature's name
- defines how a real person becomes an Echo hybrid

Hooks are PROPOSED extension text. They are not canon even when the sample's parody name is good.

---

## Sibling vocabulary already on `research/m06-parody` (not canon)

Watched at `ee9c649` (`docs/research/monsters/creative/parody/STYLE_GUIDE.md`). That guide is PROPOSED and says it yields to this file once it exists. It does not move any core-lore line. `research/m07-boss` was not on the remote at the same check. Details and the crosswalk live in `sample_lore_links.json`.

Three tensions, all between proposals:

1. **One field versus two.** Their `creative.factionAffiliation` may be `Wild Creature`, `Corrupted Echo`, `Tower Guardian`, `Tower Anomaly`, or a faction id. This framework splits that into `originId` plus an optional `factionId`. "Wild Creature" is an origin, not a fifth faction.
2. **Attributes versus their element list.** They suggest Cinder, Tide, Loam, Gale, Spark, Gloom, Bloom, Gleam, Scrap, Neutral, and they already ban Void. This framework does not adopt that list as elements. There is still no element enum in `src/schema`. A sample may keep their word as art color. The lore link stores one `attributeId` from the table above. Gloom and Gleam stay moods. They are not a holy war and not Light/Dark.
3. **Rarity step-up.** They allow a Normal monster to be `R`, and an Elite to be `Epic`. The table in this file is stricter (`N`, then `R`). Both are proposals. A sample that steps up is a guidance variance, not a canon break, as long as it stays on `N` / `R` / `Epic` / `EX` and never uses `FAC`.

Their echo sentence — the tower misremembered a story and the misfile grew legs — can sit inside `ORG-ECHO` for creatures. It still must not become the definition of "Real People + Echo hybrid Avatar."

Their example floor labels (Gate Market, Echo Archives, Service Tunnels, Flooded Reliquary, Unlicensed Observatory, Night Kitchen, Roof Laundry) are not extra canon regions. The link file maps the close ones onto `ENV-TWR-*` and leaves Flooded Reliquary unmapped rather than adding a sixteenth biome.
