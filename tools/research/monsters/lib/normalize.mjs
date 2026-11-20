/**
 * Name folding for duplicate detection.
 * Thai letters stay. Punctuation becomes a space. One leading the/a/an is dropped.
 */

const COLOR = new Set([
  'red', 'blue', 'green', 'gold', 'silver', 'black', 'white', 'purple', 'pink',
  'crimson', 'azure', 'grey', 'gray', 'yellow', 'orange', 'brown', 'violet',
]);

const STOP = new Set([
  'the', 'and', 'with', 'who', 'that', 'this', 'from', 'into', 'onto', 'for',
  'its', 'his', 'her', 'their', 'but', 'not', 'you', 'are', 'was', 'has', 'have',
  'one', 'just', 'very', 'like', 'than', 'then', 'them', 'they', 'she', 'him',
  'our', 'out', 'all', 'can', 'will', 'would', 'could', 'about', 'when', 'what',
  'your', 'parody', 'monster', 'boss', 'creature', 'tower', 'funny', 'joke',
  'each', 'every', 'their', 'them', 'into', 'over', 'under', 'after', 'before',
  'while', 'where', 'which', 'been', 'being', 'does', 'did', 'had', 'having',
]);

/** Common genre words. A protected-name check does not treat these as a trademark. */
export const TROPE_WORDS = new Set([
  'slime', 'dragon', 'knight', 'goblin', 'orc', 'skeleton', 'ghost', 'wolf',
  'king', 'queen', 'demon', 'angel', 'witch', 'zombie', 'vampire', 'golem',
  'fairy', 'elf', 'dwarf', 'ogre', 'troll', 'phoenix', 'hydra', 'kraken',
  'spider', 'rat', 'bat', 'cat', 'dog', 'bird', 'fish', 'snake', 'lion',
  'tiger', 'bear', 'tree', 'stone', 'fire', 'water', 'shadow', 'spirit',
  'hero', 'monster', 'boss', 'lord', 'lady', 'sir', 'mage', 'wizard', 'kingdom',
]);

/** @param {unknown} value */
export function normalizeName(value) {
  if (typeof value !== 'string') return '';
  const folded = value
    .normalize('NFKC')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return folded.replace(/^(?:the|a|an)\s+/u, '');
}

/** @param {unknown} value */
export function compactName(value) {
  return normalizeName(value).replace(/\s+/g, '');
}

/**
 * Compact name with a trailing number removed, so "Goblin 2" and "Goblin" share a stem.
 * @param {unknown} value
 */
export function nameStem(value) {
  return compactName(value).replace(/\d+$/u, '');
}

/**
 * Compact name with colour words and bare numbers removed.
 * @param {unknown} value
 */
export function recolourKey(value) {
  const tokens = normalizeName(value)
    .split(' ')
    .filter((token) => token && !COLOR.has(token) && !/^\d+$/u.test(token));
  return tokens.join('');
}

/** @param {string} text */
export function conceptTokens(text) {
  const tokens = normalizeName(text).split(' ').filter((token) => token.length > 2 && !STOP.has(token));
  return [...new Set(tokens)];
}

/** Dice coefficient on character bigrams. Identical strings score 1. */
export function dice(left, right) {
  if (left === right) return left.length === 0 ? 0 : 1;
  const a = bigrams(left);
  const b = bigrams(right);
  if (a.total === 0 || b.total === 0) return 0;
  let shared = 0;
  for (const [gram, count] of a.counts) {
    if (b.counts.has(gram)) shared += Math.min(count, b.counts.get(gram));
  }
  return (2 * shared) / (a.total + b.total);
}

/** @param {string[]} left @param {string[]} right */
export function jaccard(left, right) {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  let shared = 0;
  for (const token of new Set(left)) if (rightSet.has(token)) shared += 1;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : shared / union;
}

/** @param {string} text */
function bigrams(text) {
  const counts = new Map();
  let total = 0;
  if (text.length < 2) return { counts, total };
  for (let index = 0; index < text.length - 1; index += 1) {
    const gram = text.slice(index, index + 2);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
    total += 1;
  }
  return { counts, total };
}

/**
 * @param {number | null} score
 * @returns {string | null}
 */
export function formatScore(score) {
  if (score == null || Number.isNaN(score)) return null;
  return score.toFixed(3);
}
