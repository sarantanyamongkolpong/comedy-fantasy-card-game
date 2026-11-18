#!/usr/bin/env python3
"""Cross-character equipment stress harness.

One command, from the repo root:

    python3 tools/equipment_tests/run_equipment_stress.py

Exit 0 when every named case and invariant passes. UNSUPPORTED combinations
are expected results, not failures. FAIL status or a broken case exits 1.
Nothing here is PRODUCTION_READY.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from catalog import Catalog  # noqa: E402
from compositor import Compositor  # noqa: E402
from evaluate import Evaluator  # noqa: E402
from reports import (  # noqa: E402
    totals,
    update_qa_report,
    write_anchor_doc,
    write_matrix,
    write_offsets,
    write_qa_section,
)
from scenarios import ScenarioRunner, anchor_crosses  # noqa: E402
from sheets import contact_sheet, write_matrix_sheets, write_overflow_sheet  # noqa: E402


def _load_preview_compose():
    path = ROOT / "tools" / "compose.py"
    spec = importlib.util.spec_from_file_location("preview_compose_reference", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _pixels(image):
    data = image.load()
    width, height = image.size
    return [data[x, y] for y in range(height) for x in range(width)]


def check_preview_parity(catalog: Catalog, compositor: Compositor, failures: list[str]) -> None:
    """Default loadouts and the authored sword fit must match tools/compose.py."""
    preview = _load_preview_compose()
    checks = []
    for character_id in catalog.character_ids:
        checks.append((character_id, catalog.default_loadout(character_id), preview.default(character_id)))
    potlid = catalog.default_loadout("AVT_AEG_001")
    checks.append(("AVT_AEG_001", {**potlid, "headgear": "EQ_AEG_POT_HELMET_GOLD_001"}, {**preview.default("AVT_AEG_001"), "headgear": "EQ_AEG_POT_HELMET_GOLD_001"}))
    checks.append(("AVT_AEG_001", {**potlid, "main_hand": "EQ_SWORD_BASIC_001"}, {**preview.default("AVT_AEG_001"), "main_hand": "EQ_SWORD_BASIC_001"}))
    meteor = catalog.default_loadout("AVT_CEL_001")
    checks.append(("AVT_CEL_001", {**meteor, "main_hand": "EQ_STAFF_NEUTRAL_001"}, {**preview.default("AVT_CEL_001"), "main_hand": "EQ_STAFF_NEUTRAL_001"}))
    plaster = catalog.default_loadout("AVT_SAN_001")
    checks.append(("AVT_SAN_001", {**plaster, "main_hand": "EQ_STAFF_NEUTRAL_001"}, {**preview.default("AVT_SAN_001"), "main_hand": "EQ_STAFF_NEUTRAL_001"}))
    for character_id, ours, theirs in checks:
        mine = compositor.compose(character_id, ours).image
        reference = preview.compose(character_id, theirs)
        if _pixels(mine) != _pixels(reference):
            failures.append(f"preview parity failed for {character_id} loadout {ours}")

    # The reference compositor applies the dagger fit on the off hand too.
    # Slot-specific offsets intentionally do not. The sprites must differ by that shift.
    off = {**potlid, "off_hand": "EQ_DAGGER_BASIC_001"}
    mine = compositor.compose("AVT_AEG_001", off).image
    reference = preview.compose("AVT_AEG_001", {**preview.default("AVT_AEG_001"), "off_hand": "EQ_DAGGER_BASIC_001"})
    if _pixels(mine) == _pixels(reference):
        failures.append("off-hand dagger unexpectedly matched the slot-global preview fit")


def main() -> int:
    catalog = Catalog()
    evaluator = Evaluator(catalog)
    rows = evaluator.matrix()
    offsets = evaluator.offset_table(rows)
    compositor = Compositor(catalog, offsets)
    runner = ScenarioRunner(catalog, compositor, rows)
    scenarios = runner.run_all()
    check_preview_parity(catalog, compositor, runner.failures)

    out_dir = ROOT / "docs" / "qa" / "equipment_stress"
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet_names: list[str] = []
    for scenario in scenarios:
        contact_sheet(scenario.cells, out_dir / scenario.sheet, columns=4)
        sheet_names.append(scenario.sheet)
    for path in write_matrix_sheets(catalog, compositor, rows, out_dir):
        sheet_names.append(path.name)
    overflow = write_overflow_sheet(catalog, rows, out_dir)
    if overflow is not None:
        sheet_names.append(overflow.name)
    contact_sheet(anchor_crosses(catalog), out_dir / "anchors.png", columns=4)
    sheet_names.append("anchors.png")

    zero = Compositor(catalog, {})
    adjustment_cells = []
    for row in rows:
        if row.status != "PASS_WITH_ADJUSTMENT":
            continue
        before = zero.compose(row.character_id, {row.slot: row.item_id}, draw_vfx=False).image
        after = compositor.compose(row.character_id, {row.slot: row.item_id}, draw_vfx=False).image
        adjustment_cells.append((before, [f"before [0, 0] {row.character}", row.item_id, row.slot], "INFO"))
        adjustment_cells.append((after, [f"after {list(row.offset)} {row.character}", row.item_id, row.slot], row.status))
    if adjustment_cells:
        contact_sheet(adjustment_cells, out_dir / "adjustments.png", columns=4)
        sheet_names.append("adjustments.png")

    write_offsets(rows, ROOT / "assets" / "characters" / "_rigs" / "equipment_offsets.json")
    write_matrix(
        rows,
        scenarios,
        {
            "json": ROOT / "docs" / "EQUIPMENT_COMPATIBILITY_MATRIX.json",
            "csv": ROOT / "docs" / "EQUIPMENT_COMPATIBILITY_MATRIX.csv",
            "md": ROOT / "docs" / "EQUIPMENT_COMPATIBILITY_MATRIX.md",
        },
    )
    write_anchor_doc(catalog, ROOT / "docs" / "ANCHOR_CORRECTION_RECOMMENDATIONS.md")
    update_qa_report(write_qa_section(rows, scenarios, sheet_names, runner.failures))
    (out_dir / "README.md").write_text(
        "\n".join(
            [
                "# Equipment stress sheets",
                "",
                "Nearest-neighbour contact sheets from `python3 tools/equipment_tests/run_equipment_stress.py`.",
                "Regenerate them with that command. Do not hand-edit.",
                "",
                "Matrix sheets are one character per file, every declared item × slot.",
                "`overflow_padded.png` draws overflowing placements on a 160 px canvas (16 px margin, red 128 window) at 3×.",
                "`anchors.png` marks rig anchors on the body. The line is y = 122.",
                "`adjustments.png` is the [0, 0] placement beside the recorded offset.",
                "",
            ]
        )
    )

    count = totals(rows)
    print("equipment stress")
    for status in ("PASS", "PASS_WITH_ADJUSTMENT", "UNSUPPORTED", "FAIL", "TOTAL"):
        print(f"  {status:24} {count[status]}")
    for scenario in scenarios:
        print(f"  {scenario.case_id} {'PASS' if scenario.passed else 'FAIL'}  {scenario.detail}")
    if runner.failures:
        print(f"FAILURES {len(runner.failures)}")
        for item in runner.failures:
            print(f"  - {item}")
        return 1
    print("ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
