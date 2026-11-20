# Reusable UI Chrome Pack (SVG)

Version: 0.3 / Status: `GENERATED_REVIEW`

This directory contains 27 individually replaceable **SVG** assets generated from `generate_ui_assets.mjs`. Vector assets are used intentionally for geometric UI components: they stay crisp in mobile landscape, allow scaling and are more predictable than bitmap-generating exact rectangles or icons.

## Components

- Seven empty button variants: `button_primary`, `button_secondary`, `button_danger`, `button_disabled`, `button_ghost`, `button_small`, `button_icon_square`.
- Two empty tabs: `tab_selected`, `tab_unselected`.
- Two reusable frames: `popup_panel`, `toast_panel`.
- Four precision inventory frames: `inventory_slot_frame`, `inventory_item_detail_panel`, `inventory_category_tab_frame`, `inventory_tooltip_frame`. Prefer these over raster frame concepts if the generated PNG has dirty edge alpha.
- Twelve independent icons: `icon_bag`, `icon_deck`, `icon_home`, `icon_gacha`, `icon_map`, `icon_shop`, `icon_companion`, `icon_settings`, `icon_close`, `icon_back`, `icon_sort`, `icon_filter`.

## Integration requirements

- Keep text, counts, buttons, clicks and hit targets as browser components, **above** these decorative SVG backgrounds. SVG does not contain labels or game logic.
- Set `<button>` focus and accessibility semantics in HTML. Touch hit target should generally be at least 44 CSS pixels; decorative SVG dimensions do not determine the clickable area.
- Use `background-image` or `<img>` for the empty frames, and render live text separately. Maintain aspect ratio with `contain` or nine-slice-compatible alternatives where appropriate.
- Do not duplicate Mira's recently approved Battle/Prep-specific ornate gold HUD, AP gems or End Turn decoration. These are general navigation, inventory, shop and dialogue assets.
- No item price, rarity, AP, damage or stash capacity is encoded in any image.
- Original SVG is editable through its generation script's colors and geometry. Use consistent palette: midnight navy, amethyst, pale gold and cyan accent.

## Quality gate

All 27 SVG files were checked for well-formed XML. In-engine/browser visual, focus, hover, pressed and disabled states still require QA after integration; no claim of that QA is made here.
