import assert from 'node:assert/strict';
import { bindApi, CONFIG_FILES, ENGINE_EXPORTS, ENGINE_FILES, loadNamed } from './helpers/load-api.js';
import { buildMatch, seeds } from './helpers/match.js';
import { apOf, asState, avatarOf, flagOf, playCard, statusesOf } from './helpers/state.js';

function isPending(status) {
  return status === 'PENDING' || status === 'PENDING_OWNER';
}

function findOptionalFlag(node, keys) {
  if (!node || typeof node !== 'object') return null;
  for (const key of keys) {
    if (node[key] && typeof node[key] === 'object' && typeof node[key].status === 'string') return node[key];
  }
  for (const value of Object.values(node)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const found = findOptionalFlag(value, keys);
    if (found) return found;
  }
  return null;
}

const engine = await loadNamed(ENGINE_FILES, ENGINE_EXPORTS, 'stream A');
const config = await loadNamed(CONFIG_FILES, ['defaultRuleConfig'], 'stream B');

function livingUnit(avatar) {
  return avatar.hp > 0 && avatar.alive !== false && avatar.defeated !== true;
}

function regenStatus(avatar) {
  return statusesOf(avatar).find((status) => status.kind === 'regen' || status.id === 'regen' || status.source === 'saving-grace');
}

function regenTicks(log, avatarId, since) {
  return log.slice(since).filter((event) => (event.type === 'regen_tick' || (event.type === 'heal' && event.source === 'regen')) && event.avatarId === avatarId);
}

bindApi(engine, [
  {
    name: 'QA-06 CORE-021 active fires only from an eligible Skill action',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      state = playCard(api, state, 'player', 'ACT_GEN_ATK0', 'AVT_SAN_002').state;
      assert.equal(regenStatus(avatarOf(state, 'player', 'AVT_SAN_002')), undefined);
      state = playCard(api, state, 'player', 'ACT_GEN_SKILL', 'AVT_SAN_002').state;
      for (const avatar of state.sides.player.avatars) {
        if (!livingUnit(avatar)) continue;
        const status = regenStatus(avatar);
        assert.ok(status, `${avatar.avatarId} should receive Saving Grace`);
        assert.equal(status.amount, 3);
        assert.equal(status.ticksRemaining, 2);
      }
    },
  },
  {
    name: 'QA-06 passive trigger chance follows the avatar chance and the seed',
    fn(api) {
      const seed = seeds().passiveSeed;
      const never = asState(api.createMatch(buildMatch({ seed, passiveChance: 0 })));
      const always = asState(api.createMatch(buildMatch({ seed, passiveChance: 1 })));
      const halfA = asState(api.createMatch(buildMatch({ seed, passiveChance: 0.5 })));
      const halfB = asState(api.createMatch(buildMatch({ seed, passiveChance: 0.5 })));
      const actor = 'AVT_PHA_002';
      if (typeof api.rollPassive === 'function') {
        const none = api.rollPassive(never, { avatarId: actor, trigger: 'start_turn', count: 12 });
        const all = api.rollPassive(always, { avatarId: actor, trigger: 'start_turn', count: 12 });
        const first = api.rollPassive(halfA, { avatarId: actor, trigger: 'start_turn', count: 12 });
        const second = api.rollPassive(halfB, { avatarId: actor, trigger: 'start_turn', count: 12 });
        assert.deepEqual(none, Array(12).fill(false));
        assert.deepEqual(all, Array(12).fill(true));
        assert.deepEqual(first, second);
        return;
      }
      const misses = (state) => state.log.filter((event) => event.type === 'passive_miss' && event.avatarId === actor);
      assert.ok(misses(never).length >= 1);
      assert.equal(misses(always).length, 0);
      assert.deepEqual(
        halfA.log.filter((event) => event.avatarId === actor),
        halfB.log.filter((event) => event.avatarId === actor),
      );
    },
  },
  {
    name: 'QA-06 AV_EX04 Saving Grace regen +3 ticks twice on living teammates then expires',
    fn(api) {
      let state = asState(api.createMatch(buildMatch({ defeatPlayerIndex: 0 })));
      const fallen = avatarOf(state, 'player', 'AVT_AEG_002');
      assert.equal(livingUnit(fallen), false);
      state = playCard(api, state, 'player', 'ACT_GEN_SKILL', 'AVT_SAN_002').state;
      const living = state.sides.player.avatars.filter((avatar) => livingUnit(avatar));
      assert.equal(living.length, 3);
      for (const avatar of living) {
        const status = regenStatus(avatar);
        assert.equal(status.amount, 3);
        assert.equal(status.ticksRemaining, 2);
      }
      assert.equal(regenStatus(avatarOf(state, 'player', 'AVT_AEG_002')), undefined);
      const ownTurn = () => {
        state = asState(api.endTurn(state));
        state = asState(api.endTurn(state));
      };
      let mark = state.log.length;
      ownTurn();
      for (const avatar of living) {
        const heals = regenTicks(state.log, avatar.avatarId, mark);
        assert.equal(heals.length, 1);
        assert.equal(heals[0].amount, 3);
        assert.equal(regenStatus(avatarOf(state, 'player', avatar.avatarId)).ticksRemaining, 1);
      }
      mark = state.log.length;
      ownTurn();
      for (const avatar of living) {
        const heals = regenTicks(state.log, avatar.avatarId, mark);
        assert.equal(heals.length, 1);
        assert.equal(heals[0].amount, 3);
        assert.equal(regenStatus(avatarOf(state, 'player', avatar.avatarId)), undefined);
      }
      mark = state.log.length;
      ownTurn();
      assert.equal(regenTicks(state.log, living[0].avatarId, mark).length, 0);
    },
  },
]);

bindApi(config, [
  {
    name: 'QA-06 CORE-039 OPEN-02 heal cap and dead unit regen stay configurable',
    fn(api) {
      const rules = api.defaultRuleConfig();
      for (const key of ['healCap', 'regenTickTiming', 'damageFormula']) {
        const flag = flagOf(rules, key);
        assert.equal(isPending(flag.status), true, key);
        assert.equal(flag.value ?? null, null, key);
      }
      const dead = findOptionalFlag(rules, ['deadUnitRegen', 'hpModel']);
      assert.ok(dead, 'defeated-unit / HP handling must stay a pending flag');
      assert.equal(isPending(dead.status), true);
      assert.equal(dead.value ?? null, null);
      const editable = api.defaultRuleConfig();
      editable.healCap.value = 1;
      assert.equal(flagOf(api.defaultRuleConfig(), 'healCap').value ?? null, null);
    },
  },
]);
