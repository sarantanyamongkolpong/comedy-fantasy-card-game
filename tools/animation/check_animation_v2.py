"""One-command checks for animation v2.

    python3 tools/animation/check_animation_v2.py

Rebuild first with tools/animation/build_v2.py. This does not modify sprite
layers. Exit code 0 means every check passed. Nothing here is PRODUCTION_READY.
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L

STATES = ('idle', 'attack', 'defend', 'hit', 'ko')
FAILS = []
PASSES = []

def check(name, ok, detail=''):
    if ok:
        PASSES.append(name)
    else:
        FAILS.append(f'{name}' + (f' — {detail}' if detail else ''))

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 16), b''):
            h.update(chunk)
    return h.hexdigest()

def load_strip(path):
    im = np.array(Image.open(path).convert('RGBA'))
    return im

def gif_frames(path):
    im = Image.open(path)
    frames = []
    durations = []
    for i in range(im.n_frames):
        im.seek(i)
        frames.append(np.array(im.convert('RGBA')))
        durations.append(int(im.info.get('duration', 0)))
    return frames, durations, im

def step_of(meta, state_name):
    if state_name == 'ko':
        pts = [fr['translate'] for fr in meta]
    else:
        pts = [fr['groups']['body'] for fr in meta]
    worst = 0
    for a, b in zip(pts, pts[1:]):
        worst = max(worst, abs(a[0] - b[0]), abs(a[1] - b[1]))
    return worst

def main():
    L.self_check()
    check('rotation formula (head falls to the viewer\'s left)', True)
    anim = L.template()
    check('template status is PROTOTYPE', anim.get('status') == 'PROTOTYPE' and anim.get('production_ready') is False)
    check('template does not replace ANIM_SHARED_001', os.path.exists(L.repo('assets', 'animations', 'ANIM_SHARED_001.json')))
    additions_path = L.repo('docs', 'manifest_additions', 'animation_v2.json')
    check('manifest additions exist', os.path.exists(additions_path))
    if not os.path.exists(additions_path):
        _finish()
        return
    additions = json.load(open(additions_path, encoding='utf-8'))
    check('additions are PROTOTYPE', additions.get('production_ready') is False and additions.get('status') == 'PROTOTYPE')

    manifest = json.load(open(L.repo('docs', 'ASSET_MANIFEST.json'), encoding='utf-8'))
    taken = {a['asset_id'] for a in manifest['assets']}
    new_ids = [a['asset_id'] for a in additions['assets']]
    check('new asset ids are unique', len(new_ids) == len(set(new_ids)))
    check('new asset ids do not collide with ASSET_MANIFEST.json', not (set(new_ids) & taken),
          ', '.join(sorted(set(new_ids) & taken)))
    for entry in additions['assets']:
        path = L.repo(entry['path'])
        check(f"hash {entry['asset_id']}", os.path.exists(path) and sha256_file(path) == entry['sha256'] and entry.get('production_ready') is False)
    for entry in additions.get('qa_artifacts', []):
        path = L.repo(entry['path'])
        check(f"qa hash {os.path.basename(entry['path'])}", os.path.exists(path) and sha256_file(path) == entry['sha256'])

    max_ko_step = anim['states']['ko']['fit']['max_step_px']
    for cid in L.CHARS:
        tracks_path = L.repo('assets', 'characters', cid, 'anim', f'{cid}_tracks_v2.json')
        check(f'{cid} tracks file', os.path.exists(tracks_path))
        if not os.path.exists(tracks_path):
            continue
        tracks = json.load(open(tracks_path, encoding='utf-8'))
        check(f'{cid} tracks PROTOTYPE', tracks.get('status') == 'PROTOTYPE' and tracks.get('production_ready') is False)
        check(f'{cid} id preserved', tracks.get('character_id') == cid)
        rest = None
        for state_name in STATES:
            state = anim['states'][state_name]
            images, meta = L.render_state(cid, state_name, anim)
            strip = load_strip(L.repo('assets', 'characters', cid, 'anim', f'{cid}_{state_name}_strip_v2.png'))
            expect_w = L.CANVAS * len(images)
            check(f'{cid} {state_name} strip size', strip.shape == (L.CANVAS, expect_w, 4), str(strip.shape))
            for i, im in enumerate(images):
                got = strip[:, i * L.CANVAS:(i + 1) * L.CANVAS]
                check(f'{cid} {state_name} f{i} matches renderer', np.array_equal(got, im))
                check(f'{cid} {state_name} f{i} alpha 0/255', L.alpha_bad(im) == 0, str(L.alpha_bad(im)))
                box = L.opaque_bbox(im)
                inside = box is not None and box[0] >= 0 and box[1] >= 0 and box[2] < L.CANVAS and box[3] < L.CANVAS
                check(f'{cid} {state_name} f{i} inside frame', inside, str(box))
            recorded = tracks['states'][state_name]['frames']
            check(f'{cid} {state_name} track length', len(recorded) == len(meta))
            check(f'{cid} {state_name} tracks match recompute', recorded == meta)
            check(f'{cid} {state_name} no hand-placed pixels', tracks['states'][state_name]['hand_placed_pixel_frames'] == 0)
            if state_name != 'ko':
                for fr in meta:
                    g = fr['groups']
                    locked = g['body'] == g['head'] == g['main'] == g['off']
                    check(f'{cid} {state_name} f{fr["index"]} weapons locked to body', locked, str(g))
                    for row in fr['attachments']:
                        anchor = row['anchor']
                        draw = row['draw_xy']
                        expect = [anchor[0] - row['pivot'][0] + row['fit'][0], anchor[1] - row['pivot'][1] + row['fit'][1]]
                        check(f'{cid} {state_name} f{fr["index"]} {row["item_id"]} grip', draw == expect)
                if state_name == 'idle':
                    rest = images[0]
                limit = {'idle': 1, 'attack': 6, 'defend': 2, 'hit': 4}[state_name]
                check(f'{cid} {state_name} offset step <= {limit}px', step_of(meta, state_name) <= limit, str(step_of(meta, state_name)))
            else:
                check(f'{cid} ko starts at rest angle', meta[0]['rot_ccw'] == 0 and meta[0]['translate'] == [0, 0])
                check(f'{cid} ko ends flat', meta[-1]['rot_ccw'] == 90)
                angles = [fr['rot_ccw'] for fr in meta]
                check(f'{cid} ko angle monotonic', angles == sorted(angles))
                check(f'{cid} ko translation step <= {max_ko_step}px', step_of(meta, 'ko') <= max_ko_step, str(step_of(meta, 'ko')))
                for fr in meta:
                    box = L.opaque_bbox(images[fr['index']])
                    margined = box[0] >= L.KO_MARGIN and box[1] >= L.KO_MARGIN and box[2] <= L.CANVAS - 1 - L.KO_MARGIN and box[3] <= L.CANVAS - 1 - L.KO_MARGIN
                    check(f'{cid} ko f{fr["index"]} 1px margin', margined, str(box[:4]))
                    for name in L.ANCHORS:
                        got = fr['anchors'][name]
                        expect = list(L.xform_point(
                            L.CHARS_DATA[cid]['anchors'][name][0],
                            L.CHARS_DATA[cid]['anchors'][name][1],
                            fr['pivot_xy'], fr['rot_ccw'], fr['translate']))
                        check(f'{cid} ko f{fr["index"]} anchor {name}', got == expect, f'{got} != {expect}')
            if state_name == 'idle':
                check(f'{cid} idle first frame equals last (loop)', np.array_equal(images[0], images[-1]))
                check(f'{cid} idle loop flag', state['loop'] is True)
            else:
                check(f'{cid} {state_name} does not loop', state['loop'] is False)
            if state_name in ('attack', 'defend', 'hit'):
                check(f'{cid} {state_name} returns to idle rest', np.array_equal(images[-1], rest if rest is not None else images[0]))
            if state_name == 'ko':
                check(f'{cid} ko opens on the idle rest pose', np.array_equal(images[0], rest))

            gframes, durations, _ = gif_frames(L.repo('assets', 'characters', cid, 'anim', f'{cid}_{state_name}_v2.gif'))
            # Pillow joins identical neighbours and adds their durations. Expand
            # that back to the authored frame clock before comparing.
            expanded = []
            for g, dur in zip(gframes, durations):
                copies = dur // state['frame_ms']
                check(
                    f'{cid} {state_name} gif duration multiple',
                    copies >= 1 and dur == copies * state['frame_ms'],
                    str(dur),
                )
                expanded.extend([g] * copies)
            previews, _ = L.preview_frames(cid, state_name, anim)
            check(
                f'{cid} {state_name} gif covers every frame',
                len(expanded) == len(previews),
                f'{len(expanded)} stored-expanded vs {len(previews)}',
            )
            for i, (g, src) in enumerate(zip(expanded, previews)):
                check(f'{cid} {state_name} gif f{i} size', g.shape[:2] == src.shape[:2], str(g.shape))
                check(f'{cid} {state_name} gif f{i} alpha 0/255', L.alpha_bad(g) == 0, str(L.alpha_bad(g)))
                check(f'{cid} {state_name} gif f{i} matches preview', np.array_equal(g, src))

    _finish()

def _finish():
    out = {
        'status': 'PROTOTYPE',
        'production_ready': False,
        'passed': len(PASSES),
        'failed': len(FAILS),
        'failures': FAILS,
    }
    path = L.repo('docs', 'qa', 'animation_v2', 'check_results.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(f'passed {len(PASSES)}  failed {len(FAILS)}')
    for row in FAILS:
        print('FAIL', row)
    if not FAILS:
        print('ALL CHECKS PASSED (status remains PROTOTYPE, not PRODUCTION_READY)')
    sys.exit(1 if FAILS else 0)

if __name__ == '__main__':
    main()
