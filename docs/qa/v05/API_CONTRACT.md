# v0.5 acceptance API contract

Stream D calls these names. The audit list is the minimum. Later exports from `origin/core/v05-data` are accepted where they implement the same locked rule. A missing module is `todo`, not a pass. A module that exists and breaks a locked rule is a failure.

## Battle engine (`src/engine/index.js`) — not landed at the first integration pass

`createMatch`, `startTurn`, `playAction`, `discardVoluntary`, `endTurn`, `resolveEndOfRoundDiscard`, `getZones`, `getOutcome`, `advanceStatusTick`, `rollPassive`.

`createMatch({ seed, deal: 'preserve', config, teams, decks })` deals the opening hand from the front of `decks[].cards` when `deal` is `preserve`. Seeded shuffle is for recycling Discard into Draw.

`getZones(state, sideId)` returns `{ draw, hand, discard, void }`. `getOutcome(state)` returns `{ result: 'ongoing'|'win'|'lose'|'simultaneous', winningSideId, losingSideId, rewards }`. `playAction(..., { commit: false })` must not spend AP or move cards.

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
