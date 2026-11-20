/**
 * Provenance lint for content/v06/sport.
 *
 * Fails when a player-facing string contains a real identity, a card stat key
 * set is wrong, a rarity is outside N/R/Epic/EX, or a JSON number is not tagged
 * BALANCE_PLACEHOLDER + PROPOSED. Real identities live only under `real`.
 *
 * Usage: node tools/validate-sport-provenance.mjs [repo-or-sport-dir]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SPORT_RARITIES = Object.freeze(['N', 'R', 'Epic', 'EX']);

export const STAT_KEYS = Object.freeze({
  football: Object.freeze(['Power', 'Def', 'Speed', 'Sta', 'Acc']),
  basket: Object.freeze(['Shooting', 'Def', 'Spd', 'Sta']),
  car: Object.freeze(['TopSpeed', 'Accel', 'Handling']),
  moto: Object.freeze(['TopSpeed', 'Accel', 'Handling']),
});

export const BANNERS = Object.freeze([
  'SPORT_FOOTBALL',
  'SPORT_BASKET',
  'SPORT_CAR',
  'SPORT_MOTO',
]);

const CARD_ID = /^SPC_(FOOTBALL|BASKET|CAR|MOTO)_([A-Z]{2,5})_(\d{3})$/;

const ALWAYS_PLAYER_KEYS = new Set([
  'parodyName',
  'vehicleParodyName',
  'team',
  'summary',
  'flavor',
  'bio',
  'title',
  'label',
  'text',
  'caution',
  'use',
  'reason',
  'displayName',
  'subtitle',
  'warning',
]);

/** Immediate key only. Children are still walked. */
const INTERNAL_KEYS = new Set([
  'id',
  'sport',
  'kind',
  'role',
  'rarity',
  'status',
  'balance',
  'recordStatus',
  'ratingStatus',
  'draftId',
  'contentTier',
  'schemaVersion',
  'version',
  'bannerId',
  'bannerIds',
  'slot',
  'unit',
  'band',
  'currency',
  'file',
  'path',
  'shape',
  'position',
  'entityId',
  'entityIds',
  'sourceId',
  'cardId',
  'vehicleId',
  'coachId',
  'venueId',
  'teamId',
  'formationId',
  'homeVenueId',
  'lineupId',
  'starters',
  'bench',
  'entryIds',
  'url',
  'season',
  'snapshotDate',
  'licenceNote',
  'internalNote',
  'internalGaps',
  'workbookParody',
  'pairing',
  'pageClub',
  'closeness',
  'gameOnly',
  'placeholder',
  'fictional',
  'combined',
  'tag',
  'scale',
  'source',
  'files',
  'statKeys',
  'rarities',
  'schema',
  'topic',
  'pityScope',
  'pool',
  'side',
  'formation',
  'mode',
  'compound',
  'preset',
  'gridId',
  'order',
  'value',
  'weightsNote',
  'verifiedRawMetrics',
  'identities',
]);

const MOTO_TRAIT_KEYS = new Set(['handling', 'speedUse', 'accelUse', 'topSpeed']);
const TRAIT_BANDS = new Set(['H', 'M', 'L']);

/**
 * @param {string} value
 */
export function foldName(value) {
  const base = String(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ł/g, 'l')
    .toLowerCase();
  const spaced = base.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { spaced, alnum: spaced.replace(/ /g, '') };
}

/**
 * @param {string} haystack
 * @param {string} needle
 */
export function containsRealName(haystack, needle) {
  const name = String(needle ?? '').trim();
  if (name.length < 3) return false;
  const hay = foldName(haystack);
  const pin = foldName(name);
  if (pin.alnum.length < 3) return false;
  if (pin.spaced.length > 0 && hay.spaced.includes(pin.spaced)) return true;
  if (hay.alnum.includes(pin.alnum)) return true;
  return false;
}

/**
 * @param {string} start
 */
export function resolveSportDir(start) {
  const candidates = [start, join(start, 'content', 'v06', 'sport')];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'index.json'))) return candidate;
  }
  throw new Error(`Sport content directory not found from ${start}`);
}

/**
 * @param {string} dir
 */
function readJsonDir(dir) {
  /** @type {Record<string, unknown>} */
  const docs = {};
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith('.json')) continue;
      const rel = relative(dir, full).replaceAll('\\', '/');
      docs[rel] = JSON.parse(readFileSync(full, 'utf8'));
    }
  };
  walk(dir);
  return docs;
}

/**
 * @param {unknown} value
 * @param {string[]} names
 * @param {Set<string>} seen
 */
function collectIdentities(value, names, seen) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectIdentities(item, names, seen);
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (value);
  if (record.real && typeof record.real === 'object') {
    const real = /** @type {Record<string, unknown>} */ (record.real);
    const bits = [];
    if (typeof real.name === 'string') bits.push(real.name);
    if (typeof real.workbookParody === 'string') bits.push(real.workbookParody);
    if (Array.isArray(real.identities)) {
      for (const item of real.identities) {
        if (typeof item === 'string') bits.push(item);
      }
    }
    for (const bit of bits) {
      const trimmed = bit.trim();
      if (trimmed.length < 3 || seen.has(trimmed)) continue;
      seen.add(trimmed);
      names.push(trimmed);
    }
  }
  for (const child of Object.values(record)) collectIdentities(child, names, seen);
}

/**
 * @param {unknown} value
 * @param {boolean} inReal
 * @param {string | null} key
 * @param {string} path
 * @param {{ path: string, text: string }[]} out
 */
function collectPlayerFacing(value, inReal, key, path, out) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPlayerFacing(item, inReal, key, `${path}[${index}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    const nextReal = inReal || key === 'real';
    for (const [childKey, child] of Object.entries(value)) {
      collectPlayerFacing(child, nextReal, childKey, path ? `${path}.${childKey}` : childKey, out);
    }
    return;
  }
  if (typeof value !== 'string') return;
  if (inReal) return;
  const exposed = key != null && (ALWAYS_PLAYER_KEYS.has(key) || !INTERNAL_KEYS.has(key));
  if (!exposed) return;
  out.push({ path, text: value });
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkNumbers(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkNumbers(item, `${path}[${index}]`, errors));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = /** @type {Record<string, unknown>} */ (value);
  const tagged = record.balance === 'BALANCE_PLACEHOLDER' && record.status === 'PROPOSED';
  for (const [key, child] of Object.entries(record)) {
    const childPath = `${path}.${key}`;
    if (typeof child === 'number') {
      if (!Number.isFinite(child) || !tagged) {
        errors.push({
          code: 'UNTAGGED_NUMBER',
          path: childPath,
          message: 'Invented number needs parent balance BALANCE_PLACEHOLDER and status PROPOSED',
        });
      }
    } else {
      checkNumbers(child, childPath, errors);
    }
  }
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkForbiddenStatus(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkForbiddenStatus(item, `${path}[${index}]`, errors));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      checkForbiddenStatus(child, path ? `${path}.${key}` : key, errors);
    }
    return;
  }
  if (typeof value !== 'string') return;
  if (value === 'LOCKED' || value === 'PRODUCTION_READY' || value.includes('PRODUCTION_READY') || /\bLOCKED\b/.test(value)) {
    errors.push({
      code: 'BAD_STATUS',
      path,
      message: 'Sport content must stay PROPOSED or RESEARCH. LOCKED and PRODUCTION_READY are not allowed',
    });
  }
}

/**
 * @param {Record<string, unknown>} card
 * @param {string} path
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkCard(card, path, errors) {
  const sport = card.sport;
  if (typeof sport !== 'string' || !Object.hasOwn(STAT_KEYS, sport)) {
    errors.push({ code: 'STAT_KEYS', path: `${path}.sport`, message: 'Card sport must be football, basket, car, or moto' });
    return;
  }
  const expected = STAT_KEYS[sport];
  const stats = card.stats;
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    errors.push({ code: 'STAT_KEYS', path: `${path}.stats`, message: `Card is missing ${expected.join('/')} stats` });
  } else {
    const keys = Object.keys(stats);
    const missing = expected.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !expected.includes(key));
    if (missing.length > 0 || extra.length > 0 || keys.join(',') !== expected.join(',')) {
      errors.push({
        code: 'STAT_KEYS',
        path: `${path}.stats`,
        message: `Expected stat keys ${expected.join('/')} in that order, found ${keys.join('/') || '(none)'}`,
      });
    }
  }
  if (typeof card.rarity !== 'string' || !SPORT_RARITIES.includes(card.rarity)) {
    errors.push({
      code: 'RARITY',
      path: `${path}.rarity`,
      message: `Rarity must be one of ${SPORT_RARITIES.join(', ')}`,
    });
  }
  if (card.balance !== 'BALANCE_PLACEHOLDER' || card.status !== 'PROPOSED') {
    errors.push({
      code: 'UNTAGGED_NUMBER',
      path,
      message: 'Card balance must be BALANCE_PLACEHOLDER and status PROPOSED',
    });
  }
  const art = /** @type {Record<string, unknown>} */ (card.art);
  if (!art || typeof art.slot !== 'string' || art.placeholder !== true) {
    errors.push({ code: 'ART', path: `${path}.art`, message: 'Card art must be an original placeholder slot' });
  }
  if (typeof card.id !== 'string' || !CARD_ID.test(card.id)) {
    errors.push({ code: 'ID', path: `${path}.id`, message: 'Card id must look like SPC_FOOTBALL_ATH_001' });
  } else {
    const prefix = card.id.split('_')[1];
    const sportPrefix = { football: 'FOOTBALL', basket: 'BASKET', car: 'CAR', moto: 'MOTO' }[sport];
    if (prefix !== sportPrefix) {
      errors.push({ code: 'ID', path: `${path}.id`, message: 'Card id sport prefix does not match sport' });
    }
  }
  if (card.fictional === true) {
    if (card.real != null) {
      errors.push({ code: 'FICTIONAL', path: `${path}.real`, message: 'Fictional cards do not carry a real identity' });
    }
  } else if (!isCompleteReal(card.real)) {
    errors.push({ code: 'MISSING_REAL', path: `${path}.real`, message: 'Sourced card needs real.name, url, season, snapshotDate, identities' });
  }
  if (sport === 'car' || sport === 'moto') {
    if (card.combined !== true || typeof card.vehicleId !== 'string' || typeof card.vehicleParodyName !== 'string') {
      errors.push({
        code: 'ENTRY',
        path,
        message: 'Car and moto cards are combined driver+vehicle entries',
      });
    }
  }
  if (sport === 'moto') checkMotoTraits(card.gameTraits, `${path}.gameTraits`, errors);
}

/**
 * @param {unknown} real
 */
function isCompleteReal(real) {
  if (!real || typeof real !== 'object' || Array.isArray(real)) return false;
  const row = /** @type {Record<string, unknown>} */ (real);
  return typeof row.name === 'string' && row.name.trim().length > 0
    && typeof row.url === 'string' && row.url.startsWith('https://')
    && typeof row.season === 'string' && row.season.trim().length > 0
    && typeof row.snapshotDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.snapshotDate)
    && Array.isArray(row.identities) && row.identities.includes(row.name);
}

/**
 * @param {unknown} traits
 * @param {string} path
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkMotoTraits(traits, path, errors) {
  if (!traits || typeof traits !== 'object' || Array.isArray(traits)) {
    errors.push({ code: 'MOTO_TRAIT', path, message: 'Moto entry needs game-only H/M/L traits' });
    return;
  }
  const row = /** @type {Record<string, unknown>} */ (traits);
  if (row.gameOnly !== true || row.balance !== 'BALANCE_PLACEHOLDER' || row.status !== 'PROPOSED') {
    errors.push({ code: 'MOTO_TRAIT', path, message: 'Moto H/M/L traits must be gameOnly placeholders, never real metrics' });
  }
  for (const key of ['handling', 'speedUse', 'accelUse']) {
    if (!TRAIT_BANDS.has(String(row[key]))) {
      errors.push({ code: 'MOTO_TRAIT', path: `${path}.${key}`, message: 'Trait band must be H, M, or L' });
    }
  }
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function rejectTraitsInsideReal(value, path, errors) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectTraitsInsideReal(item, `${path}[${index}]`, errors));
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (value);
  if (record.real && typeof record.real === 'object') {
    const realPath = `${path}.real`;
    const blob = JSON.stringify(record.real);
    if (/"gameTraits"|"handling"|"speedUse"|"accelUse"/.test(blob) || /handling-(high|medium|low)|top-speed-(high|medium|low)|acceleration-(high|medium|low)/i.test(blob)) {
      errors.push({
        code: 'MOTO_TRAIT',
        path: realPath,
        message: 'H/M/L traits are game-only and must not be stored on a real block',
      });
    }
    for (const key of Object.keys(/** @type {object} */ (record.real))) {
      if (MOTO_TRAIT_KEYS.has(key) || key === 'gameTraits') {
        errors.push({ code: 'MOTO_TRAIT', path: `${realPath}.${key}`, message: 'Real block contains a game trait key' });
      }
    }
  }
  for (const [key, child] of Object.entries(record)) {
    if (key === 'real') continue;
    rejectTraitsInsideReal(child, path ? `${path}.${key}` : key, errors);
  }
}

/**
 * @param {unknown[]} cards
 */
function cardsFromDocs(docs) {
  /** @type {{ card: Record<string, unknown>, path: string }[]} */
  const cards = [];
  for (const [file, doc] of Object.entries(docs)) {
    if (!doc || typeof doc !== 'object') continue;
    const buckets = ['athletes', 'coaches', 'entries'];
    for (const bucket of buckets) {
      const list = /** @type {Record<string, unknown>} */ (doc)[bucket];
      if (!Array.isArray(list)) continue;
      list.forEach((item, index) => {
        if (item && typeof item === 'object' && /** @type {Record<string, unknown>} */ (item).kind === 'card') {
          cards.push({ card: /** @type {Record<string, unknown>} */ (item), path: `${file}.${bucket}[${index}]` });
        }
      });
    }
  }
  return cards;
}

/**
 * @param {Record<string, unknown>} tuning
 * @param {{ card: Record<string, unknown>, path: string }[]} cards
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkTuning(tuning, cards, errors) {
  if (!tuning || typeof tuning !== 'object') {
    errors.push({ code: 'TUNING', path: 'tuning.json', message: 'tuning.json is missing' });
    return;
  }
  const banners = /** @type {Record<string, unknown>} */ (tuning.banners ?? {});
  for (const bannerId of BANNERS) {
    const banner = /** @type {Record<string, any>} */ (banners[bannerId]);
    if (!banner) {
      errors.push({ code: 'TUNING', path: `tuning.json.banners.${bannerId}`, message: 'Banner tuning missing' });
      continue;
    }
    const epic = banner.pity?.Epic?.value;
    const ex = banner.pity?.EX?.value;
    if (epic !== 100 || banner.pity?.Epic?.balance !== 'BALANCE_PLACEHOLDER' || banner.pity?.Epic?.status !== 'PROPOSED') {
      errors.push({ code: 'TUNING', path: `tuning.json.banners.${bannerId}.pity.Epic`, message: 'Epic pity placeholder must be 100 and tagged' });
    }
    if (ex !== 200 || banner.pity?.EX?.balance !== 'BALANCE_PLACEHOLDER' || banner.pity?.EX?.status !== 'PROPOSED') {
      errors.push({ code: 'TUNING', path: `tuning.json.banners.${bannerId}.pity.EX`, message: 'EX pity placeholder must be 200 and tagged' });
    }
    if (typeof banner.pullCostG?.value !== 'number' || banner.pullCostG.balance !== 'BALANCE_PLACEHOLDER') {
      errors.push({ code: 'TUNING', path: `tuning.json.banners.${bannerId}.pullCostG`, message: 'Pull cost needs a tagged placeholder' });
    }
    for (const rarity of SPORT_RARITIES) {
      const odds = banner.odds?.[rarity];
      if (typeof odds?.value !== 'number' || odds.balance !== 'BALANCE_PLACEHOLDER' || odds.status !== 'PROPOSED') {
        errors.push({ code: 'TUNING', path: `tuning.json.banners.${bannerId}.odds.${rarity}`, message: 'Banner odds need a tagged placeholder' });
      }
    }
  }
  for (const sport of ['football', 'basket', 'car', 'moto']) {
    if (!tuning.matchLengths || typeof tuning.matchLengths !== 'object' || !/** @type {Record<string, unknown>} */ (tuning.matchLengths)[sport]) {
      errors.push({ code: 'TUNING', path: `tuning.json.matchLengths.${sport}`, message: 'Match length placeholder missing' });
    }
    if (!tuning.eventRewardsG || typeof tuning.eventRewardsG !== 'object' || !/** @type {Record<string, unknown>} */ (tuning.eventRewardsG)[sport]) {
      errors.push({ code: 'TUNING', path: `tuning.json.eventRewardsG.${sport}`, message: 'Event G reward placeholder missing' });
    }
  }
  const statsByCard = /** @type {Record<string, any>} */ (tuning.statsByCardId ?? {});
  const rarityByCard = /** @type {Record<string, any>} */ (tuning.rarityByCardId ?? {});
  for (const { card, path } of cards) {
    const id = String(card.id);
    const tuned = statsByCard[id];
    const rarity = rarityByCard[id];
    if (!tuned) {
      errors.push({ code: 'TUNING', path: `tuning.json.statsByCardId.${id}`, message: 'Card stats missing from tuning' });
    } else {
      for (const key of STAT_KEYS[/** @type {keyof typeof STAT_KEYS} */ (card.sport)]) {
        const fromCard = /** @type {Record<string, any>} */ (card.stats)?.[key];
        const fromTuning = tuned[key];
        if (fromCard?.value !== fromTuning?.value || fromTuning?.balance !== 'BALANCE_PLACEHOLDER' || fromTuning?.status !== 'PROPOSED') {
          errors.push({ code: 'TUNING', path: `tuning.json.statsByCardId.${id}.${key}`, message: 'Tuning stat must match the card and stay tagged' });
        }
      }
    }
    if (!rarity || rarity.rarity !== card.rarity || rarity.status !== 'PROPOSED' || rarity.balance !== 'BALANCE_PLACEHOLDER') {
      errors.push({ code: 'TUNING', path: `tuning.json.rarityByCardId.${id}`, message: 'Rarity assignment must match the card and stay PROPOSED' });
    }
    if (card.sport === 'moto') {
      const trait = /** @type {Record<string, any>} */ (tuning.motoGameTraits?.byCardId ?? {})[id];
      if (!trait || trait.gameOnly !== true) {
        errors.push({ code: 'MOTO_TRAIT', path: `tuning.json.motoGameTraits.byCardId.${id}`, message: 'Moto trait tuning must be game-only' });
      }
    }
  }
}

/**
 * @param {Record<string, unknown>} docs
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkSquads(docs, errors) {
  const footballTeams = /** @type {any} */ (docs['football/teams.json']);
  const basketTeams = /** @type {any} */ (docs['basket/teams.json']);
  const footballAthletes = new Map((footballTeams ? [] : []).concat());
  const fbCards = /** @type {any[]} */ (/** @type {any} */ (docs['football/athletes.json'])?.athletes ?? []);
  const baCards = /** @type {any[]} */ (/** @type {any} */ (docs['basket/athletes.json'])?.athletes ?? []);
  const fbById = new Map(fbCards.map((card) => [card.id, card]));
  const baById = new Map(baCards.map((card) => [card.id, card]));
  void footballAthletes;

  checkLineupPair(footballTeams?.lineups, fbById, {
    sport: 'football',
    starters: 11,
    minBench: 2,
    gk: true,
    file: 'football/teams.json',
  }, errors);
  checkLineupPair(basketTeams?.lineups, baById, {
    sport: 'basket',
    starters: 5,
    minBench: 2,
    gk: false,
    file: 'basket/teams.json',
  }, errors);

  checkTwoEntryGrid(docs['car/teams.json'], docs['car/athletes.json'], 'car', errors);
  checkTwoEntryGrid(docs['moto/teams.json'], docs['moto/athletes.json'], 'moto', errors);
}

/**
 * @param {any[] | undefined} lineups
 * @param {Map<string, any>} byId
 * @param {{ sport: string, starters: number, minBench: number, gk: boolean, file: string }} spec
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkLineupPair(lineups, byId, spec, errors) {
  if (!Array.isArray(lineups)) {
    errors.push({ code: 'SQUAD', path: `${spec.file}.lineups`, message: 'Lineups missing' });
    return;
  }
  for (const side of ['home', 'away']) {
    const lineup = lineups.find((row) => row.side === side);
    if (!lineup) {
      errors.push({ code: 'SQUAD', path: `${spec.file}.lineups`, message: `${spec.sport} ${side} lineup missing` });
      continue;
    }
    const starters = Array.isArray(lineup.starters) ? lineup.starters : [];
    const bench = Array.isArray(lineup.bench) ? lineup.bench : [];
    if (starters.length !== spec.starters) {
      errors.push({ code: 'SQUAD', path: `${spec.file}.lineups`, message: `${spec.sport} ${side} needs ${spec.starters} starters` });
    }
    if (bench.length < spec.minBench) {
      errors.push({ code: 'SQUAD', path: `${spec.file}.lineups`, message: `${spec.sport} ${side} bench is smaller than ${spec.minBench}` });
    }
    const ids = [...starters, ...bench];
    if (new Set(ids).size !== ids.length) {
      errors.push({ code: 'SQUAD', path: `${spec.file}.lineups`, message: `${spec.sport} ${side} repeats a card` });
    }
    for (const id of ids) {
      if (!byId.has(id)) errors.push({ code: 'SQUAD', path: `${spec.file}.lineups`, message: `${id} is not an athlete card` });
    }
    if (spec.gk) {
      const keepers = starters.filter((id) => byId.get(id)?.role === 'GK');
      if (keepers.length !== 1) {
        errors.push({ code: 'SQUAD', path: `${spec.file}.lineups`, message: `${spec.sport} ${side} starters need exactly one GK` });
      }
    }
  }
}

/**
 * @param {any} teamDoc
 * @param {any} athleteDoc
 * @param {'car' | 'moto'} sport
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkTwoEntryGrid(teamDoc, athleteDoc, sport, errors) {
  const teams = Array.isArray(teamDoc?.teams) ? teamDoc.teams : [];
  const cards = Array.isArray(athleteDoc?.athletes) ? athleteDoc.athletes : [];
  const file = `${sport}/teams.json`;
  if (teams.length < 10) {
    errors.push({ code: 'TEAM_ENTRIES', path: file, message: `${sport} grid needs a full set of two-entry teams` });
  }
  const seen = new Map();
  for (const team of teams) {
    const ids = Array.isArray(team.entryIds) ? team.entryIds : [];
    if (ids.length !== 2) {
      errors.push({ code: 'TEAM_ENTRIES', path: `${file}:${team.id ?? '?'}`, message: `${sport} team must have exactly 2 entries` });
    }
    for (const id of ids) {
      if (seen.has(id)) {
        errors.push({ code: 'TEAM_ENTRIES', path: file, message: `${id} is listed on two teams` });
      }
      seen.set(id, team.id);
    }
  }
  for (const card of cards) {
    if (!seen.has(card.id)) {
      errors.push({ code: 'TEAM_ENTRIES', path: `${sport}/athletes.json`, message: `${card.id} is not on a two-entry team` });
    }
  }
  const grid = Array.isArray(teamDoc?.grids) ? teamDoc.grids[0] : null;
  if (!grid || !Array.isArray(grid.entryIds) || grid.entryIds.length < 20 || grid.entryIds.length % 2 !== 0) {
    errors.push({ code: 'TEAM_ENTRIES', path: `${file}.grids`, message: `${sport} full grid is missing` });
  }
}

/**
 * @param {Record<string, unknown>} docs
 * @param {{ code: string, path: string, message: string }[]} errors
 */
function checkSources(docs, errors) {
  const sourceDoc = /** @type {any} */ (docs['sources.json']);
  const rows = Array.isArray(sourceDoc?.sources) ? sourceDoc.sources : [];
  if (rows.length === 0) {
    errors.push({ code: 'SOURCE', path: 'sources.json', message: 'sources.json has no rows' });
    return;
  }
  const keyed = new Set(rows.map((row) => `${row.url}|${row.season}|${row.snapshotDate}|${row.real?.name ?? ''}`));
  for (const row of rows) {
    if (typeof row.url !== 'string' || !row.url.startsWith('https://')) {
      errors.push({ code: 'SOURCE', path: `sources.json:${row.id ?? '?'}`, message: 'Source URL must be https' });
    }
    if (typeof row.season !== 'string' || row.season.trim().length === 0) {
      errors.push({ code: 'SOURCE', path: `sources.json:${row.id ?? '?'}`, message: 'Source season is required' });
    }
    if (typeof row.snapshotDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.snapshotDate)) {
      errors.push({ code: 'SOURCE', path: `sources.json:${row.id ?? '?'}`, message: 'Source snapshotDate is required' });
    }
    if (typeof row.real?.name !== 'string' || row.real.name.trim().length === 0) {
      errors.push({ code: 'SOURCE', path: `sources.json:${row.id ?? '?'}`, message: 'Source real.name is required' });
    }
  }
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    const record = /** @type {Record<string, any>} */ (value);
    if (record.fictional !== true && record.real && typeof record.real === 'object' && typeof record.real.url === 'string') {
      const key = `${record.real.url}|${record.real.season}|${record.real.snapshotDate}|${record.real.name}`;
      if (!keyed.has(key)) {
        errors.push({
          code: 'SOURCE',
          path: record.id ?? 'real',
          message: `No sources.json row for ${record.real.url} (${record.real.season}, ${record.real.snapshotDate})`,
        });
      }
    }
    for (const child of Object.values(record)) visit(child);
  };
  for (const [file, doc] of Object.entries(docs)) {
    if (file === 'sources.json') continue;
    visit(doc);
  }
}

/**
 * @param {string} dir
 */
export function loadSportBundle(dir) {
  const sportDir = resolveSportDir(dir);
  const docs = readJsonDir(sportDir);
  return {
    dir: sportDir,
    index: docs['index.json'],
    sources: docs['sources.json'],
    tuning: docs['tuning.json'],
    ipReview: docs['ipReview.json'],
    docs,
  };
}

/**
 * @param {ReturnType<typeof loadSportBundle>} bundle
 */
export function validateSportBundle(bundle) {
  /** @type {{ code: string, path: string, message: string }[]} */
  const errors = [];
  const names = [];
  collectIdentities(bundle.docs, names, new Set());
  /** @type {{ path: string, text: string }[]} */
  const facing = [];
  for (const [file, doc] of Object.entries(bundle.docs)) {
    collectPlayerFacing(doc, false, null, file, facing);
  }
  for (const field of facing) {
    if (/https?:\/\//i.test(field.text)) {
      errors.push({ code: 'REAL_NAME_LEAK', path: field.path, message: 'Player-facing text contains a URL' });
    }
    for (const name of names) {
      if (containsRealName(field.text, name)) {
        errors.push({
          code: 'REAL_NAME_LEAK',
          path: field.path,
          message: `Player-facing text contains real identity "${name}"`,
        });
        break;
      }
    }
  }

  checkNumbers(bundle.docs, 'sport', errors);
  checkForbiddenStatus(bundle.docs, 'sport', errors);

  const cards = cardsFromDocs(bundle.docs);
  const ids = new Set();
  for (const { card, path } of cards) {
    checkCard(card, path, errors);
    if (typeof card.id === 'string') {
      if (ids.has(card.id)) errors.push({ code: 'ID', path, message: `Duplicate card id ${card.id}` });
      ids.add(card.id);
    }
  }
  rejectTraitsInsideReal(bundle.docs, 'sport', errors);
  checkTuning(/** @type {Record<string, unknown>} */ (bundle.tuning), cards, errors);
  checkSquads(bundle.docs, errors);
  checkSources(bundle.docs, errors);

  const review = /** @type {any} */ (bundle.ipReview);
  const reviewRows = Array.isArray(review?.items) ? review.items : [];
  if (reviewRows.length === 0) {
    errors.push({ code: 'IP_REVIEW', path: 'ipReview.json', message: 'ipReview list is empty' });
  }
  const knownIds = new Set();
  const harvestIds = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) harvestIds(item);
      return;
    }
    if (typeof value.id === 'string') knownIds.add(value.id);
    for (const child of Object.values(value)) harvestIds(child);
  };
  harvestIds(bundle.docs);
  for (const row of reviewRows) {
    if (typeof row.entityId !== 'string' || typeof row.parodyName !== 'string' || typeof row.real?.name !== 'string') {
      errors.push({ code: 'IP_REVIEW', path: 'ipReview.json', message: 'ipReview row needs entityId, parodyName, and real.name' });
      continue;
    }
    if (!knownIds.has(row.entityId)) {
      errors.push({ code: 'IP_REVIEW', path: `ipReview.json:${row.entityId}`, message: 'ipReview entity does not exist' });
    }
    if (!['RENAMED', 'HIGH', 'MEDIUM'].includes(row.closeness)) {
      errors.push({ code: 'IP_REVIEW', path: `ipReview.json:${row.entityId}`, message: 'closeness must be RENAMED, HIGH, or MEDIUM' });
    }
    if (row.closeness === 'RENAMED' && row.real.workbookParody === row.parodyName) {
      errors.push({ code: 'IP_REVIEW', path: `ipReview.json:${row.entityId}`, message: 'Renamed parody still matches the workbook string' });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    cardCount: cards.length,
    identityCount: names.length,
    playerFacingCount: facing.length,
  };
}

/**
 * @param {string} dir
 */
export function validateSportProvenance(dir) {
  return validateSportBundle(loadSportBundle(dir));
}

function main() {
  const start = process.argv[2] ?? join(fileURLToPath(new URL('.', import.meta.url)), '..');
  const result = validateSportProvenance(start);
  if (result.ok) {
    console.log(`sport provenance ok (${result.cardCount} cards, ${result.identityCount} real identities)`);
    return;
  }
  for (const error of result.errors) {
    console.error(`${error.code} ${error.path}: ${error.message}`);
  }
  console.error(`${result.errors.length} sport provenance error(s)`);
  process.exitCode = 1;
}

const invoked = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) main();
