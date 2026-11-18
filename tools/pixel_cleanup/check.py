"""Mechanical checks for the t230 pixel-cleanup pass. Exit 0 only if all pass."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (  # noqa: E402
    CHARS,
    EXPECTED_ANCHORS,
    QA_DIR,
    ROOT,
    backup_dir,
    color_count,
    compose_equipped,
    compose_stack,
    load_items,
    load_rgba,
    load_rigs,
    sprite_dir,
)

SPLIT = ("L01b_skin", "L02_face", "L02_hair", "L03_outfit")


def sha256(path: Path) -> str:
    import hashlib

    return hashlib.sha256(path.read_bytes()).hexdigest()


def fail(errors: list[str], message: str) -> None:
    errors.append(message)
    print("FAIL", message)


def main() -> None:
    errors: list[str] = []
    rigs = load_rigs()
    items = load_items(rigs)
    results = {"characters": {}, "passed": False}

    record_path = QA_DIR / "source_v1_sha256.json"
    if not record_path.exists():
        fail(errors, "missing source_v1_sha256.json")
        record = {}
    else:
        record = json.loads(record_path.read_text())
        for rel, digest in record.items():
            path = ROOT / rel
            if not path.exists() or sha256(path) != digest:
                fail(errors, f"backup bytes changed: {rel}")
        print(f"backup files unchanged: {len(record)}")

    for cid, expected in EXPECTED_ANCHORS.items():
        got = rigs[cid]["anchors"]
        if got != expected:
            fail(errors, f"{cid} anchors changed: {got}")
        elif got["feet"][1] != 122:
            fail(errors, f"{cid} feet anchor y is {got['feet'][1]}")
        else:
            print(f"{cid} anchors unchanged, feet y=122")

    for cid in CHARS:
        info = {"layers": {}}
        folder = sprite_dir(cid)
        src = backup_dir(cid)
        layer_files = sorted(p for p in folder.glob(f"{cid}_L*.png"))
        split_files = [folder / f"{cid}_{suffix}.png" for suffix in SPLIT]
        for path in layer_files + split_files:
            img = load_rgba(path)
            h, w = img.shape[:2]
            if (w, h) != (128, 128):
                fail(errors, f"{path.name} is {w}x{h}")
            partial = int(((img[..., 3] > 0) & (img[..., 3] < 255)).sum())
            if partial:
                fail(errors, f"{path.name} has {partial} partial-alpha pixels")
            dirty = int(((img[..., 3] == 0) & (img[..., :3].any(-1))).sum())
            if dirty:
                fail(errors, f"{path.name} has RGB in {dirty} transparent pixels")
            info["layers"][path.name] = {"colors": color_count(img), "opaque": int((img[..., 3] > 0).sum())}

        body = load_rgba(folder / f"{cid}_L01_body.png")
        ys = np.where(body[..., 3] > 0)[0]
        lowest = int(ys.max()) if len(ys) else -1
        below = int((body[122:, :, 3] > 0).sum()) if body.shape[0] > 122 else 0
        if below:
            fail(errors, f"{cid} L01 has {below} pixels on rows y>=122")
        info["lowest_opaque_y"] = lowest
        info["pixels_on_row_121"] = int((body[121, :, 3] > 0).sum())

        rebuilt = np.zeros_like(body)
        covered = np.zeros(body.shape[:2], bool)
        for suffix in SPLIT:
            layer = load_rgba(folder / f"{cid}_{suffix}.png")
            mask = layer[..., 3] > 0
            if (covered & mask).any():
                fail(errors, f"{cid} split layer {suffix} overlaps another part")
            covered |= mask
            rebuilt[mask] = layer[mask]
        if not np.array_equal(covered, body[..., 3] > 0):
            fail(errors, f"{cid} split does not cover L01")
        if not np.array_equal(rebuilt, body):
            fail(errors, f"{cid} split composite differs from L01")
        else:
            print(f"{cid} split composite == L01, lowest y={lowest}")

        # Geometry of fitted equipment layers stays on the original mask.
        for path in src.glob(f"{cid}_L*.png"):
            if path.name.endswith("_L01_body.png"):
                continue
            now = folder / path.name
            if not now.exists():
                fail(errors, f"missing cleaned layer {now.name}")
                continue
            before = load_rgba(path)
            after = load_rgba(now)
            if not np.array_equal(before[..., 3], after[..., 3]):
                fail(errors, f"{path.name} alpha mask changed")

        stack = np.array(compose_stack(cid, rigs, folder, gold=False))
        info["stack_colors"] = color_count(stack)
        if info["stack_colors"] > 48:
            fail(errors, f"{cid} sprite-stack uses {info['stack_colors']} colours (target <=48)")
        else:
            print(f"{cid} sprite-stack colours {info['stack_colors']} <= 48")

        before_eq = np.array(compose_equipped(cid, rigs, items, src))
        after_eq = np.array(compose_equipped(cid, rigs, items, folder))
        info["equipped_colors_before"] = color_count(before_eq)
        info["equipped_colors_after"] = color_count(after_eq)
        info["l01_colors"] = color_count(body)
        results["characters"][cid] = info

    silver = load_rgba(sprite_dir("AVT_AEG_001") / "AVT_AEG_001_L04_headgear_silver.png")
    gold = load_rgba(sprite_dir("AVT_AEG_001") / "AVT_AEG_001_L04_headgear_gold.png")
    if not np.array_equal(silver[..., 3], gold[..., 3]):
        fail(errors, "gold and silver helmet alpha masks differ")
    else:
        both = silver[..., 3] > 0
        changed = int((np.any(silver[..., :3] != gold[..., :3], axis=-1) & both).sum())
        print(f"gold/silver masks equal, recolored pixels {changed}")
        if changed == 0:
            fail(errors, "gold helmet is identical to silver")
    stack_s = np.array(compose_stack("AVT_AEG_001", rigs, sprite_dir("AVT_AEG_001"), gold=False))
    stack_g = np.array(compose_stack("AVT_AEG_001", rigs, sprite_dir("AVT_AEG_001"), gold=True))
    diff = np.any(stack_s != stack_g, axis=-1)
    outside = int((diff & (silver[..., 3] == 0)).sum())
    if outside:
        fail(errors, f"silver/gold stack differs in {outside} pixels outside the helmet")
    else:
        print(f"silver vs gold stack changes {int(diff.sum())} px, 0 outside the helmet")

    # Idle sheets stay on the 128-tall strip.
    for cid in CHARS:
        idle = load_rgba(sprite_dir(cid) / f"{cid}_idle_sheet.png")
        if idle.shape[0] != 128 or idle.shape[1] % 128 != 0:
            fail(errors, f"{cid} idle sheet shape {idle.shape}")
        partial = int(((idle[..., 3] > 0) & (idle[..., 3] < 255)).sum())
        if partial:
            fail(errors, f"{cid} idle sheet partial alpha {partial}")

    results["errors"] = errors
    results["passed"] = not errors
    QA_DIR.mkdir(parents=True, exist_ok=True)
    (QA_DIR / "check_results.json").write_text(json.dumps(results, indent=1) + "\n")
    if errors:
        print(f"{len(errors)} check(s) failed")
        sys.exit(1)
    print("ALL CHECKS PASSED")


if __name__ == "__main__":
    main()
