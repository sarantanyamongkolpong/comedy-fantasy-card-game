"""Nearest-neighbour x4 before/after sheets for the pixel-cleanup pass.

Writes only docs/qa/pixel_cleanup/. Does not touch preview/ or docs/qa/*.png.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (  # noqa: E402
    BOXES,
    CHARS,
    NAMES,
    QA_DIR,
    backup_dir,
    color_count,
    compose_equipped,
    compose_stack,
    font,
    hstack,
    load_items,
    load_rgba,
    load_rigs,
    sprite_dir,
    zoom_panel,
)

SPLIT = ("L01b_skin", "L02_face", "L02_hair", "L03_outfit")


def rgba_image(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def save_pair(before: Image.Image, after: Image.Image, left: str, right: str, path: Path) -> None:
    hstack([zoom_panel(before, left), zoom_panel(after, right)]).save(path)


def face_pair(cid: str) -> Image.Image:
    x0, x1, y0, y1 = BOXES[cid]["face"]
    x0, y0 = max(0, x0 - 10), max(0, y0 - 12)
    x1, y1 = min(127, x1 + 10), min(127, y1 + 8)

    def crop(path: Path) -> Image.Image:
        im = rgba_image(path).crop((x0, y0, x1 + 1, y1 + 1))
        return im.resize((im.width * 8, im.height * 8), Image.Resampling.NEAREST)

    before = crop(backup_dir(cid) / f"{cid}_L01_body.png")
    after = crop(sprite_dir(cid) / f"{cid}_L01_body.png")
    gap = 8
    sheet = Image.new("RGBA", (before.width + after.width + gap, before.height + 36), (16, 14, 24, 255))
    bg = (186, 190, 204, 255)
    for im, x, label in ((before, 0, "BEFORE face x8"), (after, before.width + gap, "AFTER face x8")):
        art = Image.new("RGBA", im.size, bg)
        art.alpha_composite(im)
        sheet.paste(art, (x, 0))
        ImageDraw.Draw(sheet).text((x + 6, im.height + 8), label, fill=(255, 255, 255, 255), font=font(15, True))
    return sheet


def split_row(cid: str) -> Image.Image:
    panels = []
    for suffix in SPLIT:
        im = rgba_image(sprite_dir(cid) / f"{cid}_{suffix}.png")
        panels.append(zoom_panel(im, f"{suffix}  {color_count(np.array(im))} col"))
    return hstack(panels)


def main() -> None:
    rigs = load_rigs()
    items = load_items(rigs)
    QA_DIR.mkdir(parents=True, exist_ok=True)
    after_equipped = []
    for cid in CHARS:
        name = NAMES[cid]
        before_stack = compose_stack(cid, rigs, backup_dir(cid))
        after_stack = compose_stack(cid, rigs, sprite_dir(cid))
        save_pair(
            before_stack,
            after_stack,
            f"BEFORE {name} sprite stack",
            f"AFTER {name} sprite stack",
            QA_DIR / f"{cid}_before_after_stack_x4.png",
        )
        before_eq = compose_equipped(cid, rigs, items, backup_dir(cid))
        after_eq = compose_equipped(cid, rigs, items, sprite_dir(cid))
        save_pair(
            before_eq,
            after_eq,
            f"BEFORE {name} + equipment",
            f"AFTER {name} + equipment",
            QA_DIR / f"{cid}_before_after_equipped_x4.png",
        )
        save_pair(
            rgba_image(backup_dir(cid) / f"{cid}_L01_body.png"),
            rgba_image(sprite_dir(cid) / f"{cid}_L01_body.png"),
            f"BEFORE {name} body (slots empty)",
            f"AFTER {name} body (slots empty)",
            QA_DIR / f"{cid}_before_after_body_x4.png",
        )
        face_pair(cid).save(QA_DIR / f"{cid}_face_x8.png")
        split_row(cid).save(QA_DIR / f"{cid}_split_layers_x4.png")
        after_equipped.append(zoom_panel(after_eq, name))
        print("sheets", cid)
    hstack(after_equipped).save(QA_DIR / "all_after_equipped_x4.png")
    silver = compose_stack("AVT_AEG_001", rigs, sprite_dir("AVT_AEG_001"), gold=False)
    gold = compose_stack("AVT_AEG_001", rigs, sprite_dir("AVT_AEG_001"), gold=True)
    silver_eq = compose_equipped("AVT_AEG_001", rigs, items, sprite_dir("AVT_AEG_001"), gold=False)
    gold_eq = compose_equipped("AVT_AEG_001", rigs, items, sprite_dir("AVT_AEG_001"), gold=True)
    hstack(
        [
            zoom_panel(silver, "AFTER stack silver pot"),
            zoom_panel(gold, "AFTER stack gold pot"),
            zoom_panel(silver_eq, "AFTER equipped silver (equipment PNG)"),
            zoom_panel(gold_eq, "AFTER equipped gold (equipment PNG)"),
        ]
    ).save(QA_DIR / "AVT_AEG_001_silver_vs_gold_x4.png")
    # Body with helmet removed is the L01 sheet; also show stack with no L04.
    print("wrote", QA_DIR)


if __name__ == "__main__":
    main()
