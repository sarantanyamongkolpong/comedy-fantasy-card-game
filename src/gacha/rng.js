/**
 * Deterministic 32-bit generator. Same seed, same sequence.
 * @param {number} seed
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {() => number} rng
 * @param {{ weight?: number }[]} entries
 */
export function pickWeighted(rng, entries) {
  const usable = entries.filter((entry) => Number.isInteger(entry.weight) && entry.weight > 0);
  if (usable.length === 0) {
    const error = new Error('Banner has no positive integer weights. Production rates are not invented.');
    error.code = 'GA11_RATES_PENDING';
    throw error;
  }
  const total = usable.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.floor(rng() * total);
  for (const entry of usable) {
    if (roll < entry.weight) return entry;
    roll -= entry.weight;
  }
  return usable[usable.length - 1];
}

/**
 * Uniform among the guaranteed tier. This is not a drop rate (GA-11).
 * @param {() => number} rng
 * @param {object[]} entries
 */
export function pickUniform(rng, entries) {
  if (entries.length === 0) {
    const error = new Error('Pity fired but the banner has no entry of the guaranteed rarity.');
    error.code = 'NO_PITY_CANDIDATE';
    throw error;
  }
  const index = Math.floor(rng() * entries.length);
  return entries[index];
}
