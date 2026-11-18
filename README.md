# comedy-fantasy-card-game

Comedy Fantasy Card Game (separate project from Hunter Life)

Art and asset pipeline prototype for the first four avatars (branch `feat/card-art-prototype-mira`).

Open **preview/card_game_art_preview_standalone.html** in any desktop or mobile browser (fully self-contained, works offline), or open `preview/index.html` from inside this folder (loads assets by relative path).

- Style bible: `docs/ART_STYLE_BIBLE.md` · Manifest: `docs/ASSET_MANIFEST.json` · Registry: `docs/CHARACTER_ASSET_REGISTRY.md`
- Pixel/preview self-QA: `docs/PIXEL_PIPELINE_QA.md` · Card art notes: `docs/CARD_ART_NOTES.md` · QA stills: `docs/qa/`
- Card art index: `assets/card-art/README.md` (illustrations stay under `assets/characters/<ID>/card/`; frames live under `assets/card-art/frames/`)
- Owner references: `assets/reference/`
- Rebuild everything pixel-side: `tools/build_all.sh` (Python 3 + Pillow + numpy + opencv). Preview only: `python3 tools/build_preview.py`.

Repository layout:

- `assets/card-art/` — reusable card frames, emblems, layout, and an index of card illustrations
- `assets/characters/` — per-avatar sprite layers, native equipment, card art; shared rigs in `assets/characters/_rigs/`
- `assets/equipment/` — shared equipment (neutral staff, basic sword, dagger, buckler)
- `assets/animations/` — shared animation timing
- `assets/vfx/` — shared VFX strips
- `assets/reference/` — Owner's original flat reference PNGs, contact sheet, and starter notes
- `src/` — reserved for the systems branch; no game or battle code in this prototype
- `tests/` — reserved for systems automated tests
- `docs/` — design docs, asset manifest, QA report; stills in `docs/qa/`
- `preview/` — local and standalone HTML preview
- `tools/` — pixel pipeline and preview builders

Status: PROTOTYPE. Stats, rarity and card costs are TBD. No gameplay / battle engine included.
