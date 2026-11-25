// Cuts a talking demo (a screen recording with the user's own voice, and maybe their face) from one or more takes.
// Run from the video workspace, after cutplan.mjs transcribe:
//   node recorder/edl.mjs [cut/edl.json] [--check]
// cut/edl.json:
//   { "out": "talk", "keep": [
//       { "take": "t1", "from": 12.4, "to": 31.9, "label": "Build a pipeline" },
//       { "take": "t1", "from": 40.0, "to": 70.0, "speed": 4 },          // a wait, sped up and muted
//       { "take": "t2", "from": 3.1, "to": 9.8, "camera": false } ] }   // optional fields: speed, label, fade
//   Takes are raw/<take>.mp4|.mov|.mkv; their words are raw/<take>.words.json. A separate webcam file for a take is
//   raw/<take>.cam.mp4 (OBS Source Record, Cap's camera.mp4): it is cut the same way into assets/clips/<out>-cam.mp4.
// Spoken pieces snap to word edges: a cut never lands inside a word, gets 50 ms before and 80 ms after (never into
// the next word), and a 30 ms fade at every join. A piece that starts or ends inside a phrase (not a sentence end
// and less than 0.4 s of pause) is flagged, because a splice there is what viewers hear. --check prints the snapped plan and changes nothing.
// Writes assets/clips/<out>.mp4 (video and cleaned voice), assets/data/<out>.js (segments, words remapped to the
// cut) and assets/data/<out>.json (segments, for srctime.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const PRE = 0.05; const POST = 0.08; const FADE = 0.03; const PHRASE = 0.4; const TIGHT = 0.15;

// --- Snapping (pure, tested in scripts/check.sh) ---
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const sentenceEnd = (word) => /[.?!]["')]?$/.test(word || '');
// A safe join: a real pause, or a sentence end with at least a short breath.
export const safeJoin = (gap, wordBefore) => gap >= PHRASE || (gap >= TIGHT && sentenceEnd(wordBefore));
// from: back to the start of the word it lands in (or the next word, if it lands in a pause), minus PRE, never
// earlier than halfway into the pause before. to: forward to the end of the word it lands in, plus POST, never past
// halfway into the pause after.
// With quiet(lo, hi) (the take's audio, see quietest()), each edge moves to the quietest spot near that word edge
// instead, and the pause is measured from the sound: transcripts often give words no gap at all.
export function snap(piece, words, quiet) {
  if (!words?.length || (piece.speed || 1) !== 1) return { ...piece, notes: [] };
  const notes = [];
  let i = words.findIndex((w) => w.end > piece.from);
  if (i < 0) i = words.length - 1;
  const first = words[i];
  const startAt = Math.min(piece.from, first.start);
  const prevEnd = i > 0 ? words[i - 1].end : 0;
  let from = Math.max(startAt - PRE, prevEnd + (first.start - prevEnd) / 2, 0);
  let j = -1;
  for (let k = words.length - 1; k >= 0; k--) if (words[k].start < piece.to) { j = k; break; }
  if (j < i) j = i;
  const last = words[j];
  const endAt = Math.max(piece.to, last.end);
  const nextStart = j < words.length - 1 ? words[j + 1].start : Infinity;
  let to = Math.min(endAt + POST, nextStart === Infinity ? endAt + POST : last.end + (nextStart - last.end) / 2);
  let gapBefore = first.start - prevEnd; let gapAfter = nextStart - last.end;
  if (quiet) {
    const a = quiet(Math.max(0, Math.min(prevEnd, first.start - 0.15)), first.start + 0.04);
    // inside the quiet stretch, as close to the word as the padding allows
    if (a) { from = a.quiet ? clamp(first.start - PRE, a.a, a.b) : a.t; if (a.quiet) gapBefore = Math.max(gapBefore, a.run); }
    const b = quiet(last.end - 0.04, Math.max(Math.min(nextStart, last.end + 0.6), last.end + 0.15));
    if (b) { to = b.quiet ? clamp(last.end + POST, b.a, b.b) : b.t; if (b.quiet) gapAfter = Math.max(gapAfter, b.run); }
  }
  if (i > 0 && !safeJoin(gapBefore, words[i - 1].text)) notes.push(`starts inside a phrase (${Math.round(gapBefore * 1000)} ms pause before "${first.text}")${gapBefore < TIGHT ? ': words run together, cut elsewhere' : ''}`);
  if (j < words.length - 1 && !safeJoin(gapAfter, last.text)) notes.push(`ends inside a phrase (${Math.round(gapAfter * 1000)} ms pause after "${last.text}")${gapAfter < TIGHT ? ': words run together, cut elsewhere' : ''}`);
  return { ...piece, from: +from.toFixed(3), to: +to.toFixed(3), first: first.text, last: last.text, notes };
}
// The quietest 10 ms in a stretch of mono samples that starts at lo seconds: its time, its level, and how long the
// quiet around it lasts (windows within 6 dB of it and under -38 dBFS), from a to b. quiet is false when nothing
// there is quiet.
export function quietest(samples, rate, lo) {
  const n = Math.max(1, Math.round(rate * 0.01)); const db = [];
  for (let s = 0; s + n <= samples.length; s += n) {
    let sum = 0; for (let k = s; k < s + n; k++) sum += samples[k] * samples[k];
    db.push(10 * Math.log10(sum / n + 1e-12));
  }
  if (!db.length) return null;
  let m = 0; db.forEach((v, k) => { if (v < db[m]) m = k; });
  const floor = db[m]; const ok = (v) => v <= floor + 6 && v <= -38;
  let a = m; let b = m;
  while (a > 0 && ok(db[a - 1])) a--;
  while (b < db.length - 1 && ok(db[b + 1])) b++;
  const q = ok(floor);
  return { t: +(lo + (m + 0.5) * 0.01).toFixed(3), db: +floor.toFixed(1), quiet: q, run: q ? +((b - a + 1) * 0.01).toFixed(2) : 0,
    a: +(lo + (q ? a : m) * 0.01).toFixed(3), b: +(lo + ((q ? b : m) + 1) * 0.01).toFixed(3) };
}
// Reads a stretch of a take's audio for quietest(): mono 8 kHz floats.
export function audioQuiet(file) {
  return (lo, hi) => {
    if (!(hi > lo)) return null;
    const buf = execFileSync('ffmpeg', ['-v', 'error', '-ss', lo.toFixed(3), '-t', (hi - lo).toFixed(3), '-i', file, '-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], { maxBuffer: 1 << 24 });
    const len = Math.floor(buf.length / 4);
    return quietest(new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + len * 4)), 8000, lo);
  };
}
// Lay the pieces end to end: each one's start in the cut, and the cut length.
export function layout(pieces) {
  let at = 0;
  const segs = pieces.map((p) => { const s = { ...p, speed: p.speed || 1, at: +at.toFixed(3) }; at += (p.to - p.from) / s.speed; return s; });
  return { segments: segs, duration: +at.toFixed(3) };
}
// Words that survive, at their times in the cut.
export function remapWords(segments, wordsByTake) {
  const out = [];
  for (const s of segments) {
    if (s.speed !== 1) continue;
    for (const w of wordsByTake[s.take] || []) {
      if (w.start >= s.from && w.end <= s.to + 1e-6) out.push({ text: w.text, start: +(s.at + w.start - s.from).toFixed(3), end: +(s.at + w.end - s.from).toFixed(3), take: s.take });
    }
  }
  return out;
}

// --- Files ---
export function takeFile(take, root = ROOT) {
  for (const ext of ['.mp4', '.mov', '.mkv', '.webm']) { const f = path.join(root, 'raw', `${take}${ext}`); if (fs.existsSync(f)) return f; }
  return null;
}
const probe = (f) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', f], { encoding: 'utf8' }));
function ffGraph(inputs, graph, tail, scratch) {
  const gf = path.join(scratch, `.edl-${process.pid}.filter`);
  fs.writeFileSync(gf, graph);
  const args = ['-y', '-loglevel', 'error', ...inputs.flatMap((f) => ['-i', f])];
  try {
    try { execFileSync('ffmpeg', [...args, '-/filter_complex', gf, ...tail], { stdio: ['ignore', 'ignore', 'pipe'] }); }
    catch (e) {
      if (!/Unrecognized option|Option not found/.test(String(e.stderr))) throw new Error(String(e.stderr).trim().split('\n').slice(-3).join(' | '));
      execFileSync('ffmpeg', [...args, '-filter_complex_script', gf, ...tail]);
    }
  } finally { fs.rmSync(gf, { force: true }); }
}

function main() {
  const file = path.join(ROOT, process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'cut/edl.json');
  const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = plan.out || 'talk';
  const takes = [...new Set(plan.keep.map((k) => k.take))];
  const words = {}; const src = {};
  for (const t of takes) {
    src[t] = takeFile(t);
    if (!src[t]) throw new Error(`no raw/${t}.mp4 (or .mov, .mkv, .webm)`);
    const wf = path.join(ROOT, 'raw', `${t}.words.json`);
    words[t] = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, 'utf8')) : null;
    if (!words[t]) console.warn(`no raw/${t}.words.json: ${t} is cut exactly where edl.json says (run cutplan.mjs transcribe)`);
  }
  const snapped = plan.keep.map((k) => snap(k, words[k.take], words[k.take] ? audioQuiet(src[k.take]) : null));
  const { segments, duration } = layout(snapped.map(({ notes, first, last, ...k }) => k));
  const report = snapped.map((k, n) => ({ n: n + 1, take: k.take, from: k.from, to: k.to, speed: k.speed || 1, at: segments[n].at, ...(k.first ? { says: `${k.first} … ${k.last}` } : {}), ...(k.notes.length ? { notes: k.notes } : {}) }));
  if (process.argv.includes('--check')) { console.log(JSON.stringify({ duration, pieces: report }, null, 1)); return; }

  const first = probe(src[takes[0]]);
  const v = first.streams.find((s) => s.codec_type === 'video');
  const [fn, fd] = v.r_frame_rate.split('/').map(Number);
  const fps = plan.fps || Math.min(60, Math.round(fn / (fd || 1)));
  const W = v.width & ~1; const H = v.height & ~1; // libx264 needs even sizes
  const inputs = takes.map((t) => src[t]);
  const vid = (n, s) => `[${takes.indexOf(s.take)}:v]trim=start=${s.from}:end=${s.to},setpts=(PTS-STARTPTS)/${s.speed},fps=${fps},scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${n}]`;
  const aud = (n, s) => {
    const len = (s.to - s.from) / s.speed;
    if (s.speed !== 1 || s.mute) return `anullsrc=r=48000:cl=stereo,atrim=duration=${len.toFixed(4)}[a${n}]`;
    const fade = s.fade ?? FADE;
    return `[${takes.indexOf(s.take)}:a]atrim=start=${s.from}:end=${s.to},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=${fade},afade=t=out:st=${Math.max(0, len - fade).toFixed(4)}:d=${fade}[a${n}]`;
  };
  // voice cleanup: cut the rumble under 80 Hz and the steady hiss; loudness is set once, at the master
  const clean = plan.clean === false ? 'anull' : 'highpass=f=80,afftdn=nf=-25';
  const parts = segments.map((s, n) => `${vid(n, s)};${aud(n, s)}`);
  const graph = `${parts.join(';')};${segments.map((_, n) => `[v${n}][a${n}]`).join('')}concat=n=${segments.length}:v=1:a=1[vc][ac];[vc]format=yuv420p[vout];[ac]${clean}[aout]`;
  fs.mkdirSync(path.join(ROOT, 'assets/clips'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'assets/data'), { recursive: true });
  ffGraph(inputs, graph, ['-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-g', String(fps), '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', path.join(ROOT, 'assets/clips', `${out}.mp4`)], path.join(ROOT, 'assets/clips'));

  // a separate webcam file, cut the same way (no audio: the voice is in the main clip)
  const cams = takes.map((t) => path.join(ROOT, 'raw', `${t}.cam.mp4`));
  if (cams.every((c) => fs.existsSync(c))) {
    const cg = segments.map((s, n) => `[${takes.indexOf(s.take)}:v]trim=start=${s.from}:end=${s.to},setpts=(PTS-STARTPTS)/${s.speed},fps=${fps}[c${n}]`).join(';')
      + `;${segments.map((_, n) => `[c${n}]`).join('')}concat=n=${segments.length}:v=1:a=0,format=yuv420p[cout]`;
    ffGraph(cams, cg, ['-map', '[cout]', '-c:v', 'libx264', '-crf', '18', '-g', String(fps), '-movflags', '+faststart', path.join(ROOT, 'assets/clips', `${out}-cam.mp4`)], path.join(ROOT, 'assets/clips'));
  }

  const segOut = segments.map((s) => ({ take: s.take, from: s.from, to: s.to, speed: s.speed, at: s.at, ...(s.label ? { label: s.label } : {}) }));
  const data = { clip: out, kind: 'recorded', duration, fps, viewport: { width: W, height: H }, segments: segOut, words: remapWords(segOut, words), events: [] };
  fs.writeFileSync(path.join(ROOT, 'assets/data', `${out}.js`), `window.__demo = window.__demo || {};\nwindow.__demo[${JSON.stringify(out)}] = ${JSON.stringify(data)};\n`);
  fs.writeFileSync(path.join(ROOT, 'assets/data', `${out}.json`), JSON.stringify({ duration, segments: segOut }, null, 1) + '\n');
  const real = Number(probe(path.join(ROOT, 'assets/clips', `${out}.mp4`)).format.duration);
  console.log(JSON.stringify({ out, duration, rendered: +real.toFixed(3), fps, pieces: report.length, flagged: report.filter((r) => r.notes).map((r) => ({ n: r.n, notes: r.notes })) }, null, 1));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) { try { main(); } catch (e) { console.error(`edl: ${e.message}`); process.exit(1); } }
