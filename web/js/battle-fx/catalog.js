/**
 * Battle UI fragment. Paths stay in the manifest so a file can be replaced
 * without editing this module.
 */

import manifest from '../../manifests/battle-ui.json' with { type: 'json' };

const SUBJECTS = Object.freeze({
  corner: 'frame-corner',
  edgeH: 'frame-edge-h',
  edgeV: 'frame-edge-v',
  gemOn: 'ap-gem-on',
  gemOff: 'ap-gem-off',
  hpTrack: 'hp-track',
  hpShield: 'hp-shield',
  shadow: 'shadow-ground',
  shield: 'vfx-shield',
  buff: 'vfx-buff',
  debuff: 'vfx-debuff',
  rowFront: 'row-front',
  rowBack: 'row-back',
});

export function battleUiUrl(path) {
  const file = String(path ?? '');
  if (!file || file.startsWith('data:')) return file;
  if (!import.meta.url) return '';
  const relative = file.replace(/^web\//, '');
  return new URL(`../../${relative}`, import.meta.url).href;
}

export function battleUiCatalog(source = manifest) {
  const assets = source?.assets ?? [];
  const bySubject = new Map(assets.map((asset) => [asset.subject_id, asset]));
  const urls = {};
  for (const [key, subject] of Object.entries(SUBJECTS)) {
    const asset = bySubject.get(subject);
    urls[key] = asset?.path ? battleUiUrl(asset.path) : '';
  }
  return { manifest: source, urls };
}
