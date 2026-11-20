# Web UI handoff (stream C)

Branch `core/v05-web`. Not `PRODUCTION_READY`. The battle rules engine is the in-browser **mock** until streams A and B publish the contract modules.

## Run it on a phone, landscape

From the repo root, on a computer the phone can reach:

```bash
python3 -m http.server 8080
```

Open `http://<computer-lan-ip>:8080/web/` in the phone browser and turn the phone sideways. Portrait shows a rotate overlay. There is no build step. Do not deploy this branch.

Chrome on a desktop can use the same URL. Resize the window; the whole stage scales uniformly.

Rebuild Dream’s art after a new drop (the raw 52 MB tree is not in this branch):

```bash
git fetch origin art/dream-v01-drop
git checkout origin/art/dream-v01-drop -- art_source/dream_v01
git reset -q HEAD -- art_source
python3 web/tools/build-assets.py
rm -rf art_source
```

## What you can click

Home (Cabin), stash with lock / favorite / in-deck, team of 4 and a 30-card deck, TEST gacha (pull 1 or 10, pity counters, no G price), world map, tower or arena practice battle, rewards once, save/load in `localStorage` (`cfcg.v05.web.save`).

Sports Complex is locked. Shopping Mall has no prices. Companion is a placeholder. There is no main quest.

## Real art vs mock rules

| Surface | Source |
|---|---|
| Justin battle stills, map, six buildings, rarity frames, interior, ATK/DEF/skill icons | Dream drop `art/dream-v01-drop` @ `0c063ca`, downscaled to WebP. `review_status: GENERATED_REVIEW`. |
| `AVT_*_001` portraits, houses, faction badges, SPD icon, status icons, UI chrome icons | Placeholder SVG, `placeholder: true`. |
| Reference card PNGs | Not shipped and not used as card faces. |
| Battle, gacha, save | Mock in `web/js/mock-engine.js` on this branch. `core/v05-engine` @ `07b1b2f` and `core/v05-data` @ `0b37c05` export the names the adapter already calls. They are not copied here. |
| Justin stats except Justina’s Active text | PROPOSED sample data. HP 12 and the damage formula are PENDING stand-ins (`CORE-039`), labelled in the fight log. |
| Map pads | PROPOSED. Mall’s box crosses the top of the master canvas by about 50 px and is clipped. |

Shipped raster weight: **1,638,676 bytes (1.56 MiB)** of generated WebP. `web/assets` including placeholder SVGs is about **1.9 MiB**.

Screenshots of Home, Stash, Team, Gacha, Map, Battle, and Rewards at 844×390, 667×375, and 1280×720 are in `tests/web/screenshots/`.

## Known issues

- Refresh during a fight drops the match. The profile save does not include the live battle (the mock RNG is not JSON).
- Enemy play is a sample driver calling `playAction` / `endTurn`, not a design AI.
- Pity reset is a labelled GA-12 assumption: per banner, reset the tier that was hit.
- Gacha prices and drop rates are not shown as live numbers. The booth prints TEST weights.
- `AVT_*_001` cannot enter the tower while their stats are TBD.
- Frame windows were measured from alpha. They are close, not a locked template. R’s art window is taller than N’s.
- Node’s asset schema cannot store `status: GENERATED_REVIEW` yet. See `CONTRACT_REQUESTS.md`.
