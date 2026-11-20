/**
 * Structural diff of two JSON values.
 * Object keys are compared as a set. Arrays are compared by index.
 * @param {unknown} left
 * @param {unknown} right
 * @returns {{ equal: boolean, changes: { path: string, kind: 'changed' | 'added' | 'removed', left?: unknown, right?: unknown }[] }}
 */
export function diffValues(left, right) {
  const changes = [];
  walk(left, right, '', changes);
  return { equal: changes.length === 0, changes };
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @param {string} path
 * @param {object[]} changes
 */
function walk(left, right, path, changes) {
  if (Object.is(left, right)) return;
  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    for (const key of keys) {
      const child = path ? `${path}.${key}` : key;
      const inLeft = Object.prototype.hasOwnProperty.call(left, key);
      const inRight = Object.prototype.hasOwnProperty.call(right, key);
      if (!inLeft) changes.push({ path: child, kind: 'added', right: right[key] });
      else if (!inRight) changes.push({ path: child, kind: 'removed', left: left[key] });
      else walk(left[key], right[key], child, changes);
    }
    return;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      const child = `${path}[${index}]`;
      if (index >= left.length) changes.push({ path: child, kind: 'added', right: right[index] });
      else if (index >= right.length) changes.push({ path: child, kind: 'removed', left: left[index] });
      else walk(left[index], right[index], child, changes);
    }
    return;
  }
  changes.push({ path: path || '$', kind: 'changed', left, right });
}

/**
 * @param {unknown} value
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
