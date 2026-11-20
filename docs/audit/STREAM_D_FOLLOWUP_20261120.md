# Stream D follow-up — 20 Nov 2026

This note does not edit `docs/audit/BASELINE_AUDIT_20261120.md` on `core/v05-design-source`.

- Base remains `integration/v05-core-base` @ `72c7deb`.
- Design source moved from `1ba6a11` to `51df543` (reference-card PNGs only). Sheet statuses were not rewritten here.
- Owner t253u (20 Nov 2026, 16:10 ICT) locked three items that the baseline audit still listed as blocking:
  1. Justins are new characters `AVT_*_002` with `designRef` `AV_EX01`–`AV_EX04`. `AVT_*_001` stays.
  2. Pity counters are per banner. Epic and top are separate. An Epic hit resets Epic only. An EX/FAC hit resets both. Companion Epic is its own counter. Thresholds stay 100 / 200 / 100.
  3. `pow` maps to `atk` 1:1 and `legacy.pow` is kept.
- `origin/core/v05-data` is `0b37c05`. `origin/core/v05-engine` is `07b1b2f`. `origin/core/v05-web` still has no remote ref.
- No merge was pushed. Local merge results are in `docs/qa/v05/INTEGRATION_LOG.md`.
