import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createProfile } from '../../../src/save/index.js';
import {
  BANNERS,
  RARITIES,
  abs,
  firstFunction,
  gachaCandidates,
  importFirst,
  walkFiles,
  walletCandidates,
} from '../../../tools/sport-qa/lib/discover.mjs';

function bannerRecords() {
  const records = [];
  for (const file of walkFiles('content/v06/sport', (name) => name.endsWith('.json'))) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(abs(file), 'utf8'));
    } catch {
      continue;
    }
    const stack = [parsed];
    while (stack.length > 0) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node)) {
        stack.push(...node);
        continue;
      }
      if (typeof node.bannerId === 'string') records.push({ file, banner: node });
      for (const value of Object.values(node)) {
        if (value && typeof value === 'object') stack.push(value);
      }
    }
  }
  return records;
}

function stateOf(input, output) {
  if (output && typeof output === 'object') {
    if (output.profile?.currency) return output.profile;
    if (output.state?.currency) return output.state;
    if (output.currency) return output;
  }
  return input;
}

function pityOf(state, bannerId) {
  return state?.sport?.pity?.[bannerId] ?? state?.pity?.[bannerId] ?? null;
}

function onlyG(state) {
  assert.ok(state?.currency && typeof state.currency === 'object', 'pull did not return a currency bag');
  assert.deepEqual(Object.keys(state.currency).sort(), ['G']);
  assert.equal(typeof state.currency.G, 'number');
  assert.ok(Number.isFinite(state.currency.G));
}

const gacha = await importFirst(gachaCandidates());
const wallet = await importFirst(walletCandidates());
const banners = bannerRecords();
const present = Boolean(gacha.file) || Boolean(wallet.file) || banners.length > 0;

test('one G wallet, four banners, and separate pity', {
  skip: present ? false : 'sport wallet, gacha module, and banner content are absent',
}, async () => {
  if (gacha.error) throw new Error(`${gacha.file} failed to load: ${gacha.error.message}`);
  if (wallet.error) throw new Error(`${wallet.file} failed to load: ${wallet.error.message}`);

  if (banners.length > 0) {
    const ids = [...new Set(banners.map((row) => row.banner.bannerId))].sort();
    assert.deepEqual(ids, [...BANNERS].sort(), `banner ids: ${ids.join(', ')}`);
    for (const row of banners) {
      if (row.banner.currency != null) {
        const currency = row.banner.currency;
        if (typeof currency === 'string') {
          assert.match(currency, /^G\b/, `${row.banner.bannerId} currency is ${currency}`);
          assert.doesNotMatch(currency, /\b(SC|COIN|GEM|TICKET)\b/i);
        } else {
          assert.deepEqual(Object.keys(currency).sort(), ['G']);
        }
      }
      const entries = row.banner.entries ?? row.banner.pool ?? row.banner.weights ?? [];
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          if (entry && entry.rarity != null) assert.ok(RARITIES.includes(entry.rarity), entry.rarity);
        }
      }
    }
  }

  if (gacha.mod) {
    const pull = firstFunction(gacha.mod, ['pullSport', 'pull', 'default']);
    assert.ok(pull, `${gacha.file} exports ${Object.keys(gacha.mod).join(', ')}; pullSport is missing`);
    let state = createProfile({ profileId: 'QA_SPORT_PULL', currency: { G: 5000 } });
    state.sport = {
      roster: {},
      pity: {
        SPORT_FOOTBALL: { epic: 0, ex: 0 },
        SPORT_BASKET: { epic: 0, ex: 0 },
        SPORT_CAR: { epic: 0, ex: 0 },
        SPORT_MOTO: { epic: 0, ex: 0 },
      },
      ledger: [],
    };
    const startG = state.currency.G;
    const football = stateOf(state, await pull.fn(structuredClone(state), 'SPORT_FOOTBALL', 1, 11));
    onlyG(football);
    assert.ok(football.currency.G <= startG, 'football pull increased G');
    const footballPity = structuredClone(pityOf(football, 'SPORT_FOOTBALL'));
    const basketBefore = structuredClone(pityOf(football, 'SPORT_BASKET'));
    const mixed = stateOf(football, await pull.fn(structuredClone(football), 'SPORT_BASKET', 1, 29));
    onlyG(mixed);
    assert.deepEqual(pityOf(mixed, 'SPORT_FOOTBALL'), footballPity, 'basket pull changed football pity');
    assert.deepEqual(pityOf(mixed, 'SPORT_CAR'), pityOf(football, 'SPORT_CAR'));
    assert.deepEqual(pityOf(mixed, 'SPORT_MOTO'), pityOf(football, 'SPORT_MOTO'));
    if (basketBefore && pityOf(mixed, 'SPORT_BASKET')) {
      assert.notDeepEqual(
        pityOf(mixed, 'SPORT_BASKET'),
        pityOf(mixed, 'SPORT_FOOTBALL'),
        'football and basket pity collapsed to the same counter',
      );
    }
  }

  if (wallet.mod) {
    const names = Object.keys(wallet.mod);
    const grant = names.map((name) => [name, wallet.mod[name]]).find(([name, value]) => (
      typeof value === 'function' && /grant|credit/i.test(name)
    ));
    assert.ok(grant, `${wallet.file} exports ${names.join(', ')}; no grant function`);
    const base = createProfile({ profileId: 'QA_SPORT_WALLET', currency: { G: 100 } });
    const request = { id: 'qa-grant-1', txnId: 'qa-grant-1', G: 15, amount: 15 };
    let once;
    try {
      once = stateOf(base, await grant[1](structuredClone(base), request));
    } catch {
      once = stateOf(base, await grant[1](structuredClone(base), 15, 'qa-grant-1'));
    }
    onlyG(once);
    assert.equal(once.currency.G, 115);
    let twice;
    try {
      twice = stateOf(once, await grant[1](structuredClone(once), request));
    } catch {
      twice = stateOf(once, await grant[1](structuredClone(once), 15, 'qa-grant-1'));
    }
    onlyG(twice);
    assert.equal(twice.currency.G, once.currency.G, 'replaying the same grant id changed G');
  }
});
