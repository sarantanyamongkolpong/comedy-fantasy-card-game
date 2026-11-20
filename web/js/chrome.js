import { assetUrl, bindImage, findAsset } from './assets.js';
import { button, el } from './dom.js';

/** Empty SVG chrome. The label and the hit target live on the button, not in the file. */
export function chromeButton(manifest, label, onClick, options = {}) {
  const variant = options.variant || 'primary';
  const node = button('', onClick, `chrome-btn hit ${options.className || ''}`.trim());
  const art = findAsset(manifest, { slot: 'ui-button', subjectId: variant });
  if (art) node.style.backgroundImage = `url("${assetUrl(art)}")`;
  if (options.icon) {
    const icon = findAsset(manifest, { slot: 'nav-icon', subjectId: options.icon });
    if (icon) {
      const img = el('img', 'nav-ico');
      img.alt = '';
      bindImage(img, icon, { eager: true });
      node.append(img);
    }
  }
  node.append(el('span', 'chrome-label', label));
  return node;
}

export function paintFrame(node, manifest, subjectId) {
  const art = findAsset(manifest, { slot: 'ui-frame', subjectId });
  if (!art) return node;
  node.style.backgroundImage = `url("${assetUrl(art)}")`;
  node.classList.add('has-frame');
  return node;
}
