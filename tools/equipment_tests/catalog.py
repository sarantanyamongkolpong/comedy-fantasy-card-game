"""Read-only catalog of characters, rigs, and equipment.

Does not write rig JSON, item JSON, sprites, or the asset manifest.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CANVAS = 128
BASELINE_Y = 122

# Labels from ART_STYLE_BIBLE.md. Not gameplay data.
CHARACTER_ORDER = ("AVT_AEG_001", "AVT_PHA_001", "AVT_CEL_001", "AVT_SAN_001")

CHARACTER_LABELS = {
    "AVT_AEG_001": "Sir Potlid",
    "AVT_PHA_001": "Nox Squeak",
    "AVT_CEL_001": "Madame Meteor",
    "AVT_SAN_001": "Sister Plaster",
}

ANCHOR_FOR_SLOT = {
    "headgear": "head",
    "main_hand": "main_hand",
    "off_hand": "off_hand",
    "accessory": "feet",
}

# Draw order matches preview/index.html and ART_STYLE_BIBLE §4.
DRAW_ORDER = (
    "L01",
    "accessory",
    "headgear",
    "main_hand",
    "L05f",
    "off_hand",
    "L06f",
    "L09",
)


def _open_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def _opaque_points(image: Image.Image, ox: int = 0, oy: int = 0) -> set[tuple[int, int]]:
    pixels = image.load()
    width, height = image.size
    found: set[tuple[int, int]] = set()
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] == 255:
                found.add((x + ox, y + oy))
    return found


def _partial_alpha(image: Image.Image) -> int:
    pixels = image.load()
    width, height = image.size
    count = 0
    for y in range(height):
        for x in range(width):
            alpha = pixels[x, y][3]
            if 0 < alpha < 255:
                count += 1
    return count


def _bbox(points: set[tuple[int, int]]) -> list[int] | None:
    if not points:
        return None
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return [min(xs), min(ys), max(xs), max(ys)]


class Item:
    def __init__(self, item_id: str, record: dict, shared: bool) -> None:
        self.item_id = item_id
        self.shared = shared
        self.slot_spec = record["slot"]
        self.slots = self.slot_spec.split("|")
        self.pivot = (int(record["pivot"][0]), int(record["pivot"][1]))
        self.pivot_kind = record.get("pivot_kind", "")
        self.declared_size = (int(record["size"][0]), int(record["size"][1]))
        self.file = ROOT / record["file"] if "file" in record else ROOT / "assets" / "equipment" / f"{item_id}.png"
        self.native_character = record.get("native_character")
        self.native_origin = tuple(record["native_origin"]) if record.get("native_origin") else None
        self.compatible_rigs = list(record.get("compatible_rigs") or [])
        self.note = record.get("note", "")
        self.variant_of = record.get("variant_of")
        self.image = _open_rgba(self.file)
        self.partial_alpha = _partial_alpha(self.image)
        self.actual_size = self.image.size
        self.opaque = _opaque_points(self.image)

    def allows(self, slot: str) -> bool:
        return slot in self.slots


class Character:
    def __init__(self, character_id: str, rig_name: str, record: dict) -> None:
        self.character_id = character_id
        self.rig = rig_name
        self.label = CHARACTER_LABELS.get(character_id, character_id)
        self.anchors = {name: (int(xy[0]), int(xy[1])) for name, xy in record["anchors"].items()}
        self.fit = {
            item_id: (int(off[0]), int(off[1]))
            for item_id, off in (record.get("fit") or {}).items()
        }
        self.fit_note = record.get("fit_note", "")
        self.layers_meta = record["layers"]
        self.native_items = record["native_items"]
        sprite = ROOT / "assets" / "characters" / character_id / "sprite"
        self.layer_images: dict[str, Image.Image] = {}
        self.layer_files: dict[str, str] = {}
        self.layer_partial: dict[str, int] = {}
        self.layer_opaque: dict[str, set[tuple[int, int]]] = {}
        for layer in self.layers_meta:
            key = layer["layer"]
            if layer.get("variant"):
                key = f"{layer['layer']}:{layer['variant']}"
            path = sprite / layer["file"]
            image = _open_rgba(path)
            self.layer_images[key] = image
            self.layer_files[key] = layer["file"]
            self.layer_partial[key] = _partial_alpha(image)
            self.layer_opaque[key] = _opaque_points(image)
        self.body = self.layer_opaque["L01"]
        self.grip_bbox = {
            "main_hand": _bbox(self.layer_opaque.get("L05f", set())),
            "off_hand": _bbox(self.layer_opaque.get("L06f", set())),
        }
        self.has_grip = {
            "main_hand": "L05f" in self.layer_images,
            "off_hand": "L06f" in self.layer_images,
        }

    def anchor_for(self, slot: str) -> tuple[int, int]:
        return self.anchors[ANCHOR_FOR_SLOT[slot]]


class Catalog:
    def __init__(self) -> None:
        self.characters: dict[str, Character] = {}
        self.rig_defaults: dict[str, dict] = {}
        for rig_name in ("humanoid_heavy", "humanoid_standard"):
            payload = json.loads((ROOT / "assets" / "characters" / "_rigs" / f"{rig_name}.json").read_text())
            self.rig_defaults[rig_name] = payload["default_anchors"]
            for character_id, record in payload["characters"].items():
                self.characters[character_id] = Character(character_id, rig_name, record)
        shared = json.loads((ROOT / "assets" / "equipment" / "shared_items.json").read_text())
        self.items: dict[str, Item] = {}
        for item_id, record in shared.items():
            self.items[item_id] = Item(item_id, record, shared=True)
        for character in self.characters.values():
            for item_id, record in character.native_items.items():
                self.items[item_id] = Item(item_id, record, shared=False)
        self.character_ids = tuple(cid for cid in CHARACTER_ORDER if cid in self.characters)
        self.item_ids = tuple(sorted(self.items))

    def default_loadout(self, character_id: str) -> dict[str, str]:
        """First native item per slot, skipping the gold pot variant. Mirrors tools/compose.py."""
        loadout: dict[str, str] = {}
        for item_id, record in self.characters[character_id].native_items.items():
            slot = record["slot"]
            if slot not in loadout and "GOLD" not in item_id:
                loadout[slot] = item_id
        return loadout

    def authored_offset(self, character_id: str, item_id: str, slot: str) -> tuple[int, int]:
        """Rig fit applies to the item's primary declared slot only.

        The preview applies fit to every slot of that item id. The dagger fit was
        tuned for the main hand; the off hand is left at [0, 0] here and the
        difference is reported.
        """
        item = self.items[item_id]
        fit = self.characters[character_id].fit.get(item_id, (0, 0))
        if slot != item.slots[0]:
            return (0, 0)
        return fit
