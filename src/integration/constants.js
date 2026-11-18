/** Pinned inputs for the art/systems contract audit. */

export const ART_BRANCH = 'feat/card-art-prototype-mira';
export const ART_COMMIT = 'd65c89dc87a9554d5611a108146b509c7aa7fcf0';
export const ART_REF = `origin/${ART_BRANCH}`;
export const ART_PR = 1;

export const SYSTEMS_BRANCH = 'feat/card-systems-cursor';
export const SYSTEMS_BASE = 'dba87d708f456f9059f9df3da3cb6f3e219795cd';
export const SYSTEMS_PR = 2;

export const INTEGRATION_BRANCH = 'integration/art-systems-contract';

/** Rect names the loader reads from frame_layout.json. */
export const FRAME_RECT_NAMES = Object.freeze([
  'art_window',
  'faction_emblem',
  'rarity',
  'name',
  'stat_pow',
  'stat_def',
  'stat_spd',
]);

/** JSON the audit reads from the art commit. Paths stay repo-relative. */
export const ART_JSON = Object.freeze({
  manifest: 'docs/ASSET_MANIFEST.json',
  frameLayout: 'assets/card-art/frames/frame_layout.json',
  rigs: Object.freeze([
    'assets/characters/_rigs/humanoid_heavy.json',
    'assets/characters/_rigs/humanoid_standard.json',
  ]),
  items: Object.freeze([
    'assets/characters/AVT_AEG_001/equipment/items.json',
    'assets/characters/AVT_PHA_001/equipment/items.json',
    'assets/characters/AVT_CEL_001/equipment/items.json',
    'assets/characters/AVT_SAN_001/equipment/items.json',
    'assets/equipment/shared_items.json',
  ]),
  animation: 'assets/animations/ANIM_SHARED_001.json',
  vfx: 'assets/vfx/vfx.json',
  legacyReference: 'assets/reference/asset_manifest.json',
});

export const CHARACTER_LINE_SEPARATOR = ' · ';

/** Repo-relative roots accepted on manifest paths. */
export const PATH_ROOTS = Object.freeze([
  'assets/card-art/',
  'assets/characters/',
  'assets/equipment/',
  'assets/animations/',
  'assets/vfx/',
  'assets/reference/',
  'preview/',
]);
