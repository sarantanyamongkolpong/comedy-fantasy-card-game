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
| `defaultRuleConfig()` | Locked numbers plus `PENDING_OWNER` placeholders. |

`targets` may be an array of avatar ids, or `{ avatarIds, retrieveInstanceIds }`.

## Extensions

`previewAction`, `armAction`, `cancelAction`, `runEnemyTurn`, `proposedSampleRoster`, `buildSampleDeck`, `proposedSampleMatchInput`, `sampleCard`, `resolveRuleConfig`.

`shuffleDecks` defaults to `true`. Tests that need a scripted pile pass `false`. Reshuffles of an empty draw pile always use the match seed.

`runEnemyTurn` plays the active AI side, ends its turn, and discards that side's end-of-round excess. It does not play a human turn.

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
    payloadStatus: 'PENDING_OWNER', payload: null
  }
}
```

`all_avatars_defeated` is a win for the side that still has a living avatar and a loss for the wiped side. No currency amount is invented.

## State

`getState` is safe to `JSON.stringify`. Callers may mutate the match object passed into the functions. Do not keep aliases into nested arrays; `getZones` and `getOutcome` return copies.
