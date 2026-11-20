# Football Legends v0.7 — integration preparation

Owner decision 2026-11-21: the 62-player slate (`SPC_FOOTBALL_ATH_029`–`090`), parody names, rarity, teams, positions, and all five stats are approved as submitted. Everything stays `PROPOSED` / `BALANCE_PLACEHOLDER`. No artwork was produced. Draft only; no merge or deploy without Owner approval.

## What changed (technical only)

| File | Change |
| --- | --- |
| `content/v06/sport/football/athletes.json` | 62 cards appended; the 28 existing cards are byte-identical |
| `content/v06/sport/tuning.json` | `statsByCardId` / `rarityByCardId` mirror the 62 cards verbatim (validator source of truth) |
| `web/sport/live/content.public.json` | Rebuilt with `tools/sport-web/build-public-content.mjs` (allow-list: no `peakEra`, no provenance) |
| `web/sport/art-manifest.json` | 62 placeholder portrait slots via `tools/sport-web/add-content-art-slots.mjs` (`file: null`, no art) |
| `tools/validate-sport-provenance.mjs` | Accepts `provenance.status: PRIVATE_CROSSWALK_PENDING` in place of a public `real` block, and rejects such a card if it also carries `real` |
| `tests/sport/data/provenance.test.mjs` | Card count 104 → 166 |

Schema fixes applied to the submitted file (values unchanged):

- `role` `LBLWB` / `RBRWB` → `LB/LWB` / `RB/RWB` (existing format). The submitted value is kept in the private sidecar.
- `artSlot` `SPC_FOOTBALL_ATH_029PORTRAIT` → `art.slot` `SPC_FOOTBALL_ATH_029_PORTRAIT`, `placeholder: true` (existing `{cardId}_PORTRAIT` convention).
- Card-level `balance: BALANCE_PLACEHOLDER` added (existing field).
- `peakEra` removed from public data (real-career identity hint) and kept in a private sidecar outside the repo.
- `teamId`, `position`, `designation` kept as new additive fields.

Checks: 90 unique football ids and 90 unique portrait slots; all 62 records match the submission field-for-field (stats, rarity, team, teamId, position, designation, parody name). `validate-sport-provenance` ok (166 cards); `validate-data` PASS; `content.public.json --check` current; `node --test` 492 pass / 1 fail (same pre-existing QA-10 `createMatch` failure as `integration/v06-sport` @ `e41f758`).

## Open technical issues (not blocking the data merge)

1. Rarity counts in the Owner Decision Report (12 EX / 30 Epic / 16 R / 4 N) do not match the JSON (15 EX / 31 Epic / 16 R / 0 N). The JSON is preserved.
2. Roster report puts Best-Beast and Maldini-Melon under Gherkin Rovers rotation; the JSON has them in Banquet Select XI. The JSON is preserved.
3. `SPC_FOOTBALL_ATH_075` has role `LB/LWB` but `position.secondary` `RWB`. Preserved.
4. The 4 new teams have no playable lineup (`teams.json` lineups are one home/away pair) and the football gacha pool still uses preview stand-ins, so the 62 cards are data-only until lineups and pool membership are decided.
5. The private crosswalk is not in the repo, so CI cannot run its real-name leak check on these 62 parody names. Several names keep a real full name intact with a suffix.
