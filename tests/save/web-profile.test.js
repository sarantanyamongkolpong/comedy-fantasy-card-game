import assert from 'node:assert/strict';
import test from 'node:test';
import { createProfile } from '../../src/save/inventory.js';
import { deserialize, playerView, serialize } from '../../src/save/serialize.js';

test('a web starter round-trips team and deck on the data profile', () => {
  const ui = {
    team: ['own:AVT_AEG_002', 'own:AVT_PHA_002', 'own:AVT_CEL_002', 'own:AVT_SAN_002'],
    deck: ['own:ACT_0001', 'own:ACT_0002'],
    currencyG: 0,
    autoPlay: { enabled: false, speed: 'normal' },
    house: { tierId: 'cabin' },
  };
  const loaded = deserialize(serialize(ui));
  assert.deepEqual(loaded.team, ui.team);
  assert.deepEqual(loaded.deck, ui.deck);
  assert.equal(loaded.preferences.autoBattle, false);
  assert.equal(loaded.currency.G, 0);
  assert.deepEqual(playerView(loaded).team, ui.team);
  assert.deepEqual(playerView(loaded).deck, ui.deck);
  const again = deserialize(serialize(loaded));
  assert.deepEqual(again.team, ui.team);
  assert.deepEqual(again.deck, ui.deck);
});

test('team and deck stored only under web.ui are lifted onto the data profile', () => {
  const profile = createProfile();
  profile.web = {
    ui: {
      team: ['own:AVT_AEG_002'],
      deck: ['own:ACT_0001'],
    },
  };
  const loaded = deserialize(serialize(profile));
  assert.deepEqual(loaded.team, ['own:AVT_AEG_002']);
  assert.deepEqual(loaded.deck, ['own:ACT_0001']);
  assert.deepEqual(playerView(loaded).team, loaded.team);
});
