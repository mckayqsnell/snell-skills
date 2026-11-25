// UI sound track for a cut clip. Run from the video workspace:
//   node recorder/sfx.mjs <cut-name> [--gain 0.55] [--pack soft] [--at "success@12.4,whoosh@3.1"] [--no-ui]
// Places a soft key tick on every typed key and a click on every press, from the clip's event log, so the sound
// lands on the exact frame the picture does. Writes assets/audio/<cut>-ui.wav.
// Sounds: HyperFrames' own by default, from assets/sfx/ (key-press.mp3, click-soft.mp3; copy them from the media-use
// skill's audio/assets/sfx/). --pack <name> uses a uisfx pack from assets/sfx/uisfx/<name>/ (recorder/sfx-packs.mjs).
// Named cues: a mark in the take labelled "sfx:<cue>" (rec.mark('sfx:success')) plays that cue on its frame;
// "sfx:success+0.5" or "sfx:connect-0.3" shifts it by that many seconds. --at adds cues at times in the CUT
// (not the raw take, unlike "at" in voice/script.json). A cue is looked up in the pack first, then in assets/sfx/<cue>.mp3.
// --no-ui leaves out the clicks and keys (a recorded video with its own sound keeps only the named cues).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { CLICK, KEY } from './sfx-packs.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const name = argv[0];
// UI sounds sit under the picture, not on top of it: about -5 dB from the samples' own level. --gain 0.8 for louder.
const GAIN = Number(opt('--gain', 0.55));
const PACK = opt('--pack');
const ROOT = process.cwd();
if (!name || name.startsWith('--')) { console.error('usage: node recorder/sfx.mjs <cut-name> [--gain g] [--pack name] [--at "cue@t,..."] [--no-ui]'); process.exit(1); }
globalThis.window = {};
await import(pathToFileURL(path.join(ROOT, 'assets/data', `${name}.js`)).href);
const clip = window.__demo[name];

const sfxDir = path.join(ROOT, 'assets/sfx');
const packDir = PACK ? path.join(sfxDir, 'uisfx', PACK) : null;
if (packDir && !fs.existsSync(packDir)) { console.error(`no pack at assets/sfx/uisfx/${PACK}: run node recorder/sfx-packs.mjs get ${PACK}`); process.exit(1); }
// The file for a cue: the pack's, else HyperFrames' own.
const cueFile = (cue) => {
  if (!/^[a-z0-9-]+$/.test(cue)) return null;
  const inPack = packDir && path.join(packDir, `${cue}.mp3`);
  if (inPack && fs.existsSync(inPack)) return inPack;
  const own = path.join(sfxDir, `${cue}.mp3`);
  return fs.existsSync(own) ? own : null;
};
const firstOf = (cues) => cues.map(cueFile).find(Boolean);
const clickFile = packDir ? firstOf(CLICK) : cueFile('click-soft');
const keyFile = packDir ? firstOf(KEY) : cueFile('key-press');
const ui = !argv.includes('--no-ui');
if (ui && (!clickFile || !keyFile)) { console.error(`missing the click or key sound in ${packDir ? `assets/sfx/uisfx/${PACK}` : 'assets/sfx (key-press.mp3, click-soft.mp3)'}`); process.exit(1); }

let s = 11;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const hits = []; const missing = new Set();
const cue = (c, t) => { const f = cueFile(c); if (f) hits.push({ file: f, t, vol: GAIN * 0.8, rate: 1 }); else missing.add(c); };
for (const e of clip.events || []) {
  // light arrives before sound: each hit lands ~1 frame after its picture
  if (ui && e.type === 'key') hits.push({ file: keyFile, t: e.t + 0.016, vol: GAIN * (0.55 + rand() * 0.25), rate: 0.94 + rand() * 0.12 });
  if (ui && e.type === 'down') hits.push({ file: clickFile, t: e.t + 0.016, vol: GAIN * 0.5, rate: 1 });
  if (e.type === 'mark' && typeof e.label === 'string' && e.label.startsWith('sfx:')) {
    const [, c, shift] = e.label.slice(4).match(/^(.+?)([+-]\d*\.?\d+)?$/) || [];
    if (c) cue(c, e.t + 0.016 + Number(shift || 0));
  }
}
for (const part of (opt('--at', '') || '').split(',').filter(Boolean)) {
  const [c, t] = part.split('@');
  if (!c || !Number.isFinite(Number(t))) { console.error(`--at wants cue@seconds, got "${part}"`); process.exit(1); }
  cue(c.trim(), Number(t));
}
if (missing.size) console.warn(`no sound for: ${[...missing].join(', ')} (not in the pack or assets/sfx)`);
fs.mkdirSync(path.join(ROOT, 'assets/audio'), { recursive: true });
const out = path.join(ROOT, 'assets/audio', `${name}-ui.wav`);
if (!hits.length) { console.log('no hits'); process.exit(0); }
// ffmpeg reads each sound once and splits it, so a take with hundreds of keys stays one small command
const files = [...new Set(hits.map((h) => h.file))];
const args = ['-y', '-loglevel', 'error'];
for (const f of files) args.push('-i', f);
const uses = files.map((f) => hits.filter((h) => h.file === f).length);
const split = files.map((f, i) => `[${i}:a]aresample=44100,asplit=${uses[i]}${Array.from({ length: uses[i] }, (_, k) => `[s${i}_${k}]`).join('')}`);
const seen = files.map(() => 0);
const chains = hits.map((h, j) => {
  const i = files.indexOf(h.file); const k = seen[i]++;
  return `[s${i}_${k}]asetrate=44100*${h.rate.toFixed(3)},aresample=44100,volume=${h.vol.toFixed(3)},adelay=${Math.round(h.t * 1000)}:all=1[a${j}]`;
});
const graph = `${split.join(';')};${chains.join(';')};${hits.map((_, i) => `[a${i}]`).join('')}amix=inputs=${hits.length}:normalize=0,apad=whole_dur=${clip.duration}[out]`;
const gf = path.join(ROOT, 'assets/audio', `.${name}-ui.filter`);
fs.writeFileSync(gf, graph);
const tail = ['-map', '[out]', '-t', String(clip.duration), '-ac', '2', '-ar', '44100', out];
// the graph goes in a file (a long take is too long for one command line): ffmpeg 7+ reads it with -/filter_complex,
// older ones with -filter_complex_script
try {
  try { execFileSync('ffmpeg', [...args, '-/filter_complex', gf, ...tail], { stdio: ['ignore', 'ignore', 'pipe'] }); }
  catch (e) {
    if (!/Unrecognized option|Option not found/.test(String(e.stderr))) throw e;
    execFileSync('ffmpeg', [...args, '-filter_complex_script', gf, ...tail]);
  }
} finally { fs.rmSync(gf, { force: true }); }
console.log(JSON.stringify({ out: path.relative(ROOT, out), hits: hits.length, pack: PACK || 'hyperframes', cues: hits.filter((h) => h.file !== keyFile && h.file !== clickFile).length }));
