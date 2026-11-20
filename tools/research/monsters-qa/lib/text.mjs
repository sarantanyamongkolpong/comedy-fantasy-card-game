/**
 * Name and text comparisons for QA. Pure functions. No network and no git.
 */

const LEADING_ARTICLE = /^(the|a|an)\s+/;

/**
 * Lowercase, strip accents and apostrophes, turn punctuation into spaces.
 * @param {unknown} value
 */
export function normalizeName(value) {
  let text = String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  text = text.replace(/['’`]/g, '');
  text = text.replace(/&/g, ' and ');
  text = text.replace(/[^\p{L}\p{N}]+/gu, ' ');
  text = text.replace(/\s+/g, ' ').trim().replace(LEADING_ARTICLE, '');
  return text;
}

/**
 * Letters and digits only, for edit distance and phonetic comparison.
 * @param {unknown} value
 */
export function compactName(value) {
  return normalizeName(value).replace(/ /g, '');
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function tokens(value) {
  const text = normalizeName(value);
  return text ? text.split(' ') : [];
}

/**
 * @param {string} haystack normalized with normalizeName
 * @param {string} phrase normalized with normalizeName
 */
export function containsPhrase(haystack, phrase) {
  if (!phrase) return false;
  return ` ${haystack} `.includes(` ${phrase} `);
}

/**
 * @param {string} a
 * @param {string} b
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  const left = [...a];
  const right = [...b];
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;
  let prev = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = next;
  }
  return prev[right.length];
}

/**
 * 1 means the compact strings are identical. Empty vs empty is 1.
 * @param {string} a
 * @param {string} b
 */
export function editSimilarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max([...a].length, [...b].length);
}

/**
 * @param {string} a
 * @param {string} b
 */
export function sharedPrefixLength(a, b) {
  const limit = Math.min(a.length, b.length);
  let index = 0;
  while (index < limit && a[index] === b[index]) index += 1;
  return index;
}

/**
 * Consonant skeleton for Latin names. Returns '' for non-Latin input.
 * @param {unknown} value
 */
export function phoneticKey(value) {
  const compact = compactName(value);
  if (!compact || /[^a-z]/.test(compact)) return '';
  const mapped = compact
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'kw')
    .replace(/x/g, 'ks')
    .replace(/[cq]/g, 'k')
    .replace(/z/g, 's')
    .replace(/v/g, 'f');
  let out = '';
  for (const ch of mapped) {
    if (out.endsWith(ch)) continue;
    out += ch;
  }
  return out;
}

/**
 * @param {unknown} a
 * @param {unknown} b
 */
export function phoneticMatch(a, b) {
  const left = phoneticKey(a);
  const right = phoneticKey(b);
  if (left.length < 5 || right.length < 5) return false;
  if (left === right) return true;
  return editSimilarity(left, right) >= 0.75;
}

/**
 * @param {string[]} left
 * @param {string[]} right
 */
export function jaccard(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * @param {string} text
 * @param {string} term
 */
export function termPresent(text, term) {
  const haystack = normalizeName(text);
  const needle = normalizeName(term);
  if (!needle) return false;
  if (needle.includes(' ') || needle.length >= 6) return haystack.includes(needle);
  return containsPhrase(haystack, needle);
}

/**
 * @param {string} value
 */
/**
 * Drop "no X" / "not a X" phrases so a denial is not scored as a copy.
 * @param {unknown} value
 */
export function stripNegations(value) {
  return String(value ?? '').replace(/\b(?:no|not|without|never|isn't|aren't)\b(?:\s+\w+){1,6}/gi, ' ');
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const STOPWORDS = new Set(`
  a an the of and or to in on for with from by as at is are was were be been being
  that this it its into over after before about who whom which their his her they
  them he she not but if then than also have has had do does did will can may often
  usually known called named one two three than into across per via than just than
  such these those other another very more most some any each both same own than
`.trim().split(/\s+/));
