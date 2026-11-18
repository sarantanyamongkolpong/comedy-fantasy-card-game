import { HAND_SIZE } from '../../src/schema/constants.js';
import { createBattle, endTurn, evaluateOutcome, playCard, resolveEffect } from '../../src/battle/battle.js';
import { addCard, assertDeckSize, createDeck, discardCard, drawCards } from '../../src/cards/hand.js';
import { validateActionCard } from '../../src/schema/validate.js';
import { costAt } from './analyze.js';
import { ConfigError } from './errors.js';
import { evaluateFormula, readStat } from './formula.js';
import { chooseCard } from './policies.js';
import { buildScenarioReport } from './report.js';
import { createRng, shuffle } from './rng.js';
import { assertConfig } from './validate-config.js';
import { LAB_LABEL } from './vocabulary.js';

/**
 * Run every repeat. Repeat r uses seed + r * repeatSeedStep.
 * @param {object} config
 */
export function runScenario(config) {
  assertConfig(config);
  const battles = [];
  for (let index = 0; index < config.repeats; index += 1) {
    const seed = config.seed + index * config.repeatSeedStep;
    battles.push(runBattle(config, seed, index));
  }
  return buildScenarioReport(config, battles);
}

/**
 * @param {object} config validated scenario
 * @param {number} seed
 * @param {number} [repeatIndex]
 */
export function runBattle(config, seed, repeatIndex = 0) {
  const opened = openBattle(config, seed);
  return runOpened(opened, repeatIndex);
}

/**
 * Build a battle, inject the compiled rules, and draw opening hands.
 * The returned session is the laboratory state around the engine battle.
 * @param {object} config
 * @param {number} seed
 */
export function openBattle(config, seed) {
  assertConfig(config);
  const session = {
    config,
    seed,
    rng: createRng(seed),
    battle: null,
    sideIds: { A: config.sides.A.sideId, B: config.sides.B.sideId },
    zones: {
      deck: { A: null, B: null },
      discard: { A: [], B: [] },
      removed: { A: [], B: [] },
      inPlay: { A: [], B: [] },
    },
    catalog: new Map(),
    effects: [],
    grants: { A: 0, B: 0 },
    startingHp: null,
  };
  const sideA = buildSide(config.sides.A, config);
  const sideB = buildSide(config.sides.B, config);
  const battle = createBattle({
    battleId: `${config.scenarioId}#${seed}`,
    sideA,
    sideB,
    rules: compileRules(session),
  });
  session.battle = battle;
  session.startingHp = {
    A: battle.sideA.members.map((member) => member.markers.startingHp),
    B: battle.sideB.members.map((member) => member.markers.startingHp),
  };
  buildZone(session, 'A');
  buildZone(session, 'B');
  const opening = drawOpening(session);
  return { session, opening };
}

/**
 * @param {{ session: object, opening: object }} opened
 * @param {number} [repeatIndex]
 */
export function runOpened(opened, repeatIndex = 0) {
  return playSession(opened.session, opened.opening, repeatIndex);
}

/**
 * @param {object} session
 * @param {object} opening
 * @param {number} repeatIndex
 */
function playSession(session, opening, repeatIndex) {
  const buckets = { A: { leftover: 0 }, B: { leftover: 0 } };
  if (opening.reason === 'DRAW_LOOP') {
    closeTurn(session, buckets);
    return finish(session, buckets, repeatIndex, 'repeated-state', {
      kind: 'draw-loop',
      firstTurn: null,
      repeatTurn: session.battle.turnIndex,
    });
  }
  if (session.battle.outcome.status === 'decided') {
    closeTurn(session, buckets);
    return finish(session, buckets, repeatIndex, 'decided', null);
  }

  const seen = new Map();
  let resolutions = 0;
  const maxTurns = session.config.parameters.turnCap.maxTurns;
  const guard = maxTurns * HAND_SIZE + HAND_SIZE;

  while (session.battle.outcome.status === 'ongoing') {
    if (session.battle.turnIndex > maxTurns) {
      return finish(session, buckets, repeatIndex, 'turn-cap', null);
    }
    if (shouldDrawOnTurn(session)) {
      const drawn = drawMany(session, sideKeyOf(session, session.battle.activeSideId), session.config.parameters.draw.eachTurnCount);
      if (drawn.reason === 'DRAW_LOOP') {
        closeTurn(session, buckets);
        return finish(session, buckets, repeatIndex, 'repeated-state', {
          kind: 'draw-loop',
          firstTurn: null,
          repeatTurn: session.battle.turnIndex,
        });
      }
      evaluateOutcome(session.battle);
      if (session.battle.outcome.status === 'decided') {
        closeTurn(session, buckets);
        return finish(session, buckets, repeatIndex, 'decided', null);
      }
    }
    expireShields(session);
    const key = fingerprint(session);
    if (seen.has(key)) {
      closeTurn(session, buckets);
      return finish(session, buckets, repeatIndex, 'repeated-state', {
        kind: 'repeated-state',
        firstTurn: seen.get(key),
        repeatTurn: session.battle.turnIndex,
      });
    }
    seen.set(key, session.battle.turnIndex);

    const policy = policyForActive(session);
    while (session.battle.outcome.status === 'ongoing') {
      const card = chooseCard(session.battle, session.battle.activeSideId, policy);
      if (!card) break;
      resolutions += 1;
      if (resolutions > guard) {
        throw new Error('laboratory play guard tripped; this is a lab defect, not a battle result');
      }
      const played = playCard(session.battle, session.battle.activeSideId, card.cardId);
      if (!played.ok) break;
      const template = session.catalog.get(card.cardId);
      const effect = resolveEffect(session.battle, template);
      session.effects.push(effect);
      const destination = session.config.parameters.discard.playedCardsGoTo;
      const ownerKey = sideKeyOf(session, session.battle.activeSideId);
      if (destination === 'stayInPlay') {
        session.zones.inPlay[ownerKey].push(structuredClone(template));
      } else {
        const discarded = discardCard(session.battle.hands[session.battle.activeSideId], card.cardId, session.battle.rules);
        if (!discarded?.ok) throw new Error(`discard rule rejected ${card.cardId}`);
      }
      evaluateOutcome(session.battle);
    }
    if (session.battle.outcome.status === 'decided') {
      closeTurn(session, buckets);
      return finish(session, buckets, repeatIndex, 'decided', null);
    }
    closeTurn(session, buckets);
    if (session.battle.turnIndex >= maxTurns) {
      return finish(session, buckets, repeatIndex, 'turn-cap', null);
    }
    const ended = endTurn(session.battle);
    if (!ended.ok) {
      if (ended.reason === 'BATTLE_DECIDED') return finish(session, buckets, repeatIndex, 'decided', null);
      throw new Error(`endTurn failed: ${ended.reason}`);
    }
  }
  return finish(session, buckets, repeatIndex, 'decided', null);
}

function finish(session, buckets, repeatIndex, stoppedReason, loop) {
  const battle = session.battle;
  const ap = {};
  for (const key of ['A', 'B']) {
    const sideId = session.sideIds[key];
    const fromLog = apFromLog(battle, sideId);
    const leftover = buckets[key].leftover;
    const grants = session.grants[key];
    if (fromLog.refreshed + grants - fromLog.spent !== leftover) {
      throw new Error(
        `AP ledger diverged for side ${key}: refreshed ${fromLog.refreshed}, grants ${grants}, spent ${fromLog.spent}, leftover ${leftover}`,
      );
    }
    ap[key] = { ...fromLog, leftover, grants };
  }
  const decided = stoppedReason === 'decided';
  const outcome = decided
    ? structuredClone(battle.outcome)
    : { status: 'unresolved', winnerSideId: null, loserSideId: null, verdict: null, stop: stoppedReason };
  const simultaneous =
    decided &&
    battle.rules.isSideDefeated(battle.sideA, battle) &&
    battle.rules.isSideDefeated(battle.sideB, battle);
  const start = battle.log.find((event) => event.type === 'battle_start');
  const result = {
    label: LAB_LABEL,
    repeatIndex,
    seed: session.seed,
    seedConsumed: session.rng.calls > 0,
    scenarioId: session.config.scenarioId,
    sideIds: { ...session.sideIds },
    policyA: session.config.policies.sideA.id,
    policyB: session.config.policies.sideB.id,
    startingSideId: battle.startingSideId,
    teamSpd: start ? { ...start.teamSpd } : null,
    startingHp: session.startingHp,
    stoppedReason,
    loop,
    outcome,
    winnerSideId: decided ? outcome.winnerSideId : null,
    loserSideId: decided ? outcome.loserSideId : null,
    simultaneous,
    turns: battle.turnIndex,
    rounds: battle.roundIndex,
    ap,
    plays: { A: ap.A.plays, B: ap.B.plays },
    effects: session.effects,
  };
  result.neverPlayed = neverPlayed(result.plays);
  return result;
}

function neverPlayed(plays) {
  const types = ['ATK', 'DEF', 'Skill'];
  return types.filter((actionType) => plays.A[actionType] === 0 && plays.B[actionType] === 0);
}

function apFromLog(battle, sideId) {
  const starts = battle.log.filter((event) => event.type === 'turn_start' && event.sideId === sideId);
  const plays = battle.log.filter((event) => event.type === 'play' && event.sideId === sideId);
  const byType = { ATK: 0, DEF: 0, Skill: 0 };
  for (const play of plays) byType[play.actionType] += 1;
  return {
    spent: plays.reduce((sum, event) => sum + event.cost, 0),
    refreshed: starts.reduce((sum, event) => sum + event.ap, 0),
    turns: starts.length,
    plays: byType,
  };
}

function closeTurn(session, buckets) {
  const key = sideKeyOf(session, session.battle.activeSideId);
  buckets[key].leftover += session.battle.ap[session.battle.activeSideId];
}

function shouldDrawOnTurn(session) {
  const draw = session.config.parameters.draw;
  if (draw.timing !== 'turnStart') return false;
  if (!draw.openingIncludesFirstTurn) return true;
  const starts = session.battle.log.filter(
    (event) => event.type === 'turn_start' && event.sideId === session.battle.activeSideId,
  ).length;
  return starts > 1;
}

function expireShields(session) {
  if (session.config.parameters.damage.incoming.shieldUnused !== 'expireAtStartOfOwnerNextTurn') return;
  const starts = session.battle.log.filter(
    (event) => event.type === 'turn_start' && event.sideId === session.battle.activeSideId,
  ).length;
  if (starts <= 1) return;
  const side = sideObject(session.battle, session.battle.activeSideId);
  for (const member of side.members) member.markers.shield = 0;
}

function policyForActive(session) {
  return sideKeyOf(session, session.battle.activeSideId) === 'A'
    ? session.config.policies.sideA
    : session.config.policies.sideB;
}

function drawOpening(session) {
  const count = session.config.parameters.draw.openingCount;
  const order = session.config.parameters.draw.openingOrder;
  const keys =
    order === 'sideAThenSideB'
      ? ['A', 'B']
      : [sideKeyOf(session, session.battle.startingSideId), sideKeyOf(session, session.battle.startingSideId) === 'A' ? 'B' : 'A'];
  for (const key of keys) {
    const drawn = drawMany(session, key, count);
    if (drawn.reason === 'DRAW_LOOP') return drawn;
  }
  evaluateOutcome(session.battle);
  return { ok: true, reason: 'OPENED', label: LAB_LABEL };
}

function drawMany(session, sideKey, count) {
  if (count === 0) return { ok: true, reason: 'NO_DRAW', label: LAB_LABEL };
  const seen = new Set();
  for (let attempt = 0; attempt < count; attempt += 1) {
    const snap = fingerprint(session);
    if (seen.has(snap)) return { ok: false, reason: 'DRAW_LOOP', attempt, label: LAB_LABEL };
    seen.add(snap);
    const result = drawCards(session.battle.hands[session.sideIds[sideKey]], session.zones.deck[sideKey], session.battle.rules);
    if (!result.ok) return result;
  }
  return { ok: true, reason: 'DREW', label: LAB_LABEL };
}

/**
 * @param {object} session
 */
export function fingerprint(session) {
  const battle = session.battle;
  const packSide = (side) =>
    side.members.map((member) => ({
      id: member.avatarId,
      hp: member.markers.hp,
      shield: member.markers.shield,
      mitigate: member.markers.mitigateNext,
      bonus: { ...member.markers.bonus },
      ko: member.markers.ko === true,
    }));
  const ids = (cards) => (cards ?? []).map((card) => card.cardId);
  return JSON.stringify({
    active: battle.activeSideId,
    apA: battle.ap[session.sideIds.A],
    apB: battle.ap[session.sideIds.B],
    a: packSide(battle.sideA),
    b: packSide(battle.sideB),
    handA: ids(battle.hands[session.sideIds.A].cards),
    handB: ids(battle.hands[session.sideIds.B].cards),
    deckA: ids(session.zones.deck.A.cards),
    deckB: ids(session.zones.deck.B.cards),
    discA: ids(session.zones.discard.A),
    discB: ids(session.zones.discard.B),
    remA: ids(session.zones.removed.A),
    remB: ids(session.zones.removed.B),
    playA: ids(session.zones.inPlay.A),
    playB: ids(session.zones.inPlay.B),
  });
}

function compileRules(session) {
  return {
    teamSpd(side) {
      return aggregateSpd(session, side);
    },
    spdTieBreak({ sideA, sideB }) {
      return pickSide(session, session.config.parameters.spdTieBreak.method, sideA, sideB);
    },
    isSideDefeated(side) {
      return sideIsDefeated(session, side);
    },
    simultaneousDefeat(state) {
      return resolveSimultaneous(session, state);
    },
    perTurnActionLimit(input) {
      return limitPlay(session, input);
    },
    resolveApCost(card) {
      const match = /^LAB_[AB]_(ATK|DEF|Skill)_(\d+)$/.exec(card.cardId);
      if (!match) throw new TypeError(`EXPERIMENTAL cost rule cannot price ${card.cardId}`);
      return costAt(session.config, match[1], Number(match[2]));
    },
    draw(input) {
      return performDraw(session, input);
    },
    discard(input) {
      return performDiscard(session, input);
    },
    deckSize(deck) {
      const expected = session.config.parameters.deck.size;
      return { ok: deck.cards.length === expected, size: deck.cards.length, expected, label: LAB_LABEL };
    },
    damage(card) {
      return card.actionType === 'DEF' ? resolveDef(session, card) : resolveAttack(session, card);
    },
    skillEffect(card) {
      return resolveSkill(session, card);
    },
  };
}

function aggregateSpd(session, side) {
  const values = side.members.map((member) => member.stats.spd);
  const { aggregation, rounding } = session.config.parameters.teamSpd;
  let result;
  if (aggregation === 'sum') result = values.reduce((sum, value) => sum + value, 0);
  else if (aggregation === 'max') result = Math.max(...values);
  else if (aggregation === 'min') result = Math.min(...values);
  else result = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (rounding === 'floor') return Math.floor(result);
  if (rounding === 'ceil') return Math.ceil(result);
  return result;
}

function sideIsDefeated(session, side) {
  const hps = side.members.map((member) => member.markers.hp);
  if (hps.some((hp) => !Number.isInteger(hp))) throw new TypeError('experimental HP must stay an integer');
  if (session.config.parameters.hp.defeatWhen === 'everyAvatarHpZero') return hps.every((hp) => hp <= 0);
  return hps.some((hp) => hp <= 0);
}

function resolveSimultaneous(session, state) {
  const choice = session.config.parameters.simultaneousDefeat;
  if (choice.method === 'higherTeamSpd') {
    const spdA = aggregateSpd(session, state.sideA);
    const spdB = aggregateSpd(session, state.sideB);
    if (spdA > spdB) return { winnerSideId: state.sideA.sideId, label: LAB_LABEL };
    if (spdB > spdA) return { winnerSideId: state.sideB.sideId, label: LAB_LABEL };
    return { winnerSideId: pickSide(session, choice.whenTeamSpdTied, state.sideA, state.sideB), label: LAB_LABEL };
  }
  return { winnerSideId: pickSide(session, choice.method, state.sideA, state.sideB), label: LAB_LABEL };
}

function pickSide(session, method, sideA, sideB) {
  if (method === 'sideA') return sideA.sideId;
  if (method === 'sideB') return sideB.sideId;
  if (method === 'lowerSideId') return sideA.sideId < sideB.sideId ? sideA.sideId : sideB.sideId;
  if (method === 'higherSideId') return sideA.sideId > sideB.sideId ? sideA.sideId : sideB.sideId;
  if (method === 'seeded') return session.rng.int(2) === 0 ? sideA.sideId : sideB.sideId;
  throw new TypeError(`unsupported side pick "${method}"`);
}

function limitPlay(session, input) {
  const limit = session.config.parameters.actionLimit;
  const battle = session.battle;
  const plays = battle.log.filter(
    (event) => event.type === 'play' && event.turnIndex === battle.turnIndex && event.sideId === battle.activeSideId,
  );
  if (plays.length !== input.playsThisTurn) {
    throw new Error('laboratory action count diverged from the engine log');
  }
  if (limit.maxPlays !== null && plays.length >= limit.maxPlays) {
    return { ok: false, reason: 'ACTION_LIMIT', label: LAB_LABEL };
  }
  const typeCap = limit.maxByType[input.card.actionType];
  if (typeCap !== null && plays.filter((event) => event.actionType === input.card.actionType).length >= typeCap) {
    return { ok: false, reason: 'ACTION_LIMIT', label: LAB_LABEL };
  }
  return { ok: true, label: LAB_LABEL };
}

function performDraw(session, { hand, deck }) {
  const sideKey = sideKeyOf(session, hand.ownerId);
  const draw = session.config.parameters.draw;
  if (deck.cards.length === 0 && draw.emptyDeck === 'reshuffleDiscard') {
    const pile = session.zones.discard[sideKey];
    if (pile.length > 0) {
      deck.cards = shuffle(pile.splice(0, pile.length), session.rng);
    }
  }
  if (deck.cards.length === 0) {
    if (draw.emptyDeck === 'loseOnEmptyDraw') {
      zeroHp(session, sideKey);
      return { ok: false, reason: 'DRAW_LOSS', label: LAB_LABEL };
    }
    return { ok: false, reason: 'DECK_EMPTY', label: LAB_LABEL };
  }
  if (hand.cards.length >= hand.maxSize) {
    if (draw.handFull === 'skipCard') return { ok: false, reason: 'HAND_FULL', label: LAB_LABEL };
    if (draw.handFull === 'loseOnOverflow') {
      zeroHp(session, sideKey);
      return { ok: false, reason: 'DRAW_LOSS', label: LAB_LABEL };
    }
    const [card] = deck.cards.splice(0, 1);
    session.zones.discard[sideKey].push(structuredClone(card));
    return { ok: true, cardId: card.cardId, destination: 'discardPile', label: LAB_LABEL };
  }
  const card = deck.cards[0];
  const added = addCard(hand, card);
  if (!added.ok) return { ok: false, reason: added.reason, label: LAB_LABEL };
  deck.cards.shift();
  return { ok: true, cardId: card.cardId, destination: 'hand', label: LAB_LABEL };
}

function performDiscard(session, { hand, cardId }) {
  const sideKey = sideKeyOf(session, hand.ownerId);
  const card = session.catalog.get(cardId);
  if (!card) return { ok: false, reason: 'UNKNOWN_CARD', label: LAB_LABEL };
  const destination = session.config.parameters.discard.playedCardsGoTo;
  const copy = structuredClone(card);
  if (destination === 'discardPile') session.zones.discard[sideKey].push(copy);
  else if (destination === 'removed') session.zones.removed[sideKey].push(copy);
  else session.zones.inPlay[sideKey].push(copy);
  return { ok: true, destination, label: LAB_LABEL };
}

function zeroHp(session, sideKey) {
  const side = sideKey === 'A' ? session.battle.sideA : session.battle.sideB;
  for (const member of side.members) {
    member.markers.hp = 0;
    member.markers.ko = true;
  }
}

function resolveAttack(session, card) {
  const actor = selectActor(session);
  if (!actor) return failedEffect(card, 'NO_ACTOR');
  const targets = targetsFor(session, 'damage', session.config.parameters.targeting.atk);
  if (targets.length === 0) return failedEffect(card, 'NO_TARGET');
  const applications = targets.map((target) => {
    const raw = evaluateFormula(session.config.parameters.damage.atk, { actor, target });
    return applyAmountToHp(session, target, raw);
  });
  return effectRecord(card, 'damage', actor, applications);
}

function resolveDef(session, card) {
  const kind = session.config.parameters.damage.defCard.kind;
  const actor = selectActor(session);
  if (kind === 'noEffect') return effectRecord(card, 'noEffect', actor, []);
  if (!actor) return failedEffect(card, 'NO_ACTOR');
  const targets = targetsFor(session, kind === 'heal' ? 'heal' : 'shield', session.config.parameters.targeting.def);
  if (targets.length === 0) return failedEffect(card, 'NO_TARGET');
  const formula = session.config.parameters.damage.defCard.amount;
  const stacks = session.config.parameters.damage.defCard.stacks;
  const applications = targets.map((target) => {
    const amount = evaluateFormula(formula, { actor, target });
    if (kind === 'heal') return applyHeal(session, target, amount);
    if (kind === 'shield') return applyPool(target, 'shield', amount, stacks);
    return applyPool(target, 'mitigateNext', amount, stacks);
  });
  return effectRecord(card, kind, actor, applications);
}

function resolveSkill(session, card) {
  const skill = session.config.parameters.skill;
  grantAp(session, skill.grantsAp);
  const actor = selectActor(session);
  if (skill.kind === 'noEffect') return effectRecord(card, 'noEffect', actor, [], { grantsAp: skill.grantsAp });
  if (!actor) return failedEffect(card, 'NO_ACTOR', { grantsAp: skill.grantsAp });
  const selector = session.config.parameters.targeting.skill;
  const targets = targetsFor(session, skill.kind, selector);
  if (targets.length === 0) return failedEffect(card, 'NO_TARGET', { grantsAp: skill.grantsAp });
  const applications = targets.map((target) => {
    const amount = evaluateFormula(skill.amount, { actor, target });
    if (skill.kind === 'damage') return applyAmountToHp(session, target, amount);
    if (skill.kind === 'heal') return applyHeal(session, target, amount);
    return applyBonus(target, skill.stat, amount, skill.stacks);
  });
  return effectRecord(card, skill.kind, actor, applications, { grantsAp: skill.grantsAp });
}

function grantAp(session, amount) {
  if (amount === 0) return;
  const sideId = session.battle.activeSideId;
  session.battle.ap[sideId] += amount;
  session.grants[sideKeyOf(session, sideId)] += amount;
}

function selectActor(session) {
  const battle = session.battle;
  const side = sideObject(battle, battle.activeSideId);
  const targeting = session.config.parameters.targeting;
  const living = side.members.filter((member) => member.markers.hp > 0);
  if (living.length === 0) return null;
  if (targeting.actor === 'firstLiving') return living[0];
  const score = (member) => {
    if (targeting.actor === 'highestPowLiving') return readStat(member, 'pow', targeting.actorStatRead);
    if (targeting.actor === 'highestSpdLiving') return readStat(member, 'spd', targeting.actorStatRead);
    return -member.markers.hp;
  };
  let best = living[0];
  for (const candidate of living.slice(1)) {
    const better = score(candidate) > score(best);
    const tie =
      score(candidate) === score(best) &&
      tieWins(candidate, side.members.indexOf(candidate), best, side.members.indexOf(best), targeting.tieBreak);
    if (better || tie) best = candidate;
  }
  return best;
}

function targetsFor(session, kind, selector) {
  const battle = session.battle;
  const actorSide = sideObject(battle, battle.activeSideId);
  const enemySide = sideObject(battle, opponentId(battle, battle.activeSideId));
  const ally = selector.endsWith('Ally') || selector.endsWith('Allies');
  const pool = ally ? actorSide.members : enemySide.members;
  const includeDefeated = ally && session.config.parameters.hp.revive && (kind === 'heal' || kind === 'buffStat');
  return selectMembers(pool, selector, session.config.parameters.targeting.tieBreak, includeDefeated);
}

function selectMembers(members, selector, tieBreak, includeDefeated) {
  const pool = includeDefeated ? members.slice() : members.filter((member) => member.markers.hp > 0);
  if (pool.length === 0) return [];
  if (selector.startsWith('all')) return pool;
  if (selector.startsWith('first')) return [pool[0]];
  const wantLow = selector.startsWith('lowest');
  let best = pool[0];
  for (const candidate of pool.slice(1)) {
    const better = wantLow ? candidate.markers.hp < best.markers.hp : candidate.markers.hp > best.markers.hp;
    const tie =
      candidate.markers.hp === best.markers.hp &&
      tieWins(candidate, members.indexOf(candidate), best, members.indexOf(best), tieBreak);
    if (better || tie) best = candidate;
  }
  return [best];
}

function tieWins(candidate, candidateIndex, best, bestIndex, tieBreak) {
  if (tieBreak === 'partyOrder') return candidateIndex < bestIndex;
  if (tieBreak === 'lowerAvatarId') return candidate.avatarId < best.avatarId;
  return candidate.avatarId > best.avatarId;
}

function applyAmountToHp(session, target, rawAmount) {
  const incoming = session.config.parameters.damage.incoming;
  const hpRule = session.config.parameters.hp;
  const shieldBefore = target.markers.shield;
  const mitigateBefore = target.markers.mitigateNext;
  let remaining = rawAmount;
  if (rawAmount > 0 || incoming.zeroAmountConsumes) {
    for (const step of incoming.order) {
      if (step === 'shield' && remaining > 0) {
        const used = Math.min(target.markers.shield, remaining);
        target.markers.shield -= used;
        remaining -= used;
      } else if (step === 'mitigateNext' && target.markers.mitigateNext > 0) {
        if (remaining > 0) remaining = Math.max(0, remaining - target.markers.mitigateNext);
        target.markers.mitigateNext = 0;
      }
    }
  }
  const hpBefore = target.markers.hp;
  let next = hpBefore - remaining;
  if (hpRule.floorAtZero && next < 0) next = 0;
  target.markers.hp = next;
  target.markers.ko = next <= 0;
  return {
    avatarId: target.avatarId,
    rawAmount,
    hpBefore,
    hpAfter: next,
    shieldBefore,
    shieldAfter: target.markers.shield,
    mitigateBefore,
    mitigateAfter: target.markers.mitigateNext,
  };
}

function applyHeal(session, target, amount) {
  const hpRule = session.config.parameters.hp;
  const before = target.markers.hp;
  if (before <= 0 && !hpRule.revive) {
    return { avatarId: target.avatarId, amount: 0, hpBefore: before, hpAfter: before, skipped: true };
  }
  let next = before + amount;
  if (!hpRule.healCanExceedStarting && next > target.markers.startingHp) next = target.markers.startingHp;
  if (hpRule.floorAtZero && next < 0) next = 0;
  target.markers.hp = next;
  target.markers.ko = next <= 0;
  return { avatarId: target.avatarId, amount: next - before, hpBefore: before, hpAfter: next, skipped: false };
}

function applyPool(target, field, amount, stacks) {
  const before = target.markers[field];
  target.markers[field] = stacks === 'add' ? before + amount : amount;
  return { avatarId: target.avatarId, field, amount, before, after: target.markers[field] };
}

function applyBonus(target, stat, amount, stacks) {
  const before = target.markers.bonus[stat];
  target.markers.bonus[stat] = stacks === 'add' ? before + amount : amount;
  return { avatarId: target.avatarId, stat, amount, bonusBefore: before, bonusAfter: target.markers.bonus[stat] };
}

function effectRecord(card, kind, actor, applications, extra = {}) {
  return {
    label: LAB_LABEL,
    ok: true,
    cardId: card.cardId,
    actionType: card.actionType,
    kind,
    actorId: actor ? actor.avatarId : null,
    applications,
    ...extra,
  };
}

function failedEffect(card, reason, extra = {}) {
  return {
    label: LAB_LABEL,
    ok: false,
    reason,
    cardId: card.cardId,
    actionType: card.actionType,
    applications: [],
    ...extra,
  };
}

function buildSide(spec, config) {
  return {
    sideId: spec.sideId,
    members: spec.members.map((member) => buildMember(member, config)),
  };
}

function buildMember(spec, config) {
  const member = {
    avatarId: spec.avatarId,
    stats: { pow: spec.pow, def: spec.def, spd: spec.spd, valueStatus: 'SET' },
    markers: blankMarkers(0),
  };
  const hp = evaluateFormula(config.parameters.hp.pool, { self: member });
  if (!Number.isInteger(hp) || hp < 1) {
    throw new ConfigError([
      {
        path: `sides.${spec.avatarId}`,
        message: `starting HP computed to ${hp}; the pool formula must yield a positive integer for every avatar`,
        questionId: 'Q-HP',
      },
    ]);
  }
  member.markers.hp = hp;
  member.markers.startingHp = hp;
  return member;
}

function blankMarkers(hp) {
  return {
    hp,
    startingHp: hp,
    ko: false,
    shield: 0,
    mitigateNext: 0,
    bonus: { pow: 0, def: 0, spd: 0 },
  };
}

function buildZone(session, key) {
  const cards = assemble(session, key);
  for (const card of cards) session.catalog.set(card.cardId, card);
  const deck = createDeck(cards);
  session.zones.deck[key] = deck;
  const verdict = assertDeckSize(deck, session.battle.rules);
  if (!verdict || verdict.ok !== true) {
    throw new Error(`deck size rule rejected side ${key}`);
  }
}

function assemble(session, letter) {
  const deck = session.config.parameters.deck;
  const side = session.config.sides[letter];
  const avatars = [];
  for (let index = 0; index < deck.avatarCardCount; index += 1) {
    avatars.push({
      cardId: `LAB_${letter}_AVATAR_${index}`,
      cardKind: 'avatar_card',
      avatarId: side.members[index].avatarId,
      labels: [LAB_LABEL],
    });
  }
  const actions = [];
  for (const entry of deck.composition) {
    for (let index = 0; index < entry.count; index += 1) {
      actions.push(buildActionCard(letter, entry.actionType, index));
    }
  }
  let ordered = deck.avatarCardPosition === 'front' ? [...avatars, ...actions] : [...actions, ...avatars];
  if (session.config.parameters.draw.order === 'seededShuffle') ordered = shuffle(ordered, session.rng);
  return ordered;
}

function buildActionCard(letter, actionType, index) {
  const card = {
    cardId: `LAB_${letter}_${actionType}_${index}`,
    cardKind: 'action_card',
    actionType,
    name: null,
    apCost: null,
    costStatus: 'TBD',
    effectId: 'EXPERIMENTAL',
    rarity: null,
    labels: [LAB_LABEL],
  };
  const problems = validateActionCard(card);
  if (problems.length > 0) {
    throw new Error(`laboratory card failed engine validation: ${problems.map((item) => item.message).join('; ')}`);
  }
  return card;
}

function sideKeyOf(session, sideId) {
  if (sideId === session.sideIds.A) return 'A';
  if (sideId === session.sideIds.B) return 'B';
  throw new TypeError(`unknown side ${sideId}`);
}

function sideObject(battle, sideId) {
  if (battle.sideA.sideId === sideId) return battle.sideA;
  if (battle.sideB.sideId === sideId) return battle.sideB;
  throw new TypeError(`unknown side ${sideId}`);
}

function opponentId(battle, sideId) {
  return sideId === battle.sideA.sideId ? battle.sideB.sideId : battle.sideA.sideId;
}
