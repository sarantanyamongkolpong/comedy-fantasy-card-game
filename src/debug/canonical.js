import { createHash } from 'node:crypto';

/**
 * @param {string} text
 */
export function sha256(text) {
  return `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
}

/**
 * @param {unknown} value
 */
export function sortValue(value) {
  if (Array.isArray(value)) return value.map((item) => sortValue(item));
  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) continue;
      sorted[key] = sortValue(value[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Stable JSON used for hashes. Key order does not affect the digest.
 * @param {unknown} value
 */
export function canonicalString(value) {
  return JSON.stringify(sortValue(value));
}

/**
 * Drop functions and reject non-finite numbers so a log can be stored as JSON.
 * @param {unknown} value
 */
export function dataClone(value) {
  const encoded = JSON.stringify(value, function replacer(key, item) {
    if (typeof item === 'function' || typeof item === 'symbol') return undefined;
    if (typeof item === 'number' && !Number.isFinite(item)) {
      throw new TypeError(`Cannot record non-finite number at ${key || 'value'}`);
    }
    if (typeof item === 'bigint') {
      throw new TypeError(`Cannot record bigint at ${key || 'value'}`);
    }
    return item;
  });
  if (encoded === undefined) throw new TypeError('Cannot record an empty value');
  return JSON.parse(encoded);
}

/**
 * @param {unknown} value
 * @param {string} [path]
 */
export function assertJsonData(value, path = 'value') {
  if (value === null) return;
  const kind = typeof value;
  if (kind === 'string' || kind === 'boolean') return;
  if (kind === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${path} must be a finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonData(item, `${path}[${index}]`));
    return;
  }
  if (kind === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assertJsonData(child, `${path}.${key}`);
    }
    return;
  }
  throw new TypeError(`${path} is not JSON data`);
}
