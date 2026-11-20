import assert from 'node:assert/strict';
import { bindApi, CONFIG_FILES, loadNamed } from './helpers/load-api.js';
import { flagOf, isPendingStatus } from './helpers/state.js';

const config = await loadNamed(CONFIG_FILES, ['defaultRuleConfig'], 'stream B');

const PENDING = [
  ['CORE-036 OPEN-01', 'battleGrid', 'CORE-036'],
  ['CORE-038 OPEN-01', 'teamSpdAggregation', 'CORE-038'],
  ['CORE-038 OPEN-01', 'spdTieBreak', 'CORE-038'],
  ['CORE-039 OPEN-02', 'healCap', 'CORE-039'],
  ['CORE-039 OPEN-02', 'regenTickTiming', 'OPEN-02'],
  ['CORE-040 OPEN-03', 'deckDuplicateMax', 'CORE-040'],
  ['GA-11 OPEN-05', 'rates', 'GA-11'],
  ['GA-11 OPEN-05', 'costG', 'GA-11'],
  ['HOME-11 OPEN-06', 'cabinBaseCapacity', 'HOME-11'],
  ['OPEN-04', 'starCapByRarity', 'OPEN-04'],
  ['OPEN-06', 'furnitureGrant', 'OPEN-06'],
  ['Target_Rule', 'targetRuleEnum', 'Target_Rule'],
];

bindApi(config, PENDING.map(([id, key, rule]) => ({
  name: `${id} ${key} stays pending: Owner must decide ${rule}`,
  fn(api) {
    const rules = api.defaultRuleConfig();
    const flag = flagOf(rules, key);
    assert.equal(isPendingStatus(flag.status), true, `${key} must stay pending`);
    assert.equal(flag.value ?? null, null, `${key} must not ship a production value`);
    if (typeof api.pendingOwnerFlags === 'function') {
      const listed = api.pendingOwnerFlags();
      assert.ok(listed.some((row) => row.rule === rule || row.path.includes(key)), `${rule} missing from pendingOwnerFlags`);
    }
  },
})));

bindApi(config, [
  {
    name: 'CORE-039 OPEN-02 damageFormula is MVP_PROVISIONAL flat_atk (Owner t269u), never LOCKED',
    fn(api) {
      const flag = flagOf(api.defaultRuleConfig(), 'damageFormula');
      assert.equal(flag.status, 'MVP_PROVISIONAL');
      assert.notEqual(flag.status, 'LOCKED');
      assert.equal(flag.provisional, 'flat_atk');
      assert.equal(flag.value ?? null, null, 'damageFormula must not ship a final production value');
    },
  },
]);

bindApi(config, [
  {
    name: 'Owner t253u LOCKED pity and POW migration flags',
    fn(api) {
      const rules = api.defaultRuleConfig();
      assert.equal(rules.deckSize.value, 30);
      assert.equal(rules.deckSize.status, 'LOCKED');
      assert.equal(rules.baseAp.value, 5);
      assert.equal(rules.handSize.value, 5);
      assert.equal(rules.partySize.value, 4);
      assert.equal(rules.voluntaryDiscardAp.value, 1);
      const pow = rules.powToAtk;
      assert.equal(pow.status, 'LOCKED');
      assert.equal(pow.mapping ?? pow.value, '1:1');
      assert.equal(pow.keepLegacyPow ?? pow.preserveLegacyPow ?? pow.value, true);
      const pity = rules.gacha?.pity ?? rules.pity;
      assert.equal(pity.status, 'LOCKED');
      assert.equal(pity.avatarEpicPulls ?? pity.epic?.value ?? pity.epic, 100);
      assert.equal(pity.actionEpicPulls ?? pity.epic?.value ?? pity.epic, 100);
      assert.equal(pity.avatarTopPulls ?? pity.top?.value ?? pity.top, 200);
      assert.equal(pity.companionEpicPulls ?? pity.companionEpic?.value ?? pity.companionEpic, 100);
      assert.equal(pity.counterScope ?? pity.perBanner?.value ?? (pity.perBanner === true ? 'banner' : pity.scope), 'banner');
      assert.equal(pity.epicHitResets ?? pity.epicHitResets?.value, 'epic');
      assert.deepEqual(pity.topHitResets ?? pity.topHitResets?.value, ['epic', 'top']);
      assert.match(String(pity.evidence ?? rules.justinCharacters?.evidence ?? ''), /t253u/);
    },
  },
  {
    name: 'OPEN-08 sample avatar stats stay PROPOSED and editable',
    fn(api) {
      const rules = api.defaultRuleConfig();
      const note = JSON.stringify(rules);
      assert.match(note, /PROPOSED/);
      assert.equal(note.includes('"stats":"LOCKED"'), false);
    },
  },
]);
