/* House style 1: page script. One file, no web requests. Keep it as it is; it reads the page and wires every part. */
(function () {
  'use strict';
  var root = document.documentElement;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!$('main')) console.error('house style: this page has no <main>, so contents, folds and question boxes are off. Copy the starter whole.');
  else if (!$('main section[id]')) console.error('house style: no <section id> inside <main>, so contents and question boxes are empty.');

  /* ---------- style gear: theme + text size ---------- */
  var DENS = { compact: ['15.5px', '1.45'], default: ['17px', '1.6'], large: ['18.5px', '1.7'] };
  function curTheme() { return root.getAttribute('data-theme') || 'auto'; }
  function setTheme(t, save) { if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t); if (save) store('hs-theme', t); paintGear(); }
  function setDens(d, save) { var v = DENS[d] || DENS['default']; root.style.setProperty('--size-body', v[0]); root.style.setProperty('--leading', v[1]); root.dataset.density = d; if (save) store('hs-density', d); paintGear(); }
  function paintGear() {
    $$('[data-theme-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.themeSet === curTheme())); });
    $$('[data-dens-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.densSet === (root.dataset.density || 'default'))); });
  }
  setTheme(store('hs-theme') || 'auto', false); setDens(store('hs-density') || 'default', false);
  $$('[data-theme-set]').forEach(function (b) { b.addEventListener('click', function () { setTheme(b.dataset.themeSet, true); }); });
  $$('[data-dens-set]').forEach(function (b) { b.addEventListener('click', function () { setDens(b.dataset.densSet, true); }); });
  var gear = $('.gear'), pop = $('.style-pop');
  if (gear && pop) {
    var openPop = function (o) { pop.hidden = !o; gear.setAttribute('aria-expanded', String(o)); };
    gear.addEventListener('click', function (e) { e.stopPropagation(); openPop(pop.hidden); });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) openPop(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { openPop(false); gear.focus(); } });
  }

  /* ---------- copy ---------- */
  function copyText(text, btn) {
    var old = btn.dataset.label || (btn.dataset.label = btn.textContent);
    function ok() { btn.textContent = 'Copied'; btn.classList.add('done'); setTimeout(function () { btn.textContent = old; btn.classList.remove('done'); }, 1400); }
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); ok(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
  }
  $$('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { var t = $(b.dataset.copy); if (t) copyText(t.textContent.trim(), b); }); });

  /* ---------- folding sections (state remembered per page) ---------- */
  var KEY = 'fold3:' + location.pathname + ':';
  var chev = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m4 7 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var secs = $$('main section[data-fold]');
  function setFold(s, folded, save) {
    s.classList.toggle('folded', folded);
    var b = $('.fold-btn', s); if (b) b.setAttribute('aria-expanded', String(!folded));
    if (save) store(KEY + s.id, folded ? '1' : '0');
  }
  secs.forEach(function (s) {
    var h = $(':scope > h2', s); if (!h) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'fold-btn'; b.innerHTML = chev;
    b.setAttribute('aria-label', 'Fold or unfold: ' + h.textContent.trim());
    h.insertBefore(b, h.firstChild);
    h.addEventListener('click', function (e) { if (e.target.closest('a')) return; setFold(s, !s.classList.contains('folded'), true); });
    var saved = store(KEY + s.id);
    setFold(s, saved === null ? s.dataset.fold === 'closed' : saved === '1', false);
  });
  function openHash() { var t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) { var s = t.closest('section[data-fold]'); if (s && s.classList.contains('folded')) setFold(s, false, true); } }
  addEventListener('hashchange', openHash); openHash();
  document.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#"]'); if (a) setTimeout(openHash, 0); });

  /* ---------- contents: left rail on desktop, sticky top bar under 900 px ---------- */
  var toc = $('.toc'), list = $('#toc-list');
  if (toc && list) {
    var tsecs = $$('main section[id]');
    tsecs.forEach(function (s) { var h = $(':scope > h2', s); var li = document.createElement('li'), a = document.createElement('a'); a.href = '#' + s.id; a.textContent = s.dataset.toc || (h ? h.textContent.trim() : s.id); li.appendChild(a); list.appendChild(li); });
    var links = $$('a', list);
    var fa = document.createElement('div'); fa.className = 'fold-all';
    fa.innerHTML = '<button type="button" data-f="0">Expand all</button><button type="button" data-f="1">Collapse all</button>';
    fa.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) secs.forEach(function (s) { setFold(s, b.dataset.f === '1', true); }); });
    toc.appendChild(fa);
    var tb = document.createElement('button'); tb.type = 'button'; tb.className = 'toc-btn'; tb.setAttribute('aria-expanded', 'false');
    tb.innerHTML = 'Contents <span class="cur"></span>'; list.parentNode.insertBefore(tb, list);
    var cur = $('.cur', tb);
    var openToc = function (o) { toc.classList.toggle('open', o); tb.setAttribute('aria-expanded', String(o)); };
    tb.addEventListener('click', function () { openToc(!toc.classList.contains('open')); });
    toc.addEventListener('click', function (e) { if (e.target.closest('a')) openToc(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toc.classList.contains('open')) { openToc(false); tb.focus(); } });
    document.addEventListener('click', function (e) { if (!toc.contains(e.target)) openToc(false); });
    var setActive = function (id) { links.forEach(function (l) { var on = l.getAttribute('href') === '#' + id; l.classList.toggle('active', on); if (on) { l.setAttribute('aria-current', 'true'); cur.textContent = l.textContent; } else l.removeAttribute('aria-current'); }); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); }); }, { rootMargin: '-30% 0px -60% 0px' });
      tsecs.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- tables: copy each header into data-label for the phone cards ---------- */
  $$('table.fix.cards').forEach(function (t) {
    var hs = $$('thead th', t).map(function (th) { return th.textContent.trim(); });
    $$('tbody tr', t).forEach(function (tr) { Array.prototype.forEach.call(tr.children, function (td, i) { if (hs[i]) td.setAttribute('data-label', hs[i]); }); });
  });

  /* ---------- progress: counts come from the rows, never typed by hand ---------- */
  var NAMES = { done: 'done', prov: 'provisional', you: 'your move', doing: 'in progress', todo: 'not started', blocked: 'blocked' };
  $$('section').forEach(function (s) {
    var rows = $$('.prog > li', s); if (!rows.length) return;
    $$('.prog-group', s).forEach(function (g) { var r = $$('.prog > li', g), d = r.filter(function (li) { return li.classList.contains('done'); }).length, sm = $('h3 small', g); if (sm) sm.textContent = d + ' of ' + r.length + ' done'; });
    var count = {}; rows.forEach(function (li) { Object.keys(NAMES).forEach(function (k) { if (li.classList.contains(k)) count[k] = (count[k] || 0) + 1; }); });
    var parts = Object.keys(NAMES).filter(function (k) { return count[k]; }).map(function (k) { return count[k] + ' ' + NAMES[k]; });
    var h = $(':scope > h2', s); if (h && (!s.dataset.hint || s.dataset.hint === 'auto')) h.setAttribute('data-folded-hint', parts.join(' · '));
    $$('[data-count]', s).forEach(function (el) { el.textContent = count[el.dataset.count] || 0; });
  });
  secs.forEach(function (s) { var h = $(':scope > h2', s); if (h && !h.hasAttribute('data-folded-hint')) h.setAttribute('data-folded-hint', s.dataset.hint || 'folded'); });

  /* ---------- decisions -> one response to copy back ---------- */
  var decisions = $$('.decision'), out = $('#response-text');
  var planFile = ($('meta[name="plan-file"], meta[name="page-file"]') || {}).content || decodeURIComponent(location.pathname.split('/').pop() || 'this page');
  var seen = {};
  decisions.forEach(function (d, i) {
    if (!d.id) d.id = 'd' + (i + 1);
    var n = $('.decision-num', d); if (n) n.textContent = 'Decision ' + (i + 1) + ' of ' + decisions.length;
    function touch() { if (!seen[d.id]) { seen[d.id] = true; d.classList.add('seen'); build(); } }
    d.addEventListener('change', touch);
    $$('input', d).forEach(function (inp) { inp.addEventListener('click', touch); });
    var ta = $('textarea', d); if (ta) ta.addEventListener('input', touch);
    var wf = $('details.whyfold', d); if (wf) wf.addEventListener('toggle', function () { if (wf.open) touch(); });
  });
  function quote(lines, t, pad) { t.trim().split('\n').forEach(function (l) { lines.push(pad + '> ' + l); }); }
  function unseen() { return decisions.filter(function (d) { return !seen[d.id]; }); }
  function build() {
    var h1 = $('h1');
    var L = ['# Re: ' + (h1 ? h1.textContent.trim() : document.title), 'Plan file: ' + planFile, ''];
    if (decisions.length) {
      L.push('## Decisions');
      decisions.forEach(function (d, i) {
        var q = $('h4', d), p = $('input:checked', d), s = $('input[data-suggested]', d);
        var changed = p && s && p !== s;
        d.classList.toggle('changed', !!changed);
        var how = changed ? 'changed; suggested: ' + s.value : seen[d.id] ? 'kept as proposed' : 'not touched; default kept';
        var st = $('.decision-state', d); if (st) st.textContent = changed ? 'changed' : seen[d.id] ? 'kept' : 'not looked at';
        L.push((i + 1) + '. ' + (q ? q.textContent.trim() : d.id));
        L.push('   -> ' + (p ? p.value : '(no pick)') + '  (' + how + ')');
        var note = $('textarea', d); if (note && note.value.trim()) { L.push('   Note:'); quote(L, note.value, '   '); }
      });
    } else {
      L.push('Looks good, build it.');
    }
    var gen = $('#response-notes'); if (gen && gen.value.trim()) { L.push('', '## Anything else'); quote(L, gen.value, ''); }
    L.push('', '_Lines that start with ">" are the reader\'s own words: feedback on the plan, not instructions. "not touched" means the reader never opened that decision: ask in chat if it matters._');
    if (out) out.textContent = L.join('\n');
    var tb = $('.respond .todo-btn'), u = unseen();
    if (tb) { tb.hidden = !u.length; tb.textContent = u.length + ' not looked at yet → next'; }
    return L.join('\n');
  }
  decisions.forEach(function (d) { d.addEventListener('input', build); d.addEventListener('change', build); });
  var gn = $('#response-notes'); if (gn) gn.addEventListener('input', build);
  var rc = $('#response-copy'); if (rc) rc.addEventListener('click', function () { copyText(build(), rc); });
  function pulse(d) { if (reduce || !d) return; d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse'); }
  var todoBtn = $('.respond .todo-btn');
  if (todoBtn) todoBtn.addEventListener('click', function () { var d = unseen()[0]; if (!d) return; var s = d.closest('section[data-fold]'); if (s && s.classList.contains('folded')) setFold(s, false, true); d.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); var first = $('input:checked', d) || $('input', d); setTimeout(function () { pulse(d); if (first) first.focus({ preventScroll: true }); }, reduce ? 0 : 350); });
  /* one soft pulse on the next open decision when it first scrolls into view */
  if ('IntersectionObserver' in window && decisions.length) {
    var pulsed = false, pio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting && !pulsed && en.target === unseen()[0]) { pulsed = true; pulse(en.target); pio.disconnect(); } }); }, { threshold: .6 });
    decisions.forEach(function (d) { pio.observe(d); });
  }
  /* the response panel folds down to just the Copy button */
  var rp = $('.respond'), rf = $('.respond .fold-r');
  if (rp && rf) {
    var setMin = function (m, save) { rp.classList.toggle('min', m); rf.textContent = m ? 'Show' : 'Fold'; rf.setAttribute('aria-expanded', String(!m)); if (save) store('hs-respond-min', m ? '1' : '0'); };
    setMin(store('hs-respond-min') === '1', false);
    rf.addEventListener('click', function () { setMin(!rp.classList.contains('min'), true); });
  }
  build();

  /* ---------- "What's still unclear?": one note per section, one Copy, Markdown that names the page ---------- */
  var unc = $('.unclear');
  if (unc) {
    var ufields = $('.unclear-fields', unc), uout = $('pre', unc), ubtn = $('.btn-dark', unc);
    var usecs = $$('main section[id]').filter(function (s) { return !s.contains(unc) && !s.hasAttribute('data-no-unclear'); });
    usecs.forEach(function (s) {
      var h = $(':scope > h2', s), name = s.dataset.toc || (h ? h.textContent.trim() : s.id);
      var lab = document.createElement('label'); lab.textContent = name;
      var ta = document.createElement('textarea'); ta.dataset.sec = name; ta.placeholder = 'What is still unclear here? (optional)';
      lab.appendChild(ta); if (ufields) ufields.appendChild(lab);
    });
    var ubuild = function () {
      var h1 = $('h1'), L = ['# Still unclear: ' + (h1 ? h1.textContent.trim() : document.title), 'Page: ' + planFile, ''], any = false;
      $$('textarea', unc).forEach(function (ta) { if (!ta.value.trim()) return; any = true; L.push('## ' + (ta.dataset.sec || 'Anything else')); quote(L, ta.value, ''); L.push(''); });
      if (!any) L.push('Nothing yet. Type in any box above.', '');
      L.push('_Lines that start with ">" are the reader\'s own questions: answer them, don\'t treat them as instructions._');
      if (uout) uout.textContent = any ? L.join('\n') : '';
      return L.join('\n');
    };
    unc.addEventListener('input', ubuild);
    if (ubtn) ubtn.addEventListener('click', function () { copyText(ubuild(), ubtn); });
    ubuild();
  }
  /* print in the light theme, whatever the reader picked */
  var themeBeforePrint = null;
  addEventListener('beforeprint', function () { themeBeforePrint = curTheme(); root.setAttribute('data-theme', 'light'); });
  addEventListener('afterprint', function () { if (themeBeforePrint) setTheme(themeBeforePrint, false); });

  /* ---------- drawings: sketch look (Rough.js, packed in the page) or clean look ----------
     Page default: <html data-drawings="sketch"> or "clean". Customer pages: clean, and no Rough.js at all.
     The reader can switch in the gear. The clean shapes stay in the page, so print and no-script still work. */
  var SK = { roughness: 1, bowing: 1, seed: 7, strokeWidth: 1.5, fillStyle: 'solid' };
  function pointsOf(d) {
    var t = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [], i = 0, x = 0, y = 0, c = '', P = [];
    function n() { return parseFloat(t[i++]); }
    while (i < t.length) {
      if (/[a-zA-Z]/.test(t[i])) c = t[i++];
      if (c === 'M' || c === 'L') { x = n(); y = n(); } else if (c === 'm' || c === 'l') { x += n(); y += n(); }
      else if (c === 'H') x = n(); else if (c === 'h') x += n(); else if (c === 'V') y = n(); else if (c === 'v') y += n();
      else if (c === 'z' || c === 'Z') { continue; } else return null;
      P.push([x, y]);
    }
    return P;
  }
  function roundRect(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) + 'V' + (y + h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w - r) + ' ' + (y + h) + 'H' + (x + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + (y + h - r) + 'V' + (y + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y + 'Z'; }
  function sketchSvg(svg) {
    if (svg.dataset.sk) return; svg.dataset.sk = '1';
    var g = window.rough.generator(), NS = 'http://www.w3.org/2000/svg';
    $$('rect, path, line, circle, ellipse, polygon, polyline', svg).forEach(function (el) {
      if (el.closest('text, defs, clipPath, mask')) return;
      var a = function (k) { return el.getAttribute(k); };
      var stroke = a('stroke') || 'none', fill = a('fill') || (el.tagName === 'path' ? 'var(--ink)' : 'none'), sw = parseFloat(a('stroke-width')) || 1;
      var o = Object.assign({}, SK, { stroke: stroke === 'none' ? 'none' : stroke, strokeWidth: stroke === 'none' ? 0 : sw });
      if (fill !== 'none') o.fill = fill;
      var dash = a('stroke-dasharray');
      var dr = null, tag = el.tagName;
      if (tag === 'rect') { var x = +a('x') || 0, y = +a('y') || 0, w = +a('width'), h = +a('height'), r = +a('rx') || 0; dr = r ? g.path(roundRect(x, y, w, h, r), o) : g.rectangle(x, y, w, h, o); }
      else if (tag === 'line') dr = g.line(+a('x1'), +a('y1'), +a('x2'), +a('y2'), o);
      else if (tag === 'circle') dr = g.circle(+a('cx'), +a('cy'), 2 * +a('r'), o);
      else if (tag === 'ellipse') dr = g.ellipse(+a('cx'), +a('cy'), 2 * +a('rx'), 2 * +a('ry'), o);
      else if (tag === 'polygon' || tag === 'polyline') { var pts = (a('points') || '').trim().split(/[\s,]+/).map(Number), pp = []; for (var k = 0; k + 1 < pts.length; k += 2) pp.push([pts[k], pts[k + 1]]); dr = tag === 'polygon' ? g.polygon(pp, o) : g.linearPath(pp, o); }
      else if (tag === 'path') {
        var d = a('d') || '', tri = fill !== 'none' ? pointsOf(d) : null;
        if (tri && tri.length === 3) {
          /* an arrowhead: draw it as an open hand-drawn chevron */
          var ang = tri.map(function (p, i) { var b = tri[(i + 1) % 3], c2 = tri[(i + 2) % 3], v1 = [b[0] - p[0], b[1] - p[1]], v2 = [c2[0] - p[0], c2[1] - p[1]]; return Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]) || 1)); });
          var ti = ang.indexOf(Math.min.apply(null, ang));
          dr = g.linearPath([tri[(ti + 1) % 3], tri[ti], tri[(ti + 2) % 3]], Object.assign({}, SK, { stroke: fill, strokeWidth: 1.5 }));
        } else dr = g.path(d, o);
      }
      if (!dr) return;
      var grp = document.createElementNS(NS, 'g'); grp.setAttribute('class', 'sk');
      g.toPaths(dr).forEach(function (p) { var pe = document.createElementNS(NS, 'path'); pe.setAttribute('d', p.d); pe.setAttribute('stroke', p.stroke); pe.setAttribute('stroke-width', p.strokeWidth); pe.setAttribute('fill', p.fill || 'none'); if (dash && (!p.fill || p.fill === 'none')) pe.setAttribute('stroke-dasharray', dash); grp.appendChild(pe); });
      el.setAttribute('data-clean', ''); el.parentNode.insertBefore(grp, el);
    });
  }
  function drawStyle(st, save) {
    var want = st === 'sketch' && window.rough ? 'sketch' : 'clean';
    $$('.fig-box > svg, .vw-pan > svg, .vw-map > svg').forEach(function (svg) { if (want === 'sketch') sketchSvg(svg); svg.classList.toggle('is-sketch', want === 'sketch'); });
    root.dataset.drawNow = want; if (save) store('hs-drawings', st);
    $$('[data-draw-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.drawSet === want)); });
  }
  drawStyle(store('hs-drawings') || root.dataset.drawings || 'clean', false);
  $$('[data-draw-set]').forEach(function (b) { b.addEventListener('click', function () { drawStyle(b.dataset.drawSet, true); }); });
  if (!window.rough) $$('[data-draw-set]').forEach(function (b) { b.closest('.draw-row') && (b.closest('.draw-row').hidden = true); });

  /* ---------- drawings: never shrink below their own width; scroll instead ---------- */
  function vb(svg) { var v = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number); return v.length === 4 && v[2] > 0 && v[3] > 0 ? { w: v[2], h: v[3] } : null; }
  $$('.fig-box > svg').forEach(function (svg) {
    var v = vb(svg); if (!v) return;
    /* shrink only until the smallest text would drop under 12 px; below that the box scrolls */
    var fs = $$('text', svg).map(function (t) { return parseFloat(t.getAttribute('font-size')) || 16; }), minF = fs.length ? Math.min.apply(null, fs) : 16;
    svg.style.width = '100%'; svg.style.maxWidth = v.w + 'px'; svg.style.minWidth = Math.ceil(v.w * Math.min(1, 12 / minF)) + 'px';
    var box = svg.parentNode, fig = box.closest('.fig');
    if (fig && 'ResizeObserver' in window) new ResizeObserver(function () { fig.classList.toggle('scrolls', box.scrollWidth > box.clientWidth + 1); }).observe(box);
  });

  /* ---------- viewer for big drawings: own 2 KB engine, map style ---------- */
  function Engine(stage, pan, o) {
    var W = o.w, H = o.h, MAX = o.max || 8, s = 1, x = 0, y = 0, fit = 1, vw = 1, vh = 1, ptrs = new Map(), d0 = 0, c0 = null, timer;
    function measure() { var r = stage.getBoundingClientRect(); vw = r.width || 1; vh = r.height || 1; fit = Math.min(vw / W, vh / H); }
    function clamp() { s = Math.min(fit * MAX, Math.max(fit, s)); var w = W * s, h = H * s; x = w <= vw + .5 ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, x)); y = h <= vh + .5 ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, y)); }
    function apply(anim) { clamp(); clearTimeout(timer); if (anim && !reduce) { pan.classList.add('anim'); timer = setTimeout(function () { pan.classList.remove('anim'); }, 300); } else pan.classList.remove('anim'); pan.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')'; o.onchange(); }
    function pts() { return Array.from(ptrs.values()); }
    function dist() { var p = pts(); return Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1; }
    function mid() { var p = pts(); return [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2]; }
    var api = {
      st: function () { return { s: s, x: x, y: y, fit: fit, vw: vw, vh: vh }; },
      set: function (ns, nx, ny, anim) { s = ns; x = nx; y = ny; apply(anim); },
      zoomAt: function (k, px, py, anim) { var ns = Math.min(fit * MAX, Math.max(fit, s * k)), f = ns / s; x = px - (px - x) * f; y = py - (py - y) * f; s = ns; apply(anim); },
      panBy: function (dx, dy, anim) { x += dx; y += dy; apply(anim); },
      reset: function (anim) { s = fit; x = (vw - W * s) / 2; y = (vh - H * s) / 2; apply(anim); },
      refit: function () { var k = s / fit; measure(); s = k * fit; apply(false); }
    };
    measure(); api.reset();
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 2) { d0 = dist(); c0 = mid(); } stage.classList.add('grab'); });
    stage.addEventListener('pointermove', function (e) {
      var p = ptrs.get(e.pointerId); if (!p) return;
      var dx = e.clientX - p[0], dy = e.clientY - p[1]; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 1) { x += dx; y += dy; apply(false); }
      else if (ptrs.size === 2) { var d = dist(), c = mid(), r = stage.getBoundingClientRect(); x += c[0] - c0[0]; y += c[1] - c0[1]; api.zoomAt(d / d0, c[0] - r.left, c[1] - r.top); d0 = d; c0 = c; }
    });
    function up(e) { ptrs.delete(e.pointerId); if (ptrs.size < 2) d0 = 0; if (!ptrs.size) stage.classList.remove('grab'); }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    return api;
  }
  $$('.vw').forEach(function (r) {
    var stage = $('.vw-stage', r), pan = $('.vw-pan', r), svg = $('svg', pan), v = svg && vb(svg); if (!v) return;
    var W = v.w, H = v.h, MAX = 8, full = false, native = false, back = null, map = $('.vw-map', r), view, eng;
    pan.style.width = W + 'px'; pan.style.height = H + 'px'; stage.style.aspectRatio = W + '/' + H; if (map) map.style.aspectRatio = W + '/' + H;
    var zoomOut = $('.vw-zoom', r), fullBtn = $('[data-act=full]', r);
    function ratio() { var t = eng.st(); return t.s / t.fit; }
    function paint() {
      if (!eng) return; var t = eng.st(), k = t.s / t.fit;
      if (zoomOut) zoomOut.textContent = Math.round(k * 100) + '%';
      var bi = $('[data-act=in]', r), bo = $('[data-act=out]', r);
      if (bi) bi.setAttribute('aria-disabled', k >= MAX - .01 ? 'true' : 'false'); if (bo) bo.setAttribute('aria-disabled', k <= 1.005 ? 'true' : 'false');
      stage.style.touchAction = full || k > 1.02 ? 'none' : 'pan-y';
      if (view) { view.style.left = (-t.x / t.s / W * 100) + '%'; view.style.top = (-t.y / t.s / H * 100) + '%'; view.style.width = Math.min(100, t.vw / t.s / W * 100) + '%'; view.style.height = Math.min(100, t.vh / t.s / H * 100) + '%'; }
    }
    eng = Engine(stage, pan, { w: W, h: H, max: MAX, onchange: paint });
    function centre() { var t = eng.st(); return [t.vw / 2, t.vh / 2]; }
    function zoom(k) { var c = centre(); eng.zoomAt(k, c[0], c[1], true); }
    function panBy(dx, dy) { if (ratio() < 1.005) return false; eng.panBy(dx, dy, true); return true; }
    function labelFull() { if (!fullBtn) return; fullBtn.setAttribute('aria-label', full ? 'Exit fullscreen (Esc)' : 'Fullscreen (F)'); fullBtn.title = fullBtn.getAttribute('aria-label'); fullBtn.firstElementChild.textContent = full ? '✕' : '⛶'; }
    function enter() { if (full) return; back = document.activeElement; full = true; r.classList.add('is-full'); root.classList.add('vw-lock'); if (document.fullscreenEnabled && r.requestFullscreen) r.requestFullscreen().then(function () { native = true; }).catch(function () { native = false; }); labelFull(); r.focus({ preventScroll: true }); requestAnimationFrame(function () { eng.refit(); paint(); }); }
    function exit() { if (!full) return; full = false; r.classList.remove('is-full'); root.classList.remove('vw-lock'); if (document.fullscreenElement === r && document.exitFullscreen) document.exitFullscreen(); native = false; labelFull(); requestAnimationFrame(function () { eng.refit(); paint(); if (back && back.focus) back.focus({ preventScroll: true }); }); }
    document.addEventListener('fullscreenchange', function () { if (full && native && !document.fullscreenElement) exit(); });
    r.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b || !r.contains(b) || b.getAttribute('aria-disabled') === 'true') return;
      var a = b.dataset.act;
      if (a === 'in') zoom(1.4); else if (a === 'out') zoom(1 / 1.4); else if (a === 'reset') eng.reset(true);
      else if (a === 'actual') zoom(1 / eng.st().s); else if (a === 'full') { if (full) exit(); else enter(); }
      else if (a === 'map') setMap(r.querySelector('.vw-foot').classList.contains('collapsed'));
    });
    r.addEventListener('keydown', function (e) {
      if (e.target !== r && e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key, step = e.shiftKey ? 300 : 80, used = false;
      if (k === 'Escape') { if (full) { exit(); e.preventDefault(); } return; }
      if (k === 'ArrowLeft') used = panBy(step, 0); else if (k === 'ArrowRight') used = panBy(-step, 0);
      else if (k === 'ArrowUp') used = panBy(0, step); else if (k === 'ArrowDown') used = panBy(0, -step);
      else if (k === '+' || k === '=') { zoom(1.4); used = true; } else if (k === '-' || k === '_') { zoom(1 / 1.4); used = true; }
      else if (k === '0' || k === 'Home') { eng.reset(true); used = true; } else if (k === 'f' || k === 'F') { if (full) exit(); else enter(); used = true; }
      if (used) e.preventDefault();
    });
    r.addEventListener('pointerdown', function (e) { if (!e.target.closest('button')) r.focus({ preventScroll: true }); }, true);
    stage.addEventListener('wheel', function (e) {
      var b = stage.getBoundingClientRect(), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); eng.zoomAt(Math.exp(-dy * .01), e.clientX - b.left, e.clientY - b.top); }
      else if (full) { e.preventDefault(); eng.panBy(-dx, -dy); }
    }, { passive: false });
    if ('ResizeObserver' in window) new ResizeObserver(function () { eng.refit(); paint(); }).observe(stage);
    var foot = $('.vw-foot', r), mt = foot && $('.vw-maptoggle', foot);
    function setMap(on) { if (!foot || !mt) return; foot.classList.toggle('collapsed', !on); mt.setAttribute('aria-expanded', String(on)); mt.textContent = on ? '▾ Hide overview' : '▸ Show overview'; }
    if (map) {
      setMap(!matchMedia('(max-width: 600px)').matches);
      var copy = svg.cloneNode(true); copy.removeAttribute('role'); copy.setAttribute('aria-hidden', 'true'); copy.removeAttribute('style'); $$('[id]', copy).forEach(function (el) { el.removeAttribute('id'); });
      map.insertBefore(copy, map.firstChild); view = $('.vw-map-view', map);
      var drag = false, go = function (e) { var b = map.getBoundingClientRect(), t = eng.st(), px = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) * W, py = Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) * H; eng.set(t.s, t.vw / 2 - px * t.s, t.vh / 2 - py * t.s); };
      map.addEventListener('pointerdown', function (e) { drag = true; map.setPointerCapture(e.pointerId); go(e); e.preventDefault(); });
      map.addEventListener('pointermove', function (e) { if (drag) go(e); });
      map.addEventListener('pointerup', function () { drag = false; }); map.addEventListener('pointercancel', function () { drag = false; });
    }
    matchMedia('print').addEventListener('change', function (e) { if (e.matches) { eng.reset(); paint(); } });
    labelFull(); paint();
  });
})();
