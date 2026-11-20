import { SENSITIVITY_TERMS } from './lexicon.mjs';

const LEVEL_RANK = { note: 0, review: 1, high: 2 };

/**
 * @param {object} record
 */
export function assessSensitivity(record) {
  if (!record || record.parseError) return null;
  const nameBlob = [
    record.parodyName, record.thaiName, record.bossTitle, record.originalName,
    record.role === 'creative' ? record.comedyConcept : '',
    record.role === 'creative' ? record.ability : '',
  ].filter(Boolean).join('\n');
  const bodyBlob = [
    record.visualIdentity, record.artworkPrompt, record.silhouette, record.lore,
    record.personality, record.signatureTrait, record.facts?.join('\n'),
    record.role === 'creative' ? '' : record.comedyConcept,
  ].filter(Boolean).join('\n');
  if (!nameBlob.trim() && !bodyBlob.trim()) return null;

  /** @type {object[]} */
  const hits = [];
  for (const term of SENSITIVITY_TERMS) {
    const inName = testPattern(term.pattern, nameBlob);
    const inBody = testPattern(term.pattern, bodyBlob);
    if (!inName && !inBody) continue;
    let level = record.role === 'creative' ? term.creative : term.research;
    if (inName && term.category === 'stereotype') level = 'high';
    if (inName && term.category === 'tragedy') level = 'high';
    if (inName && term.category === 'sacred' && record.role === 'creative') {
      level = term.creative === 'high' ? 'high' : 'high';
    }
    if (inName && term.category === 'sacred' && record.role !== 'creative') level = 'note';
    if (!inName && term.category === 'stereotype') level = 'high';
    hits.push({
      id: term.id,
      category: term.category,
      level,
      where: inName ? 'name' : 'body',
      note: term.note,
    });
  }
  if (hits.length === 0) return null;
  const worst = hits.reduce((current, hit) => (LEVEL_RANK[hit.level] > LEVEL_RANK[current] ? hit.level : current), 'note');
  const priority = worst === 'high' ? 'P1' : (worst === 'review' ? 'P2' : null);
  const fix = hits.find((hit) => hit.level === worst)?.note || '';
  return {
    agent: record.agent,
    id: record.id,
    path: record.path,
    ref: record.ref,
    sha: record.sha,
    role: record.role,
    name: record.parodyName || record.originalName || record.bossTitle || '',
    level: worst,
    priority,
    hits,
    reason: hits.map((hit) => `${hit.category}/${hit.id} (${hit.level}, ${hit.where})`).join('; '),
    suggestedFix: fix,
  };
}

/**
 * @param {object[]} records
 */
export function assessAllSensitivity(records) {
  return records.map(assessSensitivity).filter(Boolean).sort((a, b) => (
    priorityRank(a.priority) - priorityRank(b.priority) || a.agent.localeCompare(b.agent) || a.id.localeCompare(b.id)
  ));
}

/**
 * @param {RegExp} pattern
 * @param {string} text
 */
function testPattern(pattern, text) {
  if (!text) return false;
  pattern.lastIndex = 0;
  return pattern.test(text);
}

/**
 * @param {string | null} priority
 */
function priorityRank(priority) {
  if (priority === 'P0') return 0;
  if (priority === 'P1') return 1;
  if (priority === 'P2') return 2;
  return 3;
}
