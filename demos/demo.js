/* ==========================================================================
   Shared code for the interactive demos (demos/*.html)
   Loaded in each page's <head> (not deferred), before the page's own script:
     <script src="/demos/demo.js"></script>
   - Embed mode: ?embed=1 hides the site menu and footer and adds a credit line
   - window.Demo: small helpers every demo uses (canvas sizing, tick values,
     tick labels, KaTeX rendering)
   Page-specific plotting (frame, line, stems, ...) stays in each page.
   ========================================================================== */
(function () {
  'use strict';

  // ---------- Embed mode (?embed=1), e.g. inside a Brightspace page ----------
  var COPYRIGHT_YEARS = '2021&ndash;2026';          // keep in step with the site footer
  if (/[?&]embed=1(&|$)/.test(location.search)) {
    document.documentElement.classList.add('embed');
    document.addEventListener('DOMContentLoaded', function () {
      var p = document.createElement('p');
      p.className = 'embed-credit';
      p.innerHTML = 'Interactive demo &copy; ' + COPYRIGHT_YEARS +
        ' <a href="/teaching.html" target="_blank" rel="noopener">Ahmed Hamdi Sakr</a> &middot; ' +
        '<a href="' + location.pathname + '" target="_blank" rel="noopener">Open the full page &#8599;</a>';
      var panel = document.querySelector('main .panel');
      (panel || document.body).appendChild(p);
    });
  }

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

  window.Demo = {
    MATH_FONT: MATH_FONT, fitCanvas: fitCanvas, fmtTick: fmtTick, niceTicks: niceTicks,
    renderTeX: renderTeX, setTeX: setTeX
  };
})();
