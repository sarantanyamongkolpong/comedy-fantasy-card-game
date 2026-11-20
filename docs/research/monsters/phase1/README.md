# Monster research Phase 1 — integration outputs (PROPOSED)

Built by Mira on `research/monster-phase1-int` from agents 01–10. Nothing here is QA_PASSED, LOCKED or OWNER_APPROVED. Expansion to 370 is NOT started (awaiting Owner).

Rebuild:

```bash
P=docs/research/monsters
A="--input $P/creative/parody/sample_normal_elite.json --input $P/creative/bosses/sample_bosses.json --lore $P/lore/sample_lore_links.json --qa $P/phase1/qa_flags.json"
node tools/research/monsters/validate.mjs $A
node tools/research/monsters/build-workbook.mjs $A --out $P/phase1/Monster_Research_Phase1.xlsx
node tools/research/monsters/export-json.mjs $A --out $P/phase1/monsters.import.json
```

Integration changes to agent 09 tools (no creative text changed):
- Sheet `Duplicate / IP Risk Audit` renamed `Duplicate & IP Risk Audit` (Excel forbids `/` in sheet names).
- `adapt.mjs` reads agent 07 boss records (BOS-* ids → MON-MNB/MJB/WLB/SCB, boss fields inside `creative`, `researchConfidence`, `publicDomainTradition`, `elementAttribute`) and agent 08 lore documents (`entries` of links with `hook`, `originId`, `environmentId`).
- `assemble.mjs` appends the agent 08 hook to the creative agent's lore summary instead of overwriting it, and does not overwrite an existing tower environment.
- `qa_flags.json` carries agent 10 findings as notes + QA ipRisk only (no status change).
