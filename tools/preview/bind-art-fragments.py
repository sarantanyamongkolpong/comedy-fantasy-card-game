"""Preview-only: bind art fragments (A cards, B hideout, F sport) into the runtime manifests.

Run from the repo root: python3 tools/preview/bind-art-fragments.py
- Same asset_id already in web/assets-manifest.json -> path/source fields updated (id stays stable).
- New asset_id -> entry added before existing entries of the same runtime slot, so findAsset() picks it.
- Fragment slots are mapped to runtime slots (house-exterior -> house, house-interior -> bg-hideout).
- F sport art: hub mark and the 4 sport tiles point at F hub/portal art; portraits point at F silhouettes.
Status is never raised: entries keep status CONCEPT/GENERATED_REVIEW, review_status PROVISIONAL_PREVIEW.
"""
import json
import os

RT = 'web/assets-manifest.json'
rt = json.load(open(RT, encoding='utf-8'))
assets = rt['assets']
by_id = {a['asset_id']: a for a in assets}
SLOT_MAP = {'house-exterior': 'house', 'house-interior': 'bg-hideout'}
report = {'updated': [], 'added': [], 'skipped_missing_file': []}


def fragment_entries(path):
    doc = json.load(open(path, encoding='utf-8'))
    for key in ('entries', 'assets'):
        if isinstance(doc.get(key), list):
            return doc[key]
    return next(v for v in doc.values() if isinstance(v, list) and v and isinstance(v[0], dict) and 'asset_id' in v[0])


def bind(entry, source):
    if not os.path.exists(entry['path']):
        report['skipped_missing_file'].append(entry['asset_id'])
        return
    slot = SLOT_MAP.get(entry['slot'], entry['slot'])
    if entry['asset_id'] in by_id:
        cur = by_id[entry['asset_id']]
        cur.update({'path': entry['path'], 'source_path': entry.get('source_path'), 'preview_source': source,
                    'review_status': 'PROVISIONAL_PREVIEW', 'placeholder': False})
        cur.pop('fallback_path', None) if cur.get('fallback_path', '').endswith('PLACEHOLDER.svg') else None
        report['updated'].append(entry['asset_id'])
        return
    new = {k: v for k, v in entry.items() if k not in ('status',)}
    new.update({'slot': slot, 'status': 'CONCEPT', 'review_status': 'PROVISIONAL_PREVIEW', 'preview_source': source,
                'placeholder': False, 'rarity': entry.get('rarity'), 'subject_id': entry.get('subject_id')})
    idx = next((i for i, a in enumerate(assets) if a.get('slot') == slot), len(assets))
    assets.insert(idx, new)
    by_id[new['asset_id']] = new
    report['added'].append(entry['asset_id'])


for e in fragment_entries('web/manifests/cards.json'):
    bind(e, 'prod/a-card-art (#49)')
for e in fragment_entries('web/manifests/hideout.json'):
    bind(e, 'prod/b-hideout (#42)')
json.dump(rt, open(RT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# Sport: web/sport/art-manifest.json `file` is relative to web/sport/.
SP = 'web/sport/art-manifest.json'
sp = json.load(open(SP, encoding='utf-8'))
f = {a['asset_id']: a for a in fragment_entries('web/manifests/sport.json')}
f_by_subject = {a['subject_id']: a for a in f.values() if a['slot'] == 'portrait-slot'}
tile = {'SPORT_MARK_HUB': 'ART_HUB_EXTERIOR', 'SPORT_TILE_FOOTBALL': 'ART_PORTAL_FOOTBALL', 'SPORT_TILE_BASKET': 'ART_PORTAL_BASKET',
        'SPORT_TILE_CAR': 'ART_PORTAL_CAR', 'SPORT_TILE_MOTO': 'ART_PORTAL_MOTO'}
sport_bound, sport_missing = [], []
for a in sp['assets']:
    src = f.get(tile.get(a['id'])) if a['id'] in tile else f_by_subject.get(a.get('subjectId'))
    if src and os.path.exists(src['path']):
        a['file'] = os.path.relpath(src['path'], 'web/sport')
        a['placeholder'] = src.get('placeholder', False) is True  # F portraits are silhouette slots
        a['previewSource'] = 'prod/f-sport-art (#44) ' + src['asset_id']
        sport_bound.append(a['id'])
    else:
        sport_missing.append(a['id'])
json.dump(sp, open(SP, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
report['sport_bound'] = sport_bound
report['sport_missing'] = sport_missing
json.dump(report, open('tools/preview/bind-report.json', 'w'), indent=1)
print({k: len(v) for k, v in report.items()})
