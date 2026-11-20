# Handoff — stream A battle engine

Branch `core/v05-engine`. Base `integration/v05-core-base`. The engine is playable and tested. It is not a finished ruleset: `productionReady` is false, and every pending combat number is marked `PENDING_OWNER`.

## Run

```sh
npm test
```

Node 20 and Node 22 are both required. Engine tests live in `tests/engine/v05-rules.test.js`, `tests/engine/auto.test.js`, `tests/engine/practice-auto.test.js`, and `tests/engine/final-contract.test.js`, with a bridge test in `tests/battle.test.js` and a cost test in `tests/cards.test.js`. The practice file runs the mirror Justin deck (the web `buildMatchInput` roster) for seeds 1 through 50. The final-contract file covers the pending reward payload, floater log amounts, Saving Grace's two regen ticks, and the `player` / `enemy` side ids.

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
- Pass `config` into `createMatch`. The web adapter forwards `input.config`, and `web/js/app.js` fills it from the engine's `defaultRuleConfig()`, so the web build plays the engine default with no web change.
- Damage (Owner t269u, 2026-11-20): default `damage.preset` is `flat_atk`, `damage.status` is `MVP_PROVISIONAL` (not LOCKED). Damage = effective ATK + on-attack bonus, DEF ignored; DEF still adds HP (`10 + DEF * 2`). Switch by editing `damage.preset` in `src/engine/rule-config.js` or passing `config.damage.preset` (`null` = legacy floor 1, `floor_25_pct_atk`, `floor_50_pct_atk`). Damage log events carry `formulaStatus` (the config status) and `preset`. `state.flags.damageFormula` mirrors the status. `src/config` `damageFormula` is `MVP_PROVISIONAL` with `provisional: 'flat_atk'` and `value: null`. Report: `docs/final_v05/DAMAGE_FLAT_ATK_REPORT.md`.

`runEnemyTurn` remains the older lowest-instance demo. The web adapter should call `playEnemyTurn` for AUTO.

## For stream D

Contract names above are stable. Acceptance tests should import `src/engine/index.js`, not the legacy `createBattle` shell. `getState` is the serialize snapshot. Pending flags are on `defaultRuleConfig()` and on `state.flags`.

Side ids are the `sideId` strings on `createMatch` teams. The practice match and the acceptance fixtures use `player` and `enemy`. `getZones`, `chooseAutoActions`, and `runAutoTurn` accept those strings, or `{ sideId: 'player' }`. Any other second argument throws `UNKNOWN_SIDE`.

AUTO-01 through AUTO-04 call `chooseAutoActions(state, { seed })` and `runAutoTurn(state, { seed, auto })`. `{ seed, auto }` is not a side, so the engine throws `UNKNOWN_SIDE`. The engine already accepts `player` and `enemy`. The tests should pass the side id:

- `chooseAutoActions(state, state.activeSideId)`
- `runAutoTurn(state, 'player', opts)` for the human turn. `opts` is the third argument (`maxActions`, `shouldStop`, `policy`).
- `playEnemyTurn(state)` for the non-human side. It does not take a side name.

There is no `state.auto` and no `opts.auto`. Stop calling `runAutoTurn`, or pass `shouldStop` / `maxActions`, to give the turn back. The return is `{ state, outcome, ok, log, actions, stopped, ended }`. `log` is the action list. It is not `{ played }`.

`playAction` and `endTurn` mutate the match in place and return `{ ok, reason, outcome }`. They do not return `{ state }`. Keep the object you passed in and read `getOutcome` from it. QA-10's helper accepts that when the previous value is the match: `{ ok: true }` with a previous match that has `sides` is the same match.

The web session's `createMatch` returns a view and also sets `view.state` and `view.engine` to the match, plus `view.sides`. `asState` reads `view.state`. `getOutcome` accepts the view or the raw match.

`getOutcome` while the fight is going:

```js
{ status: 'ongoing', winnerSideId: null, loserSideId: null, verdict: null, reason: null, rewards: null }
```

When it is decided (`timesEmitted` stays 1; a later call does not write another rewards event):

```js
{
  status: 'decided',
  winnerSideId, loserSideId,
  verdict: { [winnerSideId]: 'victory', [loserSideId]: 'defeat' },
  reason: 'all_avatars_defeated' | 'simultaneous_death',
  rewards: {
    emissionId, emitted: true, timesEmitted: 1,
    matchId, winnerSideId, loserSideId, reason,
    payloadStatus: 'PENDING_OWNER',
    payload: {
      status: 'PENDING_OWNER', label: 'PENDING_OWNER',
      G: null, GStatus: 'PENDING_OWNER',
      loot: null, lootStatus: 'PENDING_OWNER',
      items: null, itemsStatus: 'PENDING_OWNER'
    }
  }
}
```

A player wipe is `winnerSideId: 'player'`, `verdict.player: 'victory'`. An enemy wipe is `winnerSideId: 'enemy'`, `verdict.player: 'defeat'`. `G` and `loot` stay `null`. Do not treat them as a grant. `applyBattleReward` adds currency only when `rewards.G` is an integer.

Floating numbers read `state.log`, not the AUTO action log:

- `damage`: `amount`, `dealt`, `delta` (negative HP change), `avatarId`, `sideId`, `hp`
- `shield`: `amount`, `shield`, `delta` 0, `avatarId`, `sideId`
- `regen_applied`: `amount`, `ticks`, `delta` 0
- `regen_tick`: `amount` is the +3, `healed` and `delta` are the HP gained

Justina `AV_EX04` Saving Grace is Regen +3 for 2 ticks. The cast turn does not heal. The next two starts of that side's turn each heal living allies, then the status expires. A dead unit is skipped.

## Known limits

- Damage is `flat_atk` as MVP_PROVISIONAL (Owner t269u), not a locked formula. HP, heal cap, regen timing, status duration, team-SPD math, SPD ties, and simultaneous death are placeholders. See `docs/engine/RULES.md`. Under `flat_atk`, DEF buffs (Case *Bulwark*) do not change damage, and the PROPOSED AUTO policy never casts Justina's regen; both are reported in the damage report, not fixed.
- A KO sets `alive` false, HP 0, and clears that unit's statuses. The unit stays in the roster so the screen can show the seat. `0/14` with `alive: false` is defeated, not still fighting.
- The legacy hand still throws on draw and discard. v0.5 zones are inside the match.
- The rewards payload is present and labelled. `G` and `loot` are `null` with status `PENDING_OWNER`. No currency amount is filled in.
- `runEnemyTurn` is still the lowest-instance demo. AUTO decisions come from `autoPolicy` and are proposed, not a tuned difficulty.
- SYNC was dropped. Do not add it on this branch.
- Only the listed damage formulas and policies are implemented. Any other config value throws instead of pretending to be the placeholder.
