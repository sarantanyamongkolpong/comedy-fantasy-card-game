# Dream v0.2 → game slot mapping (PROPOSED)

Status: **PROPOSED**. This is not wired. Every row needs Owner/Mira review before a wiring PR.
Sources read: `web/assets-manifest.json` @ `origin/core/v05-playable-wire` (75 assets) and `content/v05/**` @ `origin/core/v05-data` (house tiers, FUR_REF furniture, ENM_DEMO enemies, ACT_* action cards, gacha banners).
Rules: existing `asset_id` / Character / data IDs are kept unchanged. New entries are **additive only**, with `review_status: GENERATED_REVIEW` and an optimized WebP derivative. Gameplay is unchanged: no data `Asset_Ref`, stat, cost or rate edits.

## Summary

| Bucket | Count | Meaning |
|---|---|---|
| A. Existing manifest slot (swap path, keep asset_id) | **6** | the 6 house tiers |
| B. Existing game/data ID or screen, needs a NEW manifest entry | **24** | furniture, action art, enemies, gacha, interior, VFX, currency |
| C. ALTERNATE only (not default) | **1** | `tower_battle_arena` |
| D. UNMATCHED (no data ID/slot today) | **11** | boss, 2 action arts, 4 items, 3 companions, slash VFX |
| **Total** | **42** | |

## A. Existing manifest slots (direct swap, SVG placeholder → WebP)

| Dream asset | Existing asset_id (slot `house`) | subject_id / data id |
|---|---|---|
| house_cabin | HOU_TIER_CABIN | cabin (tier 1, HOME-01 LOCKED) |
| house_bungalow | HOU_TIER_BUNGALOW | bungalow (tier 2) |
| house_cottage | HOU_TIER_COTTAGE | cottage (tier 3) |
| house_loft | HOU_TIER_LOFT | loft (tier 4) |
| house_villa | HOU_TIER_VILLA | villa (tier 5) |
| house_penthouse | HOU_TIER_PENTHOUSE | penthouse (tier 6). Check top-edge safe margin (bbox y=3). |

The Home map pin keeps `MAP_BLD_HIDEOUT` and its mapPlacement anchor. A house tier is a visual swap; capacity still comes from installed furniture.

## B. Existing data ID or screen, new manifest entry (proposed IDs)

| Dream asset | Proposed new asset_id / slot | Binds to existing ID | Note |
|---|---|---|---|
| furniture_card_box | FUR_ART_BOX / `furniture` | FUR_REF_BUNGALOW_BOX, FUR_REF_COTTAGE_BOX ("Box", 50) | one art for both Box refs |
| furniture_tall_cabinet | FUR_ART_TALL_CABINET / `furniture` | FUR_REF_LOFT_TALL_CABINET; also proposed for FUR_REF_PENTHOUSE_LARGE_TALL_CABINET | "Large" variant has no own art; reuse until Dream draws one |
| furniture_display_counter | FUR_ART_DISPLAY_COUNTER / `furniture` | FUR_REF_VILLA_DISPLAY_COUNTER | |
| furniture_card_box_icon | ICO_FUR_BOX / `inventory-icon` | same as above | Stash/Mall icon |
| furniture_tall_cabinet_icon | ICO_FUR_TALL_CABINET / `inventory-icon` | same as above | |
| furniture_display_counter_icon | ICO_FUR_DISPLAY_COUNTER / `inventory-icon` | same as above | |
| action_slash | ILLUST_ACT_GEN_ATK_001 / `illustration` | ACT_GEN_ATK_001 (ATK, "Placeholder Jab") | 2:3 portrait art in a 164×128 window, needs a focal crop |
| action_heavy_strike | ILLUST_ACT_GEN_ATK_002 / `illustration` | ACT_GEN_ATK_002 (ATK, "Placeholder Smash") | same crop note |
| action_guard | ILLUST_ACT_GEN_DEF_001 / `illustration` | ACT_GEN_DEF_001 (DEF, "Placeholder Guard") | |
| action_barrier | ILLUST_ACT_GEN_DEF_002 / `illustration` | ACT_GEN_DEF_002 (DEF, "Placeholder Bulwark") | |
| enemy_security_skeleton | SPRITE_ENM_DEMO_001 / `battle-sprite` | ENM_DEMO_001 (Tank) | role-fit guess; faces RIGHT side per mirrored layout |
| enemy_clipboard_goblin | SPRITE_ENM_DEMO_002 / `battle-sprite` | ENM_DEMO_002 (DPS) | role-fit guess |
| enemy_salary_slime | SPRITE_ENM_DEMO_003 / `battle-sprite` | ENM_DEMO_003 (Magic) | role-fit guess. ENM_DEMO_004 (Support) has no art; keeps the current fallback. |
| gacha_machine_avatar | GACHA_MACHINE_AVATAR / `gacha-machine` | banner pool `avatar` | 3 pools only (Avatar/Action/Companion) |
| gacha_machine_action | GACHA_MACHINE_ACTION / `gacha-machine` | banner pool `action` | |
| gacha_machine_companion | GACHA_MACHINE_COMPANION / `gacha-machine` | banner pool `companion` | |
| gacha_reveal_epic | VFX_REVEAL_EPIC / `gacha-vfx` | rarity Epic | static overlay |
| gacha_reveal_ex | VFX_REVEAL_EX / `gacha-vfx` | rarity EX (also FAC?) | P2: needs edge mask (full-frame haze). Using it for FAC is an Owner/visual choice. |
| gacha_hall_background | BG_GACHA / `bg-gacha` | Gacha screen (`web/js/screens/gacha.js`) | backdrop only, machines layered on top |
| interior_cabin | BG_HIDEOUT_CABIN / `bg-hideout` | house tier `cabin`; Home/Hideout screen | only Cabin has an interior; other tiers fall back to it |
| item_g_coin | ICO_CURRENCY_G / `ui-icon` | G currency (v05_Gacha "shared G currency") | |
| vfx_shield | VFX_STATUS_SHIELD / `battle-vfx` | status `shield` (ICO_STATUS_SHIELD stays the HUD icon) | overlay, does not replace the icon |
| vfx_regen | VFX_STATUS_REGEN / `battle-vfx` | status `regen` (ICO_STATUS_REGEN stays) | |
| vfx_ko | VFX_KO / `battle-vfx` | `ko` (ICO_KO stays) | |

## C. ALTERNATE only

| Dream asset | Proposed asset_id | Rule |
|---|---|---|
| tower_battle_arena | BG_BATTLE_ALT_TOWER / `bg-battle` (alternate, `default:false`) | Mira's `bg_battle_arena_v01` (slot bg_battle) and `bg_prep_battle_v01` (slot bg_prep) stay **default**. Do not stack it over them. It could later be used for a Mysterious Tower encounter, but only if the Owner picks that. |

## D. UNMATCHED (kept in the archive, not wired)

| Dream asset | Why unmatched | Possible future home (Owner decision) |
|---|---|---|
| boss_office_dragon | no boss/enemy data ID | future boss encounter |
| action_regen | no starter card is an all-ally Regen; it depicts Justina Moment (her Active Skill "All teammates Regen +3, 2 Turns" lives on the avatar, not an Action card) | keep for skill splash / future card |
| action_draw | no Draw action card in starter data | future draw card |
| item_promotion_stone | no item ID in v05 data | promotion system (not in MVP) |
| item_synthesis_crystal | no item ID (Hero Synthesis uses duplicates, not a crystal) | not in MVP |
| item_loot_chest | no item ID | optional candidate for existing `ILLUST_REWARDS` (screen-art) if the Owner likes it; not proposed as default |
| item_companion_gift | no item ID | companion system later |
| companion_messenger_owl | no companion data IDs | optional candidate for the generic `ILLUST_COMPANION` |
| companion_lucky_cat | no companion data IDs | same |
| companion_baby_dragon | no companion data IDs | same |
| vfx_slash | no status ID; it is a generic ATK hit | could be a generic hit overlay `VFX_HIT_ATK` |

## Open points for Owner/Mira (not blocking the archive PR)

1. Enemy role assignments in B are visual guesses. The ENM_DEMO enemies carry faction IDs; the Dream art is not faction-coded.
2. Action art crop: portrait 2:3 into the landscape card window. Pick a focal crop, or change the card layout (layout change = Owner).
3. Using one tall-cabinet art for the Penthouse "Large Tall Cabinet" ref.
4. Whether `gacha_reveal_ex` also covers FAC.
