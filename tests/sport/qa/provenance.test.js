import assert from 'node:assert/strict';
import test from 'node:test';
import { auditDocument, auditRepo } from '../../../tools/sport-qa/lib/provenance.mjs';

const cleanCard = {
  id: 'SPC_FOOTBALL_FW_001',
  sport: 'football',
  parodyName: 'Sample Striker',
  rarity: 'N',
  team: 'Placeholder XI',
  stats: { Power: 10, Def: 20, Speed: 30, Sta: 40, Acc: 50 },
  balance: 'BALANCE_PLACEHOLDER',
  status: 'PROPOSED',
  real: {
    name: 'Alex Example',
    team: 'Example Athletic',
    url: 'https://example.test/players/alex',
  },
};

test('a clean card keeps real-block text out of player-facing fields', () => {
  const findings = auditDocument(cleanCard, 'football/athletes.json');
  assert.deepEqual(findings, []);
});

test('a real name copied into a parody field is a leak', () => {
  const findings = auditDocument({ ...cleanCard, parodyName: 'Alex Example' }, 'football/athletes.json');
  assert.ok(findings.some((row) => row.code === 'REAL_LEAK'));
});

test('a short real token does not match inside a longer word', () => {
  const findings = auditDocument({
    ...cleanCard,
    parodyName: 'Maximum Effort',
    real: { name: 'Max', team: 'Example Athletic' },
  }, 'football/athletes.json');
  assert.equal(findings.some((row) => row.code === 'REAL_LEAK'), false);
});

test('football stat keys must be Power, Def, Speed, Sta, and Acc', () => {
  const findings = auditDocument({
    ...cleanCard,
    stats: { Power: 1, Def: 1, Pace: 1, Sta: 1, Acc: 1 },
  }, 'football/athletes.json');
  assert.ok(findings.some((row) => row.code === 'STAT_KEYS'));
});

test('basket, car, and moto stat sets are exact', () => {
  const basket = auditDocument({
    sport: 'basket',
    rarity: 'R',
    stats: { Shooting: 1, Def: 1, Spd: 1, Sta: 1 },
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  }, 'basket/athletes.json');
  const car = auditDocument({
    sport: 'car',
    rarity: 'Epic',
    stats: { TopSpeed: 1, Accel: 1, Handling: 1 },
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  }, 'car/drivers.json');
  const moto = auditDocument({
    sport: 'moto',
    rarity: 'EX',
    stats: { TopSpeed: 1, Accel: 1, Handling: 1, Sta: 1 },
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  }, 'moto/riders.json');
  assert.deepEqual(basket, []);
  assert.deepEqual(car, []);
  assert.ok(moto.some((row) => row.code === 'STAT_KEYS'));
});

test('sport rarity rejects a fifth tier', () => {
  const findings = auditDocument({ ...cleanCard, rarity: 'FAC' }, 'football/athletes.json');
  assert.ok(findings.some((row) => row.code === 'RARITY'));
});

test('an invented stat without a placeholder tag is rejected', () => {
  const untagged = { ...cleanCard };
  delete untagged.balance;
  delete untagged.status;
  const findings = auditDocument(untagged, 'football/athletes.json');
  assert.ok(findings.some((row) => row.code === 'UNTAGGED_NUMBER'));
});

test('a forbidden release token in sport data is rejected', () => {
  const findings = auditDocument({ ...cleanCard, status: 'LOCKED' }, 'football/athletes.json');
  assert.ok(findings.some((row) => row.code === 'FORBIDDEN_TOKEN'));
});

const repoAudit = auditRepo();

test('landed sport surfaces pass the provenance audit', {
  skip: repoAudit.skipped ? repoAudit.reason : false,
}, () => {
  assert.deepEqual(repoAudit.findings, [], JSON.stringify(repoAudit.findings, null, 2));
});
