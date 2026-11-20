/**
 * Manifest path audit, shipped byte sizes, and a static transfer estimate.
 * Does not edit product files. Writes tools/qa/artifacts/asset-audit.json.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { artifactDir, repoRoot } from './lib/repo.mjs';

const OVERSIZE_BYTES = 400 * 1024;
const RASTER = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else out.push({ full, bytes: stat.size, rel: relative(repoRoot, full).split('\\').join('/') });
  }
  return out;
}

function readJson(rel) {
  const full = join(repoRoot, rel);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, 'utf8'));
}

function manifestEntries() {
  const files = ['web/assets-manifest.json'];
  const fragmentDir = join(repoRoot, 'web', 'manifests');
  if (existsSync(fragmentDir)) {
    for (const name of readdirSync(fragmentDir)) {
      if (name.endsWith('.json')) files.push(`web/manifests/${name}`);
    }
  }
  const entries = [];
  for (const file of files) {
    const json = readJson(file);
    const assets = Array.isArray(json?.assets) ? json.assets : [];
    for (const asset of assets) {
      entries.push({
        manifest: file,
        assetId: asset.asset_id ?? null,
        slot: asset.slot ?? null,
        path: typeof asset.path === 'string' ? asset.path : null,
        fallback: typeof asset.fallback_path === 'string' ? asset.fallback_path : null,
      });
    }
  }
  return entries;
}

function cssRefs() {
  const refs = [];
  for (const file of walk(join(repoRoot, 'web', 'css'))) {
    if (!file.rel.endsWith('.css')) continue;
    const text = readFileSync(file.full, 'utf8');
    for (const match of text.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) {
      const raw = match[2];
      if (raw.startsWith('data:')) continue;
      const cleaned = raw.replace(/^\.\.\//, 'web/');
      refs.push({ from: file.rel, path: cleaned });
    }
  }
  return refs;
}

function fileBytes(rel) {
  const full = join(repoRoot, rel);
  if (!existsSync(full)) return null;
  return statSync(full).size;
}

export function auditAssets() {
  const entries = manifestEntries();
  const missing = [];
  const seenIds = new Map();
  const duplicateIds = [];
  const referenced = new Map();
  for (const entry of entries) {
    if (entry.assetId) {
      const previous = seenIds.get(entry.assetId);
      if (previous) duplicateIds.push({ assetId: entry.assetId, manifests: [previous, entry.manifest] });
      else seenIds.set(entry.assetId, entry.manifest);
    }
    for (const rel of [entry.path, entry.fallback]) {
      if (!rel) continue;
      const bytes = fileBytes(rel);
      if (bytes == null) {
        missing.push({ manifest: entry.manifest, assetId: entry.assetId, path: rel });
      } else if (!referenced.has(rel)) referenced.set(rel, bytes);
    }
  }
  for (const ref of cssRefs()) {
    const bytes = fileBytes(ref.path);
    if (bytes == null) missing.push({ manifest: ref.from, assetId: null, path: ref.path });
    else if (!referenced.has(ref.path)) referenced.set(ref.path, bytes);
  }

  const shipped = walk(join(repoRoot, 'web', 'assets'));
  const shippedBytes = shipped.reduce((total, file) => total + file.bytes, 0);
  const referencedBytes = [...referenced.values()].reduce((total, bytes) => total + bytes, 0);
  const oversize = shipped
    .filter((file) => RASTER.has(extname(file.rel).toLowerCase()) && file.bytes >= OVERSIZE_BYTES)
    .sort((a, b) => b.bytes - a.bytes)
    .map((file) => ({ path: file.rel, bytes: file.bytes }));
  const largest = shipped.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 20)
    .map((file) => ({ path: file.rel, bytes: file.bytes }));
  const html = fileBytes('web/index.html') ?? 0;
  const css = walk(join(repoRoot, 'web', 'css')).reduce((total, file) => total + file.bytes, 0);
  const js = walk(join(repoRoot, 'web', 'js')).reduce((total, file) => total + file.bytes, 0);
  const manifestBytes = fileBytes('web/assets-manifest.json') ?? 0;
  const staticFirstLoad = html + css + js + manifestBytes + referencedBytes;

  return {
    generatedAt: new Date().toISOString(),
    oversizeThresholdBytes: OVERSIZE_BYTES,
    manifests: [...new Set(entries.map((entry) => entry.manifest))],
    assetEntries: entries.length,
    missing,
    duplicateIds,
    referencedFiles: referenced.size,
    referencedBytes,
    shippedFiles: shipped.length,
    shippedBytes,
    unreferencedShipped: shipped.filter((file) => !referenced.has(file.rel)).map((file) => file.rel),
    oversize,
    largest,
    staticFirstLoadEstimate: {
      html,
      css,
      js,
      manifest: manifestBytes,
      referencedAssets: referencedBytes,
      total: staticFirstLoad,
      note: 'Sum of index.html, web/css, web/js, the manifest, and unique files referenced by manifests and CSS. The browser may request only the current screen. playable.html inlines this set and is measured separately.',
    },
  };
}

function main() {
  const report = auditAssets();
  const dir = artifactDir();
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'asset-audit.json');
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    file,
    missing: report.missing.length,
    oversize: report.oversize.length,
    shippedBytes: report.shippedBytes,
    referencedBytes: report.referencedBytes,
    staticFirstLoad: report.staticFirstLoadEstimate.total,
  }, null, 2)}\n`);
  if (report.missing.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
