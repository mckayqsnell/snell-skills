# Parts index (house style 1)

Classes and the smallest markup for each part. Copy from here instead of reading `template.html` (it is big because the fonts are packed in). See every part live in `house-style.html`.

## Page frame

```html
<html lang="en">
<html lang="en" data-width="full">   <!-- see below -->
<meta name="plan-file" content="plans/2026-10-19-topic.html">
<div class="wrap"><nav class="toc"><div class="label">Contents</div><ol id="toc-list"></ol></nav><main> … </main></div>
```

Keep the top bar with `.tag` and the `.gear` + `.style-pop` block from the template.

`data-width="full"` puts running text, callouts and figures on one edge, for a
page that is mostly drawings. Without it, text and callouts stop at `--measure`
(61ch) while figures fill `main`, so every drawing overhangs the paragraph
above it. Leave it off for a prose-led page: 61ch is the right measure for
reading, and the wider column runs about 90 characters a line.

## Sections

```html
<section id="goal" data-toc="Goal" data-fold="open">   <!-- or "closed"; data-hint="text" shows on the folded title -->
  <div class="part">Goal</div><h2>What we are building</h2>
  <p class="section-intro">One sentence.</p>
</section>
```

On Progress, `data-hint="auto"` fills the folded title with the counts.

## Header

`.part` (small label), `h1`, `.lede`, `.meta > span > b` (chips), `details.fold.why > summary + .fold-body > ol`.

## Notes

`.note.tip` (✓ good to know), `.note.warn` (! watch for this; also the "not advice" line), `.note.stop` (× hard rule). Start with `<b>Short title.</b>`.

## Tables

```html
<div class="table-box"><table class="fix cards"><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>…</td><td>…</td></tr></tbody></table></div>
```

`cards` turns rows into cards under 600 px.

**Files:** the same table with columns File / Change / Why. Put `<code>path:line</code>` in File and `<span class="chg new|mod|del">new|changed|gone</span>` in Change.

## Steps (S) and Phases (M, L)

```html
<ol class="steps">                       <!-- add "phases" for P1, P2 numbers -->
  <li class="step"><div class="step-body">
    <h3>Step name <span class="who">Claude</span></h3>
    <ul class="tight"><li>What happens.</li></ul>
    <div class="loop"><span>build</span><span>test</span><span>review</span></div>   <!-- phases only -->
    <p class="check-line"><b>Check</b>A command and what it must print.</p>
  </div></li>
</ol>
```

## Progress

```html
<div class="prog-group"><h3>Phase 1 · name<small></small></h3><ul class="prog">
  <li class="done"><div class="it">Item<span class="st">done</span></div><div class="nx">What proved it.</div><span class="tick" role="img" aria-label="done">…svg…</span></li>
</ul></div>
```

Row classes: `done`, `prov` (picked, not confirmed), `you` (waiting on the reader), `doing`, `todo`, `blocked`. Copy the tick SVGs from the template. The `<small>` counts fill themselves.

## Decisions + response panel

```html
<div class="decide"><div class="decide-grid">
  <div class="decisions">
    <div class="decision" id="d1">
      <div class="decision-head"><span class="decision-num">Decision</span><span class="decision-state">not looked at</span></div>
      <h4>The question?</h4><p>Context: what each choice costs.</p>
      <div class="opts">
        <label class="opt"><input type="radio" name="d1" value="Full text A" checked data-suggested><span class="oh"><span class="t">A</span><em class="sug">Suggested</em></span><small>Why.</small></label>
        <label class="opt"><input type="radio" name="d1" value="Full text B"><span class="oh"><span class="t">B</span></span><small>Trade-off.</small></label>
      </div>
      <details class="whyfold"><summary>Why I suggest this</summary><div class="wb"><p>Reason.</p><p><b>What would change my mind:</b> …</p></div></details>
      <textarea placeholder="Note (optional)" aria-label="Note for this decision"></textarea>
    </div>
  </div>
  <aside class="respond"> …copy the panel from the template unchanged… </aside>
</div></div>
```

Each decision needs its own `name` on the radios. The number, the state tag and the response text fill themselves. The response quotes the plan file from `<meta name="plan-file">`.

## Build split

`.split > .agent(.lead) > .role + h4 + .model + ul`. One lead, at most 3 sub-agents, each with its own files.

## Lists

`ul.notlist` (Not changing, Open questions), `dl.glossary` (dt/dd).

Sources (Research on plans, Sources on explain pages), as a folded section:

```html
<section id="sources" data-toc="Sources" data-fold="closed">
  <div class="part">Sources</div><h2>Where the facts come from</h2>
  <ul class="sources"><li>The finding, in one sentence.<span class="src"><a href="https://www.irs.gov/publications/p505">IRS Publication 505 (2026)</a></span></li></ul>
</section>
```

## Code

```html
<div class="codeblock"><div class="codeblock-head"><span>path/file.ts</span></div><pre>…escaped code…</pre></div>
```

Code that does not exist yet: put "(sketch)" in the head. Escape `<` as `&lt;`.

## Drawings

```html
<figure class="fig"><div class="fig-box"><svg viewBox="0 0 720 200" role="img" aria-label="What it shows" font-family="var(--font-body)">…</svg></div>
  <figcaption>What to notice.</figcaption><p class="swipe">Swipe sideways to see the whole drawing.</p></figure>
```

The page adds an Expand button to every drawing by itself. Add `data-span="wide"` to the `<figure>` to let it reach past the text on a big screen (up to 1000 wide in the SVG).

Class markers inside the SVG: `bx` box shape, `bt` box title, `gp` group frame, `gl` group label, `ed` an edge (`<g>` with the line path and the head path), `el` edge label. Copy examples from `house-style.html`.

Box: `<rect class="bx" x y width height rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>`.
Head: `<path d="M x y L … L … z" fill="var(--ink)"/>`, a 10 px triangle.
Halo on every label: `stroke="var(--halo, var(--surface))" stroke-width="4" paint-order="stroke" stroke-linejoin="round"`.

**Tones.** `class="tone-teal"` on a shape or `<g>` sets `--tone` (line) and `--tone-soft` (fill). Tones: `plain`, `accent`, `go`, `warn`, `teal`, `violet`, `ochre`, `rose`, `slate`. Write `fill="var(--tone-soft)" stroke="var(--tone)"` on the shapes inside.

Wider than 1000: use the viewer. Copy the `.vw` block from `house-style.html` and put the SVG inside `.vw-pan`.

### Moving data

Add `data-flow` to an edge's `<g class="ed">` (or to a `<path>`). Lit packets run along its line while the drawing is on screen.

```html
<g class="ed" data-flow="2" data-flow-speed="2.4"> <path d="M140 85H220" …/> <path d="…" fill="var(--ink)"/> </g>
```

`data-flow="2"`: 2 packets. `data-flow-speed`: seconds a trip (default 2.4). `data-flow-back`: run it the other way. For a path that is only a track, give it `stroke="none"`.

### Isometric 3D

Write positions in floor units. The page draws the faces, sorts them back to front, and adds the labels.

```html
<svg class="iso" data-iso="42 330 80" viewBox="0 0 990 620" role="img" aria-label="…" font-family="var(--font-body)">
  <g data-floor="-0.6 -0.6 17 8"/>                                          <!-- x0 y0 x1 y1 -->
  <g class="ed" data-edge="a-b" data-route="0.8,3.4 4.2,3.4" data-flow/>     <!-- points x,y on the floor, or x,y,z in the air -->
  <g data-node="a" class="tone-slate" data-box="0 2.6 1.6 1.6 0.6" data-label="Browser" data-sub="the user"/>   <!-- x y w d h -->
  <g data-node="b" class="tone-teal" data-box="3.4 2.6 1.6 1.6 1.2" data-z="0" data-label="API"/>              <!-- data-z lifts it -->
  <g data-node="db" class="tone-rose" data-cyl="6.8 2.6 1.6 1.3" data-label="Postgres"/>                       <!-- x y width h -->
  <text class="iso-lb" data-at="6.4 0 2.8">Any label</text>                                                    <!-- x y z -->
</svg>
```

`data-iso="unit originX originY"`: one floor cell is `unit` pixels wide; the origin is where floor point 0,0 lands. On screen, a bigger x moves right and down; a bigger y moves left and down. Keep 2 floor cells between blocks so labels don't land on a neighbor; if one still does, `data-label-dy="20"` lifts it 20 px (negative moves it down). A tone class on a route colors its line (`class="ed tone-warn"` for a rejected path). Most isometric maps are wider than 720: give the figure `data-span="wide"`. Check the drawing in the browser and move the origin until nothing is cut off.

### Scenes: press Play

A drawing with Play, Back and Next. Each `<li>` is one step. Without the script, and in print, the steps read as a numbered list.

```html
<figure class="fig scene" data-span="wide" data-intro="Press Play to follow one order.">
  <div class="fig-box"><svg …> shapes with data-node="…", edges with data-edge="…" </svg></div>
  <ol class="scene-steps">
    <li data-edge="a-b" data-from="a" data-node="b">The browser sends the order to the API.</li>
    <li data-edge="a-b" data-back data-from="b" data-node="a">The API answers.</li>
    <li data-show="#cache">A cache appears in front of the API.</li>
  </ol>
  <figcaption>What to notice.</figcaption>
</figure>
```

- `data-edge`: the edge the packet runs along. `data-back`: the other way.
- `data-from`: the part that lights up while the packet moves. `data-node`: the part that lights up when it lands. Both take one or more names.
- `data-show`: shapes to show from this step on. Give those shapes `class="reveal"` so they start hidden.
- Works on flat and isometric drawings.
- Leave `data-flow` off a scene's edges. Those packets would run before Play; during Play they only dim.

### Linked words

The same `data-hl` key on a word and on a shape lights up both when the reader points at either one.

```html
<p>Reads go to the <span data-hl="cache">cache</span> first.</p>
<svg …><g data-hl="cache"> …the cache box… </g></svg>
```

## Explain parts

Start from `explain-template.html`. It is a starter, not a layout: pick the parts the topic needs, in the order that teaches best.

```html
<div class="layers">                                     <!-- ELI5: for the core ideas only -->
  <div class="layer pic"><span class="lk">Picture it</span><p>An everyday picture.</p></div>
  <div class="layer real"><span class="lk">The real thing</span><p>The real term, in plain words.</p></div>
  <div class="layer breaks"><span class="lk">Where the picture breaks</span><p>One way the picture is wrong.</p></div>
</div>
<p class="vocab"><dfn>TTL</dfn>What it means, in one line.</p>
<div class="idea"><b>Bigger idea</b>How this ties to something that holds elsewhere too.</div>
<div class="pair"><div><h4>A</h4><p>…</p></div><div><h4>B</h4><p>…</p></div></div>
<div class="worked"><b>Example title</b><ol><li>Step with real numbers.</li></ol><p class="res">The result.</p></div>
<ol class="recap"><li>One takeaway, one sentence.</li></ol>
```

**Questions you might have.** Near the end, after the recap: 4–8 questions a sharp reader would ask next (an edge case, "why not X?", what breaks). Each is a `<details class="q">` that opens to a short answer and one evidence line: a `path:line` or a source link (a pointer to a drawing only on top of one). No input boxes.

```html
<section id="questions" data-toc="Questions" data-fold="open">
  <div class="part">Questions</div><h2>Questions you might have</h2>
  <div class="qs">
    <details class="q"><summary>What if the worker crashes halfway through?</summary>
      <div class="q-a"><p>The answer, in 1–3 sentences.</p><p class="q-ev"><b>Evidence</b><code>src/worker.ts:42</code></p></div></details>
  </div>
</section>
```

In print and in the PDF every question shows open.

**PDF:** `kit/html-to-pdf.sh page.html` writes `page.pdf` next to it, in the light theme, with folded sections and questions opened, and a plan's answer boxes left out.
