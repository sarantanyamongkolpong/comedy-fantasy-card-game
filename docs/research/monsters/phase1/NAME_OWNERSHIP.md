# Name ownership — Monster research

Rule (Owner t282u, **OWNER_DECIDED**): when two teams propose the same parody name, the team that proposed it first keeps it. One owner per name.

## Tub Critic

| | Agent 03 (Eastern) | Agent 06 (Parody) |
|---|---|---|
| Entry | `PITCH-03-02` “Tub Critic” / ลิ้นอ่าง | `M06-NB-054` “Tubcritic” / อ่างวิจารณ์ (name bank, not in the 30 sample) |
| File | `docs/research/monsters/sources/03-eastern/pitches.json` | `docs/research/monsters/creative/parody/name_bank.json` |
| First commit containing the name | `af596cb` on `research/m03-eastern` | `77c558b` on `research/m06-parody` |
| Commit time (author = committer) | 2026-11-20 13:15:15 UTC = **20:15:15 ICT** | 2026-11-20 13:21:58 UTC = **20:21:58 ICT** |

Evidence: `git log --all -i -G'tub ?critic' --reverse` lists `af596cb` first, then `77c558b`, then QA `1d6a317` (which only reports the clash). Both entries draw on the same inspiration `INS-03-039` (Akaname).

**Owner of “Tub Critic”: agent 03 (`PITCH-03-02`).**

**Needs a new name:** agent 06 `M06-NB-054` (“Tubcritic”). Marked `nameStatus: NEEDS_NEW_NAME` in the name bank. The replacement name is not invented here; agent 06 should propose one, and QA should dedupe it.
