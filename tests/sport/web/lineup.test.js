import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FORMATION_IDS,
  FORMATIONS,
  PITCH_H,
  PITCH_W,
  SLOT_H,
  SLOT_W,
  assignByRole,
  buildDefaultLineups,
  flatRoles,
  placeRows,
  FOOT_COMPAT,
  BASKET_COMPAT,
  BASKET_ROLES,
} from '../../../web/sport/lineup.js';
import { getCard, listPublicCards, STARTER_OWNED } from '../../../web/sport/fixtures/catalog.js';

test('every formation is 11 and fits on the pitch without overlap', () => {
  for (const formation of FORMATION_IDS) {
    const roles = flatRoles(formation);
    assert.equal(roles.length, 11, formation);
    assert.equal(roles.filter((role) => role === 'GK').length, 1, formation);
    const spots = placeRows(FORMATIONS[formation], PITCH_W, PITCH_H, SLOT_W, SLOT_H);
    assert.equal(spots.length, 11);
    for (const spot of spots) {
      assert.ok(spot.x >= 0 && spot.y >= 0, formation);
      assert.ok(spot.x + spot.w <= PITCH_W + 0.01, formation);
      assert.ok(spot.y + spot.h <= PITCH_H + 0.01, formation);
    }
    for (let i = 0; i < spots.length; i += 1) {
      for (let j = i + 1; j < spots.length; j += 1) {
        const a = spots[i];
        const b = spots[j];
        const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        assert.equal(overlap, false, `${formation} ${i} overlaps ${j}`);
      }
    }
  }
  const court = placeRows([BASKET_ROLES], PITCH_W, PITCH_H, SLOT_W, SLOT_H);
  assert.equal(court.length, 5);
});

test('starter lineups field 11 with a keeper, 5, and 2 entries', () => {
  const owned = STARTER_OWNED.map((id) => getCard(id));
  const lineups = buildDefaultLineups(owned);
  assert.equal(lineups.football.slots.length, 11);
  assert.equal(new Set(lineups.football.slots).size, 11);
  assert.equal(lineups.football.slots.filter((id) => getCard(id).role === 'GK').length, 1);
  assert.ok(lineups.football.coachId);
  assert.equal(lineups.basket.slots.length, 5);
  assert.equal(new Set(lineups.basket.slots).size, 5);
  assert.equal(lineups.car.slots.length, 2);
  assert.equal(lineups.moto.slots.length, 2);
  const footballers = owned.filter((card) => card.sport === 'football' && card.role !== 'COACH');
  for (const formation of FORMATION_IDS) {
    const assigned = assignByRole(flatRoles(formation), footballers, FOOT_COMPAT);
    assert.equal(assigned.filter(Boolean).length, 11, formation);
    assert.equal(new Set(assigned.map((card) => card.id)).size, 11, formation);
  }
  const ballers = owned.filter((card) => card.sport === 'basket' && card.role !== 'COACH');
  const five = assignByRole(BASKET_ROLES, ballers, BASKET_COMPAT);
  assert.deepEqual(five.map((card) => card.role), ['PG', 'SG', 'SF', 'PF', 'C']);
});

test('public cards omit the private real block', () => {
  for (const card of listPublicCards()) {
    assert.equal('real' in card, false);
    assert.equal(card.status, 'PROPOSED');
    assert.equal(card.balance, 'BALANCE_PLACEHOLDER');
    assert.match(card.id, /^SPC_(FOOTBALL|BASKET|CAR|MOTO)_[A-Z]+_\d{3}$/);
  }
});
