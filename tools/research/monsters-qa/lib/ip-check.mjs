import { matchFranchise } from './franchise.mjs';
import { CANON_NAMES, FRANCHISE_TERMS, GENERIC_TOKENS, SIGNATURE_VISUALS, STUDIO_NAMES } from './lexicon.mjs';
import {
  compactName,
  containsPhrase,
  editSimilarity,
  stripNegations,
  levenshtein,
  normalizeName,
  phoneticMatch,
  sharedPrefixLength,
  tokens,
} from './text.mjs';
import { STOPWORDS } from './text.mjs';

/**
 * Thresholds documented in docs/research/monsters/qa/IP_REVIEW_GUIDE.md.
 * Change them in both places.
 */
export const RISK_THRESHOLDS = Object.freeze({
  editHigh: 0.88,
  editMedium: 0.72,
  lexiconHigh: 0.8,
  lexiconMedium: 0.72,
  prefixMin: 6,
  prefixRatio: 0.68,
  prefixRemainderHigh: 2,
  phoneticWithEdit: 0.72,
});

const STYLE_COPY = /\b(in the style of|official art(?:work)? of|same (?:design|look|silhouette|costume) as|traced from|looks exactly like|on-model with)\b/;

const RANK = { low: 0, medium: 1, high: 2 };

/**
 * @param {'low' | 'medium' | 'high'} risk
 * @param {'low' | 'medium' | 'high'} next
 */
function bump(risk, next) {
  return RANK[next] > RANK[risk] ? next : risk;
}

/**
 * @param {object} record
 */
export function isSample(record) {
  if (!record || record.parseError) return false;
  if (record.role !== 'creative' && record.kind !== 'creative') return false;
  return Boolean(record.parodyName || record.bossTitle || record.visualIdentity || record.artworkPrompt || record.comedyConcept);
}

/**
 * @param {object} record
 */
export function assessIp(record) {
  const parody = record.parodyName || record.bossTitle || '';
  const original = record.originalName || '';
  const originalLabel = inspirationLabel(original);
  const parodyCompact = compactName(parody);
  const originalCompact = compactName(originalLabel);
  const shortText = [record.parodyName, record.thaiName, record.bossTitle, record.ability, record.mechanic].filter(Boolean);
  const longText = [
    record.visualIdentity, record.artworkPrompt, record.silhouette, record.comedyConcept,
    record.personality, record.lore, record.signatureTrait, record.entrance, record.weakness,
  ].filter(Boolean).map((text) => stripNegations(text));
  const visualText = stripNegations([record.visualIdentity, record.artworkPrompt, record.silhouette].filter(Boolean).join('\n'));
  const franchiseHits = dedupeHits([
    ...shortText.flatMap((text) => matchFranchise(text, 'short')),
    ...longText.flatMap((text) => matchFranchise(text, 'long')),
  ]);
  const visualHits = matchVisuals(visualText);
  const styleCopy = STYLE_COPY.test(normalizeName(visualText)) && (
    franchiseHits.length > 0 || STUDIO_NAMES.some((studio) => containsPhrase(normalizeName(visualText), normalizeName(studio)))
  );
  const lexiconClose = closeLexiconNames(parodyCompact);
  const originalClose = originalCompact ? describePair(parodyCompact, originalCompact) : null;
  const shared = sharedDistinctive(parody, originalLabel);
  const genericPair = isGenericLabel(parody) && (!original || isGenericLabel(original));
  const originalOnLexicon = lexiconIdentity(original);
  const canon = CANON_NAMES.find((item) => compactName(item.name) === parodyCompact || compactName(item.name) === compactName(record.bossTitle || ''));

  let risk = 'low';
  /** @type {string[]} */
  const reasons = [];
  let verbatim = false;

  if (parodyCompact && originalCompact && parodyCompact === originalCompact) {
    if (genericPair) {
      risk = bump(risk, 'medium');
      reasons.push(`“${parody}” repeats the generic creature word and has not grown its own name.`);
    } else if (record.protectedName === true || originalOnLexicon) {
      risk = 'high';
      verbatim = true;
      reasons.push(`“${parody}” repeats the inspiration name${originalOnLexicon ? ` (${originalOnLexicon.label})` : ''}.`);
    } else if (record.publicDomain === true) {
      risk = bump(risk, 'medium');
      reasons.push(`“${parody}” is still the public-domain name. The card needs its own identity.`);
    } else {
      risk = 'high';
      verbatim = record.protectedName !== false;
      reasons.push(`“${parody}” is the same name as its inspiration.`);
      if (record.protectedName === false) verbatim = false;
    }
  }

  if (originalClose && parodyCompact !== originalCompact) {
    const fromOriginal = riskFromPair(originalClose, { generic: genericPair });
    if (fromOriginal) {
      risk = bump(risk, fromOriginal);
      reasons.push(`Name similarity to “${originalLabel}” is ${originalClose.similarity.toFixed(2)} (edit distance ${originalClose.distance}, shared prefix ${originalClose.prefix}).`);
    }
    if (phoneticMatch(parody, originalLabel) && !genericPair) {
      const phoneticRisk = originalClose.similarity >= RISK_THRESHOLDS.phoneticWithEdit ? 'high' : 'medium';
      risk = bump(risk, phoneticRisk);
      reasons.push(`“${parody}” and “${originalLabel}” sound alike under the phonetic skeleton.`);
    }
  }

  if (shared.length > 0 && !genericPair) {
    risk = bump(risk, 'medium');
    reasons.push(`Shared distinctive token${shared.length > 1 ? 's' : ''}: ${shared.join(', ')}.`);
  }
  if (originalLabel && containsPhrase(normalizeName(parody), normalizeName(originalLabel)) && normalizeName(originalLabel).length >= 4) {
    const embedded = (record.protectedName === true || originalOnLexicon) ? 'high' : 'medium';
    if (embedded === 'high' && (record.protectedName === true || originalOnLexicon)) {
      risk = 'high';
      if (parodyCompact === originalCompact) verbatim = true;
    } else {
      risk = bump(risk, embedded);
    }
    reasons.push(`The inspiration name “${originalLabel}” is still readable inside the parody name.`);
  }

  for (const hit of franchiseHits) {
    risk = bump(risk, hit.weight === 'high' ? 'high' : 'medium');
    reasons.push(`Review heuristic: “${hit.label}” is a franchise ${hit.kind} (${hit.weight}). This list is not a trademark register.`);
    if (hit.weight === 'high' && !hit.ambiguous && compactName(hit.phrase) === parodyCompact) verbatim = true;
  }
  for (const hit of lexiconClose) {
    risk = bump(risk, hit.risk);
    reasons.push(`“${parody}” is close to the review-list name “${hit.label}” (similarity ${hit.similarity.toFixed(2)}, prefix ${hit.prefix}).`);
    if (hit.similarity >= 0.999 && !hit.ambiguous) verbatim = true;
  }
  for (const hit of visualHits) {
    risk = bump(risk, hit.complete ? 'high' : 'medium');
    reasons.push(`Visual heuristic “${hit.label}” matched ${hit.matched} of ${hit.total} cue groups${hit.complete ? '' : ' (partial)'}.`);
  }
  if (styleCopy) {
    risk = 'high';
    reasons.push('The art prompt asks for the style or model sheet of a named studio or franchise.');
  }
  if (canon) {
    reasons.push(`“${canon.name}” is a locked v0.5 identity string. A new monster needs a different name.`);
  }

  if (genericPair && risk === 'high' && !verbatim && franchiseHits.length === 0 && visualHits.every((hit) => !hit.complete)) {
    risk = 'medium';
  }

  const reported = record.selfReportedRisk;
  const disagree = (reported === 'low' && risk === 'high') || (reported === 'high' && risk === 'low');
  if (disagree) reasons.push(`The record marks IP risk “${reported}”. The heuristic marks it ${risk}.`);

  let priority = verbatim ? 'P0' : (risk === 'high' ? 'P1' : (risk === 'medium' ? 'P2' : null));
  if (canon && priority !== 'P0') priority = 'P1';
  if (!priority && disagree) priority = 'P2';

  const suggestedFix = buildFix({ risk, verbatim, parody, original, franchiseHits, visualHits, styleCopy, canon, genericPair });
  const reason = reasons.length > 0 ? reasons.join(' ') : 'No franchise token, signature visual, or close name match in the heuristic.';

  return {
    agent: record.agent,
    ref: record.ref,
    sha: record.sha,
    path: record.path,
    id: record.id,
    category: record.category,
    parodyName: record.parodyName,
    thaiName: record.thaiName,
    bossTitle: record.bossTitle,
    originalName: original,
    origin: record.origin,
    risk,
    priority,
    verbatim,
    canonCollision: canon ? canon.name : '',
    selfReportedRisk: reported || '',
    selfReportDisagrees: disagree,
    reason,
    suggestedFix,
    scores: {
      editDistance: originalClose ? originalClose.distance : null,
      editSimilarity: originalClose ? Number(originalClose.similarity.toFixed(3)) : null,
      phoneticMatch: Boolean(original && phoneticMatch(parody, original)),
      sharedPrefix: originalClose ? originalClose.prefix : 0,
      sharedDistinctiveTokens: shared,
      franchiseHits: franchiseHits.map((hit) => ({ phrase: hit.phrase, label: hit.label, kind: hit.kind, weight: hit.weight })),
      lexiconClose: lexiconClose.map((hit) => ({ label: hit.label, phrase: hit.phrase, similarity: Number(hit.similarity.toFixed(3)), risk: hit.risk })),
      signatureVisualHits: visualHits.map((hit) => ({ id: hit.id, label: hit.label, matched: hit.matched, total: hit.total, complete: hit.complete })),
      styleCopy,
    },
  };
}

/**
 * @param {object[]} records
 */
export function assessAllIp(records) {
  return records.filter(isSample).map(assessIp).sort((a, b) => (
    a.agent.localeCompare(b.agent) || a.id.localeCompare(b.id)
  ));
}

/**
 * @param {string} text
 */
export function matchVisuals(text) {
  const norm = normalizeName(text);
  if (!norm) return [];
  /** @type {object[]} */
  const hits = [];
  for (const visual of SIGNATURE_VISUALS) {
    let matched = 0;
    for (const group of visual.groups) {
      if (group.some((pattern) => pattern.test(norm))) matched += 1;
    }
    const complete = matched >= visual.highAt;
    if (complete || matched >= visual.mediumAt) {
      hits.push({
        id: visual.id,
        label: visual.label,
        matched,
        total: visual.groups.length,
        complete,
      });
    }
  }
  return hits;
}

/**
 * @param {string} parodyCompact
 * @param {string} otherCompact
 */
function describePair(parodyCompact, otherCompact) {
  const distance = levenshtein(parodyCompact, otherCompact);
  const similarity = editSimilarity(parodyCompact, otherCompact);
  const prefix = sharedPrefixLength(parodyCompact, otherCompact);
  const longer = Math.max(parodyCompact.length, otherCompact.length);
  return {
    distance,
    similarity,
    prefix,
    prefixRatio: longer ? prefix / longer : 0,
    remainder: longer - prefix,
  };
}

/**
 * @param {ReturnType<typeof describePair>} pair
 * @param {{ generic?: boolean }} [options]
 * @returns {'high' | 'medium' | null}
 */
function riskFromPair(pair, options = {}) {
  if (!pair || options.generic) return null;
  if (pair.similarity >= RISK_THRESHOLDS.editHigh && pair.prefix >= 4) return 'high';
  if (pair.prefix >= RISK_THRESHOLDS.prefixMin && pair.remainder <= RISK_THRESHOLDS.prefixRemainderHigh && pair.prefixRatio >= 0.75) {
    return 'high';
  }
  if (pair.similarity >= RISK_THRESHOLDS.editMedium) return 'medium';
  if (pair.prefix >= RISK_THRESHOLDS.prefixMin && pair.prefixRatio >= RISK_THRESHOLDS.prefixRatio) return 'medium';
  return null;
}

/**
 * @param {string} parodyCompact
 */
function closeLexiconNames(parodyCompact) {
  if (parodyCompact.length < 4) return [];
  /** @type {object[]} */
  const hits = [];
  const seen = new Set();
  for (const entry of FRANCHISE_TERMS) {
    if (entry.ambiguous) continue;
    const phrase = compactName(entry.phrase);
    if (phrase.length < 6 || phrase === parodyCompact) continue;
    const key = `${entry.family}:${phrase}`;
    if (seen.has(key)) continue;
    const pair = describePair(parodyCompact, phrase);
    let risk = riskFromPair(pair);
    if (pair.similarity >= RISK_THRESHOLDS.lexiconHigh) risk = 'high';
    else if (!risk && pair.similarity >= RISK_THRESHOLDS.lexiconMedium) risk = 'medium';
    if (phoneticMatch(parodyCompact, phrase) && pair.similarity >= RISK_THRESHOLDS.phoneticWithEdit) risk = 'high';
    else if (phoneticMatch(parodyCompact, phrase) && !risk) risk = 'medium';
    if (!risk) continue;
    seen.add(key);
    hits.push({ label: entry.label, phrase: entry.phrase, similarity: pair.similarity, prefix: pair.prefix, risk, ambiguous: false });
  }
  return hits;
}

/**
 * @param {string} name
 */
function lexiconIdentity(name) {
  const compact = compactName(name);
  const norm = normalizeName(name);
  return FRANCHISE_TERMS.find((entry) => !entry.ambiguous && (compactName(entry.phrase) === compact || normalizeName(entry.phrase) === norm)) || null;
}

/**
 * @param {string} name
 */
function isGenericLabel(name) {
  const parts = tokens(name).filter((token) => !STOPWORDS.has(token));
  return parts.length > 0 && parts.every((token) => GENERIC_TOKENS.has(token));
}

/**
 * @param {string} parody
 * @param {string} original
 */
/**
 * The inspiration name, not the sentence that explains it.
 * @param {string} value
 */
function inspirationLabel(value) {
  const head = String(value || '').split(/[,;:]/)[0].trim();
  const words = head.split(/\s+/).filter(Boolean);
  if (words.length > 6) return words.slice(0, 4).join(' ');
  return head;
}

function sharedDistinctive(parody, original) {
  if (!original) return [];
  const right = new Set(tokens(original).filter((token) => token.length >= 5 && !GENERIC_TOKENS.has(token) && !STOPWORDS.has(token)));
  return tokens(parody).filter((token) => token.length >= 5 && right.has(token) && !GENERIC_TOKENS.has(token));
}

/**
 * @param {object[]} hits
 */
function dedupeHits(hits) {
  const seen = new Set();
  /** @type {object[]} */
  const out = [];
  for (const hit of hits) {
    const key = `${hit.family}:${normalizeName(hit.phrase)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

/**
 * @param {object} details
 */
function buildFix(details) {
  if (details.canon) return `Rename it. “${details.canon.name}” is already a locked name in this game.`;
  if (details.verbatim) {
    const target = details.original || details.franchiseHits[0]?.label || 'the original';
    return `Retire this name. Keep “${target}” in the research block and coin a new name a player can say without quoting the original.`;
  }
  if (details.styleCopy || details.visualHits.some((hit) => hit.complete)) {
    const cues = details.visualHits.map((hit) => hit.label).join('; ') || 'the studio style reference';
    return `Redraw it. Drop these cues: ${cues}. Keep the archetype (slime, knight, beast) and invent a silhouette that is not that design.`;
  }
  if (details.franchiseHits.length > 0) {
    const label = details.franchiseHits[0].label;
    return `Remove “${label}” from the name, title, ability, and prompt. The research block can name the inspiration; the card the player reads cannot.`;
  }
  if (details.risk === 'medium') {
    const who = details.original || 'the inspiration';
    return `Move the joke one step further so the card still works for a player who has never met “${who}”.`;
  }
  if (details.genericPair) return 'Give the generic creature a coined name. The archetype can stay.';
  return 'No IP rename suggested by the heuristic. Keep research facts and the invented name in separate fields.';
}
