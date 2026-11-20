import { bindImage, findAsset } from '../assets.js';
import { button, el } from '../dom.js';
import { prepBands, prepPlayerSlots } from '../prep-layout.js';
import { battleReady, deckDefs, teamDefs } from '../profile.js';

const FACTION_CLASS = {
  FAC_AEG: 'faction-FAC_AEG',
  FAC_PHA: 'faction-FAC_PHA',
  FAC_CEL: 'faction-FAC_CEL',
  FAC_SAN: 'faction-FAC_SAN',
};

function place(node, box) {
  node.style.left = `${box.x}px`;
  node.style.top = `${box.y}px`;
  node.style.width = `${box.w}px`;
  node.style.height = `${box.h}px`;
}

export function renderPrep(ctx) {
  const bands = prepBands();
  const root = el('section', 'prep');
  root.dataset.screen = 'prep';
  const site = ctx.prepSite ?? { label: 'Mysterious Tower', mode: 'tower' };
  root.append(chrome(ctx, bands, site));
  root.append(teamPanel(ctx, bands.team));
  root.append(preview(ctx, bands.arena));
  root.append(deckPanel(ctx, bands.deck));
  root.append(detailPanel(ctx, bands.detail));
  root.append(footer(ctx, bands, site));
  if (ctx.notice) root.append(el('p', 'toast', ctx.notice));
  return root;
}

function chrome(ctx, bands, site) {
  const title = el('div', 'prep-title');
  place(title, bands.title);
  const badge = findAsset(ctx.manifest, { slot: 'ui-badge', subjectId: 'prep' });
  if (badge) {
    const img = el('img');
    img.alt = '';
    bindImage(img, badge);
    title.append(img);
  }
  title.append(el('h1', null, 'PREP BATTLE'));
  const banner = el('div', 'prep-location');
  place(banner, bands.location);
  const plate = findAsset(ctx.manifest, { slot: 'ui-banner', subjectId: 'site' });
  if (plate) {
    const img = el('img');
    img.alt = '';
    bindImage(img, plate);
    banner.append(img);
  }
  banner.append(el('h2', null, site.label.toUpperCase()));
  const wrap = el('div');
  wrap.append(title, banner);
  return wrap;
}

function teamPanel(ctx, box) {
  const panel = el('div', 'prep-team');
  panel.dataset.band = 'team';
  place(panel, box);
  paintPanel(panel, ctx, 'team');
  panel.append(el('h2', null, 'TEAM'));
  const rows = teamDefs(ctx.profile, ctx.api.catalog);
  const selected = selectedIndex(ctx, rows);
  rows.forEach((row, index) => {
    const def = row.def;
    const buttonRow = el('button', `prep-member${index === selected ? ' is-selected' : ''}`);
    buttonRow.type = 'button';
    buttonRow.addEventListener('click', () => ctx.setPrepIndex(index));
    const strip = el('span', `faction-strip ${FACTION_CLASS[def?.factionId] ?? ''}`);
    buttonRow.append(strip);
    const portrait = el('span', 'prep-portrait');
    const art = def ? findAsset(ctx.manifest, { slot: 'battle-sprite', subjectId: def.avatarId }) : null;
    if (art) {
      const img = el('img');
      img.alt = '';
      bindImage(img, art);
      portrait.append(img);
    }
    buttonRow.append(portrait);
    const text = el('span', 'prep-member-text');
    text.append(el('b', null, def?.name ?? 'Empty seat'));
    const role = el('span', 'prep-role');
    const roleId = String(def?.role ?? '').toLowerCase();
    const icon = roleId ? findAsset(ctx.manifest, { slot: 'role-icon', subjectId: roleId }) : null;
    if (icon) {
      const img = el('img');
      img.alt = '';
      bindImage(img, icon);
      role.append(img);
    }
    role.append(el('span', null, roleId ? def.role.toUpperCase() : ''));
    text.append(role);
    buttonRow.append(text);
    panel.append(buttonRow);
  });
  return panel;
}

function preview(ctx, box) {
  const field = el('div', 'prep-arena');
  field.dataset.band = 'arena';
  place(field, box);
  const bg = findAsset(ctx.manifest, { slot: 'bg-battle', subjectId: 'battle' });
  if (bg) {
    const img = el('img', 'battle-bg');
    img.alt = '';
    bindImage(img, bg);
    field.append(img);
  }
  const rows = teamDefs(ctx.profile, ctx.api.catalog);
  const slots = prepPlayerSlots();
  rows.forEach((row, index) => {
    const slot = slots[index];
    const def = row.def;
    if (!slot || !def) return;
    const token = el('div', 'prep-token');
    place(token, {
      x: slot.box.x - box.x,
      y: slot.box.y - box.y,
      w: slot.box.w,
      h: slot.box.h,
    });
    const tile = findAsset(ctx.manifest, { slot: 'battle-tile', subjectId: 'player' });
    if (tile) {
      const pad = el('img', 'tile');
      pad.alt = '';
      bindImage(pad, tile);
      token.append(pad);
    }
    const art = findAsset(ctx.manifest, { slot: 'battle-sprite', subjectId: def.avatarId });
    if (art) {
      const img = el('img', 'sprite faces-right');
      img.alt = '';
      bindImage(img, art);
      token.append(img);
    }
    token.append(el('span', 'unit-name', def.name));
    field.append(token);
  });
  return field;
}

function deckPanel(ctx, box) {
  const panel = el('div', 'prep-deck');
  panel.dataset.band = 'deck';
  place(panel, box);
  paintPanel(panel, ctx, 'deck');
  const cards = deckDefs(ctx.profile, ctx.api.catalog);
  panel.append(el('h2', null, `DECK ${cards.length}/30`));
  const grid = el('div', 'deck-icons');
  for (const row of cards) {
    const def = row.def;
    if (!def) continue;
    const icon = el('div', 'deck-icon');
    icon.title = def.name;
    const art = findAsset(ctx.manifest, { slot: 'type-icon', subjectId: def.type })
      ?? findAsset(ctx.manifest, { slot: 'stat-icon', subjectId: String(def.type ?? '').toLowerCase() });
    if (art) {
      const img = el('img');
      img.alt = '';
      bindImage(img, art);
      icon.append(img);
    }
    icon.append(el('span', null, def.name));
    grid.append(icon);
  }
  panel.append(grid);
  return panel;
}

function detailPanel(ctx, box) {
  const panel = el('div', 'prep-detail');
  panel.dataset.band = 'detail';
  place(panel, box);
  paintPanel(panel, ctx, 'detail');
  const rows = teamDefs(ctx.profile, ctx.api.catalog);
  const def = rows[selectedIndex(ctx, rows)]?.def;
  if (!def) {
    panel.append(el('p', null, 'Pick a teammate.'));
    return panel;
  }
  const head = el('div', 'prep-detail-head');
  const art = findAsset(ctx.manifest, { slot: 'battle-sprite', subjectId: def.avatarId });
  if (art) {
    const img = el('img');
    img.alt = '';
    bindImage(img, art);
    head.append(img);
  }
  head.append(el('h2', null, def.name));
  panel.append(head);
  panel.append(skillBlock('ACTIVE EFFECT', def.active));
  panel.append(skillBlock('PASSIVE', def.passive));
  return panel;
}

function skillBlock(label, skill) {
  const block = el('div', 'prep-skill');
  block.append(el('p', 'fine', label));
  block.append(el('b', null, skill?.name ?? 'No skill text in the data.'));
  if (skill?.summary) block.append(el('p', null, skill.summary));
  return block;
}

function footer(ctx, bands, site) {
  const ready = battleReady(ctx.profile, ctx.api.catalog);
  const back = button('BACK', () => ctx.goto('map'), 'prep-back');
  place(back, bands.back);
  const backArt = findAsset(ctx.manifest, { slot: 'ui-button', subjectId: 'back' });
  if (backArt) {
    const img = el('img');
    img.alt = '';
    bindImage(img, backArt);
    back.prepend(img);
  }
  const start = button('START BATTLE', () => {
    if (!ready.ok) return;
    ctx.startBattle(site.mode || 'tower');
  }, 'prep-start');
  place(start, bands.start);
  start.disabled = !ready.ok;
  const problem = ready.messages.find((message) => message.level === 'error');
  if (problem) start.title = problem.text;
  const startArt = findAsset(ctx.manifest, { slot: 'ui-button', subjectId: 'start-battle' });
  if (startArt) {
    const img = el('img');
    img.alt = '';
    bindImage(img, startArt);
    start.prepend(img);
  }
  const wrap = el('div');
  wrap.append(back, start);
  return wrap;
}

function paintPanel(panel, ctx, subjectId) {
  const art = findAsset(ctx.manifest, { slot: 'ui-panel', subjectId });
  if (!art) return;
  const img = el('img', 'panel-bg');
  img.alt = '';
  bindImage(img, art);
  panel.append(img);
}

function selectedIndex(ctx, rows) {
  if (Number.isInteger(ctx.prepIndex) && ctx.prepIndex >= 0 && ctx.prepIndex < rows.length) return ctx.prepIndex;
  const support = rows.findIndex((row) => row.def?.role === 'Support');
  return support >= 0 ? support : 0;
}
