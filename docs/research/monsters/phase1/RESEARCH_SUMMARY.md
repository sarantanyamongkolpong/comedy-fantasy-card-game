# Research Summary — Monster & Boss Parody Research · Phase 1

สถานะ: **PROPOSED / RESEARCH** · ยังไม่มีอะไร QA_PASSED, LOCKED หรือ OWNER_APPROVED · ไม่มีตัวเลข HP/ATK/DEF/อัตรากาชา
Branch รวม: `research/monster-phase1-int` (Draft PR เข้า `research/monster-base` เท่านั้น ห้าม merge)
รวบรวมโดย Mira · 20 พ.ย. 2026 (ICT) · Brief: `docs/research/monsters/BRIEF.md` (Owner t273u)

> **การขยายเป็น 370 ตัว: ยังไม่เริ่ม (NOT started)** — รอ Owner อนุมัติ sample 30 ตัวนี้ก่อน

## 1. ไฟล์ที่ส่งมอบ

| ไฟล์ | เนื้อหา |
|---|---|
| `Monster_Research_Phase1.xlsx` | 9 sheet ตาม brief: Master Monster Database, Normal Monsters, Elite Monsters, Mini Bosses, Main Bosses, World Bosses, Secret Bosses, Research Sources, **Duplicate & IP Risk Audit** (เปลี่ยนจาก `Duplicate / IP Risk Audit` เพราะ Excel ห้ามใช้ `/` ในชื่อ sheet) |
| `monsters.import.json` | JSON สำหรับ import เข้าเกมในอนาคต (30 records, status PROPOSED ทั้งหมด) |
| `TOP30_SHOWCASE.md` | ทั้ง 30 ตัว พร้อม visual concept, mechanic, IP, สถานะแหล่งอ้างอิง และ lore link |
| `RESEARCH_SUMMARY.md` | ไฟล์นี้ |

สร้างด้วยเครื่องมือของ agent 09 (`tools/research/monsters/*`) จาก: parody sample (06) + boss sample (07) + lore links (08 @ `2b8c543`) + QA flags (10). Validate ผ่าน: 30 records, 0 errors.

## 2. ยอดรวมต่อ research agent

| Agent | สาย | Inspirations | Pitches | URL ที่อ้าง | QA: verified / partial / blocked / unverified+error |
|---|---|---:|---:|---:|---|
| 01 | Classic RPG / JRPG | 83 | 12 | 62 | 35 / 4 / 21 / 2 |
| 02 | Western Fantasy | 113 | 12 | 120 | 78 / 3 / 37 / 2 |
| 03 | Eastern Mythology (ไทย 18) | 134 | 12 | 137 | 131 / 3 / 0 / 3 |
| 04 | World Mythology | 71 | 12 | 64–65 | 31 / 2 / 32 / 0 |
| 05 | Anime, Pop Culture, Urban & Historical Legends | 84 | 12 | 88 | 88 / 0 / 0 / 0 |
| 06 | Comedy & Parody Writer | 11 (self) | 15 sample + name bank | 24 | 22 / 0 / 2 / 0 |
| 07 | Boss Designer | — | 15 sample | 22 | 19 / 0 / 2 / 1 |
| 08 | Lore & Faction | 15 biomes, 5 origins | 30 lore links | — | — |
| 09 | Database Architect | schema + tools + tests | — | — | — |
| 10 | Research QA & IP | audit ทั้งหมด | — | — | — |
| **รวม** | | **485** (01–05) | **60** pitches + **30** sample | | |

**QA รวม (agent 10):** ตรวจ **481 URL** → **370 verified**, **111 ยังไม่ยืนยัน** (blocked 92, partial 11, unverified 6, error 2) · dead 0 · unrelated 0 · suspicious 0 → **ไม่พบแหล่งที่ปลอม**
(ยอดต่อ agent รวมกันเกิน 481 เพราะบาง URL ถูกหลาย agent อ้างร่วมกัน)
Findings: **P0 1 · P1 164 · P2 9** (P1 ส่วนใหญ่คือ host ที่บล็อกการอ่าน ไม่ใช่แหล่งปลอม)

## 3. Tier spread ของ sample 30 ตัว

| Tier | จำนวน (เป้า Phase 1) | Rarity เสนอ | ผู้ออกแบบ |
|---|---:|---|---|
| Normal Monster | 10 / 10 | N | 06 |
| Elite Monster | 5 / 5 | R | 06 |
| Mini Boss | 5 / 5 | Epic | 07 |
| Main Boss | 5 / 5 | EX | 07 |
| World Boss | 3 / 3 | EX | 07 |
| Secret / Comedy Boss | 2 / 2 | EX | 07 |
| **รวม** | **30 / 30** | | |

Humor mix: Absurd Comedy, Dark Fantasy Comedy, Satirical Fantasy, Epic but Ridiculous (ครบทั้ง 4 แบบ) · Origin (lore 08): Wild Creature, Corrupted Echo, Tower Guardian, Tower Anomaly, Aegis Dominion (1 ตัว: Spare Plate)

## 4. ตาราง IP risk (sample 30)

| ระดับ (QA heuristic) | จำนวน | รายชื่อ |
|---|---:|---|
| high | 0 | — |
| medium | 1 | **Dame Compact** (BOS-SECRET-02) — P2 |
| low | 29 | ที่เหลือทั้งหมด |

Agent ประเมินตัวเองเข้มกว่า: self-report medium 11 ตัว (Pestlehut, Ledgermaw, Switchback, Claimbite, Duty Puddle, Signfirst, Capper Crimson, Sir Verdant Gale, Captain Encore, Sir Yarncoil, Dame Compact)

**ข้อควรระวังด้านภาพ (watch, QA reviewer pass):**
- **Claimbite** / **Duty Puddle** — ได้แรงบันดาลใจจาก mimic / slime ของเกม; ภาพต้องไม่ใช่หีบสมบัติ และไม่ใช่หยดน้ำยิ้มสีเดียว
- **Captain Encore** — แพทเทิร์น masked rider; ห้ามตาแมลง มอเตอร์ไซค์ เข็มขัดลอกแบบ
- **Sir Stairweb** — ห้ามใช้สัญลักษณ์ศาสนา Akan หรือแมงมุมลายพื้นบ้านลอกแบบ
- **Sir Lotusbulk** — ห้ามล้อเลียนคัมภีร์/ศรัทธา
- **Dame Compact** — ดู P2 ด้านล่าง

## 5. P0 / P1 / P2 ที่เกี่ยวกับ sample (ติด flag ไว้ ไม่ได้แก้งานสร้างสรรค์)

| ระดับ | รายการ | การจัดการ |
|---|---|---|
| **P0** | ชื่อซ้ำ **Tub Critic** (pitch agent 03 `PITCH-03-02`) ↔ **Tubcritic** (name bank agent 06) | **ไม่อยู่ใน 30 ตัว** · ห้ามโปรโมตจนกว่าจะเลือกเหลือชื่อเดียว |
| **P1** | **M06-N-003 Pestlehut** — URL เดียว (kids.britannica.com, Baba Yaga) ตอบ 403 → **ไม่มีแหล่งที่ยืนยันได้** | flag ใน Excel/JSON · ต้องหาแหล่งที่อ่านได้ก่อน QA_PASSED |
| **P1** | **M06-N-004 Ledgermaw** — URL เดียว (britishmuseum.org schools page, Ammit) ตอบ 403 → **ไม่มีแหล่งที่ยืนยันได้** | เหมือนข้างบน |
| **P2** | **BOS-SECRET-02 Dame Compact** — IP medium: ตรง 3/4 กลุ่ม cue ของ magical girl (ตลับแปลงร่าง ชุดริบบิ้น ท่าร่างที่สอง) | **ข้อเสนอแก้:** ตัดชุดนักเรียน คทา มงกุฎ และเปลี่ยน prop ให้ไม่ใช่ตลับแปลงร่าง · รอ Owner/agent 07 |
| P1 (source) | Sir Cindervest: 1 ใน 3 URL โดนบล็อก (warcraft.wiki.gg) · 07 มี PDF 1 ไฟล์ที่ตรวจข้อความไม่ได้ | อีก 2 URL verified |
| P2 | inspiration ซ้ำข้าม agent 8 คู่ (Doppelganger, Kelpie, Lernaean Hydra, Goblin, Troll, Leshy, Spring-heeled Jack, Jersey Devil) | ต้อง merge source record ก่อนออกแบบตัวที่สองจากต้นเดียวกัน |

## 6. Lore links (agent 08 @ `2b8c543`) — ครบ 30/30

ทุกตัวมี origin, attribute, biome (ENV-TWR) และ hook — ใส่ลง Excel/JSON แล้ว โดย **ต่อท้าย** lore summary เดิมของ 06/07 (ไม่เขียนทับ) · ทั้งหมด PROPOSED, `canon: false`

**Open lore flags (ยังไม่แก้ รอ agent 07 / Owner):**
1. **CONF-07-HUNTER-WORD** — prose ของบอสทั้ง 15 ตัวเรียกผู้เล่นว่า "Hunters" แทน **Avatars** (คำใน lore ปัจจุบัน)
2. **CONF-07-DUAL-PROSE** — **Sir Cindervest**: lore เรียกเป็นทั้ง Tower Guardian และ Echo ในประโยคเดียว ขณะที่ originId = ORG-GUARD
3. **CONF-07-PRONOUN** — **Dame Dryladle**: ชื่อ Dame และ lore ใช้ "she" แต่บรรทัด phase ใช้ "him"
4. **CONF-07-ENV-FLOOD / CONF-07-ENV-SEA** — **Clerk Forkwater** (น้ำท่วม) และ **Dame Dryladle** (ทะเล) ไม่มี biome ที่ตรงใน 15 biome · ใช้ ENV-TWR-13 / ENV-TWR-10 ชั่วคราว
5. อื่นๆ: CONF-07-ROLE-SHAPE (engine loader ต้องการ faction id แต่บอส factionId = null), CONF-07-ROLE-WILD-MAGIC (Forkwater: ATTR_WILD + Magic ซึ่งเป็น role ของ Celestial Nexus), CONF-07-ENV-SCALE (Sir Lotusbulk อยู่ใน Menagerie), CONF-07-ATTR-ECHO (Zero Cabinet), CONF-06-SUMMON-WORD (Signfirst ใช้คำว่า summon — Echo Summoning ไม่ใช่ mechanic), และ biome ใช้ร่วมกัน (TWR-08, TWR-11, TWR-14) ซึ่งยอมรับได้

## 7. Sensitivity — ตัดออกโดยเจตนา (ไม่มี pitch / ไม่ส่งไปวาด)

- **03 Eastern:** Mae Nak (มีศาลจริงที่วัดมหาบุศย์), กุมารทอง, toyol, tiyanak, leyak, ahp, ครุฑ, นาค, กินรี, เปรต, Rangda, Barong — เก็บเป็นข้อมูลวิจัยเท่านั้น
- **04 World:** 14 รายการ high — Hel, Ravana, naga, ifrit, jinn, Garuda, Kali, bunyip label, Quetzalcoatl, Tuatha Dé Danann, bennu, windigo, asura, Rahu & Ketu
- **05 Anime/Pop/Legends:** 19 รายการ high เป็นคำเตือนเท่านั้น เช่น Slender Man (มีเจ้าของ ไม่ใช่ public domain), Elizabeth Báthory
- **02 Western:** succubus (ไม่ทำเนื้อหาทางเพศ) · ภาพ/ชื่อแบรนด์ D&D: beholder, mind flayer, mimic แบบหีบ, gelatinous cube → ไม่ใช้
- **01 Classic RPG:** Diablo ตัดออก · Pokémon ใช้แค่แพทเทิร์นทั่วไป · 64 รายการเป็น protected name (Square Enix, Gravity, Nexon) ห้ามใช้ชื่อ/ซิลูเอตบนการ์ด
- QA: ไม่มี sacred / tragedy / stereotype flag ใน sample 30 ตัว · Kali, Wendigo และบริบทระเบิดปรมาณูของหนังสัตว์ประหลาด ไม่ใช่เป้าของมุก

## 8. ช่องว่าง (Gaps)

- **แอฟริกา:** ไม่มี record ของ adze, tokoloshe, impundulu, asanbosam (หน้า Anansi ของ Britannica Scholars ตอบ 500)
- **โอเชียเนีย:** ไม่มี taniwha / Rainbow Serpent (Te Ara ตอบ 403)
- **เมโสอเมริกา:** มีแค่ Quetzalcoatl (high) · ยังไม่มีสัตว์ที่ไม่ใช่เทพ เช่น ahuizotl
- **Host ที่บล็อก (ตาม QA):** kids.britannica.com 22, warcraft.wiki.gg 11, maplestorywiki.net 10, en.uesp.net 8, tolkiengateway.net 8, witcher.fandom.com 6, diablo.fandom.com 5, finalfantasywiki.com 5, britannica.com 4, britishmuseum.org 4, bulbapedia 3 · อื่นๆ: Fandom ของ Chrono Trigger/Secret of Mana, dragon-quest.org timeout, sacred-texts.com, iranicaonline.org, World History Encyclopedia
- Ragnarok MVP ส่วนใหญ่ไม่มีข้อมูลรูปร่างที่มีแหล่งอ้างอิง
- บอสของ agent 07 จำนวน 7 จาก 15 ตัวไม่มี INS id (branch 01 ยังไม่ขึ้นตอน 07 ทำงาน) — 07 อ้างหน้า Wikipedia ที่ดึงเองแทน และไม่ได้สร้าง INS id ขึ้นเอง

## 9. แนะนำให้ทำภาพก่อน (Top 10 — IP ต่ำ + แหล่ง verified + ซิลูเอตชัด)

1. **Curlhorn · เขางุ้ม** (Normal) — วัวศึกที่เขาใช้ไม่ได้ เลยถอยหนีเป็นท่าโจมตี
2. **Sheetwail · ผ้าครวญ** (Normal) — ผีแจ้งข่าวตายที่ปัญหาคือมาเร็วเกิน
3. **Receiptfox · จิ้งจอกบิล** (Normal) — จิ้งจอกเจ้าเล่ห์ที่สลับชื่อในใบเสร็จ
4. **Shellmarch · กระดองขบวน** (Elite) — สัตว์หกขาหัวหน้างานเลี้ยงที่เต้นได้ท่าเดียว
5. **Stilldock · ยังไม่จอด** (Elite) — ลางร้ายเรือผีที่ปัญหาจริงคือหาที่จอดไม่ได้
6. **Clerk Claypunch · เสมียนหมัดดิน** (Mini Boss) — โกเลมเฝ้าคิวที่คิวย้ายไปแล้ว
7. **Clerk Nochin · เสมียนไร้คาง** (Mini Boss) — หน้ากากเถาเที่ยที่กัดไม่ลง
8. **Clerk Forkwater · เสมียนน้ำแยก** (Main Boss) — น้ำท่วมเก้าหัวที่เลือกท่อระบายไม่ได้
9. **Dame Dryladle · ดามกระบวยรั่ว** (World Boss) — ยักษ์ทะเลที่ขอกระบวย (ต้องแก้ pronoun ก่อน)
10. **Zero Cabinet · ตู้ศูนย์** (Secret Boss) — ตู้เกมในตำนานที่ไม่เคยมีในบัญชี การ์ดตัวเองกลายเป็น Void

## 10. คำถามเปิดสำหรับ Owner

1. อนุมัติ sample 30 ตัวนี้ (ทั้งชุด/บางส่วน) เพื่อเริ่มขยายเป็น 370 หรือไม่?
2. **Dame Compact:** รับข้อเสนอ QA (ตัดชุดนักเรียน/คทา/มงกุฎ + เปลี่ยน prop) หรือเปลี่ยนตัว Secret Boss?
3. **Pestlehut / Ledgermaw:** ให้หาแหล่งใหม่ที่อ่านได้ หรือสลับเป็นตัวอื่น?
4. **Tub Critic vs Tubcritic:** ให้ agent ไหนเก็บชื่อนี้?
5. คำเรียกผู้เล่นในบอส: แก้ "Hunters" → "Avatars" ทั้ง 15 ตัวใช่ไหม?
6. รับข้อเสนอ lore ของ 08 หรือไม่: 15 biomes (ไม่ใช่เลขชั้น — Tower floors ยัง PENDING), 5 origins, rarity default Normal N / Elite R / Mini Epic / Main-World-Secret EX
7. ต้องการ biome น้ำ/ทะเลเพิ่ม (ให้ Forkwater/Dryladle) หรือคงไว้ที่ 15?
8. บอสไม่มี faction (factionId = null) แต่ engine loader ต้องการ faction id — จะให้มี faction กลางสำหรับ monster หรือไม่ (ตอนนี้ไม่แตะ engine)
9. นโยบาย sensitivity สำหรับผีไทย/ของศักดิ์สิทธิ์ (เช่น Mae Nak, กุมารทอง, ครุฑ, นาค) — คงการตัดออกไว้ใช่ไหม?
10. ยอมให้ Normal ใช้แพทเทิร์นจากสัตว์เกมที่มีเจ้าของ (mimic/slime) โดยภาพต้องต่างชัด หรือให้เลี่ยงทั้งหมด?
11. ให้รอบขยายเติมช่องว่าง แอฟริกา/โอเชียเนีย/เมโสอเมริกา ด้วยแหล่งอื่นหรือไม่?

## 11. ข้อแนะนำสำหรับการขยายเป็น 370 (ยังไม่เริ่ม — รออนุมัติ)

- **สถานะ: NOT started.** ไม่มี agent ใดถูกสั่งให้เขียนเกิน 30 ตัว
- เมื่ออนุมัติ: ขยายเป็นรอบตาม tier (Normal 200 / Elite 60 / Mini 40 / Main 30 / World 20 / Secret 20) ทีละ batch ~40–60 ตัว แต่ละ batch ผ่าน validate (09) + QA source/IP/dedupe (10) + lore link (08) ก่อนรวม
- ใช้ pool ที่มีอยู่แล้ว: 485 inspirations + 60 pitches + name bank ของ 06 — เลือก inspiration ที่ verified ก่อน; ตัวที่แหล่งโดนบล็อกต้องหาแหล่งที่อ่านได้ก่อนใช้
- กฎเดิม: ไม่มีตัวเลข stat, ไม่เปลี่ยน core lore, ไม่แตะ battle engine/gacha/production assets, ห้ามแต่ง source, ห้ามเติม recolor/เลขต่อท้าย
- แก้ open flags ของ sample (Hunters→Avatars, pronoun, Cindervest wording, Dame Compact) ก่อนเริ่ม batch แรก เพื่อไม่ให้ต่อยอดข้อผิดพลาด
