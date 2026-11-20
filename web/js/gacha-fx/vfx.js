/**
 * Rarity plates. Epic and EX reuse Dream's reveal art.
 * gacha_reveal_ex.webp keeps a rectangular haze at the bitmap edge. The
 * manifest asks for a radial mask, and the shared CSS feathers 38%–72%,
 * which crops the halo. GFX_EDGE_MASK_EX feathers only the outer rim and
 * the square corners. The Dream plate is not repainted.
 */

import fragment from '../../manifests/gacha.json' with { type: 'json' };

export const RARITY_VFX = Object.freeze({
  N: Object.freeze({ assetId: 'GFX_VFX_N', slot: 'gacha-vfx', subjectId: 'N', edgeMask: false }),
  R: Object.freeze({ assetId: 'GFX_VFX_R', slot: 'gacha-vfx', subjectId: 'R', edgeMask: false }),
  Epic: Object.freeze({ assetId: 'VFX_REVEAL_EPIC', slot: 'gacha-vfx', subjectId: 'Epic', edgeMask: false }),
  EX: Object.freeze({
    assetId: 'VFX_REVEAL_EX',
    slot: 'gacha-vfx',
    subjectId: 'EX',
    edgeMask: true,
    maskAssetId: 'GFX_EDGE_MASK_EX',
  }),
  FAC: Object.freeze({ assetId: 'GFX_VFX_FAC', slot: 'gacha-vfx', subjectId: 'FAC', edgeMask: false }),
});

export function withGachaFragment(manifest) {
  const assets = [...(manifest?.assets ?? [])];
  const seen = new Set(assets.map((asset) => asset.asset_id));
  for (const asset of fragment.assets ?? []) {
    if (!seen.has(asset.asset_id)) {
      assets.push(asset);
      seen.add(asset.asset_id);
    }
  }
  return { ...(manifest ?? {}), assets };
}

function findListed(manifest, query) {
  return (manifest?.assets ?? []).find((asset) => {
    if (query.assetId && asset.asset_id !== query.assetId) return false;
    if (query.slot && asset.slot !== query.slot) return false;
    if (Object.prototype.hasOwnProperty.call(query, 'subjectId') && asset.subject_id !== query.subjectId) return false;
    return true;
  }) ?? null;
}

export function vfxSpec(rarity) {
  return RARITY_VFX[rarity] ?? null;
}

export function presentationFor(rarity, manifest) {
  const spec = vfxSpec(rarity);
  if (!spec) return { spec: null, plate: null, mask: null, edgeMask: false, blend: null };
  const plate = findListed(manifest, { assetId: spec.assetId })
    ?? findListed(manifest, { slot: spec.slot, subjectId: spec.subjectId });
  const mask = spec.edgeMask
    ? (findListed(manifest, { assetId: spec.maskAssetId })
      ?? findListed(manifest, { slot: 'gacha-mask', subjectId: 'EX' }))
    : null;
  return {
    spec,
    plate,
    mask,
    edgeMask: spec.edgeMask === true,
    blend: plate?.presentation?.blend ?? null,
  };
}
