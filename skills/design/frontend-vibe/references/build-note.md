# Build note: {{project}}

Written by frontend-vibe on {{date}}. Build from this note. If it conflicts with your defaults, the note wins. Keep it to about 600 words plus the brief: bullets, not paragraphs.

## Feel

{{The confirmed brief, word for word.}}

## Picks

| Pick | Job on this page | Install | Docs for agents |
| :- | :- | :- | :- |
| {{name}} | {{base / the alive thing / motion}} | `{{npm i ...}}` or {{CDN / copy the CSS}} | {{llms.txt or .md link, or "none"}} |

## Tokens

- **Fonts:** {{display face}} for {{where}}, {{text face}} for the rest. Load: {{how}}.
- **Colors:** background, surface, text, muted text, accent (used only for {{what}}). Write them in `oklch()`, with hex fallbacks if Limits names old browsers. Light and dark: {{both / one}}.
- **Shape:** radius {{px}}, borders {{style}}, shadows {{none / one level}}.
- **Space:** {{scale, e.g. 4 8 12 16 24 40 64}}. Content width {{px}}.

## Page, section by section

1. **{{section}}**: {{what's in it}}. Effect: {{pick + settings, or "none"}}.

**The first 5 seconds:** {{what someone sees right after it loads. No empty boxes, no long preloader: live views start part-way full, and effects start after the content shows.}}

The alive thing is **{{one moment}}**. Spend the effort there, and keep what's around it quiet.

**Content the owner supplies:** {{scans, photos, copy, data}}. Until it arrives, build a believable stand-in ({{e.g. an SVG handwritten card, a public sample model, simulated data}}), so the alive thing can be judged now. Never ship a grey "placeholder" box in its place.

## Motion

- {{amount and kind}}. Timing {{e.g. 150-250 ms hovers}}, easing {{}}.
- `prefers-reduced-motion`: {{what stops, and what replaces it}}.

## Limits that change the build

Only the ones that apply: {{old browsers, touch only, projector, print styles, offline, sound off by default, no build step, shared data (where it lives, what stops spam), paid tools, file size}}.

## Avoid

- {{the user's own "not this" list}}
- {{3 or 4 tells from the catalog this page could fall into}}

## Check before calling it done

- [ ] Every section above is built, and nothing that isn't in the note was added.
- [ ] No console errors, and the content shows without waiting on an effect.
- [ ] It works on {{the real screens: phone, iPad, projector at 1920x1080...}}.
- [ ] Text passes WCAG AA contrast; focus is visible; it works with {{keyboard / touch}}.
- [ ] Reduced motion works as written above.
- [ ] {{a limit check, e.g. "prints on one page per recipe", "under 300 kB of JS, gzipped, before the effect loads"}}
- [ ] Read the Feel again and look at the page. If it could be any other site, fix the alive thing first.
