import { migrateSportV3 } from '../save/migrate-v3.js';

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requireState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) fail('state is required', 'BAD_STATE');
  if (!Number.isSafeInteger(state.currency?.G)) fail('currency.G must be an integer', 'BAD_WALLET');
}

/**
 * Append-only G ledger. A repeated txnId does not move currency again.
 * The input state is not mutated. Avatar `pity` and battle `rewardLedger` are copied through.
 * @param {object} state
 * @param {{ txnId: string, amount: number, reason?: string, meta?: object }} request
 * @param {'spend' | 'earn'} type
 * @param {{ allowZero?: boolean }} [options]
 */
function apply(state, request, type, options = {}) {
  requireState(state);
  const txnId = request?.txnId;
  if (typeof txnId !== 'string' || txnId.length === 0) fail('txnId is required', 'BAD_TXN');
  const minimum = options.allowZero ? 0 : 1;
  if (!Number.isSafeInteger(request?.amount) || request.amount < minimum) {
    fail(options.allowZero ? 'amount must be an integer >= 0' : 'amount must be an integer >= 1', 'BAD_AMOUNT');
  }
  const reason = request.reason ?? (type === 'spend' ? 'spend' : 'earn');
  if (typeof reason !== 'string' || reason.length === 0) fail('reason is required', 'BAD_TXN');
  const ledger = Array.isArray(state.sport?.ledger) ? state.sport.ledger : [];
  const existing = ledger.find((row) => row.txnId === txnId);
  if (existing) return { state, applied: false, reason: 'ALREADY_APPLIED', entry: existing };

  const balanceAfter = type === 'spend' ? state.currency.G - request.amount : state.currency.G + request.amount;
  if (!Number.isSafeInteger(balanceAfter) || balanceAfter < 0) fail('Not enough G', 'INSUFFICIENT_G');

  const next = migrateSportV3(state);
  next.currency = { ...next.currency, G: balanceAfter };
  const entry = {
    seq: next.sport.ledger.length + 1,
    txnId,
    type,
    amount: request.amount,
    balanceAfter,
    reason,
    meta: request.meta === undefined ? null : structuredClone(request.meta),
  };
  next.sport.ledger = next.sport.ledger.concat([entry]);
  return { state: next, applied: true, entry };
}

/**
 * @param {object} state
 * @param {{ txnId: string, amount: number, reason?: string, meta?: object }} request
 */
export function spend(state, request) {
  return apply(state, request, 'spend');
}

/**
 * @param {object} state
 * @param {{ txnId: string, amount: number, reason?: string, meta?: object }} request
 */
export function earn(state, request) {
  return apply(state, request, 'earn');
}

/**
 * Idempotent sport reward. The same txnId pays G at most once.
 * Amount 0 is recorded so an empty purse still cannot be claimed twice.
 * @param {object} state
 * @param {{ txnId: string, amount: number, reason?: string, meta?: object }} request
 */
export function claimReward(state, request) {
  return apply(state, { ...request, reason: request?.reason ?? 'sport-reward' }, 'earn', { allowZero: true });
}
