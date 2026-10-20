#!/usr/bin/env node
// sync-version.mjs: copy the version from package.json into the plugin manifest.
//
// package.json is the source of truth: `changeset version` bumps it, then
// this script writes the same version into .claude-plugin/plugin.json.
// Claude Code reads the version from plugin.json, and only sends users an
// update when that string changes.
//
// Usage:
//   node scripts/sync-version.mjs          write the version into plugin.json
//   node scripts/sync-version.mjs --check  only check; exit 1 if they differ
//
// It also fails if marketplace.json sets a version on the plugin entry,
// because Claude Code ignores it when plugin.json has one, and two copies
// drift apart.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const paths = {
  pkg: join(root, "package.json"),
  plugin: join(root, ".claude-plugin", "plugin.json"),
  marketplace: join(root, ".claude-plugin", "marketplace.json"),
};

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function readJson(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (err) {
    fail(`Cannot read ${path}: ${err.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    fail(`${path} is not valid JSON: ${err.message}`);
  }
}

const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== "--check");
if (unknown.length > 0) fail(`Unknown argument(s): ${unknown.join(" ")}. Usage: sync-version.mjs [--check]`);
const checkOnly = args.includes("--check");

const pkg = readJson(paths.pkg);
const plugin = readJson(paths.plugin);
const marketplace = readJson(paths.marketplace);

const version = pkg.version;
// Plain semver: MAJOR.MINOR.PATCH with an optional -prerelease tag.
if (typeof version !== "string" || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`package.json has no valid semver "version" (got: ${JSON.stringify(version)})`);
}

const entry = (marketplace.plugins ?? []).find((p) => p.name === plugin.name);
if (!entry) fail(`marketplace.json has no plugin entry named "${plugin.name}"`);
if ("version" in entry) {
  fail(`marketplace.json sets "version" on "${plugin.name}". Remove it; plugin.json carries the version.`);
}

if (plugin.version === version) {
  console.log(`✅ plugin.json version matches package.json (${version})`);
  process.exit(0);
}

if (checkOnly) {
  fail(`plugin.json version is ${JSON.stringify(plugin.version)} but package.json is "${version}". Run: node scripts/sync-version.mjs`);
}

plugin.version = version;
writeFileSync(paths.plugin, `${JSON.stringify(plugin, null, 2)}\n`);
console.log(`✅ plugin.json version set to ${version}`);
