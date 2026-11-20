import assert from 'node:assert/strict';
import test from 'node:test';
import {
  armAction,
  cancelAction,
  createMatch,
  defaultRuleConfig,
  discardVoluntary,
  endTurn,
  getOutcome,
  getState,
  getZones,
  playAction,
  previewAction,
  resolveEndOfRoundDiscard,
  resolveRuleConfig,
  runEnemyTurn,
  sampleCard,
  startTurn,
} from '../../src/engine/index.js';
import { handCard, matchInput, padDeck, roster } from './fixture.js';

function strike(partial = {}) {
  return sampleCard({ cardId: 'ACT_SAMPLE_STRIKE', name: 'Strike', costAp: 0, ...partial });
}

function play(state, cardId, actorAvatarId, targets, sideId = 'player') {
  const card = handCard(state, sideId, cardId);
  assert.ok(card, cardId);
  return playAction(state, { cardInstanceId: card.instanceId, actorAvatarId, targets });
}

test('contract config keeps locked numbers and pending decisions', () => {
  const config = defaultRuleConfig();
  assert.equal(config.meta.productionReady, false);
  assert.equal(config.partySize.status, 'LOCKED');
  assert.equal(config.partySize.value, 4);
  assert.equal(config.baseAp.value, 5);
  assert.equal(config.deckSize.value, 30);
  assert.equal(config.openingHand.value, 5);
  assert.equal(config.handSize.value, 5);
  assert.equal(config.voluntaryDiscardAp.value, 1);
  for (const key of ['teamSpd', 'damage', 'hp', 'healCap', 'regenTickTiming', 'simultaneousDeath', 'deckDuplicateMax', 'statusExpiry']) {
    assert.equal(config[key].status, 'PENDING_OWNER', key);
    assert.equal(config[key].placeholder === true || config[key].value === null, true, key);
  }
  assert.equal(config.damage.formula, 'placeholder_atk_minus_def');
  assert.equal(config.damage.label, 'PLACEHOLDER_NOT_APPROVED');
  assert.throws(() => resolveRuleConfig({ baseAp: { value: 7 } }), (error) => error.reason === 'LOCKED_RULE');
  assert.throws(() => resolveRuleConfig({ damage: { status: 'LOCKED' } }), (error) => error.reason === 'PENDING_LOCK');
  assert.throws(() => resolveRuleConfig({ damage: { formula: 'invented' } }), (error) => error.reason === 'UNKNOWN_FORMULA');
});

test('avatars are field units, teams are four, and avatar cards never enter the action deck', () => {
  assert.throws(() => createMatch(matchInput({
    player: roster().slice(0, 3),
  })), (error) => error.reason === 'PARTY_SIZE');
  const avatarCard = {
    cardKind: 'avatar_card',
    cardId: 'AVC_AVT_AEG_002',
    avatarId: 'AVT_AEG_002',
    type: 'ATK',
    costAp: 1,
    targetRule: 'Enemy',
  };
  assert.throws(() => createMatch(matchInput({
    playerDeck: padDeck([avatarCard]),
  })), (error) => error.reason === 'AVATAR_NOT_ACTION');
  const state = createMatch(matchInput());
  assert.equal(state.sides.player.avatars.length, 4);
  assert.equal(state.sides.enemy.avatars.length, 4);
  assert.equal(getZones(state, 'player').draw.length + getZones(state, 'player').hand.length, 30);
  assert.equal(state.sides.player.avatars.some((unit) => unit.avatarId === 'AVT_AEG_001'), false);
});

test('higher placeholder team SPD starts, sides alternate, and ties use the seeded fallback', () => {
  const fasterEnemy = createMatch(matchInput({ playerSpd: [1, 0, 0, 0], enemySpd: [4, 0, 0, 0] }));
  assert.equal(fasterEnemy.startingSideId, 'enemy');
  assert.equal(fasterEnemy.activeSideId, 'enemy');
  assert.equal(fasterEnemy.flags.teamSpd, 'PENDING_OWNER');
  assert.equal(fasterEnemy.log.find((event) => event.type === 'battle_start').placeholder, true);

  const summed = createMatch(matchInput({
    playerSpd: [9, 0, 0, 0],
    enemySpd: [3, 3, 3, 3],
  }));
  assert.equal(summed.startingSideId, 'enemy');
  const maxed = createMatch(matchInput({
    playerSpd: [9, 0, 0, 0],
    enemySpd: [3, 3, 3, 3],
    config: { teamSpd: { aggregation: 'max' } },
  }));
  assert.equal(maxed.startingSideId, 'player');
  assert.equal(maxed.config.teamSpd.status, 'PENDING_OWNER');

  const starters = new Set();
  for (let seed = 1; seed <= 40; seed += 1) {
    const tied = createMatch(matchInput({ seed, playerSpd: [2, 2, 2, 2], enemySpd: [2, 2, 2, 2] }));
    starters.add(tied.startingSideId);
    const again = createMatch(matchInput({ seed, playerSpd: [2, 2, 2, 2], enemySpd: [2, 2, 2, 2] }));
    assert.equal(again.startingSideId, tied.startingSideId);
    assert.equal(tied.log.find((event) => event.type === 'battle_start').tieBreakUsed, true);
    assert.equal(tied.flags.spdTieBreak, 'PENDING_OWNER');
  }
  assert.equal(starters.size, 2);

  const state = createMatch(matchInput());
  assert.equal(state.activeSideId, 'player');
  endTurn(state);
  assert.equal(state.activeSideId, 'enemy');
  assert.equal(state.roundIndex, 1);
  endTurn(state);
  assert.equal(state.activeSideId, 'player');
  assert.equal(state.turnIndex, 3);
  assert.equal(state.roundIndex, 2);
});

test('AP resets to 5, card costs come from the card, zero AP does not auto-end, and cancel spends nothing', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([
      strike({ cardId: 'COST5', costAp: 5 }),
      strike({ cardId: 'COST0', costAp: 0 }),
      strike({ cardId: 'COST1', costAp: 1 }),
      strike({ cardId: 'FAC', costAp: 1, rarity: 'FAC', factionRequirement: 'Aegis Dominion' }),
    ]),
  }));
  assert.equal(state.sides.player.ap, 5);
  assert.equal(state.sides.enemy.ap, null);
  assert.equal(startTurn(state).alreadyStarted, true);
  assert.equal(state.sides.player.ap, 5);

  const armed = handCard(state, 'player', 'COST5');
  const ap = state.sides.player.ap;
  assert.equal(armAction(state, { cardInstanceId: armed.instanceId, actorAvatarId: 'AVT_PHA_002' }).apSpent, 0);
  assert.equal(state.sides.player.ap, ap);
  assert.equal(cancelAction(state).apSpent, 0);
  assert.equal(state.pendingAction, null);
  assert.equal(state.sides.player.ap, ap);
  assert.equal(handCard(state, 'player', 'COST5').instanceId, armed.instanceId);

  const previewAp = state.sides.player.ap;
  previewAction(state, { cardInstanceId: armed.instanceId, actorAvatarId: 'AVT_SAN_002', targets: ['AVT_PHA_002'] });
  assert.equal(state.sides.player.ap, previewAp);

  const illegal = play(state, 'FAC', 'AVT_SAN_002', ['AVT_AEG_002']);
  assert.equal(illegal.ok, false);
  assert.equal(illegal.reason, 'FACTION_GATE');
  assert.equal(state.sides.player.ap, 5);

  const spent = play(state, 'COST5', 'AVT_PHA_002', ['AVT_PHA_002']);
  assert.equal(spent.ok, true);
  assert.equal(spent.cost, 5);
  assert.equal(state.sides.player.ap, 0);
  assert.equal(state.phase, 'action');
  assert.equal(state.activeSideId, 'player');
  assert.equal(getOutcome(state).status, 'ongoing');
  assert.equal(play(state, 'COST1', 'AVT_PHA_002', ['AVT_PHA_002']).reason, 'INSUFFICIENT_AP');
  assert.equal(state.sides.player.ap, 0);
  assert.equal(play(state, 'COST0', 'AVT_PHA_002', ['AVT_PHA_002']).ok, true);
  assert.equal(state.sides.player.ap, 0);
  assert.equal(state.activeSideId, 'player');

  endTurn(state);
  assert.equal(state.sides.player.ap, 0);
  endTurn(state);
  assert.equal(state.sides.player.ap, 5);
});

test('missing, null, and out-of-range costs are rejected and duplicates stay uncapped', () => {
  assert.throws(() => createMatch(matchInput({
    playerDeck: padDeck([strike({ costAp: null, apCost: null, Cost_AP: null })]),
  })), (error) => error.reason === 'COST_UNASSIGNED');
  assert.throws(() => createMatch(matchInput({
    playerDeck: padDeck([sampleCard({ costAp: undefined, apCost: undefined })]),
  })), (error) => error.reason === 'COST_UNASSIGNED');
  assert.throws(() => createMatch(matchInput({
    playerDeck: padDeck([strike({ costAp: 6 })]),
  })), (error) => error.reason === 'COST_OUT_OF_RANGE');
  assert.throws(() => createMatch(matchInput({
    playerDeck: padDeck([sampleCard({ type: 'Tactic', costAp: 1 })]),
  })), (error) => error.reason === 'UNKNOWN_CARD_TYPE');
  assert.throws(() => createMatch(matchInput({ playerDeck: padDeck([]).slice(0, 29) })), (error) => error.reason === 'DECK_SIZE');
  const dupes = Array.from({ length: 30 }, () => strike({ cardId: 'ACT_SAME' }));
  const state = createMatch(matchInput({ playerDeck: dupes }));
  assert.equal(new Set(getZones(state, 'player').hand.map((card) => card.instanceId)).size, 5);
  assert.throws(() => createMatch(matchInput({
    playerDeck: dupes,
    config: { deckDuplicateMax: { value: 2 } },
  })), (error) => error.reason === 'DUPLICATE_CAP');
});

test('opening hand is 5, leftovers stay, refill stops at 5, and effect draw may pass 5 until the free end-of-round discard', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([
      sampleCard({
        cardId: 'DRAW2',
        name: 'Draw Two',
        type: 'Skill',
        costAp: 1,
        targetRule: 'Self',
        effects: [{ op: 'draw', count: 2 }],
      }),
      strike({ cardId: 'KEEP' }),
    ]),
    enemyDeck: padDeck([strike({ cardId: 'EKEEP' })]),
  }));
  const zones = getZones(state, 'player');
  assert.equal(zones.hand.length, 5);
  assert.equal(zones.draw.length, 25);
  assert.equal(getZones(state, 'enemy').hand.length, 5);
  const kept = zones.hand.filter((card) => card.cardId !== 'DRAW2').map((card) => card.instanceId);
  const beforeAp = state.sides.player.ap;
  assert.equal(play(state, 'DRAW2', 'AVT_AEG_002').ok, true);
  assert.equal(state.sides.player.zones.hand.length, 6);
  assert.equal(state.sides.player.ap, beforeAp - 1);
  for (const instanceId of kept) {
    assert.equal(state.sides.player.zones.hand.some((card) => card.instanceId === instanceId), true);
  }
  endTurn(state);
  assert.equal(state.phase, 'action');
  assert.equal(state.sides.player.zones.hand.length, 6);
  const apDuringEnemy = state.sides.player.ap;
  endTurn(state);
  assert.equal(state.phase, 'end_of_round_discard');
  assert.equal(state.sides.player.ap, apDuringEnemy);
  const excess = state.sides.player.zones.hand[0].instanceId;
  const discarded = resolveEndOfRoundDiscard(state, [excess]);
  assert.equal(discarded.ok, true);
  assert.equal(discarded.apSpent, 0);
  assert.equal(state.sides.player.zones.hand.length, 5);
  assert.equal(state.sides.player.zones.discard.some((card) => card.instanceId === excess), true);
  assert.equal(state.phase, 'action');
  assert.equal(state.sides.player.ap, 5);
});

test('voluntary discard costs 1 AP and the mandatory discard does not', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([strike({ cardId: 'TOSS', costAp: 0 })]),
  }));
  const toss = handCard(state, 'player', 'TOSS');
  const discarded = discardVoluntary(state, toss.instanceId);
  assert.equal(discarded.ok, true);
  assert.equal(discarded.apSpent, 1);
  assert.equal(state.sides.player.ap, 4);
  assert.equal(state.sides.player.zones.discard[0].instanceId, toss.instanceId);
  endTurn(state);
  const playerCard = state.sides.player.zones.hand[0];
  assert.equal(discardVoluntary(state, playerCard.instanceId).reason, 'NOT_ACTIVE_SIDE');
  assert.equal(state.sides.player.zones.hand.some((card) => card.instanceId === playerCard.instanceId), true);
  assert.equal(state.sides.player.ap, 4);
});

test('empty draw shuffles only the discard, void stays out, and zones are readable copies', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([
      strike({ cardId: 'PLAIN', costAp: 0 }),
      sampleCard({
        cardId: 'EXILE',
        name: 'Exile',
        costAp: 0,
        onResolveZone: 'Void',
        effects: [{ op: 'damage', mode: 'flat', amount: 1 }],
      }),
      sampleCard({
        cardId: 'SUCK',
        name: 'Suck',
        type: 'Skill',
        costAp: 0,
        targetRule: 'Self',
        effects: [{ op: 'draw', count: 30 }],
      }),
    ]),
  }));
  assert.equal(play(state, 'PLAIN', 'AVT_PHA_002', ['AVT_PHA_002']).zone, 'discard');
  assert.equal(play(state, 'EXILE', 'AVT_PHA_002', ['AVT_PHA_002']).zone, 'void');
  const exiled = state.sides.player.zones.void[0].instanceId;
  const discarded = state.sides.player.zones.discard[0].instanceId;
  assert.equal(play(state, 'SUCK', 'AVT_AEG_002').ok, true);
  const zones = getZones(state, 'player');
  assert.equal(zones.void.some((card) => card.instanceId === exiled), true);
  assert.equal(zones.draw.some((card) => card.instanceId === exiled), false);
  assert.equal(zones.hand.some((card) => card.instanceId === exiled), false);
  assert.equal(zones.discard.some((card) => card.instanceId === exiled), false);
  assert.equal(zones.hand.some((card) => card.instanceId === discarded), true);
  assert.equal(state.log.some((event) => event.type === 'shuffle_discard'), true);
  zones.hand.push({ instanceId: 'tamper' });
  assert.equal(getZones(state, 'player').hand.some((card) => card.instanceId === 'tamper'), false);
  assert.equal(getZones(state, 'enemy').void.length, 0);
  endTurn(state);
  assert.equal(getZones(state, 'player').void[0].instanceId, exiled);
});

test('retrieve pulls only a permitted card from the named pile', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([
      strike({ cardId: 'PLAIN', costAp: 0 }),
      sampleCard({
        cardId: 'EXILE',
        costAp: 0,
        onResolveZone: 'Void',
        effects: [{ op: 'damage', mode: 'flat', amount: 0 }],
      }),
      sampleCard({
        cardId: 'RECALL',
        name: 'Recall',
        type: 'Skill',
        costAp: 1,
        targetRule: 'Pile',
        effects: [{
          op: 'retrieve',
          pile: 'discard',
          destination: 'hand',
          count: 1,
          permit: { cardIds: ['PLAIN'] },
        }],
      }),
      sampleCard({
        cardId: 'REVOID',
        name: 'Revoid',
        type: 'Skill',
        costAp: 1,
        targetRule: 'Pile',
        effects: [{
          op: 'retrieve',
          pile: 'void',
          destination: 'hand',
          count: 1,
          permit: { cardIds: ['EXILE'] },
        }],
      }),
    ]),
  }));
  play(state, 'PLAIN', 'AVT_PHA_002', ['AVT_AEG_002']);
  play(state, 'EXILE', 'AVT_PHA_002', ['AVT_AEG_002']);
  const plain = state.sides.player.zones.discard[0];
  const exiled = state.sides.player.zones.void[0];
  const recall = handCard(state, 'player', 'RECALL');
  const denied = playAction(state, {
    cardInstanceId: recall.instanceId,
    actorAvatarId: 'AVT_AEG_002',
    targets: { retrieveInstanceIds: [exiled.instanceId] },
  });
  assert.equal(denied.reason, 'NOT_IN_PILE');
  assert.equal(state.sides.player.ap, 5);
  const wrongPermit = playAction(state, {
    cardInstanceId: recall.instanceId,
    actorAvatarId: 'AVT_AEG_002',
    targets: { retrieveInstanceIds: [exiled.instanceId] },
  });
  assert.equal(wrongPermit.ok, false);
  const accepted = playAction(state, {
    cardInstanceId: recall.instanceId,
    actorAvatarId: 'AVT_AEG_002',
    targets: { retrieveInstanceIds: [plain.instanceId] },
  });
  assert.equal(accepted.ok, true);
  assert.equal(state.sides.player.ap, 4);
  assert.equal(state.sides.player.zones.hand.some((card) => card.instanceId === plain.instanceId), true);
  assert.equal(state.sides.player.zones.void[0].instanceId, exiled.instanceId);
  const revoid = handCard(state, 'player', 'REVOID');
  const fromVoid = playAction(state, {
    cardInstanceId: revoid.instanceId,
    actorAvatarId: 'AVT_AEG_002',
    targets: { retrieveInstanceIds: [exiled.instanceId] },
  });
  assert.equal(fromVoid.ok, true);
  assert.equal(state.sides.player.zones.void.length, 0);
  assert.equal(state.sides.player.zones.hand.some((card) => card.instanceId === exiled.instanceId), true);
});

test('mixed decks are legal, generic cards ignore faction, and FAC cards require that faction unless overridden', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([
      strike({ cardId: 'GENERIC', costAp: 0 }),
      strike({ cardId: 'FAC_AEG', costAp: 0, rarity: 'FAC', factionRequirement: 'Aegis Dominion' }),
      strike({ cardId: 'FAC_PHA', costAp: 0, rarity: 'FAC', factionRequirement: 'Phantom Blades' }),
      strike({
        cardId: 'OVERRIDE',
        costAp: 0,
        rarity: 'FAC',
        factionRequirement: 'Aegis Dominion',
        factionOverride: true,
      }),
    ]),
  }));
  assert.equal(play(state, 'GENERIC', 'AVT_CEL_002', ['AVT_AEG_002']).ok, true);
  assert.equal(play(state, 'FAC_AEG', 'AVT_PHA_002', ['AVT_AEG_002']).reason, 'FACTION_GATE');
  assert.equal(state.sides.player.ap, 5);
  assert.equal(play(state, 'FAC_AEG', 'AVT_AEG_002', ['AVT_AEG_002']).ok, true);
  assert.equal(play(state, 'FAC_PHA', 'AVT_PHA_002', ['AVT_AEG_002']).ok, true);

  const sanctuaryOnly = createMatch(matchInput({
    player: roster((avatar, index) => {
      avatar.avatarId = `AVT_SAN_10${index}`;
      avatar.faction = 'Sanctuary Order';
      avatar.designRef = null;
    }),
    playerDeck: padDeck([
      strike({ cardId: 'GENERIC', costAp: 0 }),
      strike({ cardId: 'FAC_AEG', costAp: 0, rarity: 'FAC', factionRequirement: 'Aegis Dominion' }),
      strike({
        cardId: 'OVERRIDE',
        costAp: 0,
        rarity: 'FAC',
        factionRequirement: 'Aegis Dominion',
        factionOverride: true,
      }),
    ]),
  }));
  const actor = sanctuaryOnly.sides.player.avatars[0].avatarId;
  assert.equal(play(sanctuaryOnly, 'FAC_AEG', actor, ['AVT_AEG_002']).reason, 'FACTION_GATE');
  assert.equal(play(sanctuaryOnly, 'GENERIC', actor, ['AVT_AEG_002']).ok, true);
  assert.equal(play(sanctuaryOnly, 'OVERRIDE', actor, ['AVT_AEG_002']).ok, true);
});

test('a skill card fires that avatar active once, and an attack does not', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([
      sampleCard({
        cardId: 'SKILL',
        type: 'Skill',
        costAp: 1,
        targetRule: 'Ally',
        effects: [{ op: 'trigger_active' }],
      }),
      strike({ cardId: 'HIT', costAp: 0 }),
    ]),
  }));
  assert.equal(play(state, 'HIT', 'AVT_AEG_002', ['AVT_AEG_002']).ok, true);
  assert.equal(state.sides.player.avatars[0].shield, 0);
  assert.equal(state.sides.player.avatars[0].statuses.some((status) => status.kind === 'taunt'), false);
  assert.equal(play(state, 'SKILL', 'AVT_AEG_002').ok, true);
  const tank = state.sides.player.avatars[0];
  assert.equal(tank.shield, 2);
  assert.equal(tank.statuses.filter((status) => status.kind === 'taunt').length, 1);
  const skill = sampleCard({
    cardId: 'SKILL2',
    type: 'Skill',
    costAp: 0,
    targetRule: 'Ally',
    skillTargetCount: 2,
    effects: [{ op: 'trigger_active' }],
  });
  const paired = createMatch(matchInput({
    playerDeck: padDeck([skill]),
  }));
  const instance = handCard(paired, 'player', 'SKILL2');
  assert.equal(playAction(paired, {
    cardInstanceId: instance.instanceId,
    actorAvatarId: 'AVT_AEG_002',
  }).reason, 'ACTOR_COUNT');
  assert.equal(paired.sides.player.ap, 5);
  const both = playAction(paired, {
    cardInstanceId: instance.instanceId,
    actorAvatarIds: ['AVT_AEG_002', 'AVT_SAN_002'],
  });
  assert.equal(both.ok, true);
  assert.equal(paired.sides.player.avatars[0].shield, 2);
  assert.equal(paired.sides.player.avatars.find((unit) => unit.avatarId === 'AVT_SAN_002').statuses.some((status) => status.kind === 'regen'), true);
});

test('passive chance follows the seeded stream', () => {
  const withChance = (seed, chance) => createMatch(matchInput({
    seed,
    player: roster((avatar, index) => {
      if (index !== 0) return;
      avatar.passive = {
        name: 'Bulwark',
        status: 'PROPOSED',
        chance,
        trigger: 'turn_start',
        includeSelf: true,
        effects: [{ op: 'buff', stat: 'def', amount: 1, durationTurns: 1, target: 'all_allies' }],
      };
    }),
  }));
  const always = withChance(1, 1);
  assert.equal(always.sides.player.avatars.every((unit) => unit.statuses.some((status) => status.kind === 'buff' && status.stat === 'def')), true);
  const never = withChance(1, 0);
  assert.equal(never.sides.player.avatars.some((unit) => unit.statuses.some((status) => status.kind === 'buff')), false);
  const quiet = createMatch(matchInput({ seed: 1 }));
  assert.equal(never.rngState, quiet.rngState);
  let sawProc = false;
  let sawMiss = false;
  for (let seed = 1; seed <= 30; seed += 1) {
    const rolled = withChance(seed, 0.5);
    const repeat = withChance(seed, 0.5);
    assert.deepEqual(getState(rolled).log, getState(repeat).log);
    const buffed = rolled.sides.player.avatars[0].statuses.some((status) => status.kind === 'buff');
    sawProc = sawProc || buffed;
    sawMiss = sawMiss || !buffed;
  }
  assert.equal(sawProc && sawMiss, true);
});

test('shield absorbs, taunt restricts a single target, and next-attack bonuses expire', () => {
  const state = createMatch(matchInput({
    playerDeck: padDeck([
      sampleCard({
        cardId: 'SKILL',
        type: 'Skill',
        costAp: 0,
        targetRule: 'Ally',
        effects: [{ op: 'trigger_active' }],
      }),
      sampleCard({
        cardId: 'GUARD',
        type: 'DEF',
        costAp: 0,
        targetRule: 'Self',
        effects: [{ op: 'shield', amount: 2, target: 'self' }],
      }),
    ]),
    enemyDeck: padDeck([
      sampleCard({
        cardId: 'HIT',
        costAp: 0,
        effects: [{ op: 'damage', mode: 'flat', amount: 5 }],
      }),
    ]),
    enemyControl: 'human',
  }));
  play(state, 'GUARD', 'AVT_CEL_002');
  assert.equal(state.sides.player.avatars.find((unit) => unit.avatarId === 'AVT_CEL_002').shield, 2);
  endTurn(state);
  const blocked = play(state, 'HIT', 'AVT_PHA_002', ['AVT_CEL_002'], 'enemy');
  assert.equal(blocked.ok, true);
  const mage = state.sides.player.avatars.find((unit) => unit.avatarId === 'AVT_CEL_002');
  assert.equal(mage.shield, 0);
  assert.equal(mage.hp, 37);

  const taunt = createMatch(matchInput({
    playerDeck: padDeck([
      sampleCard({
        cardId: 'SKILL',
        type: 'Skill',
        costAp: 0,
        targetRule: 'Ally',
        effects: [{ op: 'trigger_active' }],
      }),
    ]),
    enemyDeck: padDeck([strike({ cardId: 'HIT', costAp: 0 })]),
    enemyControl: 'human',
  }));
  play(taunt, 'SKILL', 'AVT_AEG_002');
  endTurn(taunt);
  const refused = play(taunt, 'HIT', 'AVT_PHA_002', ['AVT_CEL_002'], 'enemy');
  assert.equal(refused.reason, 'TAUNT');
  assert.equal(taunt.sides.enemy.ap, 5);
  assert.equal(play(taunt, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002'], 'enemy').ok, true);
  endTurn(taunt);
  assert.equal(taunt.sides.player.avatars[0].statuses.some((status) => status.kind === 'taunt'), false);

  const rush = createMatch(matchInput({
    player: roster((avatar, index) => {
      if (index === 1) avatar.passive = null;
    }),
    enemy: roster((avatar) => { avatar.stats.def = 2; }),
    playerDeck: padDeck([
      sampleCard({
        cardId: 'RUSH',
        type: 'Skill',
        costAp: 0,
        targetRule: 'Ally',
        effects: [{ op: 'trigger_active' }],
      }),
      strike({ cardId: 'HIT', costAp: 0 }),
      strike({ cardId: 'HIT2', costAp: 0, name: 'Second' }),
    ]),
  }));
  play(rush, 'RUSH', 'AVT_PHA_002');
  play(rush, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  play(rush, 'HIT2', 'AVT_PHA_002', ['AVT_AEG_002']);
  const damages = rush.log.filter((event) => event.type === 'damage').map((event) => event.amount);
  assert.deepEqual(damages, [8, 6]);
  assert.equal(rush.sides.player.avatars.find((unit) => unit.avatarId === 'AVT_PHA_002').statuses.some((status) => status.kind === 'next_attack'), false);
});

test('Justina regen heals living teammates +3 twice, skips the dead, and respects the heal cap', () => {
  const state = createMatch(matchInput({
    player: roster((avatar, index) => {
      avatar.hp = index === 0 ? 1 : 10;
      avatar.maxHp = 30;
    }),
    playerDeck: padDeck([
      sampleCard({
        cardId: 'GRACE',
        type: 'Skill',
        costAp: 0,
        targetRule: 'Ally',
        effects: [{ op: 'trigger_active' }],
      }),
    ]),
    enemyDeck: padDeck([
      sampleCard({
        cardId: 'SMITE',
        costAp: 0,
        effects: [{ op: 'damage', mode: 'flat', amount: 20 }],
      }),
    ]),
    enemyControl: 'human',
  }));
  const justina = state.sides.player.avatars.find((unit) => unit.avatarId === 'AVT_SAN_002');
  assert.equal(justina.active.name, 'Saving Grace');
  assert.equal(justina.active.status, 'LOCKED');
  assert.equal(justina.active.effects[0].amount, 3);
  assert.equal(justina.active.effects[0].ticks, 2);
  play(state, 'GRACE', 'AVT_SAN_002');
  for (const unit of state.sides.player.avatars) {
    const regen = unit.statuses.find((status) => status.kind === 'regen');
    assert.equal(regen.amount, 3);
    assert.equal(regen.ticksRemaining, 2);
    assert.equal(unit.hp, unit.avatarId === 'AVT_AEG_002' ? 1 : 10);
  }
  endTurn(state);
  play(state, 'SMITE', 'AVT_PHA_002', ['AVT_AEG_002'], 'enemy');
  assert.equal(state.sides.player.avatars[0].alive, false);
  endTurn(state);
  assert.equal(state.sides.player.avatars[0].hp, 0);
  for (const unit of state.sides.player.avatars.slice(1)) assert.equal(unit.hp, 13);
  endTurn(state);
  endTurn(state);
  assert.equal(state.sides.player.avatars[0].hp, 0);
  for (const unit of state.sides.player.avatars.slice(1)) {
    assert.equal(unit.hp, 16);
    assert.equal(unit.statuses.some((status) => status.kind === 'regen'), false);
  }
  endTurn(state);
  endTurn(state);
  for (const unit of state.sides.player.avatars.slice(1)) assert.equal(unit.hp, 16);

  const capped = createMatch(matchInput({
    config: { healCap: { policy: 'clamp_to_max_hp' } },
    player: roster((avatar) => {
      avatar.hp = 9;
      avatar.maxHp = 10;
    }),
    playerDeck: padDeck([
      sampleCard({
        cardId: 'GRACE',
        type: 'Skill',
        costAp: 0,
        targetRule: 'Ally',
        effects: [{ op: 'trigger_active' }],
      }),
    ]),
  }));
  play(capped, 'GRACE', 'AVT_SAN_002');
  endTurn(capped);
  endTurn(capped);
  assert.equal(capped.sides.player.avatars[0].hp, 10);
  assert.equal(capped.config.healCap.status, 'PENDING_OWNER');

  const over = createMatch(matchInput({
    config: { healCap: { policy: 'allow_overheal' } },
    player: roster((avatar) => {
      avatar.hp = 9;
      avatar.maxHp = 10;
    }),
    playerDeck: padDeck([
      sampleCard({
        cardId: 'GRACE',
        type: 'Skill',
        costAp: 0,
        targetRule: 'Ally',
        effects: [{ op: 'trigger_active' }],
      }),
    ]),
  }));
  play(over, 'GRACE', 'AVT_SAN_002');
  endTurn(over);
  endTurn(over);
  assert.equal(over.sides.player.avatars[0].hp, 12);
});

test('placeholder damage is labelled, pluggable, and legacy pow maps to atk without dropping it', () => {
  const base = createMatch(matchInput({
    player: roster((avatar, index) => {
      if (index === 1) {
        avatar.stats = { pow: 4, atk: 8, def: 2, spd: 9 };
      }
    }),
    enemy: roster((avatar) => { avatar.stats.def = 8; avatar.hp = 20; avatar.maxHp = 20; }),
    playerDeck: padDeck([strike({ cardId: 'HIT', costAp: 0 })]),
  }));
  const attacker = base.sides.player.avatars.find((unit) => unit.avatarId === 'AVT_PHA_002');
  assert.equal(attacker.stats.atk, 8);
  assert.deepEqual(attacker.legacy, { pow: 4 });
  play(base, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  const logged = base.log.find((event) => event.type === 'damage');
  assert.equal(logged.placeholder, true);
  assert.equal(logged.formulaStatus, 'PENDING_OWNER');
  assert.equal(logged.formula, 'placeholder_atk_minus_def');
  assert.equal(logged.amount, 1);

  const flat = createMatch(matchInput({
    config: { damage: { formula: 'placeholder_flat_atk', minDamage: 1 } },
    enemy: roster((avatar) => { avatar.stats.def = 8; avatar.hp = 20; avatar.maxHp = 20; }),
    playerDeck: padDeck([strike({ cardId: 'HIT', costAp: 0 })]),
  }));
  play(flat, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  assert.equal(flat.log.find((event) => event.type === 'damage').amount, 8);
  assert.equal(flat.config.damage.status, 'PENDING_OWNER');

  const zero = createMatch(matchInput({
    config: { damage: { minDamage: 0 } },
    player: roster((avatar, index) => { if (index === 1) avatar.stats.atk = 1; }),
    enemy: roster((avatar) => { avatar.stats.def = 8; avatar.hp = 20; avatar.maxHp = 20; }),
    playerDeck: padDeck([strike({ cardId: 'HIT', costAp: 0 })]),
  }));
  play(zero, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  assert.equal(zero.log.find((event) => event.type === 'damage').amount, 0);
  assert.equal(zero.sides.enemy.avatars[0].hp, 20);

  const legacyOnly = createMatch(matchInput({
    player: roster((avatar, index) => {
      if (index !== 0) return;
      avatar.stats = { pow: 6, def: 8, spd: 1 };
    }),
    playerDeck: padDeck([strike({ cardId: 'HIT', costAp: 0 })]),
  }));
  const tank = legacyOnly.sides.player.avatars[0];
  assert.equal(tank.stats.atk, 6);
  assert.deepEqual(tank.legacy, { pow: 6 });
});

test('winning, losing, and simultaneous death emit one rewards object', () => {
  const win = createMatch(matchInput({
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
  assert.equal(getOutcome(win).rewards, null);
  assert.equal(play(win, 'WIPE', 'AVT_PHA_002').ok, true);
  const outcome = getOutcome(win);
  assert.equal(outcome.status, 'decided');
  assert.equal(outcome.winnerSideId, 'player');
  assert.equal(outcome.loserSideId, 'enemy');
  assert.equal(outcome.verdict.player, 'victory');
  assert.equal(outcome.verdict.enemy, 'defeat');
  assert.equal(outcome.reason, 'all_avatars_defeated');
  assert.equal(outcome.rewards.timesEmitted, 1);
  assert.equal(outcome.rewards.payloadStatus, 'PENDING_OWNER');
  assert.equal(outcome.rewards.payload.status, 'PENDING_OWNER');
  assert.equal(outcome.rewards.payload.label, 'PENDING_OWNER');
  assert.equal(outcome.rewards.payload.G, null);
  assert.equal(outcome.rewards.payload.GStatus, 'PENDING_OWNER');
  assert.equal(outcome.rewards.payload.loot, null);
  assert.equal(outcome.rewards.payload.lootStatus, 'PENDING_OWNER');
  assert.equal(outcome.rewards.payload.items, null);
  assert.equal(getOutcome(win).winnerSideId, 'player');
  assert.equal(getOutcome(win).verdict.player, 'victory');
  assert.equal(getOutcome(win).verdict.enemy, 'defeat');
  assert.equal(win.log.filter((event) => event.type === 'rewards').length, 1);
  assert.equal(endTurn(win).reason, 'BATTLE_DECIDED');
  assert.equal(playAction(win, { cardInstanceId: 'gone', actorAvatarId: 'AVT_PHA_002' }).reason, 'BATTLE_DECIDED');
  getOutcome(win);
  getOutcome(win);
  assert.equal(win.log.filter((event) => event.type === 'rewards').length, 1);

  const loss = createMatch(matchInput({
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
  assert.equal(lost.rewards.timesEmitted, 1);
  assert.equal(lost.rewards.payload.G, null);
  assert.equal(lost.rewards.payload.lootStatus, 'PENDING_OWNER');
  assert.equal(loss.log.filter((event) => event.type === 'rewards').length, 1);

  const both = createMatch(matchInput({
    playerSpd: [8, 0, 0, 0],
    enemySpd: [1, 0, 0, 0],
    player: roster((avatar) => { avatar.hp = 4; avatar.maxHp = 4; }),
    enemy: roster((avatar) => { avatar.hp = 4; avatar.maxHp = 4; }),
    playerDeck: padDeck([
      sampleCard({
        cardId: 'BOOM',
        costAp: 0,
        targetRule: 'All_Enemies',
        effects: [{ op: 'damage', mode: 'flat', amount: 9, target: 'all_units' }],
      }),
    ]),
  }));
  play(both, 'BOOM', 'AVT_PHA_002');
  assert.equal(getOutcome(both).reason, 'simultaneous_death');
  assert.equal(getOutcome(both).winnerSideId, 'player');
  assert.equal(both.config.simultaneousDeath.status, 'PENDING_OWNER');
  assert.equal(both.log.filter((event) => event.type === 'rewards').length, 1);

  const ordered = createMatch(matchInput({
    config: { simultaneousDeath: { policy: 'input_order' } },
    playerSpd: [1, 0, 0, 0],
    enemySpd: [9, 0, 0, 0],
    player: roster((avatar) => { avatar.hp = 4; avatar.maxHp = 4; }),
    enemy: roster((avatar) => { avatar.hp = 4; avatar.maxHp = 4; }),
    playerDeck: padDeck([
      sampleCard({
        cardId: 'BOOM',
        costAp: 0,
        targetRule: 'All_Enemies',
        effects: [{ op: 'damage', mode: 'flat', amount: 9, target: 'all_units' }],
      }),
    ]),
    enemyControl: 'human',
  }));
  assert.equal(ordered.startingSideId, 'enemy');
  endTurn(ordered);
  play(ordered, 'BOOM', 'AVT_PHA_002');
  assert.equal(getOutcome(ordered).winnerSideId, 'player');
  assert.equal(ordered.config.simultaneousDeath.status, 'PENDING_OWNER');
});

test('the same seed and actions serialize to the same state, and enemy AI is deterministic', () => {
  const run = () => {
    const state = createMatch(matchInput({ seed: 11, matchId: 'det' }));
    const card = state.sides.player.zones.hand[0];
    playAction(state, { cardInstanceId: card.instanceId, actorAvatarId: 'AVT_PHA_002', targets: ['AVT_AEG_002'] });
    discardVoluntary(state, state.sides.player.zones.hand[0].instanceId);
    endTurn(state);
    return getState(state);
  };
  assert.deepEqual(run(), run());
  const raw = JSON.stringify(run());
  assert.equal(typeof raw, 'string');
  assert.equal(raw.includes('undefined'), false);

  const aiOnce = createMatch(matchInput({
    seed: 4,
    playerControl: 'ai',
    enemyControl: 'ai',
    player: roster((avatar) => { avatar.hp = 6; avatar.maxHp = 6; }),
    enemy: roster((avatar) => { avatar.hp = 6; avatar.maxHp = 6; }),
    shuffleDecks: true,
  }));
  const aiTwice = createMatch(matchInput({
    seed: 4,
    playerControl: 'ai',
    enemyControl: 'ai',
    player: roster((avatar) => { avatar.hp = 6; avatar.maxHp = 6; }),
    enemy: roster((avatar) => { avatar.hp = 6; avatar.maxHp = 6; }),
    shuffleDecks: true,
  }));
  for (let guard = 0; guard < 40 && getOutcome(aiOnce).status !== 'decided'; guard += 1) runEnemyTurn(aiOnce);
  for (let guard = 0; guard < 40 && getOutcome(aiTwice).status !== 'decided'; guard += 1) runEnemyTurn(aiTwice);
  assert.equal(getOutcome(aiOnce).status, 'decided');
  assert.equal(getOutcome(aiOnce).rewards.timesEmitted, 1);
  assert.deepEqual(getState(aiOnce).log, getState(aiTwice).log);
  const human = createMatch(matchInput());
  assert.equal(runEnemyTurn(human).reason, 'NOT_AI_SIDE');
  assert.equal(human.turnIndex, 1);
});
