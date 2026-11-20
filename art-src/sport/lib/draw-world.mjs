import { Canvas, circle, ellipse, n, path, rect, roundRect, sampleClosed, shoelace, smoothClosed } from './svg.mjs';
import { COURT, PITCH } from './catalog.mjs';

function skyPaint(c, stops) {
  const list = stops.map((color, index) => [index / (stops.length - 1), color]);
  return c.linear(list, { x1: '0', y1: '0', x2: '0', y2: '1' });
}

function seats(c, color, alt) {
  return c.pattern(10, 7, `${rect(0, 0, 10, 7, color)}${rect(1, 1, 7, 4, alt, ' opacity="0.85"')}`);
}

function bowl(c, cx, cy, rx, ry, bowlColor, seatColor, alt) {
  c.add(ellipse(cx, cy + ry * 0.08, rx * 1.05, ry * 0.28, '#000000', ' opacity="0.18"'));
  const shell = c.linear([[0, '#FFFFFF'], [0.35, bowlColor], [1, '#2A241C']], { x1: '0', y1: '0', x2: '0', y2: '1' });
  c.add(ellipse(cx, cy, rx, ry, shell));
  const ring = c.mask(
    ellipse(cx, cy, rx * 0.92, ry * 0.9, '#FFFFFF')
    + ellipse(cx, cy + ry * 0.08, rx * 0.58, ry * 0.48, '#000000'),
  );
  c.add(rect(cx - rx, cy - ry, rx * 2, ry * 2, seats(c, seatColor, alt), ` mask="${ring}"`));
}

function grassOval(c, cx, cy, rx, ry) {
  const stripes = c.pattern(28, 28, `${rect(0, 0, 28, 28, '#2F7A48')}${rect(0, 0, 14, 28, '#3C8C55')}`);
  c.add(ellipse(cx, cy, rx, ry, stripes));
  c.add(ellipse(cx, cy, rx * 0.18, ry * 0.18, 'none', ' stroke="#F7F4EF" stroke-width="2" opacity="0.8"'));
  c.add(`<line x1="${n(cx - rx)}" y1="${n(cy)}" x2="${n(cx + rx)}" y2="${n(cy)}" stroke="#F7F4EF" stroke-width="2" opacity="0.75"/>`);
}

function courtOval(c, cx, cy, rx, ry) {
  const wood = c.pattern(18, 80, `${rect(0, 0, 18, 80, '#E2B15A')}${rect(16, 0, 2, 80, '#C99645')}`);
  c.add(ellipse(cx, cy, rx, ry, wood));
  c.add(ellipse(cx, cy, rx * 0.22, ry * 0.22, 'none', ' stroke="#F7F4EF" stroke-width="2"'));
}

function lights(c, cx, y, spread, night) {
  for (const side of [-1, 1]) {
    const x = cx + side * spread;
    c.add(rect(x - 4, y, 8, 70, '#2A241C'));
    c.add(roundRect(x - 28, y - 16, 56, 18, 4, night ? '#F7E7A8' : '#F4F1EA'));
    if (night) c.add(ellipse(x, y + 40, 50, 90, '#F7E7A8', ' opacity="0.13"'));
  }
}

function roofOf(c, kind, cx, cy, rx, ry, trim, bowlColor) {
  if (kind === 'punch') {
    c.add(ellipse(cx, cy - ry * 0.55, rx * 0.7, ry * 0.45, trim, ' opacity="0.95"'));
    c.add(ellipse(cx, cy - ry * 0.62, rx * 0.42, ry * 0.22, '#F7F1E6'));
    for (let i = -2; i <= 2; i += 1) {
      c.add(ellipse(cx + i * rx * 0.22, cy - ry * 0.15, 18, 28, '#F3A35A', ' opacity="0.9"'));
    }
    return;
  }
  if (kind === 'pasta') {
    for (let i = -3; i <= 3; i += 1) {
      const x = cx + i * rx * 0.2;
      c.add(roundRect(x - 16, cy - ry * 1.05, 32, ry * 0.7, 12, i % 2 ? trim : '#F3E6C4'));
      c.add(ellipse(x, cy - ry * 1.05, 16, 10, '#F7F1E6'));
    }
    return;
  }
  if (kind === 'teacup') {
    c.add(path(
      `M${n(cx - rx * 0.85)},${n(cy - ry * 0.15)} Q${n(cx)},${n(cy - ry * 1.35)} ${n(cx + rx * 0.85)},${n(cy - ry * 0.15)} Z`,
      '#F7F4EF',
    ));
    c.add(ellipse(cx, cy - ry * 0.2, rx * 0.86, ry * 0.16, trim, ' opacity="0.35"'));
    c.add(ellipse(cx + rx * 0.15, cy - ry * 0.85, 26, 14, '#F7FBFD', ' opacity="0.8"'));
    c.add(ellipse(cx - rx * 0.05, cy - ry * 1.05, 34, 16, '#F7FBFD', ' opacity="0.55"'));
    return;
  }
  if (kind === 'parlour') {
    c.add(path(`M${n(cx - rx * 0.9)},${n(cy - ry * 0.2)} L${n(cx - rx * 0.45)},${n(cy - ry * 0.85)} L${n(cx)},${n(cy - ry * 0.25)} L${n(cx + rx * 0.45)},${n(cy - ry * 0.9)} L${n(cx + rx * 0.9)},${n(cy - ry * 0.2)} Z`, bowlColor));
    c.add(rect(cx + rx * 0.2, cy - ry * 1.15, 18, ry * 0.4, '#5C4E6A'));
    c.add(ellipse(cx + rx * 0.29, cy - ry * 1.2, 16, 10, '#F7F4EF', ' opacity="0.7"'));
    for (let i = 0; i < 5; i += 1) {
      c.add(rect(cx - rx * 0.7 + i * rx * 0.28, cy - ry * 0.05, rx * 0.18, ry * 0.22, i % 2 ? '#E7A3B8' : '#C7B4D6', ' opacity="0.9"'));
    }
    return;
  }
  if (kind === 'jars') {
    for (const side of [-1, 1]) {
      const x = cx + side * rx * 0.72;
      c.add(roundRect(x - 22, cy - ry * 0.95, 44, ry * 0.7, 16, '#E2B34A', ' opacity="0.95"'));
      c.add(rect(x - 26, cy - ry * 0.98, 52, 12, trim));
      c.add(ellipse(x, cy - ry * 0.2, 34, 10, '#6B8F3A'));
    }
    c.add(ellipse(cx, cy - ry * 0.35, rx * 0.4, ry * 0.12, '#6B8F3A', ' opacity="0.35"'));
    return;
  }
  if (kind === 'cheese') {
    c.add(path(`M${n(cx - rx)},${n(cy)} L${n(cx)},${n(cy - ry * 1.25)} L${n(cx + rx * 0.15)},${n(cy - ry * 0.1)} Z`, '#F0D78A'));
    c.add(path(`M${n(cx)},${n(cy - ry * 1.25)} L${n(cx + rx)},${n(cy)} L${n(cx + rx * 0.15)},${n(cy - ry * 0.1)} Z`, '#E2A23A'));
    c.add(circle(cx - rx * 0.35, cy - ry * 0.45, 16, '#C47B3A', ' opacity="0.8"'));
    c.add(circle(cx + rx * 0.45, cy - ry * 0.28, 22, '#C47B3A', ' opacity="0.75"'));
    c.add(circle(cx + rx * 0.2, cy - ry * 0.7, 12, '#F7F1E6', ' opacity="0.8"'));
    return;
  }
  if (kind === 'cereal') {
    c.add(ellipse(cx, cy + ry * 0.05, rx * 1.05, ry * 0.38, '#F7F1E8'));
    c.add(ellipse(cx, cy - ry * 0.02, rx * 0.72, ry * 0.22, '#F4F7FB', ' opacity="0.92"'));
    c.add(path(`M${n(cx + rx * 0.7)},${n(cy - ry * 0.1)} Q${n(cx + rx * 1.15)},${n(cy - ry * 0.4)} ${n(cx + rx * 0.95)},${n(cy + ry * 0.35)}`, 'none', ` stroke="${trim}" stroke-width="14" fill="none" stroke-linecap="round"`));
    return;
  }
  if (kind === 'crouton') {
    for (let row = 0; row < 2; row += 1) {
      for (let col = -2; col <= 2; col += 1) {
        c.add(roundRect(cx + col * rx * 0.28 - 28, cy - ry * (0.55 + row * 0.38), 56, 48, 6, row ? '#E2C27A' : '#C9893A'));
        c.add(circle(cx + col * rx * 0.28 + 8, cy - ry * (0.4 + row * 0.38), 4, '#3E6B45'));
      }
    }
    return;
  }
  if (kind === 'awning') {
    for (let i = -3; i <= 3; i += 1) {
      const color = i % 2 ? '#F0A03A' : '#B7D36A';
      c.add(path(
        `M${n(cx + i * rx * 0.22 - rx * 0.1)},${n(cy - ry * 0.15)} L${n(cx + i * rx * 0.22)},${n(cy - ry * 0.7)} L${n(cx + i * rx * 0.22 + rx * 0.1)},${n(cy - ry * 0.15)} Z`,
        color,
      ));
    }
    return;
  }
  c.add(path(
    `M${n(cx - rx * 0.95)},${n(cy - ry * 0.05)} L${n(cx - rx * 0.95)},${n(cy - ry * 0.85)} Q${n(cx)},${n(cy - ry * 1.35)} ${n(cx + rx * 0.95)},${n(cy - ry * 0.85)} L${n(cx + rx * 0.95)},${n(cy - ry * 0.05)} Z`,
    '#E7F2EF',
    ' opacity="0.55"',
  ));
  for (let i = -2; i <= 2; i += 1) {
    c.add(rect(cx + i * rx * 0.28, cy - ry * 0.8, 8, ry * 0.7, '#3E6B45', ' opacity="0.8"'));
  }
}

export function venueScene(venue) {
  const w = 1672;
  const h = 941;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, skyPaint(c, venue.sky)));
  c.add(ellipse(w * 0.78, h * 0.22, 70, 70, venue.night ? '#F7F1E6' : '#FFF6E0', ` opacity="${venue.night ? 0.9 : 0.85}"`));
  c.add(ellipse(180, h * 0.72, 420, 50, '#000000', ' opacity="0.06"'));
  c.add(ellipse(1490, h * 0.74, 360, 40, '#000000', ' opacity="0.05"'));
  const cx = 836;
  const cy = 470;
  bowl(c, cx, cy + 40, 560, 250, venue.bowl, venue.seat, venue.trim);
  if (venue.sport === 'football') grassOval(c, cx, cy + 70, 250, 90);
  else courtOval(c, cx, cy + 70, 230, 86);
  roofOf(c, venue.roof, cx, cy, 520, 250, venue.trim, venue.bowl);
  lights(c, cx, cy - 180, 470, venue.night);
  c.add(rect(0, 760, w, 181, venue.bowl, ' opacity="0.35"'));
  const vignette = c.radial([[0, '#00000000'], [0.7, '#00000000'], [1, '#00000055']], { cx: '50%', cy: '45%', r: '75%' });
  c.add(rect(0, 0, w, h, vignette));
  return c.svg();
}

export function portal(sportId, palette) {
  const c = new Canvas(480, 640);
  const arch = {
    football: ['#2F8F55', '#D7EBD0'],
    basket: ['#E07A2F', '#F8E2CC'],
    car: ['#C4554A', '#F3DDD4'],
    moto: ['#3A6EA5', '#D5E4F2'],
  }[sportId];
  c.add(path('M70,600 L70,220 Q240,40 410,220 L410,600 Z', arch[0]));
  c.add(path('M130,600 L130,260 Q240,120 350,260 L350,600 Z', '#1A1714', ' opacity="0.88"'));
  c.add(rect(60, 560, 360, 28, palette?.accent || arch[1]));
  if (sportId === 'football') c.add(circle(240, 180, 28, '#F7F4EF'));
  if (sportId === 'basket') c.add(ellipse(240, 190, 36, 12, 'none', ' stroke="#F7F4EF" stroke-width="6"'));
  if (sportId === 'car') c.add(circle(240, 180, 26, 'none', ' stroke="#F7F4EF" stroke-width="8"'));
  if (sportId === 'moto') {
    c.add(ellipse(240, 176, 30, 34, '#F7F4EF'));
    c.add(rect(214, 170, 52, 14, '#1A1C1F'));
  }
  return c.svg();
}

export function hubExterior() {
  const w = 1672;
  const h = 941;
  const c = new Canvas(w, h);
  const sky = c.linear([[0, '#241833'], [0.45, '#C46B5A'], [1, '#F2C9A0']], { x1: '0', y1: '0', x2: '0', y2: '1' });
  c.add(rect(0, 0, w, h, sky));
  c.add(circle(1280, 210, 64, '#F7E2C0', ' opacity="0.95"'));
  c.add(ellipse(836, 860, 780, 90, '#C4A484', ' opacity="0.55"'));
  c.add(ellipse(836, 820, 620, 46, '#E6D2B5'));
  const gates = [
    [250, 'football'],
    [640, 'basket'],
    [1030, 'car'],
    [1420, 'moto'],
  ];
  for (const [x, sport] of gates) {
    const colors = {
      football: '#2F8F55',
      basket: '#C9893A',
      car: '#8A4038',
      moto: '#2E5878',
    }[sport];
    c.add(path(`M${x - 110},760 L${x - 110},430 Q${x},250 ${x + 110},430 L${x + 110},760 Z`, colors));
    c.add(path(`M${x - 64},760 L${x - 64},470 Q${x},340 ${x + 64},470 L${x + 64},760 Z`, '#1A1714', ' opacity="0.9"'));
    c.add(rect(x - 120, 730, 240, 18, '#F3E2C2'));
    if (sport === 'football') c.add(circle(x, 330, 16, '#F7F4EF'));
    if (sport === 'basket') c.add(ellipse(x, 334, 20, 8, 'none', ' stroke="#F7F4EF" stroke-width="4"'));
    if (sport === 'car') c.add(circle(x, 330, 14, 'none', ' stroke="#F7F4EF" stroke-width="5"'));
    if (sport === 'moto') {
      c.add(ellipse(x, 326, 14, 16, '#F7F4EF'));
      c.add(rect(x - 10, 324, 20, 6, '#1A1C1F'));
    }
  }
  c.add(ellipse(836, 700, 70, 18, '#7EB8B0', ' opacity="0.8"'));
  c.add(circle(836, 690, 10, '#F7F4EF'));
  for (let i = 0; i < 9; i += 1) {
    const x = 180 + i * 160;
    c.add(path(`M${x},150 L${x + 28},190 L${x + 56},150`, i % 2 ? '#F2C9A0' : '#F7F4EF'));
  }
  const vignette = c.radial([[0, '#00000000'], [0.72, '#00000000'], [1, '#00000066']], { cx: '50%', cy: '55%', r: '72%' });
  c.add(rect(0, 0, w, h, vignette));
  return c.svg();
}

export const HUB_GATES = [
  { id: 'football', x: 250, y: 430, w: 220, h: 330 },
  { id: 'basket', x: 640, y: 430, w: 220, h: 330 },
  { id: 'car', x: 1030, y: 430, w: 220, h: 330 },
  { id: 'moto', x: 1420, y: 430, w: 220, h: 330 },
];

export function hubInterior() {
  const w = 1672;
  const h = 941;
  const c = new Canvas(w, h);
  const wall = c.linear([[0, '#3A2A28'], [1, '#6A5344']], { x1: '0', y1: '0', x2: '0', y2: '1' });
  c.add(rect(0, 0, w, h, wall));
  c.add(path('M0,941 L260,520 L1412,520 L1672,941 Z', '#C4A484'));
  const boards = c.pattern(80, 80, `${rect(0, 0, 80, 80, '#C4A484')}${rect(0, 0, 80, 4, '#A88864')}`);
  c.add(path('M0,941 L260,520 L1412,520 L1672,941 Z', boards));
  const doors = [360, 690, 1020, 1350];
  const colors = ['#2F8F55', '#C9893A', '#8A4038', '#2E5878'];
  doors.forEach((x, index) => {
    c.add(roundRect(x - 90, 180, 180, 360, 16, colors[index]));
    c.add(roundRect(x - 64, 210, 128, 300, 10, '#1A1714', ' opacity="0.88"'));
    c.add(rect(x - 100, 520, 200, 16, '#E7C98A'));
  });
  c.add(rect(0, 0, w, 80, '#2A211C'));
  for (let i = 0; i < 6; i += 1) c.add(rect(120 + i * 260, 0, 16, 200, '#3A2E28'));
  for (const x of [180, 836, 1480]) {
    c.add(ellipse(x, 150, 28, 10, '#F7E7A8', ' opacity="0.9"'));
    c.add(ellipse(x, 210, 70, 40, '#F7E7A8', ' opacity="0.08"'));
  }
  return c.svg();
}

function scaledLoop(track, w, h) {
  return track.points.map((point) => ({ x: (point.x / 100) * w, y: (point.y / 100) * h }));
}

function landmark(c, kind, x, y, night) {
  if (kind === 'cheese') {
    c.add(ellipse(x, y, 70, 36, '#F0D78A'));
    c.add(circle(x - 16, y - 4, 8, '#E2A23A'));
    c.add(circle(x + 18, y + 6, 10, '#E2A23A'));
  } else if (kind === 'monocle') {
    c.add(circle(x, y, 54, 'none', ' stroke="#C6A15B" stroke-width="10"'));
    c.add(circle(x, y, 36, '#7EB8B0', ' opacity="0.85"'));
    c.add(rect(x + 40, y + 28, 40, 8, '#C6A15B'));
  } else if (kind === 'wasabi') {
    c.add(ellipse(x, y + 10, 40, 18, '#F7F1E8'));
    c.add(path(`M${n(x - 10)},${n(y + 6)} Q${n(x)},${n(y - 40)} ${n(x + 16)},${n(y + 4)}`, '#6A8F4E'));
  } else if (kind === 'spoon') {
    c.add(ellipse(x, y - 10, 28, 40, '#C5CCD3'));
    c.add(rect(x - 6, y + 20, 12, 50, '#E4E7F2'));
  } else if (kind === 'noodles') {
    c.add(ellipse(x, y + 16, 60, 22, '#E2C27A'));
    c.add(path(`M${n(x - 30)},${n(y)} Q${n(x)},${n(y - 50)} ${n(x + 30)},${n(y + 4)}`, 'none', ' stroke="#F6E7D4" stroke-width="6" fill="none"'));
    c.add(path(`M${n(x - 16)},${n(y + 8)} Q${n(x + 8)},${n(y - 36)} ${n(x + 24)},${n(y + 10)}`, 'none', ' stroke="#D4726A" stroke-width="5" fill="none"'));
  } else if (kind === 'teapot') {
    c.add(ellipse(x, y + 8, 36, 24, night ? '#E6D2B5' : '#F7F4EF'));
    c.add(rect(x - 8, y - 28, 16, 20, '#C4A484'));
    c.add(path(`M${n(x + 30)},${n(y)} Q${n(x + 58)},${n(y + 8)} ${n(x + 30)},${n(y + 18)}`, 'none', ' stroke="#E6D2B5" stroke-width="6" fill="none"'));
    c.add(circle(x - 10, y - 40, 8, '#F2C84B', ' opacity="0.9"'));
    c.add(circle(x + 16, y - 52, 6, '#E07A3A', ' opacity="0.9"'));
  } else if (kind === 'mushroom') {
    c.add(rect(x - 8, y, 16, 36, '#F7F1E4'));
    c.add(ellipse(x, y, 40, 22, '#C23B55'));
    c.add(circle(x - 12, y - 2, 4, '#F7F1E4'));
  } else if (kind === 'sausage') {
    c.add(ellipse(x, y, 54, 16, '#C46B4A'));
    c.add(circle(x + 20, y + 8, 5, '#E1B43A'));
  } else if (kind === 'pillow') {
    c.add(roundRect(x - 46, y - 28, 92, 56, 18, '#F7F1E8'));
    lineAbs(c, x - 20, y - 10, x + 24, y + 12, '#E6D2B5', 3);
  } else if (kind === 'gate') {
    c.add(rect(x - 40, y - 10, 14, 50, '#6E3B73'));
    c.add(rect(x + 26, y - 10, 14, 50, '#6E3B73'));
    c.add(rect(x - 48, y - 22, 96, 16, '#E2B34A'));
    c.add(path(`M${n(x - 34)},${n(y - 22)} Q${n(x)},${n(y - 58)} ${n(x + 34)},${n(y - 22)}`, 'none', ' stroke="#E2B34A" stroke-width="8" fill="none"'));
  } else if (kind === 'boat') {
    c.add(path(`M${n(x - 40)},${n(y)} Q${n(x)},${n(y + 28)} ${n(x + 40)},${n(y)} Z`, '#7A3E62'));
    c.add(rect(x - 3, y - 36, 6, 36, '#F6E7D4'));
  } else if (kind === 'confetti') {
    for (let i = 0; i < 7; i += 1) {
      const color = ['#E07A3A', '#2F6D62', '#F0D78A', '#F7F4EF'][i % 4];
      c.add(rect(x - 30 + (i * 17) % 70, y - 24 + (i * 11) % 48, 8, 12, color));
    }
  }
}

function lineAbs(c, x1, y1, x2, y2, stroke, width) {
  c.add(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(width)}"/>`);
}

export function trackTop(track) {
  const w = 1280;
  const h = 1280;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, skyPaint(c, track.sky)));
  c.add(rect(0, h * 0.62, w, h * 0.38, track.ground));
  const loop = scaledLoop(track, w, h);
  const d = smoothClosed(loop);
  c.add(path(d, track.infield));
  c.add(`<path d="${d}" fill="none" stroke="${track.runoff}" stroke-width="92" stroke-linejoin="round" stroke-linecap="round"/>`);
  c.add(`<path d="${d}" fill="none" stroke="${track.edge}" stroke-width="64" stroke-linejoin="round" stroke-linecap="round"/>`);
  c.add(`<path d="${d}" fill="none" stroke="${track.asphalt}" stroke-width="48" stroke-linejoin="round" stroke-linecap="round"/>`);
  c.add(`<path d="${d}" fill="none" stroke="${track.edge}" stroke-width="2.5" stroke-dasharray="16 14" stroke-linejoin="round" opacity="0.85"/>`);
  const a = loop[0];
  const b = loop[1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  c.add(`<line x1="${n(a.x - nx * 28)}" y1="${n(a.y - ny * 28)}" x2="${n(a.x + nx * 28)}" y2="${n(a.y + ny * 28)}" stroke="#F7F4EF" stroke-width="8"/>`);
  const cx = loop.reduce((sum, point) => sum + point.x, 0) / loop.length;
  const cy = loop.reduce((sum, point) => sum + point.y, 0) / loop.length;
  landmark(c, track.landmark, cx, cy, track.night);
  if (track.night) {
    for (let i = 0; i < 8; i += 1) {
      const point = loop[i % loop.length];
      c.add(circle(point.x, point.y - 20, 5, '#F2C84B', ' opacity="0.85"'));
    }
  }
  const samples = sampleClosed(loop, 3).map(([x, y]) => [
    Math.round((x / w) * 10000) / 10000,
    Math.round((y / h) * 10000) / 10000,
  ]);
  const direction = shoelace(loop) > 0 ? 'clockwise' : 'counterclockwise';
  return {
    svg: c.svg(),
    guide: {
      centerline: samples,
      start: samples[0],
      direction,
      space: 'normalized-top-left',
    },
  };
}

export function trackSide(track) {
  const w = 1536;
  const h = 432;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, skyPaint(c, track.sky)));
  const count = 48;
  const ridge = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const index = t * (track.elev.length - 1);
    const left = Math.floor(index);
    const right = Math.min(track.elev.length - 1, left + 1);
    const mix = index - left;
    const elev = track.elev[left] * (1 - mix) + track.elev[right] * mix;
    ridge.push([40 + t * (w - 80), h * 0.78 - elev * h * 0.5]);
  }
  let d = `M0,${h} L${n(ridge[0][0])},${n(ridge[0][1])}`;
  for (const [x, y] of ridge) d += ` L${n(x)},${n(y)}`;
  d += ` L${w},${h} Z`;
  c.add(path(d, track.ground));
  const road = ridge.map(([x, y]) => `${n(x)},${n(y - 16)}`).join(' ');
  c.add(`<polyline points="${road}" fill="none" stroke="${track.runoff}" stroke-width="28" stroke-linejoin="round" stroke-linecap="round"/>`);
  c.add(`<polyline points="${road}" fill="none" stroke="${track.asphalt}" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>`);
  landmark(c, track.landmark, w * 0.7, ridge[Math.floor(count * 0.7)][1] - 50, track.night);
  return {
    svg: c.svg(),
    guide: {
      elevation: ridge.map(([x, y]) => [
        Math.round((x / w) * 10000) / 10000,
        Math.round((y / h) * 10000) / 10000,
      ]),
      space: 'normalized-top-left',
      kind: 'lap-profile',
    },
  };
}

export function pitchTop() {
  const { w, h } = PITCH.view;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, '#1E4A32'));
  const stripes = c.pattern(70, h, `${rect(0, 0, 70, h, '#2F7A48')}${rect(0, 0, 35, h, '#36864F')}`);
  const inset = 46;
  const left = inset;
  const top = inset;
  const right = w - inset;
  const bottom = h - inset;
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;
  const stroke = '#F4F7F2';
  const sw = 4;
  c.add(rect(left, top, right - left, bottom - top, stripes));
  const box = (x, y, bw, bh) => c.add(rect(x, y, bw, bh, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  box(left, top, right - left, bottom - top);
  c.add(`<line x1="${n(midX)}" y1="${n(top)}" x2="${n(midX)}" y2="${n(bottom)}" stroke="${stroke}" stroke-width="${sw}"/>`);
  c.add(circle(midX, midY, 91.5, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  c.add(circle(midX, midY, 4, stroke));
  const paDepth = 165;
  const paWidth = 360;
  const gaDepth = 55;
  const gaWidth = 160;
  box(left, midY - paWidth / 2, paDepth, paWidth);
  box(right - paDepth, midY - paWidth / 2, paDepth, paWidth);
  box(left, midY - gaWidth / 2, gaDepth, gaWidth);
  box(right - gaDepth, midY - gaWidth / 2, gaDepth, gaWidth);
  c.add(circle(left + 110, midY, 4, stroke));
  c.add(circle(right - 110, midY, 4, stroke));
  const clipWest = c.clip(rect(left + paDepth, top, 120, bottom - top, '#FFFFFF'));
  c.add(circle(left + 110, midY, 91.5, 'none', ` stroke="${stroke}" stroke-width="${sw}" clip-path="${clipWest}"`));
  const clipEast = c.clip(rect(right - paDepth - 120, top, 120, bottom - top, '#FFFFFF'));
  c.add(circle(right - 110, midY, 91.5, 'none', ` stroke="${stroke}" stroke-width="${sw}" clip-path="${clipEast}"`));
  const fieldClip = c.clip(rect(left, top, right - left, bottom - top, '#FFFFFF'));
  for (const [x, y] of [[left, top], [right, top], [left, bottom], [right, bottom]]) {
    c.add(circle(x, y, 12, 'none', ` stroke="${stroke}" stroke-width="${sw}" clip-path="${fieldClip}"`));
  }
  c.add(rect(left - 26, midY - 36, 26, 72, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  c.add(rect(right, midY - 36, 26, 72, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  return c.svg();
}

export function pitchSide() {
  const { w, h, farLeft, farRight, nearRight, nearLeft } = PITCH.side;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, skyPaint(c, ['#9EC4D4', '#E7F0E4', '#2F6B45'])));
  c.add(rect(0, 180, w, 120, '#6A5348', ' opacity="0.35"'));
  const stand = seats(c, '#C23B55', '#F3E6C4');
  c.add(rect(220, 150, w - 440, 90, stand));
  const trap = `M${farLeft.join(',')} L${farRight.join(',')} L${nearRight.join(',')} L${nearLeft.join(',')} Z`;
  const stripes = c.pattern(40, 40, `${rect(0, 0, 40, 40, '#2F7A48')}${rect(0, 0, 20, 40, '#36864F')}`);
  c.add(path(trap, stripes));
  c.add(path(trap, 'none', ' stroke="#F4F7F2" stroke-width="4"'));
  c.add(`<line x1="${n((farLeft[0] + farRight[0]) / 2)}" y1="${n(farLeft[1])}" x2="${n((nearLeft[0] + nearRight[0]) / 2)}" y2="${n(nearLeft[1])}" stroke="#F4F7F2" stroke-width="3"/>`);
  c.add(rect(70, 300, 18, 80, '#F7F4EF'));
  c.add(rect(1512, 300, 18, 80, '#F7F4EF'));
  return c.svg();
}

export function courtTop() {
  const { w, h } = COURT.view;
  const c = new Canvas(w, h);
  const wood = c.pattern(22, h, `${rect(0, 0, 22, h, '#E2B15A')}${rect(20, 0, 2, h, '#C99645')}`);
  c.add(rect(0, 0, w, h, '#8A5A32'));
  const m = 28;
  c.add(rect(m, m, w - m * 2, h - m * 2, wood));
  const stroke = '#F7F4EF';
  const sw = 4;
  c.add(rect(m, m, w - m * 2, h - m * 2, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  c.add(`<line x1="${n(w / 2)}" y1="${n(m)}" x2="${n(w / 2)}" y2="${n(h - m)}" stroke="${stroke}" stroke-width="${sw}"/>`);
  c.add(circle(w / 2, h / 2, 36, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  const keyW = 116;
  const keyH = 140;
  for (const x of [m, w - m - keyH]) {
    c.add(rect(x, h / 2 - keyW / 2, keyH, keyW, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  }
  c.add(circle(m + keyH, h / 2, 36, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  c.add(circle(w - m - keyH, h / 2, 36, 'none', ` stroke="${stroke}" stroke-width="${sw}"`));
  const arc = (side) => {
    const cx = side < 0 ? m + 20 : w - m - 20;
    const start = side < 0 ? 1 : 0;
    c.add(path(
      `M${n(cx)},${n(m + 36)} A${n(150)},${n(150)} 0 0 ${start} ${n(cx)},${n(h - m - 36)}`,
      'none',
      ` stroke="${stroke}" stroke-width="${sw}"`,
    ));
  };
  arc(-1);
  arc(1);
  hoop(c, m + 8, h / 2, 1, stroke);
  hoop(c, w - m - 8, h / 2, -1, stroke);
  return c.svg();
}

function hoop(c, x, y, dir, stroke) {
  c.add(rect(x - dir * 8, y - 18, dir * 10, 36, 'none', ` stroke="${stroke}" stroke-width="3"`));
  c.add(ellipse(x + dir * 16, y, 14, 8, 'none', ` stroke="${stroke}" stroke-width="3"`));
}

export function courtSide() {
  const { w, h, farLeft, farRight, nearRight, nearLeft } = COURT.side;
  const c = new Canvas(w, h);
  c.add(rect(0, 0, w, h, skyPaint(c, ['#1C2430', '#C46B5A', '#E2B15A'])));
  c.add(rect(200, 140, w - 400, 100, seats(c, '#5C2E6B', '#E2B34A')));
  const trap = `M${farLeft.join(',')} L${farRight.join(',')} L${nearRight.join(',')} L${nearLeft.join(',')} Z`;
  const wood = c.pattern(30, 30, `${rect(0, 0, 30, 30, '#E2B15A')}${rect(0, 0, 30, 3, '#C99645')}`);
  c.add(path(trap, wood));
  c.add(path(trap, 'none', ' stroke="#F7F4EF" stroke-width="4"'));
  c.add(rect(150, 280, 14, 90, '#F7F4EF'));
  c.add(ellipse(190, 340, 22, 8, 'none', ' stroke="#F7F4EF" stroke-width="4"'));
  c.add(rect(1436, 280, 14, 90, '#F7F4EF'));
  c.add(ellipse(1410, 340, 22, 8, 'none', ' stroke="#F7F4EF" stroke-width="4"'));
  return c.svg();
}

export function prematch(sportId) {
  const w = 1672;
  const h = 941;
  const c = new Canvas(w, h);
  const skies = {
    football: ['#163828', '#2F7A48', '#0E2418'],
    basket: ['#2A2118', '#8A5A32', '#1A120E'],
    car: ['#14181E', '#3A4654', '#0E1216'],
    moto: ['#141A20', '#2E4556', '#0E1418'],
  }[sportId];
  c.add(rect(0, 0, w, h, skyPaint(c, skies)));
  if (sportId === 'football' || sportId === 'basket') {
    const field = sportId === 'football'
      ? c.pattern(50, 50, `${rect(0, 0, 50, 50, '#2F7A48')}${rect(0, 0, 25, 50, '#36864F')}`)
      : c.pattern(24, 80, `${rect(0, 0, 24, 80, '#E2B15A')}${rect(22, 0, 2, 80, '#C99645')}`);
    c.add(path('M180,250 L1492,250 L1620,820 L52,820 Z', field));
    c.add(path('M180,250 L1492,250 L1620,820 L52,820 Z', 'none', ' stroke="#F7F4EF" stroke-width="4" opacity="0.8"'));
  } else {
    c.add(rect(0, 520, w, 80, '#2A3036'));
    c.add(rect(0, 548, w, 8, '#F7F4EF', ' opacity="0.7"'));
    c.add(rect(80, 180, 420, 280, '#1A1E24', ' opacity="0.78"'));
    c.add(rect(80, 160, 420, 24, sportId === 'car' ? '#C4554A' : '#3A6EA5'));
    for (let i = 0; i < 4; i += 1) {
      c.add(ellipse(140 + i * 90, 400, 28, 28, 'none', ' stroke="#C5CCD3" stroke-width="10"'));
    }
  }
  const scrim = c.linear([[0, '#0E1014'], [0.22, '#0E101400'], [0.78, '#0E101400'], [1, '#0E1014']], { x1: '0', y1: '0', x2: '1', y2: '0' });
  c.add(rect(0, 0, w, h, scrim, ' opacity="0.85"'));
  return c.svg();
}

export function layoutChrome(sportId) {
  const w = 1672;
  const h = 941;
  const c = new Canvas(w, h);
  const accent = { football: '#2F8F55', basket: '#E07A2F', car: '#C4554A', moto: '#3A6EA5' }[sportId];
  const panel = (x, y, pw, ph) => {
    const mask = c.mask(rect(x, y, pw, ph, '#FFFFFF') + roundRect(x + 18, y + 18, pw - 36, ph - 36, 16, '#000000'));
    c.add(roundRect(x, y, pw, ph, 24, '#2A241C', ` mask="${mask}" opacity="0.92"`));
    c.add(rect(x, y, pw, 10, accent));
  };
  panel(28, 28, 390, 780);
  panel(1254, 28, 390, 520);
  panel(450, 800, 770, 112);
  return {
    svg: c.svg(),
    regions: {
      roster: { x: 28, y: 28, w: 390, h: 780 },
      tactics: { x: 1254, y: 28, w: 390, h: 520 },
      confirm: { x: 450, y: 800, w: 770, h: 112 },
      stage: { x: 440, y: 36, w: 790, h: 740 },
    },
  };
}
