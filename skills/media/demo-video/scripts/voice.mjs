// Voiceover for a demo video: pick a voice, make every line, check each line fits its beat, and lay out the track.
// Run from the video workspace. references/voice.md says when to run each command.
//   node recorder/voice.mjs check                       which voices this machine can use (never prints a key)
//   node recorder/voice.mjs samples <provider> [voice,voice,...] [--text "..."]
//                                                       one sample line per voice, plus voice/samples.html to listen
//   node recorder/voice.mjs make [--takes 2] [--only id,id]
//                                                       every line in voice/script.json, best of N takes, trimmed and
//                                                       levelled: assets/voice/<id>.wav and <id>.words.json
//   node recorder/voice.mjs place <track> [--duration s]
//                                                       puts each line of that track at its time, checks the fit, and
//                                                       writes assets/audio/<track>-voice.wav and voice/<track>-fit.json
// Providers: kokoro (HyperFrames' own, small, any OS), ming and fish (mlx-audio, Apple Silicon only), elevenlabs (paid,
// opt-in, needs ELEVENLABS_API_KEY). A recording of the user's own voice ("me") only ever goes to a local model.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));
const HOME = os.homedir();

export const MODELS = {
  ming: { id: 'mlx-community/Ming-3.0-tts-0.5B-bf16', gb: 6, ram: 5, license: 'MIT' },
  fish: { id: 'mlx-community/fish-audio-drama-3-4bit', gb: 22, ram: 28, license: 'Fish Audio Community License: free for business use only under $500k a year in revenue; above that it needs a paid license from Fish Audio' },
};
export const VOICES = {
  kokoro: ['af_heart', 'af_nova', 'af_sky', 'am_adam', 'am_michael', 'bf_emma', 'bf_isabella', 'bm_george'],
  ming: ['US_Emma', 'US_James', 'US_Stella', 'UK_George', 'UK_Charlotte'],
  fish: ['ming:US_Emma', 'ming:US_James', 'ming:UK_George', 'ming:UK_Charlotte', 'me'],
};
// The line a preset reads once, so Fish can copy that voice (Fish has no presets of its own).
const REF_TEXT = "Hi, thanks for joining. In the next minute I'll walk you through a small tool that saves a lot of clicking, and I think you're going to like it.";
const SAMPLE_TEXT = 'Here is the whole report, built in one click. Every row checked, and nothing left to fix by hand.';

const opt = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const run = (cmd, args, o = {}) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26, ...o });
const tryRun = (cmd, args, o) => { try { return run(cmd, args, o); } catch { return null; } };
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// --- Where things live ---
export function pythonPath(env = process.env) {
  if (env.DEMO_VOICE_PYTHON) return env.DEMO_VOICE_PYTHON;
  const p = path.join(HOME, '.cache', 'snell-skills', 'mlx-audio', '.venv', 'bin', 'python');
  return fs.existsSync(p) ? p : null;
}
function hfCache(env = process.env) {
  if (env.HF_HUB_CACHE) return env.HF_HUB_CACHE;
  return path.join(env.HF_HOME || path.join(HOME, '.cache', 'huggingface'), 'hub');
}
// a model counts as downloaded when its snapshot or its blobs are there (a shared store can keep only the blobs)
const cached = (id) => ['snapshots', 'blobs'].some((d) => { try { return fs.readdirSync(path.join(hfCache(), `models--${id.replace('/', '--')}`, d)).length > 0; } catch { return false; } });
// HyperFrames CLI: HYPERFRAMES_CLI is the plugin's scripts/plugin-cli.mjs (what the hyperframes skill runs), else npx.
function hf(args, o) {
  const cli = process.env.HYPERFRAMES_CLI;
  return cli ? run(process.execPath, [cli, ...args], o) : run('npx', ['--yes', 'hyperframes', ...args], { shell: process.platform === 'win32', ...o });
}

// The ElevenLabs key: the environment first, then ~/.config/snell-skills/local.env. Never printed, logged or copied.
export function elevenKey(env = process.env, file = path.join(HOME, '.config', 'snell-skills', 'local.env')) {
  if (env.ELEVENLABS_API_KEY) return env.ELEVENLABS_API_KEY.trim();
  try {
    const m = fs.readFileSync(file, 'utf8').match(/^\s*ELEVENLABS_API_KEY\s*=\s*["']?([^"'\s#]+)/m);
    return m ? m[1] : null;
  } catch { return null; }
}

// --- Words ---
// Whisper writes "4" for "four" and "into" for "in to": both sides are spelled the same way before comparing.
const NUM = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
const SPLIT = { into: ['in', 'to'], onto: ['on', 'to'], cannot: ['can', 'not'] };
const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean)
  .flatMap((w) => SPLIT[w] || [/^\d+$/.test(w) && Number(w) <= 20 ? NUM[Number(w)] : w]);
const heardText = (words) => words.map((w) => w.text).join(' ');
// How much of the script the take really says: 1 is every word in order.
export function similarity(want, got) {
  const a = norm(want); const b = norm(got);
  if (!a.length) return b.length ? 0 : 1;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  }
  return (2 * dp[a.length][b.length]) / (a.length + b.length);
}
// Best take: says the words, then fits the beat, then the shorter.
export function pickTake(takes, line) {
  const score = (t) => t.sim * 10 - (line.max ? Math.max(0, t.seconds - line.max) * 2 : 0) - t.seconds * 0.01;
  return [...takes].sort((p, q) => score(q) - score(p))[0];
}

// --- Audio ---
const probeSeconds = (f) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());
// Integrated loudness in LUFS. ffmpeg prints its meter on stderr.
function lufsOf(f) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const m = [...`${r.stderr || ''}`.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m ? Number(m[1]) : null;
}
// Trim the silence at both ends (keep 40 ms), mono 48 kHz, levelled to -18 LUFS so lines match.
function finish(src, out) {
  const tmp = `${out}.tmp.wav`;
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse';
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-af', trim, '-ac', '1', '-ar', '48000', tmp]);
  const lufs = lufsOf(tmp);
  const gain = lufs === null || !Number.isFinite(lufs) ? 0 : Math.max(-20, Math.min(20, -18 - lufs));
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:level=disabled`, '-ar', '48000', out]);
  fs.rmSync(tmp, { force: true });
  return probeSeconds(out);
}
function transcribe(wav) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-words-'));
  try {
    fs.copyFileSync(wav, path.join(dir, 'a.wav'));
    hf(['transcribe', 'a.wav', '--json', '-d', '.'], { cwd: dir });
    const words = readJson(path.join(dir, 'transcript.json'));
    return words.map((w) => ({ text: w.text, start: w.start, end: w.end }));
  } catch (e) {
    throw new Error(`transcribe failed (${String(e.stderr || e.message).split('\n').slice(-3).join(' ')}); check HyperFrames' transcribe works`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// --- Providers: each makes raw wavs for [{name, text, seed}] into dir ---
function refFor(voice, dir) {
  if (voice === 'me') {
    const wav = path.join(ROOT, 'voice', 'me.wav'); const txt = path.join(ROOT, 'voice', 'me.txt');
    if (!fs.existsSync(wav) || !fs.existsSync(txt)) throw new Error('voice "me" needs voice/me.wav and voice/me.txt (what the recording says); references/voice.md "Your own voice"');
    return { ref_audio: wav, ref_text: fs.readFileSync(txt, 'utf8').trim() };
  }
  if (voice.startsWith('ming:')) {
    const preset = voice.slice(5);
    const wav = path.join(ROOT, 'voice', 'refs', `ming-${preset}.wav`);
    if (!fs.existsSync(wav)) {
      fs.mkdirSync(path.dirname(wav), { recursive: true });
      mlx('ming', [{ name: `ming-${preset}`, text: REF_TEXT, voice: preset, seed: 1 }], path.dirname(wav));
    }
    return { ref_audio: wav, ref_text: REF_TEXT };
  }
  if (voice.endsWith('.wav')) {
    const txt = voice.replace(/\.wav$/, '.txt');
    if (!fs.existsSync(voice) || !fs.existsSync(txt)) throw new Error(`${voice} needs a ${path.basename(txt)} next to it with what it says`);
    return { ref_audio: path.resolve(voice), ref_text: fs.readFileSync(txt, 'utf8').trim() };
  }
  return null;
}
const KEY_HINT = 'no ElevenLabs key: set ELEVENLABS_API_KEY, or put ELEVENLABS_API_KEY=... in ~/.config/snell-skills/local.env';
function mlx(provider, jobs, dir) {
  if (process.platform !== 'darwin' || process.arch !== 'arm64') throw new Error(`${provider} runs on Apple Silicon Macs only; use kokoro or elevenlabs here`);
  const py = pythonPath();
  if (!py) throw new Error('mlx-audio is not set up: run `node recorder/voice.mjs check` for the setup commands (ask the user first)');
  const jf = path.join(dir, `jobs-${Date.now()}.json`);
  fs.writeFileSync(jf, JSON.stringify(jobs));
  const r = spawnSync(py, [path.join(here, 'voice_mlx.py'), MODELS[provider].id, jf, dir], { encoding: 'utf8', maxBuffer: 1 << 26, env: { ...process.env, HF_HUB_DISABLE_TELEMETRY: '1' } });
  fs.rmSync(jf, { force: true });
  if (r.status !== 0) throw new Error(`${provider} failed: ${(r.stderr || '').trim().split('\n').slice(-4).join(' | ')}`);
  return r.stdout.trim().split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
}
async function generate(cfg, jobs, dir) {
  const p = cfg.provider;
  if (p === 'kokoro') {
    // HyperFrames' own Kokoro; it needs kokoro-onnx, which the voice venv has (HYPERFRAMES_PYTHON points it there)
    const py = pythonPath(); const env = py && !process.env.HYPERFRAMES_PYTHON ? { env: { ...process.env, HYPERFRAMES_PYTHON: py } } : {};
    for (const j of jobs) hf(['tts', j.text, '--voice', j.voice || cfg.voice || 'af_heart', '--speed', String(cfg.speed || 1), '--output', path.join(dir, `${j.name}.wav`)], env);
    return {};
  }
  if (p === 'ming' || p === 'fish') {
    const style = p === 'fish' && cfg.style ? `[${cfg.style}] ` : '';
    // one model load for every job; a job's own voice (samples) wins over the script's
    const rows = mlx(p, jobs.map((j) => {
      const v = j.voice || cfg.voice || '';
      const ref = refFor(v, dir);
      const base = ref || (p === 'ming' ? (cfg.instruct && !j.voice ? { instruct: cfg.instruct, use_zero_spk_emb: true } : { voice: v || 'US_Emma' }) : {});
      if (p === 'fish' && !ref && !style) throw new Error('fish needs a voice to copy ("ming:US_Emma", "me" or a .wav) or a style');
      return { ...base, name: j.name, text: style + j.text, seed: j.seed, ...(cfg.speed && p === 'ming' ? { speed: cfg.speed } : {}) };
    }), dir);
    return { per_line: rows.map((r) => ({ name: r.name, seconds: r.seconds, took: r.took })), peak_gb: Math.max(0, ...rows.map((r) => r.peak_gb || 0)) };
  }
  if (p === 'elevenlabs') {
    const vs = [...new Set(jobs.map((j) => j.voice || cfg.voice))];
    if (vs.some((v) => v === 'me' || /\.wav$/.test(v || ''))) throw new Error('a recording of a voice never goes to ElevenLabs from this script: clone it in the ElevenLabs app yourself and use that voice id');
    const key = elevenKey();
    if (!key) throw new Error(KEY_HINT);
    if (vs.some((v) => !v)) throw new Error('elevenlabs needs a voice id ("voice" in voice/script.json); `samples elevenlabs` lists your voices');
    for (const j of jobs) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(j.voice || cfg.voice)}/with-timestamps?output_format=mp3_44100_128`, {
        method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: j.text, model_id: cfg.model || 'eleven_v4', ...(j.seed ? { seed: j.seed } : {}), ...(j.previous_text ? { previous_text: j.previous_text } : {}), ...(j.next_text ? { next_text: j.next_text } : {}) }),
      });
      if (!res.ok) throw new Error(`ElevenLabs said ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = await res.json();
      const mp3 = path.join(dir, `${j.name}.mp3`);
      fs.writeFileSync(mp3, Buffer.from(body.audio_base64, 'base64'));
      run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp3, path.join(dir, `${j.name}.wav`)]);
      fs.rmSync(mp3);
    }
    return {};
  }
  throw new Error(`unknown provider "${p}": kokoro, ming, fish or elevenlabs`);
}

// --- Commands ---
async function check() {
  const ramGb = Math.round(os.totalmem() / 2 ** 30);
  const mac = process.platform === 'darwin' && process.arch === 'arm64';
  const py = pythonPath();
  const mlxOk = Boolean(py && tryRun(py, ['-c', 'import mlx_audio, soundfile']) !== null);
  const kpy = process.env.HYPERFRAMES_PYTHON || py;
  const kokoroOk = Boolean(kpy && tryRun(kpy, ['-c', 'import kokoro_onnx, soundfile']) !== null);
  const out = {
    machine: `${process.platform} ${process.arch}, ${ramGb} GB`,
    kokoro: { ok: kokoroOk, license: 'Apache-2.0', note: 'HyperFrames tts; about 330 MB on first use; needs kokoro-onnx and soundfile in the voice venv or HYPERFRAMES_PYTHON' },
    ming: { ok: mac && mlxOk, cached: cached(MODELS.ming.id), download_gb: MODELS.ming.gb, ram_gb: MODELS.ming.ram, license: MODELS.ming.license },
    fish: { ok: mac && mlxOk && ramGb >= 32, cached: cached(MODELS.fish.id), download_gb: MODELS.fish.gb, ram_gb: MODELS.fish.ram, license: MODELS.fish.license },
    elevenlabs: { ok: Boolean(elevenKey()), note: 'the key is never shown, only whether there is one' },
  };
  if (!mac) { out.ming.why = 'needs an Apple Silicon Mac'; out.fish.why = 'needs an Apple Silicon Mac'; }
  else if (!mlxOk) {
    const venv = path.join('~', '.cache', 'snell-skills', 'mlx-audio', '.venv');
    out.setup = [`uv venv --python 3.12 ${venv}`, `uv pip install --python ${venv}/bin/python mlx-audio==0.6.8 soundfile kokoro-onnx`];
    out.setup_note = 'Ask the user first. About 1 GB of Python packages; each model downloads on first use (sizes above). An existing mlx-audio venv works too: set DEMO_VOICE_PYTHON to its python.';
  }
  if (!out.elevenlabs.ok) out.elevenlabs.why = 'no key: set ELEVENLABS_API_KEY, or put it in ~/.config/snell-skills/local.env';
  if (mac && ramGb < 32) out.fish.why = `needs 32 GB of memory; this Mac has ${ramGb}`;
  // the pick first: Ming on a Mac (after setup), else Kokoro
  out.offer = [mac ? 'ming' : null, 'kokoro', mac && ramGb >= 32 ? 'fish' : null, out.elevenlabs.ok ? 'elevenlabs' : null].filter(Boolean);
  console.log(JSON.stringify(out, null, 1));
}

async function samples(provider, list, text) {
  if (provider === 'elevenlabs' && !list) {
    const key = elevenKey();
    if (!key) throw new Error(KEY_HINT);
    const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
    if (!res.ok) throw new Error(`ElevenLabs said ${res.status}`);
    const { voices } = await res.json();
    console.log(JSON.stringify(voices.map((v) => ({ voice_id: v.voice_id, name: v.name, labels: v.labels })), null, 1));
    console.log('Pick a few ids and run: samples elevenlabs <id,id,...>  (each sample uses about 100 characters of the plan)');
    return;
  }
  const voices = (list ? list.split(',') : VOICES[provider]) || [];
  const dir = path.join(ROOT, 'voice', 'samples'); fs.mkdirSync(dir, { recursive: true });
  const made = [];
  const raw = path.join(dir, 'raw'); fs.mkdirSync(raw, { recursive: true });
  const jobs = voices.map((v) => ({ name: `${provider}-${v.replace(/[^A-Za-z0-9_-]+/g, '_')}`, voice: v, text, seed: 1 }));
  await generate({ provider }, jobs, raw); // one model load for all of them
  for (const j of jobs) {
    const sec = finish(path.join(raw, `${j.name}.wav`), path.join(dir, `${j.name}.wav`));
    made.push({ provider, voice: j.voice, file: `samples/${j.name}.wav`, seconds: +sec.toFixed(2) });
    console.log(JSON.stringify(made.at(-1)));
  }
  fs.rmSync(path.join(dir, 'raw'), { recursive: true, force: true });
  const index = path.join(ROOT, 'voice', 'samples.json');
  const all = [...(fs.existsSync(index) ? readJson(index) : []).filter((s) => !made.some((m) => m.file === s.file)), ...made];
  fs.writeFileSync(index, JSON.stringify(all, null, 1) + '\n');
  fs.writeFileSync(path.join(ROOT, 'voice', 'samples.html'), samplesPage(all, text));
  console.log(`listen: ${path.join(ROOT, 'voice', 'samples.html')}`);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function samplesPage(all, text) {
  const rows = all.map((s) => `<li><b>${esc(s.voice)}</b> <small>${esc(s.provider)} · ${s.seconds}s</small><audio controls preload="none" src="${esc(s.file)}"></audio></li>`).join('\n');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Voice samples</title>
<style>:root{color-scheme:light dark;--bg:#fafaf7;--ink:#1d1d1b;--soft:#6b6b66}@media(prefers-color-scheme:dark){:root{--bg:#161614;--ink:#ecebe6;--soft:#a3a29c}}
body{background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif;margin:0 auto;max-width:720px;padding:24px 16px}
ul{list-style:none;padding:0}li{display:grid;gap:4px;padding:12px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 12%,transparent)}small{color:var(--soft)}audio{width:100%}</style>
<h1>Voice samples</h1><p>Each voice reads: “${esc(text)}”. Tell the agent which one you want.</p><ul>${rows}</ul>`;
}

async function make() {
  const cfgFile = path.join(ROOT, 'voice', 'script.json');
  if (!fs.existsSync(cfgFile)) throw new Error('write voice/script.json first (references/voice.md "The script")');
  const cfg = readJson(cfgFile);
  const only = opt('--only') ? opt('--only').split(',') : null;
  const takes = Math.max(1, Number(opt('--takes', cfg.provider === 'kokoro' ? 1 : 2)));
  const outDir = path.join(ROOT, 'assets', 'voice'); fs.mkdirSync(outDir, { recursive: true });
  const raw = path.join(ROOT, 'voice', 'takes'); fs.mkdirSync(raw, { recursive: true });
  const lines = cfg.lines.filter((l) => !only || only.includes(l.id));
  const jobs = [];
  lines.forEach((l) => {
    for (let k = 1; k <= takes; k++) {
      jobs.push({ name: `${l.id}__t${k}`, text: l.say || l.text, seed: k, previous_text: cfg.lines[cfg.lines.indexOf(l) - 1]?.text, next_text: cfg.lines[cfg.lines.indexOf(l) + 1]?.text });
    }
  });
  const t0 = Date.now();
  const stats = await generate(cfg, jobs, raw);
  const report = [];
  for (const l of lines) {
    const cands = [];
    for (let k = 1; k <= takes; k++) {
      const name = `${l.id}__t${k}`; const src = path.join(raw, `${name}.wav`);
      if (!fs.existsSync(src)) continue;
      const fin = path.join(raw, `${name}.fin.wav`);
      const seconds = finish(src, fin);
      const words = transcribe(fin);
      cands.push({ take: k, file: fin, seconds: +seconds.toFixed(2), words, sim: +Math.max(similarity(l.text, heardText(words)), l.say ? similarity(l.say, heardText(words)) : 0).toFixed(3) });
    }
    if (!cands.length) throw new Error(`no take came out for ${l.id}`);
    const best = pickTake(cands, l);
    fs.copyFileSync(best.file, path.join(outDir, `${l.id}.wav`));
    fs.writeFileSync(path.join(outDir, `${l.id}.words.json`), JSON.stringify(best.words, null, 1) + '\n');
    const row = { id: l.id, seconds: best.seconds, take: best.take, sim: best.sim, heard: best.words.map((w) => w.text).join(' ') };
    if (best.sim < 0.9) row.warn = 'the take drops or swaps words: listen, reword the line, or use "say" to spell it out';
    if (l.max && best.seconds > l.max) row.warn = `${best.seconds}s is over this line's max ${l.max}s`;
    report.push(row);
    console.log(JSON.stringify(row));
  }
  const takesFile = path.join(ROOT, 'voice', 'takes.json');
  const prev = fs.existsSync(takesFile) ? readJson(takesFile) : {};
  for (const r of report) prev[r.id] = r;
  fs.writeFileSync(takesFile, JSON.stringify(prev, null, 1) + '\n');
  console.log(JSON.stringify({ lines: report.length, takes, provider: cfg.provider, took_s: Math.round((Date.now() - t0) / 1000), ...stats }));
}

// A line's start on the track: t (track time), or at / mark (source time in the raw take) mapped through the cut.
export function lineStart(l, segments, marks) {
  if (typeof l.t === 'number') return l.t;
  let src = l.at;
  if (l.mark) {
    const m = marks.find((e) => e.label === l.mark);
    if (!m) throw new Error(`${l.id}: no mark "${l.mark}" in the take`);
    src = m.t;
  }
  if (typeof src !== 'number') throw new Error(`${l.id}: give it t, at or mark`);
  src += l.offset || 0;
  for (const s of segments) if (!s.hold && src >= s.from && src <= s.to) return s.at + (src - s.from) / s.speed;
  throw new Error(`${l.id}: source time ${src} is not in the cut`);
}
// Fit: a line must end 0.25 s before the next starts and before the track ends. Says how much more room each needs.
export function fit(placed, duration) {
  const gap = 0.25; const out = [];
  placed.sort((a, b) => a.start - b.start);
  placed.forEach((p, i) => {
    const next = placed[i + 1];
    const room = (next ? next.start : duration) - p.start;
    // compared unrounded, and rounded up, so moving a line by short_by is always enough
    const need = p.seconds + (next ? gap : 0.1) - room;
    out.push({ id: p.id, start: +p.start.toFixed(2), end: +(p.start + p.seconds).toFixed(2), room: +room.toFixed(2), ...(need > 1e-6 ? { short_by: Math.ceil(need * 100 - 1e-6) / 100 } : {}) });
  });
  return out;
}
function place(track) {
  const cfg = readJson(path.join(ROOT, 'voice', 'script.json'));
  const lines = cfg.lines.filter((l) => (l.track || 'story-cut') === track);
  if (!lines.length) throw new Error(`no lines with track "${track}" in voice/script.json`);
  const dataFile = path.join(ROOT, 'assets', 'data', `${track}.json`);
  const seg = fs.existsSync(dataFile) ? readJson(dataFile) : { segments: [], duration: Number(opt('--duration', 0)) };
  const duration = Number(opt('--duration', seg.duration));
  if (!duration) throw new Error(`no duration for ${track}: cut it first, or pass --duration`);
  // marks come from the raw take the cut was made from (cut.mjs writes its name into the .js data)
  let marks = [];
  const js = path.join(ROOT, 'assets', 'data', `${track}.js`);
  const clipName = fs.existsSync(js) ? (fs.readFileSync(js, 'utf8').match(/"clip":"([^"]+)"/) || [])[1] : null;
  const rawEv = clipName ? path.join(ROOT, 'raw', `${clipName}.events.json`) : null;
  if (rawEv && fs.existsSync(rawEv)) marks = readJson(rawEv).events.filter((e) => e.type === 'mark');
  const placed = lines.map((l) => {
    const f = path.join(ROOT, 'assets', 'voice', `${l.id}.wav`);
    if (!fs.existsSync(f)) throw new Error(`${l.id}: no assets/voice/${l.id}.wav; run make`);
    return { id: l.id, file: f, start: lineStart(l, seg.segments || [], marks), seconds: probeSeconds(f) };
  });
  const report = fit(placed, duration);
  fs.writeFileSync(path.join(ROOT, 'voice', `${track}-fit.json`), JSON.stringify(report, null, 1) + '\n');
  const outFile = path.join(ROOT, 'assets', 'audio', `${track}-voice.wav`); fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const args = ['-y', '-loglevel', 'error'];
  placed.forEach((p) => args.push('-i', p.file));
  const chains = placed.map((p, i) => `[${i}:a]aresample=48000,adelay=${Math.round(p.start * 1000)}:all=1[a${i}]`);
  const graph = `${chains.join(';')};${placed.map((_, i) => `[a${i}]`).join('')}amix=inputs=${placed.length}:normalize=0,apad=whole_dur=${duration}[out]`;
  args.push('-filter_complex', graph, '-map', '[out]', '-t', String(duration), '-ac', '2', '-ar', '48000', outFile);
  run('ffmpeg', args);
  const short = report.filter((r) => r.short_by);
  console.log(JSON.stringify({ out: path.relative(ROOT, outFile), lines: report.length, fits: !short.length, short,
    ...(short.length ? { next: 'give each short line more room: hold its beat longer (a freeze "t~hold" or a slower span in the cut), or shorten the line; then make and place again' } : {}) }, null, 1));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const cmd = process.argv[2];
  try {
    if (cmd === 'check') await check();
    else if (cmd === 'samples') await samples(process.argv[3], process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : null, opt('--text', SAMPLE_TEXT));
    else if (cmd === 'make') await make();
    else if (cmd === 'place') place(process.argv[3] || 'story-cut');
    else { console.error('usage: node recorder/voice.mjs check | samples <provider> [voices] | make [--takes N] [--only ids] | place <track>'); process.exit(1); }
  } catch (e) { console.error(`voice: ${e.message}`); process.exit(1); }
}
