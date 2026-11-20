import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMatch,
  playEnemyTurn,
  proposedSampleRoster,
  resolveRuleConfig,
  runAutoTurn,
} from '../../src/engine/index.js';

/**
 * The playable web builds this match in web/js/profile.js buildMatchInput:
 * starter team is the four AVT_*_002 Justins, both sides use the 30-card demo
 * deck, and the echo is the same roster. content/v05 maps ATK to formula damage,
 * DEF to a shield of 0, and Skill to trigger_active. Passives include the caster.
 * web/js/app.js startBattle stores defaultRuleConfig() on input.config. The web
 * adapter must pass that object through; this test calls createMatch directly.
 */
function practiceRoster(echo) {
  return proposedSampleRoster().map((avatar) => {
    const next = structuredClone(avatar);
    if (next.passive) next.passive.includeSelf = true;
    if (echo) next.name = `Echo ${next.name}`;
    return next;
  });
}

function card(partial) {
  return {
    rarity: 'N',
    factionRequirement: null,
    targetRule: 'Enemy',
    onResolveZone: 'Discard',
    versionAndStatus: 'PLACEHOLDER',
    ...partial,
  };
}

function effectsFor(type) {
  if (type === 'Skill') return [{ op: 'trigger_active' }];
  if (type === 'DEF') return [{ op: 'shield', amount: 0, target: 'self' }];
  return [{ op: 'damage', mode: 'formula' }];
}

function spec(id, name, type, cost, rarity, faction, target) {
  return card({
    cardId: id,
    name,
    type,
    costAp: cost,
    rarity,
    factionRequirement: faction,
    targetRule: target,
    effects: effectsFor(type),
  });
}

const library = Object.fromEntries([
  spec('ACT_GEN_ATK_001', 'Placeholder Jab', 'ATK', 1, 'N', null, 'Enemy'),
  spec('ACT_GEN_ATK_002', 'Placeholder Smash', 'ATK', 2, 'R', null, 'Enemy'),
  spec('ACT_GEN_DEF_001', 'Placeholder Guard', 'DEF', 1, 'N', null, 'Self'),
  spec('ACT_GEN_DEF_002', 'Placeholder Bulwark', 'DEF', 2, 'R', null, 'Self'),
  spec('ACT_GEN_SKILL_001', 'Placeholder Spark', 'Skill', 1, 'N', null, 'Self'),
  spec('ACT_GEN_SKILL_002', 'Placeholder Anthem', 'Skill', 2, 'Epic', null, 'Self'),
  spec('ACT_FAC_AEG_001', 'Placeholder Aegis Wall', 'DEF', 1, 'FAC', 'FAC_AEG', 'Self'),
  spec('ACT_FAC_AEG_002', 'Placeholder Aegis Taunt', 'Skill', 2, 'FAC', 'FAC_AEG', 'Self'),
  spec('ACT_FAC_PHA_001', 'Placeholder Phantom Cut', 'ATK', 1, 'FAC', 'FAC_PHA', 'Enemy'),
  spec('ACT_FAC_PHA_002', 'Placeholder Phantom Rush', 'Skill', 2, 'FAC', 'FAC_PHA', 'Self'),
  spec('ACT_FAC_CEL_001', 'Placeholder Star Bolt', 'ATK', 1, 'FAC', 'FAC_CEL', 'Enemy'),
  spec('ACT_FAC_CEL_002', 'Placeholder Arcane Poke', 'Skill', 2, 'FAC', 'FAC_CEL', 'Self'),
  spec('ACT_FAC_SAN_001', 'Placeholder Saving Ping', 'Skill', 1, 'FAC', 'FAC_SAN', 'All_Allies'),
  spec('ACT_FAC_SAN_002', 'Placeholder Sanctuary Ward', 'DEF', 2, 'FAC', 'FAC_SAN', 'Ally'),
].map((row) => [row.cardId, row]));

const deckIds = ['ACT_GEN_ATK_001', 'ACT_GEN_ATK_001', 'ACT_GEN_ATK_001', 'ACT_GEN_ATK_002', 'ACT_GEN_ATK_002', 'ACT_GEN_DEF_001', 'ACT_GEN_DEF_001', 'ACT_GEN_DEF_001', 'ACT_GEN_DEF_002', 'ACT_GEN_DEF_002', 'ACT_GEN_SKILL_001', 'ACT_GEN_SKILL_001', 'ACT_GEN_SKILL_002', 'ACT_GEN_SKILL_002', 'ACT_FAC_AEG_001', 'ACT_FAC_AEG_001', 'ACT_FAC_AEG_002', 'ACT_FAC_AEG_002', 'ACT_FAC_PHA_001', 'ACT_FAC_PHA_001', 'ACT_FAC_PHA_002', 'ACT_FAC_PHA_002', 'ACT_FAC_CEL_001', 'ACT_FAC_CEL_001', 'ACT_FAC_CEL_002', 'ACT_FAC_CEL_002', 'ACT_FAC_SAN_001', 'ACT_FAC_SAN_001', 'ACT_FAC_SAN_002', 'ACT_FAC_SAN_002'];

function demoDeck() {
  return deckIds.map((id) => structuredClone(library[id]));
}

function practiceInput(seed, preset) {
  return {
    seed,
    matchId: `tower-${seed}`,
    shuffleDecks: true,
    config: preset ? resolveRuleConfig({ damage: { preset } }) : undefined,
    teams: [
      { sideId: 'player', control: 'human', avatars: practiceRoster(false) },
      { sideId: 'enemy', control: 'ai', avatars: practiceRoster(true) },
    ],
    decks: { player: demoDeck(), enemy: demoDeck() },
  };
}

function signature(state) {
  return state.sideOrder.flatMap((sideId) => state.sides[sideId].avatars.map((unit) => [sideId, unit.avatarId, unit.hp, unit.alive]));
}

function fight(seed, preset, cap) {
  const state = createMatch(practiceInput(seed, preset));
  let steps = 0;
  while (state.outcome.status !== 'decided' && state.turnIndex <= cap && steps < cap + 5) {
    if (state.phase === 'end_of_round_discard') {
      for (const sideId of state.sideOrder) runAutoTurn(state, sideId);
      continue;
    }
    if (state.activeSideId === 'enemy') playEnemyTurn(state);
    else runAutoTurn(state, state.activeSideId);
    steps += 1;
  }
  return {
    decided: state.outcome.status === 'decided',
    turn: state.turnIndex,
    preset: state.config.damage.preset,
    signature: signature(state),
  };
}

test('createMatch applies a damage preset on the practice input', () => {
  const baseline = createMatch(practiceInput(2));
  const boosted = createMatch(practiceInput(2, 'floor_50_pct_atk'));
  assert.equal(baseline.config.damage.preset, null);
  assert.equal(baseline.config.damage.formula, 'placeholder_atk_minus_def');
  assert.equal(baseline.config.damage.minDamage, 1);
  assert.equal(boosted.config.damage.preset, 'floor_50_pct_atk');
  assert.equal(boosted.config.damage.formula, 'placeholder_atk_minus_def');
  assert.equal(boosted.config.damage.minDamage, 1);
  const left = fight(2, null, 20);
  const right = fight(2, 'floor_50_pct_atk', 20);
  assert.equal(left.preset, null);
  assert.equal(right.preset, 'floor_50_pct_atk');
  assert.notDeepEqual(left.signature, right.signature);
});

test('AUTO practice matches for seeds 1..50 reach a winner under every damage preset', () => {
  // The default formula stays ATK minus DEF with a floor of 1. After the two
  // damage dealers die, a hit into Case (DEF 8, often 9) is 1, so a full
  // mirror does not fit inside 60 turns. The regression is that AUTO no longer
  // freezes: every seed still reaches a winner, and a preset changes the match.
  const presets = [null, 'floor_25_pct_atk', 'floor_50_pct_atk', 'flat_atk'];
  const table = [];
  for (const preset of presets) {
    const turns = [];
    for (let seed = 1; seed <= 50; seed += 1) {
      const row = fight(seed, preset, 260);
      assert.equal(row.decided, true, `${preset ?? 'current'} seed ${seed} was still going at turn ${row.turn}`);
      assert.equal(row.preset, preset);
      turns.push(row.turn);
    }
    const within60 = turns.filter((turn) => turn <= 60).length;
    table.push({
      preset: preset ?? 'current',
      avg: Number((turns.reduce((sum, turn) => sum + turn, 0) / turns.length).toFixed(1)),
      max: Math.max(...turns),
      within60,
    });
  }
  console.log(JSON.stringify(table));
  assert.ok(table.every((row) => row.max <= 260));
  const flat = table.find((row) => row.preset === 'flat_atk');
  assert.equal(flat.within60, 50);
});
