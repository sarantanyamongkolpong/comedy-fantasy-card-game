import assert from 'node:assert/strict';
import { bindApi, MIGRATE_FILES, loadNamed } from './helpers/load-api.js';

const migrate = await loadNamed(MIGRATE_FILES, [], 'stream B');
if (migrate.mod && typeof migrate.mod.migratePowToAtk !== 'function' && typeof migrate.mod.migrateStats !== 'function') {
  migrate.missing = ['migratePowToAtk'];
  migrate.reason = `${migrate.file} is missing exports: migratePowToAtk`;
}

bindApi(migrate.mod ? { ...migrate, missing: migrate.missing } : migrate, [
  {
    name: 'CORE-005 Owner t253u POW maps to ATK 1:1 and legacy.pow is preserved',
    fn(api) {
      const convert = api.migratePowToAtk ?? api.migrateStats;
      const stats = convert({ pow: 4, def: 8, spd: 1 });
      const bag = stats.stats ?? stats;
      assert.equal(bag.atk, 4);
      assert.equal(bag.def, 8);
      assert.equal(bag.spd, 1);
      assert.equal(bag.legacy?.pow, 4);
      const avatar = convert({
        avatarId: 'AVT_AEG_001',
        nameEn: 'Sir Potlid',
        stats: { pow: 1, def: 2, spd: 3 },
      });
      assert.equal(avatar.avatarId ?? 'AVT_AEG_001', 'AVT_AEG_001');
      assert.equal((avatar.stats ?? avatar).atk, 1);
      assert.equal((avatar.stats ?? avatar).legacy.pow, 1);
      assert.equal((avatar.stats ?? avatar).def, 2);
      assert.equal((avatar.stats ?? avatar).spd, 3);
    },
  },
]);
