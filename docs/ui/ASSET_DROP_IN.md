# Drop-in art for the web UI

The shell never bakes a picture into code. It asks the manifest for a slot, then loads that file. Dream can replace a file and, when the path changes, one manifest entry. Screens do not need a code edit for a new illustration, frame, badge, or building.

Runtime manifest: `web/assets-manifest.json`.

Design canvas: **1672×941** (the world-map master). The stage scales by `min(viewportWidth / 1672, viewportHeight / 941)` and letterboxes the spare space. Building anchors are pixels on that canvas.

## What is registered

| Slot | How code asks | Current files |
|---|---|---|
| `illustration` | subject = avatar id (`AVT_AEG_002`, …) or `generic-action` | Justin stills are generated WebP. `AVT_*_001` stay placeholder SVGs. |
| `battle-sprite` | subject = avatar id | Same Justin WebP as the illustration. Placeholder SVG is `fallback_path`. |
| `frame` | rarity = `N`, `R`, `Epic`, `EX`, `FAC`, or `TBD` | Generated frames for the five rarities. `TBD` stays a placeholder. |
| `card-interior` | subject = `neutral` | Generated parchment behind the frame. |
| `faction-badge` | subject = faction id or `generic` | Placeholder badges. |
| `stat-icon` | subject = `atk`, `def`, `spd` | ATK and DEF are generated icons. SPD is still a placeholder. |
| `type-icon` | subject = `Skill` | Generated skill crystal. |
| `building` | asset id `MAP_BLD_*` plus `hotspot` | Generated buildings. Position is data, status **PROPOSED**. |
| `map-background` | subject = `world` | Generated map, 1672×941, no buildings baked in. |
| `house` | subject = `cabin` … `penthouse` | Placeholder houses. No Dream house set yet. |
| `ui-icon` / `status-icon` | subject = `ap`, `shield`, … | Placeholders. |

Generated entries set `review_status` to `GENERATED_REVIEW` and `placeholder` to `false`. `status` stays `CONCEPT`. The repository status enum does not include `GENERATED_REVIEW` yet (see `docs/ui/CONTRACT_REQUESTS.md`). Nothing here is `PRODUCTION_READY`.

Each generated entry keeps `fallback_path` pointing at the placeholder SVG. If the WebP fails to load, the image element swaps to that file.

## Do not register these

Owner-approved full cards are reference only:

- `docs/design/v05/ref_cards/REF_CARD_*.png` on `core/v05-design-source`
- `art_source/dream_v01/reference_cards/*.png` on `art/dream-v01-drop` @ `0c063ca`

They are full baked paintings. Card UI stacks interior, illustration, one rarity frame, badges, icons, and text from data. It never points a card face at one of those PNGs.

Character ids `AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, and `AVT_SAN_001` are unchanged. The Justins are separate characters: `AVT_AEG_002`, `AVT_PHA_002`, `AVT_CEL_002`, `AVT_SAN_002`.

## Rebuild when Dream swaps the drop

The raw drop is about 52 MB and is **not** committed on this branch.

```bash
git fetch origin art/dream-v01-drop
git checkout origin/art/dream-v01-drop -- art_source/dream_v01
git reset -q HEAD -- art_source
python3 -m pip install --user pillow   # once, if import PIL fails
python3 web/tools/build-assets.py
rm -rf art_source
```

`web/tools/build-assets.py` writes WebP under `web/assets/generated/`, refreshes paths, measures per-frame transparent windows into `frameInsets`, and copies the proposed map anchors. It does not edit files inside `art_source/`.

Sizes written today: avatars 512 px tall, buildings within 512 px, frames and interior 512×768, icons 160 px, map left at 1672×941. Report: `web/assets/generated/BUILD_REPORT.json`.

## Move a building

Edit that building’s `hotspot` in the manifest. Do not change CSS per breakpoint.

- `anchorX`, `anchorY` — bottom-center of the building image, in master pixels
- `targetWidth`, `targetHeight` — drawn size on the master canvas
- `anchorMode`: `bottom-center`
- `transform`: `translate(-50%, -100%)`
- `placementStatus`: `PROPOSED` until the Owner locks the pads

The values came from `WORLD_MAP_PLACEMENT_PROPOSED.json`. The mall anchor stays at (1393, 280). Its target size is 280×280 so the sprite box meets the top edge instead of crossing it. Re-running the art build script overwrites these numbers from Dream’s JSON; put the 280 back if that happens, until the pad itself moves.

Known actions the map already understands: `home`, `gacha`, `battle` (with `mode` `tower` or `arena`), `mall`, `locked`. Any other `action` still draws the building and shows a notice.

## Move text on a card

`frameInsets.byRarity` holds the transparent windows measured from each frame PNG (1024×1536 master). R’s art window starts higher than N’s. The renderer reads the window for the card’s rarity. Do not reuse one rarity’s alpha as another rarity’s hit shape.

`cardLayout` remains the geometry for rarities that have no measured frame (`TBD`).

Text (name, cost, ATK/DEF/SPD, rules) is HTML from game data, not pixels in the frame.

## Swap a file only

1. Put the new file under `web/assets/...`.
2. Change that entry’s `path`.
3. Leave `asset_id`, `slot`, `subject_id`, `rarity`, and `anchor` alone.
4. Set `placeholder` to `false` when the file is real art.
5. Set `review_status` to `GENERATED_REVIEW` until the Owner accepts it. Do not set `status` to `PRODUCTION_READY`.
