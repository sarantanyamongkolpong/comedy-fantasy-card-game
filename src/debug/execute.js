import { addCard, createBattle, endTurn, evaluateOutcome, playCard, resolveEffect } from '../index.js';
import { dataClone } from './canonical.js';
import { snapshotBattle } from './snapshot.js';
import { stepInput } from './scenario.js';
import { toResult } from './result.js';

/**
 * Run a scenario through the public battle API.
 * Each step records the state before and after the call.
 * @param {object} scenario
 * @param {Record<string, Function>} rules
 */
export function runSequence(scenario, rules) {
  const hands = scenario.hands ?? {};
  let cards;
  try {
    cards = indexCards(hands);
  } catch (error) {
    return emptyRun(toResult(error));
  }

  let state;
  try {
    state = createBattle({
      battleId: scenario.battleId,
      sideA: scenario.sideA,
      sideB: scenario.sideB,
      rules,
    });
  } catch (error) {
    return emptyRun(toResult(error));
  }

  try {
    dealHands(state, hands);
  } catch (error) {
    return emptyRun(toResult(error));
  }

  const initialState = snapshotBattle(state);
  const events = [];
  for (const step of scenario.steps) {
    const before = snapshotBattle(state);
    const result = applyStep(state, step, cards);
    const after = snapshotBattle(state);
    events.push(
      dataClone({
        index: events.length,
        op: step.op,
        input: stepInput(step),
        result,
        before,
        after,
      }),
    );
  }

  return {
    setupResult: { ok: true, status: 'READY' },
    initialState,
    events,
    finalState: snapshotBattle(state),
  };
}

/**
 * @param {object} setupResult
 */
function emptyRun(setupResult) {
  return {
    setupResult,
    initialState: null,
    events: [],
    finalState: null,
  };
}

/**
 * @param {Record<string, object[]>} hands
 */
function indexCards(hands) {
  const cards = new Map();
  for (const [sideId, list] of Object.entries(hands)) {
    if (!Array.isArray(list)) throw new TypeError(`hand for ${sideId} must be an array`);
    for (const card of list) {
      if (!card || typeof card.cardId !== 'string') throw new TypeError(`hand for ${sideId} has a card without cardId`);
      if (cards.has(card.cardId)) throw new TypeError(`duplicate cardId ${card.cardId}`);
      cards.set(card.cardId, card);
    }
  }
  return cards;
}

/**
 * @param {object} state
 * @param {Record<string, object[]>} hands
 */
function dealHands(state, hands) {
  for (const [sideId, list] of Object.entries(hands)) {
    const hand = state.hands[sideId];
    if (!hand) throw new TypeError(`hand for unknown side ${sideId}`);
    for (const card of list) {
      const added = addCard(hand, card);
      if (!added.ok) {
        const error = new TypeError(`cannot deal ${card.cardId} to ${sideId}`);
        error.reason = added.reason;
        throw error;
      }
    }
  }
}

/**
 * @param {object} state
 * @param {object} step
 * @param {Map<string, object>} cards
 */
function applyStep(state, step, cards) {
  switch (step.op) {
    case 'play':
      return applyPlay(state, step);
    case 'resolve':
      return applyResolve(state, step, cards);
    case 'act':
      return applyAct(state, step, cards);
    case 'endTurn':
      return applyEndTurn(state);
    case 'evaluate':
      return applyEvaluate(state);
    case 'mark':
      return applyMark(state, step);
    default:
      return { ok: false, status: 'REJECTED', reason: 'UNKNOWN_OP', op: step.op ?? null };
  }
}

/**
 * @param {object} state
 * @param {{ sideId: string, cardId: string }} step
 */
function applyPlay(state, step) {
  const apBefore = state.ap?.[step.sideId] ?? null;
  let played;
  try {
    played = playCard(state, step.sideId, step.cardId);
  } catch (error) {
    return toResult(error);
  }
  if (!played.ok) {
    return {
      ok: false,
      status: 'REJECTED',
      reason: played.reason,
      cost: played.cost ?? null,
      ap: state.ap?.[step.sideId] ?? null,
    };
  }
  return playedResult(played, apBefore);
}

/**
 * @param {object} state
 * @param {{ cardId: string }} step
 * @param {Map<string, object>} cards
 */
function applyResolve(state, step, cards) {
  const card = cards.get(step.cardId);
  if (!card) return { ok: false, status: 'REJECTED', reason: 'UNKNOWN_CARD', cardId: step.cardId };
  try {
    const effect = resolveEffect(state, card);
    return {
      ok: true,
      status: 'RESOLVED',
      cardId: step.cardId,
      actionType: card.actionType,
      effect: effect === undefined ? null : dataClone(effect),
    };
  } catch (error) {
    return { ...toResult(error), cardId: step.cardId, actionType: card.actionType ?? null };
  }
}

/**
 * Play, then resolve when the play is accepted.
 * A design block on resolve leaves the play in place, matching the engine.
 * @param {object} state
 * @param {{ sideId: string, cardId: string }} step
 * @param {Map<string, object>} cards
 */
function applyAct(state, step, cards) {
  const played = applyPlay(state, step);
  if (!played.ok) return played;
  const resolved = applyResolve(state, step, cards);
  if (resolved.ok) {
    return {
      ok: true,
      status: 'RESOLVED',
      cardId: step.cardId,
      actionType: resolved.actionType,
      effect: resolved.effect,
      play: played,
      apBefore: played.apBefore,
      apAfter: played.apAfter,
    };
  }
  return {
    ...resolved,
    play: played,
    apBefore: played.apBefore,
    apAfter: played.apAfter,
  };
}

/**
 * @param {object} state
 */
function applyEndTurn(state) {
  try {
    const value = endTurn(state);
    if (!value.ok) {
      return {
        ok: false,
        status: 'REJECTED',
        reason: value.reason,
        outcome: value.outcome ? dataClone(value.outcome) : null,
      };
    }
    return {
      ok: true,
      status: 'TURN_ENDED',
      activeSideId: value.activeSideId,
      ap: value.ap,
      outcome: dataClone(value.outcome),
    };
  } catch (error) {
    return toResult(error);
  }
}

/**
 * @param {object} state
 */
function applyEvaluate(state) {
  try {
    return { ok: true, status: 'EVALUATED', outcome: dataClone(evaluateOutcome(state)) };
  } catch (error) {
    return toResult(error);
  }
}

/**
 * Write a boolean onto a marker key the member already has.
 * This does not define what the marker means. The injected rule does.
 * @param {object} state
 * @param {{ sideId: string, avatarId: string, marker: string, value: boolean }} step
 */
function applyMark(state, step) {
  let side = null;
  if (state.sideA.sideId === step.sideId) side = state.sideA;
  else if (state.sideB.sideId === step.sideId) side = state.sideB;
  if (!side) return { ok: false, status: 'REJECTED', reason: 'UNKNOWN_SIDE' };
  const member = side.members.find((candidate) => candidate.avatarId === step.avatarId);
  if (!member) return { ok: false, status: 'REJECTED', reason: 'UNKNOWN_AVATAR' };
  if (!member.markers || !Object.prototype.hasOwnProperty.call(member.markers, step.marker)) {
    return { ok: false, status: 'REJECTED', reason: 'UNKNOWN_MARKER' };
  }
  if (typeof step.value !== 'boolean') return { ok: false, status: 'REJECTED', reason: 'MARKER_VALUE' };
  member.markers[step.marker] = step.value;
  return {
    ok: true,
    status: 'MARKED',
    sideId: step.sideId,
    avatarId: step.avatarId,
    marker: step.marker,
    value: step.value,
  };
}

/**
 * @param {object} played
 * @param {number | null} apBefore
 */
function playedResult(played, apBefore) {
  return {
    ok: true,
    status: 'PLAYED',
    sideId: played.sideId,
    cardId: played.cardId,
    actionType: played.actionType,
    cost: played.cost,
    effect: played.effect,
    turnIndex: played.turnIndex,
    roundIndex: played.roundIndex,
    apBefore,
    apAfter: played.ap,
  };
}
