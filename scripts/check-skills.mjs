#!/usr/bin/env node
// check-skills.mjs: checks every tracked skills/<group>/<name>/SKILL.md.
//
//   node scripts/check-skills.mjs frontmatter
//     The frontmatter is valid YAML, `name` matches the folder name, and
//     `description` is there and fits in the skill listing. Claude Code cuts
//     description + when_to_use at 1,536 characters:
//     https://code.claude.com/docs/en/skills#skill-descriptions-are-cut-short
//
//   node scripts/check-skills.mjs links
//     Every path the SKILL.md names under references/, platforms/ or scripts/
//     exists in the skill's folder, and every relative Markdown link
//     ([text](file.md)) points at a file that exists.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DESCRIPTION_MAX = 1536;

const mode = process.argv[2];
if (mode !== 'frontmatter' && mode !== 'links') {
  console.error('usage: node scripts/check-skills.mjs <frontmatter|links>');
  process.exit(2);
}

const skillFiles = execFileSync('git', ['ls-files', 'skills/*/*/SKILL.md'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean);
if (skillFiles.length === 0) {
  console.error('❌ No skills/<group>/<name>/SKILL.md files are tracked');
  process.exit(1);
}

const problems = [];
const seen = new Set();
// One message per file, line and path, even when a line names it twice.
const fail = (file, line, msg, key = msg) => {
  if (seen.has(`${file}:${line}:${key}`)) return;
  seen.add(`${file}:${line}:${key}`);
  problems.push(`${file}${line ? `:${line}` : ''}: ${msg}`);
};

if (mode === 'frontmatter') {
  const { parse } = await import('yaml');
  for (const file of skillFiles) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const folder = path.basename(path.dirname(file));
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!m) { fail(file, 1, 'no frontmatter: the file must start with a --- block'); continue; }
    // File line of a top-level key (the frontmatter starts on line 2).
    const fmLines = m[1].split(/\r?\n/);
    const lineOf = (key) => { const i = fmLines.findIndex((l) => l.startsWith(`${key}:`)); return i < 0 ? 1 : i + 2; };
    let fm;
    try {
      fm = parse(m[1]);
    } catch (err) {
      const line = err.linePos?.[0]?.line ? err.linePos[0].line + 1 : 1;
      fail(file, line, `frontmatter is not valid YAML: ${err.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, '')}`);
      continue;
    }
    if (!fm || typeof fm !== 'object' || Array.isArray(fm)) { fail(file, 1, 'frontmatter must be a YAML mapping (key: value lines)'); continue; }
    if (fm.name !== folder) fail(file, lineOf('name'), `name is ${JSON.stringify(fm.name ?? null)} but the folder is "${folder}"; they must match`);
    if (typeof fm.description !== 'string' || !fm.description.trim()) {
      fail(file, lineOf('description'), 'description is missing or empty');
    } else {
      const extra = typeof fm.when_to_use === 'string' ? fm.when_to_use.length : 0;
      const total = fm.description.length + extra;
      if (total > DESCRIPTION_MAX) {
        fail(file, lineOf('description'), `description${extra ? ' + when_to_use' : ''} is ${total} characters; Claude Code cuts it at ${DESCRIPTION_MAX}, so trim ${total - DESCRIPTION_MAX}`);
      }
    }
    if (!problems.some((p) => p.startsWith(`${file}:`))) console.log(`  ${file}: ok`);
  }
}

if (mode === 'links') {
  // A path token: optionally "<skill>/" or "${CLAUDE_SKILL_DIR}/", then
  // references|platforms|scripts/..., not part of a longer path (so a workspace
  // path like recorder/scripts/x is left alone). Placeholders (<name>) and
  // globs (*) stop the match, so they are never checked.
  const TOKEN = /(?<![\w./<>{}$-])(?:<skill>\/|"?\$\{?CLAUDE_SKILL_DIR\}?"?\/|\.\/)?((?:references|platforms|scripts)\/[\w./-]*[\w-])(?![\w<*{]|\.[*{])/g;
  const LINK = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let checked = 0;
  for (const file of skillFiles) {
    const dir = path.dirname(path.join(ROOT, file));
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    let inFence = false;
    lines.forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      for (const [, rel] of line.matchAll(TOKEN)) {
        checked++;
        if (!fs.existsSync(path.join(dir, rel))) fail(file, i + 1, `names ${rel}, but ${path.relative(ROOT, path.join(dir, rel))} does not exist`, rel);
      }
      if (inFence) return;
      // A link written inside `inline code` is an example, not a link.
      for (const [, target] of line.replace(/`[^`]*`/g, '').matchAll(LINK)) {
        if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(target)) continue; // URLs, anchors, absolute paths
        let rel = target.split('#')[0];
        try { rel = decodeURI(rel); } catch { /* a stray % stays as written */ }
        if (!rel) continue;
        checked++;
        if (!fs.existsSync(path.join(dir, rel))) fail(file, i + 1, `links to ${target}, but ${path.relative(ROOT, path.join(dir, rel))} does not exist`, rel);
      }
    });
  }
  if (problems.length === 0) console.log(`  ${checked} paths and links in ${skillFiles.length} SKILL.md files resolve`);
}

if (problems.length) {
  for (const p of problems) console.error(`❌ ${p}`);
  process.exit(1);
}
console.log(`✅ ${mode}: all ${skillFiles.length} skills pass`);
