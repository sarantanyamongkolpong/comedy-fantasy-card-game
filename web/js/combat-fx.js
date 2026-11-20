/**
 * Read new battle-log rows since the last paint.
 * Numbers come from state.log. Critical and upgrade effects stay unbound.
 */
const DRAW_TYPES = new Set(['opening_hand', 'effect_draw', 'draw_to_hand']);
const DISCARD_TYPES = new Set(['mandatory_discard', 'voluntary_discard']);

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

export function combatFx(log, cursor) {
  const rows = Array.isArray(log) ? log : [];
  const start = Number.isInteger(cursor) ? cursor : rows.length;
  const fresh = rows.slice(Math.max(0, start));
  const floaters = [];
  let draw = false;
  let discard = false;
  for (const entry of fresh) {
    if (!entry || typeof entry !== 'object') continue;
    const avatarId = entry.avatarId ?? entry.targetId ?? null;
    const sideId = entry.sideId ?? null;
    if (entry.type === 'damage') {
      const dealt = Number.isInteger(entry.dealt) ? entry.dealt : null;
      const delta = Number.isInteger(entry.delta) ? entry.delta : (dealt > 0 ? -dealt : null);
      if (delta != null && delta !== 0) {
        floaters.push({ avatarId, sideId, hp: entry.hp, kind: 'damage', text: signed(delta), amount: entry.amount, dealt, delta });
      }
    } else if (entry.type === 'shield') {
      const pool = Number.isInteger(entry.pool) ? entry.pool : entry.shield;
      floaters.push({
        avatarId,
        sideId,
        kind: 'shield',
        text: `SHIELD ${Number.isInteger(entry.amount) ? entry.amount : 0}`,
        amount: entry.amount,
        pool,
        delta: entry.delta ?? 0,
      });
    } else if (entry.type === 'regen_applied') {
      floaters.push({
        avatarId,
        sideId,
        kind: 'regen',
        text: `REGEN +${entry.amount ?? 0}${Number.isInteger(entry.ticks) ? ` x${entry.ticks}` : ''}`,
        amount: entry.amount,
        ticks: entry.ticks,
        delta: entry.delta ?? 0,
      });
    } else if (entry.type === 'regen_tick') {
      const healed = Number.isInteger(entry.healed) ? entry.healed : (Number.isInteger(entry.delta) ? entry.delta : 0);
      if (healed > 0) {
        floaters.push({
          avatarId,
          sideId,
          hp: entry.hp,
          kind: 'heal',
          text: `+${healed}`,
          amount: entry.amount,
          healed,
          delta: Number.isInteger(entry.delta) ? entry.delta : healed,
        });
      }
    }
    if (DRAW_TYPES.has(entry.type)) draw = true;
    if (DISCARD_TYPES.has(entry.type)) discard = true;
  }
  return { cursor: rows.length, floaters, draw, discard };
}

export function floatersForUnit(floaters, unit) {
  return (floaters ?? []).filter((item) => {
    if (!unit || item.avatarId !== unit.avatarId) return false;
    if (item.sideId && unit.sideId && item.sideId !== unit.sideId) return false;
    if ((item.kind === 'damage' || item.kind === 'heal') && Number.isInteger(item.hp) && unit.hp !== item.hp) return false;
    return true;
  });
}
