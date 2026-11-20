/**
 * Tone classes for numbers combat-fx.js already read from state.log.
 * damage, shield, regen_applied, and regen_tick are the log rows.
 */

import { combatFx } from '../combat-fx.js';

const TONE_CLASS = Object.freeze({
  damage: 'is-damage',
  heal: 'is-heal',
  shield: 'is-shield',
  regen: 'is-regen',
});

export function classifyFloater(className) {
  const text = String(className ?? '');
  if (text.includes('is-damage')) return 'damage';
  if (text.includes('is-heal')) return 'heal';
  if (text.includes('is-shield')) return 'shield';
  if (text.includes('is-regen')) return 'regen';
  return 'status';
}

export function presentLogFx(log, cursor) {
  const fx = combatFx(log, cursor);
  return {
    cursor: fx.cursor,
    draw: fx.draw,
    discard: fx.discard,
    floaters: fx.floaters.map((item) => ({
      ...item,
      tone: TONE_CLASS[item.kind] ? item.kind : 'status',
      className: `floater ${TONE_CLASS[item.kind] ?? ''}`.trim(),
    })),
  };
}

let seenLog = null;
let paintedCursor = 0;
let targetCursor = 0;
let scheduled = false;

/**
 * Numbers from state.log.
 * renderBattle advances its cursor, then settle() paints again in the same turn,
 * so the first DOM (the one that held the numbers) is thrown away before paint.
 * This keeps the new rows until the frame after the last paint of this turn.
 */
export function holdLogFx(log) {
  const rows = Array.isArray(log) ? log : [];
  if (log !== seenLog) {
    seenLog = log;
    paintedCursor = rows.length;
    targetCursor = rows.length;
    scheduled = false;
    return presentLogFx(rows, rows.length);
  }
  const fx = presentLogFx(rows, paintedCursor);
  targetCursor = rows.length;
  if (targetCursor !== paintedCursor && !scheduled) {
    scheduled = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(releaseHeldLog);
  }
  return fx;
}

export function releaseHeldLog() {
  paintedCursor = targetCursor;
  scheduled = false;
}
