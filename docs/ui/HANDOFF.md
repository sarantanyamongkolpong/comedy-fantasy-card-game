# Web UI handoff

Branch `core/v05-playable-wire`. Not `PRODUCTION_READY`. The screens call the real engine, gacha, and versioned save. The mock stays only if one of those exports is missing.

## Run it on a phone, landscape

From the repo root, on a computer the phone can reach:

```bash
python3 -m http.server 8080
```

Open `http://<computer-lan-ip>:8080/web/` in the phone browser and turn the phone sideways. Portrait shows a rotate overlay. Do not deploy this branch.

One self-contained file, for opening from `file://`:

```bash
node web/tools/build-single-html
```

That writes `web/dist/playable.html` (esbuild bundle, inlined CSS, manifest and assets as data URIs) using the real engine.

Chrome on a desktop can use the same URL. Resize the window; the whole stage scales uniformly.

Rebuild Dream’s art after a new drop (the raw 52 MB tree is not in this branch):

```bash
git fetch origin art/dream-v01-drop
git checkout origin/art/dream-v01-drop -- art_source/dream_v01
git reset -q HEAD -- art_source
python3 web/tools/build-assets.py
rm -rf art_source
```

Mira’s arena plates (`bg_battle_arena_v01`, `bg_prep_battle_v01`, commit `1e72dc0`) are the default full-bleed backgrounds, slots `bg-battle` and `bg-prep`, review status `GENERATED_REVIEW`. Rebuild just those with `python3 web/tools/build-assets.py --backgrounds` while `art_source/mira_v01` is checked out. Feet anchors live in `battleTiles` on the manifest. The display face is Cinzel (OFL) under `web/assets/fonts`. Card faces do not print the word PLACEHOLDER; that status stays on `data-status`. Action art windows show the ATK, DEF, or Skill icon until a real illustration is bound.

## What you can click

Home (Cabin), stash with lock / favorite / in-deck, team of 4 and a 30-card deck, TEST gacha (pull 1 or 10, pity counters, no G price), world map, Prep Battle, tower or arena practice battle, rewards once, save/load in `localStorage` (`cfcg.v05.web.save`).

Map battle sites open Prep Battle first (Map → Prep Battle → Battle → Rewards). START BATTLE stays disabled until the team is 4 and the deck is 30. The primary button says START BATTLE. The reference art says START SYNC. SYNC is dropped (t261u). There is no SYNC slot and no SYNC READY readout.

The reference also draws FRONT and BACK tags. Those are not a formation rule. The four tiles are only where the stills stand.

Role labels are the data roles in capitals: TANK, DPS, MAGIC, SUPPORT. The reference’s MAGE and HEALER words are not in the avatar data. Justina’s detail card reads Saving Grace and Regen +3 x2 turns, then Moral Support, from `content/v05`. It does not say HEAL BONUS.

AUTO is an approved control under END TURN. It calls `runAutoTurn(state, 'player', { maxActions: 1, shouldStop })` and animates that call’s log before the next action. Switching AUTO off makes `shouldStop` true, so the engine stops after the action already in flight and does not end the turn for you. Enemy turns call `playEnemyTurn`. The on/off choice is `preferences.autoBattle` on the versioned save. Playback speed uses the data config’s PROPOSED `autoPolicy.speed` options (`slow`, `normal`, `fast`). The web client does not choose cards. `vrSync` is REJECTED and is not on screen.

Sports Complex is locked. Shopping Mall has no prices. Companion is a placeholder. There is no main quest.

## Real art vs mock rules

| Surface | Source |
|---|---|
| Justin battle stills, map, six buildings, rarity frames, interior, ATK/DEF/skill icons | Dream drop `art/dream-v01-drop` @ `0c063ca`, downscaled to WebP. `review_status: GENERATED_REVIEW`. |
| `AVT_*_001` portraits, houses, faction badges, SPD icon, status icons, UI chrome icons | Placeholder SVG, `placeholder: true`. |
| Reference card PNGs | Not shipped and not used as card faces. |
| Battle floor and prep floor | Mira `bg_battle_arena_v01` / `bg_prep_battle_v01` @ `1e72dc0`, WebP, slots `bg-battle` and `bg-prep`, `GENERATED_REVIEW`. Feet are `battleTiles`. Tiles are visual only. Dream’s `tower_battle_arena` is `BG_BATTLE_ALT_TOWER` with `default: false`. |
| Dream v0.2 pack @ `0cd126c` | Houses on `HOU_TIER_*`. Furniture on `FUR_REF_*`. Action art on `ACT_GEN_ATK_001/002` and `ACT_GEN_DEF_001/002` (object-position `center 30%`). Enemies `ENM_DEMO_001/002/003`. `ENM_DEMO_004` has no art. Gacha hall, machines, G coin, shield/regen/KO overlays, reveal Epic/EX. Cabin interior is the Hideout background. Loot chest is `ILLUST_REWARDS`. Lucky cat is `ILLUST_COMPANION`. The other 9 unmatched files stay unbound. |
| Battle composition | Owner ref `BATTLE_LAYOUT_REF_OWNER_20261120` mirrored: four Justins on the left (cyan tiles, facing right), echoes on the right (magenta tiles, facing left). The file itself shows the opposite sides. |
| Prep Battle | Owner ref `PREP_BATTLE_REF_OWNER_20261120`. Team list on the left, cyan preview in the center, deck icons and the selected avatar’s data text on the right. |
| Battle, gacha, save | Real modules. Enemy turns call `runEnemyTurn` until `playEnemyTurn` is exported. Player AUTO calls `runAutoTurn` when that export exists. Gacha `pull` gets an integer seed. Banners are the labelled TEST configs. |
| Justin stats except Justina’s Active text | PROPOSED content from `content/v05`. HP is the engine placeholder `10 + DEF * 2`. Damage is the engine placeholder formula. Both stay `PENDING_OWNER`. |
| Action card effects | Content ops are the string `placeholder`. ATK uses the engine damage formula, DEF uses a shield of 0, Skill fires the avatar Active. No new balance numbers. |
| Map pads | PROPOSED. The mall’s target width is 280 so the sprite box stays inside the master. The anchor is still (1393, 280). |

Shipped raster weight: **1,638,676 bytes (1.56 MiB)** of generated WebP. `web/assets` including placeholder SVGs is about **1.9 MiB**.

Screenshots of Home, Stash, Team, Gacha, Map, Battle, and Rewards at 844×390, 667×375, and 1280×720 are in `tests/web/screenshots/`.

## Known issues

- AUTO uses the engine policy `balanced` (PROPOSED). That policy plays heal, a shield or taunt only when a hit would KO, or damage. Other cards are passed. On the sample deck the fight can stall with both sides still up, so AUTO does not promise a Rewards screen. The web passes `maxActions: 1` so the log can play one action at a time.
- A refresh during a fight reloads the match from the versioned save (`web` field on the profile, engine state included). Leaving the page writes that save.
- Enemy play is `runEnemyTurn`, the engine’s demo AI, not a design opponent.
- Pity reset is a labelled GA-12 assumption: per banner, reset the tier that was hit.
- Gacha prices and drop rates are not shown as live numbers. The booth prints TEST weights.
- `AVT_*_001` cannot enter the tower while their stats are TBD.
- Frame windows were measured from alpha. They are close, not a locked template. R’s art window is taller than N’s.
- Node’s asset schema cannot store `status: GENERATED_REVIEW` yet. See `CONTRACT_REQUESTS.md`.
