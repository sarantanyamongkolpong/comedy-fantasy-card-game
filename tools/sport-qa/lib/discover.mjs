import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { repoRoot } from './paths.mjs';

export const BANNERS = Object.freeze([
  'SPORT_FOOTBALL',
  'SPORT_BASKET',
  'SPORT_CAR',
  'SPORT_MOTO',
]);

export const STAT_KEYS = Object.freeze({
  football: Object.freeze(['Power', 'Def', 'Speed', 'Sta', 'Acc']),
  basket: Object.freeze(['Shooting', 'Def', 'Spd', 'Sta']),
  car: Object.freeze(['TopSpeed', 'Accel', 'Handling']),
  moto: Object.freeze(['TopSpeed', 'Accel', 'Handling']),
});

export const RARITIES = Object.freeze(['N', 'R', 'Epic', 'EX']);

const GACHA_FILES = [
  'src/sport/gacha/index.js',
  'src/sport/gacha/sport-pull.js',
  'src/sport/gacha.js',
];

const WALLET_FILES = [
  'src/sport/wallet/index.js',
  'src/sport/wallet.js',
];

const SAVE_V3_FILES = [
  'src/sport/save/migrate-v3.js',
  'src/sport/save/index.js',
  'src/sport/save.js',
];

const SIM_FILES = {
  football: [
    'src/sport/football/index.mjs',
    'src/sport/football/simulate.mjs',
    'src/sport/football/index.js',
    'src/sport/football/simulate.js',
    'src/sport/football/sim.js',
  ],
  basket: [
    'src/sport/basket/index.mjs',
    'src/sport/basket/simulate.mjs',
    'src/sport/basket/index.js',
    'src/sport/basket/simulate.js',
    'src/sport/basket/sim.js',
  ],
  car: [
    'src/sport/car/index.js',
    'src/sport/car/simulate.js',
    'src/sport/car/sim.js',
    'src/sport/car/index.mjs',
    'src/sport/car/simulate.mjs',
  ],
  moto: [
    'src/sport/moto/index.js',
    'src/sport/moto/simulate.js',
    'src/sport/moto/sim.js',
    'src/sport/moto/index.mjs',
    'src/sport/moto/simulate.mjs',
  ],
};

/**
 * @param {string} relative
 */
export function abs(relative) {
  return join(repoRoot(), relative);
}

/**
 * @param {string} relative
 */
export function isFile(relative) {
  try {
    return existsSync(abs(relative)) && statSync(abs(relative)).isFile();
  } catch {
    return false;
  }
}

/**
 * @param {string} relative
 */
export function isDir(relative) {
  try {
    return existsSync(abs(relative)) && statSync(abs(relative)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * @param {string} dir relative directory
 * @param {(name: string) => boolean} match
 * @param {string[]} out
 */
export function walkFiles(dir, match, out = []) {
  const full = abs(dir);
  if (!existsSync(full)) return out;
  for (const name of readdirSync(full)) {
    const rel = `${dir}/${name}`;
    const info = statSync(abs(rel));
    if (info.isDirectory()) walkFiles(rel, match, out);
    else if (match(name, rel)) out.push(rel);
  }
  return out;
}

/**
 * @param {string} relative
 */
export async function importIfPresent(relative) {
  if (!isFile(relative)) return null;
  return import(pathToFileURL(abs(relative)).href);
}

/**
 * First existing module. Missing files are absent. A present file that throws is broken.
 * @param {string[]} relatives
 */
export async function importFirst(relatives) {
  for (const relative of relatives) {
    if (!isFile(relative)) continue;
    try {
      const mod = await import(pathToFileURL(abs(relative)).href);
      return { mod, file: relative, error: null };
    } catch (error) {
      return { mod: null, file: relative, error };
    }
  }
  return { mod: null, file: null, error: null };
}

export function contentPresent() {
  return walkFiles('content/v06/sport', (name) => name.endsWith('.json')).length > 0;
}

export function webSportPresent() {
  if (!isDir('web/sport')) return false;
  return walkFiles('web/sport', (name) => /\.(html|js|mjs|css)$/.test(name)).length > 0;
}

export function srcSportPresent() {
  return isDir('src/sport') && walkFiles('src/sport', (name) => name.endsWith('.js') || name.endsWith('.mjs')).length > 0;
}

export function builtHtmlFiles() {
  const html = [];
  walkFiles('web/dist', (name) => name.endsWith('.html'), html);
  walkFiles('web/sport', (name) => name.endsWith('.html'), html);
  return html;
}

export function sportEntryHtml() {
  const dedicated = walkFiles('web/sport', (name) => name.endsWith('.html'));
  const index = dedicated.find((file) => file.endsWith('/index.html')) ?? dedicated[0] ?? null;
  if (index) return { file: index, kind: 'sport-page' };
  if (webSportPresent() && isFile('web/index.html')) return { file: 'web/index.html', kind: 'app-shell' };
  return null;
}

export function gachaCandidates() {
  return GACHA_FILES;
}

export function walletCandidates() {
  return WALLET_FILES;
}

export function saveV3Candidates() {
  return SAVE_V3_FILES;
}

export function simCandidates(sport) {
  return SIM_FILES[sport] ?? [];
}

/**
 * @param {Record<string, unknown>} mod
 * @param {string[]} names
 */
export function firstFunction(mod, names) {
  if (!mod) return null;
  for (const name of names) {
    const value = mod[name];
    if (typeof value === 'function') return { name, fn: value };
  }
  return null;
}
