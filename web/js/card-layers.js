/**
 * A card face is layers plus text from data.
 * It is never one baked card PNG. Full reference-card paintings are not used here.
 */

import { findAsset } from './assets.js';

export const REQUIRED_CARD_ANCHORS = Object.freeze([
  'illustration',
  'frame',
  'factionBadge',
  'name',
  'statAtk',
  'statDef',
  'statSpd',
  'rulesText',
  'apCost',
]);

function layer(slot, asset, anchor) {
  if (!asset) return null;
  return {
    slot,
    assetId: asset.asset_id,
    anchor,
    path: asset.path,
    placeholder: asset.placeholder === true,
    rarity: asset.rarity ?? null,
  };
}

/**
 * @param {object} manifest
 * @param {{ name?: string, rarity?: string|null, factionId?: string|null, illustrationSubjectId?: string, costAp?: number|null, type?: string|null, stats?: { atk: number|null, def: number|null, spd: number|null }|null, lines?: string[], statusNote?: string }} model
 */
/** Per-rarity windows from frameInsets. Placeholder rarities keep cardLayout. */
export function layoutFor(manifest, rarity) {
  const pack = manifest.frameInsets?.byRarity?.[rarity];
  if (!pack) return manifest.cardLayout;
  const width = manifest.frameInsets.masterWidth;
  const height = manifest.frameInsets.masterHeight;
  const { art, title, body } = pack;
  const statY = art.y + art.h - 72;
  return {
    width,
    height,
    anchors: {
      interior: { x: 0, y: 0, w: width, h: height },
      illustration: art,
      frame: { x: 0, y: 0, w: width, h: height },
      factionBadge: { x: Math.max(0, title.x - 64), y: title.y, w: 64, h: title.h },
      name: { x: title.x, y: title.y, w: title.w - 8, h: title.h },
      rulesText: body,
      statAtk: { x: art.x + 8, y: statY, w: art.w / 3, h: 64 },
      statDef: { x: art.x + art.w / 3, y: statY, w: art.w / 3, h: 64 },
      statSpd: { x: art.x + (2 * art.w) / 3, y: statY, w: art.w / 3 - 8, h: 64 },
      apCost: { x: art.x + art.w - 96, y: art.y + 8, w: 88, h: 64 },
      typeIcon: { x: body.x + body.w - 64, y: body.y + 8, w: 56, h: 56 },
    },
  };
}

export function cardFace(manifest, model) {
  const rarity = model.rarity || 'TBD';
  const layout = layoutFor(manifest, rarity);
  const frame = findAsset(manifest, { slot: 'frame', rarity });
  const illustration = findAsset(manifest, { slot: 'illustration', subjectId: model.illustrationSubjectId })
    ?? findAsset(manifest, { slot: 'illustration', subjectId: 'generic-action' });
  const badge = findAsset(manifest, { slot: 'faction-badge', subjectId: model.factionId || 'generic' });
  const interior = findAsset(manifest, { slot: 'card-interior', subjectId: 'neutral' });
  const layers = [
    layer('card-interior', interior, 'interior'),
    layer('illustration', illustration, 'illustration'),
    layer('frame', frame, 'frame'),
    layer('faction-badge', badge, 'factionBadge'),
  ];
  if (model.type === 'Skill') {
    layers.push(layer('type-icon', findAsset(manifest, { slot: 'type-icon', subjectId: 'Skill' }), 'typeIcon'));
  }
  if (model.stats) {
    layers.push(
      layer('stat-icon', findAsset(manifest, { slot: 'stat-icon', subjectId: 'atk' }), 'statAtk'),
      layer('stat-icon', findAsset(manifest, { slot: 'stat-icon', subjectId: 'def' }), 'statDef'),
      layer('stat-icon', findAsset(manifest, { slot: 'stat-icon', subjectId: 'spd' }), 'statSpd'),
    );
  }
  if (model.costAp != null) {
    layers.push(layer('ui-icon', findAsset(manifest, { slot: 'ui-icon', subjectId: 'ap' }), 'apCost'));
  }
  return {
    bakedCard: false,
    layout,
    layers: layers.filter(Boolean),
    text: {
      name: model.name ?? '',
      rarity,
      type: model.type ?? '',
      apCost: model.costAp ?? null,
      stats: model.stats ?? null,
      lines: model.lines ?? [],
      statusNote: model.statusNote ?? '',
    },
  };
}

export function anchorPercent(layout, anchorName) {
  const box = layout?.anchors?.[anchorName];
  if (!box) return null;
  return {
    left: `${(box.x / layout.width) * 100}%`,
    top: `${(box.y / layout.height) * 100}%`,
    width: `${(box.w / layout.width) * 100}%`,
    height: `${(box.h / layout.height) * 100}%`,
  };
}
