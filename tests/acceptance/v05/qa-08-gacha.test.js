import assert from 'node:assert/strict';
import { bindApi, CONFIG_FILES, GACHA_FILES, loadNamed } from './helpers/load-api.js';
import { isPendingStatus } from './helpers/state.js';

const gacha = await loadNamed(GACHA_FILES, ['createBannerState', 'pull'], 'stream B');
const config = await loadNamed(CONFIG_FILES, ['defaultRuleConfig'], 'stream B');

function epicCount(state) {
  if (Number.isInteger(state?.epicCounter)) return state.epicCounter;
  if (Number.isInteger(state?.counters?.epic)) return state.counters.epic;
  throw new Error('banner state is missing epicCounter');
}

function topCount(state) {
  if (state?.topCounter === null || state?.counters?.top === null) return null;
  if (Number.isInteger(state?.topCounter)) return state.topCounter;
  if (Number.isInteger(state?.counters?.top)) return state.counters.top;
  throw new Error('banner state is missing topCounter');
}

function banner(api, fields) {
  if (typeof api.testBanner === 'function') return api.testBanner(fields);
  return {
    ...fields,
    testOnly: true,
    rateStatus: 'TEST_ONLY_NOT_PRODUCTION',
    warning: 'TEST_ONLY_NOT_PRODUCTION. NOT A DROP RATE.',
  };
}

function nEpic(pool, bannerId) {
  return {
    bannerId,
    pool,
    entries: [
      { id: `${bannerId}_N`, rarity: 'N', weight: 1 },
      { id: `${bannerId}_EPIC`, rarity: 'Epic', weight: 0 },
    ],
  };
}

function pull(api, state, count, seed = 20261120) {
  const result = api.pull(state, { seed, count });
  if (!result?.state) throw new Error('pull must return { state, pulls }');
  return result;
}

function pullN(api, state, count) {
  return pull(api, state, count).state;
}

bindApi(gacha, [
  {
    name: 'QA-08 GA-01 avatar, action, and companion pools stay separate',
    fn(api) {
      const avatar = api.createBannerState(banner(api, nEpic('avatar', 'avatar-standard')));
      const action = api.createBannerState(banner(api, nEpic('action', 'action-standard')));
      const companion = api.createBannerState(banner(api, {
        bannerId: 'companion-standard',
        pool: 'companion',
        entries: [
          { id: 'C_N', rarity: 'N', weight: 1 },
          { id: 'C_EPIC', rarity: 'Epic', weight: 0 },
        ],
      }));
      assert.equal(avatar.pool, 'avatar');
      assert.equal(action.pool, 'action');
      assert.equal(companion.pool, 'companion');
      const pulled = pullN(api, avatar, 1);
      assert.equal(epicCount(pulled), 1);
      assert.equal(epicCount(action), 0);
      assert.equal(epicCount(companion), 0);
    },
  },
  {
    name: 'QA-08 GA-02 avatar and action share currency G',
    fn(api) {
      if (!config.mod) throw new Error('src/config/index.js defaultRuleConfig is required for the shared G currency');
      const rules = config.mod.defaultRuleConfig();
      const shared = rules.gacha?.sharedCurrency ?? rules.sharedCurrency;
      assert.equal(shared.value ?? shared, 'G');
      assert.equal(shared.status ?? 'LOCKED', 'LOCKED');
      const companionCurrency = rules.gacha?.companionCurrency;
      if (companionCurrency) assert.equal(isPendingStatus(companionCurrency.status), true);
    },
  },
  {
    name: 'QA-08 GA-03 GA-04 avatar rarity is N R Epic EX and action rarity adds FAC',
    fn() {
      if (!config.mod) throw new Error('src/config/index.js is required for rarity lists');
      const rules = config.mod.defaultRuleConfig();
      const avatar = rules.avatarRarities?.value ?? rules.gacha?.avatarRarities?.value;
      const action = rules.actionRarities?.value ?? rules.gacha?.actionRarities?.value;
      assert.deepEqual(avatar, ['N', 'R', 'Epic', 'EX']);
      assert.deepEqual(action, ['N', 'R', 'Epic', 'EX', 'FAC']);
    },
  },
  {
    name: 'QA-08 GA-05 GA-06 Epic pity threshold is 100',
    fn(api) {
      let state = api.createBannerState(banner(api, nEpic('avatar', 'avatar-epic-pity')));
      state = pullN(api, state, 99);
      assert.equal(epicCount(state), 99);
      assert.equal(topCount(state), 99);
      const guaranteed = pull(api, state, 1);
      assert.equal(guaranteed.pulls[0].rarity, 'Epic');
      assert.equal(guaranteed.pulls[0].forced, 'epic');
      assert.equal(epicCount(guaranteed.state), 0);
      assert.equal(topCount(guaranteed.state), 100);
    },
  },
  {
    name: 'QA-08 GA-07 GA-08 top tier pity threshold is 200',
    fn(api) {
      const due = (pool, bannerId, topRarities) => {
        const entries = [
          { id: `${bannerId}_N`, rarity: 'N', weight: 1 },
          { id: `${bannerId}_EPIC`, rarity: 'Epic', weight: 0 },
          ...topRarities.map((rarity) => ({ id: `${bannerId}_${rarity}`, rarity, weight: 0 })),
        ];
        const state = api.createBannerState(banner(api, { bannerId, pool, entries }), {
          epicCounter: 10,
          topCounter: 199,
        });
        const top = pull(api, state, 1);
        assert.equal(top.pulls[0].forced, 'top');
        assert.ok(topRarities.includes(top.pulls[0].rarity), top.pulls[0].rarity);
        assert.equal(epicCount(top.state), 0);
        assert.equal(topCount(top.state), 0);
      };
      due('action', 'action-top-pity', ['EX', 'FAC']);
      due('avatar', 'avatar-top-pity', ['EX']);
      if (config.mod) {
        const pity = config.mod.defaultRuleConfig().gacha?.pity;
        assert.equal(pity.avatarTopPulls ?? pity.top, 200);
        assert.equal(pity.actionTopPulls ?? pity.top, 200);
      }
    },
  },
  {
    name: 'QA-08 GA-09 GA-10 companion Epic pity is 100 and there is no top-tier pity',
    fn(api) {
      let state = api.createBannerState(banner(api, {
        bannerId: 'companion-pity',
        pool: 'companion',
        entries: [
          { id: 'C_N', rarity: 'N', weight: 1 },
          { id: 'C_EPIC', rarity: 'Epic', weight: 0 },
        ],
      }));
      assert.equal(topCount(state), null);
      state = pullN(api, state, 99);
      assert.equal(epicCount(state), 99);
      const guaranteed = pull(api, state, 1);
      assert.equal(guaranteed.pulls[0].rarity, 'Epic');
      assert.equal(epicCount(guaranteed.state), 0);
      assert.equal(topCount(guaranteed.state), null);
    },
  },
  {
    name: 'QA-08 GA-11 no fabricated drop rates or pull prices',
    fn(api) {
      assert.throws(() => api.createBannerState({ bannerId: 'bare', pool: 'avatar' }), (error) => {
        const code = `${error.code ?? ''} ${error.message ?? ''}`;
        assert.match(code, /GA11|RATES_PENDING|rate/i);
        return true;
      });
      if (config.mod) {
        const rates = config.mod.defaultRuleConfig().gacha?.rates;
        assert.equal(isPendingStatus(rates.status), true);
        assert.equal(rates.value ?? null, null);
      }
    },
  },
  {
    name: 'QA-08 GA-12 Owner t253u per-banner counters, Epic hit resets Epic only, EX or FAC resets both',
    fn(api) {
      const only = (bannerId, pool, rarity) => banner(api, {
        bannerId,
        pool,
        entries: [{ id: `${bannerId}_${rarity}`, rarity, weight: 1 }],
      });
      let avatar = api.createBannerState(only('avatar-n', 'avatar', 'N'));
      const other = api.createBannerState(only('avatar-other', 'avatar', 'N'));
      avatar = pullN(api, avatar, 1);
      assert.equal(epicCount(avatar), 1);
      assert.equal(topCount(avatar), 1);
      assert.equal(epicCount(other), 0);
      assert.equal(topCount(other), 0);
      let epicBanner = api.createBannerState(only('avatar-epic', 'avatar', 'Epic'));
      epicBanner = pullN(api, epicBanner, 1);
      assert.equal(epicCount(epicBanner), 0);
      assert.equal(topCount(epicBanner), 1);
      let exBanner = api.createBannerState(only('avatar-ex', 'avatar', 'EX'));
      exBanner = pullN(api, exBanner, 1);
      assert.equal(epicCount(exBanner), 0);
      assert.equal(topCount(exBanner), 0);
      let facBanner = api.createBannerState(only('action-fac', 'action', 'FAC'));
      facBanner = pullN(api, facBanner, 1);
      assert.equal(epicCount(facBanner), 0);
      assert.equal(topCount(facBanner), 0);
      if (typeof api.lockedPityPolicy === 'function') {
        const policy = api.lockedPityPolicy();
        assert.equal(policy.counterScope, 'banner');
        assert.equal(policy.epicHitResets, 'epic');
        assert.deepEqual(policy.topHitResets, ['epic', 'top']);
        assert.equal(policy.companionTopPity, false);
        assert.match(String(policy.evidence ?? ''), /t253u/);
      }
    },
  },
]);
