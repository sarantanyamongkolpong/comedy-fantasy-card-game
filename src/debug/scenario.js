import { OPS, SCENARIO_FORMAT, SCENARIO_VERSION } from './constants.js';

const OPS_SET = new Set(OPS);

/**
 * @param {object} scenario
 */
export function assertScenario(scenario) {
  if (!scenario || typeof scenario !== 'object' || Array.isArray(scenario)) {
    throw new TypeError('scenario must be an object');
  }
  if (scenario.format !== SCENARIO_FORMAT) {
    throw new TypeError(`scenario.format must be ${SCENARIO_FORMAT}`);
  }
  if (scenario.version !== SCENARIO_VERSION) {
    throw new TypeError(`scenario.version must be ${SCENARIO_VERSION}`);
  }
  if (typeof scenario.battleId !== 'string' || scenario.battleId.length === 0) {
    throw new TypeError('scenario.battleId is required');
  }
  if (scenario.note !== undefined && scenario.note !== null && typeof scenario.note !== 'string') {
    throw new TypeError('scenario.note must be a string');
  }
  if (scenario.label !== undefined && scenario.label !== null && typeof scenario.label !== 'string') {
    throw new TypeError('scenario.label must be a string');
  }
  assertSide(scenario.sideA, 'scenario.sideA');
  assertSide(scenario.sideB, 'scenario.sideB');
  if (!Array.isArray(scenario.steps)) throw new TypeError('scenario.steps must be an array');
  scenario.steps.forEach((step, index) => assertStep(step, `scenario.steps[${index}]`));
  const hands = scenario.hands ?? {};
  if (!hands || typeof hands !== 'object' || Array.isArray(hands)) {
    throw new TypeError('scenario.hands must be an object');
  }
  for (const [sideId, cards] of Object.entries(hands)) {
    if (!Array.isArray(cards)) throw new TypeError(`scenario.hands.${sideId} must be an array`);
    cards.forEach((card, index) => {
      if (!card || typeof card.cardId !== 'string' || card.cardId.length === 0) {
        throw new TypeError(`scenario.hands.${sideId}[${index}].cardId is required`);
      }
    });
  }
}

/**
 * @param {object} side
 * @param {string} path
 */
function assertSide(side, path) {
  if (!side || typeof side.sideId !== 'string' || side.sideId.length === 0) {
    throw new TypeError(`${path}.sideId is required`);
  }
  if (!Array.isArray(side.members)) throw new TypeError(`${path}.members must be an array`);
}

/**
 * @param {object} step
 * @param {string} path
 */
function assertStep(step, path) {
  if (!step || typeof step !== 'object' || Array.isArray(step)) throw new TypeError(`${path} must be an object`);
  if (!OPS_SET.has(step.op)) throw new TypeError(`${path}.op is not a recorder operation`);
  if (step.op === 'play' || step.op === 'act') {
    requireString(step.sideId, `${path}.sideId`);
    requireString(step.cardId, `${path}.cardId`);
  } else if (step.op === 'resolve') {
    requireString(step.cardId, `${path}.cardId`);
  } else if (step.op === 'mark') {
    requireString(step.sideId, `${path}.sideId`);
    requireString(step.avatarId, `${path}.avatarId`);
    requireString(step.marker, `${path}.marker`);
    if (typeof step.value !== 'boolean') throw new TypeError(`${path}.value must be a boolean`);
  }
}

/**
 * @param {unknown} value
 * @param {string} path
 */
function requireString(value, path) {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${path} is required`);
}

/**
 * Fields the executor reads. Extra scenario keys are ignored.
 * @param {object} step
 */
export function stepInput(step) {
  switch (step.op) {
    case 'play':
    case 'act':
      return { sideId: step.sideId, cardId: step.cardId };
    case 'resolve':
      return { cardId: step.cardId };
    case 'mark':
      return {
        sideId: step.sideId,
        avatarId: step.avatarId,
        marker: step.marker,
        value: step.value,
      };
    case 'endTurn':
    case 'evaluate':
      return {};
    default:
      return {};
  }
}
