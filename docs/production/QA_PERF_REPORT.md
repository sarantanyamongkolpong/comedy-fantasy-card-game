# QA and performance report

Agent H. Base `prod/wave-base` @ `7cbf071a15d2da747ba5f9c100696a805860271e`. Damage preset under test: `flat_atk` (Owner choice, MVP_PROVISIONAL). This file is the QA record. It does not mark the game PRODUCTION_READY, LOCKED, or OWNER_APPROVED.

Updated 2026-11-20T13:31:34.560Z.

## Baseline

Clean `npm test` / `npm run test:acceptance` on this checkout before Agent H tests are counted. Playwright was not installed for that run, so four `npm test` cases skip and four acceptance cases stay todo.

Clean totals are `node --test` and `npm run test:acceptance` with Agent H tests moved aside, so the regression suite does not count them. Playwright is not installed in the repo, so four browser tests skip and four acceptance entries stay todo. Node 20 wall time is longer because the battle matrix and Chrome coverage were running on the same machine.

| Command | Node | Tests | Pass | Fail | Skip | Todo | Cancelled | Exit | Duration |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `npm test` | v22.23.4 | 411 | 403 | 0 | 4 | 4 | 0 | 0 | 140.6s |
| `npm test` | v20.20.2 | 411 | 403 | 0 | 4 | 4 | 0 | 0 | 194.1s |
| `npm run test:acceptance` | v22.23.4 | 112 | 108 | 0 | 0 | 4 | 0 | 0 | 139.6s |
| `npm run test:acceptance` | v20.20.2 | 112 | 108 | 0 | 0 | 4 | 0 | 0 | 179.1s |


Named skips on the clean Node 22 run:

- AUTO uses the engine export and starts off
- enabling AUTO drives runAutoTurn without a manual card
- switching AUTO off during an action hands the turn back
- map opens Prep Battle and Start Battle is the labelled primary control

Named todos on the clean Node 22 run:

- OWNER-PLAT-04 world map anchors stay fixed across landscape viewports (expects `web/src/map/layout.js`, which this tree does not use; the live map is `web/js/map-layout.js`)
- QA-10 map layout export is the OWNER-PLAT-04 hook (same missing path)
- QA-10 e2e smoke Deck Battle Rewards — Playwright is not installed
- QA-10 full loop — Playwright or Chrome is not installed

The ownership note of 411/0/3 does not match this checkout. The measured total is 411 tests with 403 pass, 0 fail, 4 skip, 4 todo on Node 22.

## Battle simulations

Seeds recorded: **440**. Deterministic repeat of the first seed: **yes**.
Arena vs tower at seed 1: same turns **true**, same winner **true**, same playback frames **true** (tower 110 turns, arena 110 turns).
The only wired matchup is the content/v05 Justin starter team against an echo of itself. Mysterious Tower and Tournament Arena both use that roster. `flat_atk` is applied with `damage.preset` and is not the shipped default.

| Preset / mode | Matches | Decided | Stalls | Crashes | Turn min | Turn mean | Turn p95 | Turn max | CPU mean | Frames mean |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| current / tower | 220 | 220 | 0 | 0 | 41 | 93.22 | 147 | 195 | 2.2s | 508.3 |
| flat_atk / tower | 220 | 220 | 0 | 0 | 11 | 27.61 | 50 | 61 | 0.3s | 141.9 |

Estimated UI wall clock uses the measured median toast gap (**642.5 ms** per playback frame) times the frame count from the same AUTO loop the page runs. Engine CPU time is the headless simulation, not the animation.

| Seed | Preset | Turns | Frames | Winner | Stall | Crash | Engine CPU | Est. UI |
|---:|---|---:|---:|---|---|---|---:|---:|
| 1 | current | 110 | 601 | player |  |  | 3.3s | 386.1s |
| 2 | current | 89 | 487 | player |  |  | 2.1s | 312.9s |
| 3 | current | 98 | 538 | player |  |  | 2.2s | 345.7s |
| 4 | current | 57 | 304 | player |  |  | 0.7s | 195.3s |
| 5 | current | 73 | 398 | player |  |  | 1.2s | 255.7s |
| 6 | current | 148 | 808 | player |  |  | 4.5s | 519.1s |
| 7 | current | 86 | 461 | enemy |  |  | 1.8s | 296.2s |
| 8 | current | 115 | 626 | player |  |  | 2.9s | 402.2s |
| 9 | current | 99 | 541 | player |  |  | 2.2s | 347.6s |
| 10 | current | 133 | 740 | player |  |  | 3.9s | 475.4s |
| 11 | current | 195 | 1073 | player |  |  | 8.2s | 689.4s |
| 12 | current | 139 | 775 | player |  |  | 5.1s | 497.9s |
| 13 | current | 54 | 288 | enemy |  |  | 0.8s | 185.0s |
| 14 | current | 128 | 710 | player |  |  | 3.4s | 456.2s |
| 15 | current | 67 | 361 | player |  |  | 1.1s | 231.9s |
| 16 | current | 107 | 593 | player |  |  | 3.1s | 381.0s |
| 17 | current | 187 | 1034 | player |  |  | 6.9s | 664.3s |
| 18 | current | 105 | 585 | player |  |  | 2.7s | 375.9s |
| 19 | current | 112 | 612 | player |  |  | 2.6s | 393.2s |
| 20 | current | 81 | 443 | enemy |  |  | 1.6s | 284.6s |
| 21 | current | 63 | 332 | enemy |  |  | 1.0s | 213.3s |
| 22 | current | 91 | 496 | enemy |  |  | 1.8s | 318.7s |
| 23 | current | 93 | 504 | enemy |  |  | 2.2s | 323.8s |
| 24 | current | 59 | 311 | enemy |  |  | 0.9s | 199.8s |
| 25 | current | 125 | 700 | player |  |  | 3.2s | 449.8s |
| 26 | current | 107 | 585 | enemy |  |  | 2.7s | 375.9s |
| 27 | current | 63 | 336 | player |  |  | 0.9s | 215.9s |
| 28 | current | 41 | 212 | enemy |  |  | 0.5s | 136.2s |
| 29 | current | 75 | 408 | enemy |  |  | 1.5s | 262.1s |
| 30 | current | 103 | 562 | enemy |  |  | 2.2s | 361.1s |
| 31 | current | 87 | 477 | enemy |  |  | 1.7s | 306.5s |
| 32 | current | 106 | 582 | enemy |  |  | 2.4s | 373.9s |
| 33 | current | 51 | 267 | enemy |  |  | 0.7s | 171.5s |
| 34 | current | 147 | 811 | enemy |  |  | 4.9s | 521.1s |
| 35 | current | 91 | 504 | player |  |  | 1.8s | 323.8s |
| 36 | current | 84 | 454 | player |  |  | 1.6s | 291.7s |
| 37 | current | 61 | 326 | enemy |  |  | 0.9s | 209.5s |
| 38 | current | 105 | 586 | player |  |  | 2.9s | 376.5s |
| 39 | current | 87 | 473 | player |  |  | 1.7s | 303.9s |
| 40 | current | 110 | 605 | enemy |  |  | 2.7s | 388.7s |
| 41 | current | 103 | 564 | player |  |  | 2.4s | 362.4s |
| 42 | current | 146 | 806 | player |  |  | 4.9s | 517.9s |
| 43 | current | 105 | 579 | player |  |  | 3.5s | 372.0s |
| 44 | current | 106 | 585 | enemy |  |  | 4.4s | 375.9s |
| 45 | current | 63 | 334 | enemy |  |  | 1.6s | 214.6s |
| 46 | current | 45 | 232 | enemy |  |  | 0.6s | 149.1s |
| 47 | current | 123 | 683 | player |  |  | 3.1s | 438.8s |
| 48 | current | 84 | 461 | enemy |  |  | 1.6s | 296.2s |
| 49 | current | 108 | 599 | enemy |  |  | 2.4s | 384.9s |
| 50 | current | 85 | 469 | player |  |  | 1.7s | 301.3s |
| 51 | current | 56 | 296 | enemy |  |  | 0.8s | 190.2s |
| 52 | current | 108 | 592 | enemy |  |  | 2.4s | 380.4s |
| 53 | current | 41 | 217 | player |  |  | 0.4s | 139.4s |
| 54 | current | 137 | 759 | enemy |  |  | 3.8s | 487.7s |
| 55 | current | 130 | 713 | player |  |  | 3.4s | 458.1s |
| 56 | current | 51 | 271 | player |  |  | 0.6s | 174.1s |
| 57 | current | 101 | 553 | enemy |  |  | 2.2s | 355.3s |
| 58 | current | 83 | 446 | enemy |  |  | 1.6s | 286.6s |
| 59 | current | 48 | 245 | player |  |  | 0.5s | 157.4s |
| 60 | current | 115 | 635 | player |  |  | 2.7s | 408.0s |
| 61 | current | 105 | 568 | enemy |  |  | 2.3s | 364.9s |
| 62 | current | 134 | 743 | enemy |  |  | 3.7s | 477.4s |
| 63 | current | 49 | 250 | enemy |  |  | 0.6s | 160.6s |
| 64 | current | 59 | 314 | player |  |  | 0.8s | 201.7s |
| 65 | current | 89 | 488 | enemy |  |  | 1.8s | 313.5s |
| 66 | current | 124 | 683 | player |  |  | 3.1s | 438.8s |
| 67 | current | 101 | 547 | enemy |  |  | 2.2s | 351.4s |
| 68 | current | 61 | 323 | player |  |  | 0.8s | 207.5s |
| 69 | current | 59 | 316 | player |  |  | 0.8s | 203.0s |
| 70 | current | 169 | 923 | enemy |  |  | 5.6s | 593.0s |
| 71 | current | 93 | 508 | enemy |  |  | 1.8s | 326.4s |
| 72 | current | 58 | 312 | enemy |  |  | 0.9s | 200.5s |
| 73 | current | 97 | 514 | enemy |  |  | 2.2s | 330.2s |
| 74 | current | 48 | 252 | player |  |  | 0.6s | 161.9s |
| 75 | current | 83 | 448 | enemy |  |  | 1.5s | 287.8s |
| 76 | current | 49 | 261 | player |  |  | 0.6s | 167.7s |
| 77 | current | 70 | 382 | enemy |  |  | 1.2s | 245.4s |
| 78 | current | 83 | 449 | enemy |  |  | 1.6s | 288.5s |
| 79 | current | 120 | 658 | enemy |  |  | 3.0s | 422.8s |
| 80 | current | 109 | 599 | enemy |  |  | 2.5s | 384.9s |
| 81 | current | 87 | 472 | enemy |  |  | 1.8s | 303.3s |
| 82 | current | 80 | 431 | player |  |  | 1.4s | 276.9s |
| 83 | current | 93 | 509 | enemy |  |  | 1.9s | 327.0s |
| 84 | current | 63 | 343 | player |  |  | 0.9s | 220.4s |
| 85 | current | 121 | 665 | player |  |  | 3.1s | 427.3s |
| 86 | current | 72 | 382 | enemy |  |  | 1.2s | 245.4s |
| 87 | current | 121 | 665 | player |  |  | 3.0s | 427.3s |
| 88 | current | 126 | 699 | player |  |  | 3.2s | 449.1s |
| 89 | current | 93 | 502 | player |  |  | 1.9s | 322.5s |
| 90 | current | 131 | 724 | player |  |  | 3.7s | 465.2s |
| 91 | current | 77 | 424 | player |  |  | 1.3s | 272.4s |
| 92 | current | 127 | 707 | player |  |  | 3.3s | 454.2s |
| 93 | current | 159 | 882 | player |  |  | 5.0s | 566.7s |
| 94 | current | 69 | 368 | enemy |  |  | 1.1s | 236.4s |
| 95 | current | 84 | 456 | player |  |  | 1.6s | 293.0s |
| 96 | current | 71 | 382 | player |  |  | 1.1s | 245.4s |
| 97 | current | 65 | 355 | player |  |  | 1.0s | 228.1s |
| 98 | current | 120 | 657 | player |  |  | 3.1s | 422.1s |
| 99 | current | 124 | 687 | enemy |  |  | 3.3s | 441.4s |
| 100 | current | 47 | 245 | enemy |  |  | 0.6s | 157.4s |
| 101 | current | 84 | 462 | player |  |  | 1.6s | 296.8s |
| 102 | current | 59 | 314 | player |  |  | 0.7s | 201.7s |
| 103 | current | 147 | 814 | player |  |  | 4.4s | 523.0s |
| 104 | current | 53 | 281 | player |  |  | 0.7s | 180.5s |
| 105 | current | 160 | 890 | enemy |  |  | 5.0s | 571.8s |
| 106 | current | 79 | 433 | player |  |  | 1.8s | 278.2s |
| 107 | current | 68 | 362 | player |  |  | 1.2s | 232.6s |
| 108 | current | 73 | 391 | player |  |  | 1.9s | 251.2s |
| 109 | current | 68 | 366 | player |  |  | 2.1s | 235.2s |
| 110 | current | 128 | 709 | player |  |  | 5.2s | 455.5s |
| 111 | current | 52 | 276 | enemy |  |  | 1.0s | 177.3s |
| 112 | current | 90 | 486 | enemy |  |  | 2.0s | 312.3s |
| 113 | current | 73 | 396 | player |  |  | 1.2s | 254.4s |
| 114 | current | 135 | 750 | player |  |  | 3.7s | 481.9s |
| 115 | current | 53 | 286 | player |  |  | 0.7s | 183.8s |
| 116 | current | 90 | 487 | player |  |  | 1.8s | 312.9s |
| 117 | current | 148 | 825 | enemy |  |  | 4.4s | 530.1s |
| 118 | current | 73 | 395 | player |  |  | 1.2s | 253.8s |
| 119 | current | 99 | 549 | player |  |  | 2.1s | 352.7s |
| 120 | current | 85 | 456 | enemy |  |  | 1.7s | 293.0s |
| 121 | current | 85 | 461 | player |  |  | 1.7s | 296.2s |
| 122 | current | 109 | 599 | enemy |  |  | 2.5s | 384.9s |
| 123 | current | 94 | 512 | player |  |  | 2.1s | 329.0s |
| 124 | current | 65 | 345 | player |  |  | 1.2s | 221.7s |
| 125 | current | 99 | 539 | enemy |  |  | 2.7s | 346.3s |
| 126 | current | 68 | 372 | enemy |  |  | 1.3s | 239.0s |
| 127 | current | 65 | 346 | player |  |  | 1.0s | 222.3s |
| 128 | current | 130 | 709 | player |  |  | 3.4s | 455.5s |
| 129 | current | 59 | 307 | enemy |  |  | 0.9s | 197.2s |
| 130 | current | 61 | 318 | enemy |  |  | 0.9s | 204.3s |
| 131 | current | 74 | 392 | player |  |  | 1.2s | 251.9s |
| 132 | current | 75 | 404 | enemy |  |  | 1.3s | 259.6s |
| 133 | current | 116 | 630 | player |  |  | 2.7s | 404.8s |
| 134 | current | 106 | 587 | enemy |  |  | 2.4s | 377.1s |
| 135 | current | 89 | 478 | enemy |  |  | 1.8s | 307.1s |
| 136 | current | 117 | 643 | enemy |  |  | 2.8s | 413.1s |
| 137 | current | 97 | 534 | player |  |  | 2.0s | 343.1s |
| 138 | current | 120 | 661 | enemy |  |  | 3.0s | 424.7s |
| 139 | current | 102 | 565 | enemy |  |  | 2.4s | 363.0s |
| 140 | current | 105 | 579 | player |  |  | 2.7s | 372.0s |
| 141 | current | 69 | 375 | player |  |  | 1.4s | 240.9s |
| 142 | current | 57 | 300 | player |  |  | 0.8s | 192.8s |
| 143 | current | 122 | 682 | player |  |  | 3.6s | 438.2s |
| 144 | current | 97 | 526 | player |  |  | 2.1s | 338.0s |
| 145 | current | 125 | 697 | player |  |  | 3.3s | 447.8s |
| 146 | current | 127 | 691 | player |  |  | 3.5s | 444.0s |
| 147 | current | 94 | 512 | player |  |  | 2.0s | 329.0s |
| 148 | current | 53 | 278 | player |  |  | 0.6s | 178.6s |
| 149 | current | 71 | 378 | player |  |  | 1.1s | 242.9s |
| 150 | current | 77 | 420 | player |  |  | 1.4s | 269.9s |
| 151 | current | 95 | 516 | player |  |  | 2.1s | 331.5s |
| 152 | current | 61 | 324 | player |  |  | 0.8s | 208.2s |
| 153 | current | 49 | 256 | enemy |  |  | 0.6s | 164.5s |
| 154 | current | 63 | 333 | enemy |  |  | 1.0s | 214.0s |
| 155 | current | 77 | 415 | enemy |  |  | 1.4s | 266.6s |
| 156 | current | 68 | 359 | player |  |  | 1.0s | 230.7s |
| 157 | current | 128 | 705 | player |  |  | 3.7s | 453.0s |
| 158 | current | 81 | 433 | player |  |  | 2.0s | 278.2s |
| 159 | current | 148 | 820 | enemy |  |  | 5.5s | 526.9s |
| 160 | current | 91 | 493 | player |  |  | 1.9s | 316.8s |
| 161 | current | 111 | 606 | enemy |  |  | 2.8s | 389.4s |
| 162 | current | 67 | 353 | player |  |  | 1.0s | 226.8s |
| 163 | current | 103 | 566 | player |  |  | 2.3s | 363.7s |
| 164 | current | 79 | 429 | player |  |  | 1.4s | 275.6s |
| 165 | current | 97 | 529 | enemy |  |  | 2.1s | 339.9s |
| 166 | current | 58 | 306 | enemy |  |  | 0.9s | 196.6s |
| 167 | current | 132 | 727 | player |  |  | 3.7s | 467.1s |
| 168 | current | 147 | 816 | player |  |  | 4.5s | 524.3s |
| 169 | current | 79 | 429 | player |  |  | 1.5s | 275.6s |
| 170 | current | 45 | 240 | player |  |  | 0.5s | 154.2s |
| 171 | current | 41 | 215 | player |  |  | 0.5s | 138.1s |
| 172 | current | 163 | 899 | player |  |  | 6.1s | 577.6s |
| 173 | current | 69 | 364 | player |  |  | 1.3s | 233.9s |
| 174 | current | 67 | 357 | enemy |  |  | 1.3s | 229.4s |
| 175 | current | 88 | 487 | enemy |  |  | 1.8s | 312.9s |
| 176 | current | 51 | 266 | enemy |  |  | 0.7s | 170.9s |
| 177 | current | 108 | 594 | enemy |  |  | 2.6s | 381.6s |
| 178 | current | 128 | 706 | player |  |  | 3.5s | 453.6s |
| 179 | current | 103 | 561 | enemy |  |  | 2.4s | 360.4s |
| 180 | current | 54 | 286 | player |  |  | 0.7s | 183.8s |
| 181 | current | 78 | 418 | player |  |  | 1.4s | 268.6s |
| 182 | current | 67 | 351 | enemy |  |  | 1.1s | 225.5s |
| 183 | current | 73 | 391 | enemy |  |  | 1.3s | 251.2s |
| 184 | current | 81 | 440 | enemy |  |  | 1.6s | 282.7s |
| 185 | current | 67 | 352 | enemy |  |  | 1.1s | 226.2s |
| 186 | current | 84 | 461 | enemy |  |  | 1.7s | 296.2s |
| 187 | current | 80 | 434 | player |  |  | 1.5s | 278.8s |
| 188 | current | 78 | 429 | enemy |  |  | 1.4s | 275.6s |
| 189 | current | 111 | 611 | enemy |  |  | 3.0s | 392.6s |
| 190 | current | 47 | 241 | enemy |  |  | 0.7s | 154.8s |
| 191 | current | 130 | 713 | enemy |  |  | 3.8s | 458.1s |
| 192 | current | 55 | 282 | enemy |  |  | 0.8s | 181.2s |
| 193 | current | 97 | 528 | player |  |  | 2.5s | 339.2s |
| 194 | current | 49 | 263 | player |  |  | 0.6s | 169.0s |
| 195 | current | 89 | 493 | player |  |  | 1.7s | 316.8s |
| 196 | current | 92 | 500 | player |  |  | 1.8s | 321.3s |
| 197 | current | 55 | 290 | player |  |  | 0.7s | 186.3s |
| 198 | current | 55 | 293 | player |  |  | 0.7s | 188.3s |
| 199 | current | 139 | 764 | player |  |  | 3.9s | 490.9s |
| 200 | current | 117 | 646 | player |  |  | 2.7s | 415.1s |
| 201 | current | 46 | 245 | enemy |  |  | 0.6s | 157.4s |
| 202 | current | 142 | 784 | player |  |  | 3.9s | 503.7s |
| 203 | current | 140 | 776 | player |  |  | 3.8s | 498.6s |
| 204 | current | 57 | 306 | player |  |  | 0.7s | 196.6s |
| 205 | current | 109 | 599 | player |  |  | 2.5s | 384.9s |
| 206 | current | 92 | 509 | enemy |  |  | 1.9s | 327.0s |
| 207 | current | 138 | 760 | player |  |  | 3.7s | 488.3s |
| 208 | current | 116 | 638 | player |  |  | 2.7s | 409.9s |
| 209 | current | 97 | 532 | player |  |  | 2.0s | 341.8s |
| 210 | current | 94 | 511 | player |  |  | 1.9s | 328.3s |
| 211 | current | 122 | 666 | player |  |  | 3.0s | 427.9s |
| 212 | current | 147 | 806 | enemy |  |  | 4.0s | 517.9s |
| 213 | current | 142 | 775 | player |  |  | 3.8s | 497.9s |
| 214 | current | 98 | 537 | player |  |  | 2.1s | 345.0s |
| 215 | current | 149 | 833 | player |  |  | 4.5s | 535.2s |
| 216 | current | 71 | 386 | player |  |  | 1.1s | 248.0s |
| 217 | current | 91 | 496 | player |  |  | 1.7s | 318.7s |
| 218 | current | 133 | 734 | player |  |  | 3.5s | 471.6s |
| 219 | current | 85 | 460 | enemy |  |  | 1.6s | 295.6s |
| 220 | current | 140 | 775 | enemy |  |  | 3.9s | 497.9s |
| 1 | flat_atk | 47 | 248 | enemy |  |  | 0.6s | 159.3s |
| 2 | flat_atk | 19 | 96 | player |  |  | 0.1s | 61.7s |
| 3 | flat_atk | 19 | 88 | enemy |  |  | 0.1s | 56.5s |
| 4 | flat_atk | 13 | 64 | player |  |  | 0.1s | 41.1s |
| 5 | flat_atk | 42 | 220 | enemy |  |  | 0.5s | 141.3s |
| 6 | flat_atk | 19 | 89 | enemy |  |  | 0.1s | 57.2s |
| 7 | flat_atk | 57 | 303 | player |  |  | 0.8s | 194.7s |
| 8 | flat_atk | 14 | 67 | enemy |  |  | 0.1s | 43.0s |
| 9 | flat_atk | 35 | 187 | player |  |  | 0.4s | 120.1s |
| 10 | flat_atk | 24 | 120 | enemy |  |  | 0.2s | 77.1s |
| 11 | flat_atk | 45 | 242 | player |  |  | 0.5s | 155.5s |
| 12 | flat_atk | 17 | 83 | player |  |  | 0.1s | 53.3s |
| 13 | flat_atk | 50 | 267 | enemy |  |  | 0.6s | 171.5s |
| 14 | flat_atk | 37 | 188 | enemy |  |  | 0.4s | 120.8s |
| 15 | flat_atk | 17 | 80 | player |  |  | 0.1s | 51.4s |
| 16 | flat_atk | 31 | 164 | player |  |  | 0.3s | 105.4s |
| 17 | flat_atk | 15 | 76 | player |  |  | 0.1s | 48.8s |
| 18 | flat_atk | 53 | 287 | player |  |  | 0.7s | 184.4s |
| 19 | flat_atk | 34 | 180 | player |  |  | 0.3s | 115.7s |
| 20 | flat_atk | 17 | 79 | enemy |  |  | 0.1s | 50.8s |
| 21 | flat_atk | 23 | 116 | enemy |  |  | 0.2s | 74.5s |
| 22 | flat_atk | 17 | 79 | enemy |  |  | 0.1s | 50.8s |
| 23 | flat_atk | 35 | 183 | enemy |  |  | 0.4s | 117.6s |
| 24 | flat_atk | 17 | 80 | enemy |  |  | 0.1s | 51.4s |
| 25 | flat_atk | 14 | 68 | enemy |  |  | 0.1s | 43.7s |
| 26 | flat_atk | 39 | 203 | enemy |  |  | 0.5s | 130.4s |
| 27 | flat_atk | 13 | 65 | player |  |  | 0.1s | 41.8s |
| 28 | flat_atk | 21 | 102 | enemy |  |  | 0.2s | 65.5s |
| 29 | flat_atk | 34 | 177 | player |  |  | 0.3s | 113.7s |
| 30 | flat_atk | 53 | 285 | enemy |  |  | 0.7s | 183.1s |
| 31 | flat_atk | 42 | 223 | player |  |  | 0.5s | 143.3s |
| 32 | flat_atk | 22 | 109 | enemy |  |  | 0.2s | 70.0s |
| 33 | flat_atk | 17 | 81 | enemy |  |  | 0.1s | 52.0s |
| 34 | flat_atk | 17 | 80 | enemy |  |  | 0.1s | 51.4s |
| 35 | flat_atk | 15 | 76 | player |  |  | 0.1s | 48.8s |
| 36 | flat_atk | 24 | 117 | player |  |  | 0.2s | 75.2s |
| 37 | flat_atk | 29 | 146 | enemy |  |  | 0.3s | 93.8s |
| 38 | flat_atk | 17 | 85 | player |  |  | 0.1s | 54.6s |
| 39 | flat_atk | 19 | 95 | player |  |  | 0.1s | 61.0s |
| 40 | flat_atk | 30 | 156 | enemy |  |  | 0.3s | 100.2s |
| 41 | flat_atk | 23 | 116 | player |  |  | 0.2s | 74.5s |
| 42 | flat_atk | 50 | 261 | player |  |  | 0.6s | 167.7s |
| 43 | flat_atk | 33 | 172 | player |  |  | 0.3s | 110.5s |
| 44 | flat_atk | 31 | 162 | player |  |  | 0.3s | 104.1s |
| 45 | flat_atk | 43 | 225 | enemy |  |  | 0.5s | 144.6s |
| 46 | flat_atk | 15 | 71 | enemy |  |  | 0.1s | 45.6s |
| 47 | flat_atk | 36 | 193 | enemy |  |  | 0.4s | 124.0s |
| 48 | flat_atk | 13 | 65 | player |  |  | 0.1s | 41.8s |
| 49 | flat_atk | 17 | 87 | player |  |  | 0.1s | 55.9s |
| 50 | flat_atk | 21 | 107 | player |  |  | 0.1s | 68.7s |
| 51 | flat_atk | 22 | 111 | enemy |  |  | 0.2s | 71.3s |
| 52 | flat_atk | 40 | 213 | enemy |  |  | 0.5s | 136.9s |
| 53 | flat_atk | 35 | 186 | player |  |  | 0.4s | 119.5s |
| 54 | flat_atk | 49 | 262 | enemy |  |  | 0.6s | 168.3s |
| 55 | flat_atk | 20 | 97 | player |  |  | 0.1s | 62.3s |
| 56 | flat_atk | 19 | 93 | player |  |  | 0.1s | 59.8s |
| 57 | flat_atk | 16 | 73 | player |  |  | 0.1s | 46.9s |
| 58 | flat_atk | 17 | 79 | enemy |  |  | 0.1s | 50.8s |
| 59 | flat_atk | 20 | 95 | player |  |  | 0.1s | 61.0s |
| 60 | flat_atk | 23 | 119 | player |  |  | 0.2s | 76.5s |
| 61 | flat_atk | 40 | 213 | player |  |  | 0.5s | 136.9s |
| 62 | flat_atk | 23 | 113 | player |  |  | 0.2s | 72.6s |
| 63 | flat_atk | 17 | 79 | enemy |  |  | 0.1s | 50.8s |
| 64 | flat_atk | 20 | 97 | enemy |  |  | 0.1s | 62.3s |
| 65 | flat_atk | 25 | 119 | enemy |  |  | 0.2s | 76.5s |
| 66 | flat_atk | 15 | 74 | enemy |  |  | 0.1s | 47.5s |
| 67 | flat_atk | 23 | 111 | enemy |  |  | 0.2s | 71.3s |
| 68 | flat_atk | 39 | 206 | player |  |  | 0.4s | 132.4s |
| 69 | flat_atk | 43 | 231 | player |  |  | 0.5s | 148.4s |
| 70 | flat_atk | 36 | 185 | player |  |  | 0.4s | 118.9s |
| 71 | flat_atk | 40 | 210 | player |  |  | 0.4s | 134.9s |
| 72 | flat_atk | 36 | 192 | enemy |  |  | 0.4s | 123.4s |
| 73 | flat_atk | 15 | 71 | enemy |  |  | 0.1s | 45.6s |
| 74 | flat_atk | 26 | 122 | player |  |  | 0.2s | 78.4s |
| 75 | flat_atk | 17 | 82 | enemy |  |  | 0.1s | 52.7s |
| 76 | flat_atk | 15 | 78 | player |  |  | 0.1s | 50.1s |
| 77 | flat_atk | 18 | 90 | enemy |  |  | 0.1s | 57.8s |
| 78 | flat_atk | 17 | 84 | enemy |  |  | 0.1s | 54.0s |
| 79 | flat_atk | 28 | 147 | enemy |  |  | 0.3s | 94.4s |
| 80 | flat_atk | 28 | 131 | player |  |  | 0.2s | 84.2s |
| 81 | flat_atk | 30 | 152 | player |  |  | 0.3s | 97.7s |
| 82 | flat_atk | 16 | 74 | player |  |  | 0.1s | 47.5s |
| 83 | flat_atk | 55 | 294 | enemy |  |  | 0.7s | 188.9s |
| 84 | flat_atk | 45 | 240 | player |  |  | 0.5s | 154.2s |
| 85 | flat_atk | 23 | 119 | player |  |  | 0.2s | 76.5s |
| 86 | flat_atk | 17 | 91 | player |  |  | 0.1s | 58.5s |
| 87 | flat_atk | 17 | 84 | player |  |  | 0.1s | 54.0s |
| 88 | flat_atk | 19 | 88 | enemy |  |  | 0.1s | 56.5s |
| 89 | flat_atk | 30 | 155 | enemy |  |  | 0.3s | 99.6s |
| 90 | flat_atk | 16 | 77 | enemy |  |  | 0.1s | 49.5s |
| 91 | flat_atk | 45 | 242 | player |  |  | 0.5s | 155.5s |
| 92 | flat_atk | 17 | 84 | player |  |  | 0.1s | 54.0s |
| 93 | flat_atk | 45 | 240 | player |  |  | 0.5s | 154.2s |
| 94 | flat_atk | 21 | 102 | enemy |  |  | 0.2s | 65.5s |
| 95 | flat_atk | 30 | 153 | player |  |  | 0.3s | 98.3s |
| 96 | flat_atk | 53 | 292 | player |  |  | 0.7s | 187.6s |
| 97 | flat_atk | 17 | 81 | player |  |  | 0.1s | 52.0s |
| 98 | flat_atk | 15 | 68 | enemy |  |  | 0.1s | 43.7s |
| 99 | flat_atk | 24 | 122 | enemy |  |  | 0.2s | 78.4s |
| 100 | flat_atk | 19 | 91 | enemy |  |  | 0.1s | 58.5s |
| 101 | flat_atk | 23 | 111 | enemy |  |  | 0.2s | 71.3s |
| 102 | flat_atk | 31 | 165 | player |  |  | 0.3s | 106.0s |
| 103 | flat_atk | 34 | 174 | enemy |  |  | 0.3s | 111.8s |
| 104 | flat_atk | 17 | 84 | player |  |  | 0.1s | 54.0s |
| 105 | flat_atk | 37 | 199 | player |  |  | 0.4s | 127.9s |
| 106 | flat_atk | 40 | 215 | enemy |  |  | 0.5s | 138.1s |
| 107 | flat_atk | 18 | 82 | player |  |  | 0.1s | 52.7s |
| 108 | flat_atk | 15 | 75 | player |  |  | 0.1s | 48.2s |
| 109 | flat_atk | 49 | 258 | enemy |  |  | 0.6s | 165.8s |
| 110 | flat_atk | 17 | 78 | enemy |  |  | 0.1s | 50.1s |
| 111 | flat_atk | 47 | 248 | player |  |  | 0.6s | 159.3s |
| 112 | flat_atk | 12 | 59 | enemy |  |  | 0.1s | 37.9s |
| 113 | flat_atk | 11 | 59 | player |  |  | 0.1s | 37.9s |
| 114 | flat_atk | 20 | 102 | enemy |  |  | 0.2s | 65.5s |
| 115 | flat_atk | 21 | 112 | player |  |  | 0.2s | 72.0s |
| 116 | flat_atk | 19 | 94 | enemy |  |  | 0.1s | 60.4s |
| 117 | flat_atk | 44 | 239 | enemy |  |  | 0.5s | 153.6s |
| 118 | flat_atk | 17 | 85 | player |  |  | 0.1s | 54.6s |
| 119 | flat_atk | 37 | 201 | player |  |  | 0.4s | 129.1s |
| 120 | flat_atk | 19 | 92 | enemy |  |  | 0.1s | 59.1s |
| 121 | flat_atk | 27 | 138 | player |  |  | 0.2s | 88.7s |
| 122 | flat_atk | 44 | 230 | player |  |  | 0.5s | 147.8s |
| 123 | flat_atk | 16 | 73 | player |  |  | 0.1s | 46.9s |
| 124 | flat_atk | 51 | 273 | player |  |  | 0.6s | 175.4s |
| 125 | flat_atk | 40 | 212 | player |  |  | 0.5s | 136.2s |
| 126 | flat_atk | 21 | 105 | player |  |  | 0.2s | 67.5s |
| 127 | flat_atk | 21 | 108 | player |  |  | 0.2s | 69.4s |
| 128 | flat_atk | 16 | 74 | player |  |  | 0.1s | 47.5s |
| 129 | flat_atk | 16 | 78 | player |  |  | 0.1s | 50.1s |
| 130 | flat_atk | 19 | 88 | enemy |  |  | 0.1s | 56.5s |
| 131 | flat_atk | 46 | 249 | player |  |  | 0.6s | 160.0s |
| 132 | flat_atk | 61 | 330 | enemy |  |  | 0.9s | 212.0s |
| 133 | flat_atk | 48 | 257 | player |  |  | 0.6s | 165.1s |
| 134 | flat_atk | 18 | 88 | enemy |  |  | 0.1s | 56.5s |
| 135 | flat_atk | 39 | 203 | enemy |  |  | 0.5s | 130.4s |
| 136 | flat_atk | 17 | 84 | enemy |  |  | 0.1s | 54.0s |
| 137 | flat_atk | 51 | 273 | player |  |  | 0.6s | 175.4s |
| 138 | flat_atk | 50 | 272 | enemy |  |  | 0.6s | 174.8s |
| 139 | flat_atk | 51 | 276 | player |  |  | 0.7s | 177.3s |
| 140 | flat_atk | 18 | 87 | enemy |  |  | 0.1s | 55.9s |
| 141 | flat_atk | 17 | 85 | player |  |  | 0.1s | 54.6s |
| 142 | flat_atk | 21 | 104 | player |  |  | 0.2s | 66.8s |
| 143 | flat_atk | 16 | 78 | player |  |  | 0.1s | 50.1s |
| 144 | flat_atk | 19 | 93 | player |  |  | 0.1s | 59.8s |
| 145 | flat_atk | 24 | 120 | enemy |  |  | 0.2s | 77.1s |
| 146 | flat_atk | 21 | 108 | player |  |  | 0.1s | 69.4s |
| 147 | flat_atk | 16 | 73 | player |  |  | 0.1s | 46.9s |
| 148 | flat_atk | 21 | 107 | player |  |  | 0.2s | 68.7s |
| 149 | flat_atk | 43 | 234 | player |  |  | 0.5s | 150.3s |
| 150 | flat_atk | 17 | 85 | player |  |  | 0.1s | 54.6s |
| 151 | flat_atk | 49 | 270 | player |  |  | 0.6s | 173.5s |
| 152 | flat_atk | 15 | 73 | player |  |  | 0.1s | 46.9s |
| 153 | flat_atk | 13 | 59 | enemy |  |  | 0.1s | 37.9s |
| 154 | flat_atk | 27 | 132 | enemy |  |  | 0.2s | 84.8s |
| 155 | flat_atk | 19 | 86 | enemy |  |  | 0.1s | 55.3s |
| 156 | flat_atk | 37 | 196 | enemy |  |  | 0.4s | 125.9s |
| 157 | flat_atk | 46 | 243 | player |  |  | 0.6s | 156.1s |
| 158 | flat_atk | 42 | 225 | enemy |  |  | 0.5s | 144.6s |
| 159 | flat_atk | 17 | 88 | player |  |  | 0.1s | 56.5s |
| 160 | flat_atk | 19 | 97 | player |  |  | 0.1s | 62.3s |
| 161 | flat_atk | 25 | 123 | enemy |  |  | 0.2s | 79.0s |
| 162 | flat_atk | 44 | 231 | enemy |  |  | 0.5s | 148.4s |
| 163 | flat_atk | 49 | 269 | player |  |  | 0.6s | 172.8s |
| 164 | flat_atk | 14 | 70 | enemy |  |  | 0.1s | 45.0s |
| 165 | flat_atk | 41 | 220 | enemy |  |  | 0.5s | 141.3s |
| 166 | flat_atk | 14 | 69 | enemy |  |  | 0.1s | 44.3s |
| 167 | flat_atk | 17 | 78 | enemy |  |  | 0.1s | 50.1s |
| 168 | flat_atk | 35 | 184 | player |  |  | 0.4s | 118.2s |
| 169 | flat_atk | 15 | 74 | player |  |  | 0.1s | 47.5s |
| 170 | flat_atk | 17 | 84 | player |  |  | 0.1s | 54.0s |
| 171 | flat_atk | 19 | 95 | player |  |  | 0.1s | 61.0s |
| 172 | flat_atk | 17 | 81 | player |  |  | 0.1s | 52.0s |
| 173 | flat_atk | 49 | 256 | player |  |  | 0.6s | 164.5s |
| 174 | flat_atk | 17 | 78 | enemy |  |  | 0.1s | 50.1s |
| 175 | flat_atk | 41 | 217 | player |  |  | 0.5s | 139.4s |
| 176 | flat_atk | 22 | 103 | player |  |  | 0.1s | 66.2s |
| 177 | flat_atk | 35 | 190 | player |  |  | 0.4s | 122.1s |
| 178 | flat_atk | 34 | 173 | player |  |  | 0.3s | 111.2s |
| 179 | flat_atk | 11 | 50 | enemy |  |  | 0.1s | 32.1s |
| 180 | flat_atk | 32 | 169 | player |  |  | 0.3s | 108.6s |
| 181 | flat_atk | 44 | 227 | player |  |  | 0.5s | 145.8s |
| 182 | flat_atk | 17 | 80 | enemy |  |  | 0.1s | 51.4s |
| 183 | flat_atk | 17 | 80 | enemy |  |  | 0.1s | 51.4s |
| 184 | flat_atk | 25 | 125 | enemy |  |  | 0.2s | 80.3s |
| 185 | flat_atk | 18 | 88 | player |  |  | 0.2s | 56.5s |
| 186 | flat_atk | 43 | 234 | player |  |  | 0.5s | 150.3s |
| 187 | flat_atk | 36 | 189 | player |  |  | 0.4s | 121.4s |
| 188 | flat_atk | 47 | 253 | player |  |  | 0.6s | 162.6s |
| 189 | flat_atk | 21 | 103 | enemy |  |  | 0.2s | 66.2s |
| 190 | flat_atk | 21 | 104 | enemy |  |  | 0.2s | 66.8s |
| 191 | flat_atk | 50 | 270 | enemy |  |  | 0.6s | 173.5s |
| 192 | flat_atk | 13 | 59 | enemy |  |  | 0.1s | 37.9s |
| 193 | flat_atk | 24 | 118 | enemy |  |  | 0.2s | 75.8s |
| 194 | flat_atk | 17 | 88 | player |  |  | 0.1s | 56.5s |
| 195 | flat_atk | 43 | 231 | player |  |  | 0.6s | 148.4s |
| 196 | flat_atk | 15 | 71 | enemy |  |  | 0.1s | 45.6s |
| 197 | flat_atk | 13 | 62 | player |  |  | 0.1s | 39.8s |
| 198 | flat_atk | 15 | 75 | player |  |  | 0.1s | 48.2s |
| 199 | flat_atk | 17 | 87 | player |  |  | 0.1s | 55.9s |
| 200 | flat_atk | 21 | 109 | player |  |  | 0.2s | 70.0s |
| 201 | flat_atk | 17 | 83 | player |  |  | 0.1s | 53.3s |
| 202 | flat_atk | 25 | 127 | enemy |  |  | 0.3s | 81.6s |
| 203 | flat_atk | 19 | 87 | enemy |  |  | 0.2s | 55.9s |
| 204 | flat_atk | 19 | 95 | player |  |  | 0.1s | 61.0s |
| 205 | flat_atk | 20 | 100 | enemy |  |  | 0.2s | 64.3s |
| 206 | flat_atk | 40 | 216 | enemy |  |  | 0.5s | 138.8s |
| 207 | flat_atk | 33 | 167 | enemy |  |  | 0.3s | 107.3s |
| 208 | flat_atk | 35 | 182 | enemy |  |  | 0.4s | 116.9s |
| 209 | flat_atk | 38 | 204 | enemy |  |  | 0.4s | 131.1s |
| 210 | flat_atk | 26 | 125 | player |  |  | 0.2s | 80.3s |
| 211 | flat_atk | 15 | 70 | enemy |  |  | 0.1s | 45.0s |
| 212 | flat_atk | 22 | 107 | player |  |  | 0.2s | 68.7s |
| 213 | flat_atk | 35 | 184 | enemy |  |  | 0.4s | 118.2s |
| 214 | flat_atk | 36 | 185 | player |  |  | 0.4s | 118.9s |
| 215 | flat_atk | 23 | 116 | player |  |  | 0.2s | 74.5s |
| 216 | flat_atk | 37 | 200 | player |  |  | 0.4s | 128.5s |
| 217 | flat_atk | 35 | 183 | player |  |  | 0.4s | 117.6s |
| 218 | flat_atk | 51 | 279 | player |  |  | 0.7s | 179.3s |
| 219 | flat_atk | 43 | 229 | enemy |  |  | 0.5s | 147.1s |
| 220 | flat_atk | 22 | 111 | enemy |  |  | 0.2s | 71.3s |

- `current / tower` turn tail (p95 and above): 6, 11, 17, 34, 70, 93, 103, 105, 117, 159, 168, 172, 212, 215
- `current / tower` stalls/crashes/undecided: none
- `flat_atk / tower` turn tail (p95 and above): 7, 13, 18, 30, 42, 83, 96, 124, 132, 137, 138, 139, 191, 218
- `flat_atk / tower` stalls/crashes/undecided: none


Full rows also live in `tools/qa/artifacts/battle-sim.json`.

## UI coverage

Viewports: 844×390, 667×375, 915×412, 1280×720, 932×430, 1024×768, plus one portrait shot at 390×844 for the rotate overlay.

Checked on each landscape viewport: card and character geometry, touch size, map → prep → battle → rewards → map, stash avatars/actions/tokens, gacha pity and G charge against `content/v05/gacha/TEST_ONLY_banners.json`, AUTO toggle, save/load round trip, rewards copy.

Hand-card name plates and cost badges did not overlap. Every measured button was at least 44 CSS px. Battle character sprites do overlap: the same pairs repeat at about 0.16 and 0.36 of the smaller sprite on every landscape viewport. The 1280×720 battle shot still shows eight readable fighters, five hand cards, and the AUTO control. Prep shows the four Justins, a 30/30 deck, and START BATTLE.

The locked Sports Complex draws its name and the words "Coming soon" in the same absolute box (`.hotspot-label` and `.hotspot-lock` both sit at left 4px, right 4px, bottom 6px). The two strings fully overlap, so the label is not readable. Map art and the other building labels do paint once the images have decoded.

The gacha pull log is drawn over the avatar booth. After Pull 1, a normal click cannot reach that booth's Pull 10. The harness sent the click through the DOM node. Pity then read 11/100 and 11/200, G charged stayed 0, and the weights on screen stayed N 100. That is a hit-target bug, not an odds change.

The rewards screen shows the winner, the engine reason, G / Loot / Items as PENDING, and times emitted. One sampled fight was a defeat (`all_avatars_defeated`). The line that says the result is shown once is low contrast on the cream sheet.

Screenshots: **103**. Findings before de-dupe: P0 0, P1 6, P2 30.

### Playback samples (1280×720)

| Preset | Delay | Elapsed | Rewards | Toast changes | Median gap | Last turn | Page errors |
|---|---:|---:|---|---:|---:|---|---:|
| current | 640 ms | 12.1s | false | 19 | 642.5 ms | TURN 05 | 0 |
| current | 0 ms | 3.9s | true | 448 | 7.1 ms | TURN 89 | 0 |
| flat_atk | 0 ms | 0.9s | true | 88 | 6.4 ms | TURN 19 | 0 |

### First load, memory, FPS (headless Chrome, 1280×720)

| Signal | Value |
|---|---|
| Navigation duration | 59.8 ms |
| DOM content loaded | 59.7 ms |
| Load event | 59.8 ms |
| Resource count | 82 |
| Transfer size | 973.7 KB |
| Decoded body size | 949.4 KB |
| FPS on home | 60.4 (61 frames) |
| FPS in battle | 60.8 (61 frames) |
| JS heap home | 2.84 MB |
| JS heap battle | 2.70 MB |

### Findings

| Sev | Area | Viewport | Detail |
|---|---|---|---|
| P1 | gacha | 844x390, 667x375, 915x412, 1280x720, 932x430, 1024x768 | Pull 10 is covered after Pull 1 (N: N TEST token TEST_POOL_N) |
| P2 | map | 844x390, 667x375, 915x412, 1280x720, 932x430, 1024x768 | map map label overlaps (hotspot-label / hotspot-lock, 1) |
| P2 | characters | 844x390, 667x375, 915x412, 1280x720, 932x430, 1024x768 | battle character sprites overlap (sprite / sprite, 0.164) |
| P2 | characters | 844x390, 667x375, 915x412, 1280x720, 932x430, 1024x768 | battle character sprites overlap (sprite / sprite, 0.361) |

### Screenshot index

- `tools/qa/artifacts/screenshots/844x390/home.jpg`
- `tools/qa/artifacts/screenshots/844x390/stash-avatars.jpg`
- `tools/qa/artifacts/screenshots/844x390/stash-actions.jpg`
- `tools/qa/artifacts/screenshots/844x390/stash-tokens.jpg`
- `tools/qa/artifacts/screenshots/844x390/party.jpg`
- `tools/qa/artifacts/screenshots/844x390/party-deck.jpg`
- `tools/qa/artifacts/screenshots/844x390/gacha.jpg`
- `tools/qa/artifacts/screenshots/844x390/gacha-after-pull.jpg`
- `tools/qa/artifacts/screenshots/844x390/map.jpg`
- `tools/qa/artifacts/screenshots/844x390/mall.jpg`
- `tools/qa/artifacts/screenshots/844x390/prep.jpg`
- `tools/qa/artifacts/screenshots/844x390/battle.jpg`
- `tools/qa/artifacts/screenshots/844x390/battle-auto.jpg`
- `tools/qa/artifacts/screenshots/844x390/rewards.jpg`
- `tools/qa/artifacts/screenshots/844x390/map-after-rewards.jpg`
- `tools/qa/artifacts/screenshots/844x390/companion.jpg`
- `tools/qa/artifacts/screenshots/844x390/home-after-load.jpg`
- `tools/qa/artifacts/screenshots/667x375/home.jpg`
- `tools/qa/artifacts/screenshots/667x375/stash-avatars.jpg`
- `tools/qa/artifacts/screenshots/667x375/stash-actions.jpg`
- `tools/qa/artifacts/screenshots/667x375/stash-tokens.jpg`
- `tools/qa/artifacts/screenshots/667x375/party.jpg`
- `tools/qa/artifacts/screenshots/667x375/party-deck.jpg`
- `tools/qa/artifacts/screenshots/667x375/gacha.jpg`
- `tools/qa/artifacts/screenshots/667x375/gacha-after-pull.jpg`
- `tools/qa/artifacts/screenshots/667x375/map.jpg`
- `tools/qa/artifacts/screenshots/667x375/mall.jpg`
- `tools/qa/artifacts/screenshots/667x375/prep.jpg`
- `tools/qa/artifacts/screenshots/667x375/battle.jpg`
- `tools/qa/artifacts/screenshots/667x375/battle-auto.jpg`
- `tools/qa/artifacts/screenshots/667x375/rewards.jpg`
- `tools/qa/artifacts/screenshots/667x375/map-after-rewards.jpg`
- `tools/qa/artifacts/screenshots/667x375/companion.jpg`
- `tools/qa/artifacts/screenshots/667x375/home-after-load.jpg`
- `tools/qa/artifacts/screenshots/915x412/home.jpg`
- `tools/qa/artifacts/screenshots/915x412/stash-avatars.jpg`
- `tools/qa/artifacts/screenshots/915x412/stash-actions.jpg`
- `tools/qa/artifacts/screenshots/915x412/stash-tokens.jpg`
- `tools/qa/artifacts/screenshots/915x412/party.jpg`
- `tools/qa/artifacts/screenshots/915x412/party-deck.jpg`
- `tools/qa/artifacts/screenshots/915x412/gacha.jpg`
- `tools/qa/artifacts/screenshots/915x412/gacha-after-pull.jpg`
- `tools/qa/artifacts/screenshots/915x412/map.jpg`
- `tools/qa/artifacts/screenshots/915x412/mall.jpg`
- `tools/qa/artifacts/screenshots/915x412/prep.jpg`
- `tools/qa/artifacts/screenshots/915x412/battle.jpg`
- `tools/qa/artifacts/screenshots/915x412/battle-auto.jpg`
- `tools/qa/artifacts/screenshots/915x412/rewards.jpg`
- `tools/qa/artifacts/screenshots/915x412/map-after-rewards.jpg`
- `tools/qa/artifacts/screenshots/915x412/companion.jpg`
- `tools/qa/artifacts/screenshots/915x412/home-after-load.jpg`
- `tools/qa/artifacts/screenshots/1280x720/home.jpg`
- `tools/qa/artifacts/screenshots/1280x720/stash-avatars.jpg`
- `tools/qa/artifacts/screenshots/1280x720/stash-actions.jpg`
- `tools/qa/artifacts/screenshots/1280x720/stash-tokens.jpg`
- `tools/qa/artifacts/screenshots/1280x720/party.jpg`
- `tools/qa/artifacts/screenshots/1280x720/party-deck.jpg`
- `tools/qa/artifacts/screenshots/1280x720/gacha.jpg`
- `tools/qa/artifacts/screenshots/1280x720/gacha-after-pull.jpg`
- `tools/qa/artifacts/screenshots/1280x720/map.jpg`
- `tools/qa/artifacts/screenshots/1280x720/mall.jpg`
- `tools/qa/artifacts/screenshots/1280x720/prep.jpg`
- `tools/qa/artifacts/screenshots/1280x720/battle.jpg`
- `tools/qa/artifacts/screenshots/1280x720/battle-auto.jpg`
- `tools/qa/artifacts/screenshots/1280x720/rewards.jpg`
- `tools/qa/artifacts/screenshots/1280x720/map-after-rewards.jpg`
- `tools/qa/artifacts/screenshots/1280x720/companion.jpg`
- `tools/qa/artifacts/screenshots/1280x720/home-after-load.jpg`
- `tools/qa/artifacts/screenshots/932x430/home.jpg`
- `tools/qa/artifacts/screenshots/932x430/stash-avatars.jpg`
- `tools/qa/artifacts/screenshots/932x430/stash-actions.jpg`
- `tools/qa/artifacts/screenshots/932x430/stash-tokens.jpg`
- `tools/qa/artifacts/screenshots/932x430/party.jpg`
- `tools/qa/artifacts/screenshots/932x430/party-deck.jpg`
- `tools/qa/artifacts/screenshots/932x430/gacha.jpg`
- `tools/qa/artifacts/screenshots/932x430/gacha-after-pull.jpg`
- `tools/qa/artifacts/screenshots/932x430/map.jpg`
- `tools/qa/artifacts/screenshots/932x430/mall.jpg`
- `tools/qa/artifacts/screenshots/932x430/prep.jpg`
- `tools/qa/artifacts/screenshots/932x430/battle.jpg`
- `tools/qa/artifacts/screenshots/932x430/battle-auto.jpg`
- `tools/qa/artifacts/screenshots/932x430/rewards.jpg`
- `tools/qa/artifacts/screenshots/932x430/map-after-rewards.jpg`
- `tools/qa/artifacts/screenshots/932x430/companion.jpg`
- `tools/qa/artifacts/screenshots/932x430/home-after-load.jpg`
- `tools/qa/artifacts/screenshots/1024x768/home.jpg`
- `tools/qa/artifacts/screenshots/1024x768/stash-avatars.jpg`
- `tools/qa/artifacts/screenshots/1024x768/stash-actions.jpg`
- `tools/qa/artifacts/screenshots/1024x768/stash-tokens.jpg`
- `tools/qa/artifacts/screenshots/1024x768/party.jpg`
- `tools/qa/artifacts/screenshots/1024x768/party-deck.jpg`
- `tools/qa/artifacts/screenshots/1024x768/gacha.jpg`
- `tools/qa/artifacts/screenshots/1024x768/gacha-after-pull.jpg`
- `tools/qa/artifacts/screenshots/1024x768/map.jpg`
- `tools/qa/artifacts/screenshots/1024x768/mall.jpg`
- `tools/qa/artifacts/screenshots/1024x768/prep.jpg`
- `tools/qa/artifacts/screenshots/1024x768/battle.jpg`
- `tools/qa/artifacts/screenshots/1024x768/battle-auto.jpg`
- `tools/qa/artifacts/screenshots/1024x768/rewards.jpg`
- `tools/qa/artifacts/screenshots/1024x768/map-after-rewards.jpg`
- `tools/qa/artifacts/screenshots/1024x768/companion.jpg`
- `tools/qa/artifacts/screenshots/1024x768/home-after-load.jpg`
- `tools/qa/artifacts/screenshots/390x844-portrait/rotate-overlay.jpg`


## Assets and transfer

| Item | Value |
|---|---|
| Manifest entries | 150 |
| Missing manifest or CSS paths | 0 |
| Duplicate asset ids | 0 |
| Shipped files under web/assets | 176 (7.39 MB) |
| Unique referenced bytes | 7.38 MB |
| Static catalog total (html+css+js+manifest+referenced) | 7.66 MB |
| Oversize rasters (≥ 400.0 KB) | 1 |
| web/dist/playable.html | 11.00 MB |
| Build exit | 0 |

Oversize:

- `web/assets/generated/map/BG_MAP.webp` 426.8 KB

Largest shipped files:

| Path | Bytes |
|---|---:|
| `web/assets/generated/map/BG_MAP.webp` | 437050 |
| `web/assets/generated/dream_v02/house_villa.webp` | 249790 |
| `web/assets/generated/dream_v02/enemy_security_skeleton.webp` | 237302 |
| `web/assets/generated/dream_v02/gacha_reveal_ex.webp` | 231196 |
| `web/assets/generated/dream_v02/house_loft.webp` | 209856 |
| `web/assets/generated/dream_v02/house_penthouse.webp` | 208186 |
| `web/assets/generated/dream_v03/shopping_mall_interior.webp` | 194972 |
| `web/assets/generated/dream_v02/gacha_reveal_epic.webp` | 193318 |
| `web/assets/generated/dream_v02/action_barrier.webp` | 190332 |
| `web/assets/generated/dream_v02/enemy_clipboard_goblin.webp` | 183968 |
| `web/assets/generated/dream_v02/house_cabin.webp` | 173592 |
| `web/assets/generated/dream_v02/action_slash.webp` | 170058 |
| `web/assets/generated/dream_v02/house_cottage.webp` | 164842 |
| `web/assets/generated/dream_v02/action_heavy_strike.webp` | 160114 |
| `web/assets/generated/dream_v02/action_guard.webp` | 158740 |
| `web/assets/generated/dream_v02/house_bungalow.webp` | 156798 |
| `web/assets/generated/dream_v03/reward_room.webp` | 151350 |
| `web/assets/generated/dream_v02/enemy_salary_slime.webp` | 146382 |
| `web/assets/generated/dream_v02/gacha_machine_action.webp` | 138876 |
| `web/assets/generated/dream_v02/gacha_hall.webp` | 130308 |

Sum of index.html, web/css, web/js, the manifest, and unique files referenced by manifests and CSS. The browser may request only the current screen. playable.html inlines this set and is measured separately.


## Per-stream findings

Phase 1 ran on `prod/wave-base` only. Stream branches are merged only inside a local throwaway worktree and are never pushed.

| Stream | Branch | State on this pass | SHA | Commits ahead of wave-base | Merged locally | Conflicts | Notes |
|---|---|---|---|---:|---|---:|---|
| A | `prod/a-card-art` | not fetched this pass | — | — | — | — | waiting for the next poll |
| B | `prod/b-hideout` | not fetched this pass | — | — | — | — | waiting for the next poll |
| C | `prod/c-inventory` | not fetched this pass | — | — | — | — | waiting for the next poll |
| D | `prod/d-gacha` | not fetched this pass | — | — | — | — | waiting for the next poll |
| E | `prod/e-battle-polish` | not fetched this pass | — | — | — | — | waiting for the next poll |
| F | `prod/f-sport-art` | not fetched this pass | — | — | — | — | waiting for the next poll |
| G | `prod/g-world-content` | not fetched this pass | — | — | — | — | waiting for the next poll |


## Severity on the wave-base client

P0 is a crash, a broken required path, or a silent gacha odds, pity, or cost change. P1 is a stall, a missing battle sprite or hand, a control under 24 CSS px, or a pull log that covers Pull 10. P2 is a control under the 44 CSS px target, a character overlap that still leaves most of the sprite visible, stacked map labels, or an asset over the 400 KB raster budget.

Agent H tests added after the clean baseline:

- `tests/prod/h/gacha-ledger.test.js` locks the published TEST weights, null `costG`, pity 100/200, and `chargedG: 0`.
- `tests/prod/h/battle-sim-smoke.test.js` replays seed 4 for the current formula and for `flat_atk`.

No product file is edited by this branch.
