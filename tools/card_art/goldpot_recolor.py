#!/usr/bin/env python3
"""Deterministic silver-pot -> gold-pot recolour for AVT_AEG_001 card art.

The v1 gold-pot edit also gilded the pauldrons. This tool does not regenerate
the character and does not copy pixels from that edit. It builds a pot-helmet
mask on the silver illustration and remaps only those pixels along a gold
luminance ramp. Every pixel outside the mask is copied unchanged, so the
shield, pauldrons, face, and costume stay identical to the source.

No image-generation model is used.
"""
from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC_REL = Path("assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v1.png")
GOLD_REF_REL = Path(
    "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v1_variant_goldpot.png"
)

# Pot body flood stays below the sky and above the pauldrons.
POT_WINDOW = (300, 92, 640, 248)  # x0, y0, x1, y1
# Zones measured from the silver illustration. They cover the knob disc, the
# stem, and each loop, and they stop before the cloud bank, the ear, and the pauldron.
KNOB_BOX = (408, 50, 466, 98)
STEM_BOX = (414, 70, 452, 102)
LEFT_HANDLE = (260, 192, 338, 250)
RIGHT_HANDLE = (586, 154, 668, 226)
POT_SEEDS = [
    (430, 140), (400, 160), (500, 150), (360, 160), (540, 140),
    (450, 120), (380, 140), (560, 150), (420, 180), (480, 170),
]


def _channels(rgb: np.ndarray):
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    return r, g, b, mx, mn, mx - mn


def _gradient(rgb: np.ndarray) -> np.ndarray:
    a = rgb.astype(np.int16)
    mag = np.zeros(a.shape[:2], np.int16)
    mag[:, 1:] += np.abs(a[:, 1:] - a[:, :-1]).sum(2)
    mag[1:, :] += np.abs(a[1:, :] - a[:-1, :]).sum(2)
    return mag


def _flood(passable: np.ndarray, seeds: list[tuple[int, int]]) -> np.ndarray:
    h, w = passable.shape
    vis = np.zeros((h, w), np.uint8)
    q: deque[tuple[int, int]] = deque()
    for x, y in seeds:
        if 0 <= x < w and 0 <= y < h and passable[y, x] and not vis[y, x]:
            vis[y, x] = 1
            q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and passable[ny, nx] and not vis[ny, nx]:
                vis[ny, nx] = 1
                q.append((nx, ny))
    return vis.astype(bool)


def _fill_small_holes(mask: np.ndarray, limit: int = 700) -> np.ndarray:
    """Fill enclosed gaps (star glints, scratch cores) and leave handle holes."""
    h, w = mask.shape
    bg = np.zeros((h, w), np.uint8)
    q: deque[tuple[int, int]] = deque()
    bg[0, 0] = 1
    q.append((0, 0))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not bg[ny, nx] and not mask[ny, nx]:
                bg[ny, nx] = 1
                q.append((nx, ny))
    holes = ~mask & ~bg.astype(bool)
    seen = np.zeros((h, w), np.uint8)
    out = mask.copy()
    ys, xs = np.where(holes)
    for y, x in zip(ys, xs):
        if seen[y, x]:
            continue
        comp = [(x, y)]
        seen[y, x] = 1
        q = deque([(x, y)])
        while q:
            cx, cy = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h and holes[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = 1
                    q.append((nx, ny))
                    comp.append((nx, ny))
        if len(comp) <= limit:
            for cx, cy in comp:
                out[cy, cx] = True
    return out


def _keep_component(mask: np.ndarray, seed: tuple[int, int]) -> np.ndarray:
    return _flood(mask, [seed])


def _steel(rgb: np.ndarray) -> np.ndarray:
    """Neutral steel, including warm golden-hour shades, without skin or eyes."""
    r, g, b, mx, mn, spread = _channels(rgb)
    skin = (r > 155) & (r > g + 30) & (g >= b - 5) & (r - b > 85)
    green = (g > r + 8) & (g > b + 8)
    return (spread < 48) & (mx > 25) & (mx < 195) & (r - b < 50) & ~skin & ~green


def _zone(shape, box) -> np.ndarray:
    m = np.zeros(shape, bool)
    x0, y0, x1, y1 = box
    m[y0:y1, x0:x1] = True
    return m


def _fill_holes_in_zone(mask: np.ndarray, zone: np.ndarray) -> np.ndarray:
    """Fill gaps that are enclosed inside `zone` (knob highlight, handle none)."""
    h, w = mask.shape
    bg = np.zeros((h, w), np.uint8)
    q: deque[tuple[int, int]] = deque()
    # Seed background at every zone-edge pixel that is not mask, so only
    # fully enclosed gaps are filled.
    ys, xs = np.where(zone)
    if len(xs) == 0:
        return mask
    edge = np.zeros((h, w), bool)
    edge[ys.min() : ys.max() + 1, xs.min()] = True
    edge[ys.min() : ys.max() + 1, xs.max()] = True
    edge[ys.min(), xs.min() : xs.max() + 1] = True
    edge[ys.max(), xs.min() : xs.max() + 1] = True
    for y, x in zip(*np.where(edge & zone & ~mask)):
        if not bg[y, x]:
            bg[y, x] = 1
            q.append((int(x), int(y)))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and zone[ny, nx] and not mask[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = 1
                q.append((nx, ny))
    return mask | (zone & ~bg.astype(bool) & ~mask)


def build_pot_mask(rgb: np.ndarray) -> np.ndarray:
    r, g, b, mx, mn, spread = _channels(rgb)
    h, w = r.shape
    mag = _gradient(rgb)
    metal = (spread < 85) & (mx > 48) & (b <= r + 15)
    metal &= ~((r > g) & (g > b) & (r - b > 40) & (g < 110) & (r < 150))
    metal &= ~((g > r + 8) & (g > b + 8))
    metal &= ~((r > 160) & (r > g + 35) & (g > b) & (r - b > 90))
    x0, y0, x1, y1 = POT_WINDOW
    window = np.zeros((h, w), bool)
    window[y0:y1, x0:x1] = True
    # Strong outlines stop the flood so it cannot walk into the sky or the face.
    passable = metal & window & (mag <= 110)
    body = _flood(passable, POT_SEEDS)

    im = Image.fromarray((body * 255).astype(np.uint8))
    closed = np.array(im.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))) > 0
    dil = np.array(Image.fromarray((closed * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    dark = mx < 75
    body = closed | (dil & dark & window)
    body = _fill_small_holes(body, limit=700)
    body = _keep_component(body, (430, 150))

    # Knob disc, stem, and the two loops. Each zone was measured on the silver
    # art. Steel gating keeps the sky hole in each loop unpainted. The knob's
    # bright cap is an enclosed gap, so it is filled; the loop holes open onto
    # the sky at the zone edge and are not filled.
    steel = _steel(rgb)
    knob_zone = _zone(steel.shape, KNOB_BOX)
    # The cloud corner above-left of the knob is inside the rectangular zone.
    yy, xx = np.mgrid[0 : steel.shape[0], 0 : steel.shape[1]]
    knob_zone &= ~((yy < 58) & (xx < 424))
    knob = _fill_holes_in_zone(steel & knob_zone, knob_zone)
    stem = steel & _zone(steel.shape, STEM_BOX)
    # The left loop's lower rim sits just outside the steel core. Thicken into a
    # slightly taller zone; the core itself does not include the background
    # under the loop.
    left_zone = _zone(steel.shape, (252, 188, 342, 262))
    left = _thicken(steel & _zone(steel.shape, LEFT_HANDLE), left_zone, rgb, radius=4)
    right = _thicken(steel & _zone(steel.shape, RIGHT_HANDLE), _zone(steel.shape, RIGHT_HANDLE), rgb, radius=2)
    return body | knob | stem | left | right


def _thicken(part: np.ndarray, zone: np.ndarray, rgb: np.ndarray, radius: int = 2) -> np.ndarray:
    """Pull in the dark rim and the near highlight of a loop without crossing sky."""
    r, g, b, mx, _, spread = _channels(rgb)
    # MaxFilter size must be odd. radius 2 -> 5, radius 4 -> 9.
    size = radius * 2 + 1
    dil = np.array(Image.fromarray((part * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(size))) > 0
    sky = (b > r + 18) & (b > 100)
    skin = (r > 155) & (r > g + 30) & (r - b > 85)
    near = dil & zone & ~sky & ~skin & (spread < 80) & (mx < 220)
    return part | near


def gold_ramp_from_reference(silver: np.ndarray, gold_ref: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Median gold colour per luminance bin, sampled on the pot of the v1 edit.

    The v1 edit is only a colour reference. Misaligned pauldron pixels are not
    in `mask`. Bins are smoothed and nudged toward a canonical gold so a
    zero-blue shadow sample cannot go crimson.
    """
    g = gold_ref.astype(np.float32)
    lum = 0.2126 * g[:, :, 0] + 0.7152 * g[:, :, 1] + 0.0722 * g[:, :, 2]
    goldish = (
        (g[:, :, 0] + 8 > g[:, :, 1])
        & (g[:, :, 1] > g[:, :, 2] + 12)
        & (g[:, :, 0] > 70)
        & mask
    )
    bins = []
    for b0 in range(0, 256, 4):
        sel = goldish & (lum >= b0) & (lum < b0 + 4)
        if int(sel.sum()) >= 16:
            bins.append(np.median(g[sel], axis=0))
        else:
            bins.append(None)
    last = None
    for i, med in enumerate(bins):
        if med is not None:
            last = med
        elif last is not None:
            bins[i] = last.copy()
    last = None
    for i in range(len(bins) - 1, -1, -1):
        if bins[i] is not None:
            last = bins[i]
        elif last is not None:
            bins[i] = last.copy()
    arr = np.stack(bins).astype(np.float32)
    for _ in range(3):
        arr[1:-1] = arr[:-2] * 0.25 + arr[1:-1] * 0.5 + arr[2:] * 0.25
    # Canonical gold at the same luminance, mixed in so dark bins stay yellow-gold.
    y = 0.2126 * arr[:, 0] + 0.7152 * arr[:, 1] + 0.0722 * arr[:, 2]
    canon = np.stack(
        [
            np.clip(y * 1.12, 0, 255),
            np.clip(y * 0.80, 0, 255),
            np.clip(y * 0.34, 0, 255),
        ],
        axis=1,
    )
    # Highlights (high Y) stay close to the painted warm-white; shadows take more canon.
    t = np.clip((y - 40) / 180, 0, 1)[:, None]
    mixed = canon * (0.55 - 0.40 * t) + arr * (0.45 + 0.40 * t)
    return np.clip(mixed, 0, 255)


def recolor(silver: np.ndarray, ramp: np.ndarray, mask: np.ndarray) -> np.ndarray:
    lum = 0.2126 * silver[:, :, 0] + 0.7152 * silver[:, :, 1] + 0.0722 * silver[:, :, 2]
    # Interpolate the 4-wide bins so a scratch one level darker stays darker.
    x = np.clip(lum / 4.0, 0, len(ramp) - 1.001)
    i0 = np.floor(x).astype(np.int32)
    f = (x - i0)[..., None]
    mapped = ramp[i0] * (1 - f) + ramp[np.minimum(i0 + 1, len(ramp) - 1)] * f
    out = silver.astype(np.float32).copy()
    out[mask] = mapped[mask]
    return np.clip(out, 0, 255).astype(np.uint8)


def run(src: Path, gold_ref: Path, out_png: Path, mask_png: Path) -> dict:
    silver = np.array(Image.open(src).convert("RGB"))
    ref = np.array(Image.open(gold_ref).convert("RGB"))
    if silver.shape != ref.shape:
        raise SystemExit(f"shape mismatch {silver.shape} vs {ref.shape}")
    mask = build_pot_mask(silver)
    ramp = gold_ramp_from_reference(silver, ref, mask)
    out = recolor(silver, ramp, mask)
    outside = ~mask
    changed_outside = int((out != silver).any(2)[outside].sum())
    if changed_outside != 0:
        raise SystemExit(f"pixel leak outside pot mask: {changed_outside}")
    out_png.parent.mkdir(parents=True, exist_ok=True)
    mask_png.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out).save(out_png, optimize=True)
    Image.fromarray((mask * 255).astype(np.uint8)).save(mask_png)
    ys, xs = np.where(mask)
    return {
        "mask_pixels": int(mask.sum()),
        "changed_pixels": int((out != silver).any(2).sum()),
        "changed_outside_mask": changed_outside,
        "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
        "out": str(out_png),
        "mask": str(mask_png),
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--src", type=Path, default=ROOT / SRC_REL)
    p.add_argument("--gold-ref", type=Path, default=ROOT / GOLD_REF_REL)
    p.add_argument(
        "--out",
        type=Path,
        default=ROOT / "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v2_variant_goldpot.png",
    )
    p.add_argument(
        "--mask",
        type=Path,
        default=ROOT / "docs/qa/card_art_v2/masks/AVT_AEG_001_goldpot_mask.png",
    )
    args = p.parse_args()
    info = run(args.src, args.gold_ref, args.out, args.mask)
    print(info)


if __name__ == "__main__":
    main()
