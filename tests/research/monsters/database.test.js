import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { adaptDocument, canonicalMonsterId, normalizeCategory } from '../../../tools/research/monsters/lib/adapt.mjs';
import { auditRecords } from '../../../tools/research/monsters/lib/audit.mjs';
import { assemble } from '../../../tools/research/monsters/lib/assemble.mjs';
import { defaultEnemyId } from '../../../tools/research/monsters/lib/constants.mjs';
import { repoRoot } from '../../../tools/research/monsters/lib/cli.mjs';
import { dice, jaccard, normalizeName } from '../../../tools/research/monsters/lib/normalize.mjs';
import {
  loadSchema,
  validateDatabase,
  validateMonster,
} from '../../../tools/research/monsters/lib/schema-check.mjs';
import { readXlsx } from '../../../tools/research/monsters/lib/xlsx.mjs';
import example from '../../../docs/research/monsters/schema/examples/sample-database.json' with { type: 'json' };

const schemaPath = join(repoRoot, 'docs/research/monsters/schema/monster.schema.json');
const examplePath = join(repoRoot, 'docs/research/monsters/schema/examples/sample-database.json');
const schema = loadSchema(schemaPath);
const SHEETS = [
  'Master Monster Database',
  'Normal Monsters',
  'Elite Monsters',
  'Mini Bosses',
  'Main Bosses',
  'World Bosses',
  'Secret Bosses',
  'Research Sources',
  'Duplicate / IP Risk Audit',
];

function cloneRecord(index = 0, patch = {}) {
  return merge(structuredClone(example.records[index]), patch);
}

function merge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value) || value === null || typeof value !== 'object') target[key] = value;
    else target[key] = merge(target[key] && typeof target[key] === 'object' ? target[key] : {}, value);
  }
  return target;
}

function database(records) {
  return { schemaVersion: 'monster-research-1', contentTier: 'research', records };
}

function writeTemp(name, value) {
  const dir = mkdtempSync(join(tmpdir(), 'monster-research-'));
  const file = join(dir, name);
  writeFileSync(file, JSON.stringify(value, null, 2));
  return file;
}

function runTool(script, args) {
  return spawnSync(process.execPath, [join(repoRoot, script), ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function codes(result) {
  return result.errors.map((item) => item.code);
}

test('schema document is draft 2020-12 and has no combat stat fields', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.$id, 'monster.schema.json');
  const names = [];
  collectPropertyNames(schema, names);
  for (const name of names) {
    assert.equal(/^(hp|atk|def|spd|pow|damage|dmg|weight|weights|pity)$/i.test(name), false, name);
  }
});

test('sample database and each record satisfy the schema', () => {
  assert.deepEqual(validateDatabase(schema, example), []);
  for (const record of example.records) assert.deepEqual(validateMonster(schema, record), []);
  const result = assemble({ inputs: [examplePath], schemaPath });
  assert.equal(result.ok, true, result.errors.map((item) => item.message).join('\n'));
  assert.equal(result.records.length, 6);
});

test('status, rarity, prefix, and boss shape are enforced', () => {
  const locked = cloneRecord(0, { status: 'LOCKED' });
  assert.ok(validateMonster(schema, locked).some((error) => error.message.includes('LOCKED')));
  assert.ok(auditRecords([locked]).some((item) => item.code === 'STATUS_FORBIDDEN'));

  const approved = cloneRecord(0, { status: 'OWNER_APPROVED' });
  assert.ok(validateMonster(schema, approved).length > 0);

  const fac = cloneRecord(0, { creative: { suggestedRarity: 'FAC' } });
  assert.ok(validateMonster(schema, fac).some((error) => error.keyword === 'enum'));
  assert.ok(auditRecords([fac]).some((item) => item.code === 'RARITY_FAC'));

  const wrongPrefix = cloneRecord(0, { monsterId: 'MON-ELT-0001' });
  assert.ok(validateMonster(schema, wrongPrefix).some((error) => error.keyword === 'pattern'));

  const bossOnNormal = cloneRecord(0, { boss: cloneRecord(2).boss });
  assert.ok(validateMonster(schema, bossOnNormal).some((error) => error.path.endsWith('/boss')));

  const mini = cloneRecord(2, { boss: null });
  assert.ok(validateMonster(schema, mini).some((error) => error.path.endsWith('/boss')));
});

test('numbers and combat fields are rejected', () => {
  const numbered = cloneRecord(0);
  numbered.atk = 12;
  const file = writeTemp('numbered.json', database([numbered]));
  const result = assemble({ inputs: [file], schemaPath });
  assert.ok(codes(result).includes('FORBIDDEN_FIELD'));
  assert.equal(result.records[0].atk, 12);

  const prose = cloneRecord(0, { creative: { signatureAbilityConcept: 'It deals 50 damage to the front foe and then bows.' } });
  assert.ok(auditRecords([prose]).some((item) => item.code === 'PROSE_STAT'));
});

test('duplicate names, suffixes, recolours, and concepts are reported', () => {
  assert.equal(normalizeName(' The Mopwick! '), 'mopwick');
  assert.ok(dice('slime knight', 'slime knights') >= 0.86);
  assert.equal(jaccard(['bucket', 'imp'], ['bucket', 'imp']), 1);

  const suffix = cloneRecord(0, {
    monsterId: 'MON-NRM-0002',
    creative: {
      nameEn: 'Mopwick the Bucket Imp 2',
      nameTh: 'คนละชื่อ',
      comedyConcept: 'A completely separate joke about overdue library fines and quiet shelves.',
      signatureTrait: 'Whispers call numbers at empty chairs.',
      signatureAbilityConcept: 'Sorts the party into alphabetical order and refuses to continue.',
      visualIdentity: 'A thin paper ribbon with reading glasses and ink-stained cuffs.',
      creatureType: 'ribbon clerk',
    },
  });
  const suffixResult = auditRecords([cloneRecord(0), suffix]);
  assert.ok(suffixResult.some((item) => item.code === 'DUPLICATE_NAME_SUFFIX' && item.severity === 'error'));

  const red = cloneRecord(0, {
    monsterId: 'MON-NRM-0003',
    creative: {
      nameEn: 'Red Lantern Toad',
      nameTh: 'คางคกแดง',
      comedyConcept: 'A toad that rents lanterns by the evening and repossesses them at dawn.',
      signatureTrait: 'Croaks in perfect receipts.',
      signatureAbilityConcept: 'Hangs a lantern on a foe and invoices the glow.',
      visualIdentity: 'A round toad in a clerk vest carrying three paper lanterns.',
      creatureType: 'lantern toad',
    },
  });
  const blue = cloneRecord(0, {
    monsterId: 'MON-NRM-0004',
    creative: {
      nameEn: 'Blue Lantern Toad',
      nameTh: 'คางคกน้ำเงิน',
      comedyConcept: 'A river poet who misplaces every rhyme inside a teacup.',
      signatureTrait: 'Bows to bridges.',
      signatureAbilityConcept: 'Spills a teacup that becomes a tiny ferry.',
      visualIdentity: 'A slender heron in a travelling coat with a teacup for a hat.',
      creatureType: 'teacup heron',
    },
  });
  const recolour = auditRecords([red, blue]);
  assert.ok(recolour.some((item) => item.code === 'RECOLOUR'));

  const twin = cloneRecord(0, { monsterId: 'MON-NRM-0005', creative: { nameTh: 'อีกชื่อ' } });
  assert.ok(auditRecords([cloneRecord(0), twin]).some((item) => item.code === 'DUPLICATE_NAME'));

  const conceptTwin = cloneRecord(0, {
    monsterId: 'MON-NRM-0006',
    creative: { nameEn: 'Utterly Different Person', nameTh: 'คนใหม่สิ้นเชิง' },
  });
  assert.ok(auditRecords([cloneRecord(0), conceptTwin]).some((item) => item.code === 'SIMILAR_CONCEPT'));
});

test('sourceUrl must be one of the listed sources', () => {
  const drifted = cloneRecord(0, { research: { sourceUrl: 'https://example.com/monster-research-fixture/other' } });
  assert.ok(auditRecords([drifted]).some((item) => item.code === 'SOURCE_URL_NOT_LISTED'));
  assert.equal(defaultEnemyId('MON-WLB-0007'), 'ENM_WLB_0007');
});

test('protected names and blocked risk are audited', () => {
  const close = cloneRecord(0, {
    research: { protectedName: true, originalInspiration: 'Pikachu' },
    creative: { nameEn: 'Pikachu the Loud' },
    ipRisk: 'low',
  });
  assert.ok(auditRecords([close]).some((item) => item.code === 'IP_PROTECTED_NAME' && item.severity === 'error'));

  const blocked = cloneRecord(0, { ipRisk: 'blocked' });
  assert.ok(auditRecords([blocked]).some((item) => item.code === 'IP_BLOCKED'));
});

test('category aliases and brief column titles adapt into canonical records', () => {
  assert.equal(normalizeCategory('Secret / Comedy Boss'), 'Secret Boss');
  assert.equal(normalizeCategory('mini_boss'), 'Mini Boss');
  const normal = example.records[0];
  const elite = example.records[1];
  const mini = example.records[2];
  const file = writeTemp('sample_normal_elite.json', {
    agent: '06',
    kind: 'sample_normal_elite',
    entries: [briefRow(normal), briefRow(elite)],
  });
  const bosses = writeTemp('sample_bosses.json', {
    agent: '07',
    kind: 'sample_bosses',
    bosses: [briefRow(mini)],
  });
  const result = assemble({ inputs: [file, bosses], schemaPath });
  assert.equal(result.ok, true, result.errors.map((item) => `${item.code} ${item.message}`).join('\n'));
  assert.deepEqual(result.records.map((record) => record.monsterId), ['MON-ELT-0001', 'MON-MNB-0001', 'MON-NRM-0001']);
  assert.equal(result.records.find((record) => record.monsterId === 'MON-MNB-0001').boss.bossTitle, mini.boss.bossTitle);
});

test('lore, qa, and inspirations join without inventing sources', () => {
  const normal = cloneRecord(0);
  delete normal.research.facts;
  delete normal.research.sources;
  delete normal.research.sourceUrl;
  delete normal.research.originalInspiration;
  delete normal.research.confidence;
  delete normal.research.protectedName;
  delete normal.research.publicDomain;
  delete normal.research.origin;
  delete normal.research.kind;
  const monsters = writeTemp('partial.json', database([normal]));
  const inspirations = writeTemp('inspirations.json', [{
    inspirationId: 'INS-04-001',
    name: 'Household mop',
    origin: 'Structural fixture, not a field citation',
    kind: 'folklore',
    facts: [example.records[0].research.facts[0]],
    sources: example.records[0].research.sources,
    archetypeTags: ['fixture'],
    protectedName: false,
    publicDomain: true,
    parodyPotential: 'A mop can be an imp.',
    confidence: 'low',
  }]);
  const lore = writeTemp('sample_lore_links.json', {
    agent: '08',
    links: [{
      monsterId: 'MON-NRM-0001',
      factionAffiliation: 'Tower Guardian',
      loreSummary: 'Mira-shaped lore link: the imp guards a closet and does not join a faction army.',
      suggestedTowerEnvironment: 'Mysterious Tower, renamed mop closet',
      status: 'QA_PASSED',
    }],
  });
  const qa = writeTemp('sample_qa.json', {
    agent: '10',
    reviews: [{ monsterId: 'MON-NRM-0001', status: 'QA_PASSED', ipRisk: 'low', notes: 'Fixture note from QA.' }],
  });
  const result = assemble({ inputs: [monsters], lore: [lore], qa: [qa], inspirations: [inspirations], schemaPath });
  assert.equal(result.ok, true, [...result.errors, ...result.warnings].map((item) => `${item.code} ${item.message}`).join('\n'));
  const record = result.records[0];
  assert.equal(record.research.originalInspiration, 'Household mop');
  assert.equal(record.research.sources[0].url, example.records[0].research.sources[0].url);
  assert.equal(record.creative.factionAffiliation, 'Tower Guardian');
  assert.equal(record.status, 'QA_PASSED');
  assert.equal(result.notes[0].code, 'QA_NOTE');
  assert.ok(result.warnings.some((item) => item.code === 'LORE_IGNORED_STATUS'));

  const denied = writeTemp('qa-locked.json', { reviews: [{ monsterId: 'MON-NRM-0001', status: 'LOCKED' }] });
  const blocked = assemble({ inputs: [examplePath], qa: [denied], schemaPath });
  assert.ok(codes(blocked).includes('STATUS_FORBIDDEN'));
  assert.equal(blocked.records[0].status, 'PROPOSED');
});

test('unmapped fields are warnings and unknown files fail clearly', () => {
  const row = briefRow(example.records[0]);
  row.spareJoke = 'not a schema field';
  const adapted = adaptDocument({ entries: [row] }, 'agent06.json');
  assert.ok(adapted.records[0].warnings.some((item) => item.code === 'UNKNOWN_FIELD' && item.message.includes('spareJoke')));
  assert.equal(adapted.records[0].record.spareJoke, undefined);

  const loose = briefRow(example.records[0]);
  loose.atk = 9;
  const attacked = adaptDocument({ entries: [loose] }, 'agent06.json');
  assert.ok(attacked.records[0].errors.some((item) => item.code === 'FORBIDDEN_FIELD'));
  assert.equal(attacked.records[0].record.atk, undefined);

  const missing = assemble({ inputs: ['/tmp/does-not-exist-monster.json'], schemaPath });
  assert.equal(missing.exitCode, 2);
  assert.ok(missing.errors.some((item) => item.code === 'NOT_FOUND'));
});

test('agent 06 records rewrite onto canonical ids and strings', () => {
  assert.equal(canonicalMonsterId('M06-N-001'), 'MON-NRM-0001');
  assert.equal(canonicalMonsterId('M06-E-010'), 'MON-ELT-0010');
  assert.equal(canonicalMonsterId('MON-WLB-0007'), 'MON-WLB-0007');

  const fact = 'A fixture bestiary bull with inward horns is recorded so the adapter test has a sourced sentence.';
  const prose = 'It poses like a charger and then leaves a scorch mark the aisle has to step around.';
  const row = {
    monsterId: 'M06-N-001',
    status: 'PROPOSED',
    category: 'Normal Monster',
    research: {
      inspirationId: 'INS-02-001',
      originalInspiration: 'Bonnacon',
      origin: 'Medieval European bestiary',
      kind: 'folklore',
      domain: '02-western',
      facts: [fact],
      sources: [{
        url: 'https://example.com/monster-research-fixture/bonnacon',
        title: 'Fixture bestiary',
        accessed: '2026-11-20',
        supports: 'The fixture sentence above.',
      }],
      protectedName: false,
      publicDomain: true,
      confidence: 'high',
      copiedFrom: { agent: '02', file: 'inspirations.json' },
    },
    creative: {
      parodyNameEn: 'Curlhorn',
      thaiName: 'เขางุ้ม',
      punLanguage: 'both',
      humorType: 'Epic but Ridiculous',
      creatureType: 'bestiary bull',
      visualIdentity: 'A rust-brown bull with a black horse mane and horns curled back into its own pride.',
      personality: 'Immensely proud, easily startled, and convinced the pose is the victory.',
      signatureTrait: 'The horns cannot do the job the stance promises, so the retreat is the attack.',
      comedyConcept: prose,
      element: { attributeId: 'ATTR_STRIKE', name: 'Strike', note: 'Not a fire element.' },
      combatArchetype: 'Striker',
      signatureAbilityConcept: prose,
      weaknessConcept: 'If nobody chases, it stops to hold the pose and the trail goes cold.',
      loreSummary: 'The menagerie wrote it down as a war-beast. The horns disagree, and it keeps the job.',
      originId: 'ORG-WILD',
      originName: 'Wild Creature',
      factionAffiliation: null,
      suggestedRarity: 'N',
      towerEnvironment: {
        environmentId: 'ENV-TWR-08',
        name: 'The Menagerie of Unfiled Beasts',
        note: 'PROPOSED biome, not a floor number.',
      },
      artworkPromptConcept: 'An original rust-brown bull posing in straw, one scorch rake-mark behind it.',
      creativeBoundary: 'The sourced fact stays in research.',
    },
    ipSimilarityRisk: 'low',
    ipSimilarityReason: 'Public-domain bestiary bull.',
  };
  const elite = structuredClone(row);
  elite.monsterId = 'M06-E-003';
  elite.category = 'Elite Monster';
  elite.creative.parodyNameEn = 'Lidwall';
  elite.creative.thaiName = 'ฝาผนัง';
  elite.creative.creatureType = 'shield clerk';
  elite.creative.visualIdentity = 'A walking door wearing a pot lid as a breastplate, blocking a stair that is one step too proud.';
  elite.creative.personality = 'It refuses to let anyone pass until they have filed a compliment in triplicate.';
  elite.creative.signatureTrait = 'The lid is the whole argument, and it lowers it like a stamp.';
  elite.creative.comedyConcept = 'A reception desk that thinks it is a fortress and makes the party wait for a badge that does not exist.';
  elite.creative.signatureAbilityConcept = 'It drops the lid across the lane and will not lift it until every name is spelled wrong on purpose.';
  elite.creative.weaknessConcept = 'A sincere thank-you makes the lid tilt, and the stair is suddenly just a stair.';
  elite.creative.loreSummary = 'It clocks in at the landing and guards a door the tower already opened.';
  elite.creative.suggestedRarity = 'R';
  elite.creative.originId = 'ORG-FACTION';
  elite.creative.originName = 'Faction-aligned';
  elite.creative.factionAffiliation = {
    factionId: 'FAC_AEG',
    name: 'Aegis Dominion',
    role: 'Tank',
    note: 'The silhouette wears the locked Tank role.',
  };

  const file = writeTemp('sample_normal_elite.json', {
    documentId: 'PARODY-SAMPLE-NORMAL-ELITE',
    agent: '06',
    counts: { normal: 1, elite: 1 },
    entries: [row, elite],
  });
  const lore = writeTemp('sample_lore_links.json', {
    documentId: 'SAMPLE-LORE-LINKS',
    framework: 'docs/research/monsters/lore/framework.json',
    entries: [],
    environmentCrosswalk: [],
  });
  const result = assemble({ inputs: [file], lore: [lore], schemaPath });
  assert.equal(result.ok, true, [...result.errors, ...result.warnings].map((item) => `${item.code} ${item.path} ${item.message}`).join('\n'));
  assert.deepEqual(result.records.map((record) => record.monsterId), ['MON-ELT-0003', 'MON-NRM-0001']);
  const normal = result.records.find((record) => record.monsterId === 'MON-NRM-0001');
  assert.equal(normal.creative.nameEn, 'Curlhorn');
  assert.equal(normal.creative.nameTh, 'เขางุ้ม');
  assert.equal(normal.creative.element, 'Strike');
  assert.equal(normal.creative.factionAffiliation, 'Wild Creature');
  assert.equal(normal.creative.suggestedTowerEnvironment, 'The Menagerie of Unfiled Beasts');
  assert.equal(normal.research.sourceUrl, 'https://example.com/monster-research-fixture/bonnacon');
  assert.equal(normal.boss, null);
  assert.equal(normal.research.domain, undefined);
  const wall = result.records.find((record) => record.monsterId === 'MON-ELT-0003');
  assert.equal(wall.creative.factionAffiliation, 'Aegis Dominion');
  assert.equal(wall.hooks.factionId, 'FAC_AEG');
  assert.equal(wall.hooks.role, 'Tank');
  assert.ok(result.warnings.some((item) => item.code === 'LORE_EMPTY'));
});

test('commands build the workbook and the stat-free import JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'monster-out-'));
  const workbook = join(dir, 'monsters.xlsx');
  const imported = join(dir, 'monsters.import.json');
  const validate = runTool('tools/research/monsters/validate.mjs', ['--input', examplePath]);
  assert.equal(validate.status, 0, validate.stdout + validate.stderr);
  assert.match(validate.stdout, /Result: OK/);

  const book = runTool('tools/research/monsters/build-workbook.mjs', ['--input', examplePath, '--out', workbook]);
  assert.equal(book.status, 0, book.stdout + book.stderr);
  const sheets = readXlsx(readFileSync(workbook));
  assert.deepEqual(sheets.map((sheet) => sheet.name), SHEETS);
  assert.equal(sheets[0].rows.length, 7);
  assert.equal(sheets[1].rows.length, 2);
  assert.ok(sheets[0].rows.flat().includes('ม็อบวิค อิมพ์ถัง'));
  assert.ok(sheets[6].rows.flat().includes('Auditor of the Final Action'));
  assert.ok(sheets[7].rows.flat().includes('https://example.com/monster-research-fixture/mop'));
  assert.deepEqual(sheets[8].rows, [[
    'Severity', 'Code', 'Path', 'Monster ID', 'Name', 'Other Monster ID', 'Other Name', 'Score', 'Detail',
  ]]);

  const exported = runTool('tools/research/monsters/export-json.mjs', ['--input', examplePath, '--out', imported]);
  assert.equal(exported.status, 0, exported.stdout + exported.stderr);
  const body = JSON.parse(readFileSync(imported, 'utf8'));
  const hits = [];
  walk(body, '', hits);
  assert.deepEqual(hits, []);
  const enemies = body.gameImport.enemies.battle.enemies;
  assert.equal(body.gameImport.enemies.battle.battleId, null);
  assert.equal(body.gameImport.gacha.included, false);
  assert.equal(body.gameImport.gacha.suggestions.length, 0);
  assert.equal(enemies.find((enemy) => enemy.monsterId === 'MON-NRM-0001').enemyId, 'ENM_NRM_0001');
  assert.equal(enemies.find((enemy) => enemy.monsterId === 'MON-ELT-0001').enemyId, defaultEnemyId('MON-ELT-0001'));
  assert.equal(enemies.find((enemy) => enemy.monsterId === 'MON-SCB-0001').factionId, 'FAC_SAN');
  assert.equal(enemies.find((enemy) => enemy.monsterId === 'MON-NRM-0001').role, 'Support');
  assert.equal(enemies.every((enemy) => enemy.rarityStatus === 'PROPOSED' && !('stats' in enemy)), true);
  assert.equal(body.gameImport.cards.every((card) => card.cardId === null && card.cardIdStatus === 'UNASSIGNED'), true);

  const duplicate = cloneRecord(0, { monsterId: 'MON-NRM-0002' });
  const bad = writeTemp('dup.json', database([example.records[0], duplicate]));
  const failedBook = join(dir, 'dup.xlsx');
  const failed = runTool('tools/research/monsters/build-workbook.mjs', ['--input', bad, '--out', failedBook]);
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /DUPLICATE_NAME/);
  const audit = readXlsx(readFileSync(failedBook)).find((sheet) => sheet.name === 'Duplicate / IP Risk Audit');
  assert.ok(audit.rows.some((row) => row.includes('DUPLICATE_NAME')));

  const failedExport = runTool('tools/research/monsters/export-json.mjs', ['--input', bad, '--out', join(dir, 'nope.json')]);
  assert.equal(failedExport.status, 1);
  assert.match(failedExport.stderr, /not written/);

  const missing = runTool('tools/research/monsters/validate.mjs', ['--input', join(dir, 'missing.json')]);
  assert.equal(missing.status, 2);
});

function briefRow(record) {
  const row = {
    'Monster ID': record.monsterId,
    'Parody Name (EN)': record.creative.nameEn,
    'Thai name': record.creative.nameTh,
    'Original Inspiration/Source': record.research.originalInspiration,
    'Source URL': record.research.sourceUrl,
    'Monster Category': record.category,
    'Creature Type': record.creative.creatureType,
    'Visual Identity': record.creative.visualIdentity,
    'Personality': record.creative.personality,
    'Signature Trait': record.creative.signatureTrait,
    'Comedy Concept': record.creative.comedyConcept,
    'Humor Type': record.creative.humorType,
    'Element/Attribute': record.creative.element,
    'Combat Archetype': record.creative.combatArchetype,
    'Signature Ability Concept': record.creative.signatureAbilityConcept,
    'Weakness Concept': record.creative.weaknessConcept,
    'Lore Summary': record.creative.loreSummary,
    'Faction Affiliation': record.creative.factionAffiliation,
    'Suggested Rarity': record.creative.suggestedRarity,
    'Suggested Tower Environment': record.creative.suggestedTowerEnvironment,
    'Artwork Prompt Concept': record.creative.artworkPromptConcept,
    'IP Similarity Risk': record.ipRisk,
    'Research Confidence': record.research.confidence,
    status: record.status,
    facts: record.research.facts,
    sources: record.research.sources,
    protectedName: record.research.protectedName,
    publicDomain: record.research.publicDomain,
    origin: record.research.origin,
    kind: record.research.kind,
    inspirationId: record.research.inspirationId,
    archetypeTags: record.research.archetypeTags,
  };
  if (record.hooks?.enemyId) row.enemyId = record.hooks.enemyId;
  if (record.hooks?.role) row.role = record.hooks.role;
  if (record.boss) {
    row['Boss Title'] = record.boss.bossTitle;
    row['Entrance Concept'] = record.boss.entranceConcept;
    row['Signature Silhouette'] = record.boss.signatureSilhouette;
    row['Personality/Motivation'] = record.boss.personalityMotivation;
    row['Signature Mechanic'] = record.boss.signatureMechanic;
    row['Phase Transformation Concept'] = record.boss.phaseTransformationConcept;
    row['Defeat Animation Concept'] = record.boss.defeatAnimationConcept;
    row['Unique Loot Theme'] = record.boss.uniqueLootTheme;
  }
  return row;
}

function collectPropertyNames(node, names) {
  if (!node || typeof node !== 'object') return;
  if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
    names.push(...Object.keys(node.properties));
  }
  for (const value of Object.values(node)) collectPropertyNames(value, names);
}

function walk(value, path, hits) {
  if (typeof value === 'number') {
    hits.push(`number ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}/${index}`, hits));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (/^(hp|atk|def|spd|pow|damage|dmg|stats|weight|weights|rate|rates|pity)$/i.test(key)) hits.push(`key ${path}/${key}`);
      walk(child, `${path}/${key}`, hits);
    }
  }
}
