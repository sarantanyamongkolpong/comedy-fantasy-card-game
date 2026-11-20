# Agent E audit — Battle & Prep visual polish

Owner order t270u. Base `prod/wave-base` @ `7cbf071`. This note is the stream report the order asked for. It does not change rules, ids, or economy.

Review mark used below: `GENERATED_REVIEW` means the art is new and waiting for review. Nothing in this stream is `OWNER_APPROVED`, `LOCKED`, or `PRODUCTION_READY`.

## What Mira already finished (do not rebuild)

Measured on this branch. These stay as they are.

| Piece | Where | State |
|---|---|---|
| Letterboxed 1672×941 stage | `web/js/stage.js` | Scales by `min(viewport / 1672, viewport / 941)` and letterboxes the spare space. Not touched. |
| Flow Map → Prep Battle → Battle → Rewards | `web/js/app.js`, `web/js/screens/prep.js`, `web/js/screens/battle.js` | Prep primary control is the text `START BATTLE`. Battle has an `AUTO` button wired to the engine. `SYNC` is absent. Not retitled. |
| Mirrored field | `web/js/battle-layout.js` | Player feet on the left half, enemy feet on the right half. Four seats a side. Hit boxes do not intersect each other, the lead plate, or the hand band (`tests/web/battle-layout.test.js`). |
| FRONT / BACK | `data-row` on each unit | Rows are visual seats only. The stage text does not contain `FRONT` (covered by `tests/web/auto-battle.playwright.test.js`). |
| Prep composition | `web/js/prep-layout.js` | Team, arena preview, deck, detail, Back, and Start do not overlap. Preview tokens sit on the left arena. Prep sprite boxes (160×210, bottom-anchored) do not intersect each other. |
| Backgrounds | manifest `BG_BATTLE`, `BG_PREP` | Mira `web/assets/generated/backgrounds/BG_BATTLE.webp` and `BG_PREP.webp` are the primary stage art (`review_status: GENERATED_REVIEW`, `placeholder: false`). Dream `BG_BATTLE_ALT_TOWER` is `default: false` and stays an alternate. Not replaced. |
| Card faces | `web/js/card-layers.js`, `web/js/render-card.js` | Layered interior, illustration, rarity frame, badge, and HTML text. Ornate rarity frames already exist as `web/assets/generated/frames/FRAME_*.webp`. Those files are outside this stream. Not redrawn. |
| Battle log floaters | `web/js/combat-fx.js` | Already reads `state.log` (the engine log, not the AUTO action list). `damage` uses `delta`, `shield` uses `amount`, `regen_applied` is the cast line, `regen_tick` is the heal (`+healed`). |
| Status paintings already bound | manifest `battle-vfx` | Dream shield dome, regen heart, taunt crest, and KO mark are registered. Taunt, regen, and KO mount when `unit.statuses` contains that id. |
| Placeholder plates | `web/assets/battle/*.svg` | `BTN_START_BATTLE`, `BTN_END_TURN`, `BTN_BACK`, panels, badges, and `PIP_AP` are `placeholder: true`. `paintIfReady` skips them, so the live chrome is the CSS plate in `web/css/app.css`, not those SVGs. Left in place as the fallback files. |

Engine formulas, skill text, card stats, and `src/engine/**` are out of scope and were not edited.

## Defects this stream is allowed to fix

Presentation only. Layout numbers in `battle-layout.js` and `prep-layout.js` stay the measured feet and bands.

1. **Character sprites overlap.** `web/css/app.css` draws `.battle .sprite` at 230×360, centered on a 116×210 hit box. On the 1672×941 stage the painted rects intersect: `p0×p2`, `p1×p3`, `p2×p3`, and the mirrored `e0×e2`, `e1×e3`, `e2×e3`. Enemy back sprites also intersect the lead plate (`e0`, `e1`). The hit boxes themselves do not. The same overlap scales into every viewport because the stage is one uniform scale.
2. **Hand cards overlap the pile and control bands.** Five cards at 186px with `margin-left: -28px` are 818px wide. The hand band is 680px (`x: 404`). The centered fan runs from x 335 to 1153, through the piles (end x 392) and into the controls (start x 1096).
3. **Status VFX can spill.** `.unit .vfx` is inset `-50%` on the left and right, wider than the gap between front-row seats (31px).
4. **Shield pool never reaches the bar or the dome.** The engine stores shield on `avatar.shield` and logs `type: 'shield'`. It is not a `statuses` entry. `presentUnit` does not copy `shield`, and `statusVfx` only looks at status ids, so `VFX_STATUS_SHIELD` does not mount and the HP bar has no shield layer.
5. **Buffs have no VFX.** `buff` and `next_attack` become a text floater only. There is no debuff op in `EFFECT_OPS` (`damage`, `shield`, `taunt`, `buff`, `regen`, `draw`, `next_attack`, `trigger_active`, `retrieve`). A debuff painting is shipped for a status that already says debuff, and it stays hidden otherwise.
6. **Chrome moves by itself.** Battle sprites use `idle-bob` (infinite). Log floaters and the status labels reuse `float-up` infinite, so a number keeps traveling after the event. The locked rule is that the UI does not move on its own. A combat number may play once when a log row creates it. Seats, buttons, bars, and cards do not bob.
7. **AP pips and plates are flat.** Pips are CSS diamonds. `PIP_AP.svg` is unused. Plates are a navy gradient and a 3px gold stroke. They do not match the gilded arena in Mira's battle and prep backgrounds.

## What this stream adds

Owned paths only, plus two shared hooks:

- `web/css/battle-polish.css` — frame, gem, bar, shadow, floater, and containment styling. No image filename in the file. Art URLs are custom properties set from the fragment.
- `web/js/battle-fx/**` — fit math, shield ratio, status flags, log-floater tones, and a DOM pass.
- `art-src/battle-ui/**` — original SVG. No logos, no likenesses, no gameplay words.
- `web/assets/battle-ui/**` — WebP rasterized from those SVGs.
- `web/manifests/battle-ui.json` — fragment. `review_status` is `GENERATED_REVIEW`. `status` stays `CONCEPT` because `ASSET_STATUSES` has no `GENERATED_REVIEW` value and `validateAssetManifest` would reject it. That is the same split the existing generated art uses.
- `tests/prod/e/**` — node checks plus Playwright overlap at 844×390, 667×375, 915×412, 1280×720, 932×430, and 1024×768.

Shared hooks, and only these:

- `web/index.html` — stylesheet link after `app.css`.
- `web/js/app.js` — import `applyBattlePolish` and call it for Prep and Battle after the screen is built.

`battle-layout.js`, `prep-layout.js`, `battle-flow.js`, `combat-fx.js`, `render-card.js`, `card-layers.js`, and `src/engine/**` are not modified. Floaters keep coming from `combatFx`.

## What the paint pass found after the audit

- `renderBattle` reads the log and then `settle()` paints again in the same turn, so the first DOM (the one that held the numbers) is replaced before the browser paints. `holdLogFx` keeps those same rows until the frame after the last paint. It does not invent numbers and it does not change the log.
- The file:// playable (`web/tools/build-single-html`) inlines `app.css` and the main manifest only. esbuild's bundle has no `import.meta.url`. `battleUiUrl` returns an empty string in that bundle, so Prep still opens and no broken frame image is inserted. The http app, which loads `battle-polish.css`, is the polished surface.
- The battle notice (`.toast`) still sits on the pile buttons. That placement is Mira's `app.css` rule. This stream does not move bands.
- There is still no debuff op. The debuff sigil stays hidden unless a status already says debuff.
