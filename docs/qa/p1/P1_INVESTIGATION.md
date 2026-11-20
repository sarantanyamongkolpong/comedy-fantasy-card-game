# Phase 1 — PR #54 battle investigation (flat_atk, AUTO Regen, Bulwark Shield +2)

Status: INVESTIGATION. No balance, rule, card, or avatar value was changed. Bulwark stays `MVP_PROVISIONAL` (Owner t282u). Nothing here is LOCKED.

## Reproduction

| Field | Value |
| --- | --- |
| Source SHA | `a6085bfd4121e2935b4004e5b46d523eb1b65d08` (`final/damage-flat-atk`, src/content/web clean) |
| Node | v22.23.5 |
| Command | `node tools/sim/p1-diagnostics.mjs --seeds 100` and `--seeds 500` |
| Rule config sha256 (flat_atk) | `8712c294d93216eb6171d7662099e2be918ad7b5047226075a57ccffe94092ff` |
| Matchup | Mirror Justins, content starter deck (same input as `tools/sim/flat-atk-report.mjs` `mirror_justins_starter`), both sides `runAutoTurn`, turn cap 400 |
| Evidence | `run-100/` and `run-500/`: `provenance.json`, `summary.json`, `per-seed.json`; `run-100/trace-seed-8.json` (last 40 turns of a capped seed) |

The 100-seed rerun reproduces the handoff numbers exactly: Shield +2 = 43% player win, avg 37.1 turns, p95 60, max 401 (capped); DEF +1 = 54%, 25.0, 53, 101.

Variants: `shield2` = default; `legacy_def1` = `damage.bulwark.enabled: false`; `swapped` = `shield2` with the two teams' side order swapped.

## Results (500 seeds)

| Variant | Finish % | Player win % | Starter win % | Avg turns | Median | p95 | Max | Capped seeds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| shield2 | 96.4 | 46.8 | 65.8 | 44.2 | 27 | 104 | 401 | 18 |
| legacy_def1 | 100 | 50.0 | 65.2 | 26.6 | 21 | 67 | 163 | 0 |
| swapped | 96.4 | 49.6 | 65.8 | 44.2 | 27 | 104 | 401 | 18 |

## Findings

1. **No AUTO side bias.** Both sides run the same `runAutoTurn` policy. Over 482 decided shield2 matches the player share is 48.5% (95% CI ±4.5). Swapping side order mirrors every result. The 43% at 100 seeds is sampling noise. The handoff ablations (enemy no regen 60%, enemy no passives 74%) remove a mechanic from one side only, so they are not symmetry evidence.
2. **First-mover advantage is real.** The starting side wins about 65% under both Bulwark options. Equal team SPD in a mirror falls to the tie-break, which is `PENDING_OWNER`. This is a design question, not a defect.
3. **Shield +2 stacks without limit (root cause of capped matches).** The shield pool has no turn limit (`shield.policy`, RULES.md). Bulwark procs every turn start on all allies. In capped seeds the last Tank and Support carry shields of 270 to 282 at turn 400 (`trace-seed-8.json`), so no hit lands. DEF +1 is a 1-turn buff and never accumulates, which is why `legacy_def1` finishes 100%.
4. **Seed 34 test failure (`practice-auto.test.js`) is a Regen interaction under non-default presets.** With the test's practice roster, seed 34 stalls past turn 300 under `null` (legacy floor 1) and `floor_25_pct_atk`, and ends at turn 39 / 73 under `floor_50_pct_atk` / `flat_atk`. On `integration/v05-final` it ends at 147 / 147 / 79 / 17. The stall is a Tank + Support 2v2: hits deal 1, and the new AUTO Regen at HP <= 50% heals 3 per tick. Bulwark is not involved (remap is flat_atk only). The test is left failing on purpose: it reports a real behaviour change.
5. **`passive chance follows the seeded stream` was a stale test.** It authors a passive named Bulwark, which flat_atk now remaps by name. The test now pins `damage.bulwark.enabled: false`. Engine behaviour is unchanged.

## Options for the Owner (not applied)

Scratch experiments, 100 seeds, same command, engine patched only in a throwaway copy:

| Option | Change | Finish % | Player win % | Avg turns | p95 | Max |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| A keep (current) | Shield +2 stacks forever | 98 | 43 | 37.1 | 60 | 401 |
| B non-stacking | Bulwark shield refreshes to 2, never adds | 99 | 44 | 39.2 | 136 | 401 |
| C expiring | Shield clears at the owner's next turn start | 100 | 51 | 29.3 | 58 | 214 |
| D revert | Bulwark stays DEF +1 (`bulwark.enabled: false`) | 100 | 54 | 25.0 | 53 | 101 |

Option C changes every shield, not only Bulwark (the starter deck has no other shield source, the engine sample deck does). The Regen stall under non-default presets (finding 4) needs its own answer: keep presets as-is and accept the stall there, add a turn limit, or cap Regen in AUTO.

## Owner decisions (2026-11-21, all MVP_PROVISIONAL, not LOCKED)

| Question | Decision | Where |
| --- | --- | --- |
| Bulwark / shield stacking | Option C: shields clear at the start of their side's next turn | `shield.expiry: 'start_of_next_own_turn'` (`'none'` = legacy) |
| Regen stall | Limit AUTO heal use | `autoPolicy.policies.balanced.maxHealCastsPerMatch: 3` (PROPOSED value; `null` = no limit; manual play not limited) |
| Who starts | Side with the single fastest avatar | `teamSpd.aggregation: 'max'`; equal max SPD still uses the seeded `spd-tie` stream (tie-break itself stays `PENDING_OWNER`) |

Results after the decisions are in `run-500-after/` (same command, committed SHA).
