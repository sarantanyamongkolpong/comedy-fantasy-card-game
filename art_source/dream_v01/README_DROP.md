# Dream Art Production v0.1 — raw source drop (20 Nov 2026)

Source: Google Drive `Card_Battle_Art_Production_v01_20261120.zip` (file id 1f0FAtNe4P4q4LVYok-sCDnAlC5uGSqGQ), produced by Dream (Game Director). Committed unchanged; Dream's `ASSET_MANIFEST.json`, `README_HANDOFF.md`, `card_ui/README_CARD_UI.md` and `world/WORLD_MAP_PLACEMENT_PROPOSED.json` are kept verbatim.

Status (Dream's own labels, not changed here):
- Reference cards: APPROVED_ART_REFERENCE.
- All new images: GENERATED_REVIEW, NOT_INTEGRATED, not approved as production art.
- Battle avatars are static images, not animated sprite sheets.
- World placement: PROPOSED (fixed 1672×941 master canvas, uniform contain scale with letterbox).
- Card frames: small border-width differences between rarities.

This folder is **source art only** (~50 MB). The web build must not load these files directly; stream C generates size-optimized copies under `web/assets/` and references them by asset ID through `web/assets-manifest.json`. Existing repo asset IDs are unchanged. PR #9 is not involved.
