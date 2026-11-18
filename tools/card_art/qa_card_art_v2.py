#!/usr/bin/env python3
"""Checks for the card-art v2 pass. Writes docs/qa/card_art_v2/qa_results.json.

The gold check is a pixel compare: outside the pot mask, v2 gold must match
the silver v1 painting exactly (0 changed pixels).
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
QA = ROOT / "docs/qa/card_art_v2"

# Hashes published in docs/CARD_ART_NOTES.md for the v1 files this pass must not replace.
V1_SHA = {
    "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v1.png":
        "d76154a694635ca19e9f0f0dfc005dd8e570e3a0b210e60c41c1b24c934e2b75",
    "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v1_variant_goldpot.png":
        "61ab7f81220fb974b588edd474735da2cc980020bbe10ec8a23404b09b77ef51",
    "assets/characters/AVT_PHA_001/card/AVT_PHA_001_card_v1.png":
        "f28032a87ea50202c04759bb121281836bee19f3390c8a61476e17580cefafef",
    "assets/characters/AVT_CEL_001/card/AVT_CEL_001_card_v1.png":
        "29dfac1b185f41b3d6845263f94bc0efb51cde7f84b937a728ceca8ea72f0479",
    "assets/characters/AVT_SAN_001/card/AVT_SAN_001_card_v1.png":
        "d8a9cca51e04a273997328f41327d7250f2273ef3c29ffa6fb49fa0a4da66944",
    "assets/card-art/frames/factions/EMBLEM_AEGIS_001.png":
        "4c1a6100e79a0f14bf819ada6f339b8b3e9bb73c3a06351ccafbe398cea9ee56",
    "assets/card-art/frames/factions/FRAME_AEGIS_001.png":
        "4e1dfea73659afd48fd27b95fd91b30927a94755a8dca99d694874dc7391e188",
}

BASE_V2 = [
    "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v2.png",
    "assets/characters/AVT_PHA_001/card/AVT_PHA_001_card_v2.png",
    "assets/characters/AVT_CEL_001/card/AVT_CEL_001_card_v2.png",
    "assets/characters/AVT_SAN_001/card/AVT_SAN_001_card_v2.png",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def main() -> None:
    checks = []

    def add(name, ok, detail):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})
        print(("PASS" if ok else "FAIL"), name, detail)

    for rel, expect in V1_SHA.items():
        got = sha256(ROOT / rel)
        add(f"v1 untouched {rel}", got == expect, got)

    for rel in BASE_V2:
        v2 = ROOT / rel
        v1 = ROOT / rel.replace("_card_v2.png", "_card_v1.png")
        add(f"base v2 bytes == v1 {rel}", v2.read_bytes() == v1.read_bytes(), f"{v2.stat().st_size} bytes")

    silver = np.array(Image.open(ROOT / "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v1.png").convert("RGB"))
    gold = np.array(Image.open(ROOT / "assets/characters/AVT_AEG_001/card/AVT_AEG_001_card_v2_variant_goldpot.png").convert("RGB"))
    mask = np.array(Image.open(QA / "masks/AVT_AEG_001_goldpot_mask.png")) > 0
    add("gold size", silver.shape == gold.shape == (1152, 864, 3), str(gold.shape))
    changed = (gold != silver).any(axis=2)
    outside = int(changed[~mask].sum())
    inside = int(changed[mask].sum())
    add("gold outside mask changed pixels", outside == 0, str(outside))
    add("gold inside mask changed pixels", inside > 20000, str(inside))

    def rect_changed(box):
        x0, y0, x1, y1 = box
        return int(changed[y0:y1, x0:x1].sum())

    add("pauldron rect unchanged", rect_changed((220, 330, 480, 500)) == 0, str(rect_changed((220, 330, 480, 500))))
    add("shield rect unchanged", rect_changed((560, 430, 840, 760)) == 0, str(rect_changed((560, 430, 840, 760))))
    add("face rect unchanged", rect_changed((410, 235, 540, 330)) == 0, str(rect_changed((410, 235, 540, 330))))
    add("pot rect changed", rect_changed((320, 90, 620, 220)) > 5000, str(rect_changed((320, 90, 620, 220))))

    webps = list((ROOT / "assets/characters").glob("*/card/*_v2*_web.webp"))
    add("webp count", len(webps) == 5, str(len(webps)))
    for path in webps:
        im = Image.open(path)
        add(f"webp {path.name}", im.size == (512, 683), str(im.size))

    for rel in (
        "assets/card-art/frames/shared/FRAME_BASE_v2.png",
        "assets/card-art/frames/factions/FRAME_AEGIS_v2.png",
        "assets/card-art/frames/factions/FRAME_PHANTOM_v2.png",
        "assets/card-art/frames/factions/FRAME_CELESTIAL_v2.png",
        "assets/card-art/frames/factions/FRAME_SANCTUARY_v2.png",
    ):
        im = Image.open(ROOT / rel)
        add(f"frame {Path(rel).name}", im.size == (750, 1050) and im.mode == "RGBA", f"{im.size} {im.mode}")
        alpha = np.array(im)[400, 375, 3]
        add(f"frame window transparent {Path(rel).name}", int(alpha) == 0, str(int(alpha)))

    emblem = Image.open(ROOT / "assets/card-art/frames/factions/EMBLEM_AEGIS_v2.png")
    add("aegis emblem v2", emblem.size == (256, 256) and emblem.mode == "RGBA", f"{emblem.size} {emblem.mode}")

    layout = json.loads((ROOT / "assets/card-art/frames/frame_layout.json").read_text())
    add("layout art_window kept", layout["rects"]["art_window"] == {"x": 30, "y": 30, "w": 690, "h": 920}, "ok")
    add("layout v2 key", "v2" in layout and "rects" in layout, "ok")

    proof = Image.open(QA / "proofs/PROOF_AVT_AEG_001_card_v2.png")
    add("proof size", proof.size == (750, 1050), str(proof.size))
    for width, height in ((180, 252), (120, 168)):
        thumb = Image.open(QA / f"thumbs/AVT_AEG_001_card_v2_{width}.png")
        add(f"thumb {width}", thumb.size == (width, height), str(thumb.size))

    renderer = (ROOT / "tools/card_art/build_card_art_v2.py").read_text()
    add("proof text is TBD", 'f"{lab}  TBD"' in renderer and "POW" in renderer, "source")
    # Reject a baked numeric stat in the proof builder. Labels are words only.
    add("no stat digits in proof builder", " = 12" not in renderer and "HP " not in renderer, "source")

    failed = [c for c in checks if not c["ok"]]
    report = {"passed": len(checks) - len(failed), "failed": len(failed), "checks": checks}
    (QA / "qa_results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"{report['passed']} passed, {report['failed']} failed")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
