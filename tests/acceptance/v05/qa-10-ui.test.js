import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { bindApi, loadNamed, MAP_FILES, repoPath } from './helpers/load-api.js';

const WEB_ROOT = repoPath('web');
const webLanded = existsSync(WEB_ROOT);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

if (!webLanded) {
  test.todo('QA-10 MAP-01 MAP-02 MAP-03 MAP-04 MAP-05 MAP-06 MAP-07 MAP-08 MAP-09 world map entries — web/ not landed (stream C)');
  test.todo('OWNER-PLAT-01 OWNER-PLAT-02 web landscape shell — web/ not landed (stream C)');
  test.todo('OWNER-PLAT-03 visuals resolve through the asset manifest — web/ not landed (stream C)');
  test.todo('QA-10 e2e smoke Deck Battle Rewards — web/ not present (stream C)');
} else {
  test('QA-10 MAP-01 MAP-02 MAP-03 MAP-04 MAP-05 MAP-06 MAP-07 MAP-08 MAP-09 world map entries', () => {
    const manifest = JSON.parse(readFileSync(join(WEB_ROOT, 'assets-manifest.json'), 'utf8'));
    const listed = manifest.mapEntries ?? manifest.entries ?? manifest.buildings;
    const fromAssets = (manifest.assets ?? [])
      .filter((asset) => asset.slot === 'building')
      .map((asset) => asset.hotspot?.siteId ?? asset.hotspot?.id);
    const ids = (listed ?? fromAssets).map((entry) => (typeof entry === 'string' ? entry : entry.id ?? entry.key));
    for (const id of ['home', 'tower', 'sports', 'arena', 'mall', 'gachapon']) {
      assert.ok(ids.includes(id), `map is missing ${id}`);
    }
  });

  test('OWNER-PLAT-01 OWNER-PLAT-02 web landscape shell', () => {
    assert.equal(existsSync(join(WEB_ROOT, 'index.html')), true);
    const html = readFileSync(join(WEB_ROOT, 'index.html'), 'utf8');
    assert.match(html, /id="rotate-overlay"|data-testid="rotate-overlay"/);
    const css = readFileSync(join(WEB_ROOT, 'css', 'app.css'), 'utf8');
    assert.match(css, /#rotate-overlay\s*\{[^}]*display:\s*none/);
    assert.match(css, /is-portrait #rotate-overlay|\(orientation:\s*portrait\)/);
  });

  test('OWNER-PLAT-03 visuals resolve through the asset manifest', () => {
    const manifestPath = join(WEB_ROOT, 'assets-manifest.json');
    assert.equal(existsSync(manifestPath), true);
    const manifestText = readFileSync(manifestPath, 'utf8');
    const sourceFiles = walk(WEB_ROOT).filter((file) => /\.(html|css|js|mjs)$/.test(file) && !file.endsWith('assets-manifest.json'));
    for (const file of sourceFiles) {
      const text = readFileSync(file, 'utf8');
      assert.equal(text.includes('data:image'), false, `${file} embeds data:image`);
      const refs = text.match(/[\w./-]+\.(png|webp|gif|jpe?g)/gi) ?? [];
      for (const ref of refs) {
        assert.ok(manifestText.includes(ref), `${file} references ${ref} outside web/assets-manifest.json`);
      }
    }
  });

}

const map = await loadNamed(MAP_FILES, ['layoutWorldMap'], 'stream C');
bindApi(map, [
  {
    name: 'QA-10 map layout export is the OWNER-PLAT-04 hook',
    fn(api) {
      assert.equal(typeof api.layoutWorldMap, 'function');
    },
  },
]);
