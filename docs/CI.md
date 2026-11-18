# CI

GitHub Actions runs four checks on every pull request (any base branch) and on every push except `main`. The workflow is `.github/workflows/quality-gates.yml`. Runners are GitHub-hosted `ubuntu-latest`. The only actions are `actions/checkout` and `actions/setup-node`. Nothing is installed from npm.

Each check prints `PASS` or `FAIL` and, on Actions, writes the same report to the job summary.

| Check | What it covers | Local command |
|---|---|---|
| `SYSTEMS_TEST` | `node --test` on Node.js 20 and Node.js 22 | `node --test` |
| `DATA_VALIDATION` | JSON parses, duplicate character IDs, schema validators | `node tools/ci/validate-data.mjs` |
| `ASSET_MANIFEST_VALIDATION` | Duplicate asset IDs and manifest paths | `node tools/ci/validate-assets.mjs` |
| `REPOSITORY_STRUCTURE` | Required docs and protected constants | `node tools/ci/validate-repository.mjs` |

Node.js 20 or newer is enough to run the scripts locally. Actions runs the test suite on both current LTS lines, 20 and 22. Validation jobs use Node.js 22.

## SYSTEMS_TEST

The test step is `node --test` with no file list. Node's own discovery picks up test files anywhere in the checkout, including folders that are not in the tree yet (`tests/stress`, `tests/debug`, `tests/balance-lab`, `tests/authoring`, `tests/integration`, `content`, `tools/replay`, and others). A new folder does not need a workflow edit.

Default discovery includes `*.test.js`, `*.test.mjs`, `*-test.js`, `*_test.js`, `test-*.js`, `test.js`, and JavaScript files under a directory named `test`. Helpers such as `tests/helpers/stub-rules.js` are not test files and are not executed.

The job fails when either Node version fails, and it fails when zero tests are discovered. `CONCEPT` and `PROTOTYPE` fixtures stay valid. The suite is not pointed at unfinished rules to force a pass.

On Actions the spec reporter stays in the log. `tools/ci/github-summary-reporter.mjs` adds a per-version section to the job summary.

## DATA_VALIDATION

Every `*.json` file outside `.git`, `node_modules`, and `coverage` must parse.

Character IDs must be unique in two places:

- Avatar and named character records (`avatarId` with a name, or `characterId` / `character_id` with a name), across JSON and the catalog modules `src/avatars/catalog.js`, `src/cards/catalog.js`, and `src/avatars/ownership.js`.
- Keys of `characters` objects inside a single JSON file (rig and manifest indexes). The same id may appear once in the catalog and again in a manifest or rig index. Those are one character described in more than one layer, not two characters.

References such as `owner`, `nativeAvatarId`, and `subjectId` are not character definitions.

Schema checks call `src/schema/validate.js` for records that match a known shape: faction, avatar, avatar card, action card, equipment, ownership, variant, and asset manifest. JSON that is not one of those records (frame layout, rigs, the slot map, the protected-constants snapshot) is only checked for parse. The script does not fill in deck size, damage, HP, AP costs, gacha rates, or upgrade formulas.

## ASSET_MANIFEST_VALIDATION

Asset IDs must be unique inside each manifest `assets` array and inside each other collection of asset records (objects with `asset_id` plus `path`, `type`, `slot`, or `file`). The same id in two live manifests outside `tests/` also fails. Test fixtures are checked per file. A fixture id may repeat the same id as a future live manifest, because the fixture is a snapshot of that manifest.

Path checks read `path` on manifest entries and require a file inside the repository. They run only when `assets/` exists and a live manifest outside `tests/` exists (the canonical file is `docs/ASSET_MANIFEST.json`).

On this systems branch both are absent. The check prints a skip notice and still passes if ids are unique. That is intentional: art is on `feat/card-art-prototype-mira` (PR #1). A missing art tree is not a failure.

`CONCEPT` and `PROTOTYPE` are valid statuses. `QA_PASSED`, `PRODUCTION_READY`, and `INTEGRATED` are valid too. None of them is required. A live manifest whose status is outside that vocabulary fails.

## REPOSITORY_STRUCTURE

These files must exist and be non-empty:

- `README.md`
- `docs/CI.md`
- `docs/DATA_SCHEMA.md`
- `docs/INTEGRATION_NOTES_FOR_MIRA.md`
- `docs/OPEN_DESIGN_DECISIONS.md`
- `docs/SYSTEMS_PROGRESS_REPORT.md`
- `docs/SYSTEMS_REPO_AUDIT.md`
- `src/schema/constants.js`
- `src/schema/game.schema.json`
- `src/schema/validate.js`
- `tools/ci/protected-constants.json`

`tools/ci/protected-constants.json` is the approved snapshot for:

| Constant | Approved value |
|---|---|
| Party size | 4 |
| Hand size | 5 |
| Base AP | 5 |
| Factions | Aegis Dominion (Tank), Phantom Blades (DPS), Celestial Nexus (Magic), Sanctuary Order (Support) |
| Action categories | `ATK`, `DEF`, `Skill` |
| Status vocabulary | `CONCEPT`, `PROTOTYPE`, `QA_PASSED`, `PRODUCTION_READY`, `INTEGRATED` |

The check imports `src/schema/constants.js` and compares those exports to the snapshot. `sha256` in the snapshot is the SHA-256 of the canonical JSON for those six fields. Editing the numbers without updating the hash fails. Editing the runtime constants without updating the snapshot fails.

An Owner-approved change updates `src/schema/constants.js`, `tools/ci/protected-constants.json` (including `sha256`), and the expected values in `tests/ci/repository-structure.test.js` in the same change.

The snapshot does not include deck size, damage, HP, gacha rates, or upgrade formulas. Those stay open. See `docs/OPEN_DESIGN_DECISIONS.md`.

## Exit codes

`0` is `PASS`. `1` is `FAIL`. Asset path skips are still `PASS`.

`--root <directory>` points a script at another checkout. The default is this repository.
