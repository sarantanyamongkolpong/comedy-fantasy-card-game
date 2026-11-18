#!/usr/bin/env python3
"""Composite proofs: card art + faction frame + emblem + placeholder labels (TBD)."""
import json, os
from PIL import Image, ImageDraw, ImageFont
FR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = os.path.join(os.path.dirname(os.path.dirname(FR)), "characters")
L = json.load(open(f"{FR}/frame_layout.json"))["rects"]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
CARDS = [("AVT_AEG_001", "Sir Potlid", "AEGIS", "AVT_AEG_001_card_v1.png"),
         ("AVT_AEG_001", "Sir Potlid", "AEGIS", "AVT_AEG_001_card_v1_variant_goldpot.png"),
         ("AVT_PHA_001", "Nox Squeak", "PHANTOM", "AVT_PHA_001_card_v1.png"),
         ("AVT_CEL_001", "Madame Meteor", "CELESTIAL", "AVT_CEL_001_card_v1.png"),
         ("AVT_SAN_001", "Sister Plaster", "SANCTUARY", "AVT_SAN_001_card_v1.png")]
def R(k): r = L[k]; return r["x"], r["y"], r["w"], r["h"]
def center(d, box, txt, size, fill):
    f = ImageFont.truetype(FONT, size); x, y, w, h = box
    b = d.textbbox((0, 0), txt, font=f); d.text((x + (w - (b[2]-b[0]))/2 - b[0], y + (h - (b[3]-b[1]))/2 - b[1]), txt, font=f, fill=fill)
outs = []
for cid, name, fac, fn in CARDS:
    card = Image.new("RGBA", (750, 1050), (0, 0, 0, 0))
    ax, ay, aw, ah = R("art_window")
    art = Image.open(f"{CH}/{cid}/card/{fn}").convert("RGBA").resize((aw, ah), Image.LANCZOS)
    card.paste(art, (ax, ay))
    card.alpha_composite(Image.open(f"{FR}/factions/FRAME_{fac}_001.png"))
    ex, ey, ew, eh = R("faction_emblem")
    card.alpha_composite(Image.open(f"{FR}/factions/EMBLEM_{fac}_001.png").resize((ew - 8, eh - 8), Image.LANCZOS), (ex + 4, ey + 4))
    d = ImageDraw.Draw(card)
    center(d, R("name"), name, 30, (255, 246, 220))
    for k, lab in (("stat_pow", "POW"), ("stat_def", "DEF"), ("stat_spd", "SPD")):
        center(d, R(k), f"{lab}  TBD", 26, (255, 240, 200))
    rx, ry, rw, rh = R("rarity")
    out = f"{FR}/_proofs/PROOF_{fn.replace('.png','')}.png"
    card.save(out, optimize=True); outs.append(out)
# contact sheet
sheet = Image.new("RGBA", (5 * 390 + 20, 560), (24, 24, 30, 255))
for i, o in enumerate(outs):
    sheet.alpha_composite(Image.open(o).resize((375, 525), Image.LANCZOS), (10 + i * 390, 18))
sheet.save(f"{FR}/_proofs/PROOF_contact_sheet.png", optimize=True)
fs = Image.new("RGBA", (5 * 390 + 20, 560), (24, 24, 30, 255))
for i, f in enumerate(["../shared/FRAME_BASE_001.png"] + [f"FRAME_{x}_001.png" for x in ("AEGIS","PHANTOM","CELESTIAL","SANCTUARY")]):
    fs.alpha_composite(Image.open(os.path.normpath(f"{FR}/factions/{f}")).resize((375, 525), Image.LANCZOS), (10 + i * 390, 18))
fs.save(f"{FR}/_proofs/FRAMES_and_EMBLEMS_sheet.png")
em = Image.new("RGBA", (4 * 276, 276), (90, 90, 100, 255))
for i, x in enumerate(("AEGIS","PHANTOM","CELESTIAL","SANCTUARY")):
    em.alpha_composite(Image.open(f"{FR}/factions/EMBLEM_{x}_001.png"), (10 + i * 276, 10))
em.save(f"{FR}/_proofs/EMBLEMS_sheet.png")
print("\n".join(outs))
