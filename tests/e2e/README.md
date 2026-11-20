# v0.5 browser smoke

Stream C owns `web/`. This folder does not start a browser unless that tree and Playwright are both present.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

`npm run test:e2e` prints `SKIP` and exits 0 when `web/index.html` is missing or Playwright is not installed. That result is a skip, not a pass. The node test `QA-10 e2e smoke Deck Battle Rewards` stays todo until `web/` lands.

The Playwright spec `v05-loop.smoke.spec.js` is landscape 1280×720. It expects `web/index.html` to expose:

- `data-testid="rotate-overlay"` (hidden in landscape)
- `data-testid="nav-deck"`
- `data-testid="deck-confirm"`
- `data-testid="nav-battle"`
- `data-testid="end-turn"`
- `data-testid="nav-rewards"`
- `data-testid="rewards-panel"`

`node --test` does not collect `*.spec.js`.
