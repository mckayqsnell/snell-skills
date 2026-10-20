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
`/snell-skills:html-plan`.

To get updates without asking each time, open `/plugin`, go to
**Marketplaces**, pick `snell-skills` and choose **Enable auto-update**.
Auto-update is off by default for marketplaces other than Anthropic's.
Without it, run `claude plugin update snell-skills@snell-skills`. You only
get a new copy when the plugin's version changes, which happens on each
release.

## Skills

| Group | Skill | What it does |
| :- | :- | :- |
| html | [html-plan](skills/html/html-plan/SKILL.md) | Plans a coding job as one page: it sizes the job, asks a few questions, then you pick the decisions and paste one answer back. |
| html | [html-explain](skills/html/html-explain/SKILL.md) | Explains a topic as one page that teaches it: a picture first, then the real thing, then where the picture breaks. Can save a PDF. |
| html | [html-house-style](skills/html/html-house-style/SKILL.md) | The shared look for any other page you want to read: colors, fonts, parts, sketch drawings and a reply box. |
| tools | [to-markdown](skills/tools/to-markdown/SKILL.md) | Converts PDFs, Office files, images, audio and more into Markdown. |

The three html skills share one look. Each carries its own copy of the kit
(`kit/`: templates, rules, scripts), so each works when you install it alone.
Pages are single offline files: fonts and scripts are packed in.

## Repo layout

```text
.claude-plugin/
  plugin.json        the plugin manifest (name, version, where skills live)
  marketplace.json   the catalog that lists the plugin
skills/<group>/<name>/SKILL.md   one folder per skill, grouped
skills/html/*/kit/   built copies of the house-style kit (never edit by hand)
kit-src/             the kit's sources: the only place to edit it
scripts/             version sync, kit sync and the check suite
.changeset/          pending release notes (see CONTRIBUTING.md)
```

## Working on it

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a change and pick a
version bump, and [docs/how-it-works.md](docs/how-it-works.md) for how
installs, releases and the CI safety settings work.

## License

[MIT](LICENSE) © McKay Snell
