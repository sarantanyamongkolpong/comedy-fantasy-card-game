#!/bin/bash
# Full pixel pipeline rebuild (does not touch card art / card frames).
set -e
cd "$(dirname "$0")/.."
python3 tools/pixelize.py
python3 tools/build_sprites.py >/dev/null
python3 tools/build_shared.py
python3 tools/export_idle.py >/dev/null
python3 tools/qa_checks.py >/dev/null
python3 tools/compose.py
python3 tools/build_preview.py
python3 tools/build_manifest.py
