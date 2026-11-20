// UI sound track for a cut clip. Run from the video workspace: node recorder/sfx.mjs <cut-name>
// Places a soft key tick on every typed key and a click on every press, from the clip's event log,
// so the sound lands on the exact frame the picture does. Writes assets/audio/<cut>-ui.wav.
// Sounds come from assets/sfx/ (key-press.mp3, click-soft.mp3): copy them from HyperFrames' media-use skill
// (skills/media-use/audio/assets/sfx/) or any sound you have the rights to.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const name = process.argv[2];
const ROOT = process.cwd();
if (!name) { console.error('usage: node recorder/sfx.mjs <cut-name>'); process.exit(1); }
globalThis.window = {};
await import(pathToFileURL(path.join(ROOT, 'assets/data', `${name}.js`)).href);
const clip = window.__demo[name];

let s = 11;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const hits = [];
for (const f of ['key-press.mp3', 'click-soft.mp3']) {
  if (!fs.existsSync(path.join(ROOT, 'assets/sfx', f))) { console.error(`missing assets/sfx/${f}`); process.exit(1); }
}
for (const e of clip.events) {
  // light arrives before sound: each hit lands ~1 frame after its picture
  if (e.type === 'key') hits.push({ file: 'key-press.mp3', t: e.t + 0.016, vol: 0.55 + rand() * 0.25, rate: 0.94 + rand() * 0.12 });
  if (e.type === 'down') hits.push({ file: 'click-soft.mp3', t: e.t + 0.016, vol: 0.55, rate: 1 });
}
fs.mkdirSync(path.join(ROOT, 'assets/audio'), { recursive: true });
const out = path.join(ROOT, 'assets/audio', `${name}-ui.wav`);
if (!hits.length) { console.log('no hits'); process.exit(0); }
const args = ['-y', '-loglevel', 'error'];
for (const h of hits) args.push('-i', path.join(ROOT, 'assets/sfx', h.file));
const chains = hits.map((h, i) => `[${i}:a]asetrate=44100*${h.rate.toFixed(3)},aresample=44100,volume=${h.vol.toFixed(3)},adelay=${Math.round(h.t * 1000)}:all=1[a${i}]`);
const graph = `${chains.join(';')};${hits.map((_, i) => `[a${i}]`).join('')}amix=inputs=${hits.length}:normalize=0,apad=whole_dur=${clip.duration}[out]`;
args.push('-filter_complex', graph, '-map', '[out]', '-t', String(clip.duration), '-ac', '2', '-ar', '44100', out);
execFileSync('ffmpeg', args);
console.log(JSON.stringify({ out: path.relative(ROOT, out), hits: hits.length }));
