// app.js — shared behavior for nav + icons
document.addEventListener('DOMContentLoaded', function () {
  var current = document.body && document.body.dataset ? document.body.dataset.page : "";

  function initNav() {
    var menuBtn = document.getElementById('menuBtn');
    var mobile = document.getElementById('mobile-nav');

    // Highlight current page in both navs
    if (current) {
      document.querySelectorAll('[data-nav="' + current + '"]').forEach(function (a) {
        a.classList.add('nav-active');
      });
    }

    // Burger toggle
    if (menuBtn && mobile) {
      if (!mobile.classList.contains('hidden')) {
        mobile.classList.add('hidden');
      }
      mobile.setAttribute('aria-hidden', 'true');

      menuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', String(!isOpen));
        menuBtn.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');

        if (mobile.classList.contains('hidden')) {
          mobile.classList.remove('hidden');
          mobile.setAttribute('aria-hidden', 'false');
        } else {
          mobile.classList.add('hidden');
          mobile.setAttribute('aria-hidden', 'true');
        }
      }, { passive: true });
    }

    // Render Feather icons if available
    if (window.feather && typeof window.feather.replace === 'function') {
      window.feather.replace();
    }
  }

  var placeholder = document.getElementById('site-nav');
  if (placeholder) {
    fetch('nav.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        placeholder.outerHTML = html;
        initNav();
      })
      .catch(function () { initNav(); });
  } else {
    initNav();
  }
});
