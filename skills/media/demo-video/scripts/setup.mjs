// Makes a video workspace next to the app's repo and copies this skill's scripts into it.
//   node <skill>/scripts/setup.mjs <app-repo> [name]
//   node <skill>/scripts/setup.mjs <app-repo> [name] --print-path   only print the workspace path (make nothing)
//   A hosted app with no repo: pass the folder the workspace should sit in, plus a name (setup.mjs ~/Videos todomvc-demo-video);
//   demo-video.json then records no app folder.
// Creates ../<repo>-demo-video/ (or ../<name>/) with recorder/ (the scripts), assets/ (demo-kit.js, scene.css),
// raw/, review/ and renders/.
// Never overwrites a file that is already there, so a second run keeps your edits.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const printOnly = args.includes('--print-path');
const [repo, name] = args.filter((a) => a !== '--print-path');
if (!repo) { console.error('usage: node setup.mjs <app-repo> [workspace-name]'); process.exit(1); }
const app = path.resolve(repo);
const isRepo = fs.existsSync(path.join(app, 'package.json')) || fs.existsSync(path.join(app, '.git'));
// next to a repo; inside a plain folder for a hosted app
const ws = isRepo || !name ? path.join(path.dirname(app), name || `${path.basename(app)}-demo-video`) : path.join(app, name);
if (printOnly) { console.log(ws); process.exit(0); }
const here = path.dirname(fileURLToPath(import.meta.url));
const copy = (from, to) => {
  if (fs.existsSync(to)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};
for (const f of ['recorder.mjs', 'find-playwright.mjs', 'cut.mjs', 'sheet.mjs', 'sfx.mjs', 'sfx-packs.mjs', 'peaks.mjs', 'srctime.mjs', 'cleanup.mjs', 'scenes.example.mjs', 'voice.mjs', 'voice_mlx.py', 'edl.mjs', 'cutplan.mjs']) {
  copy(path.join(here, f), path.join(ws, 'recorder', f));
}
copy(path.join(here, 'demo-kit.js'), path.join(ws, 'assets', 'demo-kit.js'));
copy(path.join(here, 'scene.css'), path.join(ws, 'assets', 'scene.css'));
for (const d of ['raw', 'review', 'renders']) fs.mkdirSync(path.join(ws, d), { recursive: true });
// The app's folder, so find-playwright.mjs uses the app's own Playwright from the workspace too.
const cfg = path.join(ws, 'demo-video.json');
if (!fs.existsSync(cfg)) fs.writeFileSync(cfg, JSON.stringify({ app: isRepo ? app : null }, null, 1) + '\n');
const pkg = path.join(ws, 'package.json');
if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, JSON.stringify({ name: path.basename(ws), private: true, type: 'module' }, null, 2) + '\n');
console.log(ws);
