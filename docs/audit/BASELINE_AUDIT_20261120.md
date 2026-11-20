# Baseline Audit — Card Game v0.5 Final Core Production (20 Nov 2026)

Audited live at ~15:55–16:10 (Asia/Bangkok, UTC+7) by Mira. No PR was merged, nothing pushed to `main`, no force-push, no deploy, no permission changes. `hunter-life` was not touched.

- **Repository:** `sarantanyamongkolpong/comedy-fantasy-card-game` — PRIVATE, default branch `main` @ `7d82053` (Initial commit, README only). Resolves v05 OPEN-10 (repo identity); the only card-game repo in the workspace/PR history.
- **Source of truth:** `docs/design/v05/source/Card_Battle_Design_Master_v0.5_20261120.xlsx` (v05_* tabs). Imported to `docs/design/v05/tabs/`. Index: `docs/design/v05/REQUIREMENTS_INDEX.md`.

## 1. Live PR / branch status

All 14 PRs are OPEN, non-draft, `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`. Heads have **not moved since 18 Nov** (last update 18 Nov 20:59 UTC = 19 Nov 03:59 ICT). CI workflow (`quality-gates.yml`) exists only on PR #12's branch, so only #12 reports checks.

| PR | Head | Branch → Base | Mergeable | CI | Chain | Title |
|---|---|---|---|---|---|---|
| #1 | d65c89d | feat/card-art-prototype-mira → main | CLEAN | none | Art base | First 4 Avatars art prototype |
| #2 | dba87d7 | feat/card-systems-cursor → main | CLEAN | none | Systems base | Core systems foundation |
| #3 | 68c70f8 | feat/battle-debug-replay → #2 | CLEAN | none | Sys 2 | Battle replay tooling |
| #4 | 96aa13e | docs/game-design-research → #2 | CLEAN | none | Sys 5 | Design decision research |
| #5 | 2f92e9b | test/modular-equipment-stress → #1 | CLEAN | none | Art 2 | Equipment stress harness |
| #6 | 3848096 | tools/card-data-authoring → #2 | CLEAN | none | Sys 4 | Content authoring pipeline |
| #7 | 9128191 | test/battle-engine-stress → #2 | CLEAN | none | Sys 1 | Battle stress tests |
| #8 | d54037e | tools/battle-balance-lab → #2 | CLEAN | none | Sys 3 | Balance lab (EXPERIMENTAL) |
| #9 | **47fab89** | polish/pixel-art-cleanup → #1 | CLEAN | none | Art 1 | Pixel cleanup — **merge into art branch NOT approved; not merged** |
| #10 | cf1d474 | feat/pixel-animation-v2 → #1 | CLEAN | none | Art 3 | Animation v2 |
| #11 | **f5faeab** | integration/art-systems-contract → #2 | CLEAN | none | Sys 6 | Art/systems contract audit |
| #12 | **c569ef9** | ci/automated-quality-gates → #2 | CLEAN | **4/4 pass ×2 runs** (44396226439, 44396237662) | Sys 7 | CI quality gates |
| #13 | a66d338 | qa/art-preview-mobile → #1 | CLEAN | none | Art 5 | Mobile art preview |
| #14 | 7a10d67 | polish/card-art-v2 → #1 | CLEAN | none | Art 4 | Card art v2 |

Branches on remote (15): main 7d82053 plus the 14 PR heads above. PR #9/#11/#12 heads equal the last-known SHAs (47fab89 / f5faeab / c569ef9).

### Dependency map

```
main 7d82053
├── #1 feat/card-art-prototype-mira (art base)
│     #9 → #5 → #10 → #14 → #13   (Owner-approved ORDER in principle; each real merge still needs Owner OK; #9 first, NOT approved yet)
└── #2 feat/card-systems-cursor (systems base)
      #7 → #3 → #8 → #6 → #4 → #11 → #12
```

### Local merge dry-run (no push of any PR merge)

1. **Systems stack** (`feat/card-systems-cursor` + #7, #3, #8, #6, #4, #11, #12 with `--no-ff`): **0 conflicts.** Result `72c7deb`. `npm test` (Node 24.22.1) → **187 pass / 0 fail**; `validate-repository`, `validate-data`, `validate-assets` → exit 0.
2. **+ Art base #1** on top of the systems stack: **2 add/add conflicts — `README.md` and `tests/README.md`.** Resolution per D5 = keep both (union), drop stale rules. `tests/README.md` is a new finding (previous plan only listed README.md). Merge aborted; not committed.
3. **#9 manifest:** `docs/ASSET_MANIFEST.json` on #9 repeats the 4 avatar IDs (`AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, `AVT_SAN_001`) under `pixel_cleanup.characters` — allowed in Draft tier (D4: repeated references to existing avatar IDs), must be referential-not-duplicate in Production tier. Unchanged since last audit.

## 2. v0.5 P0 core — existing vs missing

Baseline = systems stack `integration/v05-core-base` @ 72c7deb. Legend: ✅ exists+tested · 🟡 partial/scaffold · ❌ missing.

| Requirement (rule IDs) | State | Where today | Tests today | Gap for v0.5 |
|---|---|---|---|---|
| 4 Avatars per team (CORE-003) | ✅ | `src/schema/constants.js` PARTY_SIZE=4; `src/battle/battle.js` createBattle | tests/battle.test.js, tests/stress/battle-engine.stress.test.js | mixed-faction team test |
| Turn order by team SPD, alternate (CORE-006/038) | 🟡 | battle.js uses injected `rules.teamSpd` / `rules.spdTieBreak`; defaults THROW (`src/design/blocked-rules.js`) | battle/stress tests with stub rules | Keep aggregation + tie as RuleConfig flags (PENDING); provide provisional config clearly labelled |
| 5 AP reset each own turn, manual End Turn (CORE-007/015) | ✅ | BASE_AP=5, endTurn resets next side AP; no auto-end | battle.test.js | test "AP 0 does not auto-end", "cancel never spends AP" |
| Card AP cost 0–5 from data (CORE-008) | 🟡 | `src/cards/play.js` resolveApCost via rules (blocked by default) | cards.test.js | read `Cost_AP` from card data, validate 0..5 |
| 30-card deck (CORE-009) | ❌ | `rules.deckSize` blocked; `tools/ci/protected-constants.json` explicitly excludes deck size | — | DECK_SIZE=30 now LOCKED → add constant + update protected-constants sha (stream B) |
| Opening hand 5 / refill to 5 keep leftovers (CORE-010/011) | 🟡 | HAND_SIZE=5; `src/cards/hand.js` draw via blocked rule | — | implement draw-to-5 at own turn start |
| Effect overdraw >5 (CORE-012) | ❌ | — | — | effect `draw` op |
| Free mandatory discard to 5 at end of round (CORE-013) | ❌ | — | — | end-phase discard step + UI |
| Voluntary discard 1 AP (CORE-014) | ❌ | discard blocked rule | — | |
| Discard pile / The Void separate, recycle only Discard (CORE-016/017/018/019) | ❌ | no pile zones at all | — | zones: draw/hand/discard/void; seeded shuffle; Zone_Recovery |
| Active via Skill Action card (CORE-021) | ❌ | `rules.skillEffect` blocked | — | Skill card → avatar Active |
| Generic vs FAC gating (CORE-022/023) | ❌ | — | — | Faction_Requirement gate |
| Passive chance with seeded RNG | 🟡 | seeded RNG exists only in `tools/balance-lab/rng.js` (tool, EXPERIMENTAL) | balance-lab tests | engine-level seeded RNG in src |
| Statuses / Regen (Justina Saving Grace +3 × 2 turns) | ❌ | — | — | status lifecycle, tick timing = config (OPEN-02) |
| Win/lose, simultaneous death (CORE-004) | 🟡 | `evaluateOutcome` via `rules.isSideDefeated`/`simultaneousDefeat` (blocked) | battle tests w/ stubs | HP model PENDING (CORE-039) → provisional config |
| Stats ATK/DEF/SPD, migrate legacy (CORE-005) | 🟡 | schema uses `pow/def/spd` (`src/schema/game.schema.json`, STAT_KEYS, authoring columns, replay/balance fixtures). No HP/MAG/RES in this repo. | schema/authoring tests | Non-destructive migration `pow→atk` (keep `legacy.pow`), schema v2 |
| Rarity N/R/Epic/EX, Action +FAC (CORE-024/025) | ❌ | rarity null everywhere | — | enums + slot validation (CORE-026..029) |
| Action card schema (v05_Action_Schema) | 🟡 | 3 structural samples `ACT_SCHEMA_*` (null cost/effect) | cards tests | full contract fields |
| Gacha banners + pity engines (GA-*) | ❌ | `rules.gachaRate` blocked | — | data-driven banners, per-banner counters, reset policy as config, no rates |
| Home/Hideout/Stash/Deck/Gacha/Map loop (HOME-*, MAP-*) | ❌ | only art preview HTML on art branch (`preview/index.html`, not in systems stack) | art PR #13 viewport QA | whole web UI (OWNER-PLAT-01..04) |
| Save/load | ❌ | — (`src/avatars/ownership.js` = ownership records only) | — | versioned save + round-trip |
| Replay/debug | ✅ | `src/debug/*`, `tools/replay` (#3) | tests/debug/* | reuse for engine logs |
| CI gates | ✅ | `.github/workflows/quality-gates.yml` (#12) | tests/ci/* | extend to new suites |

## 3. Name / ID reconciliation (non-destructive proposal)

The sheet's four Epic examples and the repo's four art avatars share faction/role but **not names/IDs**. Nothing is renamed or removed.

| v05 sheet ID | v05 Name | Faction / Role | Active (sheet + printed ref card) | Passive name (ref card) / sheet text | Repo avatar ID (existing) | Repo name (existing) |
|---|---|---|---|---|---|---|
| AV_EX01 | JUSTIN CASE | Aegis Dominion / Tank | +2 Shield • Taunt 1 turn | (name not supplied) / 70% turn start team DEF +1 | AVT_AEG_001 | Sir Potlid |
| AV_EX02 | JUSTIN TIME | Phantom Blades / DPS | Reckless Rush | Lucky Slash / 30% on attack +2 Damage | AVT_PHA_001 | Nox Squeak |
| AV_EX03 | JUSTIN THEORY | Celestial Nexus / Magic | Arcane Formula | Eureka! / 40% turn start self ATK +1 | AVT_CEL_001 | Madame Meteor |
| AV_EX04 | JUSTINA MOMENT (female) | Sanctuary Order / Support | **Saving Grace (LOCKED)** — all teammates Regen +3 for 2 turns | Moral Support / 50% turn start random ally ATK +1 | AVT_SAN_001 | Sister Plaster |

**Proposal (default, reversible):** treat them as **distinct characters**. Add the four Justins as new avatar records with new unique IDs in the repo convention (`AVT_AEG_002`, `AVT_PHA_002`, `AVT_CEL_002`, `AVT_SAN_002`) and keep `designRef: "AV_EX0n"` linking back to the sheet ID. Existing `AVT_*_001` records and all their asset IDs stay untouched. The Owner-approved reference cards (`docs/design/v05/ref_cards/`) attach to the new IDs as `reference` only until decomposed into modular assets. Seed battles use the Justins (they carry the v0.5 sample stats); Sir Potlid & co. stay as art-backed avatars with TBD stats.
**Owner decision D-ID (semantics unclear):** are the Justins *replacements/renames* of Sir Potlid / Nox Squeak / Madame Meteor / Sister Plaster (same character, new name → would add `displayName` override, ID kept), or *new characters* (proposal above)? Implementation proceeds with "new characters" because it is additive and fully reversible.

## 4. Recommended base + file ownership

**Base: `integration/v05-core-base` @ `72c7deb`** — a new branch = `feat/card-systems-cursor` (#2) + #7, #3, #8, #6, #4, #11, #12 merged locally with `--no-ff` in the approved order, 0 conflicts, 187/187 tests. It is pushed as a plain branch (no PR, nothing merged into any PR base or main) so cloud agents share one base. **No art branch is included** (#1 art base would add README/tests-README conflicts; #9 is not approved). Art is consumed only through the manifest (OWNER-PLAT-03) and the existing `src/integration/*` contract; real art plugs in later via the art chain.
Design docs: `core/v05-design-source` (this PR, docs-only) → PR base `integration/v05-core-base`.

If the Owner prefers not to have a pushed integration branch, fallback base = `feat/card-systems-cursor` @ dba87d7 (agents then rebase onto the stack later; more conflicts).

### File ownership (non-overlapping). Each stream = own branch `core/v05-<stream>` from `integration/v05-core-base`, own Draft PR.

| Stream | Owns (create/modify) | Reads only |
|---|---|---|
| **A — Battle engine** (`core/v05-battle-engine`) | `src/battle/**`, `src/cards/hand.js`, `src/cards/play.js`, new `src/engine/**` (zones, turn phases, effects, statuses, rng), `tests/battle.test.js`, `tests/cards.test.js`, new `tests/engine/**`, `docs/engine/**` | `src/config/**`, `src/schema/**`, `content/v05/**` |
| **B — Data schema + gacha** (`core/v05-data-gacha`) | `src/schema/**` (constants, game.schema.json v2, validate), new `src/config/**` (RuleConfig + PENDING flags), new `src/migrate/**` (pow→atk, legacy kept), `src/avatars/**`, `src/cards/catalog.js`, new `src/gacha/**`, new `src/save/**`, new `content/v05/**` (4 Justins, sample Generic + FAC actions, banners — all marked SAMPLE/PROPOSED), `content/templates/**`, `content/examples/**`, `tools/authoring/**`, `tools/ci/protected-constants.json` (deck size 30 sha update), `tests/schema.test.js`, `tests/authoring/**`, new `tests/gacha/**`, `tests/save/**`, `tests/migrate/**`, `docs/DATA_SCHEMA.md` | `src/engine/**` |
| **C — Web UI / Hideout / Map** (`core/v05-web-ui`) | new `web/**` (index.html, `web/src/**` screens Map/Home/Stash/Deck/Gacha/Battle/Rewards, `web/assets-manifest.json` asset refs only, `web/placeholder/**`), new `tests/web/**` (unit for canvas-scaling math), `docs/ui/**` | `src/**` via public API (`src/index.js`), `content/**`, `docs/design/v05/ref_cards/**` |
| **D — QA / integration** (`core/v05-qa`) — **starts day one, test-first** | new `tests/acceptance/v05/**` (one file per v05_QA ID QA-01..QA-11 + OWNER-PLAT-04, written against the agreed engine/data API contract below; use `test.todo`/`skip` with reason until the API lands, never fake passes), new `tests/fixtures/v05/**` (deterministic seeds, 30-card sample decks, 4v4 rosters, expected logs), new `tests/e2e/**` (Playwright/Chromium), `tests/regression/**`, `.github/workflows/**`, `tools/ci/lib/**`, `tools/ci/*.mjs` (except protected-constants.json), `tests/ci/**`, `docs/qa/v05/**`, `docs/audit/**`, `README.md` (handoff section) | everything |

Shared-file rule: `src/index.js` (public exports) — **B** owns it; A and C request export additions via PR comments, or A adds `src/engine/index.js` re-export which B wires once. `package.json` — **D** owns (scripts/devDeps); others request. `tools/replay/**`, `tools/balance-lab/**`, `src/debug/**`, `src/integration/**` — frozen this round (read-only) unless D coordinates.

### Schedule (Owner t252u, Asia/Bangkok)
- **Now:** A, B, C and **D launch together**. D writes acceptance tests first from v0.5 rules against this minimal API contract (A/B implement it; names may only be extended, not changed, without telling D):
  - `src/engine/index.js`: `createMatch({ seed, config, teams, decks })`, `startTurn(state)`, `playAction(state, { cardInstanceId, actorAvatarId, targets })`, `discardVoluntary(state, cardInstanceId)`, `endTurn(state)`, `resolveEndOfRoundDiscard(state, cardInstanceIds)`, `getZones(state, sideId)` → `{ draw, hand, discard, void }`, `getOutcome(state)`.
  - `src/config/index.js`: `defaultRuleConfig()` with PENDING flags (teamSpdAggregation, spdTieBreak, damageFormula, regenTickTiming, deckDuplicateMax, …) each carrying `status: 'PENDING'|'PROPOSED'|'LOCKED'`.
  - `src/gacha/index.js`: `createBannerState(banner)`, `pull(state, { seed, count })`; `src/save/index.js`: `serialize(state)`, `deserialize(json)`.
- **22:00 ICT checkpoint:** playable loop **Deck build → Battle → Rewards**, ≥1 full run recorded (C + A + B; D runs the e2e smoke and records the result).
- **23:30 ICT:** every stream pushed + Draft PR (template sections) + handoff notes, even if incomplete. Incomplete work is labelled, never PRODUCTION_READY.

### OWNER-PLAT requirements per stream
- **C (UI):** web-playable (PLAT-01); landscape-first layout, portrait shows "rotate device" overlay (PLAT-02); every image/sprite/frame/icon resolved through `web/assets-manifest.json` → manifest asset IDs, missing → labelled placeholder, zero inline/base64 art in code (PLAT-03); World Map rendered inside one fixed design canvas (e.g. 1920×1080 logical, value in config) scaled by `min(vw/W, vh/H)` with letterbox/pillarbox, buildings and map UI positioned in canvas coordinates only, no independent CSS reflow (PLAT-04).
- **D (QA matrix additions):** landscape viewports 640×360, 812×375, 844×390, 915×412, 1024×768, 1280×720, 1920×1080 (+ one portrait to verify the rotate overlay); resize tests asserting each building/UI anchor keeps the same relative (x/W, y/H) position within ±1 px-scaled tolerance, aspect ratio preserved, no element outside canvas bounds, letterbox bars present when aspect differs; static check that no `data:image` / hard-coded art paths exist outside the manifest.

## 5. Owner decisions that truly block (irreversible semantics / material expansion)

Everything else stays a configurable flag with provisional, clearly labelled defaults (CORE-036/037/038/039/040, GA-11 rates/price, OPEN-02 regen tick, HOME-11, OPEN-04, OPEN-06, OPEN-07).

1. **D-ID — Justin ×4 vs existing AVT_*_001 avatars:** new characters (proposed, additive) or renames of existing characters? Affects persistent IDs/save data.
2. **GA-12 — pity counter semantics:** reset on hit? banner-specific vs shared across banners of the same pool? Epic-100 and top-200 counters independent or does a top hit also reset Epic? This is persisted in player saves; engine supports all variants via config, but the production choice changes saved-state meaning.
3. **CORE-005 migration target:** confirm legacy `pow` maps 1:1 to `atk` (the only legacy stat present in this repo; no HP/MAG/RES fields exist here). Migration keeps `legacy.pow`, so it is reversible, but the meaning of "ATK" in saves is set by this.
4. *(Not blocking, FYI)* Pushed integration branch `integration/v05-core-base` contains merges of unapproved PR branches (#7…#12) into a **new** branch only; no PR was merged. If the Owner objects, agents fall back to `feat/card-systems-cursor`.

## Known issues / blockers
- Reference card PNGs (t248u) were **not present on the box** at audit time (attachment paths missing) → `docs/design/v05/ref_cards/README.md` committed; PNGs to be added in a follow-up commit once the files are available.
- v05_Gacha rows GA-01..GA-04 are column-shifted in the sheet (Status value sits in "Pity Pulls", evidence in "Status"). Imported verbatim; REQUIREMENTS_INDEX shows effective status LOCKED with a ⚠ flag. Owner may want to fix the sheet.
- Only PR #12 has CI; other PR branches predate the workflow.
