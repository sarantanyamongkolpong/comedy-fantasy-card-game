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

1. Starter roster, opponents and home name "Your Complex": `web/sport/live/tuning.js`. (The 8000 G start is now an Owner decision. See below.)
2. Coach passives: content has no passive field, so the web stream's coach notes are mapped onto the sim vocabulary. Original coaches get `none`.
3. Key maps for basket scheme and pace, race tyre, moto setup, and car aeroBias (+4 / 0 / -4).
4. *(Superseded by Owner decision t282u #5. See below.)*
5. *(Superseded by Owner decision t282u #6. See below.)*
6. The race track is the sim default, because content tracks have no sectors. **Gap.**
7. Lineups live for the session only (not saved).
8. Display only: the playback event cap comes from content matchLengths, and race qualifying lines are filtered to pole plus your entries.
9. A multi-role card (e.g. "RB/RWB") uses its first token as the primary role and keeps the full role list.
10. `src/sport/moto/roster.js`: the default rider `SPC_MOTO_ENTRY_008` was renamed from "Joan Mirage" to "Horizon Mirage", the data stream's approved parody. The old name contains a real rider's name. The ID is unchanged.
11. The orphan fixture portrait slots were pruned from `web/sport/art-manifest.json`. Each content card now has a `SPORT_ART_<id>` placeholder slot.
12. Cross-stream test adjustments: `tests/sport/web/live-adapter.test.js` (live semantics: sim purse, integer seeds, 20+ car race rows) and `lineup.test.js` (live catalog).


## Owner decisions (source t282u, 2026-11-20). Never LOCKED.

| # | Decision | Status | Where | Verified by |
|---|---|---|---|---|
| 4 | A new player starts with 8,000 G | MVP_PROVISIONAL. Economy Balance review still required | `web/sport/live/tuning.js` (`previewStartingG`, `previewStartingGStatus`) | `tests/sport/integration/owner-decisions.test.js` |
| 5 | A x10 pull costs exactly 10 × the single price (no discount) and uses the same rates and pity as single pulls | OWNER_DECIDED (cost and odds values stay PROPOSED / BALANCE_PLACEHOLDER) | `web/sport/live/economy.js` → `src/sport/gacha/pull-sport.js` (one tuning object for both counts; the per-pull loop applies the same weights and pity) | same test: 10× charge on every banner; Epic and EX pity fire on the same pull index; the rarity mix of 1,000 singles matches 100 x10 pulls |
| 6 | Match rewards come from the win/draw/loss table instead of the sim purse, paid once per match by result | OWNER_DECIDED (the values stay PROPOSED / BALANCE_PLACEHOLDER, as in the source) | `web/sport/live/simulate.js` (`rewardTable`, `resultKey`, `rewardPack`) | same test |

### #6 source check (the workbook checked before implementing)

- `docs/sport_v06/drive/SPORT_COMPLEX_v0.6_RESEARCH_20261120.xlsx` has **0 formula cells**, so there were no formulas to verify. It also has **no win/draw/loss reward values for any sport**:
  - Sheet "10 Gacha Wallet" gives costs and rates as "TBD editable".
  - Sheet "11 QA Decisions" OPEN-02 lists "Sports gacha prices, drop odds, pity, G rewards" as PROPOSED, "Owner approves later".
  - The CSV exports in `docs/sport_v06/sheets/` match the workbook.
- The only win/draw/loss table in the repo is the data stream's `content/v06/sport/tuning.json` → `eventRewardsG` (status PROPOSED, balance BALANCE_PLACEHOLDER). It is complete for all four sports:

| Sport | Win | Draw | Loss | Race: 1st / 2nd / 3rd / classified / DNF |
|---|---|---|---|---|
| football | 40 | 20 | 10 | n/a |
| basket | 40 | 15 | 10 | n/a |
| car | n/a | n/a | n/a | 60 / 40 / 30 / 15 / 5 |
| moto | n/a | n/a | n/a | 60 / 40 / 30 / 15 / 5 |

- These numbers **cannot be traced to the workbook** and need Owner confirmation. The table is used as delivered. No numbers were invented.
- Inconsistencies to note:
  - FIBA basketball cannot end in a draw (the sim plays overtime), so the basket draw value (15) is unreachable.
  - Race sports use placement keys, not win/draw/loss.
- Mapping (PROPOSED):
  - Football and basket use the home result from the final score.
  - Car and moto use the better-placed of your two entries in the Grand Prix order. DNF pays only when neither entry finished.
- Fallback: if a sport's table row is missing or incomplete, that sport alone keeps the sim purse. The reward then carries `source: "sim-purse"` and a `fallbackReason`. Today no sport falls back.
- Payment happens once per match through the wallet `claimReward` (`claimId = sport-reward:<eventId>`).

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
