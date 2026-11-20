import { Canvas, circle, ellipse, n, path, rect, roundRect, rrPath } from './svg.mjs';
import { CARD, LEAN, TOKEN, statWindows } from './catalog.mjs';

function metal(c, rarity) {
  if (rarity === 'N') {
    return c.linear([[0, '#C5CCD3'], [0.42, '#F7F8F8'], [1, '#6E747C']], { x1: '0', y1: '0', x2: '1', y2: '1' });
  }
  if (rarity === 'R') {
    return c.linear([[0, '#A56B3C'], [0.38, '#F3D7B0'], [1, '#5C371F']], { x1: '0', y1: '0', x2: '1', y2: '1' });
  }
  if (rarity === 'Epic') {
    return c.linear([[0, '#2A1638'], [0.28, '#E6C98A'], [0.55, '#4A2A5C'], [1, '#C6A15B']], { x1: '0', y1: '0', x2: '0.2', y2: '1' });
  }
  return c.linear(
    [[0, '#F7E7A8'], [0.18, '#9FE7F0'], [0.38, '#F3B6E4'], [0.58, '#F7E7A8'], [0.78, '#B9F0D0'], [1, '#F7E7A8']],
    { x1: '0', y1: '0', x2: '1', y2: '1' },
  );
}

function gem(c, x, y, r, color) {
  const fill = c.radial([[0, '#FFFFFF'], [0.42, color], [1, '#1A1210']], { cx: '35%', cy: '32%', r: '75%' });
  c.add(circle(x, y, r, fill));
  c.add(circle(x - r * 0.28, y - r * 0.32, r * 0.22, '#FFFFFF', ' opacity="0.9"'));
}

function emblem(c, type, x, y, s, light) {
  if (type === 'ball') {
    c.add(circle(x, y, s, '#F7F4EF'));
    c.add(circle(x, y, s, 'none', ` stroke="#2F6B45" stroke-width="${n(Math.max(2, s * 0.1))}"`));
    c.add(path(
      `M${n(x - s)},${n(y)} Q${n(x)},${n(y - s * 0.62)} ${n(x + s)},${n(y)}`,
      'none',
      ` stroke="#2F6B45" stroke-width="${n(Math.max(2, s * 0.1))}"`,
    ));
    c.add(path(
      `M${n(x - s)},${n(y)} Q${n(x)},${n(y + s * 0.62)} ${n(x + s)},${n(y)}`,
      'none',
      ` stroke="#2F6B45" stroke-width="${n(Math.max(2, s * 0.1))}"`,
    ));
    return;
  }
  if (type === 'hoop') {
    c.add(ellipse(x, y + s * 0.15, s * 0.72, s * 0.28, 'none', ` stroke="${light}" stroke-width="${n(s * 0.12)}"`));
    c.add(path(
      `M${n(x - s * 0.45)},${n(y + s * 0.2)} Q${n(x - s * 0.2)},${n(y + s * 0.85)} ${n(x)},${n(y + s * 0.45)} Q${n(x + s * 0.2)},${n(y + s * 0.85)} ${n(x + s * 0.45)},${n(y + s * 0.2)}`,
      'none',
      ` stroke="${light}" stroke-width="${n(s * 0.06)}" fill="none"`,
    ));
    c.add(rect(x - s * 0.16, y - s * 0.85, s * 0.32, s * 0.7, light));
    return;
  }
  if (type === 'wheel') {
    c.add(circle(x, y, s, 'none', ` stroke="${light}" stroke-width="${n(s * 0.14)}"`));
    c.add(circle(x, y, s * 0.28, light));
    for (let i = 0; i < 3; i += 1) {
      const a = (-Math.PI / 2) + i * (Math.PI * 2 / 3);
      c.add(`<line x1="${n(x)}" y1="${n(y)}" x2="${n(x + Math.cos(a) * s * 0.82)}" y2="${n(y + Math.sin(a) * s * 0.82)}" stroke="${light}" stroke-width="${n(s * 0.1)}" stroke-linecap="round"/>`);
    }
    return;
  }
  c.add(ellipse(x, y, s * 0.78, s * 0.9, light));
  c.add(roundRect(x - s * 0.62, y - s * 0.05, s * 1.24, s * 0.42, s * 0.12, '#1A1C1F'));
  c.add(rect(x + s * 0.35, y + s * 0.15, s * 0.28, s * 0.1, '#1A1C1F'));
}

function holesFor(sport) {
  return [CARD.portrait, CARD.name, CARD.rules, ...statWindows(sport.stats.length)];
}

export function cardFrame(sport, rarity) {
  const c = new Canvas(CARD.w, CARD.h);
  const holes = holesFor(sport);
  const mask = c.mask(
    rect(0, 0, CARD.w, CARD.h, '#FFFFFF')
    + holes.map((hole) => roundRect(hole.x, hole.y, hole.w, hole.h, 24, '#000000')).join(''),
  );
  const plate = metal(c, rarity);
  c.add(roundRect(32, 24, 960, 1488, 58, plate, ` mask="${mask}"`));
  const lip = rarity === 'Epic' || rarity === 'EX' ? '#F3E2C2' : '#F7F4EF';
  c.add(`<path d="${rrPath(54, 46, 916, 1444, 48)}" fill="none" stroke="${sport.accent}" stroke-width="16" mask="${mask}"/>`);
  c.add(`<path d="${rrPath(78, 70, 868, 1396, 40)}" fill="none" stroke="${lip}" stroke-width="${rarity === 'EX' ? 8 : 4}" opacity="0.85" mask="${mask}"/>`);
  const rim = rarity === 'N' ? '#5E646C' : '#3A2418';
  for (const hole of holes) {
    c.add(roundRect(hole.x, hole.y, hole.w, hole.h, 24, 'none', ` stroke="${rim}" stroke-width="5"`));
  }
  const gemColor = { N: null, R: '#3E8F9A', Epic: '#E2B34A', EX: '#F2F6FF' }[rarity];
  if (gemColor) {
    const radius = rarity === 'EX' ? 22 : rarity === 'Epic' ? 18 : 13;
    for (const [x, y] of [[96, 88], [928, 88], [96, 1472], [928, 1472]]) gem(c, x, y, radius, gemColor);
  }
  if (rarity === 'Epic' || rarity === 'EX') {
    for (const x of [96, 928]) {
      c.add(path(`M${x},470 L${x + 14},498 L${x},526 L${x - 14},498 Z`, sport.accentSoft));
    }
  }
  if (rarity === 'EX') {
    gem(c, 96, 620, 11, '#9FE7F0');
    gem(c, 928, 620, 11, '#9FE7F0');
  }
  emblem(c, sport.emblem, 512, 104, rarity === 'EX' ? 34 : 28, rarity === 'Epic' ? '#F3E2C2' : '#F7F4EF');
  return c.svg();
}

export function tokenFrame(sport, rarity) {
  const c = new Canvas(TOKEN.w, TOKEN.h);
  const { cx, cy, outer, hole } = TOKEN;
  const mask = c.mask(
    rect(0, 0, TOKEN.w, TOKEN.h, '#FFFFFF') + circle(cx, cy, hole, '#000000'),
  );
  const plate = metal(c, rarity);
  c.add(circle(cx, cy, outer, plate, ` mask="${mask}"`));
  c.add(circle(cx, cy, outer - 18, 'none', ` stroke="${sport.accent}" stroke-width="14"`));
  c.add(circle(cx, cy, hole + 8, 'none', ` stroke="#F7F4EF" stroke-width="5"`));
  const gemColor = { N: null, R: '#3E8F9A', Epic: '#E2B34A', EX: '#F2F6FF' }[rarity];
  const count = { N: 0, R: 4, Epic: 6, EX: 8 }[rarity];
  if (gemColor) {
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
      gem(c, cx + Math.cos(angle) * (outer - 36), cy + Math.sin(angle) * (outer - 36), rarity === 'EX' ? 12 : 9, gemColor);
    }
  }
  emblem(c, sport.emblem, cx, cy + outer - 52, 16, '#F7F4EF');
  return c.svg();
}

export function cardInterior(sport) {
  const c = new Canvas(CARD.w, CARD.h);
  const top = {
    football: ['#1E4A32', '#3E8F55', '#163828'],
    basket: ['#8A5A32', '#E2B15A', '#5C3A22'],
    car: ['#2A3038', '#4A545E', '#1A1E24'],
    moto: ['#1C2830', '#3A5568', '#141A1E'],
  }[sport.id];
  const sky = c.linear([[0, top[0]], [0.55, top[1]], [1, top[2]]], { x1: '0', y1: '0', x2: '0', y2: '1' });
  c.add(roundRect(24, 20, 976, 1496, 48, sky));
  if (sport.id === 'football') {
    const stripes = c.pattern(80, 80, `${rect(0, 0, 80, 80, '#2F7A48')}${rect(0, 0, 40, 80, '#35864F')}`);
    c.add(rect(24, 20, 976, 860, stripes, ' opacity="0.55"'));
  } else if (sport.id === 'basket') {
    const wood = c.pattern(36, 220, `${rect(0, 0, 36, 220, '#E2B15A')}${rect(32, 0, 4, 220, '#C99645')}`);
    c.add(rect(24, 20, 976, 860, wood, ' opacity="0.45"'));
  } else {
    const grain = c.pattern(6, 6, `${rect(0, 0, 6, 6, '#00000000')}${circle(2, 2, 0.7, '#FFFFFF')}`);
    c.add(rect(24, 120, 976, 700, grain, ' opacity="0.06"'));
  }
  const calm = c.linear([[0, '#1A1714'], [1, '#2A241E']], { x1: '0', y1: '0', x2: '0', y2: '1' });
  c.add(rect(48, 860, 928, 620, calm, ' opacity="0.92"'));
  c.add(rect(48, 860, 928, 10, sport.accent));
  return c.svg();
}

function limb(x1, y1, x2, y2, width, color) {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="round"/>`;
}

function blankHead(c, x, y, r, primary, secondary) {
  c.add(circle(x, y, r, primary));
  c.add(circle(x, y, r * 0.72, secondary, ' opacity="0.35"'));
}

function figure(c, pose, primary, secondary, ink) {
  const x = 380;
  const y = 150;
  const skin = secondary;
  if (pose === 'car') return vehicleCar(c, primary, secondary, ink);
  if (pose === 'bike') return vehicleBike(c, primary, secondary, ink);
  if (pose === 'helmet') {
    c.add(ellipse(x, 470, 120, 22, ink, ' opacity="0.25"'));
    c.add(roundRect(x - 90, 300, 180, 150, 36, primary));
    c.add(ellipse(x, 210, 78, 92, primary));
    c.add(roundRect(x - 70, 196, 150, 46, 16, ink));
    c.add(rect(x + 48, 208, 28, 12, secondary));
    c.add(limb(x - 70, 340, x - 130, 430, 28, primary));
    c.add(limb(x + 70, 340, x + 130, 430, 28, primary));
    return;
  }
  if (pose === 'coach') {
    c.add(ellipse(x, 500, 110, 18, ink, ' opacity="0.22"'));
    c.add(roundRect(x - 78, 250, 156, 230, 28, primary));
    c.add(rect(x - 78, 400, 156, 28, secondary));
    blankHead(c, x, 190, 52, skin, primary);
    c.add(limb(x - 60, 280, x - 130, 360, 26, primary));
    c.add(roundRect(x + 70, 300, 70, 92, 8, secondary));
    c.add(rect(x + 78, 312, 54, 68, '#F7F4EF', ' opacity="0.85"'));
    c.add(limb(x - 30, 470, x - 50, 540, 24, ink));
    c.add(limb(x + 30, 470, x + 54, 540, 24, ink));
    return;
  }
  c.add(ellipse(x, 520, 100, 16, ink, ' opacity="0.22"'));
  const tall = pose === 'tall' || pose === 'block' || pose === 'gk';
  const headY = tall ? 150 : 175;
  const bodyY = tall ? 230 : 250;
  const bodyH = tall ? 180 : 160;
  blankHead(c, x, headY, tall ? 48 : 46, skin, primary);
  c.add(roundRect(x - 70, bodyY, 140, bodyH, 30, primary));
  c.add(rect(x - 70, bodyY + bodyH - 36, 140, 22, secondary));
  if (pose === 'gk') {
    c.add(limb(x - 60, bodyY + 30, x - 150, bodyY + 10, 26, primary));
    c.add(limb(x + 60, bodyY + 30, x + 150, bodyY + 10, 26, primary));
    c.add(circle(x - 158, bodyY + 8, 22, secondary));
    c.add(circle(x + 158, bodyY + 8, 22, secondary));
    c.add(limb(x - 30, bodyY + bodyH, x - 70, 540, 26, ink));
    c.add(limb(x + 30, bodyY + bodyH, x + 80, 540, 26, ink));
  } else if (pose === 'run' || pose === 'cut' || pose === 'drift' || pose === 'wingrun') {
    const lean = pose === 'cut' ? -18 : pose === 'drift' ? 14 : -10;
    c.add(limb(x - 20, bodyY + 40, x - 130, bodyY + 90 + lean, 24, primary));
    c.add(limb(x + 30, bodyY + 50, x + 120, bodyY + 20, 24, primary));
    c.add(limb(x - 10, bodyY + bodyH, x - 90, 530, 26, ink));
    c.add(limb(x + 20, bodyY + bodyH, x + 80, 500, 26, ink));
  } else if (pose === 'block' || pose === 'boxout' || pose === 'shield') {
    c.add(limb(x - 55, bodyY + 36, x - 140, bodyY + 80, 28, primary));
    c.add(limb(x + 55, bodyY + 36, x + 140, bodyY + 80, 28, primary));
    c.add(limb(x - 24, bodyY + bodyH, x - 60, 540, 28, ink));
    c.add(limb(x + 24, bodyY + bodyH, x + 64, 540, 28, ink));
  } else if (pose === 'leap' || pose === 'shoot' || pose === 'tall') {
    c.add(limb(x - 20, bodyY + 20, x - 40, bodyY - 70, 24, primary));
    c.add(limb(x + 30, bodyY + 30, x + 90, bodyY - 20, 24, primary));
    c.add(limb(x - 16, bodyY + bodyH, x - 50, 520, 24, ink));
    c.add(limb(x + 20, bodyY + bodyH, x + 40, 500, 24, ink));
    if (pose === 'shoot' || pose === 'dribble') c.add(circle(x + 110, bodyY - 10, 18, secondary));
  } else if (pose === 'dribble') {
    c.add(limb(x - 40, bodyY + 50, x - 120, bodyY + 120, 22, primary));
    c.add(limb(x + 40, bodyY + 70, x + 90, bodyY + 140, 22, primary));
    c.add(circle(x + 108, bodyY + 156, 18, secondary));
    c.add(limb(x - 16, bodyY + bodyH, x - 40, 540, 24, ink));
    c.add(limb(x + 24, bodyY + bodyH, x + 70, 530, 24, ink));
  } else if (pose === 'play' || pose === 'stride') {
    c.add(limb(x - 30, bodyY + 40, x - 120, bodyY + 20, 22, primary));
    c.add(limb(x + 30, bodyY + 60, x + 110, bodyY + 110, 22, primary));
    c.add(limb(x - 12, bodyY + bodyH, x - 50, 540, 24, ink));
    c.add(limb(x + 18, bodyY + bodyH, x + 60, 530, 24, ink));
  } else {
    c.add(limb(x - 40, bodyY + 40, x - 110, bodyY + 110, 24, primary));
    c.add(limb(x + 40, bodyY + 40, x + 110, bodyY + 110, 24, primary));
    c.add(limb(x - 18, bodyY + bodyH, x - 40, 540, 24, ink));
    c.add(limb(x + 18, bodyY + bodyH, x + 44, 540, 24, ink));
  }
}

function vehicleCar(c, primary, secondary, ink) {
  c.add(ellipse(380, 470, 220, 26, ink, ' opacity="0.2"'));
  c.add(roundRect(160, 300, 440, 90, 30, primary));
  c.add(path('M250,300 L310,230 H470 L530,300 Z', secondary));
  c.add(roundRect(300, 246, 70, 40, 8, '#1A1C1F', ' opacity="0.85"'));
  c.add(roundRect(390, 246, 70, 40, 8, '#1A1C1F', ' opacity="0.85"'));
  c.add(rect(168, 312, 28, 14, secondary));
  c.add(rect(575, 286, 16, 36, secondary));
  c.add(rect(548, 286, 54, 12, secondary));
  c.add(circle(250, 400, 42, ink));
  c.add(circle(530, 400, 42, ink));
  c.add(circle(250, 400, 18, secondary));
  c.add(circle(530, 400, 18, secondary));
}

function vehicleBike(c, primary, secondary, ink) {
  c.add(ellipse(380, 500, 200, 20, ink, ' opacity="0.2"'));
  c.add(circle(230, 430, 70, 'none', ` stroke="${ink}" stroke-width="18"`));
  c.add(circle(540, 430, 70, 'none', ` stroke="${ink}" stroke-width="18"`));
  c.add(path('M230,430 L340,430 L400,330 L500,340 L540,430', 'none', ` stroke="${primary}" stroke-width="22" fill="none" stroke-linejoin="round" stroke-linecap="round"`));
  c.add(roundRect(360, 300, 120, 48, 16, secondary));
  c.add(circle(300, 360, 16, ink));
}

export function silhouette(person) {
  const [primary, secondary, ink] = LEAN[person.lean];
  const c = new Canvas(CARD.portrait.w, CARD.portrait.h);
  c.add(ellipse(380, 340, 250, 280, 'none', ` stroke="${secondary}" stroke-width="4" stroke-dasharray="10 8" opacity="0.9"`));
  figure(c, person.pose, primary, secondary, ink);
  return c.svg();
}

function motif(c, type, x, y, s, primary, secondary, accent) {
  const ink = '#241C28';
  if (type === 'meringue') {
    c.add(ellipse(x, y + s * 0.34, s * 0.62, s * 0.22, accent));
    c.add(circle(x, y + s * 0.08, s * 0.4, primary));
    c.add(circle(x, y - s * 0.28, s * 0.28, primary));
    c.add(circle(x, y - s * 0.52, s * 0.14, secondary));
    return;
  }
  if (type === 'cup') {
    c.add(path(`M${n(x - s * 0.4)},${n(y - s * 0.3)} H${n(x + s * 0.4)} L${n(x + s * 0.28)},${n(y + s * 0.45)} H${n(x - s * 0.28)} Z`, primary));
    c.add(ellipse(x, y - s * 0.3, s * 0.4, s * 0.14, secondary));
    c.add(path(`M${n(x + s * 0.4)},${n(y - s * 0.1)} Q${n(x + s * 0.75)},${n(y + s * 0.05)} ${n(x + s * 0.4)},${n(y + s * 0.25)}`, 'none', ` stroke="${accent}" stroke-width="${n(s * 0.1)}" fill="none"`));
    return;
  }
  if (type === 'hardhat') {
    c.add(ellipse(x, y + s * 0.15, s * 0.62, s * 0.4, primary));
    c.add(rect(x - s * 0.7, y + s * 0.15, s * 1.4, s * 0.16, accent));
    c.add(path(`M${n(x - s * 0.2)},${n(y + s * 0.1)} L${n(x)},${n(y - s * 0.45)} L${n(x + s * 0.2)},${n(y + s * 0.1)} Z`, secondary));
    return;
  }
  if (type === 'cleat') {
    c.add(ellipse(x, y + s * 0.1, s * 0.55, s * 0.32, accent));
    c.add(path(`M${n(x - s * 0.2)},${n(y + s * 0.1)} Q${n(x)},${n(y - s * 0.7)} ${n(x + s * 0.35)},${n(y - s * 0.2)}`, 'none', ` stroke="${secondary}" stroke-width="${n(s * 0.16)}" fill="none" stroke-linecap="round"`));
    return;
  }
  if (type === 'cloche') {
    c.add(ellipse(x, y + s * 0.35, s * 0.7, s * 0.16, accent));
    c.add(path(`M${n(x - s * 0.55)},${n(y + s * 0.3)} Q${n(x)},${n(y - s * 0.7)} ${n(x + s * 0.55)},${n(y + s * 0.3)} Z`, primary));
    c.add(circle(x, y - s * 0.28, s * 0.08, secondary));
    return;
  }
  if (type === 'gherkin') {
    c.add(ellipse(x, y, s * 0.32, s * 0.7, primary));
    c.add(circle(x + s * 0.55, y + s * 0.2, s * 0.16, secondary));
    return;
  }
  if (type === 'waffle') {
    c.add(roundRect(x - s * 0.5, y - s * 0.5, s, s, s * 0.12, primary));
    for (let i = -1; i <= 1; i += 1) {
      c.add(lineSafe(x - s * 0.4, y + i * s * 0.18, x + s * 0.4, y + i * s * 0.18, secondary, s * 0.05));
      c.add(lineSafe(x + i * s * 0.18, y - s * 0.4, x + i * s * 0.18, y + s * 0.4, secondary, s * 0.05));
    }
    return;
  }
  if (type === 'nugget') {
    c.add(ellipse(x - s * 0.1, y, s * 0.48, s * 0.36, primary));
    c.add(circle(x + s * 0.28, y - s * 0.2, s * 0.22, secondary));
    c.add(circle(x - s * 0.3, y + s * 0.16, s * 0.1, accent));
    return;
  }
  if (type === 'latte') {
    c.add(path(`M${n(x - s * 0.38)},${n(y - s * 0.2)} H${n(x + s * 0.38)} L${n(x + s * 0.26)},${n(y + s * 0.5)} H${n(x - s * 0.26)} Z`, primary));
    c.add(ellipse(x, y - s * 0.2, s * 0.38, s * 0.14, secondary));
    c.add(path(`M${n(x)},${n(y - s * 0.05)} L${n(x + s * 0.12)},${n(y + s * 0.12)} L${n(x)},${n(y + s * 0.02)} L${n(x - s * 0.12)},${n(y + s * 0.12)} Z`, accent));
    return;
  }
  if (type === 'chili') {
    c.add(path(`M${n(x)},${n(y + s * 0.5)} Q${n(x + s * 0.7)},${n(y)} ${n(x)},${n(y - s * 0.45)} Q${n(x - s * 0.15)},${n(y)} ${n(x)},${n(y + s * 0.5)} Z`, primary));
    c.add(path(`M${n(x)},${n(y - s * 0.45)} Q${n(x + s * 0.2)},${n(y - s * 0.7)} ${n(x + s * 0.05)},${n(y - s * 0.2)}`, 'none', ` stroke="${accent}" stroke-width="${n(s * 0.08)}" fill="none"`));
    return;
  }
  if (type === 'plank') {
    c.add(roundRect(x - s * 0.6, y - s * 0.18, s * 1.2, s * 0.36, 8, primary));
    c.add(circle(x + s * 0.55, y - s * 0.28, s * 0.16, accent));
    c.add(rect(x + s * 0.5, y - s * 0.12, s * 0.1, s * 0.4, secondary));
    return;
  }
  if (type === 'gravy') {
    c.add(path(`M${n(x - s * 0.5)},${n(y - s * 0.1)} H${n(x + s * 0.2)} L${n(x + s * 0.05)},${n(y + s * 0.35)} H${n(x - s * 0.35)} Z`, primary));
    c.add(rect(x + s * 0.15, y - s * 0.02, s * 0.5, s * 0.12, secondary));
    return;
  }
  if (type === 'whistle') {
    c.add(ellipse(x - s * 0.1, y, s * 0.42, s * 0.28, primary));
    c.add(rect(x + s * 0.2, y - s * 0.08, s * 0.4, s * 0.16, accent));
    c.add(circle(x - s * 0.2, y, s * 0.08, secondary));
    return;
  }
  if (type === 'peel') {
    c.add(path(`M${n(x + s * 0.5)},${n(y)} A${n(s * 0.5)},${n(s * 0.5)} 0 1 1 ${n(x - s * 0.1)},${n(y - s * 0.45)}`, 'none', ` stroke="${accent}" stroke-width="${n(s * 0.16)}" fill="none" stroke-linecap="round"`));
    c.add(circle(x - s * 0.05, y + s * 0.05, s * 0.16, secondary));
    return;
  }
  if (type === 'fork') {
    c.add(rect(x - s * 0.06, y - s * 0.1, s * 0.12, s * 0.7, secondary));
    for (let i = -1; i <= 1; i += 1) c.add(rect(x + i * s * 0.18 - s * 0.04, y - s * 0.55, s * 0.08, s * 0.4, primary));
    return;
  }
  if (type === 'spoon') {
    c.add(ellipse(x, y - s * 0.25, s * 0.32, s * 0.42, primary));
    c.add(rect(x - s * 0.06, y, s * 0.12, s * 0.6, secondary));
    return;
  }
  if (type === 'moo') {
    c.add(ellipse(x, y + s * 0.1, s * 0.5, s * 0.36, primary));
    c.add(circle(x - s * 0.18, y + s * 0.05, s * 0.08, secondary));
    c.add(circle(x + s * 0.16, y + s * 0.12, s * 0.07, secondary));
    c.add(ellipse(x, y - s * 0.55, s * 0.28, s * 0.16, accent));
    return;
  }
  if (type === 'twist') {
    c.add(path(`M${n(x - s * 0.5)},${n(y)} Q${n(x)},${n(y - s * 0.7)} ${n(x + s * 0.5)},${n(y)} Q${n(x)},${n(y + s * 0.7)} ${n(x - s * 0.5)},${n(y)}`, 'none', ` stroke="${primary}" stroke-width="${n(s * 0.16)}" fill="none"`));
    return;
  }
  if (type === 'berry') {
    c.add(circle(x, y, s * 0.36, primary));
    c.add(circle(x - s * 0.28, y + s * 0.12, s * 0.22, primary));
    c.add(circle(x + s * 0.26, y + s * 0.14, s * 0.2, primary));
    c.add(circle(x, y - s * 0.05, s * 0.06, accent));
    c.add(circle(x - s * 0.16, y + s * 0.1, s * 0.05, accent));
    return;
  }
  if (type === 'biscuit') {
    c.add(circle(x, y, s * 0.48, primary));
    c.add(rect(x - s * 0.08, y - s * 0.7, s * 0.16, s * 1.4, secondary));
    return;
  }
  if (type === 'piston') {
    c.add(rect(x - s * 0.16, y - s * 0.55, s * 0.32, s * 0.9, secondary));
    c.add(ellipse(x, y + s * 0.15, s * 0.22, s * 0.5, primary));
    return;
  }
  if (type === 'wing') {
    c.add(roundRect(x - s * 0.22, y - s * 0.22, s * 0.44, s * 0.44, 6, primary));
    c.add(path(`M${n(x - s * 0.2)},${n(y)} Q${n(x - s * 0.7)},${n(y - s * 0.4)} ${n(x - s * 0.15)},${n(y - s * 0.15)}`, secondary));
    c.add(path(`M${n(x + s * 0.2)},${n(y)} Q${n(x + s * 0.7)},${n(y - s * 0.4)} ${n(x + s * 0.15)},${n(y - s * 0.15)}`, secondary));
    return;
  }
  if (type === 'coconut') {
    c.add(circle(x, y + s * 0.05, s * 0.4, primary));
    c.add(path(`M${n(x - s * 0.6)},${n(y + s * 0.45)} Q${n(x)},${n(y + s * 0.15)} ${n(x + s * 0.6)},${n(y + s * 0.45)}`, 'none', ` stroke="${accent}" stroke-width="${n(s * 0.1)}" fill="none"`));
    return;
  }
  if (type === 'dumpling') {
    c.add(path(`M${n(x - s * 0.55)},${n(y + s * 0.1)} Q${n(x)},${n(y - s * 0.7)} ${n(x + s * 0.55)},${n(y + s * 0.1)} Z`, primary));
    c.add(path(`M${n(x - s * 0.3)},${n(y + s * 0.02)} Q${n(x)},${n(y + s * 0.2)} ${n(x + s * 0.3)},${n(y + s * 0.02)}`, 'none', ` stroke="${accent}" stroke-width="${n(s * 0.06)}" fill="none"`));
    return;
  }
  if (type === 'duck') {
    c.add(ellipse(x, y + s * 0.1, s * 0.46, s * 0.32, primary));
    c.add(circle(x + s * 0.28, y - s * 0.22, s * 0.22, primary));
    c.add(path(`M${n(x + s * 0.42)},${n(y - s * 0.18)} L${n(x + s * 0.7)},${n(y - s * 0.08)} L${n(x + s * 0.4)},${n(y - s * 0.02)} Z`, secondary));
    return;
  }
  if (type === 'petal' || type === 'blossom' || type === 'bloom') {
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      c.add(ellipse(x + Math.cos(a) * s * 0.28, y + Math.sin(a) * s * 0.28, s * 0.2, s * 0.32, primary, ` transform="rotate(${n((a * 180) / Math.PI)} ${n(x + Math.cos(a) * s * 0.28)} ${n(y + Math.sin(a) * s * 0.28)})"`));
    }
    c.add(circle(x, y, s * 0.14, accent));
    return;
  }
  if (type === 'anvil') {
    c.add(path(`M${n(x - s * 0.6)},${n(y - s * 0.1)} H${n(x + s * 0.45)} L${n(x + s * 0.2)},${n(y + s * 0.2)} H${n(x - s * 0.35)} Z`, primary));
    c.add(rect(x - s * 0.12, y + s * 0.2, s * 0.24, s * 0.35, secondary));
    return;
  }
  if (type === 'note') {
    c.add(ellipse(x - s * 0.12, y + s * 0.28, s * 0.28, s * 0.2, primary));
    c.add(rect(x + s * 0.1, y - s * 0.55, s * 0.1, s * 0.85, secondary));
    return;
  }
  if (type === 'slider' || type === 'lean') {
    c.add(ellipse(x, y + s * 0.15, s * 0.5, s * 0.28, primary));
    c.add(path(`M${n(x - s * 0.2)},${n(y + s * 0.1)} Q${n(x + s * 0.1)},${n(y - s * 0.6)} ${n(x + s * 0.45)},${n(y - s * 0.2)}`, 'none', ` stroke="${secondary}" stroke-width="${n(s * 0.12)}" fill="none" stroke-linecap="round"`));
    return;
  }
  if (type === 'visor') {
    c.add(circle(x, y + s * 0.1, s * 0.4, primary));
    c.add(path(`M${n(x - s * 0.45)},${n(y - s * 0.2)} Q${n(x)},${n(y - s * 0.55)} ${n(x + s * 0.5)},${n(y - s * 0.05)}`, 'none', ` stroke="${accent}" stroke-width="${n(s * 0.1)}" fill="none"`));
    return;
  }
  if (type === 'fairing') {
    c.add(ellipse(x, y, s * 0.28, s * 0.62, primary));
    c.add(path(`M${n(x - s * 0.5)},${n(y - s * 0.1)} Q${n(x)},${n(y - s * 0.5)} ${n(x + s * 0.2)},${n(y)}`, secondary));
    return;
  }
  if (type === 'trail') {
    c.add(roundRect(x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8, 8, primary));
    c.add(path(`M${n(x - s * 0.2)},${n(y + s * 0.2)} Q${n(x)},${n(y - s * 0.3)} ${n(x + s * 0.25)},${n(y)}`, 'none', ` stroke="${accent}" stroke-width="${n(s * 0.08)}" fill="none"`));
    return;
  }
  c.add(circle(x, y, s * 0.4, primary));
  c.add(circle(x, y, s * 0.16, accent));
}

function lineSafe(x1, y1, x2, y2, stroke, width) {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(width)}" stroke-linecap="round"/>`;
}

export function teamBadge(team) {
  const c = new Canvas(512, 512);
  const { primary, secondary, accent } = team.palette;
  const disc = c.radial([[0, secondary], [0.72, primary], [1, accent]], { cx: '50%', cy: '42%', r: '68%' });
  c.add(circle(256, 256, 228, disc));
  c.add(circle(256, 256, 228, 'none', ` stroke="${accent}" stroke-width="16"`));
  c.add(circle(256, 256, 168, '#FBF6EA'));
  motif(c, team.motif, 256, 256, 120, primary, secondary, accent);
  return c.svg();
}

export { holesFor };
