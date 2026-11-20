import assert from 'node:assert/strict';
import test from 'node:test';
import { SPORT_BANNERS, SPORT_CATALOG, pullSport, toPublicCard } from '../../../src/sport/gacha/index.js';
import { applyBattleReward, createProfile } from '../../../src/save/index.js';
import { claimReward, earn, spend } from '../../../src/sport/wallet/index.js';

function purse(gacha = {}, pity = {}) {
  return {
    currency: { G: 5000 },
    pity: { TEST_BANNER_AVATAR: { epicCounter: 3, topCounter: 9, pool: 'avatar' } },
    rewardLedger: { MATCH_DEMO_1: { grants: { G: 4, items: [] } } },
    inventory: { avatars: [], actions: [], companions: [] },
    sport: {
      roster: {},
      pity,
      ledger: [],
      tuning: { gacha },
    },
  };
}

test('the sport ledger is append-only, idempotent, and refuses a negative balance', () => {
  const start = createProfile({ currency: { G: 10 } });
  start.pity.TEST_BANNER_AVATAR = { epicCounter: 2, topCounter: 5, pool: 'avatar' };
  const spent = spend(start, { txnId: 'spend-1', amount: 4, reason: 'test-spend' });
  assert.equal(spent.applied, true);
  assert.equal(spent.state.currency.G, 6);
  assert.equal(start.currency.G, 10);
  assert.equal(spent.state.sport.ledger.length, 1);
  assert.equal(spent.state.sport.ledger[0].balanceAfter, 6);
  const again = spend(spent.state, { txnId: 'spend-1', amount: 4, reason: 'test-spend' });
  assert.equal(again.applied, false);
  assert.equal(again.state, spent.state);
  assert.throws(() => spend(spent.state, { txnId: 'spend-2', amount: 7, reason: 'too-much' }), (error) => error.code === 'INSUFFICIENT_G');
  assert.equal(spent.state.currency.G, 6);
  const gained = earn(spent.state, { txnId: 'earn-1', amount: 5, reason: 'test-earn' });
  assert.equal(gained.state.currency.G, 11);
  assert.deepEqual(gained.state.sport.ledger[0], spent.state.sport.ledger[0]);
  assert.equal(gained.state.sport.ledger[1].seq, 2);
  assert.deepEqual(gained.state.pity, start.pity);
  assert.deepEqual(gained.state.rewardLedger, start.rewardLedger);
  const claimed = claimReward(gained.state, { txnId: 'reward-1', amount: 0, reason: 'empty-purse' });
  const claimedAgain = claimReward(claimed.state, { txnId: 'reward-1', amount: 9, reason: 'empty-purse' });
  assert.equal(claimed.applied, true);
  assert.equal(claimedAgain.applied, false);
  assert.equal(claimed.state.currency.G, 11);
  const battle = applyBattleReward(claimed.state, { matchId: 'MATCH_NEW', rewards: { G: 2 } });
  assert.equal(battle.profile.currency.G, 13);
  assert.equal(battle.profile.sport.ledger.length, claimed.state.sport.ledger.length);
  assert.equal(battle.profile.rewardLedger.MATCH_NEW.grants.G, 2);
});

test('pullSport is x1/x10, isolated per banner, and guarantees pity', () => {
  assert.deepEqual(SPORT_BANNERS, ['SPORT_FOOTBALL', 'SPORT_BASKET', 'SPORT_CAR', 'SPORT_MOTO']);
  const cheap = { weights: { N: 1, R: 0, Epic: 0, EX: 0 }, costG: 1 };
  let state = purse(cheap);
  const avatarPity = structuredClone(state.pity);
  for (let index = 0; index < 99; index += 1) {
    const pulled = pullSport(state, 'SPORT_FOOTBALL', 1, index);
    assert.equal(pulled.pulls[0].rarity, 'N');
    assert.equal(pulled.pulls[0].sport, 'football');
    state = pulled.state;
  }
  assert.equal(state.sport.pity.SPORT_FOOTBALL.epicCounter, 99);
  const guaranteed = pullSport(state, 'SPORT_FOOTBALL', 1, 99);
  assert.ok(guaranteed.pulls[0].rarity === 'Epic' || guaranteed.pulls[0].rarity === 'EX');
  assert.equal(guaranteed.pulls[0].forced, 'epic');
  assert.equal(guaranteed.pulls[0].epicCounter, 0);
  assert.equal(state.sport.pity.SPORT_BASKET, undefined);
  assert.deepEqual(guaranteed.state.pity, avatarPity);

  const exState = purse(cheap, { SPORT_CAR: { epicCounter: 4, exCounter: 199, pulls: 199 } });
  const ex = pullSport(exState, 'SPORT_CAR', 1, 5);
  assert.equal(ex.pulls[0].rarity, 'EX');
  assert.equal(ex.pulls[0].forced, 'EX');
  assert.equal(ex.pity.epicCounter, 0);
  assert.equal(ex.pity.exCounter, 0);
  assert.equal(Object.hasOwn(ex.state.sport.roster[ex.pulls[0].id], 'real'), false);

  const natural = purse({ weights: { N: 0, R: 0, Epic: 1, EX: 0 }, costG: 1 }, {
    SPORT_MOTO: { epicCounter: 4, exCounter: 40, pulls: 4 },
  });
  const epic = pullSport(natural, 'SPORT_MOTO', 1, 8);
  assert.equal(epic.pulls[0].rarity, 'Epic');
  assert.equal(epic.pity.epicCounter, 0);
  assert.equal(epic.pity.exCounter, 41);

  const fresh = purse();
  delete fresh.sport.tuning;
  const single = pullSport(fresh, 'SPORT_BASKET', 1, 2);
  assert.equal(single.state.currency.G, 4900);
  assert.equal(single.pulls.length, 1);
  assert.equal(single.spent.amount, 100);
  const ten = pullSport(fresh, 'SPORT_BASKET', 10, 2);
  assert.equal(ten.pulls.length, 10);
  assert.equal(ten.state.currency.G, 4000);
  assert.equal(ten.state.sport.ledger.length, 1);
  assert.equal(ten.pulls.every((row) => row.sport === 'basket'), true);
  assert.equal(fresh.currency.G, 5000);

  const broke = purse();
  broke.currency.G = 50;
  const before = structuredClone(broke);
  assert.throws(() => pullSport(broke, 'SPORT_CAR', 1, 1), (error) => error.code === 'INSUFFICIENT_G');
  assert.deepEqual(broke, before);
  assert.throws(() => pullSport(fresh, 'SPORT_FOOTBALL', 2, 1), (error) => error.code === 'BAD_COUNT');
  assert.throws(() => pullSport(fresh, 'SPORT_OTHER', 1, 1), (error) => error.code === 'BAD_BANNER');
  assert.throws(() => pullSport(fresh, 'SPORT_MOTO', 1, '1'), (error) => error.code === 'BAD_SEED');
});

test('a repeated sport pull transaction does not spend twice and stacks roster quantity', () => {
  const common = SPORT_CATALOG.SPORT_FOOTBALL.find((card) => card.rarity === 'N');
  const epic = SPORT_CATALOG.SPORT_FOOTBALL.find((card) => card.rarity === 'Epic');
  const ex = SPORT_CATALOG.SPORT_FOOTBALL.find((card) => card.rarity === 'EX');
  const state = purse({ weights: { N: 1, R: 0, Epic: 0, EX: 0 }, costG: 1, pools: undefined });
  state.sport.tuning.pools = { SPORT_FOOTBALL: [common, epic, ex] };
  const first = pullSport(state, 'SPORT_FOOTBALL', 1, 4);
  const second = pullSport(first.state, 'SPORT_FOOTBALL', 1, 4);
  assert.equal(second.state.sport.roster[common.id].qty, 2);
  assert.deepEqual(toPublicCard(common).rarity, 'N');
  const replay = structuredClone(second.state);
  replay.sport.pity.SPORT_FOOTBALL = { epicCounter: 0, exCounter: 0, pulls: 0 };
  const ignored = pullSport(replay, 'SPORT_FOOTBALL', 1, 4);
  assert.equal(ignored.applied, false);
  assert.equal(ignored.state.currency.G, replay.currency.G);
  assert.equal(replay.sport.roster[common.id].qty, 2);
});
