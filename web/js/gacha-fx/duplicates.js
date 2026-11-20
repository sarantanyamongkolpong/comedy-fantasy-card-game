/**
 * Duplicate feedback matches insertItem: the same catalog identity stacking
 * again is another copy. The web booth stores one token row per copy, so a
 * duplicate is a second row with the same identity. Nothing is converted and
 * no currency is granted here.
 */

export function duplicateKey(row) {
  if (!row || typeof row !== 'object') return '';
  if (row.avatarId) return `avatar|${row.avatarId}`;
  if (row.cardId) return `action|${row.cardId}`;
  // Name + pool + rarity is what the booth actually stores on a token.
  if (row.pool && row.name && row.rarity) return `${row.pool}|${row.name}|${row.rarity}`;
  if (row.catalogId && row.pool) return `${row.pool}|${row.catalogId}`;
  return '';
}

export function decorateResults(results, pulls = []) {
  return results.map((result, index) => {
    const pull = pulls[index] ?? {};
    return {
      ...result,
      catalogId: result.catalogId ?? pull.id ?? null,
      tier: result.tier ?? pull.tier ?? null,
      forced: result.forced ?? pull.forced ?? null,
    };
  });
}

function absorb(counts, row) {
  const key = duplicateKey(row);
  if (!key) return;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

export function annotateDuplicates(profile, results) {
  const counts = new Map();
  for (const avatar of profile?.avatars ?? []) absorb(counts, { avatarId: avatar?.avatarId });
  for (const action of profile?.actions ?? []) absorb(counts, { cardId: action?.cardId });
  for (const token of profile?.tokens ?? []) absorb(counts, token);
  return results.map((result) => {
    const key = duplicateKey(result);
    const prior = key ? (counts.get(key) ?? 0) : 0;
    if (key) counts.set(key, prior + 1);
    const duplicate = prior > 0;
    return {
      ...result,
      duplicate,
      copyNumber: prior + 1,
      duplicateNote: duplicate
        ? `Duplicate copy ${prior + 1}. No conversion.`
        : 'New copy.',
    };
  });
}
