"""Deterministic equipment compositor.

Draw formula (ART_STYLE_BIBLE §7, same as preview/index.html):

    origin = anchor[slot] - item.pivot + offset

anchor is `head` for headgear and `feet` for accessories. Offset is an integer
pair from the stress-test table (seeded by rig `fit` on the item's primary slot).
No rotation and no body scaling.

Wrong-slot ids are rejected and not drawn. Unknown ids fall back to an empty slot.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from PIL import Image

from catalog import ANCHOR_FOR_SLOT, DRAW_ORDER, CANVAS, Catalog, Item


@dataclass
class Rejection:
    slot: str
    item_id: str
    reason: str


@dataclass
class Placement:
    slot: str
    item_id: str
    anchor_name: str
    anchor: tuple[int, int]
    pivot: tuple[int, int]
    offset: tuple[int, int]
    origin: tuple[int, int]

    @property
    def world_pivot(self) -> tuple[int, int]:
        return (self.origin[0] + self.pivot[0], self.origin[1] + self.pivot[1])


@dataclass
class Composite:
    image: Image.Image
    drawn: list[str]
    placements: list[Placement] = field(default_factory=list)
    rejected: list[Rejection] = field(default_factory=list)
    fallbacks: list[Rejection] = field(default_factory=list)

    def placement_for(self, slot: str) -> Placement | None:
        for placement in self.placements:
            if placement.slot == slot:
                return placement
        return None


def _blit(canvas: Image.Image, source: Image.Image, x: int, y: int) -> Image.Image:
    """Alpha-composite `source` so its top-left sits at (x, y). Clips at the canvas."""
    canvas_w, canvas_h = canvas.size
    source_w, source_h = source.size
    dest_x0, dest_y0 = max(0, x), max(0, y)
    src_x0, src_y0 = max(0, -x), max(0, -y)
    dest_x1, dest_y1 = min(canvas_w, x + source_w), min(canvas_h, y + source_h)
    if dest_x0 >= dest_x1 or dest_y0 >= dest_y1:
        return canvas
    crop = source.crop((src_x0, src_y0, src_x0 + (dest_x1 - dest_x0), src_y0 + (dest_y1 - dest_y0)))
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(crop, (dest_x0, dest_y0))
    return Image.alpha_composite(canvas, layer)


def _vfx_visible(character_id: str, loadout: dict[str, str | None], enabled: bool) -> bool:
    """Match preview/index.html: squeak follows the sneakers, steam follows the cup."""
    if not enabled:
        return False
    if character_id == "AVT_PHA_001":
        return loadout.get("accessory") == "EQ_PHA_SNEAKERS_SQUEAK_001"
    if character_id == "AVT_CEL_001":
        return loadout.get("off_hand") == "EQ_CEL_NOODLE_CUP_001"
    return True


class Compositor:
    def __init__(self, catalog: Catalog, offsets: dict[tuple[str, str, str], tuple[int, int]] | None = None) -> None:
        self.catalog = catalog
        self.offsets = offsets or {}

    def offset_for(self, character_id: str, item_id: str, slot: str) -> tuple[int, int]:
        return self.offsets.get((character_id, item_id, slot), (0, 0))

    def compose(
        self,
        character_id: str,
        loadout: dict[str, str | None] | None = None,
        *,
        draw_vfx: bool = True,
        draw_grips: bool = True,
    ) -> Composite:
        character = self.catalog.characters[character_id]
        requested = dict(loadout or {})
        image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        drawn: list[str] = []
        placements: list[Placement] = []
        rejected: list[Rejection] = []
        fallbacks: list[Rejection] = []
        accepted: dict[str, Item] = {}

        for slot in ("accessory", "headgear", "main_hand", "off_hand"):
            item_id = requested.get(slot)
            if item_id is None or item_id == "":
                continue
            item = self.catalog.items.get(item_id)
            if item is None:
                fallbacks.append(Rejection(slot, item_id, "missing_item"))
                continue
            if not item.allows(slot):
                rejected.append(
                    Rejection(slot, item_id, f"wrong_slot: {item_id} declares {item.slot_spec}, not {slot}")
                )
                continue
            accepted[slot] = item

        image = _blit(image, character.layer_images["L01"], 0, 0)
        drawn.append("L01")

        for slot in ("accessory", "headgear", "main_hand"):
            item = accepted.get(slot)
            if item is None:
                continue
            placement = self._place(character_id, slot, item)
            image = _blit(image, item.image, placement.origin[0], placement.origin[1])
            placements.append(placement)
            drawn.append(slot)

        if draw_grips and "L05f" in character.layer_images:
            image = _blit(image, character.layer_images["L05f"], 0, 0)
            drawn.append("L05f")

        if "off_hand" in accepted:
            item = accepted["off_hand"]
            placement = self._place(character_id, "off_hand", item)
            image = _blit(image, item.image, placement.origin[0], placement.origin[1])
            placements.append(placement)
            drawn.append("off_hand")

        if draw_grips and "L06f" in character.layer_images:
            image = _blit(image, character.layer_images["L06f"], 0, 0)
            drawn.append("L06f")

        resolved = {slot: (item.item_id if (item := accepted.get(slot)) else None) for slot in ANCHOR_FOR_SLOT}
        if "L09" in character.layer_images and _vfx_visible(character_id, resolved, draw_vfx):
            image = _blit(image, character.layer_images["L09"], 0, 0)
            drawn.append("L09")

        if drawn != [step for step in DRAW_ORDER if step in drawn]:
            raise RuntimeError(f"draw order drifted: {drawn}")

        return Composite(image, drawn, placements, rejected, fallbacks)

    def _place(self, character_id: str, slot: str, item: Item) -> Placement:
        character = self.catalog.characters[character_id]
        anchor_name = ANCHOR_FOR_SLOT[slot]
        anchor = character.anchors[anchor_name]
        offset = self.offset_for(character_id, item.item_id, slot)
        origin = (anchor[0] - item.pivot[0] + offset[0], anchor[1] - item.pivot[1] + offset[1])
        return Placement(slot, item.item_id, anchor_name, anchor, item.pivot, offset, origin)
