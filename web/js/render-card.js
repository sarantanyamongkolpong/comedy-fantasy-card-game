import { bindImage, findAsset } from './assets.js';
import { anchorPercent, cardFace } from './card-layers.js';

function place(node, layout, anchor) {
  const box = anchorPercent(layout, anchor);
  if (!box) return;
  node.style.left = box.left;
  node.style.top = box.top;
  node.style.width = box.width;
  node.style.height = box.height;
}

function layerImage(entry, layout, anchor, slot) {
  const img = document.createElement('img');
  img.className = `layer layer-${slot}`;
  img.alt = '';
  img.draggable = false;
  bindImage(img, entry);
  place(img, layout, anchor);
  return img;
}

/**
 * Layered card. Illustration, frame, badge, stat icons, and text are separate.
 * Text always comes from `model`, never from a baked PNG.
 */
export function renderCard(manifest, model, options = {}) {
  const face = cardFace(manifest, model);
  const root = document.createElement('button');
  root.type = 'button';
  root.className = `card${options.disabled ? ' is-disabled' : ''}${options.selected ? ' is-selected' : ''}`;
  root.style.aspectRatio = `${face.layout.width} / ${face.layout.height}`;
  if (options.disabled) {
    root.setAttribute('aria-disabled', 'true');
    root.dataset.reason = options.reason ?? '';
  }
  const shownName = playerFacingName(face.text.name);
  root.setAttribute('aria-label', shownName || 'Card');
  root.dataset.cardName = face.text.name || '';
  if (face.text.statusNote) root.dataset.status = face.text.statusNote;
  const illustration = face.layers.find((part) => part.slot === 'illustration');
  for (const part of face.layers) {
    if (part.slot === 'stat-icon' || part.slot === 'ui-icon') continue;
    if (part.slot === 'illustration' && part.placeholder) continue;
    const entry = findAsset(manifest, { assetId: part.assetId });
    if (entry) root.append(layerImage(entry, face.layout, part.anchor, part.slot));
  }
  if (!illustration || illustration.placeholder) {
    const mark = typeMark(manifest, face.text.type);
    if (mark) {
      const img = document.createElement('img');
      img.className = 'type-mark';
      img.alt = '';
      bindImage(img, mark);
      root.append(img);
    }
  }
  if (face.text.apCost != null) {
    const cost = document.createElement('span');
    cost.className = 'card-cost';
    place(cost, face.layout, 'apCost');
    const ap = findAsset(manifest, { slot: 'ui-icon', subjectId: 'ap' });
    if (ap) {
      const img = document.createElement('img');
      img.alt = '';
      bindImage(img, ap);
      cost.append(img);
    }
    const num = document.createElement('b');
    num.textContent = String(face.text.apCost);
    cost.append(num);
    root.append(cost);
  }
  const name = document.createElement('span');
  name.className = 'card-name';
  name.textContent = shownName;
  place(name, face.layout, 'name');
  root.append(name);
  if (face.text.stats) {
    const stats = [
      ['statAtk', 'atk', face.text.stats.atk],
      ['statDef', 'def', face.text.stats.def],
      ['statSpd', 'spd', face.text.stats.spd],
    ];
    for (const [anchor, subjectId, value] of stats) {
      const row = document.createElement('span');
      row.className = 'card-stat';
      place(row, face.layout, anchor);
      const icon = findAsset(manifest, { slot: 'stat-icon', subjectId });
      if (icon) {
        const img = document.createElement('img');
        img.alt = '';
        bindImage(img, icon);
        row.append(img);
      }
      const num = document.createElement('b');
      num.textContent = value == null ? '—' : String(value);
      row.append(num);
      root.append(row);
    }
  }
  const rules = document.createElement('span');
  rules.className = 'card-rules';
  place(rules, face.layout, 'rulesText');
  const bits = [];
  if (face.text.type) bits.push(face.text.type);
  if (face.text.rarity) bits.push(playerFacingLine(face.text.rarity));
  bits.push(...face.text.lines.map(playerFacingLine));
  bits.push(playerFacingLine(face.text.statusNote));
  rules.textContent = bits.filter(Boolean).join(' · ');
  root.append(rules);
  if (options.onClick) root.addEventListener('click', options.onClick);
  return root;
}

/** Player-facing label. Status words stay on data-status, not on the face. */
export function playerFacingName(name) {
  const cleaned = String(name ?? '').replace(/placeholder/ig, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || String(name ?? '');
}

export function playerFacingLine(text) {
  const value = String(text ?? '').trim();
  if (!value || /placeholder/i.test(value)) return '';
  return value;
}

function typeMark(manifest, type) {
  if (type === 'ATK') return findAsset(manifest, { slot: 'stat-icon', subjectId: 'atk' });
  if (type === 'DEF') return findAsset(manifest, { slot: 'stat-icon', subjectId: 'def' });
  if (type === 'Skill') return findAsset(manifest, { slot: 'type-icon', subjectId: 'Skill' });
  return null;
}

export function avatarModel(def, extra = {}) {
  const active = def.active?.name ? `${def.active.name} (${def.active.status})` : 'No Active published';
  return {
    name: def.name,
    rarity: def.rarity,
    factionId: def.factionId,
    illustrationSubjectId: def.avatarId,
    stats: def.stats,
    lines: [def.role, active],
    statusNote: def.statsStatus === 'TBD' ? 'Stats TBD' : def.statsStatus === 'PROPOSED' ? 'Stats PROPOSED' : '',
    ...extra,
  };
}

export function actionModel(def) {
  return {
    name: def.name,
    rarity: def.rarity,
    factionId: def.factionRequirement,
    illustrationSubjectId: def.cardId || 'generic-action',
    costAp: def.costAp,
    type: def.type,
    stats: null,
    lines: [def.blurb],
    statusNote: def.versionAndStatus,
  };
}
