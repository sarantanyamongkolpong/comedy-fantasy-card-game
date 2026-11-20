# SPORT COMPLEX v0.6 — Stream Contracts (base: sport/v06-base from integration/v05-final @ 953f5cc)

Source of truth: docs/sport_v06/drive/MIRA_SPORT_COMPLEX_v0.6_OWNER_BRIEF.md (§10 = Implementation Prompt) + sheets/*.csv + PLAN.md.
Status vocabulary: RESEARCH / PROPOSED / QA_PASSED / OWNER_APPROVED / INTEGRATED. Never write LOCKED for anything not locked by the Owner.

## Hard rules (all streams)
- Draft PR only, into sport/v06-base. Never merge, never force-push, never touch main, PR #9, hunter-life.
- Do not rewrite the v0.5 card-game engine or break SAVE_VERSION 1/2 saves. Existing Character/Asset IDs preserved.
- Parody names + original/placeholder art only in the UI. No real logos, likenesses, or real names shown to players.
- Real identity, source URL, season, snapshot date live ONLY in `real` blocks of internal data; never rendered.
- Real stats and game stats are separate fields. Every invented number is tagged `"balance": "BALANCE_PLACEHOLDER"` (status PROPOSED). Never claim game numbers are official stats.
- One shared G wallet (existing `currency.G`). One banner per sport: SPORT_FOOTBALL, SPORT_BASKET, SPORT_CAR, SPORT_MOTO, each with own pity. Rarity N/R/Epic/EX only.

## Interim defaults (PROPOSED, pending Owner — keep configurable in one tuning file)
- Placeholder stats allowed in preview, clearly labelled.
- Opponent teams: original fictional parody teams (status PROPOSED) to fill 11v11 / 5v5 / 2-entry grids.
- Car/Moto: driver+vehicle combined into one entry card inside the single sport banner (no separate Rider/Bike gacha; conflict C1 resolved toward locked rule).
- Pity per sport banner: Epic 100 / EX 200 (mirrors v0.5, PROPOSED). Pull cost and event G rewards: placeholder values in tuning.
- Mobile length: football ~90 sim-minutes compressed to ~60-90 s playback, basket 4x10 compressed, races ~10-15 laps compressed; skip button always available.

## Ownership (no file overlap)
| Stream | Branch | Owns |
|---|---|---|
| data | sport/v06-data | content/v06/sport/** , content/v06/sport/sources.json, tuning.json, tools/validate-sport-provenance*, tests/sport/data/** |
| sim | sport/v06-sim | src/sport/** (football, basket, racing core, car, moto, gacha, wallet ledger, save v3 migration), tests/sport/sim/** |
| web | sport/v06-web | web/sport/** , minimal hooks in web map to unlock Sports Complex hotspot, tests/sport/web/** |
| qa | sport/v06-qa | tests/sport/qa/**, tests/e2e/sport/**, docs/sport_v06/QA_REPORT.md |

## Interfaces
- Card record: `{ id: "SPC_<SPORT>_<ROLE>_<NNN>", sport, role, parodyName, rarity, team, stats:{...exact locked stat keys}, balance:"BALANCE_PLACEHOLDER", status:"PROPOSED", art:{ slot, placeholder:true }, real:{ name, url, season, snapshotDate } }`
- Locked stat keys: football Power/Def/Speed/Sta/Acc; basket Shooting/Def/Spd/Sta; car & moto TopSpeed/Accel/Handling (no Sta).
- Sim API: `simulate<Sport>({ seed, home, away|field, tactics, tuning }) -> { events:[{t, type, actors, text}], result:{ score|standings, winner, mvp }, rewards:{ G, status:"PROPOSED" } }`, pure & deterministic per seed.
- Gacha: `pullSport(state, bannerId, count, seed)` spends G via wallet ledger, updates `state.sport.pity[bannerId]`.
- Save v3: adds `state.sport = { roster:{}, pity:{}, ledger:[] }`; v1/v2 load and migrate losslessly.
- Web reads data only via `content/v06/sport/index.json`; until data lands, sim/web may use fixtures under their own tests/ dirs.
