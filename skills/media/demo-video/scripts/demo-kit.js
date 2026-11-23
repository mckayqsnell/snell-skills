// Demo kit: helpers for screen-recording scenes in HyperFrames. Everything is a pure function of timeline time.
//
// Layout: the recording plays on a "screen" (1920x1080 at zoom 1, so 1 recording CSS px = 1920 / viewport width
// frame px) inside a camera (.cam, transform-origin 0 0). A viewport clip-path shows it full-frame (the default: the app
// at its biggest, nothing cropped) or in an inset window (box: 'inset'), for a beat with a caption beside the app.
// Needs gsap and this markup in the scene: .window > .viewport > .cam > video.screen-video + svg.cursor (and optional
// .ring, .aura inside .window for a glowing inset frame). Set the inset with DemoKit.setInset({ x, y, w, h, r }) before binding scenes.
//
//   const kit = DemoKit.scene(rootEl, clipData)      bind a scene (clipData = window.__demo[name] from cut.mjs)
//   kit.shot(tl, at, dur, { rect, z, box, ease, anchor })    move the camera (rect in recording CSS px). z is relative to the
//                                                    box: 1 shows the whole page, filling the box (the default), 1.2
//                                                    is a 20% punch-in. Capped at DemoKit.setMaxZoom() (1.3), so at
//                                                    least ~3/4 of the app always stays on screen
//   DemoKit.setMaxZoom(z)                            raise the cap for one tight shot (a single line being typed)
//   kit.cursor(tl, duration)                         replay the recorded pointer, drawn smooth
//   kit.caption(tl, el, at, hold, style)             reveal a caption, hold it still, blur it out
//   kit.src(t)                                       cut time of SOURCE time t in the raw take (through the speed
//                                                    ramps), so re-timing a ramp never knocks a shot off its target
(function () {
  var W = 1920; var H = 1080;
  // 16:9 like the page, so the base shot shows the whole app with nothing cropped (at 1 CSS px per frame px).
  var INSET = { x: 592, y: 180, w: 1280, h: 720, r: 20 };
  var MAXZ = 1.3; // the gentlest zoom that still reads: more crops the app's nav and loses the viewer
  var S = 1.5; // frame px per recording CSS px; scene() sets it from the clip's viewport
  var FULL = { x: 0, y: 0, w: W, h: H, r: 0 };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  function pointerAt(events, t) {
    var pos = { x: -100, y: -100 }; var press = 0;
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.t > t) break;
      if (e.type === 'cursor') pos = { x: e.x, y: e.y };
      if (e.type === 'move') {
        var k = easeInOut(clamp((t - e.t) / (e.ms / 1000), 0, 1));
        var dx = e.to.x - e.from.x; var dy = e.to.y - e.from.y; var d = Math.hypot(dx, dy) || 1;
        var arc = Math.sin(Math.PI * k) * e.bend;
        pos = { x: e.from.x + dx * k + (-dy / d) * arc, y: e.from.y + dy * k + (dx / d) * arc };
      }
      if (e.type === 'down') {
        var since = t - e.t; // press in 70 ms, release over 180 ms; the UI's own response is the feedback
        press = since < 0.07 ? since / 0.07 : since < 0.25 ? 1 - (since - 0.07) / 0.18 : 0;
      }
    }
    return { x: pos.x, y: pos.y, press: clamp(press, 0, 1) };
  }

  function clipPath(b) {
    return 'inset(' + b.y + 'px ' + (W - b.x - b.w) + 'px ' + (H - b.y - b.h) + 'px ' + b.x + 'px round ' + b.r + 'px)';
  }

  // Camera transform that puts a recording rect (CSS px) in the middle of box at zoom z (frame px per screen px),
  // never showing past the recording's edge inside the box.
  // anchor 'tl' pins the page's top-left corner (logo, breadcrumb); the rect must sit inside what stays on screen.
  function frame(rect, z, box, anchor) {
    box = box || FULL;
    var sx = rect.x * S; var sy = rect.y * S; var sw = rect.w * S; var sh = rect.h * S;
    var x = box.x + box.w / 2 - (sx + sw / 2) * z;
    var y = box.y + box.h / 2 - (sy + sh / 2) * z;
    if (anchor === 'tl') { x = box.x; y = box.y; }
    // never show past the recording's edge; when the recording is smaller than the box, center it instead
    x = W * z >= box.w ? clamp(x, box.x + box.w - W * z, box.x) : box.x + (box.w - W * z) / 2;
    y = H * z >= box.h ? clamp(y, box.y + box.h - H * z, box.y) : box.y + (box.h - H * z) / 2;
    return { x: x, y: y, scale: z };
  }

  function scene(root, clip) {
    if (clip && clip.viewport && clip.viewport.width) S = W / clip.viewport.width;
    var VW = clip && clip.viewport ? clip.viewport.width : 1280; var VH = clip && clip.viewport ? clip.viewport.height : 720;
    var q = function (s) { return root.querySelector(s); };
    var cam = q('.cam'); var view = q('.viewport'); var ring = q('.ring'); var aura = q('.aura');
    var cursorEl = q('.cursor');

    function shot(tl, at, dur, o) {
      var box = o.box === 'inset' ? INSET : FULL;
      var fit = Math.min(box.w / W, box.h / (VH * S)); // the zoom that shows the whole page in this box
      var rel = Math.min(o.z || 1, MAXZ);
      if ((o.z || 1) > MAXZ) console.warn('kit.shot: z ' + o.z + ' capped at ' + MAXZ + ' (DemoKit.setMaxZoom to allow)');
      var to = frame(o.rect || { x: 0, y: 0, w: VW, h: VH }, fit * rel, box, o.anchor);
      var ease = o.ease || 'power2.inOut';
      if (dur === 0) {
        tl.set(cam, to, at); tl.set(view, { clipPath: clipPath(box) }, at);
        if (ring) tl.set([ring, aura], { opacity: box === FULL ? 0 : 1 }, at);
        return;
      }
      tl.to(cam, { x: to.x, y: to.y, scale: to.scale, duration: dur, ease: ease }, at);
      tl.to(view, { clipPath: clipPath(box), duration: dur, ease: ease }, at);
      if (ring) tl.to([ring, aura], { opacity: box === FULL ? 0 : 1, duration: dur * 0.6, ease: 'power2.out' }, at);
    }

    // The pointer is drawn in screen space (it zooms with the UI), counter-scaled so it stays 40-70 px on frame.
    function cursor(tl, duration) {
      var proxy = { t: 0 };
      var draw = function () {
        var p = pointerAt(clip.events, proxy.t);
        var z = gsap.getProperty(cam, 'scale') || 1;
        var s = Math.pow(z, -0.55) * (1 - 0.16 * p.press);
        cursorEl.style.transform = 'translate(' + (p.x * S).toFixed(2) + 'px,' + (p.y * S).toFixed(2) + 'px) scale(' + s.toFixed(3) + ')';
      };
      tl.fromTo(proxy, { t: 0 }, { t: duration, duration: duration, ease: 'none', onUpdate: draw }, 0);
      draw();
    }

    // style: 'words' (per-word blur in), 'line' (whole line blurs in), 'ink' (per word grey to ink),
    //        'pill' (the line and its background pill rise in together). Every caption leaves as one block.
    function caption(tl, el, at, hold, style) {
      var words = splitWords(el);
      // the line exists only inside its own window, so several captions can share one place in a scene
      tl.set(el, { opacity: 0 }, 0);
      tl.set(el, { opacity: 1 }, at);
      if (style === 'pill') {
        tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' }, at);
      } else if (style === 'line') {
        tl.fromTo(el, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.2, ease: 'power3.out' }, at);
      } else if (style === 'ink') {
        var ink = getComputedStyle(el).color; // the caption's own ink, so a light stage works too
        tl.fromTo(words, { opacity: 0.18, color: ink }, { opacity: 1, duration: 0.16, stagger: 0.09, ease: 'power2.out' }, at);
      } else {
        tl.fromTo(words, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.14, stagger: 0.07, ease: 'power3.out' }, at);
      }
      var out = at + hold;
      // a quick exit, so the next caption in the same spot never overlaps this one
      // The whole element fades with its words, so a background never stays behind as an empty box and no
      // half-gone line reads as a different sentence.
      tl.to(el, { opacity: 0, filter: 'blur(8px)', duration: 0.16, ease: 'power2.in' }, out);
    }

    function src(t) {
      var seg = (clip && clip.segments) || [];
      // a freeze wins: its t may also sit inside an earlier kept span
      for (var j = 0; j < seg.length; j++) if (seg[j].hold && Math.abs(t - seg[j].from) < 1e-6) return seg[j].at;
      for (var i = 0; i < seg.length; i++) {
        var g = seg[i];
        if (g.hold) { if (Math.abs(t - g.from) < 1e-6) return g.at; continue; }
        if (t >= g.from && t <= g.to) return g.at + (t - g.from) / g.speed;
      }
      throw new Error('source time not in the cut: ' + t);
    }

    return { shot: shot, cursor: cursor, caption: caption, src: src, frame: frame, clip: clip };
  }

  // Wraps each word of an element's text in a span; keeps inline markup (e.g. the accent word) intact.
  function splitWords(el) {
    if (el.__words) return el.__words;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          if (n.classList.contains('accent')) { n.classList.add('w'); } else { walk(n); }
        }
      });
    };
    walk(el);
    el.__words = el.querySelectorAll('.w');
    return el.__words;
  }

  // Vertical video: DemoKit.setFrame(1080, 1920) before binding scenes.
  function setFrame(w, h) { W = w; H = h; FULL.w = w; FULL.h = h; }
  function setMaxZoom(z) { MAXZ = z; }
  function setInset(b) { INSET.x = b.x; INSET.y = b.y; INSET.w = b.w; INSET.h = b.h; INSET.r = b.r == null ? INSET.r : b.r; }

  window.DemoKit = { setFrame: setFrame, setInset: setInset, setMaxZoom: setMaxZoom, scene: scene, pointerAt: pointerAt, frame: frame, clipPath: clipPath, INSET: INSET, FULL: FULL, splitWords: splitWords };
})();
