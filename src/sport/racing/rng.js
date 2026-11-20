/**
 * Integer mulberry32. Same constants as src/gacha/rng.js, but every draw stays
 * a uint32 so a race does not depend on float rounding.
 */

/**
 * @param {unknown} seed
 */
export function assertSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0) {
    const error = new TypeError('seed must be a non-negative integer');
    error.code = 'BAD_SEED';
    throw error;
  }
  return seed >>> 0;
}

/**
 * @param {number} seed
 * @param {string} label
 */
export function mixSeed(seed, label) {
  let hash = seed >>> 0;
  for (let index = 0; index < label.length; index += 1) {
    hash = Math.imul(hash ^ label.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

/**
 * @param {number} seed
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return {
    nextU32() {
      state = (state + 0x6d2b79f5) >>> 0;
      let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
      return (mixed ^ (mixed >>> 14)) >>> 0;
    },
    /**
     * @param {number} max exclusive, at least 1
     */
    int(max) {
      return this.nextU32() % max;
    },
  };
}
