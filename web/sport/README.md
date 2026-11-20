# Sports Complex web (v0.6)

Phone-landscape UI for four auto sports. It lives on the same 1672×941 stage as the rest of the game, so 844×390, 667×375, 915×412, and 1280×720 only scale that stage. Buttons are laid out inside the stage and do not scroll themselves off it.

## Map hook

`web/js/screens/map.js` calls `isSportsComplexHotspot` and `openSportsComplex` from `web/sport/map-hook.js`. The Sports Complex building stays `locked: true` in `web/assets-manifest.json` (that flag is v0.5 data). The hook is what opens the hub. Leaving the hub returns through the existing map `goto('map')`. No other hotspot changes.

## Live switch (integration/v06-sport)

Screens and `session.js` read cards, sims, pulls, and tuning through `web/sport/live/index.js`:

- cards, teams, venues, tactics, banner cost/odds/pity: `web/sport/live/content.public.json`, generated from `content/v06/sport/index.json` by `node tools/sport-web/build-public-content.mjs` (parody fields only; `real` blocks never ship; `--check` fails when stale)
- sims: `src/sport/football`, `src/sport/basket`, `src/sport/car`, `src/sport/moto` (display fields are added by `live/simulate.js`; the sim result is unchanged)
- wallet, gacha, save: `src/sport/wallet`, `src/sport/gacha` (content pools passed as a transient tuning override), `src/sport/save` (v3 `profile.sport`)
- adapter choices that fill contract gaps: `web/sport/live/tuning.js` (all PROPOSED)

The web stream's fixture adapters (`web/sport/fixtures/`) were removed at integration: the fixture catalog embedded real names and source URLs, and real identity must not ship in `web/` or the built HTML. There is no runtime fallback; the live adapter is the only source. The web stream's unit tests now run against the live adapter (`tests/sport/web/live-adapter.test.js`). Status PROPOSED.

## Art

Every picture is an entry in `web/sport/art-manifest.json`. `file` is a path relative to `web/sport/`. `null` draws the shape placeholder. Replace a file path to swap art. Placeholder shapes are geometric. No logos, no likenesses.

## Wallet and save

Sport G is the profile's existing `currency.G` / `currencyG`. If the profile has no balance yet, the session grants the PROPOSED preview amount from `live/tuning.js` once (ledger txn `SPORT_PREVIEW_GRANT`). Roster, pity, and the sport ledger live on `profile.sport` (save v3 shape) and are written back after every reward and pull; the host `persist` hook saves them. `web/js/engine-session.js` mirrors `profile.sport` onto the saved top-level profile. v1/v2 saves load unchanged and gain an empty sport block plus the PROPOSED starter roster. Lineups are rebuilt from the roster on load.

## Playback

The auto sim does not start by itself. Play advances the log in place. Speed is x1, x2, or x4. Skip and Result open the result screen. The result grants G once per event id.

Visible numbers are labelled PROPOSED. Status words for a finished product are not used.
