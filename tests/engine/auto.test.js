import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseAutoActions,
  createMatch,
  defaultRuleConfig,
  endTurn,
  getOutcome,
  getState,
  playAction,
  playEnemyTurn,
  resolveRuleConfig,
  runAutoTurn,
  sampleCard,
} from '../../src/engine/index.js';
import { handCard, matchInput, padDeck, roster } from './fixture.js';

const strike = (partial) => sampleCard({ cardId: 'HIT', costAp: 0, ...partial });
const skill = (partial) => sampleCard({
  cardId: 'SKILL',
  name: 'Skill',
  type: 'Skill',
  costAp: 0,
  targetRule: 'Self',
  effects: [{ op: 'trigger_active' }],
  ...partial,
});

function shortHp(avatar, hp) {
  avatar.maxHp = hp;
  avatar.hp = hp;
}

function finish(seed) {
  const state = createMatch(matchInput({
    seed,
    matchId: `auto-${seed}`,
    shuffleDecks: true,
    playerControl: 'ai',
    enemyControl: 'ai',
    player: roster((avatar) => shortHp(avatar, 6)),
    enemy: roster((avatar) => shortHp(avatar, 6)),
  }));
  let turns = 0;
  while (state.outcome.status !== 'decided' && turns < 80) {
    if (state.phase === 'end_of_round_discard') {
      for (const sideId of state.sideOrder) {
        const step = runAutoTurn(state, sideId);
        assert.equal(step.ok, true, step.reason);
        assertIllegalFree(step);
      }
    } else {
      const step = runAutoTurn(state, state.activeSideId);
      assert.equal(step.ok, true, step.reason);
      assert.equal(step.skipped, undefined);
      assertIllegalFree(step);
      turns += 1;
    }
  }
  return state;
}

function assertIllegalFree(step) {
  for (const entry of step.log) {
    if (entry.kind !== 'play' && entry.kind !== 'discard_voluntary') continue;
    assert.equal(entry.ok, true);
    assert.equal(entry.reason, null);
    assert.ok(entry.apBefore >= entry.cost);
    assert.ok(entry.apAfter >= 0);
  }
}

test('auto policy stays proposed and SYNC is not a config', () => {
  const config = defaultRuleConfig();
  assert.equal(config.autoMode.status, 'LOCKED');
  assert.equal(config.autoMode.enabled, true);
  assert.equal(config.autoPolicy.status, 'PROPOSED');
  assert.equal(config.autoPolicy.name, 'balanced');
  // Owner t269u: flat_atk is the MVP_PROVISIONAL default. The legacy floor-1 fields stay for preset null.
  assert.equal(config.damage.preset, 'flat_atk');
  assert.equal(config.damage.status, 'MVP_PROVISIONAL');
  assert.equal(config.damage.formula, 'placeholder_atk_minus_def');
  assert.equal(config.damage.minDamage, 1);
  assert.equal(config.autoPolicy.policies.balanced.allyLowHpRatio, 0.5);
  assert.deepEqual(config.autoPolicy.policies.balanced.priorities, [
    'shield_taunt_if_lethal',
    'heal_regen',
    'setup_next_attack',
    'highest_damage_lowest_hp',
    'any_legal_expected_value',
  ]);
  assert.equal(config.autoPolicy.policies.balanced.voluntaryDiscard, 'hand_locked_or_no_progress');
  assert.equal(config.sync, undefined);
  assert.throws(() => resolveRuleConfig({ autoPolicy: { status: 'LOCKED' } }), (error) => error.reason === 'PROPOSED_LOCK');
  const edited = resolveRuleConfig({
    autoPolicy: { policies: { balanced: { allyLowHpRatio: 0.2 } } },
  });
  assert.equal(edited.autoPolicy.status, 'PROPOSED');
  assert.equal(edited.autoPolicy.policies.balanced.allyLowHpRatio, 0.2);
  assert.equal(edited.autoPolicy.policies.balanced.spend, 'greedy');
});

test('chooseAutoActions does not change the match', () => {
  const state = createMatch(matchInput({ playerDeck: padDeck([strike()]) }));
  const before = getState(state);
  const plan = chooseAutoActions(state, 'player');
  assert.ok(plan.length > 0);
  assert.equal(plan[0].kind, 'play');
  assert.deepEqual(getState(state), before);
});

test('t282u AUTO uses a worthwhile Regen at 50% HP even when a damaging play is legal', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([skill({ cardId: 'GRACE' })], strike({ costAp: 0 })),
    player: roster((avatar, index) => { if (index === 3) avatar.hp = 20; }),
  }));
  const justina = state.sides.player.avatars.find((row) => row.avatarId === 'AVT_SAN_002');
  assert.equal(justina.hp / justina.maxHp, 0.5);
  const plan = chooseAutoActions(state, 'player');
  const grace = plan.find((action) => action.cardId === 'GRACE' && action.actorAvatarId === 'AVT_SAN_002');
  assert.ok(grace, JSON.stringify(plan));
  assert.equal(grace.priority, 'heal_regen');
});

test('the priority table is data, so damage can be ordered ahead of healing', () => {
  const state = createMatch(matchInput({
    config: {
      autoPolicy: {
        policies: { balanced: { priorities: ['highest_damage_lowest_hp', 'heal_regen'] } },
      },
    },
    playerDeck: padDeck([skill({ cardId: 'GRACE' })], strike({ costAp: 0 })),
    player: roster((avatar, index) => { if (index === 3) avatar.hp = 10; }),
  }));
  assert.equal(chooseAutoActions(state, 'player')[0].priority, 'highest_damage_lowest_hp');
});

test('balanced shields the tank when an enemy strike can KO', () => {
  const guard = sampleCard({
    cardId: 'GUARD',
    type: 'DEF',
    costAp: 0,
    targetRule: 'Self',
    effects: [{ op: 'shield', amount: 2, target: 'self' }],
  });
  const state = createMatch(matchInput({
    playerDeck: padDeck([guard], strike({ costAp: 0 })),
    player: roster((avatar) => { avatar.hp = 1; }),
  }));
  const plan = chooseAutoActions(state, 'player');
  const shield = plan.find((action) => action.cardId === 'GUARD');
  assert.ok(shield, JSON.stringify(plan));
  assert.equal(plan[0].cardId, 'GUARD');
  assert.equal(shield.priority, 'shield_taunt_if_lethal');
  assert.equal(shield.actorAvatarId, 'AVT_AEG_002');
  assert.ok(plan.some((action) => action.cardId === 'HIT' || action.priority === 'highest_damage_lowest_hp'));
});

test('auto attacks respect Taunt even when another enemy has less HP', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([skill()]),
    enemyDeck: padDeck([strike()]),
    player: roster((avatar, index) => { if (index === 2) avatar.hp = 1; }),
  }));
  const card = handCard(state, 'player', 'SKILL');
  const played = playAction(state, { cardInstanceId: card.instanceId, actorAvatarId: 'AVT_AEG_002' });
  assert.equal(played.ok, true, played.reason);
  endTurn(state);
  const plan = chooseAutoActions(state, 'enemy');
  const attacks = plan.filter((action) => action.kind === 'play');
  assert.ok(attacks.length > 0);
  for (const action of attacks) assert.deepEqual(action.targets, ['AVT_AEG_002']);
});

test('auto never plays a FAC card the team cannot use, and discards it only when it is hand-locked', () => {
  const fac = sampleCard({
    cardId: 'FAC_AEG',
    costAp: 1,
    rarity: 'FAC',
    factionRequirement: 'Aegis Dominion',
  });
  const state = createMatch(matchInput({
    playerDeck: padDeck([fac], strike({ costAp: 1 })),
    player: roster((avatar) => { avatar.faction = 'Sanctuary Order'; }),
  }));
  const plan = chooseAutoActions(state, 'player');
  assert.equal(plan.some((action) => action.kind === 'play' && action.cardId === 'FAC_AEG'), false);
  assert.equal(plan.some((action) => action.kind === 'discard_voluntary' && action.cardId === 'FAC_AEG'), true);
  const step = runAutoTurn(state, 'player');
  assert.equal(step.log.some((entry) => entry.kind === 'play' && entry.cardId === 'FAC_AEG'), false);
  assert.equal(step.log.some((entry) => entry.kind === 'discard_voluntary' && entry.cardId === 'FAC_AEG'), true);
  assert.equal(step.log.find((entry) => entry.kind === 'discard_voluntary').apBefore >= 1, true);
});

test('auto stops between actions and leaves the turn open', () => {
  const state = createMatch(matchInput({ playerDeck: padDeck([strike({ costAp: 1 })]) }));
  const turn = state.turnIndex;
  let checks = 0;
  const stopped = runAutoTurn(state, 'player', {
    shouldStop: () => {
      checks += 1;
      return checks > 1;
    },
  });
  assert.equal(stopped.stopped, true);
  assert.equal(stopped.ended, false);
  assert.equal(stopped.log.filter((entry) => entry.kind === 'play').length, 1);
  assert.equal(stopped.log.some((entry) => entry.kind === 'end_turn'), false);
  assert.equal(state.phase, 'action');
  assert.equal(state.turnIndex, turn);
  assert.equal(state.activeSideId, 'player');

  const capped = createMatch(matchInput({ playerDeck: padDeck([strike({ costAp: 1 })]) }));
  const once = runAutoTurn(capped, 'player', { maxActions: 1 });
  assert.equal(once.log.filter((entry) => entry.kind === 'play').length, 1);
  assert.equal(once.ended, false);
  assert.equal(capped.phase, 'action');
});

test('auto plays a Skill that fires an Active instead of passing the turn', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([skill({ cardId: 'SPARK', costAp: 1 })], skill({ cardId: 'SPARK', costAp: 1 })),
  }));
  const plan = chooseAutoActions(state, 'player');
  assert.ok(plan.length > 0);
  assert.equal(plan[0].kind, 'play');
  assert.notEqual(plan[0].actorAvatarId, 'AVT_SAN_002');
  const step = runAutoTurn(state, 'player');
  assert.equal(step.log.some((entry) => entry.kind === 'play'), true);
  assert.equal(step.ended, true);
});

test('a legal damaging play is taken before a zero-shield card', () => {
  const guard = sampleCard({
    cardId: 'ZERO',
    type: 'DEF',
    costAp: 1,
    targetRule: 'Self',
    effects: [{ op: 'shield', amount: 0, target: 'self' }],
  });
  const state = createMatch(matchInput({
    playerDeck: padDeck([guard, strike({ cardId: 'HIT', costAp: 1 })], guard),
    player: roster((avatar) => { avatar.hp = 1; }),
  }));
  const plan = chooseAutoActions(state, 'player');
  assert.equal(plan[0].priority, 'highest_damage_lowest_hp');
  assert.equal(plan[0].cardId, 'HIT');
});

test('named damage presets are selectable and do not replace the default', () => {
  const config = defaultRuleConfig();
  assert.equal(config.damage.preset, 'flat_atk');
  assert.equal(resolveRuleConfig({ damage: { preset: null } }).damage.preset, null);
  assert.throws(() => resolveRuleConfig({ damage: { preset: 'approved_real_formula' } }), (error) => error.reason === 'UNKNOWN_FORMULA');
  const selected = resolveRuleConfig({ damage: { preset: 'floor_50_pct_atk' } });
  assert.equal(selected.damage.status, 'MVP_PROVISIONAL');
  assert.equal(selected.damage.formula, 'placeholder_atk_minus_def');
  assert.equal(selected.damage.minDamage, 1);
  assert.equal(selected.damage.preset, 'floor_50_pct_atk');
  const state = createMatch(matchInput({
    config: { damage: { preset: 'floor_50_pct_atk' } },
    playerDeck: padDeck([strike({ cardId: 'HIT', costAp: 0 })]),
    enemy: roster((avatar, index) => { if (index === 0) { avatar.stats.def = 8; avatar.hp = 26; avatar.maxHp = 26; } }),
  }));
  const card = handCard(state, 'player', 'HIT');
  const played = playAction(state, { cardInstanceId: card.instanceId, actorAvatarId: 'AVT_PHA_002', targets: ['AVT_AEG_002'] });
  assert.equal(played.ok, true, played.reason);
  const tank = state.sides.enemy.avatars.find((unit) => unit.avatarId === 'AVT_AEG_002');
  assert.equal(tank.hp, 22);
});

test('playEnemyTurn is the auto turn for the non-human side', () => {
  const state = createMatch(matchInput({ playerControl: 'human', enemyControl: 'ai' }));
  endTurn(state);
  assert.equal(state.activeSideId, 'enemy');
  const step = playEnemyTurn(state);
  assert.equal(step.ok, true);
  assert.equal(step.ended, true);
  assert.equal(state.activeSideId, 'player');
});

test('the same seed replays the same auto match', () => {
  const replay = (seed) => {
    const state = createMatch(matchInput({
      seed,
      shuffleDecks: true,
      playerControl: 'ai',
      enemyControl: 'ai',
      player: roster((avatar) => shortHp(avatar, 8)),
      enemy: roster((avatar) => shortHp(avatar, 8)),
    }));
    for (let turn = 0; turn < 8 && state.outcome.status !== 'decided'; turn += 1) {
      if (state.phase === 'end_of_round_discard') {
        for (const sideId of state.sideOrder) runAutoTurn(state, sideId);
      } else {
        runAutoTurn(state, state.activeSideId);
      }
    }
    return getState(state);
  };
  assert.deepEqual(replay(11), replay(11));
  assert.notDeepEqual(replay(11).rngState, replay(12).rngState);
});

test('auto never plays illegally and every seeded match ends inside the turn cap', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    const state = finish(seed);
    const outcome = getOutcome(state);
    assert.equal(outcome.status, 'decided', `seed ${seed} still ${state.phase} at turn ${state.turnIndex}`);
    assert.ok(outcome.winnerSideId === 'player' || outcome.winnerSideId === 'enemy');
    assert.equal(outcome.rewards.timesEmitted, 1);
    assert.ok(state.turnIndex <= 80);
  }
});
