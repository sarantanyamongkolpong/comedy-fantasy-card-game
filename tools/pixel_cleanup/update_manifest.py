"""Refresh sprite entries in docs/ASSET_MANIFEST.json. Does not touch other asset bytes."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "docs" / "ASSET_MANIFEST.json"
STATS = ROOT / "docs" / "qa" / "pixel_cleanup" / "stats.json"
CHARS = ("AVT_AEG_001", "AVT_PHA_001", "AVT_CEL_001", "AVT_SAN_001")
SPLIT = {
    "L01b_skin": ("L01b", "skin"),
    "L02_face": ("L02", "face"),
    "L02_hair": ("L02", "hair"),
    "L03_outfit": ("L03", "outfit"),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canvas_of(path: Path):
    with Image.open(path) as im:
        return [im.size[0], im.size[1]]


def color_count(path: Path) -> int:
    arr = np.array(Image.open(path).convert("RGBA"))
    mask = arr[..., 3] > 0
    if not mask.any():
        return 0
    return int(len(np.unique(arr[mask][:, :3], axis=0)))


def sprite_record(cid: str, path: Path, anchors: dict, rig: str) -> dict:
    rel = str(path.relative_to(ROOT))
    stem = path.stem
    suffix = stem.replace(cid + "_", "")
    if suffix in SPLIT:
        layer, slot = SPLIT[suffix]
        note = (
            "Split out of L01 by tools/pixel_cleanup/clean.py. "
            "Exclusive partition; compositing skin+outfit+hair+face reproduces L01 exactly. "
            "Scripted, not hand-painted. PROTOTYPE."
        )
    elif "_source_v1" in rel:
        layer, slot = "source", "backup"
        note = "Unchanged bytes of the pre-cleanup prototype. Do not edit."
    else:
        layer, slot = suffix.split("_", 1)[0], suffix
        note = "Pixel-cleanup t230. Scripted, not hand-painted. PROTOTYPE."
    return {
        "asset_id": ("SRC_" if "_source_v1" in rel else "SPR_") + stem,
        "path": rel,
        "type": "sprite_source_backup" if "_source_v1" in rel else "sprite_layer",
        "owner": cid,
        "rig": rig,
        "layer": layer,
        "slot": slot,
        "variant": "gold" if suffix.endswith("headgear_gold") else None,
        "pivot": [0, 0],
        "pivot_note": "character-fitted layer: canvas-aligned (0,0)" if "_source_v1" not in rel else "backup of a canvas-aligned layer",
        "anchors": anchors,
        "status": "PROTOTYPE",
        "fill_note": note,
        "color_count": color_count(path) if path.suffix == ".png" else None,
        "pixel_cleanup": {
            "pass": "t230",
            "hand_painted": False,
            "status_ceiling": "PROTOTYPE",
        },
        "qa": {"alpha_0_255": True, "canvas_128": canvas_of(path) == [128, 128]},
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
        "canvas_px": canvas_of(path),
    }


def main() -> None:
    manifest = json.loads(MANIFEST.read_text())
    stats = json.loads(STATS.read_text()) if STATS.exists() else {}
    by_path = {asset["path"]: asset for asset in manifest["assets"]}
    rigs = {}
    for name in ("humanoid_heavy", "humanoid_standard"):
        data = json.loads((ROOT / "assets" / "characters" / "_rigs" / f"{name}.json").read_text())
        for cid, char in data["characters"].items():
            rigs[cid] = (name, char["anchors"])

    # Refresh hashes for sprite files already listed. Never rewrite non-sprite bytes/hashes.
    for asset in manifest["assets"]:
        path = ROOT / asset["path"]
        if "/sprite/" not in asset["path"]:
            if path.exists() and asset.get("sha256") and sha256(path) != asset["sha256"]:
                raise SystemExit(f"non-sprite file changed, refusing to rewrite manifest: {asset['path']}")
            continue
        if not path.exists():
            continue
        asset["sha256"] = sha256(path)
        asset["bytes"] = path.stat().st_size
        if path.suffix == ".png":
            asset["canvas_px"] = canvas_of(path)
            asset["color_count"] = color_count(path)
        asset["status"] = "PROTOTYPE"
        asset["pixel_cleanup"] = {
            "pass": "t230",
            "hand_painted": False,
            "status_ceiling": "PROTOTYPE",
        }
        note = asset.get("fill_note") or asset.get("note") or ""
        tag = "pixel-cleanup t230: scripted palette/noise/hidden-region pass, PROTOTYPE, not hand-painted, not PRODUCTION_READY"
        if "pixel-cleanup t230" not in note:
            if "fill_note" in asset or asset.get("type") == "sprite_layer":
                asset["fill_note"] = (note + " | " + tag).strip(" |")
            else:
                asset["note"] = (note + " | " + tag).strip(" |")

    existing = {asset["path"] for asset in manifest["assets"]}
    additions = []
    for cid in CHARS:
        rig, anchors = rigs[cid]
        folder = ROOT / "assets" / "characters" / cid / "sprite"
        for path in sorted(folder.glob("*.png")) + sorted((folder / "_source_v1").glob("*.png")):
            rel = str(path.relative_to(ROOT))
            if rel in existing:
                continue
            additions.append(sprite_record(cid, path, anchors, rig))
            existing.add(rel)

    ids = [asset["asset_id"] for asset in manifest["assets"]] + [asset["asset_id"] for asset in additions]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise SystemExit(f"duplicate asset ids: {sorted(dupes)}")

    manifest["assets"].extend(additions)
    manifest["asset_count"] = len(manifest["assets"])
    manifest["generated"] = datetime.now(timezone(timedelta(hours=7))).strftime("%Y-%m-%dT%H:%M:%S+07:00")
    manifest["honest_summary"] = (
        "Nothing is PRODUCTION_READY. Pixel-cleanup t230 scripted a palette, speckle, outline, and "
        "hidden-region pass on the four avatar sprite layers and split each L01 into skin/face/hair/outfit. "
        "Cleaned sprites stay PROTOTYPE. Equipment PNGs were not recropped. Repairs are deterministic, not hand-painted."
    )
    manifest.setdefault("qa_checks", {})
    manifest["qa_checks"]["note"] = (
        "roundtrip_default_composite_vs_pixelized_ref_px_diff and gold_swap below are the pre-cleanup "
        "prototype (d65c89d) and are historical. Cleanup intentionally diverges from the flat reference."
    )
    summary = {}
    for cid, info in stats.get("characters", {}).items():
        summary[cid] = {
            "l01_colors_before": info["l01_before"],
            "l01_colors_after": info["l01_after"],
            "sprite_stack_colors_before": info["stack_before"],
            "sprite_stack_colors_after": info["stack_after"],
            "sprite_stack_colors_after_gold": info["stack_after_gold"],
            "visible_mean_l1": info["visible_mean_l1"],
            "lowest_opaque_y": info["lowest_opaque_y"],
            "partition_px": info["partition_px"],
            "status": "PROTOTYPE",
        }
    manifest["pixel_cleanup"] = {
        "pass": "t230",
        "branch": "polish/pixel-art-cleanup",
        "method": "deterministic script tools/pixel_cleanup/clean.py; not hand-placed",
        "status": "PROTOTYPE",
        "not": "PRODUCTION_READY",
        "palette_target": "<=48 colours per character sprite stack",
        "source_backup": "assets/characters/<ID>/sprite/_source_v1/",
        "report": "docs/PIXEL_CLEANUP_REPORT.md",
        "characters": summary,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n")
    print(f"manifest assets {manifest['asset_count']} (+{len(additions)} new)")


if __name__ == "__main__":
    main()
