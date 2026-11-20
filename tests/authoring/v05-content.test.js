import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { exampleTestBanners } from '../../src/gacha/test-config.js';
import { DEMO_MIXED_DECK, V05_JUSTIN_AVATARS, V05_STARTER_ACTIONS } from '../../src/schema/v05-samples.js';
import { buildV05Content } from '../../src/schema/v05-samples.js';
import { validateActionCard, validateAvatar } from '../../src/schema/validate.js';
import { validateDeck } from '../../src/schema/deck.js';
import { DECK_SIZE, OWNER_EVIDENCE_T253U, OWNER_EVIDENCE_T261U } from '../../src/schema/constants.js';
import { defaultRuleConfig, pendingOwnerFlags } from '../../src/config/index.js';

function read(relative) {
  return JSON.parse(readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8'));
}

test('committed v05 content matches the builder and validates', () => {
  const built = buildV05Content();
  const avatars = read('content/v05/avatars/justin-avatars.json');
  const actions = read('content/v05/actions/starter-actions.json');
  const deckFile = read('content/v05/decks/demo-mixed-deck.json');
  const enemies = read('content/v05/enemies/demo-battle.json');
  const banners = read('content/v05/gacha/TEST_ONLY_banners.json');
  assert.deepEqual(avatars.avatars, built.avatars);
  assert.deepEqual(actions.actionCards, built.actions);
  assert.deepEqual(deckFile.deck, built.deck);
  assert.deepEqual(enemies.battle, built.enemies);
  const house = read('content/v05/hideout/house-tiers.json');
  assert.deepEqual(house.houseTiers, built.houseTiers);
  assert.deepEqual(house.mapDestinations, built.mapDestinations);
  assert.deepEqual(banners, exampleTestBanners());
  assert.equal(avatars.contentTier, 'draft');
  assert.equal(banners.warning.includes('NOT A DROP RATE'), true);

  for (const avatar of V05_JUSTIN_AVATARS) assert.deepEqual(validateAvatar(avatar), []);
  for (const card of V05_STARTER_ACTIONS) {
    assert.deepEqual(validateActionCard(card), []);
    assert.equal(card.fieldStatus.Cost_AP, 'PLACEHOLDER');
    assert.notEqual(card.Version_And_Status, 'LOCKED');
  }
  assert.equal(DEMO_MIXED_DECK.cardIds.length, DECK_SIZE);
});

test('Justin identity is locked and only Justina active is a locked skill', () => {
  const ids = V05_JUSTIN_AVATARS.map((avatar) => [avatar.avatarId, avatar.nameEn, avatar.designRef, avatar.identity.notARenameOf]);
  assert.deepEqual(ids, [
    ['AVT_AEG_002', 'Justin Case', 'AV_EX01', 'AVT_AEG_001'],
    ['AVT_PHA_002', 'Justin Time', 'AV_EX02', 'AVT_PHA_001'],
    ['AVT_CEL_002', 'Justin Theory', 'AV_EX03', 'AVT_CEL_001'],
    ['AVT_SAN_002', 'Justina Moment', 'AV_EX04', 'AVT_SAN_001'],
  ]);
  for (const avatar of V05_JUSTIN_AVATARS) {
    assert.equal(avatar.identity.status, 'LOCKED');
    assert.equal(avatar.identity.evidence, OWNER_EVIDENCE_T253U);
    assert.equal(avatar.stats.valueStatus, 'PROPOSED');
    assert.equal(avatar.rarity, 'Epic');
  }
  const justina = V05_JUSTIN_AVATARS[3];
  assert.equal(justina.gender, 'female');
  assert.equal(justina.skills.active.Name, 'Saving Grace');
  assert.equal(justina.skills.active.Version_And_Status, 'LOCKED');
  assert.equal(justina.skills.active.Effect_Spec.ops[0].amount, 3);
  assert.equal(justina.skills.active.Effect_Spec.ops[0].durationTurns, 2);
  assert.equal(justina.skills.active.Effect_Spec.tickTiming.status, 'PENDING_OWNER');
  assert.equal(justina.skills.passive.Version_And_Status, 'PROPOSED');
  for (const avatar of V05_JUSTIN_AVATARS.slice(0, 3)) {
    assert.equal(avatar.skills.active.Version_And_Status, 'PROPOSED');
    assert.equal(avatar.skills.passive.Version_And_Status, 'PROPOSED');
  }
});

test('the demo deck is 30 cards, mixed factions are legal, and FAC legality is reported', () => {
  const cardsById = new Map(V05_STARTER_ACTIONS.map((card) => [card.cardId, card]));
  const open = validateDeck(DEMO_MIXED_DECK, { cardsById });
  assert.equal(open.ok, true);
  assert.equal(open.info.mixed, true);
  assert.equal(open.info.singleFactionForbidden, false);
  assert.equal(open.info.duplicateMax.status, 'PENDING_OWNER');
  assert.ok(open.info.facLegality.every((row) => row.legal === false));

  const partial = validateDeck(DEMO_MIXED_DECK, {
    cardsById,
    teamFactions: ['FAC_AEG', 'FAC_SAN'],
  });
  assert.equal(partial.ok, true);
  const aegis = partial.info.facLegality.filter((row) => row.faction === 'FAC_AEG');
  const phantom = partial.info.facLegality.filter((row) => row.faction === 'FAC_PHA');
  assert.ok(aegis.every((row) => row.legal));
  assert.ok(phantom.every((row) => row.legal === false));

  const enforced = validateDeck(
    { cardIds: Array.from({ length: 29 }, () => 'ACT_GEN_ATK_001') },
    { cardsById },
  );
  assert.equal(enforced.ok, false);

  const gated = validateDeck(DEMO_MIXED_DECK, { cardsById, teamFactions: ['FAC_AEG'], enforceFac: true });
  assert.equal(gated.ok, false);
});

test('t253u decisions are locked and the other open rules stay pending', () => {
  const config = defaultRuleConfig();
  assert.equal(config.powToAtk.status, 'LOCKED');
  assert.equal(config.powToAtk.mapping, '1:1');
  assert.equal(config.powToAtk.evidence, OWNER_EVIDENCE_T253U);
  assert.equal(config.justinCharacters.status, 'LOCKED');
  assert.equal(config.justinCharacters.evidence, OWNER_EVIDENCE_T253U);
  assert.equal(config.gacha.pity.status, 'LOCKED');
  assert.equal(config.gacha.pity.evidence, OWNER_EVIDENCE_T253U);
  assert.equal(config.gacha.pity.counterScope, 'banner');
  assert.equal(config.gacha.pity.epicAndTopSeparate, true);
  assert.equal(config.gacha.pity.epicHitResets, 'epic');
  assert.deepEqual(config.gacha.pity.topHitResets, ['epic', 'top']);
  assert.equal(config.deckSize.value, 30);
  assert.equal(config.deckSize.status, 'LOCKED');
  assert.equal(config.gacha.rates.status, 'PENDING_OWNER');
  assert.equal(config.gacha.costG.value, null);
  assert.equal(config.house.cabinBaseCapacity.status, 'PENDING_OWNER');
  assert.equal(config.teamSpdAggregation.status, 'PENDING_OWNER');
  assert.equal(config.deckDuplicateMax.status, 'PENDING_OWNER');
  assert.equal(config.vrSync.status, 'REJECTED');
  assert.equal(config.vrSync.value, null);
  assert.equal(config.vrSync.evidence, OWNER_EVIDENCE_T261U);
  assert.equal(config.autoBattle.status, 'LOCKED');
  assert.equal(config.autoBattle.value, true);
  assert.equal(config.autoBattle.evidence, OWNER_EVIDENCE_T261U);
  assert.equal(config.autoPolicy.status, 'PROPOSED');
  assert.equal(config.autoPolicy.value, 'balanced');
  assert.equal(config.autoPolicy.speed.status, 'PROPOSED');
  const pending = pendingOwnerFlags(config).map((row) => row.rule);
  assert.equal(pending.includes('GA-12'), false);
  assert.equal(pending.includes('CORE-005'), false);
  assert.equal(pending.includes('CORE-037'), false);
  assert.ok(pending.includes('GA-11'));
  assert.ok(pending.includes('HOME-11'));
  assert.ok(pending.includes('CORE-038'));
  assert.ok(pending.includes('CORE-040'));
});
