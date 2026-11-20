import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root. This file lives in tools/authoring/. */
export const repoRoot = join(here, '..', '..');

export const defaultTemplatesDir = join(repoRoot, 'content', 'templates');

export const defaultExamplesDir = join(repoRoot, 'content', 'examples');

/** Partial art snapshot shipped with the systems tests. Not the full manifest. */
export const defaultManifestPath = join(repoRoot, 'tests', 'fixtures', 'asset-manifest.snapshot.json');
