# v0.5 acceptance API contract

Stream D calls these names. The audit list is the minimum. Later exports from `origin/core/v05-data` are accepted where they implement the same locked rule. A missing module is `todo`, not a pass. A module that exists and breaks a locked rule is a failure.

## Battle engine (`src/engine/index.js`)

Landed on `origin/core/v05-engine` @ `07b1b2f`. Stable names: `createMatch`, `startTurn`, `playAction`, `discardVoluntary`, `endTurn`, `resolveEndOfRoundDiscard`, `getZones`, `getOutcome`.

`createMatch({ seed, shuffleDecks: false, teams, decks })` deals the opening hand from the front of each deck when `shuffleDecks` is false. `decks` is `{ player: cards, enemy: cards }` or an array parallel to `teams`. Cards need `targetRule` and an `effects` array. The engine assigns `instanceId`.

`getZones(state, sideId)` returns `{ draw, hand, discard, void }`. `getOutcome(state)` uses `status: 'ongoing' | 'decided'`, `winnerSideId`, `loserSideId`, and one `rewards` object (or null). A preview is `previewAction`. It must not spend AP. Regen ticks on the next start of that side's turn. `advanceStatusTick` and `rollPassive` are not exported; passives are in the match log.

Owner t261u (20 Nov 2026, 17:07 ICT) dropped SYNC. `vrSync` is `REJECTED` with `value: null`, or the flag is absent. It is not `PENDING`.

AUTO battle is required. The mode flag is `LOCKED`. The choice policy stays `PROPOSED`.

- `chooseAutoActions(state, sideId)` returns the ordered legal plays for that side and does not change the match. `sideId` is `'player'` or `'enemy'` (or `{ sideId }`). An options object is not a side.
- `runAutoTurn(state, sideId, opts)` plays that side's turn and updates the match in place. The return includes `state`, `log`, `ok`, `stopped`, and `ended`. `opts.shouldStop` or `opts.maxActions` stops between actions without ending the turn.
- `playEnemyTurn(state)` is `runAutoTurn` for the non-human side. It does not take a side name. There is no `state.auto` and no `opts.auto`.

`playAction` and `endTurn` mutate the match and return `{ ok, reason, outcome }`. They do not return `{ state }`. `getOutcome` on a decided match has `winnerSideId`, `loserSideId`, and `verdict` (`victory` for the winner, `defeat` for the loser). A player wipe is `winnerSideId: 'player'` and `verdict.player: 'victory'`. An enemy wipe is `winnerSideId: 'enemy'` and `verdict.player: 'defeat'`. `rewards.timesEmitted` stays 1. `rewards.payload` is `{ G: null, loot: null, items: null }` with status `PENDING_OWNER`. Damage, shield, and regen floaters are `state.log` entries (`damage.amount` / `dealt` / `delta`, `shield`, `regen_applied`, `regen_tick`).

The web adapter's `createMatch` must return that match (`sides`) or `{ state }`. A view that only has `engine`, `units`, and `phase` is a web bug: acceptance does not unwrap `view.engine` for the caller. The booth may pass a string seed; `engine-session.js` hashes it with `hashSeed` before `src/gacha` `pull`, which still rejects a raw string. Save reload of the web profile comes back as `{ webBundle, profile }`. `profile.team` and `profile.deck` are the round trip.

The web battle screen exposes the toggle (`data-testid="auto-toggle"`, `setAuto`, or `autoBattle`). The save profile keeps `preferences.autoBattle` through `serialize` / `deserialize`. `setAutoBattle(profile, enabled)` or `createProfile({ preferences: { autoBattle } })` must preserve it.

## Rule config (`src/config/index.js`)

`defaultRuleConfig()` returns a fresh object. Locked numbers: party 4, base AP 5, hand 5, deck 30, voluntary discard 1 AP, max level 5. Pending flags use status `PENDING` or `PENDING_OWNER` and `value: null`.

Owner t253u is stored on the config, not left pending:

- POW → ATK `1:1`, `legacy.pow` kept (`powToAtk`)
- Pity: per banner, Epic 100, top 200, companion Epic 100, no companion top pity, Epic hit resets Epic only, EX/FAC hit resets Epic and top

## Gacha (`src/gacha/index.js`)

`createBannerState(banner, saved?)` and `pull(state, { seed, count })`. A banner without an explicit test-only label is rejected (`GA11_RATES_PENDING`). Test weights are fixtures, not drop rates. Counters are `epicCounter` and `topCounter` (`topCounter: null` for companions).

## Migration and save

`migratePowToAtk(record)` copies `pow` to `atk` and sets `legacy.pow`. `serialize` / `deserialize` round-trip a profile. `consumeDuplicate` refuses locked stacks, favorite stacks, and copies reserved by `bindDeck`.

## Hideout (`src/schema/hideout.js`)

`HOUSE_TIERS` is Cabin through Penthouse. `displayHouseTier` returns the highest acquired tier id. `storageFromFurniture` sums installed furniture and adds no house-tier bonus. Cabin base stays pending.

## Web

`layoutWorldMap({ viewportWidth, viewportHeight, anchors })` for OWNER-PLAT-04. The Deck → Battle → Rewards smoke looks for the test ids in `tests/e2e/README.md`. `web/` was not present at the first pass.
