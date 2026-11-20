/**
 * Original battle-UI vectors for Agent E.
 * Run with Node when resvg and sharp are installed. Outputs are committed:
 *   art-src/battle-ui/*.svg
 *   web/assets/battle-ui/*.webp
 *   web/manifests/battle-ui.json
 * No gameplay words are drawn. Raster size is the shipped WebP byte count.
 */
import { createRequire } from 'node:module';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const svgDir = here;
const webpDir = join(root, 'web', 'assets', 'battle-ui');
const manifestPath = join(root, 'web', 'manifests', 'battle-ui.json');

const require = createRequire(process.env.E_RASTER_REQUIRE ?? '/tmp/tools/node_modules/sharp/package.json');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const gold = `
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff8dc"/>
    <stop offset="0.42" stop-color="#f0d48a"/>
    <stop offset="0.72" stop-color="#c9963a"/>
    <stop offset="1" stop-color="#6b4714"/>
  </linearGradient>
  <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff8dc"/>
    <stop offset="0.45" stop-color="#e6c36a"/>
    <stop offset="1" stop-color="#7a5418"/>
  </linearGradient>`;

const purple = `
  <linearGradient id="purple" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f4ecff"/>
    <stop offset="0.45" stop-color="#8d6ad0"/>
    <stop offset="1" stop-color="#3a1868"/>
  </linearGradient>`;

function svg(body, w, h) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none">
  <defs>${gold}${purple}</defs>
  ${body}
</svg>
`;
}

const pieces = [
  {
    id: 'E_FRAME_CORNER',
    file: 'frame-corner',
    slot: 'battle-ui',
    anchor: 'corner',
    subject: 'frame-corner',
    width: 128,
    box: [64, 64],
    body: `
      <path d="M6 58 V18 Q6 6 18 6 H58" stroke="url(#gold)" stroke-width="7" stroke-linejoin="round"/>
      <path d="M6 58 V18 Q6 6 18 6 H58" stroke="#fff6d2" stroke-width="1.4" opacity="0.85"/>
      <path d="M12 52 V22 Q12 12 22 12 H52" stroke="url(#purple)" stroke-width="2.6"/>
      <path d="M16 2 L26 14 L16 26 L6 14 Z" fill="url(#purple)" stroke="#fff1c4" stroke-width="1.2"/>
      <path d="M16 8 L20 14 L16 17 L12 14 Z" fill="#ffffff" opacity="0.75"/>
      <circle cx="40" cy="9" r="2.3" fill="#f0d48a" stroke="#6b4714" stroke-width="0.7"/>
      <circle cx="9" cy="40" r="2.3" fill="#f0d48a" stroke="#6b4714" stroke-width="0.7"/>
      <circle cx="52" cy="9" r="1.35" fill="#fff8dc"/>
      <circle cx="9" cy="52" r="1.35" fill="#fff8dc"/>
    `,
  },
  {
    id: 'E_FRAME_EDGE_H',
    file: 'frame-edge-h',
    slot: 'battle-ui',
    anchor: 'edge',
    subject: 'frame-edge-h',
    width: 256,
    box: [64, 16],
    body: `
      <rect x="0" y="2" width="64" height="12" fill="url(#goldV)"/>
      <rect x="0" y="3" width="64" height="2.2" fill="#fff8dc" opacity="0.8"/>
      <rect x="0" y="10.2" width="64" height="1.6" fill="#5a348c"/>
      <rect x="0" y="12.2" width="64" height="1" fill="#fff1c4" opacity="0.55"/>
    `,
  },
  {
    id: 'E_FRAME_EDGE_V',
    file: 'frame-edge-v',
    slot: 'battle-ui',
    anchor: 'edge',
    subject: 'frame-edge-v',
    width: 48,
    box: [16, 64],
    body: `
      <rect x="2" y="0" width="12" height="64" fill="url(#gold)"/>
      <rect x="3" y="0" width="2.2" height="64" fill="#fff8dc" opacity="0.8"/>
      <rect x="10.2" y="0" width="1.6" height="64" fill="#5a348c"/>
      <rect x="12.2" y="0" width="1" height="64" fill="#fff1c4" opacity="0.55"/>
    `,
  },
  {
    id: 'E_AP_GEM_ON',
    file: 'ap-gem-on',
    slot: 'battle-ui',
    anchor: 'meter',
    subject: 'ap-gem-on',
    width: 160,
    box: [128, 128],
    body: `
      <circle cx="64" cy="64" r="48" fill="#102038" stroke="url(#gold)" stroke-width="8"/>
      <circle cx="64" cy="64" r="34" fill="#147a96"/>
      <path d="M64 32 L94 64 L64 96 L34 64 Z" fill="#bff7ff" opacity="0.55"/>
      <path d="M64 40 L80 64 L64 74 L48 64 Z" fill="#ffffff" opacity="0.9"/>
      <path d="M64 18 L72 36 L56 36 Z" fill="url(#gold)"/>
      <path d="M64 110 L72 92 L56 92 Z" fill="url(#gold)"/>
      <path d="M18 64 L36 72 L36 56 Z" fill="url(#gold)"/>
      <path d="M110 64 L92 72 L92 56 Z" fill="url(#gold)"/>
      <circle cx="52" cy="50" r="4" fill="#ffffff" opacity="0.85"/>
    `,
  },
  {
    id: 'E_AP_GEM_OFF',
    file: 'ap-gem-off',
    slot: 'battle-ui',
    anchor: 'meter',
    subject: 'ap-gem-off',
    width: 160,
    box: [128, 128],
    body: `
      <circle cx="64" cy="64" r="48" fill="#10182c" stroke="#6b5430" stroke-width="8"/>
      <circle cx="64" cy="64" r="34" fill="#1a2744"/>
      <path d="M64 36 L88 64 L64 92 L40 64 Z" fill="#243656" opacity="0.9"/>
      <path d="M64 18 L70 34 L58 34 Z" fill="#8a7040"/>
      <path d="M64 110 L70 94 L58 94 Z" fill="#8a7040"/>
      <path d="M18 64 L34 70 L34 58 Z" fill="#8a7040"/>
      <path d="M110 64 L94 70 L94 58 Z" fill="#8a7040"/>
    `,
  },
  {
    id: 'E_HP_TRACK',
    file: 'hp-track',
    slot: 'battle-ui',
    anchor: 'bar',
    subject: 'hp-track',
    width: 420,
    box: [280, 36],
    body: `
      <rect x="2" y="3" width="276" height="30" rx="15" fill="#2a0c14" stroke="url(#goldV)" stroke-width="3"/>
      <rect x="10" y="6" width="260" height="6" rx="3" fill="#fff6d2" opacity="0.28"/>
      <rect x="10" y="24" width="260" height="3" rx="1.5" fill="#6b1a24" opacity="0.8"/>
    `,
  },
  {
    id: 'E_HP_SHIELD',
    file: 'hp-shield',
    slot: 'battle-ui',
    anchor: 'overlay',
    subject: 'hp-shield',
    width: 128,
    box: [32, 32],
    body: `
      <rect width="32" height="32" fill="#7ec8ff" opacity="0.42"/>
      <rect width="32" height="7" fill="#ffffff" opacity="0.45"/>
      <rect x="5" width="3" height="32" fill="#e7f6ff" opacity="0.35"/>
      <rect x="16" width="2" height="32" fill="#ffffff" opacity="0.28"/>
      <rect x="24" width="4" height="32" fill="#2a6adf" opacity="0.25"/>
    `,
  },
  {
    id: 'E_SHADOW_GROUND',
    file: 'shadow-ground',
    slot: 'battle-ui',
    anchor: 'feet',
    subject: 'shadow-ground',
    width: 256,
    box: [128, 32],
    body: `
      <ellipse cx="64" cy="18" rx="58" ry="10" fill="#05040a" opacity="0.55"/>
      <ellipse cx="64" cy="18" rx="34" ry="5" fill="#05040a" opacity="0.45"/>
    `,
  },
  {
    id: 'E_VFX_SHIELD',
    file: 'vfx-shield',
    slot: 'battle-ui',
    anchor: 'status',
    subject: 'vfx-shield',
    width: 192,
    box: [128, 128],
    body: `
      <path d="M64 10 L104 28 V66 Q104 100 64 118 Q24 100 24 66 V28 Z" fill="#1a4e9a" stroke="url(#gold)" stroke-width="5"/>
      <path d="M64 22 L92 36 V66 Q92 90 64 104 Q36 90 36 66 V36 Z" fill="#7ec8ff" opacity="0.85"/>
      <path d="M64 34 L78 58 H50 Z" fill="#ffffff" opacity="0.8"/>
      <path d="M40 70 Q64 86 88 70" stroke="#e7f6ff" stroke-width="3" opacity="0.7"/>
    `,
  },
  {
    id: 'E_VFX_BUFF',
    file: 'vfx-buff',
    slot: 'battle-ui',
    anchor: 'status',
    subject: 'vfx-buff',
    width: 192,
    box: [128, 128],
    body: `
      <path d="M64 14 L82 48 H70 V104 H58 V48 H46 Z" fill="url(#gold)"/>
      <path d="M64 28 L74 48 H54 Z" fill="#fff8dc"/>
      <path d="M18 78 Q40 58 52 70" stroke="#f0d48a" stroke-width="4" stroke-linecap="round"/>
      <path d="M110 78 Q88 58 76 70" stroke="#f0d48a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="28" cy="40" r="4" fill="#fff8dc"/>
      <circle cx="100" cy="36" r="3" fill="#fff8dc"/>
      <circle cx="64" cy="112" r="5" fill="#c9963a" stroke="#fff8dc" stroke-width="1.2"/>
    `,
  },
  {
    id: 'E_VFX_DEBUFF',
    file: 'vfx-debuff',
    slot: 'battle-ui',
    anchor: 'status',
    subject: 'vfx-debuff',
    width: 192,
    box: [128, 128],
    body: `
      <path d="M64 114 L82 80 H70 V24 H58 V80 H46 Z" fill="url(#purple)"/>
      <path d="M64 96 L74 78 H54 Z" fill="#f4ecff" opacity="0.8"/>
      <path d="M30 34 L58 70" stroke="#1a0a28" stroke-width="3" opacity="0.7"/>
      <path d="M98 40 L70 78" stroke="#1a0a28" stroke-width="3" opacity="0.55"/>
      <circle cx="34" cy="88" r="4" fill="#6a3ea0"/>
      <circle cx="96" cy="96" r="3" fill="#c9b6ff"/>
    `,
  },
  {
    id: 'E_ROW_FRONT',
    file: 'row-front',
    slot: 'battle-ui',
    anchor: 'row',
    subject: 'row-front',
    width: 64,
    box: [64, 32],
    body: `
      <path d="M32 2 L46 16 L32 30 L18 16 Z" fill="url(#gold)" stroke="#fff8dc" stroke-width="1.4"/>
      <path d="M32 8 L38 16 L32 20 L26 16 Z" fill="#fff8dc" opacity="0.85"/>
    `,
  },
  {
    id: 'E_ROW_BACK',
    file: 'row-back',
    slot: 'battle-ui',
    anchor: 'row',
    subject: 'row-back',
    width: 64,
    box: [64, 32],
    body: `
      <path d="M32 2 L46 16 L32 30 L18 16 Z" fill="#d5deea" stroke="#8ea0b8" stroke-width="1.4"/>
      <path d="M32 8 L38 16 L32 20 L26 16 Z" fill="#ffffff" opacity="0.8"/>
    `,
  },
];

mkdirSync(svgDir, { recursive: true });
mkdirSync(webpDir, { recursive: true });
mkdirSync(dirname(manifestPath), { recursive: true });

const assets = [];
for (const piece of pieces) {
  const [w, h] = piece.box;
  const source = svg(piece.body, w, h);
  const svgName = `${piece.file}.svg`;
  const webpName = `${piece.file}.webp`;
  writeFileSync(join(svgDir, svgName), source);
  const png = new Resvg(source, { fitTo: { mode: 'width', value: piece.width } }).render().asPng();
  const webp = await sharp(png).webp({ quality: 90, alphaQuality: 100, effort: 4 }).toBuffer();
  writeFileSync(join(webpDir, webpName), webp);
  const shipped = `web/assets/battle-ui/${webpName}`;
  assets.push({
    asset_id: piece.id,
    slot: piece.slot,
    path: shipped,
    anchor: piece.anchor,
    subject_id: piece.subject,
    rarity: null,
    status: 'CONCEPT',
    review_status: 'GENERATED_REVIEW',
    source_path: `art-src/battle-ui/${svgName}`,
    bytes: statSync(join(webpDir, webpName)).size,
    type: 'ui',
    owner: 'prod-e',
    placeholder: false,
  });
  console.log(piece.id, assets.at(-1).bytes);
}

const manifest = {
  manifest_version: 1,
  project: 'Comedy Fantasy Card Game',
  stream: 'prod-e',
  review_status: 'GENERATED_REVIEW',
  productionReady: false,
  note: 'Agent E battle UI fragment. status stays CONCEPT because the asset schema has no GENERATED_REVIEW value. review_status is GENERATED_REVIEW. Original SVG, rasterized to WebP. No baked gameplay text. Integration merges this file later.',
  assets,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('assets', assets.length);
