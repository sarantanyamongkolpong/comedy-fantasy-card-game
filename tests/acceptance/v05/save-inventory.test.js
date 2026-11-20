import assert from 'node:assert/strict';
import { bindApi, SAVE_FILES, loadNamed } from './helpers/load-api.js';

const save = await loadNamed(SAVE_FILES, ['serialize', 'deserialize'], 'stream B');

function expectProtected(fn) {
  assert.throws(fn, (error) => {
    const code = `${error.code ?? ''} ${error.message ?? ''}`;
    assert.match(code, /PROTECTED|locked|favorite|in-deck/i);
    return true;
  });
}

bindApi(save, [
  {
    name: 'save serialize and deserialize round-trip',
    fn(api) {
      const profile = typeof api.createProfile === 'function'
        ? api.createProfile({ profileId: 'PLAYER' })
        : {
          profileId: 'PLAYER',
          saveVersion: 1,
          inventory: { avatars: [], actions: [], companions: [] },
          decks: [],
          currency: { G: 0 },
          pity: {},
          house: { acquiredTiers: ['cabin'], displayTier: 'cabin', installedFurniture: [] },
          rewardLedger: {},
          items: [
            { instanceId: 'own-1', subjectId: 'AVT_AEG_001', locked: true, favorite: false, inDeck: false },
          ],
        };
      const json = api.serialize(profile);
      assert.equal(typeof json, 'string');
      const restored = api.deserialize(json);
      assert.deepEqual(restored, profile);
      assert.equal(api.serialize(restored), json);
    },
  },
  {
    name: 'GA-13 inventory lock, favorite, and in-deck copies cannot be spent as material',
    fn(api) {
      if (typeof api.canSpendAsMaterial === 'function') {
        const locked = { instanceId: 'a', subjectId: 'AVT_AEG_002', locked: true, favorite: false, inDeck: false };
        const favorite = { instanceId: 'b', subjectId: 'AVT_AEG_002', locked: false, favorite: true, inDeck: false };
        const inDeck = { instanceId: 'c', subjectId: 'AVT_AEG_002', locked: false, favorite: false, inDeck: true };
        const free = { instanceId: 'd', subjectId: 'AVT_AEG_002', locked: false, favorite: false, inDeck: false };
        for (const item of [locked, favorite, inDeck]) {
          const verdict = api.canSpendAsMaterial(item);
          assert.equal(verdict === true || verdict?.ok === true, false);
        }
        const freeVerdict = api.canSpendAsMaterial(free);
        assert.equal(freeVerdict === true || freeVerdict?.ok === true, true);
        return;
      }
      if (typeof api.consumeDuplicate !== 'function' || typeof api.createProfile !== 'function' || typeof api.grantItem !== 'function') {
        throw new Error('save API needs consumeDuplicate or canSpendAsMaterial');
      }
      let profile = api.grantItem(api.createProfile(), { kind: 'avatar', catalogId: 'AVT_AEG_002', quantity: 2 });
      profile = api.setLocked(profile, 'avatar', 'AVT_AEG_002', true);
      expectProtected(() => api.consumeDuplicate(profile, { kind: 'avatar', catalogId: 'AVT_AEG_002', quantity: 1 }));
      profile = api.setLocked(profile, 'avatar', 'AVT_AEG_002', false);
      profile = api.setFavorite(profile, 'avatar', 'AVT_AEG_002', true);
      expectProtected(() => api.consumeDuplicate(profile, { kind: 'avatar', catalogId: 'AVT_AEG_002', quantity: 1 }));
      profile = api.setFavorite(profile, 'avatar', 'AVT_AEG_002', false);
      const free = api.consumeDuplicate(profile, { kind: 'avatar', catalogId: 'AVT_AEG_002', quantity: 1 });
      const stack = free.inventory.avatars.find((row) => row.catalogId === 'AVT_AEG_002');
      assert.equal(stack.quantity, 1);

      let deckProfile = api.grantItem(api.createProfile(), { kind: 'action', catalogId: 'ACT_SAMPLE', quantity: 30 });
      const cardIds = Array.from({ length: 30 }, () => 'ACT_SAMPLE');
      deckProfile = api.bindDeck(deckProfile, { deckId: 'deck-1', cardIds }, {
        cardsById: { ACT_SAMPLE: { cardId: 'ACT_SAMPLE', Rarity: 'N', Faction_Requirement: null } },
      });
      expectProtected(() => api.consumeDuplicate(deckProfile, { kind: 'action', catalogId: 'ACT_SAMPLE', quantity: 1 }));
    },
  },
]);