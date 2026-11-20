# Sport v0.6 integration (Draft, no merge)

Branch `integration/v06-sport`, cut from `sport/v06-base` @ d5da98a. Status: PROPOSED. Every number is BALANCE_PLACEHOLDER. Nothing here is Owner-approved. Do not merge without Owner approval.

## Streams merged (non-ff, no rebase)

| PR | Branch | Head merged |
|---|---|---|
| #31 | sport/v06-data | 1483a45 |
| #29 | sport/v06-sim-ball | 8f50352 |
| #34 | sport/v06-sim-race | 17ca51b |
| #28 | sport/v06-web | 18f1bc2 |
| #32 | sport/v06-qa | bef153f, then 4f9e934 (probe 3 harness) |

Stream ownership was disjoint. Every merge was clean.

## Wiring

- `web/sport/live/` is the only runtime source for Sport Complex screens (`live/index.js`).
- Cards, teams, venues, tactics, banner cost, odds and pity come from `web/sport/live/content.public.json`. That file is generated from `content/v06/sport/index.json` by `node tools/sport-web/build-public-content.mjs`. It holds parody fields only; `real` blocks are dropped, and `--check` fails if the file is stale.
- Sims: `simulateFootball`, `simulateBasket`, and the car and moto race sims from `src/sport`. `live/simulate.js` only adds display fields (clock, commentary, board, shortened race text).
- Wallet, gacha and save: `src/sport/wallet` (spend, earn and claimReward, idempotent on txnId), `src/sport/gacha` (content pools passed as a transient `tuning.pools` override), and `src/sport/save` (`profile.sport = {roster, pity, ledger}`). G stays on the existing wallet. The save envelope stays SAVE_VERSION 2, and v1/v2 saves load (see `tests/sport/integration/live-wiring.test.js`).
- Fixtures: the web stream's `web/sport/fixtures/` was **removed**. Its catalog embedded real names and URLs (QA P0). There is no runtime fallback. The web stream's unit tests now run against the live adapter (`tests/sport/web/live-adapter.test.js`).
- Single-file build: `web/tools/build-single-html` inlines sport.css and the sport art. It also strips the private `real(name, url)` provenance strings from `src/sport/gacha/catalog.js` out of the bundle, and fails the build if any formula1.com or motogp.com URL survives.

## PROPOSED decisions (contract gaps, least-invasive choice)

1. Starter roster, opponents, home name "Your Complex", and preview balance of 8000 G for a profile with no G field: `web/sport/live/tuning.js`.
2. Coach passives: content has no passive field, so the web stream's coach notes are mapped onto the sim vocabulary. Original coaches get `none`.
3. Key maps for basket scheme and pace, race tyre, moto setup, and car aeroBias (+4 / 0 / -4).
4. A x10 pull costs 10 × the content pull cost, with no discount (the fixture used 900).
5. Match rewards pay the sim purse (`sim.rewards.G`), claimed once per eventId. Content `eventRewardsG` (win/draw/loss) is not consumed yet. **Gap.**
6. The race track is the sim default, because content tracks have no sectors. **Gap.**
7. Lineups live for the session only (not saved).
8. Display only: the playback event cap comes from content matchLengths, and race qualifying lines are filtered to pole plus your entries.
9. A multi-role card (e.g. "RB/RWB") uses its first token as the primary role and keeps the full role list.
10. `src/sport/moto/roster.js`: the default rider `SPC_MOTO_ENTRY_008` was renamed from "Joan Mirage" to "Horizon Mirage", the data stream's approved parody. The old name contains a real rider's name. The ID is unchanged.
11. The orphan fixture portrait slots were pruned from `web/sport/art-manifest.json`. Each content card now has a `SPORT_ART_<id>` placeholder slot.
12. Cross-stream test adjustments: `tests/sport/web/live-adapter.test.js` (live semantics: sim purse, integer seeds, 20+ car race rows) and `lineup.test.js` (live catalog).

## Known pre-existing issues (not fixed)

- QA-10 "real-engine Deck Battle Rewards win and lose" fails, as on the base branch.
- `tests/web/auto-battle.playwright.test.js` can hang (setAutoDelay). Run with `--test-timeout=120000`.
- `tests/e2e/v05-full-loop.playwright.test.js`: v0.5 Back and Save buttons sit outside 844x390 (P1, outside sport).
- `tests/e2e/sport/viewport-buttons.test.js`: the hideout buttons sit below the viewport at all 4 sizes (QA P1, outside sport).

## Verify

- `node tools/sport-web/build-public-content.mjs --check`
- `node --test --test-timeout=120000`
- `node tests/sport/integration/sport-integration.spec.js` (Playwright; screenshots in `tests/sport/integration/screenshots/<WxH>/`)
- `node web/tools/build-single-html`
