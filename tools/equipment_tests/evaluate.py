"""Score every declared equipment × character × slot combination.

Statuses
--------
PASS
    Pivot formula holds, the grip/mount sits on the anchor, nothing leaves the
    128 canvas, and the body is not scaled.
PASS_WITH_ADJUSTMENT
    Same gates, after an integer offset of at most ±6 px. Authored rig `fit`
    values are kept when they already pass. New offsets are recorded, not
    written into rig JSON.
UNSUPPORTED
    The item declares another rig, or no offset inside ±6 can clear overflow
    and the ground baseline while keeping the grip in the hand. The body is
    not distorted to force a fit.
FAIL
    Binary alpha, declared size, or the pivot formula is broken. A fit problem
    is never recorded as FAIL.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from catalog import BASELINE_Y, CANVAS, Catalog, Character, Item

# Search box for a unique per-character offset. Larger shifts would move the
# grip off the fist; those combinations are UNSUPPORTED instead.
OFFSET_LIMIT = 6
GRIP_PAD = 2
PIVOT_OPAQUE_MAX_CHEBY = 8
OFFHAND_BODY_MAX_CHEBY = 8
HEAD_BODY_MAX_CHEBY = 2
HEAD_MIN_PX_ABOVE = 4
FEET_BAND_Y0 = 108
FEET_BAND_MIN = 20
# Any opaque pixel on y >= 122 is in the shadow/VFX band. A zero offset may not
# keep a native item there (none do). A searched offset must clear the band
# completely; a partial lift that still plants the tip in the ground is UNSUPPORTED.
BASELINE_HARD_PX = 0
EYE_FRACTION_MAX = 0.55

STATUSES = ("PASS", "PASS_WITH_ADJUSTMENT", "UNSUPPORTED", "FAIL")


def _chebyshev(a: tuple[int, int], b: tuple[int, int]) -> int:
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))


def _in_box(point: tuple[int, int], box: list[int] | None, pad: int) -> bool:
    if box is None:
        return False
    x, y = point
    return box[0] - pad <= x <= box[2] + pad and box[1] - pad <= y <= box[3] + pad


def _nearest_chebyshev(point: tuple[int, int], points: set[tuple[int, int]]) -> int | None:
    if not points:
        return None
    return min(_chebyshev(point, other) for other in points)


@dataclass
class Metrics:
    origin: tuple[int, int]
    anchor: tuple[int, int]
    anchor_name: str
    pivot: tuple[int, int]
    offset: tuple[int, int]
    world_pivot: tuple[int, int]
    opaque: int
    overflow: int
    baseline_px: int
    body_overlap: int
    eye_cover: int
    eye_px: int
    feet_band: int
    above_anchor: int
    pivot_in_grip: bool
    pivot_body_cheby: int | None
    pivot_opaque_cheby: int | None
    partial_alpha: int
    size_ok: bool

    def as_dict(self) -> dict:
        return {
            "origin": list(self.origin),
            "anchor": list(self.anchor),
            "anchor_name": self.anchor_name,
            "pivot": list(self.pivot),
            "offset": list(self.offset),
            "world_pivot": list(self.world_pivot),
            "opaque": self.opaque,
            "overflow": self.overflow,
            "baseline_px": self.baseline_px,
            "body_overlap": self.body_overlap,
            "eye_cover": self.eye_cover,
            "eye_px": self.eye_px,
            "feet_band": self.feet_band,
            "above_anchor": self.above_anchor,
            "pivot_in_grip": self.pivot_in_grip,
            "pivot_body_cheby": self.pivot_body_cheby,
            "pivot_opaque_cheby": self.pivot_opaque_cheby,
            "partial_alpha": self.partial_alpha,
            "size_ok": self.size_ok,
        }


@dataclass
class Row:
    character_id: str
    character: str
    rig: str
    item_id: str
    slot: str
    shared: bool
    native: bool
    status: str
    offset: tuple[int, int]
    offset_source: str
    reason: str
    notes: list[str] = field(default_factory=list)
    metrics: Metrics | None = None

    def as_dict(self) -> dict:
        return {
            "character_id": self.character_id,
            "character": self.character,
            "rig": self.rig,
            "item_id": self.item_id,
            "slot": self.slot,
            "shared": self.shared,
            "native": self.native,
            "status": self.status,
            "offset": list(self.offset),
            "offset_source": self.offset_source,
            "reason": self.reason,
            "notes": list(self.notes),
            "metrics": None if self.metrics is None else self.metrics.as_dict(),
        }


class Evaluator:
    def __init__(self, catalog: Catalog) -> None:
        self.catalog = catalog
        self._eyes: dict[str, set[tuple[int, int]]] = {}
        for character_id, character in catalog.characters.items():
            head = character.anchors["head"]
            eyes: set[tuple[int, int]] = set()
            for y in range(head[1] + 6, head[1] + 12):
                for x in range(head[0] - 6, head[0] + 7):
                    if (x, y) in character.body:
                        eyes.add((x, y))
            self._eyes[character_id] = eyes

    def measure(self, character: Character, item: Item, slot: str, offset: tuple[int, int]) -> Metrics:
        anchor_name = {"headgear": "head", "accessory": "feet"}.get(slot, slot)
        anchor = character.anchors[anchor_name]
        origin = (anchor[0] - item.pivot[0] + offset[0], anchor[1] - item.pivot[1] + offset[1])
        world_pivot = (origin[0] + item.pivot[0], origin[1] + item.pivot[1])
        overflow = baseline = body_overlap = feet_band = above = 0
        placed: list[tuple[int, int]] = []
        for x, y in item.opaque:
            dest = (x + origin[0], y + origin[1])
            if not (0 <= dest[0] < CANVAS and 0 <= dest[1] < CANVAS):
                overflow += 1
                continue
            placed.append(dest)
            if dest[1] >= BASELINE_Y:
                baseline += 1
            if dest in character.body:
                body_overlap += 1
            if FEET_BAND_Y0 <= dest[1] < BASELINE_Y:
                feet_band += 1
            if dest[1] < anchor[1]:
                above += 1
        eyes = self._eyes[character.character_id]
        eye_cover = sum(1 for pixel in placed if pixel in eyes)
        grip_box = character.grip_bbox.get(slot)
        return Metrics(
            origin=origin,
            anchor=anchor,
            anchor_name=anchor_name,
            pivot=item.pivot,
            offset=offset,
            world_pivot=world_pivot,
            opaque=len(item.opaque),
            overflow=overflow,
            baseline_px=baseline,
            body_overlap=body_overlap,
            eye_cover=eye_cover,
            eye_px=len(eyes),
            feet_band=feet_band,
            above_anchor=above,
            pivot_in_grip=_in_box(world_pivot, grip_box, GRIP_PAD),
            pivot_body_cheby=_nearest_chebyshev(world_pivot, character.body),
            pivot_opaque_cheby=_nearest_chebyshev(world_pivot, set(placed)) if placed else _nearest_chebyshev(world_pivot, {(x + origin[0], y + origin[1]) for x, y in item.opaque}),
            partial_alpha=item.partial_alpha,
            size_ok=item.actual_size == item.declared_size,
        )

    def _mount_ok(self, character: Character, slot: str, metrics: Metrics) -> bool:
        if metrics.world_pivot != (
            metrics.anchor[0] + metrics.offset[0],
            metrics.anchor[1] + metrics.offset[1],
        ):
            return False
        near = metrics.pivot_opaque_cheby
        if slot == "main_hand":
            return metrics.pivot_in_grip and near is not None and near <= PIVOT_OPAQUE_MAX_CHEBY
        if slot == "off_hand":
            if character.has_grip["off_hand"]:
                return metrics.pivot_in_grip and near is not None and near <= PIVOT_OPAQUE_MAX_CHEBY
            body_near = metrics.pivot_body_cheby
            return (
                body_near is not None
                and body_near <= OFFHAND_BODY_MAX_CHEBY
                and near is not None
                and near <= PIVOT_OPAQUE_MAX_CHEBY
            )
        if slot == "headgear":
            body_near = metrics.pivot_body_cheby
            return (
                body_near is not None
                and body_near <= HEAD_BODY_MAX_CHEBY
                and metrics.above_anchor >= HEAD_MIN_PX_ABOVE
            )
        if slot == "accessory":
            return metrics.feet_band >= FEET_BAND_MIN and metrics.overflow == 0
        return False

    def _hard_problems(self, character: Character, slot: str, metrics: Metrics) -> list[str]:
        problems: list[str] = []
        if metrics.overflow:
            problems.append(f"overflow {metrics.overflow}px past the 128 canvas")
        if metrics.baseline_px > BASELINE_HARD_PX:
            problems.append(
                f"{metrics.baseline_px}px cross the ground baseline y={BASELINE_Y} (rows 122–127 are shadow/VFX)"
            )
        if metrics.eye_px and metrics.eye_cover / metrics.eye_px > EYE_FRACTION_MAX:
            problems.append(
                f"covers {metrics.eye_cover}/{metrics.eye_px} eye-band pixels ({metrics.eye_cover / metrics.eye_px:.0%})"
            )
        if not self._mount_ok(character, slot, metrics):
            problems.append(self._mount_reason(character, slot, metrics))
        return problems

    def _mount_reason(self, character: Character, slot: str, metrics: Metrics) -> str:
        if slot == "main_hand":
            if not metrics.pivot_in_grip:
                return f"main_hand pivot {list(metrics.world_pivot)} is outside L05f expanded by {GRIP_PAD}px"
            return f"visible item is {metrics.pivot_opaque_cheby}px from the grip pivot (max {PIVOT_OPAQUE_MAX_CHEBY})"
        if slot == "off_hand":
            if character.has_grip["off_hand"] and not metrics.pivot_in_grip:
                return f"off_hand pivot {list(metrics.world_pivot)} is outside L06f expanded by {GRIP_PAD}px"
            if not character.has_grip["off_hand"]:
                return (
                    f"off_hand pivot is {metrics.pivot_body_cheby}px from the body "
                    f"(max {OFFHAND_BODY_MAX_CHEBY} without an L06f overlay)"
                )
            return f"visible item is {metrics.pivot_opaque_cheby}px from the grip pivot"
        if slot == "headgear":
            return (
                f"headgear mount is {metrics.pivot_body_cheby}px from the skull "
                f"and has {metrics.above_anchor}px above the head anchor"
            )
        if slot == "accessory":
            return f"accessory covers {metrics.feet_band}px of the feet band y={FEET_BAND_Y0}–121"
        return "slot has no mount rule"

    def _notes(self, metrics: Metrics, slot: str) -> list[str]:
        notes: list[str] = []
        if 0 < metrics.baseline_px <= BASELINE_HARD_PX:
            notes.append(f"{metrics.baseline_px}px touch the ground band y>={BASELINE_Y} but stay inside the canvas")
        if metrics.body_overlap >= 400:
            notes.append(
                f"occludes {metrics.body_overlap} body pixels; overlap only, the body layer is not repainted or scaled"
            )
        if metrics.eye_cover:
            notes.append(f"covers {metrics.eye_cover}/{metrics.eye_px} pixels in the eye band under the head anchor")
        if slot == "off_hand" and metrics.pivot_body_cheby and metrics.pivot_body_cheby > 4:
            notes.append(
                f"off-hand anchor sits {metrics.pivot_body_cheby}px from the nearest remaining body pixel (no L06f)"
            )
        return notes

    def _acceptable(self, character: Character, slot: str, metrics: Metrics) -> bool:
        return not self._hard_problems(character, slot, metrics)

    def evaluate_one(self, character_id: str, item_id: str, slot: str) -> Row:
        character = self.catalog.characters[character_id]
        item = self.catalog.items[item_id]
        native = item.native_character == character_id
        base = Row(
            character_id=character_id,
            character=character.label,
            rig=character.rig,
            item_id=item_id,
            slot=slot,
            shared=item.shared,
            native=native,
            status="FAIL",
            offset=(0, 0),
            offset_source="none",
            reason="",
        )
        if item.partial_alpha or any(character.layer_partial.values()):
            partial = item.partial_alpha
            base.reason = (
                f"FAIL alpha is not strictly 0/255 ({partial} partial pixels on {item_id}). "
                "Boundaries must be a hard step."
            )
            base.metrics = self.measure(character, item, slot, (0, 0))
            return base
        if not (item.actual_size == item.declared_size):
            base.reason = (
                f"FAIL declared size {list(item.declared_size)} != PNG size {list(item.actual_size)}"
            )
            base.metrics = self.measure(character, item, slot, (0, 0))
            return base
        for layer in character.layer_images.values():
            if layer.size != (CANVAS, CANVAS):
                base.reason = f"FAIL a {character_id} layer is {layer.size}, expected 128×128"
                base.metrics = self.measure(character, item, slot, (0, 0))
                return base

        if item.compatible_rigs and character.rig not in item.compatible_rigs:
            metrics = self.measure(character, item, slot, (0, 0))
            problems = self._hard_problems(character, slot, metrics)
            detail = f" At [0, 0]: {'; '.join(problems)}." if problems else " At [0, 0] the mount gates pass, but the item still declares this rig unsupported."
            base.status = "UNSUPPORTED"
            base.offset = (0, 0)
            base.offset_source = "rig_declaration"
            base.metrics = metrics
            base.notes = self._notes(metrics, slot)
            base.reason = (
                f"UNSUPPORTED {character.rig} is not in compatible_rigs {item.compatible_rigs} "
                f"for {item_id}. The body was not scaled to force a fit.{detail}"
            )
            return base

        authored = self.catalog.authored_offset(character_id, item_id, slot)
        chosen, source, metrics = self._choose_offset(character, item, slot, authored)
        if chosen is None:
            shown = self.measure(character, item, slot, authored if authored != (0, 0) else (0, 0))
            problems = self._hard_problems(character, slot, shown)
            base.status = "UNSUPPORTED"
            base.offset = shown.offset
            base.offset_source = "unresolved"
            base.metrics = shown
            base.notes = self._notes(shown, slot)
            base.reason = (
                "UNSUPPORTED no integer offset within "
                f"±{OFFSET_LIMIT} keeps the grip on the anchor and clears canvas overflow "
                f"and the ground baseline. Body was not scaled. Remaining: {'; '.join(problems)}."
            )
            return base

        status = "PASS_WITH_ADJUSTMENT" if chosen != (0, 0) else "PASS"
        base.status = status
        base.offset = chosen
        base.offset_source = source
        base.metrics = metrics
        base.notes = self._notes(metrics, slot)
        base.reason = self._pass_reason(status, source, character, slot, metrics, authored)
        return base

    def _choose_offset(
        self,
        character: Character,
        item: Item,
        slot: str,
        authored: tuple[int, int],
    ) -> tuple[tuple[int, int] | None, str, Metrics | None]:
        if authored != (0, 0):
            metrics = self.measure(character, item, slot, authored)
            if self._acceptable(character, slot, metrics):
                return authored, "rig_fit", metrics
        search = sorted(
            ((dx, dy) for dx in range(-OFFSET_LIMIT, OFFSET_LIMIT + 1) for dy in range(-OFFSET_LIMIT, OFFSET_LIMIT + 1)),
            key=lambda pair: (abs(pair[0]) + abs(pair[1]), abs(pair[0]), abs(pair[1]), pair[0], pair[1]),
        )
        for offset in search:
            metrics = self.measure(character, item, slot, offset)
            if self._acceptable(character, slot, metrics):
                source = "zero" if offset == (0, 0) else "stress_search"
                return offset, source, metrics
        return None, "unresolved", None

    def _pass_reason(
        self,
        status: str,
        source: str,
        character: Character,
        slot: str,
        metrics: Metrics,
        authored: tuple[int, int],
    ) -> str:
        formula = (
            f"origin {list(metrics.origin)} = {metrics.anchor_name} {list(metrics.anchor)} "
            f"- pivot {list(metrics.pivot)} + offset {list(metrics.offset)}"
        )
        mount = {
            "main_hand": "grip pivot sits inside L05f",
            "off_hand": "grip pivot sits inside L06f" if character.has_grip["off_hand"] else "grip pivot sits on the off-hand anchor",
            "headgear": "mount sits on the head anchor and the hat extends above the skull",
            "accessory": "mount sits on the feet baseline",
        }[slot]
        if status == "PASS":
            return f"PASS {formula}. {mount}. Overflow 0. Body pixels outside the item are unchanged."
        if source == "rig_fit":
            return (
                f"PASS_WITH_ADJUSTMENT authored rig fit {list(authored)} on {slot}. {formula}. "
                f"{mount}. The preview already uses this offset; it is recorded and not recomputed."
            )
        return (
            f"PASS_WITH_ADJUSTMENT unique offset {list(metrics.offset)} ({source}). {formula}. "
            f"{mount}. [0, 0] left the canvas or the ground baseline; the body was not scaled."
        )

    def matrix(self) -> list[Row]:
        rows: list[Row] = []
        for character_id in self.catalog.character_ids:
            for item_id in self.catalog.item_ids:
                item = self.catalog.items[item_id]
                for slot in item.slots:
                    rows.append(self.evaluate_one(character_id, item_id, slot))
        return rows

    def offset_table(self, rows: list[Row]) -> dict[tuple[str, str, str], tuple[int, int]]:
        table: dict[tuple[str, str, str], tuple[int, int]] = {}
        for row in rows:
            if row.status == "PASS_WITH_ADJUSTMENT":
                table[(row.character_id, row.item_id, row.slot)] = row.offset
        return table
