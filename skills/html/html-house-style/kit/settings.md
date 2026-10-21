# settings.md (house style 1 defaults)

The defaults every html-* skill reads, picked in a design bake-off (Oct 2026). The setup wizard (`/setup-snell-skills`, coming later) writes your own copy. A copy in the project wins over your user copy, and your user copy wins over this file.

```yaml
version: 1

look:
  colors: burnt-sienna          # round 1, pick B
  fonts: source                 # round 2, pick E: Adobe Source fonts, packed in as Snell Serif + Snell Sans + Snell Mono (87 KB)
  density: default              # round 3, pick B: 17 px, line height 1.6, 61 ch; the reader can change it in the gear
  motion: highlight             # round 7, pick B: 180 ms fades, one pulse on the next decision, smooth jumps; still under reduced motion

drawings:
  own_pages: sketch             # round 5: Rough.js, roughness 1, bowing 1, solid fill, 1.5 px lines, seed 7, hand font on edge labels
  customer_pages: clean         # round 5, pick E1: plain SVG, 8 px corners, filled arrowheads; no Rough.js in the page
  viewer: map                   # round 6, pick V3 on our own engine: zoom, pan, fullscreen, mini overview, for drawings wider than 1000
  methods:                      # round 4b: hand-written SVG wins every kind today
    flow: svg
    system_map: svg             # weak spot: try a browser-drawn method once Playwright is installed (decision 35)
    before_after: svg
    sequence: svg
    timeline: svg

page_parts:                     # round 8
  decision_card: why-fold       # V3
  note: icon                    # V3
  table: cards-on-phone         # V3, under 600 px
  contents: rail                # V1 on desktop; sticky top bar under 900 px
  response: side-panel          # V3, open by default, folds down to just Copy
  style_panel: gear             # V1

vocab:
  standard: plain-language      # round 9: plainlanguage.gov style. Other option: ste-lite
  level: 80                     # a floor, checked with vocab-check.mjs; never a target

plans:                          # round 10
  sizes: [below-s, s, m, l]     # below S: no page, a ready-to-paste prompt
  s_or_m: one-session           # S if one session builds it, even with 2-3 choices
  where: plans/                 # in the project; check it is ignored or meant to be committed

explain:                        # html-explain
  reader: me                    # for:"…" on a run writes for someone else
  where: explain/               # in the current folder; keep saves to keep_dir instead
  keep_dir: ${MY_SKILLS_KNOWLEDGE_DIR}   # set the variable in your shell profile; never a hard-coded path
  layers: core-ideas            # ELI5 layers on the 1-3 core ideas, not every section

models:
  lead: latest Opus, medium
  builder: latest Sonnet, medium
  max_subagents: 3
```
