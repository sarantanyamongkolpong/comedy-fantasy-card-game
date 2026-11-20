# SPORT COMPLEX v0.6 — Phase 1 Audit & Plan (Mira)
Prepared 2026-11-20 ~19:45 ICT. Phase 1 = read + audit + plan only. Nothing implemented, nothing pushed.

## 0. Sources read (all fully)
| File | Path | Notes |
|---|---|---|
| Owner Brief + Implementation Prompt (§10) | drive/MIRA_SPORT_COMPLEX_v0.6_OWNER_BRIEF.md (131 lines) | prompt also extracted to drive/IMPLEMENTATION_PROMPT_extracted_s10.md |
| Auto Racing research | drive/SPORT_COMPLEX_AUTO_RACING_RESEARCH.md (82 lines) | FIA/F1 sources, RESEARCH/PROPOSED |
| Motorcycle research | drive/SPORT_COMPLEX_MOTORCYCLE_RESEARCH_v01.md (67 lines) | MotoGP/FIM/OEM sources, nothing LOCKED |
| Research workbook (12 sheets) | drive/SPORT_COMPLEX_v0.6_RESEARCH_20261120.xlsx -> sheets/01..12_*.csv | Brief calls it `SPORT_COMPLEX_v0.6_RESEARCH.xlsx` (same file) |
Drive folder contains exactly these 4 files. The .md files are the original Drive bytes (faithful copies). No model names or deadlines are named in the brief/prompt.

## 1. Requirement checklist (source refs)
### OWNER_LOCKED (Brief §1, Policies SP-01..07, SP-10, Gacha sheet, QA-01..10, OPEN-05)
- [ ] R1 4 distinct AUTO sports; only pre-event choices, zero in-match control (§1.1, SP-01, QA-01)
- [ ] R2 Every entity (athlete/driver/rider, coach, team/constructor, car/bike, venue/track, tactic) researched from reliable/primary sources; display only parody identity + original assets; real refs/URLs private metadata (§1.2, SP-02, SP-06)
- [ ] R3 4 separate banners SPORT_FOOTBALL / SPORT_BASKET / SPORT_CAR / SPORT_MOTO, independent pity, no cross-sport pulls; one canonical existing G wallet, no sports coin (§1.3, SP-03, QA-05/06)
- [ ] R4 Sport rarity N/R/Epic/EX (= AVATAR_RARITIES); no 5th tier; config-driven tiers; Action FAC untouched (§1.4, SP-04, QA-07)
- [ ] R5 Football 11v11 incl GK, selectable formation + role positions, research-grounded formation trade-offs, coach passive, pre-match lineup, stamina; stats exactly Power/Def/Speed/Sta/Acc (§1.5, QA-02 "five formations")
- [ ] R6 Basketball 5 on court, own gacha, player/coach/team/arena/tactics; stats exactly Shooting/Def/Spd/Sta; bench/auto-subs = editable proposal (§1.6, QA-03)
- [ ] R7 Car: 2 entries per team, stats exactly Top Speed/Accel/Handling, full auto sim + prep screen (§1.7, QA-04)
- [ ] R8 Moto: 2 rider+bike entries per team, Top Speed/Accel/Handling, full auto sim (§1.8, QA-04)
- [ ] R9 Web, phone-landscape first, fixed-aspect map, all art via asset manifest; don't merge #9; don't rewrite card-game engine (§1.9, SP-05)
- [ ] R10 Per-field provenance: source_identity, parody_display_name, real_world_source_url, source_snapshot_date, source_season_or_event, verified_raw_metrics (nullable), game_rating (null until calibrated), record_status FACT_VERIFIED/DATA_MISSING/PROPOSED, owner_lock_state (§2, SP-07)
- [ ] R11 No fabricated real numbers; normalized 0–100 never "official"; missing -> null/DATA_MISSING; engine-needed placeholders explicitly labelled (§2)
- [ ] R12 No faces/photos/logos/kits/liveries/sponsor decals/event branding/exact circuit geometry (§2, QA-09)
- [ ] R13 Draft PRs only, no merge without Owner, keep prior saves (SP-10, OPEN-05)
### Acceptance (Brief §8, QA sheet)
A1 4 entrances from Sport Complex; main game + old saves still work · A2 banner isolation, shared G visible, atomic, no dup rewards · A3 football 11 distinct starters/GK, formation recognized, stamina+coach affect sim, seed-deterministic · A4 basketball always 5 (subs/foul-out never 4/6), OT/draw handling, deterministic · A5 2 active cars / 2 riders, both count, independent DNF · A6 parody-only display, every sourced identity has URL+snapshot, no false OFFICIAL · A7 Deck/Hideout/Battle/Rewards regression + 844x390 & other landscape captures, no overlap, map not stretched · A8 unit+integration+a11y/Playwright; status vocab RESEARCH/PROPOSED/QA_PASSED/OWNER_APPROVED/INTEGRATED, no auto PROPOSED->LOCKED · A9 each Draft PR: source notes, screenshots, G economy impact; playable HTML + review summary.
### PROPOSED / open (Brief §9, SP-08/09, OPEN-01..04)
Stat formulas & 0–100 scaling, tournament length, payouts, odds/pity/costs, driver/vehicle acquisition split, pit risk, bench size, coach drop rates, likeness/art policy, data licensing, all parody names (only Messi→Lion Messo is an "owner-given example", still not auto-locked).

## 2. Auto Sim rules per sport (real basis -> game, all mechanics PROPOSED unless noted)
- **Football** (IFAB Law 3/7/11): 11 incl GK, 2×45, offside = active involvement. Formations 4-3-3, 4-2-3-1, 3-5-2, 4-4-2, 3-4-3 with contextual strengths/risks (not RPS). Sim: 11 active + optional bench + coach, positional legality, seeded minute-by-minute events, fatigue, subs, simplified fouls/injury, ET/tie per mode, event log + replay speed. Stat mapping: Power≈role-relative goals/shots per 90, Def≈tackles/recoveries/GK saves, Speed≈measured top speed, Sta≈minutes/distance, Acc≈pass/shot accuracy (mapping PROPOSED, needs shrinkage).
- **Basketball** (FIBA OBR 2026, eff. 1 Oct 2026): 5 on court, 4×10 min, 5-min OT, 24s clock, 8s backcourt, 5 fouls. Pre-match: 5 starters PG/SG/SF/PF/C, bench/rotation, coach passive, pace, defense scheme (man-to-man / 2-3 zone / matchup zone). Sim: possessions pass/shot/TO/foul/rebound, subs, fatigue, OT, W/L. NBA & WNBA baselines normalized separately.
- **Car** (FIA 2026 A2.1.3/A2.1.4): 2 cars/team, constructor = sum of both. Weekend: practice/quali/GP; Sprint 100 km no mandatory stop. Tyres S/M/H + Inter/Wet; no hardcoded pit count. Prep: 2 driver+car pairs, aeroBias, start tyre, pit window, risk; weather = forecast uncertainty. Sim: lap/sector, tyre wear, wetness, overtakes, reliability, incidents, pit delay; driver & team standings; configurable points. Top Speed from event-normalized speed trap only; Accel DATA_MISSING; Handling PROXY_UNVERIFIED. No numeric values proposed.
- **Moto** (MotoGP/FIM 2026): 11 two-rider teams, 5 makes; Q1/Q2 sets same grid for Sprint (~half, 12 pts win) and GP (25 pts); Michelin S/M/H/wet; setups per track. Game = 1 bike per rider (not real flag-to-flag spare). Prep: 2 different riders each on a different owned bike, compound, preset Speed/Handling/Balanced/Wet, aggression. Sim: seeded quali, Sprint/GP, per-lap sectors (bike stats × rider traits × track weights × tyre × temp × fatigue × incidents), independent DNFs, lap log + fast-forward. Rider stamina = game-only dynamic (not a card stat).
- Shared: seeded/reproducible, per-event snapshots, replay vs fast-forward, outcome reasons, save/load safe, no double G payout. **No Sta card stat on racing** (§7).

## 3. Data counts in workbook (sheets/)
| Sport | Athletes/drivers | Coaches | Teams/constructors | Vehicles | Venues/tracks | Tactics/formations |
|---|---|---|---|---|---|---|
| Football | 13 (FB001–013, GK×1) | 4 | 4 clubs | – | 4 stadiums (paired w/ clubs) | 5 formations |
| Basketball | 10 (BA001–010; 6 NBA 2024/25, 4 WNBA 2026) | 3 | 4 | – | 3 arenas | 3 defensive schemes |
| Car | 12 (CR001–012, 6 real teams×2) | 0 | 6 constructors | 6 chassis | 6 circuits | tyres/pit (doc) |
| Moto | 10 (MR001–010) | 0 | 5 manufacturers (no team sheet) | 5 bikes | 6 circuits | tyres/setups (doc) |
Every game-stat column is blank; every rating_status = DATA_MISSING. Snapshot 2026-11-20 on all rows.

## 4. Gaps
- G1 No game ratings at all; sims need numbers -> `BALANCE_PLACEHOLDER` values in a separate tuning table (never in real_ref), flagged in UI/dev overlay.
- G2 Football: 13 players cover one XI (+2), only 1 GK; opponent XI (11) and a 2nd GK missing. Basketball: exactly 10 = two fives, no bench. -> need NPC/opponent sourcing (see D3).
- G3 No N/R/Epic/EX tier assignment for any card; no odds/costs/pity numbers; no G reward values.
- G4 Moto: no team (2-rider) entity sheet; car/moto have no coaches (not required).
- G5 Football clubs ↔ roster not linked (players are cross-club). Basketball venues 3 vs teams 4 (Indiana Fever has no arena row).
- G6 No sport artwork exists except MAP_BLD_SPORTS (world/building_sports_complex.png) already in web/assets-manifest.json; ~60 card portraits, 4+ backgrounds, vehicles, crests needed.
- G7 Raw metrics are small samples (UCL 2026/27 = 2–4 apps), NBA uses 2024/25 while WNBA 2026: mixed seasons (brief warns).
- G8 Accel/Handling (car+moto) have no verified source by design -> stays DATA_MISSING/PROXY_UNVERIFIED.

## 5. Conflicts / risks to flag
- C1 **Moto doc §"two independent gachas"** proposes separate Rider and Bike gachas with separate pity; LOCKED rule is one banner per sport (Gacha sheet: "One sport banner; subpool optional"). Plan: one SPORT_MOTO banner, optional rider/bike subpools behind config, pity per banner — Owner decision D5.
- C2 Moto doc H/M/L rider/bike traits are invented; must be stored as PROPOSED tuning, never in verified_raw_metrics (brief §6 "keep rating fields null").
- C3 Real-person likeness/publicity: parody names are close to real names (e.g. Lion Messo, Kaitlyn Cluck, Max Verstomper) and some comedy bios reference real traits. Fine for internal prototype; SP-09/OPEN-04 require IP/publicity review before release. Portraits must be non-likeness caricatures.
- C4 Data licensing: F1 IP guidelines cover timing/stats; UEFA/NBA stats copied into repo as verified_raw_metrics. Keep internal-only (not rendered), private repo; flag for review (brief §9).
- C5 Status vocabulary: v0.5 uses LOCKED/PENDING/PENDING_OWNER; v0.6 adds RESEARCH/PROPOSED/QA_PASSED/OWNER_APPROVED/INTEGRATED + record_status. Need mapping; never convert PENDING/PROPOSED->LOCKED.
- C6 Pity: v0.5 LOCKED t253u (Epic 100 / top 200, per banner) is for main banners. Brief says "existing pity principles retained unless conflicting; do not set odds/pity/cost without confirmed settings". Applying 100/200 to sport banners = PROPOSED until Owner says so (D4).
- C7 Gacha cost in G is PENDING_OWNER in v0.5 too; sports pulls can't be priced -> test-only banners (like content/v05/gacha/TEST_ONLY_banners.json).
- C8 Wallet: brief wants a canonical transaction ledger with atomic spend/grant. v0.5 has only `currency.G` + `rewardLedger[matchId]` (grant idempotency, no spend ledger). Need additive wallet module; must not change v0.5 battle reward semantics.
- C9 v0.5 MAP-04 "Sports Complex" is LOCKED as a building but OPEN-07 "Sports games" is PENDING; t267u now supplies the spec, so sports games move to in-scope, but their numbers remain PROPOSED.
- C10 Timing: v0.5 deadline 23:59 tonight; integration/v05-final still waiting on web stream (final/web not pushed; P1 off-screen buttons). v0.6 base will move. Plan base at current 953f5cc, merge (not rebase/force) v05-final updates later.
- C11 Brief §7 suggests PR split schema/gacha/wallet, football, basketball, racing+moto, UI/art, QA; parent plan has 4 streams (data/sim/web/qa). Compatible: sim stream may produce 1 PR or 3 sub-PRs.
- C12 No conflict with "no merge", "no #9", HUNTER LIFE untouched, IDs preserved.

## 6. Repo status (2026-11-20 ~19:40 ICT)
- 23 open PRs (#1–#24, none merged to main). Active Draft: #24 integration/v05-final -> core/v05-playable @ 953f5cc (Data+Engine+QA merged; web pending), #23 Dream v0.3 art, #22 Dream v0.2 art, #15–#20 v0.5 streams, #17 Dream v0.1. #9 still unmerged (do not touch).
- Remote branches incl. final/data, final/engine, final/qa (no final/web yet).
- Box worktrees: /workspace/pl-int = integration/v05-final (read only for this audit; clean), /workspace/cg-art = art/dream-v01-drop (has untracked web/).
- Last reported v0.5 totals: full suite 385 pass / 8 fail (Node 20/22, before QA merge); acceptance 107 pass / 5 fail / 3 todo @953f5cc. My local `node --test` re-run hit a 120s timeout (practice-auto + regression suites still pending) — not re-verified in this phase.
### Modules v0.6 must extend (additive only)
- Save: src/schema/constants.js SAVE_VERSION=2; src/save/serialize.js reads {1,2}, REQUIRED keys profileId/inventory/decks/currency/pity/house/rewardLedger; adapter key `cfcard.save.v1`; src/save/inventory.js createProfile (currency {G}, pity {}, inventory avatars/actions/companions). Migration dir src/migrate (pow-to-atk, save-pow).
  -> v0.6: SAVE_VERSION 3, READABLE {1,2,3}, migrate v2->v3 adds `sport: {inventory:{football,basket,car,moto}, lineups, history}`, `walletLedger: []`; pity stays `profile.pity[bannerId]` (already per-banner -> SPORT_* keys isolate naturally). v2 saves load untouched; round-trip test.
- Rewards: src/save/rewards.js applyBattleReward idempotent by matchId -> sport results use `event_result_id` = `SPORT_<SPORT>_<seed>_<n>` via same ledger or new wallet.grant().
- Gacha: src/gacha/pull.js POOLS={avatar,action,companion}, lockedPityPolicy GA-12; rng mulberry32. -> add sport pool types via config, not edits to existing banner behaviour.
- Rarity: AVATAR_RARITIES ['N','R','Epic','EX'] reuse; ACTION_RARITIES incl FAC untouched.
- Engine src/engine (card battle) — do not modify; sports get own src/sport/*.
- Web: web/js/screens/{home,map,party,prep,battle,rewards,stash,gacha}.js, stage.js (1672×941 fixed stage), map.js hotspot `locked` shows "Sports Complex is locked…coming soon"; manifest asset MAP_BLD_SPORTS siteId `sports` exists.

## 7. Proposed architecture
```
content/v06/sport/
  sources.json                 # every source URL, season, snapshot, licence note
  football/{athletes,coaches,clubs,venues,formations}.json
  basket/{athletes,coaches,teams,venues,schemes}.json
  car/{drivers,constructors,cars,tracks}.json
  moto/{riders,manufacturers,bikes,tracks,teams}.json
  tuning/{football,basket,car,moto}.tuning.json   # BALANCE_PLACEHOLDER game_rating, rarity, coefficients (PROPOSED)
  gacha/TEST_ONLY_sport_banners.json               # 4 banners, no real odds
  economy/sport_rewards.PROPOSED.json
  source/SPORT_COMPLEX_v0.6_RESEARCH.xlsx + csv export
```
Entity record = `{id: SPORT_FOOTBALL_ATH_013, sport_type, role, parody_display_name, art_asset_id, real_ref:{source_identity, real_world_source_url, source_season_or_event, source_snapshot_date, verified_raw_metrics, record_status}, game_stats:{Power,Def,Speed,Sta,Acc}|null, game_stats_status: BALANCE_PLACEHOLDER|PROPOSED, owner_lock_state: PROPOSED}`. UI only reads parody/art; a lint test forbids rendering real_ref.
```
src/sport/
  common/{rng.js, schema.js, validate.js, provenance.js, events.js, result.js}
  football/sim.js   basket/sim.js   car/sim.js   moto/sim.js  (pure, seeded, return event log + result)
  racing/shared.js  (car+moto lap/sector core, tyres, DNF)
  wallet/index.js   (canonical G ledger: grant/spend atomic, idempotent by txn id; wraps profile.currency.G)
  gacha/sport-pull.js (banner per sport, pity per banner, uses src/gacha rng)
  save/migrate-v3.js
web/js/screens/sport/{hub,football-prep,basket-prep,race-prep,moto-prep,sim-view,result,sport-gacha,roster}.js
web/assets/sport/* + manifest slots SPORT_* (placeholder SVG fallbacks, GENERATED_REVIEW)
```
Map: Sport Complex hotspot action `locked` -> `sports` (hub with 4 entrances); map layout/aspect untouched.
Flow per sport: Hub -> Roster/Gacha -> Prep (lineup/formation/coach | 5+bench/scheme | 2 pairs+tyre/pit | 2 rider+bike+setup) -> START (auto) -> Sim view (log, fast-forward/replay) -> Result + G (idempotent) -> Hub.

## 8. Branch / stream plan (no merges, Draft PRs only)
- `sport/v06-base` from integration/v05-final @953f5cc (Mira): contracts only — schema doc, ID namespace, content dir skeleton, provenance JSON schema, sim result/event contract, save v3 contract, Draft PR -> integration/v05-final.
- `sport/v06-data` (stream D1): xlsx -> JSON for 4 sports with real_ref/game_stats split, sources.json, tuning placeholders (labelled), TEST_ONLY banners, provenance validator + tests (A6). Fill opponent NPC rosters per D3.
- `sport/v06-sim` (stream S): 4 seeded Auto Sims + shared racing core + tests A3/A4/A5 + determinism; wallet + sport gacha + save v3 migration (A2, A1-saves). Could split PRs: sim-football, sim-basket, sim-racing, systems.
- `sport/v06-web` (stream W): Sport Complex hub + 4 prep/sim/result screens + sport gacha + roster, inside fixed 1672×941 stage, touch targets ≥44px, placeholder/original art via manifest; consumes data+sim through adapters (mock until ready).
- `sport/v06-qa` (stream Q): Node 20/22 matrix, v0.5 regression, Playwright 844×390/667×375/915×412/1280×720 captures, a11y smoke, provenance & IP audit, banner isolation, G idempotency, QA report + status table, single-file HTML build.
- Mira integrates into `sport/v06-integration` (Draft PR) and reports.
File ownership is disjoint (content/v06 = D1, src/sport = S, web/js/screens/sport + web/assets/sport = W, tests/sport/e2e + docs/qa/v06 = Q; manifest/app.js/map.js hotspot edits owned by W only).

## 9. Owner decisions needed (not blocking; defaults are PROPOSED placeholders)
- D1 Ratings: OK to ship labelled BALANCE_PLACEHOLDER stats (derived only from role + coarse tiers, never shown as official) for the playable preview?
- D2 Tier assignment N/R/Epic/EX per card — Mira proposes placeholder by role/pool, PROPOSED.
- D3 Opponents: football needs a 2nd XI + GK, basketball a 2nd five/bench. Research more real players (more parody of real people) vs original fictional NPC teams with no real source? (R2 says every entity researched → default: research more players from same official sources.)
- D4 Sport pity: reuse v0.5 Epic 100 / EX 200 per banner, or other? Pull cost in G? (default TEST_ONLY, no price)
- D5 Car/Moto acquisition: driver and car combined card vs separate subpools inside ONE banner (moto doc's 2 separate gachas conflicts with lock).
- D6 G rewards per sport event (economy impact) — default 0 / TEST value.
- D7 Match length for mobile: football full 90 sim minutes compressed, basketball 4×10, race laps count?
- D8 Art: who produces sport portraits/vehicles (Mira GenerateImage vs Dream); placeholder SVGs meanwhile.
- D9 Basketball mixed NBA 2024/25 + WNBA 2026 seasons: keep, or refresh NBA to 2025/26?
- D10 Timing: start v0.6 implementation only after v0.5 handoff (23:59) or in parallel now?
