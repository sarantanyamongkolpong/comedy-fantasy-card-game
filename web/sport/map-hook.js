import { startSport, stopSport } from './router.js';

/** True for the world-map Sports Complex building, whatever its old action flag says. */
export function isSportsComplexHotspot(hotspot) {
  if (!hotspot) return false;
  return hotspot.siteId === 'sports'
    || hotspot.id === 'sports'
    || hotspot.assetId === 'MAP_BLD_SPORTS'
    || hotspot.label === 'Sports Complex';
}

/** Open the hub from the map. Exit returns through the existing map goto. */
export function openSportsComplex(ctx) {
  mountSportApp({
    profile: ctx.profile,
    persist: typeof ctx.persist === 'function' ? ctx.persist : null,
    onExit: () => {
      unmountSportApp();
      ctx.goto('map');
    },
  });
}

let cssLink = null;

function ensureCss() {
  if (cssLink) return cssLink;
  // Single-file build: web/tools/build-single-html inlines sport.css as <style data-sport-css>.
  const inlined = document.querySelector('style[data-sport-css]');
  if (inlined) {
    cssLink = inlined;
    return cssLink;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./sport.css', import.meta.url).href;
  link.dataset.sportCss = 'true';
  document.head.append(link);
  cssLink = link;
  return link;
}

/**
 * Mount the Sport Complex inside the existing #stage.
 * The v0.5 screen router is left alone until onExit sends the player back to the map.
 */
export function mountSportApp({ profile, onExit, persist = null }) {
  const link = ensureCss();
  const begin = () => startSport({ profile, onExit, persist });
  if (link.sheet) begin();
  else {
    link.addEventListener('load', begin, { once: true });
    link.addEventListener('error', begin, { once: true });
  }
}

export function unmountSportApp() {
  stopSport();
}
