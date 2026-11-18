"""Shared helpers for the t230 pixel-cleanup pass.

Deterministic. Reads rigs and equipment for measurements and composites.
Does not write outside the sprite folders, the manifest, or docs/qa/pixel_cleanup.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
CHARS = ("AVT_AEG_001", "AVT_PHA_001", "AVT_CEL_001", "AVT_SAN_001")
NAMES = {
    "AVT_AEG_001": "Sir Potlid",
    "AVT_PHA_001": "Nox Squeak",
    "AVT_CEL_001": "Madame Meteor",
    "AVT_SAN_001": "Sister Plaster",
}
# Authoritative anchors from the rigs at the start of this pass. Do not move them.
EXPECTED_ANCHORS = {
    "AVT_AEG_001": {
        "head": [66, 34],
        "main_hand": [46, 75],
        "off_hand": [86, 76],
        "back": [60, 58],
        "body_center": [62, 80],
        "feet": [64, 122],
    },
    "AVT_PHA_001": {
        "head": [70, 30],
        "main_hand": [40, 66],
        "off_hand": [88, 60],
        "back": [60, 52],
        "body_center": [64, 74],
        "feet": [64, 122],
    },
    "AVT_CEL_001": {
        "head": [68, 32],
        "main_hand": [44, 62],
        "off_hand": [89, 58],
        "back": [64, 56],
        "body_center": [66, 78],
        "feet": [64, 122],
    },
    "AVT_SAN_001": {
        "head": [68, 18],
        "main_hand": [48, 61],
        "off_hand": [93, 60],
        "back": [62, 54],
        "body_center": [66, 78],
        "feet": [64, 122],
    },
}
# Tight boxes measured from the prototype pixels. x0, x1, y0, y1 inclusive.
BOXES = {
    "AVT_AEG_001": {
        "face": (52, 80, 38, 56),
        "head": (46, 88, 30, 58),
        "hands": ((36, 58, 68, 86), (74, 96, 68, 88)),
        "streak": None,
        "feet_zones": ((34, 50), (72, 92)),
    },
    "AVT_PHA_001": {
        "face": (64, 82, 38, 52),
        "head": (50, 98, 18, 50),
        "hands": ((36, 62, 52, 78), (76, 98, 50, 74)),
        "streak": (60, 90, 18, 40),
        "feet_zones": ((36, 58), (70, 92)),
    },
    "AVT_CEL_001": {
        "face": (58, 84, 36, 56),
        "head": (46, 92, 28, 58),
        "hands": ((34, 62, 54, 74), (76, 102, 50, 72)),
        "streak": None,
        "feet_zones": (),
    },
    "AVT_SAN_001": {
        "face": (54, 82, 22, 44),
        "head": (44, 92, 10, 46),
        "hands": ((36, 58, 50, 72), (80, 102, 48, 72)),
        "streak": None,
        "feet_zones": (),
    },
}
SPLIT_SPECS = (
    ("L01b", "skin", "L01b_skin"),
    ("L02", "face", "L02_face"),
    ("L02", "hair", "L02_hair"),
    ("L03", "outfit", "L03_outfit"),
)
QA_DIR = ROOT / "docs" / "qa" / "pixel_cleanup"
BG = (186, 190, 204, 255)


def sprite_dir(cid: str) -> Path:
    return ROOT / "assets" / "characters" / cid / "sprite"


def backup_dir(cid: str) -> Path:
    return sprite_dir(cid) / "_source_v1"


def load_rgba(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGBA"))


def save_rgba(path: Path, arr: np.ndarray) -> None:
    img = arr.copy()
    img[img[..., 3] == 0, :3] = 0
    Image.fromarray(img, "RGBA").save(path)


def load_rigs() -> dict:
    rigs = {}
    for name in ("humanoid_heavy", "humanoid_standard"):
        data = json.loads((ROOT / "assets" / "characters" / "_rigs" / f"{name}.json").read_text())
        for cid, char in data["characters"].items():
            rigs[cid] = char
            rigs[cid]["_rig"] = name
    return rigs


def load_items(rigs: dict) -> dict:
    items = {}
    shared = json.loads((ROOT / "assets" / "equipment" / "shared_items.json").read_text())
    for key, val in shared.items():
        items[key] = {"file": f"assets/equipment/{key}.png", "pivot": val["pivot"], "slot": val["slot"]}
    for char in rigs.values():
        for key, val in char["native_items"].items():
            items[key] = {"file": val["file"], "pivot": val["pivot"], "slot": val["slot"]}
    return items


def default_loadout(char: dict) -> dict:
    load = {}
    for key, val in char["native_items"].items():
        if val["slot"] not in load and "GOLD" not in key:
            load[val["slot"]] = key
    return load


def layer_map(char: dict, gold: bool = False) -> dict:
    """Non-variant layers, with the gold helmet swapped in when requested."""
    found = {}
    for layer in char["layers"]:
        if layer.get("variant"):
            continue
        found[layer["layer"]] = layer["file"]
    if gold:
        for layer in char["layers"]:
            if layer.get("variant") == "gold":
                found[layer["layer"]] = layer["file"]
    return found


def _paste(base: Image.Image, arr: np.ndarray, xy=(0, 0)) -> None:
    base.alpha_composite(Image.fromarray(arr, "RGBA"), xy)


def compose_equipped(cid: str, rigs: dict, items: dict, sprite: Path, gold: bool = False, vfx: bool = True) -> Image.Image:
    """Same draw order as tools/compose.py. Equipment PNGs are read-only."""
    char = rigs[cid]
    layers = layer_map(char, gold=False)
    out = Image.new("RGBA", (128, 128))
    _paste(out, load_rgba(sprite / layers["L01"]))
    load = default_loadout(char)
    if gold and cid == "AVT_AEG_001":
        load["headgear"] = "EQ_AEG_POT_HELMET_GOLD_001"

    def item(slot: str) -> None:
        iid = load.get(slot)
        if not iid:
            return
        it = items[iid]
        if slot == "headgear":
            anchor = char["anchors"]["head"]
        elif slot == "accessory":
            anchor = char["anchors"]["feet"]
        else:
            anchor = char["anchors"][slot]
        fit = char.get("fit", {}).get(iid, [0, 0])
        im = Image.open(ROOT / it["file"]).convert("RGBA")
        out.alpha_composite(im, (anchor[0] - it["pivot"][0] + fit[0], anchor[1] - it["pivot"][1] + fit[1]))

    item("accessory")
    item("headgear")
    item("main_hand")
    if "L05f" in layers:
        _paste(out, load_rgba(sprite / layers["L05f"]))
    item("off_hand")
    if "L06f" in layers:
        _paste(out, load_rgba(sprite / layers["L06f"]))
    if vfx and "L09" in layers:
        _paste(out, load_rgba(sprite / layers["L09"]))
    return out


def compose_stack(cid: str, rigs: dict, sprite: Path, gold: bool = False) -> Image.Image:
    """Full-canvas sprite layers only (cleaned helmets/weapons live here)."""
    char = rigs[cid]
    layers = layer_map(char, gold=gold)
    out = Image.new("RGBA", (128, 128))
    for key in ("L01", "L08", "L04", "L05", "L05f", "L06", "L06f", "L09"):
        if key in layers and (sprite / layers[key]).exists():
            _paste(out, load_rgba(sprite / layers[key]))
    return out


def color_count(arr: np.ndarray) -> int:
    mask = arr[..., 3] > 0
    if not mask.any():
        return 0
    return int(len(np.unique(arr[mask][:, :3], axis=0)))


def opaque_bounds(arr: np.ndarray):
    ys, xs = np.where(arr[..., 3] > 0)
    if len(ys) == 0:
        return None
    return int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())


def lab_rows(rgb: np.ndarray) -> np.ndarray:
    """CIE76 Lab for an (N,3) array of 0-255 RGB. Deterministic."""
    x = rgb.astype(np.float64) / 255.0
    x = np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)
    matrix = np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ]
    )
    xyz = np.atleast_2d(x) @ matrix.T
    xyz = xyz / np.array([0.95047, 1.0, 1.08883])
    delta = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16.0 / 116.0)
    return np.stack(
        [116 * delta[:, 1] - 16, 500 * (delta[:, 0] - delta[:, 1]), 200 * (delta[:, 1] - delta[:, 2])],
        axis=1,
    )


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    path = Path("/usr/share/fonts/truetype/dejavu") / name
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def zoom_panel(im: Image.Image, label: str, scale: int = 4) -> Image.Image:
    side = 128 * scale
    frame = Image.new("RGBA", (side, side + 36), (28, 26, 38, 255))
    art = Image.new("RGBA", (side, side), BG)
    art.alpha_composite(im.resize((side, side), Image.Resampling.NEAREST))
    frame.paste(art, (0, 0))
    draw = ImageDraw.Draw(frame)
    draw.text((8, side + 8), label, fill=(255, 255, 255, 255), font=font(15, bold=True))
    return frame


def hstack(panels: list[Image.Image], gap: int = 8) -> Image.Image:
    width = sum(p.width for p in panels) + gap * (len(panels) - 1)
    height = max(p.height for p in panels)
    sheet = Image.new("RGBA", (width, height), (16, 14, 24, 255))
    x = 0
    for panel in panels:
        sheet.paste(panel, (x, 0))
        x += panel.width + gap
    return sheet
