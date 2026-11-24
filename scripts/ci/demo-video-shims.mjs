// CI check: find-playwright.mjs reads each kind of playwright-cli shim, run on the OS under test
// (on Windows, path.resolve gives drive letters and backslashes).
//   node scripts/ci/demo-video-shims.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { shimTarget } = await import(pathToFileURL(path.join(here, '../../skills/media/demo-video/scripts/find-playwright.mjs')).href);

const root = path.resolve('shim-root');
const cli = ['@playwright', 'cli', 'cli.js'];
const cases = [
  ['sh shim (pnpm, macOS/Linux)', path.join(root, 'bin', 'playwright-cli'),
    'exec node  "$basedir/../node_modules/@playwright/cli/cli.js" "$@"', path.join(root, 'node_modules', ...cli)],
  ['npm install -g .cmd shim', path.join(root, 'playwright-cli.cmd'),
    '@ECHO off\r\nSET dp0=%~dp0\r\nIF EXIST "%dp0%\\node.exe" (\r\n  SET "_prog=%dp0%\\node.exe"\r\n)\r\n"%_prog%"  "%dp0%\\node_modules\\@playwright\\cli\\cli.js" %*\r\n',
    path.join(root, 'node_modules', ...cli)],
  ['pnpm .cmd shim', path.join(root, 'node_modules', '.bin', 'playwright-cli.cmd'),
    '@SETLOCAL\r\n@IF NOT DEFINED NODE_PATH (\r\n  @SET "NODE_PATH=%~dp0\\..\\.pnpm\\node_modules"\r\n)\r\n@IF EXIST "%~dp0\\node.exe" (\r\n  "%~dp0\\node.exe"  "%~dp0\\..\\@playwright\\cli\\cli.js" %*\r\n) ELSE (\r\n  node  "%~dp0\\..\\@playwright\\cli\\cli.js" %*\r\n)\r\n',
    path.join(root, 'node_modules', ...cli)],
  ['not a playwright-cli shim', path.join(root, 'other.cmd'), '@ECHO off\r\nnode "%~dp0\\other.js" %*\r\n', null],
];
let bad = 0;
for (const [name, shim, text, want] of cases) {
  const got = shimTarget(shim, text);
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? '✅' : '❌'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`);
}
process.exit(bad ? 1 : 0);
