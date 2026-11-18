# Systems tests

From the repository root, with Node.js 18 or newer and no installed packages:

```bash
node --test
```

`npm test` runs the same command.

Stubs for undesigned rules live in `tests/helpers/stub-rules.js`. Each one is marked `TEST-ONLY`. The game defaults in `src/` throw `BLOCKED_BY_DESIGN` instead of using those stubs.

`tests/fixtures/` is a JSON snapshot of the art branch. See `tests/fixtures/README.md`.
