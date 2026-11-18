# Comedy Fantasy Card Game — Pixel Character Asset Starter v0.1

ชุดภาพต้นแบบตัวละคร 4 Factions + ภาพทดลองสลับอุปกรณ์หม้อทอง

## ไฟล์ภาพ

| Character ID | Faction | ภาพหลัก | ภาพทดลอง |
| --- | --- | --- | --- |
| `aegis_sir_potlid` | Aegis Dominion (Tank) | `sprites/aegis_sir_potlid_base.png` | `sprites/aegis_sir_potlid_gold_helmet.png` |
| `phantom_nox_squeak` | Phantom Blades (DPS) | `sprites/phantom_nox_squeak_base.png` | — |
| `celestial_madame_meteor` | Celestial Nexus (Magic) | `sprites/celestial_madame_meteor_base.png` | — |
| `sanctuary_sister_plaster` | Sanctuary Order (Support) | `sprites/sanctuary_sister_plaster_base.png` | — |

ภาพเป็น PNG พื้นหลังโปร่งใส **ตัวละครเต็มตัว ท่ายืนแบบภาพนิ่ง** เหมาะใช้ตรวจรูปทรงและกำหนดแนวทางศิลป์ก่อนผลิตเกมจริง

## กติกาใช้ Asset ร่วมกัน

1. **1 Character ID = 1 ตัวละคร** — เปลี่ยนอุปกรณ์/สี/สกินโดยไม่สร้าง Character ID ใหม่ เช่น `aegis_sir_potlid` ใช้หม้อเงินหรือหม้อทอง
2. **Shared Rigs** — แยกโครงหนัก (`humanoid_heavy`) กับโครงมนุษย์มาตรฐาน (`humanoid_standard`); ตัวสวมชุดคลุมใช้ layer เพิ่มจากโครงมาตรฐาน
3. **Shared Anchor Names** — ทุกตัวมี `head`, `main_hand`, `off_hand`, `back`, `body_center`, `feet`; กำหนดตำแหน่งพิกัดจริงเฉพาะของแต่ละโครงภายหลัง
4. **Reusable Equipment Slots** — `headgear`, `main_hand`, `off_hand`, `back`, `accessory`, `vfx`; อุปกรณ์หนึ่งชิ้นสามารถติดกับหลายตัวละครได้เมื่อมุมมองและโครงรองรับ
5. **Reusable Animation & VFX** — ใช้ต้นแบบจังหวะ Idle/Attack/Defend/Hit/KO ร่วมตามโครงร่าง รวมถึง slash, spark, glow, heal effect; ปรับเฉพาะการเคลื่อนไหวที่เป็นเอกลักษณ์
6. **Sprite Art vs Card Art** — Pixel sprite สำหรับฉากต่อสู้; Card Art เป็นภาพวาดละเอียดแยกไฟล์ แต่ใช้ `Character ID` เดียวกัน

## รายการที่ยังไม่เสร็จ (สำคัญ)

- ภาพทั้ง 5 เป็น **flat PNG** ยัง **ไม่ได้แยกชิ้นส่วนเป็น layered PNG**, ไม่ใช่ sprite sheet แอนิเมชัน และไม่มีพิกัด anchor ที่ทดสอบแล้ว
- ภาพหม้อทองเป็นภาพตัวละครทั้งตัวที่แก้สีหมวกหม้อเท่านั้น **ยังไม่ได้เป็นไอเทมหมวกทองแยกชั้นที่สวมทับได้จริง**
- ก่อนนำเข้าระบบเกม ควรเลือก canvas pixel-grid มาตรฐาน, แยกชั้น body/equipment, จัด pivot และตั้ง anchor ต่อ rig แล้วทดสอบเปลี่ยนหมวก/อาวุธบนหลายตัวละคร
- ยังไม่มีการล็อกสัดส่วนสไปรต์ในสนาม 4 คนหรือแอนิเมชันต่อสู้

ดูข้อมูลที่อ่านโดยระบบได้ใน `asset_manifest.json`
