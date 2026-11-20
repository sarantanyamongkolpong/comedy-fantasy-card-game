import assert from 'node:assert/strict';
import test from 'node:test';
import { createMatch, endTurn, playAction, sampleCard } from '../../../src/engine/index.js';
import { handCard, matchInput, padDeck, roster } from '../../engine/fixture.js';
import { holdLogFx, presentLogFx, releaseHeldLog } from '../../../web/js/battle-fx/floaters.js';
import { shieldPool, shieldRatio } from '../../../web/js/battle-fx/shield.js';
import { statusFlags } from '../../../web/js/battle-fx/status.js';

function play(state, cardId, actorAvatarId, targets) {
  const card = handCard(state, 'player', cardId);
  assert.ok(card, cardId);
  return playAction(state, { cardInstanceId: card.instanceId, actorAvatarId, targets });
}

test('state.log damage, shield, and regen rows keep their floater tones', () => {
  const state = createMatch(matchInput({
    player: roster((avatar) => { avatar.hp = 20; avatar.maxHp = 30; }),
    enemy: roster((avatar) => { avatar.hp = 20; avatar.maxHp = 30; avatar.stats.def = 0; }),
    playerDeck: padDeck([
      sampleCard({ cardId: 'HIT', costAp: 0, effects: [{ op: 'damage', mode: 'flat', amount: 4 }] }),
      sampleCard({ cardId: 'WALL', type: 'DEF', costAp: 0, targetRule: 'Self', effects: [{ op: 'shield', amount: 2, target: 'self' }] }),
      sampleCard({ cardId: 'GRACE', type: 'Skill', costAp: 0, targetRule: 'Ally', effects: [{ op: 'trigger_active' }] }),
    ]),
    enemyDeck: padDeck([sampleCard({ cardId: 'WAIT', costAp: 0, effects: [{ op: 'shield', amount: 0, target: 'self' }] })]),
    enemyControl: 'human',
  }));
  play(state, 'HIT', 'AVT_PHA_002', ['AVT_AEG_002']);
  play(state, 'WALL', 'AVT_AEG_002');
  play(state, 'GRACE', 'AVT_SAN_002');
  endTurn(state);
  endTurn(state);

  const fx = presentLogFx(state.log, 0);
  const damage = fx.floaters.find((item) => item.tone === 'damage');
  const shield = fx.floaters.find((item) => item.tone === 'shield');
  const regen = fx.floaters.filter((item) => item.tone === 'regen');
  const heals = fx.floaters.filter((item) => item.tone === 'heal');
  assert.equal(damage.text, '-4');
  assert.equal(damage.className.includes('is-damage'), true);
  assert.equal(shield.text, 'SHIELD 2');
  assert.equal(shield.className.includes('is-shield'), true);
  assert.equal(regen.length, 4);
  assert.ok(heals.length >= 1);
  assert.ok(heals.every((item) => item.text.startsWith('+')));
  assert.equal(fx.cursor, state.log.length);

  const guarded = state.sides.player.avatars.find((avatar) => avatar.avatarId === 'AVT_AEG_002');
  assert.equal(shieldPool({ instanceId: guarded.unitId, sideId: 'player' }, guarded), guarded.shield);
  assert.equal(shieldRatio(guarded.shield, guarded.maxHp), guarded.shield / guarded.maxHp);
  assert.equal(shieldRatio(0, 30), 0);
  assert.equal(shieldRatio(3, 0), 1);
});

test('a second paint in the same turn still has the log number', () => {
  const log = [];
  assert.equal(holdLogFx(log).floaters.length, 0);
  log.push({ type: 'shield', avatarId: 'AVT', sideId: 'player', amount: 2, delta: 0, shield: 2 });
  const first = holdLogFx(log);
  const second = holdLogFx(log);
  assert.equal(first.floaters[0].text, 'SHIELD 2');
  assert.equal(second.floaters[0].text, 'SHIELD 2');
  releaseHeldLog();
  assert.equal(holdLogFx(log).floaters.length, 0);
  const next = [];
  next.push({ type: 'damage', avatarId: 'AVT', sideId: 'enemy', delta: -4, dealt: 4, hp: 10 });
  assert.equal(holdLogFx(next).floaters.length, 0);
  releaseHeldLog();
});

test('status flags follow existing kinds and do not invent a debuff', () => {
  assert.deepEqual(statusFlags({ statuses: [] }, null), {
    shield: false, taunt: false, regen: false, buff: false, debuff: false,
  });
  const taunt = statusFlags({ statuses: [{ id: 'taunt', name: 'taunt' }] });
  assert.equal(taunt.taunt, true);
  assert.equal(taunt.debuff, false);
  assert.equal(statusFlags({ statuses: [{ id: 'atkBuff', name: 'buff' }] }).buff, true);
  assert.equal(statusFlags({ statuses: [{ id: 'next_attack', name: 'next_attack' }] }).buff, true);
  assert.equal(statusFlags({ statuses: [{ id: 'regen', name: 'regen' }] }).regen, true);
  assert.equal(statusFlags({ statuses: [{ id: 'debuff', name: 'debuff' }] }).debuff, true);
  assert.equal(statusFlags({ shield: 4 }).shield, true);
  assert.equal(shieldPool({ statuses: [{ id: 'shield', amount: 3 }] }, null), 3);
});
