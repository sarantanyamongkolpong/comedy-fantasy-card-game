# Fixture adapters

Screens import `web/sport/fixtures/index.js` only. That file is the switch.

| Export | Fixture | Live replacement (other streams) |
|---|---|---|
| `listPublicCards`, `getCard`, `opponentsFor` | `catalog.js` | `content/v06/sport/index.json` |
| `simulateSport` | `simulate.js` | `src/sport/*/sim.js` |
| `pullSport`, `grantG` | `gacha.js` | `src/sport/gacha` and `src/sport/wallet` |
| `getTuning` | `tuning.js` | `content/v06/sport/tuning.json` |

`catalog.js` keeps a `real` block on each researched card so the record matches `docs/sport_v06/CONTRACTS.md`. `presentCard` deletes that block. UI code must keep using the presented card.

Numbers in `tuning.js` are `PROPOSED` / `BALANCE_PLACEHOLDER`. They are not official stats.
