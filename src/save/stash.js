import { storageFromFurniture } from '../schema/hideout.js';
import { stackCounts } from './inventory.js';

/**
 * Stack counts plus the slots that installed furniture actually adds.
 * House tier adds none. Cabin base, prices, loot, G rewards, and grant-versus-buy stay pending.
 * @param {{ house?: object, inventory?: object }} profile
 */
export function stashReport(profile) {
  const storage = storageFromFurniture(profile?.house ?? {});
  const counts = stackCounts(profile?.inventory ?? {});
  return {
    stackCounts: counts,
    storage,
    houseTierAddsSlots: false,
    prices: { value: null, status: 'PENDING_OWNER' },
    loot: { value: null, status: 'PENDING_OWNER' },
    rewardG: { value: null, status: 'PENDING_OWNER' },
    furnitureGrant: { value: null, status: 'PENDING_OWNER', rule: 'OPEN-06' },
    totalCapacity: {
      value: null,
      status: 'PENDING_OWNER',
      rule: 'HOME-11',
      knownFurnitureSlots: storage.installedSlots,
      note: 'Cabin base capacity is unknown. Only installed furniture slots are counted. House tier adds none.',
    },
  };
}
