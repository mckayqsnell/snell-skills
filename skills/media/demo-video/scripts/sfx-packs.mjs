// Optional sound packs from uisfx (github.com/romainsimon/uisfx): 12 packs of interface sounds, audio CC0 (free to
// use, no credit needed). HyperFrames' own sounds stay the default; this only runs when the user said yes.
// Run from the video workspace:
//   node recorder/sfx-packs.mjs list               the packs and their cues, from the latest commit (downloads no sound)
//   node recorder/sfx-packs.mjs get soft[,glass]   the latest version of those packs into assets/sfx/uisfx/<pack>/
//   node recorder/sfx-packs.mjs listen [cues]      a page to hear every pack before picking one: a few cues each
//                                                  (press,typing,success,error), about 300 KB, in sfx-listen/
// Safe by design: one fixed repo, one listing call to the GitHub API, then plain file downloads from that same commit.
// Only .mp3 files under packages/uisfx/sounds/<pack>/ with plain names, each under 512 KB and checked to be MP3.
// Nothing downloaded is ever run. A file that is already there with the same content is not downloaded again.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const REPO = 'romainsimon/uisfx';
const API = `https://api.github.com/repos/${REPO}`;
const RAW = `https://raw.githubusercontent.com/${REPO}`;
const MAX = 512 * 1024;
const FILE = /^packages\/uisfx\/sounds\/([a-z0-9-]+)\/([a-z0-9-]+)\.mp3$/;
const LICENSE = 'packages/uisfx/LICENSE-AUDIO';
// The cues sfx.mjs uses for clicks and keys, in the order it tries them.
export const CLICK = ['press', 'select', 'check'];
export const KEY = ['typing', 'focus', 'press'];

const headers = { 'User-Agent': 'demo-video-sfx-packs', Accept: 'application/vnd.github+json' };
async function get(url, asJson) {
  const res = await fetch(url, { headers, redirect: 'error' });
  if (!res.ok) throw new Error(`${url.replace(/\?.*/, '')} said ${res.status}${res.status === 403 ? ' (GitHub rate limit: try again in an hour)' : ''}`);
  return asJson ? res.json() : Buffer.from(await res.arrayBuffer());
}

// The latest commit and its sound files, grouped by pack.
export async function listing() {
  const commit = await get(`${API}/commits/main`, true);
  const tree = await get(`${API}/git/trees/${commit.sha}?recursive=1`, true);
  const lic = tree.tree.find((e) => e.type === 'blob' && e.path === LICENSE && e.size < 64 * 1024);
  return { sha: commit.sha, date: commit.commit?.committer?.date, packs: packsFrom(tree.tree), license: lic?.path };
}
export function packsFrom(entries) {
  const packs = {};
  for (const e of entries) {
    const m = e.type === 'blob' && e.path.match(FILE);
    if (!m || e.size > MAX) continue;
    (packs[m[1]] ||= []).push({ cue: m[2], path: e.path, size: e.size, sha: e.sha });
  }
  return packs;
}
// MP3: an ID3 tag or an MPEG frame sync at the start.
export const isMp3 = (b) => b.length > 3 && ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));
// Git's blob id, so an unchanged file is not downloaded again.
const blobSha = (b) => crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');

// Plain text only (no NUL bytes): the audio license, kept next to the sounds.
const isText = (b) => !b.includes(0);
async function fetchFiles(sha, files, dir) {
  let n = 0;
  for (let i = 0; i < files.length; i += 8) { // 8 at a time
    await Promise.all(files.slice(i, i + 8).map(async (f) => {
      const buf = await get(`${RAW}/${sha}/${f.path}`);
      if (buf.length > MAX || !isMp3(buf)) throw new Error(`${f.path} is not a small MP3; stopped`);
      fs.writeFileSync(path.join(dir, f.out || `${f.cue}.mp3`), buf); n++;
    }));
  }
  return n;
}

async function getPacks(names, root = process.cwd()) {
  const { sha, date, packs, license } = await listing();
  const unknown = names.filter((n) => !packs[n]);
  if (unknown.length) throw new Error(`no pack ${unknown.join(', ')}; packs: ${Object.keys(packs).join(', ')}`);
  const base = path.join(root, 'assets', 'sfx', 'uisfx');
  let fetched = 0; let kept = 0;
  for (const name of names) {
    const dir = path.join(base, name); fs.mkdirSync(dir, { recursive: true });
    const want = new Set(packs[name].map((f) => `${f.cue}.mp3`));
    const todo = packs[name].filter((f) => {
      const out = path.join(dir, `${f.cue}.mp3`);
      if (fs.existsSync(out) && blobSha(fs.readFileSync(out)) === f.sha) { kept++; return false; }
      return true;
    });
    fetched += await fetchFiles(sha, todo, dir);
    // a cue the latest version dropped goes too
    for (const old of fs.readdirSync(dir)) if (old.endsWith('.mp3') && !want.has(old)) fs.rmSync(path.join(dir, old));
  }
  if (license) {
    const lic = await get(`${RAW}/${sha}/${license}`);
    if (lic.length < 64 * 1024 && isText(lic)) fs.writeFileSync(path.join(base, 'LICENSE-AUDIO'), lic);
  }
  fs.writeFileSync(path.join(base, 'SOURCE.md'), `Sounds from https://github.com/${REPO} at commit ${sha} (${date || 'latest'}).\nAudio license: CC0 1.0 (${license ? 'LICENSE-AUDIO here, ' : ''}${LICENSE} in that repo). No credit needed.\nPacks here: ${fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory()).join(', ')}.\n`);
  return { commit: sha.slice(0, 7), packs: names, fetched, unchanged: kept, folder: path.relative(root, base) };
}

// A page to hear each pack: the same few cues from every pack, side by side.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function listen(cues, root = process.cwd()) {
  const { sha, packs } = await listing();
  const dir = path.join(root, 'sfx-listen'); fs.mkdirSync(dir, { recursive: true });
  const files = Object.entries(packs).flatMap(([pack, list]) => cues.map((c) => list.find((f) => f.cue === c)).filter(Boolean).map((f) => ({ ...f, pack, out: `${pack}-${f.cue}.mp3` })));
  const fetched = await fetchFiles(sha, files.filter((f) => !fs.existsSync(path.join(dir, f.out))), dir);
  const rows = Object.keys(packs).map((pack) => `<li><b>${esc(pack)}</b><div class="cues">${cues.map((c) => files.some((f) => f.out === `${pack}-${c}.mp3`)
    ? `<label>${esc(c)}<audio controls preload="none" src="${esc(`${pack}-${c}.mp3`)}"></audio></label>` : '').join('')}</div></li>`).join('\n');
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sound packs</title>
<style>:root{color-scheme:light dark;--bg:#fafaf7;--ink:#1d1d1b;--soft:#6b6b66;--line:#e3e1da}@media(prefers-color-scheme:dark){:root{--bg:#161614;--ink:#ecebe6;--soft:#a3a29c;--line:#2f2e2a}}
body{background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif;margin:0 auto;max-width:960px;padding:24px 16px}
ul{list-style:none;padding:0}li{padding:12px 0;border-bottom:1px solid var(--line)}.cues{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-top:6px}
label{display:grid;gap:2px;color:var(--soft);font-size:.9rem}audio{width:100%}</style>
<h1>Sound packs</h1><p>The same sounds from each of the ${Object.keys(packs).length} uisfx packs (CC0). HyperFrames' own sounds are the default; tell the agent a pack name to use one instead.</p><ul>${rows}</ul>`);
  return { page: path.join(dir, 'index.html'), packs: Object.keys(packs).length, fetched };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'list') {
      const { sha, packs } = await listing();
      console.log(JSON.stringify({ commit: sha.slice(0, 7), packs: Object.fromEntries(Object.entries(packs).map(([k, v]) => [k, v.length])), cues: [...new Set(Object.values(packs).flat().map((f) => f.cue))].sort() }, null, 1));
    } else if (cmd === 'get' && arg) {
      console.log(JSON.stringify(await getPacks(arg.split(',').map((s) => s.trim()).filter(Boolean))));
    } else if (cmd === 'listen') {
      console.log(JSON.stringify(await listen((arg || 'press,typing,success,error').split(',').map((s) => s.trim()).filter(Boolean))));
    } else { console.error('usage: node recorder/sfx-packs.mjs list | get <pack>[,<pack>] | listen [cues]'); process.exit(1); }
  } catch (e) { console.error(`sfx-packs: ${e.message}`); process.exit(1); }
}
