#!/usr/bin/env node
// Vocab checker (bake-off round 09; floor rule locked Oct 19, 2026). Usage:
//   node vocab-check.mjs page.html|notes.md [--level 80] [--reader engineer|general] [--exact] [--json] [--verbose]
// --reader: who the page is for. engineer (the default) also counts vocab-engineer.txt as common words:
// app, ticket, deploy, endpoint and the like. general switches that list off, for a non-technical reader.
// Without the flag: <meta name="vocab-reader" content="general"> in the page, else vocab.reader in settings.md.
// --level N passes when the score is N or more: the level is a floor, not a target.
// --exact keeps the round 09 calibration rule instead: pass when within 5 of N.
// Score 0-100 = 30% short sentences + 30% common words + 25% active voice + 15% no filler.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const words = (f) => new Set(fs.readFileSync(path.join(here, f), 'utf8').replace(/^#.*$/gm, '').split(/\s+/).filter(Boolean));
const COMMON = words('vocab-common-3000.txt');
const ENGINEER = words('vocab-engineer.txt');
export const READERS = ['engineer', 'general'];

// The reader from settings.md next to this file: `reader:` inside the `vocab:` block. Defaults to engineer.
export function settingsReader(file = path.join(here, 'settings.md')) {
  let src = '';
  try { src = fs.readFileSync(file, 'utf8'); } catch { return 'engineer'; }
  const block = /^vocab:\s*\n((?:[ \t]+.*\n?)*)/m.exec(src);
  const m = block && /^\s+reader:\s*([a-z]+)/m.exec(block[1]);
  return m && READERS.includes(m[1]) ? m[1] : 'engineer';
}

export const WEIGHTS = { short: 30, common: 30, active: 25, filler: 15 };
export const MAX_WORDS = 20;            // STE: 20 words for steps, 25 for description
export const COMMON_FLOOR = 85;         // 85% common words = 0 points, 100% = 100 points
export const FILLER_PENALTY = 20;       // points lost per filler hit per 100 words

// Code and product words that are fine on these pages. Own words go here (or allow.txt later).
const ALLOW = new Set(`html pdf md css json api url cli npm repo repos redis markdown refactor refactors refactoring
 changeset changesets semver eli5 ste glossary recap analogy sketch whiteboard subagent sub-agent playwright
 changelog changelogs bump bumps folder bumped yaml svg pull package packages
 browser browsers desktop font fonts px markup variable variables offline console screenshot screenshots
 panel panels menu button buttons sticky snippet zoom pan fullscreen timeline sidebar scroll scrolls sideways
 halo arrowhead arrowheads hex js id ids vocab skill skills fold folds folded beta plain placeholder placeholders
 tab tabs toggle checkbox radio dropdown tooltip popover viewport layout rail`.split(/\s+/));

// Acronyms every engineer knows: never spell these out. Any other acronym (SDK, OAuth, JWT, PKCE...) gets a hover card
// where it first shows up. Only add ones a competent engineer reads without a second look.
export const ACRONYMS_KNOWN = new Set(('api apis url urls uri html css json js ts jsx tsx http https sql ui ux id ids uuid cli npm pdf svg png md yaml xml csv ok ' +
  'pr prs ci cd mcp aws gcp ai llm llms db io os ide ssh dns ip cpu gpu ram vm qa faq todo readme env utc rest crud ' +
  'mvp poc ga dev prod tl dr eta pm am sqlite kb mb gb tb ms ' +
  'get post put patch delete head sha fifo lifo rfc ietf w3c iso').split(' '));

// Spec words written in capitals (RFC 2119 style) are not acronyms.
export const SPEC_WORDS = new Set('must should may shall not required optional recommended'.split(' '));

// For a non-technical reader (reader: general) only these few count as known; everything else gets spelled out.
export const ACRONYMS_EVERYONE = new Set('ok pdf faq eta am pm utc tv usb wifi'.split(' '));

// Above this many hover terms an engineer page is defining things the reader already knows. A warning, not a fail.
export const TERM_WARN = 8;

export const FILLER = ['leverage','leverages','leveraging','utilize','utilizes','utilizing','utilise','robust','seamless','seamlessly',
 'in order to','facilitate','facilitates','comprehensive','holistic','synergy','streamline','streamlines','cutting-edge',
 'state-of-the-art','empower','empowers','paradigm','it is important to note','it should be noted','basically','essentially',
 'simply put','very','really','various','numerous','furthermore','moreover','additionally','subsequently','prior to',
 'in addition','due to the fact','a number of','is able to','with regard to','in the event that','at this point in time',
 'ensure that','going forward','best practices','solution','solutions','functionality','methodology','approximately','individual','individuals'];

const IRREG = new Set('known built made done seen given written shown run set kept held found taken chosen broken driven sent put left lost read told'.split(' '));
// codetoken: inline <code> becomes CODETOKEN, which ends in "en"; "the default is <code>30</code>" is not passive.
const NOT_PASSIVE = new Set('open even often then token between listen frozen when seven eleven women children kitchen codetoken'.split(' '));
const BE = '(?:is|are|was|were|be|been|being|am)';
const PASSIVE = new RegExp(`\\b${BE}\\s+(?:\\w+ly\\s+)?(\\w+)\\b`, 'gi');

function decode(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/&mdash;/g, ' - ').replace(/&middot;/g, ' ').replace(/&rarr;/g, '->').replace(/&amp;/g, '&');
}

// HTML -> { units: [text], glossed: Set }  Code/pre become the token CODE (counts as 1 word, not checked).
export function prepare(html) {
  // A term counts as explained only where the page defines it in place: a hover term
  // (<dfn class="term"> or <abbr class="term"> with its .term-def card), a plain <dfn> or <abbr>,
  // or a .term span. A glossary <dt> alone earns nothing, so stacking glossary entries can't
  // lift the score; the glossary is for the reader, not for the checker.
  // The words of a .term-def card are prose: they are scored as their own sentence, after the
  // term's own line, and they gloss nothing.
  const glossed = new Set(), cards = [];
  const gloss = (s) => s.replace(/<[^>]+>/g, '').toLowerCase().split(/[^a-z'-]+/).filter(Boolean).forEach(w => glossed.add(w));
  html = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ');
  html = dropChrome(html);
  html = pullCards(html, cards);
  html = html.replace(/<(dfn|abbr)\b[^>]*>([\s\S]*?)<\/\1>/gi, (m, t, inner) => { gloss(inner); return ` ${inner} `; });
  html = html.replace(/<span\b[^>]*class="(?:[^"]*\s)?term(?:\s[^"]*)?"[^>]*>([\s\S]*?)<\/span>/gi, (m, inner) => { gloss(inner); return ` ${inner} `; });
  html += cards.map(c => `<p>${c}</p>`).join('');
  html = html.replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, ' CODETOKEN ');
  html = html.replace(/<\/?(p|li|td|th|tr|h[1-6]|div|section|ul|ol|table|caption|dt|dd|br|summary|details|blockquote|figcaption)\b[^>]*>/gi, '\n');
  html = html.replace(/<[^>]+>/g, ' ');   // a space, so words in neighbouring tags stay apart
  const text = decode(html);
  const units = [];
  for (const line of text.split('\n')) {
    const t = line.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    // split into sentences on . ! ? followed by space + capital/quote, or end
    t.split(/(?<=[.!?])["')]*\s+(?=[A-Z"'(])/).forEach(s => { s = s.trim(); if (/[A-Za-z]/.test(s)) units.push(s); });
  }
  return { units, glossed };
}

// Page chrome is not prose: buttons, the contents nav, and anything marked data-vocab-skip (the style gear).
// Takes every .term-def card out of the page, counting nested <span>s so a span inside a card
// doesn't cut it short. The cards go into `cards`; each leaves a space behind.
export function pullCards(html, cards) {
  const open = /<span\b[^>]*class="(?:[^"]*\s)?term-def(?:\s[^"]*)?"[^>]*>/gi;
  let out = '', from = 0, m;
  while ((m = open.exec(html))) {
    const start = m.index + m[0].length, tag = /<(\/?)span\b[^>]*>/gi;
    tag.lastIndex = start;
    let depth = 1, t, end = html.length, close = html.length;
    while (depth && (t = tag.exec(html))) { depth += t[1] ? -1 : 1; if (!depth) { end = t.index; close = tag.lastIndex; } }
    cards.push(html.slice(start, end));
    out += html.slice(from, m.index) + ' ';
    from = close; open.lastIndex = close;
  }
  return out + html.slice(from);
}

function dropChrome(html) {
  html = html.replace(/<(button|nav)\b[\s\S]*?<\/\1>/gi, ' ');
  for (let guard = 0; guard < 50; guard++) {
    const m = /<([a-z][a-z0-9]*)\b[^>]*\bdata-vocab-skip\b[^>]*>/i.exec(html);
    if (!m) break;
    const tag = m[1].toLowerCase(), re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    re.lastIndex = m.index + m[0].length;
    let depth = 1, end = html.length, t;
    while (depth && (t = re.exec(html))) { depth += t[1] ? -1 : 1; if (!depth) end = t.index + t[0].length; }
    html = html.slice(0, m.index) + ' ' + html.slice(end);
  }
  return html;
}

function wordsOf(s) { return s.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)); }

function isCommon(w, glossed, extra) {
  w = w.toLowerCase();
  const known = (x) => COMMON.has(x) || ALLOW.has(x) || glossed.has(x) || extra.has(x);
  if (known(w)) return true;
  const stems = [];
  if (w.endsWith('ies')) stems.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) stems.push(w.slice(0, -2));
  if (w.endsWith('s')) stems.push(w.slice(0, -1));
  if (w.endsWith('ed')) { stems.push(w.slice(0, -2), w.slice(0, -1)); if (/(.)\1ed$/.test(w)) stems.push(w.slice(0, -3)); }
  if (w.endsWith('ing')) { stems.push(w.slice(0, -3), w.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(w)) stems.push(w.slice(0, -4)); }
  if (w.endsWith('ly')) stems.push(w.slice(0, -2));
  if (w.endsWith('er')) stems.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith('est')) stems.push(w.slice(0, -3));
  if (w.endsWith('ment')) stems.push(w.slice(0, -4));
  return stems.some(x => x.length > 1 && known(x));
}

// opts.reader: 'engineer' or 'general'. Unset: the page's <meta name="vocab-reader">, else settings.md.
export function score(html, opts = {}) {
  const tag = (html.match(/<meta\b[^>]*>/gi) || []).find(t => /\bname=["']vocab-reader["']/i.test(t));
  const meta = tag && /\bcontent=["']([a-z]+)["']/i.exec(tag);
  const reader = opts.reader || (meta && READERS.includes(meta[1].toLowerCase()) ? meta[1].toLowerCase() : settingsReader());
  const extra = reader === 'engineer' ? ENGINEER : new Set();
  const { units, glossed } = prepare(html);
  // hover terms: how many, which cards have no example, and any old .vocab boxes
  const termTags = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').match(/<(?:dfn|abbr|span)\b[^>]*class="(?:[^"]*\s)?term(?:\s[^"]*)?"[^>]*>/gi) || [];
  const cardList = []; pullCards(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' '), cardList);
  const plain = (c) => c.replace(/<span\b[^>]*class="(?:[^"]*\s)?term-eg(?:\s[^"]*)?"[\s\S]*$/i, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const noExample = cardList.filter(c => !/class="(?:[^"]*\s)?term-eg(?:\s|")/i.test(c)).map(c => plain(c).slice(0, 40));
  const vocabBoxes = (html.match(/class="(?:[^"]*\s)?vocab(?:\s[^"]*)?"/gi) || []).length;
  const acronyms = new Map();
  let totalWords = 0, shortCount = 0, passiveCount = 0, vocabWords = 0, commonWords = 0;
  const hard = new Map(), longSents = [], passiveSents = [], fillerHits = [];
  for (const s of units) {
    const ws = wordsOf(s);
    totalWords += ws.length;
    if (ws.length <= MAX_WORDS) shortCount++; else longSents.push(`${ws.length}w: ${s.slice(0, 70)}`);
    let passive = false;
    for (const m of s.matchAll(PASSIVE)) {
      const v = m[1].toLowerCase();
      if (NOT_PASSIVE.has(v)) continue;
      if (IRREG.has(v) || (/(ed|en)$/.test(v) && v.length > 4)) { passive = true; break; }
    }
    if (passive) { passiveCount++; passiveSents.push(s.slice(0, 70)); }
    // vocab: skip CODETOKEN, numbers, and capitalised words that are not first in the unit (proper nouns)
    ws.forEach((raw, i) => {
      if (raw.includes('CODETOKEN')) return;
      raw.replace(/[^A-Za-z'’-]+/g, ' ').trim().split(/[\s-]+/).forEach((p, j) => {
        p = p.replace(/['’]s$/, '').replace(/^['’]|['’]$/g, '');
        if (!/^[A-Za-z]{2,}$/.test(p)) return;
        if (i > 0 && /^[A-Z][a-z]/.test(p) && j === 0) return;
        if (/^[A-Z]{2,}[a-z]*$/.test(p)) {                 // acronyms (OAuth too): not scored, listed when nothing explains them
          const l = p.toLowerCase(), base = /^[A-Z]{2,}s$/.test(p) ? l.slice(0, -1) : l;   // JWTs counts as JWT
          const knownSet = reader === 'engineer' ? ACRONYMS_KNOWN : ACRONYMS_EVERYONE;
          if (!glossed.has(l) && !glossed.has(base) && !knownSet.has(l) && !knownSet.has(base) && !SPEC_WORDS.has(l) && l !== 'codetoken') acronyms.set(p, (acronyms.get(p) || 0) + 1);
          return;
        }
        vocabWords++;
        if (isCommon(p, glossed, extra)) commonWords++; else hard.set(p.toLowerCase(), (hard.get(p.toLowerCase()) || 0) + 1);
      });
    });
  }
  const flat = ' ' + units.join(' ').toLowerCase().replace(/[^a-z' -]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  let fillerCount = 0;
  for (const f of FILLER) {
    const re = new RegExp(`(?<![a-z-])${f.replace(/[-]/g, '\\-')}(?![a-z-])`, 'g');
    const n = (flat.match(re) || []).length;
    if (n) { fillerCount += n; fillerHits.push(`${f} x${n}`); }
  }
  const N = units.length || 1;
  const short = 100 * shortCount / N;
  const commonPct = vocabWords ? 100 * commonWords / vocabWords : 100;
  const common = Math.max(0, Math.min(100, 100 * (commonPct - COMMON_FLOOR) / (100 - COMMON_FLOOR)));
  const active = 100 * (N - passiveCount) / N;
  const fillerPer100 = totalWords ? 100 * fillerCount / totalWords : 0;
  const filler = Math.max(0, 100 - FILLER_PENALTY * fillerPer100);
  const total = (WEIGHTS.short * short + WEIGHTS.common * common + WEIGHTS.active * active + WEIGHTS.filler * filler) / 100;
  return {
    score: Math.round(total * 10) / 10,
    reader,
    parts: { short: r(short), common: r(common), commonPct: r(commonPct), active: r(active), filler: r(filler) },
    counts: { sentences: N, words: totalWords, shortSentences: shortCount, passive: passiveCount, vocabWords, commonWords, fillerHits: fillerCount, glossedWords: glossed.size },
    detail: { hard: [...hard.entries()].sort((a, b) => b[1] - a[1]).map(([w, n]) => w + (n > 1 ? 'x' + n : '')), longSents, passiveSents, fillerHits,
      acronyms: [...acronyms.keys()] },
    terms: { count: termTags.length, warnAbove: TERM_WARN, noExample, vocabBoxes },
  };
}
const r = x => Math.round(x * 10) / 10;

// Markdown: code, links and table pipes are not prose. Turn them into the shapes prepare() already skips.
export function mdToHtml(md) {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, '\n')                       // front matter
    .replace(/```[\s\S]*?```/g, '<pre>x</pre>')                     // fenced code
    .replace(/`[^`\n]+`/g, '<code>x</code>')                         // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')                          // links: keep the words
    .replace(/^\s*\|?[-: |]+\|[-: |]*$/gm, '')                         // table rule lines
    .replace(/\|/g, '\n')                                             // table cells: one unit each
    .replace(/^#+\s*/gm, '').replace(/^\s*([-*]|\d+\.)\s+/gm, '\n');     // headings and list markers
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const li0 = args.indexOf('--level'), ri = args.indexOf('--reader');
  const file = args.find((a, i) => !a.startsWith('--') && i !== (li0 >= 0 ? li0 + 1 : -9) && i !== (ri >= 0 ? ri + 1 : -9));
  if (!file) { console.error('usage: node vocab-check.mjs page.html [--level N] [--reader engineer|general] [--json] [--verbose]'); process.exit(2); }
  const reader = ri >= 0 ? args[ri + 1] : undefined;
  if (ri >= 0 && !READERS.includes(reader)) { console.error('vocab-check: --reader needs engineer or general'); process.exit(2); }
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch (e) { console.error(`vocab-check: cannot read ${file} (${e.code})`); process.exit(2); }
  if (/\.md$/i.test(file)) src = mdToHtml(src);
  const res = score(src, { reader });
  const li = args.indexOf('--level');
  const level = li >= 0 ? Number(args[li + 1]) : null;
  if (li >= 0 && !Number.isFinite(level)) { console.error('vocab-check: --level needs a number, e.g. --level 80'); process.exit(2); }
  if (args.includes('--json')) console.log(JSON.stringify(res, null, 1));
  else {
    console.log(`score ${res.score}  reader ${res.reader}  (short ${res.parts.short} · common ${res.parts.common} · active ${res.parts.active} · filler ${res.parts.filler})`);
    console.log(JSON.stringify(res.counts));
    if (res.detail.acronyms.length && !args.includes('--verbose')) console.log('spell these out where they first show up (an <abbr class="term"> card):', res.detail.acronyms.join(', '));
    const T = res.terms;
    console.log(`hover terms: ${T.count}${T.count >= 5 ? ' (5 or more: add a folded glossary)' : ''}`);
    if (T.count > T.warnAbove) console.log(`WARN: ${T.count} hover terms (more than ${T.warnAbove}). For an engineer reader that usually means defining words they know. Keep only real jargon.`);
    if (T.noExample.length) console.log(`WARN: ${T.noExample.length} hover card(s) have no <span class="term-eg"> example:`, T.noExample.map(x => `"${x}"`).join(', '));
    if (T.vocabBoxes) console.log(`WARN: ${T.vocabBoxes} .vocab box(es). There is no such part any more: make each one a hover term in the sentence.`);
    if (args.includes('--verbose')) { console.log('hard:', res.detail.hard.join(', ')); console.log('long:', res.detail.longSents.join('\n      ')); console.log('passive:', res.detail.passiveSents.join('\n        ')); console.log('filler:', res.detail.fillerHits.join(', ')); console.log('acronyms not spelled out (not scored):', res.detail.acronyms.join(', ')); }
  }
  if (level != null) {
    if (args.includes('--exact')) { const ok = Math.abs(res.score - level) <= 5; console.log(ok ? `PASS: within 5 of ${level}` : `FAIL: ${res.score} is not within 5 of ${level}`); process.exit(ok ? 0 : 1); }
    const ok = res.score >= level; console.log(ok ? `PASS: ${res.score} is at or above the floor of ${level}` : `FAIL: ${res.score} is under the floor of ${level}. Run with --verbose to see hard words, long sentences and passive voice. Swap hard words for plainer ones first. Real jargon the page can't avoid? Make it a hover term where it first shows up (PARTS.md).`); process.exit(ok ? 0 : 1);
  }
}
