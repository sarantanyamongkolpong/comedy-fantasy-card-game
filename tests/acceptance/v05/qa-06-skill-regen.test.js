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

function regenStatus(avatar) {
  return statusesOf(avatar).find((status) => status.id === 'regen' || status.source === 'saving-grace');
}

function healEvents(events, avatarId) {
  return (events ?? []).filter((event) => event.type === 'heal' && event.source === 'regen' && event.avatarId === avatarId);
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
        if (avatar.defeated) continue;
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
      const none = api.rollPassive(never, { avatarId: actor, trigger: 'start_turn', count: 12 });
      const all = api.rollPassive(always, { avatarId: actor, trigger: 'start_turn', count: 12 });
      const first = api.rollPassive(halfA, { avatarId: actor, trigger: 'start_turn', count: 12 });
      const second = api.rollPassive(halfB, { avatarId: actor, trigger: 'start_turn', count: 12 });
      assert.deepEqual(none, Array(12).fill(false));
      assert.deepEqual(all, Array(12).fill(true));
      assert.deepEqual(first, second);
      assert.equal(first.length, 12);
      assert.ok(first.every((roll) => typeof roll === 'boolean'));
    },
  },
  {
    name: 'QA-06 AV_EX04 Saving Grace regen +3 ticks twice on living teammates then expires',
    fn(api) {
      let state = asState(api.createMatch(buildMatch({ defeatPlayerIndex: 0 })));
      assert.equal(avatarOf(state, 'player', 'AVT_AEG_002').defeated, true);
      state = playCard(api, state, 'player', 'ACT_GEN_SKILL', 'AVT_SAN_002').state;
      const living = state.sides.player.avatars.filter((avatar) => !avatar.defeated);
      assert.equal(living.length, 3);
      for (const avatar of living) {
        const status = regenStatus(avatar);
        assert.equal(status.amount, 3);
        assert.equal(status.ticksRemaining, 2);
      }
      const first = api.advanceStatusTick(state);
      state = asState(first, state);
      const firstEvents = first.events ?? state.log ?? [];
      for (const avatar of living) {
        const heals = healEvents(firstEvents, avatar.avatarId);
        assert.equal(heals.length, 1);
        assert.equal(heals[0].amount, 3);
        assert.equal(regenStatus(avatarOf(state, 'player', avatar.avatarId)).ticksRemaining, 1);
      }
      const second = api.advanceStatusTick(state);
      state = asState(second, state);
      const secondEvents = second.events ?? [];
      for (const avatar of living) {
        const heals = healEvents(secondEvents, avatar.avatarId);
        assert.equal(heals.length, 1);
        assert.equal(heals[0].amount, 3);
        assert.equal(regenStatus(avatarOf(state, 'player', avatar.avatarId)), undefined);
      }
      const third = api.advanceStatusTick(state);
      const thirdEvents = third.events ?? [];
      assert.equal(thirdEvents.filter((event) => event.type === 'heal' && event.source === 'regen').length, 0);
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
