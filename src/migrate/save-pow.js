import { migratePowToAtk, reversePowMigration } from './pow-to-atk.js';

function isBag(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function looksLikeStats(node) {
  return hasOwn(node, 'pow') && (hasOwn(node, 'def') || hasOwn(node, 'spd') || hasOwn(node, 'valueStatus'));
}

function apply(node, fn) {
  const migrated = fn(node);
  for (const key of Object.keys(node)) delete node[key];
  Object.assign(node, migrated);
}

function walk(node, fn) {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, fn);
    return;
  }
  if (!isBag(node)) return;
  if (isBag(node.stats) && hasOwn(node.stats, 'pow')) apply(node, fn);
  else if (looksLikeStats(node)) apply(node, fn);
  for (const value of Object.values(node)) walk(value, fn);
}

/**
 * Copy every legacy `pow` in a save onto `atk` and keep `legacy.pow`.
 * The input is not mutated. A second call is a no-op.
 * @param {object} profile
 */
export function migrateSavePow(profile) {
  const next = structuredClone(profile);
  walk(next, migratePowToAtk);
  return next;
}

/**
 * Remove the 1:1 `atk` copy. `pow` and `legacy.pow` stay, so the value can be migrated again.
 * @param {object} profile
 */
export function reverseSavePow(profile) {
  const next = structuredClone(profile);
  walk(next, reversePowMigration);
  return next;
}
