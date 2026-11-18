# Systems repository audit

Recorded before any systems code was added on `feat/card-systems-cursor`.

| Item | Value |
|---|---|
| Repository | `sarantanyamongkolpong/comedy-fantasy-card-game` (private) |
| Audit date | 2026-11-18 |
| `main` commit | `7d820535687a2f6c3606ab38ba89e365130f0e88` — "Initial commit" |
| Art branch | `feat/card-art-prototype-mira` |
| Art commit | `d65c89dc87a9554d5611a108146b509c7aa7fcf0` — "feat(art): First 4 avatars character & card art prototype (Mira)" |
| Art pull request | [#1](https://github.com/sarantanyamongkolpong/comedy-fantasy-card-game/pull/1), open, not merged, base `main` |
| Other project | `sarantanyamongkolpong/hunter-life` is a different repository and was not read or modified |

This systems branch is cut from `main`. It does not merge the art branch and does not add or edit anything under `assets/`.

## What `main` contains

`main` has a single file.

`README.md`:

```markdown
# comedy-fantasy-card-game

Comedy Fantasy Card Game (separate project from Hunter Life)
```

There is no `src/`, `tests/`, `docs/`, `package.json`, schema, battle code, or asset manifest on `main`.

## What PR #1 contains

PR #1 is the art and asset-pipeline prototype. Its own description says `src/` and `tests/` are reserved empty placeholders for this systems branch, and that stats, rarity, and AP costs are TBD.

Tree summary at `d65c89d` (232 tracked paths):

| Top folder | Paths | Role |
|---|---|---|
| `assets/` | 104 | Card frames, character sprites, equipment, rigs, animations, VFX, owner references |
| `docs/` | 99 | Style bible, asset manifest, registry, QA stills |
| `tools/` | 18 | Pixel pipeline and preview builders (Python) |
| `src/` | 5 | Placeholder only: `README.md` plus `.gitkeep` in `battle/`, `cards/`, `avatars/`, `assets/` |
| `tests/` | 2 | Placeholder only: `README.md` and `.gitkeep` |
| `preview/` | 2 | Local HTML preview |
| root | `README.md`, `.gitignore` | README extended; gitignore ignores `package/`, `__pycache__/`, `*.pyc`, `.DS_Store` |

File types: 173 PNG, 5 WebP, 1 JPG, 18 Python, 15 JSON, 10 Markdown, 5 `.gitkeep`, 3 HTML, 1 shell script.

`src/README.md` on that branch: "Reserved for the systems branch (`feat/card-systems-cursor`). This art prototype does not add battle or gameplay code."

`tests/README.md` on that branch: "Reserved for automated systems tests on `feat/card-systems-cursor`."

Those placeholder files are not on `main`, so they are not in this branch's history. Real systems files replace that reservation. A later merge with PR #1 can keep both the art tree and these source files. Both branches append to `README.md`, so that merge will need a small README resolution.

PR #1 status counts, taken from its `docs/ASSET_MANIFEST.json` (`asset_count` 87):

| Art status | Count |
|---|---|
| CONCEPT | 11 |
| PROTOTYPE | 76 |
| QA_PASSED | 0 |
| PRODUCTION_READY | 0 |
| INTEGRATED | 0 |

The manifest's own line on gameplay numbers: "POW/DEF/SPD values TBD; rarity TBD; card AP costs TBD".

## Data files read to design the loader

Read-only, from `origin/feat/card-art-prototype-mira` at `d65c89d`. No binary was copied into this branch.

| Path | What it contributes |
|---|---|
| `docs/ASSET_MANIFEST.json` | Index of 87 assets. Each entry has `asset_id`, `path`, `type`, `owner`, `status`, plus optional `note`, `sha256`, `bytes`, and type-specific fields (`pivot`, `anchors`, `slot`, `variant_of`, `canvas_px`, …). |
| `assets/card-art/frames/frame_layout.json` | Card canvas 750×1050 and named rects (`art_window`, `faction_emblem`, `rarity`, `name`, `stat_pow`, `stat_def`, `stat_spd`). Frames carry no baked stats. |
| `assets/characters/_rigs/humanoid_heavy.json` | Rig `humanoid_heavy` for `AVT_AEG_001`: named anchors, layer list, native items, per-item `fit` offsets. Canvas `[128, 128]`, `baseline_y` 122. |
| `assets/characters/_rigs/humanoid_standard.json` | Same shape for `AVT_PHA_001`, `AVT_CEL_001`, `AVT_SAN_001`. |
| `assets/characters/<ID>/equipment/items.json` | Native items: `asset_id`, `file`, `slot`, `pivot`, `pivot_kind`, `size`, `native_character`, `native_origin`. Gold pot helmet sets `variant_of` to the silver helmet. |
| `assets/equipment/shared_items.json` | Shared items keyed by id. Fields: `slot`, `pivot`, `pivot_kind`, `size`, `compatible_rigs`, `tested_on`, `note`. The dagger slot is the string `main_hand\|off_hand`. The object body does not repeat `asset_id` (the key is the id). |
| `assets/vfx/vfx.json` | VFX strips: `frame`, `frames`, `pivot`, `use`. |
| `assets/animations/ANIM_SHARED_001.json` | Procedural timing for idle / attack / defend / hit / ko. References VFX ids and anchor names. |
| `assets/reference/asset_manifest.json` | Earlier starter manifest. Character ids there are slugs (`aegis_sir_potlid`), not `AVT_*`. The systems catalog uses the `AVT_*` ids from the current manifest. |
| `docs/CHARACTER_ASSET_REGISTRY.md` | Equip convention, in prose: draw an item at `anchor[slot] − item.pivot`, then add the rig `fit` offset. Headgear uses the `head` anchor. Accessories use `feet`. |

Manifest `type` values seen: `sprite_layer`, `equipment_item`, `card_art`, `sprite_composite_flattened`, `vfx_strip`, `card_frame`, `owner_reference_flat`, `sprite_sheet_idle`, `card_emblem`, `rig_definition`, `metadata`, `preview`, `animation_timing`, `card_frame_layout`.

Manifest `status_legend`: `CONCEPT`, `PROTOTYPE`, `QA_PASSED`, `PRODUCTION_READY`, `INTEGRATED`.

CONCEPT asset ids (all 11):

- `CARD_AVT_AEG_001_card_v1_variant_goldpot`
- `CARD_AVT_AEG_001_card_v1_variant_goldpot_web`
- `EMBLEM_AEGIS_001`, `EMBLEM_CELESTIAL_001`, `EMBLEM_PHANTOM_001`, `EMBLEM_SANCTUARY_001`
- `REF_AEGIS_SIR_POTLID_BASE`, `REF_AEGIS_SIR_POTLID_GOLD_HELMET`, `REF_CELESTIAL_MADAME_METEOR_BASE`, `REF_PHANTOM_NOX_SQUEAK_BASE`, `REF_SANCTUARY_SISTER_PLASTER_BASE`

## Identities confirmed in the art data

Factions and roles, spelled as in the registry and the manifest character lines:

| Avatar id | English | Thai | Faction | Role | Rig |
|---|---|---|---|---|---|
| `AVT_AEG_001` | Sir Potlid | เซอร์ฝาหม้อ | Aegis Dominion | Tank | `humanoid_heavy` |
| `AVT_PHA_001` | Nox Squeak | น็อกซ์ รองเท้าดัง | Phantom Blades | DPS | `humanoid_standard` |
| `AVT_CEL_001` | Madame Meteor | มาดามดาวตก | Celestial Nexus | Magic | `humanoid_standard` |
| `AVT_SAN_001` | Sister Plaster | ซิสเตอร์พลาสเตอร์ | Sanctuary Order | Support | `humanoid_standard` |

The manifest stores each character as one display string, not as structured faction or stat fields. No POW, DEF, SPD, rarity, HP, or AP cost appears in those JSON files.

## Gaps that affect systems

- `main` has no game code, so this branch creates `src/`, `tests/`, and `docs/` itself.
- Pixel coordinates live in data files on the art branch. This branch does not vendor the PNGs. Tests use a small JSON snapshot under `tests/fixtures/`, copied from `d65c89d` and labelled as a snapshot.
- The slot-to-anchor name map (headgear → `head`, accessory → `feet`) is prose in `CHARACTER_ASSET_REGISTRY.md`. It is not a field on `items.json`. See `docs/INTEGRATION_NOTES_FOR_MIRA.md`.
- Shared item records omit an inner `asset_id`. The manifest entries for those items do have `asset_id`.
- Nothing on either branch defines deck size, draw or discard, damage, HP, turn action caps, skill effects, gacha rates, or upgrade math.

## Boundary for the work that follows this audit

Specified and in scope: data schema, a 4v4 turn prototype (highest team SPD starts, alternating turns, 5 AP refreshed on that side's turn, victory/defeat detection), hand size 5, action types ATK / DEF / Skill, AP affordability, and a manifest loader that reads anchors and pivots from data.

Out of scope: UI, an auto battler, image decoding, and any default for the unresolved rules listed in `docs/OPEN_DESIGN_DECISIONS.md`.
