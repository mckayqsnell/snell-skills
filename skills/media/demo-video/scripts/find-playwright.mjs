// Finds a Playwright install without hard-coded paths, in this order:
//   1. PLAYWRIGHT_CORE (a path to a playwright-core or playwright package folder)
//   2. the app's own copy (APP_DIR, else "app" in the workspace's demo-video.json, else the current folder)
//   3. the playwright-core that ships inside the global `playwright-cli`
// Prints the folder when run directly: node find-playwright.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// Resolves a package's folder; some packages don't export package.json, so walk up from the main file.
function tryResolve(fromFile, name) {
  let main;
  try { main = createRequire(fromFile).resolve(name); } catch { return null; }
  for (let d = path.dirname(main); d !== path.dirname(d); d = path.dirname(d)) {
    const pj = path.join(d, 'package.json');
    if (fs.existsSync(pj) && JSON.parse(fs.readFileSync(pj, 'utf8')).name === name) return d;
  }
  return null;
}

function fromCli() {
  let bin;
  try { bin = execFileSync('sh', ['-c', 'command -v playwright-cli'], { encoding: 'utf8' }).trim(); } catch { return null; }
  if (!bin) return null;
  let target = fs.realpathSync(bin);
  // npm links straight to the .js file; pnpm and others write a shell shim that names it.
  if (!target.endsWith('.js')) {
    const shim = fs.readFileSync(target, 'utf8');
    const m = shim.match(/"\$basedir\/([^"]*@playwright\/cli\/[^"]*\.js)"/);
    if (!m) return null;
    target = path.resolve(path.dirname(target), m[1]);
  }
  // pnpm links the package in from its store; resolve from the real file so its own node_modules is found.
  return tryResolve(fs.realpathSync(target), 'playwright-core');
}

export function findPlaywright() {
  if (process.env.PLAYWRIGHT_CORE) return process.env.PLAYWRIGHT_CORE;
  let appDir = process.env.APP_DIR;
  for (const d of [process.cwd(), path.dirname(process.cwd())]) {
    const cfg = path.join(d, 'demo-video.json');
    if (!appDir && fs.existsSync(cfg)) appDir = JSON.parse(fs.readFileSync(cfg, 'utf8')).app;
  }
  for (const dir of [appDir, process.cwd()].filter(Boolean)) {
    const pj = path.join(path.resolve(dir), 'package.json');
    const hit = tryResolve(pj, 'playwright') || tryResolve(pj, 'playwright-core');
    if (hit) return hit;
  }
  return fromCli();
}

export async function loadPlaywright() {
  const dir = findPlaywright();
  if (!dir) {
    throw new Error('No Playwright found. Set PLAYWRIGHT_CORE, run from an app that has playwright installed, '
      + 'or install @playwright/cli globally (ask the user first).');
  }
  const mod = await import(pathToFileURL(createRequire(path.join(dir, 'package.json')).resolve(path.basename(dir) === 'playwright' ? 'playwright' : 'playwright-core')).href);
  return mod.default?.chromium ? mod.default : mod;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = findPlaywright();
  if (!dir) { console.error('not found'); process.exit(1); }
  const { version } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  console.log(`${dir} (${version})`);
}
