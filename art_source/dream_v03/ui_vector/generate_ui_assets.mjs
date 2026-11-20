// Regenerates coherent, independently replaceable SVG UI chrome for the browser game.
// Run with: node ui_vector/generate_ui_assets.mjs (from the v03 package root)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = dirname(fileURLToPath(import.meta.url));
mkdirSync(output, { recursive: true });

const theme = {
  primary: { top: '#344077', bottom: '#11172F', edge: '#F8E7A0', accent: '#A76CFA', shine: '#FFF4C9' },
  secondary: { top: '#244B64', bottom: '#102237', edge: '#B6E9E5', accent: '#4ECBDC', shine: '#DBFFFF' },
  danger: { top: '#663246', bottom: '#2D1329', edge: '#F6CBA4', accent: '#F37886', shine: '#FFE5D0' },
  disabled: { top: '#3E4558', bottom: '#252B3B', edge: '#808A9C', accent: '#687284', shine: '#B8BECA' },
  ghost: { top: '#25304C', bottom: '#0C1223', edge: '#AB97D5', accent: '#6B5DAB', shine: '#D0BEEE' }
};

function rootSvg(w, h, body, defs = '') {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
    '" viewBox="0 0 ' + w + ' ' + h + '" fill="none" role="img">\n' +
    '<defs>' + defs + '</defs>\n' + body + '\n</svg>\n';
}

function write(name, svg) {
  writeFileSync(join(output, name + '.svg'), svg, 'utf8');
}

function buttonSvg(w, h, type = 'primary') {
  const t = theme[type];
  const x = 6, y = 7, rw = w - 12, rh = h - 14, rad = Math.min(17, h / 4);
  const defs = '<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">' +
    '<stop stop-color="' + t.top + '"/><stop offset="1" stop-color="' + t.bottom + '"/></linearGradient>' +
    '<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">' +
    '<stop stop-color="' + t.shine + '"/><stop offset=".5" stop-color="' + t.edge + '"/><stop offset="1" stop-color="' + t.accent + '"/></linearGradient>' +
    '<filter id="glow" x="-30%" y="-40%" width="160%" height="190%"><feGaussianBlur stdDeviation="3"/></filter>';
  const body = [
    '<rect x="' + (x+2) + '" y="' + (y+3) + '" width="' + (rw-4) + '" height="' + (rh-3) + '" rx="' + rad + '" fill="' + t.accent + '" opacity=".25" filter="url(#glow)"/>',
    '<rect x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '" rx="' + rad + '" fill="url(#fill)" stroke="url(#edge)" stroke-width="2.7"/>',
    '<rect x="' + (x+6) + '" y="' + (y+6) + '" width="' + (rw-12) + '" height="' + (rh-12) + '" rx="' + Math.max(3,rad-7) + '" stroke="' + t.edge + '" stroke-opacity=".47" stroke-width="1"/>',
    '<path d="M' + (x+24) + ' ' + (y+3) + 'H' + (w-24) + '" stroke="' + t.shine + '" stroke-width="1.2" opacity=".85"/>',
    '<path d="M' + (x+18) + ' ' + (h/2) + 'l8 -7 8 7 -8 7z M' + (w-18) + ' ' + (h/2) + 'l-8 -7 -8 7 8 7z" fill="' + t.edge + '" opacity=".84"/>',
    '<circle cx="' + (w/2) + '" cy="' + (y+4) + '" r="2.5" fill="' + t.shine + '" opacity=".9"/>'
  ].join('\n');
  return rootSvg(w,h,body,defs);
}

function tabSvg(selected) {
  const t = selected ? theme.primary : theme.ghost;
  const defs = '<linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="' + t.top +
    '"/><stop offset="1" stop-color="' + t.bottom + '"/></linearGradient>';
  return rootSvg(216,68,[
    '<path d="M26 5H190L211 28V61H5V28Z" fill="url(#grad)" stroke="' + t.edge + '" stroke-width="2.7"/>',
    '<path d="M19 31L30 12H186L197 31" stroke="' + t.shine + '" stroke-opacity=".62"/>',
    '<path d="M42 60H174" stroke="' + t.accent + '" stroke-width="' + (selected ? '5' : '2') + '" stroke-linecap="round"/>',
    '<path d="M13 47l11 -8 11 8 -11 8z M203 47l-11 -8 -11 8 11 8z" stroke="' + t.edge + '" stroke-width="1.5"/>'
  ].join('\n'),defs);
}

function panelSvg(w,h,kind) {
  const t = kind==='toast' ? theme.secondary : theme.primary;
  const defs = '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="' +
    t.top + '" stop-opacity=".97"/><stop offset="1" stop-color="' + t.bottom +
    '" stop-opacity=".97"/></linearGradient>';
  const ornaments = [
    '<path d="M14 57V27Q14 14 27 14H70M' + (w-14) + ' 57V27Q' + (w-14) + ' 14 ' + (w-27) + ' 14H' + (w-70) +
      'M14 ' + (h-57) + 'V' + (h-27) + 'Q14 ' + (h-14) + ' 27 ' + (h-14) + 'H70M' + (w-14) + ' ' + (h-57) +
      'V' + (h-27) + 'Q' + (w-14) + ' ' + (h-14) + ' ' + (w-27) + ' ' + (h-14) + 'H' + (w-70) +
      '" stroke="' + t.shine + '" stroke-width="2.7"/>',
    '<path d="M32 32l15 -11 15 11 -15 11z M' + (w-32) + ' 32l-15 -11 -15 11 15 11z M32 ' + (h-32) +
      'l15 -11 15 11 -15 11z M' + (w-32) + ' ' + (h-32) + 'l-15 -11 -15 11 15 11z" fill="' + t.accent + '" stroke="' + t.edge + '" stroke-width="1.6"/>'
  ].join('\n');
  return rootSvg(w,h,[
    '<rect x="8" y="8" width="' + (w-16) + '" height="' + (h-16) + '" rx="17" fill="url(#bg)" stroke="' + t.edge + '" stroke-width="3"/>',
    '<rect x="22" y="22" width="' + (w-44) + '" height="' + (h-44) + '" rx="8" stroke="' + t.edge + '" stroke-opacity=".45"/>',
    ornaments
  ].join('\n'),defs);
}

function slotSvg() {
  const defs = '<linearGradient id="trim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFF1BE"/><stop offset=".58" stop-color="#E7BF67"/><stop offset="1" stop-color="#9B63DB"/></linearGradient>';
  return rootSvg(128,128,[
    '<rect x="6" y="6" width="116" height="116" rx="15" fill="#101830" fill-opacity=".55" stroke="url(#trim)" stroke-width="5"/>',
    '<rect x="14" y="14" width="100" height="100" rx="9" stroke="#E7BF67" stroke-opacity=".6" stroke-width="1.4"/>',
    '<path d="M22 8h25M81 8h25M8 22v25M120 22v25M8 81v25M120 81v25M22 120h25M81 120h25" stroke="#FFF1BE" stroke-width="1.5"/>',
    '<path d="M14 14l8 -6 8 6 -8 6z M114 14l-8 -6 -8 6 8 6z M14 114l8 -6 8 6 -8 6z M114 114l-8 -6 -8 6 8 6z" fill="#A874EB" stroke="#F2D991" stroke-width="1.5"/>'
  ].join('\n'),defs);
}

const iconPaths = {
  bag: '<path d="M17 24h30l-3 28H20L17 24Z M24 24v-6a8 8 0 0 1 16 0v6"/>',
  deck: '<rect x="17" y="14" width="29" height="36" rx="3"/><path d="M13 21v31h28M23 21h17M23 28h17M23 35h11"/>',
  home: '<path d="M10 30 32 12 54 30M16 28v23h32V28M27 51V35h11v16"/>',
  gacha: '<circle cx="32" cy="32" r="21"/><path d="M11 32h42M32 11v42"/><path d="m25 23 7-9 7 9-7 8z"/>',
  map: '<path d="m10 18 14-6 16 7 14-6v33l-14 6-16-7-14 6V18ZM24 12v33M40 19v33"/>',
  shop: '<path d="M13 26h38v26H13V26ZM9 20l6-9h34l6 9-4 8-7-3-6 3-6-3-6 3-7-3-6 3-4-8ZM23 52V35h18v17"/>',
  companion: '<ellipse cx="32" cy="42" rx="15" ry="11"/><ellipse cx="17" cy="23" rx="5" ry="7"/><ellipse cx="29" cy="18" rx="5" ry="7"/><ellipse cx="41" cy="19" rx="5" ry="7"/><ellipse cx="51" cy="27" rx="5" ry="7"/>',
  settings: '<circle cx="32" cy="32" r="9"/><path d="M28 10h8l2 7 6 3 6-4 6 7-5 6 1 7 6 4-4 8-7-2-6 4-1 7h-8l-2-7-6-3-7 3-5-7 5-6-1-7-6-4 4-8 7 2 6-4z"/>',
  close: '<path d="m18 18 28 28M46 18 18 46"/>',
  back: '<path d="M47 32H17M30 17 15 32l15 15"/>',
  sort: '<path d="M12 18h40M12 30h30M12 42h20M42 40v12m-7-7 7 7 7-7"/>',
  filter: '<path d="M10 15h44L37 34v16l-10-5V34Z"/>'
};

function iconSvg(body) {
  const defs = '<radialGradient id="orb"><stop stop-color="#384D8F"/><stop offset="1" stop-color="#171A36"/></radialGradient>';
  return rootSvg(64,64,[
    '<path d="M18 4h28l14 14v28L46 60H18L4 46V18Z" fill="url(#orb)" stroke="#F5D78E" stroke-width="2.2"/>',
    '<path d="M21 8h22M8 21v22M56 21v22M21 56h22" stroke="#A57CF6" stroke-width="1.4" opacity=".9"/>',
    '<g stroke="#F6E5AE" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" fill="none">' + body + '</g>'
  ].join('\n'),defs);
}

const files = [
  ['button_primary',buttonSvg(320,80,'primary')],
  ['button_secondary',buttonSvg(320,80,'secondary')],
  ['button_danger',buttonSvg(320,80,'danger')],
  ['button_disabled',buttonSvg(320,80,'disabled')],
  ['button_ghost',buttonSvg(320,80,'ghost')],
  ['button_small',buttonSvg(180,56,'primary')],
  ['button_icon_square',buttonSvg(80,80,'primary')],
  ['tab_selected',tabSvg(true)],
  ['tab_unselected',tabSvg(false)],
  ['popup_panel',panelSvg(480,308,'popup')],
  ['toast_panel',panelSvg(428,124,'toast')],
  ['inventory_slot_frame',slotSvg()],
  ['inventory_item_detail_panel',panelSvg(420,620,'popup')],
  ['inventory_category_tab_frame',tabSvg(false)],
  ['inventory_tooltip_frame',panelSvg(420,240,'toast')]
];
for (const [name, asset] of files) write(name,asset);
for (const [name, drawing] of Object.entries(iconPaths)) write('icon_' + name,iconSvg(drawing));
console.log('Generated ' + (files.length + Object.keys(iconPaths).length) + ' SVG assets at ' + output);
