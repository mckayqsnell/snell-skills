// Cleans up after a demo run. Run from the video workspace: node recorder/cleanup.mjs [--dry-run]
// - Closes the browsers this run's playwright-cli sessions opened (only sessions named in .demo-run.json).
// - Deletes scratch: raw/*.frames/, review/scratch/, sheets/, HyperFrames snapshots, and every path listed under
//   "scratch" in .demo-run.json.
// Keeps raw takes, cuts, the composition and renders: the user decides about those.
//
// .demo-run.json is the run's own list. Add to it as you go:
//   node recorder/cleanup.mjs --add-session <name>   a playwright-cli session you opened (-s=<name>)
//   node recorder/cleanup.mjs --add-scratch <path>   a one-off file or folder to delete at the end
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const LIST = path.join(ROOT, '.demo-run.json');
const read = () => (fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, 'utf8')) : { sessions: [], scratch: [] });
const [flag, value] = process.argv.slice(2);

if (flag === '--add-session' || flag === '--add-scratch') {
  const run = read(); const key = flag === '--add-session' ? 'sessions' : 'scratch';
  if (!run[key].includes(value)) run[key].push(value);
  fs.writeFileSync(LIST, JSON.stringify(run, null, 1));
  process.exit(0);
}

const dry = flag === '--dry-run';
const run = read();
const done = [];
for (const s of run.sessions) {
  if (!dry) { try { execFileSync('playwright-cli', [`-s=${s}`, 'close'], { stdio: 'ignore' }); } catch { /* already closed */ } }
  done.push(`closed session ${s}`);
}
// HyperFrames keeps snapshot PNGs here; its check's warm-up Chrome exits on its own a few minutes later.
const scratch = [...run.scratch, 'review/scratch', 'sheets', '.hyperframes/artifacts/snapshots'];
if (fs.existsSync(path.join(ROOT, 'raw'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'raw'))) if (f.endsWith('.frames')) scratch.push(path.join('raw', f));
}
for (const rel of scratch) {
  const p = path.resolve(ROOT, rel);
  if (!p.startsWith(ROOT + path.sep)) { done.push(`skipped ${rel}: outside the workspace`); continue; }
  if (!fs.existsSync(p)) continue;
  if (!dry) fs.rmSync(p, { recursive: true, force: true });
  done.push(`deleted ${rel}`);
}
if (!dry) fs.rmSync(LIST, { force: true });
console.log(done.length ? done.join('\n') : 'nothing to clean');
