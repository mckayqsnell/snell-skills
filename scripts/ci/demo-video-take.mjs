// CI smoke test: one short real take through demo-video's recorder.mjs, then check the MP4 and event log.
//   node scripts/ci/demo-video-take.mjs <workspace made by setup.mjs>
// Needs ffmpeg, ffprobe, Chrome (or Playwright's Chromium) and a Playwright that find-playwright.mjs can find.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ws = path.resolve(process.argv[2] || '');
const { launch, createRecorder } = await import(pathToFileURL(path.join(ws, 'recorder', 'recorder.mjs')).href);
const out = path.join(ws, 'raw');

const { browser, page } = await launch({ width: 640, height: 360, dpr: 2.5 });
try {
  // A spinning box keeps the page painting, so the screencast sends frames the whole time.
  await page.setContent(`<style>body{margin:0;display:grid;place-items:center;height:100vh}
    #b{width:120px;height:120px;background:#c2410c;animation:s 1s linear infinite}@keyframes s{to{transform:rotate(1turn)}}</style>
    <div id="b"></div><button id="go" style="font-size:24px">Go</button>`);
  const rec = createRecorder(page, { outDir: out });
  await rec.start('take');
  await rec.box('go', page.locator('#go'));
  await rec.click(page.locator('#go'));
  rec.mark('clicked');
  await rec.sleep(1000);
  const meta = await rec.stop();
  const mp4 = path.join(out, 'take.mp4');
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', mp4], { encoding: 'utf8' }));
  const log = JSON.parse(fs.readFileSync(path.join(out, 'take.events.json'), 'utf8'));
  const marks = log.events.filter((e) => e.type === 'mark').map((e) => e.label);
  const res = { engine: meta.engine, frameWidth: log.frameWidth, frames: meta.frames, mp4Sec: Number(probe.format.duration), mp4Width: probe.streams[0].width, mp4Height: probe.streams[0].height, marks };
  console.log(JSON.stringify(res));
  const bad = [];
  if (res.frameWidth !== 1600) bad.push(`frameWidth ${res.frameWidth}, want 1600 (640 css px at 2.5x)`);
  if (res.mp4Width !== 1600 || res.mp4Height !== 900) bad.push(`mp4 is ${res.mp4Width}x${res.mp4Height}, want 1600x900`);
  if (!(res.mp4Sec > 0.8)) bad.push(`mp4 is ${res.mp4Sec} s`);
  if (!marks.includes('clicked')) bad.push('no "clicked" mark');
  if (marks.includes('missing-box')) bad.push('the "go" box matched nothing');
  if (bad.length) { console.error(`❌ ${bad.join('; ')}`); process.exitCode = 1; } else console.log('✅ recorder.mjs made a take and its event log');
} finally {
  await browser.close();
}
