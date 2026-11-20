# SPORT COMPLEX v0.6 — QA report

Stream: qa. Branch: `sport/v06-qa`. Base: `sport/v06-base` @ `d5da98a79803c03c963e5b1c88fe14aac78efbe2`.
Draft PR: https://github.com/sarantanyamongkolpong/comedy-fantasy-card-game/pull/32 (into `sport/v06-base`, not merged).
Harness commit: `2ce3dacd89e64b7ee282a4846fe339b7a7181c7e`.
Measured 2026-11-20. No merge, no force-push, no deploy. `main`, PR #9, and hunter-life were not touched. This report does not assign a release status to any sport work.

## Phase 1 — v0.5 regression baseline

Command: `node tools/sport-qa/run-regression.mjs`. Each existing `*.test.js` ran in its own process. The sport harness (`tests/sport/**`, `tests/e2e/sport/**`) was not part of this count. Default per-file timeout 180s. `practice-auto.test.js` 600s. `existing-suite.test.js` 900s. `v05-full-loop.playwright.test.js` 600s. `auto-battle.playwright.test.js` 240s. Stress files 300s. Node 20 and Node 22 ran at the same time.

| Node | pass | fail | todo | skip | cancelled | tests | hangs |
|---|---:|---:|---:|---:|---:|---:|---:|
| v22.23.4 | 395 | 1 | 4 | 4 | 0 | 404 | 0 |
| v20.20.2 | 395 | 1 | 4 | 4 | 0 | 404 | 0 |

Exit code 1 on both, because of the one failure. Raw counts: `tools/sport-qa/baselines/node22.json`, `tools/sport-qa/baselines/node20.json`.

No file hung. The slow files finished inside their timeouts:

| File | Node 22 | Node 20 |
|---|---:|---:|
| `tests/engine/practice-auto.test.js` | 134s | 173s |
| `tests/regression/existing-suite.test.js` | 137s | 178s |

`existing-suite.test.js` spawns the non-acceptance suite again, including practice-auto, and still passed (`fail 0`, pass count at least 187). Node 20 was slower because both versions were running that work together.

### Pre-existing failure (both Nodes)

1. `QA-10 real-engine Deck Battle Rewards win and lose` in `tests/acceptance/v05/qa-12-playable-web.test.js`. The web `createMatch` view has `engine`, `units`, and `phase`, and does not expose `sides` or `state`. The assertion text is: web createMatch must return the engine match (sides) or { state }. A view with only engine/units/phase hides the match; unwrapping view.engine belongs to the web adapter. This is the same web-adapter gap already recorded on the v0.5 QA stream. Sport QA did not edit that adapter.

### Pre-existing todos (both Nodes)

1. `OWNER-PLAT-04 world map anchors stay fixed across landscape viewports and portrait shows rotate` — `web/src/map/layout.js` (and the other `layoutWorldMap` paths) is not on this checkout. The landed map module is `web/js/map-layout.js`.
2. `QA-10 map layout export is the OWNER-PLAT-04 hook` — same missing export.
3. `QA-10 e2e smoke Deck Battle Rewards` — `@playwright/test` is not installed. See `tests/e2e/README.md`.
4. `QA-10 full loop Home Hideout Stash Deck Map Prep Battle Rewards Save Gacha` — the v0.5 test imports `playwright-core` from the repo and that package is not installed, so the test reports that Playwright or Chrome is not installed. Chrome is present at `/usr/bin/google-chrome`. The four viewport walks did not run.

### Pre-existing skips (both Nodes)

`tests/web/auto-battle.playwright.test.js` skipped all four cases because `playwright-core` does not resolve from the repo. The cases are: AUTO starts off, AUTO drives `runAutoTurn`, switching AUTO off hands the turn back, and map opens Prep Battle.

## Phase 1 — sport harness

The harness lives in `tests/sport/qa/`, `tests/e2e/sport/`, and `tools/sport-qa/`. A missing sport module is a skip, not a pass and not a failure. Command: `node tools/sport-qa/run-harness.mjs`.

| Node | pass | fail | skip | todo | hangs |
|---|---:|---:|---:|---:|---:|
| v22.23.4 | 10 | 0 | 9 | 0 | 0 |
| v20.20.2 | 10 | 0 | 9 | 0 | 0 |

Passes are the auditor's own fixtures (clean card, leaked name, stat keys, rarity, untagged number, forbidden release token) plus the v1 and v2 save fixtures. Those two fixtures load through `src/save`, keep `currency.G`, and do not gain a second currency key.

Skips, same on both Nodes:

| Check | Reason |
|---|---|
| Landed-surface provenance audit | `content/v06/sport`, `src/sport`, and `web/sport` are absent |
| Save v3 round-trip | No `src/sport/save` module, and `SAVE_VERSION` is still 2 |
| Wallet / gacha invariants | No sport wallet, gacha module, or banner content |
| Football, basket, car, moto determinism | Sim modules are absent |
| Racing-core determinism | `src/sport/racing` is absent |
| Viewport buttons | `web/sport` is absent |

What the harness will enforce once those modules land:

- Real-block names, teams, logos, and URLs must not appear in player-facing sport JSON, `web/sport` strings, or built HTML.
- Stat keys: football `Power/Def/Speed/Sta/Acc`, basket `Shooting/Def/Spd/Sta`, car and moto `TopSpeed/Accel/Handling`.
- Rarity only `N`, `R`, `Epic`, `EX`.
- Invented game numbers carry `BALANCE_PLACEHOLDER` or `PROPOSED`.
- Sport surfaces must not contain the release tokens this stream was told not to apply.
- v1 and v2 fixtures still load; a v3 profile round-trips `sport.roster`, `sport.pity`, and `sport.ledger` once that module exists.
- One `G` wallet, banners `SPORT_FOOTBALL`, `SPORT_BASKET`, `SPORT_CAR`, `SPORT_MOTO`, pity isolated per banner.
- `simulate({ seed, home, away, field, tactics, tuning })` is pure and seed-stable.
- Playwright at 844×390, 667×375, 915×412, and 1280×720: every visible button lies inside the viewport. Screenshots go to `tests/e2e/sport/screenshots/`.

## Screenshots

None. `web/sport` is not on `sport/v06-base`, so the viewport test did not open a page.

## Phase 2 — stream probes

Throwaway merges use `node tools/sport-qa/throwaway-merge.mjs`. The worktree is deleted afterwards and is never pushed. Severity for later findings: P0 is a save loss, a real-name leak, a second currency, or cross-banner pity. P1 is a broken sim, wrong stat keys, an illegal rarity, an untagged invented number, or a button outside the viewport. P2 is a gap that does not break those rules.

### Probe 1 — 2026-11-20T13:04:14Z

`git fetch` of `sport/v06-data`, `sport/v06-sim-ball`, `sport/v06-sim-race`, and `sport/v06-web`. All four are absent. `sport/v06-sim` is also absent. No merge was created. No new product findings.

## Findings

### P0

None.

### P1

1. Pre-existing, v0.5 web adapter: `createMatch` does not expose the engine match. Sport files were not changed. The v0.5 acceptance failure stays red on purpose.

### P2

- v0.5 `layoutWorldMap` is still not exported from `web/src/map/`. Map behaviour that uses `web/js/map-layout.js` is already covered by other tests.
- v0.5 browser tests did not drive Chrome, because `playwright-core` and `@playwright/test` are not installed in this repo. The sport harness can load `playwright-core` from a side install when `web/sport` exists.
- Sport content, sims, wallet, gacha, save v3, and the sport UI have not been pushed yet.
