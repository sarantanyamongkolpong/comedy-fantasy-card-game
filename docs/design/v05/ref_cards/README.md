# Reference card artworks — four Epic Avatars (v0.5)

**Owner-approved 20 Nov 2026 (Asia/Bangkok) as REFERENCE card artwork** (Owner message t248u).

| File | Avatar (v05_Avatar_Examples) | Active (printed) | Passive name (printed) |
|---|---|---|---|
| `REF_CARD_JUSTIN_CASE.png` | AV_EX01 JUSTIN CASE — Aegis Dominion / Tank / Epic | +2 Shield • Taunt 1 turn | (as printed on card) |
| `REF_CARD_JUSTIN_TIME.png` | AV_EX02 JUSTIN TIME — Phantom Blades / DPS / Epic | Reckless Rush | Lucky Slash |
| `REF_CARD_JUSTIN_THEORY.png` | AV_EX03 JUSTIN THEORY — Celestial Nexus / Magic / Epic | Arcane Formula | Eureka! |
| `REF_CARD_JUSTINA_MOMENT.png` | AV_EX04 JUSTINA MOMENT — Sanctuary Order / Support / Epic | Saving Grace | Moral Support |

Rules for using these files:

- They are **reference artwork only**. They have **not yet been decomposed into modular assets** (no sprite layers, no card-frame split, no Asset IDs yet). Do not register them in the Asset Manifest as production assets until they are split and QA'd.
- The stats/skills printed on the cards match `v05_Avatar_Examples`, **but the sheet status stays exactly as written**: `Name/Faction LOCKED; Stats/Skills PROPOSED` (Justin Case, Justin Time, Justin Theory) and `Female + Name + ACTIVE EFFECT LOCKED; other stats/skills PROPOSED` (Justina Moment). The printed art does **not** promote any stat or skill to LOCKED.
- The star count printed on the cards is illustrative (sheet note on AV_EX01; brief §3) and is **not** a star cap.
- Existing repo Character/Asset IDs (`AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, `AVT_SAN_001` and their assets) are unchanged; see the mapping proposal in `docs/audit/BASELINE_AUDIT_20261120.md` §3.

## Files added (20 Nov 2026, 16:2x ICT)

The four PNGs (1024×1536) come from Dream's package `Justin_Approved_Cards_4_v01.zip` (Google Drive file id 1Erc1fWUaFb9JG-I1T2uXBJnAYbLeT3LG), renamed to the `REF_CARD_*` names above. Dream's original README is kept verbatim as `README_REFERENCE_DREAM_v0.1.md`.

Owner decision t253u (20 Nov 2026): the four Justins are NEW characters, separate from the existing `*_001` avatars. The `AVT_*_002` numbers are the implementation IDs in use.
