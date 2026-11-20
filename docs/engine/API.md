# v0.5 battle engine API

Entry point: `src/engine/index.js`. Pure JavaScript. No DOM. The same seed and the same calls produce the same `getState` output.

This build is incomplete. `state.productionReady` is `false`. Do not treat placeholder combat numbers as approved balance.

Stream B owns `src/config`. Until that lands, pass a rule config into `createMatch`. `defaultRuleConfig()` is the engine default.

## Stable names

| Function | Role |
|---|---|
| `createMatch({ seed, config, teams, decks, matchId, shuffleDecks })` | Build a match, draw opening hands, start the first turn. |
| `startTurn(state)` | Idempotent once the current turn has started. A second call does not draw or refresh AP again. |
| `playAction(state, { cardInstanceId, actorAvatarId, actorAvatarIds, targets })` | Play one action card. Illegal plays spend no AP. |
| `discardVoluntary(state, cardInstanceId)` | Own-turn discard. Costs 1 AP. |
| `endTurn(state)` | Manual end. Never called automatically at 0 AP. |
| `resolveEndOfRoundDiscard(state, cardInstanceIds)` | Free discard down to 5 after a round. |
| `getZones(state, sideId)` | `{ draw, hand, discard, void }` copies. |
| `getOutcome(state)` | Ongoing, or a decided result with a rewards object. |
| `getState(state)` | JSON clone of the whole match. |
| `defaultRuleConfig()` | Locked numbers, `PENDING_OWNER` placeholders, and the proposed `autoPolicy` table. |
| `chooseAutoActions(state, side, opts?)` | Ordered legal actions for that side's current turn. Does not change the match. |
| `runAutoTurn(state, side, opts?)` | Plays that list, then ends the turn. Returns the match plus an action log. |
| `playEnemyTurn(state, opts?)` | `runAutoTurn` for the enemy side. |

`targets` may be an array of avatar ids, or `{ avatarIds, retrieveInstanceIds }`.

## Extensions

`previewAction`, `armAction`, `cancelAction`, `runEnemyTurn`, `proposedSampleRoster`, `buildSampleDeck`, `proposedSampleMatchInput`, `sampleCard`, `resolveRuleConfig`.

`shuffleDecks` defaults to `true`. Tests that need a scripted pile pass `false`. Reshuffles of an empty draw pile always use the match seed.

`runEnemyTurn` plays the active AI side with the original lowest-instance demo, ends its turn, and discards that side's end-of-round excess. It does not play a human turn.

`runAutoTurn` uses `autoPolicy` (default `balanced`, status `PROPOSED`). Pass `opts.shouldStop` or `opts.maxActions` to stop between actions without ending the turn. `playEnemyTurn` is that helper for the enemy side. SYNC is not implemented.

## Teams and decks

```js
createMatch({
  seed: 1,
  teams: [
    { sideId: 'player', control: 'human', avatars: [/* 4 */] },
    { sideId: 'enemy', control: 'ai', avatars: [/* 4 */] },
  ],
  decks: { player: [/* 30 action cards */], enemy: [/* 30 */] },
})
```

`decks` may also be an array parallel to `teams`. Avatars are field units. A deck card with `cardKind: 'avatar_card'` is rejected. The same `avatarId` may appear on both sides; lookups stay inside the side the target rule names.

## Outcome and rewards

`getOutcome` returns `status: 'ongoing'` and `rewards: null` until the match ends. The first time a side is wiped, or both sides are wiped in one resolution, the engine writes one rewards object and one `rewards` log event. Later calls do not write another.

```js
{
  status: 'decided',
  winnerSideId,
  loserSideId,
  verdict: { [winner]: 'victory', [loser]: 'defeat' },
  reason: 'all_avatars_defeated' | 'simultaneous_death',
  rewards: {
    emissionId, emitted: true, timesEmitted: 1,
    matchId, winnerSideId, loserSideId, reason,
    payloadStatus: 'PENDING_OWNER',
    payload: {
      status: 'PENDING_OWNER',
      label: 'PENDING_OWNER',
      G: null, GStatus: 'PENDING_OWNER',
      loot: null, lootStatus: 'PENDING_OWNER',
      items: null, itemsStatus: 'PENDING_OWNER',
    }
  }
}
```

`all_avatars_defeated` is a win for the side that still has a living avatar and a loss for the wiped side. `G` and `loot` stay `null`. They are labelled `PENDING_OWNER`. Passing that payload to `applyBattleReward` grants nothing, because a grant requires an integer `G`.

While the match is ongoing, `getOutcome` is `{ status: 'ongoing', winnerSideId: null, loserSideId: null, verdict: null, reason: null, rewards: null }`. `playAction` and `endTurn` mutate the same match object and return `{ ok, reason, outcome }`. They do not return a replacement state.

## Battle log amounts

`state.log` records the numbers a floating combat label can read. `amount` is the effect size. `delta` is the HP change (negative damage, positive heal, `0` for a shield).

| `type` | Amount fields |
|---|---|
| `damage` | `amount` hit, `dealt` HP lost, `absorbed`, `delta`, `avatarId`, `sideId`, `hp` |
| `shield` | `amount` added, `shield` pool after, `delta` 0, `avatarId`, `sideId` |
| `regen_applied` | `amount`, `ticks`, `delta` 0, `avatarId`, `sideId` |
| `regen_tick` | `amount` (the +3), `healed` HP gained, `delta`, `hp`, `ticksRemaining`, `avatarId`, `sideId` |

`runAutoTurn(...).log` is the action list (`play`, `discard_voluntary`, `end_turn`). The amounts above are on `state.log`, not on that action list.

## State

`getState` is safe to `JSON.stringify`. Callers may mutate the match object passed into the functions. Do not keep aliases into nested arrays; `getZones` and `getOutcome` return copies.
