import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { evidenceSnippet } from './html.mjs';
import { htmlToText } from './html.mjs';
import { GENERIC_TOKENS } from './lexicon.mjs';
import { assertAllowedWrite } from './repo.mjs';
import { STOPWORDS, normalizeName, termPresent, tokens } from './text.mjs';

const EXTRA_STOP = new Set(`
  original source sources inspired inspiration creature monster character figure known called named
  story legend myth folklore ancient traditional public domain version described depicted
  depicts description often usually across within without during while where when what
  which their there these those about would could should because being been have has
  facts fact lead leads article section infobox citation citations reference references
  according wikipedia wikitext retrieved accessed above below following sentence paragraph
  three claim claims note notes page pages link links url http https www
`.split(/\s+/).filter(Boolean));

const BOT_WALL = /just a moment|attention required|cf-browser-verification|enable javascript|captcha|are you a human|pardon our interruption|access denied|verify you are human/i;
const PAYWALL = /subscribe to (read|continue)|sign in to continue|log in to continue|register to continue/i;
const MULTI_PART_TLDS = new Set(['co.uk', 'org.uk', 'ac.uk', 'co.jp', 'com.au', 'co.th', 'or.th', 'go.th', 'ac.th']);

const TITLE_HOSTS = [
  { test: /wikipedia/i, hosts: ['wikipedia.org', 'wikimedia.org'] },
  { test: /britannica/i, hosts: ['britannica.com'] },
  { test: /\buspto\b|patent and trademark office/i, hosts: ['uspto.gov'] },
  { test: /copyright office/i, hosts: ['copyright.gov'] },
  { test: /\bwipo\b/i, hosts: ['wipo.int'] },
];

export const SOURCE_VERDICTS = Object.freeze([
  'suspicious', 'dead', 'unrelated', 'error', 'blocked', 'unverified', 'partial', 'verified',
]);

/**
 * @param {string} verdict
 */
export function sourcePriority(verdict) {
  if (verdict === 'suspicious' || verdict === 'dead' || verdict === 'unrelated') return 'P0';
  if (verdict === 'error' || verdict === 'blocked' || verdict === 'unverified' || verdict === 'partial') return 'P1';
  return null;
}

/**
 * Distinctive terms used to test whether a fetched page supports the claim.
 * @param {{ supports?: string, facts?: string[], name?: string, requireName?: boolean }} claim
 */
export function keyTerms(claim) {
  const fromSupports = distinctive(claim.supports || '');
  const fromFacts = distinctive((claim.facts || []).join(' '));
  const nameTokens = distinctive(claim.name || '').filter((token) => !GENERIC_TOKENS.has(token));
  // A source-specific supports sentence is the claim. "All three facts are in the lead" has no
  // distinctive words after the stop list, so the record facts are used instead.
  const pool = fromSupports.length >= 2 ? fromSupports : [...fromFacts, ...fromSupports];
  pool.sort((a, b) => b.length - a.length || a.localeCompare(b));
  const requiredName = claim.requireName ? (nameTokens.sort((a, b) => b.length - a.length)[0] || '') : '';
  const ordered = requiredName ? [requiredName, ...pool] : pool;
  /** @type {string[]} */
  const terms = [];
  const seen = new Set();
  for (const term of ordered) {
    if (seen.has(term)) continue;
    seen.add(term);
    terms.push(term);
    if (terms.length >= 8) break;
  }
  return { terms, requiredName };
}

/**
 * @param {string} text
 */
function distinctive(text) {
  const seen = new Set();
  /** @type {string[]} */
  const out = [];
  for (const token of tokens(text)) {
    if (token.length < 4 || STOPWORDS.has(token) || EXTRA_STOP.has(token) || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

/**
 * @param {string} raw
 */
export function screenUrl(raw) {
  /** @type {string[]} */
  const flags = [];
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return { ok: false, flags: ['malformed_url'], url: null };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') flags.push('bad_protocol');
  const host = url.hostname.toLowerCase();
  if (isBlockedHost(host)) flags.push('blocked_host');
  if (isPlaceholder(host, url.href)) flags.push('placeholder_url');
  return { ok: flags.length === 0, flags, url };
}

/**
 * @param {string} host
 */
function isBlockedHost(host) {
  const bare = host.replace(/^\[|\]$/g, '');
  if (bare === 'localhost' || bare.endsWith('.localhost') || bare.endsWith('.local') || bare.endsWith('.internal')) return true;
  if (bare === 'metadata.google.internal' || bare === '0.0.0.0' || bare === '::1') return true;
  const match = bare.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => part > 255)) return true;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/**
 * @param {string} host
 * @param {string} href
 */
function isPlaceholder(host, href) {
  if (/^(example\.(com|org|net|edu)|example\.[a-z]+|test\.test|invalid)$/.test(host)) return true;
  return /placeholder|changeme|your-url-here|todo\.example/i.test(href);
}

/**
 * @param {string} hostname
 */
export function siteHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length <= 2) return host;
  const last2 = parts.slice(-2).join('.');
  if (MULTI_PART_TLDS.has(last2) && parts.length >= 3) return parts.slice(-3).join('.');
  return last2;
}

/**
 * @param {string} raw
 */
export function canonicalUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return String(raw || '').trim();
  }
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || key === 'fbclid' || key === 'gclid') url.searchParams.delete(key);
  }
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}

/**
 * @param {string} value
 */
function isSearchUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  if (host === 'duckduckgo.com') return true;
  if ((/(^|\.)google\./.test(host) || /(^|\.)bing\./.test(host) || /(^|\.)yahoo\./.test(host)) && path.startsWith('/search')) {
    return true;
  }
  return false;
}

/**
 * Decide a verdict from a claim plus a fetch result. Pure: no network.
 * @param {object} claim
 * @param {object} fetched
 */
export function evaluateSource(claim, fetched) {
  const { terms, requiredName } = keyTerms(claim);
  /** @type {string[]} */
  const flags = [...(fetched.flags || [])];
  const requestedUrl = claim.url || fetched.requestedUrl || '';
  const finalUrl = fetched.finalUrl || '';
  const title = fetched.title || '';
  const text = fetched.text || '';
  const status = fetched.httpStatus ?? null;
  const found = [];
  const missing = [];
  const blob = `${title}\n${text}`;
  for (const term of terms) {
    if (termPresent(blob, term)) found.push(term);
    else missing.push(term);
  }
  const ratio = terms.length === 0 ? 0 : found.length / terms.length;
  let support = supportLevel(terms, found, requiredName, blob);

  if (finalUrl && requestedUrl) {
    try {
      if (siteHost(new URL(requestedUrl).hostname) !== siteHost(new URL(finalUrl).hostname)) flags.push('cross_domain_redirect');
    } catch {
      flags.push('malformed_final_url');
    }
  }
  if (finalUrl) {
    try {
      const host = siteHost(new URL(finalUrl).hostname);
      if (/archive\.org$/.test(host)) flags.push('archive_snapshot');
      if (claim.claimedTitle) {
        const expected = TITLE_HOSTS.find((row) => row.test.test(claim.claimedTitle));
        if (expected && !expected.hosts.includes(host)) flags.push('title_host_mismatch');
      }
    } catch {
      flags.push('malformed_final_url');
    }
  }
  if (claim.accessed && isFutureDate(claim.accessed)) flags.push('future_accessed');

  let verdict = 'error';
  if (flags.includes('malformed_url') || flags.includes('bad_protocol') || flags.includes('placeholder_url') || flags.includes('blocked_host')) {
    verdict = 'suspicious';
  } else if (fetched.errorCode === 'ENOTFOUND' || fetched.errorCode === 'ENODATA' || fetched.errorCode === 'EAI_AGAIN' || /ENOTFOUND|ENODATA/.test(fetched.networkError || '')) {
    verdict = 'dead';
    flags.push('dns_failure');
  } else if (fetched.networkError && status == null) {
    verdict = 'error';
    if (fetched.errorCode === 'TIMEOUT') flags.push('timeout');
    else flags.push('network_error');
  } else if (status === 404 || status === 410) {
    verdict = 'dead';
  } else if (status === 401 || status === 403 || status === 429 || status === 451) {
    verdict = 'blocked';
  } else if (status != null && status >= 400) {
    verdict = 'error';
  } else if (status != null && status >= 200 && status < 300) {
    const type = fetched.contentType || '';
    if (/pdf|image\/|audio\/|video\/|octet-stream/i.test(type)) {
      verdict = 'unverified';
      flags.push('binary_body');
    } else if (isSearchUrl(finalUrl || requestedUrl)) {
      verdict = 'suspicious';
      flags.push('search_page');
    } else if ((BOT_WALL.test(blob) && text.length < 2500) || (PAYWALL.test(blob) && text.length < 2000)) {
      verdict = 'blocked';
      flags.push(PAYWALL.test(blob) ? 'paywall' : 'bot_wall');
    } else if (isJsShell(title, text) && support !== 'verified') {
      verdict = 'unverified';
      flags.push('js_shell');
    } else if (isSoft404(title)) {
      verdict = 'dead';
      flags.push('soft_404');
    } else if (terms.length === 0) {
      verdict = 'unverified';
      flags.push('no_key_terms');
    } else if (text.length < 40) {
      verdict = support === 'unrelated' ? 'unrelated' : 'partial';
      flags.push('thin_page');
    } else {
      verdict = support;
    }
  } else {
    verdict = 'error';
    flags.push('no_status');
  }

  if (verdict === 'unrelated' && claim.looseContext) {
    verdict = 'unverified';
    flags.push('loose_context');
  }
  if (verdict === 'verified' && flags.includes('title_host_mismatch')) verdict = 'partial';
  if ((verdict === 'verified' || verdict === 'partial') && flags.includes('suspicious_redirect')) verdict = 'partial';

  const snippetTerm = found[0] || '';
  return {
    url: requestedUrl,
    canonical: canonicalUrl(requestedUrl),
    agent: claim.agent,
    recordId: claim.recordId,
    path: claim.path,
    ref: claim.ref,
    sha: claim.sha,
    kind: claim.kind,
    claimedTitle: claim.claimedTitle || '',
    supports: claim.supports || '',
    accessed: claim.accessed || '',
    httpStatus: status,
    finalUrl,
    title,
    contentType: fetched.contentType || '',
    keyTerms: terms,
    termsFound: found,
    termsMissing: missing,
    termHitRatio: Number(ratio.toFixed(3)),
    verdict,
    priority: sourcePriority(verdict),
    flags: [...new Set(flags)],
    evidenceSnippet: snippetTerm ? evidenceSnippet(blob, snippetTerm) : '',
    error: fetched.networkError || '',
  };
}

/**
 * @param {string[]} terms
 * @param {string[]} found
 * @param {string} requiredName
 * @param {string} blob
 */
function supportLevel(terms, found, requiredName, blob) {
  if (terms.length === 0) return 'unrelated';
  const nameOk = !requiredName || found.includes(requiredName) || termPresent(blob, requiredName);
  const ratio = found.length / terms.length;
  let level = 'unrelated';
  if (terms.length <= 2 && found.length === terms.length) level = 'verified';
  else if (found.length >= 2 && ratio >= 0.4) level = 'verified';
  else if (found.length >= 1) level = 'partial';
  if (!nameOk && level === 'verified') level = 'partial';
  if (!nameOk && found.length === 0) level = 'unrelated';
  return level;
}

/**
 * @param {string} title
 */
function isJsShell(title, text) {
  const head = `${title}\n${text.slice(0, 1500)}`;
  return /\{\{|\}\}|id=["']__next|please enable javascript|window\.__INITIAL_STATE__/i.test(head);
}

function isSoft404(title) {
  const text = title.toLowerCase().trim();
  return text === '404' || /^404\b/.test(text) || /^not found\b/.test(text) || /^page not found\b/.test(text);
}

/**
 * @param {string} value
 */
function isFutureDate(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return false;
  const date = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date > Date.now() + 36 * 60 * 60 * 1000;
}

/**
 * @param {object[]} claims
 * @param {object} [options]
 */
export async function auditSources(claims, options = {}) {
  /** @type {Map<string, object[]>} */
  const groups = new Map();
  for (const claim of claims) {
    const key = canonicalUrl(claim.url || '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(claim);
  }
  const cache = options.cachePath ? loadCache(options.cachePath) : { version: 1, entries: {} };
  let cacheDirty = false;
  const rows = await mapPool([...groups.entries()], options.concurrency ?? 4, async ([, group]) => {
    const structured = group.filter((claim) => claim.kind !== 'citation');
    const scored = structured.length > 0 ? structured : group;
    const fetched = await resolveFetch(scored[0].url, { ...options, cache, markDirty: () => { cacheDirty = true; } });
    const claimResults = scored.map((claim) => evaluateSource(claim, fetched));
    return rollup(claimResults);
  });
  if (options.cachePath && cacheDirty) saveCache(options.cachePath, cache);
  rows.sort((a, b) => a.canonical.localeCompare(b.canonical) || a.url.localeCompare(b.url));
  return rows;
}

/**
 * @param {object[]} claimResults
 */
function rollup(claimResults) {
  const worst = claimResults.reduce((current, row) => (
    SOURCE_VERDICTS.indexOf(row.verdict) < SOURCE_VERDICTS.indexOf(current) ? row.verdict : current
  ), 'verified');
  const first = claimResults[0];
  return {
    url: first.url,
    canonical: first.canonical,
    httpStatus: first.httpStatus,
    finalUrl: first.finalUrl,
    title: first.title,
    contentType: first.contentType,
    verdict: worst,
    priority: sourcePriority(worst),
    flags: [...new Set(claimResults.flatMap((row) => row.flags))],
    claims: claimResults.map((row) => ({
      agent: row.agent,
      recordId: row.recordId,
      path: row.path,
      ref: row.ref,
      sha: row.sha,
      kind: row.kind,
      claimedTitle: row.claimedTitle,
      supports: clip(row.supports, 400),
      accessed: row.accessed,
      keyTerms: row.keyTerms,
      termsFound: row.termsFound,
      termsMissing: row.termsMissing,
      termHitRatio: row.termHitRatio,
      verdict: row.verdict,
      priority: row.priority,
      evidenceSnippet: row.evidenceSnippet,
    })),
    error: first.error,
  };
}

/**
 * @param {string} text
 * @param {number} limit
 */
function clip(text, limit) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

/**
 * @param {string} rawUrl
 * @param {object} options
 */
async function resolveFetch(rawUrl, options) {
  const screen = screenUrl(rawUrl);
  if (!screen.ok) {
    return {
      requestedUrl: rawUrl,
      httpStatus: null,
      finalUrl: '',
      title: '',
      contentType: '',
      text: '',
      errorCode: null,
      networkError: null,
      flags: screen.flags,
    };
  }
  const target = screen.url.toString();
  const cached = lookupCache(options.cache, target, options);
  if (cached) return cached;
  if (options.skipNetwork) {
    return {
      requestedUrl: target,
      httpStatus: null,
      finalUrl: '',
      title: '',
      contentType: '',
      text: '',
      errorCode: 'SKIPPED',
      networkError: 'network skipped',
      flags: ['network_skipped'],
    };
  }
  if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
  const fetched = await fetchPage(target, options);
  storeCache(options.cache, target, fetched);
  options.markDirty?.();
  return fetched;
}

/**
 * @param {string} target
 * @param {object} options
 */
async function fetchPage(target, options) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 15000;
  const headers = {
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 MonsterResearchQA/1.0',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
    'accept-language': 'en-US,en;q=0.9',
  };
  try {
    const response = await fetchImpl(target, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers,
    });
    const contentType = response.headers?.get?.('content-type') || '';
    let title = '';
    let text = '';
    const binary = /pdf|image\/|audio\/|video\/|octet-stream/i.test(contentType);
    if (!binary) {
      const body = await response.text();
      if (/html|xml/i.test(contentType) || body.trim().startsWith('<')) {
        const parsed = htmlToText(body);
        title = parsed.title;
        text = parsed.text.slice(0, 120_000);
      } else {
        text = body.slice(0, 120_000);
      }
    }
    return {
      requestedUrl: target,
      httpStatus: response.status,
      finalUrl: response.url || target,
      title,
      contentType,
      text,
      errorCode: null,
      networkError: null,
      flags: [],
    };
  } catch (error) {
    return {
      requestedUrl: target,
      httpStatus: null,
      finalUrl: '',
      title: '',
      contentType: '',
      text: '',
      errorCode: errorCodeOf(error),
      networkError: error instanceof Error ? error.message : 'fetch failed',
      flags: [],
    };
  }
}

/**
 * @param {unknown} error
 */
function errorCodeOf(error) {
  /** @type {string[]} */
  const codes = [];
  const walk = (value, depth) => {
    if (!value || typeof value !== 'object' || depth > 5) return;
    if ('code' in value && value.code) codes.push(String(value.code));
    if ('cause' in value) walk(value.cause, depth + 1);
    if ('errors' in value && Array.isArray(value.errors)) {
      for (const item of value.errors) walk(item, depth + 1);
    }
  };
  walk(error, 0);
  if (codes.some((code) => code === 'ENOTFOUND' || code === 'ENODATA' || code === 'EAI_AGAIN')) return 'ENOTFOUND';
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  if (name === 'TimeoutError' || name === 'AbortError' || codes.includes('ABORT_ERR')) return 'TIMEOUT';
  return codes[0] || 'NETWORK';
}

/**
 * @param {object | undefined} cache
 * @param {string} target
 * @param {object} options
 */
function lookupCache(cache, target, options) {
  if (!cache || options.refresh) return null;
  const entry = cache.entries?.[target];
  if (!entry) return null;
  const age = Date.now() - Date.parse(entry.fetchedAt || 0);
  const success = entry.httpStatus >= 200 && entry.httpStatus < 300;
  const gone = entry.httpStatus === 404 || entry.httpStatus === 410;
  const blocked = entry.httpStatus === 401 || entry.httpStatus === 403 || entry.httpStatus === 429 || entry.httpStatus === 451;
  const maxAge = options.maxAgeMs ?? 6 * 60 * 60 * 1000;
  const fresh = age >= 0 && ((success || gone) ? age < maxAge : blocked && age < 20 * 60 * 1000);
  if (fresh) {
    return { ...entry, flags: [...(entry.flags || []), 'cache_hit'], networkError: null, errorCode: null };
  }
  return null;
}

/**
 * @param {object | undefined} cache
 * @param {string} target
 * @param {object} fetched
 */
function storeCache(cache, target, fetched) {
  if (!cache) return;
  if (!cache.entries) cache.entries = {};
  if (fetched.httpStatus == null) return;
  cache.entries[target] = {
    fetchedAt: new Date().toISOString(),
    requestedUrl: fetched.requestedUrl,
    httpStatus: fetched.httpStatus,
    finalUrl: fetched.finalUrl,
    title: fetched.title,
    contentType: fetched.contentType,
    text: fetched.text,
    flags: [],
  };
}

/**
 * @param {string} file
 */
function loadCache(file) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || !parsed.entries) return { version: 1, entries: {} };
    return parsed;
  } catch {
    return { version: 1, entries: {} };
  }
}

/**
 * @param {string} file
 * @param {object} cache
 */
function saveCache(file, cache) {
  assertAllowedWrite(file);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(cache)}\n`);
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<unknown>} fn
 */
async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  });
  if (items.length === 0) return [];
  await Promise.all(workers);
  return results;
}
