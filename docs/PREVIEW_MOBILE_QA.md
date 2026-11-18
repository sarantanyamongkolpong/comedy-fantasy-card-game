# Preview mobile QA

Layout check of the artwork preview (`preview/index.html` and the offline `preview/card_game_art_preview_standalone.html`). Both files are generated from `tools/preview_template.html` by `python3 tools/build_preview.py`.

Status of this pass: the preview is comfortable to inspect at the viewports below. The art pipeline is still **PROTOTYPE**. Nothing here is PRODUCTION_READY. Owner approval is required before merge.

## Command

```bash
python3 -m pip install playwright
python3 tools/preview_qa/audit_preview.py
```

The script launches system Chrome, serves the repo on `127.0.0.1` (so sprite readback is not tainted the way `file://` is), and writes `docs/qa/preview_mobile/results.json` plus screenshots under `docs/qa/preview_mobile/after/`. Exit code 1 if any viewport fails. `--phase before` records a baseline and does not fail the process.

## Pass criteria

| Check | Rule |
|---|---|
| Horizontal overflow | `documentElement.scrollWidth <= clientWidth + 1` |
| Character names | Every visible name (tab, on-card English, on-card Thai when shown, caption) is at least 12px. The on-card name does not overflow its plate. The Thai name is visible in the caption. |
| Sprite | `#cv` is square, not clipped by an overflow ancestor, `image-rendering: pixelated`, and no opaque pixel sits in the stage's rounded-corner crop. |
| Card frame | Displayed card and frame images are 750:1050 (tolerance 0.02). |
| Card art | Displayed art window is 3:4 (tolerance 0.02). |
| Touch targets | On phone and tablet viewports, each button, select, and checkbox label is at least 44×44 CSS px. Desktop (1440×900) keeps the mouse layout. |
| Images | 0 broken `<img>` elements. |
| Console | 0 errors. |
| Equipment swap | Golden Pot changes the still composite and the pressed button; Silver Pot changes it back. A slot `<select>` changes pixels. Meteor's neutral-staff button changes pixels. |

## Issue list (before fixes)

Measured on the unmodified preview. Shots: `docs/qa/preview_mobile/before/`. Numbers: `docs/qa/preview_mobile/before_results.json`.

| ID | Severity | Where | What was wrong | What changed |
|---|---|---|---|---|
| 1 | High | 768×1024 | Page was 841px wide. Zoom 3 drew a 384px canvas, the control column collapsed to 0px, and the swap buttons painted past the right edge. | When the stage is narrower than `zoom × 128 + 200`, controls stack under the sprite. The canvas is drawn at the largest integer zoom that fits. |
| 2 | High | Phones, tablet, landscape | Tabs, swap buttons, animation buttons, selects, and checkboxes were 28–34px tall. The landscape rules made them shorter. | Below 1024px wide, those controls are at least 44×44. Checkbox hit target is the label. |
| 3 | High | Phone landscape | On-card English name was 8.9–10.2px. Thai line was 6.8–7.8px. | English name floors at 12px and stays inside the plate. |
| 4 | Medium | Phone portrait | Card was capped at 280px, so the English name was 11.8px and the Thai line 9.0px. The two lines also overflowed the name plate. | The card uses the column width. A plate that cannot hold two 12px lines keeps the English name and leaves Thai in the caption at 15px. |
| 5 | Medium | 1440×900 and 768×1024 | The two-line name was taller than the plate. Thai was 11.5px. | At ≥1100px the card column is 440px, so both lines fit at ≥12px. On the tablet the plate keeps one line; Thai stays in the caption. |
| 6 | Low | All viewports | `image-rendering` computed as `crisp-edges` because that declaration came last. | `pixelated` is the winning value. Sprites stay on an integer zoom. |
| 7 | Low | First load | Chrome requested `/favicon.ico` and logged a 404. | Inline SVG icon, so the console stays empty. |

Sprite cropping, broken images, and the 750:1050 / 3:4 display ratios were already passing before these fixes. The Golden Pot swap itself worked; the first harness could not read pixels on `file://` because the canvas was tainted. The standalone file (inlined images) already showed a pixel change.

## Results

`python3 tools/preview_qa/audit_preview.py` after the fixes. Full detail: `docs/qa/preview_mobile/results.json`.

| Viewport | Page | Overflow | On-card name | Sprite | Touch < 44px | Images | Console | Result |
|---|---|---|---|---|---|---|---|---|
| 360×800 | index | 0 | 15.1px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 390×844 | index | 0 | 16.5px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 412×915 | index | 0 | 17.6px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 768×1024 | index | 0 | 17.2px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 1440×900 | index | 0 | 13.8px + Thai 12px | 384² pixelated | n/a (desktop) | 15 ok | 0 | PASS |
| 800×360 | index | 0 | 12px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 844×390 | index | 0 | 12px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 915×412 | index | 0 | 12px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 390×844 | standalone | 0 | 16.5px | 256² pixelated | 0 / 24 | 15 ok | 0 | PASS |
| 1440×900 | standalone | 0 | 13.8px + Thai 12px | 384² pixelated | n/a | 15 ok | 0 | PASS |

Card display ratio is 750/1050 and the art window is 3/4 on every row (frame natural size 750×1050). Golden Pot, the slot select, and Meteor's neutral staff each changed the still composite.

## Known issues

- A closed equipment `<select>` ellipsizes a long asset id so the row cannot widen the page. The open list and the equipment table still show the full id.
- Below a 390px card, the name plate holds the English name only. The Thai name is the 15px caption under the card (`Sir Potlid / เซอร์ฝาหม้อ`). Two 12px lines do not fit the 50/1050 plate on a card that also fits a 360px-wide phone.
- Zoom steps that would paint the sprite larger than the stage are disabled, so the scale stays an integer.
- Card-art webp sources are 512×683, one pixel off a perfect 3:4. The preview window is displayed at 3:4 with `object-fit: cover`. Asset files were not edited.
- Phone portrait no longer pins the header, because a sticky bar of 44px controls covered the sprite while scrolling. Landscape already scrolled the header away.

## Screenshots

Before: `docs/qa/preview_mobile/before/<viewport>.png` and `*_full.png`.

After: `docs/qa/preview_mobile/after/<viewport>.png`, `*_sprite.png`, and `*_full.png`.
