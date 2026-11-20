import { Canvas, circle, ellipse, n, path, rect, roundRect } from './svg.mjs';
import { COURT, FORMATIONS, SCHEMES } from './catalog.mjs';

const ROLE_SHAPE = {
  GK: 'keeper',
  RWB: 'diamond',
  LWB: 'diamond',
  RB: 'square',
  LB: 'square',
  RCB: 'square',
  LCB: 'square',
  CB: 'square',
  RDM: 'circle',
  LDM: 'circle',
  DM: 'circle',
  RCM: 'circle',
  LCM: 'circle',
  CM: 'circle',
  RM: 'diamond',
  LM: 'diamond',
  AM: 'circle',
  RW: 'triangle',
  LW: 'triangle',
  ST: 'triangle',
  RST: 'triangle',
  LST: 'triangle',
};

function marker(c, x, y, role) {
  const shape = ROLE_SHAPE[role] || 'circle';
  c.add(circle(x, y, 18, '#1A1714', ' opacity="0.25"'));
  if (shape === 'keeper') {
    c.add(circle(x, y, 13, '#F7F4EF'));
    c.add(circle(x, y, 6, '#2F6B45'));
  } else if (shape === 'square') c.add(roundRect(x - 12, y - 12, 24, 24, 4, '#F7F4EF'));
  else if (shape === 'diamond') c.add(path(`M${n(x)},${n(y - 14)} L${n(x + 12)},${n(y)} L${n(x)},${n(y + 14)} L${n(x - 12)},${n(y)} Z`, '#D7EBD0'));
  else if (shape === 'triangle') c.add(path(`M${n(x)},${n(y - 14)} L${n(x + 13)},${n(y + 12)} L${n(x - 13)},${n(y + 12)} Z`, '#F2C98A'));
  else c.add(circle(x, y, 12, '#F7F4EF'));
  c.add(circle(x, y, 20, 'none', ' stroke="#1A1714" stroke-width="3"'));
}

export function formationBoard(formation) {
  const w = 480;
  const h = 640;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, '#143024'));
  const stripes = c.pattern(36, h, `${rect(0, 0, 36, h, '#2F7A48')}${rect(0, 0, 18, h, '#36864F')}`);
  c.add(roundRect(16, 16, w - 32, h - 32, 28, stripes));
  c.add(roundRect(28, 28, w - 56, h - 56, 18, 'none', ' stroke="#F4F7F2" stroke-width="3"'));
  c.add(`<line x1="28" y1="${n(h / 2)}" x2="${n(w - 28)}" y2="${n(h / 2)}" stroke="#F4F7F2" stroke-width="3"/>`);
  c.add(circle(w / 2, h / 2, 46, 'none', ' stroke="#F4F7F2" stroke-width="3"'));
  c.add(rect(w / 2 - 70, 28, 140, 52, 'none', ' stroke="#F4F7F2" stroke-width="3"'));
  c.add(rect(w / 2 - 70, h - 80, 140, 52, 'none', ' stroke="#F4F7F2" stroke-width="3"'));
  const markers = formation.markers.map(([role, mx, my]) => {
    const x = 40 + mx * (w - 80);
    const y = 40 + my * (h - 80);
    marker(c, x, y, role);
    return { role, x: Math.round((x / w) * 1000) / 1000, y: Math.round((y / h) * 1000) / 1000 };
  });
  return { svg: c.svg(), markers };
}

export function schemeBoard(scheme) {
  const w = 480;
  const h = 520;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, '#4A3018'));
  const wood = c.pattern(20, h, `${rect(0, 0, 20, h, '#E2B15A')}${rect(18, 0, 2, h, '#C99645')}`);
  c.add(roundRect(12, 12, w - 24, h - 24, 24, wood));
  c.add(roundRect(28, 28, w - 56, h - 56, 8, 'none', ' stroke="#F7F4EF" stroke-width="3"'));
  c.add(rect(w / 2 - 70, 28, 140, 70, 'none', ' stroke="#F7F4EF" stroke-width="3"'));
  c.add(ellipse(w / 2, 150, 46, 16, 'none', ' stroke="#F7F4EF" stroke-width="4"'));
  for (const zone of scheme.zones || []) {
    const [zx, zy, zr] = zone;
    c.add(ellipse(40 + zx * (w - 80), 36 + zy * (h - 72), zr * w, zr * h * 0.7, '#E07A2F', ' opacity="0.18"'));
  }
  scheme.ghosts.forEach(([gx, gy], index) => {
    const x = 40 + gx * (w - 80);
    const y = 36 + gy * (h - 72);
    const markerPoint = scheme.markers[index];
    if (markerPoint) {
      const mx = 40 + markerPoint[0] * (w - 80);
      const my = 36 + markerPoint[1] * (h - 72);
      c.add(`<line x1="${n(x)}" y1="${n(y)}" x2="${n(mx)}" y2="${n(my)}" stroke="#1A1714" stroke-width="2" stroke-dasharray="5 4" opacity="0.7"/>`);
    }
    c.add(circle(x, y, 11, 'none', ' stroke="#1A1714" stroke-width="3" stroke-dasharray="4 3"'));
  });
  const markers = scheme.markers.map(([mx, my]) => {
    const x = 40 + mx * (w - 80);
    const y = 36 + my * (h - 72);
    c.add(circle(x, y, 14, '#F7F4EF'));
    c.add(circle(x, y, 14, 'none', ' stroke="#1A1714" stroke-width="3"'));
    return { x: Math.round((x / w) * 1000) / 1000, y: Math.round((y / h) * 1000) / 1000 };
  });
  return { svg: c.svg(), markers };
}

function tyre(c, x, y, scale, color, grooves, roundness) {
  c.add(ellipse(x, y, 70 * scale, (46 + roundness) * scale, '#2A241C'));
  c.add(ellipse(x, y, 48 * scale, (30 + roundness * 0.6) * scale, color));
  c.add(ellipse(x, y, 18 * scale, 14 * scale, '#C5CCD3'));
  for (let i = 0; i < grooves; i += 1) {
    const gy = y - 16 * scale + i * 12 * scale;
    c.add(ellipse(x, gy, 34 * scale, 3 * scale, '#1A1714', ' opacity="0.55"'));
  }
}

export function tyreIcon(kind, compound) {
  const c = new Canvas(256, 256);
  const colors = {
    soft: '#F0A03A',
    medium: '#E2B34A',
    hard: '#8E9099',
    inter: '#7EB8B0',
    wet: '#2E5878',
  };
  const grooves = { soft: 0, medium: 1, hard: 2, inter: 3, wet: 4 }[compound];
  tyre(c, 128, 128, 1.15, colors[compound], grooves, kind === 'moto' ? 10 : 0);
  if (compound === 'wet') {
    c.add(path('M70,40 Q90,70 70,100', 'none', ' stroke="#9FE7F0" stroke-width="4" fill="none"'));
    c.add(path('M96,48 Q112,78 96,108', 'none', ' stroke="#9FE7F0" stroke-width="4" fill="none"'));
  }
  return c.svg();
}

export function setupIcon(kind) {
  const c = new Canvas(256, 256);
  const ink = '#F7F4EF';
  const accent = '#E2B34A';
  c.add(circle(128, 128, 108, '#241C28'));
  if (kind === 'aero-low') c.add(path('M48,140 H208 L188,120 H68 Z', ink));
  if (kind === 'aero-mid') c.add(path('M52,150 H204 L176,104 H80 Z', ink));
  if (kind === 'aero-high') c.add(path('M64,164 H192 L150,78 H106 Z', accent));
  if (kind === 'risk-calm') c.add(path('M128,58 L188,84 V140 Q128,196 68,140 V84 Z', '#7EB8B0'));
  if (kind === 'risk-bold') {
    c.add(path('M70,150 L120,70 L150,120 L190,90 L170,170 Z', accent));
  }
  if (kind === 'risk-reckless') {
    c.add(path('M128,48 L148,108 H208 L160,140 L176,204 L128,164 L80,204 L96,140 L48,108 H108 Z', '#C4554A'));
  }
  if (kind === 'preset-speed') c.add(path('M40,128 H150 L120,96 M150,128 L120,160', 'none', ` stroke="${accent}" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"`));
  if (kind === 'preset-handling') c.add(path('M168,60 H110 Q60,60 60,120 Q60,190 130,190 H190', 'none', ` stroke="${ink}" stroke-width="14" fill="none" stroke-linecap="round"`));
  if (kind === 'preset-balanced') {
    c.add(rect(122, 52, 12, 140, ink));
    c.add(rect(78, 78, 100, 10, ink));
    c.add(circle(86, 150, 22, accent));
    c.add(circle(170, 150, 22, accent));
  }
  if (kind === 'preset-wet') {
    c.add(ellipse(128, 120, 54, 62, '#2E5878'));
    c.add(rect(86, 108, 84, 18, '#1A1C1F'));
    c.add(path('M70,40 Q84,70 70,96', 'none', ' stroke="#9FE7F0" stroke-width="6" fill="none"'));
  }
  return c.svg();
}

function wells(c, boxes) {
  return boxes.map((box) => roundRect(box.x, box.y, box.w, box.h, 12, '#000000')).join('');
}

export function scoreboard(sportId) {
  const w = 1400;
  const h = sportId === 'basket' ? 460 : 380;
  const c = new Canvas(w, h);
  const accent = sportId === 'basket' ? '#E07A2F' : '#2F8F55';
  const boxes = sportId === 'basket'
    ? [
      { id: 'home-badge', x: 36, y: 36, w: 120, h: 120 },
      { id: 'home-score', x: 180, y: 40, w: 280, h: 140 },
      { id: 'clock', x: 500, y: 36, w: 400, h: 110 },
      { id: 'away-score', x: 940, y: 40, w: 280, h: 140 },
      { id: 'away-badge', x: 1244, y: 36, w: 120, h: 120 },
      { id: 'period', x: 520, y: 250, w: 360, h: 70 },
      { id: 'fouls', x: 180, y: 250, w: 280, h: 70 },
    ]
    : [
      { id: 'home-badge', x: 40, y: 48, w: 130, h: 130 },
      { id: 'home-score', x: 200, y: 56, w: 300, h: 160 },
      { id: 'clock', x: 540, y: 70, w: 320, h: 130 },
      { id: 'away-score', x: 900, y: 56, w: 300, h: 160 },
      { id: 'away-badge', x: 1230, y: 48, w: 130, h: 130 },
    ];
  const shell = c.linear([[0, '#3A342E'], [0.5, '#C5CCD3'], [1, '#2A241C']], { x1: '0', y1: '0', x2: '0', y2: '1' });
  const mask = c.mask(rect(0, 0, w, h, '#FFFFFF') + wells(c, boxes));
  c.add(roundRect(8, 8, w - 16, h - 16, 28, shell, ` mask="${mask}"`));
  c.add(rect(8, 8, w - 16, 14, accent));
  for (const box of boxes) c.add(roundRect(box.x, box.y, box.w, box.h, 12, 'none', ' stroke="#1A1714" stroke-width="4"'));
  return { svg: c.svg(), windows: boxes.map((box) => ({ ...box, x: box.x / w, y: box.y / h, w: box.w / w, h: box.h / h })) };
}

export function timingTower(sportId) {
  const w = 520;
  const h = 980;
  const c = new Canvas(w, h);
  const accent = sportId === 'moto' ? '#3A6EA5' : '#C4554A';
  const rows = Array.from({ length: 8 }, (_, index) => ({
    id: `row-${index + 1}`,
    x: 36,
    y: 150 + index * 96,
    w: 448,
    h: 78,
  }));
  const shell = c.linear([[0, '#2A3038'], [1, '#12161C']], { x1: '0', y1: '0', x2: '0', y2: '1' });
  const mask = c.mask(rect(0, 0, w, h, '#FFFFFF') + wells(c, rows));
  c.add(roundRect(12, 12, w - 24, h - 24, 24, shell, ` mask="${mask}"`));
  c.add(rect(12, 12, w - 24, 16, accent));
  if (sportId === 'moto') {
    c.add(circle(150, 86, 28, 'none', ' stroke="#F7F4EF" stroke-width="8"'));
    c.add(circle(250, 86, 28, 'none', ' stroke="#F7F4EF" stroke-width="8"'));
  } else {
    c.add(circle(200, 84, 26, 'none', ' stroke="#F7F4EF" stroke-width="8"'));
    c.add(rect(250, 70, 70, 10, '#F7F4EF'));
  }
  for (const row of rows) c.add(roundRect(row.x, row.y, row.w, row.h, 12, 'none', ' stroke="#C5CCD3" stroke-width="3"'));
  return {
    svg: c.svg(),
    windows: rows.map((row) => ({ ...row, x: row.x / w, y: row.y / h, w: row.w / w, h: row.h / h })),
  };
}

export function gantry(lit) {
  const c = new Canvas(640, 280);
  c.add(rect(40, 40, 16, 200, '#C5CCD3'));
  c.add(rect(584, 40, 16, 200, '#C5CCD3'));
  c.add(rect(40, 48, 560, 28, '#2A3038'));
  for (let i = 0; i < 5; i += 1) {
    c.add(circle(140 + i * 90, 150, 28, lit ? '#C4554A' : '#3A342E'));
    c.add(circle(140 + i * 90, 150, 28, 'none', ' stroke="#C5CCD3" stroke-width="4"'));
    if (lit) c.add(circle(132 + i * 90, 142, 8, '#F7F4EF', ' opacity="0.8"'));
  }
  return c.svg();
}

export function podium() {
  const w = 900;
  const h = 520;
  const c = new Canvas(w, h);
  const steps = [
    { id: 'second', x: 60, y: 210, w: 240, h: 250, color: '#C5CCD3' },
    { id: 'first', x: 320, y: 90, w: 260, h: 370, color: '#E2B34A' },
    { id: 'third', x: 600, y: 270, w: 240, h: 190, color: '#C9893A' },
  ];
  for (const step of steps) {
    const fill = c.linear([[0, '#FFFFFF'], [0.45, step.color], [1, '#3A342E']], { x1: '0', y1: '0', x2: '0', y2: '1' });
    c.add(roundRect(step.x, step.y, step.w, step.h, 16, fill));
    c.add(circle(step.x + step.w / 2, step.y + 54, 36, 'none', ' stroke="#1A1714" stroke-width="6" opacity="0.55"'));
  }
  return {
    svg: c.svg(),
    sockets: {
      second: { x: 180 / w, y: 264 / h },
      first: { x: 450 / w, y: 144 / h },
      third: { x: 720 / w, y: 324 / h },
    },
  };
}

export function resultScene(sportId) {
  const w = 1672;
  const h = 941;
  const c = new Canvas(w, h);
  const skies = {
    football: ['#102418', '#1E4A32', '#0C1A12'],
    basket: ['#24180F', '#6A4324', '#140E0A'],
    car: ['#14181E', '#3A2A28', '#0E1014'],
    moto: ['#121820', '#243848', '#0C1014'],
  }[sportId];
  c.add(rect(0, 0, w, h, c.linear(skies.map((color, index) => [index / 2, color]), { x1: '0', y1: '0', x2: '0', y2: '1' })));
  const colors = ['#F2C9A0', '#F7F4EF', '#E2B34A', '#7EB8B0', '#C23B55'];
  for (let i = 0; i < 28; i += 1) {
    c.add(rect(80 + (i * 97) % 1500, 40 + (i * 53) % 280, 10, 16, colors[i % colors.length], ' opacity="0.85"'));
  }
  c.add(roundRect(360, 300, 952, 220, 28, '#2A241C', ' opacity="0.88"'));
  c.add(rect(360, 300, 952, 12, sportId === 'basket' ? '#E07A2F' : sportId === 'moto' ? '#3A6EA5' : sportId === 'car' ? '#C4554A' : '#2F8F55'));
  c.add(roundRect(430, 360, 220, 120, 16, '#00000000', ' stroke="#F7F4EF" stroke-width="4"'));
  c.add(roundRect(1020, 360, 220, 120, 16, 'none', ' stroke="#F7F4EF" stroke-width="4"'));
  c.add(roundRect(700, 350, 270, 140, 16, 'none', ' stroke="#E2B34A" stroke-width="6"'));
  return c.svg();
}

export const COURT_REF = COURT;
export const SCHEME_REF = SCHEMES;
export const FORMATION_REF = FORMATIONS;
