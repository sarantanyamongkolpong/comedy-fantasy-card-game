import { createHand, removeCard } from '../cards/hand.js';
import { assessActionPlay } from '../cards/play.js';
import { resolveRules } from '../design/blocked-rules.js';
import { BASE_AP, PARTY_SIZE } from '../schema/constants.js';
import { validateStats } from '../schema/validate.js';

export { BASE_AP, PARTY_SIZE };

/**
 * @param {{ sideId: string, members: object[] }} side
 */
function assertSide(side) {
  if (!side || typeof side.sideId !== 'string' || side.sideId.length === 0) {
    throw new TypeError('side.sideId is required');
  }
  if (!Array.isArray(side.members) || side.members.length !== PARTY_SIZE) {
    const error = new Error(`Each side must have exactly ${PARTY_SIZE} avatars`);
    error.reason = 'PARTY_SIZE';
    error.sideId = side.sideId;
    throw error;
  }
  for (const member of side.members) {
    if (!member || typeof member.avatarId !== 'string' || member.avatarId.length === 0) {
      throw new TypeError(`each avatar on ${side.sideId} needs an avatarId`);
    }
    const statErrors = validateStats(member.stats, member.avatarId);
    if (statErrors.length > 0) {
      const error = new Error(`Invalid stats for ${member.avatarId}`);
      error.reason = 'INVALID_STATS';
      error.errors = statErrors;
      throw error;
    }
  }
}

/**
 * @param {{ sideId: string, members: object[] }} side
 */
function cloneSide(side) {
  return {
    sideId: side.sideId,
    members: side.members.map((member) => {
      const copy = structuredClone(member);
      copy.markers = { ...(copy.markers ?? {}) };
      return copy;
    }),
  };
}

function ongoingOutcome() {
  return { status: 'ongoing', winnerSideId: null, loserSideId: null, verdict: null };
}

function decidedOutcome(winnerSideId, loserSideId) {
  return {
    status: 'decided',
    winnerSideId,
    loserSideId,
    verdict: {
      [winnerSideId]: 'victory',
      [loserSideId]: 'defeat',
    },
  };
}

/**
 * @param {object} state
 */
export function evaluateOutcome(state) {
  const aDefeated = state.rules.isSideDefeated(state.sideA, state);
  const bDefeated = state.rules.isSideDefeated(state.sideB, state);
  if (typeof aDefeated !== 'boolean' || typeof bDefeated !== 'boolean') {
    throw new TypeError('isSideDefeated must return a boolean');
  }
  if (aDefeated && bDefeated) {
    const resolution = state.rules.simultaneousDefeat(state);
    const winner = resolution?.winnerSideId;
    if (winner !== state.sideA.sideId && winner !== state.sideB.sideId) {
      const error = new TypeError('simultaneousDefeat must return a side id or throw');
      error.reason = 'SIMULTANEOUS_UNRESOLVED';
      throw error;
    }
    const loser = winner === state.sideA.sideId ? state.sideB.sideId : state.sideA.sideId;
    state.outcome = decidedOutcome(winner, loser);
    return state.outcome;
  }
  if (aDefeated) {
    state.outcome = decidedOutcome(state.sideB.sideId, state.sideA.sideId);
  } else if (bDefeated) {
    state.outcome = decidedOutcome(state.sideA.sideId, state.sideB.sideId);
  } else {
    state.outcome = ongoingOutcome();
  }
  return state.outcome;
}

/**
 * Create a 4v4 battle.
 * Team SPD comes only from `rules.teamSpd`. Equal results call `rules.spdTieBreak`.
 * The starting side's AP is set to 5. The other side's AP stays null until their turn.
 * @param {{ battleId?: string, sideA: object, sideB: object, rules?: Record<string, Function> }} input
 */
export function createBattle(input) {
  if (!input?.sideA || !input?.sideB) throw new TypeError('sideA and sideB are required');
  assertSide(input.sideA);
  assertSide(input.sideB);
  if (input.sideA.sideId === input.sideB.sideId) {
    throw new TypeError('side ids must be different');
  }
  const rules = resolveRules(input.rules ?? {});
  const sideA = cloneSide(input.sideA);
  const sideB = cloneSide(input.sideB);
  const spdA = rules.teamSpd(sideA);
  const spdB = rules.teamSpd(sideB);
  if (!Number.isFinite(spdA) || !Number.isFinite(spdB)) {
    throw new TypeError('teamSpd must return a finite number');
  }
  let startingSideId;
  if (spdA > spdB) startingSideId = sideA.sideId;
  else if (spdB > spdA) startingSideId = sideB.sideId;
  else {
    startingSideId = rules.spdTieBreak({ sideA, sideB, spdA, spdB });
    if (startingSideId !== sideA.sideId && startingSideId !== sideB.sideId) {
      throw new TypeError('spdTieBreak must return one of the side ids');
    }
  }
  const battleId = input.battleId ?? 'battle';
  const state = {
    battleId,
    sideA,
    sideB,
    startingSideId,
    activeSideId: startingSideId,
    turnIndex: 1,
    roundIndex: 1,
    baseAp: BASE_AP,
    ap: {
      [sideA.sideId]: null,
      [sideB.sideId]: null,
    },
    hands: {
      [sideA.sideId]: createHand(sideA.sideId),
      [sideB.sideId]: createHand(sideB.sideId),
    },
    playedRecords: [],
    log: [],
    outcome: ongoingOutcome(),
    rules,
  };
  state.ap[startingSideId] = BASE_AP;
  state.log.push({
    type: 'battle_start',
    battleId,
    startingSideId,
    teamSpd: { [sideA.sideId]: spdA, [sideB.sideId]: spdB },
  });
  state.log.push({
    type: 'turn_start',
    turnIndex: 1,
    roundIndex: 1,
    sideId: startingSideId,
    ap: BASE_AP,
  });
  evaluateOutcome(state);
  return state;
}

/**
 * Undo an `endTurn` that threw after it started writing.
 * Assignments that never landed are left alone so a frozen field does not hide the original error.
 * @param {object} state
 * @param {string} nextSideId
 * @param {{ turnIndex: number, roundIndex: number, activeSideId: string, nextAp: number | null, logLength: number }} checkpoint
 */
function rollbackEndTurn(state, nextSideId, checkpoint) {
  if (state.turnIndex !== checkpoint.turnIndex) state.turnIndex = checkpoint.turnIndex;
  if (state.roundIndex !== checkpoint.roundIndex) state.roundIndex = checkpoint.roundIndex;
  if (state.activeSideId !== checkpoint.activeSideId) state.activeSideId = checkpoint.activeSideId;
  if (state.ap[nextSideId] !== checkpoint.nextAp) state.ap[nextSideId] = checkpoint.nextAp;
  if (state.log.length !== checkpoint.logLength) state.log.length = checkpoint.logLength;
}

/**
 * @param {object} state
 */
export function endTurn(state) {
  if (state.outcome.status === 'decided') {
    return { ok: false, reason: 'BATTLE_DECIDED', outcome: state.outcome };
  }
  const previous = state.activeSideId;
  const next = previous === state.sideA.sideId ? state.sideB.sideId : state.sideA.sideId;
  const checkpoint = {
    turnIndex: state.turnIndex,
    roundIndex: state.roundIndex,
    activeSideId: state.activeSideId,
    nextAp: state.ap[next],
    logLength: state.log.length,
  };
  try {
    state.turnIndex += 1;
    if (next === state.startingSideId) state.roundIndex += 1;
    state.activeSideId = next;
    state.ap[next] = BASE_AP;
    state.log.push({
      type: 'turn_start',
      turnIndex: state.turnIndex,
      roundIndex: state.roundIndex,
      sideId: next,
      ap: BASE_AP,
      previousSideId: previous,
    });
    const outcome = evaluateOutcome(state);
    return { ok: true, activeSideId: next, ap: state.ap[next], outcome };
  } catch (error) {
    rollbackEndTurn(state, next, checkpoint);
    throw error;
  }
}

function playsThisTurn(state, sideId) {
  return state.log.filter(
    (event) => event.type === 'play' && event.turnIndex === state.turnIndex && event.sideId === sideId,
  ).length;
}

/**
 * Undo a play whose log write failed after the hand or AP changed.
 * @param {object} state
 * @param {string} sideId
 * @param {{ cards: object[] }} hand
 * @param {object | null} card
 * @param {number} cardIndex
 * @param {number | null} apBefore
 * @param {number} logLength
 * @param {number} playedLength
 */
function rollbackPlay(state, sideId, hand, card, cardIndex, apBefore, logLength, playedLength) {
  if (state.log.length !== logLength) state.log.length = logLength;
  if (state.playedRecords.length !== playedLength) state.playedRecords.length = playedLength;
  if (state.ap[sideId] !== apBefore) state.ap[sideId] = apBefore;
  if (card && cardIndex >= 0 && !hand.cards.includes(card)) {
    hand.cards.splice(cardIndex, 0, card);
  }
}

/**
 * Spend AP and take the card out of the hand when the play is legal.
 * Does not apply damage, mitigation, or skill effects.
 * A hand that already holds the same card id twice is rejected. The hand key is the card id,
 * so a second copy would let that id be played again.
 * @param {object} state
 * @param {string} sideId
 * @param {string} cardId
 */
export function playCard(state, sideId, cardId) {
  if (state.outcome.status === 'decided') {
    return { ok: false, reason: 'BATTLE_DECIDED' };
  }
  if (sideId !== state.activeSideId) {
    return { ok: false, reason: 'NOT_ACTIVE_SIDE' };
  }
  const hand = state.hands[sideId];
  if (!hand) return { ok: false, reason: 'UNKNOWN_SIDE' };
  const matches = [];
  for (let index = 0; index < hand.cards.length; index += 1) {
    if (hand.cards[index]?.cardId === cardId) matches.push(index);
  }
  if (matches.length > 1) return { ok: false, reason: 'DUPLICATE_CARD_ID' };
  const cardIndex = matches.length === 1 ? matches[0] : -1;
  const card = cardIndex >= 0 ? hand.cards[cardIndex] : null;
  const assessment = assessActionPlay({
    card,
    inHand: Boolean(card),
    ap: state.ap[sideId],
    rules: state.rules,
    playsThisTurn: playsThisTurn(state, sideId),
  });
  if (!assessment.ok) return assessment;
  const apBefore = state.ap[sideId];
  const logLength = state.log.length;
  const playedLength = state.playedRecords.length;
  try {
    const removed = removeCard(hand, cardId);
    if (!removed.ok) return removed;
    state.ap[sideId] = apBefore - assessment.cost;
    const event = {
      type: 'play',
      turnIndex: state.turnIndex,
      roundIndex: state.roundIndex,
      sideId,
      cardId,
      actionType: removed.card.actionType,
      cost: assessment.cost,
      effect: 'not_applied',
    };
    state.log.push(event);
    state.playedRecords.push({ ...event });
    return { ok: true, ...event, ap: state.ap[sideId] };
  } catch (error) {
    rollbackPlay(state, sideId, hand, card, cardIndex, apBefore, logLength, playedLength);
    throw error;
  }
}

/**
 * Apply an action's effect. ATK and DEF call the damage rule. Skill calls the skill rule.
 * Both rules throw until the Owner defines them.
 * @param {object} state
 * @param {object} card
 */
export function resolveEffect(state, card) {
  if (!card || card.cardKind !== 'action_card') {
    throw new TypeError('resolveEffect expects an action card');
  }
  if (card.actionType === 'Skill') return state.rules.skillEffect(card, state);
  if (card.actionType === 'ATK' || card.actionType === 'DEF') return state.rules.damage(card, state);
  throw new TypeError(`unknown action type ${card.actionType}`);
}

/**
 * @param {object} state
 */
export function publicView(state) {
  return {
    battleId: state.battleId,
    startingSideId: state.startingSideId,
    activeSideId: state.activeSideId,
    turnIndex: state.turnIndex,
    roundIndex: state.roundIndex,
    ap: { ...state.ap },
    outcome: structuredClone(state.outcome),
    log: structuredClone(state.log),
    hands: Object.fromEntries(
      Object.entries(state.hands).map(([sideId, hand]) => [sideId, hand.cards.map((card) => card.cardId)]),
    ),
    playedRecords: structuredClone(state.playedRecords),
  };
}
