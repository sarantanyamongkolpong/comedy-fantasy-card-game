#!/usr/bin/env python3
"""Build mobile-sized WebP copies from Dream's art drop.

Source (not committed):
  git fetch origin art/dream-v01-drop
  git checkout origin/art/dream-v01-drop -- art_source/dream_v01
  git reset -q HEAD -- art_source

Then, from the repo root:
  python3 web/tools/build-assets.py

Requires Pillow with WebP. Does not edit art_source/.
Raw PNGs are not copied into web/.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from statistics import median

try:
    from PIL import Image
except ImportError:
    sys.stderr.write('Pillow is required: python3 -m pip install --user pillow\n')
    sys.exit(1)

REPO = Path(__file__).resolve().parents[2]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO / 'art_source' / 'dream_v01'
MANIFEST_PATH = REPO / 'web' / 'assets-manifest.json'
SOURCE_COMMIT = '0c063ca176f3b7f8ee329f47c03714b9410966c3'
REVIEW = 'GENERATED_REVIEW'

AVATARS = [
    ('AVT_AEG_002', 'avatars/justin_case_battle.png'),
    ('AVT_PHA_002', 'avatars/justin_time_battle.png'),
    ('AVT_CEL_002', 'avatars/justin_theory_battle.png'),
    ('AVT_SAN_002', 'avatars/justina_moment_battle.png'),
]
SPRITES = [
    ('SPRITE_AVT_AEG_002', 'AVT_AEG_002'),
    ('SPRITE_AVT_PHA_002', 'AVT_PHA_002'),
    ('SPRITE_AVT_CEL_002', 'AVT_CEL_002'),
    ('SPRITE_AVT_SAN_002', 'AVT_SAN_002'),
]
FRAMES = [
    ('FRAME_N', 'N', 'card_ui/frame_n.png'),
    ('FRAME_R', 'R', 'card_ui/frame_r.png'),
    ('FRAME_EPIC', 'Epic', 'card_ui/frame_epic.png'),
    ('FRAME_EX', 'EX', 'card_ui/frame_ex.png'),
    ('FRAME_FAC', 'FAC', 'card_ui/frame_fac.png'),
]
SITES = {
    'home': {'asset_id': 'MAP_BLD_HIDEOUT', 'action': 'home', 'label': 'Hideout'},
    'tower': {'asset_id': 'MAP_BLD_TOWER', 'action': 'battle', 'mode': 'tower', 'label': 'Mysterious Tower'},
    'sports': {'asset_id': 'MAP_BLD_SPORTS', 'action': 'locked', 'locked': True, 'label': 'Sports Complex'},
    'arena': {'asset_id': 'MAP_BLD_ARENA', 'action': 'battle', 'mode': 'arena', 'label': 'Tournament Arena'},
    'mall': {'asset_id': 'MAP_BLD_MALL', 'action': 'mall', 'label': 'Shopping Mall'},
    'gachapon': {'asset_id': 'MAP_BLD_GACHA', 'action': 'gacha', 'label': 'Gachapon'},
}


def save_webp(src: Path, dest: Path, size: tuple[int, int] | None, quality: int) -> int:
    image = Image.open(src).convert('RGBA')
    if size:
        image.thumbnail(size, Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, 'WEBP', quality=quality, method=6, alpha_quality=90)
    return dest.stat().st_size


def windows(path: Path) -> list[dict]:
    image = Image.open(path).convert('RGBA')
    width, height = image.size
    pixels = image.load()
    bands = []
    current = None
    for y in range(height):
        best = None
        x = 0
        while x < width:
            if pixels[x, y][3] < 24:
                end = x
                while end < width and pixels[end, y][3] < 24:
                    end += 1
                if end - x > width * 0.35 and (best is None or end - x > best[2] - best[1]):
                    best = (y, x, end)
                x = end
            else:
                x += 1
        if best and best[1] < width * 0.5 < best[2]:
            if current and abs(current['l'] - best[1]) < 30 and abs(current['r'] - best[2]) < 30 and y == current['y1'] + 1:
                current['y1'] = y
                current['l'] = min(current['l'], best[1])
                current['r'] = max(current['r'], best[2])
            else:
                if current and current['y1'] - current['y0'] > 40:
                    bands.append(current)
                current = {'y0': y, 'y1': y, 'l': best[1], 'r': best[2]}
        elif current:
            if current['y1'] - current['y0'] > 40:
                bands.append(current)
            current = None
    if current and current['y1'] - current['y0'] > 40:
        bands.append(current)
    return [{
        'x': band['l'],
        'y': band['y0'],
        'w': band['r'] - band['l'],
        'h': band['y1'] - band['y0'],
    } for band in bands]


def classify(bands: list[dict]) -> dict:
    ordered = sorted(bands, key=lambda band: band['h'], reverse=True)
    art = ordered[0]
    rest = [band for band in bands if band is not art]
    title = min(rest, key=lambda band: band['y']) if rest else art
    body_candidates = [band for band in rest if band is not title]
    body = max(body_candidates, key=lambda band: band['h']) if body_candidates else title
    return {'art': art, 'title': title, 'body': body}


def retarget(asset: dict, new_path: str, source_file: str) -> None:
    current = asset.get('path')
    if not asset.get('fallback_path') and isinstance(current, str) and current.endswith('.svg') and current != new_path:
        asset['fallback_path'] = current
    asset['path'] = new_path
    asset['placeholder'] = False
    asset['review_status'] = REVIEW
    asset['status'] = 'CONCEPT'
    asset['source_commit'] = SOURCE_COMMIT
    asset['source_file'] = source_file


def find(manifest: dict, asset_id: str) -> dict:
    for asset in manifest['assets']:
        if asset['asset_id'] == asset_id:
            return asset
    raise SystemExit(f'missing asset_id {asset_id}')


def main() -> None:
    if not (SOURCE / 'ASSET_MANIFEST.json').is_file():
        sys.stderr.write(
            'Dream art drop not found.\n'
            '  git fetch origin art/dream-v01-drop\n'
            '  git checkout origin/art/dream-v01-drop -- art_source/dream_v01\n'
            '  git reset -q HEAD -- art_source\n'
            '  python3 web/tools/build-assets.py\n'
            'Do not commit art_source/.\n'
        )
        sys.exit(1)
    manifest = json.loads(MANIFEST_PATH.read_text())
    report = []

    def emit(asset_id: str, source_rel: str, dest_rel: str, size, quality: int) -> None:
        nbytes = save_webp(SOURCE / source_rel, REPO / dest_rel, size, quality)
        report.append({'asset_id': asset_id, 'path': dest_rel, 'bytes': nbytes, 'source': source_rel})
        print(f'{nbytes:8d}  {dest_rel}')

    avatar_path = {}
    for asset_id, source_rel in AVATARS:
        dest = f'web/assets/generated/avatars/{asset_id}.webp'
        emit(asset_id, source_rel, dest, (4096, 512), 78)
        avatar_path[asset_id] = (dest, source_rel)
        retarget(find(manifest, asset_id), dest, source_rel)
    for sprite_id, avatar_id in SPRITES:
        dest, source_rel = avatar_path[avatar_id]
        retarget(find(manifest, sprite_id), dest, source_rel)

    by_rarity = {}
    for asset_id, rarity, source_rel in FRAMES:
        dest = f'web/assets/generated/frames/{asset_id}.webp'
        emit(asset_id, source_rel, dest, (512, 768), 82)
        retarget(find(manifest, asset_id), dest, source_rel)
        bands = windows(SOURCE / source_rel)
        by_rarity[rarity] = classify(bands)
    manifest['frameInsets'] = {
        'masterWidth': 1024,
        'masterHeight': 1536,
        'status': 'MEASURED',
        'note': 'Per-frame transparent windows measured from each rarity PNG. Borders are not interchangeable.',
        'byRarity': by_rarity,
    }

    interior_dest = 'web/assets/generated/frames/CARD_INTERIOR.webp'
    emit('CARD_INTERIOR', 'card_ui/card_interior_neutral.png', interior_dest, (512, 768), 76)
    upsert_interior(manifest, interior_dest)

    for asset_id, source_rel, dest_name in (
        ('STAT_ICON_ATK', 'card_ui/icon_atk.png', 'STAT_ICON_ATK.webp'),
        ('STAT_ICON_DEF', 'card_ui/icon_def.png', 'STAT_ICON_DEF.webp'),
    ):
        dest = f'web/assets/generated/icons/{dest_name}'
        emit(asset_id, source_rel, dest, (160, 160), 82)
        retarget(find(manifest, asset_id), dest, source_rel)
    skill_dest = 'web/assets/generated/icons/TYPE_ICON_SKILL.webp'
    emit('TYPE_ICON_SKILL', 'card_ui/icon_skill.png', skill_dest, (160, 160), 82)
    upsert_skill(manifest, skill_dest)

    map_dest = 'web/assets/generated/map/BG_MAP.webp'
    emit('BG_MAP', 'world/world_map_base_16x9.png', map_dest, (1672, 941), 76)
    retarget(find(manifest, 'BG_MAP'), map_dest, 'world/world_map_base_16x9.png')

    placement = json.loads((SOURCE / 'world' / 'WORLD_MAP_PLACEMENT_PROPOSED.json').read_text())
    manifest['designCanvas'] = {
        'id': '1672x941',
        'width': placement['canvas']['width'],
        'height': placement['canvas']['height'],
        'aspect': placement['canvas']['aspect_ratio'],
        'scale': 'min(viewportWidth / 1672, viewportHeight / 941)',
    }
    manifest['mapPlacement'] = {
        'status': 'PROPOSED',
        'anchorMode': 'bottom-center',
        'transform': 'translate(-50%, -100%)',
        'source': 'art_source/dream_v01/world/WORLD_MAP_PLACEMENT_PROPOSED.json',
        'note': placement['anchor_rule'],
    }
    manifest['uiAnchors'] = [
        {'id': 'map-title', 'x': 24, 'y': 12, 'w': 640, 'h': 88},
        {'id': 'map-back', 'x': 1476, 'y': 808, 'w': 176, 'h': 116},
    ]
    by_site = {site['id']: site for site in placement['sites']}
    for site_id, meta in SITES.items():
        site = by_site[site_id]
        dest = f"web/assets/generated/buildings/{meta['asset_id']}.webp"
        emit(meta['asset_id'], f"world/{site['asset']}", dest, (512, 512), 80)
        asset = find(manifest, meta['asset_id'])
        retarget(asset, dest, f"world/{site['asset']}")
        hotspot = {
            'id': meta['asset_id'].replace('MAP_BLD_', '').lower(),
            'label': meta['label'],
            'action': meta['action'],
            'anchorMode': 'bottom-center',
            'transform': 'translate(-50%, -100%)',
            'anchorX': site['bottom_anchor_px']['x'],
            'anchorY': site['bottom_anchor_px']['y'],
            'targetWidth': site['target_width_master_px'],
            'targetHeight': site['target_width_master_px'],
            'placementStatus': 'PROPOSED',
            'siteId': site_id,
        }
        if meta.get('mode'):
            hotspot['mode'] = meta['mode']
        if meta.get('locked'):
            hotspot['locked'] = True
        # Keep a stable id the UI already branches on.
        hotspot['id'] = {
            'home': 'hideout',
            'tower': 'tower',
            'sports': 'sports',
            'arena': 'arena',
            'mall': 'mall',
            'gachapon': 'gacha',
        }[site_id]
        asset['hotspot'] = hotspot

    manifest['artDrop'] = {
        'branch': 'art/dream-v01-drop',
        'commit': SOURCE_COMMIT,
        'review_status': REVIEW,
        'productionReady': False,
        'note': (
            'Optimized derivatives for review. The official asset status enum has no GENERATED_REVIEW value yet, '
            'so status stays CONCEPT (not production) and review_status is GENERATED_REVIEW. '
            'Reference-card PNGs are not registered.'
        ),
    }
    manifest['referenceOnly']['dreamDrop'] = {
        'commit': SOURCE_COMMIT,
        'files': [
            'art_source/dream_v01/reference_cards/justin_case_approved_card.png',
            'art_source/dream_v01/reference_cards/justin_time_approved_card.png',
            'art_source/dream_v01/reference_cards/justin_theory_approved_card.png',
            'art_source/dream_v01/reference_cards/justina_moment_approved_card.png',
        ],
        'note': 'APPROVED reference only. Not copied into web/ and not used as card faces.',
    }
    build_mira_backgrounds(manifest)
    manifest['productionReady'] = False
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + '\n')
    total = sum(item['bytes'] for item in report)
    summary = {'sourceCommit': SOURCE_COMMIT, 'totalBytes': total, 'files': report, 'frameInsets': by_rarity}
    report_path = REPO / 'web' / 'assets' / 'generated' / 'BUILD_REPORT.json'
    report_path.write_text(json.dumps(summary, indent=2) + '\n')
    print(f'TOTAL {total} bytes ({total / 1024 / 1024:.2f} MiB)')


def upsert_interior(manifest: dict, dest: str) -> None:
    existing = next((asset for asset in manifest['assets'] if asset['asset_id'] == 'CARD_INTERIOR'), None)
    entry = existing or {
        'asset_id': 'CARD_INTERIOR',
        'type': 'card_interior',
        'owner': 'web-ui',
        'slot': 'card-interior',
        'layer': 'card-interior',
        'anchor': 'interior',
        'rarity': None,
        'subject_id': 'neutral',
    }
    entry.update({
        'path': dest,
        'placeholder': False,
        'review_status': REVIEW,
        'status': 'CONCEPT',
        'source_commit': SOURCE_COMMIT,
        'source_file': 'card_ui/card_interior_neutral.png',
    })
    if existing is None:
        manifest['assets'].append(entry)


def upsert_skill(manifest: dict, dest: str) -> None:
    existing = next((asset for asset in manifest['assets'] if asset['asset_id'] == 'TYPE_ICON_SKILL'), None)
    entry = existing or {
        'asset_id': 'TYPE_ICON_SKILL',
        'type': 'type_icon',
        'owner': 'web-ui',
        'slot': 'type-icon',
        'layer': 'type-icon',
        'anchor': 'factionBadge',
        'rarity': None,
        'subject_id': 'Skill',
    }
    entry.update({
        'path': dest,
        'placeholder': False,
        'review_status': REVIEW,
        'status': 'CONCEPT',
        'source_commit': SOURCE_COMMIT,
        'source_file': 'card_ui/icon_skill.png',
    })
    if existing is None:
        manifest['assets'].append(entry)


MIRA_COMMIT = '1e72dc06c4fcb3320326a1a643b0ee8211d594b4'
MIRA = REPO / 'art_source' / 'mira_v01'

# Tile centres measured on bg_battle_arena_v01.png (1280×720).
# Cyan back row y=336, front row y=456. Magenta is the mirror across x=640.
MEASURED_PLAYER_FEET = [
    {'id': 'p0', 'row': 'back', 'column': 0, 'imageX': 172, 'imageY': 336},
    {'id': 'p1', 'row': 'back', 'column': 4, 'imageX': 550, 'imageY': 336},
    {'id': 'p2', 'row': 'front', 'column': 2, 'imageX': 312, 'imageY': 456},
    {'id': 'p3', 'row': 'front', 'column': 3, 'imageX': 425, 'imageY': 456},
]
MEASURED_ENEMY_FEET = [
    {'id': 'e0', 'row': 'back', 'column': 4, 'imageX': 1108, 'imageY': 336},
    {'id': 'e1', 'row': 'back', 'column': 0, 'imageX': 730, 'imageY': 336},
    {'id': 'e2', 'row': 'front', 'column': 2, 'imageX': 968, 'imageY': 456},
    {'id': 'e3', 'row': 'front', 'column': 1, 'imageX': 855, 'imageY': 456},
]


def build_mira_backgrounds(manifest: dict) -> None:
    """WebP the two Mira arena plates. Does not touch map hotspots."""
    if not MIRA.is_dir():
        print('skip mira backgrounds (art_source/mira_v01 missing)')
        return
    jobs = [
        ('BG_BATTLE', 'bg_battle_arena_v01.png', 'bg-battle', 'battle', 'web/assets/generated/backgrounds/BG_BATTLE.webp', 'web/assets/battle/BG_BATTLE.svg'),
        ('BG_PREP', 'bg_prep_battle_v01.png', 'bg-prep', 'prep', 'web/assets/generated/backgrounds/BG_PREP.webp', None),
    ]
    for asset_id, filename, slot, subject, dest, fallback in jobs:
        src = MIRA / filename
        if not src.exists():
            raise SystemExit(f'missing {src}')
        im = Image.open(src).convert('RGB')
        out = REPO / dest
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out, 'WEBP', quality=76, method=6)
        existing = next((asset for asset in manifest['assets'] if asset['asset_id'] == asset_id), None)
        entry = existing or {
            'asset_id': asset_id,
            'type': 'background',
            'owner': 'web-ui',
            'slot': slot,
            'layer': 'background',
            'anchor': 'stage',
            'rarity': None,
            'subject_id': subject,
        }
        entry.update({
            'path': dest,
            'placeholder': False,
            'review_status': REVIEW,
            'status': 'CONCEPT',
            'source_commit': MIRA_COMMIT,
            'source_file': f'art_source/mira_v01/{filename}',
        })
        if fallback:
            entry['fallback_path'] = fallback
        if existing is None:
            manifest['assets'].append(entry)
        print(f'{asset_id} {out.stat().st_size} bytes')
    manifest['battleTiles'] = {
        'status': 'MEASURED',
        'note': 'Feet sit on baked tile centres in bg_battle_arena_v01. Cyan is the left 2x5, magenta the right 2x5. Four of the ten tiles per side are used so the bodies do not share a column. Visual only, not a movement grid.',
        'sourceFile': 'art_source/mira_v01/bg_battle_arena_v01.png',
        'sourceCommit': MIRA_COMMIT,
        'image': {'width': 1280, 'height': 720},
        'stage': {'width': 1672, 'height': 941},
        'playerFeet': MEASURED_PLAYER_FEET,
        'enemyFeet': MEASURED_ENEMY_FEET,
    }


def main_backgrounds() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text())
    build_mira_backgrounds(manifest)
    manifest['productionReady'] = False
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    if '--backgrounds' in sys.argv:
        main_backgrounds()
    else:
        main()
