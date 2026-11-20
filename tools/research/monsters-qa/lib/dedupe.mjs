import { GENERIC_TOKENS } from './lexicon.mjs';
import { STOPWORDS, compactName, editSimilarity, jaccard, normalizeName, tokens } from './text.mjs';

/**
 * @param {object[]} records
 */
export function dedupeRecords(records) {
  const usable = records.filter((record) => !record.parseError);
  const creatives = usable.filter((record) => record.role === 'creative' && (record.parodyName || record.bossTitle));
  const inspirations = usable.filter((record) => record.kind === 'inspiration' && record.originalName);
  /** @type {object[]} */
  const pairs = [];

  for (let i = 0; i < creatives.length; i += 1) {
    for (let j = i + 1; j < creatives.length; j += 1) {
      const namePair = compareNames(creatives[i], creatives[j]);
      if (namePair) pairs.push(namePair);
      else {
        const concept = compareConcepts(creatives[i], creatives[j]);
        if (concept) pairs.push(concept);
      }
    }
  }
  for (let i = 0; i < inspirations.length; i += 1) {
    for (let j = i + 1; j < inspirations.length; j += 1) {
      const left = compactName(inspirations[i].originalName);
      const right = compactName(inspirations[j].originalName);
      if (!left || left !== right) continue;
      const sameAgent = inspirations[i].agent === inspirations[j].agent;
      pairs.push(pair('shared-inspiration', sameAgent ? 'P1' : 'P2', 1, inspirations[i], inspirations[j], inspirations[i].originalName, inspirations[j].originalName,
        sameAgent
          ? 'The same inspiration is entered twice in one research file.'
          : 'Two agents researched the same inspiration. Merge the source record before anyone designs a second monster from it.'));
    }
  }

  const rank = { P0: 0, P1: 1, P2: 2 };
  pairs.sort((a, b) => rank[a.priority] - rank[b.priority] || b.score - a.score || a.left.id.localeCompare(b.left.id));
  return pairs;
}

/**
 * @param {object} left
 * @param {object} right
 */
function compareNames(left, right) {
  const leftName = left.parodyName || left.bossTitle;
  const rightName = right.parodyName || right.bossTitle;
  const leftCompact = compactName(leftName);
  const rightCompact = compactName(rightName);
  if (!leftCompact || !rightCompact) return null;
  if (leftCompact === rightCompact) {
    return pair('exact-parody-name', 'P0', 1, left, right, leftName, rightName,
      'These entries use the same parody name. Every sample entry has to be distinct.');
  }
  const similarity = editSimilarity(leftCompact, rightCompact);
  const leftTokens = distinctive(leftName);
  const rightTokens = distinctive(rightName);
  const overlap = jaccard(leftTokens, rightTokens);
  if (similarity >= 0.82 || (overlap >= 0.8 && leftTokens.length >= 2)) {
    return pair('near-parody-name', 'P1', Number(Math.max(similarity, overlap).toFixed(3)), left, right, leftName, rightName,
      `Parody names are close (edit similarity ${similarity.toFixed(2)}, token overlap ${overlap.toFixed(2)}).`);
  }
  return null;
}

/**
 * @param {object} left
 * @param {object} right
 */
function compareConcepts(left, right) {
  const leftTokens = conceptTokens(left);
  const rightTokens = conceptTokens(right);
  if (leftTokens.length < 3 || rightTokens.length < 3) return null;
  const shared = leftTokens.filter((token) => rightTokens.includes(token));
  const overlap = jaccard(leftTokens, rightTokens);
  const sameCreature = left.creatureType && right.creatureType && normalizeName(left.creatureType) === normalizeName(right.creatureType);
  const strong = shared.length >= 4 && overlap >= 0.45;
  const tight = shared.length >= 3 && overlap >= 0.62;
  if (!strong && !tight) return null;
  if (!sameCreature && overlap < 0.7) return null;
  return pair('concept-overlap', 'P1', Number(overlap.toFixed(3)), left, right, left.parodyName, right.parodyName,
    `Concept overlap ${overlap.toFixed(2)} on ${shared.slice(0, 8).join(', ')}.`);
}

/**
 * @param {object} record
 */
function conceptTokens(record) {
  const text = [
    record.creatureType, record.visualIdentity, record.comedyConcept, record.signatureTrait,
    record.ability, record.element, record.archetype, ...(record.archetypeTags || []),
  ].filter(Boolean).join(' ');
  return distinctive(text);
}

/**
 * @param {string} text
 */
function distinctive(text) {
  return [...new Set(tokens(text).filter((token) => token.length >= 4 && !GENERIC_TOKENS.has(token) && !STOPWORDS.has(token)))];
}

/**
 * @param {string} kind
 * @param {string} priority
 * @param {number} score
 * @param {object} left
 * @param {object} right
 * @param {string} leftName
 * @param {string} rightName
 * @param {string} reason
 */
function pair(kind, priority, score, left, right, leftName, rightName, reason) {
  return {
    priority,
    kind,
    score,
    reason,
    left: pointer(left, leftName),
    right: pointer(right, rightName),
  };
}

/**
 * @param {object} record
 * @param {string} name
 */
function pointer(record, name) {
  return {
    agent: record.agent,
    id: record.id,
    name,
    path: record.path,
    ref: record.ref,
    sha: record.sha,
  };
}
