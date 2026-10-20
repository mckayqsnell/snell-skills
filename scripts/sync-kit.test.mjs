// Tests for sync-kit.mjs. Run: node --test scripts/   (check.sh runs them too)
// Each test builds a tiny fake repo in a scratch folder and a fake kit build, so it
// never touches this repo's skills.
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { EXIT, REQUIRED, run } from "./sync-kit.mjs";

let root;
let logs;
const log = {
  info: (m) => logs.push(`info ${m}`),
  detail: (m) => logs.push(`detail ${m}`),
  warn: (m) => logs.push(`warn ${m}`),
  error: (m) => logs.push(`error ${m}`),
};
const said = (re) => logs.some((l) => re.test(l));

// A fake build: every required file, with html-to-pdf.sh executable.
const fakeBuild = (stamp = "v1") => async (out) => {
  for (const f of REQUIRED) await writeFile(join(out, f), `${f} ${stamp}\n`);
  await chmod(join(out, "html-to-pdf.sh"), 0o755);
};

async function skill(rel) {
  await mkdir(join(root, rel), { recursive: true });
  await writeFile(join(root, rel, "SKILL.md"), `---\nname: ${rel.split("/").pop()}\n---\n`);
}
async function config(targets) {
  await mkdir(join(root, "kit-src"), { recursive: true });
  await writeFile(join(root, "kit-src", "kit.config.json"), JSON.stringify({ targets }));
}
const go = (args, build = fakeBuild()) => run(args, { root, build, log });

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sync-kit-test-"));
  logs = [];
  await skill("skills/g/a");
  await skill("skills/g/b");
  await config(["skills/g/a", "skills/g/b"]);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("sync, then check", () => {
  it("writes every kit, and the check then passes", async () => {
    assert.equal(await go([]), EXIT.OK);
    for (const s of ["a", "b"]) assert.deepEqual((await readdir(join(root, "skills/g", s, "kit"))).sort(), [...REQUIRED].sort());
    assert.equal(await go(["--check"]), EXIT.OK);
    assert.ok(said(/all 2 kits match/));
  });

  it("a second sync changes nothing", async () => {
    await go([]);
    logs = [];
    assert.equal(await go([]), EXIT.OK);
    assert.ok(said(/0 updated, 2 already up to date/));
  });

  it("leaves no staging folders behind", async () => {
    await go([]);
    await go([], fakeBuild("v2"));
    assert.deepEqual((await readdir(join(root, "skills/g/a"))).sort(), ["SKILL.md", "kit"]);
  });
});

describe("check finds drift and writes nothing", () => {
  beforeEach(async () => { await go([]); logs = []; });

  it("a hand edit in a kit", async () => {
    await writeFile(join(root, "skills/g/a/kit/PARTS.md"), "edited by hand\n");
    assert.equal(await go(["--check"]), EXIT.DRIFT);
    assert.ok(said(/skills\/g\/a\/kit differs .*changed: PARTS\.md/));
    assert.equal(await readFile(join(root, "skills/g/a/kit/PARTS.md"), "utf8"), "edited by hand\n");
  });

  it("an extra file and a missing file", async () => {
    await writeFile(join(root, "skills/g/b/kit/stray.txt"), "x");
    await rm(join(root, "skills/g/b/kit/tokens.css"));
    assert.equal(await go(["--check"]), EXIT.DRIFT);
    assert.ok(said(/new: tokens\.css; gone: stray\.txt/));
  });

  it("a lost executable bit", async () => {
    await chmod(join(root, "skills/g/a/kit/html-to-pdf.sh"), 0o644);
    assert.equal(await go(["--check"]), EXIT.DRIFT);
    assert.ok(said(/html-to-pdf\.sh \(executable bit\)/));
  });

  it("a source change that was never synced", async () => {
    assert.equal(await go(["--check"], fakeBuild("v2")), EXIT.DRIFT);
    assert.ok(said(/2 of 2 kits are out of date/));
  });

  it("and sync repairs all of it", async () => {
    await writeFile(join(root, "skills/g/a/kit/PARTS.md"), "edited by hand\n");
    await writeFile(join(root, "skills/g/a/kit/stray.txt"), "x");
    assert.equal(await go([]), EXIT.OK);
    assert.equal(await go(["--check"]), EXIT.OK);
  });
});

describe("bad config is refused before anything is built", () => {
  const cases = [
    ["a path outside skills/", ["../outside"], /must look like skills\/<group>\/<name>/],
    ["an absolute path", ["/tmp/x"], /must be relative/],
    ["a duplicate", ["skills/g/a", "skills/g/a/"], /listed twice/],
    ["a missing folder", ["skills/g/nope"], /does not exist/],
    ["an empty list", [], /non-empty "targets"/],
    ["a non-string", [42], /non-empty string/],
  ];
  for (const [name, targets, re] of cases) {
    it(name, async () => {
      await config(targets);
      let built = false;
      assert.equal(await go(["--check"], async () => { built = true; }), EXIT.USAGE);
      assert.ok(said(re), logs.join("\n"));
      assert.equal(built, false);
    });
  }

  it("a folder without SKILL.md", async () => {
    await mkdir(join(root, "skills/g/c"), { recursive: true });
    await config(["skills/g/c"]);
    assert.equal(await go([]), EXIT.USAGE);
    assert.ok(said(/has no SKILL\.md/));
  });

  it("broken JSON", async () => {
    await writeFile(join(root, "kit-src", "kit.config.json"), "{ targets: ");
    assert.equal(await go([]), EXIT.USAGE);
    assert.ok(said(/not valid JSON/));
  });

  it("a target that is a link", async () => {
    await symlink(join(root, "skills/g/a"), join(root, "skills/g/link"));
    await config(["skills/g/link"]);
    assert.equal(await go([]), EXIT.USAGE);
    assert.ok(said(/real folder, not a link/));
  });

  it("a skill with a kit/ the config does not list", async () => {
    await skill("skills/g/c");
    await mkdir(join(root, "skills/g/c/kit"));
    assert.equal(await go([]), EXIT.USAGE);
    assert.ok(said(/skills\/g\/c/));
  });

  it("leftovers from an interrupted run", async () => {
    await mkdir(join(root, "skills/g/a/.kit-old-deadbeef"));
    assert.equal(await go([]), EXIT.USAGE);
    assert.ok(said(/interrupted sync/));
  });
});

describe("a bad build never reaches a skill", () => {
  beforeEach(async () => { await go([]); logs = []; });

  it("a build that throws", async () => {
    assert.equal(await go([], async () => { throw new Error("boom"); }), EXIT.DRIFT);
    assert.ok(said(/kit build failed: boom/));
    assert.equal(await go(["--check"]), EXIT.OK); // the old kits are untouched
  });

  it("a build missing a required file", async () => {
    const thin = async (out) => { await fakeBuild()(out); await rm(join(out, "template.html")); };
    assert.equal(await go([], thin), EXIT.DRIFT);
    assert.ok(said(/missing template\.html/));
    assert.equal(await go(["--check"]), EXIT.OK);
  });

  it("a link inside a kit", async () => {
    await symlink("/etc/hosts", join(root, "skills/g/a/kit/hosts"));
    assert.equal(await go(["--check"]), EXIT.DRIFT);
    assert.ok(said(/symbolic link/));
  });
});

describe("arguments", () => {
  it("an unknown flag", async () => {
    assert.equal(await go(["--bogus"]), EXIT.USAGE);
  });
  it("a stray positional", async () => {
    assert.equal(await go(["skills"]), EXIT.USAGE);
  });
  it("--verbose with --quiet", async () => {
    assert.equal(await go(["--verbose", "--quiet"]), EXIT.USAGE);
  });
});
