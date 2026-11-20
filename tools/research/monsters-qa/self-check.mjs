import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { evaluateSource, keyTerms, screenUrl } from './lib/check-sources.mjs';
import { dedupeRecords } from './lib/dedupe.mjs';
import { matchFranchise } from './lib/franchise.mjs';
import { htmlToText } from './lib/html.mjs';
import { assessIp } from './lib/ip-check.mjs';
import { normalizeRecord, recordsFromText } from './lib/load.mjs';
import { assertSafeRef } from './lib/repo.mjs';
import { assessSensitivity } from './lib/sensitivity.mjs';
import { compactName, editSimilarity, levenshtein, phoneticMatch } from './lib/text.mjs';

const creativeMeta = {
  agent: '06',
  role: 'creative',
  ref: 'test',
  sha: 'abc',
  path: 'docs/research/monsters/creative/parody/samples.json',
};

const researchMeta = {
  agent: '03',
  role: 'sources',
  ref: 'test',
  sha: 'abc',
  path: 'docs/research/monsters/sources/03-eastern/inspirations.json',
};

/**
 * @param {object} raw
 * @param {object} [meta]
 */
function record(raw, meta = creativeMeta) {
  return normalizeRecord(raw, { index: 0, ...meta });
}

test('edit distance and compact names', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(compactName('The Sephiroth!'), 'sephiroth');
  assert.ok(editSimilarity('pikachu', 'pikachew') >= 0.72);
  assert.equal(phoneticMatch('Pikachu', 'Pika-chew'), true);
  assert.equal(phoneticMatch('Sephiroth', 'Sephiroast'), false);
});

test('franchise tokens do not fire on idioms', () => {
  assert.equal(matchFranchise('Missing Link', 'short').length, 0);
  assert.equal(matchFranchise('a sonic screech across the hall', 'long').some((hit) => hit.phrase === 'sonic'), false);
  const dark = matchFranchise('Dark Link', 'short');
  assert.ok(dark.some((hit) => hit.label === 'Link' && hit.weight === 'high'));
  const bare = matchFranchise('Link', 'short');
  assert.equal(bare[0].weight, 'medium');
  assert.ok(matchFranchise('Pikachu', 'short').some((hit) => hit.weight === 'high'));
  assert.ok(matchFranchise('พิคาชู', 'short').some((hit) => hit.label === 'Pikachu'));
});

test('parody names land on the review bands', () => {
  const pikachu = assessIp(record({ parodyName: 'Pikachu', originalName: 'Pikachu', protectedName: true }));
  assert.equal(pikachu.risk, 'high');
  assert.equal(pikachu.priority, 'P0');
  assert.equal(pikachu.verbatim, true);

  const chew = assessIp(record({ parodyName: 'Pika-chew', originalName: 'Pikachu', protectedName: true }));
  assert.equal(chew.risk, 'high');
  assert.equal(chew.priority, 'P1');

  const roast = assessIp(record({ parodyName: 'Sephiroast', originalName: 'Sephiroth', protectedName: true }));
  assert.equal(roast.risk, 'medium');

  const custard = assessIp(record({
    parodyName: 'Custard Knight',
    originalName: 'Slime',
    publicDomain: true,
    protectedName: false,
    creatureType: 'slime',
    visualIdentity: 'a cube of custard with a spoon for a shield',
    comedyConcept: 'files expense reports for other slimes',
  }));
  assert.equal(custard.risk, 'low');
  assert.equal(custard.priority, null);

  const visual = assessIp(record({
    parodyName: 'Sparky',
    originalName: 'electric mouse',
    visualIdentity: 'a yellow mouse with red circular cheeks and a lightning-bolt tail',
  }));
  assert.equal(visual.risk, 'high');
  assert.ok(visual.scores.signatureVisualHits.some((hit) => hit.complete));

  const generic = assessIp(record({ parodyName: 'Slime', originalName: 'Slime', publicDomain: true, protectedName: false }));
  assert.equal(generic.risk, 'medium');
  assert.notEqual(generic.priority, 'P0');

  const denied = assessIp(record({
    parodyName: 'Lidling',
    originalName: 'dessert ooze',
    visualIdentity: 'A square dumpling of pale custard. No teardrop silhouette, no blank smile, no blue slime.',
  }));
  assert.equal(denied.risk, 'low');
  assert.equal(denied.scores.signatureVisualHits.length, 0);
});

test('dedupe exact parody names and shared research subjects', () => {
  const left = record({ id: 'A', parodyName: 'Custard Knight' });
  const right = record({ id: 'B', parodyName: 'Custard Knight' }, { ...creativeMeta, agent: '07', path: 'docs/research/monsters/creative/bosses/samples.json' });
  const pairs = dedupeRecords([left, right]);
  assert.equal(pairs[0].priority, 'P0');
  assert.equal(pairs[0].kind, 'exact-parody-name');

  const medusaA = record({ inspirationId: 'INS-1', name: 'Medusa', facts: ['snakes'] }, researchMeta);
  const medusaB = record({ inspirationId: 'INS-2', name: 'Medusa', facts: ['snakes'] }, { ...researchMeta, agent: '04', path: 'docs/research/monsters/sources/04-world-myth/inspirations.json' });
  const shared = dedupeRecords([medusaA, medusaB]);
  assert.equal(shared[0].kind, 'shared-inspiration');
  assert.equal(shared[0].priority, 'P2');
});

test('sensitivity separates research notes from comedy targets', () => {
  const boss = assessSensitivity(record({ parodyName: 'Ganesha the Loot Piñata', comedyConcept: 'players strike the deity for candy' }));
  assert.equal(boss.level, 'high');
  assert.equal(boss.priority, 'P1');

  const researched = assessSensitivity(record({
    name: 'Ganesha',
    facts: ['Ganesha is depicted with an elephant head'],
  }, researchMeta));
  assert.equal(researched.level, 'note');
  assert.equal(researched.priority, null);

  const tragedy = assessSensitivity(record({ parodyName: 'Holocaust Harry', comedyConcept: 'a boss about the holocaust' }));
  assert.equal(tragedy.level, 'high');

  const slur = assessSensitivity(record({ parodyName: 'Ordinary Beast', visualIdentity: 'the joke is his slanted eyes' }));
  assert.equal(slur.level, 'high');
});

test('source verdicts from status, terms, and suspicious URLs', () => {
  assert.ok(screenUrl('https://example.com/medusa').flags.includes('placeholder_url'));
  assert.ok(screenUrl('http://127.0.0.1/secret').flags.includes('blocked_host'));
  assert.ok(screenUrl('http://169.254.169.254/latest').flags.includes('blocked_host'));
  assert.throws(() => assertSafeRef('research/m01; rm -rf /'));

  const claim = {
    url: 'https://example.org/medusa',
    claimedTitle: 'Medusa',
    supports: 'Medusa had living snakes for hair',
    facts: ['Medusa had living snakes for hair'],
    name: 'Medusa',
    requireName: true,
    agent: '02',
    recordId: 'INS-1',
    path: 'inspirations.json',
    kind: 'inspiration',
  };
  const terms = keyTerms(claim);
  assert.ok(terms.terms.includes('medusa'));
  assert.ok(terms.terms.includes('snakes'));
  const pointer = keyTerms({
    supports: 'All three facts are in the lead of the article.',
    facts: ['Medusa had living snakes for hair'],
    name: 'Medusa',
    requireName: true,
  });
  assert.ok(pointer.terms.includes('snakes'));
  assert.equal(pointer.terms.includes('facts'), false);
  assert.equal(pointer.terms.includes('lead'), false);
  const specific = keyTerms({
    supports: 'No evidence the 1981 cabinet existed',
    facts: ['a card may set onResolveZone to void and Branyiczky describes a superboss'],
    name: 'Polybius',
    requireName: false,
  });
  assert.ok(specific.terms.includes('cabinet'));
  assert.equal(specific.terms.includes('onresolvezone'), false);

  const page = '<html><head><title>Medusa</title></head><body><p>Medusa had living snakes for hair in the Greek story.</p></body></html>';
  const parsed = htmlToText(page);
  assert.equal(parsed.title, 'Medusa');
  const ok = evaluateSource(claim, {
    httpStatus: 200, finalUrl: claim.url, title: parsed.title, contentType: 'text/html', text: parsed.text, flags: [],
  });
  assert.equal(ok.verdict, 'verified');

  const bread = evaluateSource(claim, {
    httpStatus: 200,
    finalUrl: claim.url,
    title: 'Sourdough',
    contentType: 'text/html',
    text: 'This page is about baking bread with flour water and salt and a long fermentation and a crisp crust for dinner.',
    flags: [],
  });
  assert.equal(bread.verdict, 'unrelated');
  assert.equal(bread.priority, 'P0');

  const missing = evaluateSource(claim, { httpStatus: 404, finalUrl: claim.url, title: 'Not Found', contentType: 'text/html', text: 'missing', flags: [] });
  assert.equal(missing.verdict, 'dead');
  assert.equal(missing.priority, 'P0');

  const blocked = evaluateSource(claim, { httpStatus: 403, finalUrl: claim.url, title: '', contentType: 'text/html', text: '', flags: [] });
  assert.equal(blocked.verdict, 'blocked');
  assert.equal(blocked.priority, 'P1');

  const wall = evaluateSource(claim, {
    httpStatus: 200,
    finalUrl: claim.url,
    title: 'Just a moment...',
    contentType: 'text/html',
    text: 'Just a moment. Enable JavaScript and cookies to continue.',
    flags: [],
  });
  assert.equal(wall.verdict, 'blocked');

  const shell = evaluateSource(claim, {
    httpStatus: 200,
    finalUrl: claim.url,
    title: '{{meta.fullTitle}}',
    contentType: 'text/html',
    text: 'Loading application {{meta.fullTitle}} please wait for the client render to finish and show the article body later.',
    flags: [],
  });
  assert.equal(shell.verdict, 'unverified');
  assert.ok(shell.flags.includes('js_shell'));

  const placeholder = evaluateSource({ ...claim, url: 'https://example.com/medusa' }, {
    httpStatus: null, finalUrl: '', title: '', contentType: '', text: '', flags: ['placeholder_url'],
  });
  assert.equal(placeholder.verdict, 'suspicious');
  assert.equal(placeholder.priority, 'P0');
});

test('markdown URLs drop trailing backticks and do not override structured claims', () => {
  const markdown = [
    'See `https://etcsl.orinst.ox.ac.uk/section1/tr1815.htm` for the poem.',
    'PDF: https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf`.',
    'Also ([Boss](https://en.wikipedia.org/wiki/Boss_(video_games)).)',
    'And ([Golem](https://en.wikipedia.org/wiki/Golem).)',
  ].join('\n');
  const rows = recordsFromText(markdown, {
    agent: '04',
    role: 'sources',
    ref: 'test',
    sha: 'abc',
    path: 'notes.md',
  });
  const urls = rows.map((row) => row.sources[0]?.url);
  assert.deepEqual(urls, [
    'https://etcsl.orinst.ox.ac.uk/section1/tr1815.htm',
    'https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf',
    'https://en.wikipedia.org/wiki/Boss_(video_games)',
    'https://en.wikipedia.org/wiki/Golem',
  ]);

  const wrapped = recordsFromText(JSON.stringify({
    agent: '02-western',
    pitches: [{ pitchId: 'PITCH-02-001', parodyNameEn: 'Stewcap' }],
  }), { ...creativeMeta, agent: '02', lockAgent: true, path: 'pitches.json' });
  assert.equal(wrapped[0].agent, '02');
  assert.equal(wrapped[0].id, 'PITCH-02-001');
  const both = record({
    monsterId: 'M06-N-001',
    research: { inspirationId: 'INS-02-001', originalInspiration: 'Bonnacon' },
    creative: { parodyNameEn: 'Curlhorn' },
  });
  assert.equal(both.id, 'M06-N-001');
  assert.equal(both.parodyName, 'Curlhorn');
  const cabinet = assessIp(record({
    parodyName: 'Zero Cabinet',
    originalName: 'Polybius, the urban legend of a 1981 arcade cabinet that left no evidence',
    protectedName: true,
  }));
  assert.equal(cabinet.risk, 'low');
  const compact = assessIp(record({
    parodyName: 'Dame Compact',
    originalName: 'The magical-girl transformation',
    visualIdentity: 'A plain coat and a compact mirror. After the change, a ribbon comet of a robe. Not a school uniform.',
  }));
  assert.equal(compact.risk, 'medium');
  assert.equal(compact.scores.signatureVisualHits.some((hit) => hit.id === 'magical-girl-compact' && !hit.complete), true);

  const empty = recordsFromText(JSON.stringify({ documentId: 'FRAMEWORK', agent: '08' }), {
    agent: '08', role: 'lore', ref: 'test', sha: 'abc', path: 'framework.json', lockAgent: true,
  });
  assert.equal(empty[0].kind, 'empty-json');
  assert.equal(empty[0].parseError, '');

  const lore = recordsFromText(JSON.stringify({
    entries: [{ monsterId: 'M06-N-001', hook: 'Curlhorn files no quest.' }],
    conflicts: [{
      conflictId: 'CONF-1',
      status: 'open',
      severity: 'continuity',
      canonImpact: 'none',
      theirClaim: 'The phase line says him.',
      lorePosition: 'The name is Dame.',
    }],
  }), { agent: '08', role: 'lore', ref: 'test', sha: 'abc', path: 'sample_lore_links.json', lockAgent: true });
  assert.equal(lore[0].id, 'M06-N-001');
  assert.equal(lore[0].kind, 'lore');
  assert.equal(lore[0].lore, 'Curlhorn files no quest.');
  assert.equal(lore[1].kind, 'lore-conflict');
  assert.equal(lore[1].id, 'CONF-1');
  assert.equal(lore[1].confidence, 'open');
});

test('cli writes an IP audit and returns P0 for a copied character name', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mqa-'));
  const bad = join(dir, 'bad.json');
  const good = join(dir, 'good.json');
  writeFileSync(bad, JSON.stringify([{ parodyName: 'Pikachu', originalName: 'Pikachu', protectedName: true }]));
  writeFileSync(good, JSON.stringify([{
    parodyName: 'Custard Knight',
    originalName: 'Slime',
    publicDomain: true,
    protectedName: false,
    visualIdentity: 'a cube of custard with a spoon for a shield',
  }]));
  const cli = new URL('./cli.mjs', import.meta.url);
  const failed = spawnSync(process.execPath, [cli.pathname, 'run', '--only-input', '--skip-network', '--input', bad, '--out-dir', join(dir, 'out-bad')], { encoding: 'utf8' });
  assert.equal(failed.status, 1, failed.stderr);
  const audit = JSON.parse(readFileSync(join(dir, 'out-bad', 'ip_audit.json'), 'utf8'));
  assert.equal(audit.entries[0].risk, 'high');
  assert.equal(audit.entries[0].priority, 'P0');
  const passed = spawnSync(process.execPath, [cli.pathname, 'run', '--only-input', '--skip-network', '--input', good, '--out-dir', join(dir, 'out-good')], { encoding: 'utf8' });
  assert.equal(passed.status, 0, passed.stderr + passed.stdout);
});
