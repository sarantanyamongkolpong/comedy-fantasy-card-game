# v0.5 integration log

Local merges only. Nothing in this log was pushed.

## 20 Nov 2026, 16:53 ICT

| Branch | Commit | Present |
| --- | --- | --- |
| `core/v05-qa` | the acceptance commits on this branch, including the battle-phase fixes | yes |
| `origin/core/v05-data` | `0b37c05` Add gacha pity, inventory protection, and versioned saves | yes |
| `origin/core/v05-engine` | `07b1b2f` test: cover locked v0.5 battle rules | yes |
| `origin/core/v05-web` | — | no remote ref |
| `origin/core/v05-design-source` | `51df543` at the earlier fetch | reference only, not merged |

The check merged `origin/core/v05-data` and then `origin/core/v05-engine` into a detached worktree of `core/v05-qa`. The merge was not committed onto `core/v05-qa` and was not pushed.

### Result

| Run | Node | pass | fail | todo |
| --- | --- | --- | --- | --- |
| Acceptance (`tests/acceptance/v05`, `tests/e2e`, `tests/regression`) | v22.23.4 | 91 | 0 | 7 |
| Acceptance | v20.20.2 | 91 | 0 | 7 |
| Full `node --test` | v22.23.4 | 324 | 0 | 7 |
| Full `node --test` | v20.20.2 | 324 | 0 | 7 |

`DATA_VALIDATION`, `REPOSITORY_STRUCTURE`, and `ASSET_MANIFEST_VALIDATION` exited 0 on that worktree.

The 7 todos are all `web/` (stream C): world-map layout, map entries, landscape shell, asset-manifest wiring, and the Deck → Battle → Rewards smoke. `origin/core/v05-web` does not exist, so those rows stay todo. That is not a pass.

### What the merge actually ran

- Justin records `AVT_*_002` exist beside unchanged `AVT_*_001`.
- Pity counters are per banner. Epic 100 resets Epic only. Top 200 and an EX/FAC hit reset both. Companion Epic is 100 and has no top counter.
- `migratePowToAtk` copies `pow` to `atk` and keeps `legacy.pow`.
- Battle: 30-card decks, opening hand is the front of an unshuffled deck, AP 0–5, no auto end at 0 AP, Void stays out of the recycle, FAC gate, win/lose, Justina regen +3 for two later own turns.
- Pending flags that are still unset: heal cap, damage formula, team SPD aggregate, duplicate cap, drop rates, G price, cabin base, star cap, Target_Rule vocabulary.

### P0

None in the merged data + engine tree. No failing acceptance test.

### P1 / still open

- `web/` is absent, so OWNER-PLAT-04 and the e2e loop are not executed.
- Simultaneous-death winner policy is still `PENDING_OWNER` on the engine config. The suite checks that flag. It does not lock a winner.
- Heal cap, damage, and HP numbers are placeholders on the engine and null on `src/config`. They are not approved balance.

### Mobile

No viewport run in that pass. The map module was not in the checkout yet.

## 20 Nov 2026, 17:05 ICT — `core/v05-playable`

`origin/core/v05-playable` @ `6be1689` is base + data `0b37c05` + engine `07b1b2f` + web `e8461b7` (PR #19). `origin/core/v05-playable-wire` has no remote ref yet. This branch was not merged. The acceptance files were copied onto a detached worktree that also had `web/`, `src/`, and `content/` from `6be1689`.

Mira's full run of that commit: 243 pass / 244, the one failure is `tests/web/mock-contract.test.js:112` (expects `source: 'mock'` while `loadGameApi` now reports `engine`).

Acceptance on that worktree, Node v22.23.4 and v20.20.2, same totals:

| | count |
| --- | --- |
| pass | 96 |
| fail | 4 |
| todo | 3 |
| discovered | 103 |

The Deck → Battle → Rewards smoke against `src/engine` passed for both a player win and a player loss. Rewards were emitted once. Landscape shells 667×375, 844×390, and 1280×720 scale the 1672×941 stage uniformly and stay inside the viewport. Manifest image refs resolve. `loadGameApi().playEnemyTurn` is `runEnemyTurn`; the engine module itself does not export `playEnemyTurn`.

### P0 on playable

1. `MAP_BLD_MALL` sprite box is `1228,-50 330×330`. The top of the mall leaves the 1672×941 canvas. OWNER-PLAT-04.
2. `web/js/sample-catalog.js` `TEST_BANNERS` are rejected by `createBannerState` with `GA11_RATES_PENDING`. They set `testConfig` and `weights`, not `testOnly`, `rateStatus: 'TEST_ONLY_NOT_PRODUCTION'`, `warning`, and `entries`.
3. `web/js/screens/gacha.js` passes `` seed: `gacha:${bannerId}:${seq}:${count}` ``. `pull()` requires an integer seed.
4. Reloading the web starter profile through `src/save` throws `save profile is missing profileId`. The web profile is not the save module's profile.

### Still todo

`layoutWorldMap` is not the web export (the web uses `stageLayout` and `buildingHotspots`). The Playwright smoke stays todo; the node smoke above is the one that ran. `core/v05-playable-wire` was not on the remote, so it was not run.
