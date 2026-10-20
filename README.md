# snell-skills

McKay Snell's agent skills. A skill is a folder with a `SKILL.md` file that
teaches a coding agent (Claude Code, Codex, Cursor and others) how to do one
kind of task.

> **Private for now.** This repo is private. The install commands below only
> work for people who have read access to it on GitHub, with git set up to
> reach it (an SSH key, or `gh auth login` then `gh auth setup-git`).

## Install

There are two ways in. Pick one.

### Any agent: `npx skills`

```bash
npx skills add mckayqsnell/snell-skills
```

The [skills CLI](https://github.com/vercel-labs/skills) asks which skills
and which agents you want, then copies or links the skill folders into each
agent's skills directory. Add `-g` to install for your user instead of the
current project. Re-run the command to update.

This gives you the **skills only**. The `/learning-pdf` command and the
session-start hook are Claude Code plugin parts, so they need the plugin.

### Claude Code: plugin marketplace

In a Claude Code session:

```text
/plugin marketplace add mckayqsnell/snell-skills
/plugin install snell-skills@snell-skills
```

Or from your shell:

```bash
claude plugin marketplace add mckayqsnell/snell-skills
```

```bash
claude plugin install snell-skills@snell-skills
```

This gives you every skill, the `/snell-skills:learning-pdf` command, and the
learning-doc session-start offer. Skills are namespaced, for example
`/snell-skills:to-markdown`.

To get updates without asking each time, open `/plugin`, go to
**Marketplaces**, pick `snell-skills` and choose **Enable auto-update**.
Auto-update is off by default for marketplaces other than Anthropic's.
Without it, run `claude plugin update snell-skills@snell-skills`. You only
get a new copy when the plugin's version changes, which happens on each
release.

## Skills

| Group | Skill | What it does |
| :- | :- | :- |
| html | [learning-doc](skills/html/learning-doc/SKILL.md) | Keeps a textbook-style HTML learning doc for a session, plus a PDF made with headless Chrome. |
| tools | [to-markdown](skills/tools/to-markdown/SKILL.md) | Converts PDFs, Office files, images, audio and more into Markdown. |

Plugin extras:

- `commands/learning-pdf.md`: the `/learning-pdf` command (HTML doc to PDF).
- `hooks/hooks.json`: at the start of a new session, offers to keep a
  learning doc. It prints the text in `hooks/learning-doc-prompt.txt`.

## Settings: `local.env`

Some skills need a path that differs per machine. Those live in a
`local.env` file that is never committed.

```bash
cp local.env.example local.env
```

Then edit `local.env`. If you installed the skills rather than cloning the
repo, put the file at `~/.config/snell-skills/local.env` instead, or set
`SNELL_SKILLS_ENV` to its path. The scripts tell you exactly what is missing
when they can't find it.

| Key | Used by | Meaning |
| :- | :- | :- |
| `LEARNING_DOC_DIR` | learning-doc, `/learning-pdf` | Folder for learning-doc HTML files and their PDFs. |

## Repo layout

```text
.claude-plugin/
  plugin.json        the plugin manifest (name, version, where skills live)
  marketplace.json   the catalog that lists the plugin
skills/<group>/<name>/SKILL.md   one folder per skill, grouped
commands/            Claude Code slash commands (plugin only)
hooks/hooks.json     Claude Code hooks (plugin only)
scripts/             version sync and the check suite
.changeset/          pending release notes (see CONTRIBUTING.md)
plan-html-skill/     the project plan and its template (not a skill yet)
```

## Working on it

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a change and pick a
version bump, and [docs/how-it-works.md](docs/how-it-works.md) for how
installs, releases and the CI safety settings work.

## License

[MIT](LICENSE) © McKay Snell
