#!/usr/bin/env python3
"""Programmatic, editable card-frame builder (Pillow). Re-run to regenerate.
Outputs (relative to assets/card-art/frames/):
  shared/FRAME_BASE_001.png            neutral frame template (transparent art window)
  factions/FRAME_<FAC>_001.png         per-faction colour skins
  factions/EMBLEM_<FAC>_001.png        256x256 original faction emblems (transparent)
  frame_layout.json                    pixel rectangles
Edit LAYOUT / SKINS below to change everything. No text is baked into frames.
"""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 750, 1050
SS = 4  # supersampling for smooth edges

LAYOUT = {
    "art_window":     [30, 30, 690, 920],   # x, y, w, h  (3:4, matches card art 864x1152)
    "faction_emblem": [42, 42, 96, 96],
    "rarity":         [560, 48, 148, 40],
    "name":           [120, 896, 510, 50],
    "stat_pow":       [45, 960, 200, 70],
    "stat_def":       [275, 960, 200, 70],
    "stat_spd":       [505, 960, 200, 70],
}

SKINS = {
    "BASE":      dict(edge=(70, 74, 84), metal=(178, 184, 196), trim=(220, 224, 232), plate=(40, 44, 54), accent=(150, 156, 170)),
    "AEGIS":     dict(edge=(18, 32, 92), metal=(40, 70, 170), trim=(232, 186, 70), plate=(16, 26, 70), accent=(255, 214, 110)),
    "PHANTOM":   dict(edge=(10, 8, 16), metal=(36, 28, 50), trim=(150, 70, 220), plate=(14, 10, 22), accent=(210, 120, 255)),
    "CELESTIAL": dict(edge=(40, 16, 80), metal=(96, 48, 170), trim=(236, 190, 80), plate=(30, 14, 64), accent=(140, 200, 255)),
    "SANCTUARY": dict(edge=(150, 140, 110), metal=(244, 240, 228), trim=(214, 172, 70), plate=(30, 96, 78), accent=(60, 170, 130)),
}

def S(v):
    return [int(round(x * SS)) for x in v]

def rect(box):
    x, y, w, h = box
    return [x, y, x + w, y + h]

def build_frame(skin):
    c = SKINS[skin]
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # outer body
    d.rounded_rectangle(S([0, 0, W - 1, H - 1]), radius=34 * SS, fill=c["edge"] + (255,))
    d.rounded_rectangle(S([8, 8, W - 9, H - 9]), radius=28 * SS, fill=c["metal"] + (255,))
    d.rounded_rectangle(S([16, 16, W - 17, H - 17]), radius=22 * SS, outline=c["trim"] + (255,), width=4 * SS)
    # bottom stat band background
    d.rounded_rectangle(S([22, 950, W - 23, H - 23]), radius=16 * SS, fill=c["plate"] + (255,))
    # art window cutout (transparent) + trim ring
    ax, ay, aw, ah = LAYOUT["art_window"]
    d.rounded_rectangle(S([ax - 4, ay - 4, ax + aw + 4, ay + ah + 4]), radius=18 * SS, fill=c["trim"] + (255,))
    d.rounded_rectangle(S([ax, ay, ax + aw, ay + ah]), radius=14 * SS, fill=(0, 0, 0, 0))
    # corner ornaments (diamonds)
    for cx, cy in [(30, 30), (W - 30, 30), (30, 950), (W - 30, 950)]:
        r = 14
        d.polygon(S([cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy]), fill=c["trim"] + (255,), outline=c["edge"] + (255,))
        d.polygon(S([cx, cy - 6, cx + 6, cy, cx, cy + 6, cx - 6, cy]), fill=c["accent"] + (255,))
    # faction emblem socket (empty, semi-transparent disc)
    ex, ey, ew, eh = LAYOUT["faction_emblem"]
    d.ellipse(S([ex - 6, ey - 6, ex + ew + 6, ey + eh + 6]), fill=c["trim"] + (255,))
    d.ellipse(S([ex - 1, ey - 1, ex + ew + 1, ey + eh + 1]), fill=c["edge"] + (255,))
    d.ellipse(S([ex + 3, ey + 3, ex + ew - 3, ey + eh - 3]), fill=c["plate"] + (200,))
    # rarity placeholder: plate with 5 empty gem sockets (no rarity assigned)
    rx, ry, rw, rh = LAYOUT["rarity"]
    d.rounded_rectangle(S([rx, ry, rx + rw, ry + rh]), radius=rh // 2 * SS, fill=c["plate"] + (210,), outline=c["trim"] + (255,), width=3 * SS)
    for i in range(5):
        gx = rx + 18 + i * 28; gy = ry + rh / 2; r = 8
        d.polygon(S([gx, gy - r, gx + r, gy, gx, gy + r, gx - r, gy]), outline=c["trim"] + (255,), width=2 * SS)
    # name plate (empty banner overlapping art bottom)
    nx, ny, nw, nh = LAYOUT["name"]
    d.polygon(S([nx - 24, ny + nh / 2, nx, ny, nx + nw, ny, nx + nw + 24, ny + nh / 2, nx + nw, ny + nh, nx, ny + nh]),
              fill=c["trim"] + (255,))
    d.polygon(S([nx - 14, ny + nh / 2, nx + 6, ny + 6, nx + nw - 6, ny + 6, nx + nw + 14, ny + nh / 2, nx + nw - 6, ny + nh - 6, nx + 6, ny + nh - 6]),
              fill=c["plate"] + (235,))
    # stat boxes (empty)
    for k in ("stat_pow", "stat_def", "stat_spd"):
        sx, sy, sw, sh = LAYOUT[k]
        d.rounded_rectangle(S([sx, sy, sx + sw, sy + sh]), radius=12 * SS, fill=c["plate"] + (255,), outline=c["trim"] + (255,), width=3 * SS)
        d.rounded_rectangle(S([sx + 8, sy + 8, sx + sw - 8, sy + sh - 8]), radius=8 * SS, outline=c["accent"] + (120,), width=1 * SS)
    return img.resize((W, H), Image.LANCZOS)

def emblem(fac):
    c = SKINS[fac]; N = 256 * SS
    img = Image.new("RGBA", (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    s = lambda *v: [int(x * SS) for x in v]
    gold, acc, dark = c["trim"] + (255,), c["accent"] + (255,), c["edge"] + (255,)
    if fac == "AEGIS":  # round pot-lid shield with knob + laurel bars
        d.ellipse(s(28, 28, 228, 228), fill=gold); d.ellipse(s(44, 44, 212, 212), fill=c["metal"] + (255,))
        d.ellipse(s(70, 70, 186, 186), outline=gold, width=6 * SS)
        d.rounded_rectangle(s(88, 118, 168, 138), radius=10 * SS, fill=(210, 214, 224, 255), outline=dark, width=3 * SS)
        d.ellipse(s(112, 104, 144, 136), fill=(230, 232, 240, 255), outline=dark, width=3 * SS)
    elif fac == "PHANTOM":  # crossed kunai under a crescent moon
        d.ellipse(s(56, 14, 200, 158), fill=acc); d.ellipse(s(88, 2, 226, 140), fill=(0, 0, 0, 0))
        for ang in (40, -40):
            k = Image.new("RGBA", (N, N), (0, 0, 0, 0)); kd = ImageDraw.Draw(k)
            kd.polygon(s(128, 22, 146, 120, 128, 150, 110, 120), fill=(226, 218, 244, 255), outline=dark)  # blade
            kd.line(s(128, 34, 128, 140), fill=(170, 150, 210, 255), width=3 * SS)
            kd.rounded_rectangle(s(98, 148, 158, 162), radius=5 * SS, fill=gold)                     # guard
            kd.rounded_rectangle(s(120, 162, 136, 214), radius=4 * SS, fill=(40, 30, 56, 255), outline=gold, width=2 * SS)  # grip
            kd.ellipse(s(114, 210, 142, 238), outline=gold, width=5 * SS)                            # ring pommel
            img.alpha_composite(k.rotate(ang, center=(N / 2, N / 2 + 20 * SS), resample=Image.BICUBIC))
        d = ImageDraw.Draw(img)
    elif fac == "CELESTIAL":  # ringed planet with four-point star
        d.ellipse(s(78, 78, 178, 178), fill=c["metal"] + (255,), outline=gold, width=5 * SS)
        ring = Image.new("RGBA", (N, N), (0, 0, 0, 0)); rd = ImageDraw.Draw(ring)
        rd.ellipse(s(24, 104, 232, 152), outline=gold, width=9 * SS)
        rd.rectangle(s(78, 100, 178, 128), fill=(0, 0, 0, 0))  # hide the back half of the ring
        ring = ring.rotate(-18, center=(N / 2, N / 2)); img.alpha_composite(ring); d = ImageDraw.Draw(img)
        cx, cy = 200, 50
        d.polygon(s(cx, cy - 34, cx + 8, cy - 8, cx + 34, cy, cx + 8, cy + 8, cx, cy + 34, cx - 8, cy + 8, cx - 34, cy, cx - 8, cy - 8), fill=acc)
    elif fac == "SANCTUARY":  # jade cross on a bandage-shaped plaque
        pl = Image.new("RGBA", (N, N), (0, 0, 0, 0)); pd = ImageDraw.Draw(pl)
        pd.rounded_rectangle(s(30, 92, 226, 164), radius=36 * SS, fill=(242, 196, 160, 255), outline=dark, width=3 * SS)
        for i in range(4):
            for j in (110, 146):
                pd.ellipse(s(48 + i * 10, j - 3, 54 + i * 10, j + 3), fill=(205, 150, 120, 255))
                pd.ellipse(s(172 + i * 10, j - 3, 178 + i * 10, j + 3), fill=(205, 150, 120, 255))
        pl = pl.rotate(30, center=(N / 2, N / 2)); img.alpha_composite(pl); d = ImageDraw.Draw(img)
        d.ellipse(s(78, 78, 178, 178), fill=gold)
        d.rectangle(s(116, 90, 140, 166), fill=c["plate"] + (255,)); d.rectangle(s(90, 116, 166, 140), fill=c["plate"] + (255,))
    return img.resize((256, 256), Image.LANCZOS)

def main():
    os.makedirs(f"{ROOT}/shared", exist_ok=True); os.makedirs(f"{ROOT}/factions", exist_ok=True)
    build_frame("BASE").save(f"{ROOT}/shared/FRAME_BASE_001.png", optimize=True)
    for f in ("AEGIS", "PHANTOM", "CELESTIAL", "SANCTUARY"):
        build_frame(f).save(f"{ROOT}/factions/FRAME_{f}_001.png", optimize=True)
        emblem(f).save(f"{ROOT}/factions/EMBLEM_{f}_001.png", optimize=True)
    out = {"canvas": {"w": W, "h": H}, "units": "px, [x, y, w, h], origin top-left",
           "rects": {k: dict(zip("xywh", v)) for k, v in LAYOUT.items()},
           "art_source_size": {"w": 864, "h": 1152, "fit": "scale to art_window (exact 3:4), lanczos"},
           "draw_order": ["card_art (under)", "frame overlay", "emblem in faction_emblem", "text: name / stat values / rarity gems (runtime)"],
           "notes": "Frames carry no text, stats or rarity. Name plate and stat band overlap the bottom of art_window; keep key art features out of card y>890 (bottom ~6% of the art)."}
    json.dump(out, open(f"{ROOT}/frame_layout.json", "w"), indent=2)

if __name__ == "__main__":
    main()
