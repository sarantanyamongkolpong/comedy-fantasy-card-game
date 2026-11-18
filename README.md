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
