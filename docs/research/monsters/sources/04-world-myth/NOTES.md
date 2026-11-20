# Agent 04 — World mythology research notes

Status: **RESEARCH**. Nothing here is `LOCKED` or `OWNER_APPROVED`.

Owner: โปเต้. Lead orchestrator: Mira. Branch: `research/m04-world-myth`. Base: `research/monster-base` at `6e2bffe`. Owned path only: `docs/research/monsters/sources/04-world-myth/`.

This file is the research log. `inspirations.json` holds sourced creature records. `pitches.json` holds agent-created parody pitches and is labeled `AGENT-CREATED`. Do not merge the two.

## What this pass is for

A comedy-fantasy card game set in the Mysterious Tower. Avatars are real people fused with Echoes. The four factions already exist and are not renamed: Aegis Dominion (tank), Phantom Blades (DPS), Celestial Nexus (magic), Sanctuary Order (support). Monsters in these notes may be Wild Creatures, Corrupted Echoes, Tower Guardians, or tower-anomalies. They do not join a faction unless a later lore pass says so.

The parody target is the creature's recognizable behavior (regenerating heads, a bitten pledge, a hut that spins). It is not a religion, a people, or a living sacred being.

## Counts

71 inspirations (`INS-04-001`–`INS-04-071`). 12 pitches, unchanged. 79 source citations across 64 distinct URLs, each fetched on 2026-11-20. Some pages support more than one record (the Iranica Simorgh article, the Britannica phoenix article, the Samudra Manthana article). Confidence: 64 high, 7 medium. Sensitivity: 30 low, 27 medium, 14 high.

High-sensitivity records, none of them pitched: Hel, Ravana, naga, ifrit, jinn, Garuda, Kali, the bunyip label, Quetzalcoatl, the Tuatha Dé Danann, the bennu, the windigo, the asura class, and Rahu and Ketu.

## Batch 1

32 records on the first push.

| Culture | Ids | Notes |
|---|---|---|
| Greek literary monsters | INS-04-001–016 | Theoi pages fetched over HTTP 200 |
| Norse | INS-04-017–023 | Britannica plus the Prose Edda's Gylfaginning |
| Egyptian | INS-04-024–025 | British Museum schools guide; Britannica on Apopis |
| Mesopotamian | INS-04-026–027 | ETCSL Gilgamesh and Huwawa; British Museum mask; Britannica on Lamashtu |
| Indian epic | INS-04-028–030 | Britannica. Rakshasa is medium. Ravana and naga are **high** |
| Slavic folklore | INS-04-031–032 | Baba Yaga and the leshy |

## Batch 2

Added INS-04-033–053 after fetching each page.

New low-sensitivity Greek and classical shapes: Egyptian sphinx kept separate from the Theban one, griffin, Echidna, Talos, Stymphalian birds, Orthrus, centaurs, Colchian dragon, and the Ctesias martichora (medium confidence, Wikipedia). The Greek sphinx record now includes Britannica's wording of the riddle.

New medium records: ghoul, domovoy, rusalka, lamassu, kelpie. Rusalka is not a pitch. The rusalka origin is dead children and drowned women.

New high records, research flags only: ifrit and jinn (Qur'an), Garuda, Kali, Quetzalcoatl (British Museum), the Tuatha Dé Danann, and the bunyip. The bunyip record is medium confidence on purpose. The only page fetched was a Britannica students article that merges Aboriginal traditions into one monster and guesses at seals and bitterns. That is a colonial composite. It is not a design source.

Kelpie and manticore cite Wikipedia because a Britannica article was not found. Both are marked medium confidence. The kelpie article itself says specialists disagree on whether the each-uisge is the same being. Andy Scott's Falkirk sculptures are a modern artwork and are not the folklore creature.

The simurgh is now sourced from Encyclopaedia Iranica (INS-04-054), with Kamak (INS-04-055) and a narrow Anzu note (INS-04-056) from the same article. The windigo flag is INS-04-062, from the Canadian Encyclopedia, and it names Marvel's Wendigo as a comic to avoid.

## Batch 3

Added INS-04-054–071.

| Id | Name | Sensitivity | Source |
|---|---|---|---|
| 054 | Simorgh | medium | Encyclopaedia Iranica |
| 055 | Kamak | low | same article |
| 056 | Anzu | medium, medium confidence | same article, two sentences only |
| 057 | Pazuzu | medium | British Museum 91876 |
| 058 | Roc | low | Britannica Scholars |
| 059 | Bennu | high | Britannica phoenix article |
| 060 | Classical phoenix | medium | same article, kept separate from the bennu |
| 061 | Banshee | medium, medium confidence | Britannica Milesians: the name only |
| 062 | Windigo | high | The Canadian Encyclopedia |
| 063 | Calydonian boar | low | Theoi |
| 064 | Cretan bull | low | Theoi |
| 065 | Erymanthian boar | low | Theoi |
| 066 | Campe | low | Theoi |
| 067 | Empusa | medium | Theoi |
| 068 | Cerynitian hind | medium | Theoi; sacred to Artemis |
| 069 | Satyrs | medium | Theoi; attendants of gods |
| 070 | Asuras | high | Britannica on the Samudra Manthana |
| 071 | Rahu and Ketu | high | same article |

A guessed Britannica URL titled "asura" returned the Griffith Rig Veda instead of an asura article. It is not cited. The asura record uses the churning article, which also ties the myth to the Kumbh Mela.

## Sensitivity

Field values are only `low`, `medium`, and `high`. `sensitivityNote` says why.

- **high** — a worshipped being, a being honored in a living religion, a figure tied to a current festival, or a living sacred tradition. Research records only. No parody pitch. The fourteen are listed under Counts.
- **medium** — living folklore, a monster inside a mythology people still hold as religious, or a tradition whose story is about harm to children. Parody has to change the target of the joke. Current examples: Fenrir, Jörmungandr, Surtr, Ammit, Apopis, the rakshasa class, Baba Yaga, the leshy, Lamia, Lamashtu.
- **low** — an ancient literary monster with no living cult in the sources fetched. Still not a license to copy a film or a game.

`publicDomain: true` means the traditional story is not a private copyright. It does not mean a particular translation, painting, film, or game model is free to copy, and it does not override `sensitivity: high`.

`protectedName: false` means the historical name is not treated here as a trademark. Several of those names should still not be printed on a card. That restriction is cultural and is stored in `sensitivity`, not in the trademark flag. Marvel's Hela and Surtur are trademarked characters even though Hel and Surtr are not.

## How facts were checked

Every URL on a record was fetched on 2026-11-20 and the fact is taken from the fetched text.

- Theoi creature pages: fetched directly (HTTP 200).
- `https://www.britannica.com/topic/Fenrir`, `/Hel-Norse-deity`, and `/Ragnarok`: fetched directly.
- `https://www.britannica.com/topic/Apophis` is the asteroid 99942 Apophis. It was fetched and **not** used as the source for the Egyptian serpent. The serpent is `https://kids.britannica.com/scholars/article/Apopis/8037`.
- Adult Britannica returned 403 or 404 for several topics (Ammit, Apep, Nidhogg, draugr). Where the Scholars edition of Encyclopaedia Britannica was fetched instead, the record says so.
- Gylfaginning: `https://www.sacred-texts.com/neu/pre/pre04.htm`. The page titles it as Snorri's Prose Edda. The translator's name is not printed in the fetched text, so it is not claimed here.
- Huwawa: Oxford ETCSL translation `https://etcsl.orinst.ox.ac.uk/section1/tr1815.htm`, plus British Museum 116624. The museum says the mask is "usually believed" to be Huwawa and also reads as a divination liver-like intestine form. That uncertainty is in the record.
- World History Encyclopedia blocked this client with 403. It is not cited.

Confidence is `medium` where the fetched page only supports a narrow claim (Nidhogg, Garm). Those two are not filled in from memory. The famous "Nidhogg gnaws the root of Yggdrasil" detail is **not** asserted until a page that says it is fetched.

## Do not copy these modern versions

Stated by pages that were actually fetched:

- Britannica on Ragnarök names Wagner's *Götterdämmerung*, Marvel's *Thor: Ragnarok* (including Hela and the fire demon Surtur), Santa Monica Studio's *God of War: Ragnarök*, the film *Gåten Ragnarok*, and the TV series *Ragnarok*. None of those designs, names, or plots are source material.
- Britannica on the rakshasa says Dungeons & Dragons depicts them as backward-handed tiger-headed demons. Do not use that design. It is not in the epic description on the same page (side tusks, ugly eyes, curling brows, weapons).

General caution, not a sourced plot claim: Disney's Hercules, Assassin's Creed, Smite, Age of Mythology, Record of Ragnarok, and illustrated children's books have their own costumes. If a silhouette is famous from one of those, it is the wrong silhouette.

Greek Sirens on the Theoi page are bird-bodied. A fish tail is not supported by that page and collides with protected mermaid characters.

## Deliberately not pitched

- Every high-sensitivity record. That includes the bennu, the windigo, asuras, and Rahu and Ketu, not only the gods named in batch 1.
- Lamia and Lamashtu, because the sourced tradition is child-killing, and Lamashtu's also includes miscarriage and disease.
- Baba Yaga's eating of children. The pitch uses only the spinning hut, the mortar and pestle, and the water-of-life fountain, and it says so.
- Hanuman. The rakshasa article calls him the monkey god. He is not given a record because a one-line mention is not a sourced profile, and he is a worshipped deity.
- Seth and Re. They appear inside the Apopis story as gods. They are not records and not punchlines.
- Kumbhakarna, Shurpanakha, Vibhishana, and Indrajit are only names on the fetched rakshasa page. No traits were invented for them.

## Overlap to flag for Mira

- Fafnir / Siegfried may also interest Agent 02 (Western legend). The Norse saga version is recorded here.
- Nagas and garuda-like beings may also interest Agent 03 if that agent covers South Asia. Nagas are in this brief explicitly, and they are flagged high so they should not be designed either way without the Owner.
- Celtic material, when it arrives, sits next to Agent 02's western folklore. Dedupe on the creature, not the branch.
- Urban-legend cryptids (chupacabra, modern lake monsters) belong to Agent 05, not here.

## Tower reading (design hint, not lore canon)

Useful low-sensitivity shapes already sourced:

- Regeneration that gets worse until sealed (Hydra) → Agendrake.
- A pledge, a silly chain, and a bitten hand (Fenrir) → Pledge-Biter. Medium sensitivity. No franchise wolf.
- Seven removable auras and a killing look (Huwawa) → Sevenfold Glare.
- Bird-leg hut that spins (Baba Yaga), with the harmful part removed → Pestle Cottage.
- Tree-tall inside the forest, grass-tall outside (leshy). Not yet pitched. Strong elite or mini-boss candidate for the next creative pass.
- Impervious hide that must be wrestled (Nemean lion) → Wrestlemane.
- Six necks opposite a timed whirlpool (Scylla and Charybdis) → Hexanibble.

No HP, ATK, DEF, or damage numbers are proposed.

## Gaps left open on purpose

These were in the brief and were not filled, because a usable page was not fetched. They are not implied by the records that do exist.

- African traditions named by a people. Anansi's Britannica Scholars URL returned HTTP 500 twice and is not cited. No adze, tokoloshe, impundulu, or asanbosam record.
- Oceanic beings. Te Ara returned 403. No taniwha and no Rainbow Serpent.
- A Mesoamerican creature that is not a god. Quetzalcoatl is the only Mesoamerican record, and it is high. No ahuizotl.
- Further Celtic monsters. Kelpie is in. The banshee record is the etymology only. Balor was not on the Tuatha Dé Danann page and was not invented. No dullahan and no púca.
- Thunderbird. Not fetched.
- Zahhak. Not fetched. The Simorgh article was not used to invent him.

Slavic coverage beyond Baba Yaga is the leshy, the domovoy, and the rusalka. The leshy and the domovoy are the strongest unpitched candidates if a later pass swaps a Greek pitch. The pitch file stays at 12.

Each new URL has to be fetched before it is written into `inspirations.json`.
