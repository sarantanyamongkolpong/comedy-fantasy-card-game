import { canPlace } from '../placement-rules.js';

const root = new URL('../../../../', import.meta.url);

const [tiersDoc, objectsDoc, placement, manifest] = await Promise.all([
  fetch(new URL('content/prod/hideout/tiers.json', root)).then((res) => res.json()),
  fetch(new URL('content/prod/hideout/objects.json', root)).then((res) => res.json()),
  fetch(new URL('content/prod/hideout/placement.json', root)).then((res) => res.json()),
  fetch(new URL('web/manifests/hideout.json', root)).then((res) => res.json()),
]);

const byAsset = new Map(manifest.entries.map((asset) => [asset.asset_id, asset]));
const byManifestId = new Map(objectsDoc.objects.map((row) => [row.manifestAssetId, row]));
const state = { tierId: 'cabin', view: 'interior', layout: null };

function readHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const tier = params.get('tier');
  if (tiersDoc.tiers.some((row) => row.id === tier)) state.tierId = tier;
  state.view = params.get('view') === 'exterior' ? 'exterior' : 'interior';
  state.layout = null;
}

readHash();
window.addEventListener('hashchange', () => {
  readHash();
  render();
});

const tierRow = document.querySelector('#tiers');
const viewRow = document.querySelector('#views');
const stage = document.querySelector('#stage');
const scene = document.querySelector('#scene');
const title = document.querySelector('#title');
const note = document.querySelector('#note');

for (const tier of tiersDoc.tiers) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = tier.name;
  button.dataset.tier = tier.id;
  button.addEventListener('click', () => {
    state.tierId = tier.id;
    state.layout = null;
    render();
  });
  tierRow.append(button);
}

for (const view of ['interior', 'exterior']) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = view === 'interior' ? 'Interior' : 'Exterior';
  button.dataset.view = view;
  button.addEventListener('click', () => {
    state.view = view;
    render();
  });
  viewRow.append(button);
}

function layoutFor(tierId) {
  if (state.layout && state.layout.tierId === tierId) return state.layout.anchors;
  return { ...placement.previewLayouts[tierId].anchors };
}

function paintProps(anchors) {
  stage.querySelectorAll('.prop').forEach((node) => node.remove());
  const order = new Map(placement.layerOrder.map((layer, index) => [layer, index]));
  const placed = placement.anchors
    .map((anchor) => ({ anchor, assetId: anchors[anchor.id] }))
    .filter((row) => row.assetId)
    .sort((a, b) => (order.get(a.anchor.layer) ?? 0) - (order.get(b.anchor.layer) ?? 0));
  for (const row of placed) {
    const object = byManifestId.get(row.assetId);
    const asset = byAsset.get(row.assetId);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prop';
    button.dataset.anchor = row.anchor.id;
    button.style.left = `${(row.anchor.x / placement.stage.width) * 100}%`;
    button.style.top = `${(row.anchor.y / placement.stage.height) * 100}%`;
    button.style.width = `${(row.anchor.w / placement.stage.width) * 100}%`;
    button.style.height = `${(row.anchor.h / placement.stage.height) * 100}%`;
    button.style.zIndex = String((order.get(row.anchor.layer) ?? 0) + 1);
    button.setAttribute('aria-label', object ? object.name : row.assetId);
    const img = document.createElement('img');
    img.alt = '';
    img.src = new URL(asset.path, root).href;
    button.append(img);
    button.addEventListener('click', () => cycle(row.anchor, anchors));
    stage.append(button);
  }
}

function cycle(anchor, anchors) {
  const current = anchors[anchor.id];
  const choices = objectsDoc.objects.filter((row) => canPlace(anchor, row).ok);
  const index = choices.findIndex((row) => row.manifestAssetId === current);
  const next = choices[(index + 1) % choices.length];
  anchors[anchor.id] = next.manifestAssetId;
  state.layout = { tierId: state.tierId, anchors };
  render();
}

function render() {
  const tier = tiersDoc.tiers.find((row) => row.id === state.tierId);
  const anchors = layoutFor(state.tierId);
  state.layout = { tierId: state.tierId, anchors };
  title.textContent = `${tier.name} hideout`;
  for (const button of tierRow.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', button.dataset.tier === tier.id ? 'true' : 'false');
  }
  for (const button of viewRow.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', button.dataset.view === state.view ? 'true' : 'false');
  }
  stage.dataset.view = state.view;
  stage.dataset.tier = tier.id;
  const assetId = state.view === 'exterior' ? tier.exteriorAssetId : tier.interiorAssetId;
  scene.src = new URL(byAsset.get(assetId).path, root).href;
  scene.alt = `${tier.name} ${state.view}`;
  if (state.view === 'interior') paintProps(anchors);
  else stage.querySelectorAll('.prop').forEach((node) => node.remove());
  const storageId = anchors['floor.east'];
  const storage = byManifestId.get(storageId);
  const capacity = storage?.visualCapacity == null ? 'not defined' : `${storage.visualCapacity} from the sheet reference`;
  note.textContent = `Preview only. Nothing is installed. Visual capacity of the east storage piece: ${capacity}. No price. No stash slots.`;
  history.replaceState(null, '', `#tier=${tier.id}&view=${state.view}`);
}

render();
