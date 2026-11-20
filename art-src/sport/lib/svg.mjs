/** Small SVG builder. Sport art is authored as vectors and rasterized to WebP. */

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function n(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return String(Math.round(number * 100) / 100);
}

export function Canvas(w, h) {
  this.w = w;
  this.h = h;
  this.defs = [];
  this.body = [];
  this.seq = 0;
}

Canvas.prototype.uid = function uid(prefix) {
  this.seq += 1;
  return `${prefix}${this.seq}`;
};

Canvas.prototype.def = function def(markup) {
  this.defs.push(markup);
};

Canvas.prototype.add = function add(markup) {
  if (markup) this.body.push(markup);
};

Canvas.prototype.stops = function stops(list) {
  return list.map((stop) => {
    const [offset, color, opacity] = stop;
    const alpha = opacity === undefined ? '' : ` stop-opacity="${n(opacity)}"`;
    return `<stop offset="${n(offset)}" stop-color="${esc(color)}"${alpha}/>`;
  }).join('');
};

Canvas.prototype.linear = function linear(stops, attrs = {}) {
  const id = this.uid('lg');
  const x1 = attrs.x1 ?? '0';
  const y1 = attrs.y1 ?? '0';
  const x2 = attrs.x2 ?? '0';
  const y2 = attrs.y2 ?? '1';
  this.def(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${this.stops(stops)}</linearGradient>`);
  return `url(#${id})`;
};

Canvas.prototype.radial = function radial(stops, attrs = {}) {
  const id = this.uid('rg');
  const cx = attrs.cx ?? '50%';
  const cy = attrs.cy ?? '40%';
  const r = attrs.r ?? '70%';
  this.def(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${this.stops(stops)}</radialGradient>`);
  return `url(#${id})`;
};

Canvas.prototype.pattern = function pattern(w, h, markup) {
  const id = this.uid('pt');
  this.def(`<pattern id="${id}" width="${n(w)}" height="${n(h)}" patternUnits="userSpaceOnUse">${markup}</pattern>`);
  return `url(#${id})`;
};

Canvas.prototype.mask = function mask(markup) {
  const id = this.uid('mk');
  this.def(`<mask id="${id}">${markup}</mask>`);
  return `url(#${id})`;
};

Canvas.prototype.clip = function clip(markup) {
  const id = this.uid('cp');
  this.def(`<clipPath id="${id}">${markup}</clipPath>`);
  return `url(#${id})`;
};

Canvas.prototype.svg = function svg() {
  const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${n(this.w)}" height="${n(this.h)}" viewBox="0 0 ${n(this.w)} ${n(this.h)}" fill="none">${defs}${this.body.join('')}</svg>\n`;
};

export function rect(x, y, w, h, fill, extra = '') {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${esc(fill)}"${extra}/>`;
}

export function roundRect(x, y, w, h, r, fill, extra = '') {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" fill="${esc(fill)}"${extra}/>`;
}

export function ellipse(cx, cy, rx, ry, fill, extra = '') {
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${esc(fill)}"${extra}/>`;
}

export function circle(cx, cy, r, fill, extra = '') {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${esc(fill)}"${extra}/>`;
}

export function path(d, fill, extra = '') {
  const fillAttr = /\bfill=/.test(extra) ? '' : ` fill="${esc(fill)}"`;
  return `<path d="${d}"${fillAttr}${extra}/>`;
}

export function line(x1, y1, x2, y2, stroke, width, extra = '') {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${esc(stroke)}" stroke-width="${n(width)}"${extra}/>`;
}

export function rrPath(x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${n(x + radius)},${n(y)} H${n(x + w - radius)} A${n(radius)},${n(radius)} 0 0 1 ${n(x + w)},${n(y + radius)} V${n(y + h - radius)} A${n(radius)},${n(radius)} 0 0 1 ${n(x + w - radius)},${n(y + h)} H${n(x + radius)} A${n(radius)},${n(radius)} 0 0 1 ${n(x)},${n(y + h - radius)} V${n(y + radius)} A${n(radius)},${n(radius)} 0 0 1 ${n(x + radius)},${n(y)} Z`;
}

export function group(markup, extra = '') {
  return `<g ${extra}>${markup}</g>`;
}

/** Closed Catmull-Rom loop as one cubic path. Points are {x,y}. */
export function smoothClosed(points) {
  const count = points.length;
  if (count < 3) throw new Error('smoothClosed needs 3 points');
  const start = points[0];
  let d = `M${n(start.x)},${n(start.y)}`;
  for (let i = 0; i < count; i += 1) {
    const p0 = points[(i - 1 + count) % count];
    const p1 = points[i];
    const p2 = points[(i + 1) % count];
    const p3 = points[(i + 2) % count];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${n(c1x)},${n(c1y)} ${n(c2x)},${n(c2y)} ${n(p2.x)},${n(p2.y)}`;
  }
  return `${d} Z`;
}

export function sampleClosed(points, steps = 4) {
  const count = points.length;
  const samples = [];
  for (let i = 0; i < count; i += 1) {
    const p0 = points[(i - 1 + count) % count];
    const p1 = points[i];
    const p2 = points[(i + 1) % count];
    const p3 = points[(i + 2) % count];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const mt = 1 - t;
      const x = mt ** 3 * p1.x + 3 * mt ** 2 * t * c1x + 3 * mt * t ** 2 * c2x + t ** 3 * p2.x;
      const y = mt ** 3 * p1.y + 3 * mt ** 2 * t * c1y + 3 * mt * t ** 2 * c2y + t ** 3 * p2.y;
      samples.push([Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]);
    }
  }
  return samples;
}

export function shoelace(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    area += p.x * q.y - q.x * p.y;
  }
  return area / 2;
}
