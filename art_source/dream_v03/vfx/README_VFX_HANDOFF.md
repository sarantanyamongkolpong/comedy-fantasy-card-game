# Comedy Fantasy Card Game — VFX Art Phase 3

Status: `GENERATED_REVIEW` — owner visual approval and integration QA still required.

Generated with the built-in image-generation tool from the approved premium comedic-fantasy art direction. These files are **individual static overlay keyframe PNGs**, not animation sequences or sprite sheets. They do not define game-balance values or change the existing battle engine.

## Files

| File | Purpose | Suggested compositing context |
| --- | --- | --- |
| `vfx_taunt.png` | Red/gold exclamation-shaped provocation aura | Above or beside the targeted taunting unit |
| `vfx_critical_hit.png` | Golden high-impact starburst | Briefly centered at the target hit point |
| `vfx_card_draw.png` | Three blank magic cards with blue trailing energy | Moving from deck position toward hand |
| `vfx_card_discard.png` | Blank card dissolving into violet spiral | Moving from hand toward discard pile |
| `vfx_card_upgrade.png` | Blank card bathed in purple-to-gold upward energy | Card-enhancement success reveal |
| `vfx_reward_coin_burst.png` | Outward gold-coin and confetti shower | Post-battle rewards panel |

## Technical QA

- All six delivered assets: **PNG, 1254 × 1254 px, RGBA with transparent alpha**.
- Alpha transparency was checked using ImageMagick; none are globally opaque, and all four corners sample as fully transparent.
- Standalone independent overlays: no background scenes, gameplay numbers, card text, or UI panels baked into the images.
- For web and landscape mobile use, render with alpha-enabled composition above existing screen elements. Downscale visually to the target device resolution; keep source images as replaceable files referenced by manifest.
- Suggested animation, timing, anchoring, and scale are implementation choices for Mira, **not locked design requirements**. No animation frames or frame timing are provided.

## Integration boundary

Do not overwrite Mira's existing battle backgrounds, HUD elements, or Git branches. Add these art assets only after owner review, using independent file references and a reversible manifest mapping. Existing Phase 2 battle FX are separate files under `art_production_v02/combat/`.

