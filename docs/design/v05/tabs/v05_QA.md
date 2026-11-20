# v05_QA

> MIRA ACCEPTANCE TEST TRACKER

Source: `docs/design/v05/source/Card_Battle_Design_Master_v0.5_20261120.xlsx` (sha256 `f4a23a97c11e8a1b…`). Verbatim import — do not edit here; edit the sheet and re-import.

| ID | Feature | Expected Behavior | Priority | Test Evidence Required | Current Result |
|---|---|---|---|---|---|
| QA-01 | Deck/Hand | 30 cards, 5 initial, leftover retain, draw to 5, draw>5 via effect | P0 | Expected deterministic tests | NOT RUN |
| QA-02 | Discard | Mandatory over-cap free; voluntary own turn 1 AP | P0 | AP & hand checks | NOT RUN |
| QA-03 | Recycle/Void | Draw empty shuffles only Discard, Void remains excluded | P0 | Zone integrity tests | NOT RUN |
| QA-04 | Faction | Mixed team and deck, generic action, FAC faction gate | P0 | Permission matrices | NOT RUN |
| QA-05 | AP/Turn | AP resets 5; cost 0-5; manual End even at AP=0 | P0 | No auto End, cancellation free | NOT RUN |
| QA-06 | Skill/Regen | Active requires Action; Justina Regen +3 over two turns | P0 | Tick/lifecycle tests | NOT RUN |
| QA-07 | Win/Lose | All enemy dead win; all own 4 dead lose | P0 | Result + rewards once | NOT RUN |
| QA-08 | Gacha | Epic pity 100, top 200, Companion Epic 100 | P0 | No invented rates | NOT RUN |
| QA-09 | Storage | No capacity boost solely from house tier; installed furniture pools | P0 | Buying/uninstalling/check caps | NOT RUN |
| QA-10 | UI/Mobile | Map→Home/Gacha/Battle→Rewards, touch controls, piles viewer | P0 | Manual smoke on narrow viewport | NOT RUN |
| QA-11 | Git/PR | No unapproved merge/deploy, all commits pushed, conflict map | P0 | Mira evidence URLs | NOT RUN |
