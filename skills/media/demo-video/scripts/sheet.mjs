// Contact sheet with time labels, so a reviewer can name exact moments.
//   node recorder/sheet.mjs <video> <out.png> <from> <to> <step> [cols] [tileWidth]
//   node recorder/sheet.mjs <video> <out.png> --at 1.2,3.4,5 [cols] [tileWidth]
// Labels are drawn by a headless page because many ffmpeg builds (Homebrew's among them) have no drawtext filter.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from './recorder.mjs';

const [video, out, a, b, c, colsArg, wArg] = process.argv.slice(2);
let times; let cols; let w;
if (a === '--at') { times = b.split(',').map(Number); cols = Number(c || 4); w = Number(colsArg || 640); } else {
  times = []; for (let t = Number(a); t <= Number(b) + 1e-6; t += Number(c)) times.push(+t.toFixed(3));
  cols = Number(colsArg || 4); w = Number(wArg || 640);
}
// Clamp to the last frame: seeking to the exact end writes nothing and ffmpeg fails.
const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate:format=duration', '-of', 'json', video]);
const info = JSON.parse(probe); const [fn, fd] = info.streams[0].r_frame_rate.split('/').map(Number);
const last = Number(info.format.duration) - 1.5 * (fd / fn);
times = times.map((t) => Math.max(0, Math.min(t, +last.toFixed(3))));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
const imgs = times.map((t, i) => {
  const f = path.join(dir, `${i}.jpg`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf', `scale=${w * 2}:-2`, '-q:v', '3', f]);
  return { t, src: `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` };
});
const html = `<body style="margin:0;background:#444;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:4px;padding:4px;width:max-content">
${imgs.map((i) => `<div style="position:relative"><img src="${i.src}" style="width:${w}px;display:block"><span style="position:absolute;right:6px;bottom:6px;background:#000c;color:#fff;font:600 18px Arial;padding:2px 6px">${i.t.toFixed(2)}s</span></div>`).join('')}</body>`;
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless: true }); } catch { browser = await chromium.launch({ headless: true }); }
try {
const page = await browser.newPage({ viewport: { width: cols * (w + 4) + 4, height: 400 } });
await page.setContent(html); await page.waitForTimeout(200);
await page.screenshot({ path: out, fullPage: true });
} finally { await browser.close(); }
fs.rmSync(dir, { recursive: true, force: true });
console.log(out);
