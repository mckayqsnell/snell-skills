// Scene script: one file per app, written by the agent from the shot list. Copy to recorder/scenes.mjs and edit.
//   node recorder/scenes.mjs <scene> [theme]
// Each scene: reset state, open the page, then record one take. Prefer one long take through the whole story
// over many short ones: the edit then moves the camera between beats instead of hard-cutting.
import { launch, createRecorder } from './recorder.mjs';

const scene = process.argv[2] || 'story';
const theme = process.argv[3]; // 'dark' or 'light'; leave it out to keep the app's default
const APP = process.env.APP_URL || 'http://localhost:3000'; // the app's dev server
const OUT = new URL('../raw/', import.meta.url).pathname;

const { browser, page } = await launch({ width: 1280, height: 720, dpr: 2.5, theme });
const rec = createRecorder(page, { outDir: OUT, seed: scene.length * 31 });

// App-specific helpers. Replace these with what the app needs:
// - sign in with the app's test login or seed account (never a real customer's);
// - reset any saved state (modes, drafts, toggles) so every take starts the same;
// - a "done" wait that reads the app's own signal (a spinner gone, a data-state attribute, a toast).
async function open(url) {
  // await page.goto(`${APP}/test-login?user=demo`);
  await page.goto(`${APP}${url}`);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800); // let first-load animations finish before the take starts
  // Hide dev chrome that isn't the product (prototype switchers, debug badges, version strings), after every goto:
  // await page.addStyleTag({ content: '.dev-toolbar, .version-tag { display: none !important; }' });
}

async function waitDone(isBusy, { min = 1500, max = 120000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    await page.waitForTimeout(150);
    if (Date.now() - t0 > min && !(await isBusy())) { rec.mark('done'); return; }
  }
  rec.mark('timeout');
}

// A single-page app changes screens without a page load: wait on the URL or a landmark, and mark a timeout.
async function onScreen(urlPart, { timeout = 20000 } = {}) {
  try { await page.waitForURL((u) => u.href.includes(urlPart), { timeout }); } catch { rec.mark('timeout', { waiting: urlPart }); }
}

try {
  if (scene === 'story') {
    await open('/');
    rec.setCursor({ x: 640, y: 420 }); // where the drawn cursor starts
    await rec.start('story');
    await rec.sleep(900);

    // Beat 1: log a box for every zoom target in the shot list, and a mark for every moment the edit cuts on.
    const input = page.getByRole('textbox').first();
    await rec.box('input', input);
    await rec.click(input);
    await rec.type('A realistic thing a user would type');
    await rec.press('Enter');
    rec.mark('sent');
    await waitDone(async () => (await page.locator('[aria-busy="true"]').count()) > 0);
    await rec.box('result', page.getByRole('main'));
    await rec.sleep(2000); // hold on the result: the edit trims, it can't invent footage

    // Beat 2 ...
  }
  const meta = await rec.stop();
  console.log(JSON.stringify({
    clip: meta.clip, engine: meta.engine, frameWidth: meta.frameWidth, sec: meta.durationSec.toFixed(1),
    frames: meta.frames, longGaps: meta.longGapsMs.length,
    marks: meta.events.filter((e) => e.type === 'mark').map((e) => `${e.label}@${e.t}`),
  }));
} finally {
  await browser.close(); // always: a take that throws must not leave Chrome running
}
