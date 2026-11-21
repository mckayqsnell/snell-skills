# Build note: {{project}}

Written by frontend-vibe on {{date}}. Build from this note. If it conflicts with your defaults, the note wins.

## Feel

{{The confirmed brief, word for word, with any "(default)" marks.}}

## Picks

| Pick | Job on this page | Install | Docs for agents |
| :- | :- | :- | :- |
| {{name}} | {{base / the alive thing / motion}} | `{{npm i ...}}` or {{CDN / copy the CSS / no library}} | {{llms.txt or .md link, or "none"}} |

{{Any "use only part of it" warning, e.g. "Geist: use the font and color tokens only; don't install @vercel/geistcn, it isn't public."}}

## Tokens

- **Fonts:** {{display face}} for {{where}}, {{text face}} for the rest. Load: {{how}}.
- **Colors:** background {{}}, surface {{}}, text {{}}, muted text {{}}, accent {{}} (used only for {{what}}). Each text color passes WCAG AA on its background. Light and dark: {{both / one}}.
- **Color format:** `oklch()` in CSS{{, with hex fallbacks for the old browsers in Limits}}. Any color passed to a shader, canvas or chart library also gets a hex copy: many of them can't read `oklch()`.
- **Shape:** radius {{px}}, borders {{style}}, shadows {{none / one level}}.
- **Space:** {{the base's own token names, or a scale like 4 8 12 16 24 40 64}}. Content width {{px}}.

## Page, section by section

1. **{{section}}**: {{what's in it}}. Effect: {{pick + settings, or "none"}}.

**The first 5 seconds:** {{what someone sees right after it loads. No empty boxes and no long preloader. Content shows before effects start.}}

**Empty state:** {{what it looks like when the real data is empty (count 0, no posts yet), or "none"}}.

**The alive thing** is {{one moment}}. Spend the most effort there. {{"Keep everything around it still so it stands out" for motion none or a little; "the rest can move, but smaller and faster" for a lot.}}

**Stand-ins:** {{what the owner will supply (photos, scans, copy, data)}}. Until then, build believable stand-ins ({{e.g. SVG film frames, a public sample model, simulated data}}), never a grey box. Mark each one `STAND-IN` in the code, and never state a stand-in as fact in the page's words.

## Motion

- {{amount and kind}}. Timing {{e.g. 150-250 ms on hovers}}, easing {{e.g. ease-out, or a spring}}.
- Reduced motion: {{what stops, and what replaces it}}.

## Limits that change the build

{{Only the ones that apply: old browsers, touch only, projector, who edits it, print, offline, sound off by default, no build step, shared data (where it lives, what stops spam), paid tools, file size.}}

## Avoid

- {{the user's own "not this" list}}
- {{3 or 4 tells from the catalog this page could fall into}}

## Check before calling it done

- [ ] Every section above is built, and nothing that isn't in the note was added.
- [ ] No console errors, and the content shows without waiting on an effect.
- [ ] It works on {{the real screens: a 390 px phone, an iPad, a projector at 1920x1080}}.
- [ ] Text passes WCAG AA contrast; focus is visible; it works with {{keyboard / touch}}.
- [ ] Reduced motion works as written above.
- [ ] {{a limit check, e.g. "prints one recipe per page", "under 300 kB of JS, gzipped, before the effect loads"}}
- [ ] Read the Feel again and look at the page. If it could be any other site, fix the alive thing first.
