# v05_Action_Schema

> ACTION CARD DATA CONTRACT

Source: `docs/design/v05/source/Card_Battle_Design_Master_v0.5_20261120.xlsx` (sha256 `f4a23a97c11e8a1b…`). Verbatim import — do not edit here; edit the sheet and re-import.

| Field | Data Type | Meaning | State | Example/Condition | Priority |
|---|---|---|---|---|---|
| Action_ID | string | Unique ID | REQUIRED | Example ACT_0001 | P0 |
| Name | string | Card display name | REQUIRED | Editable localization | P0 |
| Type | enum | ATK / DEF / Skill | REQUIRED | Never Tactic legacy | P0 |
| Rarity | enum | N / R / Epic / EX / FAC | REQUIRED | FAC is high-tier faction action | P0 |
| Faction_Requirement | enum\|null | One of four factions if faction-locked | OPTIONAL | FAC gate check; generic null | P0 |
| Cost_AP | integer | 0..5 AP | REQUIRED | Do not invent production costs | P0 |
| Target_Rule | enum | Self / Ally / All_Allies / Enemy / All_Enemies / Card / Pile | PENDING | Per card | P0 |
| Effect_Spec | object | typed effect list, conditional triggers, values | REQUIRED | No arbitrary raw eval | P0 |
| Duration_Turns | integer\|null | Timed statuses e.g. Regen 2 | OPTIONAL | Tick semantics config | P0 |
| On_Resolve_Zone | enum | Discard or Void | REQUIRED | Default Discard | P0 |
| Zone_Recovery | object\|null | Select retrieval from Discard/Void and destination | OPTIONAL | Per card overrides | P0 |
| Can_Play | predicate | Faction match / target / AP / effect conditions | REQUIRED | Validation + UI feedback | P0 |
| Asset_Ref | string\|null | Verified artwork path in repository | OPTIONAL | No invented art paths | P1 |
| Version_And_Status | string | Data version and LOCKED/PROPOSED/PENDING | REQUIRED | Owner approval semantics | P0 |
