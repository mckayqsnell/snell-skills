#!/usr/bin/env node
// sync-kit.mjs: build the house-style kit from kit-src/ and copy it into every
// skill that ships one, so each skill still works when it is installed alone.
//
// kit-src/ is the only place to edit the kit. Each skill's kit/ folder is a
// built copy: never edit it by hand, because the next sync overwrites it and
// CI fails while it differs.
//
// Usage:
//   node scripts/sync-kit.mjs            build, then update every skill's kit/
//   node scripts/sync-kit.mjs --check    build in a scratch folder and compare; change nothing
//   add --verbose to list every file, or --quiet to print only problems
//
// Exit codes: 0 everything matches (or was updated), 1 a kit differs (--check)
// or an update failed, 2 bad arguments or bad config. Nothing is half-written:
// each kit/ is built next to the old one and swapped in with a rename, and the
// old one comes back if anything fails.
import { createHash, randomBytes } from "node:crypto";
import { constants as fsc } from "node:fs";
import { access, cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, normalize, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export const EXIT = Object.freeze({ OK: 0, DRIFT: 1, USAGE: 2 });

// Files every built kit must hold. A build that lacks one is broken, so it is never copied anywhere.
export const REQUIRED = Object.freeze([
  "HOUSE-STYLE.md", "PARTS.md", "settings.md", "tokens.css", "template.html", "explain-template.html",
  "house-style.html", "vocab-check.mjs", "vocab-common-3000.txt", "html-to-pdf.sh", "FONTS-LICENSE.txt", "ROUGH-LICENSE.txt",
]);

// A known, user-facing error: printed as one line, with no stack trace.
export class KitError extends Error {
  constructor(message, code = EXIT.USAGE) {
    super(message);
    this.name = "KitError";
    this.code = code;
  }
}

export function makeLogger({ quiet = false, verbose = false, out = console.log, err = console.error } = {}) {
  return {
    info: (msg) => { if (!quiet) out(`sync-kit: ${msg}`); },
    detail: (msg) => { if (verbose && !quiet) out(`sync-kit:   ${msg}`); },
    warn: (msg) => err(`sync-kit: ⚠️  ${msg}`),
    error: (msg) => err(`sync-kit: ❌ ${msg}`),
  };
}

const exists = (p) => access(p, fsc.F_OK).then(() => true, () => false);

// Read and check kit-src/kit.config.json. Every target must be a real skill
// folder, skills/<group>/<name>, inside this repo, with a SKILL.md.
export async function loadTargets(root) {
  const configPath = join(root, "kit-src", "kit.config.json");
  let raw;
  try {
    raw = await readFile(configPath, "utf8");
  } catch (e) {
    throw new KitError(`cannot read ${relative(root, configPath)} (${e.code ?? e.message})`);
  }
  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    throw new KitError(`${relative(root, configPath)} is not valid JSON: ${e.message}`);
  }
  const list = config?.targets;
  if (!Array.isArray(list) || list.length === 0) throw new KitError(`${relative(root, configPath)} needs a non-empty "targets" array`);

  const seen = new Set();
  const targets = [];
  for (const entry of list) {
    if (typeof entry !== "string" || entry.trim() === "") throw new KitError(`every target must be a non-empty string (got ${JSON.stringify(entry)})`);
    if (isAbsolute(entry)) throw new KitError(`target "${entry}" must be relative to the repo root`);
    const rel = normalize(entry).replace(/[\\/]+$/, "");
    const parts = rel.split(/[\\/]/);
    if (parts.includes("..") || parts.length !== 3 || parts[0] !== "skills") {
      throw new KitError(`target "${entry}" must look like skills/<group>/<name>`);
    }
    if (seen.has(rel)) throw new KitError(`target "${entry}" is listed twice`);
    seen.add(rel);

    const dir = join(root, rel);
    let info;
    try {
      info = await lstat(dir);
    } catch {
      throw new KitError(`target "${rel}" does not exist`);
    }
    if (info.isSymbolicLink() || !info.isDirectory()) throw new KitError(`target "${rel}" must be a real folder, not a link or a file`);
    const real = await realpath(dir);
    if (real !== root && !real.startsWith(root + sep)) throw new KitError(`target "${rel}" resolves outside the repo (${real})`);
    if (!(await exists(join(dir, "SKILL.md")))) throw new KitError(`target "${rel}" has no SKILL.md, so it is not a skill`);
    // Leftovers from a run that was killed mid-swap. One may be the only good copy, so a person decides.
    const leftovers = (await readdir(dir)).filter((n) => /^\.kit-(new|old)-[0-9a-f]+$/.test(n));
    if (leftovers.length) throw new KitError(`${rel} holds leftovers from an interrupted sync (${leftovers.join(", ")}). Check ${rel}/kit is complete, then delete them.`);
    targets.push({ rel, dir, kit: join(dir, "kit") });
  }
  return targets;
}

// A kit/ folder in a skill the config does not list would never be synced. Catch it.
export async function findOrphanKits(root, targets) {
  const listed = new Set(targets.map((t) => t.rel));
  const orphans = [];
  const skills = join(root, "skills");
  if (!(await exists(skills))) return orphans;
  for (const group of await readdir(skills, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const skill of await readdir(join(skills, group.name), { withFileTypes: true })) {
      if (!skill.isDirectory()) continue;
      const rel = ["skills", group.name, skill.name].join("/");
      if (!listed.has(normalize(rel)) && (await exists(join(skills, group.name, skill.name, "kit")))) orphans.push(rel);
    }
  }
  return orphans;
}

// Files the OS drops into folders on its own. They are never part of a kit, on either side.
const IGNORED = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

// Map of relative path -> { hash, exec } for every file under dir.
// Links are refused: a kit must be plain files, so a copy can't point outside the skill.
export async function snapshot(dir) {
  const files = new Map();
  if (!(await exists(dir))) return files;
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const ent of entries) {
    const full = join(ent.parentPath ?? ent.path, ent.name);
    const rel = relative(dir, full).split(sep).join("/");
    if (ent.isSymbolicLink()) throw new KitError(`${full} is a symbolic link; a kit holds plain files only`, EXIT.DRIFT);
    if (ent.isDirectory() || IGNORED.has(ent.name)) continue;
    if (!ent.isFile()) throw new KitError(`${full} is not a regular file`, EXIT.DRIFT);
    const [data, info] = await Promise.all([readFile(full), stat(full)]);
    files.set(rel, { hash: createHash("sha256").update(data).digest("hex"), exec: (info.mode & 0o111) !== 0 });
  }
  return files;
}

export function compare(want, have) {
  const added = [], changed = [], removed = [];
  for (const [rel, w] of want) {
    const h = have.get(rel);
    if (!h) added.push(rel);
    else if (h.hash !== w.hash) changed.push(rel);
    else if (h.exec !== w.exec) changed.push(`${rel} (executable bit)`);
  }
  for (const rel of have.keys()) if (!want.has(rel)) removed.push(rel);
  return { added, changed, removed, same: added.length + changed.length + removed.length === 0 };
}

async function loadBuilder(root) {
  const modPath = join(root, "kit-src", "build-kit.mjs");
  if (!(await exists(modPath))) throw new KitError(`missing ${relative(root, modPath)}`);
  const mod = await import(pathToFileURL(modPath).href);
  if (typeof mod.buildKit !== "function") throw new KitError(`${relative(root, modPath)} does not export buildKit(outDir)`);
  return mod.buildKit;
}

// Put a fresh copy of `built` at target.kit, so a reader never sees a half-written kit.
// The new copy is made next to the old one (same disk, so the rename is atomic), then swapped in.
async function replaceKit(built, target, log) {
  const tag = randomBytes(4).toString("hex");
  const staged = join(target.dir, `.kit-new-${tag}`);
  const old = join(target.dir, `.kit-old-${tag}`);
  const hadOld = await exists(target.kit);
  try {
    await cp(built, staged, { recursive: true, errorOnExist: true, force: false, verbatimSymlinks: true });
    if (hadOld) await rename(target.kit, old);
    try {
      await rename(staged, target.kit);
    } catch (e) {
      if (hadOld) await rename(old, target.kit); // put the old kit back before giving up
      throw e;
    }
  } catch (e) {
    await rm(staged, { recursive: true, force: true }).catch(() => {});
    if (hadOld && !(await exists(target.kit)) && (await exists(old))) {
      await rename(old, target.kit).catch((e2) => log.error(`could not restore ${target.rel}/kit from ${old}: ${e2.message}`));
    }
    throw new KitError(`could not update ${target.rel}/kit: ${e.message}`, EXIT.DRIFT);
  }
  // The new kit is in place. Failing to delete the old copy is not a failed update, so only warn.
  if (hadOld) {
    await rm(old, { recursive: true, force: true }).catch((e) =>
      log.warn(`${target.rel}/kit is updated, but the old copy ${old} could not be removed (${e.message}). Delete it by hand; the next sync refuses to run while it is there.`));
  }
}

function describe(diff, max = 8) {
  const parts = [];
  for (const [label, list] of [["new", diff.added], ["changed", diff.changed], ["gone", diff.removed]]) {
    if (!list.length) continue;
    const shown = list.slice(0, max).join(", ");
    parts.push(`${label}: ${shown}${list.length > max ? ` and ${list.length - max} more` : ""}`);
  }
  return parts.join("; ");
}

// The whole run. Returns an exit code instead of exiting, so tests can call it.
// options.build replaces buildKit (tests use a small fake); options.log replaces the logger.
export async function run(argv, { root: rootIn, build, log: logIn } = {}) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: { check: { type: "boolean" }, verbose: { type: "boolean" }, quiet: { type: "boolean" }, help: { type: "boolean", short: "h" } },
      strict: true,
      allowPositionals: false,
    }));
  } catch (e) {
    (logIn ?? makeLogger()).error(`${e.message}. Usage: sync-kit.mjs [--check] [--verbose | --quiet]`);
    return EXIT.USAGE;
  }
  const log = logIn ?? makeLogger(values);
  if (values.help) {
    log.info("usage: node scripts/sync-kit.mjs [--check] [--verbose | --quiet]");
    return EXIT.OK;
  }
  if (values.verbose && values.quiet) {
    log.error("--verbose and --quiet can't be used together");
    return EXIT.USAGE;
  }

  let scratch;
  try {
    const root = await realpath(rootIn ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
    const targets = await loadTargets(root);
    const orphans = await findOrphanKits(root, targets);
    if (orphans.length) throw new KitError(`these skills have a kit/ folder but are not in kit-src/kit.config.json: ${orphans.join(", ")}`);

    const buildKit = build ?? (await loadBuilder(root));
    scratch = await mkdtemp(join(tmpdir(), "sync-kit-"));
    const built = join(scratch, "kit");
    await mkdir(built);
    log.info(`building the kit from kit-src/ ${values.check ? "(check only, nothing is written)" : ""}`.trimEnd());
    try {
      await buildKit(built);
    } catch (e) {
      throw new KitError(`the kit build failed: ${e.message}`, EXIT.DRIFT);
    }
    const want = await snapshot(built);
    const missing = REQUIRED.filter((f) => !want.has(f));
    if (missing.length) throw new KitError(`the built kit is missing ${missing.join(", ")}; fix kit-src/build-kit.mjs`, EXIT.DRIFT);
    log.detail(`built ${want.size} files`);

    let drift = 0, updated = 0;
    for (const target of targets) {
      const diff = compare(want, await snapshot(target.kit));
      if (diff.same) {
        log.info(`✅ ${target.rel}/kit is up to date`);
        continue;
      }
      if (values.check) {
        drift++;
        log.error(`${target.rel}/kit differs from kit-src/ (${describe(diff)})`);
        continue;
      }
      await replaceKit(built, target, log);
      updated++;
      log.info(`✏️  ${target.rel}/kit updated (${describe(diff)})`);
      for (const f of [...diff.added, ...diff.changed, ...diff.removed]) log.detail(f);
    }

    if (values.check && drift) {
      log.error(`${drift} of ${targets.length} kits are out of date. Run: pnpm run kit   (never edit a skill's kit/ by hand; edit kit-src/)`);
      return EXIT.DRIFT;
    }
    log.info(values.check ? `✅ all ${targets.length} kits match kit-src/` : `✅ done: ${updated} updated, ${targets.length - updated} already up to date`);
    return EXIT.OK;
  } catch (e) {
    if (e instanceof KitError) {
      log.error(e.message);
      return e.code;
    }
    log.error(`unexpected error: ${e.stack ?? e}`);
    return EXIT.DRIFT;
  } finally {
    if (scratch) await rm(scratch, { recursive: true, force: true }).catch((e) => log.warn(`could not remove scratch folder ${scratch}: ${e.message}`));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (await realpath(process.argv[1]).catch(() => process.argv[1]))) {
  process.exitCode = await run(process.argv.slice(2));
}
