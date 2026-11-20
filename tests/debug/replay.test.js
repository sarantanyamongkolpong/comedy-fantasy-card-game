import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { SAMPLE_AVATARS } from '../../src/avatars/catalog.js';
import {
  canonicalString,
  dataClone,
  diffValues,
  formatBattleLog,
  knownReasonTokens,
  reasonForQuestion,
  recordScenario,
  replayLog,
  sealLog,
  stringifyLog,
} from '../../src/debug/index.js';
import { sumSpdKoRuleset } from '../../tools/replay/examples/rulesets.js';

const root = fileURLToPath(new URL('../..', import.meta.url));

function loadJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function scenario(name) {
  return loadJson(`tools/replay/examples/${name}.scenario.json`);
}

test('canonical JSON ignores key order', () => {
  const left = canonicalString({ b: 1, a: { d: 2, c: [3, 1] } });
  const right = canonicalString({ a: { c: [3, 1], d: 2 }, b: 1 });
  assert.equal(left, right);
});

test('design-block reasons are display tokens for existing question ids', () => {
  assert.equal(reasonForQuestion('Q-DAMAGE'), 'DAMAGE_FORMULA_TBD');
  assert.equal(reasonForQuestion('Q-SKILL'), 'SKILL_EFFECT_TBD');
  assert.equal(reasonForQuestion('Q-SPD-AGG'), 'TEAM_SPD_AGGREGATION_TBD');
  assert.equal(reasonForQuestion('Q-UNKNOWN'), 'Q-UNKNOWN');
  const doc = readText('docs/BATTLE_LOG_FORMAT.md');
  for (const token of knownReasonTokens()) assert.ok(doc.includes(token), token);
});

test('structured diff reports changed, added, and removed leaves', () => {
  const diff = diffValues(
    { ap: { PLAYER: 5, RIVAL: null }, ids: ['AVT_AEG_001'] },
    { ap: { PLAYER: 3 }, ids: ['AVT_AEG_001', 'AVT_PHA_001'] },
  );
  assert.equal(diff.equal, false);
  assert.deepEqual(
    diff.changes.map((change) => change.path),
    ['ap.PLAYER', 'ap.RIVAL', 'ids[1]'],
  );
  assert.deepEqual(diff.changes[0], { path: 'ap.PLAYER', kind: 'changed', left: 5, right: 3 });
  assert.equal(diff.changes[1].kind, 'removed');
  assert.equal(diff.changes[2].kind, 'added');
  assert.deepEqual(diffValues({ ok: true }, { ok: true }), { equal: true, changes: [] });
});

test('recording is deterministic and round-trips through JSON', () => {
  const blocked = scenario('blocked-damage');
  const first = recordScenario(blocked, sumSpdKoRuleset);
  const second = recordScenario(blocked, sumSpdKoRuleset);
  assert.deepEqual(first, second);
  const parsed = JSON.parse(stringifyLog(first));
  assert.deepEqual(parsed, first);
  const report = replayLog(parsed, sumSpdKoRuleset);
  assert.equal(report.consistent, true);
  assert.equal(report.integrityOk, true);
  assert.equal(report.rulesetMatch, true);
  assert.deepEqual(report.findings, []);
});

test('the blocked-damage log keeps catalog avatar ids and records the damage block', () => {
  const log = recordScenario(scenario('blocked-damage'), sumSpdKoRuleset);
  assert.deepEqual(
    log.initialState.activeAvatarIds,
    SAMPLE_AVATARS.map((avatar) => avatar.avatarId),
  );
  const catalog = new Set(SAMPLE_AVATARS.map((avatar) => avatar.avatarId));
  for (const avatarId of log.initialState.sides.RIVAL.avatarIds) {
    assert.equal(catalog.has(avatarId), false);
    assert.match(avatarId, /^TESTONLY_RIVAL_/);
  }
  assert.deepEqual(log.initialState.hands.PLAYER, ['ATK_CARD', 'SKILL_CARD', 'DEF_CARD']);
  assert.deepEqual(log.events[0].after.hands.PLAYER, ['SKILL_CARD', 'DEF_CARD']);
  assert.equal(log.events[0].result.status, 'BLOCKED_BY_DESIGN');
  assert.equal(log.events[0].result.reason, 'DAMAGE_FORMULA_TBD');
  assert.equal(log.events[0].result.questionId, 'Q-DAMAGE');
  assert.equal(log.events[0].result.play.effect, 'not_applied');
  assert.equal(log.events[0].result.play.cost, 2);
  assert.equal(log.events[0].before.ap.PLAYER, 5);
  assert.equal(log.events[0].after.ap.PLAYER, 3);
  assert.equal(log.events[1].result.reason, 'SKILL_EFFECT_TBD');
  assert.equal(log.events[1].after.ap.PLAYER, 0);
  assert.equal(log.events[2].result.reason, 'INSUFFICIENT_AP');
  assert.equal(log.events[2].after.ap.PLAYER, 0);
  assert.equal(log.events[3].result.status, 'TURN_ENDED');
  assert.equal(log.events[3].result.activeSideId, 'RIVAL');
  assert.equal(log.events[3].after.ap.RIVAL, 5);
  assert.equal(log.events[3].after.ap.PLAYER, 0);
  assert.equal(log.events[4].result.activeSideId, 'PLAYER');
  assert.equal(log.events[4].after.ap.PLAYER, 5);
  assert.equal(log.events[4].after.roundIndex, 2);
  assert.equal(log.events[5].after.ap.PLAYER, 4);
  for (const side of Object.values(log.finalState.sides)) {
    for (const member of side.members) {
      assert.equal(member.stats.pow, 0);
      assert.equal(member.stats.def, 0);
    }
  }
  assert.equal(log.ruleset.entries.find((entry) => entry.key === 'damage').kind, 'ENGINE_DEFAULT');
  assert.equal(log.ruleset.entries.find((entry) => entry.key === 'skillEffect').kind, 'ENGINE_DEFAULT');
  assert.equal(log.ruleset.entries.find((entry) => entry.key === 'teamSpd').label, 'TEST-ONLY');
  assert.equal(log.ruleset.parameters.apCostByActionType.ATK, 2);

  const sample = [
    'TURN 01',
    'Active Team: PLAYER',
    'AP: 5',
    'Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001',
    'Action: ATK_CARD',
    'Result: BLOCKED_BY_DESIGN',
    'Reason: DAMAGE_FORMULA_TBD',
  ].join('\n');
  const printed = formatBattleLog(log);
  assert.ok(printed.includes(sample));
  assert.ok(readText('docs/REPLAY_TOOL.md').includes(printed.trimEnd()));

  const apDiff = diffValues(log.events[0].before.ap, log.events[0].after.ap);
  assert.deepEqual(apDiff.changes, [{ path: 'PLAYER', kind: 'changed', left: 5, right: 3 }]);
});

test('shipped example logs match a fresh recording and replay', () => {
  for (const name of ['blocked-damage', 'ap-and-turns', 'ko-outcome']) {
    const log = recordScenario(scenario(name), sumSpdKoRuleset);
    assert.equal(readText(`tools/replay/examples/${name}.log.json`), stringifyLog(log), name);
    assert.equal(replayLog(log, sumSpdKoRuleset).consistent, true, name);
    const schema = loadJson('docs/schemas/battle-log.schema.json');
    for (const key of schema.required) assert.ok(Object.hasOwn(log, key), key);
    assert.equal(log.format, schema.properties.format.const);
    assert.equal(log.version, schema.properties.version.const);
  }
});

test('turn ownership and AP refresh are visible without resolving effects', () => {
  const log = recordScenario(scenario('ap-and-turns'), sumSpdKoRuleset);
  assert.equal(log.events[1].result.reason, 'NOT_ACTIVE_SIDE');
  assert.equal(log.events[1].after.activeSideId, 'PLAYER');
  assert.equal(log.events[5].result.status, 'PLAYED');
  assert.equal(log.events[5].result.sideId, 'RIVAL');
  assert.equal(log.events[5].result.apAfter, 3);
  assert.equal(log.events[6].result.activeSideId, 'PLAYER');
  assert.equal(log.events[6].after.ap.PLAYER, 5);
  assert.equal(log.events[7].result.cardId, 'DEF_CARD');
  assert.equal(log.events[7].after.ap.PLAYER, 4);
  assert.equal(log.finalState.outcome.status, 'ongoing');
});

test('a fixture ko sweep records victory and a decided-battle rejection', () => {
  const log = recordScenario(scenario('ko-outcome'), sumSpdKoRuleset);
  assert.equal(log.events[4].result.status, 'EVALUATED');
  assert.equal(log.events[4].result.outcome.winnerSideId, 'PLAYER');
  assert.equal(log.events[4].result.outcome.verdict.RIVAL, 'defeat');
  assert.equal(log.events[5].result.reason, 'BATTLE_DECIDED');
  assert.equal(log.finalState.outcome.status, 'decided');
  assert.equal(log.finalState.sides.RIVAL.members.every((member) => member.markers.ko === true), true);
  assert.equal(log.finalState.sides.PLAYER.members.every((member) => member.markers.ko === false), true);
});

test('an unknown marker is rejected and still replays', () => {
  const base = scenario('ko-outcome');
  const log = recordScenario(
    {
      ...base,
      battleId: 'unknown-marker',
      steps: [{ op: 'mark', sideId: 'RIVAL', avatarId: 'TESTONLY_RIVAL_1', marker: 'shield', value: true }],
    },
    sumSpdKoRuleset,
  );
  assert.equal(log.events[0].result.reason, 'UNKNOWN_MARKER');
  assert.equal(log.finalState.outcome.status, 'ongoing');
  assert.equal(replayLog(log, sumSpdKoRuleset).consistent, true);
});

test('a missing team-SPD rule is recorded as a setup block and replays', () => {
  const base = scenario('ko-outcome');
  const ruleset = {
    id: 'engine-defaults',
    label: 'engine-default',
    parameters: {},
    rules: {},
  };
  const log = recordScenario(
    { ...base, battleId: 'defaults-block', rulesetId: ruleset.id, steps: [{ op: 'endTurn' }] },
    ruleset,
  );
  assert.equal(log.setupResult.status, 'BLOCKED_BY_DESIGN');
  assert.equal(log.setupResult.reason, 'TEAM_SPD_AGGREGATION_TBD');
  assert.equal(log.setupResult.questionId, 'Q-SPD-AGG');
  assert.equal(log.initialState, null);
  assert.equal(log.events.length, 0);
  assert.equal(replayLog(log, ruleset).consistent, true);
});

test('a tampered result fails the seal and the replay', () => {
  const log = recordScenario(scenario('blocked-damage'), sumSpdKoRuleset);
  const tampered = dataClone(log);
  tampered.events[0].result.reason = 'TAMPERED';
  const report = replayLog(tampered, sumSpdKoRuleset);
  assert.equal(report.consistent, false);
  assert.equal(report.integrityOk, false);
  assert.equal(report.findings.some((finding) => finding.code === 'INTEGRITY_MISMATCH'), true);
  assert.equal(
    report.findings.some((finding) => finding.code === 'RESULT_MISMATCH' && finding.eventIndex === 0),
    true,
  );
  assert.equal(report.findings.some((finding) => finding.code === 'STATE_MISMATCH'), false);
});

test('a resealed snapshot edit is caught by the state diff', () => {
  const log = recordScenario(scenario('blocked-damage'), sumSpdKoRuleset);
  const tampered = dataClone(log);
  tampered.events[0].after.ap.PLAYER = 999;
  const resealed = sealLog(tampered);
  const report = replayLog(resealed, sumSpdKoRuleset);
  assert.equal(report.integrityOk, true);
  assert.equal(report.rulesetMatch, true);
  const finding = report.findings.find((item) => item.code === 'STATE_MISMATCH' && item.phase === 'after');
  assert.ok(finding);
  assert.equal(finding.eventIndex, 0);
  assert.deepEqual(
    finding.diff.changes.find((change) => change.path === 'ap.PLAYER'),
    { path: 'ap.PLAYER', kind: 'changed', left: 999, right: 3 },
  );
  assert.equal(report.findings.some((item) => item.code === 'INTEGRITY_MISMATCH'), false);
});

test('a ruleset parameter edit fails the hash without a false state mismatch', () => {
  const log = recordScenario(scenario('blocked-damage'), sumSpdKoRuleset);
  const tweaked = {
    ...sumSpdKoRuleset,
    parameters: { ...sumSpdKoRuleset.parameters, note: 'changed fixture note' },
  };
  const report = replayLog(log, tweaked);
  assert.equal(report.consistent, false);
  assert.equal(report.rulesetMatch, false);
  assert.deepEqual(
    report.findings.map((finding) => finding.code),
    ['RULESET_HASH_MISMATCH'],
  );
});

test('a broken seal on an otherwise faithful log is still inconsistent', () => {
  const log = recordScenario(scenario('ap-and-turns'), sumSpdKoRuleset);
  const tampered = dataClone(log);
  tampered.integrity.hash = `sha256:${'0'.repeat(64)}`;
  const report = replayLog(tampered, sumSpdKoRuleset);
  assert.equal(report.consistent, false);
  assert.deepEqual(
    report.findings.map((finding) => finding.code),
    ['INTEGRITY_MISMATCH'],
  );
});

test('an unsupported log version is rejected before replay', () => {
  const log = recordScenario(scenario('ko-outcome'), sumSpdKoRuleset);
  log.version = 99;
  assert.throws(() => replayLog(log, sumSpdKoRuleset), /unsupported log version/);
});
