import { FRANCHISE_TERMS, MODIFIERS } from './lexicon.mjs';
import { compactName, containsPhrase, normalizeName, tokens } from './text.mjs';

/**
 * Find franchise-heuristic hits in one field.
 * `short` fields are names, titles, and ability names.
 * `long` fields are descriptions. Ambiguous English words are ignored there.
 * @param {unknown} text
 * @param {'short' | 'long'} field
 */
export function matchFranchise(text, field) {
  const normalized = normalizeName(text);
  if (!normalized) return [];
  const content = tokens(text);
  /** @type {Array<ReturnType<typeof present>>} */
  const found = [];
  const ordered = [...FRANCHISE_TERMS].sort((a, b) => normalizeName(b.phrase).length - normalizeName(a.phrase).length);
  for (const entry of ordered) {
    if (field === 'long' && entry.scope === 'short') continue;
    const phrase = normalizeName(entry.phrase);
    if (!phrase) continue;
    const phraseCompact = compactName(entry.phrase);
    const nonLatin = /[^\u0000-\u024f]/.test(phraseCompact);
    const matched = nonLatin
      ? phraseCompact.length >= 3 && compactName(text).includes(phraseCompact)
      : containsPhrase(normalized, phrase);
    if (!matched) continue;
    found.push(present(entry, phrase));
  }

  const families = new Set(found.filter((hit) => !hit.ambiguous).map((hit) => hit.family));
  /** @type {Array<ReturnType<typeof present>>} */
  const kept = [];
  const seen = new Set();
  for (const hit of found) {
    const key = `${hit.phraseNorm}:${hit.family}`;
    if (seen.has(key)) continue;
    if (!hit.ambiguous) {
      seen.add(key);
      kept.push({ ...hit, weight: 'high' });
      continue;
    }
    const phraseTokens = hit.phraseNorm.split(' ').filter(Boolean);
    const covered = phraseTokens.every((token) => content.includes(token));
    if (!covered && !families.has(hit.family)) continue;
    const extras = content.filter((token) => !phraseTokens.includes(token));
    const onlyModifiers = extras.every((token) => MODIFIERS.has(token));
    const multiword = phraseTokens.length >= 2;
    if (!families.has(hit.family) && !onlyModifiers && !multiword) continue;
    if (!covered && !multiword) continue;
    seen.add(key);
    const bareWord = phraseTokens.length === 1 && extras.length === 0;
    kept.push({ ...hit, weight: bareWord ? 'medium' : 'high' });
  }
  return kept.map(({ phraseNorm, ...hit }) => hit);
}

/**
 * @param {typeof FRANCHISE_TERMS[number]} entry
 * @param {string} phraseNorm
 */
function present(entry, phraseNorm) {
  return {
    phrase: entry.phrase,
    phraseNorm,
    label: entry.label,
    kind: entry.kind,
    family: entry.family,
    ambiguous: entry.ambiguous,
    weight: 'high',
  };
}
