# Test fixtures

JSON snapshots copied from `feat/card-art-prototype-mira` at commit `d65c89dc87a9554d5611a108146b509c7aa7fcf0` (open PR #1).

These files are a partial snapshot for the asset loader tests. They are not a live dependency on the art branch. No PNG, WebP, or JPG files were copied.

| File | Source |
|---|---|
| `asset-manifest.snapshot.json` | Subset of `docs/ASSET_MANIFEST.json` (13 of 87 assets) |
| `frame_layout.snapshot.json` | `assets/card-art/frames/frame_layout.json` |
| `rigs.snapshot.json` | Anchors and fit offsets from `assets/characters/_rigs/humanoid_heavy.json` and `humanoid_standard.json` |
| `equipment-items.snapshot.json` | Selected rows from per-character `equipment/items.json` and `assets/equipment/shared_items.json` |

Shared item objects in the art file omit `asset_id` inside the body (the key is the id). The equipment snapshot copies that key into `asset_id` and says so in `_snapshot`.
