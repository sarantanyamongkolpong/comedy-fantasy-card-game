# Agent 03 — Eastern mythology (research notes)

Status of every inspiration: **RESEARCH**. Status of every pitch: **PROPOSED**. Nothing here is OWNER_APPROVED or LOCKED. This folder does not change battle rules, gacha, art assets, or hunter-life.

Owner brief: `docs/research/monsters/BRIEF.md`. World touched only as a place to stand: Aegis Dominion (tank), Phantom Blades (DPS), Celestial Nexus (magic), Sanctuary Order (support), and the Mysterious Tower as the PvE site (`src/schema/constants.js`, `docs/design/v05/BRIEF_20261120.md`). These beings are wild creatures, corrupted echoes, tower guardians, or tower anomalies. They do not join a faction and they do not rewrite the tower.

## What is a fact

`facts` and `sources` are the research. Each source URL was fetched on **2026-11-20** and the `supports` line is the claim that page was seen to make. `parodyPotential` is an agent comment, one line, not a source. `pitches.json` is agent-created and marked `notResearchFact: true`.

If a famous detail is missing, it was not on the page read in this pass. It must not be filled in from memory. Examples that were deliberately left out:

- Kitsune beyond shapeshifting or bewitching, and any Inari link.
- Yuki-onna's powers. Only the regional names were in the lead.
- Kasa-obake's one eye and one leg.
- Gashadokuro's height, starvation origin, and the ringing in the ears. The page calls it modern and says it picks people up.
- Ningyo flesh granting long life.
- Nure-onna's baby bundle.
- Ushi-oni's spider body.
- Inugami's making-ritual.
- Nang Ta-khian's dresses and lottery numbers.
- Nariphon's fruit. The Himavanta page only says a mythical tree of that name grows there. Confidence on that record is **low**.
- Jiangshi talismans and peach-wood swords. Hopping is the cinema image. Folklore in the page is running, sometimes flight, plus the corpse-driving trade.
- The gumiho as a default liver-eater. A dragon's liver appears in the Geotaji tale; that is one story. The general section that was read stresses deception, tragedy, a late arrival of nine tails, and a becoming-human motif that is mostly modern.

## Counts

- Inspirations: **134** (`INS-03-001`–`INS-03-134`).
- Records whose `origin` contains "Thai": **18**. Local phi, tree spirits, Mae Nak, kuman thong, Nang Kwak, Nariphon, Chao phi, and Himavanta are in that set, together with Phaya Nak, Phaya Krut, Kinnaree, and pret, because the brief asked for those Himmaphan and Buddhist figures as Thai material. They are flagged `sensitivity: high` where they are sacred.
- Pitches: **12**, spanning Normal, Elite, Mini Boss, Main Boss, World Boss, and Secret / Comedy Boss. Thai-script names are on every pitch. Several pitches are Thai creatures (Cross-Toe, Uncle Winnow). Sacred figures are not pitched.

Sensitivity counts are in the JSON, not a second source of truth. Recompute them from the file if they matter.

## Sensitivity

- **low** — a folkloric monster or trickster, with no living cult described in the sources read.
- **medium** — an auspicious symbol, a shrine-adjacent custom, a funeral practice, a cultural emblem, or a being one source calls a spirit while the stories treat it as a character. Comedy can touch the creature and must not sneer at the believers.
- **high** — a deity, a living object of worship, a national or imperial sacred symbol, a child-spirit practice, or a dance figure that is still ritual. **Do not make a comedy card.** The record exists so nobody "discovers" them later and plays them for laughs.

High, and not pitched: Bai Ze, the Chinese long, Bai Suzhen, Yamata no Orochi, onryō as enshrined kami (Masakado, Michizane, Sutoku), Jeoseung Saja, the three-legged sun crow, Mae Nak's shrine, kuman thong, Nang Kwak, Phaya Nak / nāga, Garuda / Phaya Krut, kinnaree, pret, Himavanta as cosmology, chao phi, yaksha as temple guardians, tiyanak, leyak's attack on newborns, ahp's childbirth-blood hunger, ngeuak as a propitiated drowning spirit, neak ta, Rangda, Barong, Nyi Roro Kidul, the Vietnamese dragon and the Lạc dragon descent, Sơn Tinh as a Four Immortal, hamsa, makara.

Mae Nak is the hard case. The legend is the best-known Thai ghost story, Thailand already tells it as comedy in films, and there is a living shrine at Wat Mahabut where people ask for an easy birth or for a husband to avoid conscription. No pitch uses her. If the Owner ever wants one, it has to be affectionate, and it cannot use the shrine, the death, or the devotees as the joke. A 1899 newspaper claim that a son invented the ghost is a historical theory, not a license to debunk worshippers.

Chao phi, from Phya Anuman Rajadhon's 1954 essay *The Phi*, are the other hard case. He writes that phi once covered gods and devils. After Thai contact with Hinduized Khmer culture, good phi were renamed thevada, and phi narrowed toward ghost or evil spirit, without the old sense dying. Chao phi are shrine guardians. **Not every phi is a monster.**

## Motif families (for QA, not for merging)

These are related and must stay separate cards if any are made:

- Flying or split bodies: krasue (Thai, whole organs, glow, shares ground with krahang), penanggalan (Malay witch, vinegar, living by day), ahp (Khmer daytime spice-borrower in Ang Choulean's account), leyak (Bali, and not Rangda), manananggal (splits at the waist), rokurokubi / nukekubi (neck or head, Japan). Kasu is named as the Lao word on the krasue page and was **not** given its own record, because no Lao description was fetched.
- Foxes: huli jing, kitsune, gumiho. Same motif, different histories. Daji is a specific later legend, not the species.
- Guardian lions: Chinese shishi, Japanese komainu, Okinawan shisa, Vietnamese nghê. Threshold guardians, not enemies.
- Eclipse beings: bulgae (Korean fire dogs), Bakunawa (Philippine moon serpent), Minokawa (Bagobo bird), the three-legged sun crow. The crow is sacred and unused. The dogs are the world-boss pitch.
- Dragons: Chinese long (sacred, unused), jiaolong (hornless river dragon, usable), Vietnamese rồng (national symbol, unused), nāga / Phaya Nak (sacred, unused), ngeuak (Lao, dangerous counterpart, still propitiated).
- Corpses that move: jiangshi (run, or the cinema hop), pocong (Islamic shroud knots), amalanhig (failed aswang), bal-bal (banana trunk). Different religions, different jokes.
- Pelesit: the pelesit article says a cricket familiar, also called palasik. The penanggalan article lists those names with flying heads. Both claims are recorded. They are not treated as one creature. Confidence medium.

## Left out on purpose

- **Urban legends**, owned by agent 05: Kuchisake-onna (only named beside futakuchi-onna), Orang Minyak (the page dates a 1957 newspaper), Hanako-san, Teke Teke, Jangsanbeom, the Balete white lady.
- **Imugi.** No page was successfully read, so the thousand-year dragon claim was not written.
- **Phi Am.** English Wikipedia redirects the title to the medical sleep-paralysis page. The lead that came back does not describe a Thai spirit. Nothing was invented.
- **Disambiguations that are not the creature:** Singha the beer, Hongsa the Lao town, Zhulong the town/galaxy list, Leak the plumbing term, Kasu the personal-name list, Haechi except as a pointer to the xiezhi and the Seoul mascot, the starfish sense of Korean 불가사리 (a different encyclopedia article from the iron-eater).
- **Jinn.** Living Islamic theology. Not a folkloric monster for this game. No record, rather than a thin one.
- **Diwata / anito** as a grab-bag. The English diwata page is a disambiguation. Anito are ancestor and nature spirits of living indigenous practice. Not comedy material. Bakunawa's babaylan calendar is noted and not joked about.
- **Film designs:** Mr Vampire hopping, both Bulgasari films, Pee Mak, Mizuki's nurikabe, the KBS black-coat Jeoseung Saja, Gremlins (the Cantonese word mogwai is a generic demon, Sanskrit māra). Pulgasari the movie is not a source for the creature's shape. The Encyclopedia of Korean Culture says the tale-creature's form varies: pig, ant, mouse, horse, insect, and others.

## Sources

Most records use the English Wikipedia lead, or a longer extract where the lead was too thin (Mae Nak, Nue, Gumiho). Other pages fetched and used:

- Encyclopedia of Korean Culture, Academy of Korean Studies, article 불가사리 (E0024904), for the iron-eater. Not the starfish article.
- Phya Anuman Rajadhon, *The Phi*, Journal of the Siam Society, 1954, PDF at the Siam Society URL in the Kong Koi and Chao phi records. OCR of the scan is rough. Claims taken from it are only the ones that were still readable: phi versus thevada, chao phi shrines, and the one-legged kong koi that retreats from a shout.
- Katarzyna Ancuta, "Beyond the Vampire: Revamping Thai Monsters for the Urban Age", *eTropic* 16.1 (2017), for phi pop and phi krasue as living categories, possession rather than a walking corpse, and pop as often shapeless.
- Cambodianess, 20 March 2022, reporting Ang Choulean on ahp.
- Luang Prabang Culture, "Nagas and Ngeuak", a secondary site citing Ngaosrivathana and Archaimbault. Used only for the benevolent-naga versus dangerous-ngeuak contrast. Confidence medium. The named city guardians and the 1931 royal drowning are not design material.

Wikipedia is an encyclopedia summary, so confidence is **high** only when the page states the point in plain language and does not contradict itself. **Medium** means a short page, a disputed point, or a secondary site. **Low** is only Nariphon, where the page barely names the tree.

Nian is medium on purpose: the page says written creature-sources start in the early 20th century.

Jubokko is medium on purpose: the page presents the blood tree as folklore and cites yokai books, including Mizuki, without a premodern collection in the lead.

## Pitches worth drawing first

Low sensitivity, clear silhouette, not a sacred being:

1. Dish Auditor (kappa) — the bowl on the head is the whole fight.
2. Uncle Winnow (krahang) — baskets and a pestle, immediately readable in Thai.
3. Pond Inhale (berberoka) — the crab is the punchline.
4. Copy Herald (amabie) — a boss you beat by drawing.
5. Sprint Corpse (jiangshi) — the joke depends on knowing the hop and then being wrong.
6. Sickle Gust, Tub Critic, Giggle Tusk, Eclipse Kennel — normal through world, all drawable without a ritual.

Do not send to art from this pass: anything marked sensitivity high, kuman thong, toyol, tiyanak, leyak, ahp, Mae Nak, Garuda, naga, kinnaree, pret, Rangda, Barong.

## IP

Folklore names are not treated as trademarks (`protectedName: false`, `publicDomain: true` for the old story). That is not permission to trace a painting, a film frame, a shrine photo, or a woodblock. Pitches use new names. Sprint Corpse is the only pitch marked IP risk medium, because the hopping corpse is a film genre; the card is about rejecting that costume, and it still needs a human IP look before art.

## Overlap with other agents

- Agent 04 (world myth) may also file Hindu-Buddhist nāga, garuda, yaksha, kinnara, hamsa, makara, and preta from Indian sources. Records here keep the Thai, Khmer, Lao, and temple-Southeast-Asian use, and they are marked high so they are not double-designed as bosses.
- Agent 05 owns urban legends and modern pop. Gashadokuro is included only because the page calls it modern mythology and the brief's kind list has no better bucket than folklore; the note says modern. Orang Minyak was left for agent 05.
- Foxes, lions, and eclipse beasts are flagged above so QA does not merge them into one card.
