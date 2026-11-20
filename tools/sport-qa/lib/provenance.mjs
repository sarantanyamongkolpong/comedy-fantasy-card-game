import { readFileSync } from 'node:fs';
import { STAT_KEYS, RARITIES, abs, walkFiles, srcSportPresent, webSportPresent, contentPresent } from './discover.mjs';

/** Search needles. These are not statuses assigned by this audit. */
const FORBIDDEN_TOKENS = ['LOCKED', 'PRODUCTION_READY'];

const INTERNAL_KEYS = new Set(['real', 'real_ref', 'realRef']);
const STAT_BLOCK_KEYS = new Set(['stats', 'game_stats', 'gameStats']);
const RARITY_KEYS = new Set(['rarity', 'rarityId']);
const EXEMPT_NUMBER_KEYS = new Set([
  'schemaVersion', 'version', 'saveVersion', 'seed', 'index', 'order', 'slot', 't', 'minute', 'lap', 'count', 'n',
]);
const NUMBER_KEY = /stat|rating|tuning|coeff|reward|odds|weight|pity|cost|price|bonus|power|def|speed|sta|acc|shoot|topspeed|accel|handling|^g$/i;
const NUMBER_PARENT = /(?:^|\.)(stats|game_stats|gameStats|tuning|rewards|coefficients|coeffs)(?:\.|$)/i;
const IDENTITY_KEY = /name|team|club|logo|crest|badge|livery|sponsor|manufacturer|venue|circuit|identity|athlete|driver|rider|coach|constructor/i;

const STOP = new Set([
  'football', 'basketball', 'basket', 'racing', 'moto', 'motorcycle', 'sport', 'sports',
  'player', 'team', 'coach', 'venue', 'track', 'null', 'true', 'false',
  'proposed', 'research', 'data_missing', 'fact_verified', 'balance_placeholder',
  'qa_passed', 'owner_approved', 'integrated', 'epic', 'fac',
  'power', 'def', 'speed', 'sta', 'acc', 'shooting', 'spd', 'topspeed', 'accel', 'handling',
  'sport_football', 'sport_basket', 'sport_car', 'sport_moto',
  'n', 'r', 'ex', 'gk', 'pg', 'sg', 'sf', 'pf',
  'balance', 'status', 'placeholder', 'parody',
]);

function sameKeys(actual, expected) {
  if (actual.length !== expected.length) return false;
  const want = new Set(expected);
  return actual.every((key) => want.has(key));
}

function sportOf(file, ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const record = ancestors[i];
    const raw = record?.sport ?? record?.sport_type ?? record?.sportType;
    if (typeof raw !== 'string') continue;
    const name = raw.toLowerCase();
    if (name.includes('foot')) return 'football';
    if (name.includes('basket')) return 'basket';
    if (name.includes('moto')) return 'moto';
    if (name.includes('car') || name.includes('auto')) return 'car';
  }
  const path = file.toLowerCase();
  if (path.includes('/football')) return 'football';
  if (path.includes('/basket')) return 'basket';
  if (path.includes('/moto')) return 'moto';
  if (path.includes('/car')) return 'car';
  return null;
}

function tagged(ancestors) {
  return ancestors.some((obj) => {
    if (!obj || typeof obj !== 'object') return false;
    const blob = [
      obj.balance,
      obj.status,
      obj.game_stats_status,
      obj.gameStatsStatus,
      obj.record_status,
      obj.recordStatus,
    ].filter((part) => typeof part === 'string').join(' ');
    return blob.includes('BALANCE_PLACEHOLDER') || blob.includes('PROPOSED');
  });
}

function considerSecret(key, value, path, ctx) {
  const text = value.trim();
  if (!text) return;
  const url = text.includes('://');
  const image = /\.(png|svg|jpe?g|webp)$/i.test(text);
  const identity = IDENTITY_KEY.test(key);
  if (!identity && !url && !image) return;
  if (text.length < 3 && !image) return;
  if (/^[0-9./:-]+$/.test(text)) return;
  if (STOP.has(text.toLowerCase())) return;
  ctx.secrets.push({ path, value: text });
}

function checkStats(child, path, file, ancestors, ctx) {
  if (child == null) return;
  if (typeof child !== 'object' || Array.isArray(child)) {
    ctx.findings.push({ code: 'STAT_SHAPE', path: `${file}:${path}`, detail: 'stats must be an object or null' });
    return;
  }
  const keys = Object.keys(child);
  if (keys.length === 0) {
    ctx.findings.push({ code: 'STAT_KEYS', path: `${file}:${path}`, detail: 'stats object is empty' });
    return;
  }
  const sport = sportOf(file, ancestors);
  if (!sport) {
    const matched = Object.entries(STAT_KEYS).filter(([, expected]) => sameKeys(keys, expected));
    if (matched.length !== 1) {
      ctx.findings.push({
        code: 'STAT_KEYS',
        path: `${file}:${path}`,
        detail: `keys ${keys.join(', ')} do not match one sport set`,
      });
    }
    return;
  }
  if (!sameKeys(keys, STAT_KEYS[sport])) {
    ctx.findings.push({
      code: 'STAT_KEYS',
      path: `${file}:${path}`,
      detail: `${sport} has ${keys.join(', ')}; expected ${STAT_KEYS[sport].join(', ')}`,
    });
  }
}

function checkRarity(child, path, file, ctx) {
  if (typeof child !== 'string' || !RARITIES.includes(child)) {
    ctx.findings.push({
      code: 'RARITY',
      path: `${file}:${path}`,
      detail: `rarity ${JSON.stringify(child)} is outside N, R, Epic, EX`,
    });
  }
}

function needsNumberTag(key, path) {
  if (EXEMPT_NUMBER_KEYS.has(key) && !NUMBER_PARENT.test(path)) return false;
  return NUMBER_KEY.test(key) || NUMBER_PARENT.test(path);
}

/**
 * @param {unknown} node
 * @param {string[]} ancestors
 * @param {string} path
 * @param {boolean} inReal
 * @param {{ findings: object[], secrets: object[], publicStrings: object[] }} ctx
 * @param {string} file
 */
function walk(node, ancestors, path, inReal, ctx, file) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, ancestors, `${path}[${index}]`, inReal, ctx, file));
    return;
  }
  if (!node || typeof node !== 'object') return;
  const nextAncestors = ancestors.concat(node);
  for (const [key, child] of Object.entries(node)) {
    const childReal = inReal || INTERNAL_KEYS.has(key);
    const childPath = path ? `${path}.${key}` : key;
    if (!childReal && STAT_BLOCK_KEYS.has(key)) checkStats(child, childPath, file, nextAncestors, ctx);
    if (!childReal && RARITY_KEYS.has(key) && child != null && typeof child !== 'object') {
      checkRarity(child, childPath, file, ctx);
    }
    if (!childReal && typeof child === 'number' && needsNumberTag(key, childPath) && !tagged(nextAncestors)) {
      ctx.findings.push({
        code: 'UNTAGGED_NUMBER',
        path: `${file}:${childPath}`,
        detail: `${key}=${child} has no BALANCE_PLACEHOLDER or PROPOSED tag on the record`,
      });
    }
    if (typeof child === 'string') {
      if (FORBIDDEN_TOKENS.includes(child)) {
        ctx.findings.push({
          code: 'FORBIDDEN_TOKEN',
          path: `${file}:${childPath}`,
          detail: `sport data contains ${child}`,
        });
      }
      if (childReal) considerSecret(key, child, `${file}:${childPath}`, ctx);
      else ctx.publicStrings.push({ path: `${file}:${childPath}`, value: child });
    }
    if (child && typeof child === 'object') walk(child, nextAncestors, childPath, childReal, ctx, file);
  }
}

function appears(haystack, secret) {
  const escaped = secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (secret.includes(' ') || secret.includes('://') || secret.length >= 16) {
    return haystack.toLowerCase().includes(secret.toLowerCase());
  }
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'iu').test(haystack);
}

function scanTokens(file, text, findings) {
  const lines = text.split('\n');
  for (const token of FORBIDDEN_TOKENS) {
    const word = new RegExp(`\\b${token}\\b`);
    const rejection = new RegExp(`(?:===|!==|==|!=)\\s*['"]${token}['"]`);
    const hits = lines.filter((line) => word.test(line) && !rejection.test(line) && !/must stay|reject|forbidden/i.test(line));
    if (hits.length > 0) {
      findings.push({
        code: 'FORBIDDEN_TOKEN',
        path: file,
        detail: `sport surface contains ${token}`,
      });
    }
  }
}

/**
 * Audit one JSON value. Used by the repo scan and by synthetic cases.
 * @param {unknown} value
 * @param {string} file
 */
export function auditDocument(value, file = 'fixture.json') {
  const ctx = { findings: [], secrets: [], publicStrings: [] };
  walk(value, [], '', false, ctx, file);
  for (const secret of ctx.secrets) {
    for (const surface of ctx.publicStrings) {
      if (appears(surface.value, secret.value)) {
        ctx.findings.push({
          code: 'REAL_LEAK',
          path: surface.path,
          detail: `player-facing text contains a real-block value from ${secret.path}`,
        });
      }
    }
  }
  return ctx.findings;
}

function readText(file) {
  return readFileSync(abs(file), 'utf8');
}

/**
 * @param {string} root absolute repo root, already applied by discover via SPORT_QA_ROOT
 */
export function auditRepo() {
  const jsonFiles = walkFiles('content/v06/sport', (name) => name.endsWith('.json'));
  const webFiles = walkFiles('web/sport', (name) => /\.(html|js|mjs|css|svg|json)$/.test(name));
  const srcFiles = walkFiles('src/sport', (name) => name.endsWith('.js') || name.endsWith('.mjs'));
  const htmlFiles = walkFiles('web/dist', (name) => name.endsWith('.html'));
  const surfaces = jsonFiles.length + webFiles.length + srcFiles.length;
  if (surfaces === 0 && htmlFiles.length === 0) {
    return {
      skipped: true,
      reason: 'content/v06/sport, src/sport, and web/sport are absent',
      findings: [],
      files: [],
    };
  }

  const findings = [];
  const secrets = [];
  const publicStrings = [];
  for (const file of jsonFiles) {
    let parsed;
    const text = readText(file);
    scanTokens(file, text, findings);
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      findings.push({ code: 'JSON', path: file, detail: error.message });
      continue;
    }
    const internalFile = file.endsWith('/sources.json') || file.endsWith('.sources.json');
    const ctx = { findings, secrets, publicStrings: internalFile ? [] : publicStrings };
    walk(parsed, [], '', internalFile, ctx, file);
  }

  const haystacks = [];
  for (const file of webFiles) {
    const text = readText(file);
    scanTokens(file, text, findings);
    haystacks.push({ path: file, value: text });
  }
  for (const file of srcFiles) {
    scanTokens(file, readText(file), findings);
  }
  for (const file of htmlFiles) {
    haystacks.push({ path: file, value: readText(file) });
    if (file.includes('/sport')) scanTokens(file, readText(file), findings);
  }
  haystacks.push(...publicStrings);

  const seen = new Set();
  for (const secret of secrets) {
    for (const surface of haystacks) {
      if (!appears(surface.value, secret.value)) continue;
      const id = `${surface.path}|${secret.path}|${secret.value}`;
      if (seen.has(id)) continue;
      seen.add(id);
      findings.push({
        code: 'REAL_LEAK',
        path: surface.path,
        detail: `player-facing surface contains a real-block value from ${secret.path}`,
      });
    }
  }

  return {
    skipped: false,
    reason: null,
    findings,
    files: [...jsonFiles, ...webFiles, ...srcFiles, ...htmlFiles],
    present: {
      content: contentPresent(),
      web: webSportPresent(),
      src: srcSportPresent(),
      builtHtml: htmlFiles,
    },
  };
}
