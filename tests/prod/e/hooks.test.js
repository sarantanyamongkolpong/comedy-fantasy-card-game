import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../..', import.meta.url));

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

test('shared hooks are the stylesheet and one polish call', () => {
  const html = read('web/index.html');
  const app = read('web/js/app.js');
  assert.match(html, /css\/app\.css/);
  assert.match(html, /css\/battle-polish\.css/);
  assert.equal(html.indexOf('css/app.css') < html.indexOf('css/battle-polish.css'), true);
  assert.match(app, /import \{ applyBattlePolish \} from '\.\/battle-fx\/polish\.js'/);
  assert.match(app, /applyBattlePolish\(view, ctx\)/);
  assert.equal(app.includes('src/engine'), false);
});

test('battle fx modules do not import the engine or bake asset paths', () => {
  const dir = join(root, 'web/js/battle-fx');
  const files = readdirSync(dir).filter((name) => name.endsWith('.js'));
  assert.ok(files.includes('polish.js'));
  for (const name of files) {
    const text = read(`web/js/battle-fx/${name}`);
    assert.equal(text.includes('src/engine'), false, name);
    assert.equal(text.includes('web/assets/'), false, name);
    assert.equal(/\.(png|webp|gif|jpe?g)/i.test(text), false, name);
    assert.equal(/data:image/i.test(text), false, name);
  }
});
