<p>
  <a href="https://github.com/mckayqsnell/snell-skills">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.svg">
      <img alt="Snell Skills" src="assets/banner-light.svg" width="600">
    </picture>
  </a>
</p>

# Snell Skills

[![skills.sh](https://skills.sh/b/mckayqsnell/snell-skills)](https://skills.sh/mckayqsnell/snell-skills)

My agent skills for turning plans and hard ideas into pages I actually want to read.

Agents write walls of Markdown. I skim them, miss the one decision that mattered, and find out later. These skills make the agent draw it out instead: one page with a picture, the choices laid out, and a box that turns my picks into one reply I paste back.

Every page is one offline HTML file. It has the same look every time, works on a phone, and prints to a PDF that matches it.

> **Private for now.** The install commands below only work for people with read access to this repo on GitHub, with git set up to reach it (an SSH key, or `gh auth login` then `gh auth setup-git`).

## Installation (30-second setup)

A plugin updates itself. `npx skills` copies editable files into your project or home folder, and you update them by hand. Pick one per agent: installing both gives you every skill twice.

### 1. Get the skills

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude plugin marketplace add mckayqsnell/snell-skills
```

```bash
claude plugin install snell-skills@snell-skills
```

Or, inside a session: `/plugin marketplace add mckayqsnell/snell-skills`, then `/plugin install snell-skills@snell-skills`.

To get updates without asking, open `/plugin`, go to **Marketplaces**, pick `snell-skills` and choose **Enable auto-update** (it is off by default for marketplaces other than Anthropic's). Without it, run `claude plugin update snell-skills@snell-skills`.

Plugin skills get a name prefix: `/snell-skills:html-plan`.

</details>

<details>
<summary><strong>Codex</strong></summary>

```bash
codex plugin marketplace add mckayqsnell/snell-skills
```

```bash
codex plugin add snell-skills@snell-skills
```

</details>

<details>
<summary><strong>GitHub Copilot</strong> (CLI)</summary>

```bash
copilot plugin marketplace add mckayqsnell/snell-skills
```

```bash
copilot plugin install snell-skills@snell-skills
```

</details>

<details>
<summary><strong>Gemini CLI</strong> (manual updates)</summary>

```bash
gemini skills install https://github.com/mckayqsnell/snell-skills.git --path skills/html
```

```bash
gemini skills install https://github.com/mckayqsnell/snell-skills.git --path skills/tools
```

Re-run both commands to update.

</details>

<details>
<summary><strong>Any other agent, or editable files</strong> (manual updates)</summary>

```bash
npx skills@latest add mckayqsnell/snell-skills
```

The [skills CLI](https://github.com/vercel-labs/skills) asks which skills and which agents you want (Cursor, OpenCode, Windsurf, Amp and more), then copies them into each agent's skills folder. Add `-g` to install for your user instead of this project, or `-a <agent>` to skip the question. To update, run `npx skills@latest update`; re-run `add` to pick up new skills.

Each html skill carries its own copy of the kit, so you can install just one.

</details>

### 2. Try one

In your agent:

- `/html-plan add dark mode to the settings page`: it sizes the job, asks a few questions, then writes the plan page.
- `/html-explain how Redis caching works`: a page that teaches it. Add `for:"my dad"` to write it for someone else, or `keep` to save it with a PDF.

To use `keep`, set `MY_SKILLS_KNOWLEDGE_DIR` in your shell profile to the folder where kept pages should go.

### 3. That's it.

## The skills

| Skill | What it does |
| :- | :- |
| [html-plan](skills/html/html-plan/SKILL.md) | Plans a coding job as one page. Sizes the job first (below S, S, M, L), so a tiny job gets a ready-to-paste prompt and a big one gets phases, a build split and risks. You pick the decisions and paste one answer back. |
| [html-explain](skills/html/html-explain/SKILL.md) | Explains a topic as one page that teaches it: a picture first, then the real thing, then where the picture breaks. Ends with a recap, a glossary and a "what's still unclear?" box. |
| [html-house-style](skills/html/html-house-style/SKILL.md) | The shared look, for any other page you want to read: colors, fonts, page parts, sketch-style drawings, a drawing viewer and a reply box. |
| [to-markdown](skills/tools/to-markdown/SKILL.md) | Converts PDFs, Office files, images, audio and more into Markdown. |

## What a page has

- **One file, offline.** Fonts and scripts are packed in. No CDNs, nothing to install to read it.
- **Light and dark, phone and desktop.** A gear switches theme, text size and drawing style.
- **Drawings that look hand-made.** Agents write plain SVG; the page draws it in a sketch style (customer pages stay clean). Big drawings get zoom, pan and a mini map.
- **One reply to paste back.** Decisions sit next to a panel that builds your answer as you pick, and quotes your notes so the agent reads them as feedback, not orders.
- **Plain words.** A built-in checker scores the writing; the skills aim for level 80 or better.

## Repo layout

```text
.claude-plugin/      plugin.json and marketplace.json
skills/<group>/<name>/SKILL.md   one folder per skill
skills/html/*/kit/   built copies of the house-style kit (never edit by hand)
kit-src/             the kit's sources: the only place to edit it
scripts/             version sync, kit sync and the check suite
assets/              the banner
.changeset/          pending release notes
```

## Working on it

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to make a change, rebuild the kit and pick a version bump, and [docs/how-it-works.md](docs/how-it-works.md) for how installs, releases, the kit sync and the CI safety settings work.

## License

[MIT](LICENSE) © McKay Snell. The kit packs in the Source fonts (SIL Open Font License, see `kit/FONTS-LICENSE.txt`) and Rough.js (MIT, see `kit/ROUGH-LICENSE.txt`). The banner lettering is traced from [Parisienne](https://github.com/google/fonts/tree/main/ofl/parisienne) by Astigmatic (SIL Open Font License).
