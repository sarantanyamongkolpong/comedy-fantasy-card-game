import assert from 'node:assert/strict';
import test from 'node:test';
import { simulateMatch } from '../../../tools/qa/battle-sim.mjs';

test('one AUTO seed is deterministic and flat_atk is the selected preset', () => {
  const current = simulateMatch({ seed: 4, preset: null, mode: 'tower' });
  const again = simulateMatch({ seed: 4, preset: null, mode: 'tower' });
  const flat = simulateMatch({ seed: 4, preset: 'flat_atk', mode: 'tower' });
  assert.equal(current.crash, null);
  assert.equal(current.stall, null);
  assert.equal(current.decided, true);
  assert.equal(current.preset, 'current');
  assert.equal(current.damagePresetApplied, null);
  assert.deepEqual(
    { turns: current.turns, winner: current.winner, frames: current.playbackFrames },
    { turns: again.turns, winner: again.winner, frames: again.playbackFrames },
  );
  assert.equal(flat.crash, null);
  assert.equal(flat.stall, null);
  assert.equal(flat.decided, true);
  assert.equal(flat.damagePresetApplied, 'flat_atk');
  assert.ok(flat.turns <= 80, `flat_atk seed 4 took ${flat.turns} turns`);
});
