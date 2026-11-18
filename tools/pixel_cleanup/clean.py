"""Deterministic pixel-cleanup pass for the four avatar sprites.

Reads assets/characters/<ID>/sprite/_source_v1 (byte backup of the prototype)
and writes cleaned layers back to the sprite folder. Not hand-painted.
Status ceiling: PROTOTYPE. Never PRODUCTION_READY.

Does not edit equipment crops, rigs, preview, card art, or animation files.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import compose as C  # noqa: E402
from common import (  # noqa: E402
    BOXES,
    CHARS,
    EXPECTED_ANCHORS,
    QA_DIR,
    ROOT,
    SPLIT_SPECS,
    backup_dir,
    color_count,
    lab_rows,
    load_rgba,
    load_rigs,
    save_rgba,
    sprite_dir,
)

TARGET_COLORS = 48
CANVAS = 128
BASELINE_Y = 122  # lowest opaque foot pixel may sit on row 121; rows 122-127 stay clear


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_backup() -> dict:
    """Copy originals once. Later runs must not refresh the backup from cleaned files."""
    QA_DIR.mkdir(parents=True, exist_ok=True)
    record_path = QA_DIR / "source_v1_sha256.json"
    if record_path.exists():
        record = json.loads(record_path.read_text())
        for rel, digest in record.items():
            path = ROOT / rel
            if not path.exists() or sha256(path) != digest:
                raise SystemExit(f"backup drift: {rel}")
        return record
    record = {}
    for cid in CHARS:
        dest = backup_dir(cid)
        dest.mkdir(parents=True, exist_ok=True)
        for src in sorted(sprite_dir(cid).glob("*.png")):
            target = dest / src.name
            if not target.exists():
                shutil.copy2(src, target)
            rel = str(target.relative_to(ROOT))
            record[rel] = sha256(target)
    record_path.write_text(json.dumps(record, indent=1) + "\n")
    return record


def components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    seen = np.zeros(mask.shape, bool)
    found = []
    ys, xs = np.where(mask)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if seen[y, x]:
            continue
        stack = [(y, x)]
        seen[y, x] = True
        pts = []
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < CANVAS and 0 <= nx < CANVAS and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        found.append(pts)
    return found


def rect_mask(box) -> np.ndarray:
    mask = np.zeros((CANVAS, CANVAS), bool)
    if not box:
        return mask
    x0, x1, y0, y1 = box
    mask[y0 : y1 + 1, x0 : x1 + 1] = True
    return mask


def hands_mask(boxes) -> np.ndarray:
    mask = np.zeros((CANVAS, CANVAS), bool)
    for box in boxes:
        mask |= rect_mask(box)
    return mask


def channels(img: np.ndarray):
    return img[..., 0].astype(np.int16), img[..., 1].astype(np.int16), img[..., 2].astype(np.int16)


def peach_mask(img: np.ndarray) -> np.ndarray:
    r, g, b = channels(img)
    return (
        (r >= 185)
        & (g >= 130)
        & (b >= 100)
        & (r > g)
        & (g > b)
        & ((r - g) >= 35)
        & ((r - g) <= 90)
        & ((g - b) >= 18)
        & ((g - b) <= 55)
        & ((r - b) >= 55)
    )


def partition_masks(img: np.ndarray, cid: str) -> dict[str, np.ndarray]:
    """Exclusive partition of opaque pixels into skin / face / hair / outfit."""
    boxes = BOXES[cid]
    opaque = img[..., 3] > 0
    r, g, b = channels(img)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    face = rect_mask(boxes["face"])
    head = rect_mask(boxes["head"])
    hands = hands_mask(boxes["hands"])
    streak = rect_mask(boxes["streak"])
    peach = peach_mask(img)
    brown = (
        (r >= 35)
        & (r <= 170)
        & (g >= 20)
        & (g <= 115)
        & (b >= 12)
        & (b <= 90)
        & (r > g)
        & (g + 5 >= b)
        & ((r - b) >= 14)
        & ((r - g) >= 10)
        & ~peach
    )
    grey = ((mx - mn) <= 30) & (mx >= 70) & (mx <= 220)
    purple = (b > r + 15) & (b > g + 10) & (b >= 90) & (r >= 40)
    dark = (mx <= 80) & ((mx - mn) <= 40)
    green_eye = (g > r + 8) & (g > b) & (g > 40) & (g < 170) & (r < 140)
    violet_eye = (b > r + 10) & (b > 80) & (r > 40) & (r < 200) & (g < b)
    teal_eye = (g > 45) & (b > 45) & (r + 10 < g) & (r + 10 < b) & (g < 180) & (b < 200)
    eyes = face & opaque & (green_eye | violet_eye | teal_eye | ((r + g + b) < 90))
    skin = opaque & peach & (face | hands) & ~eyes
    hair = opaque & ~skin & ~eyes & head & (
        brown
        | (grey if cid == "AVT_CEL_001" else np.zeros_like(opaque))
        | (dark if cid == "AVT_PHA_001" else np.zeros_like(opaque))
        | (purple & streak if cid == "AVT_PHA_001" else np.zeros_like(opaque))
    )
    # Brows, mouth, glasses, iris leftovers inside the face box.
    feat = opaque & face & ~skin & ~hair & (
        eyes
        | ((r + g + b) < 110)
        | (((mx - mn) > 55) & ((r + g + b) > 120))
    )
    outfit = opaque & ~skin & ~hair & ~feat
    return {"skin": skin, "face": feat, "hair": hair, "outfit": outfit}


def equipment_mask(char: dict) -> np.ndarray:
    mask = np.zeros((CANVAS, CANVAS), bool)
    for iid, item in char["native_items"].items():
        if "GOLD" in iid:
            continue
        eq = load_rgba(ROOT / item["file"])
        ox, oy = item["native_origin"]
        h, w = eq.shape[:2]
        mask[oy : oy + h, ox : ox + w] |= eq[..., 3] > 0
    return mask


def mode_color(cols: list[tuple[int, int, int]]):
    return Counter(cols).most_common(1)[0][0]


def neighbor_colors(img: np.ndarray, y: int, x: int, ortho_only: bool = False):
    cols = []
    steps = ((0, 1), (0, -1), (1, 0), (-1, 0)) if ortho_only else tuple(
        (dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if not (dy == 0 and dx == 0)
    )
    for dy, dx in steps:
        ny, nx = y + dy, x + dx
        if 0 <= ny < CANVAS and 0 <= nx < CANVAS and img[ny, nx, 3] > 0:
            cols.append(tuple(int(v) for v in img[ny, nx, :3]))
    return cols


def fill_pinholes(img: np.ndarray, hidden: np.ndarray) -> int:
    filled = 0
    dilated = hidden.copy()
    for _ in range(2):
        padded = np.pad(dilated, 1)
        grown = dilated.copy()
        for dy in range(3):
            for dx in range(3):
                grown |= padded[dy : dy + CANVAS, dx : dx + CANVAS]
        dilated = grown
    for _pass in range(2):
        src = img.copy()
        opaque = src[..., 3] > 0
        ys, xs = np.where(~opaque)
        for y, x in zip(ys.tolist(), xs.tolist()):
            if y >= BASELINE_Y:
                continue
            cols = neighbor_colors(src, y, x)
            if len(cols) < 5:
                continue
            up = y > 0 and src[y - 1, x, 3] > 0
            down = y + 1 < CANVAS and src[y + 1, x, 3] > 0
            left = x > 0 and src[y, x - 1, 3] > 0
            right = x + 1 < CANVAS and src[y, x + 1, 3] > 0
            enclosed = up and down and (left or right)
            if len(cols) >= 7 or (len(cols) >= 6 and enclosed and dilated[y, x]):
                img[y, x, :3] = mode_color(cols)
                img[y, x, 3] = 255
                filled += 1
    return filled


def reshade_cap(img: np.ndarray, pts: list[tuple[int, int]]) -> None:
    cols = [tuple(int(v) for v in img[y, x, :3]) for y, x in pts]
    uniq = sorted(set(cols), key=lambda c: sum(c))
    dark = uniq[0]
    light = uniq[-1]
    mid = uniq[len(uniq) // 2]
    cx = sum(x for _, x in pts) / len(pts)
    cy = sum(y for y, _ in pts) / len(pts)
    for y, x in pts:
        edge = False
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < CANVAS and 0 <= nx < CANVAS and img[ny, nx, 3] > 0):
                edge = True
                break
        diag = (x - cx) + (y - cy)
        if edge:
            img[y, x, :3] = dark
        elif diag < -1.5:
            img[y, x, :3] = light
        else:
            img[y, x, :3] = mid


def fill_from_row(img: np.ndarray, hidden: np.ndarray, pts: list[tuple[int, int]]) -> int:
    changed = 0
    for y, x in pts:
        best = None
        best_d = 99
        for dist in range(1, 16):
            for xx in (x - dist, x + dist):
                if 0 <= xx < CANVAS and img[y, xx, 3] > 0 and not hidden[y, xx]:
                    if dist < best_d:
                        best = img[y, xx, :3].copy()
                        best_d = dist
            if best is not None:
                break
        if best is not None and not np.array_equal(img[y, x, :3], best):
            img[y, x, :3] = best
            changed += 1
    return changed


def fill_nearest(img: np.ndarray, hidden: np.ndarray, pts: list[tuple[int, int]], radius: int = 8) -> int:
    changed = 0
    for y, x in pts:
        best = None
        best_d = 10**9
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                if dx == 0 and dy == 0:
                    continue
                ny, nx = y + dy, x + dx
                if 0 <= ny < CANVAS and 0 <= nx < CANVAS and img[ny, nx, 3] > 0 and not hidden[ny, nx]:
                    dist = dx * dx + dy * dy
                    if dist < best_d:
                        best_d = dist
                        best = img[ny, nx, :3].copy()
        if best is not None:
            img[y, x, :3] = best
            changed += 1
    return changed


def shade_feet(img: np.ndarray, pts: list[tuple[int, int]]) -> None:
    cols = [tuple(int(v) for v in img[y, x, :3]) for y, x in pts]
    base = np.array(mode_color(cols), np.int16)
    shadow = np.clip(base * 62 // 100, 0, 255).astype(np.uint8)
    hi = np.clip(np.minimum(base * 128 // 100, 255), 0, 255).astype(np.uint8)
    wrap = np.clip(np.minimum(base * 112 // 100, 255), 0, 255).astype(np.uint8)
    base_u = base.astype(np.uint8)
    ys = [p[0] for p in pts]
    xs = [p[1] for p in pts]
    y0, y1 = min(ys), max(ys)
    cx = (min(xs) + max(xs)) / 2
    span = max(1, y1 - y0)
    for y, x in pts:
        edge = False
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < CANVAS and 0 <= nx < CANVAS and img[ny, nx, 3] > 0):
                edge = True
                break
        rel = (y - y0) / span
        if edge or rel > 0.78:
            img[y, x, :3] = shadow
        elif rel < 0.22 and x < cx:
            img[y, x, :3] = hi
        elif abs(rel - 0.30) < 0.07:
            img[y, x, :3] = wrap
        else:
            img[y, x, :3] = base_u


def plant_feet(img: np.ndarray, cid: str) -> int:
    """Drop a 1 px sole onto row 121 under each real foot. Does not move anchors."""
    planted = 0
    for x0, x1 in BOXES[cid]["feet_zones"]:
        ys = []
        for y in range(108, BASELINE_Y):
            if (img[y, x0 : x1 + 1, 3] > 0).any():
                ys.append(y)
        if not ys:
            continue
        my = max(ys)
        bottom = [x for x in range(x0, x1 + 1) if img[my, x, 3] > 0]
        if len(bottom) <= 2 and my > 108:
            for x in bottom:
                img[my, x] = 0
            my -= 1
            bottom = [x for x in range(x0, x1 + 1) if img[my, x, 3] > 0]
        if not bottom or my >= BASELINE_Y - 1:
            # my == 121 already, or empty
            if my == BASELINE_Y - 1:
                continue
        if my >= 121:
            continue
        for x in bottom:
            img[my + 1, x] = img[my, x]
            planted += 1
    return planted


def repair_hidden(img: np.ndarray, cid: str, char: dict) -> dict:
    hidden = (img[..., 3] > 0) & equipment_mask(char)
    notes = {"pinholes": fill_pinholes(img, hidden), "regions": []}
    hidden = (img[..., 3] > 0) & equipment_mask(char)
    head_y = char["anchors"]["head"][1]
    for pts in components(hidden):
        ys = [p[0] for p in pts]
        xs = [p[1] for p in pts]
        n = len(pts)
        height = max(ys) - min(ys)
        width = max(xs) - min(xs)
        cy = sum(ys) / n
        kind = "kept"
        if 40 <= n <= 220 and cy < head_y + 14:
            reshade_cap(img, pts)
            kind = "hair_cap_reshade"
        elif height > 35 and width < 18 and n > 40:
            fill_from_row(img, hidden, pts)
            kind = "staff_gap_row_extend"
        elif cy > 100 and n > 80:
            shade_feet(img, pts)
            kind = "feet_shade"
        elif n > 400:
            kind = "shield_mirror_despeckle_only"
        elif n < 45:
            fill_nearest(img, hidden, pts)
            kind = "small_nearest"
        notes["regions"].append({"n": n, "bbox": [min(ys), max(ys), min(xs), max(xs)], "kind": kind})
    if BOXES[cid]["feet_zones"]:
        notes["feet_planted_px"] = plant_feet(img, cid)
    return notes


def is_accent(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    mx, mn = max(rgb), min(rgb)
    if mx - mn < 70 or mx < 120:
        return False
    if r > 190 and g > 160 and b < 120:
        return True  # neon yellow / star
    if b > 160 and g > 150 and r < 150:
        return True  # cyan wing
    if r > 190 and b > 130 and g < 180 and r > g + 20:
        return True  # magenta sole / gem
    if g > r + 30 and g > b + 20 and 80 <= g <= 180 and r < 140:
        return True  # green cross / iris
    if b > r + 20 and b > 100 and 50 < r < 180 and g < b:
        return True  # violet eye
    return False


def protect_mask(img: np.ndarray, cid: str | None, extra: np.ndarray | None = None) -> np.ndarray:
    protect = np.zeros((CANVAS, CANVAS), bool)
    if extra is not None:
        protect |= extra
    opaque = img[..., 3] > 0
    # Exact-color components of identity accents. Large fields (robes) are not protected.
    colors = np.unique(img[opaque][:, :3], axis=0) if opaque.any() else []
    for col in colors:
        key = tuple(int(v) for v in col)
        if not is_accent(key):
            continue
        exact = opaque & np.all(img[..., :3] == col, axis=-1)
        for pts in components(exact):
            if len(pts) <= 10:
                for y, x in pts:
                    protect[y, x] = True
    if cid is not None:
        # Face-feature pixels (eyes, mouth, brows, glasses) stay put during despeckle.
        part = partition_masks(img, cid)
        protect |= part["face"]
    return protect


def unify_face(img: np.ndarray, cid: str) -> np.ndarray:
    """Snap each small facial-feature component to its median. Returns the protect mask."""
    part = partition_masks(img, cid)
    feat = part["face"]
    protect = feat.copy()
    for pts in components(feat):
        if not 1 <= len(pts) <= 24:
            continue
        cols = np.array([img[y, x, :3] for y, x in pts], np.float64)
        med = np.median(cols, axis=0).round().astype(np.uint8)
        for y, x in pts:
            img[y, x, :3] = med
    return protect


def delta_e(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    labs = lab_rows(np.array([a, b], np.float64))
    return float(np.linalg.norm(labs[0] - labs[1]))


def despeckle(img: np.ndarray, protect: np.ndarray, passes: int = 1) -> int:
    """Flatten true salt: a pixel with no neighbour of its own colour.

    Replacement is allowed only when the majority neighbour is within dE 16,
    so a hair pixel sitting on skin is left alone. One pass, read from a
    copy, so the edit cannot cascade into a new material.
    """
    changed = 0
    cache: dict[tuple, float] = {}
    for _ in range(passes):
        src = img.copy()
        opaque = src[..., 3] > 0
        ys, xs = np.where(opaque & ~protect)
        for y, x in zip(ys.tolist(), xs.tolist()):
            cols = neighbor_colors(src, y, x)
            if len(cols) < 4:
                continue
            me = tuple(int(v) for v in src[y, x, :3])
            if any(c == me for c in cols):
                continue
            mode, count = Counter(cols).most_common(1)[0]
            if count < 4 or mode == me:
                continue
            key = (me, mode)
            if key not in cache:
                cache[key] = delta_e(me, mode)
            if cache[key] <= 16.0:
                img[y, x, :3] = mode
                changed += 1
    return changed


def reinforce_outline(img: np.ndarray, protect: np.ndarray) -> int:
    changed = 0
    src = img.copy()
    opaque = src[..., 3] > 0
    ys, xs = np.where(opaque & ~protect)
    for y, x in zip(ys.tolist(), xs.tolist()):
        edge = False
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < CANVAS and 0 <= nx < CANVAS and src[ny, nx, 3] > 0):
                edge = True
                break
        if not edge:
            continue
        neigh = neighbor_colors(src, y, x)
        if len(neigh) < 2:
            continue
        me = src[y, x, :3].astype(np.int16)
        mean_n = np.mean(neigh, axis=0)
        if me.mean() > mean_n.mean() + 28:
            darkest = min(neigh, key=sum)
            img[y, x, :3] = darkest
            changed += 1
    return changed


def gather_counts(layers: dict[str, np.ndarray]) -> dict[tuple[int, int, int], int]:
    counts: dict[tuple[int, int, int], int] = {}
    for img in layers.values():
        mask = img[..., 3] > 0
        if not mask.any():
            continue
        uniq, freq = np.unique(img[mask][:, :3], axis=0, return_counts=True)
        for col, n in zip(uniq, freq):
            key = tuple(int(v) for v in col)
            counts[key] = counts.get(key, 0) + int(n)
    return counts


def lock_colors(layers: dict[str, np.ndarray], face_protect: np.ndarray) -> list[tuple[int, int, int]]:
    locks = []
    body = next(img for name, img in layers.items() if name.endswith("_L01_body.png"))
    mask = face_protect & (body[..., 3] > 0)
    if mask.any():
        uniq, freq = np.unique(body[mask][:, :3], axis=0, return_counts=True)
        order = np.argsort(-freq)
        for col in uniq[order]:
            locks.append(tuple(int(v) for v in col))
            if len(locks) >= 8:
                break
    return locks


def build_palette(counts: dict, locks: list[tuple[int, int, int]], target: int = TARGET_COLORS):
    weight = dict(counts)
    alive = set(weight)
    locked = {c for c in locks if c in alive}
    parent = {c: c for c in alive}
    labs = {c: lab_rows(np.array(c, np.float64))[0] for c in alive}
    last = 0.0
    merges = 0
    while len(alive) > target:
        items = sorted(alive)
        n = len(items)
        mat = np.stack([labs[c] for c in items])
        dist = np.sqrt(((mat[:, None, :] - mat[None, :, :]) ** 2).sum(-1))
        dist = dist + np.arange(n) * 1e-4
        np.fill_diagonal(dist, 1e9)
        for i, a in enumerate(items):
            if a not in locked:
                continue
            for j, b in enumerate(items):
                if b in locked:
                    dist[i, j] = 1e9
        if float(dist.min()) >= 1e8:
            break
        i, j = np.unravel_index(int(np.argmin(dist)), dist.shape)
        a, b = items[i], items[j]
        last = float(np.linalg.norm(labs[a] - labs[b]))
        if a in locked and b not in locked:
            keep, drop = a, b
        elif b in locked and a not in locked:
            keep, drop = b, a
        else:
            ra = (weight[a], tuple(-v for v in a))
            rb = (weight[b], tuple(-v for v in b))
            keep, drop = (a, b) if ra >= rb else (b, a)
        weight[keep] += weight[drop]
        parent[drop] = keep
        alive.remove(drop)
        merges += 1
    survivors = sorted(alive)

    def root(color):
        seen = []
        while parent[color] != color:
            seen.append(color)
            color = parent[color]
        for item in seen:
            parent[item] = color
        return color

    mapping = {color: root(color) for color in counts}
    return mapping, survivors, last, merges


def apply_palette(img: np.ndarray, mapping: dict) -> None:
    mask = img[..., 3] > 0
    if not mask.any():
        return
    ys, xs = np.where(mask)
    cols = img[ys, xs, :3]
    uniq, inv = np.unique(cols, axis=0, return_inverse=True)
    mapped = np.array([mapping[tuple(int(v) for v in c)] for c in uniq], np.uint8)
    img[ys, xs, :3] = mapped[inv]


def mean_l1(a: np.ndarray, b: np.ndarray, mask: np.ndarray) -> float:
    if not mask.any():
        return 0.0
    return float(np.abs(a[mask, :3].astype(np.int16) - b[mask, :3].astype(np.int16)).sum(-1).mean())


def pick_golds(colors: list[tuple[int, int, int]]) -> list[tuple[int, int, int]]:
    golds = []
    for r, g, b in colors:
        # Yellow metal only. Peach skin fails because its blue channel stays high.
        if r >= 165 and g >= 100 and b <= 100 and (g - b) >= 40 and 0 <= (r - g) <= 85 and r > g > b:
            golds.append((r, g, b))
    golds = sorted(set(golds), key=lambda c: sum(c))
    if len(golds) > 5:
        idx = np.linspace(0, len(golds) - 1, 5).round().astype(int)
        golds = [golds[int(i)] for i in idx]
    return golds


def recolor_gold(silver: np.ndarray, ramp: list[tuple[int, int, int]]) -> np.ndarray:
    out = np.zeros_like(silver)
    mask = silver[..., 3] > 0
    out[mask, 3] = 255
    if not mask.any() or not ramp:
        return out
    lum = silver[..., :3].sum(-1)
    vals = lum[mask]
    order = np.argsort(vals, kind="mergesort")
    ranks = np.empty(len(vals), np.int32)
    ranks[order] = np.arange(len(vals))
    bins = (ranks * len(ramp)) // max(1, len(vals))
    bins = np.clip(bins, 0, len(ramp) - 1)
    painted = np.array([ramp[i] for i in bins], np.uint8)
    out[mask, :3] = painted
    return out


def split_body(img: np.ndarray, cid: str) -> dict[str, np.ndarray]:
    parts = partition_masks(img, cid)
    layers = {}
    for _layer, slot, _suffix in SPLIT_SPECS:
        layer = np.zeros_like(img)
        mask = parts[slot]
        layer[mask] = img[mask]
        layers[slot] = layer
    # Exclusive and complete.
    covered = parts["skin"] | parts["face"] | parts["hair"] | parts["outfit"]
    if not np.array_equal(covered, img[..., 3] > 0):
        raise SystemExit(f"{cid} partition does not cover L01")
    overlap = (
        (parts["skin"] & parts["face"]).any()
        or (parts["skin"] & parts["hair"]).any()
        or (parts["skin"] & parts["outfit"]).any()
        or (parts["face"] & parts["hair"]).any()
        or (parts["face"] & parts["outfit"]).any()
        or (parts["hair"] & parts["outfit"]).any()
    )
    if overlap:
        raise SystemExit(f"{cid} partition overlaps")
    return layers


def clear_rgb_if_clear(img: np.ndarray) -> None:
    img[img[..., 3] == 0, :3] = 0
    partial = (img[..., 3] > 0) & (img[..., 3] < 255)
    img[partial, 3] = 255


def export_idle(cid: str) -> None:
    anim = json.loads((ROOT / "assets" / "animations" / "ANIM_SHARED_001.json").read_text())
    frames = anim["states"]["idle"]["frames"]
    load = C.default(cid)
    base = C.compose(cid, dict(load, vfx=False))
    layers = {layer["layer"]: layer["file"] for layer in C.CH[cid]["layers"] if not layer.get("variant")}
    sheet = Image.new("RGBA", (128 * len(frames), 128))
    for i, frame in enumerate(frames):
        im = Image.new("RGBA", (128, 128))
        dx, dy = frame["body"]
        if dx >= 0 and dy >= 0:
            im.alpha_composite(base, (dx, dy))
        else:
            im.paste(base.crop((max(0, -dx), max(0, -dy), 128, 128)), (max(0, dx), max(0, dy)))
        if "L09" in layers:
            vfx = Image.open(sprite_dir(cid) / layers["L09"]).convert("RGBA")
            _dx, vy = frame["vfx"]
            tmp = Image.new("RGBA", (128, 128))
            tmp.paste(vfx.crop((0, max(0, -vy), 128, 128)), (0, max(0, vy)))
            im.alpha_composite(tmp)
        sheet.paste(im, (i * 128, 0))
    sheet.save(sprite_dir(cid) / f"{cid}_idle_sheet.png")


def process_character(cid: str, rigs: dict) -> dict:
    char = rigs[cid]
    src = backup_dir(cid)
    names = {}
    for layer in char["layers"]:
        names[layer["file"]] = layer
    arrays = {}
    original = {}
    for file_name in names:
        arrays[file_name] = load_rgba(src / file_name)
        original[file_name] = arrays[file_name].copy()
    before_counts = {name: color_count(img) for name, img in arrays.items()}
    body_name = f"{cid}_L01_body.png"
    body = arrays[body_name]
    saved_alpha = {name: img[..., 3].copy() for name, img in arrays.items() if name != body_name}

    repair = repair_hidden(body, cid, char)
    face_protect = unify_face(body, cid)
    speckle = {}
    outline = {}
    for name, img in arrays.items():
        if "headgear_gold" in name:
            continue
        who = cid if name == body_name else None
        protect = protect_mask(img, who, face_protect if name == body_name else None)
        speckle[name] = despeckle(img, protect)
        if name == body_name:
            outline[name] = reinforce_outline(img, protect)

    editable = {name: img for name, img in arrays.items() if "headgear_gold" not in name}
    # Body pixels are weighted so sneaker/staff accents cannot eat the costume ramps.
    counts = gather_counts({n: im for n, im in editable.items() if n != body_name})
    for key, freq in gather_counts({body_name: body}).items():
        counts[key] = counts.get(key, 0) + freq * 4
    locks = lock_colors(editable, face_protect)
    mapping, survivors, last_de, merges = build_palette(counts, locks, TARGET_COLORS)
    for img in editable.values():
        apply_palette(img, mapping)
    # Second speckle pass stays inside the reduced palette.
    for name, img in editable.items():
        who = cid if name == body_name else None
        protect = protect_mask(img, who, face_protect if name == body_name else None)
        speckle[name] = speckle.get(name, 0) + despeckle(img, protect, passes=1)
        if name == body_name:
            outline[name] = outline.get(name, 0) + reinforce_outline(img, protect)
    for name, alpha in saved_alpha.items():
        arrays[name][..., 3] = alpha
        arrays[name][alpha == 0, :3] = 0

    silver_name = f"{cid}_L04_headgear_silver.png"
    gold_name = f"{cid}_L04_headgear_gold.png"
    gold_ramp = []
    if silver_name in arrays and gold_name in arrays:
        # Ramp comes from the cleaned shared palette so the gold pot does not add colors.
        gold_ramp = pick_golds(survivors)
        if len(gold_ramp) < 3:
            # Fall back to the original gold layer's own ramp, then snap attempt is skipped.
            src_gold = original[gold_name]
            gm = src_gold[..., 3] > 0
            gold_ramp = [tuple(int(v) for v in c) for c in np.unique(src_gold[gm][:, :3], axis=0)]
            gold_ramp = sorted(gold_ramp, key=sum)
        arrays[gold_name] = recolor_gold(arrays[silver_name], gold_ramp)

    for img in arrays.values():
        clear_rgb_if_clear(img)

    hidden = (original[body_name][..., 3] > 0) & equipment_mask(char)
    visible = (original[body_name][..., 3] > 0) & ~hidden
    # New sole pixels are outside the original mask; include them as intentional.
    stats_l1_visible = mean_l1(original[body_name], body, visible)
    stats_l1_hidden = mean_l1(original[body_name], body, hidden & (body[..., 3] > 0))
    if stats_l1_visible > 25:
        raise SystemExit(f"{cid} visible mean L1 {stats_l1_visible:.1f} is too high; refusing to save")

    parts = split_body(body, cid)
    # Composite identity: every opaque L01 pixel lives in exactly one split.
    rebuilt = np.zeros_like(body)
    for slot in ("skin", "face", "hair", "outfit"):
        m = parts[slot][..., 3] > 0
        rebuilt[m] = parts[slot][m]
    if not np.array_equal(rebuilt, body):
        raise SystemExit(f"{cid} split composite is not pixel-identical to L01")

    out_dir = sprite_dir(cid)
    for name, img in arrays.items():
        save_rgba(out_dir / name, img)
    for layer, slot, suffix in SPLIT_SPECS:
        save_rgba(out_dir / f"{cid}_{suffix}.png", parts[slot])

    after_counts = {name: color_count(img) for name, img in arrays.items()}
    stack_colors = set()
    for name, img in arrays.items():
        if "headgear_gold" in name:
            continue
        m = img[..., 3] > 0
        if m.any():
            for col in np.unique(img[m][:, :3], axis=0):
                stack_colors.add(tuple(int(v) for v in col))
    gold_stack = set(stack_colors)
    if gold_name in arrays:
        # Replace silver-only colors by removing silver pixels' colors that appear nowhere else,
        # then add gold. Simpler: recompute union with gold instead of silver.
        gold_stack = set()
        for name, img in arrays.items():
            if "headgear_silver" in name:
                continue
            m = img[..., 3] > 0
            if m.any():
                for col in np.unique(img[m][:, :3], axis=0):
                    gold_stack.add(tuple(int(v) for v in col))
    part_counts = {slot: int((parts[slot][..., 3] > 0).sum()) for _l, slot, _s in SPLIT_SPECS}
    alpha_l01_changed = int((original[body_name][..., 3] != body[..., 3]).sum())
    ys = np.where(body[..., 3] > 0)[0]
    return {
        "colors_before_layers": before_counts,
        "colors_after_layers": after_counts,
        "l01_before": before_counts[body_name],
        "l01_after": after_counts[body_name],
        "stack_before": len(gather_counts({k: v for k, v in original.items() if "headgear_gold" not in k})),
        "stack_after": len(stack_colors),
        "stack_after_gold": len(gold_stack),
        "palette_size": len(survivors),
        "last_merge_de": round(last_de, 2),
        "palette_merges": merges,
        "locked_colors": len(locks),
        "gold_ramp": gold_ramp,
        "repair": repair,
        "despeckle_px": speckle,
        "outline_px": outline,
        "visible_mean_l1": round(stats_l1_visible, 2),
        "hidden_mean_l1": round(stats_l1_hidden, 2),
        "l01_alpha_px_changed": alpha_l01_changed,
        "lowest_opaque_y": int(ys.max()) if len(ys) else None,
        "partition_px": part_counts,
        "anchors": EXPECTED_ANCHORS[cid],
    }


def main() -> None:
    ensure_backup()
    rigs = load_rigs()
    for cid, anchors in EXPECTED_ANCHORS.items():
        if rigs[cid]["anchors"] != anchors:
            raise SystemExit(f"anchors changed for {cid}; refusing to continue")
    report = {"method": "deterministic script tools/pixel_cleanup/clean.py", "hand_placed": False, "characters": {}}
    for cid in CHARS:
        print("cleaning", cid)
        report["characters"][cid] = process_character(cid, rigs)
        base = C.compose(cid, C.default(cid))
        base.save(sprite_dir(cid) / f"{cid}_base_composite.png")
        if cid == "AVT_AEG_001":
            gold = C.compose(cid, dict(C.default(cid), headgear="EQ_AEG_POT_HELMET_GOLD_001"))
            gold.save(sprite_dir(cid) / f"{cid}_base_composite_goldpot.png")
        export_idle(cid)
        info = report["characters"][cid]
        print(
            f"  L01 {info['l01_before']}->{info['l01_after']}  "
            f"stack {info['stack_before']}->{info['stack_after']}  "
            f"goldstack {info['stack_after_gold']}  "
            f"visible L1 {info['visible_mean_l1']}  lowest y {info['lowest_opaque_y']}"
        )
    QA_DIR.mkdir(parents=True, exist_ok=True)
    (QA_DIR / "stats.json").write_text(json.dumps(report, indent=1) + "\n")
    print("wrote", QA_DIR / "stats.json")


if __name__ == "__main__":
    main()
