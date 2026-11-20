/**
 * Owner t269u (Pote, 2026-11-20 19:48 ICT): option A, flat ATK that ignores DEF, MVP_PROVISIONAL.
 * These tests check that the default switched, that it is not LOCKED, that DEF still buys HP,
 * and that Shield, Taunt, Regen, Passives, and the Tank role still do something under it.
 * Card and avatar values come from src/engine/samples.js (same numbers as content/v05 Justins).
 * Where a test needs a deterministic proc it sets chance 1 on a test copy only.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseAutoActions,
  createMatch,
  defaultRuleConfig,
  endTurn,
  playAction,
  playEnemyTurn,
  proposedSampleMatchInput,
  proposedSampleRoster,
  resolveRuleConfig,
  runAutoTurn,
  sampleCard,
} from '../../src/engine/index.js';
import { handCard, matchInput, padDeck, roster } from './fixture.js';

const HIT = () => sampleCard({ cardId: 'HIT', name: 'Hit', costAp: 0 });
const SKILL = () => sampleCard({ cardId: 'SKILL', type: 'Skill', costAp: 0, targetRule: 'Ally', effects: [{ op: 'trigger_active' }] });

function play(state, cardId, actorAvatarId, targets = [], sideId = 'player') {
  const card = handCard(state, sideId, cardId);
  assert.ok(card, `${sideId} has ${cardId}`);
  return playAction(state, { cardInstanceId: card.instanceId, actorAvatarId, targets });
}

function unit(state, sideId, avatarId) {
  return state.sides[sideId].avatars.find((row) => row.avatarId === avatarId);
}

function realRoster(mutate) {
  // Real proposed stats and skills, no maxHp override: HP comes from the unchanged DEF formula.
  return proposedSampleRoster().map((avatar, index) => {
    const next = structuredClone(avatar);
    if (mutate) mutate(next, index);
    return next;
  });
}

/** AUTO both sides on the engine sample match (real roster, real Guard shields). */
function autoMatch(seed, { enemyMutate, playerMutate, preset } = {}) {
  const input = proposedSampleMatchInput({ seed, playerControl: 'human', enemyControl: 'ai' });
  if (preset !== undefined) input.config = resolveRuleConfig({ damage: { preset } });
  if (playerMutate) input.teams[0].avatars.forEach(playerMutate);
  if (enemyMutate) input.teams[1].avatars.forEach(enemyMutate);
  const state = createMatch(input);
  let steps = 0;
  while (state.outcome.status !== 'decided' && steps < 600) {
    steps += 1;
    if (state.phase === 'end_of_round_discard') {
      for (const sideId of state.sideOrder) runAutoTurn(state, sideId);
      continue;
    }
    if (state.activeSideId === 'enemy') playEnemyTurn(state);
    else runAutoTurn(state, 'player');
  }
  assert.equal(state.outcome.status, 'decided', `seed ${seed} decided`);
  return state;
}

function winner(state) {
  return state.outcome.winnerSideId ?? state.outcome.winner ?? null;
}

test('t269u: flat_atk is the default preset, MVP_PROVISIONAL, switchable, never LOCKED', () => {
  const config = defaultRuleConfig();
  assert.equal(config.damage.preset, 'flat_atk');
  assert.equal(config.damage.status, 'MVP_PROVISIONAL');
  assert.equal(config.damage.decision.evidence, 't269u');
  assert.equal(config.damage.decision.switchable, true);
  assert.equal(config.damage.presets.flat_atk.formula, 'placeholder_flat_atk');
  assert.throws(() => resolveRuleConfig({ damage: { status: 'LOCKED' } }), (error) => error.reason === 'PENDING_LOCK');
  for (const preset of [null, 'floor_25_pct_atk', 'floor_50_pct_atk', 'flat_atk']) {
    assert.equal(resolveRuleConfig({ damage: { preset } }).damage.preset, preset);
  }
  const state = createMatch(matchInput({ playerDeck: padDeck([HIT()]) }));
  assert.equal(state.flags.damageFormula, 'MVP_PROVISIONAL');
});

test('t269u: flat_atk ignores DEF for damage, and DEF still adds HP by the unchanged formula', () => {
  const config = defaultRuleConfig();
  assert.equal(config.hp.base, 10);
  assert.equal(config.hp.perDef, 2);
  const state = createMatch(matchInput({
    player: realRoster((a) => { a.passive = null; }),
    enemy: realRoster((a) => { a.passive = null; }),
    playerDeck: padDeck([HIT(), HIT()]),
  }));
  const tank = unit(state, 'enemy', 'AVT_AEG_002');
  const dps = unit(state, 'enemy', 'AVT_PHA_002');
  assert.equal(tank.maxHp, 10 + 8 * 2);
  assert.equal(dps.maxHp, 10 + 2 * 2);
  assert.equal(unit(state, 'enemy', 'AVT_CEL_002').maxHp, 16);
  assert.equal(unit(state, 'enemy', 'AVT_SAN_002').maxHp, 20);
  play(state, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  play(state, 'HIT', 'AVT_PHA_002', ['AVT_PHA_002']);
  const hits = state.log.filter((event) => event.type === 'damage');
  assert.deepEqual(hits.map((event) => event.amount), [8, 8], 'DEF 8 and DEF 2 take the same flat hit');
  assert.equal(tank.hp, 18);
  assert.equal(dps.hp, 6);

  const legacy = createMatch(matchInput({
    config: { damage: { preset: null } },
    player: realRoster((a) => { a.passive = null; }),
    enemy: realRoster((a) => { a.passive = null; }),
    playerDeck: padDeck([HIT()]),
  }));
  play(legacy, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  assert.equal(legacy.log.find((event) => event.type === 'damage').amount, 1, 'preset null keeps the legacy floor-1 formula');
});

test('t269u Shield: Justin Case shield absorbs a flat hit before HP and a Guard can block a whole weak hit', () => {
  const run = (useSkill) => {
    const state = createMatch(matchInput({
      playerDeck: padDeck([SKILL()]),
      enemyDeck: padDeck([HIT(), HIT()]),
      enemyControl: 'human',
    }));
    if (useSkill) assert.equal(play(state, 'SKILL', 'AVT_AEG_002').ok, true);
    endTurn(state);
    assert.equal(play(state, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002'], 'enemy').ok, true);
    return state;
  };
  const shielded = run(true);
  const bare = run(false);
  const hit = shielded.log.filter((event) => event.type === 'damage').at(-1);
  assert.equal(hit.amount, 8);
  assert.equal(hit.absorbed, 2);
  assert.equal(hit.dealt, 6);
  assert.equal(unit(shielded, 'player', 'AVT_AEG_002').hp, 34);
  assert.equal(unit(bare, 'player', 'AVT_AEG_002').hp, 32);

  const guard = createMatch(matchInput({
    playerDeck: padDeck([sampleCard({ cardId: 'GUARD', type: 'DEF', costAp: 0, targetRule: 'Self', effects: [{ op: 'shield', amount: 2, target: 'self' }] })]),
    enemyDeck: padDeck([HIT()]),
    enemyControl: 'human',
  }));
  play(guard, 'GUARD', 'AVT_CEL_002');
  endTurn(guard);
  play(guard, 'HIT', 'AVT_SAN_002', ['AVT_CEL_002'], 'enemy');
  const blocked = guard.log.filter((event) => event.type === 'damage').at(-1);
  assert.equal(blocked.amount, 2, 'Justina ATK 2 flat');
  assert.equal(blocked.dealt, 0, 'a 2-point Guard blocks the whole hit');
  assert.equal(unit(guard, 'player', 'AVT_CEL_002').hp, 40);
});

test('t269u Taunt: single-target attacks must hit the taunter, and AUTO aims every hit at it', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([SKILL()]),
    enemyDeck: padDeck([HIT(), HIT(), HIT()]),
    enemyControl: 'human',
  }));
  play(state, 'SKILL', 'AVT_AEG_002');
  endTurn(state);
  assert.equal(play(state, 'HIT', 'AVT_PHA_002', ['AVT_CEL_002'], 'enemy').reason, 'TAUNT');
  assert.equal(play(state, 'HIT', 'AVT_PHA_002', ['AVT_PHA_002'], 'enemy').reason, 'TAUNT');
  const plan = chooseAutoActions(state, 'enemy');
  const attacks = plan.filter((step) => step.kind === 'play' && step.cardId === 'HIT');
  assert.ok(attacks.length > 0);
  assert.ok(attacks.every((step) => step.targets.length === 1 && step.targets[0] === 'AVT_AEG_002'), JSON.stringify(attacks));
  assert.equal(play(state, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002'], 'enemy').ok, true);
  assert.equal(unit(state, 'player', 'AVT_CEL_002').hp, 40, 'the squishy behind the taunt is untouched');
});

test('t269u Regen: Saving Grace heals +3 per tick and keeps a hit unit alive through one more flat hit', () => {
  const run = (useRegen) => {
    const state = createMatch(matchInput({
      player: roster((avatar, index) => { if (index === 2) avatar.hp = 14; }),
      playerDeck: padDeck([SKILL()]),
      enemyDeck: padDeck([HIT(), HIT(), HIT()]),
      enemyControl: 'human',
    }));
    if (useRegen) assert.equal(play(state, 'SKILL', 'AVT_SAN_002').ok, true);
    endTurn(state); // enemy turn 2
    play(state, 'HIT', 'AVT_PHA_002', ['AVT_CEL_002'], 'enemy');
    endTurn(state); // player turn 3: first tick
    endTurn(state); // enemy turn 4
    play(state, 'HIT', 'AVT_PHA_002', ['AVT_CEL_002'], 'enemy');
    return state;
  };
  const healed = run(true);
  const bare = run(false);
  const mage = unit(healed, 'player', 'AVT_CEL_002');
  assert.equal(mage.alive, true);
  assert.equal(mage.hp, 1, '14 - 8 + 3 - 8');
  assert.equal(unit(bare, 'player', 'AVT_CEL_002').alive, false, 'without regen the same two hits KO it');
  const ticks = healed.log.filter((event) => event.type === 'regen_tick' && event.avatarId === 'AVT_CEL_002');
  assert.equal(ticks.length, 1);
  assert.equal(ticks[0].healed, 3);
});

test('t269u Passives: on-attack and ATK buffs still add damage; Bulwark DEF+1 no longer reduces a hit (finding)', () => {
  const sure = (avatar) => { avatar.passive = structuredClone(proposedSampleRoster().find((row) => row.avatarId === avatar.avatarId).passive); avatar.passive.chance = 1; };
  const time = createMatch(matchInput({
    player: roster((avatar, index) => { if (index === 1) sure(avatar); }),
    playerDeck: padDeck([HIT()]),
  }));
  play(time, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  assert.equal(time.log.find((event) => event.type === 'damage').amount, 10, 'Justin Time +2 on attack');

  const theory = createMatch(matchInput({
    player: roster((avatar, index) => { if (index === 2) sure(avatar); }),
    playerSpd: [0, 0, 0, 0],
    enemySpd: [9, 0, 0, 0],
    playerDeck: padDeck([HIT()]),
    enemyControl: 'human',
  }));
  endTurn(theory); // enemy opened; player turn start rolls Theory's ATK +1
  play(theory, 'HIT', 'AVT_CEL_002', ['AVT_AEG_002']);
  assert.equal(theory.log.filter((event) => event.type === 'damage').at(-1).amount, 8, 'Justin Theory 7 + 1');

  const bulwark = (preset) => {
    const state = createMatch(matchInput({
      config: preset === undefined ? undefined : { damage: { preset } },
      player: roster((avatar, index) => { if (index === 0) sure(avatar); }),
      playerSpd: [0, 0, 0, 0],
      enemySpd: [9, 0, 0, 0],
      enemyDeck: padDeck([HIT()]),
      enemyControl: 'human',
    }));
    endTurn(state); // player turn start: Bulwark gives the team DEF +1
    endTurn(state); // enemy turn
    play(state, 'HIT', 'AVT_PHA_002', ['AVT_CEL_002'], 'enemy');
    assert.ok(state.log.some((event) => event.type === 'passive_proc' && event.avatarId === 'AVT_AEG_002'));
    return state.log.filter((event) => event.type === 'damage').at(-1).amount;
  };
  assert.equal(bulwark(), 8, 'flat_atk: DEF buff does not change damage');
  assert.equal(bulwark(null), 4, 'legacy formula: 8 - (3 + 1)');
});

test('t269u Passives as a set still change AUTO results over 80 seeded matches', () => {
  // Deterministic: every match is seeded. Sim over 300 seeds: passive side wins about 55% (see DAMAGE_FLAT_ATK_REPORT.md).
  let wins = 0;
  let changed = 0;
  let procs = 0;
  for (let seed = 1; seed <= 80; seed += 1) {
    const base = autoMatch(seed);
    const state = autoMatch(seed, { enemyMutate: (avatar) => { avatar.passive = null; } });
    if (winner(state) === 'player') wins += 1;
    if (winner(state) !== winner(base) || state.turnIndex !== base.turnIndex) changed += 1;
    procs += state.log.filter((event) => event.type === 'passive_proc').length;
  }
  assert.ok(procs > 80, `passives proc (${procs})`);
  assert.ok(changed >= 40, `removing one side's passives changes ${changed}/80 matches`);
  assert.ok(wins > 40, `side with passives won ${wins}/80`);
});

test('t269u Tank: same attacker needs 4 hits on Justin Case and 2 on Justin Time; Case outlives squishies in AUTO', () => {
  const hitsToKo = (avatarId) => {
    const state = createMatch(matchInput({
      player: realRoster((a) => { a.passive = null; }),
      enemy: realRoster((a) => { a.passive = null; }),
      playerDeck: padDeck([HIT(), HIT(), HIT(), HIT(), HIT()]),
    }));
    const target = unit(state, 'enemy', avatarId);
    let count = 0;
    while (target.alive) {
      assert.equal(play(state, 'HIT', 'AVT_PHA_002', [avatarId]).ok, true);
      count += 1;
    }
    return count;
  };
  assert.equal(hitsToKo('AVT_PHA_002'), 2);
  assert.equal(hitsToKo('AVT_AEG_002'), 4);

  const tally = { Tank: { alive: 0, order: 0 }, DPS: { alive: 0, order: 0 }, Magic: { alive: 0, order: 0 }, Support: { alive: 0, order: 0 } };
  const role = { AVT_AEG_002: 'Tank', AVT_PHA_002: 'DPS', AVT_CEL_002: 'Magic', AVT_SAN_002: 'Support' };
  const seeds = 60;
  for (let seed = 1; seed <= seeds; seed += 1) {
    const match = autoMatch(seed);
    for (const sideId of match.sideOrder) {
      const deaths = match.log.filter((event) => event.type === 'avatar_defeated' && event.sideId === sideId).map((event) => event.avatarId);
      for (const avatar of match.sides[sideId].avatars) {
        const r = role[avatar.avatarId];
        if (avatar.alive) tally[r].alive += 1;
        const at = deaths.indexOf(avatar.avatarId);
        tally[r].order += at === -1 ? 5 : at + 1;
      }
    }
  }
  for (const other of ['DPS', 'Magic', 'Support']) {
    assert.ok(tally.Tank.alive > tally[other].alive, `Tank survived ${tally.Tank.alive} vs ${other} ${tally[other].alive}`);
    assert.ok(tally.Tank.order > tally[other].order, `Tank dies later than ${other}`);
  }
});
