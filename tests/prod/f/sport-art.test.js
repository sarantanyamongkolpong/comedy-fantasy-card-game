import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { BUDGETS, PEOPLE, RARITIES, TEAMS, TRACKS, VENUES } from '../../../art-src/sport/lib/catalog.mjs';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'web/manifests/sport.json'), 'utf8'));
const REQUIRED = ['asset_id', 'slot', 'path', 'anchor', 'subject_id', 'rarity', 'status', 'source_path', 'bytes'];
const BANNED = [
  /\bferrari\b/i,
  /\bmclaren\b/i,
  /\bmercedes\b/i,
  /\bred bull\b/i,
  /\bwilliams\b/i,
  /\bducati\b/i,
  /\baprilia\b/i,
  /\byamaha\b/i,
  /\bhonda\b/i,
  /\bktm\b/i,
  /\bpirelli\b/i,
  /\bmichelin\b/i,
  /\bmessi\b/i,
  /\bhaaland\b/i,
  /\bmbapp[eé]\b/i,
  /\bguardiola\b/i,
  /\bverstappen\b/i,
  /\bhamilton\b/i,
  /\bfifa\b/i,
  /\buefa\b/i,
  /\bfiba\b/i,
  /\bmotogp\b/i,
  /\bformula\s*1\b/i,
  /\breal madrid\b/i,
  /\bbarcelona\b/i,
  /\bliverpool\b/i,
  /\banfield\b/i,
  /\bbernabeu\b/i,
  /\bcamp nou\b/i,
  /\bnba\b/i,
  /\bwnba\b/i,
  /\baudi\b/i,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  if (kind === 'VP8 ') {
    assert.equal(buf[23], 0x9d);
    assert.equal(buf[24], 0x01);
    assert.equal(buf[25], 0x2a);
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (kind === 'VP8L') {
    assert.equal(buf[20], 0x2f);
    const bits = buf.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  assert.fail(`unsupported webp chunk ${kind}`);
}

test('sport fragment is review art and does not touch the world-map manifest', () => {
  assert.equal(manifest.status, 'GENERATED_REVIEW');
  assert.equal(manifest.productionReady, false);
  assert.equal(manifest.stream, 'prod/f-sport-art');
  const main = JSON.parse(readFileSync(join(root, 'web/assets-manifest.json'), 'utf8'));
  assert.equal(main.assets.some((asset) => String(asset.path).includes('web/assets/sport/')), false);
  assert.equal(main.assets.some((asset) => asset.asset_id === 'MAP_BLD_SPORTS'), true);
});

test('every sport asset exists, matches its bytes, and stays inside the review vocabulary', () => {
  const ids = new Set();
  const paths = new Set();
  assert.ok(manifest.assets.length >= 200);
  for (const asset of manifest.assets) {
    for (const key of REQUIRED) assert.ok(key in asset, `${asset.asset_id || 'asset'} missing ${key}`);
    assert.equal(ids.has(asset.asset_id), false, asset.asset_id);
    ids.add(asset.asset_id);
    assert.equal(paths.has(asset.path), false, asset.path);
    paths.add(asset.path);
    assert.equal(asset.status, 'CONCEPT', asset.asset_id);
    assert.equal(asset.review_status, 'GENERATED_REVIEW', asset.asset_id);
    assert.equal(asset.type, asset.slot, asset.asset_id);
    assert.equal(asset.owner, 'sport-art', asset.asset_id);
    assert.equal(asset.rarity === null || RARITIES.includes(asset.rarity), true, asset.asset_id);
    assert.equal(asset.path.startsWith('web/assets/sport/'), true, asset.path);
    assert.equal(asset.path.endsWith('.webp'), true, asset.path);
    assert.equal(asset.source_path.startsWith('art-src/sport/svg/'), true, asset.source_path);
    assert.equal(asset.source_path.endsWith('.svg'), true, asset.source_path);
    const webpPath = join(root, asset.path);
    const svgPath = join(root, asset.source_path);
    assert.equal(existsSync(webpPath), true, asset.path);
    assert.equal(existsSync(svgPath), true, asset.source_path);
    const bytes = statSync(webpPath).size;
    assert.equal(bytes, asset.bytes, asset.asset_id);
    assert.ok(bytes > 0 && bytes <= BUDGETS[asset.category], `${asset.asset_id} ${bytes} exceeds ${asset.category}`);
    const webp = readFileSync(webpPath);
    const size = webpSize(webp);
    assert.equal(size.width, asset.width, asset.asset_id);
    assert.equal(size.height, asset.height, asset.asset_id);
    if (asset.transparent) {
      assert.equal(webp.toString('ascii', 12, 16), 'VP8X', asset.asset_id);
      assert.equal(webp[20] & 0x10, 0x10, `${asset.asset_id} is missing an alpha plane`);
    }
    const svg = readFileSync(svgPath, 'utf8');
    assert.equal(/<text[\s>]|<tspan|<textPath|<foreignObject|font-family/i.test(svg), false, asset.source_path);
    for (const pattern of BANNED) assert.equal(pattern.test(svg), false, `${asset.source_path} ${pattern}`);
  }
});

test('participant slots are silhouettes and frames cover N R Epic EX', () => {
  const bySubject = new Map(manifest.assets.map((asset) => [asset.subject_id, asset]));
  for (const person of PEOPLE) {
    const asset = manifest.assets.find((entry) => entry.asset_id === `ART_${person.cardId}`);
    assert.ok(asset, person.cardId);
    assert.equal(asset.slot, 'portrait-slot');
    assert.equal(asset.placeholder, true);
    assert.equal(asset.subject_id, person.cardId);
    assert.equal(asset.parody_name, person.name);
    assert.equal(asset.rarity, null);
    const suffix = person.cardId.includes('_VEH_') ? '_BODY' : '_PORTRAIT';
    assert.equal(asset.content_slot, `${person.cardId}${suffix}`);
  }
  for (const team of TEAMS) {
    const asset = bySubject.get(team.cardId);
    assert.equal(asset.slot, 'team-colour', team.cardId);
    assert.equal(asset.placeholder, false);
    assert.deepEqual(asset.palette, team.palette);
  }
  for (const venue of VENUES) {
    const asset = bySubject.get(venue.cardId);
    assert.equal(asset.slot, 'venue', venue.cardId);
    assert.equal(asset.parody_name, venue.name);
  }
  for (const track of TRACKS) {
    const top = manifest.assets.find((asset) => asset.asset_id === `ART_${track.cardId}_TOP`);
    const side = manifest.assets.find((asset) => asset.asset_id === `ART_${track.cardId}_SIDE`);
    assert.equal(top.slot, 'track-top');
    assert.equal(side.slot, 'track-side');
    assert.ok(top.guide.centerline.length >= 12, track.cardId);
    for (const [x, y] of top.guide.centerline) {
      assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, track.cardId);
    }
    assert.ok(side.guide.elevation.length >= 8);
  }
  for (const sport of ['FOOTBALL', 'BASKET', 'CAR', 'MOTO']) {
    for (const rarity of RARITIES) {
      const frame = manifest.assets.find((asset) => asset.asset_id === `ART_FRAME_${sport}_${rarity.toUpperCase()}`);
      const token = manifest.assets.find((asset) => asset.asset_id === `ART_TOKEN_${sport}_${rarity.toUpperCase()}`);
      assert.equal(frame.slot, 'card-frame');
      assert.equal(frame.placeholder, false);
      assert.equal(frame.rarity, rarity);
      assert.ok(frame.guide.portrait && frame.guide.stats.length > 0);
      assert.equal(token.slot, 'token-frame');
      assert.equal(token.rarity, rarity);
    }
  }
  for (const id of ['4-3-3', '4-2-3-1', '3-5-2', '4-4-2', '3-4-3']) {
    const asset = manifest.assets.find((entry) => entry.subject_id === `formation-${id}`);
    assert.equal(asset.guide.markers.length >= 11, true, id);
    assert.equal(asset.guide.markers.some((marker) => marker.role === 'GK'), true, id);
    assert.match(asset.content_id, /^SPC_FOOTBALL_TAC_00[1-5]$/);
  }
  const pitch = manifest.assets.find((entry) => entry.asset_id === 'ART_PITCH_TOP');
  assert.deepEqual(pitch.guide.goals, ['left', 'right']);
  for (const id of ['man', 'two-three', 'matchup']) {
    const asset = manifest.assets.find((entry) => entry.subject_id === `scheme-${id}`);
    assert.equal(asset.guide.markers.length, 5, id);
  }
});

test('slot index names every asset and shipped art has no brand strings', () => {
  const slots = readFileSync(join(root, 'docs/production/f/SPORT_ART_SLOTS.md'), 'utf8');
  const packed = `${JSON.stringify(manifest)}\n${slots}`;
  for (const pattern of BANNED) assert.equal(pattern.test(packed), false, String(pattern));
  for (const asset of manifest.assets) {
    assert.equal(slots.includes(asset.asset_id), true, asset.asset_id);
    assert.equal(slots.includes(asset.slot), true, asset.slot);
  }
  assert.match(slots, /portrait-slot/);
  assert.match(slots, /GENERATED_REVIEW/);
  assert.match(slots, /7b4ffccc9f16106b0674dceee8ed4d42090f0e49/);
});

test('review mock-ups cover the required landscape sizes', () => {
  const dir = join(root, 'tests/prod/f/mockups');
  const required = [
    ['hub', 844, 390],
    ['hub', 1280, 720],
    ['football', 844, 390],
    ['football', 1280, 720],
    ['car', 844, 390],
    ['car', 1280, 720],
    ['basket', 844, 390],
    ['result', 1280, 720],
    ['hub', 667, 375],
    ['hub', 915, 412],
    ['hub', 932, 430],
    ['hub', 1024, 768],
    ['football', 667, 375],
  ];
  for (const [scene, width, height] of required) {
    const file = join(dir, `${scene}-${width}x${height}.png`);
    assert.equal(existsSync(file), true, file);
    const buf = readFileSync(file);
    assert.equal(buf.toString('ascii', 1, 4), 'PNG');
    assert.equal(buf.readUInt32BE(16), width, file);
    assert.equal(buf.readUInt32BE(20), height, file);
  }
});
