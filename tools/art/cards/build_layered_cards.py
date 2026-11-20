#!/usr/bin/env python3
"""Build Agent A card layers from keyed originals.

Reads the painterly sources (magenta subjects/icons, black-window frames),
writes transparent PNG originals under art-src/cards and mobile WebP under
web/assets/cards, then rewrites web/manifests/cards.json at GENERATED_REVIEW.

Names, rarities, costs, and factions are checked against content/v05.
This script does not edit combat data or web/assets-manifest.json.
"""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
SRC = Path('/opt/cursor/artifacts/assets')
ART = ROOT / 'art-src' / 'cards'
WEB = ROOT / 'web' / 'assets' / 'cards'
MANIFEST_PATH = ROOT / 'web' / 'manifests' / 'cards.json'
CONTENT_ACTIONS = ROOT / 'content' / 'v05' / 'actions' / 'starter-actions.json'
CONTENT_DECK = ROOT / 'content' / 'v05' / 'decks' / 'demo-mixed-deck.json'

SUBJECT_BOX = (600, 800)
FRAME_BOX = (576, 768)
ICON_BOX = 160
WEBP_BUDGET = {'subject': 100 * 1024, 'frame': 90 * 1024, 'icon': 22 * 1024, 'interior': 70 * 1024}

# Published v05 rows. The build refuses to run if content/v05 disagrees.
CARDS = {
    'ACT_GEN_ATK_001': ('act-gen-atk-001-pilot.jpg', 'Placeholder Jab', 'ATK', 'N', 1, None),
    'ACT_GEN_ATK_002': ('act-gen-atk-002-src.jpg', 'Placeholder Smash', 'ATK', 'R', 2, None),
    'ACT_GEN_DEF_001': ('act-gen-def-001-src.jpg', 'Placeholder Guard', 'DEF', 'N', 1, None),
    'ACT_GEN_DEF_002': ('act-gen-def-002-src.jpg', 'Placeholder Bulwark', 'DEF', 'R', 2, None),
    'ACT_GEN_SKILL_001': ('act-gen-skill-001-src.jpg', 'Placeholder Spark', 'Skill', 'N', 1, None),
    'ACT_GEN_SKILL_002': ('act-gen-skill-002-src.jpg', 'Placeholder Anthem', 'Skill', 'Epic', 2, None),
    'ACT_FAC_AEG_001': ('act-fac-aeg-001-src.jpg', 'Placeholder Aegis Wall', 'DEF', 'FAC', 1, 'FAC_AEG'),
    'ACT_FAC_AEG_002': ('act-fac-aeg-002-src.jpg', 'Placeholder Aegis Taunt', 'Skill', 'FAC', 2, 'FAC_AEG'),
    'ACT_FAC_PHA_001': ('act-fac-pha-001-src.jpg', 'Placeholder Phantom Cut', 'ATK', 'FAC', 1, 'FAC_PHA'),
    'ACT_FAC_PHA_002': ('act-fac-pha-002-src.jpg', 'Placeholder Phantom Rush', 'Skill', 'FAC', 2, 'FAC_PHA'),
    'ACT_FAC_CEL_001': ('act-fac-cel-001-src.jpg', 'Placeholder Star Bolt', 'ATK', 'FAC', 1, 'FAC_CEL'),
    'ACT_FAC_CEL_002': ('act-fac-cel-002-src.jpg', 'Placeholder Arcane Poke', 'Skill', 'FAC', 2, 'FAC_CEL'),
    'ACT_FAC_SAN_001': ('act-fac-san-001-src.jpg', 'Placeholder Saving Ping', 'Skill', 'FAC', 1, 'FAC_SAN'),
    'ACT_FAC_SAN_002': ('act-fac-san-002-src.jpg', 'Placeholder Sanctuary Ward', 'DEF', 'FAC', 2, 'FAC_SAN'),
}

FRAMES = {
    'N': 'frame-n-pilot.jpg',
    'R': 'frame-r-src.jpg',
    'Epic': 'frame-epic-src.jpg',
    'EX': 'frame-ex-src.jpg',
    'FAC': 'frame-fac-src.jpg',
}

ICONS = {
    'CARD_STAT_SPD': ('icon-spd-src.jpg', 'stat-icon', 'statSpd', 'spd', None),
    'CARD_ICON_AP': ('icon-ap-src.jpg', 'ui-icon', 'apCost', 'ap', None),
    'CARD_BADGE_FAC_AEG': ('badge-aeg-src.jpg', 'faction-badge', 'factionBadge', 'FAC_AEG', None),
    'CARD_BADGE_FAC_PHA': ('badge-pha-src.jpg', 'faction-badge', 'factionBadge', 'FAC_PHA', None),
    'CARD_BADGE_FAC_CEL': ('badge-cel-src.jpg', 'faction-badge', 'factionBadge', 'FAC_CEL', None),
    'CARD_BADGE_FAC_SAN': ('badge-san-src.jpg', 'faction-badge', 'factionBadge', 'FAC_SAN', None),
    'CARD_BADGE_GENERIC': ('badge-generic-src.jpg', 'faction-badge', 'factionBadge', 'generic', None),
}


def dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def flood_clear(im, seeds, limit):
    w, h = im.size
    pix = im.load()
    refs = [pix[x, y][:3] for x, y in seeds]
    seen = bytearray(w * h)
    stack = list(seeds)
    removed = 0
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        r, g, b, a = pix[x, y]
        if a == 0 or min(dist((r, g, b), ref) for ref in refs) > limit:
            continue
        pix[x, y] = (r, g, b, 0)
        removed += 1
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return removed


def key_magenta(path):
    rgb = Image.open(path).convert('RGB')
    im = rgb.convert('RGBA')
    w, h = im.size
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2), (w - 1, h // 2), (w // 2, h - 1)]
    flood_clear(im, seeds, 52)
    pix = im.load()
    # Enclosed backdrop and JPEG fringe. Skin and cloth sit well outside this gate.
    for y in range(h):
        row_clear = False
        for x in range(w):
            r, g, b, a = pix[x, y]
            if a == 0:
                row_clear = True
                continue
            strong = g < 55 and r > 165 and b > 95 and r > g + 90 and b > g + 40
            fringe = row_clear and g < 70 and r > 150 and b > 80 and (r + b) > g * 3
            if strong or fringe:
                pix[x, y] = (r, g, b, 0)
                row_clear = True
            else:
                row_clear = False
    opaque = sum(1 for y in range(0, h, 3) for x in range(0, w, 3) if pix[x, y][3] > 16)
    if opaque < 8000:
        raise SystemExit(f'{path} keyed away too much of the subject ({opaque} samples)')
    return im


def clear_dark_sockets(im):
    w, h = im.size
    pix = im.load()
    seen = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i]:
                continue
            r, g, b, a = pix[x, y]
            if a == 0 or max(r, g, b) > 48:
                seen[i] = 1
                continue
            q = deque([(x, y)])
            seen[i] = 1
            cells = []
            while q:
                cx, cy = q.popleft()
                cells.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    j = ny * w + nx
                    if seen[j]:
                        continue
                    rr, gg, bb, aa = pix[nx, ny]
                    if aa and max(rr, gg, bb) <= 48:
                        seen[j] = 1
                        q.append((nx, ny))
                    else:
                        seen[j] = 1
            if not (400 <= len(cells) <= 9000):
                continue
            xs = [c[0] for c in cells]
            ys = [c[1] for c in cells]
            bw, bh = max(xs) - min(xs), max(ys) - min(ys)
            if bw > 280 or bh > 240 or bw * bh > w * h * 0.2:
                continue
            for cx, cy in cells:
                pix[cx, cy] = (0, 0, 0, 0)


def key_frame(path):
    rgb = Image.open(path).convert('RGB')
    im = rgb.convert('RGBA')
    w, h = im.size
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (8, 8), (w - 9, 8), (8, h - 9), (w - 9, h - 9)]
    flood_clear(im, seeds, 28)
    pix = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if a and max(r, g, b) <= 16:
                pix[x, y] = (0, 0, 0, 0)
    clear_dark_sockets(im)
    return im


def components(im, transparent=True):
    w, h = im.size
    pix = im.load()
    seen = bytearray(w * h)
    found = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i]:
                continue
            r, g, b, a = pix[x, y]
            hole = a == 0
            if hole != transparent:
                seen[i] = 1
                continue
            q = deque([(x, y)])
            seen[i] = 1
            cells = 0
            minx = maxx = x
            miny = maxy = y
            touches = x == 0 or y == 0 or x == w - 1 or y == h - 1
            while q:
                cx, cy = q.popleft()
                cells += 1
                minx, maxx = min(minx, cx), max(maxx, cx)
                miny, maxy = min(miny, cy), max(maxy, cy)
                if cx == 0 or cy == 0 or cx == w - 1 or cy == h - 1:
                    touches = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    j = ny * w + nx
                    if seen[j]:
                        continue
                    aa = pix[nx, ny][3]
                    if (aa == 0) == transparent:
                        seen[j] = 1
                        q.append((nx, ny))
                    else:
                        seen[j] = 1
            found.append({'cells': cells, 'touches': touches, 'x': minx, 'y': miny, 'w': maxx - minx + 1, 'h': maxy - miny + 1})
    return found


def measure_windows(im):
    w, h = im.size
    holes = [c for c in components(im, True) if not c['touches'] and c['cells'] > 800]
    if len(holes) < 3:
        raise SystemExit(f'frame has {len(holes)} interior windows, expected at least 3')
    art = max(holes, key=lambda c: c['cells'])
    upper = [c for c in holes if (c['y'] + c['h'] / 2) < h * 0.28 and c is not art and c['w'] > w * 0.25]
    lower = [c for c in holes if (c['y'] + c['h'] / 2) > h * 0.68 and c is not art and c['w'] > w * 0.25]
    if not upper or not lower:
        raise SystemExit(f'could not classify title/body windows in {[(c["x"], c["y"], c["w"], c["h"]) for c in holes]}')
    title = max(upper, key=lambda c: c['cells'])
    body = max(lower, key=lambda c: c['cells'])

    def box(c, pad):
        x = c['x'] + pad
        y = c['y'] + pad
        ww = max(8, c['w'] - pad * 2)
        hh = max(8, c['h'] - pad * 2)
        return {'x': int(x), 'y': int(y), 'w': int(ww), 'h': int(hh)}

    return {'art': box(art, 6), 'title': box(title, 4), 'body': box(body, 4)}


def save_webp(im, path, budget, quality=78):
    fitted = im.copy()
    q = quality
    while True:
        fitted.save(path, 'WEBP', quality=q, method=6)
        size = path.stat().st_size
        if size <= budget or q <= 50:
            if size > budget:
                raise SystemExit(f'{path} is {size} bytes, over budget {budget}')
            return size
        q -= 6


def save_png(im, path):
    im.save(path, 'PNG', optimize=True)
    return path.stat().st_size


def parchment(size):
    base = Image.new('RGB', (1, 2))
    base.putpixel((0, 0), (248, 239, 220))
    base.putpixel((0, 1), (226, 205, 174))
    im = base.resize(size, Image.Resampling.BICUBIC).convert('RGBA')
    return im


SLOT_TYPE = {
    'illustration': 'illustration',
    'frame': 'card_frame',
    'stat-icon': 'stat_icon',
    'type-icon': 'type_icon',
    'ui-icon': 'ui_icon',
    'faction-badge': 'faction_badge',
    'card-interior': 'card_interior',
}


def entry(asset_id, slot, anchor, subject_id, rarity, web_path, source_path, web_bytes, source_bytes, kind):
    # Asset status stays CONCEPT: src/schema/validate.js only allows
    # CONCEPT, PROTOTYPE, QA_PASSED, PRODUCTION_READY, INTEGRATED.
    # Review state for this stream is review_status GENERATED_REVIEW.
    return {
        'asset_id': asset_id,
        'slot': slot,
        'anchor': anchor,
        'subject_id': subject_id,
        'rarity': rarity,
        'status': 'CONCEPT',
        'review_status': 'GENERATED_REVIEW',
        'type': SLOT_TYPE[slot],
        'owner': 'a-card-art',
        'path': web_path.relative_to(ROOT).as_posix(),
        'source_path': source_path.relative_to(ROOT).as_posix(),
        'bytes': web_bytes,
        'source_bytes': source_bytes,
        'placeholder': False,
        'kind': kind,
        'presentation': {'objectFit': 'contain' if kind == 'subject' else 'fill', 'objectPosition': 'center'},
    }


def assert_content():
    actions = {row['cardId']: row for row in json.loads(CONTENT_ACTIONS.read_text())['actionCards']}
    deck = json.loads(CONTENT_DECK.read_text())['deck']
    if deck['deckId'] != 'DECK_DEMO_MIXED_001' or len(deck['cardIds']) != 30:
        raise SystemExit('demo mixed deck is no longer the 30-card starter')
    unknown = [card_id for card_id in deck['cardIds'] if card_id not in CARDS]
    if unknown:
        raise SystemExit(f'deck contains cards this factory does not know: {unknown}')
    for card_id, (_file, name, kind, rarity, ap, faction) in CARDS.items():
        row = actions[card_id]
        if row['name'] != name or row['actionType'] != kind or row['rarity'] != rarity or row['apCost'] != ap:
            raise SystemExit(f'content drifted for {card_id}')
        if (row.get('Faction_Requirement') or None) != faction:
            raise SystemExit(f'faction drifted for {card_id}')
    return deck['cardIds']


def main():
    card_ids = assert_content()
    for folder in (ART / 'subjects', ART / 'frames', ART / 'icons', ART / 'interior', WEB / 'subjects', WEB / 'frames', WEB / 'icons', WEB / 'interior'):
        folder.mkdir(parents=True, exist_ok=True)

    assets = []
    insets = {}
    counts = {'subject': 0, 'frame': 0, 'icon': 0, 'interior': 0}
    shipped = 0
    originals = 0

    interior = parchment(FRAME_BOX)
    # Original is the unscaled parchment master at frame source aspect.
    interior_master = parchment((864, 1152))
    src_png = ART / 'interior' / 'CARD_INTERIOR.png'
    web_path = WEB / 'interior' / 'CARD_INTERIOR.webp'
    source_bytes = save_png(interior_master, src_png)
    web_bytes = save_webp(interior, web_path, WEBP_BUDGET['interior'], 80)
    assets.append(entry('CARD_PARCHMENT', 'card-interior', 'interior', 'neutral', None, web_path, src_png, web_bytes, source_bytes, 'interior'))
    counts['interior'] += 1
    shipped += web_bytes
    originals += source_bytes

    for card_id, (filename, _name, _kind, rarity, _ap, _faction) in CARDS.items():
        im = key_magenta(SRC / filename)
        src_png = ART / 'subjects' / f'{card_id}.png'
        web_path = WEB / 'subjects' / f'{card_id}.webp'
        source_bytes = save_png(im, src_png)
        web_bytes = save_webp(im.resize(SUBJECT_BOX, Image.Resampling.LANCZOS), web_path, WEBP_BUDGET['subject'])
        assets.append(entry(f'CARD_SUBJECT_{card_id}', 'illustration', 'illustration', card_id, rarity, web_path, src_png, web_bytes, source_bytes, 'subject'))
        counts['subject'] += 1
        shipped += web_bytes
        originals += source_bytes

    for rarity, filename in FRAMES.items():
        im = key_frame(SRC / filename)
        windows = measure_windows(im)
        src_png = ART / 'frames' / f'FRAME_{rarity}.png'
        web_path = WEB / 'frames' / f'FRAME_{rarity}.webp'
        source_bytes = save_png(im, src_png)
        fitted = im.resize(FRAME_BOX, Image.Resampling.LANCZOS)
        web_bytes = save_webp(fitted, web_path, WEBP_BUDGET['frame'])
        slug = 'EPIC' if rarity == 'Epic' else rarity
        assets.append(entry(f'CARD_FRAME_{slug}', 'frame', 'frame', None, rarity, web_path, src_png, web_bytes, source_bytes, 'frame'))
        scale_x = FRAME_BOX[0] / im.size[0]
        scale_y = FRAME_BOX[1] / im.size[1]
        insets[rarity] = {
            name: {
                'x': round(box['x'] * scale_x),
                'y': round(box['y'] * scale_y),
                'w': round(box['w'] * scale_x),
                'h': round(box['h'] * scale_y),
            }
            for name, box in windows.items()
        }
        counts['frame'] += 1
        shipped += web_bytes
        originals += source_bytes

    for asset_id, (filename, slot, anchor, subject_id, rarity) in ICONS.items():
        im = key_magenta(SRC / filename)
        src_png = ART / 'icons' / f'{asset_id}.png'
        web_path = WEB / 'icons' / f'{asset_id}.webp'
        source_bytes = save_png(im, src_png)
        side = ICON_BOX
        web_bytes = save_webp(im.resize((side, side), Image.Resampling.LANCZOS), web_path, WEBP_BUDGET['icon'], 82)
        assets.append(entry(asset_id, slot, anchor, subject_id, rarity, web_path, src_png, web_bytes, source_bytes, 'icon'))
        counts['icon'] += 1
        shipped += web_bytes
        originals += source_bytes

    # Existing painterly stat/skill icons stay. They are referenced, not redrawn.
    borrowed = [
        ('CARD_STAT_ATK', 'stat-icon', 'statAtk', 'atk', 'web/assets/generated/icons/STAT_ICON_ATK.webp'),
        ('CARD_STAT_DEF', 'stat-icon', 'statDef', 'def', 'web/assets/generated/icons/STAT_ICON_DEF.webp'),
        ('CARD_TYPE_ATK', 'type-icon', 'typeIcon', 'ATK', 'web/assets/generated/icons/STAT_ICON_ATK.webp'),
        ('CARD_TYPE_DEF', 'type-icon', 'typeIcon', 'DEF', 'web/assets/generated/icons/STAT_ICON_DEF.webp'),
        ('CARD_TYPE_SKILL', 'type-icon', 'typeIcon', 'Skill', 'web/assets/generated/icons/TYPE_ICON_SKILL.webp'),
    ]
    for asset_id, slot, anchor, subject_id, rel in borrowed:
        file_bytes = (ROOT / rel).stat().st_size
        assets.append({
            'asset_id': asset_id,
            'slot': slot,
            'anchor': anchor,
            'subject_id': subject_id,
            'rarity': None,
            'status': 'CONCEPT',
            'review_status': 'GENERATED_REVIEW',
            'type': SLOT_TYPE[slot],
            'owner': 'a-card-art',
            'path': rel,
            'source_path': rel,
            'bytes': file_bytes,
            'source_bytes': file_bytes,
            'placeholder': False,
            'kind': 'icon',
            'borrowed': True,
            'presentation': {'objectFit': 'contain', 'objectPosition': 'center'},
        })

    manifest = {
        'manifest_version': 1,
        'stream': 'a-card-art',
        'project': 'Comedy Fantasy Card Game',
        'status': 'GENERATED_REVIEW',
        'productionReady': False,
        'note': 'Editable Agent A fragment. Integration merges this file. Do not treat it as OWNER_APPROVED.',
        'deck': {
            'deckId': 'DECK_DEMO_MIXED_001',
            'source': 'content/v05/decks/demo-mixed-deck.json',
            'slots': 30,
            'uniqueCardIds': list(CARDS),
            'cardIds': card_ids,
            'derivation': 'The published starter is DECK_DEMO_MIXED_001, exactly 30 action-card slots. CORE-040 is pending, so the 30 slots are 14 unique card ids with legal duplicates. Illustrations are one subject per card id.',
        },
        'frameInsets': {
            'masterWidth': FRAME_BOX[0],
            'masterHeight': FRAME_BOX[1],
            'status': 'MEASURED',
            'note': 'Transparent windows measured on the Agent A frames after the black matte was removed. Text stays HTML.',
            'byRarity': insets,
        },
        'budgets': {key: value for key, value in WEBP_BUDGET.items()},
        'bytes': {'shippedWebp': shipped, 'originalPng': originals},
        'counts': counts,
        'assets': assets,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'counts': counts, 'shippedWebp': shipped, 'originalPng': originals, 'assets': len(assets)}, indent=2))


if __name__ == '__main__':
    main()
