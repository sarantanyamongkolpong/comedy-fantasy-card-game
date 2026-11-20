# MIRA — FINAL v0.5 CORE + ART INTEGRATION (PROMPT FOR NEXT ROUND)

Owner: โปเต้ (Potae)
Repository: https://github.com/sarantanyamongkolpong/comedy-fantasy-card-game
Objective: รวมงาน systems, data, UI, QA และ artwork ทั้งชุดให้เป็นเกมเว็บที่เล่นจบลูปจริง บนมือถือแนวนอน พร้อม preview และหลักฐาน QA

## A. Source of truth / รอบนี้ใช้ข้อมูลล่าสุด

1. อ่านไฟล์ v0.5 ใน Draft PR #15 และเอกสาร brief ทั้งหมดก่อน แยกสถานะ LOCKED / PROPOSED / PENDING ตามต้นฉบับ ห้ามยกระดับโดยอนุมานเอง
2. ตรวจสถานะ PR/branch จริงใหม่ทั้งหมดก่อน merge; ข้อมูลเดิมที่รู้: #16 Data+Gacha+Save, #18 Battle Engine, #19 Web UI, #17 Archive Art Phase 1, QA PR อาจมีเลขใหม่, และ branch `core/v05-playable` ที่เคยทดลองรวมบางสายแล้ว ห้ามถือว่ารวมกับ main สำเร็จเอง
3. Art Phase 2 (42 PNG): https://drive.google.com/drive/folders/1LCdV2X5mVBjef1hRP78rA-kp7yKjjBjJ ; ZIP https://drive.google.com/file/d/109rfRf_MmgfR5yI4p1UnU4uOvxpw6uYZ/view
4. Art Phase 3 (24 PNG + 27 SVG = 51 visual assets): https://drive.google.com/drive/folders/1bxFSm4mUDCqI3I43m1xXrU-rezi7thm5 ; อ่าน `ASSET_MANIFEST.json`, `README_HANDOFF.md`, `MIRA_PHASE3_HANDOFF.md` จาก ZIP ของชุดนี้
5. งาน Battle/Prep ฉากล่าสุดของ Mira เป็นตัวหลัก (สนามเรืองแสงสองฝั่งและห้องเตรียมตัว) ใช้ภาพที่ Mira ผลิตและเจ้าของกำลังตรวจ ไม่ใช้ฉาก Tower Arena ของ Dream ซ้อนกัน; เก็บ Dream Tower Arena เป็นฉากทางเลือกสำหรับด่านอื่น

## B. Merge plan

1. ทำ read-only audit ก่อน: PR status, current SHAs, test counts, unresolved conflicts, save migration, image provenance, asset IDs, duplicated files.
2. สร้าง integration branch ใหม่จาก base ที่ตรวจว่าเหมาะสมจริง แล้วรวมเฉพาะ changeset ที่ยังไม่อยู่ใน branch นั้น; ห้าม merge ซ้ำหรือ cherry-pick ซ้ำ
3. แยกงานเป็น parallel streams ถ้าปลอดภัย: (i) data/schema/save/gacha, (ii) battle engine, (iii) web/mobile layout, (iv) art/performance, (v) QA/E2E. กำหนดเจ้าของไฟล์และ PR ต่อสายเพื่อไม่ให้แก้ทับกัน
4. PR #9 เป็นงาน art เก่าที่เคยยังไม่ได้อนุมัติ: อย่า auto-merge; ถ้าจำเป็นต้องใช้ส่วนใดให้ระบุและขอการยืนยันแยก มิฉะนั้นดำเนินงานอื่นต่อได้
5. เก็บทุก integration เป็น Draft PR จนกว่ารัน E2E และเจ้าของตรวจภาพใน preview แล้ว จึงขออนุมัติ merge main/production ชัดเจน

## C. Game flow ที่ต้องเล่นได้จริง

Home → Hideout → Stash/Inventory → Deck Builder (30 cards) → Prep Battle → Battle (AP5, starting hand5, Draw/Discard/Void, Active+Passive, statuses) → Victory/Defeat → Rewards → Save/Load → Gacha/Upgrade → กลับ Hideout

- รักษา ID/ข้อมูลเก่าด้วย migration ที่ย้อนกลับได้, `legacy.pow` เมื่อแปลงเป็น ATK; ไม่ทำลายเซฟเดิม
- กาชามี 3 pools Avatar / Action / Companion; pity แยกตาม banner; ไม่ invent Equipment banner
- กลุ่ม Justin 4 ตัวมีภาพการ์ดอ้างอิงที่เจ้าของอนุมัติ และ artwork จะต้องผูกตัวละครให้ถูก ID; ห้ามเปลี่ยนชื่อ/ID เดิมโดยพลการ
- Active Skill ล่าสุดที่เจ้าของสั่ง: `All teammates Regen +3 — 2 Turns`; ตรวจ mapping ว่าเป็นของตัวละครใดใน sheet/code ก่อน apply
- ค่า Damage, HP, SPD aggregation, Sync และกติกา 5×2 บางส่วนเคยอยู่สถานะ PROPOSED/PENDING; ไม่ล็อกเป็นกฎถาวรโดยไม่มีหลักฐานอนุมัติ

## D. Art integration / UI

1. Phase 1: ภาพ Justin, โลก/ตึก และกรอบการ์ดห้าระดับเป็นแหล่งต้นฉบับเดิม; Phase 2: บ้าน 6 ระดับ, เฟอร์นิเจอร์ 3 ชิ้น, Action Art 6 แบบ, ไอเทม 8, ศัตรู 4, VFX4, กาชา+Companion. Phase 3: Inventory/Bag, เฟอร์นิเจอร์ 7, VFX6, Shop/Rewards, SVG เมนูปุ่ม/ไอคอน 27 ชิ้น
2. ภาพทุกชิ้นต้องอ้างผ่าน manifest/file path, แยกชั้น background / prop / character / visual effect / HTML controls. ห้าม flatten ทั้งเกมเป็นภาพเดียว
3. Phase 3 มี PNG กรอบ Inventory 4 ชิ้นที่ขอบสีฟุ้งและถูกปัก `REVIEW_FIX_NEEDED`: **ใช้ SVG precision alternatives ใน `ui_vector/` แทน**; อย่ารับ PNG เหล่านั้นว่า Production-ready
4. SVG Buttons ไม่มีข้อความฝัง; render label, count, click, focus/hover/pressed/disabled ผ่าน CSS/DOM. ต้องมี hit target ใหญ่พอสำหรับนิ้วบนมือถือ
5. หน้า Battle/Prep ให้ใช้ภาพจาก Mira ที่มีอัญมณี AP 5 เม็ด, กรอบทอง, HP boss/character, floating damage/heal, ปุ่ม END TURN หรู ๆ และการ์ดจริง ไม่ใช่ PLACEHOLDER. ฝ่ายเราอยู่ซ้ายตามสนามล่าสุดของ Mira; อย่ากลับฝั่งเองโดยไม่อัปเดตตำแหน่ง
6. ที่ UI กระเป๋า ให้มี grid, filter/sort, stack count, detail, item action, scrolling, closing/back และคุมไม่ให้ tooltip บังปุ่ม. บ้านอัปเกรดขั้น Cabin→Bungalow→Cottage→Loft→Villa→Penthouse; stash capacity ขึ้นกับเฟอร์นิเจอร์ที่ติดตั้ง ไม่ใช่ขั้นบ้านโดยตรง
7. Shopping Mall / Rewards ใช้ backdrop และ cutout แยก ชำระเงิน/ของรางวัลเป็นข้อมูลจริงจาก engine ไม่ใช่ตัวเลขในภาพ
8. ใช้ไฟล์ PNG ต้นฉบับเป็น master, export WebP สาย deploy, lazy-load ภาพนอกหน้าจอและตั้ง image budget ที่วัดได้ แผนที่โลกต้อง scale ทั้งฉาก/จุดกดตามสัดส่วนเดิม; เติมขอบแทนการยืด

## E. QA & deliverables

- CI unit tests Node 20/22 ต้องผ่านทั้งหมด และรายงานจำนวนผ่าน/ไม่ผ่านจริง
- Playwright real-user E2E: 844×390 landscape และ 16:9/20:9 ที่มีความกว้างต่างกัน; เช็ก mall top clip, การ์ดในมือทับตัวละคร, ปุ่มกดทะลุฉาก, animation feedback, all images loading, no layout overflow
- ทดสอบ Win/Lose/rewards, save/load/migration, gacha pity, inventory stack capacity, furniture placement, deck validation, status Regen 2 turns, back/cancel without cost
- มี screenshot เปรียบเทียบ ref กับ build จริง, performance waterfall/bytes, all asset mapping report, missing Action card art by card ID, decision log และ Draft PR รวม
- ส่ง playable preview link หรือ standalone HTML ที่เปิดได้โดยไม่ต้องติดตั้ง พร้อม QA evidence; owner จะตรวจและสั่ง merge production อีกครั้ง

### STOP CONDITIONS

อย่ารับรองว่า GENERATED_REVIEW = approved; อย่า merge PR #9 โดยอัตโนมัติ; อย่าแอบแก้ PENDING ให้กลายเป็น LOCKED; อย่า deploy/merge main เองขณะยังไม่มี owner acceptance. ถ้างานบางสายติดขัด ให้ทำสายอื่นต่อและรายงาน blocker ตามความจริงค่ะ
