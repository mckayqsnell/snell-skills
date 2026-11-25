// Says which OS this is, which os/<file>.md to read, and whether ffmpeg, Playwright and a browser work here.
//   node <skill>/scripts/check-setup.mjs           run from the app's folder (it finds the app's own Playwright)
//   node <skill>/scripts/check-setup.mjs --json    the same as JSON
// It starts a real headless browser for a second, so "browser ok" means a take can launch. It installs nothing:
// each missing piece comes with the command that fixes it on this OS.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findPlaywright, loadPlaywright } from './find-playwright.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const run = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }); } catch { return null; }
};

// --- Which machine ---
export function detectOs(env = process.env, platform = process.platform, read = (f) => fs.readFileSync(f, 'utf8')) {
  const tryRead = (f) => { try { return read(f); } catch { return ''; } };
  const info = { platform, arch: os.arch() };
  if (platform === 'darwin') return { ...info, os: 'macos', file: 'os/macos.md', label: `macOS ${run('sw_vers', ['-productVersion'])?.trim() || os.release()}` };
  if (platform === 'win32') {
    // Git Bash sets MSYSTEM. Nothing reliably marks PowerShell (PSModulePath is set everywhere), so only Git Bash is named.
    const shell = env.MSYSTEM ? 'git-bash' : null;
    return { ...info, os: 'windows', file: 'os/windows.md', shell, label: `Windows ${os.release()}${shell ? ' (Git Bash)' : ''}` };
  }
  const rel = Object.fromEntries(tryRead('/etc/os-release').split('\n').map((l) => l.match(/^(\w+)="?([^"]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
  const wsl = Boolean(env.WSL_DISTRO_NAME) || /microsoft/i.test(tryRead('/proc/version'));
  const container = fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv') || /docker|containerd|kubepods/.test(tryRead('/proc/1/cgroup'));
  const like = `${rel.ID || ''} ${rel.ID_LIKE || ''}`;
  const pkg = /debian|ubuntu/.test(like) ? 'apt' : /fedora|rhel|centos/.test(like) ? 'dnf' : /arch/.test(like) ? 'pacman' : /suse/.test(like) ? 'zypper' : /alpine/.test(like) ? 'apk' : null;
  const where = [wsl && 'WSL', container && 'container'].filter(Boolean).join(', ');
  return { ...info, os: 'linux', file: 'os/linux.md', distro: rel.ID || 'unknown', version: rel.VERSION_ID || '', pkg, wsl, container,
    root: process.getuid?.() === 0, label: `Linux ${rel.PRETTY_NAME || rel.ID || ''} ${os.arch()}${where ? ` (${where})` : ''}`.trim() };
}

// The install line for one piece on this OS.
function fixFor(what, m, pwDir) {
  const sudo = m.root ? '' : 'sudo ';
  if (what === 'ffmpeg') {
    if (m.os === 'macos') return 'brew install ffmpeg';
    if (m.os === 'windows') return 'winget install Gyan.FFmpeg   (then open a new terminal so PATH updates)';
    return { apt: `${sudo}apt-get install -y ffmpeg`, dnf: `${sudo}dnf swap -y ffmpeg-free ffmpeg --allowerasing   (after enabling RPM Fusion free: Fedora's own ffmpeg-free has no libx264)`, pacman: `${sudo}pacman -S ffmpeg`, zypper: `${sudo}zypper install ffmpeg`, apk: `${sudo}apk add ffmpeg` }[m.pkg] || 'install ffmpeg with the system package manager';
  }
  if (what === 'playwright') return 'npm install -g @playwright/cli';
  if (what === 'browser') return 'playwright-cli install-browser chromium';
  if (what === 'browser-deps') {
    // Run Playwright's own CLI as root for the libraries only, so the browser stays in the user's cache.
    const cli = pwDir && path.join(pwDir, 'cli.js');
    return cli && fs.existsSync(cli) ? `${sudo}"${process.execPath}" "${cli}" install-deps chromium` : `${sudo}npx playwright install-deps chromium`;
  }
  return null;
}

async function checkBrowser() {
  let pw;
  try { pw = await loadPlaywright(); } catch { return { ok: false, reason: 'no-playwright' }; }
  const tries = [{ channel: 'chrome' }, ...(process.platform === 'win32' ? [{ channel: 'msedge' }] : []), {}];
  let last;
  for (const opts of tries) {
    try {
      const b = await pw.chromium.launch({ ...opts, headless: true });
      const version = b.version();
      await b.close();
      return { ok: true, browser: opts.channel || 'chromium', version, chromiumPath: opts.channel ? null : pw.chromium.executablePath() };
    } catch (e) { last = String(e.message || e); }
  }
  const reason = /error while loading shared libraries|missing dependencies|Host system is missing/i.test(last) ? 'missing-libs'
    : /Executable doesn't exist|install-browser|playwright install/i.test(last) ? 'not-installed' : 'other';
  const lib = last.match(/(lib[\w.+-]+\.so[\d.]*)/);
  return { ok: false, reason, detail: lib ? lib[1] : last.split('\n')[0].slice(0, 200) };
}

export async function checkSetup() {
  const m = detectOs();
  const checks = [];
  // Playwright ships no browsers for musl (Alpine), so nothing below can work there.
  if (m.os === 'linux' && m.pkg === 'apk') checks.push({ name: 'linux-libc', ok: false, detail: 'Alpine (musl): Playwright has no browsers for it', fix: 'use a Debian or Ubuntu machine or image' });
  const ff = run('ffmpeg', ['-hide_banner', '-version']);
  const fp = run('ffprobe', ['-hide_banner', '-version']);
  // The recorder and cut.mjs encode with libx264; some builds (Fedora's ffmpeg-free) leave it out.
  const x264 = ff && /libx264/.test(run('ffmpeg', ['-hide_banner', '-encoders']) || '');
  const ffDetail = !ff ? 'not on PATH' : !fp ? 'ffprobe not on PATH' : !x264 ? `${ff.split('\n')[0]}, but no libx264 encoder` : ff.split('\n')[0];
  checks.push({ name: 'ffmpeg', ok: Boolean(ff && fp && x264), detail: ffDetail, fix: ff && fp && x264 ? null : fixFor('ffmpeg', m) });
  const pwDir = findPlaywright();
  let pwVersion = null;
  if (pwDir) { try { pwVersion = JSON.parse(fs.readFileSync(path.join(pwDir, 'package.json'), 'utf8')).version; } catch { /* unreadable */ } }
  checks.push({ name: 'playwright', ok: Boolean(pwVersion), detail: pwVersion ? `${pwVersion} at ${pwDir}` : 'not found', fix: pwVersion ? null : fixFor('playwright', m) });
  const quickOk = pwVersion && Number(pwVersion.split('.')[0]) * 1000 + Number(pwVersion.split('.')[1]) >= 1064;
  if (pwVersion) {
    const b = await checkBrowser();
    const fix = b.ok ? null : b.reason === 'missing-libs' ? fixFor('browser-deps', m, pwDir) : fixFor('browser', m);
    checks.push({ name: 'browser', ok: b.ok, detail: b.ok ? `${b.browser} ${b.version}` : `${b.reason}: ${b.detail}`, fix, chromiumPath: b.chromiumPath });
    // HyperFrames downloads its own Chrome, but Google ships none for Linux on ARM: point it at Playwright's.
    if (b.ok && m.os === 'linux' && m.arch === 'arm64') {
      const set = process.env.HYPERFRAMES_BROWSER_PATH;
      const ok = Boolean(set && fs.existsSync(set));
      // Only Full mode (HyperFrames) needs it, so it never blocks "ready".
      checks.push({ name: 'hyperframes-browser', fullOnly: true, ok, detail: set ? `${set}${ok ? '' : ' (no such file)'}` : 'not set (no Chrome download for Linux on ARM)', fix: ok ? null : `export HYPERFRAMES_BROWSER_PATH="${b.chromiumPath}"` });
    }
  }
  return { machine: m, read: m.file, quickMode: Boolean(quickOk), ready: checks.every((c) => c.ok || c.fullOnly),
    fullModeReady: checks.every((c) => c.ok), checks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const r = await checkSetup();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 1)); } else {
    console.log(`os: ${r.machine.os} — ${r.machine.label}`);
    console.log(`read: ${path.join(path.dirname(here), r.read)}`);
    for (const c of r.checks) console.log(`${c.ok ? 'ok  ' : c.fullOnly ? 'FULL MODE NEEDS' : 'MISSING'} ${c.name}: ${c.detail}${c.fix ? `\n        fix: ${c.fix}` : ''}`);
    console.log(r.ready ? `ready: yes${r.fullModeReady ? '' : ' (Full mode also needs the line above)'}` : 'ready: no (ask the user before installing anything)');
  }
}
