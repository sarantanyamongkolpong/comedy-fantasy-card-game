# Requests for other streams

This branch does not edit `package.json`, `src/**`, or `.github/**`.

## Stream D — scripts and CI enum

1. No bundler step. The UI is static ES modules. From the repo root: `python3 -m http.server 8080`, then open `/web/`.
2. `npm test` (`node --test`) already picks up `tests/web/**/*.test.js`. Please keep that.
3. `ASSET_STATUSES` in `src/schema/constants.js` has no `GENERATED_REVIEW` value. Dream’s review state is stored as `review_status` on web manifest entries, and `status` stays `CONCEPT`, so `validateData` keeps passing. Please add `GENERATED_REVIEW` to the enum if that should become the official `status` string. Do not treat these files as `PRODUCTION_READY`.

## Streams A and B — imports the UI already calls

`web/js/game-api.js` dynamically imports, and uses the mock until every export exists:

- `src/engine/index.js`: `createMatch`, `startTurn`, `playAction`, `discardVoluntary`, `endTurn`, `resolveEndOfRoundDiscard`, `getZones`, `getOutcome`
- `src/config/index.js`: `defaultRuleConfig`
- `src/gacha/index.js`: `createBannerState`, `pull`
- `src/save/index.js`: `serialize`, `deserialize`
- optional `content/v05/index.js`: `avatars`, `actionCards`, `banners`

Checked again while finishing this branch:

- `core/v05-engine` @ `07b1b2f` exports the battle names this UI calls, plus `runEnemyTurn(state)`. The adapter maps that to `playEnemyTurn`.
- `core/v05-data` @ `0b37c05` exports `defaultRuleConfig`, `createBannerState`, `pull`, `serialize`, and `deserialize`.
- Neither branch is merged here, and their files are not copied onto `core/v05-web`. On this branch the adapter still serves the mock, because those modules are not in the tree.
- `content/v05/index.js` is still absent. Catalog JSON is on the data branch. The UI keeps its sample catalog until that module exists.
