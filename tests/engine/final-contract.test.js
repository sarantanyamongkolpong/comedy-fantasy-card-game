import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseAutoActions,
  createMatch,
  defaultRuleConfig,
  endTurn,
  getOutcome,
  playAction,
  playEnemyTurn,
  runAutoTurn,
  sampleCard,
} from '../../src/engine/index.js';
import { handCard, matchInput, padDeck, roster } from './fixture.js';

function play(state, cardId, actorAvatarId, targets, sideId = 'player') {
  const card = handCard(state, sideId, cardId);
  assert.ok(card, cardId);
  return playAction(state, { cardInstanceId: card.instanceId, actorAvatarId, targets });
}

test('damage, shield, and regen log the amounts a floater can show', () => {
  const state = createMatch(matchInput({
    player: roster((avatar) => { avatar.hp = 20; avatar.maxHp = 30; }),
    enemy: roster((avatar) => { avatar.hp = 20; avatar.maxHp = 30; avatar.stats.def = 0; }),
    playerDeck: padDeck([
      sampleCard({ cardId: 'HIT', costAp: 0, effects: [{ op: 'damage', mode: 'flat', amount: 4 }] }),
      sampleCard({ cardId: 'WALL', type: 'DEF', costAp: 0, targetRule: 'Self', effects: [{ op: 'shield', amount: 2, target: 'self' }] }),
      sampleCard({ cardId: 'GRACE', type: 'Skill', costAp: 0, targetRule: 'Ally', effects: [{ op: 'trigger_active' }] }),
    ]),
  }));
  play(state, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  const damage = state.log.find((event) => event.type === 'damage');
  assert.equal(damage.amount, 4);
  assert.equal(damage.dealt, 4);
  assert.equal(damage.delta, -4);
  assert.equal(damage.avatarId, 'AVT_AEG_002');
  assert.equal(damage.sideId, 'enemy');
  assert.equal(damage.hp, 16);

  play(state, 'WALL', 'AVT_AEG_002');
  const shield = state.log.find((event) => event.type === 'shield');
  assert.equal(shield.amount, 2);
  assert.equal(shield.delta, 0);
  assert.equal(shield.shield, 2);
  assert.equal(shield.avatarId, 'AVT_AEG_002');
  assert.equal(shield.sideId, 'player');

  play(state, 'GRACE', 'AVT_SAN_002');
  const applied = state.log.filter((event) => event.type === 'regen_applied');
  assert.equal(applied.length, 4);
  assert.ok(applied.every((event) => event.amount === 3 && event.ticks === 2 && event.delta === 0 && event.sideId === 'player'));
});

test('AV_EX04 Saving Grace regen +3 lasts 2 turns', () => {
  const state = createMatch(matchInput({
    player: roster((avatar, index) => {
      avatar.hp = index === 0 ? 0 : 10;
      avatar.maxHp = 30;
      if (index === 0) avatar.alive = false;
    }),
    playerDeck: padDeck([
      sampleCard({ cardId: 'GRACE', type: 'Skill', costAp: 0, targetRule: 'Ally', effects: [{ op: 'trigger_active' }] }),
    ]),
    enemyDeck: padDeck([sampleCard({ cardId: 'WAIT', costAp: 0, effects: [{ op: 'shield', amount: 0, target: 'self' }] })]),
    enemyControl: 'human',
  }));
  const justina = state.sides.player.avatars.find((unit) => unit.avatarId === 'AVT_SAN_002');
  assert.equal(justina.designRef, 'AV_EX04');
  assert.equal(justina.active.name, 'Saving Grace');
  assert.equal(justina.active.effects[0].amount, 3);
  assert.equal(justina.active.effects[0].ticks, 2);
  play(state, 'GRACE', 'AVT_SAN_002');
  const living = state.sides.player.avatars.filter((unit) => unit.alive);
  assert.equal(living.length, 3);
  assert.equal(state.sides.player.avatars[0].statuses.some((status) => status.kind === 'regen'), false);
  assert.equal(state.log.filter((event) => event.type === 'regen_tick').length, 0);

  const ownTurn = () => {
    endTurn(state);
    endTurn(state);
  };
  ownTurn();
  let ticks = state.log.filter((event) => event.type === 'regen_tick');
  assert.equal(ticks.length, 3);
  assert.ok(ticks.every((event) => event.amount === 3 && event.healed === 3 && event.delta === 3 && event.sideId === 'player'));
  for (const unit of living) assert.equal(unit.hp, 13);
  assert.equal(state.sides.player.avatars[0].hp, 0);

  ownTurn();
  ticks = state.log.filter((event) => event.type === 'regen_tick');
  assert.equal(ticks.length, 6);
  assert.ok(ticks.every((event) => event.amount === 3));
  for (const unit of living) {
    assert.equal(unit.hp, 16);
    assert.equal(unit.statuses.some((status) => status.kind === 'regen'), false);
  }

  ownTurn();
  assert.equal(state.log.filter((event) => event.type === 'regen_tick').length, 6);
  for (const unit of living) assert.equal(unit.hp, 16);
});

test('AUTO accepts player and enemy, and rejects an options object used as a side', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([sampleCard({ cardId: 'HIT', costAp: 0 })]),
  }));
  assert.equal(state.activeSideId, 'player');
  const planned = chooseAutoActions(state, 'player');
  assert.ok(planned.length > 0);
  assert.throws(() => chooseAutoActions(state, { seed: 1 }), (error) => error.reason === 'UNKNOWN_SIDE');
  assert.throws(() => runAutoTurn(state, { seed: 1, auto: true }), (error) => error.reason === 'UNKNOWN_SIDE');
  const step = runAutoTurn(state, 'player', { maxActions: 1 });
  assert.equal(step.ok, true);
  assert.equal(step.stopped, true);
  assert.equal(step.ended, false);
  assert.equal(state.activeSideId, 'player');
  const enemy = playEnemyTurn(state);
  assert.equal(enemy.ok, false);
  assert.equal(enemy.reason, 'NOT_ACTIVE_SIDE');
  assert.equal(defaultRuleConfig().damage.formula, 'placeholder_atk_minus_def');
  assert.equal(defaultRuleConfig().damage.minDamage, 1);
  assert.equal(defaultRuleConfig().damage.preset, 'flat_atk');
  assert.equal(defaultRuleConfig().damage.status, 'MVP_PROVISIONAL');
  assert.equal(defaultRuleConfig().autoPolicy.status, 'PROPOSED');
});

test('a decided match reports the documented getOutcome for a win and a loss', () => {
  const win = createMatch(matchInput({
    matchId: 'tower-win',
    enemy: roster((avatar) => { avatar.hp = 1; avatar.maxHp = 6; }),
    playerDeck: padDeck([
      sampleCard({
        cardId: 'WIPE',
        costAp: 0,
        targetRule: 'All_Enemies',
        effects: [{ op: 'damage', mode: 'flat', amount: 5, target: 'all_enemies' }],
      }),
    ]),
  }));
  assert.equal(getOutcome(win).status, 'ongoing');
  assert.equal(getOutcome(win).rewards, null);
  const played = play(win, 'WIPE', 'AVT_PHA_002');
  assert.equal(played.ok, true);
  assert.equal(played.state, undefined);
  const outcome = getOutcome(win);
  assert.equal(outcome.status, 'decided');
  assert.equal(outcome.winnerSideId, 'player');
  assert.equal(outcome.loserSideId, 'enemy');
  assert.equal(outcome.verdict.player, 'victory');
  assert.equal(outcome.verdict.enemy, 'defeat');
  assert.equal(outcome.reason, 'all_avatars_defeated');
  assert.equal(outcome.rewards.emissionId, 'tower-win:rewards');
  assert.equal(outcome.rewards.timesEmitted, 1);
  assert.equal(outcome.rewards.payloadStatus, 'PENDING_OWNER');
  assert.equal(outcome.rewards.payload.G, null);
  assert.equal(outcome.rewards.payload.loot, null);
  assert.deepEqual(getOutcome(win), outcome);

  const loss = createMatch(matchInput({
    matchId: 'tower-loss',
    player: roster((avatar) => { avatar.hp = 1; avatar.maxHp = 6; }),
    enemyDeck: padDeck([
      sampleCard({
        cardId: 'WIPE',
        costAp: 0,
        targetRule: 'All_Enemies',
        effects: [{ op: 'damage', mode: 'flat', amount: 5, target: 'all_enemies' }],
      }),
    ]),
    enemyControl: 'human',
    playerSpd: [0, 0, 0, 0],
    enemySpd: [9, 0, 0, 0],
  }));
  play(loss, 'WIPE', 'AVT_PHA_002', undefined, 'enemy');
  const lost = getOutcome(loss);
  assert.equal(lost.status, 'decided');
  assert.equal(lost.winnerSideId, 'enemy');
  assert.equal(lost.loserSideId, 'player');
  assert.equal(lost.verdict.player, 'defeat');
  assert.equal(lost.verdict.enemy, 'victory');
  assert.equal(lost.rewards.payload.G, null);
  assert.equal(lost.rewards.payload.lootStatus, 'PENDING_OWNER');
  assert.equal(lost.rewards.timesEmitted, 1);
});
