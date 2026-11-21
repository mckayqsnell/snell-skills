# Build note: {{project}}

Written by frontend-vibe on {{date}}. Build from this note. If it conflicts with your defaults, the note wins.

## Feel

{{The confirmed brief, word for word.}}

## Picks

| Pick | Job on this page | Install | Docs for agents |
| :- | :- | :- | :- |
| {{name}} | {{base / the alive thing / motion}} | `{{npm i ...}}` | {{llms.txt or .md link, or "none"}} |

## Tokens

- **Fonts:** {{display face}} for {{where}}, {{text face}} for everything else. Load them this way: {{how}}.
- **Colors** (`oklch`): background {{}}, surface {{}}, text {{}}, muted text {{}}, accent {{}} (used only for {{what}}). Light and dark: {{both / light only / dark only}}.
- **Shape:** radius {{px}}, borders {{style}}, shadows {{none / one level / style}}.
- **Space:** {{scale, e.g. 4 8 12 16 24 40 64}}. Content width {{px}}.

## Page, section by section

1. **{{section}}**: {{what's in it}}. Effect: {{pick + settings, or "none"}}.
2. ...

The alive thing is **{{one moment}}**. Spend the effort there. Keep everything around it quiet so it stands out.

## Motion

- Level: {{none / a little / a lot / whole page}}.
- Timing: {{e.g. 150-250 ms for hovers, springs for drags}}. Easing: {{}}.
- `prefers-reduced-motion`: {{what stops, and what replaces it}}.

## Avoid

- {{the user's own "not this" list}}
- {{the tells from the catalog that this page is most likely to fall into}}

## Check before calling it done

- [ ] Every section above is built, and nothing that isn't in the note was added.
- [ ] It loads with no console errors, and the main content shows without waiting on an effect.
- [ ] It works on a 390 px wide phone and on a desktop.
- [ ] Text passes WCAG AA contrast.
- [ ] Keyboard focus is visible, and everything clickable works with the keyboard.
- [ ] Reduced motion works as written above.
- [ ] {{a speed limit, e.g. "under 300 kB of JS before the effect loads"}}
- [ ] It matches the Feel. Read the brief again and look at the page. If it could be any other site, fix the alive thing first.
