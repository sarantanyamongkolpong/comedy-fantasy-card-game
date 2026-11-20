# Handoff — stream A battle engine

Branch `core/v05-engine`. Base `integration/v05-core-base`. The engine is playable and tested. It is not a finished ruleset: `productionReady` is false, and every pending combat number is marked `PENDING_OWNER`.

## Run

```sh
npm test
```

Node 20 and Node 22 are both required. Engine tests live in `tests/engine/v05-rules.test.js`, `tests/engine/auto.test.js`, and `tests/engine/practice-auto.test.js`, with a bridge test in `tests/battle.test.js` and a cost test in `tests/cards.test.js`. The practice file runs the mirror Justin deck (the web `buildMatchInput` roster) for seeds 1 through 50.

A short AI match:

```js
import { createMatch, getOutcome, proposedSampleMatchInput, runEnemyTurn } from './src/engine/index.js';

const state = createMatch(proposedSampleMatchInput({
  seed: 1,
  hp: 6,
  playerControl: 'ai',
  enemyControl: 'ai',
}));
while (getOutcome(state).status !== 'decided') runEnemyTurn(state);
```

`hp` only overrides the sample life total so the demo ends. It is not a rule.

## For stream B

Do not edit this branch's engine to publish catalog rows. Please add, in B's files:

- `AVT_AEG_002`, `AVT_PHA_002`, `AVT_CEL_002`, `AVT_SAN_002` with `designRef` `AV_EX01`–`AV_EX04`. Leave `AVT_*_001` unchanged.
- Action cards with `Cost_AP` 0–5, `Type`, `Faction_Requirement`, `Effect_Spec`, `On_Resolve_Zone`, `Zone_Recovery`.
- `DECK_SIZE = 30` in schema constants and the protected-constants hash.
- A re-export of this engine from `src/index.js` if the public barrel should expose it. This stream did not edit `src/index.js`.
- `pow` → `atk` migration that keeps `legacy.pow`. The engine already accepts both shapes.

`defaultRuleConfig()` can later move to `src/config` and be passed in as `config`. The engine will keep its copy until that object exists.

## For stream C

Drive the battle screen from `src/engine/index.js`. Show AP, the hand, and `getZones` for Draw, Discard, and Void at all times. Do not auto-call `endTurn` at 0 AP. A failed `playAction` or `cancelAction` must not be treated as a spent cost. After `endTurn`, if `phase` is `end_of_round_discard`, ask for `needsDiscard` and call `resolveEndOfRoundDiscard`, or call `runAutoTurn` for the side that still has extra cards. Read `getOutcome(state).rewards` once; `timesEmitted` stays 1.

AUTO is locked. SYNC is not in this build: there is no sync function and no sync config. The preference table is proposed:

- `chooseAutoActions(state, sideId)` returns the ordered plays for the animation. It does not spend AP.
- `runAutoTurn(state, sideId, opts)` plays them and then ends the turn. The returned `log` is the animation list (`play`, `discard_voluntary`, `end_turn`, `mandatory_discard`). `state` is the same match object, updated in place.
- `playEnemyTurn(state)` is `runAutoTurn` for the non-human side.
- Stop between actions with `opts.shouldStop` returning true, or `opts.maxActions`. The current action finishes; the turn is not ended, so the player can take over.
- `defaultRuleConfig().autoPolicy` is `PROPOSED`. Default name `balanced`: next-attack setup when it raises the hit, then highest damage on the lowest-HP legal target, then a real shield or taunt if a hit can KO. A generic Skill is not given to Justina while an attack is available. A shield of 0 does not outrank damage. Zero-value cards are discarded for 1 AP so the hand can draw. Edit `policies.balanced` to change the order. Do not mark the policy `LOCKED`.
- Pass `config` into `createMatch`. The web adapter forwards `input.config`. The engine applies `config.damage.preset` when one is set. The product leaves the preset null, so the default floor stays 1.
- Damage presets are selectable and still `PENDING_OWNER`. Leave `damage.preset` null for the current floor of 1. `floor_25_pct_atk`, `floor_50_pct_atk`, and `flat_atk` are named alternates. They do not change the default formula. On the mirror Justin deck the default floor still takes a long tank grind after the DPS avatars die, because a hit into DEF 8 is 1. That is the open damage decision, not a frozen AUTO turn.

`runEnemyTurn` remains the older lowest-instance demo. The web adapter should call `playEnemyTurn` for AUTO.

## For stream D

Contract names above are stable. Acceptance tests should import `src/engine/index.js`, not the legacy `createBattle` shell. `getState` is the serialize snapshot. Pending flags are on `defaultRuleConfig()` and on `state.flags`.

## Known limits

- Damage, HP, heal cap, regen timing, status duration, team-SPD math, SPD ties, and simultaneous death are placeholders. See `docs/engine/RULES.md`. The default damage floor is still 1. On the mirror Justin practice match a hit into Case is 1 after the damage dealers die, so the match runs long. Pick `damage.preset` if a shorter match is wanted. The default was not switched.
- A KO sets `alive` false, HP 0, and clears that unit's statuses. The unit stays in the roster so the screen can show the seat. `0/14` with `alive: false` is defeated, not still fighting.
- The legacy hand still throws on draw and discard. v0.5 zones are inside the match.
- No currency payload is filled in. Rewards are a single result object.
- `runEnemyTurn` is still the lowest-instance demo. AUTO decisions come from `autoPolicy` and are proposed, not a tuned difficulty.
- SYNC was dropped. Do not add it on this branch.
- Only the listed damage formulas and policies are implemented. Any other config value throws instead of pretending to be the placeholder.
