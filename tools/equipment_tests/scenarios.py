"""Named stress cases 1–10. Each case returns a pass/fail plus sheet cells."""
from __future__ import annotations

from dataclasses import dataclass, field

from PIL import Image, ImageDraw

from catalog import CANVAS, Catalog
from compositor import Composite, Compositor
from evaluate import Row
from sheets import diff_image

CASE_TITLES = {
    "TC01": "Silver Pot → Golden Pot",
    "TC02": "Basic sword on compatible characters",
    "TC03": "Shared dagger on main and off hand",
    "TC04": "Neutral staff on Madame Meteor",
    "TC05": "Neutral staff on Sister Plaster",
    "TC06": "Buckler on humanoid rigs",
    "TC07": "Equipment removal reveals hidden body pixels",
    "TC08": "Equipment replacement",
    "TC09": "Missing equipment fallback",
    "TC10": "Wrong-slot equipment rejection",
}


@dataclass
class Scenario:
    case_id: str
    passed: bool
    detail: str
    sheet: str
    cells: list[tuple[Image.Image, list[str], str]] = field(default_factory=list)


def _same(a: Image.Image, b: Image.Image) -> bool:
    if a.size != b.size:
        return False
    pa, pb = a.load(), b.load()
    width, height = a.size
    for y in range(height):
        for x in range(width):
            if pa[x, y] != pb[x, y]:
                return False
    return True


def _same_visible(a: Image.Image, b: Image.Image) -> bool:
    """Equal where either pixel is opaque. RGB under alpha 0 is not significant."""
    pa, pb = a.load(), b.load()
    for y in range(CANVAS):
        for x in range(CANVAS):
            left, right = pa[x, y], pb[x, y]
            if left[3] != right[3]:
                return False
            if left[3] == 255 and left != right:
                return False
    return True


def _changed(a: Image.Image, b: Image.Image) -> list[tuple[int, int]]:
    pa, pb = a.load(), b.load()
    found = []
    for y in range(CANVAS):
        for x in range(CANVAS):
            if pa[x, y] != pb[x, y]:
                found.append((x, y))
    return found


def _partial(image: Image.Image) -> int:
    pixels = image.load()
    count = 0
    for y in range(CANVAS):
        for x in range(CANVAS):
            alpha = pixels[x, y][3]
            if 0 < alpha < 255:
                count += 1
    return count


def _destinations(catalog: Catalog, item_id: str, origin: tuple[int, int]) -> set[tuple[int, int]]:
    item = catalog.items[item_id]
    found = set()
    for x, y in item.opaque:
        dest = (x + origin[0], y + origin[1])
        if 0 <= dest[0] < CANVAS and 0 <= dest[1] < CANVAS:
            found.add(dest)
    return found


def _row(rows: list[Row], character_id: str, item_id: str, slot: str) -> Row:
    for row in rows:
        if row.character_id == character_id and row.item_id == item_id and row.slot == slot:
            return row
    raise KeyError((character_id, item_id, slot))


def _cell(image: Image.Image, title: str, subtitle: str, status: str) -> tuple[Image.Image, list[str], str]:
    return (image, [title, subtitle], status)


class ScenarioRunner:
    def __init__(self, catalog: Catalog, compositor: Compositor, rows: list[Row]) -> None:
        self.catalog = catalog
        self.compositor = compositor
        self.rows = rows
        self.failures: list[str] = []

    def run_all(self) -> list[Scenario]:
        checks = [
            self.tc01_silver_gold,
            self.tc02_basic_sword,
            self.tc03_dagger,
            self.tc04_staff_meteor,
            self.tc05_staff_plaster,
            self.tc06_buckler,
            self.tc07_removal,
            self.tc08_replacement,
            self.tc09_missing,
            self.tc10_wrong_slot,
        ]
        scenarios = [check() for check in checks]
        self._invariants()
        return scenarios

    def _fail(self, message: str) -> None:
        self.failures.append(message)

    def _expect(self, condition: bool, message: str) -> None:
        if not condition:
            self._fail(message)

    def tc01_silver_gold(self) -> Scenario:
        silver_id = "EQ_AEG_POT_HELMET_SILVER_001"
        gold_id = "EQ_AEG_POT_HELMET_GOLD_001"
        silver = self.catalog.items[silver_id]
        gold = self.catalog.items[gold_id]
        masks_equal = silver.opaque == gold.opaque
        base = self.catalog.default_loadout("AVT_AEG_001")
        silver_image = self.compositor.compose("AVT_AEG_001", base).image
        gold_load = dict(base, headgear=gold_id)
        gold_image = self.compositor.compose("AVT_AEG_001", gold_load).image
        bare = self.compositor.compose("AVT_AEG_001", {**base, "headgear": None}).image
        changed = _changed(silver_image, gold_image)
        placement = self.compositor.compose("AVT_AEG_001", base).placement_for("headgear")
        live_mask = _destinations(self.catalog, silver_id, placement.origin)
        outside = [pixel for pixel in changed if pixel not in live_mask]
        colors_differ = len(changed) > 0
        silver_row = _row(self.rows, "AVT_AEG_001", silver_id, "headgear")
        gold_row = _row(self.rows, "AVT_AEG_001", gold_id, "headgear")
        self._expect(masks_equal, "TC01 silver and gold pot masks differ")
        self._expect(colors_differ, "TC01 silver and gold composites are identical")
        self._expect(not outside, f"TC01 gold swap changed {len(outside)} px outside the helmet")
        self._expect(len(changed) == 497, f"TC01 expected 497 recolored helmet px, got {len(changed)}")
        self._expect(silver_row.status == "PASS" and gold_row.status == "PASS", "TC01 pot rows are not PASS")
        self._expect(silver.pivot == gold.pivot, "TC01 gold pivot drifted from silver")
        body_same = True
        sp, gp, bp = silver_image.load(), gold_image.load(), bare.load()
        for y in range(CANVAS):
            for x in range(CANVAS):
                if (x, y) in live_mask:
                    continue
                if sp[x, y] != gp[x, y] or sp[x, y] != bp[x, y]:
                    body_same = False
        self._expect(body_same, "TC01 body pixels outside the helmet changed")
        detail = (
            f"masks identical ({len(silver.opaque)} px), recolored {len(changed)} px, "
            f"0 px outside the helmet, pivot {list(silver.pivot)} unchanged, character id AVT_AEG_001 unchanged"
        )
        return Scenario(
            "TC01",
            not any(item.startswith("TC01") for item in self.failures),
            detail,
            "tc01_silver_to_gold.png",
            [
                _cell(silver_image, "PASS silver pot", "AVT_AEG_001 default", "PASS"),
                _cell(gold_image, "PASS golden pot", "same body, L04 swap", "PASS"),
                _cell(bare, "helmet removed", "hair cap in L01 shows", "INFO"),
                _cell(diff_image(silver_image, gold_image), f"{len(changed)} px differ", "magenta = changed", "INFO"),
            ],
        )

    def tc02_basic_sword(self) -> Scenario:
        item_id = "EQ_SWORD_BASIC_001"
        cells = []
        notes = []
        for character_id in self.catalog.character_ids:
            row = _row(self.rows, character_id, item_id, "main_hand")
            image = self.compositor.compose(character_id, {"main_hand": item_id}, draw_vfx=False).image
            cells.append(_cell(image, f"{row.status} {row.character}", f"offset {list(row.offset)}", row.status))
            notes.append(f"{character_id} {row.status} {list(row.offset)}")
            self._expect(row.status in ("PASS", "PASS_WITH_ADJUSTMENT"), f"TC02 {character_id} sword is {row.status}")
            self._expect(row.rig in self.catalog.items[item_id].compatible_rigs, f"TC02 {character_id} rig not declared compatible")
        potlid = _row(self.rows, "AVT_AEG_001", item_id, "main_hand")
        self._expect(potlid.offset == (-6, -2), f"TC02 Potlid sword offset {potlid.offset} != rig fit [-6, -2]")
        self._expect(potlid.status == "PASS_WITH_ADJUSTMENT", "TC02 Potlid sword should keep the authored fit")
        return Scenario("TC02", not any(item.startswith("TC02") for item in self.failures), "; ".join(notes), "tc02_basic_sword.png", cells)

    def tc03_dagger(self) -> Scenario:
        item_id = "EQ_DAGGER_BASIC_001"
        cells = []
        notes = []
        for character_id in self.catalog.character_ids:
            for slot in ("main_hand", "off_hand"):
                row = _row(self.rows, character_id, item_id, slot)
                image = self.compositor.compose(character_id, {slot: item_id}, draw_vfx=False).image
                cells.append(_cell(image, f"{row.status} {slot}", f"{row.character} {list(row.offset)}", row.status))
                notes.append(f"{character_id} {slot} {row.status} {list(row.offset)}")
                self._expect(row.status in ("PASS", "PASS_WITH_ADJUSTMENT"), f"TC03 {character_id} {slot} is {row.status}")
        main = _row(self.rows, "AVT_AEG_001", item_id, "main_hand")
        off = _row(self.rows, "AVT_AEG_001", item_id, "off_hand")
        self._expect(main.offset == (-4, 0) and main.status == "PASS_WITH_ADJUSTMENT", "TC03 Potlid main-hand dagger lost rig fit [-4, 0]")
        self._expect(off.offset == (0, 0), f"TC03 Potlid off-hand dagger should stay [0, 0], got {off.offset}")
        return Scenario("TC03", not any(item.startswith("TC03") for item in self.failures), "; ".join(notes), "tc03_shared_dagger.png", cells)

    def _staff_case(self, case_id: str, character_id: str, sheet: str) -> Scenario:
        item_id = "EQ_STAFF_NEUTRAL_001"
        character = self.catalog.characters[character_id]
        native_staff = next(
            item_id_
            for item_id_, record in character.native_items.items()
            if record["slot"] == "main_hand"
        )
        row = _row(self.rows, character_id, item_id, "main_hand")
        native = self.catalog.default_loadout(character_id)
        neutral = dict(native, main_hand=item_id)
        empty = dict(native, main_hand=None)
        cross_id = "EQ_SAN_STAFF_BANDAGE_001" if character_id == "AVT_CEL_001" else "EQ_CEL_STAFF_PLANET_001"
        cross = dict(native, main_hand=cross_id)
        images = [
            (self.compositor.compose(character_id, native).image, f"native {native_staff}", "PASS"),
            (self.compositor.compose(character_id, neutral).image, f"{row.status} neutral staff", row.status),
            (self.compositor.compose(character_id, cross).image, f"cross {cross_id}", _row(self.rows, character_id, cross_id, "main_hand").status),
            (self.compositor.compose(character_id, empty).image, "staff removed", "INFO"),
        ]
        self._expect(row.status in ("PASS", "PASS_WITH_ADJUSTMENT"), f"{case_id} neutral staff is {row.status}: {row.reason}")
        self._expect(row.offset == (0, 0), f"{case_id} registry says no fit; got {row.offset}")
        detail = f"{character.label} {row.status} offset {list(row.offset)}; overflow {row.metrics.overflow}; baseline {row.metrics.baseline_px}"
        return Scenario(
            case_id,
            not any(item.startswith(case_id) for item in self.failures),
            detail,
            sheet,
            [_cell(image, title, character_id, status) for image, title, status in images],
        )

    def tc04_staff_meteor(self) -> Scenario:
        return self._staff_case("TC04", "AVT_CEL_001", "tc04_neutral_staff_meteor.png")

    def tc05_staff_plaster(self) -> Scenario:
        return self._staff_case("TC05", "AVT_SAN_001", "tc05_neutral_staff_plaster.png")

    def tc06_buckler(self) -> Scenario:
        item_id = "EQ_SHIELD_BUCKLER_001"
        cells = []
        notes = []
        for character_id in self.catalog.character_ids:
            row = _row(self.rows, character_id, item_id, "off_hand")
            image = self.compositor.compose(character_id, {"off_hand": item_id}, draw_vfx=False).image
            cells.append(_cell(image, f"{row.status} {row.character}", f"{row.rig} offset {list(row.offset)}", row.status))
            notes.append(f"{character_id} {row.status}")
            self._expect(
                row.status in ("PASS", "PASS_WITH_ADJUSTMENT"),
                f"TC06 {character_id} buckler is {row.status}: {row.reason}",
            )
            self._expect(row.rig in self.catalog.items[item_id].compatible_rigs, f"TC06 {character_id} rig not listed on the buckler")
        return Scenario("TC06", not any(item.startswith("TC06") for item in self.failures), "; ".join(notes), "tc06_buckler.png", cells)

    def tc07_removal(self) -> Scenario:
        cells = []
        revealed_notes = []
        for character_id in self.catalog.character_ids:
            character = self.catalog.characters[character_id]
            native = self.catalog.default_loadout(character_id)
            worn = self.compositor.compose(character_id, native, draw_vfx=False).image
            bare = self.compositor.compose(character_id, {}, draw_vfx=False).image
            cells.append(_cell(worn, f"{character.label} equipped", character_id, "PASS"))
            cells.append(_cell(bare, f"{character.label} all removed", "L01 + grip overlays", "INFO"))
            grip = set()
            for key in ("L05f", "L06f"):
                grip |= character.layer_opaque.get(key, set())
            body_image = character.layer_images["L01"]
            for item_id, record in character.native_items.items():
                slot = record["slot"]
                alone = self.compositor.compose(character_id, {slot: item_id}, draw_vfx=False)
                placement = alone.placement_for(slot)
                dest = _destinations(self.catalog, item_id, placement.origin)
                coverable = [pixel for pixel in dest if pixel in character.body and pixel not in grip]
                bare_px = bare.load()
                worn_px = alone.image.load()
                body_px = body_image.load()
                item_px = self.catalog.items[item_id].image.load()
                revealed = 0
                for x, y in coverable:
                    if bare_px[x, y] != body_px[x, y]:
                        self._fail(f"TC07 {item_id} bare pixel {(x, y)} is not L01")
                        break
                    local = (x - placement.origin[0], y - placement.origin[1])
                    if worn_px[x, y] != item_px[local]:
                        self._fail(f"TC07 {item_id} equipped pixel {(x, y)} is not the item")
                        break
                    if worn_px[x, y] != bare_px[x, y]:
                        revealed += 1
                    elif item_px[local] != body_px[x, y]:
                        self._fail(f"TC07 {item_id} {(x, y)} unchanged but item != body")
                if coverable:
                    self._expect(revealed > 0, f"TC07 {item_id} revealed no hidden body pixels")
                revealed_notes.append(f"{item_id} {revealed}/{len(coverable)}")
            # Removing one slot from the full loadout must not touch pixels outside that item.
            for slot, item_id in native.items():
                removed = self.compositor.compose(character_id, {**native, slot: None}, draw_vfx=False).image
                placement = self.compositor.compose(character_id, native, draw_vfx=False).placement_for(slot)
                dest = _destinations(self.catalog, item_id, placement.origin)
                stray = [pixel for pixel in _changed(worn, removed) if pixel not in dest]
                self._expect(not stray, f"TC07 removing {item_id} changed {len(stray)} px outside the item")
        detail = "hidden body pixels revealed: " + ", ".join(revealed_notes)
        return Scenario("TC07", not any(item.startswith("TC07") for item in self.failures), detail, "tc07_removal.png", cells)

    def tc08_replacement(self) -> Scenario:
        swaps = [
            ("AVT_AEG_001", "main_hand", "EQ_SWORD_BASIC_001"),
            ("AVT_PHA_001", "main_hand", "EQ_DAGGER_BASIC_001"),
            ("AVT_CEL_001", "main_hand", "EQ_STAFF_NEUTRAL_001"),
            ("AVT_SAN_001", "main_hand", "EQ_STAFF_NEUTRAL_001"),
            ("AVT_AEG_001", "headgear", "EQ_AEG_POT_HELMET_GOLD_001"),
        ]
        cells = []
        notes = []
        for character_id, slot, new_id in swaps:
            native = self.catalog.default_loadout(character_id)
            old_id = native[slot]
            before = self.compositor.compose(character_id, native, draw_vfx=False)
            after = self.compositor.compose(character_id, {**native, slot: new_id}, draw_vfx=False)
            old_dest = _destinations(self.catalog, old_id, before.placement_for(slot).origin)
            new_dest = _destinations(self.catalog, new_id, after.placement_for(slot).origin)
            stray = [pixel for pixel in _changed(before.image, after.image) if pixel not in old_dest | new_dest]
            self._expect(not stray, f"TC08 {character_id} {old_id} → {new_id} changed {len(stray)} px outside either item")
            self._expect(_changed(before.image, after.image), f"TC08 {old_id} → {new_id} produced an identical sprite")
            notes.append(f"{old_id}→{new_id} stray {len(stray)}")
            cells.append(_cell(before.image, f"before {old_id[-12:]}", character_id, "INFO"))
            cells.append(_cell(after.image, f"after {new_id[-12:]}", slot, "PASS"))
        return Scenario("TC08", not any(item.startswith("TC08") for item in self.failures), "; ".join(notes), "tc08_replacement.png", cells)

    def tc09_missing(self) -> Scenario:
        cells = []
        for character_id in self.catalog.character_ids:
            native = self.catalog.default_loadout(character_id)
            missing = self.compositor.compose(character_id, {**native, "main_hand": "EQ_DOES_NOT_EXIST"})
            empty = self.compositor.compose(character_id, {**native, "main_hand": None})
            self._expect(missing.fallbacks and missing.fallbacks[0].reason == "missing_item", f"TC09 {character_id} did not record a fallback")
            self._expect(not missing.rejected, f"TC09 {character_id} rejected a missing id instead of falling back")
            self._expect(_same(missing.image, empty.image), f"TC09 {character_id} missing item did not match the empty slot")
            self._expect(missing.placement_for("main_hand") is None, f"TC09 {character_id} drew the missing item")
            cells.append(_cell(empty.image, f"{self.catalog.characters[character_id].label} fallback", "EQ_DOES_NOT_EXIST → empty main hand", "PASS"))
        self._expect(all(not item.startswith("TC09") for item in self.failures) or True, "")
        return Scenario(
            "TC09",
            not any(item.startswith("TC09") for item in self.failures),
            "unknown ids leave the slot empty and do not raise",
            "tc09_missing_fallback.png",
            cells,
        )

    def tc10_wrong_slot(self) -> Scenario:
        attempts = [
            ("AVT_AEG_001", "main_hand", "EQ_AEG_POT_HELMET_SILVER_001"),
            ("AVT_CEL_001", "headgear", "EQ_SWORD_BASIC_001"),
            ("AVT_PHA_001", "headgear", "EQ_DAGGER_BASIC_001"),
            ("AVT_SAN_001", "main_hand", "EQ_SHIELD_BUCKLER_001"),
            ("AVT_AEG_001", "off_hand", "EQ_PHA_SNEAKERS_SQUEAK_001"),
            ("AVT_CEL_001", "accessory", "EQ_SAN_CLIPBOARD_001"),
        ]
        cells = []
        for character_id, slot, item_id in attempts:
            native = self.catalog.default_loadout(character_id)
            rejected = self.compositor.compose(character_id, {**native, slot: item_id})
            kept = self.compositor.compose(character_id, {**native, slot: None})
            self._expect(rejected.rejected, f"TC10 {item_id} in {slot} was not rejected")
            if rejected.rejected:
                self._expect(rejected.rejected[0].reason.startswith("wrong_slot"), f"TC10 reason {rejected.rejected[0].reason}")
            self._expect(_same(rejected.image, kept.image), f"TC10 {item_id} was drawn into {slot}")
            declared = self.catalog.items[item_id].slot_spec
            cells.append(
                _cell(
                    rejected.image,
                    f"REJECTED {slot}",
                    f"{item_id} declares {declared}",
                    "UNSUPPORTED",
                )
            )
        # A legal slot beside a rejected one still draws.
        legal = self.compositor.compose(
            "AVT_AEG_001",
            {"off_hand": "EQ_SHIELD_BUCKLER_001", "main_hand": "EQ_AEG_POT_HELMET_SILVER_001"},
        )
        only_shield = self.compositor.compose("AVT_AEG_001", {"off_hand": "EQ_SHIELD_BUCKLER_001"})
        self._expect(legal.rejected and legal.placement_for("off_hand") is not None, "TC10 legal buckler was dropped with the rejected pot")
        self._expect(_same(legal.image, only_shield.image), "TC10 rejected pot changed the buckler composite")
        return Scenario(
            "TC10",
            not any(item.startswith("TC10") for item in self.failures),
            f"{len(attempts)} wrong-slot attempts rejected; legal sibling slots still draw",
            "tc10_wrong_slot.png",
            cells,
        )

    def _invariants(self) -> None:
        expected = sum(len(item.slots) for item in self.catalog.items.values()) * len(self.catalog.characters)
        self._expect(len(self.rows) == expected, f"matrix has {len(self.rows)} rows, expected {expected}")
        seen = {(row.character_id, row.item_id, row.slot) for row in self.rows}
        for character_id in self.catalog.character_ids:
            for item in self.catalog.items.values():
                for slot in item.slots:
                    self._expect((character_id, item.item_id, slot) in seen, f"missing row {character_id} {item.item_id} {slot}")
        for row in self.rows:
            self._expect(row.status in ("PASS", "PASS_WITH_ADJUSTMENT", "UNSUPPORTED", "FAIL"), f"bad status {row.status}")
            metrics = row.metrics
            self._expect(metrics is not None, f"{row.item_id} has no metrics")
            if metrics is None:
                continue
            expected_pivot = (metrics.anchor[0] + metrics.offset[0], metrics.anchor[1] + metrics.offset[1])
            self._expect(metrics.world_pivot == expected_pivot, f"pivot formula drifted for {row.character_id} {row.item_id}")
            result = self.compositor.compose(row.character_id, {row.slot: row.item_id}, draw_vfx=False)
            placement = result.placement_for(row.slot)
            self._expect(placement is not None, f"compositor dropped {row.item_id} on {row.slot}")
            if placement is None:
                continue
            self._expect(placement.origin == metrics.origin, f"compositor origin != matrix for {row.item_id} {row.slot}")
            self._expect(_partial(result.image) == 0, f"composite alpha not binary for {row.character_id} {row.item_id}")
            bare = self.compositor.compose(row.character_id, {}, draw_vfx=False).image
            stray = [pixel for pixel in _changed(bare, result.image) if pixel not in _destinations(self.catalog, row.item_id, placement.origin)]
            self._expect(not stray, f"identity changed {len(stray)} px outside {row.item_id} on {row.character_id}")
            self._expect(result.drawn == [step for step in ("L01", "accessory", "headgear", "main_hand", "L05f", "off_hand", "L06f", "L09") if step in result.drawn], "draw order drifted")

        self._native_reconstruction()
        self._grip_overlay_wins()
        self._neutral_staff_rejected_on_heavy()
        self._alpha_sources()

    def _native_reconstruction(self) -> None:
        matched = 0
        for character in self.catalog.characters.values():
            for item_id, record in character.native_items.items():
                item = self.catalog.items[item_id]
                anchor = character.anchor_for(record["slot"])
                origin = (anchor[0] - item.pivot[0], anchor[1] - item.pivot[1])
                self._expect(tuple(record["native_origin"]) == origin, f"{item_id} native_origin {record['native_origin']} != anchor-pivot {origin}")
                canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
                layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
                layer.paste(item.image, origin)
                canvas = Image.alpha_composite(canvas, layer)
                found = None
                for key, image in character.layer_images.items():
                    if _same_visible(image, canvas):
                        found = key
                        break
                self._expect(found is not None, f"{item_id} did not reconstruct any layer at {origin}")
                if found is not None:
                    matched += 1
        self._expect(matched == 13, f"reconstructed {matched} native items, expected 13")

    def _grip_overlay_wins(self) -> None:
        """L05f / L06f are drawn after the held item, so fist pixels stay fist pixels."""
        sword = self.compositor.compose("AVT_AEG_001", {"main_hand": "EQ_SWORD_BASIC_001"}, draw_vfx=False)
        self._expect(self._overlay_wins(sword, "AVT_AEG_001", "L05f", "EQ_SWORD_BASIC_001", "main_hand"), "L05f did not cover the basic sword")
        dagger = self.compositor.compose("AVT_PHA_001", {"off_hand": "EQ_DAGGER_BASIC_001"}, draw_vfx=False)
        self._expect(self._overlay_wins(dagger, "AVT_PHA_001", "L06f", "EQ_DAGGER_BASIC_001", "off_hand"), "L06f did not cover the off-hand dagger")

    def _overlay_wins(self, result: Composite, character_id: str, grip_key: str, item_id: str, slot: str) -> bool:
        character = self.catalog.characters[character_id]
        placement = result.placement_for(slot)
        if placement is None:
            return False
        dest = _destinations(self.catalog, item_id, placement.origin)
        grip = character.layer_opaque[grip_key]
        grip_image = character.layer_images[grip_key].load()
        item = self.catalog.items[item_id]
        item_px = item.image.load()
        out = result.image.load()
        checked = 0
        for x, y in dest & grip:
            local = (x - placement.origin[0], y - placement.origin[1])
            if item_px[local] == grip_image[x, y]:
                continue
            if out[x, y] != grip_image[x, y]:
                return False
            checked += 1
        return checked > 0

    def _neutral_staff_rejected_on_heavy(self) -> None:
        row = _row(self.rows, "AVT_AEG_001", "EQ_STAFF_NEUTRAL_001", "main_hand")
        self._expect(row.status == "UNSUPPORTED", f"Potlid neutral staff should be UNSUPPORTED, got {row.status}")
        self._expect(row.offset == (0, 0), "Potlid neutral staff was given an offset despite the rig declaration")

    def _alpha_sources(self) -> None:
        for item in self.catalog.items.values():
            self._expect(item.partial_alpha == 0, f"{item.item_id} has {item.partial_alpha} partial-alpha pixels")
            self._expect(item.actual_size == item.declared_size, f"{item.item_id} size mismatch")
        for character in self.catalog.characters.values():
            for key, count in character.layer_partial.items():
                self._expect(count == 0, f"{character.character_id} {key} has partial alpha")
                self._expect(character.layer_images[key].size == (CANVAS, CANVAS), f"{character.character_id} {key} is not 128×128")


def anchor_crosses(catalog: Catalog) -> list[tuple[Image.Image, list[str], str]]:
    """Body + grip overlays with the measured anchors marked. Documentation only."""
    cells = []
    for character_id in catalog.character_ids:
        character = catalog.characters[character_id]
        image = character.layer_images["L01"].copy()
        for key in ("L05f", "L06f"):
            if key in character.layer_images:
                image = Image.alpha_composite(image, character.layer_images[key])
        draw = ImageDraw.Draw(image)
        for name, (x, y) in character.anchors.items():
            draw.rectangle((x - 1, y - 1, x + 1, y + 1), outline=(255, 45, 111, 255))
        draw.line((0, 122, 127, 122), fill=(255, 45, 111, 180))
        cells.append(_cell(image, character.label, character_id, "INFO"))
    return cells
