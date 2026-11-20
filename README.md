# comedy-fantasy-card-game

Comedy Fantasy Card Game (separate project from Hunter Life)

## Systems prototype

Core data schema, a 4v4 turn battle, hand and AP checks, and an asset-id loader. There is no UI and no auto battler.

Run the tests with Node.js 18 or newer. There are no dependencies to install.

```bash
node --test
```

`npm test` runs the same command.

Docs:

- `docs/SYSTEMS_REPO_AUDIT.md` — what was on `main` and on the art branch before this code
- `docs/DATA_SCHEMA.md` — Avatar, Faction, Stats, cards, equipment, ownership, variants, manifest entries
- `docs/OPEN_DESIGN_DECISIONS.md` — questions for the Owner, including every BLOCKED_BY_DESIGN rule
- `docs/INTEGRATION_NOTES_FOR_MIRA.md` — manifest fields the loader expects
- `docs/SYSTEMS_PROGRESS_REPORT.md` — status table and how to run the tests

## v0.5 Core — How to run/test

Acceptance tests live on `core/v05-qa` and target the v0.5 rules. They do not change `src/` or `content/`. A missing engine, gacha, or web module is reported as `todo`, not as a pass. `INCOMPLETE` is not `PASS`. Nothing in this suite is marked ready to ship.

Node.js 20 and Node.js 22:

```bash
npm test
npm run test:acceptance
npm run test:e2e
```

`npm test` is still `node --test` and includes the existing suite. `npm run test:acceptance` writes `docs/qa/v05/ACCEPTANCE_STATUS.md` with pass, fail, todo, and skip totals per Node version. `npm run test:e2e` skips when `web/` or Playwright is absent; that skip is not a pass. See `tests/e2e/README.md`.

Rule coverage is listed in `docs/qa/v05/REQUIREMENT_RECONCILIATION.md`. Local merges of the other v0.5 branches are recorded in `docs/qa/v05/INTEGRATION_LOG.md` and are not pushed.

Next:

- Re-run `npm run test:acceptance` when `src/engine/index.js` or `web/` lands.
- Keep pending flags unset until the Owner decides them. SYNC is rejected (Owner t261u). AUTO battle is required; its policy stays proposed.
- Do not merge this branch into `main` from here.
