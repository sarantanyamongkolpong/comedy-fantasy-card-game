"""Write the matrix, offset table, anchor notes, and the QA report section."""
from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path

from catalog import BASELINE_Y, CANVAS, ROOT, Catalog
from evaluate import (
    BASELINE_HARD_PX,
    EYE_FRACTION_MAX,
    FEET_BAND_MIN,
    FEET_BAND_Y0,
    GRIP_PAD,
    HEAD_BODY_MAX_CHEBY,
    HEAD_MIN_PX_ABOVE,
    OFFHAND_BODY_MAX_CHEBY,
    OFFSET_LIMIT,
    PIVOT_OPAQUE_MAX_CHEBY,
    Row,
)
from scenarios import Scenario

QA_BEGIN = "<!-- EQUIPMENT_STRESS_BEGIN -->"
QA_END = "<!-- EQUIPMENT_STRESS_END -->"


def _rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def totals(rows: list[Row]) -> dict[str, int]:
    counts = Counter(row.status for row in rows)
    return {status: counts.get(status, 0) for status in ("PASS", "PASS_WITH_ADJUSTMENT", "UNSUPPORTED", "FAIL", "TOTAL")} | {
        "TOTAL": len(rows)
    }


def write_offsets(rows: list[Row], path: Path) -> None:
    characters: dict[str, dict] = {}
    for row in rows:
        if row.status != "PASS_WITH_ADJUSTMENT":
            continue
        slot_record = {
            "offset": list(row.offset),
            "source": row.offset_source,
            "reason": row.reason,
        }
        characters.setdefault(row.character_id, {}).setdefault(row.item_id, {})[row.slot] = slot_record
    payload = {
        "schema": "equipment_offsets.v1",
        "formula": "origin = anchor[slot] - item.pivot + offset",
        "units": "logical pixels, +x right, +y down, integers only",
        "limit": OFFSET_LIMIT,
        "note": (
            "Stress-test offsets only. Rig JSON is not modified. A missing character/item/slot means [0, 0]. "
            "source rig_fit copies the authored preview fit onto that item's primary slot. "
            "source stress_search is a new offset required to clear the 128 canvas or the ground baseline."
        ),
        "characters": characters,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_matrix(rows: list[Row], scenarios: list[Scenario], out_paths: dict[str, Path]) -> None:
    count = totals(rows)
    rules = {
        "formula": "origin = anchor[slot] - pivot + offset",
        "anchor_for_slot": {"headgear": "head", "main_hand": "main_hand", "off_hand": "off_hand", "accessory": "feet"},
        "offset_limit": OFFSET_LIMIT,
        "grip_pad": GRIP_PAD,
        "pivot_opaque_max_chebyshev": PIVOT_OPAQUE_MAX_CHEBY,
        "offhand_body_max_chebyshev": OFFHAND_BODY_MAX_CHEBY,
        "head_body_max_chebyshev": HEAD_BODY_MAX_CHEBY,
        "head_min_px_above": HEAD_MIN_PX_ABOVE,
        "feet_band": [FEET_BAND_Y0, BASELINE_Y - 1],
        "feet_band_min": FEET_BAND_MIN,
        "baseline_y": BASELINE_Y,
        "baseline_hard_px": BASELINE_HARD_PX,
        "eye_fraction_max": EYE_FRACTION_MAX,
        "canvas": [CANVAS, CANVAS],
        "body_policy": "Never scale, rotate, or repaint a body to force a fit. Mark UNSUPPORTED instead.",
    }
    payload = {
        "schema": "equipment_compatibility_matrix.v1",
        "totals": count,
        "rules": rules,
        "scenarios": [
            {"id": scenario.case_id, "passed": scenario.passed, "detail": scenario.detail, "sheet": scenario.sheet}
            for scenario in scenarios
        ],
        "rows": [row.as_dict() for row in rows],
    }
    out_paths["json"].write_text(json.dumps(payload, indent=2) + "\n")
    _write_csv(rows, out_paths["csv"])
    _write_md(rows, scenarios, count, out_paths["md"])


def _write_csv(rows: list[Row], path: Path) -> None:
    fields = [
        "character_id",
        "character",
        "rig",
        "item_id",
        "slot",
        "shared",
        "native",
        "status",
        "offset_dx",
        "offset_dy",
        "offset_source",
        "overflow_px",
        "baseline_px",
        "body_overlap_px",
        "eye_cover_px",
        "pivot_in_grip",
        "reason",
        "notes",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            metrics = row.metrics
            writer.writerow(
                {
                    "character_id": row.character_id,
                    "character": row.character,
                    "rig": row.rig,
                    "item_id": row.item_id,
                    "slot": row.slot,
                    "shared": row.shared,
                    "native": row.native,
                    "status": row.status,
                    "offset_dx": row.offset[0],
                    "offset_dy": row.offset[1],
                    "offset_source": row.offset_source,
                    "overflow_px": "" if metrics is None else metrics.overflow,
                    "baseline_px": "" if metrics is None else metrics.baseline_px,
                    "body_overlap_px": "" if metrics is None else metrics.body_overlap,
                    "eye_cover_px": "" if metrics is None else metrics.eye_cover,
                    "pivot_in_grip": "" if metrics is None else metrics.pivot_in_grip,
                    "reason": row.reason,
                    "notes": " | ".join(row.notes),
                }
            )


def _write_md(rows: list[Row], scenarios: list[Scenario], count: dict[str, int], path: Path) -> None:
    lines = [
        "# Equipment compatibility matrix",
        "",
        "Generated by `python3 tools/equipment_tests/run_equipment_stress.py`.",
        "Every equipment item is scored on every character in every slot that item declares.",
        "Wrong-slot attempts are rejected by the compositor and are not given a fit status; see TC10.",
        "",
        "Placement follows ART_STYLE_BIBLE §7: `origin = anchor[slot] − pivot + offset`.",
        "Headgear uses the `head` anchor. Accessories use the `feet` anchor. No rotation. Bodies are not scaled.",
        "",
        "## Totals",
        "",
        "| Status | Count |",
        "|---|---:|",
        f"| PASS | {count['PASS']} |",
        f"| PASS_WITH_ADJUSTMENT | {count['PASS_WITH_ADJUSTMENT']} |",
        f"| UNSUPPORTED | {count['UNSUPPORTED']} |",
        f"| FAIL | {count['FAIL']} |",
        f"| TOTAL | {count['TOTAL']} |",
        "",
        "## Named cases",
        "",
        "| Case | Result | Detail | Sheet |",
        "|---|---|---|---|",
    ]
    for scenario in scenarios:
        result = "PASS" if scenario.passed else "FAIL"
        detail = scenario.detail.replace("|", "/")
        lines.append(f"| {scenario.case_id} | {result} | {detail} | docs/qa/equipment_stress/{scenario.sheet} |")
    lines += [
        "",
        "## Combinations",
        "",
        "| Character | Rig | Item | Slot | Offset | Status | Reason |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in rows:
        reason = row.reason.replace("|", "/")
        if row.notes:
            reason += " Notes: " + " ".join(row.notes)
        lines.append(
            f"| {row.character_id} {row.character} | {row.rig} | {row.item_id} | {row.slot} | "
            f"{list(row.offset)} | {row.status} | {reason} |"
        )
    lines += [
        "",
        "Machine-readable copies: `docs/EQUIPMENT_COMPATIBILITY_MATRIX.json`, `docs/EQUIPMENT_COMPATIBILITY_MATRIX.csv`.",
        "Offsets: `assets/characters/_rigs/equipment_offsets.json`.",
        "",
    ]
    path.write_text("\n".join(lines))


def _centroid(points: set[tuple[int, int]]) -> tuple[float, float] | None:
    if not points:
        return None
    return (sum(p[0] for p in points) / len(points), sum(p[1] for p in points) / len(points))


def _nearest(point: tuple[int, int], points: set[tuple[int, int]]) -> int | None:
    if not points:
        return None
    return min(max(abs(point[0] - other[0]), abs(point[1] - other[1])) for other in points)


def write_anchor_doc(catalog: Catalog, path: Path) -> None:
    """Document measured anchors. Does not recommend applying a change that would break native reconstruction."""
    lines = [
        "# Anchor correction recommendations",
        "",
        "Audit of `assets/characters/_rigs/humanoid_heavy.json` and `humanoid_standard.json`.",
        "Generated by `python3 tools/equipment_tests/run_equipment_stress.py`.",
        "",
        "**No anchor value is applied by this audit.** Native equipment already reconstructs with zero pixel error at `origin = anchor − pivot`, so moving an anchor would shift a fitted item off the sprite it was cut from.",
        "",
        "## Recommendation",
        "",
        "Do not change any per-character anchor in the rig JSON.",
        "",
        "Every native item's recorded `native_origin` equals `anchor[slot] − pivot` (13/13). Pasting the standalone PNG at that origin reproduces the character's layer file. The anchors are the grip and mount points the art was built on, not guesses that still need a nudge.",
        "",
        "## What was measured",
        "",
        "Fist centroids are the average of opaque L05f / L06f pixels. A centroid below the anchor means the gauntlet or fingers extend past the closed-fist point. That is expected; the anchor is the grip point, not the bounding-box center.",
        "",
        "| Character | Anchor | Value | On a body pixel | Nearest body px (Chebyshev) | Grip centroid | Centroid − anchor |",
        "|---|---|---|---|---:|---|---|",
    ]
    for character_id in catalog.character_ids:
        character = catalog.characters[character_id]
        for name in ("head", "main_hand", "off_hand", "back", "body_center", "feet"):
            point = character.anchors[name]
            on_body = point in character.body
            nearest = _nearest(point, character.body)
            centroid = ""
            delta = ""
            if name == "main_hand":
                centroid_xy = _centroid(character.layer_opaque.get("L05f", set()))
            elif name == "off_hand":
                centroid_xy = _centroid(character.layer_opaque.get("L06f", set()))
            else:
                centroid_xy = None
            if centroid_xy is not None:
                centroid = f"({centroid_xy[0]:.1f}, {centroid_xy[1]:.1f})"
                delta = f"({centroid_xy[0] - point[0]:+.1f}, {centroid_xy[1] - point[1]:+.1f})"
            elif name in ("main_hand", "off_hand"):
                centroid = "no grip overlay"
            lines.append(
                f"| {character_id} | {name} | {list(point)} | {on_body} | {nearest} | {centroid} | {delta} |"
            )
    lines += [
        "",
        "## Do not apply these temptations",
        "",
        "1. **Do not snap feet onto the sole.** Every `feet` anchor is `(64, 122)`, on the ground baseline, and the nearest body pixel is a few rows above it. ART_STYLE_BIBLE §3 puts the lowest foot pixel on row 121 and the anchor on y = 122. Sneakers mount here and land on row 121. Snapping the anchor up would bury the soles in the shin.",
        "2. **Do not snap Meteor's or Plaster's head anchor onto the nearest body pixel.** Both sit 1 px off the hairline. Their native hats already reconstruct. A 1 px snap would move the hat.",
        "3. **Do not move Sir Potlid's `main_hand` up to the humanoid_standard hand line.** His gauntlet centroid is about 3 px below the anchor because the fist extends downward. The native sword is cut to this anchor. Tall staffs overflow here because the hand is low and the staffs are long (`height − pivot_y` below the grip exceeds `127 − 75`). Mark those staffs UNSUPPORTED. Do not retarget the hand, and do not scale the body.",
        "4. **Do not move Sister Plaster's `off_hand` onto the forearm.** The anchor is the clipboard grip. It sits several pixels outside the remaining L01 arm because there is no L06f overlay and the hand pixels were part of the held item. Moving it would slide the native clipboard. Cross-equipped off-hand items correctly share this same outward grip.",
        "5. **Do not add rotation** so a vertical staff follows the arm. The bible forbids rotation in this prototype; it would break the hard pixel grid.",
        "",
        "## Canvas budget (why some shared items cannot fit the heavy rig)",
        "",
        "Opaque pixels must stay inside x = 0..127 and y = 0..127. Rows y ≥ 122 are the ground band (shadow / VFX). A held item whose pixels below the grip exceed `127 − anchor_y` leaves the canvas.",
        "",
        "| Character | main_hand y | Pixels available below the grip (through y = 127) | Pixels available before the ground band (through y = 121) |",
        "|---|---:|---:|---:|",
    ]
    for character_id in catalog.character_ids:
        hand_y = catalog.characters[character_id].anchors["main_hand"][1]
        lines.append(f"| {character_id} | {hand_y} | {127 - hand_y} | {121 - hand_y} |")
    lines += [
        "",
        "`EQ_STAFF_NEUTRAL_001` is 102 px tall with the grip at y = 45, so 57 px hang below the pivot. Sir Potlid only has 52 px of canvas below his hand, and the item also declares `compatible_rigs: [humanoid_standard]`. Both facts make it UNSUPPORTED on `humanoid_heavy`. No offset is recorded for it.",
        "",
        "Kunai pivots lie 3 px above their bitmaps (`pivot_y = -3`). That is a valid grip in the fist, covered by L05f / L06f on Nox. It is not an anchor error. Characters without L06f still receive the off-hand kunai at the off-hand anchor; the blade hangs from that point.",
        "",
        "## Preview fit is not slot-specific",
        "",
        "Rig `fit` on Sir Potlid is `EQ_SWORD_BASIC_001: [-6, -2]` and `EQ_DAGGER_BASIC_001: [-4, 0]`. `preview/index.html` and `tools/compose.py` apply an item's fit on every slot. The dagger was tuned for the main hand. This audit keeps `[-4, 0]` on `main_hand` and leaves `off_hand` at `[0, 0]`, which already sits on the off-hand anchor. The stress compositor follows the slot-specific table in `equipment_offsets.json`.",
        "",
    ]
    path.write_text("\n".join(lines))


def write_qa_section(rows: list[Row], scenarios: list[Scenario], sheet_names: list[str], failures: list[str]) -> str:
    count = totals(rows)
    case_lines = "\n".join(
        f"| {scenario.case_id} {scenario_title(scenario.case_id)} | {'PASS' if scenario.passed else 'FAIL'} | {scenario.detail} |"
        for scenario in scenarios
    )
    unsupported = [row for row in rows if row.status == "UNSUPPORTED"]
    unsupported_lines = "\n".join(
        f"- `{row.character_id}` + `{row.item_id}` ({row.slot}): {row.reason}" for row in unsupported
    ) or "- None."
    adjusted = [row for row in rows if row.status == "PASS_WITH_ADJUSTMENT"]
    adjusted_lines = "\n".join(
        f"- `{row.character_id}` + `{row.item_id}` ({row.slot}) offset {list(row.offset)} ({row.offset_source})"
        for row in adjusted
    ) or "- None."
    failure_lines = "\n".join(f"- {item}" for item in failures) or "- None."
    sheets = "\n".join(f"- `docs/qa/equipment_stress/{name}`" for name in sheet_names)
    return f"""{QA_BEGIN}
## Cross-character equipment stress (t231)

Harness: `python3 tools/equipment_tests/run_equipment_stress.py`. Date of the rules: 2026-11-18 ICT.
Status of this section: **PROTOTYPE**. Not PRODUCTION_READY. Owner approval is required before any merge. No anchor, rig value, sprite, or item JSON was modified.

The compositor places every item with `origin = anchor[slot] − pivot + offset` and draws L01, accessory, headgear, main hand, L05f, off hand, L06f, L09. Headgear uses `head`. Accessories use `feet`. Alpha must be 0 or 255. An item that cannot sit on the fist without leaving the 128 canvas or the ground band (y ≥ 122) is **UNSUPPORTED**. The body is not scaled or rotated to force it.

### Matrix totals

| Status | Count |
|---|---:|
| PASS | {count['PASS']} |
| PASS_WITH_ADJUSTMENT | {count['PASS_WITH_ADJUSTMENT']} |
| UNSUPPORTED | {count['UNSUPPORTED']} |
| FAIL | {count['FAIL']} |
| TOTAL | {count['TOTAL']} |

### Named cases

| Case | Result | Detail |
|---|---|---|
{case_lines}

### Offsets recorded

{adjusted_lines}

### Unsupported (not forced)

{unsupported_lines}

### Harness failures

{failure_lines}

### Sheets ({len(sheet_names)}, nearest-neighbour)

{sheets}

Full table: `docs/EQUIPMENT_COMPATIBILITY_MATRIX.md`. Anchor notes: `docs/ANCHOR_CORRECTION_RECOMMENDATIONS.md`.
{QA_END}
"""


def scenario_title(case_id: str) -> str:
    from scenarios import CASE_TITLES

    return CASE_TITLES.get(case_id, case_id)


def update_qa_report(section: str) -> None:
    path = ROOT / "docs" / "QA_REPORT.md"
    existing = path.read_text()
    block = section.strip() + "\n"
    if QA_BEGIN in existing and QA_END in existing:
        start = existing.index(QA_BEGIN)
        end = existing.index(QA_END) + len(QA_END)
        updated = existing[:start] + block + existing[end:]
    else:
        if not existing.endswith("\n"):
            existing += "\n"
        updated = existing + "\n" + block
    path.write_text(updated)
