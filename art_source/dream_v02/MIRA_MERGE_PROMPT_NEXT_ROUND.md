# MIRA — Comedy Fantasy Card Game v0.5 Final Integration (NEXT ROUND)

Owner: Potae. Work only after the owner explicitly starts the integration round. The immediate aim is a fully playable web build on mobile landscape, not a claim that all art or balance is already locked.

## Sources and current integration context

- Repository: `sarantanyamongkolpong/comedy-fantasy-card-game`.
- Source-of-truth: `Card_Battle_Design_Master_v0.5_20261120.xlsx`, full 8-tab brief in Draft PR #15. Preserve each row's original PROPOSED/PENDING/LOCKED state.
- Working foundation: `integration/v05-core-base` and subsequent `core/v05-playable` branch; inspect current branches and exact commits before applying anything.
- Historic PRs: #9 old artwork (previously **not approved**, do not merge without explicit owner decision), #15 specs, #16 data/gacha/save, #17 Dream Phase 1 art archive, #18 battle engine, #19 web UI. QA stream PR may be newer; find it, do not invent number.
- Dream Phase 2 source art: Google Drive `Art Production v0.2 - Phase 2 - 2026-11-20` (folder link in handoff), `ASSET_MANIFEST.json`, 42 separate PNGs. This is `GENERATED_REVIEW`, not automatically approved for production.
- IMPORTANT NEWER VISUALS: Mira already produced 1280x720 Battle and Prep background scenes with glowing blue/red grid and mystical blue arena, respectively; those supersede the older Dream `tower_battle_arena.png` for those screens unless owner chooses otherwise. Do not double-composite backgrounds.

## Execution

1. Perform READ-ONLY PR/branch audit and dependency graph, including all draft PRs. Never assume PRs are merged. Record source SHAs, target base, file conflicts and migration impact. If PR #9 or another previously blocked PR is required, stop **that one merge** and request specific owner confirmation; continue independent integration tasks.
2. Make an isolated integration branch and apply tested data/engine/UI/QA components in dependency-safe order. Protect data IDs, `legacy.pow`, saved-game migration, banner-separated pity, and gameplay settings. Do not auto-convert PROPOSED values to LOCKED.
3. Complete working flow: Home/Hideout → Deck 30 → Prep Battle → Battle (AP 5, hand 5, Draw/Discard/Void, Active/Passive, statuses, win/lose) → Rewards → inventory/save/load. Wire Gacha and relevant Companion entry points. Preserve the 4 Justin characters as new separate IDs pending owner identity mapping, not destructive renames.
4. Integrate the **Mira-approved** Battle and Prep backgrounds (already sent to web stream). Finish ornate dark-navy/gold HUD, 5 AP gem indicators, purple-gold END TURN, gold HP bars, floating damage/heal/regen numbers, readable cards and full-body combatants on grid. The user's side appears **left** in Mira's newer battle background. Never keep the old flat placeholder UI when richer assets are available.
5. Use Dream Phase 1 / Phase 2 artwork as separate asset layers and via manifest IDs, not flattened screenshots. For Phase 2 stage `tower_battle_arena.png`, keep it available only as an alternate or for another encounter, not stacked over Mira's battle scene. Import the six new Action card illustrations as editable unframed art; do not imply they cover all 30 distinct card designs. List missing art by actual card ID from v0.5.
6. Keep houses tiered Cabin→Bungalow→Cottage→Loft→Villa→Penthouse, with furniture rather than house tier controlling stash capacity. Three Gacha pool visuals only: Avatar, Action, Companion. New art stats/names do not override v0.5 rules. Preserve agreed `All teammates Regen +3 — 2 Turns` Active Skill where it belongs in source data; verify character/skill mapping rather than guessing.
7. Generate performant WebP derivatives while retaining original PNGs. Load only scenes/assets needed for current view, use CSS/Canvas for numbers and interactive buttons, not text baked into PNG. Keep fixed aspect ratio and proportional positioning for world map; safe letterboxing, no mall cropping or hand overlapping teammates.
8. QA: run all unit suites under Node 20 and 22, CI, browser Playwright E2E at 844×390 landscape and larger 16:9/20:9 viewports. Test Start/Back, deck edit, card play, insufficient AP, discard/void, death, rewards, gacha pity, save/load migration, image loading fallback, aspect ratio, clipping and touch targets. Report passes/fails **with counts** and screenshots. Fix P1 regressions before requesting merge.
9. Produce a browser-playable preview URL or standalone offline HTML for owner review, a per-PR merge table, exact build SHA, image provenance list, and list of pending owner decisions. Put integration in Draft PR first. **Do not merge to main, publish to production, or mark generated art production-ready until owner confirms.**

## Non-negotiables

- Never hide failing tests or represent a conceptual art mockup as a running game screen.
- No premature irreversible data migration, old ID deletion or save incompatibility.
- The last user decision and current v0.5 row status outrank older concept notes.
- If visual assets from Dream and Mira duplicate, choose Mira's approved newer backgrounds for Battle/Prep and preserve Dream originals in archive as alternate assets. Report the choice in the PR.
