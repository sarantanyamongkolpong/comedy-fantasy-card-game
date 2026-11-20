/**
 * Pity numbers shown on a booth. Thresholds come from the rule config
 * (GA-05..GA-10). This module does not own or change those numbers.
 */

const POOLS = new Set(['avatar', 'action', 'companion']);

export function pityRules(pool) {
  if (pool === 'companion') return { epic: 'GA-09', top: 'GA-10' };
  if (pool === 'action') return { epic: 'GA-06', top: 'GA-08' };
  return { epic: 'GA-05', top: 'GA-07' };
}

export function pityThresholds(pool, rules) {
  if (!POOLS.has(pool)) throw new Error(`Unknown gacha pool "${pool}"`);
  const pity = rules?.gacha?.pity;
  if (!pity) throw new Error('Rule config is missing gacha.pity');
  const epicKey = pool === 'companion' ? 'companionEpicPulls' : pool === 'action' ? 'actionEpicPulls' : 'avatarEpicPulls';
  const topKey = pool === 'action' ? 'actionTopPulls' : 'avatarTopPulls';
  const epic = pity[epicKey];
  const top = pool === 'companion' ? null : pity[topKey];
  if (!Number.isInteger(epic) || epic < 1) throw new Error(`Missing Epic pity threshold for ${pool}`);
  if (top !== null && (!Number.isInteger(top) || top < 1)) throw new Error(`Missing top pity threshold for ${pool}`);
  return { epic, top, epicKey, topKey };
}

function counter(state, engineKey, uiKey) {
  const real = state?.real;
  if (real && Object.prototype.hasOwnProperty.call(real, engineKey)) {
    const value = real[engineKey];
    if (value === null || Number.isInteger(value)) return value;
  }
  if (state && Object.prototype.hasOwnProperty.call(state, engineKey)) {
    const value = state[engineKey];
    if (value === null || Number.isInteger(value)) return value;
  }
  if (Number.isInteger(state?.[uiKey])) return state[uiKey];
  return engineKey === 'topCounter' ? null : 0;
}

export function pityView(pool, state, rules) {
  const thresholds = pityThresholds(pool, rules);
  const ruleset = pityRules(pool);
  const epicValue = counter(state, 'epicCounter', 'pityEpic') ?? 0;
  const topValue = thresholds.top == null ? null : (counter(state, 'topCounter', 'pityTop') ?? 0);
  const epic = {
    value: epicValue,
    max: thresholds.epic,
    remaining: Math.max(thresholds.epic - epicValue, 0),
    rule: ruleset.epic,
  };
  const top = topValue == null ? null : {
    value: topValue,
    max: thresholds.top,
    remaining: Math.max(thresholds.top - topValue, 0),
    rule: ruleset.top,
  };
  return { epic, top, thresholds };
}

export function epicPityLabel(view) {
  return `Epic pity ${view.epic.value} / ${view.epic.max}`;
}

export function topPityLabel(view) {
  if (!view.top) return 'Top pity: none (LOCKED for companions)';
  return `Top pity ${view.top.value} / ${view.top.max}`;
}

export function pityFraction(value, max) {
  if (!Number.isInteger(max) || max < 1) return 0;
  return Math.min(Math.max(value, 0) / max, 1);
}

/**
 * Test seam. Moves the existing counters only. Threshold fields stay put.
 * Companion banners have no top counter.
 */
export function primeBannerCounters(profile, bannerId, counters = {}) {
  const state = profile?.banners?.[bannerId];
  if (!state) return { ok: false, reason: 'missing banner' };
  const real = state.real ?? null;
  const next = {};
  if (counters.epicCounter != null) {
    if (!Number.isInteger(counters.epicCounter) || counters.epicCounter < 0) {
      return { ok: false, reason: 'bad epicCounter' };
    }
    next.epic = counters.epicCounter;
  }
  if (counters.topCounter != null) {
    const noTop = state.pool === 'companion' || state.pityTopMax == null || (real ? real.topCounter == null : false);
    if (noTop) return { ok: false, reason: 'no top counter' };
    if (!Number.isInteger(counters.topCounter) || counters.topCounter < 0) {
      return { ok: false, reason: 'bad topCounter' };
    }
    next.top = counters.topCounter;
  }
  if (next.epic != null) {
    if (real) real.epicCounter = next.epic;
    state.epicCounter = next.epic;
    state.pityEpic = next.epic;
  }
  if (next.top != null) {
    if (real) real.topCounter = next.top;
    state.topCounter = next.top;
    state.pityTop = next.top;
  }
  return {
    ok: true,
    pityEpicMax: state.pityEpicMax ?? null,
    pityTopMax: state.pityTopMax ?? null,
  };
}
