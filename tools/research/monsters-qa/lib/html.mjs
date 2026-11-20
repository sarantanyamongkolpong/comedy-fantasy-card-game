/**
 * Pull a title and visible text out of an HTML document.
 */

const NAMED_ENTITIES = new Map(Object.entries({
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'",
  rdquo: '"', ldquo: '"', '#39': "'",
}));

/**
 * @param {string} value
 */
export function decodeEntities(value) {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (all, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10FFFF) return all;
      try {
        return String.fromCodePoint(code);
      } catch {
        return all;
      }
    }
    return NAMED_ENTITIES.get(body.toLowerCase()) ?? all;
  });
}

/**
 * @param {string} html
 * @returns {{ title: string, text: string }}
 */
export function htmlToText(html) {
  const raw = String(html ?? '').slice(0, 1_500_000);
  const title = decodeEntities(extractTitle(raw)).replace(/\s+/g, ' ').trim();
  const stripped = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const text = decodeEntities(stripped).replace(/\s+/g, ' ').trim();
  return { title, text };
}

/**
 * @param {string} html
 */
function extractTitle(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title && title[1].trim()) return title[1];
  const meta = metaContent(html, 'og:title') || metaContent(html, 'twitter:title');
  if (meta) return meta;
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return h1 ? h1[1].replace(/<[^>]+>/g, ' ') : '';
}

/**
 * @param {string} html
 * @param {string} key
 */
function metaContent(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = {};
    for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(['"])([\s\S]*?)\2/gi)) {
      attrs[match[1].toLowerCase()] = match[3];
    }
    const name = (attrs.property || attrs.name || '').toLowerCase();
    if (name === key && attrs.content) return attrs.content;
  }
  return '';
}

/**
 * @param {string} text
 * @param {string} term
 * @param {number} [radius]
 */
export function evidenceSnippet(text, term, radius = 60) {
  const source = String(text ?? '').replace(/\s+/g, ' ').trim();
  const needle = String(term ?? '').trim();
  if (!source || !needle) return '';
  const index = source.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return '';
  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + needle.length + radius);
  const slice = source.slice(start, end).trim();
  return `${start > 0 ? '…' : ''}${slice}${end < source.length ? '…' : ''}`.slice(0, 180);
}
