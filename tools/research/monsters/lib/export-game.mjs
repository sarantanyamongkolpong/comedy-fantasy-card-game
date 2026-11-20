/**
 * Future game-import JSON.
 * Enemy rows follow content/v05/enemies/demo-battle.json except `stats` is omitted.
 * Card rows are hooks, not action cards. Gacha weights, pity, and rates are absent.
 */

import {
  CATEGORIES,
  FACTION_IDS,
  GACHA_POOLS,
  RARITIES,
  ROLES,
  SCHEMA_VERSION,
  defaultEnemyId,
} from './constants.mjs';
import { validateImportFile } from './schema-check.mjs';

const IMPORT_WARNING = 'Research import only. Combat stats are omitted on purpose. This is not PRODUCTION_READY, not a gacha banner, and not a battle-engine encounter. Do not copy this file into content/v05/enemies or src/gacha.';

/**
 * @param {{ records: object[], errors: object[], warnings: object[], notes: object[], sourceFiles: string[], schema: object }} result
 * @param {{ validate?: boolean }} [options]
 */
export function buildImportFile(result, options = {}) {
  const records = result.records ?? [];
  const enemies = records.map(toEnemy);
  const file = {
    schemaVersion: SCHEMA_VERSION,
    contentTier: 'research',
    importKind: 'future-game-import',
    warning: IMPORT_WARNING,
    sourceFiles: result.sourceFiles?.length ? result.sourceFiles : ['(no input path)'],
    records,
    gameImport: {
      enemies: {
        contentTier: 'research',
        warning: 'Shape follows content/v05/enemies/demo-battle.json. stats is omitted. Numbers are not research data.',
        battle: {
          battleId: null,
          status: 'PROPOSED',
          note: 'Reserved enemy ids for a later importer. battleId stays null until a battle stream assigns an encounter. No HP, ATK, DEF, SPD, POW, or damage values.',
          enemies,
        },
      },
      cards: records.map(toCard),
      gacha: {
        included: false,
        reason: 'Pools, weights, pity counters, and rates belong to src/gacha. This export does not set them. included is false.',
        suggestions: records.flatMap(toSuggestion),
      },
      encounters: CATEGORIES.map((category) => ({
        category,
        enemyIds: enemies.filter((enemy) => enemy.category === category).map((enemy) => enemy.enemyId),
        note: 'Not a playable wave. enemyIds are reserved mappings for this category.',
      })),
    },
    audit: {
      ok: result.errors.length === 0,
      errors: (result.errors ?? []).map(cleanFinding),
      warnings: (result.warnings ?? []).map(cleanFinding),
      notes: (result.notes ?? []).map(cleanFinding),
    },
  };
  if (options.validate !== false) {
    const schemaErrors = validateImportFile(result.schema, file);
    if (schemaErrors.length > 0) {
      const detail = schemaErrors.slice(0, 8).map((error) => error.message).join('; ');
      throw new Error(`Import file does not match monster.schema.json: ${detail}`);
    }
  }
  return file;
}

/** @param {object} record */
export function toEnemy(record) {
  return {
    enemyId: record.hooks?.enemyId ?? defaultEnemyId(record.monsterId),
    displayName: record.creative?.nameEn ?? '',
    nameTh: record.creative?.nameTh ?? '',
    factionId: factionIdFor(record),
    role: roleFor(record),
    rarity: rarityFor(record),
    rarityStatus: 'PROPOSED',
    monsterId: record.monsterId,
    category: record.category,
    status: record.status,
  };
}

/** @param {object} record */
function toCard(record) {
  const cardId = record.hooks?.cardId ?? null;
  return {
    cardId,
    cardIdStatus: cardId ? 'RESERVED' : 'UNASSIGNED',
    monsterId: record.monsterId ?? '',
    nameEn: record.creative?.nameEn ?? '',
    nameTh: record.creative?.nameTh ?? '',
    rarity: rarityFor(record),
    note: 'cardId is a reserved hook. UNASSIGNED means no card exists yet. RESERVED means the research record supplied an id. This object is not an action card, an avatar card, or a banner entry.',
  };
}

/** @param {object} record */
function toSuggestion(record) {
  const pool = record.hooks?.gachaPool ?? null;
  const rarity = rarityFor(record);
  if (!GACHA_POOLS.includes(pool) || !RARITIES.includes(rarity)) return [];
  return [{ monsterId: record.monsterId, pool, rarity }];
}

/** @param {object} record */
export function factionIdFor(record) {
  const hooked = record.hooks?.factionId ?? null;
  if (hooked) return hooked;
  const name = record.creative?.factionAffiliation;
  if (typeof name === 'string' && FACTION_IDS[name]) return FACTION_IDS[name];
  return null;
}

/** @param {object} record */
export function roleFor(record) {
  if (record.hooks?.role && ROLES.includes(record.hooks.role)) return record.hooks.role;
  const archetype = record.creative?.combatArchetype;
  if (typeof archetype === 'string') {
    const match = ROLES.find((role) => role.toLowerCase() === archetype.trim().toLowerCase());
    if (match) return match;
  }
  return null;
}

/** @param {object} record */
export function rarityFor(record) {
  const hooked = record.hooks?.rarity ?? null;
  if (RARITIES.includes(hooked)) return hooked;
  const suggested = record.creative?.suggestedRarity ?? null;
  if (RARITIES.includes(suggested)) return suggested;
  return null;
}

/** @param {object} item */
function cleanFinding(item) {
  return {
    severity: item.severity,
    code: item.code,
    path: item.path || '/',
    message: item.message,
    monsterId: item.monsterId ?? null,
    otherMonsterId: item.otherMonsterId ?? null,
    score: item.score ?? null,
  };
}
