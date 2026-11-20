# COMEDY FANTASY CARD GAME — SPORT COMPLEX v0.6

**Owner addendum / Mira implementation brief**  
**Prepared:** 20 Nov 2026 (Asia/Bangkok)  
**Repository:** `sarantanyamongkolpong/comedy-fantasy-card-game`  
**Status:** New owner requirements marked **LOCKED** below; rosters, formulas, artwork, balance and parody spellings remain **PROPOSED / NEEDS_REVIEW**.  
**Task:** Research and implement a separate Sport Complex feature, keeping the existing card game fully playable.

## 1. OWNER-LOCKED requirements — do not silently change

1. There are **four distinct Auto Sim sports**: Football, Basketball, Car Racing, Motorcycle Racing. **Every competitive game is automatic** after the player makes pre-event selections. No manual control during the simulation.
2. **All four sports must use real-world inspirations researched from reliable, preferably primary/official sources**—not only football. This covers athletes, drivers/riders, team/coach or constructor, vehicles, real-life tactics, tracks or arenas, gameplay-relevant performance characteristics and event structures. **Display only new, funny parody identities and original assets**. Real references and source URLs stay in private design metadata, not player-facing brand promotions.
3. Every sport has a **separate Gacha banner/pool**; avoid mixing ownership or pity counts across sports. All use the **existing one canonical G wallet** used by the main game. No separate sports currency.
4. **Card rarity matches the current Avatar rarity: `N / R / Epic / EX`.** Do not invent a fifth tier; architect IDs/manifests so tiers can expand later. Do not change the Action rarity system.
5. **Football:** eleven cards per side including a goalkeeper; 11 vs 11 on a real football-style pitch, selectable formations and role positions, formation strengths/weaknesses grounded in research, team coach with a passive effect, pre-match lineup, stamina. Card stats exactly **Power / Def / Speed / Sta / Acc**.
6. **Basketball:** analogous structure with **5 on court per side**, a separate basketball gacha, researched player/coach/team/arena and basketball-specific tactics. Card stats exactly **Shooting / Def / Spd / Sta**. Auto substitutions/bench may be added as an editable proposal.
7. **Car Racing:** a separate racing gacha and **2 competing car entries per team**. Card stats exactly **Top Speed / Accel / Handling**. Full auto simulation and preparation screen.
8. **Motorcycle Racing:** analogous to Car Racing with **2 rider/bike entries per team**, its own motorcycle gacha, and **Top Speed / Accel / Handling**. Full auto simulation.
9. Visual identity must follow the existing Comedy Fantasy/VR card-game direction. **Web-playable, phone-landscape first**, fixed-aspect world map, all artwork replaceable via asset manifest. Do not merge unauthorized art PR #9 or rewrite existing card-game engine.

## 2. Crucial research-to-parody rule — applies to EVERYTHING

Each source-inspired roster, team, coach, car, bike, venue, tactic or track needs:

| Field | Meaning | Example |
|---|---|---|
| `source_identity` | Actual real-world reference; internal design metadata | Lionel Messi |
| `parody_display_name` | Original game identity; reviewed for distinguishability | **Lion Messo** |
| `real_world_source_url` | Direct official source URL | `mlssoccer.com` player/stat page |
| `source_snapshot_date` | When evidence was obtained | `2026-11-20` |
| `source_season_or_event` | Time/competition to avoid false comparisons | `MLS 2026` |
| `verified_raw_metrics` | Actual metric with unit and context; nullable | 26 goals, 2026 MLS Golden Boot |
| `game_rating` | Editable design-normalized value, **not an official fact** | `null` until calibrated |
| `record_status` | `FACT_VERIFIED` / `DATA_MISSING` / `PROPOSED` | Separate per field |
| `owner_lock_state` | `LOCKED` only if owner confirmed the exact choice | `PROPOSED` for these parody examples |

- Never fabricate a real-world number, misattribute a past season as current, or pretend a normalized 0–100 gameplay stat is an official athlete rating.
- Evidence-derived scores need a documented, position/role-aware normalization and date-stamped comparable sample; if source metric is unavailable, use `null / DATA_MISSING`, and an **explicitly labeled balance placeholder** only if the engine requires it.
- Parody names must be visually and conceptually original. Do **not** reproduce real player faces, photos, official logos, kit/livery trade dress, sponsor decals, protected event branding, exact circuit geometry, or imply endorsement. Parody alone does not guarantee commercial-use rights: conduct IP/licensing review before release.

## 3. Football: facts, proposed starting roster and sim design

**Real rules:** IFAB Law 3 confirms at most 11 per team including a goalkeeper; Law 7 is two 45-minute halves; offside in Law 11 requires active involvement, not merely standing ahead. Sources: [IFAB players](https://www.theifab.com/laws/latest/the-players/), [duration](https://www.theifab.com/laws/latest/the-duration-of-the-match/), [offside](https://www.theifab.com/laws/latest/offside/).

**Starter examples / PROPOSED names (all researched):**

| Position proposal | Real reference | Fantasy-parody name | Official evidence reference |
|---|---|---|---|
| GK | Thibaut Courtois | Theo Court-Tea | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250011668--thibaut-courtois/) |
| RB | Achraf Hakimi | Ash-Raf Haki-Mi | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250088061--achraf-hakimi/) |
| CB | Virgil van Dijk | Virgil Van Brick | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/50327420--virgil-van-dijk/) |
| CB | Willian Pacho | Willy Patchwork | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250174126--willian-pacho/) |
| LB | Nuno Mendes | Noodle Mendez | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250136465--nuno-mendes/) |
| DM | Rodri | Rodri-Go Round | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250082664--rodri/) |
| CM | Pedri | Pedri-Pasta | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250143693--pedri/) |
| AM | Jude Bellingham | Jude Belly-Ham | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250128377--jude-bellingham/) |
| LW | Vinícius Júnior | Vinnie Juicebox Jr. | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250121533--vinicius-junior/) |
| ST | Erling Haaland | Earl Haa-Landlord | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250103758--erling-haaland/) |
| RW | Lamine Yamal | Lemon Yammal | [UEFA stats](https://www.uefa.com/uefachampionsleague/clubs/players/250176450--lamine-yamal/statistics/) |
| ST/LW | Kylian Mbappé | Killian Map-Pay | [UEFA profile](https://www.uefa.com/uefachampionsleague/clubs/players/250076574--kylian-mbappe/) |
| ST/RW | Lionel Messi | **Lion Messo** | [MLS 2026 Golden Boot](https://www.mlssoccer.com/news/inter-miami-cf-forward-lionel-messi-wins-2026-mls-golden-boot-presented-by-audi) |

Research five contextual formations: **4-3-3, 4-2-3-1, 3-5-2, 4-4-2, 3-4-3**; use FIFA/UEFA tactical analyses. They are not guaranteed rock-paper-scissors wins: account for width, overload, role suitability, tired wingbacks, central cover, transitions and press. Sources: [FIFA analysis](https://inside.fifa.com/tournaments/mens/mensolympic/tokyo2020/news/analysing-the-olympics-attacking-success-stories), [UEFA tactical example](https://www.uefa.com/uefaconferenceleague/news/0299-1da976b7409d-0bab90537314-1000--uefa-conference-league-tactical-analysis-how-real-betis-/), [UEFA 4-4-2](https://www.uefa.com/news-media/news/01de-0f8e489e9402-ca60279b93b5-1000--graham-taylor-s-4-4-2/). Coaching parodies: **Pepper Gourd-ola** / Pep Guardiola (positional build), **Hansy Flicker** / Hansi Flick (high line), **Tony Count-Té** / Antonio Conte (wingback 3-back), **Carlo Anchovy-Lotti** / Carlo Ancelotti (adaptation), each team passive **PROPOSED**. Distinct parody club/venue options: Royal Meringue FC / Real Madrid, Catalonia Coffee Club / Barcelona, Metro Blueprints Athletic / Man City, Liver-Pool Noodles / Liverpool. Sources are in the editable workbook.

`Power/Def/Speed/Sta/Acc` mapping: role-relative per-90 goals/shots, tackles/recoveries/GK saves, official measured top speed, minutes/distance covered, pass/shot accuracy. Small-sample shrinkage and position-specific calibration needed. The mapping itself is **PROPOSED**. Sim pre-match 11 active + optional bench and eligible coach, positional legality, seeded minute-by-minute events, fatigue, substitutions, injury/foul simplifications, extra-time/tie rules per mode, full event log + replay speed.

## 4. Basketball: facts, proposed roster and sim design

FIBA **Official Basketball Rules 2026** became effective 1 Oct 2026. A team fields **5 players**, normal FIBA game is **4 × 10 minutes** (5-minute overtime). The rulebook governs 24-second shot clock, 8-second backcourt advance and five personal fouls. Source: [FIBA announcement](https://about.fiba.basketball/en/news/fiba-official-basketball-rules-2026-to-take-effect-october-1) and [official resource hub](https://about.fiba.basketball/en/services/resource-hub/downloads).

Examples (names PROPOSED): Stephen Curry → **Stew Currywurst**; Nikola Jokić → **Nikola Yogurt**; Victor Wembanyama → **Victor Wobble-yama**; Shai Gilgeous-Alexander → **Shy Gorgeous Salamander**; Giannis Antetokounmpo → **Yannis Alphabet-Soup**; LeBron James → **LeBrawn Jams**; Caitlin Clark → **Kaitlyn Cluck**; A'ja Wilson → **Ay-Jay Wobble-Son**; Breanna Stewart → **Brianna Stew-Pot**; Angel Reese → **Angel Rice-Bowl**. Verified season-tagged source URLs in workbook (NBA/WNBA only). Coaches: Steve Kerr → **Chef Stevie Stir**; Gregg Popovich → **Gregg Popcorn-Vich** (former Spurs head coach since May 2025, do not claim active HC); Becky Hammon → **Becky Ham-Bun**.

Basketball-specific pre-match: 5 starters with PG/SG/SF/PF/C positional assignment, configurable bench/rotation, coach passive, offense pace and defensive scheme. Study **man-to-man, zone 2-3 and matchup zone** (FIBA World Association of Basketball Coaches manuals); apparent strengths/risks are gameplay **inferences**, not official fixed bonuses. Sources: [FIBA Level 1 manual](https://assets.fiba.basketball/image/upload/documents-corporate-wabc-coaching-level-manuals-level-1-eng.pdf), [Level 2](https://assets.fiba.basketball/image/upload/documents-corporate-wabc-coaching-manual-level-2-eng.pdf). Auto possessions: pass/shot/turnover/foul/rebound, scoring, substitution, fatigue, OT, win/loss. `Shooting/Def/Spd/Sta` normalize role-specific, season-matched verified NBA/WNBA stats; season and competition mixing needs separate baselines.

## 5. Car Racing: facts, proposed roster and sim design

FIA 2026 regulations and F1 guides establish **2 cars per team**, team-points aggregation and tyre/weather/pit strategy. Sources: [FIA general provisions](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_a_general_provisions_-_iss_02_-_2026-02-27.pdf), [F1 Constructors](https://www.formula1.com/en/latest/article/the-beginners-guide-to-the-f1-constructors-championship.66nTfWSqrUYv3bnbosPkHV), [F1 tyres](https://www.formula1.com/en/latest/article/the-beginners-guide-to-f1-tyres.61SvF0Kfg29UR2SPhakDqd).

Real F1 drivers (2026) → proposed parody: Lando Norris → **Lando Nori-Rice**; Oscar Piastri → **Oscar Pie-Astro**; Charles Leclerc → **Charlie LaCrêpe**; Lewis Hamilton → **Lewie Ham-a-Ton**; George Russell → **Georgie Rustle**; Kimi Antonelli → **Kimi Anti-Noodle**; Max Verstappen → **Max Verstomper**; Isack Hadjar → **Isaac Hat-Jar**; Nico Hülkenberg → **Nico Hula-Burger**; Gabriel Bortoleto → **Gabe Burrito-Letto**; Carlos Sainz → **Carlos Saucez**; Alexander Albon → **Alex All-Bun**. Real roster official [F1 drivers](https://www.formula1.com/en/drivers).

Constructors/car models as **original game designs**, inspired by 2026 F1: McLaren MCL40 → **Papaya Peel Racing / Zesteroid V1**; Ferrari SF-26 → **Scarlet Spaghetti Works / Pasta Rocket**; Mercedes W17 → **Silver Spoon GP / Teaspoon Turbo**; Red Bull RB22 → **Thunder Moo Motorsport / Moo-Boost**; Audi R26 → **Noodle Torque Racing / Pretzel Drive**; Williams FW48 → **Royal Blueberries GP / Berry Burner**. Tracks: Monza → **Mozza Speedway**, Monaco → **Monocle Harbor Loop**, Suzuka → **Sushi-Zag Circuit**, Silverstone → **Silver Spoonstone**, Spa → **Spa-ghetti Summit**, Singapore Marina Bay → **Singa-Pour Night Loop**. Official F1 circuit sources and full reference table in separate Auto Racing research appendix.

`Top Speed`: session/track-normalized official speed-trap observations; **not** universal physical speed. `Accel`: only comparable controlled longitudinal telemetry, otherwise `DATA_MISSING`. `Handling`: measured corner segments, otherwise `PROXY_UNVERIFIED`. **Do not invent real-world Accel/Handling measurements.** Model two car-driver pairs, editable tyre/setup/pit risk, seeded lap/sector events, qualifying, optional Sprint and championship, result and G reward. Exact balance/odds proposed. Important: timing/telemetry/image rights need review before redistribution.

## 6. Motorcycle Racing: facts, proposed roster and sim design

Official 2026 MotoGP has 11 two-rider teams; manufacturers Ducati, Aprilia, KTM, Yamaha, Honda. Yamaha's 2026 YZR-M1 is V4. MotoGP riders, teams, tyre/strategy/track sources are in [official roster](https://www.motogp.com/en/riders/), [teams](https://www.motogp.com/en/teams), and [rules overview](https://www.motogp.com/en/news/2025/03/11/what-are-the-motogp-rules-a-complete-overview/521386).

Real riders → proposed parody: Marc Márquez → **Mako Mayhem**; Francesco Bagnaia → **Paco Bagnetti**; Fabio Quartararo → **Fabio Fourturn**; Pedro Acosta → **Pedro Acoaster**; Jorge Martín → **Jorge Martian**; Brad Binder → **Brady Blender**; Marco Bezzecchi → **Marco Buzzachi**; Joan Mir → **Joan Mirage**; Toprak Razgatlıoğlu → **Torak Razzle**; Ai Ogura → **Ayo Oguramen**. Real riders' [MotoGP profiles](https://www.motogp.com/en/riders/).

Real bikes/manufacturers → original parody: Ducati GP26 → **Red Quack Works / RubberDuck V-Quack**; Aprilia RS-GP26 → **Purple Petal Moto / Petal-26**; KTM RC16 → **Orange Anvil Motors / Hammer Sixteen**; Yamaha YZR-M1 V4 → **Blue Melody Works / Echo V4**; Honda RC213V → **Sakura Forge / Phoenix 213**. Tracks: Mugello → **Mushgello Valley**; Sachsenring → **Sausage Ring**; Phillip Island → **Pillow Island**; Buriram → **Buri-Ramen Raceway**; Assen → **Assen S-Bend**; Circuit of the Americas → **Corners of Chaos**. Exact track source URLs and proposals in separate motorcycle appendix.

Make **two active rider+bike entries per team**. Note: in actual wet flag-to-flag races each rider may have a spare bike; game's 2 entries means two riders, **not** real spare-bike inventory equivalence. Setup/tyres, GP/Sprint, qualifying and stochastic incidents are **PROPOSED** mechanics. Bike physical measurements/acceleration data not verified in a common comparable official dataset: keep rating fields `null` until owner-reviewed game calibration. Do not claim fictional high/medium/low traits are fact.

## 7. Unified systems / schema / integration

- Use namespace `SPORT_FOOTBALL_*`, `SPORT_BASKET_*`, `SPORT_CAR_*`, `SPORT_MOTO_*` for card IDs and distinct `sport_type` discriminator. Respect existing current save schema and data registry; no ID collisions.
- `G`: one wallet service, canonical transaction ledger, atomic grant/spend, idempotent `event_result_id`; every sport shares main game purchasing power and G balance. Keep reward/cost values **PROPOSED**, avoid new inflation without economy sign-off.
- Gacha: independent four sport banners and counters, existing pity principles retained unless conflicting; do not set odds/pity/cost without confirmed settings. Optional rider vs vehicle sub-banner is a **PROPOSED** owner choice, not a locked fifth currency.
- Rarity for all sport cards `N / R / Epic / EX` inherited from Avatar, tier lookup config-driven; preserve Action card `FAC` separately. Expose evidence, parody and metadata in editable JSON/schema and XLSX, not buried in UI JSX.
- `Auto Sim`: seeded reproducible event simulation with per-event snapshots, optional fast-forward vs replay, event logs, outcome reasons, re-run seed determinism, safe save/load, no double G payout.
- Pre-match UI for all sports, clear stamina/recovery displays for athletes; do **not** add `Sta` as a fourth racing card stat. If long-race fatigue and tyre wear exist, keep them separately as PROPOSED dynamic mechanics.
- Large-touch-target landscape web layout; all images in replaceable asset manifest; no blurry scaled cards. Use `building_sports_complex.png` existing art if approved and present, without overriding world map layout. No embedded unofficial faces/brands.
- Implement in separate **Draft PRs** by subdomain if parallel: schema/gacha/wallet, football sim, basketball sim, racing/moto sim, landscape UI/art, QA. Avoid conflicts and only merge after explicit owner approval of PRs; never merge #9 by assumption.

## 8. Acceptance / QA checklist

1. All four entrances accessible from Sport Complex; original main game continues to work and existing saves load.
2. Four banners separate; shared G balance visible across all, transactions atomic, no duplicated rewards, pity per-banner, no cross-sport pulls.
3. Football 11 distinct starters inc GK; positions/formation change recognized; stamina and coach passive affect sim; result is deterministic with a fixed seed.
4. Basketball always 5 on court, substitutions and foul-out cannot create 4/6 players; separate 4 stat fields; deterministic outcome and proper draw/OT behavior.
5. Auto car race two active cars, auto bike race two active riders/bikes; both contribute to team result, individual DNFs independent; 3 stats exactly.
6. All displayed sports entity names parody only, not direct official logos/photos; all sourced internal identities have URL + snapshot; no false `OFFICIAL` rating values.
7. Complete Deck/Hideout/Battle/Rewards loop regression test; small landscape phone screens, no overlap or clipped controls, fixed world-map aspect.
8. Unit + integration + accessibility/Playwright smoke tests. Report status `RESEARCH`, `PROPOSED`, `QA_PASSED`, `OWNER_APPROVED`, `INTEGRATED` distinctly; no automatic promotion of `PROPOSED` to `LOCKED`.
9. Each Draft PR shows source notes, screenshots and G economy impact; return a playable HTML preview and clear review summary.

## 9. Open decisions — do not block parallel development

- Exact stat formulas/0–100 scaling, tournament length, payout, odds/pity, card acquisition split (driver and vehicle separately or combined), race pit risk, bench size, coach drop rates, card art & athlete likeness policy: **PROPOSED / configurable**.
- Source licenses for telemetry/stat tables; use research for modeling without copying protected datasets into game if permission is unclear.
- Football lineup includes Messi as owner-given example; other proposed names not automatically locked.

## 10. COPY-READY PROMPT TO MIRA

> **MIRA — SPORT COMPLEX v0.6: FULL IMPLEMENTATION, OFFICIAL-RESEARCH-ANCHORED PARODY CONTENT**  
> Repo `sarantanyamongkolpong/comedy-fantasy-card-game`. First audit live branch/PRs and v0.5 rules, record exact integration base. Read this Owner Brief, editable `SPORT_COMPLEX_v0.6_RESEARCH.xlsx`, and the two appendix files. The last owner addendum **requires EVERY sport and ALL entity categories (athletes, coaches, teams, manufacturers/cars/bikes, venues/tracks, tactics) to derive from researched real-world inspirations and display original comedy parody identities**—football alone is not enough. Lock all owner requirements in §1, but leave proposed ratings/formulas/roster nicknames editable. Do not confuse real stats with game ratings, fabricate official measurements or use protected art/logos/likenesses. Implement four separate AUTO sports, four gacha banners with independent pity, `N/R/Epic/EX` sports rarity, **one existing shared G wallet**, Football 11v11 Power/Def/Speed/Sta/Acc + formation + coach, Basketball 5v5 Shooting/Def/Spd/Sta + tactics + coach, Car 2 entries and Moto 2 entries each Top Speed/Accel/Handling. All need prep screens, auto-sim, result, G rewards, save/load, phone-landscape original art assets. Parallelize by non-overlapping files when efficient; make Draft PRs and CI, keep source/audit logs, no silent PR merge or #9 art inclusion. Deliver browser-playable preview and screenshots. Preserve existing deck/battle loop. See acceptance §8; report actual passing test counts and any gaps honestly. Owner explicitly wants these additions now.

---

**Supporting official-source research:** `SPORT_COMPLEX_AUTO_RACING_RESEARCH.md`, `SPORT_COMPLEX_MOTORCYCLE_RESEARCH_v01.md`. Other facts and URLs are embedded in this document and workbook. No sport gameplay code was modified by Dream in preparing this brief.
