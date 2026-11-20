# Dream Art Production v0.2 (Phase 2) — raw drop

- Source: Google Drive folder "Art Production v0.2" (owner account), file `Card_Battle_Art_Production_v02_20261120.zip` (Drive id `109rfRf_MmgfR5yI4p1UnU4uOvxpw6uYZ`, 90,198,104 bytes, sha256 `055edac484c8c3bfec0e1aa6630238539a4e4f7012ce3565dfb73f4e7e33c81d`).
- Ingested by Mira on 20 Nov 2026 (ICT). Files, filenames and `ASSET_MANIFEST.json` are byte-identical to the ZIP (see `qa/SHA256SUMS.txt`).
- Status: **GENERATED_REVIEW**, `integration_status: NOT_INTEGRATED`. Not production-ready. Owner visual approval required.
- This PR is **additive only**: no `web/`, `src/` or `content/` changes, no manifest wiring. Wiring happens in a separate PR after review (see `SLOT_MAPPING_PROPOSAL.md`).

## Contents (42 PNG, 33 RGBA + 9 opaque RGB)

| Folder | Count | Files |
|---|---|---|
| `housing/` | 10 | 6 house tiers (Cabin, Bungalow, Cottage, Loft, Villa, Penthouse) 1254² RGBA, `interior_cabin` 1672×941 RGB, 3 furniture props 1254² RGBA, + `HOUSING_ART_MANIFEST.json` |
| `items_cards/` | 14 | 5 item icons + 3 furniture icons 1254² RGBA, 6 unframed Action illustrations 1024×1536 RGB, + `README_ITEMS_ACTIONS.md` |
| `combat/` | 9 | 4 enemy cutouts RGBA (various sizes), `tower_battle_arena` 1672×941 RGB, 4 static VFX 1254² RGBA |
| `gacha_companions/` | 9 | 3 companion cutouts RGBA, `gacha_hall_background` 1672×941 RGB, 3 gacha machines 1254² RGBA, 2 reveal VFX RGBA |

Docs from Dream kept as-is: `MIRA_HANDOFF.md`, `README_HANDOFF.md`, `MIRA_MERGE_PROMPT_NEXT_ROUND.md` (a future-round brief; it is reference only, not an instruction executed by this PR).

Total size ~88 MB; largest single file 3.56 MB (`items_cards/action_regen.png`). No file is over 50 MB.

## QA (Mira, automated + contact-sheet visual pass)

- 42/42 files listed in `ASSET_MANIFEST.json` exist; 0 extra or missing PNGs; all decode cleanly.
- Dimensions match the handoff docs (houses/furniture/icons/most VFX 1254², scenes 1672×941, action art 1024×1536, cutouts sized to subject).
- Transparency: 33/33 flagged `transparent: true` are RGBA; 9/9 flagged false are RGB. No mismatch.
- Minor findings (non-blocking):
  - **P2** `gacha_companions/gacha_reveal_ex.png`: full-frame semi-transparent haze (only ~10% of pixels < alpha 8; frame edges carry alpha up to 110). It will show a faint square edge if composited over a scene without a mask/fade. Use a radial mask or `mix-blend-mode: screen`, or ask Dream for an edge-faded version.
  - **P3** stray near-zero corner alpha (1–2/255) on `house_cabin`, `house_villa`, `vfx_shield`, `companion_baby_dragon`: invisible, harmless.
  - **P3** subject touches the top edge: `enemy_clipboard_goblin` (clipboard top, alpha up to 64), `gacha_machine_action` (1 px), `gacha_reveal_epic` (glow). Fine for `contain`, but no headroom for alpha-trim padding.
  - **P2 (integration)** Action illustrations are 2:3 portrait; the current card illustration window (`cardLayout.anchors.illustration` 164×128) is landscape. They need a focal crop or a layout decision before wiring.
  - Originals are heavy (1–3.5 MB each). Ship optimized WebP derivatives only; keep these PNGs as source.
- Contact sheet: `qa/CONTACT_SHEET.jpg`.

## Rules kept

- Mira's `bg_battle_arena_v01` / `bg_prep_battle_v01` stay the default Battle/Prep backgrounds. Dream's `tower_battle_arena.png` is an **ALTERNATE** only.
- No existing Character or Asset ID is renamed or removed. No gameplay values come from this art.
- Not merged and not wired. PR #9 is untouched. hunter-life is untouched.
