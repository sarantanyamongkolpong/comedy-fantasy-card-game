/**
 * Author Sport Complex art as SVG and rasterize shipped WebP.
 * Raster tools are optional and live outside the repo:
 *   mkdir -p /tmp/sport-tools && cd /tmp/sport-tools && npm init -y
 *   npm install @resvg/resvg-js sharp
 * Originals: art-src/sport/svg. Shipped: web/assets/sport. Fragment: web/manifests/sport.json.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUDGETS,
  CARD,
  FORMATIONS,
  PARODY_SOURCE,
  PEOPLE,
  PITCH,
  COURT,
  RARITIES,
  SCHEMES,
  SPORT,
  TEAMS,
  TOKEN,
  TRACKS,
  VENUES,
  sportOfCard,
  statWindows,
} from './lib/catalog.mjs';
import { cardFrame, cardInterior, silhouette, teamBadge, tokenFrame } from './lib/draw-cards.mjs';
import {
  HUB_GATES,
  courtSide,
  courtTop,
  hubExterior,
  hubInterior,
  layoutChrome,
  pitchSide,
  pitchTop,
  portal,
  prematch,
  trackSide,
  trackTop,
  venueScene,
} from './lib/draw-world.mjs';
import {
  formationBoard,
  gantry,
  podium,
  resultScene,
  schemeBoard,
  scoreboard,
  setupIcon,
  timingTower,
  tyreIcon,
} from './lib/draw-ui.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const require = createRequire('/tmp/sport-tools/package.json');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const RASTER = {
  frame: { width: 512, quality: 82 },
  token: { width: 256, quality: 82 },
  interior: { width: 512, quality: 74 },
  slot: { width: 380, quality: 78 },
  team: { width: 256, quality: 82 },
  venue: { width: 1280, quality: 72 },
  track: { width: 1024, quality: 72 },
  'track-side': { width: 1280, quality: 72 },
  pitch: { width: 1280, quality: 78 },
  court: { width: 1120, quality: 78 },
  prematch: { width: 1280, quality: 72 },
  layout: { width: 1280, quality: 78 },
  formation: { width: 480, quality: 80 },
  scheme: { width: 480, quality: 80 },
  icon: { width: 160, quality: 82 },
  scoreboard: { width: 1280, quality: 80 },
  tower: { width: 480, quality: 80 },
  gantry: { width: 640, quality: 82 },
  podium: { width: 900, quality: 82 },
  result: { width: 1280, quality: 72 },
  hub: { width: 1280, quality: 72 },
  portal: { width: 480, quality: 82 },
};

const jobs = [];

function add(job) {
  jobs.push(job);
}

function norm(box, width, height) {
  return {
    x: Math.round((box.x / width) * 10000) / 10000,
    y: Math.round((box.y / height) * 10000) / 10000,
    w: Math.round((box.w / width) * 10000) / 10000,
    h: Math.round((box.h / height) * 10000) / 10000,
  };
}

for (const sport of Object.values(SPORT)) {
  const windows = {
    portrait: norm(CARD.portrait, CARD.w, CARD.h),
    name: norm(CARD.name, CARD.w, CARD.h),
    rules: norm(CARD.rules, CARD.w, CARD.h),
    badge: norm(CARD.badge, CARD.w, CARD.h),
    stats: statWindows(sport.stats.length).map((box) => norm(box, CARD.w, CARD.h)),
    statKeys: sport.stats,
  };
  for (const rarity of RARITIES) {
    add({
      asset_id: `ART_FRAME_${sport.id.toUpperCase()}_${rarity.toUpperCase()}`,
      slot: 'card-frame',
      anchor: 'card-frame',
      subject_id: `frame-${sport.id}`,
      rarity,
      category: 'frame',
      file: `frames/${sport.id}-${rarity}`,
      placeholder: false,
      transparent: true,
      sport: sport.id,
      guide: windows,
      svg: cardFrame(sport, rarity),
    });
    add({
      asset_id: `ART_TOKEN_${sport.id.toUpperCase()}_${rarity.toUpperCase()}`,
      slot: 'token-frame',
      anchor: 'token-ring',
      subject_id: `token-${sport.id}`,
      rarity,
      category: 'token',
      file: `tokens/${sport.id}-${rarity}`,
      placeholder: false,
      transparent: true,
      sport: sport.id,
      guide: {
        center: [0.5, 0.5],
        holeRadius: Math.round((TOKEN.hole / TOKEN.w) * 10000) / 10000,
      },
      svg: tokenFrame(sport, rarity),
    });
  }
  add({
    asset_id: `ART_INTERIOR_${sport.id.toUpperCase()}`,
    slot: 'card-interior',
    anchor: 'card-back',
    subject_id: `interior-${sport.id}`,
    rarity: null,
    category: 'interior',
    file: `interiors/${sport.id}`,
    placeholder: false,
    transparent: false,
    sport: sport.id,
    svg: cardInterior(sport),
  });
}

for (const person of PEOPLE) {
  const sport = sportOfCard(person.cardId);
  add({
    asset_id: `ART_${person.cardId}`,
    slot: 'portrait-slot',
    anchor: 'portrait-window',
    subject_id: person.cardId,
    rarity: null,
    category: 'slot',
    file: `slots/${person.cardId}`,
    placeholder: true,
    transparent: true,
    sport,
    parody_name: person.name,
    role: person.role,
    team: person.team,
    pose: person.pose,
    lean: person.lean,
    ip_review: person.ipReview,
    content_slot: person.cardId.includes('_VEH_') ? `${person.cardId}_BODY` : `${person.cardId}_PORTRAIT`,
    drop_in: 'Owner portrait replaces this file. Keep asset_id, slot, anchor, subject_id, and content_slot. Do not paint the portrait into the frame.',
    svg: silhouette(person),
  });
}

for (const team of TEAMS) {
  add({
    asset_id: `ART_${team.cardId}`,
    slot: 'team-colour',
    anchor: 'team-badge',
    subject_id: team.cardId,
    rarity: null,
    category: 'team',
    file: `teams/${team.cardId}`,
    placeholder: false,
    transparent: true,
    sport: team.sport,
    parody_name: team.name,
    palette: team.palette,
    motif: team.motif,
    note: team.note,
    svg: teamBadge(team),
  });
}

for (const venue of VENUES) {
  add({
    asset_id: `ART_${venue.cardId}`,
    slot: 'venue',
    anchor: 'establishing',
    subject_id: venue.cardId,
    rarity: null,
    category: 'venue',
    file: `venues/${venue.cardId}`,
    placeholder: false,
    transparent: false,
    sport: venue.sport,
    parody_name: venue.name,
    team: venue.teamName,
    svg: venueScene(venue),
  });
}

for (const track of TRACKS) {
  const top = trackTop(track);
  const side = trackSide(track);
  add({
    asset_id: `ART_${track.cardId}_TOP`,
    slot: 'track-top',
    anchor: 'sim-board',
    subject_id: track.cardId,
    rarity: null,
    category: 'track',
    file: `tracks/${track.cardId}-top`,
    placeholder: false,
    transparent: false,
    sport: track.sport,
    parody_name: track.name,
    note: track.cue,
    guide: top.guide,
    svg: top.svg,
  });
  add({
    asset_id: `ART_${track.cardId}_SIDE`,
    slot: 'track-side',
    anchor: 'lap-profile',
    subject_id: track.cardId,
    rarity: null,
    category: 'track-side',
    file: `tracks/${track.cardId}-side`,
    placeholder: false,
    transparent: false,
    sport: track.sport,
    parody_name: track.name,
    note: track.cue,
    guide: side.guide,
    svg: side.svg,
  });
}

add({
  asset_id: 'ART_PITCH_TOP',
  slot: 'pitch-top',
  anchor: 'sim-field',
  subject_id: 'pitch-top',
  rarity: null,
  category: 'pitch',
  file: 'fields/pitch-top',
  sport: 'football',
  placeholder: false,
  transparent: false,
  note: 'Readable 11v11 board. Line weight is thickened for phones. Proportions follow a standard pitch, not a surveyed venue.',
  guide: {
    play: { x: 46 / PITCH.view.w, y: 46 / PITCH.view.h, w: (PITCH.view.w - 92) / PITCH.view.w, h: (PITCH.view.h - 92) / PITCH.view.h },
    center: [0.5, 0.5],
    goals: ['left', 'right'],
  },
  svg: pitchTop(),
});
add({
  asset_id: 'ART_PITCH_SIDE',
  slot: 'pitch-side',
  anchor: 'sim-camera',
  subject_id: 'pitch-side',
  rarity: null,
  category: 'pitch',
  file: 'fields/pitch-side',
  sport: 'football',
  placeholder: false,
  transparent: false,
  guide: {
    trapezoid: {
      farLeft: PITCH.side.farLeft.map((value, index) => value / (index === 0 ? PITCH.side.w : PITCH.side.h)),
      farRight: PITCH.side.farRight.map((value, index) => value / (index === 0 ? PITCH.side.w : PITCH.side.h)),
      nearRight: PITCH.side.nearRight.map((value, index) => value / (index === 0 ? PITCH.side.w : PITCH.side.h)),
      nearLeft: PITCH.side.nearLeft.map((value, index) => value / (index === 0 ? PITCH.side.w : PITCH.side.h)),
    },
  },
  svg: pitchSide(),
});
add({
  asset_id: 'ART_COURT_TOP',
  slot: 'court-top',
  anchor: 'sim-field',
  subject_id: 'court-top',
  rarity: null,
  category: 'court',
  file: 'fields/court-top',
  sport: 'basket',
  placeholder: false,
  transparent: false,
  note: 'Readable 5v5 board inspired by a full-court game. Not a certified court survey.',
  guide: { center: [0.5, 0.5], baskets: ['left', 'right'] },
  svg: courtTop(),
});
add({
  asset_id: 'ART_COURT_SIDE',
  slot: 'court-side',
  anchor: 'sim-camera',
  subject_id: 'court-side',
  rarity: null,
  category: 'court',
  file: 'fields/court-side',
  sport: 'basket',
  placeholder: false,
  transparent: false,
  guide: {
    trapezoid: {
      farLeft: COURT.side.farLeft.map((value, index) => value / (index === 0 ? COURT.side.w : COURT.side.h)),
      farRight: COURT.side.farRight.map((value, index) => value / (index === 0 ? COURT.side.w : COURT.side.h)),
      nearRight: COURT.side.nearRight.map((value, index) => value / (index === 0 ? COURT.side.w : COURT.side.h)),
      nearLeft: COURT.side.nearLeft.map((value, index) => value / (index === 0 ? COURT.side.w : COURT.side.h)),
    },
  },
  svg: courtSide(),
});

for (const sportId of ['football', 'basket', 'car', 'moto']) {
  const chrome = layoutChrome(sportId);
  add({
    asset_id: `ART_PREMATCH_${sportId.toUpperCase()}`,
    slot: 'prematch',
    anchor: 'prematch-bg',
    subject_id: `prematch-${sportId}`,
    rarity: null,
    category: 'prematch',
    file: `prematch/${sportId}`,
    sport: sportId,
    placeholder: false,
    transparent: false,
    svg: prematch(sportId),
  });
  add({
    asset_id: `ART_LAYOUT_${sportId.toUpperCase()}`,
    slot: 'layout-chrome',
    anchor: 'prematch-chrome',
    subject_id: `layout-${sportId}`,
    rarity: null,
    category: 'layout',
    file: `prematch/${sportId}-chrome`,
    sport: sportId,
    placeholder: false,
    transparent: true,
    guide: { regions: chrome.regions },
    svg: chrome.svg,
  });
  add({
    asset_id: `ART_RESULT_${sportId.toUpperCase()}`,
    slot: 'result',
    anchor: 'result-bg',
    subject_id: `result-${sportId}`,
    rarity: null,
    category: 'result',
    file: `results/${sportId}`,
    sport: sportId,
    placeholder: false,
    transparent: false,
    guide: {
      homeScore: { x: 430 / 1672, y: 360 / 941, w: 220 / 1672, h: 120 / 941 },
      awayScore: { x: 1020 / 1672, y: 360 / 941, w: 220 / 1672, h: 120 / 941 },
      center: { x: 700 / 1672, y: 350 / 941, w: 270 / 1672, h: 140 / 941 },
    },
    svg: resultScene(sportId),
  });
}

for (const formation of FORMATIONS) {
  const board = formationBoard(formation);
  add({
    asset_id: `ART_FORMATION_${formation.id.replaceAll('-', '_')}`,
    slot: 'formation',
    anchor: 'tactic-board',
    subject_id: `formation-${formation.id}`,
    rarity: null,
    category: 'formation',
    file: `tactics/formation-${formation.id}`,
    sport: 'football',
    placeholder: false,
    transparent: false,
    content_id: formation.contentId,
    guide: { markers: board.markers, attack: 'top', goalkeeper: 'bottom' },
    svg: board.svg,
  });
}
for (const scheme of SCHEMES) {
  const board = schemeBoard(scheme);
  add({
    asset_id: `ART_SCHEME_${scheme.id.toUpperCase().replaceAll('-', '_')}`,
    slot: 'scheme',
    anchor: 'tactic-board',
    subject_id: `scheme-${scheme.id}`,
    rarity: null,
    category: 'scheme',
    file: `tactics/scheme-${scheme.id}`,
    sport: 'basket',
    placeholder: false,
    transparent: false,
    parody_name: scheme.name,
    content_id: scheme.contentId,
    guide: { markers: board.markers, basket: 'top' },
    svg: board.svg,
  });
}

const TYRE_CONTENT = {
  car: { soft: 'SPC_CAR_TAC_001', medium: 'SPC_CAR_TAC_002', hard: 'SPC_CAR_TAC_003', inter: 'SPC_CAR_TAC_004', wet: 'SPC_CAR_TAC_005' },
  moto: { soft: 'SPC_MOTO_TAC_001', medium: 'SPC_MOTO_TAC_002', hard: 'SPC_MOTO_TAC_003', wet: 'SPC_MOTO_TAC_004' },
};
for (const [kind, compounds] of [['car', ['soft', 'medium', 'hard', 'inter', 'wet']], ['moto', ['soft', 'medium', 'hard', 'wet']]]) {
  for (const compound of compounds) {
    add({
      asset_id: `ART_TYRE_${kind.toUpperCase()}_${compound.toUpperCase()}`,
      slot: 'tyre',
      anchor: 'selector',
      subject_id: `tyre-${kind}-${compound}`,
      rarity: null,
      category: 'icon',
      file: `selectors/tyre-${kind}-${compound}`,
      sport: kind,
      placeholder: false,
      transparent: true,
      compound,
      content_id: TYRE_CONTENT[kind][compound],
      svg: tyreIcon(kind, compound),
    });
  }
}
for (const kind of ['aero-low', 'aero-mid', 'aero-high', 'risk-calm', 'risk-bold', 'risk-reckless']) {
  add({
    asset_id: `ART_SETUP_CAR_${kind.toUpperCase().replaceAll('-', '_')}`,
    slot: 'setup',
    anchor: 'selector',
    subject_id: `setup-car-${kind}`,
    rarity: null,
    category: 'icon',
    file: `selectors/setup-car-${kind}`,
    sport: 'car',
    placeholder: false,
    transparent: true,
    svg: setupIcon(kind),
  });
}
const MOTO_PRESET_CONTENT = {
  'preset-speed': 'SPC_MOTO_TAC_005',
  'preset-handling': 'SPC_MOTO_TAC_006',
  'preset-balanced': 'SPC_MOTO_TAC_007',
  'preset-wet': 'SPC_MOTO_TAC_008',
};
for (const kind of ['preset-speed', 'preset-handling', 'preset-balanced', 'preset-wet']) {
  add({
    asset_id: `ART_SETUP_MOTO_${kind.toUpperCase().replaceAll('-', '_')}`,
    slot: 'setup',
    anchor: 'selector',
    subject_id: `setup-moto-${kind}`,
    rarity: null,
    category: 'icon',
    file: `selectors/setup-moto-${kind}`,
    sport: 'moto',
    placeholder: false,
    transparent: true,
    content_id: MOTO_PRESET_CONTENT[kind],
    svg: setupIcon(kind),
  });
}

for (const sportId of ['football', 'basket']) {
  const board = scoreboard(sportId);
  add({
    asset_id: `ART_SCOREBOARD_${sportId.toUpperCase()}`,
    slot: 'scoreboard',
    anchor: 'score-chrome',
    subject_id: `scoreboard-${sportId}`,
    rarity: null,
    category: 'scoreboard',
    file: `chrome/scoreboard-${sportId}`,
    sport: sportId,
    placeholder: false,
    transparent: true,
    guide: { windows: board.windows },
    svg: board.svg,
  });
}
for (const sportId of ['car', 'moto']) {
  const tower = timingTower(sportId);
  add({
    asset_id: `ART_TOWER_${sportId.toUpperCase()}`,
    slot: 'timing-tower',
    anchor: 'tower',
    subject_id: `tower-${sportId}`,
    rarity: null,
    category: 'tower',
    file: `chrome/tower-${sportId}`,
    sport: sportId,
    placeholder: false,
    transparent: true,
    guide: { windows: tower.windows },
    svg: tower.svg,
  });
}
add({
  asset_id: 'ART_GANTRY_UNLIT',
  slot: 'gantry',
  anchor: 'start-lights',
  subject_id: 'gantry-unlit',
  rarity: null,
  category: 'gantry',
  file: 'chrome/gantry-unlit',
  sport: 'car',
  placeholder: false,
  transparent: true,
  svg: gantry(false),
});
add({
  asset_id: 'ART_GANTRY_LIT',
  slot: 'gantry',
  anchor: 'start-lights',
  subject_id: 'gantry-lit',
  rarity: null,
  category: 'gantry',
  file: 'chrome/gantry-lit',
  sport: 'car',
  placeholder: false,
  transparent: true,
  svg: gantry(true),
});
const steps = podium();
add({
  asset_id: 'ART_PODIUM',
  slot: 'podium',
  anchor: 'podium-steps',
  subject_id: 'podium',
  rarity: null,
  category: 'podium',
  file: 'results/podium',
  sport: null,
  placeholder: false,
  transparent: true,
  guide: { sockets: steps.sockets },
  svg: steps.svg,
});
add({
  asset_id: 'ART_HUB_EXTERIOR',
  slot: 'hub',
  anchor: 'hub-exterior',
  subject_id: 'hub-exterior',
  rarity: null,
  category: 'hub',
  file: 'hub/exterior',
  sport: null,
  placeholder: false,
  transparent: false,
  guide: {
    canvas: { w: 1672, h: 941 },
    gates: HUB_GATES.map((gate) => ({
      sport: gate.id,
      x: gate.x / 1672,
      y: gate.y / 941,
      w: gate.w / 1672,
      h: gate.h / 941,
    })),
  },
  svg: hubExterior(),
});
add({
  asset_id: 'ART_HUB_INTERIOR',
  slot: 'hub',
  anchor: 'hub-interior',
  subject_id: 'hub-interior',
  rarity: null,
  category: 'hub',
  file: 'hub/interior',
  sport: null,
  placeholder: false,
  transparent: false,
  guide: {
    doors: [360, 690, 1020, 1350].map((x, index) => ({
      sport: ['football', 'basket', 'car', 'moto'][index],
      x: (x - 90) / 1672,
      y: 180 / 941,
      w: 180 / 1672,
      h: 360 / 941,
    })),
  },
  svg: hubInterior(),
});
for (const sportId of ['football', 'basket', 'car', 'moto']) {
  add({
    asset_id: `ART_PORTAL_${sportId.toUpperCase()}`,
    slot: 'portal',
    anchor: 'hub-gate',
    subject_id: `portal-${sportId}`,
    rarity: null,
    category: 'portal',
    file: `hub/portal-${sportId}`,
    sport: sportId,
    placeholder: false,
    transparent: true,
    svg: portal(sportId),
  });
}

async function raster(svg, width, quality, budget) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'rgba(0,0,0,0)',
    font: { loadSystemFonts: false },
  });
  const png = resvg.render().asPng();
  let q = quality;
  let webp = await sharp(png).webp({ quality: q, alphaQuality: 100, effort: 4 }).toBuffer();
  while (webp.length > budget && q > 52) {
    q -= 8;
    webp = await sharp(png).webp({ quality: q, alphaQuality: 100, effort: 4 }).toBuffer();
  }
  const meta = await sharp(webp).metadata();
  return { webp, width: meta.width, height: meta.height, quality: q };
}

const assets = [];
let index = 0;
for (const job of jobs) {
  index += 1;
  if (/<text[\s>]|<tspan|<textPath|<foreignObject|font-family/i.test(job.svg)) {
    throw new Error(`${job.asset_id} bakes text into the SVG`);
  }
  const rasterSpec = RASTER[job.category];
  const budget = BUDGETS[job.category];
  const { webp, width, height, quality } = await raster(job.svg, rasterSpec.width, rasterSpec.quality, budget);
  const svgRel = `art-src/sport/svg/${job.file}.svg`;
  const webpRel = `web/assets/sport/${job.file}.webp`;
  mkdirSync(dirname(join(root, svgRel)), { recursive: true });
  mkdirSync(dirname(join(root, webpRel)), { recursive: true });
  writeFileSync(join(root, svgRel), job.svg);
  writeFileSync(join(root, webpRel), webp);
  const entry = {
    asset_id: job.asset_id,
    slot: job.slot,
    path: webpRel,
    anchor: job.anchor,
    subject_id: job.subject_id,
    rarity: job.rarity,
    status: 'CONCEPT',
    review_status: 'GENERATED_REVIEW',
    type: job.slot,
    owner: 'sport-art',
    source_path: svgRel,
    bytes: webp.length,
    width,
    height,
    category: job.category,
    sport: job.sport,
    placeholder: job.placeholder,
    transparent: job.transparent,
  };
  for (const key of ['parody_name', 'role', 'team', 'pose', 'lean', 'ip_review', 'drop_in', 'palette', 'motif', 'note', 'compound', 'guide', 'content_slot', 'content_id']) {
    if (job[key] !== undefined) entry[key] = job[key];
  }
  entry.raster_quality = quality;
  assets.push(entry);
  if (index % 25 === 0 || index === jobs.length) {
    process.stdout.write(`raster ${index}/${jobs.length} ${job.asset_id} ${webp.length}b q${quality}\n`);
  }
}

const counts = {};
let bytes = 0;
for (const asset of assets) {
  counts[asset.category] = (counts[asset.category] || 0) + 1;
  bytes += asset.bytes;
}

const manifest = {
  manifest_version: 1,
  project: 'Comedy Fantasy Card Game',
  scope: 'sport-complex-art',
  stream: 'prod/f-sport-art',
  status: 'GENERATED_REVIEW',
  productionReady: false,
  parody_source: PARODY_SOURCE,
  layering: {
    card: ['card-interior', 'portrait-slot', 'card-frame', 'team-colour'],
    token: ['team-colour', 'portrait-slot', 'token-frame'],
    prematch: ['prematch', 'layout-chrome'],
    hub: ['hub', 'portal'],
  },
  card_windows: {
    source: { w: CARD.w, h: CARD.h },
    portrait: norm(CARD.portrait, CARD.w, CARD.h),
    name: norm(CARD.name, CARD.w, CARD.h),
    rules: norm(CARD.rules, CARD.w, CARD.h),
    badge: norm(CARD.badge, CARD.w, CARD.h),
    stats_by_sport: Object.fromEntries(Object.values(SPORT).map((sport) => [
      sport.id,
      {
        keys: sport.stats,
        windows: statWindows(sport.stats.length).map((box) => norm(box, CARD.w, CARD.h)),
      },
    ])),
  },
  counts,
  bytes,
  assets,
};

mkdirSync(join(root, 'web/manifests'), { recursive: true });
writeFileSync(join(root, 'web/manifests/sport.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeSlots(manifest);
process.stdout.write(`done ${assets.length} assets ${bytes} bytes\n`);

function writeSlots(doc) {
  const lines = [];
  lines.push('# Sport Complex art slots');
  lines.push('');
  lines.push('Agent F fragment for the sport web stream. This file is the bind index. The machine-readable copy is `web/manifests/sport.json`.');
  lines.push('');
  lines.push('Every entry has `review_status: GENERATED_REVIEW`. The locked asset schema only accepts `CONCEPT`, `PROTOTYPE`, `QA_PASSED`, `PRODUCTION_READY`, and `INTEGRATED`, so the schema field `status` is `CONCEPT`. The fragment itself is not production ready. Do not read `CONCEPT` as owner approval.');
  lines.push('');
  lines.push(`Parody names follow \`${PARODY_SOURCE.ref}\` @ \`${PARODY_SOURCE.commit}\`. They stay \`PROPOSED\`. Real identities are not stored in this art pack.`);
  lines.push('');
  lines.push('## How to bind');
  lines.push('');
  lines.push('- Do not edit `web/assets-manifest.json` in this stream. Integration merges `web/manifests/sport.json` later.');
  lines.push('- Keep `asset_id`, `slot`, `anchor`, and `subject_id` stable. Replace `path` when a file changes.');
  lines.push('- Participant cards and vehicles are silhouette slots (`placeholder: true`, slot `portrait-slot`). The Owner drops a portrait in by replacing that WebP. Do not bake names, stats, or the portrait into the frame.');
  lines.push('- Sport content names each drop-in `content_slot`. Athletes, coaches, and helmet busts use `{cardId}_PORTRAIT`. Machines use `{cardId}_BODY`. Bind those strings to this fragment. The layer name stays `portrait-slot`.');
  lines.push('- Tactic diagrams and tyre icons set `content_id` to the matching `SPC_*_TAC_*` card. Car aero and risk selectors, and `SPC_CAR_TAC_006` (pit window), have no content card of their own.');
  lines.push('- Card stack, bottom to top: `card-interior`, `portrait-slot` inside the portrait window, `card-frame`, `team-colour` badge at `card_windows.badge`.');
  lines.push('- Token stack, bottom to top: `team-colour`, `portrait-slot`, `token-frame`. The frame hole is `guide.holeRadius` of the token width.');
  lines.push('- Prematch stack: `prematch` background, then transparent `layout-chrome`. Region boxes are in `guide.regions` on the chrome entry, in that image\'s own pixel space before normalization... they are absolute design pixels on the 1672×941 chrome.');
  lines.push('- Track playback uses `track-top` `guide.centerline` as normalized `[x, y]` pairs, origin top-left, plus `guide.direction` and `guide.start`. `track-side` `guide.elevation` is a lap profile, not a geographic side camera.');
  lines.push('- Formation markers list `{role, x, y}` normalized on the diagram. Goalkeeper is at the bottom. Basket schemes put the basket at the top. Shape language: square defender, circle midfielder, diamond wingback, triangle forward. No letters are painted.');
  lines.push('- Scoreboard and timing-tower windows are normalized rectangles. Code draws every digit.');
  lines.push('- World-map building `MAP_BLD_SPORTS` is untouched.');
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push(`| Category | Count |`);
  lines.push(`| --- | ---: |`);
  for (const [category, count] of Object.entries(doc.counts)) {
    lines.push(`| ${category} | ${count} |`);
  }
  lines.push(`| **total** | **${doc.assets.length}** |`);
  lines.push('');
  lines.push(`Shipped WebP bytes: ${doc.bytes}.`);
  lines.push('');
  lines.push('## Card windows');
  lines.push('');
  lines.push('Normalized to the 1024×1536 frame master. The same ratios apply to the shipped 512×768 WebP.');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(doc.card_windows, null, 2));
  lines.push('```');
  lines.push('');
  const groups = new Map();
  for (const asset of doc.assets) {
    if (!groups.has(asset.category)) groups.set(asset.category, []);
    groups.get(asset.category).push(asset);
  }
  for (const [category, rows] of groups) {
    lines.push(`## ${category}`);
    lines.push('');
    lines.push('| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const row of rows) {
      lines.push(`| ${row.asset_id} | ${row.slot} | ${row.subject_id} | ${row.content_slot ?? ''} | ${row.content_id ?? ''} | ${row.rarity ?? ''} | ${row.parody_name ?? ''} | ${row.path} |`);
    }
    lines.push('');
  }
  lines.push('## Gaps');
  lines.push('');
  lines.push('- Portraits and vehicle paintings are not in this pack. Silhouette slots are the drop-in. The artist notes in `PARODY_NAMES.md` (helmet gags, kit jokes, machine details) are for the Owner\'s drawings.');
  lines.push('- No rarity is assigned to any participant. Frames exist for N, R, Epic, and EX so data can point at one later.');
  lines.push('- Circuits are original ribbons that follow the researched character (long straight, tight harbor, elevation, night streets). They are not tracings.');
  lines.push('- `ART_PITCH_*` and `ART_COURT_*` are shared playback boards. Venue art is the establishing picture, not a second set of markings.');
  lines.push('- Indiana Flavor now has `SPC_BASKET_VEN_004` Flavor Court from the parody sheet. Bowl Arena and Crouton Arena have no home team on that sheet.');
  lines.push('- Accel and Handling are not drawn as measurements.');
  lines.push('- `ip_review: true` on a slot means the parody name is still a close echo. The placeholder stays generic.');
  lines.push('- `SPC_CAR_TAC_006` is a pit-window choice. There is no separate icon. The timing tower is the readout.');
  lines.push('- Car aero and risk chips are selector art. They are not tactic cards.');
  lines.push('');
  mkdirSync(join(root, 'docs/production/f'), { recursive: true });
  writeFileSync(join(root, 'docs/production/f/SPORT_ART_SLOTS.md'), `${lines.join('\n')}\n`);
}
