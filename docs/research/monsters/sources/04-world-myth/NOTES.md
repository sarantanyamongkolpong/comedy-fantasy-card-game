# Agent 04 — World mythology research notes

Status: **RESEARCH**. Nothing here is `LOCKED` or `OWNER_APPROVED`.

Owner: โปเต้. Lead orchestrator: Mira. Branch: `research/m04-world-myth`. Base: `research/monster-base` at `6e2bffe`. Owned path only: `docs/research/monsters/sources/04-world-myth/`.

This file is the research log. `inspirations.json` holds sourced creature records. `pitches.json` holds agent-created parody pitches and is labeled `AGENT-CREATED`. Do not merge the two.

## What this pass is for

A comedy-fantasy card game set in the Mysterious Tower. Avatars are real people fused with Echoes. The four factions already exist and are not renamed: Aegis Dominion (tank), Phantom Blades (DPS), Celestial Nexus (magic), Sanctuary Order (support). Monsters in these notes may be Wild Creatures, Corrupted Echoes, Tower Guardians, or tower-anomalies. They do not join a faction unless a later lore pass says so.

The parody target is the creature's recognizable behavior (regenerating heads, a bitten pledge, a hut that spins). It is not a religion, a people, or a living sacred being.

## Batch 1 (this commit)

32 distinct inspirations, 12 pitches.

| Culture | Ids | Notes |
|---|---|---|
| Greek literary monsters | INS-04-001–016 | Theoi pages fetched over HTTP 200 |
| Norse | INS-04-017–023 | Britannica plus the Prose Edda's Gylfaginning |
| Egyptian | INS-04-024–025 | British Museum schools guide; Britannica on Apopis |
| Mesopotamian | INS-04-026–027 | ETCSL Gilgamesh and Huwawa; British Museum mask; Britannica on Lamashtu |
| Indian epic | INS-04-028–030 | Britannica. Rakshasa is medium. Ravana and naga are **high** |
| Slavic folklore | INS-04-031–032 | Baba Yaga and the leshy |

Not in this batch yet, and required before the pass is finished: Celtic, African traditions (named by people, not as one "African myth"), Mesoamerican and Native American beings with the sacred ones flagged and not pitched, Oceanic beings, and further Persian, Arabian, and other traditions. Egyptian and Mesopotamian coverage is still thin on purpose. Padding with half-remembered names was rejected.

## Sensitivity

Field values are only `low`, `medium`, and `high`. `sensitivityNote` says why.

- **high** — a worshipped being, a being honored in a living religion, or a figure tied to a current festival or cultural reverence. Research records only. No parody pitch. Current high records: Hel (INS-04-019), Ravana (INS-04-029), naga (INS-04-030).
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

- Hel, Ravana, nagas, and any other high-sensitivity being.
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

## Next fetch targets

Celtic (Balor, dullahan, kelpie, púca), further Slavic (rusalka, koschei, domovoi) only after a real page, African traditions one people at a time, Mesoamerican creatures from a museum or a scholarly edition of Sahagún or the Popol Vuh with sacred beings flagged high, Oceanic beings from Te Ara, Te Papa, or the Australian Museum, Persian simurgh and zahhak, Arabian ghoul from a careful source. Jinn and ifrit stay high if the source shows them as part of living Islamic belief.

Each new URL has to be fetched before it is written into `inspirations.json`.
