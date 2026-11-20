/**
 * Canonical G wallet for the booth.
 * Web profiles persist the balance as currencyG, and the save writes that
 * integer to currency.G. Engine profiles expose currency.G directly.
 * Spend is whatever the pull already charged. A null price stays PENDING.
 * Companion pulls never display a G spend (GA-02).
 */

export function canonicalBalance(profile) {
  if (Number.isInteger(profile?.currencyG)) return profile.currencyG;
  if (profile?.currency && Number.isInteger(profile.currency.G)) return profile.currency.G;
  if (profile?.currency && typeof profile.currency.G === 'number' && Number.isFinite(profile.currency.G)) {
    return profile.currency.G;
  }
  return 0;
}

export function walletView(profile, banner, count = 1, chargedG = 0) {
  const companion = banner?.pool === 'companion';
  const configured = !companion && Number.isInteger(banner?.costG) ? banner.costG : null;
  const charged = companion ? 0 : (Number.isInteger(chargedG) && chargedG >= 0 ? chargedG : 0);
  const balance = canonicalBalance(profile);
  return {
    currency: 'G',
    balance,
    companion,
    configuredCostG: configured,
    costStatus: banner?.costStatus ?? 'PENDING_OWNER',
    count,
    charged,
    pendingPrice: configured == null,
    balanceAfter: balance,
  };
}

export function balanceLabel(view) {
  return `${view.balance} G`;
}

export function chargeLabel(charged) {
  const amount = Number.isInteger(charged) && charged >= 0 ? charged : 0;
  return `Last charge ${amount} G`;
}

export function priceLabel(view) {
  if (view.companion) return 'Companion pulls do not spend G';
  if (view.pendingPrice) return 'Price PENDING';
  return `Listed price ${view.configuredCostG} G`;
}
