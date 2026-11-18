const UINT32 = 0x100000000;

/**
 * mulberry32. The laboratory uses this only when a supplied parameter asks for a seeded choice.
 * @param {number} seed integer in 0..4294967295
 */
export function createRng(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new TypeError('RNG seed must be an integer from 0 through 4294967295');
  }
  let state = seed >>> 0;
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    next() {
      calls += 1;
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / UINT32;
    },
    /**
     * Integer in 0..max-1.
     * @param {number} max
     */
    int(max) {
      if (!Number.isInteger(max) || max <= 0) {
        throw new TypeError('rng.int(max) needs a positive integer max');
      }
      return Math.floor(this.next() * max);
    },
  };
}

/**
 * Fisher-Yates. Returns a new array.
 * @param {unknown[]} items
 * @param {{ int: (max: number) => number }} rng
 */
export function shuffle(items, rng) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = rng.int(index + 1);
    const held = copy[index];
    copy[index] = copy[swap];
    copy[swap] = held;
  }
  return copy;
}
