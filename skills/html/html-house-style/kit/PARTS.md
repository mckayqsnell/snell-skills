# Parts index (house style 1)

Classes and the smallest markup for each part. Copy from here instead of reading `template.html` (it is big because the fonts are packed in). See every part live in `house-style.html`.

## Page frame

```html
<html lang="en" data-drawings="sketch">            <!-- "clean" for customer pages -->
<html lang="en" data-drawings="sketch" data-width="full">   <!-- see below -->
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
<section id="sources" data-toc="Sources" data-fold="closed" data-no-unclear>
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

Class markers inside the SVG: `bx` box shape, `bt` box title, `gp` group frame, `gl` group label, `ed` an edge (`<g>` with the line path and the head path), `el` edge label (drawn in the hand font in the sketch look).

Box: `<rect class="bx" x y width height rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>`.
Head: `<path d="M x y L … L … z" fill="var(--ink)"/>`, a 10 px triangle.
Halo on every label: `stroke="var(--halo, var(--surface))" stroke-width="4" paint-order="stroke" stroke-linejoin="round"`.

Wider than 1000: use the viewer. Copy the `.vw` block from `house-style.html` and put the SVG inside `.vw-pan`.

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

**What's still unclear?** Copy the `.unclear` block from `explain-template.html` unchanged, in the last section. The page script adds one note field for every other section. Put `data-no-unclear` on a section to leave it out (the glossary, say). The copied Markdown names the page from `<meta name="page-file">`.

**PDF:** `kit/html-to-pdf.sh page.html` writes `page.pdf` next to it, in the light theme, with folded sections opened and the boxes for answers left out.
