"""Animation v2 renderer.

Canonical frames are integer transforms of the standing equipped composite:
a shared offset for Idle / Attack / Defend / Hit, and a nearest-neighbour
topple for KO. Weapons stay on the hands because they are not given their
own offset. Sprite layers and ANIM_SHARED_001 are read only.

Nothing here is hand-drawn pixel art, and nothing is PRODUCTION_READY.
"""
import json
import os
from PIL import Image
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHARS = ('AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001')
NAMES = {
    'AVT_AEG_001': 'Sir Potlid',
    'AVT_PHA_001': 'Nox Squeak',
    'AVT_CEL_001': 'Madame Meteor',
    'AVT_SAN_001': 'Sister Plaster',
}
ANCHORS = ('head', 'main_hand', 'off_hand', 'back', 'body_center', 'feet')
GROUPS = ('body', 'head', 'main', 'off', 'vfx')
CANVAS = 128
KO_MARGIN = 1
KO_PAD = 200

def _load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def repo(*parts):
    return os.path.join(ROOT, *parts)

def load_world():
    """Rigs, items, and the default silver/native loadout. Read only."""
    rigs = {}
    for name in ('humanoid_heavy', 'humanoid_standard'):
        rigs[name] = _load_json(repo('assets', 'characters', '_rigs', name + '.json'))
    chars = {}
    for rig in rigs.values():
        chars.update(rig['characters'])
    items = {}
    shared = _load_json(repo('assets', 'equipment', 'shared_items.json'))
    for k, v in shared.items():
        items[k] = {'file': f'assets/equipment/{k}.png', 'pivot': v['pivot']}
    for cid, c in chars.items():
        for k, v in c['native_items'].items():
            items[k] = {'file': v['file'], 'pivot': v['pivot']}
    vfx = _load_json(repo('assets', 'vfx', 'vfx.json'))
    return chars, items, vfx

CHARS_DATA, ITEMS, VFX = load_world()

def default_loadout(cid):
    d = {}
    for k, v in CHARS_DATA[cid]['native_items'].items():
        if v['slot'] not in d and 'GOLD' not in k:
            d[v['slot']] = k
    return d

def template():
    return _load_json(repo('assets', 'animations', 'ANIM_SHARED_002.json'))

def v1_template():
    return _load_json(repo('assets', 'animations', 'ANIM_SHARED_001.json'))

_IMG = {}

def open_rgba(path):
    im = _IMG.get(path)
    if im is None:
        im = np.array(Image.open(path).convert('RGBA'))
        _IMG[path] = im
    return im

def layer_files(cid):
    out = {}
    for layer in CHARS_DATA[cid]['layers']:
        if layer.get('variant'):
            continue
        out[layer['layer']] = repo('assets', 'characters', cid, 'sprite', layer['file'])
    return out

def _blit(dst, src, x, y):
    """Binary-alpha stamp. Source alpha must already be 0 or 255."""
    sh, sw = src.shape[:2]
    dh, dw = dst.shape[:2]
    x0, y0 = max(0, int(x)), max(0, int(y))
    x1, y1 = min(dw, int(x) + sw), min(dh, int(y) + sh)
    if x0 >= x1 or y0 >= y1:
        return
    sx0, sy0 = x0 - int(x), y0 - int(y)
    block = src[sy0:sy0 + (y1 - y0), sx0:sx0 + (x1 - x0)]
    mask = block[:, :, 3] == 255
    dst[y0:y1, x0:x1][mask] = block[mask]

def _stamp_item(dst, item_id, anchor, group_off, fit):
    it = ITEMS[item_id]
    src = open_rgba(repo(it['file']))
    x = anchor[0] - it['pivot'][0] + fit[0] + group_off[0]
    y = anchor[1] - it['pivot'][1] + fit[1] + group_off[1]
    _blit(dst, src, x, y)

def render_offset_frame(cid, groups, load=None):
    """Equipped composite with per-group integer offsets. 128x128."""
    load = default_loadout(cid) if load is None else load
    c = CHARS_DATA[cid]
    files = layer_files(cid)
    dst = np.zeros((CANVAS, CANVAS, 4), np.uint8)
    fit = c.get('fit', {})
    _blit(dst, open_rgba(files['L01']), groups['body'][0], groups['body'][1])
    if load.get('accessory'):
        _stamp_item(dst, load['accessory'], c['anchors']['feet'], groups['body'], fit.get(load['accessory'], [0, 0]))
    if load.get('headgear'):
        _stamp_item(dst, load['headgear'], c['anchors']['head'], groups['head'], fit.get(load['headgear'], [0, 0]))
    if load.get('main_hand'):
        _stamp_item(dst, load['main_hand'], c['anchors']['main_hand'], groups['main'], fit.get(load['main_hand'], [0, 0]))
    if 'L05f' in files:
        _blit(dst, open_rgba(files['L05f']), groups['main'][0], groups['main'][1])
    if load.get('off_hand'):
        _stamp_item(dst, load['off_hand'], c['anchors']['off_hand'], groups['off'], fit.get(load['off_hand'], [0, 0]))
    if 'L06f' in files:
        _blit(dst, open_rgba(files['L06f']), groups['off'][0], groups['off'][1])
    if 'L09' in files:
        _blit(dst, open_rgba(files['L09']), groups['vfx'][0], groups['vfx'][1])
    return dst

def rest_groups():
    return {k: [0, 0] for k in GROUPS}

def rint(v):
    """Round half toward +infinity, matching the raster sampler."""
    return int(np.floor(np.float64(v) + 0.5))

def xform_point(x, y, pivot, angle_ccw, translate):
    """Forward map. Positive angle_ccw sends the head toward the viewer's left."""
    a = np.deg2rad(angle_ccw)
    cos, sin = float(np.cos(a)), float(np.sin(a))
    dx, dy = x - pivot[0], y - pivot[1]
    xr = dx * cos + dy * sin
    yr = -dx * sin + dy * cos
    return (
        rint(xr + pivot[0] + translate[0]),
        rint(yr + pivot[1] + translate[1]),
    )

def rotate_nn(src, angle_ccw, pivot, pad=KO_PAD):
    """Inverse-mapped nearest-neighbour rotation into a padded buffer.

    World coordinate (x, y) lives at array[y+pad, x+pad].
    Angle 0 places the source in the pad with no resampling.
    """
    h, w = src.shape[:2]
    if angle_ccw % 360 == 0:
        out = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.uint8)
        out[pad:pad + h, pad:pad + w] = src
        return out
    H, W = h + 2 * pad, w + 2 * pad
    yy, xx = np.mgrid[0:H, 0:W]
    a = np.deg2rad(float(angle_ccw))
    cos, sin = float(np.cos(a)), float(np.sin(a))
    X = xx - (pivot[0] + pad)
    Y = yy - (pivot[1] + pad)
    # Inverse of | cos  sin |  which is the forward visual-CCW matrix.
    #            |-sin  cos |
    sx = np.floor(cos * X - sin * Y + pivot[0] + 0.5).astype(np.int32)
    sy = np.floor(sin * X + cos * Y + pivot[1] + 0.5).astype(np.int32)
    valid = (sx >= 0) & (sx < w) & (sy >= 0) & (sy < h)
    out = np.zeros((H, W, 4), np.uint8)
    out[valid] = src[sy[valid], sx[valid]]
    return out

def opaque_bbox(arr, origin=(0, 0)):
    ys, xs = np.where(arr[:, :, 3] == 255)
    if len(xs) == 0:
        return None
    return (
        int(xs.min()) + origin[0],
        int(ys.min()) + origin[1],
        int(xs.max()) + origin[0],
        int(ys.max()) + origin[1],
        int(len(xs)),
    )

def legal_window(bbox, margin=KO_MARGIN, canvas=CANVAS):
    x0, y0, x1, y1 = bbox[:4]
    return (
        margin - x0,
        (canvas - 1 - margin) - x1,
        margin - y0,
        (canvas - 1 - margin) - y1,
    )

def hold_translations(windows):
    """Keep the previous translation while it still contains the sprite."""
    tx = ty = 0
    out = []
    for lo_x, hi_x, lo_y, hi_y in windows:
        if lo_x > hi_x or lo_y > hi_y:
            raise RuntimeError(f'KO frame cannot fit in {CANVAS}px, window x {lo_x}..{hi_x} y {lo_y}..{hi_y}')
        if not lo_x <= tx <= hi_x:
            tx = lo_x if tx < lo_x else hi_x
        if not lo_y <= ty <= hi_y:
            ty = lo_y if ty < lo_y else hi_y
        out.append((int(tx), int(ty)))
    return out

def crop_translated(padded, translate, pad=KO_PAD, canvas=CANVAS):
    """World (x, y) lands on canvas (x+tx, y+ty)."""
    tx, ty = translate
    out = np.zeros((canvas, canvas, 4), np.uint8)
    # canvas (cx, cy) reads world (cx-tx, cy-ty) -> padded index (cy-ty+pad, cx-tx+pad)
    # Take the source rect that covers the canvas.
    src_x0 = pad - tx
    src_y0 = pad - ty
    src_x1 = src_x0 + canvas
    src_y1 = src_y0 + canvas
    if src_x0 < 0 or src_y0 < 0 or src_x1 > padded.shape[1] or src_y1 > padded.shape[0]:
        raise RuntimeError('KO crop asked for pixels outside the padded buffer; increase KO_PAD')
    out[:, :] = padded[src_y0:src_y1, src_x0:src_x1]
    return out

def outside_count(padded, translate, pad=KO_PAD, canvas=CANVAS):
    """Opaque rotated pixels that the translation does not keep inside the canvas."""
    ys, xs = np.where(padded[:, :, 3] == 255)
    wx = xs - pad + translate[0]
    wy = ys - pad + translate[1]
    return int(np.sum((wx < 0) | (wy < 0) | (wx >= canvas) | (wy >= canvas)))

def resolve_frames(state, cid):
    motion = (state.get('character_motion') or {}).get(cid) or {}
    frames = []
    for i, fr in enumerate(state['frames']):
        f = dict(fr)
        if 'all' in motion:
            f['all'] = list(motion['all'][i])
        if 'vfx_add' in motion:
            f['vfx_add'] = list(motion['vfx_add'][i])
        if 'rot' in motion:
            f['rot'] = int(motion['rot'][i])
        frames.append(f)
    return frames

def groups_of(frame):
    """Preview rule: a group offset is `all` plus that group's own pair.

    `vfx_add` is the v2 way to let squeak marks and steam drift without
    writing a full vfx pair. An explicit `vfx` pair wins over `vfx_add`.
    """
    base = frame.get('all', [0, 0])
    out = {}
    for k in GROUPS:
        if k == 'vfx' and 'vfx' not in frame and 'vfx_add' in frame:
            extra = frame['vfx_add']
        else:
            extra = frame.get(k, [0, 0])
        out[k] = [int(base[0]) + int(extra[0]), int(base[1]) + int(extra[1])]
    return out

def ko_plan(cid, frames):
    """Rotation buffers plus the held in-frame translation for one character."""
    rest = render_offset_frame(cid, rest_groups())
    pivot = CHARS_DATA[cid]['anchors']['body_center']
    buffers = []
    windows = []
    for fr in frames:
        padded = rotate_nn(rest, int(fr['rot']), pivot)
        box = opaque_bbox(padded, origin=(-KO_PAD, -KO_PAD))
        # The pad itself must not be what is clipping the rotation.
        if box[0] <= -KO_PAD + 1 or box[1] <= -KO_PAD + 1 or box[2] >= CANVAS + KO_PAD - 2 or box[3] >= CANVAS + KO_PAD - 2:
            raise RuntimeError(f'{cid} KO rotation touched the pad at {fr["rot"]}°: {box}')
        buffers.append(padded)
        windows.append(legal_window(box))
    return buffers, hold_translations(windows), pivot

def render_ko_frame(padded, translate):
    if outside_count(padded, translate):
        raise RuntimeError(f'KO translation {translate} still clips')
    return crop_translated(padded, translate)

def shifted_anchors(cid, groups):
    a = {}
    for name, xy in CHARS_DATA[cid]['anchors'].items():
        # Headgear rides the head group, sneakers ride the body (feet anchor),
        # hands ride their own group. back/body_center/feet ride the body.
        if name == 'head':
            off = groups['head']
        elif name == 'main_hand':
            off = groups['main']
        elif name == 'off_hand':
            off = groups['off']
        else:
            off = groups['body']
        a[name] = [int(xy[0] + off[0]), int(xy[1] + off[1])]
    return a

def rotated_anchors(cid, angle, translate, pivot):
    return {
        name: list(xform_point(xy[0], xy[1], pivot, angle, translate))
        for name, xy in CHARS_DATA[cid]['anchors'].items()
    }

def attachment_rows(cid, anchors):
    load = default_loadout(cid)
    fit = CHARS_DATA[cid].get('fit', {})
    rows = []
    slot_anchor = {'headgear': 'head', 'accessory': 'feet', 'main_hand': 'main_hand', 'off_hand': 'off_hand'}
    for slot, item_id in load.items():
        name = slot_anchor[slot]
        pivot = ITEMS[item_id]['pivot']
        extra = fit.get(item_id, [0, 0])
        anchor = anchors[name]
        rows.append({
            'slot': slot,
            'item_id': item_id,
            'pivot': list(pivot),
            'fit': list(extra),
            'anchor': list(anchor),
            'draw_xy': [int(anchor[0] - pivot[0] + extra[0]), int(anchor[1] - pivot[1] + extra[1])],
        })
    return rows

def effects_of(frame):
    keep = {}
    for k in ('flash', 'tint', 'vfx_fx', 'dim'):
        if k in frame:
            keep[k] = frame[k]
    return keep

def render_state(cid, state_name, anim=None):
    """Canonical rasters for one state. No flash, no combat VFX."""
    anim = template() if anim is None else anim
    state = anim['states'][state_name]
    frames = resolve_frames(state, cid)
    if state_name == 'ko':
        buffers, translations, pivot = ko_plan(cid, frames)
        images = []
        for buf, tr in zip(buffers, translations):
            im = render_ko_frame(buf, tr)
            box = opaque_bbox(im)
            if box[0] < KO_MARGIN or box[1] < KO_MARGIN or box[2] > CANVAS - 1 - KO_MARGIN or box[3] > CANVAS - 1 - KO_MARGIN:
                raise RuntimeError(f'{cid} KO bbox {box} violates the {KO_MARGIN}px margin')
            images.append(im)
        meta = []
        for i, (fr, tr) in enumerate(zip(frames, translations)):
            anchors = rotated_anchors(cid, int(fr['rot']), tr, pivot)
            meta.append({
                'index': i,
                'rot_ccw': int(fr['rot']),
                'pivot': 'body_center',
                'pivot_xy': list(pivot),
                'translate': [int(tr[0]), int(tr[1])],
                'anchors': anchors,
                'attachments': attachment_rows(cid, anchors),
                'effects': effects_of(fr),
                'opaque': int(np.sum(images[i][:, :, 3] == 255)),
            })
        return images, meta
    images = []
    meta = []
    for i, fr in enumerate(frames):
        groups = groups_of(fr)
        im = render_offset_frame(cid, groups)
        images.append(im)
        anchors = shifted_anchors(cid, groups)
        meta.append({
            'index': i,
            'groups': groups,
            'anchors': anchors,
            'attachments': attachment_rows(cid, anchors),
            'effects': effects_of(fr),
            'opaque': int(np.sum(im[:, :, 3] == 255)),
        })
    return images, meta

def fx_for(anim, cid, kind):
    over = (anim.get('character_overrides') or {}).get(cid, {}).get(kind)
    if over:
        return over
    return (anim.get('vfx_fx') or {}).get(kind, {}).get('default')

def _vfx_frame(vfx_id, index):
    spec = VFX[vfx_id]
    fw, fh = spec['frame']
    n = spec['frames']
    src = open_rgba(repo('assets', 'vfx', vfx_id + '.png'))
    i = index % n
    return src[:, i * fw:(i + 1) * fw], spec['pivot']

def preview_frames(cid, state_name, anim=None):
    """GIF source. Canonical pixels, plus a hard white flash and combat VFX."""
    anim = template() if anim is None else anim
    images, meta = render_state(cid, state_name, anim)
    out = []
    for im, fr in zip(images, meta):
        frame = im.copy()
        if fr['effects'].get('flash') == 'white':
            frame[frame[:, :, 3] == 255, :3] = 255
        kind = fr['effects'].get('vfx_fx')
        if kind:
            fx = fx_for(anim, cid, kind)
            if fx:
                sprite, pivot = _vfx_frame(fx['vfx'], fr['index'])
                anchor = fr['anchors'][fx['at']]
                ox, oy = fx.get('offset', [0, 0])
                _blit(frame, sprite, anchor[0] + ox - pivot[0], anchor[1] + oy - pivot[1])
        out.append(frame)
    return out, meta

def js_round(v):
    return int(np.floor(float(v) + 0.5))

def render_v1_state(cid, state_name):
    """v1 the way the preview plays it, including the KO clip. For comparison only."""
    anim = v1_template()
    state = anim['states'][state_name]
    rig = 'humanoid_heavy' if cid == 'AVT_AEG_001' else 'humanoid_standard'
    scale = anim['rig_scale'][rig]['move']
    pivot = CHARS_DATA[cid]['anchors'][state.get('pivot', 'body_center')]
    images = []
    for fr in state['frames']:
        fr = json.loads(json.dumps(fr))
        if fr.get('all') and scale != 1:
            fr['all'] = [js_round(v * scale) for v in fr['all']]
        if state_name == 'defend' and cid != 'AVT_AEG_001':
            fr.pop('off', None)
        if fr.get('rot'):
            base = render_offset_frame(cid, rest_groups())
            # v1 rotates inside the 128 buffer, so anything that swings out is destroyed,
            # and only then is `all` applied.
            padded = rotate_nn(base, -float(fr['rot']), pivot, pad=0)
            # pad 0 means world == array index, but rotate_nn with pad 0 still adds 0.
            # rotate_nn(pad=0) returns an array of size h x w with world origin 0.
            clipped = padded[:CANVAS, :CANVAS].copy()
            # Pixels that rotated outside the original 128 are already gone because
            # the destination grid is exactly the source grid when pad=0.
            dx, dy = fr.get('all', [0, 0])
            shifted = np.zeros_like(clipped)
            _blit(shifted, clipped, dx, dy)
            images.append(shifted)
        else:
            images.append(render_offset_frame(cid, groups_of(fr)))
    return images

def colors_of(arr):
    px = arr[arr[:, :, 3] == 255][:, :3]
    if len(px) == 0:
        return set()
    uniq = np.unique(px, axis=0)
    return {tuple(int(v) for v in row) for row in uniq}

def alpha_bad(arr):
    a = arr[:, :, 3]
    return int(np.sum((a != 0) & (a != 255)))

def to_pil(arr):
    return Image.fromarray(arr, 'RGBA')

def _palette_index(frames):
    """Shared GIF palette. Index 0 is transparent. Fails if a clip needs >255 colours."""
    chunks = []
    for f in frames:
        px = f[f[:, :, 3] == 255][:, :3]
        if len(px):
            chunks.append(np.unique(px, axis=0))
    uniq = np.unique(np.concatenate(chunks), axis=0) if chunks else np.zeros((0, 3), np.uint8)
    if len(uniq) > 255:
        raise RuntimeError(f'clip uses {len(uniq)} colours; refusing to quantize')
    pal = np.zeros(256 * 3, np.uint8)
    if len(uniq):
        pal[3:3 + 3 * len(uniq)] = uniq.astype(np.uint8).reshape(-1)
    packed_uniq = uniq[:, 0].astype(np.int32) * 65536 + uniq[:, 1].astype(np.int32) * 256 + uniq[:, 2].astype(np.int32)
    images = []
    for f in frames:
        packed = f[:, :, 0].astype(np.int32) * 65536 + f[:, :, 1].astype(np.int32) * 256 + f[:, :, 2].astype(np.int32)
        idx = np.zeros(f.shape[:2], np.uint8)
        opaque = f[:, :, 3] == 255
        for i, p in enumerate(packed_uniq):
            idx[(packed == int(p)) & opaque] = i + 1
        im = Image.fromarray(idx, 'P')
        im.putpalette(pal.tolist())
        images.append(im)
    return images

def save_gif(frames, path, frame_ms, loop):
    ps = _palette_index(frames)
    # Idle loops (Netscape loop 0 = forever). One-shots pass loop=1. Pillow always
    # writes a loop count with save_all; viewers differ on whether 1 means "once more".
    ps[0].save(
        path,
        save_all=True,
        append_images=ps[1:],
        duration=int(frame_ms),
        loop=0 if loop else 1,
        disposal=2,
        transparency=0,
        optimize=False,
    )

def audit_v1():
    """How many opaque pixels of each v1 KO pose sit outside the 128 frame.

    Counted on a padded rotation so the number is the body that does not fit,
    not an artefact of destroying those pixels before the settle offset.
    """
    anim = v1_template()
    state = anim['states']['ko']
    out = {}
    for cid in CHARS:
        rig = 'humanoid_heavy' if cid == 'AVT_AEG_001' else 'humanoid_standard'
        scale = anim['rig_scale'][rig]['move']
        pivot = CHARS_DATA[cid]['anchors']['body_center']
        rest = render_offset_frame(cid, rest_groups())
        rows = []
        for i, fr in enumerate(state['frames']):
            angle = -float(fr['rot']) if fr.get('rot') else 0
            padded = rotate_nn(rest, angle, pivot)
            dx, dy = fr.get('all', [0, 0])
            if scale != 1:
                dx, dy = js_round(dx * scale), js_round(dy * scale)
            lost = outside_count(padded, (dx, dy))
            box = opaque_bbox(padded, origin=(-KO_PAD + dx, -KO_PAD + dy))
            rows.append({
                'index': i,
                'rot_ccw': angle,
                'translate': [dx, dy],
                'opaque': box[4],
                'outside_128': lost,
                'bbox': list(box[:4]),
            })
        out[cid] = {
            'frames_with_pixels_outside': sum(1 for r in rows if r['outside_128']),
            'max_outside_px': max(r['outside_128'] for r in rows),
            'frames': rows,
        }
    return out

def self_check():
    """Formula checks that do not depend on generated files."""
    src = np.zeros((CANVAS, CANVAS, 4), np.uint8)
    src[50, 64] = (200, 10, 10, 255)
    pivot = (64, 74)
    turned = rotate_nn(src, 90, pivot, pad=0)
    # Head-side pixel (above the pivot) must land to the viewer's left.
    ys, xs = np.where(turned[:, :, 3] == 255)
    assert len(xs) == 1, (xs, ys)
    assert (int(xs[0]), int(ys[0])) == (40, 74), (int(xs[0]), int(ys[0]))
    ident = rotate_nn(src, 0, pivot, pad=16)
    assert np.array_equal(ident[16:16 + CANVAS, 16:16 + CANVAS], src)
    # A locked offset cannot move the sword off the fist: both groups share it.
    groups = rest_groups()
    groups = {k: [3, -1] for k in groups}
    groups['vfx'] = [3, -3]
    for cid in CHARS:
        im = render_offset_frame(cid, groups)
        assert alpha_bad(im) == 0
        assert im.shape == (CANVAS, CANVAS, 4)
    return True
