# QA report — final/qa

Owner order t265u. Stream D. Base `integration/v05-final` @ `db4d3e8` (engine AUTO contract and the pending reward payload), rebased under `final/qa`. The acceptance suite below was run on `62df5e0`. This file is the commit after that.

No merge, no force-push, no deploy. PR #9 was not touched. hunter-life was not touched. `GENERATED_REVIEW` is not an approval. Nothing PENDING or PROPOSED was marked LOCKED.

## Totals

`npm run test:acceptance` (no pipe). Exit code **1** on both Node versions. Status **FAIL**. FAIL is not PASS. The 3 todos would make the run INCOMPLETE even if the failures were fixed.

| Node | pass | fail | todo | skip | discovered |
|---|---:|---:|---:|---:|---:|
| v22.23.4 | 107 | 5 | 3 | 0 | 115 |
| v20.20.2 | 107 | 5 | 3 | 0 | 115 |

The nested regression suite inside that run passed (the historical 187-test baseline).

Failures, both Nodes:

1. `QA-10 real-engine Deck Battle Rewards win and lose` — web `createMatch` view has no `sides` and no `state`.
2. `QA-10 full loop at 844x390` — Stash **Back** is outside the viewport.
3. `QA-10 full loop at 667x375` — Stash **Back** is outside the viewport.
4. `QA-10 full loop at 915x412` — **Save** is outside the viewport, after Rewards.
5. `QA-10 full loop at 1280x720` — **Save** is outside the viewport, after Rewards.

Todos, both Nodes:

- `OWNER-PLAT-04` world-map anchor test still looks for `layoutWorldMap` in `web/src/map/`. The landed module is `web/js/map-layout.js` (`buildingHotspots`, `designSize`). The building-box and scale checks that use that module pass.
- `QA-10 map layout export is the OWNER-PLAT-04 hook` — same missing export.
- `QA-10 e2e smoke Deck Battle Rewards` — `@playwright/test` is not installed. The full loop uses `playwright-core` plus system Chrome and did run.

On a GitHub runner with no `playwright-core` and no Chrome, the four viewport tests become one todo instead of four failures. The web-view failure still fails the job.

## The eight failures from the dry run

Dry run on the pre-engine tree was 99 pass / 8 fail / 2 todo. Classification against `docs/engine/HANDOFF.md` at `db4d3e8`:

| Failure | Class | What the suite does now |
|---|---|---|
| AUTO-01..04 `UNKNOWN_SIDE` | Test bug | `chooseAutoActions(state, sideId)` and `runAutoTurn(state, sideId, opts)` get `'player'` or `state.activeSideId`. `playEnemyTurn(state)` takes no side. `opts.shouldStop` is the third argument. Passing `{ seed, auto }` still throws `UNKNOWN_SIDE`. There is no `state.auto`. These four pass. |
| QA-10 win/lose outcome shape | Product bug, web | `web/js/engine-session.js` `createMatch` returns a view (`engine`, `units`, `phase`) with neither `sides` nor `state`. The engine match itself is fine. The test requires the adapter to return the match or `{ state }`. It stays red. Web owns the fix on `final/web`. |
| QA-10 gacha banner `.length` | Test bug | The adapter returns `results`. Banners are legal `src/gacha` states. The test accepts `pulls` or `results`. Passes. |
| QA-10 gacha seed string | Test bug at the engine boundary | `src/gacha` `pull` still throws on a raw string. `engine-session.js` passes `hashSeed(options.seed)`. The booth still formats `gacha:${bannerId}:…`. That string never reaches `src/gacha`. See P2. |
| QA-10 save round-trip | Test bug | Team and deck come back on `profile` inside the web bundle, and they match across a second reload. Passes. |

AUTO-01 also checks the decided outcome: a player wipe is `winnerSideId: 'player'` and `verdict.player: 'victory'`; an enemy wipe is `winnerSideId: 'enemy'` and `verdict.player: 'defeat'`. `rewards.timesEmitted` stays 1. `payload.G`, `payload.loot`, and `payload.items` are null with status `PENDING_OWNER`. AUTO-04 checks a `state.log` damage floater (`amount`, `dealt`, `delta === -dealt`, `avatarId`, `sideId`).

## P0 / P1 / P2

### P0

None. No rule was locked by inference, and the engine AUTO path finishes seeded matches.

### P1

1. **Web match view hides the engine match.** `createMatch` from the web adapter does not expose `sides` or `state`, so Deck → Battle → Rewards cannot be driven as an engine match. `getOutcome(view)` already returns the engine outcome. Unwrapping `view.engine` belongs to the web adapter (`final/web`). Acceptance stays failed on purpose.
2. **Landscape controls sit outside the viewport.** Measured in Chrome against `web/dist/playable.html` (built by `node web/tools/build-single-html`, not committed). A control fails when fewer than 44px of it are visible.
   - 915×412 and 1280×720: Home → Stash → Deck → Map → Prep → Battle AUTO → Rewards completed inside the 120s cap, with no page errors. **Save** is then off screen, so Load, Gacha, and the return to Hideout were not clicked.
   - 844×390 and 667×375: Stash opens, then **Back** is off screen, so Deck, Map, and Battle were not reached on those sizes.
   - At 1280×720 the stage fills the viewport and the page does not scroll. Save, Load, and the Cabin–Penthouse chips start below y=720. Web owns the layout on `final/web`.

### P2

- The gacha booth still builds a string seed. The adapter hashes it before `src/gacha`. Direct `pull` of that string still throws.
- Reward payload `G` / `loot` / `items` are null, `PENDING_OWNER`. That is the engine contract, not a grant.
- Phase 2 left 9 source files unbound (below). `ENM_DEMO_004` has no battle sprite. `boss_office_dragon.png` is one of the nine.
- Ten action cards have no illustration (below). Bound action art is `GENERATED_REVIEW`, not approved.
- Phase 3 (51 files) is in `art_source/dream_v03` with `integration_status: NOT_INTEGRATED`. None of it is in `web/assets-manifest.json`. Four inventory PNGs are `REVIEW_FIX_NEEDED`; the SVG stand-ins in `ui_vector/` are the ones to bind.
- `layoutWorldMap` was never exported. Map scale and building boxes are already tested through `web/js/map-layout.js` and `web/js/stage.js`.
- Damage formula, HP, HOME-11, mall prices, and loot amounts stay `PENDING_OWNER`. SYNC stays `REJECTED` (t261u). AUTO policy stays `PROPOSED`. Upgrade stays blocked by design.

## CI

`.github/workflows/v05-acceptance.yml` runs `npm run test:acceptance` with no pipe. `tools/ci/acceptance-status.mjs` uses `spawnSync` and `process.exit(1)` when the status is FAIL or the child status is non-zero. Confirmed locally: exit 1 on Node 20.20.2 and Node 22.23.4.

The job matrix is Node **20** and **22** (`fail-fast: false`). It runs on push to `core/v05-*`, `integration/v05-*`, and `final/*`, and on pull requests into `integration/v05-core-base`, `integration/v05-final`, and `core/v05-playable`.

`quality-gates.yml` still runs `node --test` on Node 20 and 22 for every non-main push. Its per-version step uses `continue-on-error` so both versions run, then the job checks the result. That is not a hidden pipe.

## Playwright

`tests/e2e/v05-full-loop.playwright.test.js` builds the single-file page and walks Home (The Hideout) → Stash → Deck → Map → Prep → Battle AUTO → Rewards → Save/Load → Gacha → Hideout at 844×390, 667×375, 915×412, and 1280×720. It records page errors and controls with under 44px visible. AUTO delay is set to 0. Rewards must appear within 120s. The assertion is not relaxed: the four runs fail as listed under P1. The generated HTML is deleted from the commit; `web/dist` is excluded from the source image scan so the inlined data URIs are not treated as authored web files.

## Action cards missing art

Starter deck `content/v05/actions/starter-actions.json` (14 cards). Bound art is `GENERATED_REVIEW`.

| card | name | art |
|---|---|---|
| ACT_GEN_ATK_001 | Placeholder Jab | `ILLUST_ACT_GEN_ATK_001` → `action_slash.webp` |
| ACT_GEN_ATK_002 | Placeholder Smash | `ILLUST_ACT_GEN_ATK_002` → `action_heavy_strike.webp` |
| ACT_GEN_DEF_001 | Placeholder Guard | `ILLUST_ACT_GEN_DEF_001` → `action_guard.webp` |
| ACT_GEN_DEF_002 | Placeholder Bulwark | `ILLUST_ACT_GEN_DEF_002` → `action_barrier.webp` |
| ACT_GEN_SKILL_001 | Placeholder Spark | missing |
| ACT_GEN_SKILL_002 | Placeholder Anthem | missing |
| ACT_FAC_AEG_001 | Placeholder Aegis Wall | missing |
| ACT_FAC_AEG_002 | Placeholder Aegis Taunt | missing |
| ACT_FAC_PHA_001 | Placeholder Phantom Cut | missing |
| ACT_FAC_PHA_002 | Placeholder Phantom Rush | missing |
| ACT_FAC_CEL_001 | Placeholder Star Bolt | missing |
| ACT_FAC_CEL_002 | Placeholder Arcane Poke | missing |
| ACT_FAC_SAN_001 | Placeholder Saving Ping | missing |
| ACT_FAC_SAN_002 | Placeholder Sanctuary Ward | missing |

Phase 2 `action_regen.png` and `action_draw.png` are not bound to those missing card ids. They stay unbound until someone assigns them.

## Unbound list

### Phase 2 source files with no `web/assets-manifest.json` slot

From `art/dream-v02-drop` `ASSET_MANIFEST.json` (42 PNGs). 33 are bound as WebP. These 9 are not:

- `items_cards/item_promotion_stone.png`
- `items_cards/item_synthesis_crystal.png`
- `items_cards/item_companion_gift.png`
- `items_cards/action_regen.png`
- `items_cards/action_draw.png`
- `combat/boss_office_dragon.png`
- `combat/vfx_slash.png`
- `gacha_companions/companion_messenger_owl.png`
- `gacha_companions/companion_baby_dragon.png`

`ENM_DEMO_001`–`003` have sprites. `ENM_DEMO_004` does not.

### Phase 3, entire pack unbound

`art_source/dream_v03/ASSET_MANIFEST.json`: 51 files, `integration_status: NOT_INTEGRATED`, `status: GENERATED_REVIEW`. Not in the web manifest.

- `inventory_room_background` `inventory_ui/inventory_room_background.png` background
- `inventory_backpack` `inventory_ui/inventory_backpack.png` cutout
- `inventory_slot_frame` `inventory_ui/inventory_slot_frame.png` REVIEW_FIX_NEEDED
- `inventory_item_detail_panel` `inventory_ui/inventory_item_detail_panel.png` REVIEW_FIX_NEEDED
- `inventory_category_tab_frame` `inventory_ui/inventory_category_tab_frame.png` REVIEW_FIX_NEEDED
- `inventory_tooltip_frame` `inventory_ui/inventory_tooltip_frame.png` REVIEW_FIX_NEEDED
- `furniture_companion_bed` `furniture/furniture_companion_bed.png` cutout
- `furniture_trophy_shelf` `furniture/furniture_trophy_shelf.png` cutout
- `furniture_bookcase` `furniture/furniture_bookcase.png` cutout
- `furniture_magic_workbench` `furniture/furniture_magic_workbench.png` cutout
- `furniture_wardrobe` `furniture/furniture_wardrobe.png` cutout
- `furniture_cozy_sofa` `furniture/furniture_cozy_sofa.png` cutout
- `furniture_ornate_storage_chest` `furniture/furniture_ornate_storage_chest.png` cutout
- `vfx_taunt` `vfx/vfx_taunt.png` static_overlay
- `vfx_critical_hit` `vfx/vfx_critical_hit.png` static_overlay
- `vfx_card_draw` `vfx/vfx_card_draw.png` static_overlay
- `vfx_card_discard` `vfx/vfx_card_discard.png` static_overlay
- `vfx_card_upgrade` `vfx/vfx_card_upgrade.png` static_overlay
- `vfx_reward_coin_burst` `vfx/vfx_reward_coin_burst.png` static_overlay
- `shopping_mall_interior` `shop_rewards/shopping_mall_interior.png` background
- `shopkeeper_merchant` `shop_rewards/shopkeeper_merchant.png` cutout
- `shopping_counter` `shop_rewards/shopping_counter.png` cutout
- `reward_room_background` `shop_rewards/reward_room_background.png` background
- `reward_treasure_open` `shop_rewards/reward_treasure_open.png` cutout
- `button_primary` `ui_vector/button_primary.svg` empty_button
- `button_secondary` `ui_vector/button_secondary.svg` empty_button
- `button_danger` `ui_vector/button_danger.svg` empty_button
- `button_disabled` `ui_vector/button_disabled.svg` empty_button
- `button_ghost` `ui_vector/button_ghost.svg` empty_button
- `button_small` `ui_vector/button_small.svg` empty_button
- `button_icon_square` `ui_vector/button_icon_square.svg` empty_button
- `tab_selected` `ui_vector/tab_selected.svg` empty_tab
- `tab_unselected` `ui_vector/tab_unselected.svg` empty_tab
- `popup_panel` `ui_vector/popup_panel.svg` empty_panel
- `toast_panel` `ui_vector/toast_panel.svg` empty_panel
- `icon_bag` `ui_vector/icon_bag.svg` menu_icon
- `icon_deck` `ui_vector/icon_deck.svg` menu_icon
- `icon_home` `ui_vector/icon_home.svg` menu_icon
- `icon_gacha` `ui_vector/icon_gacha.svg` menu_icon
- `icon_map` `ui_vector/icon_map.svg` menu_icon
- `icon_shop` `ui_vector/icon_shop.svg` menu_icon
- `icon_companion` `ui_vector/icon_companion.svg` menu_icon
- `icon_settings` `ui_vector/icon_settings.svg` menu_icon
- `icon_close` `ui_vector/icon_close.svg` menu_icon
- `icon_back` `ui_vector/icon_back.svg` menu_icon
- `icon_sort` `ui_vector/icon_sort.svg` menu_icon
- `icon_filter` `ui_vector/icon_filter.svg` menu_icon
- `inventory_slot_frame_vector` `ui_vector/inventory_slot_frame.svg` precision_inventory_frame
- `inventory_item_detail_panel_vector` `ui_vector/inventory_item_detail_panel.svg` precision_inventory_frame
- `inventory_category_tab_frame_vector` `ui_vector/inventory_category_tab_frame.svg` precision_inventory_frame
- `inventory_tooltip_frame_vector` `ui_vector/inventory_tooltip_frame.svg` precision_inventory_frame

### Files under `web/assets` with no `path` and no `fallback_path`

The sibling SVGs next to the WebP slots are `fallback_path` entries. These three files are not:

- `web/assets/fonts/Cinzel-Variable.ttf`
- `web/assets/fonts/OFL.txt`
- `web/assets/generated/BUILD_REPORT.json`

## Manifest slot → file

105 assets. 63 `GENERATED_REVIEW` (status stays `CONCEPT`). 42 placeholders. Every manifest path exists on disk. Paths are under `web/assets/`.

### illustration

| asset_id | subject | file | review |
|---|---|---|---|
| AVT_AEG_002 | AVT_AEG_002 | `generated/avatars/AVT_AEG_002.webp` | GENERATED_REVIEW |
| AVT_PHA_002 | AVT_PHA_002 | `generated/avatars/AVT_PHA_002.webp` | GENERATED_REVIEW |
| AVT_CEL_002 | AVT_CEL_002 | `generated/avatars/AVT_CEL_002.webp` | GENERATED_REVIEW |
| AVT_SAN_002 | AVT_SAN_002 | `generated/avatars/AVT_SAN_002.webp` | GENERATED_REVIEW |
| WEB_ILLUST_AVT_AEG_001 | AVT_AEG_001 | `illustrations/WEB_ILLUST_AVT_AEG_001.svg` | placeholder |
| WEB_ILLUST_AVT_PHA_001 | AVT_PHA_001 | `illustrations/WEB_ILLUST_AVT_PHA_001.svg` | placeholder |
| WEB_ILLUST_AVT_CEL_001 | AVT_CEL_001 | `illustrations/WEB_ILLUST_AVT_CEL_001.svg` | placeholder |
| WEB_ILLUST_AVT_SAN_001 | AVT_SAN_001 | `illustrations/WEB_ILLUST_AVT_SAN_001.svg` | placeholder |
| ILLUST_ACTION_GENERIC | generic-action | `illustrations/ILLUST_ACTION_GENERIC.svg` | placeholder |
| ILLUST_COMPANION | companion | `generated/dream_v02/companion_lucky_cat.webp` | GENERATED_REVIEW |
| ILLUST_ACT_GEN_ATK_001 | ACT_GEN_ATK_001 | `generated/dream_v02/action_slash.webp` | GENERATED_REVIEW |
| ILLUST_ACT_GEN_ATK_002 | ACT_GEN_ATK_002 | `generated/dream_v02/action_heavy_strike.webp` | GENERATED_REVIEW |
| ILLUST_ACT_GEN_DEF_001 | ACT_GEN_DEF_001 | `generated/dream_v02/action_guard.webp` | GENERATED_REVIEW |
| ILLUST_ACT_GEN_DEF_002 | ACT_GEN_DEF_002 | `generated/dream_v02/action_barrier.webp` | GENERATED_REVIEW |

### battle-sprite

| asset_id | subject | file | review |
|---|---|---|---|
| SPRITE_AVT_AEG_002 | AVT_AEG_002 | `generated/avatars/AVT_AEG_002.webp` | GENERATED_REVIEW |
| SPRITE_AVT_PHA_002 | AVT_PHA_002 | `generated/avatars/AVT_PHA_002.webp` | GENERATED_REVIEW |
| SPRITE_AVT_CEL_002 | AVT_CEL_002 | `generated/avatars/AVT_CEL_002.webp` | GENERATED_REVIEW |
| SPRITE_AVT_SAN_002 | AVT_SAN_002 | `generated/avatars/AVT_SAN_002.webp` | GENERATED_REVIEW |
| SPRITE_ENM_DEMO_001 | ENM_DEMO_001 | `generated/dream_v02/enemy_security_skeleton.webp` | GENERATED_REVIEW |
| SPRITE_ENM_DEMO_002 | ENM_DEMO_002 | `generated/dream_v02/enemy_clipboard_goblin.webp` | GENERATED_REVIEW |
| SPRITE_ENM_DEMO_003 | ENM_DEMO_003 | `generated/dream_v02/enemy_salary_slime.webp` | GENERATED_REVIEW |

### screen-art

| asset_id | subject | file | review |
|---|---|---|---|
| ILLUST_REWARDS | rewards | `generated/dream_v02/item_loot_chest.webp` | GENERATED_REVIEW |

### frame

| asset_id | subject | file | review |
|---|---|---|---|
| FRAME_N |  | `generated/frames/FRAME_N.webp` | GENERATED_REVIEW |
| FRAME_R |  | `generated/frames/FRAME_R.webp` | GENERATED_REVIEW |
| FRAME_EPIC |  | `generated/frames/FRAME_EPIC.webp` | GENERATED_REVIEW |
| FRAME_EX |  | `generated/frames/FRAME_EX.webp` | GENERATED_REVIEW |
| FRAME_FAC |  | `generated/frames/FRAME_FAC.webp` | GENERATED_REVIEW |
| FRAME_TBD |  | `frames/FRAME_TBD.svg` | placeholder |

### faction-badge

| asset_id | subject | file | review |
|---|---|---|---|
| BADGE_FAC_AEG | FAC_AEG | `badges/BADGE_FAC_AEG.svg` | placeholder |
| BADGE_FAC_PHA | FAC_PHA | `badges/BADGE_FAC_PHA.svg` | placeholder |
| BADGE_FAC_CEL | FAC_CEL | `badges/BADGE_FAC_CEL.svg` | placeholder |
| BADGE_FAC_SAN | FAC_SAN | `badges/BADGE_FAC_SAN.svg` | placeholder |
| BADGE_GENERIC | generic | `badges/BADGE_GENERIC.svg` | placeholder |

### stat-icon

| asset_id | subject | file | review |
|---|---|---|---|
| STAT_ICON_ATK | atk | `generated/icons/STAT_ICON_ATK.webp` | GENERATED_REVIEW |
| STAT_ICON_DEF | def | `generated/icons/STAT_ICON_DEF.webp` | GENERATED_REVIEW |
| STAT_ICON_SPD | spd | `icons/STAT_ICON_SPD.svg` | placeholder |

### ui-icon

| asset_id | subject | file | review |
|---|---|---|---|
| ICO_AP | ap | `icons/ICO_AP.svg` | placeholder |
| ICO_LOCK | lock | `icons/ICO_LOCK.svg` | placeholder |
| ICO_FAVORITE | favorite | `icons/ICO_FAVORITE.svg` | placeholder |
| ICO_IN_DECK | in-deck | `icons/ICO_IN_DECK.svg` | placeholder |
| ICO_DRAW | draw | `icons/ICO_DRAW.svg` | placeholder |
| ICO_DISCARD | discard | `icons/ICO_DISCARD.svg` | placeholder |
| ICO_VOID | void | `icons/ICO_VOID.svg` | placeholder |
| ICO_ROTATE | rotate | `icons/ICO_ROTATE.svg` | placeholder |
| PIP_AP | ap-pip | `battle/PIP_AP.svg` | placeholder |
| ICO_CURRENCY_G | g | `generated/dream_v02/item_g_coin.webp` | GENERATED_REVIEW |

### status-icon

| asset_id | subject | file | review |
|---|---|---|---|
| ICO_KO | ko | `icons/ICO_KO.svg` | placeholder |
| ICO_STATUS_SHIELD | shield | `icons/ICO_STATUS_SHIELD.svg` | placeholder |
| ICO_STATUS_TAUNT | taunt | `icons/ICO_STATUS_TAUNT.svg` | placeholder |
| ICO_STATUS_REGEN | regen | `icons/ICO_STATUS_REGEN.svg` | placeholder |
| ICO_STATUS_ATK | atk | `icons/ICO_STATUS_ATK.svg` | placeholder |
| ICO_STATUS_DEF | def | `icons/ICO_STATUS_DEF.svg` | placeholder |

### building

| asset_id | subject | file | review |
|---|---|---|---|
| MAP_BLD_HIDEOUT | hideout | `generated/buildings/MAP_BLD_HIDEOUT.webp` | GENERATED_REVIEW |
| MAP_BLD_TOWER | tower | `generated/buildings/MAP_BLD_TOWER.webp` | GENERATED_REVIEW |
| MAP_BLD_ARENA | arena | `generated/buildings/MAP_BLD_ARENA.webp` | GENERATED_REVIEW |
| MAP_BLD_SPORTS | sports | `generated/buildings/MAP_BLD_SPORTS.webp` | GENERATED_REVIEW |
| MAP_BLD_GACHA | gacha | `generated/buildings/MAP_BLD_GACHA.webp` | GENERATED_REVIEW |
| MAP_BLD_MALL | mall | `generated/buildings/MAP_BLD_MALL.webp` | GENERATED_REVIEW |

### map-background

| asset_id | subject | file | review |
|---|---|---|---|
| BG_MAP | world | `generated/map/BG_MAP.webp` | GENERATED_REVIEW |

### house

| asset_id | subject | file | review |
|---|---|---|---|
| HOU_TIER_CABIN | cabin | `generated/dream_v02/house_cabin.webp` | GENERATED_REVIEW |
| HOU_TIER_BUNGALOW | bungalow | `generated/dream_v02/house_bungalow.webp` | GENERATED_REVIEW |
| HOU_TIER_COTTAGE | cottage | `generated/dream_v02/house_cottage.webp` | GENERATED_REVIEW |
| HOU_TIER_LOFT | loft | `generated/dream_v02/house_loft.webp` | GENERATED_REVIEW |
| HOU_TIER_VILLA | villa | `generated/dream_v02/house_villa.webp` | GENERATED_REVIEW |
| HOU_TIER_PENTHOUSE | penthouse | `generated/dream_v02/house_penthouse.webp` | GENERATED_REVIEW |

### card-interior

| asset_id | subject | file | review |
|---|---|---|---|
| CARD_INTERIOR | neutral | `generated/frames/CARD_INTERIOR.webp` | GENERATED_REVIEW |

### type-icon

| asset_id | subject | file | review |
|---|---|---|---|
| TYPE_ICON_SKILL | Skill | `generated/icons/TYPE_ICON_SKILL.webp` | GENERATED_REVIEW |

### bg-battle

| asset_id | subject | file | review |
|---|---|---|---|
| BG_BATTLE | battle | `generated/backgrounds/BG_BATTLE.webp` | GENERATED_REVIEW |
| BG_BATTLE_ALT_TOWER | tower-alternate | `generated/dream_v02/tower_battle_arena.webp` | GENERATED_REVIEW |

### bg-prep

| asset_id | subject | file | review |
|---|---|---|---|
| BG_PREP | prep | `generated/backgrounds/BG_PREP.webp` | GENERATED_REVIEW |

### battle-tile

| asset_id | subject | file | review |
|---|---|---|---|
| TILE_PLAYER | player | `battle/TILE_PLAYER.svg` | placeholder |
| TILE_ENEMY | enemy | `battle/TILE_ENEMY.svg` | placeholder |

### ui-button

| asset_id | subject | file | review |
|---|---|---|---|
| BTN_END_TURN | end-turn | `battle/BTN_END_TURN.svg` | placeholder |
| BTN_BACK | back | `battle/BTN_BACK.svg` | placeholder |
| BTN_START_BATTLE | start-battle | `battle/BTN_START_BATTLE.svg` | placeholder |

### ui-badge

| asset_id | subject | file | review |
|---|---|---|---|
| BADGE_BATTLE | battle | `battle/BADGE_BATTLE.svg` | placeholder |
| BADGE_PREP | prep | `battle/BADGE_PREP.svg` | placeholder |

### ui-banner

| asset_id | subject | file | review |
|---|---|---|---|
| BANNER_SITE | site | `battle/BANNER_SITE.svg` | placeholder |

### ui-panel

| asset_id | subject | file | review |
|---|---|---|---|
| PANEL_TEAM | team | `battle/PANEL_TEAM.svg` | placeholder |
| PANEL_DECK | deck | `battle/PANEL_DECK.svg` | placeholder |
| PANEL_DETAIL | detail | `battle/PANEL_DETAIL.svg` | placeholder |

### role-icon

| asset_id | subject | file | review |
|---|---|---|---|
| ROLE_TANK | tank | `battle/ROLE_TANK.svg` | placeholder |
| ROLE_DPS | dps | `battle/ROLE_DPS.svg` | placeholder |
| ROLE_MAGIC | magic | `battle/ROLE_MAGIC.svg` | placeholder |
| ROLE_SUPPORT | support | `battle/ROLE_SUPPORT.svg` | placeholder |

### furniture

| asset_id | subject | file | review |
|---|---|---|---|
| FUR_REF_BUNGALOW_BOX | FUR_REF_BUNGALOW_BOX | `generated/dream_v02/furniture_card_box.webp` | GENERATED_REVIEW |
| FUR_REF_COTTAGE_BOX | FUR_REF_COTTAGE_BOX | `generated/dream_v02/furniture_card_box.webp` | GENERATED_REVIEW |
| FUR_REF_LOFT_TALL_CABINET | FUR_REF_LOFT_TALL_CABINET | `generated/dream_v02/furniture_tall_cabinet.webp` | GENERATED_REVIEW |
| FUR_REF_PENTHOUSE_LARGE_TALL_CABINET | FUR_REF_PENTHOUSE_LARGE_TALL_CABINET | `generated/dream_v02/furniture_tall_cabinet.webp` | GENERATED_REVIEW |
| FUR_REF_VILLA_DISPLAY_COUNTER | FUR_REF_VILLA_DISPLAY_COUNTER | `generated/dream_v02/furniture_display_counter.webp` | GENERATED_REVIEW |

### inventory-icon

| asset_id | subject | file | review |
|---|---|---|---|
| ICO_FUR_REF_BUNGALOW_BOX | FUR_REF_BUNGALOW_BOX | `generated/dream_v02/furniture_card_box_icon.webp` | GENERATED_REVIEW |
| ICO_FUR_REF_COTTAGE_BOX | FUR_REF_COTTAGE_BOX | `generated/dream_v02/furniture_card_box_icon.webp` | GENERATED_REVIEW |
| ICO_FUR_REF_LOFT_TALL_CABINET | FUR_REF_LOFT_TALL_CABINET | `generated/dream_v02/furniture_tall_cabinet_icon.webp` | GENERATED_REVIEW |
| ICO_FUR_REF_PENTHOUSE_LARGE_TALL_CABINET | FUR_REF_PENTHOUSE_LARGE_TALL_CABINET | `generated/dream_v02/furniture_tall_cabinet_icon.webp` | GENERATED_REVIEW |
| ICO_FUR_REF_VILLA_DISPLAY_COUNTER | FUR_REF_VILLA_DISPLAY_COUNTER | `generated/dream_v02/furniture_display_counter_icon.webp` | GENERATED_REVIEW |

### gacha-machine

| asset_id | subject | file | review |
|---|---|---|---|
| GACHA_MACHINE_AVATAR | avatar | `generated/dream_v02/gacha_machine_avatar.webp` | GENERATED_REVIEW |
| GACHA_MACHINE_ACTION | action | `generated/dream_v02/gacha_machine_action.webp` | GENERATED_REVIEW |
| GACHA_MACHINE_COMPANION | companion | `generated/dream_v02/gacha_machine_companion.webp` | GENERATED_REVIEW |

### gacha-vfx

| asset_id | subject | file | review |
|---|---|---|---|
| VFX_REVEAL_EPIC | Epic | `generated/dream_v02/gacha_reveal_epic.webp` | GENERATED_REVIEW |
| VFX_REVEAL_EX | EX | `generated/dream_v02/gacha_reveal_ex.webp` | GENERATED_REVIEW |

### bg-gacha

| asset_id | subject | file | review |
|---|---|---|---|
| BG_GACHA | gacha | `generated/dream_v02/gacha_hall.webp` | GENERATED_REVIEW |

### bg-hideout

| asset_id | subject | file | review |
|---|---|---|---|
| BG_HIDEOUT_CABIN | cabin | `generated/dream_v02/interior_cabin.webp` | GENERATED_REVIEW |

### battle-vfx

| asset_id | subject | file | review |
|---|---|---|---|
| VFX_STATUS_SHIELD | shield | `generated/dream_v02/vfx_shield.webp` | GENERATED_REVIEW |
| VFX_STATUS_REGEN | regen | `generated/dream_v02/vfx_regen.webp` | GENERATED_REVIEW |
| VFX_KO | ko | `generated/dream_v02/vfx_ko.webp` | GENERATED_REVIEW |


## Requirement checklist

From `docs/final_v05/MIRA_FINAL_MERGE_PROMPT_v03.md`, judged on this branch. Done means the item is present and the check that exists agrees. Partial means some of it is in the tree and a named gap remains. Missing means it is not in the tree.

### A. Source of truth

| Item | Status |
|---|---|
| A1 LOCKED / PROPOSED / PENDING left as written | Done. Design source is in the branch. SYNC stays REJECTED. AUTO mode LOCKED, policy PROPOSED. |
| A3 Phase 2, 42 PNG | Partial. Derivatives are bound. The 9 files above are not. |
| A4 Phase 3, 51 assets | Partial. Raw pack is in `art_source/dream_v03`. Bind is missing. |
| A5 Mira Battle/Prep primary, Dream Tower as alternate | Done. `BG_BATTLE` / `BG_PREP` are the primaries. `BG_BATTLE_ALT_TOWER` is the alternate. |

### B. Merge plan

| Item | Status |
|---|---|
| B1 read-only audit | Done. `docs/final_v05/PLAN.md`. |
| B4 PR #9 left alone | Done. |

### C. Game flow

| Item | Status |
|---|---|
| Home → Hideout | Partial. The home screen is the Hideout. There is no separate furniture-placement room. |
| Stash | Partial. Filters exist. Sort, stack counts, detail, and item actions are not there. Back is off screen at 844×390 and 667×375. |
| Deck of 30 | Done. Start stays disabled until 4 avatars and 30 cards. |
| Prep | Done. |
| Battle AP 5 / hand 5 / zones / AUTO | Done. AUTO-01..05 pass on the engine side ids. |
| Victory / Defeat → Rewards | Partial. UI reached Rewards on 915×412 and 1280×720. Payload G/loot/items stay null. |
| Save / Load | Partial. The profile round-trips in the acceptance test. The Save button is off screen on all four viewports. |
| `legacy.pow` → ATK | Done in `src/migrate`. Web import of an old save is not covered by the browser loop. |
| Gacha, 3 pools, pity per banner | Done in the engine. The booth uses the labelled TEST banners. |
| Upgrade | Missing, on purpose. Blocked by design. |
| Return to Hideout | Partial. "Back to the Hideout" was reached after Rewards on the two larger viewports, then Save blocked the rest. |
| Justin art on `AVT_*_002` | Done. `AVT_*_001` stays placeholder. |
| Regen +3 for 2 turns on Justina | Done. Mapped to AV_EX04. Floaters are `regen_applied` / `regen_tick` on `state.log`. |
| Damage, HP, SPD, 5×2 not locked; SYNC out | Done. |

### D. Art and UI

| Item | Status |
|---|---|
| D2 manifest paths, layered | Partial. P1/P2 slots below. P3 missing. |
| D3 SVG frames instead of the 4 `REVIEW_FIX_NEEDED` PNGs | Missing. The SVGs are in the raw pack and are not wired. |
| D4 SVG buttons, CSS states, 44px targets | Missing. Buttons are CSS. Back fails 44px at the two shorter heights. |
| D5 Battle presentation | Partial. AUTO reaches Rewards on the larger viewports. Floater numbers are on `state.log`. The browser test does not assert a floating label. |
| D6 Inventory grid and the house ladder | Partial. The ladder is on the Hideout and is clipped below the fold. Capacity still follows furniture, with HOME-11 pending. |
| D7 Mall and Rewards from engine values | Missing. Mall has no prices. Rewards payload is pending. |
| D8 WebP, lazy-load, budget, uniform map scale | Partial. WebP is shipped. Map scale is uniform. Lazy-load and a byte budget are not enforced. |

### E. QA

| Item | Status |
|---|---|
| Node 20 and 22, real counts, job fails on red | Done as a gate. The suite itself is FAIL, 107 / 5 / 3, exit 1, both versions. |
| Playwright on the four viewports | Partial. The test runs and fails on off-screen controls. Rewards were reached on 915×412 and 1280×720 only. |
| Win/lose, save, pity, stacks, furniture, deck, regen, back | Partial. Engine and acceptance cover most of this. The browser loop does not. QA-10 win/lose stays red for the web view. |
| Screenshot board, waterfall, mapping, missing action art, decision log | Partial. Mapping and missing action art are in this file. Screenshot board, waterfall, and a decision log are not. |
| Preview link or standalone HTML | Partial. `web/tools/build-single-html` produces the file used above. It is not hosted and not committed. |
