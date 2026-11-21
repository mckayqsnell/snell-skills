// Demo recorder: drives a real page with human-paced input and records clean footage.
// - Frames come from Playwright's page.screencast (onFrame, with timestamps), or Chrome's raw CDP screencast as a
//   fallback. ffmpeg then holds each frame until the next one, giving a true constant-fps MP4.
// - The OS cursor is never in the picture. Every pointer move, click, key, scroll, mark and box is logged to
//   <clip>.events.json, so the edit draws its own smooth cursor, places key sounds and aims zooms from the log.
//
//   import { launch, createRecorder } from './recorder.mjs';
//   const { browser, page } = await launch({ width: 1280, height: 720, dpr: 2.5 });
//   const rec = createRecorder(page, { outDir: 'raw' });
//   await rec.start('intro'); await rec.click(page.getByRole('button', { name: 'New' })); await rec.stop();
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadPlaywright } from './find-playwright.mjs';

const pw = await loadPlaywright();
export const { chromium } = pw;

// Seeded random, so typing rhythm and cursor arcs are the same on every take.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Headless Chrome sends screencast frames at CSS-pixel size unless the whole browser runs at a forced scale factor
// (a context deviceScaleFactor alone gives 1280-wide frames). Headless also keeps ~87 px of the window for an
// invisible toolbar, so the window is taller than the page. Checked, not assumed: the page size is asserted.
export async function launch({ width = 1280, height = 720, dpr = 2.5, headless = true, theme, storageState, channel = 'chrome', toolbar = 87, bypassCSP = true } = {}) {
  const args = ['--hide-scrollbars', `--force-device-scale-factor=${dpr}`, `--window-size=${width},${height + (headless ? toolbar : 0)}`];
  let browser;
  try { browser = await chromium.launch({ channel, headless, args }); } catch {
    browser = await chromium.launch({ headless, args }); // no Chrome installed: Playwright's own Chromium
  }
  const context = await browser.newContext({ ignoreHTTPSErrors: true, bypassCSP, viewport: null, colorScheme: theme, storageState }); // bypassCSP: addStyleTag works on a strict-CSP app
  const page = await context.newPage();
  const inner = await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]);
  if (inner[0] !== width || inner[1] !== height || inner[2] !== dpr) {
    await browser.close();
    throw new Error(`page is ${inner.join('x')}, wanted ${width}x${height}@${dpr}. Adjust launch({ toolbar }) by the height difference.`);
  }
  return { browser, context, page, viewport: { width, height, dpr } };
}

export function createRecorder(page, { outDir, engine = 'auto', maxWidth = 3200, maxHeight = 1800, quality = 88, fps = 60, seed = 7 } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const rand = rng(seed);
  let cdp = null; let clip = null; let cursor = { x: 0, y: 0 }; let used = null;

  const log = (event) => { if (clip) clip.events.push({ ...event, at: Date.now() }); };

  function onFrame(buf, tsMs) {
    if (!clip) return;
    const file = path.join(clip.dir, `f${String(clip.frames.length).padStart(5, '0')}.jpg`);
    clip.frames.push([file, tsMs]);
    clip.writes.push(fs.promises.writeFile(file, buf));
  }

  async function startCdp() {
    cdp ??= await page.context().newCDPSession(page);
    cdp.removeAllListeners('Page.screencastFrame');
    cdp.on('Page.screencastFrame', (f) => {
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
      onFrame(Buffer.from(f.data, 'base64'), f.metadata.timestamp * 1000);
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality, maxWidth, maxHeight, everyNthFrame: 1 });
  }

  async function startOfficial() {
    await page.screencast.start({
      size: { width: maxWidth, height: maxHeight }, quality,
      onFrame: ({ data, timestamp }) => onFrame(data, timestamp),
    });
  }

  // Reads the first frame's width from its JPEG header, to check the official feed really gives full-size frames.
  function jpegWidth(buf) {
    for (let i = 2; i < buf.length - 9;) {
      if (buf[i] !== 0xff) return 0;
      const m = buf[i + 1]; const len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xc3) return buf.readUInt16BE(i + 7);
      i += 2 + len;
    }
    return 0;
  }

  async function start(name) {
    const dir = path.join(outDir, `${name}.frames`);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    clip = { name, dir, frames: [], events: [], writes: [] };
    const want = engine === 'auto' ? (page.screencast?.start ? 'official' : 'cdp') : engine;
    if (want === 'official') {
      await startOfficial();
      if (engine === 'auto') {
        // Nudge a repaint and look at the first frame. Too small: switch to CDP for this and later takes.
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        for (let i = 0; i < 40 && !clip.frames.length; i++) await sleep(25);
        await Promise.all(clip.writes);
        const w = clip.frames.length ? jpegWidth(fs.readFileSync(clip.frames[0][0])) : 0;
        if (w && w < maxWidth * 0.95) {
          await page.screencast.stop();
          clip.frames = []; clip.writes = [];
          engine = 'cdp';
          await startCdp(); used = 'cdp';
        } else { used = 'official'; }
      } else { used = 'official'; }
    } else { await startCdp(); used = 'cdp'; }
    log({ type: 'cursor', x: cursor.x, y: cursor.y });
  }

  // Ends the clip: MP4 at a constant fps (each frame held until the next one arrived) plus the event log.
  // A still page paints nothing, so the last frame is held until the moment stop() was called: a hold at the
  // end of a take (rec.sleep before stop) stays in the clip.
  async function stop() {
    const end = Date.now();
    if (used === 'official') await page.screencast.stop(); else await cdp.send('Page.stopScreencast');
    const c = clip; clip = null;
    await Promise.all(c.writes);
    if (!c.frames.length) throw new Error('no frames arrived: is the page painting?');
    const t0 = c.frames[0][1];
    // Frame timestamps and Date.now() are both ms since the epoch, so they share one clock.
    const endTs = Math.max(c.frames.at(-1)[1] + 1000 / fps, end);
    const list = c.frames.map(([file, ts], i) => {
      const next = c.frames[i + 1]?.[1] ?? endTs;
      return `file '${file}'\nduration ${((next - ts) / 1000).toFixed(5)}`;
    }).join('\n') + `\nfile '${c.frames.at(-1)[0]}'\n`;
    const listFile = path.join(c.dir, 'list.txt');
    fs.writeFileSync(listFile, list);
    const mp4 = path.join(outDir, `${c.name}.mp4`);
    const total = (endTs - t0) / 1000;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-vf', `fps=${fps},format=yuv420p`, '-t', total.toFixed(3), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
      '-g', String(fps / 2), '-movflags', '+faststart', mp4]);
    const gaps = c.frames.slice(1).map((f, i) => f[1] - c.frames[i][1]);
    const frameWidth = jpegWidth(fs.readFileSync(c.frames[0][0]));
    const meta = {
      clip: c.name, engine: used, frameWidth,
      viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })), fps,
      durationSec: total,
      frames: c.frames.length, longGapsMs: gaps.filter((g) => g > 40).map(Math.round),
      events: c.events.map((e) => ({ ...e, t: +((e.at - t0) / 1000).toFixed(3), at: undefined })),
    };
    fs.writeFileSync(path.join(outDir, `${c.name}.events.json`), JSON.stringify(meta, null, 1));
    fs.rmSync(c.dir, { recursive: true, force: true });
    return meta;
  }

  async function centerOf(target) {
    if (typeof target.x === 'number') return target;
    await target.scrollIntoViewIfNeeded().catch(() => {});
    const box = await target.boundingBox();
    if (!box) throw new Error('target not visible');
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  // A human move: eased, slightly arced, ~16 ms steps. The real mouse moves too, so hover states play.
  async function move(target, { ms } = {}) {
    const to = await centerOf(target);
    const from = { ...cursor };
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const dur = ms ?? Math.min(1100, 420 + dist * 0.55);
    const bend = (rand() - 0.5) * Math.min(120, dist * 0.18);
    const nx = -(to.y - from.y) / (dist || 1); const ny = (to.x - from.x) / (dist || 1);
    // Steps on wall-clock time, so a slow mouse.move can't stretch the move past what the log says.
    log({ type: 'move', from, to, ms: Math.round(dur), bend: +bend.toFixed(1) });
    const entry = clip?.events.at(-1); const t0 = Date.now();
    for (;;) {
      const u = Math.min(1, (Date.now() - t0) / dur);
      const t = easeInOut(u); const arc = Math.sin(Math.PI * t) * bend;
      const x = from.x + (to.x - from.x) * t + nx * arc; const y = from.y + (to.y - from.y) * t + ny * arc;
      await page.mouse.move(x, y);
      cursor = { x, y };
      if (u >= 1) break;
      await sleep(16);
    }
    if (entry?.type === 'move') entry.ms = Date.now() - t0; // the real length, for the drawn cursor
    cursor = to;
  }

  async function click(target, { settle = 140, label } = {}) {
    if (label && typeof target.x !== 'number') await box(label, target);
    await move(target);
    await sleep(settle);
    log({ type: 'down', ...cursor });
    await page.mouse.down(); await sleep(90); await page.mouse.up();
    log({ type: 'up', ...cursor });
  }

  // Types like a person: 40-95 ms a key, a beat longer after spaces and punctuation. fast: 14-34 ms a key, for
  // long prompts the edit should not have to speed up (key sounds stay in step at 1x).
  async function type(text, { min = 40, max = 95, fast = false } = {}) {
    if (fast) { min = 14; max = 34; }
    for (const ch of text) {
      log({ type: 'key', key: ch });
      await page.keyboard.type(ch);
      let d = min + rand() * (max - min);
      if (ch === ' ') d += fast ? 10 : 30;
      if (/[,.?!]/.test(ch)) d += fast ? 40 : 120;
      await sleep(d);
    }
  }

  // A double-click (edit in place, select a word): two logged presses, so the drawn cursor and sounds see both.
  async function dblclick(target, { settle = 140, label } = {}) {
    if (label && typeof target.x !== 'number') await box(label, target);
    await move(target);
    await sleep(settle);
    for (const clickCount of [1, 2]) {
      log({ type: 'down', ...cursor });
      await page.mouse.down({ clickCount }); await sleep(60); await page.mouse.up({ clickCount });
      log({ type: 'up', ...cursor });
      await sleep(70);
    }
  }

  async function press(key) { log({ type: 'key', key }); await page.keyboard.press(key); }

  // A reader's scroll: small wheel steps, eased, so the page glides instead of jumping.
  async function scroll(dy, { ms = 700 } = {}) {
    log({ type: 'scroll', dy, ms, ...cursor });
    const steps = Math.max(4, Math.round(ms / 16)); let done = 0;
    for (let i = 1; i <= steps; i++) {
      const next = Math.round(dy * easeInOut(i / steps));
      await page.mouse.wheel(0, next - done); done = next;
      await sleep(ms / steps);
    }
  }

  // mark: a named moment (sent, done, approval) the edit can cut or zoom on.
  // box: the rect of something worth framing (CSS px), for the camera. Log one for every zoom target in the shot list.
  const mark = (label, extra = {}) => log({ type: 'mark', label, ...extra });
  async function box(label, locator) {
    // a short timeout: a locator that matches nothing must not leave 30 s of dead footage
    const b = await locator.boundingBox({ timeout: 1000 }).catch(() => null);
    if (b) log({ type: 'box', label, x: b.x, y: b.y, w: b.width, h: b.height });
    else { console.warn(`box "${label}": nothing visible matched`); log({ type: 'mark', label: 'missing-box', box: label }); }
    return b;
  }
  // watchAttr: log a mark (with the element's rect) each time an attribute on a matching element changes to
  // `value` (any value when left out). For animations worth syncing. Call it after the page has loaded, before the
  // moment happens; it survives until the next page load.
  let watching = false;
  async function watchAttr(selector, attr, value, label) {
    if (!watching) {
      await page.exposeFunction('__recWatch', (l, r) => log({ type: 'mark', label: l, ...r }));
      watching = true;
    }
    await page.evaluate(({ selector, attr, value, label }) => {
      const hit = (el) => {
        const v = el.getAttribute(attr);
        if (v === null || (value !== undefined && value !== null && v !== String(value))) return;
        const r = el.getBoundingClientRect();
        window.__recWatch(label, { x: r.x, y: r.y, w: r.width, h: r.height, value: v });
      };
      new MutationObserver((list) => {
        for (const m of list) {
          if (m.type === 'attributes' && m.target.matches?.(selector)) hit(m.target);
          for (const n of m.addedNodes || []) if (n.nodeType === 1) { if (n.matches(selector)) hit(n); n.querySelectorAll?.(selector).forEach(hit); }
        }
      }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: [attr] });
    }, { selector, attr, value, label });
  }
  const setCursor = (p) => { cursor = p; };

  return { start, stop, move, click, dblclick, type, press, scroll, mark, box, watchAttr, setCursor, sleep, get engine() { return used; } };
}
