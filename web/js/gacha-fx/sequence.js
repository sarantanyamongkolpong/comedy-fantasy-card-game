/**
 * Card reveal order. Reduced motion settles on the last card immediately.
 * Skip ends the sequence. Timers are injectable so tests do not wait.
 */

export function prefersReducedMotion(media = globalThis.matchMedia) {
  if (typeof media !== 'function') return false;
  try {
    return media('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

export function createRevealDirector(results, options = {}) {
  const list = Array.isArray(results) ? results : [];
  const reduced = options.reducedMotion === true;
  const stepMs = Number.isInteger(options.stepMs) && options.stepMs >= 0 ? options.stepMs : 820;
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? ((id) => clearTimeout(id));
  let index = 0;
  let timer = null;
  let done = false;
  let skipped = false;
  let finished = false;

  function snapshot() {
    return {
      index,
      result: list[index] ?? null,
      total: list.length,
      done,
      skipped,
      reduced,
      results: list,
    };
  }

  function clear() {
    if (timer != null) clearTimer(timer);
    timer = null;
  }

  function finish() {
    if (finished) return snapshot();
    finished = true;
    done = true;
    clear();
    const state = snapshot();
    options.onDone?.(state);
    return state;
  }

  function cancel() {
    if (finished) return snapshot();
    finished = true;
    done = true;
    clear();
    return snapshot();
  }

  function emit() {
    options.onStep?.(snapshot());
  }

  function arm() {
    timer = setTimer(() => {
      timer = null;
      if (finished) return;
      if (options.isAlive && !options.isAlive()) {
        cancel();
        return;
      }
      if (index >= list.length - 1) {
        finish();
        return;
      }
      index += 1;
      emit();
      arm();
    }, stepMs);
  }

  function start() {
    if (finished) return snapshot();
    if (list.length === 0 || (reduced && options.manual !== true)) {
      index = Math.max(list.length - 1, 0);
      return finish();
    }
    emit();
    if (options.manual !== true) arm();
    return snapshot();
  }

  /** Manual mode (Owner 2026-11-21): the player taps Next to see each card. */
  function next() {
    if (finished) return snapshot();
    if (index >= list.length - 1) return finish();
    index += 1;
    emit();
    return snapshot();
  }

  function skip() {
    if (finished) return snapshot();
    skipped = true;
    return finish();
  }

  return {
    start,
    skip,
    next,
    cancel,
    get index() { return index; },
    get done() { return done; },
    get skipped() { return skipped; },
    get reduced() { return reduced; },
    get results() { return list; },
  };
}
