import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { COLUMNS } from '../../tools/authoring/columns.js';
import { recordsFromCsv, recordsToCsv, parseCell } from '../../tools/authoring/csv.js';
import { defaultExamplesDir, defaultTemplatesDir } from '../../tools/authoring/paths.js';
import { loadCatalog } from '../../tools/authoring/catalog.js';
import { materializeCatalog, loadTemplates } from '../../tools/authoring/templates.js';

const templates = loadTemplates(defaultTemplatesDir);

test('empty numeric cells stay null and the digit 0 stays 0', () => {
  assert.equal(parseCell('apCost', ''), null);
  assert.equal(parseCell('apCost', 'null'), null);
  assert.equal(parseCell('stats.pow', '   '), null);
  assert.equal(parseCell('apCost', '0'), 0);
  assert.equal(parseCell('stats.pow', 'TBD'), 'TBD');
  assert.equal(parseCell('stats.def', '00'), '00');
  assert.equal(parseCell('rarity', ''), null);
  assert.notEqual(parseCell('apCost', ''), 0);
  assert.notEqual(parseCell('stats.pow', ''), 0);
});

test('Thai names, quoted commas, CRLF, and a BOM round-trip', () => {
  const columns = ['nameEn', 'nameTh', 'apCost', 'labels'];
  const records = [
    { nameEn: 'Sir, Potlid', nameTh: 'เซอร์ฝาหม้อ', apCost: null, labels: ['SCHEMA_SAMPLE', 'TBD'] },
    { nameEn: 'Nox "Squeak"', nameTh: 'น็อกซ์ รองเท้าดัง', apCost: 0, labels: null },
  ];
  const csv = recordsToCsv(records, columns, { bom: true }).replaceAll('\n', '\r\n');
  assert.equal(csv.charCodeAt(0), 0xfeff);
  const back = recordsFromCsv(csv);
  assert.equal(back[0].nameEn, 'Sir, Potlid');
  assert.equal(back[0].nameTh, 'เซอร์ฝาหม้อ');
  assert.equal(back[0].apCost, null);
  assert.deepEqual(back[0].labels, ['SCHEMA_SAMPLE', 'TBD']);
  assert.equal(back[1].nameEn, 'Nox "Squeak"');
  assert.equal(back[1].nameTh, 'น็อกซ์ รองเท้าดัง');
  assert.equal(back[1].apCost, 0);
  assert.equal(back[1].labels, null);
});

test('an omitted CSV column takes the template default and an empty cell stays null', () => {
  const sparse = recordsFromCsv('extends,cardId,actionType,apCost\naction-card,ACT_SCHEMA_ATK,ATK,\n');
  const filled = materializeCatalog({ actionCards: sparse }, templates).actionCards[0];
  assert.equal(filled.apCost, null);
  assert.equal(filled.costStatus, 'TBD');
  assert.equal(filled.name, null);
  assert.equal(filled.rarity, null);

  const blocked = recordsFromCsv(
    'extends,cardId,actionType,costStatus\naction-card,ACT_SCHEMA_ATK,ATK,\n',
  );
  const kept = materializeCatalog({ actionCards: blocked }, templates).actionCards[0];
  assert.equal(kept.costStatus, null);
  assert.equal(kept.apCost, null);
});

test('starter CSV files round-trip to the materialized catalog', () => {
  const catalog = loadCatalog(join(defaultExamplesDir, 'starter-catalog.json'));
  const materialized = materializeCatalog(catalog, templates);
  const kinds = [
    ['avatar', 'avatars.csv', 'avatars'],
    ['avatar-card', 'avatar-cards.csv', 'avatarCards'],
    ['action-card', 'action-cards.csv', 'actionCards'],
    ['equipment', 'equipment.csv', 'equipment'],
  ];
  for (const [kind, fileName, collection] of kinds) {
    const committed = readFileSync(join(defaultExamplesDir, 'csv', fileName), 'utf8');
    const exported = recordsToCsv(materialized[collection], COLUMNS[kind]);
    assert.equal(committed, exported, fileName);
    assert.equal(committed.includes('\u0000'), false);
    const imported = materializeCatalog(
      { [collection]: recordsFromCsv(committed) },
      templates,
    )[collection];
    assert.deepEqual(imported, materialized[collection], fileName);
  }
  const avatars = readFileSync(join(defaultExamplesDir, 'csv', 'avatars.csv'), 'utf8');
  assert.match(avatars, /เซอร์ฝาหม้อ/);
  assert.match(avatars, /น็อกซ์ รองเท้าดัง/);
  assert.match(avatars, /มาดามดาวตก/);
  assert.match(avatars, /ซิสเตอร์พลาสเตอร์/);
  const equipment = readFileSync(join(defaultExamplesDir, 'csv', 'equipment.csv'), 'utf8');
  assert.match(equipment, /EQ_DAGGER_BASIC_001,main_hand\|off_hand/);
  assert.doesNotMatch(equipment, /dropRate|,"0",/);
});

test('CSV parser rejects a broken table', () => {
  assert.throws(() => recordsFromCsv('"open\n'), /unclosed quote/);
  assert.throws(() => recordsFromCsv('a,b\n1\n'), /columns/);
  assert.throws(() => recordsFromCsv('a,a\n1,2\n'), /repeats/);
});

test('JSON materialize output keeps null and TBD', () => {
  const directory = mkdtempSync(join(tmpdir(), 'authoring-json-'));
  const catalog = loadCatalog(join(defaultExamplesDir, 'starter-catalog.json'));
  const materialized = materializeCatalog(catalog, templates);
  const file = join(directory, 'materialized.json');
  writeFileSync(file, `${JSON.stringify(materialized, null, 2)}\n`);
  const text = readFileSync(file, 'utf8');
  assert.match(text, /"apCost": null/);
  assert.match(text, /"valueStatus": "TBD"/);
  assert.match(text, /"rarity": null/);
  assert.doesNotMatch(text, /"apCost": 0/);
  const parsed = JSON.parse(text);
  assert.equal(parsed.actionCards[0].apCost, null);
  assert.equal(parsed.avatars[0].stats.pow, null);
  assert.equal(parsed.avatars[0].nameTh, 'เซอร์ฝาหม้อ');
  const again = materializeCatalog(parsed, templates);
  assert.deepEqual(again, materialized);
});
