import assert from 'node:assert/strict';
import { bindApi, CONFIG_FILES, HIDEOUT_FILES, loadNamed } from './helpers/load-api.js';
import { flagOf, isPendingStatus } from './helpers/state.js';

const hideout = await loadNamed(
  ['src/schema/hideout.js', ...HIDEOUT_FILES],
  [],
  'stream B or C',
);
if (hideout.mod) {
  const hasTiers = Array.isArray(hideout.mod.HOUSE_TIERS) || typeof hideout.mod.houseTiers === 'function';
  const hasStorage = typeof hideout.mod.storageFromFurniture === 'function' || typeof hideout.mod.storageCapacity === 'function';
  if (!hasTiers || !hasStorage) {
    hideout.missing = ['HOUSE_TIERS', 'storageFromFurniture'];
    hideout.reason = `${hideout.file} is missing hideout tier or storage exports`;
  }
}

const config = await loadNamed(CONFIG_FILES, ['defaultRuleConfig'], 'stream B');
const TIER_NAMES = ['Cabin', 'Bungalow', 'Cottage', 'Loft', 'Villa', 'Penthouse'];

bindApi(hideout, [
  {
    name: 'QA-09 HOME-01 HOME-02 HOME-03 HOME-04 HOME-05 HOME-06 HOME-07 house tiers display the highest acquired tier',
    fn(api) {
      const tiers = Array.isArray(api.HOUSE_TIERS) ? api.HOUSE_TIERS : api.houseTiers().map((name) => ({ name }));
      assert.deepEqual(tiers.map((tier) => tier.name ?? tier), TIER_NAMES);
      if (typeof api.displayHouseTier === 'function') {
        assert.equal(api.displayHouseTier({ acquiredTiers: ['cabin', 'cottage'] }), 'cottage');
        assert.equal(api.displayHouseTier({ acquiredTiers: ['villa', 'bungalow'] }), 'villa');
        assert.equal(api.displayHouseTier({ acquiredTiers: ['penthouse'] }), 'penthouse');
      } else {
        assert.equal(api.displayTier(['Cabin', 'Cottage']), 'Cottage');
        assert.equal(api.highestTier(['Villa', 'Bungalow']), 'Villa');
      }
    },
  },
  {
    name: 'QA-09 HOME-08 HOME-09 HOME-10 storage comes from installed furniture, not the house tier',
    fn(api) {
      if (typeof api.storageFromFurniture === 'function') {
        const box = { furnitureId: 'box', capacity: 50, installed: true };
        const cabinet = { furnitureId: 'cabinet', capacity: 100, installed: true };
        const cabin = api.storageFromFurniture({ acquiredTiers: ['cabin'], installedFurniture: [box] });
        const penthouse = api.storageFromFurniture({ acquiredTiers: ['penthouse'], installedFurniture: [box] });
        assert.equal(cabin.installedSlots, penthouse.installedSlots);
        assert.equal(cabin.houseTierBonus, 0);
        assert.equal(penthouse.houseTierBonus, 0);
        const pooled = api.storageFromFurniture({ acquiredTiers: ['penthouse'], installedFurniture: [box, cabinet] });
        assert.equal(pooled.installedSlots, cabin.installedSlots + cabinet.capacity);
        assert.equal(cabin.cabinBase.status === 'PENDING' || cabin.cabinBase.status === 'PENDING_OWNER', true);
        assert.equal(cabin.cabinBase.value ?? null, null);
        return;
      }
      const box = { id: 'box', capacity: 50 };
      const cabinet = { id: 'cabinet', capacity: 100 };
      const cabin = api.storageCapacity({ houseTier: 'Cabin', furniture: [box] });
      const penthouse = api.storageCapacity({ houseTier: 'Penthouse', furniture: [box] });
      assert.equal(cabin.capacity, penthouse.capacity);
      const pooled = api.storageCapacity({ houseTier: 'Penthouse', furniture: [box, cabinet] });
      assert.equal(pooled.capacity, cabin.capacity + cabinet.capacity);
    },
  },
]);

bindApi(config, [
  {
    name: 'QA-09 HOME-11 OPEN-06 cabin base capacity stays pending',
    fn(api) {
      const flag = flagOf(api.defaultRuleConfig(), 'cabinBaseCapacity');
      assert.equal(isPendingStatus(flag.status), true);
      assert.equal(flag.value ?? null, null);
    },
  },
]);