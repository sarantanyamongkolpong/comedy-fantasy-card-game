#!/usr/bin/env node
/**
 * Add one replaceable portrait slot per content/v06/sport card to web/sport/art-manifest.json.
 * Idempotent. Portrait slots whose subject is no longer a content card (the removed fixture
 * cards) are pruned. New slots use the sport's default placeholder shape. file stays null
 * (shape placeholder). Status PROPOSED.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const manifestUrl = new URL('../../web/sport/art-manifest.json', import.meta.url);
const content = JSON.parse(readFileSync(new URL('../../web/sport/live/content.public.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));
const liveIds = new Set(Object.values(content.sports).flatMap((block) => block.cards.map((card) => card.id)));
const before = manifest.assets.length;
manifest.assets = manifest.assets.filter((asset) => asset.slot !== 'portrait' || liveIds.has(asset.subjectId));
const pruned = before - manifest.assets.length;
const bySubject = new Map(manifest.assets.map((asset) => [asset.subjectId, asset]));
const SPORT_DEFAULT = {
  football: { kind: 'badge', primary: '#1f6b3a', secondary: '#e6c36a', accent: '#f4e2c4', mark: 'ball' },
  basket: { kind: 'badge', primary: '#7a3b12', secondary: '#f2a65a', accent: '#f4e2c4', mark: 'hoop' },
  car: { kind: 'badge', primary: '#5a1a1a', secondary: '#d5d5d5', accent: '#f4e2c4', mark: 'car' },
  moto: { kind: 'badge', primary: '#3a2458', secondary: '#d5d5d5', accent: '#f4e2c4', mark: 'moto' },
};
let added = 0;
for (const [sport, block] of Object.entries(content.sports)) {
  for (const card of block.cards) {
    if (bySubject.has(card.id)) continue;
    const entry = {
      id: `SPORT_ART_${card.id}`,
      slot: 'portrait',
      subjectId: card.id,
      contentSlot: card.art.slot,
      placeholder: true,
      status: 'PROPOSED',
      alt: 'Placeholder',
      file: null,
      shape: structuredClone(SPORT_DEFAULT[sport]),
    };
    manifest.assets.push(entry);
    bySubject.set(card.id, entry);
    added += 1;
  }
}
writeFileSync(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`added ${added} content portrait slots, pruned ${pruned} orphan portrait slots`);
