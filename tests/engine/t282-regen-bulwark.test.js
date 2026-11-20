/**
 * Owner t282u (Pote, 2026-11-20): AUTO uses worthwhile affordable Regen at HP <= 50%,
 * and under flat_atk only, Bulwark remaps DEF +1 to Shield +2 (MVP_PROVISIONAL, not LOCKED).
 * Authored card and skill values are not edited.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseAutoActions,
  createMatch,
  defaultRuleConfig,
  endTurn,
  getState,
  playAction,
  resolveRuleConfig,
  proposedSampleRoster,
  sampleCard,
} from '../../src/engine/index.js';
import { handCard, matchInput, padDeck, roster } from './fixture.js';

const HIT = () => sampleCard({ cardId: 'HIT', name: 'Hit', costAp: 0 });
const GRACE = (partial = {}) => sampleCard({
  cardId: 'GRACE',
  name: 'Grace',
  type: 'Skill',
  costAp: 0,
  targetRule: 'Self',
  effects: [{ op: 'trigger_active' }],
  ...partial,
});

function unit(state, sideId, avatarId) {
  return state.sides[sideId].avatars.find((row) => row.avatarId === avatarId);
}

function play(state, cardId, actorAvatarId, targets = []) {
  const card = handCard(state, 'player', cardId);
  assert.ok(card, `hand has ${cardId}`);
  return playAction(state, { cardInstanceId: card.instanceId, actorAvatarId, targets });
}

function sureBulwark(avatar, index) {
  if (index !== 0) return;
  const source = proposedSampleRoster().find((row) => row.avatarId === 'AVT_AEG_002').passive;
  avatar.passive = structuredClone(source);
  avatar.passive.chance = 1;
}

test('t282u AUTO config: Regen at 50% inclusive, Bulwark remap is MVP_PROVISIONAL, never LOCKED', () => {
  const config = defaultRuleConfig();
  assert.equal(config.autoPolicy.policies.balanced.allyLowHpRatio, 0.5);
  assert.equal(config.damage.bulwark.status, 'MVP_PROVISIONAL');
  assert.equal(config.damage.bulwark.evidence, 't282u');
  assert.equal(config.damage.bulwark.enabled, true);
  assert.equal(config.damage.bulwark.shieldAmount, 2);
  assert.notEqual(config.damage.bulwark.status, 'LOCKED');
  assert.throws(() => resolveRuleConfig({ damage: { status: 'LOCKED' } }), (error) => error.reason === 'PENDING_LOCK');
  assert.equal(resolveRuleConfig({ damage: { bulwark: { enabled: false } } }).damage.bulwark.enabled, false);
});

test('t282u AUTO casts Regen at exactly 50% when the skill is affordable and would heal', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([GRACE()], HIT()),
    player: roster((avatar, index) => { if (index === 3) avatar.hp = 20; }),
  }));
  const justina = unit(state, 'player', 'AVT_SAN_002');
  assert.equal(justina.maxHp, 40);
  assert.equal(justina.hp, 20);
  const plan = chooseAutoActions(state, 'player');
  const grace = plan.find((action) => action.cardId === 'GRACE' && action.actorAvatarId === 'AVT_SAN_002');
  assert.ok(grace, JSON.stringify(plan));
  assert.equal(grace.priority, 'heal_regen');
  const again = chooseAutoActions(state, 'player');
  assert.deepEqual(again, plan);
  assert.equal(getState(state).sides.player.ap, state.sides.player.ap);
});

test('t282u AUTO skips Regen when every ally is above 50%', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([GRACE()], HIT()),
    player: roster((avatar, index) => { if (index === 3) avatar.hp = 21; }),
  }));
  assert.ok(unit(state, 'player', 'AVT_SAN_002').hp / 40 > 0.5);
  const plan = chooseAutoActions(state, 'player');
  assert.equal(plan.some((action) => action.cardId === 'GRACE' && action.actorAvatarId === 'AVT_SAN_002'), false);
});

test('t282u AUTO skips Regen when the low ally already has regen, and does not recast without need', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([GRACE(), GRACE()]),
    player: roster((avatar, index) => { if (index === 3) avatar.hp = 20; }),
  }));
  const first = play(state, 'GRACE', 'AVT_SAN_002');
  assert.equal(first.ok, true, first.reason);
  assert.equal(unit(state, 'player', 'AVT_SAN_002').statuses.some((status) => status.kind === 'regen'), true);
  const plan = chooseAutoActions(state, 'player');
  assert.equal(plan.some((action) => action.priority === 'heal_regen'), false, JSON.stringify(plan));
  assert.equal(plan.some((action) => action.cardId === 'GRACE' && action.actorAvatarId === 'AVT_SAN_002'), false);
});

test('t282u AUTO skips Regen when the skill is not affordable', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([GRACE({ costAp: 5 })], HIT()),
    player: roster((avatar, index) => { if (index === 3) avatar.hp = 20; }),
  }));
  state.sides.player.ap = 4;
  const plan = chooseAutoActions(state, 'player');
  assert.equal(plan.some((action) => action.cardId === 'GRACE'), false, JSON.stringify(plan));
  state.sides.player.ap = 5;
  const paid = chooseAutoActions(state, 'player');
  assert.ok(paid.some((action) => action.cardId === 'GRACE' && action.actorAvatarId === 'AVT_SAN_002'));
});

test('t282u flat_atk Bulwark grants Shield +2, not a DEF buff', () => {
  const state = createMatch(matchInput({
    player: roster((avatar, index) => sureBulwark(avatar, index)),
    playerDeck: padDeck([HIT()]),
    playerSpd: [0, 0, 0, 0],
    enemySpd: [9, 0, 0, 0],
    enemyDeck: padDeck([HIT()]),
    enemyControl: 'human',
  }));
  endTurn(state);
  const caseUnit = unit(state, 'player', 'AVT_AEG_002');
  const mage = unit(state, 'player', 'AVT_CEL_002');
  assert.ok(state.log.some((event) => event.type === 'passive_proc' && event.avatarId === 'AVT_AEG_002' && event.name === 'Bulwark'));
  assert.equal(caseUnit.shield, 2);
  assert.equal(mage.shield, 2);
  assert.equal(caseUnit.statuses.some((status) => status.kind === 'buff' && status.stat === 'def'), false);
  endTurn(state);
  assert.equal(playAction(state, { cardInstanceId: handCard(state, 'enemy', 'HIT').instanceId, actorAvatarId: 'AVT_PHA_002', targets: ['AVT_CEL_002'] }).ok, true);
  const hit = state.log.filter((event) => event.type === 'damage').at(-1);
  assert.equal(hit.amount, 8);
  assert.equal(hit.absorbed, 2);
  assert.equal(hit.dealt, 6);
});

test('t282u legacy damage presets still apply Bulwark as DEF +1', () => {
  const state = createMatch(matchInput({
    config: { damage: { preset: null } },
    player: roster((avatar, index) => sureBulwark(avatar, index)),
    playerDeck: padDeck([HIT()]),
    playerSpd: [0, 0, 0, 0],
    enemySpd: [9, 0, 0, 0],
    enemyDeck: padDeck([HIT()]),
    enemyControl: 'human',
  }));
  endTurn(state);
  const mage = unit(state, 'player', 'AVT_CEL_002');
  assert.equal(mage.shield, 0);
  assert.ok(mage.statuses.some((status) => status.kind === 'buff' && status.stat === 'def' && status.amount === 1));
  endTurn(state);
  assert.equal(playAction(state, {
    cardInstanceId: handCard(state, 'enemy', 'HIT').instanceId,
    actorAvatarId: 'AVT_PHA_002',
    targets: ['AVT_CEL_002'],
  }).ok, true);
  // fixture DEF is from the sample roster (Theory DEF 3) plus Bulwark +1, hit ATK 8: 8 - 4 = 4
  assert.equal(state.log.filter((event) => event.type === 'damage').at(-1).amount, 4);
});

test('t282u Bulwark remap can be turned off under flat_atk via config', () => {
  const state = createMatch(matchInput({
    config: { damage: { preset: 'flat_atk', bulwark: { enabled: false } } },
    player: roster((avatar, index) => sureBulwark(avatar, index)),
    playerSpd: [0, 0, 0, 0],
    enemySpd: [9, 0, 0, 0],
    enemyControl: 'human',
  }));
  endTurn(state);
  const mage = unit(state, 'player', 'AVT_CEL_002');
  assert.equal(mage.shield, 0);
  assert.ok(mage.statuses.some((status) => status.kind === 'buff' && status.stat === 'def' && status.amount === 1));
});
