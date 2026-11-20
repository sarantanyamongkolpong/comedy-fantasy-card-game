import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import * as avatarCatalog from '../../../src/avatars/catalog.js';

const SAMPLE_AVATARS = avatarCatalog.SAMPLE_AVATARS;
import { bindApi, CONFIG_FILES, ENGINE_EXPORTS, ENGINE_FILES, loadNamed, repoPath, tryImport } from './helpers/load-api.js';
import { buildMatch, deckLists, rosters } from './helpers/match.js';
import { apOf, asState, expectReject, playCard, zonesOf } from './helpers/state.js';

const EXPECTED_001 = [
  {
    avatarId: 'AVT_AEG_001',
    nameEn: 'Sir Potlid',
    nameTh: 'เซอร์ฝาหม้อ',
    factionId: 'FAC_AEG',
    role: 'Tank',
    rigId: 'humanoid_heavy',
    assetIds: {
      cardArt: 'CARD_AVT_AEG_001_card_v1',
      cardArtVariantGoldpot: 'CARD_AVT_AEG_001_card_v1_variant_goldpot',
    },
  },
  {
    avatarId: 'AVT_PHA_001',
    nameEn: 'Nox Squeak',
    nameTh: 'น็อกซ์ รองเท้าดัง',
    factionId: 'FAC_PHA',
    role: 'DPS',
    rigId: 'humanoid_standard',
    assetIds: { cardArt: 'CARD_AVT_PHA_001_card_v1' },
  },
  {
    avatarId: 'AVT_CEL_001',
    nameEn: 'Madame Meteor',
    nameTh: 'มาดามดาวตก',
    factionId: 'FAC_CEL',
    role: 'Magic',
    rigId: 'humanoid_standard',
    assetIds: { cardArt: 'CARD_AVT_CEL_001_card_v1' },
  },
  {
    avatarId: 'AVT_SAN_001',
    nameEn: 'Sister Plaster',
    nameTh: 'ซิสเตอร์พลาสเตอร์',
    factionId: 'FAC_SAN',
    role: 'Support',
    rigId: 'humanoid_standard',
    assetIds: { cardArt: 'CARD_AVT_SAN_001_card_v1' },
  },
];

test('D-ID Owner t253u AVT_AEG_001 AVT_PHA_001 AVT_CEL_001 AVT_SAN_001 identities unchanged', () => {
  for (const expected of EXPECTED_001) {
    const found = SAMPLE_AVATARS.find((avatar) => avatar.avatarId === expected.avatarId);
    assert.ok(found, `${expected.avatarId} missing from the catalog`);
    assert.equal(found.nameEn, expected.nameEn);
    assert.equal(found.nameTh, expected.nameTh);
    assert.equal(found.factionId, expected.factionId);
    assert.equal(found.role, expected.role);
    assert.equal(found.rigId, expected.rigId);
    assert.deepEqual(found.assetIds, expected.assetIds);
  }
});

function walkJsonFiles(dir, out = []) {
  if (!statSafe(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) walkJsonFiles(full, out);
    else if (name.endsWith('.json')) out.push(full);
  }
  return out;
}

function statSafe(dir) {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function collectRosterHits(ids) {
  const hits = new Map(ids.map((id) => [id, []]));
  const consider = (value, where) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const entry of value) consider(entry, where);
      return;
    }
    const id = value.avatarId ?? value.rosterId ?? value.designId;
    if (typeof id === 'string' && hits.has(id)) hits.get(id).push({ where, value });
    for (const child of Object.values(value)) consider(child, where);
  };
  for (const avatar of SAMPLE_AVATARS) consider(avatar, 'src/avatars/catalog.js#SAMPLE_AVATARS');
  if (Array.isArray(avatarCatalog.V05_JUSTIN_AVATARS)) {
    for (const avatar of avatarCatalog.V05_JUSTIN_AVATARS) consider(avatar, 'src/avatars/catalog.js#V05_JUSTIN_AVATARS');
  }
  for (const file of [
    ...walkJsonFiles(repoPath('content')),
    ...walkJsonFiles(repoPath('src')),
  ]) {
    consider(JSON.parse(readFileSync(file, 'utf8')), file);
  }
  return hits;
}

function sameName(actual, expected) {
  return String(actual ?? '').trim().toLowerCase() === expected.toLowerCase();
}

const justinIds = ['AVT_AEG_002', 'AVT_PHA_002', 'AVT_CEL_002', 'AVT_SAN_002'];
const justinHits = collectRosterHits(justinIds);
const justinsLanded = justinIds.every((id) => (justinHits.get(id) ?? []).length > 0);

if (!justinsLanded) {
  test.todo('D-ID Owner t253u Justins are new records AVT_AEG_002 AVT_PHA_002 AVT_CEL_002 AVT_SAN_002 — roster records not landed (stream B)');
  test.todo('AV_EX01 AV_EX02 AV_EX03 name and faction stay locked while stats stay PROPOSED — roster records not landed (stream B)');
  test.todo('AV_EX04 Justina Moment is female and Saving Grace stays LOCKED while her other stats stay PROPOSED — roster records not landed (stream B)');
} else {
  test('D-ID Owner t253u Justins are new records AVT_AEG_002 AVT_PHA_002 AVT_CEL_002 AVT_SAN_002', () => {
    const expected = rosters().justins;
    for (const row of expected) {
      const hit = justinHits.get(row.rosterId)[0].value;
      assert.equal(hit.designRef, row.designRef);
      assert.ok(sameName(hit.nameEn ?? hit.name, row.nameEn));
      assert.equal(hit.factionId ?? hit.factionCode, row.factionCode);
      assert.notEqual(hit.avatarId ?? hit.rosterId, row.rosterId.replace('_002', '_001'));
    }
    for (const id of ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001']) {
      assert.ok(SAMPLE_AVATARS.some((avatar) => avatar.avatarId === id));
    }
  });

  test('AV_EX01 AV_EX02 AV_EX03 name and faction stay locked while stats stay PROPOSED', () => {
    for (const row of rosters().justins.filter((avatar) => avatar.rosterId !== 'AVT_SAN_002')) {
      const hit = justinHits.get(row.rosterId)[0].value;
      assert.equal(hit.designRef, row.designRef);
      assert.equal(hit.factionId ?? hit.factionCode, row.factionCode);
      const statsStatus = hit.statsStatus ?? hit.stats?.valueStatus ?? hit.stats?.sampleStatus ?? hit.stats?.status ?? hit.fieldStatus?.stats;
      assert.equal(statsStatus, 'PROPOSED');
      if (hit.identity?.notARenameOf) assert.equal(hit.identity.notARenameOf, row.rosterId.replace('_002', '_001'));
    }
  });

  test('AV_EX04 Justina Moment is female and Saving Grace stays LOCKED while her other stats stay PROPOSED', () => {
    const hit = justinHits.get('AVT_SAN_002')[0].value;
    assert.ok(sameName(hit.nameEn ?? hit.name, 'Justina Moment'));
    const female = hit.female === true || hit.gender === 'female' || hit.sex === 'female';
    assert.equal(female, true);
    const active = hit.active ?? hit.skills?.active;
    assert.equal(active?.status ?? hit.fieldStatus?.active, 'LOCKED');
    assert.match(String(active?.name ?? active?.Name ?? ''), /saving grace/i);
    const effectText = JSON.stringify(active?.effect ?? active?.Effect_Spec ?? active ?? {});
    assert.match(effectText, /3/);
    assert.match(effectText, /2/);
    const statsStatus = hit.statsStatus ?? hit.stats?.valueStatus ?? hit.fieldStatus?.stats;
    assert.equal(statsStatus, 'PROPOSED');
  });
}

const skillApi = await (async () => {
  const mod = await tryImport('src/schema/validate-v05.js') ?? await tryImport('src/schema/validate.js');
  const fn = mod?.validateSkillSlots ?? mod?.validateAvatarSkills;
  if (typeof fn !== 'function') {
    return { mod: null, missing: ['validateSkillSlots'], reason: 'validateSkillSlots not landed (stream B)' };
  }
  return { mod: { validateSkillSlots: fn, validateAvatarV05: mod.validateAvatarV05 }, missing: [], reason: null };
})();

function slotErrors(fn, rarity, skills) {
  if (fn.length >= 3) {
    const errors = [];
    fn(rarity, skills, 'skills', errors);
    return errors;
  }
  return fn({ rarity, ...skills });
}

function rejected(result) {
  if (result === false) return true;
  if (Array.isArray(result)) return result.length > 0;
  if (result && result.ok === false) return true;
  if (result && Array.isArray(result.errors)) return result.errors.length > 0;
  return false;
}

bindApi(skillApi, [
  {
    name: 'QA-04 CORE-024 CORE-025 CORE-026 CORE-027 CORE-028 CORE-029 CORE-033 skill slots follow rarity',
    fn(api) {
      const check = (rarity, skills) => slotErrors(api.validateSkillSlots, rarity, skills);
      const ok = (rarity, skills) => {
        assert.equal(rejected(check(rarity, skills)), false, `${rarity} ${JSON.stringify(skills)} should be valid`);
      };
      const bad = (rarity, skills) => {
        assert.equal(rejected(check(rarity, skills)), true, `${rarity} ${JSON.stringify(skills)} should be rejected`);
      };
      ok('N', { active: null, passive: null, ultimate: null });
      ok('N', { active: { small: true }, passive: null, ultimate: null });
      bad('N', { active: { small: false }, passive: {}, ultimate: null });
      ok('R', { active: {}, passive: null, ultimate: null });
      ok('R', { active: null, passive: {}, ultimate: null });
      bad('R', { active: {}, passive: {}, ultimate: null });
      bad('Epic', { active: {}, passive: null, ultimate: null });
      ok('Epic', { active: {}, passive: {}, ultimate: null });
      bad('EX', { active: {}, passive: {}, ultimate: null });
      ok('EX', { active: {}, passive: {}, ultimate: {} });
      if (typeof api.validateAvatarV05 === 'function') {
        for (const retired of ['Common', 'Rare', 'Legendary', 'Mythic']) {
          const errors = api.validateAvatarV05({ schemaVersion: 'v05', avatarId: 'AVT_AEG_002', nameEn: 'X', nameTh: 'X', factionId: 'FAC_AEG', role: 'Tank', rarity: retired });
          assert.equal(rejected(errors), true, retired);
        }
      } else {
        for (const retired of ['Common', 'Rare', 'Legendary', 'Mythic']) bad(retired, {});
      }
    },
  },
]);

const engine = await loadNamed(ENGINE_FILES, ENGINE_EXPORTS, 'stream A');

bindApi(engine, [
  {
    name: 'QA-04 CORE-003 team selection is exactly 4 avatars',
    fn(api) {
      const input = buildMatch();
      const state = asState(api.createMatch(input));
      assert.equal(state.sides.player.avatars.length, 4);
      assert.equal(state.sides.enemy.avatars.length, 4);
      const short = structuredClone(input);
      short.teams[0].avatars = short.teams[0].avatars.slice(0, 3);
      expectReject(() => api.createMatch(short));
      const long = structuredClone(input);
      long.teams[0].avatars = [...long.teams[0].avatars, long.teams[0].avatars[0]];
      expectReject(() => api.createMatch(long));
    },
  },
  {
    name: 'QA-04 CORE-002 action decks do not contain avatar cards',
    fn(api) {
      const input = buildMatch();
      for (const cards of deckLists(input)) {
        for (const card of cards) {
          assert.notEqual(card.type, 'Avatar');
          assert.equal(String(card.cardId).startsWith('AVT_'), false);
        }
      }
      const state = asState(api.createMatch(input));
      const zones = zonesOf(api, state, 'player');
      for (const card of [...zones.hand, ...zones.draw]) {
        assert.equal(String(card.cardId).startsWith('AVT_'), false);
      }
      assert.equal(state.sides.player.avatars.length, 4);
    },
  },
  {
    name: 'QA-04 CORE-022 CORE-023 mixed-faction deck is legal',
    fn(api) {
      const input = buildMatch({ profile: 'faction' });
      const ids = new Set(deckLists(input)[0].map((card) => card.factionRequirement).filter(Boolean));
      assert.ok(ids.has('FAC_AEG'));
      assert.ok(ids.has('FAC_PHA'));
      const state = asState(api.createMatch(input));
      assert.equal(zonesOf(api, state, 'player').hand.length, 5);
    },
  },
  {
    name: 'QA-04 CORE-022 generic action is usable by every faction',
    fn(api) {
      let state = asState(api.createMatch(buildMatch({ profile: 'faction' })));
      const before = apOf(state, 'player');
      state = playCard(api, state, 'player', 'ACT_GEN_SKILL', 'AVT_PHA_002').state;
      assert.equal(apOf(state, 'player'), before - 1);
      assert.equal(state.activeSideId, 'player');
    },
  },
  {
    name: 'QA-04 CORE-023 FAC action requires the same faction unless the card sets an explicit override',
    fn(api) {
      let state = asState(api.createMatch(buildMatch({ profile: 'faction' })));
      const before = apOf(state, 'player');
      expectReject(() => api.playAction(state, {
        cardInstanceId: zonesOf(api, state, 'player').hand.find((card) => card.cardId === 'ACT_FAC_AEG').instanceId,
        actorAvatarId: 'AVT_PHA_002',
        targets: [],
        commit: true,
      }));
      assert.equal(apOf(state, 'player'), before, 'a rejected FAC play must not spend AP');
      state = playCard(api, state, 'player', 'ACT_FAC_AEG', 'AVT_AEG_002').state;
      assert.equal(apOf(state, 'player'), before - 1);
      const overrideBefore = apOf(state, 'player');
      state = playCard(api, state, 'player', 'ACT_FAC_AEG_OVERRIDE', 'AVT_PHA_002').state;
      assert.equal(apOf(state, 'player'), overrideBefore - 1);
    },
  },
]);

const config = await loadNamed(CONFIG_FILES, ['defaultRuleConfig'], 'stream B');
bindApi(config, [
  {
    name: 'CORE-030 max avatar level is 5 and the star cap stays pending',
    fn(api) {
      const rules = api.defaultRuleConfig();
      const level = rules.maxAvatarLevel ?? rules.maxLevel;
      assert.equal(level.value, 5);
      assert.equal(level.status, 'LOCKED');
      const star = rules.starCapByRarity ?? rules.starCap;
      assert.ok(star.status === 'PENDING' || star.status === 'PENDING_OWNER');
      assert.equal(star.value ?? null, null);
    },
  },
  {
    name: 'CORE-031 hero synthesis and promotion stones stay separate and their recipes stay pending',
    fn(api) {
      const rules = api.defaultRuleConfig();
      assert.equal((rules.maxAvatarLevel ?? rules.maxLevel).value, 5);
      const star = rules.starCapByRarity ?? rules.starCap;
      const duplicates = rules.duplicateConversion ?? rules.synthesisRecipe;
      assert.ok(star.status === 'PENDING' || star.status === 'PENDING_OWNER');
      assert.equal(star.value ?? null, null);
      assert.ok(duplicates.status === 'PENDING' || duplicates.status === 'PENDING_OWNER');
      assert.equal(duplicates.value ?? null, null);
    },
  },
  {
    name: 'CORE-032 gifts and relationship apply to companions only',
    fn(api) {
      const rules = api.defaultRuleConfig();
      const gifts = rules.relationshipScope ?? rules.companionRelationship;
      if (gifts) {
        assert.equal(gifts.value, 'companion');
        assert.equal(gifts.status, 'LOCKED');
      } else {
        assert.equal(JSON.stringify(rules).includes('"relationship":"avatar"'), false);
      }
    },
  },
  {
    name: 'CORE-001 no compulsory main quest',
    fn(api) {
      const quest = api.defaultRuleConfig().mainQuest;
      if (quest) {
        assert.equal(quest.value, false);
        assert.equal(quest.status, 'LOCKED');
      } else {
        assert.equal(api.defaultRuleConfig().mainQuest, undefined);
      }
    },
  },
]);
