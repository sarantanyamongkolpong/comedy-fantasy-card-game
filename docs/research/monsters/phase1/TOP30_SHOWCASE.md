# Top 30 Showcase — Monster & Boss Parody Research Phase 1

สถานะทุกตัว: **PROPOSED** (การตัดสินใจ Owner t282u = OWNER_DECIDED · ไม่มี QA_PASSED / LOCKED) · ไม่มีตัวเลข HP/ATK/DEF · Rarity เป็นข้อเสนอเท่านั้น ไม่ใช่อัตรากาชา · 30 ตัวนี้อนุมัติให้ *ตรวจทาน* เท่านั้น ยังไม่ขยายเป็น 370

รวบรวมโดย Mira จาก branch `research/monster-phase1-int` (agent 06 = Normal/Elite, agent 07 = Bosses, QA = agent 10). ข้อความ concept/mechanic/visual ยกมาจากไฟล์ของ agent (ภาษาอังกฤษ) · Owner t282u: บอสทั้ง 15 ใช้คำว่า Avatars แทน Hunters แล้ว · IP risk ใช้ผล QA heuristic ของ agent 10 และแสดงค่าที่ agent ประเมินตัวเองไว้ในวงเล็บ

รหัส: `Agent ID` คือรหัสในไฟล์ agent, `MON ID` คือรหัส canonical ที่เครื่องมือ agent 09 แปลงให้ (ใช้ใน Excel/JSON)

| Tier | จำนวน | Rarity (proposed) |
|---|---:|---|
| Normal | 10 | N |
| Elite | 5 | R |
| Mini Boss | 5 | Epic |
| Main Boss | 5 | EX |
| World Boss | 3 | EX |
| Secret / Comedy Boss | 2 | EX |
| **รวม** | **30** | |

## ตารางสรุป 30 ตัว

| # | Agent ID | MON ID | Name (EN) | ชื่อไทย | Tier | Rarity | Inspiration | IP risk QA (agent) | Source |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | M06-N-001 | MON-NRM-0001 | Curlhorn | เขางุ้ม | Normal | N | Bonnacon | low (low) | ✅ verified |
| 2 | M06-N-002 | MON-NRM-0002 | Sheetwail | ผ้าครวญ | Normal | N | Banshee | low (low) | ✅ verified |
| 3 | M06-N-003 | MON-NRM-0003 | Pestlehut | กระท่อมครก | Normal | N | Baba Yaga | low (medium) | ⛔ blocked (403) |
| 4 | M06-N-004 | MON-NRM-0004 | Ledgermaw | ปากบัญชี | Normal | N | Ammit | low (medium) | ⛔ blocked (403) |
| 5 | M06-N-005 | MON-NRM-0005 | Claimbite | กัดใบรับ | Normal | N | Mimic (Dungeons & Dragons) | low (medium) | ✅ verified |
| 6 | M06-N-006 | MON-NRM-0006 | Duty Puddle | แอ่งเข้าเวร | Normal | N | Slime (Dragon Quest) | low (medium) | ✅ verified |
| 7 | M06-N-007 | MON-NRM-0007 | Spillguard | ยามหก | Normal | N | Kappa (河童) | low (low) | ✅ verified |
| 8 | M06-N-008 | MON-NRM-0008 | Receiptfox | จิ้งจอกบิล | Normal | N | Kitsune (狐) | low (low) | ✅ verified, ✅ verified |
| 9 | M06-N-009 | MON-NRM-0009 | Signfirst | เซ็นก่อน | Normal | N | Isekai | low (medium) | ✅ verified |
| 10 | M06-N-010 | MON-NRM-0010 | Zipperhide | ซิปค้าง | Normal | N | Tokusatsu suitmation | low (low) | ✅ verified |
| 11 | M06-E-001 | MON-ELT-0001 | Shellmarch | กระดองขบวน | Elite | R | Tarasque | low (low) | ✅ verified |
| 12 | M06-E-002 | MON-ELT-0002 | Switchback | วัวกลับทาง | Elite | R | Minotaur (Minotauros) | low (medium) | ✅ verified |
| 13 | M06-E-003 | MON-ELT-0003 | Spare Plate | เกราะสำรอง | Elite | R | Animated object | low (low) | ✅ verified |
| 14 | M06-E-004 | MON-ELT-0004 | Hornstamp | เขาลงเวลา | Elite | R | Oni (鬼) | low (low) | ✅ verified |
| 15 | M06-E-005 | MON-ELT-0005 | Stilldock | ยังไม่จอด | Elite | R | Flying Dutchman | low (low) | ✅ verified |
| 16 | BOS-MIN-01 | MON-MNB-0001 | Clerk Claypunch | เสมียนหมัดดิน | Mini Boss | Epic | The clay golem of Jewish folklore, later included in fantasy role-playing games | low (low) | ✅ verified |
| 17 | BOS-MIN-02 | MON-MNB-0002 | Capper Crimson | หมวกชาด | Mini Boss | Epic | The redcap (powrie) of Anglo-Scottish border folklore | low (medium) | ✅ verified |
| 18 | BOS-MIN-03 | MON-MNB-0003 | Clerk Nochin | เสมียนไร้คาง | Mini Boss | Epic | The taotie, a bronze-mask creature counted among the Four Perils | low (low) | ✅ verified |
| 19 | BOS-MIN-04 | MON-MNB-0004 | Dame Glasspeck | ดามกระจก | Mini Boss | Epic | The cockatrice of medieval European bestiary tradition | low (low) | ✅ verified |
| 20 | BOS-MIN-05 | MON-MNB-0005 | Auditor Leapwell | ผู้ตรวจส้นสปริง | Mini Boss | Epic | Spring-heeled Jack, a Victorian English urban legend | low (low) | ✅ verified |
| 21 | BOS-MAIN-01 | MON-MJB-0001 | Sir Cindervest | เซอร์เสื้อกั๊กเถ้า | Main Boss | EX | The treasure-guarding dragon as the pattern of the first video-game boss, the Gold Dragon… | low (low) | ✅ verified, ⛔ blocked (403), ✅ verified |
| 22 | BOS-MAIN-02 | MON-MJB-0002 | Sir Verdant Gale | เซอร์พายุเขียว | Main Boss | EX | The Green Knight of the 14th-century poem Sir Gawain and the Green Knight | low (medium) | ✅ verified |
| 23 | BOS-MAIN-03 | MON-MJB-0003 | Clerk Forkwater | เสมียนน้ำแยก | Main Boss | EX | Xiangliu (Xiangyao), the nine-headed flood serpent of the Classic of Mountains and Seas | low (low) | ✅ verified |
| 24 | BOS-MAIN-04 | MON-MJB-0004 | Sir Stairweb | เซอร์ใยบันได | Main Boss | EX | Anansi, the spider of Akan folklore, broker of stories | low (low) | ✅ verified |
| 25 | BOS-MAIN-05 | MON-MJB-0005 | Captain Encore | กัปตันอีกรอบ | Main Boss | EX | The transforming masked rider of the Kamen Rider franchise, as a genre pattern, not as… | low (medium) | ✅ verified, ✅ verified |
| 26 | BOS-WORLD-01 | MON-WLB-0001 | Sir Yarncoil | เซอร์ขดด้าย | World Boss | EX | Jörmungandr, the Midgard Serpent of Norse mythology | low (medium) | ✅ verified |
| 27 | BOS-WORLD-02 | MON-WLB-0002 | Dame Dryladle | ดามกระบวยรั่ว | World Boss | EX | Umibōzu, the giant black sea figure of Japanese folklore who demands a ladle | low (low) | ✅ verified |
| 28 | BOS-WORLD-03 | MON-WLB-0003 | Sir Lotusbulk | เซอร์ทุ่งบัว | World Boss | EX | Behemoth, the beast described in Job 40 | low (low) | ✅ verified |
| 29 | BOS-SECRET-01 | MON-SCB-0001 | Zero Cabinet | ตู้ศูนย์ | Secret / Comedy Boss | EX | Polybius, the urban legend of a 1981 arcade cabinet that left no evidence | low (low) | ✅ verified, ✅ verified, ✅ verified |
| 30 | BOS-SECRET-02 | MON-SCB-0002 | Dame Compact | ดามตลับ | Secret / Comedy Boss | EX | The magical-girl transformation, from the compact in the 1966 Sally the Witch lineage and… | medium (medium) | ✅ verified |

## Normal

### 1. Curlhorn · เขางุ้ม  (`M06-N-001` / `MON-NRM-0001`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Bonnacon
- **Concept:** Epic but ridiculous: a war-beast entrance that the anatomy cancels. The menagerie treats the scorch line as a janitorial incident and the bull treats it as a tactical withdrawal.
- **Visual concept:** A rust-brown bull with a black horse mane and horns that curl back into its own pride. It paws the straw like a charger.
- **Lore link (agent 08, PROPOSED):** Wild Creature · ENV-TWR-08 The Menagerie of Unfiled Beasts · Curlhorn is a wild bull the Menagerie of Unfiled Beasts filed as a war-beast. The horns refuse the charge, and no faction has claimed the embarrassment.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Bonnacon>

### 2. Sheetwail · ผ้าครวญ  (`M06-N-002` / `MON-NRM-0002`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Banshee
- **Concept:** Dark fantasy comedy: the silhouette is a death-warning, and the errand is that she is early. The infirmary treats the wail as a drill and she treats the drill as a failure of gratitude.
- **Visual concept:** A standing bedsheet of steam with a woman's mouth opened in the linen and wet thread for hair. No pointed ears, no armor, no funeral mound.
- **Lore link (agent 08, PROPOSED):** Corrupted Echo · ENV-TWR-06 The Infirmary of Too Much Care · Sheetwail is a corrupted echo who clocks into the Infirmary of Too Much Care before anyone is hurt. The wail is help that will not wait, and the Sanctuary Order does not employ her.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Banshee>

### 3. Pestlehut · กระท่อมครก  (`M06-N-003` / `MON-NRM-0003`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Baba Yaga
- **Concept:** Absurd comedy: the house is the monster, and the rule is that it spins. The joke is architecture with a commute, told straight.
- **Visual concept:** A small wooden hut on bird legs, spinning in indoor rain. A pestle stands in the roof like a chimney.
- **Lore link (agent 08, PROPOSED):** Tower Anomaly · ENV-TWR-11 The Roof Garden of Indoor Weather · Pestlehut is the Roof Garden's spinning hut, a tower anomaly that offers shelter and then turns the door away. It hands out no quest.
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ⛔ blocked (403) <https://kids.britannica.com/scholars/article/Baba-Yaga/11585>
- **QA flag:** **P1 — ไม่มีแหล่งที่ยืนยันได้** (URL เดียวโดน 403)

### 4. Ledgermaw · ปากบัญชี  (`M06-N-004` / `MON-NRM-0004`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Ammit
- **Concept:** Dark fantasy comedy: the body is frightening and the appetite is a bad sum. The joke lands on bookkeeping, not on the fate of the dead and not on anyone's faith.
- **Visual concept:** Crocodile head, lion forelegs, hippo hindquarters, in an archive apron and a clerk's visor. It eats a paper slip.
- **Lore link (agent 08, PROPOSED):** Corrupted Echo · ENV-TWR-12 The Archive of Unfinished Legends · Ledgermaw is a misfiled legend clerking in the Archive of Unfinished Legends, hungry only for a sum that does not match. The bite is paper, and the archive still judges no one's life.
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ⛔ blocked (403) <https://www.britishmuseum.org/learn/schools/ages-7-11/ancient-egypt/ancient-egyptian-gods-and-goddesses>
- **QA flag:** **P1 — ไม่มีแหล่งที่ยืนยันได้** (URL เดียวโดน 403)

### 5. Claimbite · กัดใบรับ  (`M06-N-005` / `MON-NRM-0005`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Mimic (Dungeons & Dragons)
- **Concept:** Satirical fantasy: the dungeon ambush has become a lost-and-found desk. The joke is the form, not a surprise chest.
- **Visual concept:** A stack of unclaimed suitcases in the lobby, one handle hinged like a jaw, luggage tags for teeth. Not a wooden treasure chest, not a tongue, not a stonework door.
- **Lore link (agent 08, PROPOSED):** Tower Anomaly · ENV-TWR-01 The Lobby of Lost Badges · Claimbite is unclaimed luggage in the Lobby of Lost Badges that started checking tickets. It is a tower anomaly, and the lobby's lost-and-found is not a hoard.
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Mimic_(Dungeons_%26_Dragons)>

### 6. Duty Puddle · แอ่งเข้าเวร  (`M06-N-006` / `MON-NRM-0006`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Slime (Dragon Quest)
- **Concept:** Absurd comedy: the weak common blob returned as the janitor's spill and takes the job seriously. The rule is consistent.
- **Visual concept:** A bucket's worth of grey wash-water on pantry tile, a mop handle stuck through it like a spine, a paper shift-tag floating on top. Not a teardrop, not a smile, not one bright color, not onion-shaped.
- **Lore link (agent 08, PROPOSED):** Tower Anomaly · ENV-TWR-02 The Pantry of Living Leftovers · Duty Puddle is wash-water that took a shift on the Pantry of Living Leftovers and treats a footstep as more work. No faction claims the puddle.
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Slime_(Dragon_Quest)>

### 7. Spillguard · ยามหก  (`M06-N-007` / `MON-NRM-0007`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Kappa (河童)
- **Concept:** Absurd comedy: a lifeguard whose authority is a bowl balanced on the head, stationed where the rain only falls on the plants. It blows the whistle at the weather.
- **Visual concept:** A small webbed humanlike with a shell under a yellowed raincoat and a dish of water set into a lifeguard cap. A whistle.
- **Lore link (agent 08, PROPOSED):** Wild Creature · ENV-TWR-11 The Roof Garden of Indoor Weather · Spillguard is a wild creature who assigned itself to the Roof Garden's indoor puddles and loses authority whenever it bows. The water is the place it stands.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Kappa_(folklore)>

### 8. Receiptfox · จิ้งจอกบิล  (`M06-N-008` / `MON-NRM-0008`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Kitsune (狐)
- **Concept:** Satirical fantasy: a fox spirit's trick is filing two buyers under each other's names. The gift shop sells endings that have not happened yet.
- **Visual concept:** An ordinary fox in a gift-shop apron. One tail is a roll of receipt paper.
- **Lore link (agent 08, PROPOSED):** Wild Creature · ENV-TWR-15 The Gift Shop of the Conquered · Receiptfox is a wild fox at the Gift Shop of the Conquered, bewitching the ledger instead of the hero. That shop is not the Shopping Mall, and the fox founds no shrine.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Kitsune>; ✅ verified <https://en.wikipedia.org/wiki/Bake-danuki>

### 9. Signfirst · เซ็นก่อน  (`M06-N-009` / `MON-NRM-0009`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Isekai
- **Concept:** Satirical fantasy: another-world importance is real, and the visitor log is more real. No series hero is being quoted or costumed.
- **Visual concept:** A short traveler's cloak over a body that is only a smudged badge photo, holding a prophecy scroll that stays blank. No spiky hair, no signature sword, no vehicle, no slime.
- **Lore link (agent 08, PROPOSED):** Corrupted Echo · ENV-TWR-01 The Lobby of Lost Badges · Signfirst is a corrupted echo stuck in the Lobby of Lost Badges because the arrival will not count until the log is signed. That desk joke leaves Real People and Echo hybrid Avatars undefined. · open flags: CONF-06-SUMMON-WORD
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Isekai>

### 10. Zipperhide · ซิปค้าง  (`M06-N-010` / `MON-NRM-0010`)

- **Tier / Rarity (proposed):** Normal / N
- **Inspiration:** Tokusatsu suitmation
- **Concept:** Dark fantasy comedy: the shape is frightening in the doorway, and then the elbow is a person. The joke is affectionate toward a filming technique, not toward the audience.
- **Visual concept:** A person-sized original beast suit, somewhere between a bird and a teapot, magnificent until the shoulder. One zipper is stuck.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-08 The Menagerie of Unfiled Beasts · Zipperhide is the Menagerie's hired suit, a guardian pose that cannot take the first step until the zipper moves. The eight named people stay out of the costume.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Tokusatsu>


## Elite

### 11. Shellmarch · กระดองขบวน  (`M06-E-001` / `MON-ELT-0001`)

- **Tier / Rarity (proposed):** Elite / R
- **Inspiration:** Tarasque
- **Concept:** Epic but ridiculous: a six-legged feast marshal stuck on the ballroom's one dance. The grandeur is real.
- **Visual concept:** Lion head, six bear-clawed feet, a turtle shell worn like a bass drum, and a serpent tail keeping a ribbon in time. Bunting, not blood.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-09 The Ballroom Stuck on One Dance · Shellmarch guards the Ballroom Stuck on One Dance by marching a parade that outranks the fight. The shell is a tower pose, with no town behind it and no faction banner on it.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Tarasque>

### 12. Switchback · วัวกลับทาง  (`M06-E-002` / `MON-ELT-0002`)

- **Tier / Rarity (proposed):** Elite / R
- **Inspiration:** Minotaur (Minotauros)
- **Concept:** Absurd comedy with an elite silhouette: the labyrinth has been replaced by a lift, and the only true instruction is a U-turn. Hunger and tribute are not on the card.
- **Visual concept:** A human body in an elevator-operator uniform and a bull's head, holding a wooden paddle that only points back. No axe, no bare-chested film costume, no maze carved on the skin.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-13 The Service Elevator Between Moods · Switchback keeps the Service Elevator Between Moods and treats the way you just came as the correct way. One car, one paddle, and no kingdom attached.
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://www.theoi.com/Ther/Minotauros.html>

### 13. Spare Plate · เกราะสำรอง  (`M06-E-003` / `MON-ELT-0003`)

- **Tier / Rarity (proposed):** Elite / R
- **Inspiration:** Animated object
- **Concept:** Epic but ridiculous, in Aegis colors: bracing and stalling, worn as objects that do not fit. It does not found a kingdom and it is not either of the faction's two locked people.
- **Visual concept:** An empty suit of plate where every piece is a size off. The helm fits a mood rather than a head.
- **Lore link (agent 08, PROPOSED):** Faction-aligned · ENV-TWR-03 The Armory of Wrong Sizes · Spare Plate wears Aegis Dominion's Tank joke and nothing else: empty armor of the wrong size, on duty in the Armory of Wrong Sizes. The armory is not that faction's capital, and the plate is neither Sir Potlid nor Justin Case.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Animated_object>

### 14. Hornstamp · เขาลงเวลา  (`M06-E-004` / `MON-ELT-0004`)

- **Tier / Rarity (proposed):** Elite / R
- **Inspiration:** Oni (鬼)
- **Concept:** Satirical fantasy at elite scale: the punisher's club became a time clock. Strength is still obvious.
- **Visual concept:** A huge ink-blue figure with one pair of horns and an iron club whose head is a rubber date-stamp. Lanyard, folding chair, no tiger-skin loincloth, no feast.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-10 The Basement of Retired Bosses · Hornstamp keeps a chair in the Basement of Retired Bosses and prosecutes lateness with one heavy stamp. The pose is a tower guardian's, and the basement is not a previous game's canon.
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Oni>

### 15. Stilldock · ยังไม่จอด  (`M06-E-005` / `MON-ELT-0005`)

- **Tier / Rarity (proposed):** Elite / R
- **Inspiration:** Flying Dutchman
- **Concept:** Epic but ridiculous: a portent of doom whose actual problem is parking. The ship fills the landing the way a boss would, and then it asks someone to take a letter.
- **Visual concept:** A small fluyt-like cargo ship of fog and lobby velvet, lantern lit, stuck half through a doorway as if the throne landing were a harbor. Letters in bottles addressed to people who are already in the room.
- **Lore link (agent 08, PROPOSED):** Corrupted Echo · ENV-TWR-14 The Throne Landing of Maybe · Stilldock is a corrupted echo that mistook the Throne Landing of Maybe for a harbor and is still about to arrive. An elite on that landing leaves the floors unnumbered. · open flags: CONF-SHARED-TWR-14
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Flying_Dutchman>


## Mini Boss

### 16. Clerk Claypunch · เสมียนหมัดดิน  (`BOS-MIN-01` / `MON-MNB-0001`)

- **Boss Title:** Warden of Lost Tickets / ผู้พิทักษ์ตั๋วหาย
- **Tier / Rarity (proposed):** Mini Boss / Epic
- **Inspiration:** The clay golem of Jewish folklore, later included in fantasy role-playing games
- **Concept:** Absurd comedy. The tower's lost-ticket golem was told to guard the queue, and he has been guarding it since the queue moved upstairs.
- **Visual concept:** A barrel-chested clerk baked from ticket-clay, thumbs like stamps, a paper waistcoat cracked at the folds. A blank sticky note sits on the forehead where a sacred word would have been.
- **Signature Mechanic:** Shield plus Taunt on his DEF card. The three stub seats exist at match start and do not Taunt.
- **Signature Silhouette:** Wide clay torso, no neck, a hard square on the forehead, three small lumps at his heels.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-01 The Lobby of Lost Badges · Clerk Claypunch is a tower guardian kneaded under the Lobby of Lost Badges, still blocking a queue that moved upstairs. He holds a Tank-shaped post and stays outside Aegis Dominion. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Golem>

### 17. Capper Crimson · หมวกชาด  (`BOS-MIN-02` / `MON-MNB-0002`)

- **Boss Title:** Knight of the Unset Cap / อัศวินหมวกที่สีไม่ติด
- **Tier / Rarity (proposed):** Mini Boss / Epic
- **Inspiration:** The redcap (powrie) of Anglo-Scottish border folklore
- **Concept:** Dark-fantasy comedy, softened. The legend dyes a cap in violence.
- **Visual concept:** Short and thickset, iron boots too heavy for the stair, a pikestaff used as a dye rack. The cap is tower-vermilion and will not set: pink drips run into grey.
- **Signature Mechanic:** ATK plus a chance on-attack bonus_damage, and a Taunt on a separate short DEF or Skill so the boot-stamp is a tell. AUTO can play both a hit and a taunt.
- **Signature Silhouette:** Wide short body, oversized boots, a pike cutting a diagonal, a soft cap shape at the tip.
- **Lore link (agent 08, PROPOSED):** Corrupted Echo · ENV-TWR-03 The Armory of Wrong Sizes · Capper Crimson is a corrupted echo in the Armory of Wrong Sizes, furious that the cap will not stay the right red. He stands outside the four factions and still hits like a striker. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Redcap>

### 18. Clerk Nochin · เสมียนไร้คาง  (`BOS-MIN-03` / `MON-MNB-0003`)

- **Boss Title:** Mask of the Unfinished Bite / หน้ากากที่กัดไม่ลง
- **Tier / Rarity (proposed):** Mini Boss / Epic
- **Inspiration:** The taotie, a bronze-mask creature counted among the Four Perils
- **Concept:** Epic but ridiculous. The pantry door wears a bronze face that was cast to watch a meal, and the casting forgot the chin.
- **Visual concept:** A door-sized symmetrical bronze face, raised eyes, no lower jaw, ring handles where ears would be. Three rivet-echoes share the other seats and do not speak.
- **Signature Mechanic:** Shield plus Taunt on the DEF card. The bite is a later ATK with no Taunt.
- **Signature Silhouette:** Wide symmetrical face, two eye-ridges, a hard gap under the mouth, ring handles as side circles.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-02 The Pantry of Living Leftovers · Clerk Nochin is the pantry door itself, a tower guardian who announces a bite the missing jaw cannot finish. The Pantry of Living Leftovers keeps the bowl, and no new room was opened for him. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Taotie>

### 19. Dame Glasspeck · ดามกระจก  (`BOS-MIN-04` / `MON-MNB-0004`)

- **Boss Title:** The Ledger Hen / แม่ไก่สมุดบัญชี
- **Tier / Rarity (proposed):** Mini Boss / Epic
- **Inspiration:** The cockatrice of medieval European bestiary tradition
- **Concept:** Satirical fantasy. Her death-darting eye has been reassigned to accounts payable.
- **Visual concept:** A hen-sized head with a clerk's visor, wattles stamped like wax seals, a short serpent body and two scaled legs. She holds a hand mirror the way other clerks hold a date stamp.
- **Signature Mechanic:** Self Taunt Skill with no damage, plus a possible turn-start DEF buff. The other seats are ledger-stands that only DEF.
- **Signature Silhouette:** Comb and beak over a low serpent coil, mirror disk separated from the body by a gap of background.
- **Lore link (agent 08, PROPOSED):** Tower Anomaly · ENV-TWR-07 The Mirror Well · Dame Glasspeck is a tower anomaly at the Mirror Well who rejects a form by looking at it. The glance is a tell, and she is not a member of Celestial Nexus. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Cockatrice>

### 20. Auditor Leapwell · ผู้ตรวจส้นสปริง  (`BOS-MIN-05` / `MON-MNB-0005`)

- **Boss Title:** Night-Shift Bounder / ผู้กระโดดกะดึก
- **Tier / Rarity (proposed):** Mini Boss / Epic
- **Inspiration:** Spring-heeled Jack, a Victorian English urban legend
- **Concept:** Epic but ridiculous. The terror of the Victorian alley has a clipboard and a route of balconies to audit before dawn.
- **Visual concept:** Tall, thin, a gentleman's cloak over a night-auditor's sash, spring heels visible under the hem, a blue lantern instead of flaming breath. The face is a polite half-mask with round red lenses.
- **Signature Mechanic:** next_attack Skill, then ATK. Optional draw for the report card.
- **Signature Silhouette:** Narrow cloak, two coils under the feet, a lantern held out so the arm makes a gap.
- **Lore link (agent 08, PROPOSED):** Tower Anomaly · ENV-TWR-04 The Corridor of Uninvited Footsteps · Auditor Leapwell is a tower anomaly auditing the Corridor of Uninvited Footsteps from one balcony above the conversation. The leap is the tell, and Phantom Blades does not employ him. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Spring-heeled_Jack>


## Main Boss

### 21. Sir Cindervest · เซอร์เสื้อกั๊กเถ้า  (`BOS-MAIN-01` / `MON-MJB-0001`)

- **Boss Title:** Hoard Accountant / นักบัญชีขุมทรัพย์
- **Tier / Rarity (proposed):** Main Boss / EX
- **Inspiration:** The treasure-guarding dragon as the pattern of the first video-game boss, the Gold Dragon of dnd (1975)
- **Concept:** Epic but ridiculous. The climax dragon of a dungeon is doing the audit the tower postponed.
- **Visual concept:** A long dragon in a scorched waistcoat, abacus beads along the wing-bone, receipts speared on the horns. The hoard is paper, not coins.
- **Signature Mechanic:** Ally Shield while three receipt-echo seats live. All_Enemies ATK as the breath once he spends a next_attack or simply plays the ATK card.
- **Signature Silhouette:** Seated dragon, waistcoat as the bulky torso, horns carrying horizontal paper flags, one wing raised so the abacus reads as a rake.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-05 The Observatory of Bad Math · Sir Cindervest guards a receipt vault in the Observatory of Bad Math, a dragon outline around a book that will not close. The title is a comedy rank, the ash is paint, and Aegis Dominion does not knight him. · open flags: CONF-07-DUAL-PROSE, CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Boss_(video_games)>; ⛔ blocked (403) <https://digitalcommons.liu.edu/cgi/viewcontent.cgi?article=1042&context=post_honors_theses>; ✅ verified <https://www.gamedeveloper.com/design/building-better-bosses>

### 22. Sir Verdant Gale · เซอร์พายุเขียว  (`BOS-MAIN-02` / `MON-MJB-0002`)

- **Boss Title:** Knight of the Hatbox Head / อัศวินหัวในกล่องหมวก
- **Tier / Rarity (proposed):** Main Boss / EX
- **Inspiration:** The Green Knight of the 14th-century poem Sir Gawain and the Green Knight
- **Concept:** Epic but ridiculous. The beheading game has been rewritten as a challenge you may accept, and he keeps his head in formal storage.
- **Visual concept:** Half again the height of a portrait, green armor and a bush of a beard, a tower wreath of green receipts instead of holly, a beheading axe, and a hatbox on a chain. The head’s place is the box, not a severed prop in the hand.
- **Signature Mechanic:** Taunt plus Regen on the body seat. Two feint DEF cards, then an ATK.
- **Signature Silhouette:** Oversized green man, axe clear of the body, round wreath, rectangular box at the hip.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-14 The Throne Landing of Maybe · Sir Verdant Gale is a tower guardian at the Throne Landing of Maybe who offers one honest blow and keeps the head in a hatbox. He is not an Aegis knight, and that landing is still not a locked last floor. · open flags: CONF-07-ROLE-SHAPE, CONF-SHARED-TWR-14
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Green_Knight>

### 23. Clerk Forkwater · เสมียนน้ำแยก  (`BOS-MAIN-03` / `MON-MJB-0003`)

- **Boss Title:** The Flood That Will Not Pick a Gutter / น้ำท่วมที่เลือกท่อไม่ได้
- **Tier / Rarity (proposed):** Main Boss / EX
- **Inspiration:** Xiangliu (Xiangyao), the nine-headed flood serpent of the Classic of Mountains and Seas
- **Concept:** Epic but ridiculous. The tower's indoor rain hired a clerk with too many faces, and each face stamped a different floor.
- **Visual concept:** One coiled body in the boss seat. Nine small faces clustered on a single neck, the older woodcut stack, not a fan of hydra necks.
- **Signature Mechanic:** Direction seats Taunt. Body Shield.
- **Signature Silhouette:** A low coil, a cluster of small heads on one neck, three arrow boards at different heights.
- **Lore link (agent 08, PROPOSED):** Wild Creature · ENV-TWR-13 The Service Elevator Between Moods · Clerk Forkwater is a wild creature coiled in the Service Elevator Between Moods because the heads will not agree which way the water leaves. The elevator's indecision carries that joke, and no flood biome was added. · open flags: CONF-07-ENV-FLOOD, CONF-07-ROLE-WILD-MAGIC
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Xiangliu>

### 24. Sir Stairweb · เซอร์ใยบันได  (`BOS-MAIN-04` / `MON-MJB-0004`)

- **Boss Title:** Story-Broker of the Stair / นายหน้าเรื่องเล่าแห่งบันได
- **Tier / Rarity (proposed):** Main Boss / EX
- **Inspiration:** Anansi, the spider of Akan folklore, broker of stories
- **Concept:** Satirical fantasy. The broker of all stories has set up on a landing and charges rent in attention.
- **Visual concept:** A tall spider with a human smile and a clerk’s cuffs, a quill in one limb, webs strung along the stair like filing lines. The web is also his shield-art.
- **Signature Mechanic:** Own-Discard retrieve with an explicit card-id permit, plus Shield as the web, plus Taunt once the shield pose ends. Draw may support the retelling.
- **Signature Silhouette:** Limb spread wider than the stair, quill breaking the outline, abdomen like a sealed jar of thread.
- **Lore link (agent 08, PROPOSED):** Wild Creature · ENV-TWR-12 The Archive of Unfinished Legends · Sir Stairweb is a wild spider brokering stories on the Archive of Unfinished Legends stair and charging rent in being heard twice. He retells his own anecdote, and Celestial Nexus does not license him. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Anansi>

### 25. Captain Encore · กัปตันอีกรอบ  (`BOS-MAIN-05` / `MON-MJB-0005`)

- **Boss Title:** Rival Who Announces His Form / คู่ปรับผู้ประกาศร่าง
- **Tier / Rarity (proposed):** Main Boss / EX
- **Inspiration:** The transforming masked rider of the Kamen Rider franchise, as a genre pattern, not as any one rider
- **Concept:** Epic but ridiculous. He thinks the Avatar party is his destined rival and will not throw the punch until the landing has heard the name of the form.
- **Visual concept:** A tower usher in a short cape who slams a time-clock belt and shouts. The visor is a megaphone, not an insect helmet.
- **Signature Mechanic:** next_attack Skill named as the announcement, then ATK. Optional turn-start self ATK buff.
- **Signature Silhouette:** Megaphone visor as the primary mass, rectangular belt, scarf cutting away from the body.
- **Lore link (agent 08, PROPOSED):** Corrupted Echo · ENV-TWR-09 The Ballroom Stuck on One Dance · Captain Encore is a corrupted echo on the Ballroom Stuck on One Dance balcony who will not strike until the landing has heard the form-name. Phantom Blades does not own the shout. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Kamen_Rider>; ✅ verified <https://en.wikipedia.org/wiki/Kamen_Riders>


## World Boss

### 26. Sir Yarncoil · เซอร์ขดด้าย  (`BOS-WORLD-01` / `MON-WLB-0001`)

- **Boss Title:** Waist of the Unfinished Tower / เอวหอคอยที่ยังไม่เสร็จ
- **Tier / Rarity (proposed):** World Boss / EX
- **Inspiration:** Jörmungandr, the Midgard Serpent of Norse mythology
- **Concept:** Absurd comedy at epic scale. The world serpent is trying to finish the tower's waist measurement, and the Avatars are standing in the number.
- **Visual concept:** A serpent of tape and scale buckled around the tower's unfinished waist. One end is a clasp biting the other.
- **Signature Mechanic:** Clasp Taunt. Segment Shield and Regen on allies.
- **Signature Silhouette:** A ring bigger than one portrait, clasp as the only asymmetry.
- **Lore link (agent 08, PROPOSED):** Tower Anomaly · ENV-TWR-11 The Roof Garden of Indoor Weather · Sir Yarncoil is a tower anomaly belted around the Roof Garden of Indoor Weather, still trying to measure the Mysterious Tower's waist. Letting the clasp go makes a hallway again, and it starts no doom and no quest. · open flags: CONF-07-ROLE-SHAPE, CONF-SHARED-TWR-11
- **IP risk:** QA = low · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/J%C3%B6rmungandr>

### 27. Dame Dryladle · ดามกระบวยรั่ว  (`BOS-WORLD-02` / `MON-WLB-0002`)

- **Boss Title:** The Giant Who Asked for a Ladle / ยักษ์ที่ขอกระบวย
- **Tier / Rarity (proposed):** World Boss / EX
- **Inspiration:** Umibōzu, the giant black sea figure of Japanese folklore who demands a ladle
- **Concept:** Epic but ridiculous at world scale. A giant asks the cellar for a ladle, and the only ladle in the building already has a hole.
- **Visual concept:** Only the upper body fits in the frame, black, wider than the doorway, a wooden ladle with the bottom already punched out held forward like a seal. Three small spoons with no bowls share the other seats.
- **Signature Mechanic:** Taunt on the demand. Scoop is an ATK.
- **Signature Silhouette:** Upper body only, black bulk wider than the frame, a ladle held forward as a circle with a bright hole.
- **Lore link (agent 08, PROPOSED):** Wild Creature · ENV-TWR-10 The Basement of Retired Bosses · Dame Dryladle is a wild giant in the Basement of Retired Bosses, asking for a ladle that already has a hole. She is not one of the retired bosses, and the fifteen biomes include no sea, so the open ceiling does the work. · open flags: CONF-07-ENV-SEA, CONF-07-PRONOUN, CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Umib%C5%8Dzu>

### 28. Sir Lotusbulk · เซอร์ทุ่งบัว  (`BOS-WORLD-03` / `MON-WLB-0003`)

- **Boss Title:** Unhookable Beast of the Dock / อสูรท่าขนของที่เบ็ดไม่ติด
- **Tier / Rarity (proposed):** World Boss / EX
- **Inspiration:** Behemoth, the beast described in Job 40
- **Concept:** Epic but ridiculous. The primeval beast of the reed bed has made a bed of packing paper and will not be winched.
- **Visual concept:** A hippo-shouldered, ox-heavy beast lying across the loading dock, tail a bundle of packing tubes stood up like a cedar, hide stitched with bronze-colored strapping. He eats flattened cardboard the way the verse says grass.
- **Signature Mechanic:** Snout Taunt. Body Shield.
- **Signature Silhouette:** A horizontal mass wider than four portraits, a vertical bundle tail, a snout with no ring.
- **Lore link (agent 08, PROPOSED):** Wild Creature · ENV-TWR-08 The Menagerie of Unfiled Beasts · Sir Lotusbulk is a wild beast asleep on packing paper in the Menagerie of Unfiled Beasts, too courteous to be winched. The dock is a prop in that pen, and he is not an Aegis tank. · open flags: CONF-07-ENV-SCALE, CONF-07-ROLE-SHAPE, CONF-SHARED-TWR-08
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Behemoth>


## Secret / Comedy Boss

### 29. Zero Cabinet · ตู้ศูนย์  (`BOS-SECRET-01` / `MON-SCB-0001`)

- **Boss Title:** The Game Never Stocked / เกมที่ไม่มีในบัญชี
- **Tier / Rarity (proposed):** Secret / Comedy Boss / EX
- **Inspiration:** Polybius, the urban legend of a 1981 arcade cabinet that left no evidence
- **Concept:** Absurd comedy. The secret boss is a product that does not exist, charging a form instead of a coin, and winning by being unlisted.
- **Visual concept:** A matte-black cabinet that was never in the catalog, coin slot replaced by a form-feeder, screen showing a boot word and then a boss plate. Four tiny reels behind the glass are the other seats.
- **Signature Mechanic:** Own cards resolve to Void. Skill retrieves one permitted card from own Void.
- **Signature Silhouette:** A pure upright rectangle, taller than a human boss, one bright screen, one chute.
- **Lore link (agent 08, PROPOSED):** Tower Anomaly · ENV-TWR-15 The Gift Shop of the Conquered · Zero Cabinet is an unlisted tower anomaly in the Gift Shop of the Conquered, a game the directory never stocked. Missing the door does not gate the tower, and the Void it boots from is the card pile. · open flags: CONF-07-ATTR-ECHO, CONF-07-ROLE-SHAPE
- **IP risk:** QA = low · agent self-report = low
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Polybius_(urban_legend)>; ✅ verified <https://en.wikipedia.org/wiki/Boss_(video_games)>; ✅ verified <https://www.gamedeveloper.com/design/building-better-bosses>

### 30. Dame Compact · ดามตลับ  (`BOS-SECRET-02` / `MON-SCB-0002`)

- **Boss Title:** She Who Transforms Into the Fine / ผู้แปลงร่างเป็นค่าปรับ
- **Tier / Rarity (proposed):** Secret / Comedy Boss / EX
- **Inspiration:** The magical-girl transformation, from the compact in the 1966 Sally the Witch lineage and the transforming heroine pattern later popularized in the 1990s
- **Concept:** Epic but ridiculous. She was posted to bless the landing and, because nobody stayed for the oath, the transformation completed into the problem.
- **Visual concept:** Before the change: a tower usher in a plain coat, holding a round brass fine-stamp on a short handle. After: a ribbon comet of a robe, the same face, the fine-stamp now a heavy seal hung on a cord at the throat.
- **Signature Mechanic:** Early cards: Regen on allies. Speech Skill: next_attack plus self ATK buff, with ribbon seats Taunting.
- **Signature Silhouette:** Primary characteristic is the round stamp face, present before and after, the way a clarity note keeps a champion's key shape through a skin.
- **Lore link (agent 08, PROPOSED):** Tower Guardian · ENV-TWR-06 The Infirmary of Too Much Care · Dame Compact is an optional tower guardian on a hidden landing of the Infirmary of Too Much Care, and skipping her oath turns the blessing into the fine. The tower can be climbed without her, and Sanctuary Order does not post her. · open flags: CONF-07-ROLE-SHAPE
- **IP risk:** QA = medium · agent self-report = medium
- **Source status:** ✅ verified <https://en.wikipedia.org/wiki/Magical_girl>
- **QA flag:** **P2 — IP medium → QA fix applied, pending re-review** (Owner t282u)
- **การแก้ (OWNER_DECIDED t282u):** ใช้วิธีของ QA แล้ว — prop เปลี่ยนจากตลับแปลงร่างเป็นตราประทับค่าปรับทองเหลือง (brass fine-stamp) และไม่มีชุดนักเรียน คทา มงกุฎ · id และชื่อเดิม · รอ QA re-review


## นอก Sample

- **Tub Critic / Tubcritic** — ชื่อซ้ำระหว่าง pitch agent 03 (`PITCH-03-02`) กับ name bank agent 06 (`M06-NB-054`). **ไม่อยู่ใน 30 ตัวนี้** · OWNER_DECIDED t282u: ชื่อเป็นของ agent 03 (เสนอก่อน) · `M06-NB-054` ต้องตั้งชื่อใหม่ (ดู NAME_OWNERSHIP.md)

