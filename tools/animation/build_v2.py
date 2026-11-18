"""Build animation v2 strips, GIF previews, anchor tracks, and comparison sheets.

Reads sprite layers and rigs. Does not modify them, and does not touch
ANIM_SHARED_001, the asset manifest, preview/, src/, or tests/.

    python3 tools/animation/build_v2.py
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib_v2 as L

Z = 4
STATES = ('idle', 'attack', 'defend', 'hit', 'ko')

def rel(*parts):
    return os.path.join(*parts)

def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write('\n')

def zoom(arr, z):
    return np.repeat(np.repeat(arr, z, axis=0), z, axis=1)

def on_checker(arr, cell=4):
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    bit = ((xx // cell) + (yy // cell)) & 1
    base = np.empty((h, w, 4), np.uint8)
    base[:] = (214, 210, 224, 255)
    base[bit == 1] = (184, 180, 198, 255)
    out = base.copy()
    mask = arr[:, :, 3] == 255
    out[mask] = arr[mask]
    return out

def text_bar(width, height, text, fill=(28, 26, 40, 255), color=(255, 255, 255, 255)):
    im = Image.new('RGBA', (max(1, width // 2), max(1, height // 2)), fill)
    d = ImageDraw.Draw(im)
    d.text((4, 3), text, fill=color)
    return zoom(np.array(im), 2)[:height, :width]

def hstack(images, gutter, labels, row_label):
    """images: list of HxWx4. Placed at Z already? No, logical frames, zoomed here."""
    frames = [zoom(on_checker(im), Z) for im in images]
    fh, fw = frames[0].shape[:2]
    label_h = 28
    head_h = 36
    W = gutter + fw * len(frames)
    H = head_h + fh + label_h
    canvas = np.zeros((H, W, 4), np.uint8)
    canvas[:] = (40, 38, 54, 255)
    canvas[:head_h, :] = text_bar(W, head_h, row_label)
    for i, fr in enumerate(frames):
        x = gutter + i * fw
        canvas[head_h:head_h + fh, x:x + fw] = fr
        tag = text_bar(fw, label_h, labels[i], fill=(40, 38, 54, 255))
        canvas[head_h + fh:head_h + fh + label_h, x:x + fw] = tag[:label_h, :fw]
    return canvas

def v1_body_offset(cid, state_name, index, frame):
    anim = L.v1_template()
    rig = 'humanoid_heavy' if cid == 'AVT_AEG_001' else 'humanoid_standard'
    scale = anim['rig_scale'][rig]['move']
    fr = json.loads(json.dumps(frame))
    if fr.get('all') and scale != 1 and not fr.get('rot'):
        fr['all'] = [L.js_round(v * scale) for v in fr['all']]
    if state_name == 'defend' and cid != 'AVT_AEG_001':
        fr.pop('off', None)
    if fr.get('rot'):
        return None
    return L.groups_of(fr)['body']

def key_index_v2(meta, state_name):
    if state_name == 'ko':
        return len(meta) - 1
    if state_name == 'idle':
        return max(range(len(meta)), key=lambda i: meta[i]['groups']['body'][1])
    if state_name == 'hit':
        return min(range(len(meta)), key=lambda i: meta[i]['groups']['body'][0])
    if state_name == 'defend':
        return min(range(len(meta)), key=lambda i: (meta[i]['groups']['body'][0], -meta[i]['groups']['body'][1]))
    return max(range(len(meta)), key=lambda i: meta[i]['groups']['body'][0])

def key_index_v1(cid, state_name):
    frames = L.v1_template()['states'][state_name]['frames']
    if state_name == 'ko':
        return len(frames) - 1
    offsets = []
    for i, fr in enumerate(frames):
        off = v1_body_offset(cid, state_name, i, fr)
        offsets.append(off or [0, 0])
    if state_name == 'idle':
        return max(range(len(offsets)), key=lambda i: offsets[i][1])
    if state_name in ('hit', 'defend'):
        return min(range(len(offsets)), key=lambda i: offsets[i][0])
    return max(range(len(offsets)), key=lambda i: offsets[i][0])

def draw_cross(img, x, y, rgb, arm=6):
    h, w = img.shape[:2]
    col = np.array(list(rgb) + [255], np.uint8)
    for t in range(-arm, arm + 1):
        for xx, yy in ((x + t, y), (x, y + t)):
            if 0 <= xx < w and 0 <= yy < h:
                img[yy, xx] = col

ANCHOR_COLOR = {
    'head': (255, 196, 48),
    'main_hand': (255, 64, 64),
    'off_hand': (48, 220, 255),
    'back': (186, 120, 255),
    'body_center': (255, 255, 255),
    'feet': (64, 230, 96),
}

def anchor_strip(frames, metas, z=2):
    cells = []
    for im, meta in zip(frames, metas):
        big = zoom(on_checker(im, cell=2), z)
        for name, xy in meta['anchors'].items():
            draw_cross(big, xy[0] * z + z // 2, xy[1] * z + z // 2, ANCHOR_COLOR[name])
        cells.append(big)
    h, w = cells[0].shape[:2]
    sheet = np.zeros((h, w * len(cells), 4), np.uint8)
    for i, c in enumerate(cells):
        sheet[:, i * w:(i + 1) * w] = c
    return sheet

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 16), b''):
            h.update(chunk)
    return h.hexdigest()

def image_entry(asset_id, path, kind, owner, note, extra):
    im = Image.open(L.repo(path))
    entry = {
        'asset_id': asset_id,
        'path': path,
        'type': kind,
        'owner': owner,
        'status': 'PROTOTYPE',
        'production_ready': False,
        'note': note,
        'sha256': sha256_file(L.repo(path)),
        'bytes': os.path.getsize(L.repo(path)),
        'canvas_px': [im.size[0], im.size[1]],
    }
    entry.update(extra)
    return entry

def main():
    L.self_check()
    anim = L.template()
    audit = L.audit_v1()
    qa_dir = L.repo('docs', 'qa', 'animation_v2')
    os.makedirs(qa_dir, exist_ok=True)
    dump(os.path.join(qa_dir, 'audit_v1.json'), {
        'source': 'ANIM_SHARED_001',
        'what': 'Opaque pixels of the padded KO rotation that land outside the 128 frame after the v1 settle.',
        'characters': audit,
    })

    assets = []
    qa = []
    summary_cells = []  # (cid, state, v1 arr, v2 arr) key frames

    timing_path = 'assets/animations/ANIM_SHARED_002.json'
    assets.append({
        'asset_id': 'ANIM_SHARED_002',
        'path': timing_path,
        'type': 'animation_timing',
        'owner': 'shared',
        'status': 'PROTOTYPE',
        'production_ready': False,
        'note': 'v2 shared timing. Idle offsets carried from ANIM_SHARED_001. Attack/Defend/Hit are hand-authored integer offsets. KO angles are hand-authored; the in-frame translation is computed. Not hand-drawn pixels. Not PRODUCTION_READY.',
        'supersedes': 'ANIM_SHARED_001',
        'sha256': sha256_file(L.repo(timing_path)),
        'bytes': os.path.getsize(L.repo(timing_path)),
    })

    for cid in L.CHARS:
        folder = L.repo('assets', 'characters', cid, 'anim')
        os.makedirs(folder, exist_ok=True)
        tracks = {
            'asset_id': f'ANIM_{cid}_V2',
            'character_id': cid,
            'name_en': L.NAMES[cid],
            'timing_template': 'ANIM_SHARED_002',
            'status': 'PROTOTYPE',
            'production_ready': False,
            'pixels': 'No frame is hand-placed pixel art. Idle/Attack/Defend/Hit pixels are the standing equipped sprite shifted by hand-authored integer offsets. KO pixels are a nearest-neighbour rotation of that sprite plus the held in-frame translation.',
            'canvas': [L.CANVAS, L.CANVAS],
            'baseline_y': 122,
            'alpha': '0 or 255',
            'loadout': L.default_loadout(cid),
            'anchors_rest': L.CHARS_DATA[cid]['anchors'],
            'states': {},
        }
        anchor_rows = []
        for state_name in STATES:
            state = anim['states'][state_name]
            images, meta = L.render_state(cid, state_name, anim)
            previews, _ = L.preview_frames(cid, state_name, anim)
            strip = np.zeros((L.CANVAS, L.CANVAS * len(images), 4), np.uint8)
            for i, im in enumerate(images):
                strip[:, i * L.CANVAS:(i + 1) * L.CANVAS] = im
            strip_rel = f'assets/characters/{cid}/anim/{cid}_{state_name}_strip_v2.png'
            gif_rel = f'assets/characters/{cid}/anim/{cid}_{state_name}_v2.gif'
            L.to_pil(strip).save(L.repo(strip_rel), optimize=True)
            L.save_gif(previews, L.repo(gif_rel), state['frame_ms'], state['loop'])
            tracks['states'][state_name] = {
                'status': state['status'],
                'placement': state['placement'],
                'loop': state['loop'],
                'hold_last': state['hold_last'],
                'frame_ms': state['frame_ms'],
                'frame_count': len(images),
                'hand_placed_pixel_frames': 0,
                'procedural_frames': len(images),
                'attachment_mode': 'rigid_rotation' if state_name == 'ko' else 'locked_group_offset',
                'canonical_strip': strip_rel,
                'preview_gif': gif_rel,
                'preview_gif_note': 'GIF adds a hard white flash and combat VFX on top of the canonical pixels. The strip does not.',
                'frames': meta,
            }
            assets.append(image_entry(
                f'ANIM_STRIP_{cid}_{state_name.upper()}_V2',
                strip_rel,
                'animation_strip',
                cid,
                f'{L.NAMES[cid]} {state_name} v2 canonical strip, {len(images)}x128. {state["placement"]}. PROTOTYPE.',
                {'frame_count': len(images), 'frame_px': [128, 128], 'frame_ms': state['frame_ms'], 'loop': state['loop'], 'placement': state['placement']},
            ))
            assets.append(image_entry(
                f'ANIM_GIF_{cid}_{state_name.upper()}_V2',
                gif_rel,
                'animation_gif',
                cid,
                f'{L.NAMES[cid]} {state_name} v2 GIF preview. Hard white flash and combat VFX are baked here only. PROTOTYPE.',
                {'frame_count': len(images), 'frame_px': [128, 128], 'frame_ms': state['frame_ms'], 'loop': state['loop'], 'placement': state['placement']},
            ))

            v1_images = L.render_v1_state(cid, state_name)
            row_v1 = hstack(v1_images, 220, [f'f{i}' for i in range(len(v1_images))], f'v1 {cid} {state_name}  ANIM_SHARED_001')
            row_v2 = hstack(images, 220, [f'f{i}' for i in range(len(images))], f'v2 {cid} {state_name}  ANIM_SHARED_002')
            width = max(row_v1.shape[1], row_v2.shape[1])

            def fit_row(row):
                if row.shape[1] == width:
                    return row
                padded = np.zeros((row.shape[0], width, 4), np.uint8)
                padded[:] = (40, 38, 54, 255)
                padded[:, :row.shape[1]] = row
                return padded

            comp = np.concatenate([fit_row(row_v1), fit_row(row_v2)], axis=0)
            comp_rel = f'docs/qa/animation_v2/compare_{cid}_{state_name}.png'
            L.to_pil(comp).save(L.repo(comp_rel), optimize=True)
            qa.append({
                'path': comp_rel,
                'type': 'qa_comparison',
                'character_id': cid,
                'state': state_name,
                'scale': Z,
                'sha256': sha256_file(L.repo(comp_rel)),
                'bytes': os.path.getsize(L.repo(comp_rel)),
                'canvas_px': [comp.shape[1], comp.shape[0]],
            })
            summary_cells.append((cid, state_name, v1_images[key_index_v1(cid, state_name)], images[key_index_v2(meta, state_name)]))
            if state_name in ('attack', 'ko'):
                anchor_rows.append((state_name, images, meta))

        tracks_rel = f'assets/characters/{cid}/anim/{cid}_tracks_v2.json'
        dump(L.repo(tracks_rel), tracks)
        assets.append({
            'asset_id': f'ANIM_{cid}_V2',
            'path': tracks_rel,
            'type': 'animation_tracks',
            'owner': cid,
            'status': 'PROTOTYPE',
            'production_ready': False,
            'note': 'Per-frame anchors and equipment draw positions for the default loadout. Derived from ANIM_SHARED_002. PROTOTYPE.',
            'sha256': sha256_file(L.repo(tracks_rel)),
            'bytes': os.path.getsize(L.repo(tracks_rel)),
        })

        # Anchor proof: attack on top, KO below, 2x nearest, crosses on the six anchors.
        blocks = []
        for state_name, images, meta in anchor_rows:
            bar = text_bar(zoom(images[0], 2).shape[1] * len(images), 32, f'{cid} {state_name} anchors 2x')
            blocks.append(bar[:, :zoom(on_checker(images[0]), 2).shape[1] * len(images)])
            blocks.append(anchor_strip(images, meta, z=2))
        width = max(b.shape[1] for b in blocks)
        sheet = np.zeros((sum(b.shape[0] for b in blocks), width, 4), np.uint8)
        sheet[:] = (40, 38, 54, 255)
        y = 0
        for b in blocks:
            sheet[y:y + b.shape[0], :b.shape[1]] = b
            y += b.shape[0]
        anch_rel = f'docs/qa/animation_v2/anchors_{cid}.png'
        L.to_pil(sheet).save(L.repo(anch_rel), optimize=True)
        qa.append({
            'path': anch_rel,
            'type': 'qa_anchor_proof',
            'character_id': cid,
            'scale': 2,
            'sha256': sha256_file(L.repo(anch_rel)),
            'bytes': os.path.getsize(L.repo(anch_rel)),
            'canvas_px': [sheet.shape[1], sheet.shape[0]],
            'legend': ANCHOR_COLOR,
        })

    # Summary board: one key frame of v1 and v2 for every state.
    gutter = 200
    cell = L.CANVAS * Z
    head_h = 36
    row_h = cell
    label_h = 24
    W = gutter + len(STATES) * 2 * cell
    H = head_h + len(L.CHARS) * (row_h + label_h)
    board = np.zeros((H, W, 4), np.uint8)
    board[:] = (40, 38, 54, 255)
    board[:head_h, :] = text_bar(W, head_h, 'key frame  4x nearest   v1 then v2   idle bob / attack strike / defend brace / hit recoil / KO last')
    header = text_bar(gutter, label_h, '')
    # column captions sit in the row label band of a fake top — draw into the first 24px of each cell area under the header by using the character rows' top.
    by_key = {(c, s): (a, b) for c, s, a, b in summary_cells}
    for ri, cid in enumerate(L.CHARS):
        y = head_h + ri * (row_h + label_h)
        cap = text_bar(gutter, row_h, L.NAMES[cid])
        board[y:y + min(row_h, cap.shape[0]), :gutter] = cap[:row_h, :gutter]
        for si, state_name in enumerate(STATES):
            v1, v2 = by_key[(cid, state_name)]
            for k, im in enumerate((v1, v2)):
                x = gutter + (si * 2 + k) * cell
                board[y:y + cell, x:x + cell] = zoom(on_checker(im), Z)
            tag = text_bar(cell * 2, label_h, f'{state_name}  v1 | v2')
            board[y + cell:y + cell + label_h, gutter + si * 2 * cell:gutter + (si + 1) * 2 * cell] = tag[:, :cell * 2]
    board_rel = 'docs/qa/animation_v2/summary_board.png'
    L.to_pil(board).save(L.repo(board_rel), optimize=True)
    qa.append({
        'path': board_rel,
        'type': 'qa_summary',
        'scale': Z,
        'sha256': sha256_file(L.repo(board_rel)),
        'bytes': os.path.getsize(L.repo(board_rel)),
        'canvas_px': [board.shape[1], board.shape[0]],
    })

    # Stable order: timing, tracks, strips, gifs.
    additions = {
        'project': 'Comedy Fantasy Card Game — First 4 Avatars',
        'addition_set': 'animation_v2',
        'status': 'PROTOTYPE',
        'production_ready': False,
        'generated': '2026-11-18',
        'generated_by': 'tools/animation/build_v2.py',
        'do_not_edit': 'docs/ASSET_MANIFEST.json is owned by the pixel-cleanup agent. Fold these entries in there.',
        'honest_summary': 'Animation v2 is PROTOTYPE. No frame is hand-drawn. No entry is PRODUCTION_READY. KO now keeps the whole body inside the shared 128x128 frame.',
        'asset_count': len(assets),
        'assets': assets,
        'qa_artifacts': qa,
    }
    dump(L.repo('docs', 'manifest_additions', 'animation_v2.json'), additions)
    print(f'assets {len(assets)}  qa {len(qa)}')
    for cid, info in audit.items():
        print(f'v1 KO {cid}: {info["frames_with_pixels_outside"]} frames outside, max {info["max_outside_px"]} px')

if __name__ == '__main__':
    main()
