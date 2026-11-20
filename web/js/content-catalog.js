/**
 * Reads content/v05 and shapes it for the screens and the battle engine.
 * Card Effect_Spec ops in the content file are the string "placeholder", which the
 * engine rejects. ATK cards therefore use the engine's own placeholder damage formula,
 * DEF cards use a shield of 0 (no invented amount), and Skill cards fire the avatar Active.
 * Avatar skills keep the integers published in content/v05 (shield 2, regen 3, and so on).
 */

import actionFile from '../../content/v05/actions/starter-actions.json' with { type: 'json' };
import avatarFile from '../../content/v05/avatars/justin-avatars.json' with { type: 'json' };
import deckFile from '../../content/v05/decks/demo-mixed-deck.json' with { type: 'json' };
import bannerFile from '../../content/v05/gacha/TEST_ONLY_banners.json' with { type: 'json' };
import { AVATARS, factionName } from './sample-catalog.js';

function engineTarget(value) {
  const text = String(value ?? 'self').toLowerCase().replaceAll('-', '_');
  if (text === 'all_allies' || text === 'all_enemies' || text === 'random_ally' || text === 'self') return text;
  return 'self';
}

function mapOp(op) {
  if (!op || typeof op !== 'object') return [];
  if (op.op === 'shield' && Number.isInteger(op.amount)) {
    const list = [{ op: 'shield', amount: op.amount, target: 'self' }];
    if (op.also === 'taunt') {
      list.push({ op: 'taunt', durationTurns: Number.isInteger(op.durationTurns) ? op.durationTurns : 1, target: 'self' });
    }
    return list;
  }
  if (op.op === 'stat-buff' && (op.stat === 'atk' || op.stat === 'def') && Number.isInteger(op.amount) && Number.isInteger(op.durationTurns)) {
    return [{ op: 'buff', stat: op.stat, amount: op.amount, durationTurns: op.durationTurns, target: engineTarget(op.targets) }];
  }
  if (op.op === 'next-attack-buff' && Number.isInteger(op.amount)) {
    return [{ op: 'next_attack', amount: op.amount, target: 'self' }];
  }
  if (op.op === 'bonus-damage' && Number.isInteger(op.amount)) {
    return [{ op: 'bonus_damage', amount: op.amount }];
  }
  if (op.op === 'regen' && Number.isInteger(op.amount)) {
    const ticks = Number.isInteger(op.ticks) ? op.ticks : op.durationTurns;
    if (!Number.isInteger(ticks)) return [];
    return [{ op: 'regen', amount: op.amount, ticks, target: engineTarget(op.targets ?? 'all_allies') }];
  }
  return [];
}

function skillFrom(block, kind) {
  if (!block?.Effect_Spec) return null;
  const effects = (block.Effect_Spec.ops ?? []).flatMap(mapOp);
  const status = block.Version_And_Status ?? 'PROPOSED';
  if (kind === 'passive') {
    const trigger = String(block.Effect_Spec.trigger ?? '').replaceAll('-', '_');
    const chance = typeof block.Effect_Spec.chance === 'number' ? block.Effect_Spec.chance : block.Effect_Spec.chance?.value;
    if (trigger !== 'turn_start' && trigger !== 'on_attack') return null;
    if (typeof chance !== 'number') return null;
    return { name: block.name, status, chance, trigger, target: engineTarget(block.Target_Rule), includeSelf: true, effects, summary: describeEffects(effects) };
  }
  return { name: block.name, status, target: engineTarget(block.Target_Rule), effects, summary: describeEffects(effects) };
}

function describeEffects(effects) {
  return (effects ?? []).map((effect) => {
    if (effect.op === 'regen') return `Regen +${effect.amount} x${effect.ticks} turns`;
    if (effect.op === 'shield') return `Shield +${effect.amount}`;
    if (effect.op === 'taunt') return `Taunt ${effect.durationTurns} turn`;
    if (effect.op === 'buff') return `${String(effect.stat).toUpperCase()} +${effect.amount} x${effect.durationTurns} turn`;
    if (effect.op === 'next_attack') return `Next attack +${effect.amount}`;
    if (effect.op === 'bonus_damage') return `Bonus damage +${effect.amount}`;
    return '';
  }).filter(Boolean).join(', ');
}

function placeholderEffects(card) {
  const type = card.actionType ?? card.Type;
  if (type === 'Skill') return [{ op: 'trigger_active' }];
  if (type === 'DEF') return [{ op: 'shield', amount: 0, target: 'self' }];
  return [{ op: 'damage', mode: 'formula' }];
}

function toEngineAvatar(raw) {
  return {
    avatarId: raw.avatarId,
    designRef: raw.designRef ?? null,
    name: raw.nameEn ?? raw.sheetName ?? raw.avatarId,
    faction: raw.factionName,
    factionId: raw.factionId,
    role: raw.role,
    rarity: raw.rarity ?? null,
    gender: raw.gender ?? null,
    statStatus: raw.stats?.valueStatus ?? 'PROPOSED',
    stats: { atk: raw.stats.atk, def: raw.stats.def, spd: raw.stats.spd },
    active: skillFrom(raw.skills?.active, 'active'),
    passive: skillFrom(raw.skills?.passive, 'passive'),
  };
}

function toUiAvatar(raw) {
  const engineAvatar = toEngineAvatar(raw);
  return {
    avatarId: raw.avatarId,
    assetId: raw.avatarId,
    name: engineAvatar.name,
    nameTh: raw.nameTh ?? null,
    factionId: raw.factionId,
    role: raw.role,
    rarity: raw.rarity,
    gender: raw.gender ?? null,
    designRef: raw.designRef ?? null,
    battleLegal: true,
    statsStatus: engineAvatar.statStatus,
    stats: { ...engineAvatar.stats },
    active: engineAvatar.active ? { name: engineAvatar.active.name, status: engineAvatar.active.status, summary: engineAvatar.active.summary } : null,
    passive: engineAvatar.passive ? { name: engineAvatar.passive.name, status: engineAvatar.passive.status, summary: engineAvatar.passive.summary } : null,
    engineAvatar,
  };
}

function toUiCard(raw) {
  return {
    cardId: raw.cardId,
    name: raw.name,
    type: raw.actionType,
    rarity: raw.rarity,
    costAp: raw.apCost,
    factionRequirement: raw.Faction_Requirement ?? null,
    targetRule: raw.Target_Rule,
    onResolveZone: raw.On_Resolve_Zone,
    blurb: raw.Version_And_Status ?? '',
    versionAndStatus: raw.Version_And_Status ?? 'PLACEHOLDER',
    engineCard: {
      cardId: raw.cardId,
      name: raw.name,
      type: raw.actionType,
      rarity: raw.rarity,
      factionRequirement: raw.Faction_Requirement ?? null,
      costAp: raw.apCost,
      targetRule: raw.Target_Rule,
      effects: placeholderEffects(raw),
      onResolveZone: raw.On_Resolve_Zone,
      versionAndStatus: raw.Version_And_Status ?? 'PLACEHOLDER',
    },
  };
}

const justins = avatarFile.avatars.map(toUiAvatar);
const classics = AVATARS.filter((avatar) => /_001$/.test(avatar.avatarId));
const actionCards = actionFile.actionCards.map(toUiCard);
const avatarMap = new Map([...classics, ...justins].map((avatar) => [avatar.avatarId, avatar]));
const cardMap = new Map(actionCards.map((card) => [card.cardId, card]));

export const contentCatalog = {
  source: 'content/v05',
  productionReady: false,
  warning: avatarFile.warning,
  avatars: [...justins, ...classics],
  actionCards,
  starterDeckIds: deckFile.deck.cardIds.slice(),
  justinIds: justins.map((avatar) => avatar.avatarId),
  banners: bannerFile.banners.map((banner) => ({
    ...banner,
    name: banner.bannerId.replaceAll('_', ' '),
    weights: banner.entries,
  })),
  avatarById: (id) => avatarMap.get(id) ?? null,
  cardById: (id) => cardMap.get(id) ?? null,
  factionName,
};
