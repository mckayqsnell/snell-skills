// Unit test: check-setup.mjs's detectOs() picks the right os/<file>.md for each machine, and every file it names exists.
//   node scripts/ci/demo-video-os.mjs
//   node scripts/ci/demo-video-os.mjs --want linux|windows|macos   also run the real check here: it must name that OS and be ready
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../skills/media/demo-video');
// check-setup.mjs loads find-playwright.mjs, which needs no Playwright until a check runs.
const { detectOs, checkSetup } = await import(pathToFileURL(path.join(skill, 'scripts/check-setup.mjs')).href);

const files = (map) => (f) => { if (f in map) return map[f]; throw new Error('ENOENT'); };
const ubuntu = 'ID=ubuntu\nID_LIKE=debian\nVERSION_ID="24.04"\nPRETTY_NAME="Ubuntu 24.04 LTS"\n';
const cases = [
  ['macOS', 'darwin', {}, {}, { os: 'macos', file: 'os/macos.md' }],
  ['Windows, Git Bash', 'win32', { MSYSTEM: 'MINGW64', PSModulePath: 'x' }, {}, { os: 'windows', file: 'os/windows.md', shell: 'git-bash' }],
  ['Windows, other shell', 'win32', { PSModulePath: 'x' }, {}, { os: 'windows', file: 'os/windows.md', shell: null }],
  ['Ubuntu', 'linux', {}, { '/etc/os-release': ubuntu, '/proc/version': 'Linux version 6.8.0 (gcc)' }, { os: 'linux', file: 'os/linux.md', pkg: 'apt', wsl: false, distro: 'ubuntu' }],
  ['WSL from /proc/version', 'linux', {}, { '/etc/os-release': ubuntu, '/proc/version': 'Linux version 5.15.167.4-microsoft-standard-WSL2' }, { os: 'linux', wsl: true }],
  ['WSL from WSL_DISTRO_NAME', 'linux', { WSL_DISTRO_NAME: 'Ubuntu' }, { '/etc/os-release': ubuntu }, { wsl: true }],
  ['Fedora', 'linux', {}, { '/etc/os-release': 'ID=fedora\nVERSION_ID=42\n' }, { pkg: 'dnf', distro: 'fedora' }],
  ['Arch', 'linux', {}, { '/etc/os-release': 'ID=arch\n' }, { pkg: 'pacman' }],
  ['Alpine', 'linux', {}, { '/etc/os-release': 'ID=alpine\n' }, { pkg: 'apk' }],
  ['no os-release', 'linux', {}, {}, { os: 'linux', pkg: null, distro: 'unknown' }],
];
let bad = 0;
for (const [name, platform, env, map, want] of cases) {
  const got = detectOs(env, platform, files(map));
  const wrong = Object.entries(want).filter(([k, v]) => got[k] !== v);
  if (!fs.existsSync(path.join(skill, got.file))) wrong.push(['file exists', got.file]);
  if (wrong.length) { bad++; console.error(`❌ ${name}: ${wrong.map(([k]) => `${k} = ${JSON.stringify(got[k])}, want ${JSON.stringify(want[k])}`).join('; ')}`); } else console.log(`✅ ${name} → ${got.file}`);
}
const want = process.argv[process.argv.indexOf('--want') + 1];
if (process.argv.includes('--want')) {
  const r = await checkSetup();
  const wrong = [];
  if (r.machine.os !== want) wrong.push(`os is ${r.machine.os}, want ${want}`);
  if (r.read !== `os/${want}.md`) wrong.push(`read is ${r.read}`);
  if (!r.ready) wrong.push(`not ready: ${r.checks.filter((c) => !c.ok && !c.fullOnly).map((c) => `${c.name} (${c.detail})`).join(', ')}`);
  if (wrong.length) { bad++; console.error(`❌ this machine: ${wrong.join('; ')}`); } else console.log(`✅ this machine: ${r.machine.label} → ${r.read}, ready`);
}
if (bad) process.exit(1);
