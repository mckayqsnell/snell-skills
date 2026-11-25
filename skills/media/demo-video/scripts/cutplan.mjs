// The cut plan for a talking demo: transcribe the takes, read them as phrases, and show the plan as one page the user
// approves before anything is cut. Run from the video workspace:
//   node recorder/cutplan.mjs transcribe [take ...] [--force]   raw/<take>.words.json for each take in raw/
//   node recorder/cutplan.mjs text                              cut/transcript.md: every take as timed phrases, with
//                                                               long pauses, fillers and "cut that" redos marked
//   node recorder/cutplan.mjs page [cut/edl.json]               cut/plan.html: each kept piece with a frame, what it
//                                                               says and any flag, plus the length
// Everything stays on this machine: transcription runs locally through HyperFrames (Parakeet or whisper).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { snap, layout, takeFile, sentenceEnd, audioQuiet } from './edl.mjs';

const ROOT = process.cwd();
const PHRASE = 0.4; const LONG = 1.5;
const FILLERS = new Set(['um', 'uh', 'umm', 'uhh', 'erm', 'er', 'hmm', 'mm']);
// what people say to mark a retake while recording
const REDO = /\b(cut that|scratch that|let me (?:do|start) that (?:again|over)|start (?:that )?over|take two)\b/i;

function hf(args, o) {
  const cli = process.env.HYPERFRAMES_CLI;
  return cli ? execFileSync(process.execPath, [cli, ...args], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 1 << 26, ...o })
    : execFileSync('npx', ['--yes', 'hyperframes', ...args], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 1 << 26, shell: process.platform === 'win32', ...o });
}
export function takes(root = ROOT) {
  const dir = path.join(root, 'raw');
  return fs.existsSync(dir) ? [...new Set(fs.readdirSync(dir).filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f) && !/\.cam\.mp4$/i.test(f)).map((f) => f.replace(/\.[^.]+$/, '')))].sort() : [];
}

// Words into phrases: a new one after every sentence end and every pause of PHRASE s or more.
export function phrases(words) {
  const out = []; let cur = null;
  words.forEach((w, i) => {
    const gap = i ? w.start - words[i - 1].end : Infinity;
    if (!cur || gap >= PHRASE || sentenceEnd(words[i - 1].text)) { if (cur) out.push(cur); cur = { start: w.start, end: w.end, words: [], gapBefore: i ? +gap.toFixed(2) : null }; }
    cur.words.push(w); cur.end = w.end;
  });
  if (cur) out.push(cur);
  return out.map((p) => {
    const text = p.words.map((w) => w.text).join(' ');
    const clean = (s) => s.toLowerCase().replace(/[^a-z' ]/g, '');
    return { start: +p.start.toFixed(2), end: +p.end.toFixed(2), gapBefore: p.gapBefore, text,
      fillers: p.words.filter((w) => FILLERS.has(clean(w.text))).length, redo: REDO.test(text) };
  });
}

function transcribe(list, force) {
  for (const t of list) {
    const out = path.join(ROOT, 'raw', `${t}.words.json`);
    if (fs.existsSync(out) && !force) { console.log(JSON.stringify({ take: t, words: 'kept (use --force to redo)' })); continue; }
    const src = takeFile(t);
    if (!src) throw new Error(`no raw/${t} video`);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-cut-'));
    try {
      // the voice only, 16 kHz mono: what both engines want, and a much smaller file
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '16000', path.join(dir, 'a.wav')]);
      const t0 = Date.now();
      hf(['transcribe', 'a.wav', '--json', '-d', '.'], { cwd: dir });
      const words = JSON.parse(fs.readFileSync(path.join(dir, 'transcript.json'), 'utf8')).map((w) => ({ text: w.text, start: w.start, end: w.end }));
      fs.writeFileSync(out, JSON.stringify(words) + '\n');
      console.log(JSON.stringify({ take: t, words: words.length, took_s: Math.round((Date.now() - t0) / 1000) }));
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

function text() {
  const md = ['# Transcript', '', 'Each line is one phrase: `[take start-end]`. Pauses of 1.5 s or more, fillers and "cut that" redos are marked. Draft cut/edl.json from this.', ''];
  for (const t of takes()) {
    const wf = path.join(ROOT, 'raw', `${t}.words.json`);
    if (!fs.existsSync(wf)) { md.push(`## ${t}`, '', '(not transcribed yet)', ''); continue; }
    md.push(`## ${t}`, '');
    for (const p of phrases(JSON.parse(fs.readFileSync(wf, 'utf8')))) {
      if (p.gapBefore >= LONG) md.push(`> pause ${p.gapBefore} s`);
      const flags = [p.fillers ? `${p.fillers} filler${p.fillers > 1 ? 's' : ''}` : null, p.redo ? 'REDO: drop this and the take it redoes' : null].filter(Boolean);
      md.push(`- \`[${t} ${p.start.toFixed(2)}-${p.end.toFixed(2)}]\` ${p.text}${flags.length ? `  **(${flags.join('; ')})**` : ''}`);
    }
    md.push('');
  }
  fs.mkdirSync(path.join(ROOT, 'cut'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'cut', 'transcript.md'), md.join('\n'));
  console.log(path.join(ROOT, 'cut', 'transcript.md'));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
function page(file) {
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, file || 'cut/edl.json'), 'utf8'));
  const words = {};
  for (const k of plan.keep) if (!(k.take in words)) { const wf = path.join(ROOT, 'raw', `${k.take}.words.json`); words[k.take] = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, 'utf8')) : null; }
  const snapped = plan.keep.map((k) => snap(k, words[k.take], words[k.take] ? audioQuiet(takeFile(k.take)) : null));
  const { segments, duration } = layout(snapped.map(({ notes, first, last, ...k }) => k));
  const thumbs = path.join(ROOT, 'cut', 'thumbs'); fs.mkdirSync(thumbs, { recursive: true });
  const rows = snapped.map((k, n) => {
    const s = segments[n]; const mid = (k.from + k.to) / 2;
    const img = `thumbs/${n + 1}.jpg`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', mid.toFixed(2), '-i', takeFile(k.take), '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', path.join(ROOT, 'cut', img)]);
    const said = (words[k.take] || []).filter((w) => w.start >= k.from && w.end <= k.to + 1e-6).map((w) => w.text).join(' ');
    const speed = (k.speed || 1) !== 1 ? `<span class="tag">${k.speed}× muted</span>` : '';
    const notes = k.notes.map((t) => `<li>${esc(t)}</li>`).join('');
    return `<li class="piece"><img src="${img}" alt="frame from piece ${n + 1}" loading="lazy"><div><p class="meta"><b>${n + 1}${k.label ? ` · ${esc(k.label)}` : ''}</b> ${speed}<br><small>${esc(k.take)} ${k.from.toFixed(2)}–${k.to.toFixed(2)} s · in the cut at ${fmt(s.at)} · ${((k.to - k.from) / (k.speed || 1)).toFixed(1)} s</small></p>${said ? `<p class="said">“${esc(said)}”</p>` : '<p class="said"><small>(no speech)</small></p>'}${notes ? `<ul class="flag">${notes}</ul>` : ''}</div></li>`;
  }).join('\n');
  const flagged = snapped.filter((k) => k.notes.length).length;
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cut plan</title>
<style>:root{--bg:#fbfaf7;--ink:#1c1c1a;--soft:#6a6963;--line:#e3e1da;--flag:#a3460f;--tag:#e9e6dc}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151513;--ink:#ecebe5;--soft:#a5a49d;--line:#2f2e2a;--flag:#f0a46b;--tag:#2b2a26}}
:root[data-theme="dark"]{--bg:#151513;--ink:#ecebe5;--soft:#a5a49d;--line:#2f2e2a;--flag:#f0a46b;--tag:#2b2a26}
*{box-sizing:border-box}body{background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,sans-serif;margin:0 auto;max-width:960px;padding:24px 16px}
h1{font-size:1.6rem;margin:0 0 4px}small,.meta small{color:var(--soft)}ol{list-style:none;padding:0;margin:24px 0}
.piece{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:16px;padding:16px 0;border-top:1px solid var(--line)}
.piece img{width:100%;height:auto;border-radius:8px;display:block}.meta{margin:0}.said{margin:8px 0 0}
.tag{background:var(--tag);border-radius:999px;padding:1px 8px;font-size:.8rem}.flag{color:var(--flag);margin:8px 0 0;padding-left:18px;font-size:.9rem}
@media (max-width:560px){.piece{grid-template-columns:minmax(0,1fr)}}</style>
<h1>Cut plan · ${esc(plan.out || 'talk')}</h1>
<p>${snapped.length} pieces, <b>${fmt(duration)}</b> long${flagged ? `, <span style="color:var(--flag)">${flagged} flagged</span>` : ''}. Read it top to bottom as the video plays. Tell the agent “looks good”, or which piece to move, trim or drop.</p>
<ol>${rows}</ol></html>\n`;
  fs.writeFileSync(path.join(ROOT, 'cut', 'plan.html'), html);
  console.log(JSON.stringify({ page: path.join(ROOT, 'cut', 'plan.html'), pieces: snapped.length, duration, flagged }));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    if (cmd === 'transcribe') transcribe(rest.filter((a) => !a.startsWith('--')).length ? rest.filter((a) => !a.startsWith('--')) : takes(), rest.includes('--force'));
    else if (cmd === 'text') text();
    else if (cmd === 'page') page(rest[0]);
    else { console.error('usage: node recorder/cutplan.mjs transcribe [take ...] | text | page [cut/edl.json]'); process.exit(1); }
  } catch (e) { console.error(`cutplan: ${e.message}`); process.exit(1); }
}
