import { diffValues } from './diff.js';
import { runSequence } from './execute.js';
import { checkIntegrity } from './integrity.js';
import { describeRuleset } from './ruleset.js';
import { LOG_FORMAT, LOG_VERSION, SCENARIO_FORMAT, SCENARIO_VERSION } from './constants.js';

const EVENT_FIELDS = new Set(['index', 'op', 'input', 'result', 'before', 'after']);

/**
 * Re-execute a log with the supplied ruleset and compare the result.
 * A mismatched hash or a body that no longer matches its integrity seal is a finding.
 * The ruleset functions themselves are not stored in the log.
 * @param {object} log
 * @param {{ id: string, label?: string | null, parameters?: object, rules?: Record<string, Function> }} ruleset
 */
export function replayLog(log, ruleset) {
  assertLogShape(log);
  if (!ruleset || typeof ruleset !== 'object' || Array.isArray(ruleset)) {
    throw new TypeError('ruleset is required');
  }

  const findings = [];
  const integrityOk = checkIntegrity(log);
  if (!integrityOk) {
    findings.push({
      code: 'INTEGRITY_MISMATCH',
      message: 'integrity hash does not match the log body',
    });
  }

  const described = describeRuleset(ruleset);
  const rulesetMatch = described.id === log.ruleset.id && described.hash === log.ruleset.hash;
  if (described.id !== log.ruleset.id) {
    findings.push({
      code: 'RULESET_ID_MISMATCH',
      message: `ruleset id ${described.id} does not match log ruleset ${log.ruleset.id}`,
      diff: diffValues(log.ruleset.id, described.id),
    });
  }
  if (described.hash !== log.ruleset.hash) {
    findings.push({
      code: 'RULESET_HASH_MISMATCH',
      message: 'ruleset hash does not match the log',
      diff: diffValues(rulesetIdentity(log.ruleset), rulesetIdentity(described)),
    });
  }

  const fresh = runSequence(scenarioFromLog(log), ruleset.rules ?? {});
  pushIfDiff(findings, 'SETUP_MISMATCH', undefined, 'setup result does not match', log.setupResult, fresh.setupResult);
  pushIfDiff(
    findings,
    'INITIAL_STATE_MISMATCH',
    undefined,
    'initial state does not match',
    log.initialState,
    fresh.initialState,
  );

  if (log.events.length !== fresh.events.length) {
    findings.push({
      code: 'EVENT_COUNT_MISMATCH',
      message: `log has ${log.events.length} events and replay produced ${fresh.events.length}`,
    });
  }

  const count = Math.min(log.events.length, fresh.events.length);
  for (let index = 0; index < count; index += 1) {
    const stored = log.events[index];
    const replayed = fresh.events[index];
    const extra = Object.keys(stored).filter((key) => !EVENT_FIELDS.has(key));
    if (extra.length > 0) {
      findings.push({
        code: 'SEQUENCE_MISMATCH',
        eventIndex: index,
        message: `unexpected event fields: ${extra.join(', ')}`,
      });
    }
    pushIfDiff(
      findings,
      'SEQUENCE_MISMATCH',
      index,
      'event index, op, or input does not match',
      { index: stored.index, op: stored.op, input: stored.input },
      { index: replayed.index, op: replayed.op, input: replayed.input },
    );
    pushIfDiff(findings, 'RESULT_MISMATCH', index, 'event result does not match', stored.result ?? null, replayed.result);
    pushIfDiff(findings, 'STATE_MISMATCH', index, 'before-state does not match', stored.before ?? null, replayed.before, 'before');
    pushIfDiff(findings, 'STATE_MISMATCH', index, 'after-state does not match', stored.after ?? null, replayed.after, 'after');
  }

  pushIfDiff(findings, 'FINAL_STATE_MISMATCH', undefined, 'final state does not match', log.finalState ?? null, fresh.finalState);

  return {
    consistent: findings.length === 0,
    integrityOk,
    rulesetMatch,
    findings,
  };
}

/**
 * @param {object} log
 */
export function assertLogShape(log) {
  if (!log || typeof log !== 'object' || Array.isArray(log)) throw new TypeError('log must be an object');
  if (log.format !== LOG_FORMAT) throw new TypeError(`unsupported log format ${String(log.format)}`);
  if (log.version !== LOG_VERSION) throw new TypeError(`unsupported log version ${String(log.version)}`);
  if (!log.ruleset || typeof log.ruleset.id !== 'string' || typeof log.ruleset.hash !== 'string') {
    throw new TypeError('log.ruleset id and hash are required');
  }
  if (!Array.isArray(log.ruleset.entries)) throw new TypeError('log.ruleset.entries must be an array');
  if (!log.setup?.sideA || !log.setup?.sideB) throw new TypeError('log.setup sides are required');
  if (!Array.isArray(log.events)) throw new TypeError('log.events must be an array');
  log.events.forEach((event, index) => {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      throw new TypeError(`log.events[${index}] must be an object`);
    }
    if (typeof event.op !== 'string') throw new TypeError(`log.events[${index}].op is required`);
    if (!event.input || typeof event.input !== 'object' || Array.isArray(event.input)) {
      throw new TypeError(`log.events[${index}].input must be an object`);
    }
  });
  if (!log.integrity || typeof log.integrity.hash !== 'string') {
    throw new TypeError('log.integrity.hash is required');
  }
}

/**
 * @param {object} log
 */
export function scenarioFromLog(log) {
  return {
    format: SCENARIO_FORMAT,
    version: SCENARIO_VERSION,
    label: log.label ?? null,
    note: log.note ?? null,
    battleId: log.battleId,
    rulesetId: log.ruleset.id,
    sideA: log.setup.sideA,
    sideB: log.setup.sideB,
    hands: log.setup.hands ?? {},
    steps: log.events.map((event) => {
      const input = { ...event.input };
      delete input.op;
      return { op: event.op, ...input };
    }),
  };
}

/**
 * @param {object} ruleset
 */
function rulesetIdentity(ruleset) {
  return {
    id: ruleset.id,
    hash: ruleset.hash,
    parameters: ruleset.parameters ?? {},
    entries: ruleset.entries,
  };
}

/**
 * @param {object[]} findings
 * @param {string} code
 * @param {number | undefined} eventIndex
 * @param {string} message
 * @param {unknown} left
 * @param {unknown} right
 * @param {string} [phase]
 */
function pushIfDiff(findings, code, eventIndex, message, left, right, phase) {
  const diff = diffValues(left ?? null, right ?? null);
  if (diff.equal) return;
  const finding = { code, message, diff };
  if (eventIndex !== undefined) finding.eventIndex = eventIndex;
  if (phase) finding.phase = phase;
  findings.push(finding);
}
