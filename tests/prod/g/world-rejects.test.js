import assert from 'node:assert/strict';
import test from 'node:test';
import { repoRootFrom } from '../../../tools/content/world/canon.js';
import { loadWorldPack, validateWorldPack } from '../../../tools/content/world/validate.js';

const root = repoRootFrom();

function broken(mutate) {
  const world = loadWorldPack(root);
  mutate(world);
  return validateWorldPack(world);
}

test('a price number is rejected', () => {
  const errors = broken((world) => {
    world.npcs[0].economy.price = 5;
  });
  assert.ok(errors.some((error) => error.includes('price')));
});

test('a G amount is rejected', () => {
  const errors = broken((world) => {
    world.shopkeepers[1].offers[0].G = 10;
  });
  assert.ok(errors.some((error) => error.includes('.G')));
});

test('an unlock cost is rejected', () => {
  const errors = broken((world) => {
    world.progression.chapters[0].stages[0].reward.unlockCost = 1;
  });
  assert.ok(errors.some((error) => error.includes('unlockCost')));
});

test('rate and weight fields are rejected', () => {
  const errors = broken((world) => {
    world.shopkeepers[1].offers[0].dropRate = null;
    world.shopkeepers[1].offers[1].weight = 1;
  });
  assert.ok(errors.some((error) => error.includes('dropRate')));
  assert.ok(errors.some((error) => error.includes('weight')));
});

test('economy amounts hidden in prose are rejected', () => {
  const errors = broken((world) => {
    world.npcs[0].lines[0] = 'The pin costs 40 G and the doormat is horrified.';
  });
  assert.ok(errors.some((error) => error.includes('G amount')));
});

test('citing the locked AP discard cost is not an economy amount', () => {
  const errors = broken((world) => {
    world.tutorials[3].body = 'Optional toss costs 1 AP. The turn still waits for END TURN after that spent point.';
  });
  assert.deepEqual(errors, []);
});

test('a main quest flag is rejected', () => {
  const errors = broken((world) => {
    world.sideEvents[0].mainQuest = true;
  });
  assert.ok(errors.length > 0);
});

test('unknown enemies, cards, and destination ids are rejected', () => {
  const enemyErrors = broken((world) => {
    world.progression.chapters[0].stages[0].enemies[0].enemyId = 'ENM_DEMO_999';
  });
  assert.ok(enemyErrors.some((error) => error.includes('enemies')));
  const cardErrors = broken((world) => {
    world.tutorials[7].mentionsCardIds.push('ACT_NO_SUCH');
  });
  assert.ok(cardErrors.some((error) => error.includes('ACT_NO_SUCH')));
  const destinationErrors = broken((world) => {
    world.npcs[1].building.mapDestinationId = 'tower';
  });
  assert.ok(destinationErrors.some((error) => error.includes('mapDestinationId')));
});

test('duplicate ids and approval statuses are rejected', () => {
  const duplicate = broken((world) => {
    world.npcs[1].id = world.npcs[0].id;
  });
  assert.ok(duplicate.some((error) => error.includes('duplicate')));
  const approved = broken((world) => {
    world.npcs[0].reviewStatus = 'OWNER_APPROVED';
  });
  assert.ok(approved.length > 0);
  const extra = broken((world) => {
    world.npcs[0].balance = 3;
  });
  assert.ok(extra.some((error) => error.includes('additional property') || error.includes('unexpected number')));
});
