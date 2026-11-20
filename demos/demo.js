/* ==========================================================================
   Shared code for the interactive demos (demos/*.html)
   Loaded in each page's <head> (not deferred), before the page's own script:
     <script src="/demos/demo.js"></script>
   - Previous / next links between the demos (the DEMOS list, in course order)
   - Embed mode: ?embed=1 hides the site menu and footer and adds a credit line
   - window.Demo: small helpers every demo uses (canvas sizing, tick values,
     tick labels, log-axis ticks, KaTeX rendering, zoom and pan along x)
   Page-specific plotting (frame, line, stems, ...) stays in each page.
   ========================================================================== */
(function () {
  'use strict';

  // ---------- The demos in course order (as on teaching.html): previous / next links ----------
  var DEMOS = [
    ['lti-systems', 'Linearity and Time Invariance'],
    ['convolution-impulses', 'Convolution from Impulse Responses'],
    ['convolution-flip-slide', 'Convolution: Flip and Slide'],
    ['fourier-intuition', 'Why Fourier Analysis Works'],
    ['fourier-series', 'Fourier Series Coefficients'],
    ['fourier-transform', 'Frequency Response'],
    ['fourier-filtering', 'Filtering Signals and Audio'],
    ['ft-properties', 'Fourier Transform Properties'],
    ['sampling-aliasing', 'Sampling and Aliasing'],
    ['poles-zeros', 'Poles, Zeros and Frequency Response']
  ];

  // ---------- Embed mode (?embed=1), e.g. inside a Brightspace page ----------
  var COPYRIGHT_YEARS = '2021&ndash;2026';          // keep in step with the site footer
  var EMBED = /[?&]embed=1(&|$)/.test(location.search);
  if (EMBED) document.documentElement.classList.add('embed');

  document.addEventListener('DOMContentLoaded', function () {
    var panel = document.querySelector('main .panel') || document.body;

    // Previous / all demos / next, at the end of the page. In embed mode the links stay in
    // embed mode, so a student can step through the demos inside the same frame.
    var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var i = DEMOS.map(function (d) { return d[0]; }).indexOf(slug);
    if (i >= 0) {
      var q = EMBED ? '?embed=1' : '';
      var link = function (d, cls, label) {
        return '<a class="demo-nav-link ' + cls + '" href="/demos/' + d[0] + '.html' + q + '">' +
          '<span class="demo-nav-dir">' + label + '</span><span class="demo-nav-title">' + d[1] + '</span></a>';
      };
      var nav = document.createElement('nav');
      nav.className = 'demo-nav';
      nav.setAttribute('aria-label', 'Other demos');
      nav.innerHTML =
        (i > 0 ? link(DEMOS[i - 1], 'prev', '&larr; Previous') : '<span></span>') +
        '<a class="demo-nav-all" href="/teaching.html#demos"' + (EMBED ? ' target="_blank" rel="noopener"' : '') + '>All demos</a>' +
        (i < DEMOS.length - 1 ? link(DEMOS[i + 1], 'next', 'Next &rarr;') : '<span></span>');
      panel.appendChild(nav);
    }

    if (EMBED) {
      var p = document.createElement('p');
      p.className = 'embed-credit';
      p.innerHTML = 'Interactive demo &copy; ' + COPYRIGHT_YEARS +
        ' <a href="/teaching.html" target="_blank" rel="noopener">Ahmed Hamdi Sakr</a> &middot; ' +
        '<a href="' + location.pathname + '" target="_blank" rel="noopener">Open the full page &#8599;</a>';
      panel.appendChild(p);
    }
  });

  // ---------- Helpers ----------
  // Font for canvas tick labels (matches the KaTeX math in the page)
  var MATH_FONT = '13px KaTeX_Main, "Times New Roman", Times, serif';

  // Size the canvas backing store to its CSS size x devicePixelRatio; returns the logical size.
  function fitCanvas(canvas) {
    var d = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    var pw = Math.round(w * d), ph = Math.round(h * d);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    canvas.getContext('2d').setTransform(d, 0, 0, d, 0, 0);
    return { width: w, height: h };
  }

  // Tick label: 3 significant digits, "0" for zero, "1.5k" from 1000 up
  function fmtTick(u) {
    if (Math.abs(u) < 1e-12) return '0';
    if (Math.abs(u) >= 1000) return Number((u / 1000).toPrecision(3)) + 'k';
    return String(Number(u.toPrecision(3)));
  }

  // Round tick values (steps of 1, 2, 2.5 or 5 times a power of ten), about `target` of them
  function niceTicks(lo, hi, target) {
    if (target === undefined) target = 5;
    if (!(hi > lo)) return [lo];
    var e = Math.floor(Math.log10((hi - lo) / target)), best = null;
    [e - 1, e, e + 1].forEach(function (p) {
      [1, 2, 2.5, 5].forEach(function (m) {
        var s = m * Math.pow(10, p);
        var n = Math.floor(hi / s + 1e-9) - Math.ceil(lo / s - 1e-9) + 1;
        var score = Math.abs(n - target);
        if (!best || score < best.score || (score === best.score && s > best.s)) best = { s: s, score: score };
      });
    });
    var out = [];
    for (var k = Math.ceil(lo / best.s - 1e-9); k * best.s <= hi + 1e-9 * best.s; k++) out.push(k === 0 ? 0 : k * best.s);
    return out;
  }

  // Log axis (Bode plots): labelled ticks at each decade, minor grid lines at 2..9 times each decade
  function logTicks(lo, hi) {
    var major = [], minor = [];
    for (var e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
      for (var m = 1; m <= 9; m++) {
        var v = m * Math.pow(10, e);
        if (v < lo * (1 - 1e-9) || v > hi * (1 + 1e-9)) continue;
        (m === 1 ? major : minor).push(Number(v.toPrecision(6)));
      }
    }
    return { major: major, minor: minor };
  }
  // n points spaced evenly on a log scale from lo to hi
  function logSpace(lo, hi, n) {
    var a = Math.log10(lo), b = Math.log10(hi), out = new Float64Array(n);
    for (var i = 0; i < n; i++) out[i] = Math.pow(10, a + (b - a) * i / (n - 1));
    return out;
  }

  // KaTeX rendering (KaTeX itself is loaded with `defer`, so it may not be ready yet: returns false then)
  function renderTeX(el, tex, display) {
    if (!el || !window.katex) return false;
    try { katex.render(tex, el, { throwOnError: false, displayMode: !!display }); return true; }
    catch (e) { return false; }
  }
  // Set an element to a KaTeX string (pages re-render [data-tex] on load); plain text as fallback
  function setTeX(el, tex, fallback) {
    if (!el) return;
    el.dataset.tex = tex;
    if (!renderTeX(el, tex, false)) el.textContent = fallback;
  }

  // ---------- Zoom and pan along x, shared by a group of canvases with one x-axis ----------
  // Ctrl + scroll (a trackpad pinch sends the same) or a two-finger pinch zooms; plain scrolling
  // still scrolls the page, so a plot never traps the scroll inside an embed. Drag pans,
  // double-click resets. The view stays inside `bounds` (default: the default range itself).
  //   var z = Demo.zoomX([canvasA, canvasB], {range: [0, 1], left: 56, right: 12, onChange: draw});
  //   in draw(): var xr = z.range();
  //   z.setDefault([0, T]) when the page's default range changes (keeps the view otherwise)
  // left/right: the plot margins in CSS px, so the zoom centres on the point under the cursor.
  var ZOOM_HINT = 'Ctrl + scroll or pinch to zoom, drag to pan, double-click to reset';
  function zoomX(canvases, opts) {
    var left = opts.left || 0, right = opts.right || 0, minFrac = opts.minFrac || 0.02;
    var def = opts.range.slice(), view = def.slice(), fixedBounds = opts.bounds ? opts.bounds.slice() : null;
    var pending = false;
    function changed() {                       // redraw once per frame however many events arrive
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; opts.onChange(); });
    }
    function clamp(a, w) {
      var B = fixedBounds || def, full = B[1] - B[0];
      w = Math.max(Math.min(w, full), full * minFrac);      // minFrac: the deepest zoom, as a fraction of the bounds
      a = Math.min(Math.max(a, B[0]), B[1] - w);
      return [a, a + w];
    }
    function where(canvas, clientX) {         // position across the plot area, 0..1
      var r = canvas.getBoundingClientRect(), w = Math.max(1, r.width - left - right);
      return { u: Math.min(1, Math.max(0, (clientX - r.left - left) / w)), w: w };
    }
    canvases.forEach(function (c) {
      c.style.touchAction = 'pan-y';           // vertical swipes still scroll the page
      c.style.cursor = 'grab';
      c.title = ZOOM_HINT;
      var pts = {}, start = null;
      function begin() {                       // (re)start a pan or pinch from the current pointers
        var ids = Object.keys(pts);
        start = { view: view.slice(), x: pts[ids[0]] };
        if (ids.length > 1) { start.d = Math.abs(pts[ids[1]] - pts[ids[0]]); start.mid = (pts[ids[0]] + pts[ids[1]]) / 2; }
      }
      c.addEventListener('wheel', function (e) {
        if (!e.ctrlKey && !e.metaKey) return;  // plain scroll: leave it to the page
        e.preventDefault();
        var u = where(c, e.clientX).u, a = view[0], w = view[1] - view[0], xm = a + u * w;
        var k = Math.min(2, Math.max(0.5, Math.exp(e.deltaY * 0.002)));
        view = clamp(xm - u * w * k, w * k); changed();
      }, { passive: false });
      c.addEventListener('pointerdown', function (e) {
        pts[e.pointerId] = e.clientX;
        try { c.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        c.style.cursor = 'grabbing';
        begin();
      });
      c.addEventListener('pointermove', function (e) {
        if (!(e.pointerId in pts) || !start) return;
        pts[e.pointerId] = e.clientX;
        var ids = Object.keys(pts), a = start.view[0], w = start.view[1] - start.view[0];
        if (ids.length > 1 && start.d > 20) {  // pinch: keep the point under the fingers' midpoint fixed
          var d = Math.abs(pts[ids[1]] - pts[ids[0]]), mid = (pts[ids[1]] + pts[ids[0]]) / 2;
          var p0 = where(c, start.mid), p1 = where(c, mid), xm = a + p0.u * w, w2 = w * start.d / Math.max(1, d);
          view = clamp(xm - p1.u * w2, w2);
        } else {                               // pan
          var ww = where(c, 0).w;
          view = clamp(a - (e.clientX - start.x) / ww * w, w);
        }
        changed();
      });
      function end(e) {
        delete pts[e.pointerId];
        if (Object.keys(pts).length) begin(); else { start = null; c.style.cursor = 'grab'; }
      }
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('dblclick', function () { view = def.slice(); changed(); });
    });
    return {
      range: function () { return view.slice(); },
      // new default range: the view resets only when it actually changes
      setDefault: function (r) {
        if (r[0] === def[0] && r[1] === def[1]) return;
        def = r.slice(); view = clamp(def[0], def[1] - def[0]);
      },
      reset: function () { view = clamp(def[0], def[1] - def[0]); }
    };
  }

  window.Demo = {
    MATH_FONT: MATH_FONT, fitCanvas: fitCanvas, fmtTick: fmtTick, niceTicks: niceTicks,
    renderTeX: renderTeX, setTeX: setTeX, zoomX: zoomX, ZOOM_HINT: ZOOM_HINT,
    logTicks: logTicks, logSpace: logSpace
  };
})();
