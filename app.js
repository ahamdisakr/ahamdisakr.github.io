// app.js — shared behavior: loads the nav (nav.html), highlights the current page, mobile menu, icons
document.addEventListener('DOMContentLoaded', function () {
  var current = document.body.dataset.page || '';

  function initNav() {
    var menuBtn = document.getElementById('menuBtn');
    var mobile = document.getElementById('mobile-nav');

    if (current) {
      document.querySelectorAll('[data-nav="' + current + '"]').forEach(function (a) {
        a.classList.add('nav-active');
        a.setAttribute('aria-current', 'page');
      });
    }

    if (menuBtn && mobile) {
      var setOpen = function (open) {
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        mobile.classList.toggle('hidden', !open);
        mobile.setAttribute('aria-hidden', String(!open));
      };
      setOpen(false);
      menuBtn.addEventListener('click', function () {
        setOpen(menuBtn.getAttribute('aria-expanded') !== 'true');
      });
      mobile.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          menuBtn.focus();
        }
      });
    }

    if (window.feather) window.feather.replace();
  }

  var placeholder = document.getElementById('site-nav');
  if (!placeholder) return initNav();
  fetch('/nav.html')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (html) { placeholder.outerHTML = html; })
    .catch(function () {})
    .then(initNav);
});
