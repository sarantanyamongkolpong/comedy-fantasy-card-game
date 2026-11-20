/**
 * Cross-record checks the JSON Schema cannot express:
 * duplicate names and concepts, IP overlap, faction/rarity consistency,
 * sourceUrl membership, and combat numbers hiding in prose.
 */

import {
  FACTION_IDS,
  GACHA_POOLS,
  NON_FACTION_AFFILIATIONS,
  RARITIES,
  SIMILARITY,
  defaultEnemyId,
} from './constants.mjs';
import {
  TROPE_WORDS,
  compactName,
  conceptTokens,
  dice,
  formatScore,
  jaccard,
  nameStem,
  normalizeName,
  recolourKey,
} from './normalize.mjs';

const FORBIDDEN_KEY = /^(hp|maxhp|hpmax|atk|def|spd|pow|damage|dmg|attack|defense|speed|crit|critrate|accuracy|evasion|armor|exp|xp|weight|weights|rate|rates|pity|droprate|baseatk|basedef|basespd)$/i;

const PROSE_STAT = /\b\d+(?:\.\d+)?\s*(?:hp|atk|def|spd|pow|damage|dmg)\b|\b(?:hp|atk|def|spd|pow|damage|dmg)\s*[:=]?\s*\d+/iu;

/**
 * @param {object[]} records
 * @returns {import('./findings.mjs').Finding[]}
 */
export function auditRecords(records) {
  /** @type {import('./findings.mjs').Finding[]} */
  const findings = [];
  records.forEach((record, index) => {
    const path = recordPath(record, index);
    walkForbidden(record, path, findings, record);
    auditProse(record, path, findings);
    auditSourceUrl(record, path, findings);
    auditFaction(record, path, findings);
    auditRarity(record, path, findings);
    auditIp(record, path, findings);
    auditStatusWord(record, path, findings);
  });
  auditPairs(records, findings);
  auditReservedIds(records, findings);
  return findings;
}

/**
 * @param {object} record
 * @param {number} index
 */
export function recordPath(record, index) {
  if (typeof record?.monsterId === 'string' && record.monsterId.length > 0) return record.monsterId;
  return `record[${index}]`;
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {import('./findings.mjs').Finding[]} findings
 * @param {object} record
 */
function walkForbidden(value, path, findings, record) {
  if (value == null) return;
  if (typeof value === 'number') {
    findings.push(finding(record, 'error', 'STAT_NUMBER', path, `${path} is a number. Research records do not carry combat stats or rates.`));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForbidden(item, `${path}/${index}`, findings, record));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}/${key}`;
      if (FORBIDDEN_KEY.test(key)) {
        findings.push(finding(record, 'error', 'FORBIDDEN_FIELD', childPath, `${key} is a combat or gacha field. Leave it out of the research record.`));
      }
      walkForbidden(child, childPath, findings, record);
    }
  }
}

function auditProse(record, path, findings) {
  const blocks = [
    ['creative', record.creative],
    ['boss', record.boss],
  ];
  for (const [blockName, block] of blocks) {
    if (!block || typeof block !== 'object') continue;
    for (const [key, value] of Object.entries(block)) {
      if (typeof value !== 'string') continue;
      if (PROSE_STAT.test(value)) {
        findings.push(finding(
          record,
          'error',
          'PROSE_STAT',
          `${path}/${blockName}/${key}`,
          `${blockName}.${key} mentions a combat number. Describe the idea without HP, ATK, DEF, SPD, POW, or damage figures.`,
        ));
      }
    }
  }
}

function auditSourceUrl(record, path, findings) {
  const research = record.research;
  if (!research || typeof research !== 'object' || !Array.isArray(research.sources)) return;
  const urls = research.sources
    .map((source) => (source && typeof source.url === 'string' ? source.url : null))
    .filter(Boolean);
  if (typeof research.sourceUrl === 'string' && urls.length > 0 && !urls.includes(research.sourceUrl)) {
    findings.push(finding(
      record,
      'error',
      'SOURCE_URL_NOT_LISTED',
      `${path}/research/sourceUrl`,
      'sourceUrl must be one of research.sources[].url.',
    ));
  }
  const seen = new Set();
  for (const url of urls) {
    if (seen.has(url)) {
      findings.push(finding(record, 'warning', 'DUPLICATE_SOURCE', `${path}/research/sources`, `Source URL listed more than once: ${url}`));
      break;
    }
    seen.add(url);
  }
}

function auditFaction(record, path, findings) {
  const affiliation = record.creative?.factionAffiliation ?? null;
  const hooked = record.hooks?.factionId ?? null;
  if (!hooked) return;
  const fromName = typeof affiliation === 'string' ? (FACTION_IDS[affiliation] ?? null) : null;
  if (fromName && hooked !== fromName) {
    findings.push(finding(
      record,
      'error',
      'FACTION_MISMATCH',
      `${path}/hooks/factionId`,
      `hooks.factionId ${hooked} does not match ${affiliation} (${fromName}).`,
    ));
    return;
  }
  if (NON_FACTION_AFFILIATIONS.includes(affiliation)) {
    findings.push(finding(
      record,
      'error',
      'FACTION_MISMATCH',
      `${path}/hooks/factionId`,
      `${affiliation} is not one of the four factions, so hooks.factionId must be null.`,
    ));
  }
}

function auditRarity(record, path, findings) {
  for (const [pointer, value] of [
    ['creative/suggestedRarity', record.creative?.suggestedRarity],
    ['hooks/rarity', record.hooks?.rarity],
  ]) {
    if (value === 'FAC') {
      findings.push(finding(
        record,
        'error',
        'RARITY_FAC',
        `${path}/${pointer}`,
        'FAC is an action-card rarity (CORE-025), not a monster rarity. Use N, R, Epic, or EX.',
      ));
    }
  }
  const suggested = record.creative?.suggestedRarity ?? null;
  const hooked = record.hooks?.rarity ?? null;
  if (suggested && hooked && suggested !== hooked) {
    findings.push(finding(
      record,
      'warning',
      'RARITY_MISMATCH',
      `${path}/hooks/rarity`,
      `hooks.rarity is ${hooked} and suggestedRarity is ${suggested}. The import uses the hook.`,
    ));
  }
}

function auditStatusWord(record, path, findings) {
  if (record.status === 'LOCKED' || record.status === 'OWNER_APPROVED') {
    findings.push(finding(
      record,
      'error',
      'STATUS_FORBIDDEN',
      `${path}/status`,
      `${record.status} is not a research status. Use RESEARCH, PROPOSED, or QA_PASSED.`,
    ));
  }
}

function auditIp(record, path, findings) {
  const risk = record.ipRisk;
  if (risk === 'blocked') {
    findings.push(finding(
      record,
      'error',
      'IP_BLOCKED',
      `${path}/ipRisk`,
      'ipRisk is blocked. Do not produce this entry. Rewrite it so it is not a protected name or a copied character.',
    ));
  } else if (risk === 'high') {
    findings.push(finding(
      record,
      'warning',
      'IP_HIGH',
      `${path}/ipRisk`,
      record.status === 'QA_PASSED'
        ? 'ipRisk stays high after QA_PASSED. Confirm the parody is still its own design.'
        : 'ipRisk is high. QA should confirm the parody is not too close to the source.',
    ));
  }
  const overlap = protectedOverlap(record);
  if (!overlap) return;
  const disclosed = risk === 'high' || risk === 'blocked';
  findings.push(finding(
    record,
    disclosed ? 'warning' : 'error',
    'IP_PROTECTED_NAME',
    `${path}/creative/nameEn`,
    `Parody name still carries protected inspiration text (${overlap}).`,
  ));
}

/**
 * @param {object} record
 * @returns {string | null}
 */
export function protectedOverlap(record) {
  if (record?.research?.protectedName !== true) return null;
  const inspiration = normalizeName(record.research.originalInspiration);
  const parody = normalizeName(record.creative?.nameEn);
  if (!inspiration || !parody) return null;
  const words = inspiration.split(' ').filter(Boolean);
  if (words.length === 0 || words.length > 6) return null;
  if (words.length >= 2 && inspiration.length >= 8 && parody.includes(inspiration)) return inspiration;
  const hits = words.filter((word) => word.length >= 4 && !TROPE_WORDS.has(word) && parody.split(' ').includes(word));
  return hits.length > 0 ? hits.join(', ') : null;
}

/**
 * @param {object[]} records
 * @param {import('./findings.mjs').Finding[]} findings
 */
function auditPairs(records, findings) {
  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      comparePair(records[left], left, records[right], right, findings);
    }
  }
}

function comparePair(left, leftIndex, right, rightIndex, findings) {
  const leftEn = compactName(left.creative?.nameEn);
  const rightEn = compactName(right.creative?.nameEn);
  const leftTh = compactName(left.creative?.nameTh);
  const rightTh = compactName(right.creative?.nameTh);
  const sameEn = leftEn.length > 0 && leftEn === rightEn;
  const sameTh = leftTh.length > 0 && leftTh === rightTh;
  if (sameEn || sameTh) {
    const which = [sameEn ? 'English' : null, sameTh ? 'Thai' : null].filter(Boolean).join(' and ');
    findings.push(pairFinding(left, right, 'error', 'DUPLICATE_NAME', `Normalized ${which} names match.`, '1.000'));
  } else if (leftEn && rightEn && nameStem(left.creative?.nameEn) === nameStem(right.creative?.nameEn)) {
    findings.push(pairFinding(left, right, 'error', 'DUPLICATE_NAME_SUFFIX', 'Names match once a trailing number is removed. Number suffixes are not new monsters.', null));
  } else if (leftEn && rightEn && recolourKey(left.creative?.nameEn) === recolourKey(right.creative?.nameEn)) {
    findings.push(pairFinding(left, right, 'error', 'RECOLOUR', 'Names match once a colour word is removed. Recolours are not new monsters.', null));
  } else if (leftEn && rightEn) {
    const score = Math.max(
      dice(normalizeName(left.creative?.nameEn), normalizeName(right.creative?.nameEn)),
      dice(normalizeName(left.creative?.nameTh), normalizeName(right.creative?.nameTh)),
    );
    if (score >= SIMILARITY.nameError) {
      findings.push(pairFinding(left, right, 'error', 'SIMILAR_NAME', 'Names are too close.', formatScore(score)));
    } else if (score >= SIMILARITY.nameWarning) {
      findings.push(pairFinding(left, right, 'warning', 'SIMILAR_NAME', 'Names are similar. Confirm they are different creatures.', formatScore(score)));
    }
  }

  const leftTokens = conceptTokens(conceptText(left));
  const rightTokens = conceptTokens(conceptText(right));
  const score = jaccard(leftTokens, rightTokens);
  if (score >= SIMILARITY.conceptError) {
    findings.push(pairFinding(left, right, 'error', 'SIMILAR_CONCEPT', 'Comedy concept, silhouette, and ability overlap.', formatScore(score)));
  } else if (score >= SIMILARITY.conceptWarning) {
    findings.push(pairFinding(left, right, 'warning', 'SIMILAR_CONCEPT', 'Concepts share a lot of words. Confirm they are distinct.', formatScore(score)));
  }
  void leftIndex;
  void rightIndex;
}

/** @param {object} record */
export function conceptText(record) {
  const creative = record?.creative && typeof record.creative === 'object' ? record.creative : {};
  const boss = record?.boss && typeof record.boss === 'object' ? record.boss : {};
  return [
    creative.comedyConcept,
    creative.signatureTrait,
    creative.signatureAbilityConcept,
    creative.visualIdentity,
    creative.creatureType,
    boss.bossTitle,
    boss.entranceConcept,
    boss.signatureSilhouette,
    boss.signatureMechanic,
    boss.phaseTransformationConcept,
    boss.uniqueLootTheme,
  ].filter((value) => typeof value === 'string').join(' ');
}

function auditReservedIds(records, findings) {
  const enemyIds = new Map();
  const cardIds = new Map();
  for (const record of records) {
    const enemyId = record.hooks?.enemyId ?? defaultEnemyId(record.monsterId);
    if (typeof enemyId === 'string' && enemyId.length > 0) {
      const previous = enemyIds.get(enemyId);
      if (previous) {
        findings.push(pairFinding(previous, record, 'error', 'DUPLICATE_ENEMY_ID', `Both records reserve enemy id ${enemyId}.`, null));
      } else {
        enemyIds.set(enemyId, record);
      }
    }
    const cardId = record.hooks?.cardId ?? null;
    if (typeof cardId === 'string' && cardId.length > 0) {
      const previous = cardIds.get(cardId);
      if (previous) {
        findings.push(pairFinding(previous, record, 'error', 'DUPLICATE_CARD_ID', `Both records reserve card id ${cardId}.`, null));
      } else {
        cardIds.set(cardId, record);
      }
    }
    const pool = record.hooks?.gachaPool ?? null;
    const rarity = record.hooks?.rarity ?? record.creative?.suggestedRarity ?? null;
    if (typeof pool === 'string' && GACHA_POOLS.includes(pool) && !RARITIES.includes(rarity)) {
      findings.push(finding(record, 'warning', 'GACHA_POOL_WITHOUT_RARITY', `${recordPath(record, 0)}/hooks/gachaPool`, 'gachaPool is set but there is no N/R/Epic/EX rarity to attach. The export omits the suggestion.'));
    }
  }
}

function pairFinding(left, right, severity, code, message, score) {
  const leftId = typeof left.monsterId === 'string' ? left.monsterId : null;
  const rightId = typeof right.monsterId === 'string' ? right.monsterId : null;
  return {
    severity,
    code,
    path: leftId && rightId ? `${leftId}..${rightId}` : 'records',
    message,
    monsterId: leftId,
    otherMonsterId: rightId,
    score,
  };
}

function finding(record, severity, code, path, message) {
  return {
    severity,
    code,
    path,
    message,
    monsterId: typeof record?.monsterId === 'string' ? record.monsterId : null,
    otherMonsterId: null,
    score: null,
  };
}
