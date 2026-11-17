# settings.md (house style 1 defaults)

The defaults every html-* skill reads, picked in a design bake-off (Oct 2026). To change one, copy this file to your project or user folder and edit the copy. A copy in the project wins over your user copy, and your user copy wins over this file.

```yaml
version: 1

look:
  colors: burnt-sienna          # round 1, pick B
  fonts: source                 # round 2, pick E: Adobe Source fonts, packed in as Snell Serif + Snell Sans + Snell Mono (94.0 KB)
  density: default              # round 3, pick B: 17 px, line height 1.6, 61 ch; the reader can change it in the gear
  motion: highlight             # round 7, pick B: 180 ms fades, one pulse on the next decision, smooth jumps; still under reduced motion

drawings:
  method: svg                   # 1.1: hand-written SVG only; Rough.js, Mermaid and three.js are not used
  default_3d: isometric         # svg.iso: blocks, cylinders and routes in floor units
  motion: ambient               # packets run while on screen; scenes wait for Play; still for reduced motion and print
  hues: 3                       # at most 3 hues in one drawing: teal, violet, ochre, rose, slate (plus accent, go, warn)
  wide: 1000                    # data-span="wide" drawings can be up to 1000 wide; the page reaches up to 1400 px
  viewer: map                   # round 6, pick V3 on our own engine: zoom, pan, fullscreen, mini overview, for drawings wider than 1000
  expand: every-drawing         # every drawing gets an Expand button; on a phone, wide ones show whole with "Tap to expand"

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
  reader: engineer              # 1.2: everyday software words (app, ticket, deploy) count as common; define only real jargon.
                                #      general: for a non-technical reader (for:"…"); put <meta name="vocab-reader" content="general"> in that page

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
