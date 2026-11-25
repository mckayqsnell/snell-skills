// Unit tests for the demo-video scripts' pure parts: voice, sound packs and the recorded-mode cut.
// The ffmpeg parts run in scripts/check.sh step demo-video.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { similarity, pickTake, lineStart, fit, elevenKey, pythonPath } from '../skills/media/demo-video/scripts/voice.mjs';
import { packsFrom, isMp3 } from '../skills/media/demo-video/scripts/sfx-packs.mjs';
import { snap, layout, remapWords, quietest, safeJoin } from '../skills/media/demo-video/scripts/edl.mjs';
import { phrases } from '../skills/media/demo-video/scripts/cutplan.mjs';

test('similarity: 1 for the same words, lower for dropped ones, ignores case and punctuation', () => {
  assert.equal(similarity('Done. Nothing to fix by hand.', 'done nothing to fix by hand'), 1);
  assert.ok(similarity('Export them all in one go', 'Export them in go') < 0.9);
  assert.equal(similarity('', ''), 1);
});

test('pickTake: the take that says the words wins over a shorter one that drops them', () => {
  const best = pickTake([{ take: 1, sim: 0.7, seconds: 2 }, { take: 2, sim: 1, seconds: 2.6 }], { max: 3 });
  assert.equal(best.take, 2);
  const fits = pickTake([{ take: 1, sim: 1, seconds: 4 }, { take: 2, sim: 0.98, seconds: 2.9 }], { max: 3 });
  assert.equal(fits.take, 2, 'a take over max loses 2 points a second');
});

test('lineStart: t as is, at and mark through the cut segments', () => {
  const segs = [{ from: 0, to: 4, speed: 1, at: 0 }, { from: 4, to: 16, speed: 4, at: 4 }, { from: 16, to: 21, speed: 1, at: 7 }];
  assert.equal(lineStart({ id: 'a', t: 1.5 }, segs, []), 1.5);
  assert.equal(lineStart({ id: 'b', at: 8 }, segs, []), 5);
  assert.equal(+lineStart({ id: 'c', mark: 'done', offset: 0.2 }, segs, [{ label: 'done', t: 16.2 }]).toFixed(3), 7.4);
  assert.throws(() => lineStart({ id: 'd', mark: 'nope' }, segs, []), /no mark/);
  assert.throws(() => lineStart({ id: 'e', at: 30 }, segs, []), /not in the cut/);
});

test('fit: a line that runs into the next says by how much', () => {
  const r = fit([{ id: 'v1', start: 0, seconds: 3 }, { id: 'v2', start: 2.5, seconds: 1 }], 10);
  assert.equal(r[0].short_by, 0.75);
  assert.equal(r[1].short_by, undefined);
  assert.equal(fit([{ id: 'v1', start: 9, seconds: 2 }], 10)[0].short_by, 1.1);
});

test('elevenKey: env first, then local.env; never from anywhere else', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-key-'));
  const f = path.join(dir, 'local.env');
  fs.writeFileSync(f, '# my keys\nOTHER=1\nELEVENLABS_API_KEY="sk_test_123"  # comment\n');
  assert.equal(elevenKey({}, f), 'sk_test_123');
  assert.equal(elevenKey({ ELEVENLABS_API_KEY: ' sk_env ' }, f), 'sk_env');
  assert.equal(elevenKey({}, path.join(dir, 'missing.env')), null);
  fs.rmSync(dir, { recursive: true });
});

test('pythonPath: DEMO_VOICE_PYTHON wins', () => {
  assert.equal(pythonPath({ DEMO_VOICE_PYTHON: '/x/python' }), '/x/python');
});

test('packsFrom: only small mp3 files under packages/uisfx/sounds/<pack>/ with plain names', () => {
  const packs = packsFrom([
    { type: 'blob', path: 'packages/uisfx/sounds/soft/press.mp3', size: 4000, sha: 'a' },
    { type: 'blob', path: 'packages/uisfx/sounds/soft/press.ogg', size: 4000, sha: 'b' },
    { type: 'blob', path: 'packages/uisfx/sounds/soft/../../evil.mp3', size: 10, sha: 'c' },
    { type: 'blob', path: 'packages/uisfx/sounds/soft/huge.mp3', size: 9e6, sha: 'd' },
    { type: 'blob', path: 'packages/uisfx/sounds/Glass/Click.mp3', size: 10, sha: 'e' },
    { type: 'blob', path: 'apps/showcase/sounds/soft/x.mp3', size: 10, sha: 'f' },
    { type: 'tree', path: 'packages/uisfx/sounds/zen', sha: 'g' },
  ]);
  assert.deepEqual(Object.keys(packs), ['soft']);
  assert.deepEqual(packs.soft.map((f) => f.cue), ['press']);
});

test('isMp3: an ID3 tag or a frame sync, nothing else', () => {
  assert.ok(isMp3(Buffer.from([0x49, 0x44, 0x33, 4, 0])));
  assert.ok(isMp3(Buffer.from([0xff, 0xfb, 0x90, 0])));
  assert.ok(!isMp3(Buffer.from('#!/bin/sh\n')));
  assert.ok(!isMp3(Buffer.from('<html>')));
});

const words = [
  { text: 'Hello', start: 0.2, end: 0.6 }, { text: 'there.', start: 0.62, end: 1.0 },
  { text: 'This', start: 1.6, end: 1.8 }, { text: 'is', start: 1.8, end: 1.9 }, { text: 'the', start: 1.9, end: 2.0 },
  { text: 'demo.', start: 2.0, end: 2.5 }, { text: 'Next', start: 2.7, end: 2.9 },
];

test('snap: edges move out to whole words, with padding that stops halfway into the pause', () => {
  const s = snap({ take: 't1', from: 1.7, to: 2.2 }, words);
  assert.equal(s.from, 1.55, '50 ms before "This"');
  assert.equal(s.to, 2.58, '80 ms after "demo.", inside the 200 ms pause');
  assert.equal(s.first, 'This'); assert.equal(s.last, 'demo.');
  assert.deepEqual(s.notes, [], 'a sentence end with a breath is a safe join on both sides');
});

test('snap: a join inside a phrase is flagged, and a sped-up wait is left alone', () => {
  const s = snap({ take: 't1', from: 1.85, to: 2.6 }, words);
  assert.equal(s.first, 'is');
  assert.ok(s.notes.some((n) => /starts inside a phrase/.test(n) && /run together/.test(n)));
  const w = snap({ take: 't1', from: 1.85, to: 2.6, speed: 4 }, words);
  assert.equal(w.from, 1.85); assert.deepEqual(w.notes, []);
});

test('snap: with the sound, edges go to the quietest spot and the pause is measured from it', () => {
  const quiet = (lo, hi) => ({ t: +((lo + hi) / 2).toFixed(3), db: -60, quiet: true, run: 0.5, a: lo, b: hi });
  const s = snap({ take: 't1', from: 1.85, to: 1.95 }, words, quiet);
  assert.deepEqual(s.notes, [], 'a long quiet run makes the join safe even with no gap in the transcript');
});

test('safeJoin: a long pause, or a sentence end with a breath', () => {
  assert.ok(safeJoin(0.5, 'and'));
  assert.ok(safeJoin(0.2, 'done.'));
  assert.ok(!safeJoin(0.2, 'and'));
  assert.ok(!safeJoin(0.05, 'done.'));
});

test('quietest: finds the gap between two tones and its length', () => {
  const rate = 8000; const s = new Float32Array(rate); // 1 s: tone, 300 ms of quiet at 0.4-0.7 s, tone
  for (let k = 0; k < rate; k++) { const t = k / rate; s[k] = t >= 0.4 && t < 0.7 ? 0.0001 : 0.3 * Math.sin(2 * Math.PI * 220 * t); }
  const q = quietest(s, rate, 10);
  assert.ok(q.quiet); assert.ok(q.t > 10.4 && q.t < 10.7, `t ${q.t}`);
  assert.ok(Math.abs(q.run - 0.3) <= 0.02, `run ${q.run}`);
  assert.ok(Math.abs(q.a - 10.4) <= 0.02 && Math.abs(q.b - 10.7) <= 0.02, `quiet from ${q.a} to ${q.b}`);
});

test('layout and remapWords: pieces end to end, words kept only from spoken pieces', () => {
  const { segments, duration } = layout([{ take: 'a', from: 1.5, to: 2.5 }, { take: 'a', from: 10, to: 18, speed: 4 }, { take: 'b', from: 0, to: 1 }]);
  assert.equal(duration, 4);
  assert.deepEqual(segments.map((s) => s.at), [0, 1, 3]);
  const kept = remapWords(segments, { a: words, b: [{ text: 'Bye.', start: 0.1, end: 0.5 }] });
  assert.deepEqual(kept.map((w) => w.text), ['This', 'is', 'the', 'demo.', 'Bye.']);
  assert.equal(kept[0].start, 0.1); assert.equal(kept.at(-1).start, 3.1);
});

test('phrases: split at sentence ends and pauses; fillers and redos marked', () => {
  const p = phrases([
    { text: 'So', start: 0, end: 0.2 }, { text: 'um', start: 0.2, end: 0.4 }, { text: 'this.', start: 0.4, end: 0.8 },
    { text: 'Wait', start: 0.85, end: 1 }, { text: 'cut', start: 1, end: 1.2 }, { text: 'that.', start: 1.2, end: 1.5 },
    { text: 'Again', start: 2.5, end: 3 },
  ]);
  assert.equal(p.length, 3);
  assert.equal(p[0].fillers, 1);
  assert.ok(p[1].redo);
  assert.equal(p[2].gapBefore, 1);
});
