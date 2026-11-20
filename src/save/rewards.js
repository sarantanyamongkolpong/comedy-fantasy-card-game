import { insertItem } from './inventory.js';

/**
 * Apply a battle result once. The match id is the idempotency key.
 * Grants only what `result.rewards` already contains. No prize table is invented.
 * The input profile is not mutated. A second call returns that same profile.
 * @param {object} profile
 * @param {{ matchId: string, rewards?: { G?: number, items?: { kind: string, catalogId: string, quantity?: number }[] } }} result
 */
export function applyBattleReward(profile, result) {
  if (!result || typeof result.matchId !== 'string' || result.matchId.length === 0) {
    throw new TypeError('battle result matchId is required');
  }
  if (profile.rewardLedger && Object.prototype.hasOwnProperty.call(profile.rewardLedger, result.matchId)) {
    return { profile, applied: false, reason: 'ALREADY_APPLIED', matchId: result.matchId };
  }
  const rewards = result.rewards ?? {};
  if (rewards.G != null && !Number.isInteger(rewards.G)) {
    throw new TypeError('rewards.G must be an integer when it is present');
  }
  const next = structuredClone(profile);
  if (!next.rewardLedger || typeof next.rewardLedger !== 'object') next.rewardLedger = {};
  const grants = { G: 0, items: [] };
  if (Number.isInteger(rewards.G)) {
    next.currency.G += rewards.G;
    grants.G = rewards.G;
  }
  for (const item of rewards.items ?? []) {
    insertItem(next, item);
    grants.items.push({ kind: item.kind, catalogId: item.catalogId, quantity: item.quantity ?? 1 });
  }
  next.rewardLedger[result.matchId] = { grants };
  return { profile: next, applied: true, matchId: result.matchId, grants };
}
