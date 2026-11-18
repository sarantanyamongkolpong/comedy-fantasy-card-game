"""4× nearest-neighbour contact sheets. No filtering, no rotation."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from catalog import CANVAS, Catalog
from compositor import Compositor
from evaluate import Row

ZOOM = 4
LABEL_H = 58
BG = (200, 201, 212, 255)
PAGE = (40, 38, 54, 255)
STATUS_COLOR = {
    "PASS": (47, 107, 79, 255),
    "PASS_WITH_ADJUSTMENT": (138, 90, 18, 255),
    "UNSUPPORTED": (92, 83, 72, 255),
    "FAIL": (141, 36, 48, 255),
    "INFO": (50, 60, 90, 255),
}


def _font(size: int) -> ImageFont.ImageFont:
    return ImageFont.load_default(size=size)


def _fit_line(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, width: int) -> str:
    if draw.textlength(text, font=font) <= width:
        return text
    trimmed = text
    while trimmed and draw.textlength(trimmed + "…", font=font) > width:
        trimmed = trimmed[:-1]
    return trimmed + "…"


def contact_sheet(
    cells: list[tuple[Image.Image, list[str], str]],
    path: Path,
    columns: int = 4,
    zoom: int = ZOOM,
) -> None:
    """Nearest-neighbour contact sheet. Every cell in one sheet must share a size."""
    if not cells:
        Image.new("RGBA", (32, 32), PAGE).save(path)
        return
    font = _font(15)
    small = _font(13)
    width, height = cells[0][0].size
    cell_w, cell_h = width * zoom, height * zoom
    rows = (len(cells) + columns - 1) // columns
    sheet = Image.new("RGBA", (cell_w * columns, (cell_h + LABEL_H) * rows), PAGE)
    draw = ImageDraw.Draw(sheet)
    for index, (image, lines, status) in enumerate(cells):
        if image.size != (width, height):
            raise ValueError(f"sheet cell size {image.size} != {(width, height)}")
        col = index % columns
        row = index // columns
        x = col * cell_w
        y = row * (cell_h + LABEL_H)
        frame = Image.new("RGBA", (cell_w, cell_h), BG)
        frame.alpha_composite(image.resize((cell_w, cell_h), Image.Resampling.NEAREST))
        sheet.paste(frame, (x, y))
        chip = STATUS_COLOR.get(status, STATUS_COLOR["INFO"])
        draw.rectangle((x, y + cell_h, x + cell_w, y + cell_h + LABEL_H), fill=chip)
        cursor = y + cell_h + 4
        for line_index, line in enumerate(lines[:3]):
            face = font if line_index == 0 else small
            draw.text((x + 6, cursor), _fit_line(draw, line, face, cell_w - 12), font=face, fill=(255, 255, 255, 255))
            cursor += 18 if line_index == 0 else 16
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)


def _row_cell(compositor: Compositor, row: Row) -> tuple[Image.Image, list[str], str]:
    image = compositor.compose(row.character_id, {row.slot: row.item_id}, draw_vfx=False).image
    offset = f"[{row.offset[0]}, {row.offset[1]}]"
    metrics = row.metrics
    extra = ""
    if metrics is not None and metrics.overflow:
        extra = f"  overflow {metrics.overflow}px"
    elif metrics is not None and metrics.baseline_px:
        extra = f"  baseline {metrics.baseline_px}px"
    return (
        image,
        [
            f"{row.status}  {row.slot}",
            row.item_id,
            f"{row.character_id}  offset {offset}{extra}",
        ],
        row.status,
    )


def write_matrix_sheets(catalog: Catalog, compositor: Compositor, rows: list[Row], out_dir: Path) -> list[Path]:
    written: list[Path] = []
    for character_id in catalog.character_ids:
        cells = [_row_cell(compositor, row) for row in rows if row.character_id == character_id]
        path = out_dir / f"matrix_{character_id}.png"
        contact_sheet(cells, path, columns=4)
        written.append(path)
    return written


def diff_image(before: Image.Image, after: Image.Image) -> Image.Image:
    output = before.copy()
    source_a = before.load()
    source_b = after.load()
    dest = output.load()
    width, height = before.size
    for y in range(height):
        for x in range(width):
            if source_a[x, y] != source_b[x, y]:
                dest[x, y] = (255, 0, 180, 255)
    return output


def padded_overflow(catalog: Catalog, row: Row, pad: int = 16) -> Image.Image:
    """Show pixels that fall outside 128 by drawing on a padded canvas."""
    size = CANVAS + pad * 2
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    character = catalog.characters[row.character_id]
    item = catalog.items[row.item_id]
    canvas = _paste(canvas, character.layer_images["L01"], pad, pad)
    if row.metrics is None:
        return canvas
    origin = row.metrics.origin
    canvas = _paste(canvas, item.image, pad + origin[0], pad + origin[1])
    grip_key = "L05f" if row.slot == "main_hand" else "L06f" if row.slot == "off_hand" else None
    if grip_key and grip_key in character.layer_images:
        canvas = _paste(canvas, character.layer_images[grip_key], pad, pad)
    # Mark the logical 128 window.
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((pad - 1, pad - 1, pad + CANVAS, pad + CANVAS), outline=(255, 60, 90, 255))
    return canvas


def _paste(canvas: Image.Image, source: Image.Image, x: int, y: int) -> Image.Image:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(source, (x, y))
    return Image.alpha_composite(canvas, layer)


def write_overflow_sheet(catalog: Catalog, rows: list[Row], out_dir: Path) -> Path | None:
    overflowing = [row for row in rows if row.metrics is not None and row.metrics.overflow > 0]
    if not overflowing:
        return None
    cells = []
    for row in overflowing:
        cells.append(
            (
                padded_overflow(catalog, row),
                [
                    f"{row.status} overflow {row.metrics.overflow}px",
                    row.item_id,
                    f"{row.character_id} {row.slot} offset {list(row.offset)}",
                ],
                row.status,
            )
        )
    path = out_dir / "overflow_padded.png"
    # 160 px logical (128 window + 16 px margin) at 3× stays on an integer grid.
    contact_sheet(cells, path, columns=4, zoom=3)
    return path
