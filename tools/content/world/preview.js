/**
 * Read-only HTML preview of the world pack.
 * No save writes, no battle start, no prices. The game client does not load this file.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadWorldPack, summarize, validateWorldPack } from './validate.js';

export function renderPreview(pack) {
  const counts = summarize(pack);
  const stages = pack.progression.chapters.flatMap((chapter) => chapter.stages.map((stage) => ({ chapter, stage })));
  const body = [
    header(counts),
    buildingSection(pack),
    npcSection(pack),
    shopSection(pack),
    eventSection(pack),
    tutorialSection(pack),
    progressionSection(pack, stages),
    questionSection(pack),
  ].join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World content preview</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #f3ecdf; color: #241c16; font: 18px/1.45 Georgia, "Iowan Old Style", Palatino, serif; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { font-size: 40px; line-height: 1.1; margin: 0 0 8px; }
  h2 { font-size: 28px; margin: 36px 0 8px; }
  h3 { font-size: 22px; margin: 22px 0 6px; }
  p { margin: 8px 0; }
  .stamp { display: inline-block; border: 2px solid #8c3a2f; color: #8c3a2f; font-family: ui-sans-serif, sans-serif; font-size: 13px; letter-spacing: 0.08em; padding: 4px 8px; margin-right: 8px; }
  .banner { background: #fffaf3; border: 1px solid #d9cbb6; padding: 16px 18px; }
  .counts { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; padding: 0; margin: 16px 0; }
  .counts div { background: #fffaf3; border: 1px solid #d9cbb6; padding: 10px 12px; }
  .counts dt { font-family: ui-sans-serif, sans-serif; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; }
  .counts dd { margin: 4px 0 0; font-size: 28px; }
  article, .card { background: #fffaf3; border: 1px solid #d9cbb6; padding: 12px 14px; margin: 10px 0; }
  .id { font-family: ui-monospace, monospace; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; background: #fffaf3; font-size: 16px; }
  th, td { border-bottom: 1px solid #e4d8c6; text-align: left; vertical-align: top; padding: 8px; }
  th { font-family: ui-sans-serif, sans-serif; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; }
  .pending { font-family: ui-sans-serif, sans-serif; font-size: 13px; color: #8c3a2f; }
  ol.chain { padding-left: 20px; }
  blockquote { margin: 8px 0; padding-left: 12px; border-left: 3px solid #c4b49a; }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

function header(counts) {
  const cells = Object.entries(counts).map(([key, value]) => `<div><dt>${esc(label(key))}</dt><dd>${value}</dd></div>`).join('');
  return `<header class="banner">
<p><span class="stamp">GENERATED_REVIEW</span><span class="stamp">PROPOSED</span></p>
<h1>World content preview</h1>
<p>Read-only pamphlet. It does not write a save, start a battle, or fill in an amount. The game client does not load this page.</p>
<p class="pending">Amounts below are empty on purpose. Status: PENDING_OWNER. This page is not owner approval.</p>
<dl class="counts">${cells}</dl>
</header>`;
}

function buildingSection(pack) {
  const rows = pack.npcs.map((npc) => {
    const building = npc.building;
    return `<tr>
<td class="id">${esc(building.assetId)}</td>
<td>${esc(building.hotspotLabel)}</td>
<td class="id">${esc(building.hotspotId)} / ${esc(building.siteId)}</td>
<td class="id">${esc(building.mapDestinationId)}</td>
<td>${esc(building.mapAction)}${building.webMode ? ` · ${esc(building.webMode)}` : ''}</td>
<td>${building.hotspotLocked ? 'locked pin' : 'open pin'}</td>
<td>${esc(npc.name)}</td>
</tr>`;
  }).join('');
  return `<section>
<h2>Buildings</h2>
<p>Hotspot ids and locked destination ids are both kept. Neither was renamed.</p>
<table>
<thead><tr><th>Asset</th><th>Hotspot label</th><th>Hotspot / site</th><th>Destination</th><th>Action</th><th>Pin</th><th>Speaker</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</section>`;
}

function npcSection(pack) {
  const cards = pack.npcs.map((npc) => `<article>
<h3>${esc(npc.name)}</h3>
<p class="id">${esc(npc.id)} · ${esc(npc.role)} · ${esc(npc.building.hotspotLabel)}</p>
${npc.lines.map((line) => `<blockquote>${esc(line)}</blockquote>`).join('')}
</article>`).join('');
  return `<section><h2>NPCs</h2>${cards}</section>`;
}

function shopSection(pack) {
  const shops = pack.shopkeepers.map((shop) => {
    const rows = shop.offers.map((offer) => `<tr>
<td class="id">${esc(offer.id)}</td>
<td>${esc(offer.displayName)}</td>
<td>${esc(offer.mallScreenLabel ?? '—')}</td>
<td>${esc(offer.currency ?? '—')}</td>
<td class="pending">— · PENDING_OWNER</td>
</tr>`).join('');
    return `<article>
<h3>${esc(shop.displayName)}</h3>
<p class="id">${esc(shop.id)} · checkout off</p>
<p>${esc(shop.pitch)}</p>
<table>
<thead><tr><th>Offer</th><th>Name</th><th>Mall label</th><th>Currency name</th><th>Amount</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</article>`;
  }).join('');
  return `<section><h2>Shopkeepers</h2>${shops}</section>`;
}

function eventSection(pack) {
  const cards = pack.sideEvents.map((event) => `<article>
<h3>${esc(event.title)}</h3>
<p class="id">${esc(event.id)} · ${esc(event.building.hotspotLabel)} · not a quest</p>
<p>${esc(event.body)}</p>
<p class="pending">Reward amount: — · PENDING_OWNER</p>
</article>`).join('');
  return `<section><h2>Side events</h2>${cards}</section>`;
}

function tutorialSection(pack) {
  const cards = [...pack.tutorials].sort((left, right) => left.order - right.order).map((tutorial) => `<article>
<h3>${tutorial.order}. ${esc(tutorial.title)}</h3>
<p class="id">${esc(tutorial.id)} · ${esc(tutorial.loopStep)} · ${esc(tutorial.screen)}</p>
<p>${esc(tutorial.body)}</p>
</article>`).join('');
  return `<section><h2>Tutorial prompts</h2>${cards}</section>`;
}

function progressionSection(pack, stages) {
  const items = stages.map(({ chapter, stage }) => `<li><span class="id">${esc(stage.id)}</span> — ${esc(stage.title)} <span class="pending">(${esc(chapter.title)}, unlock amount empty)</span></li>`).join('');
  const facilities = pack.progression.facilities.map((row) => `<li>${esc(row.building.hotspotLabel)} is open from the start. <span class="id">${esc(row.id)}</span></li>`).join('');
  const locked = pack.progression.lockedNodes.map((row) => `<li>${esc(row.building.hotspotLabel)} stays out of the chain. <span class="id">${esc(row.id)}</span></li>`).join('');
  return `<section>
<h2>Encounter order</h2>
<p>${esc(pack.progression.summary)}</p>
<ol class="chain">${items}</ol>
<h3>Open from the start</h3>
<ul>${facilities}</ul>
<h3>Not in the chain</h3>
<ul>${locked}</ul>
</section>`;
}

function questionSection(pack) {
  const items = pack.catalog.openQuestions.map((question) => `<li><span class="id">${esc(question.id)}</span> ${esc(question.text)}</li>`).join('');
  return `<section><h2>Open questions</h2><ol>${items}</ol></section>`;
}

function label(key) {
  return key.replaceAll(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function invokedDirectly() {
  if (!process.argv[1]) return false;
  return fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
}

if (invokedDirectly()) {
  const pack = loadWorldPack();
  const errors = validateWorldPack(pack);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  const html = renderPreview(pack);
  const target = new URL('./preview.html', import.meta.url);
  writeFileSync(target, html);
  console.log(`wrote ${fileURLToPath(target)} (${html.length} bytes)`);
}
