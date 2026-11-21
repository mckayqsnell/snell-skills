// Brightness peaks in a region of a clip, to find the real frame an animation lands on (a flash, a slam, a toast).
//   node recorder/peaks.mjs <video> <from> <len> <crop w:h:x:y>
// DOM marks often fire before the pixels change; sync sound and cuts to what the frames show.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [v, start, length, crop] = process.argv.slice(2);
if (!crop) { console.error('usage: node recorder/peaks.mjs <video> <from> <len> <crop w:h:x:y>'); process.exit(1); }
// ffmpeg writes the stats to a temp file: /dev/stdout can't be opened on Linux when Node captures the output.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'peaks-'));
const file = path.join(dir, 'yavg.txt');
let out;
try {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-ss', start, '-t', length, '-i', v, '-vf',
    `crop=${crop},scale=180:60,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=${file.replace(/[\\:']/g, '\\$&')}`, '-f', 'null', '-']);
  out = fs.readFileSync(file, 'utf8');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
const ts = [...out.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]) + Number(start));
const ys = [...out.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const base = [...ys].sort((a, b) => a - b)[Math.floor(ys.length / 4)];
let last = -9;
for (let i = 1; i < ys.length - 1; i++) {
  if (ys[i] >= ys[i - 1] && ys[i] > ys[i + 1] && ys[i] - base > 2.5 && ts[i] - last > 1.2) {
    let j = i; // onset: the first frame past half of this peak's height
    while (j > 0 && ys[j - 1] - base > (ys[i] - base) * 0.5) j--;
    console.log(`peak ${ts[i].toFixed(3)} onset ${ts[j].toFixed(3)} +${(ys[i] - base).toFixed(1)}`);
    last = ts[i];
  }
}
