#!/usr/bin/env python3
"""Responsive artwork-preview regression check.

One command (from the repo root):

    python3 tools/preview_qa/audit_preview.py

Opens preview/index.html at every required viewport, plus a standalone
smoke pass, and writes:

    docs/qa/preview_mobile/results.json
    docs/qa/preview_mobile/after/*.png

    python3 tools/preview_qa/audit_preview.py --phase before

writes the same checks under docs/qa/preview_mobile/before/ and
before_results.json without treating failures as a crash (exit 0) so a
baseline can be captured before fixes. The default phase exits 1 when
any viewport fails.
"""
import argparse, json, os, sys, threading
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'qa', 'preview_mobile')

# (id, width, height, kind) — phone landscapes are the rotated phone sizes.
VIEWPORTS = [
    ('360x800', 360, 800, 'phone-portrait'),
    ('390x844', 390, 844, 'phone-portrait'),
    ('412x915', 412, 915, 'phone-portrait'),
    ('768x1024', 768, 1024, 'tablet-portrait'),
    ('1440x900', 1440, 900, 'desktop'),
    ('800x360', 800, 360, 'phone-landscape'),
    ('844x390', 844, 390, 'phone-landscape'),
    ('915x412', 915, 412, 'phone-landscape'),
]

NAME_MIN_PX = 12.0
TOUCH_MIN_PX = 44.0
RATIO_TOL = 0.02  # absolute ratio tolerance

# In-page probe. Returns plain JSON-friendly data.
PROBE = r"""
() => {
  const MIN_NAME = 12;
  const MIN_TOUCH = 44;
  const doc = document.documentElement;
  const overflow = {
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    scrollHeight: doc.scrollHeight,
    clientHeight: doc.clientHeight,
    delta: doc.scrollWidth - doc.clientWidth
  };

  function visible(el) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5;
  }

  function textClipped(el) {
    const card = el.closest('.card') || el;
    const er = el.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize);
    const contentTaller = el.scrollHeight > el.clientHeight + 1;
    const contentWider = el.scrollWidth > el.clientWidth + 1;
    // Range box of the rendered text, compared with the card clip.
    let textBox = null;
    const range = document.createRange();
    const nodes = [];
    el.childNodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) nodes.push(n); });
    if (nodes.length) {
      range.setStartBefore(nodes[0]);
      range.setEndAfter(nodes[nodes.length - 1]);
      textBox = range.getBoundingClientRect();
    }
    const clippedByCard = textBox ? (
      textBox.top < cr.top - 0.6 || textBox.bottom > cr.bottom + 0.6 ||
      textBox.left < cr.left - 0.6 || textBox.right > cr.right + 0.6
    ) : false;
    return {fontSize, contentTaller, contentWider, clippedByCard,
            boxH: Math.round(er.height * 10) / 10, textH: textBox ? Math.round(textBox.height * 10) / 10 : null};
  }

  function shown(el){
    if(!el) return false;
    const s = getComputedStyle(el);
    if(s.display==='none' || s.visibility==='hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  const names = [];
  document.querySelectorAll('#tabs button').forEach(b => {
    const cs = getComputedStyle(b);
    names.push({where: 'tab', text: b.innerText.replace(/\s+/g, ' ').trim(), fontSize: parseFloat(cs.fontSize), shown: shown(b)});
  });
  const meta = document.querySelector('#cardMeta');
  if (meta) {
    const who = meta.querySelector('.who') || meta;
    names.push({where: 'cardMeta', text: meta.innerText.split('\n')[0], fontSize: parseFloat(getComputedStyle(who).fontSize), shown: shown(meta)});
  }
  document.querySelectorAll('#cardHost .card .name').forEach(n => {
    const info = textClipped(n);
    const en = [...n.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent.trim()).join(' ');
    names.push({where: 'card-name', text: en, shown: shown(n), ...info});
    const sm = n.querySelector('small');
    if (sm) names.push({where: 'card-name-th', text: sm.textContent.trim(), fontSize: parseFloat(getComputedStyle(sm).fontSize),
                        shown: shown(sm), contentTaller: sm.scrollHeight > sm.clientHeight + 1});
  });

  function clipAmount(el) {
    const r = el.getBoundingClientRect();
    let left = -1e9, top = -1e9, right = 1e9, bottom = 1e9;
    let p = el.parentElement;
    while (p) {
      const s = getComputedStyle(p);
      const pr = p.getBoundingClientRect();
      const clipsX = ['hidden', 'clip', 'scroll', 'auto'].includes(s.overflowX);
      const clipsY = ['hidden', 'clip', 'scroll', 'auto'].includes(s.overflowY);
      if (clipsX) { left = Math.max(left, pr.left); right = Math.min(right, pr.right); }
      if (clipsY) { top = Math.max(top, pr.top); bottom = Math.min(bottom, pr.bottom); }
      p = p.parentElement;
    }
    const cut = {
      left: Math.max(0, left - r.left),
      right: Math.max(0, r.right - right),
      top: Math.max(0, top - r.top),
      bottom: Math.max(0, r.bottom - bottom)
    };
    cut.cropped = (cut.left + cut.right + cut.top + cut.bottom) > 1.5;
    cut.w = Math.round(r.width * 10) / 10;
    cut.h = Math.round(r.height * 10) / 10;
    return cut;
  }

  const cv = document.querySelector('#cv');
  const sprite = {present: !!cv};
  if (cv) {
    const r = cv.getBoundingClientRect();
    const ir = getComputedStyle(cv).imageRendering;
    sprite.imageRendering = ir;
    sprite.bitmap = [cv.width, cv.height];
    sprite.display = [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10];
    sprite.displayRatio = r.height ? +(r.width / r.height).toFixed(4) : null;
    sprite.bitmapSquare = cv.width === cv.height;
    sprite.clip = clipAmount(cv);
    // Opaque-pixel bounds vs the border-radius clip of .stage (corner crop).
    const stage = cv.closest('.stage');
    const radius = stage ? parseFloat(getComputedStyle(stage).borderTopLeftRadius) || 0 : 0;
    sprite.stageRadius = radius;
    let opaqueCut = 0;
    try {
      const g = cv.getContext('2d', {willReadFrequently: true});
      const scaleX = cv.width / r.width;
      const rad = radius * scaleX;
      if (rad > 1) {
        const {data, width, height} = g.getImageData(0, 0, cv.width, cv.height);
        const inside = (x, y) => {
          const tests = [[rad, rad], [width - rad, rad], [rad, height - rad], [width - rad, height - rad]];
          for (const [cx, cy] of tests) {
            if (x < rad && y < rad && (x - rad) ** 2 + (y - rad) ** 2 > rad * rad) return false;
            if (x > width - rad && y < rad && (x - (width - rad)) ** 2 + (y - rad) ** 2 > rad * rad) return false;
            if (x < rad && y > height - rad && (x - rad) ** 2 + (y - (height - rad)) ** 2 > rad * rad) return false;
            if (x > width - rad && y > height - rad && (x - (width - rad)) ** 2 + (y - (height - rad)) ** 2 > rad * rad) return false;
          }
          return true;
        };
        // sample step keeps this cheap on large zooms
        const step = Math.max(1, Math.floor(Math.min(width, height) / 64));
        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            const a = data[(y * width + x) * 4 + 3];
            if (a > 16 && !inside(x, y)) opaqueCut++;
          }
        }
      }
    } catch (e) { sprite.readError = String(e); }
    sprite.opaqueCornerSamples = opaqueCut;
  }

  const card = document.querySelector('#cardHost .card');
  const art = document.querySelector('#cardHost .card .art');
  const frame = document.querySelector('#cardHost .card img:not(.art)');
  function ratioOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
            ratio: r.height ? +(r.width / r.height).toFixed(4) : null,
            natural: (el.naturalWidth ? [el.naturalWidth, el.naturalHeight] : null)};
  }
  const cardBox = ratioOf(card);
  const artBox = ratioOf(art);
  const frameBox = ratioOf(frame);

  const touch = [];
  const seen = new Set();
  document.querySelectorAll('button, select, a, label').forEach(el => {
    if (!visible(el)) return;
    // Labels are the hit target only when they contain a control. Bare captions are not.
    if (el.matches('label') && !el.querySelector('input, select, button')) return;
    if (el.matches('select') && el.closest('label')) return;
    if (seen.has(el)) return;
    seen.add(el);
    const r = el.getBoundingClientRect();
    const text = (el.innerText || el.getAttribute('aria-label') || el.id || el.className || el.tagName).toString().replace(/\s+/g, ' ').trim().slice(0, 60);
    touch.push({tag: el.tagName.toLowerCase(), text, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
                fail: r.width < MIN_TOUCH - 0.5 || r.height < MIN_TOUCH - 0.5});
  });

  const imgs = [...document.images].map(i => ({
    alt: i.alt || '',
    src: (i.currentSrc || i.src || '').slice(0, 96),
    ok: i.complete && i.naturalWidth > 0
  }));

  const rendering = [...document.querySelectorAll('canvas')].slice(0, 6).map(c => getComputedStyle(c).imageRendering);

  return {overflow, names, sprite, card: cardBox, art: artBox, frame: frameBox, touch, imgs, rendering,
          title: document.querySelector('header h1') ? document.querySelector('header h1').innerText : ''};
}
"""


def _shot(page, path):
    page.screenshot(path=path, full_page=False)


def _full(page, path):
    page.screenshot(path=path, full_page=True)


HASH = "() => window.__artPreview.still()"


def audit_page(page, kind):
    # Let the compositor draw at least one frame and images settle.
    page.wait_for_timeout(300)
    page.evaluate("""() => Promise.all([...document.images].map(i => i.complete ? null : i.decode().catch(() => null)))""")
    page.wait_for_function("() => window.__artPreview && window.__artPreview.ready()", timeout=8000)
    page.wait_for_timeout(120)
    data = page.evaluate(PROBE)

    # Equipment swap: Golden Pot must change the live sprite, then silver restores a difference.
    swap = {'golden_changes_pixels': False, 'silver_changes_pixels': False, 'select_changes_pixels': False,
            'neutral_staff_changes_pixels': False, 'error': None}
    try:
        before = page.evaluate(HASH)
        gold = page.locator('#special .swap button', has_text='Golden Pot')
        if gold.count():
            gold.first.click()
            page.wait_for_timeout(220)
            mid = page.evaluate(HASH)
            on = page.locator('#special .swap button.on').inner_text()
            swap['golden_on'] = 'Golden' in on
            swap['golden_changes_pixels'] = mid != before
            silver = page.locator('#special .swap button', has_text='Silver Pot')
            silver.first.click()
            page.wait_for_timeout(220)
            after = page.evaluate(HASH)
            on2 = page.locator('#special .swap button.on').inner_text()
            swap['silver_on'] = 'Silver' in on2
            swap['silver_changes_pixels'] = after != mid
        equipped = page.evaluate(HASH)
        changed = page.evaluate("""() => {
          const s = document.querySelector('#slots select');
          if (!s) return null;
          const start = s.value;
          const opt = [...s.options].find(o => o.value && o.value !== start);
          if (!opt) return null;
          s.value = opt.value;
          s.dispatchEvent(new Event('change', {bubbles: true}));
          return {from: start, to: opt.value};
        }""")
        page.wait_for_timeout(160)
        nxt = page.evaluate(HASH)
        swap['select_option'] = changed
        swap['select_changes_pixels'] = bool(changed) and nxt != equipped
        if changed:
            page.evaluate("""(from) => {
              const s = document.querySelector('#slots select');
              if (!s) return;
              s.value = from;
              s.dispatchEvent(new Event('change', {bubbles: true}));
            }""", changed['from'])
        # Shared staff control on a second character, then return to the default avatar.
        page.click('#tabs button[data-id="AVT_CEL_001"]')
        page.wait_for_timeout(200)
        base = page.evaluate(HASH)
        page.locator('#special .swap button', has_text='Neutral shared staff').click()
        page.wait_for_timeout(220)
        swap['neutral_staff_changes_pixels'] = page.evaluate(HASH) != base
        page.click('#tabs button[data-id="AVT_AEG_001"]')
        page.locator('#special .swap button', has_text='Silver Pot').click()
        page.wait_for_timeout(180)
    except Exception as e:
        swap['error'] = str(e)
    data['swap'] = swap

    fails = []
    if data['overflow']['scrollWidth'] > data['overflow']['clientWidth'] + 1:
        fails.append(f"horizontal overflow {data['overflow']['scrollWidth']} > {data['overflow']['clientWidth']}")

    for n in data['names']:
        visible_name = n.get('shown', True)
        if n['where'] == 'card-name-th' and not visible_name:
            continue  # Thai stays in the caption when the plate cannot hold two 12px lines
        if not visible_name and n['where'] in ('card-name', 'cardMeta', 'tab'):
            fails.append(f"name hidden ({n['where']}: {n.get('text','')[:40]})")
            continue
        if visible_name and n.get('fontSize', 99) < NAME_MIN_PX - 0.05:
            fails.append(f"name font {n['fontSize']:.1f}px < {NAME_MIN_PX:.0f}px ({n['where']}: {n.get('text','')[:40]})")
        if n.get('clippedByCard'):
            fails.append(f"name clipped by card ({n['where']}: {n.get('text','')[:40]})")
        if n['where'] == 'card-name' and (n.get('contentTaller') or n.get('contentWider')):
            fails.append(f"card name overflows its plate ({n.get('text','')[:40]})")
    meta = next((n for n in data['names'] if n['where'] == 'cardMeta'), None)
    if not meta or not any('\u0e00' <= ch <= '\u0e7f' for ch in meta.get('text', '')):
        fails.append('Thai character name missing from the visible caption')

    sp = data['sprite']
    if not sp.get('present'):
        fails.append('sprite canvas missing')
    else:
        ir = (sp.get('imageRendering') or '').lower()
        if 'pixelated' not in ir:
            fails.append(f"sprite image-rendering is {ir!r}")
        if sp.get('clip', {}).get('cropped'):
            fails.append(f"sprite cropped by an ancestor {sp['clip']}")
        if sp.get('displayRatio') and abs(sp['displayRatio'] - 1) > RATIO_TOL:
            fails.append(f"sprite display not square ({sp['displayRatio']})")
        if sp.get('opaqueCornerSamples', 0) > 0:
            fails.append(f"sprite opaque pixels clipped by stage radius ({sp['opaqueCornerSamples']} samples)")

    card = data.get('card') or {}
    art = data.get('art') or {}
    frame = data.get('frame') or {}
    if card.get('ratio') is None:
        fails.append('card missing')
    elif abs(card['ratio'] - (750 / 1050)) > RATIO_TOL:
        fails.append(f"card ratio {card['ratio']} != 750/1050")
    if art.get('ratio') is None:
        fails.append('card art image missing')
    elif abs(art['ratio'] - 0.75) > RATIO_TOL:
        fails.append(f"card art ratio {art['ratio']} != 3/4")
    if frame.get('ratio') is None:
        fails.append('frame image missing')
    elif abs(frame['ratio'] - (750 / 1050)) > RATIO_TOL:
        fails.append(f"frame ratio {frame['ratio']} != 750/1050")

    # Touch targets apply to phone and tablet viewports, not the desktop mouse layout.
    if kind != 'desktop':
        small = [t for t in data['touch'] if t['fail']]
        if small:
            sample = ', '.join(f"{t['tag']} '{t['text']}' {t['w']}×{t['h']}" for t in small[:6])
            fails.append(f"{len(small)} touch targets < {TOUCH_MIN_PX:.0f}px ({sample})")

    broken = [i for i in data['imgs'] if not i['ok']]
    if broken:
        fails.append(f"{len(broken)} broken images")

    if not data['swap'].get('golden_changes_pixels') or not data['swap'].get('silver_changes_pixels') or not data['swap'].get('golden_on'):
        fails.append(f"golden pot swap failed {data['swap']}")
    if not data['swap'].get('select_changes_pixels'):
        fails.append(f"equipment select swap failed {data['swap']}")
    if not data['swap'].get('neutral_staff_changes_pixels'):
        fails.append(f"neutral staff swap failed {data['swap']}")

    data['fails'] = fails
    data['status'] = 'PASS' if not fails else 'FAIL'
    # Trim touch list in the saved report to failures plus a count, keep full fails.
    data['touch_summary'] = {
        'count': len(data['touch']),
        'undersized': [t for t in data['touch'] if t['fail']][:12],
        'undersized_count': sum(1 for t in data['touch'] if t['fail']),
    }
    data.pop('touch', None)
    data['images_broken'] = broken
    data['images_total'] = len(data.pop('imgs'))
    return data


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return


def run(phase, strict):
    os.makedirs(os.path.join(OUT, phase), exist_ok=True)
    httpd = ThreadingHTTPServer(('127.0.0.1', 0), partial(_Quiet, directory=ROOT))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    results = []
    console = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', args=['--no-sandbox', '--disable-dev-shm-usage'])
        for vid, w, h, kind in VIEWPORTS:
            console.clear()
            ctx = browser.new_context(
                viewport={'width': w, 'height': h},
                device_scale_factor=1,
                is_mobile=kind != 'desktop',
                has_touch=kind != 'desktop',
            )
            page = ctx.new_page()
            page.on('console', lambda m: console.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: console.append(str(e)))
            page.goto(base + '/preview/index.html')
            row = audit_page(page, kind)
            errs = list(console)
            if errs:
                row['fails'] = list(row['fails']) + [f"{len(errs)} console errors"]
                row['status'] = 'FAIL'
            row['console_errors'] = errs[:8]
            row['viewport'] = vid
            row['kind'] = kind
            row['size'] = [w, h]
            row['page'] = 'preview/index.html'
            shot = os.path.join(OUT, phase, f'{vid}.png')
            full = os.path.join(OUT, phase, f'{vid}_full.png')
            # Re-render default (silver) and shoot from the top, then the sprite.
            page.evaluate("""() => {
              const b = [...document.querySelectorAll('#special .swap button')].find(x => /Silver Pot/.test(x.textContent));
              if (b) b.click();
              window.scrollTo(0, 0);
            }""")
            page.wait_for_timeout(200)
            _shot(page, shot)
            page.evaluate("""() => {
              const s = document.querySelector('#stage');
              const top = s.getBoundingClientRect().top + window.scrollY - 12;
              window.scrollTo(0, Math.max(0, top));
            }""")
            page.wait_for_timeout(120)
            sprite_shot = os.path.join(OUT, phase, f'{vid}_sprite.png')
            _shot(page, sprite_shot)
            page.evaluate("() => window.scrollTo(0, 0)")
            _full(page, full)
            row['screenshot'] = os.path.relpath(shot, ROOT)
            row['screenshot_sprite'] = os.path.relpath(sprite_shot, ROOT)
            row['screenshot_full'] = os.path.relpath(full, ROOT)
            results.append(row)
            print(f"{row['status']:4}  {vid:10}  {kind:16}  fails={len(row['fails'])}")
            for f in row['fails']:
                print(f"        - {f}")
            ctx.close()

        # Standalone smoke: same layout, inlined images. Two viewports stand in for the set.
        for vid, w, h, kind in (('390x844', 390, 844, 'phone-portrait'), ('1440x900', 1440, 900, 'desktop')):
            console.clear()
            ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1,
                                      is_mobile=kind != 'desktop', has_touch=kind != 'desktop')
            page = ctx.new_page()
            page.on('console', lambda m: console.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: console.append(str(e)))
            page.goto(base + '/preview/card_game_art_preview_standalone.html')
            row = audit_page(page, kind)
            errs = list(console)
            if errs:
                row['fails'] = list(row['fails']) + [f"{len(errs)} console errors"]
                row['status'] = 'FAIL'
            row['console_errors'] = errs[:8]
            row['viewport'] = vid + '-standalone'
            row['kind'] = kind
            row['size'] = [w, h]
            row['page'] = 'preview/card_game_art_preview_standalone.html'
            shot = os.path.join(OUT, phase, f'{vid}_standalone.png')
            _shot(page, shot)
            row['screenshot'] = os.path.relpath(shot, ROOT)
            results.append(row)
            print(f"{row['status']:4}  {row['viewport']:18}  fails={len(row['fails'])}")
            for f in row['fails']:
                print(f"        - {f}")
            ctx.close()
        browser.close()
    httpd.shutdown()

    summary = {
        'phase': phase,
        'name_min_px': NAME_MIN_PX,
        'touch_min_px': TOUCH_MIN_PX,
        'viewports': [
            {'viewport': r['viewport'], 'size': r['size'], 'kind': r['kind'], 'page': r['page'],
             'status': r['status'], 'fails': r['fails']}
            for r in results
        ],
    }
    name = 'before_results.json' if phase == 'before' else 'results.json'
    with open(os.path.join(OUT, name), 'w') as f:
        json.dump({'summary': summary, 'details': results}, f, indent=1, ensure_ascii=False)
    print(f"wrote {os.path.join(OUT, name)}")
    failed = [r for r in results if r['status'] != 'PASS']
    if strict and failed:
        return 1
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--phase', choices=('before', 'after'), default='after')
    args = ap.parse_args()
    strict = args.phase == 'after'
    sys.exit(run(args.phase, strict))


if __name__ == '__main__':
    main()
