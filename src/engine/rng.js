/**
 * Serializable match RNG.
 * The stream is mulberry32. State is one uint32, so a match can be saved and resumed.
 * Chance checks in the battle engine must use this stream. There is no unseeded fallback.
 */

/**
 * @param {unknown} seed
 * @returns {number}
 */
export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0;
  const text = typeof seed === 'string' ? seed : JSON.stringify(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Dedicated stream for one labelled decision, separate from the match draw stream.
 * @param {number} seed
 * @param {string} label
 */
export function mixSeed(seed, label) {
  return hashSeed(`${seed >>> 0}:${label}`);
}

/**
 * @param {number} seedState
 */
export function createRng(seedState) {
  let state = seedState >>> 0;
  return {
    next() {
      state = (state + 0x6D2B79F5) >>> 0;
      let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    },
    /**
     * @param {number} count
     */
    nextInt(count) {
      if (!Number.isInteger(count) || count <= 0) {
        throw new TypeError('nextInt count must be a positive integer');
      }
      return Math.floor(this.next() * count);
    },
    getState() {
      return state >>> 0;
    },
  };
}

/**
 * @param {unknown[]} items
 * @param {{ nextInt: (count: number) => number }} rng
 */
export function shuffleInPlace(items, rng) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = rng.nextInt(index + 1);
    const current = items[index];
    items[index] = items[swap];
    items[swap] = current;
  }
  return items;
}
