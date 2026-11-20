/**
 * Art comes from web/sport/art-manifest.json.
 * A path loads that file. A null path draws the shape placeholder.
 * Swap a card by editing the manifest entry. Screens never hard-code files.
 */

import manifest from './art-manifest.json' with { type: 'json' };

const NS = 'http://www.w3.org/2000/svg';

export function artManifest() {
  return manifest;
}

export function findArt(query) {
  const assets = manifest.assets ?? [];
  return assets.find((asset) => {
    if (query.id && asset.id !== query.id) return false;
    if (query.slot && asset.slot !== query.slot) return false;
    if (query.subjectId && asset.subjectId !== query.subjectId) return false;
    return true;
  }) ?? null;
}

export function artNode(query) {
  const entry = findArt(query);
  const wrap = document.createElement('div');
  wrap.className = 'sport-art';
  wrap.dataset.placeholder = 'true';
  wrap.dataset.artSlot = entry?.slot ?? query.slot ?? '';
  wrap.dataset.artSubject = entry?.subjectId ?? query.subjectId ?? '';
  if (entry?.id) wrap.dataset.artId = entry.id;
  if (entry?.file) {
    const img = document.createElement('img');
    img.alt = entry.alt || 'Placeholder';
    img.src = new URL(entry.file, import.meta.url).href;
    img.addEventListener('error', () => {
      img.replaceWith(shapeSvg(entry));
    });
    wrap.append(img);
    return wrap;
  }
  wrap.append(shapeSvg(entry ?? { shape: { kind: 'badge', primary: '#141c38', secondary: '#e6c36a', mark: 'plus' }, alt: 'Placeholder' }));
  return wrap;
}

function shapeSvg(entry) {
  const shape = entry?.shape ?? {};
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 160 200');
  svg.setAttribute('role', 'img');
  const title = document.createElementNS(NS, 'title');
  title.textContent = entry?.alt || 'Placeholder';
  svg.append(title);
  const primary = shape.primary ?? '#141c38';
  const secondary = shape.secondary ?? '#e6c36a';
  const accent = shape.accent ?? '#f4e2c4';
  svg.append(rect(0, 0, 160, 200, 18, primary));
  const mark = shape.mark ?? 'badge';
  if (mark === 'ball') {
    svg.append(rect(18, 18, 124, 164, 8, 'none', accent, 4));
    svg.append(line(80, 18, 80, 182, accent, 3));
    svg.append(circle(80, 100, 22, 'none', accent, 3));
  } else if (mark === 'hoop') {
    svg.append(circle(80, 78, 26, 'none', accent, 6));
    svg.append(rect(58, 104, 44, 8, 2, accent));
    svg.append(line(68, 112, 74, 150, accent, 3));
    svg.append(line(92, 112, 86, 150, accent, 3));
  } else if (mark === 'car') {
    svg.append(polygon('24,130 136,130 116,78 44,78', secondary));
    svg.append(circle(52, 130, 16, '#2a1b12'));
    svg.append(circle(108, 130, 16, '#2a1b12'));
  } else if (mark === 'moto') {
    svg.append(circle(48, 132, 18, 'none', accent, 6));
    svg.append(circle(112, 132, 18, 'none', accent, 6));
    svg.append(polygon('58,124 108,78 118,96 68,136', secondary));
  } else {
    svg.append(circle(80, 100, 36, 'none', secondary, 8));
    svg.append(rect(68, 48, 24, 104, 4, secondary));
    svg.append(rect(40, 88, 80, 24, 4, secondary));
  }
  return svg;
}

function rect(x, y, w, h, r, fill, stroke, strokeWidth) {
  const node = document.createElementNS(NS, 'rect');
  node.setAttribute('x', String(x));
  node.setAttribute('y', String(y));
  node.setAttribute('width', String(w));
  node.setAttribute('height', String(h));
  node.setAttribute('rx', String(r));
  node.setAttribute('fill', fill);
  if (stroke) {
    node.setAttribute('stroke', stroke);
    node.setAttribute('stroke-width', String(strokeWidth ?? 2));
  }
  return node;
}

function circle(cx, cy, r, fill, stroke, strokeWidth) {
  const node = document.createElementNS(NS, 'circle');
  node.setAttribute('cx', String(cx));
  node.setAttribute('cy', String(cy));
  node.setAttribute('r', String(r));
  node.setAttribute('fill', fill);
  if (stroke) {
    node.setAttribute('stroke', stroke);
    node.setAttribute('stroke-width', String(strokeWidth ?? 2));
  }
  return node;
}

function line(x1, y1, x2, y2, stroke, width) {
  const node = document.createElementNS(NS, 'line');
  node.setAttribute('x1', String(x1));
  node.setAttribute('y1', String(y1));
  node.setAttribute('x2', String(x2));
  node.setAttribute('y2', String(y2));
  node.setAttribute('stroke', stroke);
  node.setAttribute('stroke-width', String(width));
  return node;
}

function polygon(points, fill) {
  const node = document.createElementNS(NS, 'polygon');
  node.setAttribute('points', points);
  node.setAttribute('fill', fill);
  return node;
}
