/**
 * Compose review mock-ups from the shipped WebP.
 * Labels are screenshot chrome, not pixels inside the replaceable art.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const require = createRequire('/tmp/sport-tools/package.json');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const outDir = join(root, 'tests/prod/f/mockups');
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  [844, 390],
  [1280, 720],
  [667, 375],
  [915, 412],
  [932, 430],
  [1024, 768],
];

function stageBox(w, h) {
  const scale = Math.min(w / 1672, h / 941);
  return { ox: (w - 1672 * scale) / 2, oy: (h - 941 * scale) / 2, scale };
}

function box(stage, dx, dy, dw, dh, canvasW, canvasH) {
  let x = Math.round(stage.ox + dx * stage.scale);
  let y = Math.round(stage.oy + dy * stage.scale);
  let w = Math.max(1, Math.round(dw * stage.scale));
  let h = Math.max(1, Math.round(dh * stage.scale));
  if (x < 0) {
    w += x;
    x = 0;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }
  if (x + w > canvasW) w = canvasW - x;
  if (y + h > canvasH) h = canvasH - y;
  return { x, y, w: Math.max(1, w), h: Math.max(1, h) };
}

async function layer(file, placed) {
  const input = await sharp(join(root, 'web/assets/sport', file))
    .resize(placed.w, placed.h, { fit: 'fill' })
    .png()
    .toBuffer();
  return { input, left: placed.x, top: placed.y };
}

function labelSvg(w, h, labels) {
  const body = labels.map((item) => {
    const safe = String(item.text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<text x="${item.x}" y="${item.y}" fill="#F7F4EF" font-family="DejaVu Sans, sans-serif" font-size="${item.size}">${safe}</text>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

function scenePlan(scene, w, h) {
  const stage = stageBox(w, h);
  const at = (dx, dy, dw, dh) => box(stage, dx, dy, dw, dh, w, h);
  const images = [];
  const labels = [];
  const full = () => at(0, 0, 1672, 941);
  if (scene === 'hub') {
    images.push(['hub/exterior.webp', full()]);
    labels.push({ x: full().x + 28, y: full().y + 64, size: Math.max(16, Math.round(40 * stage.scale)), text: 'Sport Complex' });
    ['Football', 'Basket', 'Car', 'Moto'].forEach((text, index) => {
      const gate = at(180 + index * 390, 780, 220, 40);
      labels.push({ x: gate.x, y: gate.y + gate.h, size: Math.max(12, Math.round(26 * stage.scale)), text });
    });
  } else if (scene === 'football') {
    images.push(['prematch/football.webp', full()]);
    images.push(['prematch/football-chrome.webp', full()]);
    images.push(['tactics/formation-4-3-3.webp', at(620, 120, 430, 573)]);
    images.push(['frames/football-Epic.webp', at(70, 160, 210, 315)]);
    images.push(['slots/SPC_FOOTBALL_ATH_010.webp', at(98, 198, 154, 138)]);
    images.push(['teams/SPC_FOOTBALL_TEA_005.webp', at(78, 168, 42, 42)]);
    labels.push({ x: full().x + 36, y: full().y + 48, size: Math.max(14, Math.round(26 * stage.scale)), text: 'Pre-match' });
    const tactic = at(1280, 48, 200, 40);
    labels.push({ x: tactic.x, y: tactic.y + 24, size: Math.max(12, Math.round(20 * stage.scale)), text: '4-3-3' });
  } else if (scene === 'basket') {
    images.push(['prematch/basket.webp', full()]);
    images.push(['prematch/basket-chrome.webp', full()]);
    images.push(['tactics/scheme-two-three.webp', at(640, 180, 400, 433)]);
    images.push(['chrome/scoreboard-basket.webp', at(430, 40, 820, 150)]);
    labels.push({ x: full().x + 36, y: full().y + 48, size: Math.max(14, Math.round(24 * stage.scale)), text: 'Five on court' });
  } else if (scene === 'car') {
    images.push(['prematch/car.webp', full()]);
    images.push(['tracks/SPC_CAR_TRK_001-top.webp', at(520, 80, 640, 640)]);
    ['soft', 'medium', 'hard', 'inter', 'wet'].forEach((compound, index) => {
      images.push([`selectors/tyre-car-${compound}.webp`, at(430, 150 + index * 130, 120, 120)]);
    });
    images.push(['tokens/car-R.webp', at(1360, 240, 200, 200)]);
    images.push(['slots/SPC_CAR_VEH_001.webp', at(1392, 272, 136, 120)]);
    const tyreLabel = at(430, 70, 160, 40);
    labels.push({ x: tyreLabel.x, y: tyreLabel.y + 28, size: Math.max(14, Math.round(24 * stage.scale)), text: 'Tyres' });
  } else if (scene === 'result') {
    images.push(['results/football.webp', full()]);
    images.push(['results/podium.webp', at(386, 470, 900, 420)]);
    images.push(['chrome/scoreboard-football.webp', at(180, 40, 1310, 220)]);
    const caption = at(80, 850, 200, 40);
    labels.push({ x: caption.x, y: caption.y + 28, size: Math.max(14, Math.round(22 * stage.scale)), text: 'Result' });
  }
  return { images, labels };
}

const scenes = ['hub', 'football', 'basket', 'car', 'result'];
for (const [w, h] of VIEWPORTS) {
  for (const scene of scenes) {
    const extra = w !== 844 && w !== 1280 && !['hub', 'football', 'car'].includes(scene);
    if (extra) continue;
    const plan = scenePlan(scene, w, h);
    const composites = [];
    for (const [file, placed] of plan.images) composites.push(await layer(file, placed));
    const labels = new Resvg(labelSvg(w, h, plan.labels), {
      fitTo: { mode: 'width', value: w },
      background: 'rgba(0,0,0,0)',
      font: { loadSystemFonts: true },
    }).render().asPng();
    composites.push({ input: labels, left: 0, top: 0 });
    const png = await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 20, g: 14, b: 20, alpha: 1 } },
    }).composite(composites).png().toBuffer();
    const file = join(outDir, `${scene}-${w}x${h}.png`);
    writeFileSync(file, png);
    process.stdout.write(`${scene}-${w}x${h} ${png.length}\n`);
  }
}
