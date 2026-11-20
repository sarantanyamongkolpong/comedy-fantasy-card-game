import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { SPORT_CATALOG } from '../../../src/sport/gacha/index.js';

const BANNED = [
  'Lando Norris', 'Oscar Piastri', 'Charles Leclerc', 'Lewis Hamilton', 'George Russell',
  'Kimi Antonelli', 'Max Verstappen', 'Isack Hadjar', 'Nico Hülkenberg', 'Gabriel Bortoleto',
  'Carlos Sainz', 'Alexander Albon', 'Marc Márquez', 'Francesco Bagnaia', 'Fabio Quartararo',
  'Pedro Acosta', 'Jorge Martín', 'Brad Binder', 'Marco Bezzecchi', 'Joan Mir',
  'Toprak Razgatlıoğlu', 'Ai Ogura', 'McLaren', 'Ferrari', 'Mercedes', 'Red Bull', 'Williams',
  'Ducati', 'Aprilia', 'Yamaha', 'Honda', 'KTM', 'Mugello', 'Sachsenring', 'Silverstone',
];

function mentions(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}])${escaped}(?:$|[^\\p{L}])`, 'u').test(text);
}

function filesUnder(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) out.push(...filesUnder(path));
    else if (name.name.endsWith('.js')) out.push(path);
  }
  return out;
}

test('player-facing sport modules do not carry real identities outside the gacha real blocks', () => {
  const root = new URL('../../../src/sport/', import.meta.url);
  const paths = filesUnder(root.pathname).filter((path) => !path.endsWith(`${join('gacha', 'catalog.js')}`));
  const source = paths.map((path) => readFileSync(path, 'utf8')).join('\n');
  for (const name of BANNED) assert.equal(mentions(source, name), false, name);

  for (const cards of Object.values(SPORT_CATALOG)) {
    for (const card of cards) {
      const { real, ...rest } = card;
      const face = JSON.stringify(rest);
      for (const name of BANNED) assert.equal(mentions(face, name), false, `${card.id} ${name}`);
      if (real) {
        assert.equal(typeof real.name, 'string');
        assert.equal(typeof real.url, 'string');
        assert.equal(real.season, '2026');
        assert.equal(real.snapshotDate, '2026-11-20');
        assert.equal(real.name === card.parodyName, false);
      }
    }
  }
});
