# Integration notes for Mira

The systems loader is `createAssetLoader` in `src/assets/loader.js`. It does not read the art tree by itself. The caller passes a manifest object and sidecar JSON (rigs, item records, frame layout). Tests use a JSON snapshot of commit `d65c89d` under `tests/fixtures/`. This branch does not modify `assets/`.

## Manifest entry

Required on every asset:

| Field | Type | Notes |
|---|---|---|
| `asset_id` | string | Unique inside the file. The loader keeps the first row if an id repeats, and records `DUPLICATE_ID`. |
| `path` | string | Repo-relative path. The loader returns it and does not open the file. |
| `type` | string | Free string. Current values are listed in `docs/SYSTEMS_REPO_AUDIT.md`. |
| `owner` | string | Avatar id, `shared`, or `owner`. |
| `status` | enum | `CONCEPT`, `PROTOTYPE`, `QA_PASSED`, `PRODUCTION_READY`, `INTEGRATED`. |

Optional and passed through: `note`, `sha256`, `bytes`, `pivot`, `anchors`, `slot`, `variant_of`, `canvas_px`, and any other art field.

`resolve(assetId)` results:

| Situation | Result |
|---|---|
| Unknown id | `{ ok: false, found: false, reason: "MISSING_ID" }` |
| `CONCEPT` or `PROTOTYPE` | `{ ok: true, advisory: "<status>", productionReady: false }` |
| `QA_PASSED` | `{ ok: true, advisory: null, productionReady: false }` |
| `PRODUCTION_READY` or `INTEGRATED` | `{ ok: true, advisory: null, productionReady: true }` |
| Any other status string | `{ ok: true, advisory: "UNKNOWN_STATUS", productionReady: false }` |

CONCEPT and PROTOTYPE stay visible. The loader does not drop them and does not throw.

`integrity(assetId)` returns `sha256` and `bytes` from the entry when those fields exist. It does not hash a file.

## Placement data

The loader never stores pixel coordinates. `placement(avatarId, equipmentId)` computes:

`origin = anchor - pivot + fit`

| Input | Where it is read |
|---|---|
| Anchor | `rig.characters[avatarId].anchors[anchorName]` |
| Anchor name | Slot map, then the item slot |
| Pivot | Item `pivot` as `[x, y]` |
| Fit | `rig.characters[avatarId].fit[equipmentId]` when that key exists |
| No fit key | Fit is `[0, 0]`, meaning no extra offset |

A missing rig, anchor, pivot, or item returns `{ ok: false, reason }` (`MISSING_RIG`, `MISSING_ANCHOR`, `MISSING_PIVOT`, `MISSING_EQUIPMENT_DATA`).

`native_origin` / `native_origin_on_128` is reported back as a cross-check (`nativeOriginMatches`). The formula does not use that field as the position.

Frame rects come from `frame_layout.json` via `layoutRect(name)`. Names in the current file: `art_window`, `faction_emblem`, `rarity`, `name`, `stat_pow`, `stat_def`, `stat_spd`. A missing layout returns `LAYOUT_UNAVAILABLE`. An unknown name returns `UNKNOWN_RECT`.

## What the art side would need to add

1. **Anchor name on each item.** Slot-to-anchor is prose in `docs/CHARACTER_ASSET_REGISTRY.md` (headgear uses `head`, accessory uses `feet`). Please add `"anchor": "head"` (the name, not a pixel) on each equipment object so `src/assets/slot-anchor-map.json` can be retired. Question Q-SLOT-ANCHOR.

2. **Slots as an array.** `EQ_DAGGER_BASIC_001` uses `"slot": "main_hand|off_hand"`. The loader treats a pipe and no chosen slot as `AMBIGUOUS_SLOT` and refuses to guess a hand. An array `"slots": ["main_hand", "off_hand"]` would be clearer. Until then, the caller passes `{ slot: "main_hand" }` or `{ slot: "off_hand" }`.

3. **`asset_id` inside shared item bodies.** `assets/equipment/shared_items.json` uses the object key as the id and omits `asset_id` in the value. Manifest rows already have `asset_id`. Putting the same id inside the body would match per-character `items.json`.

4. **Keep `variant_of`.** The gold pot helmet points at `EQ_AEG_POT_HELMET_SILVER_001`. The systems variant record uses that link. Please keep the field on future variants.

5. **Keep the status legend** stable: `CONCEPT`, `PROTOTYPE`, `QA_PASSED`, `PRODUCTION_READY`, `INTEGRATED`.

6. **Keep coordinates in JSON**, including `frame_layout.json` rects, rig anchors, and item pivots. Frame PNGs stay free of baked name and stat text, which the layout file already states.

7. **Structured character rows are optional.** The manifest `characters` object is a display string. The systems catalog does not parse that string. A later object `{ name_en, name_th, faction, role, rig }` would be easier to check, and is not required for the loader.

Gameplay stats, rarity, and AP costs stay out of the art JSON until the Owner sets them. The manifest line that those values are TBD matches the systems samples.
