# Final Integration v0.5 — Phase 1 PLAN (Mira, 20 Nov 2026, ~19:00 ICT)

Owner order t265u. Brief: MIRA_FINAL_MERGE_PROMPT_v03.md (Drive 18idL3Zz…, copy in this folder).
Hard rules: no LOCKED flips of PENDING/PROPOSED; never merge PR #9; no main merge; no production deploy; no force-push; never touch hunter-life; GENERATED_REVIEW != approved.

## 0. Starting state
- /workspace/pl-int = core/v05-playable LOCAL @ 5857416 = merge of origin/core/v05-playable-wire (9838c85) into core/v05-playable (12683f0). Merge COMPLETED cleanly (no MERGE_HEAD, tree clean, tree == 9838c85). 7 commits ahead of origin, NOT pushed.
- npm test on 5857416 (Node 24.22.1 box): 276/276 pass, 0 fail (154 s). Node 20/22 not installed on box -> use CI matrix or `npx -p node@20/22`.
- Brief conflicts with rules: NONE. The prompt itself forbids auto-merging #9, LOCKED flips, main/production without owner acceptance, and treating GENERATED_REVIEW as approved.

## 1. PR / branch table (fetched 18:55 ICT)
| PR | branch -> base | head | draft | CI | in core/v05-playable-wire / pl-int 5857416 |
|---|---|---|---|---|---|
| #15 | core/v05-design-source -> integration/v05-core-base | 51df543 | Draft | 4/4 pass (x2) | NO (7 docs commits: v05 design master, brief, requirement index, audit, ref PNGs) |
| #16 | core/v05-data -> integration/v05-core-base | 55d8b4f | Draft | pass | YES |
| #17 | art/dream-v01-drop -> integration/v05-core-base | 1e72dc0 | Draft | pass | NO as raw source (art already derived to WebP in web/assets; incl. Mira BG_BATTLE/BG_PREP + owner refs) |
| #18 | core/v05-engine -> integration/v05-core-base | 33513e4 | Draft | pass | YES |
| #19 | core/v05-web -> integration/v05-core-base | e8461b7 | Draft | pass (1 stale DATA_VALIDATION pending) | YES |
| #20 | core/v05-qa -> integration/v05-core-base | f398de1 | Draft | pass incl. V05_ACCEPTANCE Node 20+22 | NO (8 commits: acceptance suite, CI Node 20/22, handoff docs) |
| #21 | core/v05-playable-wire -> core/v05-playable | 9838c85 | Draft | 4/4 pass | = wire; in pl-int local |
| #22 | art/dream-v02-drop -> integration/v05-core-base | 0cd126c | Draft | pass | NO as raw source (bound as WebP via fc7ef7c) |
| #9 | polish/pixel-art-cleanup -> feat/card-art-prototype-mira | 47fab89 | open | — | NO — DO NOT MERGE (not needed: v0.5 uses Justin *_002 art) |
| #1-#14 | legacy art/systems PRs | — | open | — | not needed for v0.5 loop; leave untouched |
origin/core/v05-playable = 12683f0 (no PR of its own; base of #21).

Dry-run (git merge-tree, dangling commit 535b04c, nothing pushed): 5857416 + #15 + #17 + #22 + #20 -> 0 conflicts. Tests on that tree: see DRYRUN_TESTS below.

## 2. Merge order -> new branch integration/v05-final (from core/v05-playable @ 5857416)
1. push nothing to core/v05-playable yet; create integration/v05-final at 5857416 (it already contains #16 #18 #19 #21).
2. merge origin/core/v05-design-source (#15) — docs/source of truth only.
3. merge origin/art/dream-v01-drop (#17) — raw sources (52 MB). DECISION: keep raw under art_source/ or keep raw out (as HANDOFF does) and only reference SHA. Recommend: do NOT merge raw art trees into the playable branch; keep #17/#22 as source PRs, ship WebP derivatives + SHA256 + manifest provenance. (Avoids ~190 MB repo tree.)
4. merge origin/art/dream-v02-drop (#22) — same as 3 (derivatives already bound).
5. merge origin/core/v05-qa (#20) — acceptance + CI Node 20/22 workflow; re-point acceptance to real web where needed.
6. add Phase 3: new branch art/dream-v03-drop (raw 51 files + manifest + SHA256, Draft PR -> integration/v05-core-base, like #22), derivatives into integration/v05-final.
7. stream commits (below) land on per-stream branches off integration/v05-final -> merged back into integration/v05-final; one Draft PR integration/v05-final -> core/v05-playable (NOT main).

## 3. Requirement checklist (from merge prompt) — status on pl-int 5857416
### A/B source & process
- A1 v0.5 statuses LOCKED/PROPOSED/PENDING preserved — DONE (content/v05 *Status fields; docs on #15 not yet in branch -> PARTIAL until #15 merged)
- A3 Phase 2 42 PNG — DONE ingest (#22), PARTIAL bind (9 files unbound per docs/ui/HANDOFF.md, e.g. boss_office_dragon, action_regen; ENM_DEMO_004 no art) web/assets-manifest.json
- A4 Phase 3 51 assets — MISSING in repo (verified on box, PHASE3_VERIFY.md)
- A5 Mira Battle/Prep primary, Dream Tower alt — DONE (BG_BATTLE/BG_PREP default; BG_BATTLE_ALT_TOWER default:false)
- B1 read-only audit — DONE (this doc)
- B4 PR #9 untouched — DONE
### C game flow
- Home -> Hideout — PARTIAL (home.js = Cabin + tier brochure + furniture strip; no separate Hideout room scene w/ placement)
- Stash/Inventory — PARTIAL (stash.js: kind filter chips, lock/favorite; MISSING sort, stack count display, detail panel, item actions, scroll test, Phase 3 bag art)
- Deck Builder 30 — DONE (party.js, START BATTLE disabled until 4+30; tests/web)
- Prep Battle — DONE (prep.js, owner ref mirrored)
- Battle AP5/hand5/Draw/Discard/Void/Active+Passive/statuses/AUTO — DONE (engine 222 tests; battle.js; AUTO runAutoTurn)
- Victory/Defeat -> Rewards — PARTIAL (rewards.js text-only; no G/loot from engine: loot table PENDING; no reward art scene/treasure/coin VFX)
- Save/Load — DONE (versioned save, localStorage cfcg.v05.web.save; src/save, tests/save)
- Migration legacy.pow -> ATK — DONE in src/migrate (tests/migrate) ; PARTIAL in web (old-save import not E2E-tested)
- Gacha 3 pools, pity per banner — DONE engine (tests/gacha/pity.test.js) ; web booth TEST weights
- Upgrade — BLOCKED_BY_DESIGN (src/design/blocked-rules.js Q-UPGRADE) -> keep blocked, show "coming soon"
- Return to Hideout — DONE (claimAndLeave)
- Justin x4 art bound to AVT_*_002 IDs — DONE ; *_001 untouched
- Active "All teammates Regen +3 — 2 Turns" — DONE mapped to Justina AV_EX04 Saving Grace (content/v05/avatars/justin-avatars.json:594)
- Damage/HP/SPD/SYNC/5x2 not locked — DONE (PENDING_OWNER; SYNC REJECTED)
### D art/UI
- D2 manifest-only references, layered — DONE for P1/P2 ; MISSING for P3
- D3 use SVG vectors not the 4 REVIEW_FIX_NEEDED PNGs — MISSING (to do)
- D4 SVG buttons, CSS label/states, touch targets >=44px — MISSING (Phase 3 SVG not wired; current buttons CSS)
- D5 Battle: AP 5 gems, gold frames, HP bars, floating dmg/heal, END TURN, real cards, our team LEFT — DONE (verify floating numbers in E2E)
- D6 Inventory grid/filter/sort/stack/detail/actions/scroll/back/tooltip-not-covering; house ladder Cabin->Penthouse; capacity from furniture — PARTIAL (ladder + storageFromFurniture in src/schema/hideout.js; UI missing grid/sort/detail; capacity values partly PENDING_OWNER HOME-11)
- D7 Shopping Mall/Rewards backdrop + cutouts, values from engine — MISSING (mall = notice only; prices PENDING)
- D8 PNG masters, WebP deploy, lazy-load, image budget, map uniform scale+letterbox — PARTIAL (WebP pipeline web/tools/build-assets.py, 1.56 MiB; map letterbox DONE; lazy-load MISSING; budget not enforced)
### E QA
- Node 20/22 unit — PARTIAL (CI matrix on #20 only; box Node 24 276/276)
- Playwright 844x390 + 16:9 + 20:9 real-user E2E (mall clip, hand overlap, click-through, anim feedback, images load, no overflow) — PARTIAL (tests/web/auto-battle.playwright.test.js + screenshots; full matrix MISSING)
- Win/Lose/rewards, save/load/migration, pity, stack capacity, furniture placement, deck validation, Regen 2 turns, back/cancel no cost — PARTIAL (unit-level mostly; E2E missing for most)
- Ref vs build screenshots, perf bytes/waterfall, asset mapping report, missing action art by card ID, decision log, Draft PR — MISSING
- Preview link or standalone HTML — PARTIAL (web/tools/build-single-html works; no hosted preview)

## 4. Parallel work streams (file ownership to avoid overlap)
- S1 ENGINE (src/engine/**, tests/engine/**): expose reward payload from getOutcome/applyBattleReward with G=PENDING (null) + "PENDING_OWNER" loot; floating dmg/heal events in log if missing; Regen 2-turn E2E fixture; damage preset stays default `placeholder_atk_minus_def` (no change unless Owner picks).
- S2 DATA (content/v05/**, src/save/**, src/schema/**, src/migrate/**): inventory stack counts + capacity calc from installed furniture (values PENDING where sheet says PENDING); furniture install/remove API test; v1->v2 save migration fixture (legacy.pow); asset mapping for Phase 3 furniture as ART-ONLY (no new FUR ids unless Owner OKs).
- S3 WEB/ART BINDING (web/**, art derivatives): Phase 3 WebP derivatives + manifest entries (GENERATED_REVIEW); Inventory/Bag screen (grid, filter, sort, stack, detail, actions, scroll, back) using SVG vector frames; Hideout room with furniture placement layer; Shopping Mall scene (backdrop+merchant+counter, prices shown PENDING); Rewards scene (room bg + treasure + coin VFX, values from engine/PENDING); SVG buttons/icons in nav w/ CSS states & >=44px hit; VFX: taunt->Taunt status, draw/discard->zone moves, coin_burst->rewards, upgrade/critical UNBOUND (no rule); lazy-load + image budget report.
- S4 QA/PLAYWRIGHT (tests/e2e/**, .github/workflows, docs/qa/**): merge #20; Playwright matrix 844x390, 667x375(16:9), 915x412 (20:9), 1280x720; full loop Home->Hideout->Stash->Deck->Map->Prep->Battle(win+lose via seeds/AUTO)->Rewards->Save/Load->Gacha->Hideout; checks listed in E; screenshots + ref-vs-build board; perf bytes; asset mapping report; missing action art by card ID; QA totals P0/P1; Node 20/22 via CI + npx.
- Mira (integrator): branch integration/v05-final, merges, Phase 3 raw Draft PR, decision log, final report.

## 5. Owner decisions needed (defaults keep everything PENDING; nothing locked)
1. Damage formula (open from earlier card): keep `ATK−DEF min 1` (default) vs recommended full-ATK preset for MVP. Default if no answer: unchanged.
2. Raw art in playable branch: recommend keep raw P1/P2/P3 in source PRs only, ship WebP. (Reversible.)
3. Phase 3's 7 furniture props: display-only art with no FUR_* data ids (default) vs Owner adds furniture rows (capacity/price) — would be new content.
4. Rewards/Mall numbers: loot table, G rewards, furniture prices, Cabin base capacity (HOME-11), grant vs unlock-to-buy — all PENDING; UI will show PENDING labels.
5. Preview hosting: Cloudflare Pages preview needs Owner OK (creates an externally reachable URL for a private repo build).
6. VFX critical_hit/card_upgrade have no v0.5 rule -> unbound unless Owner says otherwise.

## 6. Preview link options (NOTHING deployed)
- Cloudflare MCP connected: whoami = sarantanyamongkolpong@gmail.com (user id 99ec9b66…). Proposal: separate non-production Pages project `cfcg-v05-preview`, Direct Upload of static `web/` build (or dist/playable.html), branch alias `integration-v05-final` -> https://integration-v05-final.cfcg-v05-preview.pages.dev ; optional Cloudflare Access (email allowlist) since repo is private. No custom domain, no production branch use. Requires Owner approval before creating project/uploading.
- GitHub Pages: previously not enabled; enabling on a private repo needs plan support + settings change (permission change) -> not recommended.
- Zero-infra fallback: standalone `playable.html` (web/tools/build-single-html, ~10 MB) attached to the Draft PR / uploaded to Owner's Drive folder.

## DRYRUN_TESTS (tree 535b04c = 5857416 + #15 + #17 + #22 + #20, local only, not pushed; worktree removed after run)
- 0 merge conflicts. Tree size 191 MB with raw art (supports decision 2: keep raw art out).
- `node --test` (full) exit 0 reported by npm but acceptance files fail; acceptance subset (tests/acceptance/**, 109 tests): 99 pass, 8 fail, 2 todo.
- Failures (S4 must reconcile; tests were written against pre-wire API/web):
  - AUTO-01..04: `UNKNOWN_SIDE` from runAutoTurn — test passes a side id that the engine does not use (engine uses 'player'/'enemy' sides).
  - QA-10 real-engine Deck->Battle->Rewards win/lose: helper expects call to return next state or {state} (API_CONTRACT drift).
  - QA-10 GA-11 web banners: undefined .length (web banner shape vs src/gacha).
  - QA-10 web pull seed integer: test regex finds string seed `gacha:${bannerId}:…` in web — verify whether wire still passes a string anywhere (HANDOFF says integer) → possible real P1 bug.
  - QA-10 save/load reload deep-equal mismatch — check save `web` field round-trip.
- NOTE: `npm test` exit code stayed 0 despite failures in the piped run — S4 to confirm CI actually fails on acceptance failures (pipe masked exit status in my run; re-run without pipe).
