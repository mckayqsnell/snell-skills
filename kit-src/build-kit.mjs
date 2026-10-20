// build-kit.mjs: builds the house-style kit from the sources in this folder (kit-src/).
// The kit is what skills read: template.html, explain-template.html, house-style.html,
// tokens.css, HOUSE-STYLE.md, PARTS.md, settings.md, the scripts and the license notices.
//
// Don't run this by hand to update the skills. Run `pnpm run kit` (scripts/sync-kit.mjs):
// it builds into a scratch folder, then copies the result into every skill that ships a kit.
//
// As a module: buildKit(outDir) writes the kit into outDir, which must be an empty folder.
// The output is the same, byte for byte, every time the sources are the same (no dates, no random parts).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLOW, BEFORE_AFTER, MAP, SEQUENCE, TIMELINE, BIG } from './drawings.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { throw new Error(`build-kit: cannot read ${path.relative(HERE, p)} (${e.code || e.message})`); } };

const fonts = read(path.join(HERE, 'fonts.css'));
const tokens = read(path.join(HERE, 'tokens.css'));
const css = read(path.join(HERE, 'kit.css'));
const js = read(path.join(HERE, 'kit.js'));
const rough = read(path.join(HERE, 'rough.mjs')).replace(/export\s*\{\s*\w+\s+as\s+default\s*\}\s*;?\s*$/, '');
const roughVar = (rough.match(/export\s*\{\s*(\w+)\s+as\s+default/) || read(path.join(HERE, 'rough.mjs')).match(/export\s*\{\s*(\w+)\s+as\s+default/) || [])[1];
if (!roughVar) throw new Error('build-kit: could not find the default export in rough.mjs; check the Rough.js bundle');
const roughScript = `<script>/* Rough.js 4.6.6 (MIT, Preet Shihn) for the sketch look. Leave it out on customer pages. */\n(function(){${rough}\nwindow.rough=${roughVar};})();</script>`;
const VERSION = '1';

const head = (title, { drawings = 'sketch', planFile = '' } = {}) => `<!doctype html>
<html lang="en" data-drawings="${drawings}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="data:,">
<title>${title}</title>
${planFile ? `<meta name="plan-file" content="${planFile}">\n` : ''}<!-- House style ${VERSION} (snell-skills). One file, works offline: fonts and scripts are packed in. -->
<style>
${fonts}
${tokens}
${css}
</style>
</head>
<body>
`;
const foot = (withRough = true) => `${withRough ? roughScript + '\n' : ''}<script>\n${js}\n</script>\n</body>\n</html>\n`;

export function buildKit(OUT) {
  if (typeof OUT !== 'string' || !path.isAbsolute(OUT)) throw new Error(`build-kit: outDir must be an absolute path (got ${JSON.stringify(OUT)})`);
    let existing;
    try { existing = fs.readdirSync(OUT); } catch (e) { throw new Error(`build-kit: outDir ${OUT} is not a readable folder (${e.code || e.message})`); }
    if (existing.length) throw new Error(`build-kit: outDir ${OUT} must be empty; it holds ${existing.length} entries`);

  // ---------- template.html ----------
  const tb = read(path.join(HERE, 'template-body.html'));
  fs.writeFileSync(path.join(OUT, 'template.html'), head('{{TITLE}}', { planFile: '{{plans/YYYY-MM-DD-topic.html}}' }) + tb + '\n' + foot());

  // ---------- explain-template.html (a starter, not a fixed layout) ----------
  const eb = read(path.join(HERE, 'explain-body.html'));
  const GEAR_MARK = '{{GEAR: keep the gear block from template.html as it is}}';
  if (!eb.includes(GEAR_MARK)) throw new Error('build-kit: explain-body.html lost its gear placeholder');
  const gearBlock = tb.slice(tb.indexOf('<button type="button" class="gear"'), tb.indexOf('</div>\n    </div>\n\n    <!-- HEADER') + 6);
  if (!gearBlock.startsWith('<button')) throw new Error('build-kit: could not find the gear block in template-body.html');
  fs.writeFileSync(path.join(OUT, 'explain-template.html'), head('{{TOPIC}}', { planFile: '' }).replace('<title>{{TOPIC}}</title>', '<title>{{TOPIC}}</title>\n<meta name="page-file" content="{{explain/topic.html}}">') + eb.replace(GEAR_MARK, gearBlock) + '\n' + foot());

  // ---------- house-style.html ----------
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let n = 0;
  const demo = (title, html, note = '') => { n++; return `<h3 style="margin-top:34px">${title}</h3>${note ? `<p style="margin-top:6px">${note}</p>` : ''}
  <div class="hs-live">${html}</div>
  <details class="fold hs-code"><summary>Code</summary><div class="fold-body"><div class="codeblock" style="margin:0"><div class="codeblock-head"><span>${title}</span><button type="button" class="btn-sm" data-copy="#src-${n}">Copy</button></div><pre id="src-${n}">${esc(html.trim())}</pre></div></div></details>`; };
  const fig = (svg, cap) => `<figure class="fig" style="margin:0"><div class="fig-box">${svg}</div><figcaption>${cap}</figcaption><p class="swipe">Swipe sideways to see the whole drawing.</p></figure>`;
  const viewer = (svg, label) => `<div class="vw" tabindex="0" role="group" aria-roledescription="drawing viewer" aria-label="${label}. Plus and minus zoom, arrow keys pan, 0 resets, F for fullscreen, Escape leaves it.">
  <div class="vw-bar" role="toolbar" aria-label="Drawing controls"><button type="button" data-act="out" aria-label="Zoom out (-)" title="Zoom out (-)"><span aria-hidden="true">−</span></button><output class="vw-zoom">100%</output><button type="button" data-act="in" aria-label="Zoom in (+)" title="Zoom in (+)"><span aria-hidden="true">+</span></button><button type="button" data-act="reset" aria-label="Reset view (0)" title="Reset view (0)"><span aria-hidden="true">↺</span></button><button type="button" data-act="actual" aria-label="Actual size" title="Actual size"><span aria-hidden="true">1:1</span></button><button type="button" data-act="full" aria-label="Fullscreen (F)" title="Fullscreen (F)"><span aria-hidden="true">⛶</span></button></div>
  <div class="vw-stage"><div class="vw-pan">${svg}</div></div>
  <div class="vw-foot"><button type="button" class="vw-maptoggle" data-act="map" aria-expanded="true">▾ Hide overview</button><div class="vw-map" aria-hidden="true"><div class="vw-map-view"></div></div></div>
  <p class="vw-hint">Click the drawing, then arrows, + and −, 0 to reset. Ctrl or Cmd + wheel zooms. A plain wheel scrolls the page.</p>
  </div>`;

  const tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const T = {
    done: tick, prov: tick.replace('stroke-width="2.6"', 'stroke-width="2" opacity=".55"'),
    you: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
    doing: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18" cy="12" r="1.8" fill="currentColor"/></svg>',
    blocked: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>', todo: ''
  };
  const ST = { done: 'done', prov: 'provisional', you: 'your move', doing: 'in progress', blocked: 'blocked', todo: 'not started' };
  const row = (s, it, nx) => `  <li class="${s}"><div class="it">${it}<span class="st">${ST[s]}</span></div>${nx ? `<div class="nx">${nx}</div>` : ''}<span class="tick" role="img" aria-label="${ST[s]}">${T[s]}</span></li>`;
  const prog = `<div class="prog-group"><h3>Phase 1 · Login<small></small></h3><ul class="prog">
  ${row('done', 'Login page rebuilt', 'Proved by: npm test, 14 of 14 pass; checked light, dark and 390 px.')}
  ${row('prov', 'Color theme picked', 'The agent picked; the owner has not confirmed.')}
  ${row('you', 'Choose the API version', 'Decision 1 below.')}
  ${row('doing', 'Write the tests', '3 of 7 written.')}
  ${row('blocked', 'Deploy to staging', 'Waiting for access to the staging server.')}
  ${row('todo', 'Write the release notes', '')}
  </ul></div>`;
  const notes = `<div class="note tip"><b>Good to know.</b> The page works offline.</div>
  <div class="note warn"><b>Watch for this.</b> Wide tables turn into cards on a phone.</div>
  <div class="note stop"><b>Hard rule.</b> No customer data in pages that leave our machines.</div>`;
  const table = `<div class="table-box" style="margin:0"><table class="fix cards">
    <thead><tr><th>#</th><th>Part</th><th>Size</th><th>Check</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Colors and fonts</td><td>2 KB</td><td>Contrast script passes</td></tr>
      <tr><td>2</td><td>Response panel</td><td>3 KB</td><td>Notes quoted with &gt;</td></tr>
    </tbody>
  </table></div>`;
  const files = `<div class="table-box" style="margin:0"><table class="fix cards">
    <thead><tr><th>File</th><th>Change</th><th>Why</th></tr></thead>
    <tbody>
      <tr><td><code>src/auth/login.ts:42</code></td><td><span class="chg mod">changed</span></td><td>Calls the new session check.</td></tr>
      <tr><td><code>src/auth/session.ts</code></td><td><span class="chg new">new</span></td><td>Holds the session rules in one place.</td></tr>
      <tr><td><code>src/auth/legacy-cookie.ts</code></td><td><span class="chg del">gone</span></td><td>Nothing calls it after this change.</td></tr>
    </tbody>
  </table></div>`;
  const steps = `<ol class="steps" style="margin:0">
    <li class="step"><div class="step-body"><h3>Add the session module <span class="who">Claude</span></h3><ul class="tight"><li>Move the cookie rules into <code>src/auth/session.ts</code>.</li></ul><p class="check-line"><b>Check</b><code>npm test -- session</code> prints 6 passed.</p></div></li>
    <li class="step"><div class="step-body"><h3>Switch the login page <span class="who">Claude</span></h3><ul class="tight"><li>Login calls the new module.</li></ul><p class="check-line"><b>Check</b>Sign in on the dev server; the session survives a reload.</p></div></li>
  </ol>`;
  const phases = `<ol class="steps phases" style="margin:0">
    <li class="step"><div class="step-body"><h3>Sessions <span class="who">sub-agent 1</span></h3><ul class="tight"><li>New session module and its tests.</li></ul><div class="loop"><span>build</span><span>test</span><span>review</span></div><p class="check-line"><b>Check</b>All auth tests pass. The lead reviews the diff.</p></div></li>
    <li class="step"><div class="step-body"><h3>Pages <span class="who">sub-agent 2</span></h3><ul class="tight"><li>Login and sign-out use the module.</li></ul><div class="loop"><span>build</span><span>test</span><span>review</span></div><p class="check-line"><b>Check</b>Playwright: sign in, reload, sign out. No console errors.</p></div></li>
  </ol>`;
  const split = `<div class="split" style="margin:0">
    <div class="agent lead"><span class="role">Lead</span><h4>Plan + checks</h4><span class="model">latest Opus · medium</span><ul><li>Owns the plan and runs every Check line.</li></ul></div>
    <div class="agent"><span class="role">Sub-agent 1</span><h4>Sessions</h4><span class="model">latest Sonnet · medium</span><ul><li><code>src/auth/session.ts</code></li><li>its tests</li></ul></div>
    <div class="agent"><span class="role">Sub-agent 2</span><h4>Pages</h4><span class="model">latest Sonnet · medium</span><ul><li><code>src/pages/login.tsx</code></li></ul></div>
  </div>`;
  const code = `<div class="codeblock" style="margin:0"><div class="codeblock-head"><span>src/auth/session.ts (sketch)</span></div><pre>export function isValid(s: Session, now = Date.now()) {
    return s.expiresAt &gt; now;
  }</pre></div>`;
  const notChanging = `<ul class="notlist" style="margin:0"><li>The sign-up flow.</li><li>The password rules.</li><li>The database schema.</li></ul>`;
  const research = `<ul class="sources" style="margin:0"><li>Sessions expire after 30 days today, not 14 as the docs say.<span class="src">src/auth/legacy-cookie.ts:18</span></li><li>The framework sets SameSite=Lax by default.<span class="src">framework docs, "Cookies" page</span></li></ul>`;
  const decision = `<div class="decide" style="margin:0"><div class="decide-grid">
    <div class="decisions">
      <div class="decision" id="d1">
        <div class="decision-head"><span class="decision-num">Decision</span><span class="decision-state">not looked at</span></div>
        <h4>Where does the shared page template live?</h4>
        <p>Every skill builds pages from the same template. We can keep one copy or give each skill its own.</p>
        <div class="opts">
          <label class="opt"><input type="radio" name="d1" value="One shared copy" checked data-suggested><span class="oh"><span class="t">One shared copy</span><em class="sug">Suggested</em></span><small>Fix it once and every skill gets the fix.</small></label>
          <label class="opt"><input type="radio" name="d1" value="A copy inside each skill"><span class="oh"><span class="t">A copy inside each skill</span></span><small>Each works alone. Copies can drift.</small></label>
        </div>
        <details class="whyfold"><summary>Why I suggest this</summary><div class="wb"><p>Only one file to keep right. Copies drift apart.</p><p><b>What would change my mind:</b> one skill must work with nothing else installed.</p></div></details>
        <textarea placeholder="Note (optional)" aria-label="Note for this decision"></textarea>
      </div>
      <div class="decision" id="d2">
        <div class="decision-head"><span class="decision-num">Decision</span><span class="decision-state">not looked at</span></div>
        <h4>Should the response panel start open?</h4>
        <div class="opts">
          <label class="opt"><input type="radio" name="d2" value="Open" checked data-suggested><span class="oh"><span class="t">Open</span><em class="sug">Suggested</em></span><small>You see the answer build as you pick.</small></label>
          <label class="opt"><input type="radio" name="d2" value="Folded to Copy"><span class="oh"><span class="t">Folded to Copy</span></span><small>Less on screen. One tap shows it.</small></label>
        </div>
        <textarea placeholder="Note (optional)" aria-label="Note for this decision"></textarea>
      </div>
    </div>
    <aside class="respond" aria-label="Your answers">
      <div class="respond-head"><h3>Your answers</h3><button type="button" class="fold-r" aria-expanded="true">Fold</button></div>
      <p class="respond-help">Updates as you pick. Copy it and paste it back to the agent.</p>
      <button type="button" class="todo-btn" hidden></button>
      <pre id="response-text"></pre>
      <textarea id="response-notes" placeholder="Anything else? (optional)" aria-label="Other notes"></textarea>
      <button type="button" class="btn-dark" id="response-copy">Copy response</button>
    </aside>
  </div></div>`;
  const layers = `<div class="layers" style="margin:0">
    <div class="layer pic"><span class="lk">Picture it</span><p>A cache is the sticky note on your monitor: the phone number you look up ten times a day.</p></div>
    <div class="layer real"><span class="lk">The real thing</span><p>A cache keeps a copy of slow-to-get data in fast memory, so the next read skips the slow trip.</p></div>
    <div class="layer breaks"><span class="lk">Where the picture breaks</span><p>A sticky note never goes stale on its own. A cache copy can: the real number changes and the note does not.</p></div>
  </div>`;
  const vocab = `<p class="vocab" style="margin:0"><dfn>TTL</dfn>"Time to live": how many seconds a cached copy is trusted before it is thrown away.</p>`;
  const idea = `<div class="idea" style="margin:0"><b>Bigger idea</b>Every cache trades freshness for speed. The only question is how stale you can stand.</div>`;
  const pair = `<div class="pair" style="margin:0"><div><h4>Cache hit</h4><p>The copy is there. Answer in about 1 ms.</p></div><div><h4>Cache miss</h4><p>No copy. Go to the database (about 40 ms), then keep a copy.</p></div></div>`;
  const worked = `<div class="worked" style="margin:0"><b>100 reads of the same page</b><ol><li>First read: miss, 40 ms.</li><li>Next 99 reads: hits, 1 ms each = 99 ms.</li></ol><p class="res">139 ms in all, against 4,000 ms with no cache.</p></div>`;
  const recap = `<ol class="recap" style="margin:0"><li>A cache keeps a fast copy of slow data.</li><li>Every copy can go stale; a TTL limits how stale.</li></ol>`;
  const glossary = `<dl class="glossary" style="margin:0"><dt>Cache</dt><dd>A fast copy of data that is slow to get.</dd><dt>TTL</dt><dd>How long a copy is trusted.</dd></dl>`;
  const unclearDemo = `<div class="unclear" style="margin:0"><p class="respond-help">Type a question under any section. Copy them all and paste them back to the agent.</p><div class="unclear-fields" style="display:none"></div><label>Anything else<textarea placeholder="Anything else? (optional)"></textarea></label><pre></pre><button type="button" class="btn-dark">Copy questions</button></div>`;
  const sw = ['bg', 'surface', 'sunk', 'ink', 'muted', 'line', 'accent', 'accent-soft', 'go', 'go-soft', 'warn', 'warn-soft', 'code-bg'];
  const swatches = `<div class="hs-sw">${sw.map((v) => `<div><i style="background:var(--${v})"></i><code>--${v}</code></div>`).join('')}</div>`;
  const hsCss = `<style>
  .hs-live { --halo: var(--surface); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; margin-top: 10px; display: grid; gap: 10px; }
  .hs-live > * { min-width: 0; }
  .hs-live .fig-box { padding: 12px 0; border: 0; background: none; }
  .hs-code { margin-top: 8px; max-width: none; }
  .hs-code pre { max-height: 320px; overflow: auto; }
  .hs-sw { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 16px; }
  .hs-sw div { display: flex; align-items: center; gap: 10px; font-size: 13px; }
  .hs-sw i { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--muted); flex: none; }
  @media print { .hs-live { break-inside: avoid; } .hs-code { display: none; } }
  </style>`;
  const gearHtml = gearBlock;  // eslint-disable-line no-unused-vars
  const body = `<div class="wrap">
    <nav class="toc" aria-label="Contents"><div class="label">Contents</div><ol id="toc-list"></ol></nav>
    <main>
      <div class="topbar">
        <span class="tag">Reference · ${VERSION}</span>
        ${gearHtml}
      </div>
      <header>
        <div class="part">House style</div>
        <h1>Every part, ready to copy</h1>
        <p class="lede">The look for our plan and explainer pages. Each part below is live, with its code folded under it. Start a page from <code>template.html</code>. Read the rules in <code>HOUSE-STYLE.md</code> and the class list in <code>PARTS.md</code>.</p>
        <div class="meta"><span>Colors <b>Burnt Sienna</b></span><span>Fonts <b>Source Serif 4 · Source Sans 3 · Source Code Pro</b></span><span>Text <b>17 px · 61 ch</b></span><span>Drawings <b>sketch, clean for customers</b></span></div>
      </header>
      <section id="look" data-toc="Colors + type" data-fold="open">
        <div class="part">Look</div><h2>Colors and type</h2>
        <p class="section-intro">Use these variables. Never a raw hex color in the page body. The gear at the top right switches theme, text size and drawing style.</p>
        ${swatches}
        <h3 style="margin-top:28px">Heading in Source Serif 4</h3>
        <p style="margin-top:8px">Body text in Source Sans 3 at 17 px. Short sentences. Active voice. <code>Code in Source Code Pro</code>.</p>
      </section>
      <section id="parts" data-toc="Parts" data-fold="open">
        <div class="part">Parts</div><h2>Page parts</h2>
        <p class="section-intro">Click a section title (like this one) to fold it. Every section in a page can fold.</p>
        ${demo('Progress', prog, 'Read-only ticks. The counts on the group title fill themselves. Each row says what proved it.')}
        ${demo('Notes', notes, 'The icon shape tells the kinds apart, not just the color.')}
        ${demo('Table', table, 'Turns into cards under 600 px. Make the window narrow to see it.')}
        ${demo('Files', files, 'Real paths, with a line number when one place matters.')}
        ${demo('Steps (size S)', steps, 'Every step ends with a Check line: a command and what it must print, or what you see.')}
        ${demo('Phases (sizes M and L)', phases, 'Each phase has its own build, test, review loop.')}
        ${demo('Build split', split)}
        ${demo('Code block', code, 'Code that does not exist yet says "sketch" in its title.')}
        ${demo('Not changing', notChanging)}
        ${demo('Research notes', research, 'Name the source for every finding.')}
      </section>
      <section id="decide" data-toc="Decisions" data-fold="open">
        <div class="part">Your call</div><h2>Decisions and the response panel</h2>
        <p class="section-intro">On a wide screen the panel sits at the right and stays in view. It can fold down to just the Copy button. On a phone it sits below the decisions.</p>
        ${demo('Decisions + response panel', decision, 'Open a decision or pick an option: its tag turns to "kept" or "changed". The panel says how many you have not looked at yet.')}
      </section>
      <section id="explain" data-toc="Explain parts" data-fold="open">
        <div class="part">Explain</div><h2>Parts for explain pages</h2>
        <p class="section-intro">Pick the ones the topic needs. Two explain pages should not look the same.</p>
        ${demo('ELI5 layers', layers, 'For the core ideas: the picture, the real thing, then where the picture breaks.')}
        ${demo('Term', vocab, 'Define a term where it first shows up. It also goes in the glossary.')}
        ${demo('Bigger idea', idea)}
        ${demo('Side by side', pair, 'Two things compared. Stacks on a phone.')}
        ${demo('Worked example', worked, 'Real numbers, one line each, the result last.')}
        ${demo('Recap', recap)}
        ${demo('Glossary', glossary)}
        ${demo('What is still unclear?', unclearDemo, 'The page builds one note field per section. Here there are none, so only "Anything else" shows.')}
      </section>
      <section id="drawings" data-toc="Drawings" data-fold="open">
        <div class="part">Drawings</div><h2>Drawings</h2>
        <p class="section-intro">Write the clean SVG. The page draws it in the sketch look unless the page or the reader asks for clean. Switch in the gear to compare.</p>
        ${demo('Flow', fig(FLOW, 'A left-to-right flow. 3–5 boxes.'))}
        ${demo('Before / after', fig(BEFORE_AFTER, 'Two dashed groups with one arrow between them.'))}
        ${demo('System map', fig(MAP, 'Groups for where things run. Arrows labeled with verbs.'))}
        ${demo('Sequence', fig(SEQUENCE, 'Who talks to whom, in order. Replies are green and dashed.'))}
        ${demo('Timeline', fig(TIMELINE, 'Phases on one line. Done is green, now is the accent color.'))}
        ${demo('Big drawing in the viewer', viewer(BIG, 'Big system map'), 'For drawings wider than 1000. Zoom, pan, fullscreen and a mini overview. Labels stay sharp at any zoom.')}
      </section>
    </main>
  </div>
  `;
  fs.writeFileSync(path.join(OUT, 'house-style.html'), head(`House style ${VERSION}`).replace('</head>', hsCss + '\n</head>') + body + foot());

  // ---------- the text files ----------
  fs.writeFileSync(path.join(OUT, 'tokens.css'), tokens);
  for (const f of ['HOUSE-STYLE.md', 'PARTS.md', 'settings.md', 'html-to-pdf.sh']) fs.copyFileSync(path.join(HERE, f), path.join(OUT, f));
  fs.chmodSync(path.join(OUT, 'html-to-pdf.sh'), 0o755);
  for (const f of ['vocab-check.mjs', 'vocab-common-3000.txt', 'FONTS-LICENSE.txt', 'ROUGH-LICENSE.txt']) fs.copyFileSync(path.join(HERE, f), path.join(OUT, f));
  return fs.readdirSync(OUT).sort();
}

// CLI: node kit-src/build-kit.mjs <empty-folder>  (sync-kit.mjs is the normal way in)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out || process.argv.length > 3) { console.error('usage: node kit-src/build-kit.mjs <empty-folder>'); process.exit(2); }
  try {
    const abs = path.resolve(out);
    fs.mkdirSync(abs, { recursive: true });
    for (const f of buildKit(abs)) console.log(f.padEnd(24), (fs.statSync(path.join(abs, f)).size / 1024).toFixed(1) + ' KB');
  } catch (e) { console.error(e.message); process.exit(1); }
}
