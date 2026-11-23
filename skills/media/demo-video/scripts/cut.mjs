// Cuts a recorded clip into an edit-ready one. Run from the video workspace:
//   node recorder/cut.mjs <clip> <out> "<from>-<to>@<speed>,<t>~<hold>,..." [width]
//   "12.5-30@4" keeps 12.5-30 s at 4x speed; "41.2~0.5" freezes the frame at 41.2 s for 0.5 s.
// Reads raw/<clip>.mp4 and raw/<clip>.events.json. Writes assets/clips/<out>.mp4 (60 fps, speed ramps applied,
// no audio) and assets/data/<out>.js (the events with times remapped to the cut, plus the segments) for DemoKit.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [clip, out, spec, width = '3200'] = process.argv.slice(2);
const ROOT = process.cwd();
if (!clip || !out || !spec) { console.error('usage: node recorder/cut.mjs <clip> <out> "<from>-<to>@<speed>,..." [width]'); process.exit(1); }
const src = path.join(ROOT, 'raw', `${clip}.mp4`);
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'raw', `${clip}.events.json`), 'utf8'));
const segs = spec.split(',').map((s) => {
  // "t~hold" freezes the frame at t for hold seconds
  if (s.includes('~')) { const [t, hold] = s.split('~').map(Number); return { from: t, to: t, speed: 1, hold }; }
  const [range, speed = '1'] = s.split('@');
  const [from, to] = range.split('-').map(Number);
  return { from, to, speed: Number(speed) };
});

let at = 0;
for (const s of segs) { s.at = at; at += s.hold ?? (s.to - s.from) / s.speed; }
const total = at;
const map = (t) => {
  for (const s of segs) if (!s.hold && t >= s.from && t <= s.to) return s.at + (t - s.from) / s.speed;
  return null;
};

const filters = segs.map((s, i) => s.hold
  ? `[0:v]trim=start=${s.from}:end=${s.from + 1 / 60},setpts=PTS-STARTPTS,fps=60,tpad=stop_mode=clone:stop_duration=${s.hold},trim=duration=${s.hold}[v${i}]`
  : `[0:v]trim=start=${s.from}:end=${s.to},setpts=(PTS-STARTPTS)/${s.speed}[v${i}]`);
const graph = `${filters.join(';')};${segs.map((_, i) => `[v${i}]`).join('')}concat=n=${segs.length}:v=1:a=0,fps=60,scale=${width}:-2:flags=lanczos,format=yuv420p[out]`;
fs.mkdirSync(path.join(ROOT, 'assets/clips'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'assets/data'), { recursive: true });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-filter_complex', graph, '-map', '[out]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '30', '-movflags', '+faststart', path.join(ROOT, 'assets/clips', `${out}.mp4`)]);

// Where the pointer was at source time t, on the same eased arc the recorder drove (dropped spans included).
function pointerAt(t) {
  let pos = null;
  for (const e of meta.events) {
    if (e.t > t) break;
    if (e.type === 'cursor') pos = { x: e.x, y: e.y };
    if (e.type === 'down' || e.type === 'up') pos = { x: e.x, y: e.y };
    if (e.type === 'move') {
      const u = Math.min(1, Math.max(0, (t - e.t) / (e.ms / 1000)));
      const k = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
      const dx = e.to.x - e.from.x; const dy = e.to.y - e.from.y; const d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(Math.PI * k) * e.bend;
      pos = { x: e.from.x + dx * k + (-dy / d) * arc, y: e.from.y + dy * k + (dx / d) * arc };
    }
  }
  return pos;
}

// A move that starts in a kept segment keeps its full length at that segment's speed.
const events = [];
for (const e of meta.events) {
  const t = map(e.t);
  if (t === null) continue;
  const seg = segs.find((s) => !s.hold && e.t >= s.from && e.t <= s.to);
  const copy = { ...e, t: +t.toFixed(3) };
  if (e.type === 'move') copy.ms = e.ms / seg.speed;
  events.push(copy);
}
// Pin the cursor where it really was at the start of every kept segment, so a skip never teleports it.
for (const s of segs) {
  const pos = pointerAt(s.from);
  if (pos) events.push({ type: 'cursor', x: +pos.x.toFixed(1), y: +pos.y.toFixed(1), t: +s.at.toFixed(3), seam: true });
}
events.sort((p, q) => p.t - q.t || (p.type === 'cursor' ? -1 : q.type === 'cursor' ? 1 : 0));
const data = { clip, out, duration: +total.toFixed(3), viewport: meta.viewport, segments: segs, events };
fs.writeFileSync(path.join(ROOT, 'assets/data', `${out}.js`),
  `window.__demo = window.__demo || {};\nwindow.__demo[${JSON.stringify(out)}] = ${JSON.stringify(data)};\n`);
// The same segments as JSON, so recorder/srctime.mjs can map source times for root-level sounds and media offsets.
fs.writeFileSync(path.join(ROOT, 'assets/data', `${out}.json`), JSON.stringify({ duration: data.duration, segments: segs }, null, 1) + '\n');
console.log(JSON.stringify({ out, duration: data.duration, marks: events.filter((e) => e.type === 'mark').map((e) => `${e.label}@${e.t}`) }));
