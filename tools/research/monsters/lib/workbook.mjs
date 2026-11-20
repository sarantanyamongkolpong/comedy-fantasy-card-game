/**
 * Nine-sheet workbook named by the brief.
 * The ninth sheet keeps the brief's slash. OOXML discourages "/" in sheet
 * names; the title is still written exactly so the file matches the brief.
 */

import { CATEGORIES, CATEGORY_SHEET, SHEET_NAMES } from './constants.mjs';
import { buildXlsx } from './xlsx.mjs';

const MASTER = [
  ['Monster ID', (row) => row.monsterId, 18],
  ['Status', (row) => row.status, 14],
  ['Parody Name (EN)', (row) => row.creative?.nameEn, 28],
  ['Thai name', (row) => row.creative?.nameTh, 24],
  ['Original Inspiration/Source', (row) => row.research?.originalInspiration, 32],
  ['Source URL', (row) => row.research?.sourceUrl, 42],
  ['Monster Category', (row) => row.category, 16],
  ['Creature Type', (row) => row.creative?.creatureType, 28],
  ['Visual Identity', (row) => row.creative?.visualIdentity, 42],
  ['Personality', (row) => row.creative?.personality, 36],
  ['Signature Trait', (row) => row.creative?.signatureTrait, 36],
  ['Comedy Concept', (row) => row.creative?.comedyConcept, 42],
  ['Humor Type', (row) => row.creative?.humorType, 24],
  ['Element/Attribute', (row) => row.creative?.element, 18],
  ['Combat Archetype', (row) => row.creative?.combatArchetype, 24],
  ['Signature Ability Concept', (row) => row.creative?.signatureAbilityConcept, 42],
  ['Weakness Concept', (row) => row.creative?.weaknessConcept, 36],
  ['Lore Summary', (row) => row.creative?.loreSummary, 42],
  ['Faction Affiliation', (row) => row.creative?.factionAffiliation, 22],
  ['Suggested Rarity', (row) => row.creative?.suggestedRarity, 16],
  ['Suggested Tower Environment', (row) => row.creative?.suggestedTowerEnvironment, 36],
  ['Artwork Prompt Concept', (row) => row.creative?.artworkPromptConcept, 42],
  ['IP Similarity Risk', (row) => row.ipRisk, 18],
  ['Research Confidence', (row) => row.research?.confidence, 18],
  ['Inspiration ID', (row) => row.research?.inspirationId, 16],
  ['Origin', (row) => row.research?.origin, 28],
  ['Inspiration Kind', (row) => row.research?.kind, 16],
  ['Protected Name', (row) => row.research?.protectedName, 16],
  ['Public Domain', (row) => row.research?.publicDomain, 16],
  ['Research Facts', (row) => Array.isArray(row.research?.facts) ? row.research.facts.join('\n') : '', 42],
  ['Boss Title', (row) => row.boss?.bossTitle, 28],
  ['Entrance Concept', (row) => row.boss?.entranceConcept, 36],
  ['Signature Silhouette', (row) => row.boss?.signatureSilhouette, 36],
  ['Personality/Motivation', (row) => row.boss?.personalityMotivation, 36],
  ['Signature Mechanic', (row) => row.boss?.signatureMechanic, 36],
  ['Phase Transformation Concept', (row) => row.boss?.phaseTransformationConcept, 36],
  ['Defeat Animation Concept', (row) => row.boss?.defeatAnimationConcept, 36],
  ['Unique Loot Theme', (row) => row.boss?.uniqueLootTheme, 32],
  ['Hook cardId', (row) => row.hooks?.cardId, 22],
  ['Hook enemyId', (row) => row.hooks?.enemyId, 18],
  ['Hook rarity', (row) => row.hooks?.rarity, 14],
  ['Hook role', (row) => row.hooks?.role, 14],
  ['Hook factionId', (row) => row.hooks?.factionId, 16],
  ['Hook gachaPool', (row) => row.hooks?.gachaPool, 16],
];

const SOURCE_HEADERS = [
  'Monster ID',
  'Parody Name (EN)',
  'Monster Category',
  'Source URL',
  'Source Title',
  'Accessed',
  'Supports',
  'Research Confidence',
];

const AUDIT_HEADERS = [
  'Severity',
  'Code',
  'Path',
  'Monster ID',
  'Name',
  'Other Monster ID',
  'Other Name',
  'Score',
  'Detail',
];

/**
 * @param {{ records: object[], errors: object[], warnings: object[], notes: object[] }} result
 * @returns {Buffer}
 */
export function buildWorkbook(result) {
  const records = result.records ?? [];
  const masterRows = [MASTER.map(([header]) => header), ...records.map(masterRow)];
  const widths = MASTER.map(([, , width]) => width);
  const sheets = [
    { name: SHEET_NAMES[0], rows: masterRows, widths },
  ];
  for (const category of CATEGORIES) {
    const subset = records.filter((record) => record.category === category);
    sheets.push({
      name: CATEGORY_SHEET[category],
      rows: [MASTER.map(([header]) => header), ...subset.map(masterRow)],
      widths,
    });
  }
  sheets.push({ name: SHEET_NAMES[7], rows: sourceRows(records), widths: [18, 28, 16, 42, 36, 14, 42, 18] });
  sheets.push({ name: SHEET_NAMES[8], rows: auditRows(result), widths: [12, 24, 36, 18, 28, 18, 28, 10, 64] });
  if (sheets.map((sheet) => sheet.name).join('|') !== SHEET_NAMES.join('|')) {
    throw new Error('Workbook sheet names drifted from the brief');
  }
  return buildXlsx(sheets);
}

/** @param {object} record */
function masterRow(record) {
  return MASTER.map(([, read]) => cell(read(record)));
}

/** @param {object[]} records */
function sourceRows(records) {
  const rows = [SOURCE_HEADERS];
  for (const record of records) {
    const sources = Array.isArray(record.research?.sources) ? record.research.sources : [];
    for (const source of sources) {
      rows.push([
        cell(record.monsterId),
        cell(record.creative?.nameEn),
        cell(record.category),
        cell(source?.url),
        cell(source?.title),
        cell(source?.accessed),
        cell(source?.supports),
        cell(record.research?.confidence),
      ]);
    }
  }
  return rows;
}

/**
 * @param {{ records?: object[], errors?: object[], warnings?: object[], notes?: object[] }} result
 */
function auditRows(result) {
  const records = result.records ?? [];
  const findings = [
    ...(result.errors ?? []).map((item) => ({ ...item, severity: 'error' })),
    ...(result.warnings ?? []).map((item) => ({ ...item, severity: 'warning' })),
    ...(result.notes ?? []).map((item) => ({ ...item, severity: 'info' })),
  ];
  const rank = { error: 0, warning: 1, info: 2 };
  findings.sort((left, right) => (
    (rank[left.severity] ?? 9) - (rank[right.severity] ?? 9)
    || String(left.code).localeCompare(String(right.code))
    || String(left.monsterId ?? '').localeCompare(String(right.monsterId ?? ''))
  ));
  const rows = [AUDIT_HEADERS];
  for (const item of findings) {
    rows.push([
      item.severity.toUpperCase(),
      cell(item.code),
      cell(item.path),
      cell(item.monsterId),
      nameOf(records, item.monsterId),
      cell(item.otherMonsterId),
      nameOf(records, item.otherMonsterId),
      cell(item.score),
      cell(item.message),
    ]);
  }
  return rows;
}

function nameOf(records, id) {
  if (typeof id !== 'string' || id.length === 0) return '';
  const record = records.find((item) => item.monsterId === id);
  return cell(record?.creative?.nameEn);
}

function cell(value) {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}
