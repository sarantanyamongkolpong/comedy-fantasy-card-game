# Sport Complex art slots

Agent F fragment for the sport web stream. This file is the bind index. The machine-readable copy is `web/manifests/sport.json`.

Every entry has `review_status: GENERATED_REVIEW`. The locked asset schema only accepts `CONCEPT`, `PROTOTYPE`, `QA_PASSED`, `PRODUCTION_READY`, and `INTEGRATED`, so the schema field `status` is `CONCEPT`. The fragment itself is not production ready. Do not read `CONCEPT` as owner approval.

Parody names follow `origin/sport/v06-data:docs/sport_v06/PARODY_NAMES.md` @ `7b4ffccc9f16106b0674dceee8ed4d42090f0e49`. They stay `PROPOSED`. Real identities are not stored in this art pack.

## How to bind

- Do not edit `web/assets-manifest.json` in this stream. Integration merges `web/manifests/sport.json` later.
- Keep `asset_id`, `slot`, `anchor`, and `subject_id` stable. Replace `path` when a file changes.
- Participant cards and vehicles are silhouette slots (`placeholder: true`, slot `portrait-slot`). The Owner drops a portrait in by replacing that WebP. Do not bake names, stats, or the portrait into the frame.
- Sport content names each drop-in `content_slot`. Athletes, coaches, and helmet busts use `{cardId}_PORTRAIT`. Machines use `{cardId}_BODY`. Bind those strings to this fragment. The layer name stays `portrait-slot`.
- Tactic diagrams and tyre icons set `content_id` to the matching `SPC_*_TAC_*` card. Car aero and risk selectors, and `SPC_CAR_TAC_006` (pit window), have no content card of their own.
- Card stack, bottom to top: `card-interior`, `portrait-slot` inside the portrait window, `card-frame`, `team-colour` badge at `card_windows.badge`.
- Token stack, bottom to top: `team-colour`, `portrait-slot`, `token-frame`. The frame hole is `guide.holeRadius` of the token width.
- Prematch stack: `prematch` background, then transparent `layout-chrome`. Region boxes are in `guide.regions` on the chrome entry, in that image's own pixel space before normalization... they are absolute design pixels on the 1672×941 chrome.
- Track playback uses `track-top` `guide.centerline` as normalized `[x, y]` pairs, origin top-left, plus `guide.direction` and `guide.start`. `track-side` `guide.elevation` is a lap profile, not a geographic side camera.
- Formation markers list `{role, x, y}` normalized on the diagram. Goalkeeper is at the bottom. Basket schemes put the basket at the top. Shape language: square defender, circle midfielder, diamond wingback, triangle forward. No letters are painted.
- Scoreboard and timing-tower windows are normalized rectangles. Code draws every digit.
- World-map building `MAP_BLD_SPORTS` is untouched.

## Counts

| Category | Count |
| --- | ---: |
| frame | 16 |
| token | 16 |
| interior | 4 |
| slot | 126 |
| team | 35 |
| venue | 10 |
| track | 12 |
| track-side | 12 |
| pitch | 2 |
| court | 2 |
| prematch | 4 |
| layout | 4 |
| result | 4 |
| formation | 5 |
| scheme | 3 |
| icon | 19 |
| scoreboard | 2 |
| tower | 2 |
| gantry | 2 |
| podium | 1 |
| hub | 2 |
| portal | 4 |
| **total** | **287** |

Shipped WebP bytes: 2195614.

## Card windows

Normalized to the 1024×1536 frame master. The same ratios apply to the shipped 512×768 WebP.

```json
{
  "source": {
    "w": 1024,
    "h": 1536
  },
  "portrait": {
    "x": 0.1289,
    "y": 0.1094,
    "w": 0.7422,
    "h": 0.4427
  },
  "name": {
    "x": 0.1289,
    "y": 0.5755,
    "w": 0.7422,
    "h": 0.0599
  },
  "rules": {
    "x": 0.1172,
    "y": 0.7604,
    "w": 0.7656,
    "h": 0.1615
  },
  "badge": {
    "x": 0.0762,
    "y": 0.0417,
    "w": 0.1055,
    "h": 0.0703
  },
  "stats_by_sport": {
    "football": {
      "keys": [
        "Power",
        "Def",
        "Speed",
        "Sta",
        "Acc"
      ],
      "windows": [
        {
          "x": 0.1172,
          "y": 0.6536,
          "w": 0.1422,
          "h": 0.0885
        },
        {
          "x": 0.273,
          "y": 0.6536,
          "w": 0.1422,
          "h": 0.0885
        },
        {
          "x": 0.4289,
          "y": 0.6536,
          "w": 0.1422,
          "h": 0.0885
        },
        {
          "x": 0.5848,
          "y": 0.6536,
          "w": 0.1422,
          "h": 0.0885
        },
        {
          "x": 0.7406,
          "y": 0.6536,
          "w": 0.1422,
          "h": 0.0885
        }
      ]
    },
    "basket": {
      "keys": [
        "Shooting",
        "Def",
        "Spd",
        "Sta"
      ],
      "windows": [
        {
          "x": 0.1172,
          "y": 0.6536,
          "w": 0.1812,
          "h": 0.0885
        },
        {
          "x": 0.312,
          "y": 0.6536,
          "w": 0.1812,
          "h": 0.0885
        },
        {
          "x": 0.5068,
          "y": 0.6536,
          "w": 0.1812,
          "h": 0.0885
        },
        {
          "x": 0.7017,
          "y": 0.6536,
          "w": 0.1812,
          "h": 0.0885
        }
      ]
    },
    "car": {
      "keys": [
        "TopSpeed",
        "Accel",
        "Handling"
      ],
      "windows": [
        {
          "x": 0.1172,
          "y": 0.6536,
          "w": 0.2461,
          "h": 0.0885
        },
        {
          "x": 0.377,
          "y": 0.6536,
          "w": 0.2461,
          "h": 0.0885
        },
        {
          "x": 0.6367,
          "y": 0.6536,
          "w": 0.2461,
          "h": 0.0885
        }
      ]
    },
    "moto": {
      "keys": [
        "TopSpeed",
        "Accel",
        "Handling"
      ],
      "windows": [
        {
          "x": 0.1172,
          "y": 0.6536,
          "w": 0.2461,
          "h": 0.0885
        },
        {
          "x": 0.377,
          "y": 0.6536,
          "w": 0.2461,
          "h": 0.0885
        },
        {
          "x": 0.6367,
          "y": 0.6536,
          "w": 0.2461,
          "h": 0.0885
        }
      ]
    }
  }
}
```

## frame

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_FRAME_FOOTBALL_N | card-frame | frame-football |  |  | N |  | web/assets/sport/frames/football-N.webp |
| ART_FRAME_FOOTBALL_R | card-frame | frame-football |  |  | R |  | web/assets/sport/frames/football-R.webp |
| ART_FRAME_FOOTBALL_EPIC | card-frame | frame-football |  |  | Epic |  | web/assets/sport/frames/football-Epic.webp |
| ART_FRAME_FOOTBALL_EX | card-frame | frame-football |  |  | EX |  | web/assets/sport/frames/football-EX.webp |
| ART_FRAME_BASKET_N | card-frame | frame-basket |  |  | N |  | web/assets/sport/frames/basket-N.webp |
| ART_FRAME_BASKET_R | card-frame | frame-basket |  |  | R |  | web/assets/sport/frames/basket-R.webp |
| ART_FRAME_BASKET_EPIC | card-frame | frame-basket |  |  | Epic |  | web/assets/sport/frames/basket-Epic.webp |
| ART_FRAME_BASKET_EX | card-frame | frame-basket |  |  | EX |  | web/assets/sport/frames/basket-EX.webp |
| ART_FRAME_CAR_N | card-frame | frame-car |  |  | N |  | web/assets/sport/frames/car-N.webp |
| ART_FRAME_CAR_R | card-frame | frame-car |  |  | R |  | web/assets/sport/frames/car-R.webp |
| ART_FRAME_CAR_EPIC | card-frame | frame-car |  |  | Epic |  | web/assets/sport/frames/car-Epic.webp |
| ART_FRAME_CAR_EX | card-frame | frame-car |  |  | EX |  | web/assets/sport/frames/car-EX.webp |
| ART_FRAME_MOTO_N | card-frame | frame-moto |  |  | N |  | web/assets/sport/frames/moto-N.webp |
| ART_FRAME_MOTO_R | card-frame | frame-moto |  |  | R |  | web/assets/sport/frames/moto-R.webp |
| ART_FRAME_MOTO_EPIC | card-frame | frame-moto |  |  | Epic |  | web/assets/sport/frames/moto-Epic.webp |
| ART_FRAME_MOTO_EX | card-frame | frame-moto |  |  | EX |  | web/assets/sport/frames/moto-EX.webp |

## token

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_TOKEN_FOOTBALL_N | token-frame | token-football |  |  | N |  | web/assets/sport/tokens/football-N.webp |
| ART_TOKEN_FOOTBALL_R | token-frame | token-football |  |  | R |  | web/assets/sport/tokens/football-R.webp |
| ART_TOKEN_FOOTBALL_EPIC | token-frame | token-football |  |  | Epic |  | web/assets/sport/tokens/football-Epic.webp |
| ART_TOKEN_FOOTBALL_EX | token-frame | token-football |  |  | EX |  | web/assets/sport/tokens/football-EX.webp |
| ART_TOKEN_BASKET_N | token-frame | token-basket |  |  | N |  | web/assets/sport/tokens/basket-N.webp |
| ART_TOKEN_BASKET_R | token-frame | token-basket |  |  | R |  | web/assets/sport/tokens/basket-R.webp |
| ART_TOKEN_BASKET_EPIC | token-frame | token-basket |  |  | Epic |  | web/assets/sport/tokens/basket-Epic.webp |
| ART_TOKEN_BASKET_EX | token-frame | token-basket |  |  | EX |  | web/assets/sport/tokens/basket-EX.webp |
| ART_TOKEN_CAR_N | token-frame | token-car |  |  | N |  | web/assets/sport/tokens/car-N.webp |
| ART_TOKEN_CAR_R | token-frame | token-car |  |  | R |  | web/assets/sport/tokens/car-R.webp |
| ART_TOKEN_CAR_EPIC | token-frame | token-car |  |  | Epic |  | web/assets/sport/tokens/car-Epic.webp |
| ART_TOKEN_CAR_EX | token-frame | token-car |  |  | EX |  | web/assets/sport/tokens/car-EX.webp |
| ART_TOKEN_MOTO_N | token-frame | token-moto |  |  | N |  | web/assets/sport/tokens/moto-N.webp |
| ART_TOKEN_MOTO_R | token-frame | token-moto |  |  | R |  | web/assets/sport/tokens/moto-R.webp |
| ART_TOKEN_MOTO_EPIC | token-frame | token-moto |  |  | Epic |  | web/assets/sport/tokens/moto-Epic.webp |
| ART_TOKEN_MOTO_EX | token-frame | token-moto |  |  | EX |  | web/assets/sport/tokens/moto-EX.webp |

## interior

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_INTERIOR_FOOTBALL | card-interior | interior-football |  |  |  |  | web/assets/sport/interiors/football.webp |
| ART_INTERIOR_BASKET | card-interior | interior-basket |  |  |  |  | web/assets/sport/interiors/basket.webp |
| ART_INTERIOR_CAR | card-interior | interior-car |  |  |  |  | web/assets/sport/interiors/car.webp |
| ART_INTERIOR_MOTO | card-interior | interior-moto |  |  |  |  | web/assets/sport/interiors/moto.webp |

## slot

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_SPC_FOOTBALL_ATH_001 | portrait-slot | SPC_FOOTBALL_ATH_001 | SPC_FOOTBALL_ATH_001_PORTRAIT |  |  | Theo Court-Tea | web/assets/sport/slots/SPC_FOOTBALL_ATH_001.webp |
| ART_SPC_FOOTBALL_ATH_002 | portrait-slot | SPC_FOOTBALL_ATH_002 | SPC_FOOTBALL_ATH_002_PORTRAIT |  |  | Ash-Raf Haki-Mi | web/assets/sport/slots/SPC_FOOTBALL_ATH_002.webp |
| ART_SPC_FOOTBALL_ATH_003 | portrait-slot | SPC_FOOTBALL_ATH_003 | SPC_FOOTBALL_ATH_003_PORTRAIT |  |  | Virgil Van Brick | web/assets/sport/slots/SPC_FOOTBALL_ATH_003.webp |
| ART_SPC_FOOTBALL_ATH_004 | portrait-slot | SPC_FOOTBALL_ATH_004 | SPC_FOOTBALL_ATH_004_PORTRAIT |  |  | Willy Patchwork | web/assets/sport/slots/SPC_FOOTBALL_ATH_004.webp |
| ART_SPC_FOOTBALL_ATH_005 | portrait-slot | SPC_FOOTBALL_ATH_005 | SPC_FOOTBALL_ATH_005_PORTRAIT |  |  | Noodle Mendez | web/assets/sport/slots/SPC_FOOTBALL_ATH_005.webp |
| ART_SPC_FOOTBALL_ATH_006 | portrait-slot | SPC_FOOTBALL_ATH_006 | SPC_FOOTBALL_ATH_006_PORTRAIT |  |  | Carousel Six | web/assets/sport/slots/SPC_FOOTBALL_ATH_006.webp |
| ART_SPC_FOOTBALL_ATH_007 | portrait-slot | SPC_FOOTBALL_ATH_007 | SPC_FOOTBALL_ATH_007_PORTRAIT |  |  | Penne Al-Dente | web/assets/sport/slots/SPC_FOOTBALL_ATH_007.webp |
| ART_SPC_FOOTBALL_ATH_008 | portrait-slot | SPC_FOOTBALL_ATH_008 | SPC_FOOTBALL_ATH_008_PORTRAIT |  |  | Jude Belly-Ham | web/assets/sport/slots/SPC_FOOTBALL_ATH_008.webp |
| ART_SPC_FOOTBALL_ATH_009 | portrait-slot | SPC_FOOTBALL_ATH_009 | SPC_FOOTBALL_ATH_009_PORTRAIT |  |  | Vinnie Juicebox Jr. | web/assets/sport/slots/SPC_FOOTBALL_ATH_009.webp |
| ART_SPC_FOOTBALL_ATH_010 | portrait-slot | SPC_FOOTBALL_ATH_010 | SPC_FOOTBALL_ATH_010_PORTRAIT |  |  | Earl Haa-Landlord | web/assets/sport/slots/SPC_FOOTBALL_ATH_010.webp |
| ART_SPC_FOOTBALL_ATH_011 | portrait-slot | SPC_FOOTBALL_ATH_011 | SPC_FOOTBALL_ATH_011_PORTRAIT |  |  | Lemon Yammal | web/assets/sport/slots/SPC_FOOTBALL_ATH_011.webp |
| ART_SPC_FOOTBALL_ATH_012 | portrait-slot | SPC_FOOTBALL_ATH_012 | SPC_FOOTBALL_ATH_012_PORTRAIT |  |  | Killian Map-Pay | web/assets/sport/slots/SPC_FOOTBALL_ATH_012.webp |
| ART_SPC_FOOTBALL_ATH_013 | portrait-slot | SPC_FOOTBALL_ATH_013 | SPC_FOOTBALL_ATH_013_PORTRAIT |  |  | Lion Messo | web/assets/sport/slots/SPC_FOOTBALL_ATH_013.webp |
| ART_SPC_FOOTBALL_ATH_014 | portrait-slot | SPC_FOOTBALL_ATH_014 | SPC_FOOTBALL_ATH_014_PORTRAIT |  |  | Pickle Palms | web/assets/sport/slots/SPC_FOOTBALL_ATH_014.webp |
| ART_SPC_FOOTBALL_ATH_015 | portrait-slot | SPC_FOOTBALL_ATH_015 | SPC_FOOTBALL_ATH_015_PORTRAIT |  |  | Crust Crumb | web/assets/sport/slots/SPC_FOOTBALL_ATH_015.webp |
| ART_SPC_FOOTBALL_ATH_016 | portrait-slot | SPC_FOOTBALL_ATH_016 | SPC_FOOTBALL_ATH_016_PORTRAIT |  |  | Brine Wall | web/assets/sport/slots/SPC_FOOTBALL_ATH_016.webp |
| ART_SPC_FOOTBALL_ATH_017 | portrait-slot | SPC_FOOTBALL_ATH_017 | SPC_FOOTBALL_ATH_017_PORTRAIT |  |  | Jar Lid | web/assets/sport/slots/SPC_FOOTBALL_ATH_017.webp |
| ART_SPC_FOOTBALL_ATH_018 | portrait-slot | SPC_FOOTBALL_ATH_018 | SPC_FOOTBALL_ATH_018_PORTRAIT |  |  | Vinegar Lane | web/assets/sport/slots/SPC_FOOTBALL_ATH_018.webp |
| ART_SPC_FOOTBALL_ATH_019 | portrait-slot | SPC_FOOTBALL_ATH_019 | SPC_FOOTBALL_ATH_019_PORTRAIT |  |  | Seed Pocket | web/assets/sport/slots/SPC_FOOTBALL_ATH_019.webp |
| ART_SPC_FOOTBALL_ATH_020 | portrait-slot | SPC_FOOTBALL_ATH_020 | SPC_FOOTBALL_ATH_020_PORTRAIT |  |  | Relish Pass | web/assets/sport/slots/SPC_FOOTBALL_ATH_020.webp |
| ART_SPC_FOOTBALL_ATH_021 | portrait-slot | SPC_FOOTBALL_ATH_021 | SPC_FOOTBALL_ATH_021_PORTRAIT |  |  | Mustard Through | web/assets/sport/slots/SPC_FOOTBALL_ATH_021.webp |
| ART_SPC_FOOTBALL_ATH_022 | portrait-slot | SPC_FOOTBALL_ATH_022 | SPC_FOOTBALL_ATH_022_PORTRAIT |  |  | Dill Whip | web/assets/sport/slots/SPC_FOOTBALL_ATH_022.webp |
| ART_SPC_FOOTBALL_ATH_023 | portrait-slot | SPC_FOOTBALL_ATH_023 | SPC_FOOTBALL_ATH_023_PORTRAIT |  |  | Gherkin Strike | web/assets/sport/slots/SPC_FOOTBALL_ATH_023.webp |
| ART_SPC_FOOTBALL_ATH_024 | portrait-slot | SPC_FOOTBALL_ATH_024 | SPC_FOOTBALL_ATH_024_PORTRAIT |  |  | Crunch Cross | web/assets/sport/slots/SPC_FOOTBALL_ATH_024.webp |
| ART_SPC_FOOTBALL_ATH_025 | portrait-slot | SPC_FOOTBALL_ATH_025 | SPC_FOOTBALL_ATH_025_PORTRAIT |  |  | Spare Cask | web/assets/sport/slots/SPC_FOOTBALL_ATH_025.webp |
| ART_SPC_FOOTBALL_ATH_026 | portrait-slot | SPC_FOOTBALL_ATH_026 | SPC_FOOTBALL_ATH_026_PORTRAIT |  |  | Oak Barrel | web/assets/sport/slots/SPC_FOOTBALL_ATH_026.webp |
| ART_SPC_FOOTBALL_ATH_027 | portrait-slot | SPC_FOOTBALL_ATH_027 | SPC_FOOTBALL_ATH_027_PORTRAIT |  |  | Sweet Relish | web/assets/sport/slots/SPC_FOOTBALL_ATH_027.webp |
| ART_SPC_FOOTBALL_ATH_028 | portrait-slot | SPC_FOOTBALL_ATH_028 | SPC_FOOTBALL_ATH_028_PORTRAIT |  |  | Side Salad | web/assets/sport/slots/SPC_FOOTBALL_ATH_028.webp |
| ART_SPC_FOOTBALL_COA_001 | portrait-slot | SPC_FOOTBALL_COA_001 | SPC_FOOTBALL_COA_001_PORTRAIT |  |  | Pepper Gourd-ola | web/assets/sport/slots/SPC_FOOTBALL_COA_001.webp |
| ART_SPC_FOOTBALL_COA_002 | portrait-slot | SPC_FOOTBALL_COA_002 | SPC_FOOTBALL_COA_002_PORTRAIT |  |  | Hansy Flicker | web/assets/sport/slots/SPC_FOOTBALL_COA_002.webp |
| ART_SPC_FOOTBALL_COA_003 | portrait-slot | SPC_FOOTBALL_COA_003 | SPC_FOOTBALL_COA_003_PORTRAIT |  |  | Tony Count-Té | web/assets/sport/slots/SPC_FOOTBALL_COA_003.webp |
| ART_SPC_FOOTBALL_COA_004 | portrait-slot | SPC_FOOTBALL_COA_004 | SPC_FOOTBALL_COA_004_PORTRAIT |  |  | Carlo Anchovy-Lotti | web/assets/sport/slots/SPC_FOOTBALL_COA_004.webp |
| ART_SPC_FOOTBALL_COA_005 | portrait-slot | SPC_FOOTBALL_COA_005 | SPC_FOOTBALL_COA_005_PORTRAIT |  |  | Brine Whistle | web/assets/sport/slots/SPC_FOOTBALL_COA_005.webp |
| ART_SPC_FOOTBALL_COA_006 | portrait-slot | SPC_FOOTBALL_COA_006 | SPC_FOOTBALL_COA_006_PORTRAIT |  |  | Menu Card | web/assets/sport/slots/SPC_FOOTBALL_COA_006.webp |
| ART_SPC_BASKET_ATH_001 | portrait-slot | SPC_BASKET_ATH_001 | SPC_BASKET_ATH_001_PORTRAIT |  |  | Stew Currywurst | web/assets/sport/slots/SPC_BASKET_ATH_001.webp |
| ART_SPC_BASKET_ATH_002 | portrait-slot | SPC_BASKET_ATH_002 | SPC_BASKET_ATH_002_PORTRAIT |  |  | Nikola Yogurt | web/assets/sport/slots/SPC_BASKET_ATH_002.webp |
| ART_SPC_BASKET_ATH_003 | portrait-slot | SPC_BASKET_ATH_003 | SPC_BASKET_ATH_003_PORTRAIT |  |  | Victor Wobble-yama | web/assets/sport/slots/SPC_BASKET_ATH_003.webp |
| ART_SPC_BASKET_ATH_004 | portrait-slot | SPC_BASKET_ATH_004 | SPC_BASKET_ATH_004_PORTRAIT |  |  | Shy Gorgeous Salamander | web/assets/sport/slots/SPC_BASKET_ATH_004.webp |
| ART_SPC_BASKET_ATH_005 | portrait-slot | SPC_BASKET_ATH_005 | SPC_BASKET_ATH_005_PORTRAIT |  |  | Yannis Alphabet-Soup | web/assets/sport/slots/SPC_BASKET_ATH_005.webp |
| ART_SPC_BASKET_ATH_006 | portrait-slot | SPC_BASKET_ATH_006 | SPC_BASKET_ATH_006_PORTRAIT |  |  | LeBrawn Jams | web/assets/sport/slots/SPC_BASKET_ATH_006.webp |
| ART_SPC_BASKET_ATH_007 | portrait-slot | SPC_BASKET_ATH_007 | SPC_BASKET_ATH_007_PORTRAIT |  |  | Kaitlyn Cluck | web/assets/sport/slots/SPC_BASKET_ATH_007.webp |
| ART_SPC_BASKET_ATH_008 | portrait-slot | SPC_BASKET_ATH_008 | SPC_BASKET_ATH_008_PORTRAIT |  |  | Ay-Jay Wobble-Son | web/assets/sport/slots/SPC_BASKET_ATH_008.webp |
| ART_SPC_BASKET_ATH_009 | portrait-slot | SPC_BASKET_ATH_009 | SPC_BASKET_ATH_009_PORTRAIT |  |  | Brianna Stew-Pot | web/assets/sport/slots/SPC_BASKET_ATH_009.webp |
| ART_SPC_BASKET_ATH_010 | portrait-slot | SPC_BASKET_ATH_010 | SPC_BASKET_ATH_010_PORTRAIT |  |  | Angel Rice-Bowl | web/assets/sport/slots/SPC_BASKET_ATH_010.webp |
| ART_SPC_BASKET_ATH_011 | portrait-slot | SPC_BASKET_ATH_011 | SPC_BASKET_ATH_011_PORTRAIT |  |  | Biscuit Handle | web/assets/sport/slots/SPC_BASKET_ATH_011.webp |
| ART_SPC_BASKET_ATH_012 | portrait-slot | SPC_BASKET_ATH_012 | SPC_BASKET_ATH_012_PORTRAIT |  |  | Gravy Wing | web/assets/sport/slots/SPC_BASKET_ATH_012.webp |
| ART_SPC_BASKET_ATH_013 | portrait-slot | SPC_BASKET_ATH_013 | SPC_BASKET_ATH_013_PORTRAIT |  |  | Ladle Post | web/assets/sport/slots/SPC_BASKET_ATH_013.webp |
| ART_SPC_BASKET_ATH_014 | portrait-slot | SPC_BASKET_ATH_014 | SPC_BASKET_ATH_014_PORTRAIT |  |  | Whisk Point | web/assets/sport/slots/SPC_BASKET_ATH_014.webp |
| ART_SPC_BASKET_ATH_015 | portrait-slot | SPC_BASKET_ATH_015 | SPC_BASKET_ATH_015_PORTRAIT |  |  | Pan Flash | web/assets/sport/slots/SPC_BASKET_ATH_015.webp |
| ART_SPC_BASKET_ATH_016 | portrait-slot | SPC_BASKET_ATH_016 | SPC_BASKET_ATH_016_PORTRAIT |  |  | Roux Wing | web/assets/sport/slots/SPC_BASKET_ATH_016.webp |
| ART_SPC_BASKET_ATH_017 | portrait-slot | SPC_BASKET_ATH_017 | SPC_BASKET_ATH_017_PORTRAIT |  |  | Stock Block | web/assets/sport/slots/SPC_BASKET_ATH_017.webp |
| ART_SPC_BASKET_ATH_018 | portrait-slot | SPC_BASKET_ATH_018 | SPC_BASKET_ATH_018_PORTRAIT |  |  | Dumpling Post | web/assets/sport/slots/SPC_BASKET_ATH_018.webp |
| ART_SPC_BASKET_ATH_019 | portrait-slot | SPC_BASKET_ATH_019 | SPC_BASKET_ATH_019_PORTRAIT |  |  | Crumb Shot | web/assets/sport/slots/SPC_BASKET_ATH_019.webp |
| ART_SPC_BASKET_ATH_020 | portrait-slot | SPC_BASKET_ATH_020 | SPC_BASKET_ATH_020_PORTRAIT |  |  | Broth Board | web/assets/sport/slots/SPC_BASKET_ATH_020.webp |
| ART_SPC_BASKET_ATH_021 | portrait-slot | SPC_BASKET_ATH_021 | SPC_BASKET_ATH_021_PORTRAIT |  |  | Oven Seal | web/assets/sport/slots/SPC_BASKET_ATH_021.webp |
| ART_SPC_BASKET_COA_001 | portrait-slot | SPC_BASKET_COA_001 | SPC_BASKET_COA_001_PORTRAIT |  |  | Chef Stevie Stir | web/assets/sport/slots/SPC_BASKET_COA_001.webp |
| ART_SPC_BASKET_COA_002 | portrait-slot | SPC_BASKET_COA_002 | SPC_BASKET_COA_002_PORTRAIT |  |  | Gregg Popcorn-Vich | web/assets/sport/slots/SPC_BASKET_COA_002.webp |
| ART_SPC_BASKET_COA_003 | portrait-slot | SPC_BASKET_COA_003 | SPC_BASKET_COA_003_PORTRAIT |  |  | Becky Ham-Bun | web/assets/sport/slots/SPC_BASKET_COA_003.webp |
| ART_SPC_BASKET_COA_004 | portrait-slot | SPC_BASKET_COA_004 | SPC_BASKET_COA_004_PORTRAIT |  |  | Clipboard Crumb | web/assets/sport/slots/SPC_BASKET_COA_004.webp |
| ART_SPC_BASKET_COA_005 | portrait-slot | SPC_BASKET_COA_005 | SPC_BASKET_COA_005_PORTRAIT |  |  | Timer Ladle | web/assets/sport/slots/SPC_BASKET_COA_005.webp |
| ART_SPC_CAR_ENT_001 | portrait-slot | SPC_CAR_ENT_001 | SPC_CAR_ENT_001_PORTRAIT |  |  | Lando Nori-Rice | web/assets/sport/slots/SPC_CAR_ENT_001.webp |
| ART_SPC_CAR_ENT_002 | portrait-slot | SPC_CAR_ENT_002 | SPC_CAR_ENT_002_PORTRAIT |  |  | Oscar Pie-Astro | web/assets/sport/slots/SPC_CAR_ENT_002.webp |
| ART_SPC_CAR_ENT_003 | portrait-slot | SPC_CAR_ENT_003 | SPC_CAR_ENT_003_PORTRAIT |  |  | Charlie LaCrêpe | web/assets/sport/slots/SPC_CAR_ENT_003.webp |
| ART_SPC_CAR_ENT_004 | portrait-slot | SPC_CAR_ENT_004 | SPC_CAR_ENT_004_PORTRAIT |  |  | Lewie Ham-a-Ton | web/assets/sport/slots/SPC_CAR_ENT_004.webp |
| ART_SPC_CAR_ENT_005 | portrait-slot | SPC_CAR_ENT_005 | SPC_CAR_ENT_005_PORTRAIT |  |  | Georgie Rustle | web/assets/sport/slots/SPC_CAR_ENT_005.webp |
| ART_SPC_CAR_ENT_006 | portrait-slot | SPC_CAR_ENT_006 | SPC_CAR_ENT_006_PORTRAIT |  |  | Kimi Anti-Noodle | web/assets/sport/slots/SPC_CAR_ENT_006.webp |
| ART_SPC_CAR_ENT_007 | portrait-slot | SPC_CAR_ENT_007 | SPC_CAR_ENT_007_PORTRAIT |  |  | Max Verstomper | web/assets/sport/slots/SPC_CAR_ENT_007.webp |
| ART_SPC_CAR_ENT_008 | portrait-slot | SPC_CAR_ENT_008 | SPC_CAR_ENT_008_PORTRAIT |  |  | Isaac Hat-Jar | web/assets/sport/slots/SPC_CAR_ENT_008.webp |
| ART_SPC_CAR_ENT_009 | portrait-slot | SPC_CAR_ENT_009 | SPC_CAR_ENT_009_PORTRAIT |  |  | Nico Hula-Burger | web/assets/sport/slots/SPC_CAR_ENT_009.webp |
| ART_SPC_CAR_ENT_010 | portrait-slot | SPC_CAR_ENT_010 | SPC_CAR_ENT_010_PORTRAIT |  |  | Gabe Burrito-Letto | web/assets/sport/slots/SPC_CAR_ENT_010.webp |
| ART_SPC_CAR_ENT_011 | portrait-slot | SPC_CAR_ENT_011 | SPC_CAR_ENT_011_PORTRAIT |  |  | Carlos Saucez | web/assets/sport/slots/SPC_CAR_ENT_011.webp |
| ART_SPC_CAR_ENT_012 | portrait-slot | SPC_CAR_ENT_012 | SPC_CAR_ENT_012_PORTRAIT |  |  | Alex All-Bun | web/assets/sport/slots/SPC_CAR_ENT_012.webp |
| ART_SPC_CAR_ENT_013 | portrait-slot | SPC_CAR_ENT_013 | SPC_CAR_ENT_013_PORTRAIT |  |  | Crumbly McGear | web/assets/sport/slots/SPC_CAR_ENT_013.webp |
| ART_SPC_CAR_ENT_014 | portrait-slot | SPC_CAR_ENT_014 | SPC_CAR_ENT_014_PORTRAIT |  |  | Toffee Treadwell | web/assets/sport/slots/SPC_CAR_ENT_014.webp |
| ART_SPC_CAR_ENT_015 | portrait-slot | SPC_CAR_ENT_015 | SPC_CAR_ENT_015_PORTRAIT |  |  | Dill Driftwood | web/assets/sport/slots/SPC_CAR_ENT_015.webp |
| ART_SPC_CAR_ENT_016 | portrait-slot | SPC_CAR_ENT_016 | SPC_CAR_ENT_016_PORTRAIT |  |  | Gherkin Gearbox | web/assets/sport/slots/SPC_CAR_ENT_016.webp |
| ART_SPC_CAR_ENT_017 | portrait-slot | SPC_CAR_ENT_017 | SPC_CAR_ENT_017_PORTRAIT |  |  | Maple Apex | web/assets/sport/slots/SPC_CAR_ENT_017.webp |
| ART_SPC_CAR_ENT_018 | portrait-slot | SPC_CAR_ENT_018 | SPC_CAR_ENT_018_PORTRAIT |  |  | Butter Chicane | web/assets/sport/slots/SPC_CAR_ENT_018.webp |
| ART_SPC_CAR_ENT_019 | portrait-slot | SPC_CAR_ENT_019 | SPC_CAR_ENT_019_PORTRAIT |  |  | Sandy Hairpin | web/assets/sport/slots/SPC_CAR_ENT_019.webp |
| ART_SPC_CAR_ENT_020 | portrait-slot | SPC_CAR_ENT_020 | SPC_CAR_ENT_020_PORTRAIT |  |  | Reef Downforce | web/assets/sport/slots/SPC_CAR_ENT_020.webp |
| ART_SPC_CAR_ENT_021 | portrait-slot | SPC_CAR_ENT_021 | SPC_CAR_ENT_021_PORTRAIT |  |  | Steamer Straight | web/assets/sport/slots/SPC_CAR_ENT_021.webp |
| ART_SPC_CAR_ENT_022 | portrait-slot | SPC_CAR_ENT_022 | SPC_CAR_ENT_022_PORTRAIT |  |  | Soy Sauceover | web/assets/sport/slots/SPC_CAR_ENT_022.webp |
| ART_SPC_CAR_VEH_001 | portrait-slot | SPC_CAR_VEH_001 | SPC_CAR_VEH_001_BODY |  |  | Zesteroid V1 | web/assets/sport/slots/SPC_CAR_VEH_001.webp |
| ART_SPC_CAR_VEH_002 | portrait-slot | SPC_CAR_VEH_002 | SPC_CAR_VEH_002_BODY |  |  | Pasta Rocket | web/assets/sport/slots/SPC_CAR_VEH_002.webp |
| ART_SPC_CAR_VEH_003 | portrait-slot | SPC_CAR_VEH_003 | SPC_CAR_VEH_003_BODY |  |  | Teaspoon Turbo | web/assets/sport/slots/SPC_CAR_VEH_003.webp |
| ART_SPC_CAR_VEH_004 | portrait-slot | SPC_CAR_VEH_004 | SPC_CAR_VEH_004_BODY |  |  | Moo-Boost | web/assets/sport/slots/SPC_CAR_VEH_004.webp |
| ART_SPC_CAR_VEH_005 | portrait-slot | SPC_CAR_VEH_005 | SPC_CAR_VEH_005_BODY |  |  | Pretzel Drive | web/assets/sport/slots/SPC_CAR_VEH_005.webp |
| ART_SPC_CAR_VEH_006 | portrait-slot | SPC_CAR_VEH_006 | SPC_CAR_VEH_006_BODY |  |  | Berry Burner | web/assets/sport/slots/SPC_CAR_VEH_006.webp |
| ART_SPC_CAR_VEH_007 | portrait-slot | SPC_CAR_VEH_007 | SPC_CAR_VEH_007_BODY |  |  | Crumb Coupe | web/assets/sport/slots/SPC_CAR_VEH_007.webp |
| ART_SPC_CAR_VEH_008 | portrait-slot | SPC_CAR_VEH_008 | SPC_CAR_VEH_008_BODY |  |  | Brine Bullet | web/assets/sport/slots/SPC_CAR_VEH_008.webp |
| ART_SPC_CAR_VEH_009 | portrait-slot | SPC_CAR_VEH_009 | SPC_CAR_VEH_009_BODY |  |  | Syrup Dart | web/assets/sport/slots/SPC_CAR_VEH_009.webp |
| ART_SPC_CAR_VEH_010 | portrait-slot | SPC_CAR_VEH_010 | SPC_CAR_VEH_010_BODY |  |  | Husk Hammer | web/assets/sport/slots/SPC_CAR_VEH_010.webp |
| ART_SPC_CAR_VEH_011 | portrait-slot | SPC_CAR_VEH_011 | SPC_CAR_VEH_011_BODY |  |  | Bao Booster | web/assets/sport/slots/SPC_CAR_VEH_011.webp |
| ART_SPC_MOTO_ENT_001 | portrait-slot | SPC_MOTO_ENT_001 | SPC_MOTO_ENT_001_PORTRAIT |  |  | Mako Mayhem | web/assets/sport/slots/SPC_MOTO_ENT_001.webp |
| ART_SPC_MOTO_ENT_002 | portrait-slot | SPC_MOTO_ENT_002 | SPC_MOTO_ENT_002_PORTRAIT |  |  | Paco Bagnetti | web/assets/sport/slots/SPC_MOTO_ENT_002.webp |
| ART_SPC_MOTO_ENT_003 | portrait-slot | SPC_MOTO_ENT_003 | SPC_MOTO_ENT_003_PORTRAIT |  |  | Fabio Fourturn | web/assets/sport/slots/SPC_MOTO_ENT_003.webp |
| ART_SPC_MOTO_ENT_004 | portrait-slot | SPC_MOTO_ENT_004 | SPC_MOTO_ENT_004_PORTRAIT |  |  | Pedro Acoaster | web/assets/sport/slots/SPC_MOTO_ENT_004.webp |
| ART_SPC_MOTO_ENT_005 | portrait-slot | SPC_MOTO_ENT_005 | SPC_MOTO_ENT_005_PORTRAIT |  |  | Jorge Martian | web/assets/sport/slots/SPC_MOTO_ENT_005.webp |
| ART_SPC_MOTO_ENT_006 | portrait-slot | SPC_MOTO_ENT_006 | SPC_MOTO_ENT_006_PORTRAIT |  |  | Brady Blender | web/assets/sport/slots/SPC_MOTO_ENT_006.webp |
| ART_SPC_MOTO_ENT_007 | portrait-slot | SPC_MOTO_ENT_007 | SPC_MOTO_ENT_007_PORTRAIT |  |  | Marco Buzzachi | web/assets/sport/slots/SPC_MOTO_ENT_007.webp |
| ART_SPC_MOTO_ENT_008 | portrait-slot | SPC_MOTO_ENT_008 | SPC_MOTO_ENT_008_PORTRAIT |  |  | Horizon Mirage | web/assets/sport/slots/SPC_MOTO_ENT_008.webp |
| ART_SPC_MOTO_ENT_009 | portrait-slot | SPC_MOTO_ENT_009 | SPC_MOTO_ENT_009_PORTRAIT |  |  | Torak Razzle | web/assets/sport/slots/SPC_MOTO_ENT_009.webp |
| ART_SPC_MOTO_ENT_010 | portrait-slot | SPC_MOTO_ENT_010 | SPC_MOTO_ENT_010_PORTRAIT |  |  | Ayo Oguramen | web/assets/sport/slots/SPC_MOTO_ENT_010.webp |
| ART_SPC_MOTO_ENT_011 | portrait-slot | SPC_MOTO_ENT_011 | SPC_MOTO_ENT_011_PORTRAIT |  |  | Nectar Shift | web/assets/sport/slots/SPC_MOTO_ENT_011.webp |
| ART_SPC_MOTO_ENT_012 | portrait-slot | SPC_MOTO_ENT_012 | SPC_MOTO_ENT_012_PORTRAIT |  |  | Koi Cascade | web/assets/sport/slots/SPC_MOTO_ENT_012.webp |
| ART_SPC_MOTO_ENT_013 | portrait-slot | SPC_MOTO_ENT_013 | SPC_MOTO_ENT_013_PORTRAIT |  |  | Ramen Knee | web/assets/sport/slots/SPC_MOTO_ENT_013.webp |
| ART_SPC_MOTO_ENT_014 | portrait-slot | SPC_MOTO_ENT_014 | SPC_MOTO_ENT_014_PORTRAIT |  |  | Udon Apex | web/assets/sport/slots/SPC_MOTO_ENT_014.webp |
| ART_SPC_MOTO_ENT_015 | portrait-slot | SPC_MOTO_ENT_015 | SPC_MOTO_ENT_015_PORTRAIT |  |  | Palm Visor | web/assets/sport/slots/SPC_MOTO_ENT_015.webp |
| ART_SPC_MOTO_ENT_016 | portrait-slot | SPC_MOTO_ENT_016 | SPC_MOTO_ENT_016_PORTRAIT |  |  | Reef Tuck | web/assets/sport/slots/SPC_MOTO_ENT_016.webp |
| ART_SPC_MOTO_ENT_017 | portrait-slot | SPC_MOTO_ENT_017 | SPC_MOTO_ENT_017_PORTRAIT |  |  | Bao Lean | web/assets/sport/slots/SPC_MOTO_ENT_017.webp |
| ART_SPC_MOTO_ENT_018 | portrait-slot | SPC_MOTO_ENT_018 | SPC_MOTO_ENT_018_PORTRAIT |  |  | Gyoza Hairpin | web/assets/sport/slots/SPC_MOTO_ENT_018.webp |
| ART_SPC_MOTO_ENT_019 | portrait-slot | SPC_MOTO_ENT_019 | SPC_MOTO_ENT_019_PORTRAIT |  |  | Dill Tuck | web/assets/sport/slots/SPC_MOTO_ENT_019.webp |
| ART_SPC_MOTO_ENT_020 | portrait-slot | SPC_MOTO_ENT_020 | SPC_MOTO_ENT_020_PORTRAIT |  |  | Spear Gasket | web/assets/sport/slots/SPC_MOTO_ENT_020.webp |
| ART_SPC_MOTO_ENT_021 | portrait-slot | SPC_MOTO_ENT_021 | SPC_MOTO_ENT_021_PORTRAIT |  |  | Maple Knee | web/assets/sport/slots/SPC_MOTO_ENT_021.webp |
| ART_SPC_MOTO_ENT_022 | portrait-slot | SPC_MOTO_ENT_022 | SPC_MOTO_ENT_022_PORTRAIT |  |  | Butter Apex | web/assets/sport/slots/SPC_MOTO_ENT_022.webp |
| ART_SPC_MOTO_VEH_001 | portrait-slot | SPC_MOTO_VEH_001 | SPC_MOTO_VEH_001_BODY |  |  | RubberDuck V-Quack | web/assets/sport/slots/SPC_MOTO_VEH_001.webp |
| ART_SPC_MOTO_VEH_002 | portrait-slot | SPC_MOTO_VEH_002 | SPC_MOTO_VEH_002_BODY |  |  | Petal-26 | web/assets/sport/slots/SPC_MOTO_VEH_002.webp |
| ART_SPC_MOTO_VEH_003 | portrait-slot | SPC_MOTO_VEH_003 | SPC_MOTO_VEH_003_BODY |  |  | Hammer Sixteen | web/assets/sport/slots/SPC_MOTO_VEH_003.webp |
| ART_SPC_MOTO_VEH_004 | portrait-slot | SPC_MOTO_VEH_004 | SPC_MOTO_VEH_004_BODY |  |  | Echo V4 | web/assets/sport/slots/SPC_MOTO_VEH_004.webp |
| ART_SPC_MOTO_VEH_005 | portrait-slot | SPC_MOTO_VEH_005 | SPC_MOTO_VEH_005_BODY |  |  | Phoenix 213 | web/assets/sport/slots/SPC_MOTO_VEH_005.webp |
| ART_SPC_MOTO_VEH_006 | portrait-slot | SPC_MOTO_VEH_006 | SPC_MOTO_VEH_006_BODY |  |  | Night Petal | web/assets/sport/slots/SPC_MOTO_VEH_006.webp |
| ART_SPC_MOTO_VEH_007 | portrait-slot | SPC_MOTO_VEH_007 | SPC_MOTO_VEH_007_BODY |  |  | Broth Blade | web/assets/sport/slots/SPC_MOTO_VEH_007.webp |
| ART_SPC_MOTO_VEH_008 | portrait-slot | SPC_MOTO_VEH_008 | SPC_MOTO_VEH_008_BODY |  |  | Shell Shock | web/assets/sport/slots/SPC_MOTO_VEH_008.webp |
| ART_SPC_MOTO_VEH_009 | portrait-slot | SPC_MOTO_VEH_009 | SPC_MOTO_VEH_009_BODY |  |  | Steam Slider | web/assets/sport/slots/SPC_MOTO_VEH_009.webp |
| ART_SPC_MOTO_VEH_010 | portrait-slot | SPC_MOTO_VEH_010 | SPC_MOTO_VEH_010_BODY |  |  | Brine Rocket | web/assets/sport/slots/SPC_MOTO_VEH_010.webp |
| ART_SPC_MOTO_VEH_011 | portrait-slot | SPC_MOTO_VEH_011 | SPC_MOTO_VEH_011_BODY |  |  | Syrup Snake | web/assets/sport/slots/SPC_MOTO_VEH_011.webp |

## team

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_SPC_FOOTBALL_TEA_001 | team-colour | SPC_FOOTBALL_TEA_001 |  |  |  | Royal Meringue FC | web/assets/sport/teams/SPC_FOOTBALL_TEA_001.webp |
| ART_SPC_FOOTBALL_TEA_002 | team-colour | SPC_FOOTBALL_TEA_002 |  |  |  | Catalonia Coffee Club | web/assets/sport/teams/SPC_FOOTBALL_TEA_002.webp |
| ART_SPC_FOOTBALL_TEA_003 | team-colour | SPC_FOOTBALL_TEA_003 |  |  |  | Metro Blueprints Athletic | web/assets/sport/teams/SPC_FOOTBALL_TEA_003.webp |
| ART_SPC_FOOTBALL_TEA_004 | team-colour | SPC_FOOTBALL_TEA_004 |  |  |  | Dockside Noodles | web/assets/sport/teams/SPC_FOOTBALL_TEA_004.webp |
| ART_SPC_FOOTBALL_TEA_005 | team-colour | SPC_FOOTBALL_TEA_005 |  |  |  | Banquet Select XI | web/assets/sport/teams/SPC_FOOTBALL_TEA_005.webp |
| ART_SPC_FOOTBALL_TEA_006 | team-colour | SPC_FOOTBALL_TEA_006 |  |  |  | Gherkin Rovers | web/assets/sport/teams/SPC_FOOTBALL_TEA_006.webp |
| ART_SPC_BASKET_TEA_001 | team-colour | SPC_BASKET_TEA_001 |  |  |  | Golden Snack Wafflers | web/assets/sport/teams/SPC_BASKET_TEA_001.webp |
| ART_SPC_BASKET_TEA_002 | team-colour | SPC_BASKET_TEA_002 |  |  |  | Denver Dino Nuggets | web/assets/sport/teams/SPC_BASKET_TEA_002.webp |
| ART_SPC_BASKET_TEA_003 | team-colour | SPC_BASKET_TEA_003 |  |  |  | LA Latte-Makers | web/assets/sport/teams/SPC_BASKET_TEA_003.webp |
| ART_SPC_BASKET_TEA_004 | team-colour | SPC_BASKET_TEA_004 |  |  |  | Indiana Flavor | web/assets/sport/teams/SPC_BASKET_TEA_004.webp |
| ART_SPC_BASKET_TEA_005 | team-colour | SPC_BASKET_TEA_005 |  |  |  | Hardwood Exhibition | web/assets/sport/teams/SPC_BASKET_TEA_005.webp |
| ART_SPC_BASKET_TEA_006 | team-colour | SPC_BASKET_TEA_006 |  |  |  | Gravy Garden | web/assets/sport/teams/SPC_BASKET_TEA_006.webp |
| ART_SPC_BASKET_TEA_007 | team-colour | SPC_BASKET_TEA_007 |  |  |  | Sideline Workshop | web/assets/sport/teams/SPC_BASKET_TEA_007.webp |
| ART_SPC_CAR_TEA_001 | team-colour | SPC_CAR_TEA_001 |  |  |  | Papaya Peel Racing | web/assets/sport/teams/SPC_CAR_TEA_001.webp |
| ART_SPC_CAR_TEA_002 | team-colour | SPC_CAR_TEA_002 |  |  |  | Scarlet Spaghetti Works | web/assets/sport/teams/SPC_CAR_TEA_002.webp |
| ART_SPC_CAR_TEA_003 | team-colour | SPC_CAR_TEA_003 |  |  |  | Silver Spoon GP | web/assets/sport/teams/SPC_CAR_TEA_003.webp |
| ART_SPC_CAR_TEA_004 | team-colour | SPC_CAR_TEA_004 |  |  |  | Thunder Moo Motorsport | web/assets/sport/teams/SPC_CAR_TEA_004.webp |
| ART_SPC_CAR_TEA_005 | team-colour | SPC_CAR_TEA_005 |  |  |  | Noodle Torque Racing | web/assets/sport/teams/SPC_CAR_TEA_005.webp |
| ART_SPC_CAR_TEA_006 | team-colour | SPC_CAR_TEA_006 |  |  |  | Royal Blueberries GP | web/assets/sport/teams/SPC_CAR_TEA_006.webp |
| ART_SPC_CAR_TEA_007 | team-colour | SPC_CAR_TEA_007 |  |  |  | Biscuit Axle Club | web/assets/sport/teams/SPC_CAR_TEA_007.webp |
| ART_SPC_CAR_TEA_008 | team-colour | SPC_CAR_TEA_008 |  |  |  | Pickle Piston Works | web/assets/sport/teams/SPC_CAR_TEA_008.webp |
| ART_SPC_CAR_TEA_009 | team-colour | SPC_CAR_TEA_009 |  |  |  | Waffle Wing Union | web/assets/sport/teams/SPC_CAR_TEA_009.webp |
| ART_SPC_CAR_TEA_010 | team-colour | SPC_CAR_TEA_010 |  |  |  | Coconut Coast GP | web/assets/sport/teams/SPC_CAR_TEA_010.webp |
| ART_SPC_CAR_TEA_011 | team-colour | SPC_CAR_TEA_011 |  |  |  | Dumpling Draft Team | web/assets/sport/teams/SPC_CAR_TEA_011.webp |
| ART_SPC_MOTO_TEA_001 | team-colour | SPC_MOTO_TEA_001 |  |  |  | Red Quack Works | web/assets/sport/teams/SPC_MOTO_TEA_001.webp |
| ART_SPC_MOTO_TEA_002 | team-colour | SPC_MOTO_TEA_002 |  |  |  | Purple Petal Moto | web/assets/sport/teams/SPC_MOTO_TEA_002.webp |
| ART_SPC_MOTO_TEA_003 | team-colour | SPC_MOTO_TEA_003 |  |  |  | Orange Anvil Motors | web/assets/sport/teams/SPC_MOTO_TEA_003.webp |
| ART_SPC_MOTO_TEA_004 | team-colour | SPC_MOTO_TEA_004 |  |  |  | Blue Melody Works | web/assets/sport/teams/SPC_MOTO_TEA_004.webp |
| ART_SPC_MOTO_TEA_005 | team-colour | SPC_MOTO_TEA_005 |  |  |  | Sakura Forge | web/assets/sport/teams/SPC_MOTO_TEA_005.webp |
| ART_SPC_MOTO_TEA_006 | team-colour | SPC_MOTO_TEA_006 |  |  |  | Late Bloom Garage | web/assets/sport/teams/SPC_MOTO_TEA_006.webp |
| ART_SPC_MOTO_TEA_007 | team-colour | SPC_MOTO_TEA_007 |  |  |  | Noodle Knee Sliders | web/assets/sport/teams/SPC_MOTO_TEA_007.webp |
| ART_SPC_MOTO_TEA_008 | team-colour | SPC_MOTO_TEA_008 |  |  |  | Coconut Visor Club | web/assets/sport/teams/SPC_MOTO_TEA_008.webp |
| ART_SPC_MOTO_TEA_009 | team-colour | SPC_MOTO_TEA_009 |  |  |  | Dumpling Lean Works | web/assets/sport/teams/SPC_MOTO_TEA_009.webp |
| ART_SPC_MOTO_TEA_010 | team-colour | SPC_MOTO_TEA_010 |  |  |  | Pickle Fairing Co | web/assets/sport/teams/SPC_MOTO_TEA_010.webp |
| ART_SPC_MOTO_TEA_011 | team-colour | SPC_MOTO_TEA_011 |  |  |  | Waffle Trail Gang | web/assets/sport/teams/SPC_MOTO_TEA_011.webp |

## venue

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_SPC_FOOTBALL_VEN_001 | venue | SPC_FOOTBALL_VEN_001 |  |  |  | Sangria Bernaboo Dome | web/assets/sport/venues/SPC_FOOTBALL_VEN_001.webp |
| ART_SPC_FOOTBALL_VEN_002 | venue | SPC_FOOTBALL_VEN_002 |  |  |  | Camp Noodle Colosseum | web/assets/sport/venues/SPC_FOOTBALL_VEN_002.webp |
| ART_SPC_FOOTBALL_VEN_003 | venue | SPC_FOOTBALL_VEN_003 |  |  |  | Eddy-Tea-Had Stadium | web/assets/sport/venues/SPC_FOOTBALL_VEN_003.webp |
| ART_SPC_FOOTBALL_VEN_004 | venue | SPC_FOOTBALL_VEN_004 |  |  |  | Auntie's Field | web/assets/sport/venues/SPC_FOOTBALL_VEN_004.webp |
| ART_SPC_FOOTBALL_VEN_005 | venue | SPC_FOOTBALL_VEN_005 |  |  |  | Pickle Park | web/assets/sport/venues/SPC_FOOTBALL_VEN_005.webp |
| ART_SPC_BASKET_VEN_001 | venue | SPC_BASKET_VEN_001 |  |  |  | Cheese Center | web/assets/sport/venues/SPC_BASKET_VEN_001.webp |
| ART_SPC_BASKET_VEN_002 | venue | SPC_BASKET_VEN_002 |  |  |  | Bowl Arena | web/assets/sport/venues/SPC_BASKET_VEN_002.webp |
| ART_SPC_BASKET_VEN_003 | venue | SPC_BASKET_VEN_003 |  |  |  | Crouton Arena | web/assets/sport/venues/SPC_BASKET_VEN_003.webp |
| ART_SPC_BASKET_VEN_004 | venue | SPC_BASKET_VEN_004 |  |  |  | Flavor Court | web/assets/sport/venues/SPC_BASKET_VEN_004.webp |
| ART_SPC_BASKET_VEN_005 | venue | SPC_BASKET_VEN_005 |  |  |  | Gravy Greenhouse | web/assets/sport/venues/SPC_BASKET_VEN_005.webp |

## track

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_SPC_CAR_TRK_001_TOP | track-top | SPC_CAR_TRK_001 |  |  |  | Mozza Speedway | web/assets/sport/tracks/SPC_CAR_TRK_001-top.webp |
| ART_SPC_CAR_TRK_002_TOP | track-top | SPC_CAR_TRK_002 |  |  |  | Monocle Harbor Loop | web/assets/sport/tracks/SPC_CAR_TRK_002-top.webp |
| ART_SPC_CAR_TRK_003_TOP | track-top | SPC_CAR_TRK_003 |  |  |  | Sushi-Zag Circuit | web/assets/sport/tracks/SPC_CAR_TRK_003-top.webp |
| ART_SPC_CAR_TRK_004_TOP | track-top | SPC_CAR_TRK_004 |  |  |  | Silver Spoonstone | web/assets/sport/tracks/SPC_CAR_TRK_004-top.webp |
| ART_SPC_CAR_TRK_005_TOP | track-top | SPC_CAR_TRK_005 |  |  |  | Spa-ghetti Summit | web/assets/sport/tracks/SPC_CAR_TRK_005-top.webp |
| ART_SPC_CAR_TRK_006_TOP | track-top | SPC_CAR_TRK_006 |  |  |  | Singa-Pour Night Loop | web/assets/sport/tracks/SPC_CAR_TRK_006-top.webp |
| ART_SPC_MOTO_TRK_001_TOP | track-top | SPC_MOTO_TRK_001 |  |  |  | Mushgello Valley | web/assets/sport/tracks/SPC_MOTO_TRK_001-top.webp |
| ART_SPC_MOTO_TRK_002_TOP | track-top | SPC_MOTO_TRK_002 |  |  |  | Sausage Ring | web/assets/sport/tracks/SPC_MOTO_TRK_002-top.webp |
| ART_SPC_MOTO_TRK_003_TOP | track-top | SPC_MOTO_TRK_003 |  |  |  | Pillow Island | web/assets/sport/tracks/SPC_MOTO_TRK_003-top.webp |
| ART_SPC_MOTO_TRK_004_TOP | track-top | SPC_MOTO_TRK_004 |  |  |  | Ramen Temple Raceway | web/assets/sport/tracks/SPC_MOTO_TRK_004-top.webp |
| ART_SPC_MOTO_TRK_005_TOP | track-top | SPC_MOTO_TRK_005 |  |  |  | Canal Zigzag | web/assets/sport/tracks/SPC_MOTO_TRK_005-top.webp |
| ART_SPC_MOTO_TRK_006_TOP | track-top | SPC_MOTO_TRK_006 |  |  |  | Corners of Chaos | web/assets/sport/tracks/SPC_MOTO_TRK_006-top.webp |

## track-side

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_SPC_CAR_TRK_001_SIDE | track-side | SPC_CAR_TRK_001 |  |  |  | Mozza Speedway | web/assets/sport/tracks/SPC_CAR_TRK_001-side.webp |
| ART_SPC_CAR_TRK_002_SIDE | track-side | SPC_CAR_TRK_002 |  |  |  | Monocle Harbor Loop | web/assets/sport/tracks/SPC_CAR_TRK_002-side.webp |
| ART_SPC_CAR_TRK_003_SIDE | track-side | SPC_CAR_TRK_003 |  |  |  | Sushi-Zag Circuit | web/assets/sport/tracks/SPC_CAR_TRK_003-side.webp |
| ART_SPC_CAR_TRK_004_SIDE | track-side | SPC_CAR_TRK_004 |  |  |  | Silver Spoonstone | web/assets/sport/tracks/SPC_CAR_TRK_004-side.webp |
| ART_SPC_CAR_TRK_005_SIDE | track-side | SPC_CAR_TRK_005 |  |  |  | Spa-ghetti Summit | web/assets/sport/tracks/SPC_CAR_TRK_005-side.webp |
| ART_SPC_CAR_TRK_006_SIDE | track-side | SPC_CAR_TRK_006 |  |  |  | Singa-Pour Night Loop | web/assets/sport/tracks/SPC_CAR_TRK_006-side.webp |
| ART_SPC_MOTO_TRK_001_SIDE | track-side | SPC_MOTO_TRK_001 |  |  |  | Mushgello Valley | web/assets/sport/tracks/SPC_MOTO_TRK_001-side.webp |
| ART_SPC_MOTO_TRK_002_SIDE | track-side | SPC_MOTO_TRK_002 |  |  |  | Sausage Ring | web/assets/sport/tracks/SPC_MOTO_TRK_002-side.webp |
| ART_SPC_MOTO_TRK_003_SIDE | track-side | SPC_MOTO_TRK_003 |  |  |  | Pillow Island | web/assets/sport/tracks/SPC_MOTO_TRK_003-side.webp |
| ART_SPC_MOTO_TRK_004_SIDE | track-side | SPC_MOTO_TRK_004 |  |  |  | Ramen Temple Raceway | web/assets/sport/tracks/SPC_MOTO_TRK_004-side.webp |
| ART_SPC_MOTO_TRK_005_SIDE | track-side | SPC_MOTO_TRK_005 |  |  |  | Canal Zigzag | web/assets/sport/tracks/SPC_MOTO_TRK_005-side.webp |
| ART_SPC_MOTO_TRK_006_SIDE | track-side | SPC_MOTO_TRK_006 |  |  |  | Corners of Chaos | web/assets/sport/tracks/SPC_MOTO_TRK_006-side.webp |

## pitch

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_PITCH_TOP | pitch-top | pitch-top |  |  |  |  | web/assets/sport/fields/pitch-top.webp |
| ART_PITCH_SIDE | pitch-side | pitch-side |  |  |  |  | web/assets/sport/fields/pitch-side.webp |

## court

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_COURT_TOP | court-top | court-top |  |  |  |  | web/assets/sport/fields/court-top.webp |
| ART_COURT_SIDE | court-side | court-side |  |  |  |  | web/assets/sport/fields/court-side.webp |

## prematch

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_PREMATCH_FOOTBALL | prematch | prematch-football |  |  |  |  | web/assets/sport/prematch/football.webp |
| ART_PREMATCH_BASKET | prematch | prematch-basket |  |  |  |  | web/assets/sport/prematch/basket.webp |
| ART_PREMATCH_CAR | prematch | prematch-car |  |  |  |  | web/assets/sport/prematch/car.webp |
| ART_PREMATCH_MOTO | prematch | prematch-moto |  |  |  |  | web/assets/sport/prematch/moto.webp |

## layout

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_LAYOUT_FOOTBALL | layout-chrome | layout-football |  |  |  |  | web/assets/sport/prematch/football-chrome.webp |
| ART_LAYOUT_BASKET | layout-chrome | layout-basket |  |  |  |  | web/assets/sport/prematch/basket-chrome.webp |
| ART_LAYOUT_CAR | layout-chrome | layout-car |  |  |  |  | web/assets/sport/prematch/car-chrome.webp |
| ART_LAYOUT_MOTO | layout-chrome | layout-moto |  |  |  |  | web/assets/sport/prematch/moto-chrome.webp |

## result

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_RESULT_FOOTBALL | result | result-football |  |  |  |  | web/assets/sport/results/football.webp |
| ART_RESULT_BASKET | result | result-basket |  |  |  |  | web/assets/sport/results/basket.webp |
| ART_RESULT_CAR | result | result-car |  |  |  |  | web/assets/sport/results/car.webp |
| ART_RESULT_MOTO | result | result-moto |  |  |  |  | web/assets/sport/results/moto.webp |

## formation

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_FORMATION_4_3_3 | formation | formation-4-3-3 |  | SPC_FOOTBALL_TAC_001 |  |  | web/assets/sport/tactics/formation-4-3-3.webp |
| ART_FORMATION_4_2_3_1 | formation | formation-4-2-3-1 |  | SPC_FOOTBALL_TAC_002 |  |  | web/assets/sport/tactics/formation-4-2-3-1.webp |
| ART_FORMATION_3_5_2 | formation | formation-3-5-2 |  | SPC_FOOTBALL_TAC_003 |  |  | web/assets/sport/tactics/formation-3-5-2.webp |
| ART_FORMATION_4_4_2 | formation | formation-4-4-2 |  | SPC_FOOTBALL_TAC_004 |  |  | web/assets/sport/tactics/formation-4-4-2.webp |
| ART_FORMATION_3_4_3 | formation | formation-3-4-3 |  | SPC_FOOTBALL_TAC_005 |  |  | web/assets/sport/tactics/formation-3-4-3.webp |

## scheme

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_SCHEME_MAN | scheme | scheme-man |  | SPC_BASKET_TAC_001 |  | man-to-man | web/assets/sport/tactics/scheme-man.webp |
| ART_SCHEME_TWO_THREE | scheme | scheme-two-three |  | SPC_BASKET_TAC_002 |  | 2-3 zone | web/assets/sport/tactics/scheme-two-three.webp |
| ART_SCHEME_MATCHUP | scheme | scheme-matchup |  | SPC_BASKET_TAC_003 |  | matchup zone | web/assets/sport/tactics/scheme-matchup.webp |

## icon

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_TYRE_CAR_SOFT | tyre | tyre-car-soft |  | SPC_CAR_TAC_001 |  |  | web/assets/sport/selectors/tyre-car-soft.webp |
| ART_TYRE_CAR_MEDIUM | tyre | tyre-car-medium |  | SPC_CAR_TAC_002 |  |  | web/assets/sport/selectors/tyre-car-medium.webp |
| ART_TYRE_CAR_HARD | tyre | tyre-car-hard |  | SPC_CAR_TAC_003 |  |  | web/assets/sport/selectors/tyre-car-hard.webp |
| ART_TYRE_CAR_INTER | tyre | tyre-car-inter |  | SPC_CAR_TAC_004 |  |  | web/assets/sport/selectors/tyre-car-inter.webp |
| ART_TYRE_CAR_WET | tyre | tyre-car-wet |  | SPC_CAR_TAC_005 |  |  | web/assets/sport/selectors/tyre-car-wet.webp |
| ART_TYRE_MOTO_SOFT | tyre | tyre-moto-soft |  | SPC_MOTO_TAC_001 |  |  | web/assets/sport/selectors/tyre-moto-soft.webp |
| ART_TYRE_MOTO_MEDIUM | tyre | tyre-moto-medium |  | SPC_MOTO_TAC_002 |  |  | web/assets/sport/selectors/tyre-moto-medium.webp |
| ART_TYRE_MOTO_HARD | tyre | tyre-moto-hard |  | SPC_MOTO_TAC_003 |  |  | web/assets/sport/selectors/tyre-moto-hard.webp |
| ART_TYRE_MOTO_WET | tyre | tyre-moto-wet |  | SPC_MOTO_TAC_004 |  |  | web/assets/sport/selectors/tyre-moto-wet.webp |
| ART_SETUP_CAR_AERO_LOW | setup | setup-car-aero-low |  |  |  |  | web/assets/sport/selectors/setup-car-aero-low.webp |
| ART_SETUP_CAR_AERO_MID | setup | setup-car-aero-mid |  |  |  |  | web/assets/sport/selectors/setup-car-aero-mid.webp |
| ART_SETUP_CAR_AERO_HIGH | setup | setup-car-aero-high |  |  |  |  | web/assets/sport/selectors/setup-car-aero-high.webp |
| ART_SETUP_CAR_RISK_CALM | setup | setup-car-risk-calm |  |  |  |  | web/assets/sport/selectors/setup-car-risk-calm.webp |
| ART_SETUP_CAR_RISK_BOLD | setup | setup-car-risk-bold |  |  |  |  | web/assets/sport/selectors/setup-car-risk-bold.webp |
| ART_SETUP_CAR_RISK_RECKLESS | setup | setup-car-risk-reckless |  |  |  |  | web/assets/sport/selectors/setup-car-risk-reckless.webp |
| ART_SETUP_MOTO_PRESET_SPEED | setup | setup-moto-preset-speed |  | SPC_MOTO_TAC_005 |  |  | web/assets/sport/selectors/setup-moto-preset-speed.webp |
| ART_SETUP_MOTO_PRESET_HANDLING | setup | setup-moto-preset-handling |  | SPC_MOTO_TAC_006 |  |  | web/assets/sport/selectors/setup-moto-preset-handling.webp |
| ART_SETUP_MOTO_PRESET_BALANCED | setup | setup-moto-preset-balanced |  | SPC_MOTO_TAC_007 |  |  | web/assets/sport/selectors/setup-moto-preset-balanced.webp |
| ART_SETUP_MOTO_PRESET_WET | setup | setup-moto-preset-wet |  | SPC_MOTO_TAC_008 |  |  | web/assets/sport/selectors/setup-moto-preset-wet.webp |

## scoreboard

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_SCOREBOARD_FOOTBALL | scoreboard | scoreboard-football |  |  |  |  | web/assets/sport/chrome/scoreboard-football.webp |
| ART_SCOREBOARD_BASKET | scoreboard | scoreboard-basket |  |  |  |  | web/assets/sport/chrome/scoreboard-basket.webp |

## tower

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_TOWER_CAR | timing-tower | tower-car |  |  |  |  | web/assets/sport/chrome/tower-car.webp |
| ART_TOWER_MOTO | timing-tower | tower-moto |  |  |  |  | web/assets/sport/chrome/tower-moto.webp |

## gantry

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_GANTRY_UNLIT | gantry | gantry-unlit |  |  |  |  | web/assets/sport/chrome/gantry-unlit.webp |
| ART_GANTRY_LIT | gantry | gantry-lit |  |  |  |  | web/assets/sport/chrome/gantry-lit.webp |

## podium

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_PODIUM | podium | podium |  |  |  |  | web/assets/sport/results/podium.webp |

## hub

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_HUB_EXTERIOR | hub | hub-exterior |  |  |  |  | web/assets/sport/hub/exterior.webp |
| ART_HUB_INTERIOR | hub | hub-interior |  |  |  |  | web/assets/sport/hub/interior.webp |

## portal

| asset_id | slot | subject_id | content_slot | content_id | rarity | parody | path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART_PORTAL_FOOTBALL | portal | portal-football |  |  |  |  | web/assets/sport/hub/portal-football.webp |
| ART_PORTAL_BASKET | portal | portal-basket |  |  |  |  | web/assets/sport/hub/portal-basket.webp |
| ART_PORTAL_CAR | portal | portal-car |  |  |  |  | web/assets/sport/hub/portal-car.webp |
| ART_PORTAL_MOTO | portal | portal-moto |  |  |  |  | web/assets/sport/hub/portal-moto.webp |

## Gaps

- Portraits and vehicle paintings are not in this pack. Silhouette slots are the drop-in. The artist notes in `PARODY_NAMES.md` (helmet gags, kit jokes, machine details) are for the Owner's drawings.
- No rarity is assigned to any participant. Frames exist for N, R, Epic, and EX so data can point at one later.
- Circuits are original ribbons that follow the researched character (long straight, tight harbor, elevation, night streets). They are not tracings.
- `ART_PITCH_*` and `ART_COURT_*` are shared playback boards. Venue art is the establishing picture, not a second set of markings.
- Indiana Flavor now has `SPC_BASKET_VEN_004` Flavor Court from the parody sheet. Bowl Arena and Crouton Arena have no home team on that sheet.
- Accel and Handling are not drawn as measurements.
- `ip_review: true` on a slot means the parody name is still a close echo. The placeholder stays generic.
- `SPC_CAR_TAC_006` is a pit-window choice. There is no separate icon. The timing tower is the readout.
- Car aero and risk chips are selector art. They are not tactic cards.

