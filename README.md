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

This gives you the skills only. If the plugin ever adds commands or hooks
(Claude Code-only parts), you would need the plugin path for those.

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

This gives you every skill. Plugin skills get a name prefix, for example
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
| tools | [to-markdown](skills/tools/to-markdown/SKILL.md) | Converts PDFs, Office files, images, audio and more into Markdown. |

## Repo layout

```text
.claude-plugin/
  plugin.json        the plugin manifest (name, version, where skills live)
  marketplace.json   the catalog that lists the plugin
skills/<group>/<name>/SKILL.md   one folder per skill, grouped
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
