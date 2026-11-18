#!/usr/bin/env python3
"""Build the card-art v2 quality pass.

Identity lock: base illustrations are the v1 PNGs, copied byte-for-byte.
The gold-pot file is a masked recolour of that silver painting (see
goldpot_recolor.py). No image-generation model is used.

v1 frame and emblem files are not overwritten. v2 frames are the same
geometry with a top-left light pass. EMBLEM_AEGIS_v2 redraws the pot-lid
so the handle still reads at the 96px socket.
"""
from __future__ import annotations

import importlib.util
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
CARD = ROOT / "assets/characters"
FRAMES = ROOT / "assets/card-art/frames"
QA = ROOT / "docs/qa/card_art_v2"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

BASES = [
    ("AVT_AEG_001", "AVT_AEG_001_card_v1.png", "AVT_AEG_001_card_v2.png"),
    ("AVT_PHA_001", "AVT_PHA_001_card_v1.png", "AVT_PHA_001_card_v2.png"),
    ("AVT_CEL_001", "AVT_CEL_001_card_v1.png", "AVT_CEL_001_card_v2.png"),
    ("AVT_SAN_001", "AVT_SAN_001_card_v1.png", "AVT_SAN_001_card_v2.png"),
]
PROOFS = [
    ("AVT_AEG_001", "Sir Potlid", "AEGIS", "AVT_AEG_001_card_v2.png"),
    ("AVT_AEG_001", "Sir Potlid", "AEGIS", "AVT_AEG_001_card_v2_variant_goldpot.png"),
    ("AVT_PHA_001", "Nox Squeak", "PHANTOM", "AVT_PHA_001_card_v2.png"),
    ("AVT_CEL_001", "Madame Meteor", "CELESTIAL", "AVT_CEL_001_card_v2.png"),
    ("AVT_SAN_001", "Sister Plaster", "SANCTUARY", "AVT_SAN_001_card_v2.png"),
]


def _load_gold():
    path = Path(__file__).resolve().parent / "goldpot_recolor.py"
    spec = importlib.util.spec_from_file_location("goldpot_recolor", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _load_v1_frames():
    path = FRAMES / "shared/build_frames.py"
    spec = importlib.util.spec_from_file_location("build_frames_v1", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _light_top_left(im: Image.Image) -> Image.Image:
    """Multiply opaque chrome so highlights sit top-left, matching the bible."""
    arr = np.array(im).astype(np.float32)
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    t = (xx / max(w - 1, 1)) * 0.55 + (yy / max(h - 1, 1)) * 0.45
    factor = (1.07 - 0.12 * t)[:, :, None]
    rgb = np.clip(arr[:, :, :3] * factor, 0, 255)
    out = arr.copy()
    out[:, :, :3] = rgb
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def emblem_aegis_v2() -> Image.Image:
    """Pot-lid emblem. The bar and knob are large enough to survive 96px."""
    ss = 4
    n = 256 * ss
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def s(*vals):
        return [int(round(v * ss)) for v in vals]

    d.ellipse(s(16, 16, 240, 240), fill=(232, 186, 70, 255))
    d.ellipse(s(34, 34, 222, 222), fill=(148, 156, 170, 255))
    # Top-left light on the lid, bottom-right shade.
    d.ellipse(s(46, 50, 214, 214), fill=(112, 120, 134, 255))
    d.ellipse(s(40, 38, 196, 190), fill=(198, 206, 216, 255))
    d.rounded_rectangle(s(54, 108, 202, 150), radius=18 * ss, fill=(226, 230, 236, 255))
    d.rounded_rectangle(s(54, 108, 202, 150), radius=18 * ss, outline=(32, 40, 52, 255), width=4 * ss)
    d.ellipse(s(104, 72, 152, 128), fill=(244, 246, 250, 255), outline=(32, 40, 52, 255), width=4 * ss)
    d.ellipse(s(116, 82, 138, 104), fill=(255, 255, 255, 235))
    d.ellipse(s(68, 118, 86, 136), fill=(232, 186, 70, 255), outline=(32, 40, 52, 255), width=2 * ss)
    d.ellipse(s(170, 118, 188, 136), fill=(232, 186, 70, 255), outline=(32, 40, 52, 255), width=2 * ss)
    return img.resize((256, 256), Image.LANCZOS)


def _webp(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGB").resize((512, 683), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=82, method=6)


def _copy_bases() -> None:
    for cid, src_name, dst_name in BASES:
        src = CARD / cid / "card" / src_name
        dst = CARD / cid / "card" / dst_name
        shutil.copyfile(src, dst)
        _webp(dst, dst.with_name(dst.stem + "_web.webp"))


def _frames(mod) -> None:
    out_dir = FRAMES / "factions"
    shared = FRAMES / "shared"
    for skin, name in (
        ("BASE", "FRAME_BASE_v2.png"),
        ("AEGIS", "FRAME_AEGIS_v2.png"),
        ("PHANTOM", "FRAME_PHANTOM_v2.png"),
        ("CELESTIAL", "FRAME_CELESTIAL_v2.png"),
        ("SANCTUARY", "FRAME_SANCTUARY_v2.png"),
    ):
        folder = shared if skin == "BASE" else out_dir
        _light_top_left(mod.build_frame(skin)).save(folder / name, optimize=True)
    emblem_aegis_v2().save(out_dir / "EMBLEM_AEGIS_v2.png", optimize=True)


def _layout() -> None:
    path = FRAMES / "frame_layout.json"
    data = json.loads(path.read_text())
    data["v2"] = {
        "card_png": "assets/characters/<ID>/card/<ID>_card_v2.png",
        "card_webp": "assets/characters/<ID>/card/<ID>_card_v2_web.webp",
        "goldpot_png": "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v2_variant_goldpot.png",
        "frames": "FRAME_<FAC>_v2.png beside the v1 frames; FRAME_BASE_v2.png in shared/",
        "emblem_aegis": "EMBLEM_AEGIS_v2.png (pot-lid redraw). Other emblems stay v1.",
        "lighting": "v2 frames multiply opaque chrome brighter at the top-left",
        "rects": "unchanged; v1 rects above still place v2 art, frames and emblems",
        "stats": "proofs draw POW/DEF/SPD as TBD. No gameplay numbers are baked in.",
    }
    path.write_text(json.dumps(data, indent=2) + "\n")


def _center(draw, box, text, size, fill):
    font = ImageFont.truetype(FONT, size)
    x, y, w, h = box
    b = draw.textbbox((0, 0), text, font=font)
    draw.text(
        (x + (w - (b[2] - b[0])) / 2 - b[0], y + (h - (b[3] - b[1])) / 2 - b[1]),
        text,
        font=font,
        fill=fill,
    )


def _proofs() -> None:
    layout = json.loads((FRAMES / "frame_layout.json").read_text())["rects"]

    def R(key):
        r = layout[key]
        return r["x"], r["y"], r["w"], r["h"]

    proof_dir = QA / "proofs"
    thumb_dir = QA / "thumbs"
    proof_dir.mkdir(parents=True, exist_ok=True)
    thumb_dir.mkdir(parents=True, exist_ok=True)
    cards = []
    for cid, name, fac, fn in PROOFS:
        card = Image.new("RGBA", (750, 1050), (0, 0, 0, 0))
        ax, ay, aw, ah = R("art_window")
        art = Image.open(CARD / cid / "card" / fn).convert("RGBA").resize((aw, ah), Image.LANCZOS)
        card.paste(art, (ax, ay))
        card.alpha_composite(Image.open(FRAMES / "factions" / f"FRAME_{fac}_v2.png"))
        ex, ey, ew, eh = R("faction_emblem")
        emblem_name = "EMBLEM_AEGIS_v2.png" if fac == "AEGIS" else f"EMBLEM_{fac}_001.png"
        emblem = Image.open(FRAMES / "factions" / emblem_name).resize((ew - 8, eh - 8), Image.LANCZOS)
        card.alpha_composite(emblem, (ex + 4, ey + 4))
        draw = ImageDraw.Draw(card)
        _center(draw, R("name"), name, 28, (255, 246, 220))
        for key, lab in (("stat_pow", "POW"), ("stat_def", "DEF"), ("stat_spd", "SPD")):
            _center(draw, R(key), f"{lab}  TBD", 26, (255, 240, 200))
        out = proof_dir / f"PROOF_{fn.replace('.png', '')}.png"
        card.save(out, optimize=True)
        cards.append(card)
        stem = fn.replace(".png", "")
        card.resize((180, 252), Image.LANCZOS).save(thumb_dir / f"{stem}_180.png")
        card.resize((120, 168), Image.LANCZOS).save(thumb_dir / f"{stem}_120.png")

    sheet = Image.new("RGBA", (5 * 160 + 24, 250), (24, 24, 30, 255))
    for i, card in enumerate(cards):
        sheet.alpha_composite(card.resize((150, 210), Image.LANCZOS), (12 + i * 160, 16))
    sheet.save(proof_dir / "PROOF_contact_sheet.png")


def _compares() -> None:
    dest = QA / "compare"
    dest.mkdir(parents=True, exist_ok=True)
    silver = Image.open(CARD / "AVT_AEG_001/card/AVT_AEG_001_card_v1.png").convert("RGB")
    gold_v1 = Image.open(CARD / "AVT_AEG_001/card/AVT_AEG_001_card_v1_variant_goldpot.png").convert("RGB")
    gold_v2 = Image.open(CARD / "AVT_AEG_001/card/AVT_AEG_001_card_v2_variant_goldpot.png").convert("RGB")

    def row(images, width):
        scaled = [im.resize((width, round(im.height * width / im.width)), Image.LANCZOS) for im in images]
        h = scaled[0].height
        sheet = Image.new("RGB", (width * len(scaled) + 8 * (len(scaled) - 1), h), (16, 16, 16))
        for i, im in enumerate(scaled):
            sheet.paste(im, (i * (width + 8), 0))
        return sheet

    row((silver, gold_v2, gold_v1), 360).save(dest / "AVT_AEG_001_goldpot_silver_v2_v1gold.png")
    box = (200, 300, 520, 520)
    row(tuple(im.crop(box) for im in (silver, gold_v2, gold_v1)), 320).save(dest / "AVT_AEG_001_pauldron.png")
    box = (520, 400, 860, 780)
    row(tuple(im.crop(box) for im in (silver, gold_v2, gold_v1)), 320).save(dest / "AVT_AEG_001_shield.png")
    head = (220, 20, 680, 420)
    row(tuple(im.crop(head) for im in (silver, gold_v2, gold_v1)), 400).save(dest / "AVT_AEG_001_head.png")

    e1 = Image.open(FRAMES / "factions/EMBLEM_AEGIS_001.png")
    e2 = Image.open(FRAMES / "factions/EMBLEM_AEGIS_v2.png")

    def on_grey(im, size):
        bg = Image.new("RGBA", (size, size), (40, 44, 54, 255))
        bg.alpha_composite(im.resize((size - 8, size - 8), Image.LANCZOS), (4, 4))
        return bg.convert("RGB")

    pair = Image.new("RGB", (96 * 2 + 12, 96), (20, 20, 20))
    pair.paste(on_grey(e1, 96), (0, 0))
    pair.paste(on_grey(e2, 96), (108, 0))
    pair.save(dest / "EMBLEM_AEGIS_96_v1_v2.png")
    pair = Image.new("RGB", (256 * 2 + 16, 256), (20, 20, 20))
    pair.paste(on_grey(e1, 256), (0, 0))
    pair.paste(on_grey(e2, 256), (272, 0))
    pair.save(dest / "EMBLEM_AEGIS_256_v1_v2.png")


def main() -> None:
    _copy_bases()
    gold = _load_gold()
    gold.run(
        ROOT / gold.SRC_REL,
        ROOT / gold.GOLD_REF_REL,
        CARD / "AVT_AEG_001/card/AVT_AEG_001_card_v2_variant_goldpot.png",
        QA / "masks/AVT_AEG_001_goldpot_mask.png",
    )
    _webp(
        CARD / "AVT_AEG_001/card/AVT_AEG_001_card_v2_variant_goldpot.png",
        CARD / "AVT_AEG_001/card/AVT_AEG_001_card_v2_variant_goldpot_web.webp",
    )
    _frames(_load_v1_frames())
    _layout()
    _proofs()
    _compares()
    print("card art v2 built")


if __name__ == "__main__":
    main()
