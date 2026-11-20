import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { bindApi, CONFIG_FILES, ENGINE_FILES, SAVE_FILES, loadNamed, repoPath } from './helpers/load-api.js';
import { buildMatch } from './helpers/match.js';
import { asState, flagOf, isPendingStatus, playCard, readOutcome } from './helpers/state.js';

const AUTO_EXPORTS = ['createMatch', 'playAction', 'previewAction', 'endTurn', 'getZones', 'getOutcome', 'chooseAutoActions', 'runAutoTurn', 'playEnemyTurn'];
const SWEEP_SEEDS = [1, 2, 11, 42, 20261120];

const engine = await loadNamed(ENGINE_FILES, AUTO_EXPORTS, 'stream A');
const config = await loadNamed(CONFIG_FILES, ['defaultRuleConfig'], 'stream B');
const save = await loadNamed(SAVE_FILES, ['serialize', 'deserialize', 'createProfile'], 'stream B');

function listActions(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.actions)) return value.actions;
  if (Array.isArray(value?.played)) return value.played;
  return [];
}

function playArgs(action) {
  if (!action || typeof action !== 'object') return null;
  if (action.endTurn === true || action.type === 'endTurn' || action.kind === 'endTurn') return { endTurn: true };
  const cardInstanceId = action.cardInstanceId ?? action.instanceId;
  if (typeof cardInstanceId !== 'string') return null;
  const args = { cardInstanceId, targets: action.targets ?? [] };
  if (action.actorAvatarId) args.actorAvatarId = action.actorAvatarId;
  if (action.retrieveInstanceIds) args.retrieveInstanceIds = action.retrieveInstanceIds;
  return args;
}

function setAuto(api, state, enabled) {
  if (typeof api.setAuto === 'function') {
    const result = api.setAuto(state, enabled);
    return result == null ? state : asState(result, state);
  }
  if (!state.auto || typeof state.auto !== 'object') state.auto = {};
  state.auto.enabled = enabled;
  state.auto.player = enabled;
  return state;
}

function stamp(api, state) {
  const ids = Object.keys(state.sides ?? {});
  return JSON.stringify({
    phase: state.phase,
    active: state.activeSideId,
    ap: Object.fromEntries(ids.map((id) => [id, state.sides[id].ap])),
    hp: Object.fromEntries(ids.map((id) => [id, (state.sides[id].avatars ?? []).map((avatar) => avatar.hp)])),
    hand: Object.fromEntries(ids.map((id) => [id, api.getZones(state, id).hand.map((card) => card.instanceId)])),
  });
}

function assertNextLegal(api, state, seed) {
  const before = structuredClone(state);
  const planned = listActions(api.chooseAutoActions(state, { seed }));
  assert.deepEqual(state, before, 'chooseAutoActions must not change the match');
  if (planned.length === 0) return;
  const action = playArgs(planned[0]);
  assert.ok(action, 'chooseAutoActions must return playAction arguments or endTurn');
  if (action.endTurn) {
    const ended = api.endTurn(structuredClone(state));
    assert.notEqual(ended?.ok, false, ended?.reason ?? 'AUTO tried to end a turn illegally');
    return;
  }
  const preview = api.previewAction(structuredClone(state), action);
  assert.notEqual(preview?.ok, false, preview?.reason ?? `AUTO proposed an illegal play of ${action.cardInstanceId}`);
}

function isEnemy(state) {
  return state.activeSideId === 'enemy' || state.sides?.[state.activeSideId]?.control === 'ai';
}

/**
 * @param {Record<string, Function>} api
 * @param {number} seed
 */
function drive(api, seed) {
  const input = buildMatch({ seed });
  input.seed = seed;
  input.shuffleDecks = true;
  let state = setAuto(api, asState(api.createMatch(input)), true);
  const log = [];
  for (let guard = 0; guard < 240; guard += 1) {
    if (readOutcome(api, state).result !== 'ongoing') break;
    const before = stamp(api, state);
    if (isEnemy(state)) {
      const result = api.playEnemyTurn(state);
      assert.notEqual(result?.ok, false, result?.reason ?? 'playEnemyTurn failed');
      log.push(['enemy', ...listActions(result).map((action) => playArgs(action)?.cardInstanceId ?? 'end')]);
      state = asState(result, state);
    } else {
      assertNextLegal(api, state, seed);
      const result = api.runAutoTurn(state, { seed, auto: true });
      assert.notEqual(result?.ok, false, result?.reason ?? 'runAutoTurn failed');
      log.push(['player', ...listActions(result).map((action) => {
        const args = playArgs(action);
        if (!args) return 'step';
        return args.endTurn ? 'end' : args.cardInstanceId;
      })]);
      state = asState(result, state);
    }
    assert.notEqual(stamp(api, state), before, 'AUTO made no progress');
  }
  const outcome = readOutcome(api, state);
  assert.notEqual(outcome.result, 'ongoing', `AUTO did not finish seed ${seed}`);
  return { result: outcome.result, winner: outcome.winningSideId, log };
}

bindApi(config, [
  {
    name: 'CORE-037 Owner t261u SYNC mechanic is REJECTED and out of scope',
    fn(api) {
      const rules = api.defaultRuleConfig();
      let flag = null;
      try {
        flag = flagOf(rules, 'vrSync');
      } catch {
        flag = null;
      }
      if (flag) {
        assert.equal(flag.status, 'REJECTED');
        assert.equal(flag.value ?? null, null);
        assert.match(String(flag.evidence ?? ''), /t261u/);
      }
      assert.equal(isPendingStatus(flag?.status), false, 'SYNC is dropped, not pending');
    },
  },
  {
    name: 'AUTO-01 Owner t261u AUTO mode is LOCKED and its policy stays PROPOSED',
    fn(api) {
      const mode = flagOf(api.defaultRuleConfig(), 'autoBattle');
      assert.equal(mode.status, 'LOCKED');
      assert.equal(mode.value, true);
      assert.match(String(mode.evidence ?? ''), /t261u/);
      const policy = mode.policy ?? flagOf(api.defaultRuleConfig(), 'autoPolicy');
      assert.equal(policy.status, 'PROPOSED');
      assert.notEqual(policy.status, 'LOCKED');
    },
  },
]);

bindApi(engine, [
  {
    name: 'AUTO-01 Owner t261u AUTO completes a match without manual input',
    fn(api) {
      const finished = drive(api, 11);
      assert.ok(finished.result === 'win' || finished.result === 'lose' || finished.result === 'simultaneous');
      assert.ok(finished.log.length > 0);
    },
  },
  {
    name: 'AUTO-02 Owner t261u never makes an illegal play in a seeded sweep',
    fn(api) {
      for (const seed of SWEEP_SEEDS) drive(api, seed);
    },
  },
  {
    name: 'AUTO-03 Owner t261u replays the same actions for the same seed',
    fn(api) {
      const first = drive(api, 42);
      const second = drive(api, 42);
      assert.deepEqual(second.log, first.log);
      assert.equal(second.result, first.result);
      assert.equal(second.winner, first.winner);
    },
  },
  {
    name: 'AUTO-04 Owner t261u toggle-off returns control mid-turn',
    fn(api) {
      let state = setAuto(api, asState(api.createMatch(buildMatch({ seed: 7 }))), true);
      assert.equal(state.activeSideId, 'player');
      state = playCard(api, state, 'player', 'ACT_GEN_ATK0', 'AVT_PHA_002').state;
      assert.equal(readOutcome(api, state).result, 'ongoing');
      assert.equal(state.activeSideId, 'player');
      state = setAuto(api, state, false);
      const before = stamp(api, state);
      const result = api.runAutoTurn(state, { seed: 7, auto: false });
      state = asState(result, state);
      assert.equal(stamp(api, state), before, 'AUTO kept playing after the toggle turned off');
      assert.equal(state.activeSideId, 'player');
      const ended = api.endTurn(state);
      assert.notEqual(ended?.ok, false, ended?.reason ?? 'the player could not take the turn back');
    },
  },
]);

bindApi(save, [
  {
    name: 'AUTO-05 Owner t261u preference persists in save',
    fn(api) {
      const stored = (enabled) => {
        if (typeof api.setAutoBattle === 'function') return api.setAutoBattle(api.createProfile({ profileId: 'PLAYER' }), enabled);
        const profile = api.createProfile({ profileId: 'PLAYER', preferences: { autoBattle: enabled } });
        if (profile.preferences?.autoBattle !== enabled) {
          throw new Error('save must keep preferences.autoBattle through setAutoBattle or createProfile');
        }
        return profile;
      };
      const on = api.deserialize(api.serialize(stored(true)));
      assert.equal(on.preferences?.autoBattle ?? on.autoBattle, true);
      const off = api.deserialize(api.serialize(stored(false)));
      assert.equal(off.preferences?.autoBattle ?? off.autoBattle, false);
    },
  },
]);

const webBattle = repoPath('web', 'js', 'screens', 'battle.js');
if (!existsSync(webBattle)) {
  test.todo('AUTO-04 Owner t261u web battle toggle — web/ not landed (stream C)');
} else {
  test('AUTO-04 Owner t261u web battle toggle', () => {
    const files = ['web/js/screens/battle.js', 'web/js/app.js', 'web/index.html'].map((file) => join(repoPath(), file));
    const source = files.filter((file) => existsSync(file)).map((file) => readFileSync(file, 'utf8')).join('\n');
    assert.match(source, /data-testid="auto-toggle"|setAuto\s*\(|autoBattle/);
  });
}
