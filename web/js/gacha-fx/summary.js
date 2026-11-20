/** Reward summary for one pull. Ranks describe the reveal highlight only. */

const RANK = { N: 1, R: 2, Epic: 3, EX: 4, FAC: 4 };

export function summarizeRewards(results, charged = 0) {
  const byRarity = {};
  let duplicates = 0;
  let fresh = 0;
  let pityHits = 0;
  for (const result of results) {
    const rarity = result.rarity ?? 'N';
    byRarity[rarity] = (byRarity[rarity] ?? 0) + 1;
    if (result.duplicate) duplicates += 1;
    else fresh += 1;
    if (result.forced) pityHits += 1;
  }
  return {
    count: results.length,
    byRarity,
    duplicates,
    fresh,
    pityHits,
    charged: Number.isInteger(charged) ? charged : 0,
  };
}

export function highlightResult(results) {
  let best = results[0] ?? null;
  for (const result of results) {
    const rank = RANK[result.rarity] ?? 0;
    const bestRank = best ? (RANK[best.rarity] ?? 0) : -1;
    if (rank >= bestRank) best = result;
  }
  return best;
}

export function summaryHeadline(summary) {
  const cards = summary.count === 1 ? '1 card' : `${summary.count} cards`;
  const fresh = summary.fresh === 1 ? '1 new' : `${summary.fresh} new`;
  const dup = summary.duplicates === 1 ? '1 duplicate' : `${summary.duplicates} duplicates`;
  return `${cards} · ${fresh} · ${dup} · charged ${summary.charged} G`;
}

export function resultLine(result) {
  const kind = result.duplicate ? 'Duplicate' : 'New';
  const pity = result.forced ? ` · pity ${result.forced}` : '';
  const note = result.duplicate ? ' · no conversion' : '';
  return `${kind} · ${result.rarity}${pity} · ${result.name} · copy ${result.copyNumber}${note}`;
}
