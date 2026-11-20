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

## CI on the phase 1 head

Quality gates on `bef153f` (run 44741256022) passed data validation, repository structure, and the asset manifest. `SYSTEMS_TEST` is red on Node 20 and Node 22. Each `node --test` step is `continue-on-error`, and the job fails because the outcome is not success. Combined suite, both Nodes:

| Node | pass | fail | todo | skip | cancelled | tests |
|---|---:|---:|---:|---:|---:|---:|
| 20 | 406 | 1 | 4 | 13 | 0 | 424 |
| 22.23.5 | 406 | 1 | 4 | 13 | 0 | 424 |

The only failing name is the pre-existing `QA-10 real-engine Deck Battle Rewards win and lose`. The per-file baseline was 404 tests (395 pass, 4 skip) and the phase 1 harness was 19 tests (10 pass, 9 skip). The combined CI run is one passing test higher than that sum. The failure set did not grow.

## Screenshots

Phase 1 had no page to open. Probe 2 saved the Sport Complex hub after Map → Sports Complex:

- `tests/e2e/sport/screenshots/probe2/844x390.png`
- `tests/e2e/sport/screenshots/probe2/667x375.png`
- `tests/e2e/sport/screenshots/probe2/915x412.png`
- `tests/e2e/sport/screenshots/probe2/1280x720.png`

The hub shows four sports, parody copy, `8000 G`, and `PROPOSED`. Map and hub buttons sat inside all four viewports.

## Phase 2 — stream probes

Throwaway merges use `node tools/sport-qa/throwaway-merge.mjs`. The worktree is deleted afterwards and is never pushed. Severity for later findings: P0 is a save loss, a real-name leak, a second currency, or cross-banner pity. P1 is a broken sim, wrong stat keys, an illegal rarity, an untagged invented number, or a button outside the viewport. P2 is a gap that does not break those rules.

### Probe 1 — 2026-11-20T13:04:14Z

`git fetch` of `sport/v06-data`, `sport/v06-sim-ball`, `sport/v06-sim-race`, and `sport/v06-web`. All four are absent. `sport/v06-sim` is also absent. No merge was created. No new product findings.

### Probe 2 — 2026-11-20T13:22Z, harness re-run after the landed APIs were wired in

All four branches were present. A local throwaway merge onto `sport/v06-base` completed with no conflicts (detached `92577c8`). That merge was not pushed.

| Stream | Tip | Subject |
|---|---|---|
| `sport/v06-data` | `1483a45d94a31df009e0f1e899414bba1a01f59c` | Add Sport Complex v0.6 parody content and provenance checks. |
| `sport/v06-sim-ball` | `8f503523aa1989f81a6fcf9947dd3297a159663e` | Add seeded football and basketball auto sims. |
| `sport/v06-sim-race` | `17ca51b35cac342ce66029c0beb55d8866dcb60e` | Add seeded car and moto sims plus the sport wallet, gacha, and save v3 payload. |
| `sport/v06-web` | `18f1bc2ff47e1a13eaf3548c6cf10301850512cb` | Add the Sport Complex hub, prep, sim, result, gacha, and roster. |

None of those subjects say feature-complete. The probe timer stays up.

The first harness call looked for `sim.js`, a `teamId`-less lineup, and a migrate export named `migrateV3`. Those misses were harness gaps. The re-run imports `simulate.mjs` / `simulate.js`, passes `players` or `teamId` plus two entries, and calls `migrateSportV3`. Node v22.23.4 on the merged tree:

| pass | fail | skip | todo | tests | hangs |
|---:|---:|---:|---:|---:|---:|
| 16 | 5 | 1 | 0 | 22 | 0 |

Counts: `tools/sport-qa/baselines/harness-probe2.json`.

Passed: v1 and v2 saves still load with only `G`; `migrateSportV3` adds `{ roster, pity, ledger }` and the sport bag round-trips through serialize/deserialize while the envelope stays at save version 2; one `G` wallet; a basket pull leaves football pity unchanged and advances the basket counter; football, basket, car, and moto sims are pure and seed-stable, and their reward `G` is tagged `PROPOSED`.

Skipped: `src/sport/racing/index.js` has no `simulate` export. Car and moto enter through their own modules, which passed.

Failed: the provenance audit (248 real-name/URL hits, all in one web file) and the four viewport walks (v0.5 home buttons below the fold). Detail is under Findings.

Content JSON had no stat-key, rarity, untagged-number, or forbidden-token findings. Public content fields did not contain real-block names.

### Probe 3 — 2026-11-20T13:33:18Z

Fetched each stream again. Tips are the same four commits as probe 2. None match feature-complete. Throwaway merge onto `sport/v06-base` was clean again and was not pushed. Harness on Node v22.23.4 reproduced the same totals: 16 pass, 5 fail, 1 skip, 22 tests, 0 hangs. The five failures are still the 248 real-name hits in `web/sport/fixtures/catalog.js` and the four hideout viewports. No new P0, P1, or P2. Counts: `tools/sport-qa/baselines/harness-20261120T133318Z.json`. Hub screenshots: `tests/e2e/sport/screenshots/20261120T133318Z/`.

Quality gates on `4f9e934` (run 44745398763) finished after that push. Data validation, repository structure, and the asset manifest passed. `SYSTEMS_TEST` is red. Node 20 and Node 22 both report 406 pass, 1 fail, 4 todo, 13 skip, 424 tests. The only failing name is still `QA-10 real-engine Deck Battle Rewards win and lose`. The sport harness cases on this branch skipped, because the sport modules are not in the QA checkout.

### Probe 4 — 2026-11-20T14:00:35Z

Fetched each stream again. Tips are still `1483a45`, `8f50352`, `17ca51b`, and `18f1bc2`. None match feature-complete. The throwaway merge was clean and was not pushed. Harness on Node v22.23.4 again: 16 pass, 5 fail, 1 skip, 22 tests, 0 hangs. Same five failures, no new severity. Counts: `tools/sport-qa/baselines/harness-20261120T140035Z.json`. Hub screenshots: `tests/e2e/sport/screenshots/20261120T140035Z/`.

Quality gates on `2ad9d9e` (runs 44749425321 and 44749434861) did not start. All four jobs failed in about two seconds with no runner and no steps. GitHub’s annotation says the job was not started because recent account payments have failed or the spending limit needs to be increased. That is an Actions billing block. The last executed suite remains the `4f9e934` run above.

### Probe 5 — 2026-11-20T14:30:27Z

Fetched each stream again. Tips are still `1483a45`, `8f50352`, `17ca51b`, and `18f1bc2`. None match feature-complete. The throwaway merge was clean and was not pushed. Harness on Node v22.23.4 again: 16 pass, 5 fail, 1 skip, 22 tests, 0 hangs. Same five failures, no new severity. Counts: `tools/sport-qa/baselines/harness-20261120T143027Z.json`. Hub screenshots: `tests/e2e/sport/screenshots/20261120T143027Z/`.

## Findings

### P0

1. **web.** `web/sport/fixtures/catalog.js` embeds real legal names and source URLs inside the client module (248 matches against `real.name` and `real.url` in the content JSON). `presentCard` strips `real` before the objects screens render, and the hub screenshots show parody names only. The page still loads that module, because `web/sport/fixtures/index.js` re-exports the catalog and the screens import that index. Real identity is in player-facing JavaScript.

### P1

1. Pre-existing, v0.5 web adapter: `createMatch` does not expose the engine match. Sport files were not changed. The v0.5 acceptance failure stays red on purpose.
2. Pre-existing hideout layout, measured again on the merged tree. At 844×390, 667×375, 915×412, and 1280×720 the home buttons Save, Load, Cabin, Bungalow, Cottage, Loft, Villa, and Penthouse start below the viewport. Map hotspots and the Sport Complex hub buttons were inside at all four sizes. `sport/v06-web` does not change `web/js/screens/home.js` or `web/css`.

### P2

- v0.5 `layoutWorldMap` is still not exported from `web/src/map/`. Map behaviour that uses `web/js/map-layout.js` is already covered by other tests.
- v0.5 browser tests did not drive Chrome, because `playwright-core` and `@playwright/test` are not installed in this repo. The sport harness loads `playwright-core` from a side install and serves `web/` over `127.0.0.1`.
- `src/sport/gacha/catalog.js` mentions `LOCKED` and `PRODUCTION_READY` only in a comparison that rejects those statuses. That is not a status assignment.
- The card-game envelope stays at save version 2. Sport state is the added `profile.sport` bag. v1 and v2 fixtures still load.
- No stream tip is a feature-complete commit yet.
