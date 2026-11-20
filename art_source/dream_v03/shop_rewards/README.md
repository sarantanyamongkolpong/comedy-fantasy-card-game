# Comedy Fantasy Card Game — Phase 3: Shopping & Rewards Art

**Status:** `GENERATED_REVIEW` — owner visual approval pending. Artwork only; no pricing, drop rates, game rules, or assets locked.

## Source assets

| Asset ID | File | Size | Background | Purpose |
| --- | --- | --- | --- | --- |
| `scene.shopping_mall.interior` | `shopping_mall_interior.png` | 1672 × 941 | Opaque | Mobile landscape shopping mall interior; clear central foreground for overlays |
| `npc.shopkeeper.merchant` | `shopkeeper_merchant.png` | 1214 × 1295 | Transparent | Full-body comic fantasy merchant NPC |
| `prop.shopping_counter` | `shopping_counter.png` | 1254 × 1254 | Transparent | Independent counter prop; render in front of merchant as needed |
| `scene.rewards.room` | `reward_room_background.png` | 1672 × 941 | Opaque | Mystical victory/rewards chamber; open central floor |
| `prop.rewards.treasure_open` | `reward_treasure_open.png` | 1312 × 1199 | Transparent | Independent open treasure chest cutout |

## Integration notes

- Scene backgrounds are fixed-aspect **1672:941** and should be scaled uniformly with letterboxing, matching world map requirements; never stretch horizontally or vertically on mobile.
- Place the shopkeeper and counter as separate image layers: merchant can stand **behind** the counter; do not flatten them into the background.
- Place the chest independently on the reward-room floor. It can animate by position, opacity, and scale even before separate animation frames exist.
- Keep all UI text, inventory quantities, prices, probabilities and interaction hitboxes in application code, not baked into these images.
- Source PNGs are high-resolution masters; export optimized WebP/AVIF derivatives for mobile delivery without modifying masters.
- The originals are **static artwork**, not character sprite sheets or frame-by-frame animations.

## QA record

- All five PNG files opened successfully.
- Both backgrounds are fully opaque RGB 1672 × 941.
- Merchant, counter and open chest have RGBA alpha cutouts; shop counter was regenerated to remove unintended ambient backdrop.
- No code, Git branch or PR changed in this stream.

