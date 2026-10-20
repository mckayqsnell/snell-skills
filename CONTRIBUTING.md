# Contributing

## Setup

You need Node.js 24 or newer, pnpm, and shellcheck.

```bash
pnpm install
```

```bash
pnpm run check
```

`pnpm run check` runs the same checks CI runs on a pull request. See
[scripts/check.sh](scripts/check.sh) for the list.

## Adding a skill

1. Make a folder at `skills/<group>/<name>/` with a `SKILL.md` inside. The
   `name:` in its frontmatter must match the folder name.
2. Use an existing group (`html` or `tools`) if one fits. A new group also
   needs a line in the `"skills"` list in `.claude-plugin/plugin.json`, or
   the Claude Code plugin will not load it.
3. No personal paths. Anything machine-specific goes in a gitignored
   `local.env`, with a committed `local.env.example` that explains each key.
   The skill's scripts must stop with a clear message when a key is missing.
4. Add a row to the Skills table in `README.md`.

## Changing the house-style kit

The html skills share one kit: templates, rules, the page script and helper
scripts. Its sources live in `kit-src/`. Each html skill ships a built copy in
its own `kit/` folder, so it works when someone installs only that skill.

1. Edit files in `kit-src/` only. Never edit a skill's `kit/` folder: the next
   sync overwrites it, and CI fails while it differs.
2. Rebuild every copy:

   ```bash
   pnpm run kit
   ```

   It builds the kit in a scratch folder, then swaps each skill's `kit/` for
   the new one. It lists what changed in each.
3. Commit `kit-src/` and the updated `kit/` folders together.

To give another skill a kit, add its folder to `targets` in
`kit-src/kit.config.json`, then run `pnpm run kit`. The check fails if a skill
has a `kit/` folder the config doesn't list.

`pnpm run check` runs `node scripts/sync-kit.mjs --check`, which builds the
kit and compares it file by file (content and the executable bit) without
writing anything.

## Every change that users would notice needs a changeset

A changeset is a small Markdown file in `.changeset/` that says what changed
and how big the change is. Make one with:

```bash
pnpm changeset
```

It asks for the bump type and a one-line summary. Write the summary for the
person installing the skills: what they will notice. Commit the file with
your change.

Skip the changeset only for changes users can't see: CI tweaks, repo docs,
refactors that change nothing.

## Picking major, minor or patch

Versions look like `MAJOR.MINOR.PATCH`, for example `1.4.2`.

| Bump | When | Examples |
| :- | :- | :- |
| **major** (`2.0.0`) | The change **breaks someone's setup**. They have to do something after updating. | A skill is renamed or removed. A `local.env` or `settings.md` key is renamed or removed. A command changes name. A script's arguments change so old calls fail. |
| **minor** (`1.5.0`) | Something **new**, and nothing old breaks. | A new skill. A new command. A new optional setting or option. |
| **patch** (`1.4.3`) | A **fix or polish**. Same features, working better. | A bug fix. Clearer wording in a skill. A look tweak in a template. |

When unsure between two, pick the bigger one.

## How a release happens

You don't bump versions by hand. When your pull request with a changeset
merges into `main`, the Release workflow opens a "Version Packages" pull
request. Merging that one tags the version and creates a GitHub release. See
[docs/how-it-works.md](docs/how-it-works.md) for the details.
