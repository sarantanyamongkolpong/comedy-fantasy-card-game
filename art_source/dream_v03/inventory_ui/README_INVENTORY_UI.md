# Comedy Fantasy Card Game — Inventory / Bag Art v0.3

Art-only assets for the Inventory/Bag screen. No game code, UI logic, numeric counters, costs, or card stats were modified or approved.

## Asset inventory and review statuses

| File | Dimensions | Channels | Status | Notes |
| --- | --- | --- | --- | --- |
| `inventory_room_background.png` | 1672×941 | RGB | `GENERATED_REVIEW` | Widescreen dark navy/purple magical Hideout storeroom; clear center for UI overlay |
| `inventory_backpack.png` | 1254×1254 | RGBA | `GENERATED_REVIEW` | One isolated ornate, overfilled magical card backpack |
| `inventory_slot_frame.png` | 1254×1254 | RGBA | **`REVIEW_FIX_NEEDED`** | Empty square slot; nearly transparent center (alpha 2/255) but bright red/yellow alpha fringe around border |
| `inventory_item_detail_panel.png` | 971×1619 | RGBA | **`REVIEW_FIX_NEEDED`** | Tall ornament with transparent item preview and details regions; edge halos need cleanup |
| `inventory_category_tab_frame.png` | 2172×724 | RGBA | **`REVIEW_FIX_NEEDED`** | Wide tab with transparent middle; fringe cleanup required |
| `inventory_tooltip_frame.png` | 1619×971 | RGBA | **`REVIEW_FIX_NEEDED`** | Empty tooltip frame, central alpha 0; fringe cleanup required |

## QA notes

- Every asset was generated as a separate raster image with the built-in ImageGen tool.
- Background is precisely **1672×941**, not a stretched 3:2 proxy; it is an opaque RGB image. Keep it on a fixed aspect-ratio master canvas and scale UI anchors with the canvas, leaving letterbox/pillarbox as needed.
- All five foreground elements include alpha (`RGBA`) and the top-left pixel is fully transparent. Geometric frame areas (slot/tab/detail/tooltip) have some colorful red/yellow fringe or faint residual opacity near alpha transition edges from image generation. They are **not production-clean**; compositing may expose halos on dark backgrounds. Review/manual mask cleanup or geometry-native SVG alternatives are required before locking.
- The `inventory_slot_frame.png` center pixel is RGBA `(127,127,127,2)`, meaning alpha 2/255 rather than a perfect empty cutout. Other frame center pixels tested are zero alpha.
- These images are design references and standalone swap-ready art objects, **not** a complete Inventory UI screenshot.

## Composition suggestion

Use `inventory_room_background` as a 1672×941 fixed canvas. Place `inventory_backpack` decoratively beside an overlay-generated item grid. Use multiple item slot frames or code-native frames for cells, detail panel for selected item, tabs for categories, and tooltip for hover/tap. Runtime text, counts, sorting/filter labels and interactions must remain code-native, **never baked into images**.

## Prompt provenance

- Background: widescreen fantasy storeroom, midnight navy/royal purple/gold, shelves and tiny comedic details at edges, central 70% clear for UI, no buttons/text, 16:9.
- Backpack: ornate leather-and-gold fantasy pack stuffed with blank cards/scrolls, purple bedding and emerald charm, isolated transparency.
- Slot: single square symmetrical gold and purple empty item slot with transparent center.
- Detail panel: tall dual-opening empty gold/purple fantasy frame for selected item and dynamic description.
- Tab: long horizontal gold/purple empty category tab.
- Tooltip: compact landscape gold/purple empty tooltip frame with decorative corners, no text.

