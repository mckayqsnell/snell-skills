// Cleans up after a demo run: node <workspace>/recorder/cleanup.mjs [--dry-run]. It works on the workspace it lives in,
// wherever you run it from, and refuses to run unless that folder has the demo-video.json setup.mjs wrote.
// - Closes the browsers this run's playwright-cli sessions opened (only sessions named in .demo-run.json).
// - Deletes scratch: raw/*.frames/, review/scratch/, sheets/, HyperFrames snapshots, .playwright-cli/, voice/takes/
//   (the voice takes that lost), and every path listed under
//   "scratch" in .demo-run.json.
// Keeps raw takes, cuts, the composition and renders: the user decides about those.
//
// .demo-run.json is the run's own list. Add to it as you go:
//   node recorder/cleanup.mjs --add-session <name>   a playwright-cli session you opened (-s=<name>)
//   node recorder/cleanup.mjs --add-scratch <path>   a one-off file or folder to delete at the end
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SAFE_SESSION = /^[\w.-]+$/;

const ROOT = fs.realpathSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
if (!fs.existsSync(path.join(ROOT, 'demo-video.json'))) {
  console.error(`refusing to clean ${ROOT}: no demo-video.json, so it isn't a demo workspace`); process.exit(1);
}
const LIST = path.join(ROOT, '.demo-run.json');
const read = () => (fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, 'utf8')) : { sessions: [], scratch: [] });
const [flag, value] = process.argv.slice(2);

if (flag === '--add-session' || flag === '--add-scratch') {
  if (!value) { console.error(`${flag} needs a value`); process.exit(1); }
  if (flag === '--add-session' && !SAFE_SESSION.test(value)) {
    console.error(`session names may use only letters, digits, ".", "_" and "-": ${JSON.stringify(value)}`); process.exit(1);
  }
  const run = read(); const key = flag === '--add-session' ? 'sessions' : 'scratch';
  if (!run[key].includes(value)) run[key].push(value);
  fs.writeFileSync(LIST, JSON.stringify(run, null, 1));
  process.exit(0);
}

const dry = flag === '--dry-run';
const run = read();
const done = [];
// Windows starts playwright-cli through its .cmd shim, which Node runs only through a shell,
// so the session name goes into a command line: only plain names are allowed.
function closeSession(s) {
  if (process.platform === 'win32') execSync(`playwright-cli -s=${s} close`, { stdio: 'ignore' });
  else execFileSync('playwright-cli', [`-s=${s}`, 'close'], { stdio: 'ignore' });
}
for (const s of run.sessions) {
  if (!SAFE_SESSION.test(s)) { done.push(`skipped session ${JSON.stringify(s)}: not a plain name`); continue; }
  // playwright-cli exits 0 for a session that is already closed, so a failure here is real (not on PATH, say).
  if (!dry) { try { closeSession(s); } catch (e) { done.push(`could not close session ${s}: ${e.code || e.message} (close it by hand)`); continue; } }
  done.push(`closed session ${s}`);
}
// HyperFrames keeps snapshot PNGs here; its check's warm-up Chrome exits on its own a few minutes later.
const scratch = [...run.scratch, 'review/scratch', 'sheets', '.hyperframes/artifacts/snapshots', '.playwright-cli', 'voice/takes', 'voice/samples/raw', 'sfx-listen'];
if (fs.existsSync(path.join(ROOT, 'raw'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'raw'))) if (f.endsWith('.frames')) scratch.push(path.join('raw', f));
}
const left = [];
for (const rel of scratch) {
  const p = path.resolve(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  // compare real paths, so a symlinked folder can't lead outside the workspace
  const real = path.join(fs.realpathSync(path.dirname(p)), path.basename(p));
  if (!real.startsWith(ROOT + path.sep)) { left.push(rel); continue; }
  if (!dry) fs.rmSync(p, { recursive: true, force: true });
  done.push(`deleted ${rel}`);
}
if (!dry) fs.rmSync(LIST, { force: true });
console.log(done.length ? done.join('\n') : 'nothing to clean');
if (left.length) console.warn(`NOT deleted, outside the workspace: delete these yourself if this run made them:\n  ${left.join('\n  ')}`);
