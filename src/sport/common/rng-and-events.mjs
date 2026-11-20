/**
 * SPORT COMPLEX v0.6 — shared seeded RNG and playback event envelope.
 * Status: PROPOSED. Balance numbers are not decided here.
 *
 * Football and basketball auto sims import this module and nothing from the
 * v0.5 card engine. The generator is mulberry32 (one uint32 of state), the
 * same family as src/gacha/rng.js and src/engine/rng.js, copied so a sport
 * replay cannot drift if the card game changes its stream.
 *
 * Event shape (docs/sport_v06/CONTRACTS.md Sim API):
 *   { t, type, actors, text }
 *   t      playback timestamp in sim-seconds, monotonic non-decreasing.
 *          Array order is the playback order when timestamps tie.
 *   type   machine tag (goal, make2, foul_out, ...).
 *   actors parody display names only. The sim never prints a real name;
 *          it only copies `parodyName` values the caller supplied.
 *   text   one commentary line for the log / replay.
 */

/**
 * @param {string} code
 * @param {string} message
 */
export function sportError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * @param {unknown} seed Integer 0..4294967295, or a non-empty string (FNV-1a).
 * @returns {number}
 */
export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff) {
    return seed >>> 0;
  }
  if (typeof seed === 'string' && seed.length > 0) {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  throw sportError('BAD_SEED', 'seed must be an integer from 0 to 4294967295 or a non-empty string');
}

/**
 * @param {unknown} seed
 */
export function createRng(seed) {
  let state = hashSeed(seed);
  return {
    /** Uniform in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    },
    /**
     * Integer in [0, count).
     * @param {number} count
     */
    nextInt(count) {
      if (!Number.isInteger(count) || count <= 0) {
        throw sportError('BAD_RANGE', 'nextInt count must be a positive integer');
      }
      return Math.floor(this.next() * count);
    },
    /**
     * @param {number} probability Clamped to [0, 1] after a finite check.
     */
    chance(probability) {
      const p = Number(probability);
      if (!Number.isFinite(p)) throw sportError('BAD_RANGE', 'chance probability must be finite');
      if (p <= 0) {
        this.next();
        return false;
      }
      if (p >= 1) {
        this.next();
        return true;
      }
      return this.next() < p;
    },
    getState() {
      return state >>> 0;
    },
  };
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {{ next: () => number }} rng
 * @param {unknown[]} items
 * @param {(item: unknown) => number} weightOf Non-positive weights are skipped.
 */
export function pickWeighted(rng, items, weightOf) {
  if (!items.length) throw sportError('BAD_RANGE', 'pickWeighted received an empty list');
  let total = 0;
  const weights = items.map((item) => {
    const weight = Number(weightOf(item));
    if (!(weight > 0) || !Number.isFinite(weight)) return 0;
    total += weight;
    return weight;
  });
  if (!(total > 0)) return items[0];
  let roll = rng.next() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index];
    if (roll < 0) return items[index];
  }
  return items[items.length - 1];
}

/**
 * @param {{ t: number, type: string, actors?: string[], text: string }} fields
 */
export function makeEvent(fields) {
  const t = Number(fields.t);
  if (!Number.isFinite(t) || t < 0) throw sportError('BAD_EVENT', 'event t must be a non-negative finite timestamp');
  if (typeof fields.type !== 'string' || fields.type.length === 0) {
    throw sportError('BAD_EVENT', 'event type is required');
  }
  if (typeof fields.text !== 'string' || fields.text.length === 0) {
    throw sportError('BAD_EVENT', 'event text is required');
  }
  const actors = Array.isArray(fields.actors) ? fields.actors.map((name) => {
    if (typeof name !== 'string' || name.length === 0) {
      throw sportError('BAD_EVENT', 'event actors must be non-empty parody names');
    }
    return name;
  }) : [];
  return { t, type: fields.type, actors, text: fields.text };
}

/** Keys every ball-sim event exposes to playback. */
export const EVENT_KEYS = Object.freeze(['t', 'type', 'actors', 'text']);
