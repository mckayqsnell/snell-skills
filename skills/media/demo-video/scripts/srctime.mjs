#!/usr/bin/env node
// Map source times (in the raw take) to times in a cut, for sounds and media placed outside the story scene.
//   node recorder/srctime.mjs <cut> <t1,t2,...> [offset]
// offset: where the cut starts in the whole video (the story scene's start), added to every result.
// Re-run it after every re-cut, so impacts and chimes stay on their frames.
import fs from 'node:fs';
import path from 'node:path';

const [cut, list, offsetArg] = process.argv.slice(2);
if (!cut || !list) { console.error('usage: srctime.mjs <cut> <t1,t2,...> [offset]'); process.exit(1); }
const { segments } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'assets/data', `${cut}.json`), 'utf8'));
const offset = Number(offsetArg || 0);
function map(t) {
  for (const g of segments) {
    if (g.hold) { if (Math.abs(t - g.from) < 1e-6) return g.at; continue; }
    if (t >= g.from && t <= g.to) return g.at + (t - g.from) / g.speed;
  }
  return null;
}
const out = list.split(',').map(Number).map((t) => { const m = map(t); return { src: t, at: m === null ? null : +(m + offset).toFixed(3) }; });
for (const o of out) if (o.at === null) console.warn(`source time ${o.src} is not in the cut`);
console.log(JSON.stringify(out));
