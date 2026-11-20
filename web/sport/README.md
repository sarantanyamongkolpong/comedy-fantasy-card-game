# Sports Complex web (v0.6)

Phone-landscape UI for four auto sports. It lives on the same 1672×941 stage as the rest of the game, so 844×390, 667×375, 915×412, and 1280×720 only scale that stage. Buttons are laid out inside the stage and do not scroll themselves off it.

## Map hook

`web/js/screens/map.js` calls `isSportsComplexHotspot` and `openSportsComplex` from `web/sport/map-hook.js`. The Sports Complex building stays `locked: true` in `web/assets-manifest.json` (that flag is v0.5 data). The hook is what opens the hub. Leaving the hub returns through the existing map `goto('map')`. No other hotspot changes.

## Fixture switch

Screens read cards, sims, pulls, and tuning through `web/sport/fixtures/index.js`. Swap that one module when `content/v06/sport` and `src/sport` land. See `web/sport/fixtures/README.md`.

## Art

Every picture is an entry in `web/sport/art-manifest.json`. `file` is a path relative to `web/sport/`. `null` draws the shape placeholder. Replace a file path to swap art. Placeholder shapes are geometric. No logos, no likenesses.

## Wallet

Sport G is the profile's existing `currency.G` / `currencyG`. If the profile has no balance yet, the session grants the PROPOSED preview amount from `fixtures/tuning.js` once. Roster, pity, and the sport ledger stay in memory until save v3 arrives, so a reload keeps a saved G number and rebuilds the starter roster.

## Playback

The auto sim does not start by itself. Play advances the log in place. Speed is x1, x2, or x4. Skip and Result open the result screen. The result grants G once per event id.

Visible numbers are labelled PROPOSED. Status words for a finished product are not used.
