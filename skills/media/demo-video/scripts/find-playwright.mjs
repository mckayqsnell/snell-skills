// Finds a Playwright install without hard-coded paths, in this order:
//   1. PLAYWRIGHT_CORE (a path to a playwright-core or playwright package folder)
//   2. the app's own copy (APP_DIR, else "app" in the workspace's demo-video.json, else the current folder)
//   3. the playwright-core that ships inside the global `playwright-cli`
// Prints the folder when run directly: node find-playwright.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
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

const WIN = process.platform === 'win32';

// Where the playwright-cli command lives: `where` on Windows (no `sh` there), `command -v` elsewhere.
function cliBin() {
  let out;
  try {
    out = WIN
      ? execFileSync('where', ['playwright-cli'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      : execFileSync('sh', ['-c', 'command -v playwright-cli'], { encoding: 'utf8' });
  } catch { return null; }
  const lines = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Windows lists the extensionless sh shim and the .cmd shim; the .cmd one is the one Windows runs.
  return (WIN && lines.find((l) => /\.cmd$/i.test(l))) || lines[0] || null;
}

// The .js file a shim starts. npm on macOS/Linux links straight to it; pnpm writes a sh shim ("$basedir/…");
// npm and pnpm on Windows write a .cmd shim ("%dp0%\…" or "%~dp0\…").
export function shimTarget(shimPath, text) {
  const m = text.match(/"\$basedir\/([^"]*@playwright\/cli\/[^"]*\.js)"/)
    || text.match(/"%~?dp0%?\\?([^"]*@playwright[\\/]cli[\\/][^"]*\.js)"/i);
  return m ? path.resolve(path.dirname(shimPath), m[1].split(/[\\/]/).join(path.sep)) : null;
}

// Last resort: the global npm folder. execSync goes through the shell, which Windows needs for npm.cmd.
function fromNpmRoot() {
  let root;
  try { root = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
  const pj = path.join(root, '@playwright', 'cli', 'package.json');
  return fs.existsSync(pj) ? tryResolve(pj, 'playwright-core') : null;
}

function fromCli() {
  try {
    const bin = cliBin();
    let target = bin && fs.realpathSync(bin);
    if (target && !target.endsWith('.js')) target = shimTarget(target, fs.readFileSync(target, 'utf8'));
    // pnpm links the package in from its store; resolve from the real file so its own node_modules is found.
    const hit = target && fs.existsSync(target) && tryResolve(fs.realpathSync(target), 'playwright-core');
    if (hit) return hit;
  } catch { /* fall through to npm's global folder */ }
  return fromNpmRoot();
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

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const dir = findPlaywright();
  if (!dir) { console.error('not found'); process.exit(1); }
  const { version } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  console.log(`${dir} (${version})`);
}
