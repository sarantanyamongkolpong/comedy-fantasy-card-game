/**
 * Static preview of the Agent A fragment.
 * Uses the same cardFace() layout as web/js/card-layers.js.
 * Names, costs, and rules are HTML from content/v05. Nothing is baked into the art.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anchorPercent, cardFace } from '../../../web/js/card-layers.js';
import { actionModel, playerFacingLine, playerFacingName } from '../../../web/js/render-card.js';
import { contentCatalog } from '../../../web/js/content-catalog.js';
import manifest from '../../../web/manifests/cards.json' with { type: 'json' };

const here = dirname(fileURLToPath(import.meta.url));
const previewDir = join(here, 'preview');
const counts = new Map();
for (const id of manifest.deck.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);

function assetOf(assetId) {
  return manifest.assets.find((asset) => asset.asset_id === assetId);
}

function boxStyle(layout, anchor) {
  const box = anchorPercent(layout, anchor);
  if (!box) return 'display:none';
  return `left:${box.left};top:${box.top};width:${box.width};height:${box.height}`;
}

function href(path) {
  return `../../../../${path}`;
}

function rulesText(face) {
  const bits = [];
  if (face.text.type) bits.push(face.text.type);
  if (face.text.rarity) bits.push(playerFacingLine(face.text.rarity));
  bits.push(...face.text.lines.map(playerFacingLine));
  bits.push(playerFacingLine(face.text.statusNote));
  return bits.filter(Boolean).join(' · ');
}

function cardHtml(cardId) {
  const def = contentCatalog.cardById(cardId);
  if (!def) throw new Error(`missing catalog card ${cardId}`);
  const face = cardFace(manifest, actionModel(def));
  const layers = face.layers.map((part) => {
    const entry = assetOf(part.assetId);
    const fit = entry?.presentation?.objectFit ?? 'fill';
    return `<img class="layer layer-${part.slot}" alt="" src="${href(part.path)}" style="${boxStyle(face.layout, part.anchor)};object-fit:${fit}">`;
  }).join('');
  const cost = face.text.apCost == null ? '' : `<span class="card-cost" style="${boxStyle(face.layout, 'apCost')}"><b>${face.text.apCost}</b></span>`;
  return `<figure class="slot">
    <article class="card" data-card-id="${cardId}" data-rarity="${face.text.rarity}" style="aspect-ratio:${face.layout.width} / ${face.layout.height}">
      ${layers}
      ${cost}
      <span class="card-name" style="${boxStyle(face.layout, 'name')}">${playerFacingName(face.text.name)}</span>
      <span class="card-rules" style="${boxStyle(face.layout, 'rulesText')}">${rulesText(face)}</span>
    </article>
    <figcaption>${cardId} · ${def.name} · ×${counts.get(cardId) ?? 0}</figcaption>
  </figure>`;
}

const css = `
  html, body { margin: 0; width: 100vw; height: 100vh; background: #24180f; color: #f6e7cf; overflow: hidden; }
  .stage { box-sizing: border-box; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 6px 10px 4px; }
  .slot { flex: 1 1 0; min-width: 0; height: 100%; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
  .card { position: relative; width: min(100%, calc((100vh - 52px) * 576 / 768)); max-height: calc(100% - 26px); background: transparent; }
  .card img, .card span { position: absolute; }
  .layer { display: block; }
  .card-name, .card-rules, .card-cost {
    display: flex; align-items: center; justify-content: center; text-align: center;
    color: #2a1c12; font-family: Palatino, Georgia, serif; overflow: hidden;
  }
  .card-name { font-weight: 700; font-size: 13px; line-height: 1.05; padding: 0 4px; }
  .card-rules { font-size: 12px; line-height: 1.15; padding: 0 8px; }
  .card-cost { justify-content: flex-end; font-weight: 800; font-size: 18px; padding-right: 6px; text-shadow: 0 1px 0 #fff6e4; }
  figcaption { width: 100%; margin: 0; font: 11px/1.2 ui-sans-serif, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }
`;

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>${body}</body>
</html>
`;
}

mkdirSync(previewDir, { recursive: true });
const ids = manifest.deck.uniqueCardIds;
const sheets = [];
for (let i = 0; i < ids.length; i += 3) {
  const group = ids.slice(i, i + 3);
  const n = String(sheets.length + 1).padStart(2, '0');
  const name = `sheet-${n}.html`;
  writeFileSync(join(previewDir, name), page(`Starter deck sheet ${n}`, `<main class="stage">${group.map(cardHtml).join('')}</main>`));
  sheets.push(name);
}
const index = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Card art preview</title></head>
<body>
  <h1>Agent A card preview</h1>
  <p>Layered render of DECK_DEMO_MIXED_001 through web/js/card-layers.js. Text is HTML from content/v05. Status GENERATED_REVIEW.</p>
  <ul>${sheets.map((name) => `<li><a href="${name}">${name}</a></li>`).join('')}</ul>
</body>
</html>
`;
writeFileSync(join(previewDir, 'index.html'), index);
console.log(JSON.stringify({ sheets, cards: ids.length }));
