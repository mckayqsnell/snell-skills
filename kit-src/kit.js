/* House style 1: page script. One file, no web requests. Keep it as it is; it reads the page and wires every part. */
(function () {
  'use strict';
  var root = document.documentElement;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!$('main')) console.error('house style: this page has no <main>, so contents, folds and the response box are off. Copy the starter whole.');
  else if (!$('main section[id]')) console.error('house style: no <section id> inside <main>, so the contents list is empty.');

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

  /* print in the light theme, whatever the reader picked */
  var themeBeforePrint = null, printShut = [];
  addEventListener('beforeprint', function () { themeBeforePrint = curTheme(); root.setAttribute('data-theme', 'light'); printShut = $$('details.q:not([open])'); printShut.forEach(function (d) { d.open = true; }); });
  addEventListener('afterprint', function () { if (themeBeforePrint) setTheme(themeBeforePrint, false); printShut.forEach(function (d) { d.open = false; }); printShut = []; });

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
  /* ================= visual toolbox (1.1): isometric 3D, moving data, scenes, linked words, expand =================
     All opt-in through classes and data attributes; see PARTS.md. Nothing here loads from the web. */
  var NS = 'http://www.w3.org/2000/svg';
  function mk(tag, a, parent, before) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.insertBefore(e, before || null); return e; }
  function nums(s) { return String(s || '').trim().split(/[\s,]+/).filter(Boolean).map(Number); }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function watch(el, cb) { if (!('IntersectionObserver' in window)) { cb(true); return; } new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { rootMargin: '80px' }).observe(el); }
  function pathOf(el) { return !el ? null : el.tagName === 'path' ? el : $('path', el); }

  /* ---------- isometric 3D: <svg class="iso" data-iso="unit originX originY"> ----------
     Children describe the scene in floor units; the script draws the faces.
       <g data-floor="x0 y0 x1 y1"/>                          a floor plate with a grid
       <g data-box="x y w d h" class="tone-teal" data-label="Orders" data-sub="service"/>   a block (optional data-z lifts it)
       <g data-cyl="x y w h" class="tone-rose" data-label="Postgres"/>                        a cylinder, w = width
       <g class="ed" data-route="x,y x,y ..."/>               a line on the floor (add data-flow to send packets)
       <text data-at="x y z">                                 any text, placed at a 3D point
     Blocks are sorted back to front, so the order you write them in does not matter. */
  function isoBuild(svg) {
    var o = nums(svg.getAttribute('data-iso')), U = o[0] || 40, OX = o[1] || 0, OY = o[2] || 0, CO = Math.cos(Math.PI / 6);
    function P(x, y, z) { return [+(OX + (x - y) * CO * U).toFixed(1), +(OY + (x + y) * .5 * U - (z || 0) * U).toFixed(1)]; }
    function pts(a) { return a.map(function (p) { return p.join(','); }).join(' '); }
    /* labels sit above the highest point of the top face, so they never cover it */
    function label(g, cx, cy, top, lift) {
      /* data-label-dy moves the label up (or down, if negative) by that many pixels */
      var t = P(cx, cy, top), y = t[1] - lift - (+g.getAttribute('data-label-dy') || 0), l = g.getAttribute('data-label'), sb = g.getAttribute('data-sub');
      if (l) mk('text', { class: 'iso-lb', x: t[0], y: y - (sb ? 25 : 8), 'text-anchor': 'middle' }, g).textContent = l;
      if (sb) mk('text', { class: 'iso-sb', x: t[0], y: y - 8, 'text-anchor': 'middle' }, g).textContent = sb;
    }
    $$('[data-floor]', svg).forEach(function (g) {
      var f = nums(g.getAttribute('data-floor')), x0 = f[0], y0 = f[1], x1 = f[2], y1 = f[3];
      mk('polygon', { class: 'iso-floor', points: pts([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)]) }, g);
      var grid = mk('path', { class: 'iso-grid', d: '' }, g), d = '';
      for (var x = Math.ceil(x0); x <= x1; x++) d += 'M' + P(x, y0) + 'L' + P(x, y1);
      for (var y = Math.ceil(y0); y <= y1; y++) d += 'M' + P(x0, y) + 'L' + P(x1, y);
      grid.setAttribute('d', d);
    });
    var lifted = [];
    $$('[data-route]', svg).forEach(function (g) {
      /* points are "x,y" on the floor, or "x,y,z" in the air; a line in the air is sorted in with the blocks */
      var z = +g.getAttribute('data-z') || .02, raw = g.getAttribute('data-route').trim().split(/\s+/).map(nums);
      var p = raw.map(function (v) { return P(v[0], v[1], v.length > 2 ? v[2] : z); });
      mk('path', { class: 'iso-route', d: 'M' + p.map(function (q) { return q.join(' '); }).join('L') }, g, g.firstChild);
      if (raw.some(function (v) { return v.length > 2; })) {
        var sx = 0, sy = 0, low = Infinity;
        raw.forEach(function (v) { sx += v[0]; sy += v[1]; low = Math.min(low, v.length > 2 ? v[2] : z); });
        lifted.push({ g: g, k: (sx + sy) / raw.length + low });
      }
    });
    var solids = $$('[data-box], [data-cyl]', svg).map(function (g) {
      var cyl = g.hasAttribute('data-cyl'), v = nums(g.getAttribute(cyl ? 'data-cyl' : 'data-box')), z = +g.getAttribute('data-z') || 0;
      var x = v[0], y = v[1], w = v[2], d = cyl ? v[2] : v[3], h = cyl ? v[3] : v[4];
      g.classList.add('iso-node');
      if (cyl) {
        var cx = x + w / 2, cy = y + d / 2, r = w / 2, rx = r * Math.SQRT2 * CO * U, ry = r * Math.SQRT2 * .5 * U, b = P(cx, cy, z), t = P(cx, cy, z + h);
        mk('path', { class: 'iso-r', d: 'M' + (b[0] - rx) + ' ' + t[1] + 'L' + (b[0] - rx) + ' ' + b[1] + 'A' + rx + ' ' + ry + ' 0 0 0 ' + (b[0] + rx) + ' ' + b[1] + 'L' + (b[0] + rx) + ' ' + t[1] + 'Z' }, g);
        [1 / 3, 2 / 3].forEach(function (f) { var yy = b[1] - (b[1] - t[1]) * f; mk('path', { class: 'iso-ring', d: 'M' + (b[0] - rx) + ' ' + yy + 'A' + rx + ' ' + ry + ' 0 0 0 ' + (b[0] + rx) + ' ' + yy }, g); });
        mk('ellipse', { class: 'iso-t', cx: b[0], cy: t[1], rx: rx, ry: ry }, g);
        label(g, cx, cy, z + h, ry);
      } else {
        mk('polygon', { class: 'iso-l', points: pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)]) }, g);
        mk('polygon', { class: 'iso-r', points: pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)]) }, g);
        mk('polygon', { class: 'iso-t', points: pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]) }, g);
        label(g, x + w / 2, y + d / 2, z + h, (w + d) / 4 * U);
      }
      return { g: g, k: x + w / 2 + y + d / 2 + z };
    });
    /* back to front: later in the file draws on top */
    solids.concat(lifted).sort(function (a, b) { return a.k - b.k; }).forEach(function (s) { s.g.parentNode.appendChild(s.g); });
    $$('text[data-at]', svg).forEach(function (t) { var v = nums(t.getAttribute('data-at')), p = P(v[0], v[1], v[2]); t.setAttribute('x', p[0]); t.setAttribute('y', p[1]); t.parentNode.appendChild(t); });
  }
  $$('svg.iso').forEach(isoBuild);

  /* ---------- moving data: data-flow on an edge sends lit packets along it ----------
     data-flow="2" packets, data-flow-speed="2.4" seconds a trip, data-flow-back runs it the other way.
     Packets run while the drawing is on screen. Reduced motion and print get a still, lit line instead. */
  var flows = [];
  function packet(parent, before, big) {
    var g = mk('g', { class: 'pkt' + (big ? ' pkt-hero' : ''), opacity: 0 }, parent, before);
    mk('circle', { class: 'pkt-halo', r: big ? 15 : 10 }, g); mk('circle', { class: 'pkt-glow', r: big ? 9 : 6.5 }, g); mk('circle', { class: 'pkt-core', r: big ? 5 : 3.6 }, g);
    return g;
  }
  function place(path, t, g) { var L = path.getTotalLength(), p = path.getPointAtLength(L * Math.max(0, Math.min(1, t))); g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')'); }
  $$('svg [data-flow]').forEach(function (el, i) {
    var path = pathOf(el), svg = el.ownerSVGElement; if (!path || !svg) return;
    el.classList.add('flow');
    if (reduce) { el.classList.add('flow-still'); return; }
    var n = Math.max(1, parseInt(el.getAttribute('data-flow'), 10) || 1), f = { path: path, svg: svg, sp: (parseFloat(el.getAttribute('data-flow-speed')) || 2.4) * 1000, back: el.hasAttribute('data-flow-back'), off: (i * .37) % 1, pk: [] };
    /* packets live inside the edge's group, so a hidden (.reveal) edge hides its packets too */
    for (var k = 0; k < n; k++) f.pk.push(el.tagName === 'g' ? packet(el) : packet(el.parentNode, el.nextSibling));
    flows.push(f);
  });
  if (flows.length) {
    /* the loop runs only while at least one drawing with packets is on screen */
    var seen = new Map(), looping = false;
    function tick(ts) {
      var any = false;
      flows.forEach(function (f) {
        if (!seen.get(f.svg)) return; any = true;
        f.pk.forEach(function (g, k) { var t = ((ts / f.sp) + f.off + k / f.pk.length) % 1; g.setAttribute('opacity', Math.min(1, Math.min(t, 1 - t) * 8).toFixed(2)); place(f.path, f.back ? 1 - t : t, g); });
      });
      looping = any; if (any) requestAnimationFrame(tick);
    }
    flows.forEach(function (f) { if (!seen.has(f.svg)) { seen.set(f.svg, false); watch(f.svg, function (v) { seen.set(f.svg, v); if (v && !looping) { looping = true; requestAnimationFrame(tick); } }); } });
  }

  /* ---------- hover terms: a dotted word that shows its meaning on hover, focus or tap ---------- */
  var terms = $$('.term').filter(function (t) { return $(':scope > .term-def', t); });
  var lastPointer = 'mouse';
  document.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; }, true);
  function setOpen(t, on) { t.classList.toggle('open', on); t.setAttribute('aria-expanded', String(on)); }
  function place(t) {
    var card = $(':scope > .term-def', t);
    t.style.setProperty('--term-dx', '0px'); t.classList.toggle('up', false);
    var r = card.getBoundingClientRect(), w = document.documentElement.clientWidth, pad = 12, dx = 0;
    if (r.right > w - pad) dx = w - pad - r.right;
    if (r.left + dx < pad) dx = pad - r.left;
    t.style.setProperty('--term-dx', Math.round(dx) + 'px');
    if (r.bottom > innerHeight - pad && t.getBoundingClientRect().top > r.height + 2 * pad) t.classList.toggle('up', true);
  }
  function closeTerms(but) { terms.forEach(function (t) { if (t !== but && t.classList.contains('open')) setOpen(t, false); }); }
  terms.forEach(function (t, i) {
    var card = $(':scope > .term-def', t);
    if (!card.id) card.id = 'term-def-' + (i + 1);
    card.setAttribute('role', 'tooltip');
    if (!t.hasAttribute('tabindex')) t.tabIndex = 0;
    t.setAttribute('aria-describedby', card.id);
    t.addEventListener('mouseenter', function () { t.classList.toggle('shut', false); place(t); });
    t.addEventListener('mouseleave', function () { t.classList.toggle('shut', false); });
    t.addEventListener('focus', function () { t.classList.toggle('shut', false); place(t); });
    t.addEventListener('blur', function () { t.classList.toggle('shut', false); setOpen(t, false); });
    t.addEventListener('click', function (e) {
      if (lastPointer === 'mouse') return;                /* a mouse shows it on hover; a tap toggles it */
      e.preventDefault();
      var on = !t.classList.contains('open');
      closeTerms(t); setOpen(t, on); t.classList.toggle('shut', false);
      if (on) place(t);
    });
  });
  if (terms.length) {
    document.addEventListener('click', function (e) { if (!e.target.closest('.term')) closeTerms(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      terms.forEach(function (t) { if (t.matches(':hover, :focus, .open')) { t.classList.toggle('shut', true); setOpen(t, false); } });
    });
  }

  /* ---------- linked words: data-hl="key" on words and on shapes lights them up together ---------- */
  $$('[data-hl]').forEach(function (el) {
    var key = el.getAttribute('data-hl'), sel = '[data-hl="' + (window.CSS && CSS.escape ? CSS.escape(key) : key) + '"]', all = function () { return $$(sel); };
    if (!(el instanceof SVGElement)) { el.classList.add('hl'); if (!el.hasAttribute('tabindex')) el.tabIndex = 0; }
    var on = function () { all().forEach(function (x) { x.classList.add('hl-on'); }); }, off = function () { all().forEach(function (x) { x.classList.remove('hl-on'); }); };
    el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off); el.addEventListener('focus', on); el.addEventListener('blur', off);
  });

  /* ---------- scenes: <figure class="fig scene"> with an <ol class="scene-steps"> ----------
     Each <li> is one step: data-edge="id" sends a packet along [data-edge=id] (data-back reverses it),
     data-from / data-node light up [data-node=…] shapes, data-show="#a, .b" reveals .reveal shapes.
     Without the script, and in print, the steps stay a numbered list under the drawing. */
  $$('.scene').forEach(function (fig) {
    var svg = $('.fig-box > svg', fig), list = $('.scene-steps', fig); if (!svg || !list) return;
    var steps = $$('li', list); if (!steps.length) return;
    fig.classList.add('scene-js'); svg.classList.add('scene-svg');
    var ui = document.createElement('div'); ui.className = 'scene-ui';
    ui.innerHTML = '<div class="scene-bar" role="group" aria-label="Scene controls"><button type="button" class="scene-play">▶ Play</button><button type="button" class="scene-prev" aria-label="Back one step">‹</button><button type="button" class="scene-next" aria-label="Next step">›</button><span class="scene-dots" aria-hidden="true"></span><span class="scene-count"></span></div><p class="scene-say" aria-live="polite"></p>';
    list.parentNode.insertBefore(ui, list);
    var dots = $('.scene-dots', ui), say = $('.scene-say', ui), count = $('.scene-count', ui), play = $('.scene-play', ui);
    steps.forEach(function (li, k) { var b = document.createElement('i'); b.title = 'Step ' + (k + 1); b.addEventListener('click', function () { stop(); go(k, true); }); dots.appendChild(b); });
    var hero = packet(svg, null, true), i = -1, playing = false, busy = 0, timer = 0, intro = say.innerHTML = fig.getAttribute('data-intro') || 'Press Play to watch it run, or step through it.';
    function nodes(sel) { return (sel || '').split(/\s+/).filter(Boolean).reduce(function (a, id) { return a.concat($$('[data-node="' + id + '"]', svg)); }, []); }
    function paint(k) {
      $$('.hot', svg).forEach(function (x) { x.classList.remove('hot'); });
      $$('.reveal', svg).forEach(function (x) { x.classList.remove('shown'); });
      for (var j = 0; j <= k; j++) { var sh = steps[j].getAttribute('data-show'); if (sh) $$(sh, svg).forEach(function (x) { x.classList.add('shown'); }); }
      Array.prototype.forEach.call(dots.children, function (b, j) { b.className = j < k ? 'done' : j === k ? 'now' : ''; });
      count.textContent = k < 0 ? steps.length + ' steps' : (k + 1) + ' / ' + steps.length;
      say.innerHTML = k < 0 ? intro : steps[k].innerHTML;
      fig.classList.toggle('playing', playing); svg.classList.toggle('scene-on', playing);
    }
    function go(k, animate) {
      i = k; paint(k); var li = steps[k], id = busy = busy + 1;
      var e = li.getAttribute('data-edge'), path = e && pathOf($('[data-edge="' + e + '"]', svg)), back = li.hasAttribute('data-back');
      nodes(li.getAttribute('data-from')).forEach(function (x) { x.classList.add('hot'); });
      return new Promise(function (res) {
        function land() { if (id !== busy) return res(); hero.setAttribute('opacity', 0); $$('.hot', svg).forEach(function (x) { x.classList.remove('hot'); }); nodes(li.getAttribute('data-node')).forEach(function (x) { x.classList.add('hot'); }); res(); }
        if (!path || !animate || reduce) { if (path) { hero.setAttribute('opacity', 1); place(path, back ? 0 : 1, hero); } return setTimeout(land, reduce ? 0 : 60); }
        var t0 = performance.now(), dur = Math.max(700, Math.min(1600, path.getTotalLength() * 3.2));
        hero.setAttribute('opacity', 1);
        (function f(now) { if (id !== busy) return res(); var q = Math.min(1, (now - t0) / dur); place(path, back ? 1 - ease(q) : ease(q), hero); if (q < 1) requestAnimationFrame(f); else land(); })(t0);
      });
    }
    function stop() { playing = false; clearTimeout(timer); play.textContent = i >= steps.length - 1 ? '↺ Replay' : '▶ Play'; fig.classList.remove('playing'); svg.classList.remove('scene-on'); }
    function run() {
      if (!playing) return;
      if (i >= steps.length - 1) { stop(); return; }
      go(i + 1, true).then(function () { if (playing) timer = setTimeout(run, 650); });
    }
    play.addEventListener('click', function () { if (playing) { stop(); return; } if (i >= steps.length - 1) { i = -1; paint(-1); } clearTimeout(timer); playing = true; play.textContent = '❚❚ Pause'; fig.classList.add('playing'); svg.classList.add('scene-on'); run(); });
    $('.scene-next', ui).addEventListener('click', function () { stop(); if (i < steps.length - 1) go(i + 1, true); });
    $('.scene-prev', ui).addEventListener('click', function () { stop(); if (i > 0) go(i - 1, false); else { i = -1; busy++; hero.setAttribute('opacity', 0); paint(-1); } });
    paint(-1);
  });

  /* ---------- expand: every drawing opens in a full-window view with zoom and pan ----------
     On a phone, a drawing too wide for the screen shows whole, small, with "Tap to expand". */
  var narrow = matchMedia('(max-width: 600px)');
  $$('.fig').forEach(function (fig) {
    var box = $('.fig-box', fig), svg = box && $(':scope > svg', box), v = svg && vb(svg); if (!v) return;
    box.classList.add('xp-ready');
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fig-x'; btn.setAttribute('aria-label', 'Expand drawing'); btn.title = 'Expand (zoom and pan)'; btn.innerHTML = '<span aria-hidden="true">⤢</span><span class="fig-x-t">Expand</span>';
    box.appendChild(btn);
    var minW = svg.style.minWidth;
    function peek() { var on = narrow.matches && parseFloat(minW) > box.clientWidth + 1; fig.classList.toggle('peek', on); svg.style.minWidth = on ? '0' : minW; }
    peek(); narrow.addEventListener('change', peek); if ('ResizeObserver' in window) new ResizeObserver(peek).observe(box);
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(fig); });
    box.addEventListener('click', function (e) { if (fig.classList.contains('peek') && !e.target.closest('button, a')) open(fig); });
  });
  function open(fig) {
    var box = $('.fig-box', fig), svg = $(':scope > svg', box), v = vb(svg), ui = $('.scene-ui', fig), back = document.activeElement;
    var cap = $('figcaption', fig), keep = document.createElement('div');
    keep.style.height = box.getBoundingClientRect().height - 26 + 'px'; svg.parentNode.insertBefore(keep, svg);
    var uiHome = ui && ui.parentNode, uiNext = ui && ui.nextSibling;
    var ov = document.createElement('div'); ov.className = 'xp'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', (svg.getAttribute('aria-label') || 'Drawing') + ', expanded');
    ov.innerHTML = '<div class="xp-bar"><span class="xp-title"></span><button type="button" data-x="out" aria-label="Zoom out">−</button><button type="button" data-x="in" aria-label="Zoom in">+</button><button type="button" data-x="reset" aria-label="Fit to window">↺</button><button type="button" data-x="close" class="xp-close" aria-label="Close (Esc)">✕</button></div><div class="xp-stage"><div class="xp-pan"></div></div>';
    $('.xp-title', ov).textContent = cap ? cap.textContent : '';
    var stage = $('.xp-stage', ov), pan = $('.xp-pan', ov);
    pan.style.width = v.w + 'px'; pan.style.height = v.h + 'px';
    var oldStyle = svg.getAttribute('style'); svg.setAttribute('style', 'width:100%;height:100%;max-width:none;min-width:0');
    pan.appendChild(svg); if (ui) ov.appendChild(ui);
    var behind = Array.prototype.filter.call(document.body.children, function (c) { return !c.inert; });
    behind.forEach(function (c) { c.inert = true; });
    document.body.appendChild(ov); root.classList.add('vw-lock');
    var eng = Engine(stage, pan, { w: v.w, h: v.h, max: 6, onchange: function () {} });
    requestAnimationFrame(function () { eng.refit(); eng.reset(); });
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { eng.refit(); }) : null; if (ro) ro.observe(stage);
    function close() {
      if (ro) ro.disconnect(); document.removeEventListener('keydown', key, true);
      if (oldStyle === null) svg.removeAttribute('style'); else svg.setAttribute('style', oldStyle);
      keep.parentNode.insertBefore(svg, keep); keep.remove(); if (ui) uiHome.insertBefore(ui, uiNext);
      behind.forEach(function (c) { c.inert = false; }); ov.remove(); root.classList.remove('vw-lock'); if (back && back.focus) back.focus({ preventScroll: true });
    }
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === '+' || e.key === '=') eng.zoomAt(1.4, stage.clientWidth / 2, stage.clientHeight / 2, true);
      else if (e.key === '-') eng.zoomAt(1 / 1.4, stage.clientWidth / 2, stage.clientHeight / 2, true);
      else if (e.key === '0') eng.reset(true);
      else if (e.key === 'Tab') { var f = $$('button', ov); if (!ov.contains(document.activeElement)) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); } else if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
    }
    document.addEventListener('keydown', key, true);
    ov.addEventListener('click', function (e) { var b = e.target.closest('[data-x]'); if (!b) return; var a = b.getAttribute('data-x'), c = [stage.clientWidth / 2, stage.clientHeight / 2];
      if (a === 'close') close(); else if (a === 'in') eng.zoomAt(1.4, c[0], c[1], true); else if (a === 'out') eng.zoomAt(1 / 1.4, c[0], c[1], true); else eng.reset(true); });
    stage.addEventListener('wheel', function (e) { e.preventDefault(); var b = stage.getBoundingClientRect(), m = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stage.clientHeight : 1; if (e.ctrlKey || e.metaKey) eng.zoomAt(Math.exp(-e.deltaY * m * .01), e.clientX - b.left, e.clientY - b.top); else eng.panBy(-e.deltaX * m, -e.deltaY * m); }, { passive: false });
    $('.xp-close', ov).focus();
  }
})();
