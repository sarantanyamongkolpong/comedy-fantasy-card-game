# Fixed stage

Every screen is drawn inside one design canvas, **1672×941**, the same master as Dream’s world map (`world_map_base_16x9.png`).

```text
scale = min(viewportWidth / 1672, viewportHeight / 941)
```

The stage is translated so the spare space is an even letterbox or pillarbox. Nothing inside the stage uses the viewport width to reflow. Building pads are `anchorX` / `anchorY` on this canvas, drawn with `translate(-50%, -100%)` so the image’s bottom center sits on the pad.

Safe-area insets (`viewport-fit=cover`) shrink the box the stage is fitted into. Portrait viewports cover the stage with a rotate-device overlay.

Hit targets in the stage are at least 116 design pixels, which stays at least 44 CSS pixels on a 640×360 landscape viewport.

Map placement numbers are **PROPOSED** (from `WORLD_MAP_PLACEMENT_PROPOSED.json`) and live in `web/assets-manifest.json`. See `docs/ui/ASSET_DROP_IN.md`.
