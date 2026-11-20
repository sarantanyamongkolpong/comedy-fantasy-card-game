# OPERATION FULL PRODUCTION (Owner order t270u, 2026-11-20 19:51 ICT) — Ownership & Contracts
Base branch: prod/wave-base = integration/v05-final @ 7683503 (v0.5 + final/web #27 merged; npm test 411/0/3 on Node 20/22 per web stream).
Parallel, separate: SPORT COMPLEX v0.6 code streams on sport/v06-* (base sport/v06-base) own src/sport/**, content/v06/sport/**, web/sport/**. Production agents must not edit those paths.
Pending in parallel: final/damage-flat-atk (Owner chose flat_atk, MVP_PROVISIONAL) touches src/engine/rule-config.js, model.js, docs/engine/*. Do not edit them.

## Status vocabulary (per asset / feature)
GENERATED_REVIEW -> QA_PASSED -> OWNER_APPROVED -> INTEGRATED. Agents may only set GENERATED_REVIEW or QA_PASSED (QA_PASSED only with test evidence). Never LOCKED / PRODUCTION_READY / OWNER_APPROVED.

## Global rules
- Own branch + Draft PR into prod/wave-base. Never merge, never force-push, never touch main, PR #9, other branches, hunter-life. No deploy.
- Preserve engine, save files (SAVE_VERSION 1/2), card/character/asset IDs, locked requirements (docs/final_v05, content/v05/source). Don't change combat formulas, skills, card stats, odds, pity, costs, economy.
- Audit existing assets/PRs first (web/assets, web/assets-manifest.json, PRs #1,#9,#10,#13,#14,#17,#22,#23, docs/final_v05/SLOT_MAPPING_PROPOSAL.md if present). Never recreate completed work without documenting a defect.
- Every image independently replaceable through a manifest. Do NOT edit web/assets-manifest.json directly: write your own fragment web/manifests/<stream>.json (same entry schema: asset_id, slot, path, anchor, subject_id, rarity, status, source_path, bytes). Integration merges fragments later.
- Mobile web optimized: shipped WebP/PNG under web/assets/<area>/..., full-quality originals under art-src/<area>/... (originals may be large; shipped files small, report bytes).
- Art: original only, no real logos/likenesses/branding, no baked-in gameplay text on images (names/stats/skills rendered by code). Transparent individual assets where requested. If no raster image generator is available to you, produce original layered vector art (SVG) authored in code, rasterize to WebP, and say so.
- CSS: your own file web/css/<stream>.css; JS: your own modules under the paths below. Shared files (web/index.html, web/js/app.js, web/css/app.css, web/js/assets.js) may only receive a minimal, documented hook (import/route line). Note every shared-file touch in the PR body.
- Tests: node --test passes on Node 20 & 22, no regressions vs base 411/0/3. Playwright where UI. Screenshots at 844x390, 667x375, 915x412, 1280x720 (+ 2532x1170/3 iPhone landscape 844x390 already, add 932x430 and 1024x768 as extra aspect ratios).
- Commit identity Mira (Grok Bot) <mira-bot@users.noreply.github.com>. Push a first real commit within ~90 min, push often.

## Exclusive ownership
| Agent | Branch | Owns |
|---|---|---|
| A Card Artwork Factory | prod/a-card-art | art-src/cards/**, web/assets/cards/**, web/manifests/cards.json, tools/art/cards/**, tests/prod/a/** |
| B Hideout & Furniture | prod/b-hideout | art-src/hideout/**, web/assets/hideout/**, web/manifests/hideout.json, content/prod/hideout/** (anchors, placement & replacement rules; no economy), tests/prod/b/** |
| C Inventory & Collection | prod/c-inventory | web/js/collection/** (Stash, Inventory, Collection, Deck Builder, Card Detail), web/css/collection.css, tests/prod/c/**, tests/e2e/prod/c/** |
| D Gacha & Reward Visuals | prod/d-gacha | web/js/gacha-fx/**, web/css/gacha-fx.css, art-src/gacha/**, web/assets/gacha/**, web/manifests/gacha.json, tests/prod/d/** |
| E Battle & Prep Polish | prod/e-battle-polish | web/css/battle-polish.css, web/js/battle-fx/**, art-src/battle-ui/**, web/assets/battle-ui/**, web/manifests/battle-ui.json, tests/prod/e/** |
| F Sport Complex Artwork | prod/f-sport-art | art-src/sport/**, web/assets/sport/**, web/manifests/sport.json, tests/prod/f/** (art only; sport code lives in sport/v06-*) |
| G World Content & Progression | prod/g-world-content | content/prod/world/** (NPCs, shopkeepers, side events, tutorials, progression), docs/production/world/**, tools/content/world/**, tests/prod/g/** |
| H QA & Performance | prod/h-qa | tests/prod/h/**, tests/e2e/prod/h/**, tools/qa/**, docs/production/QA_PERF_REPORT.md |
