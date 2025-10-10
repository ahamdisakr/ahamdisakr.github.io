
// app.js — shared behavior for nav + icons
document.addEventListener('DOMContentLoaded', function () {
  const menuBtn = document.getElementById('menuBtn');
  const mobile = document.getElementById('mobile-nav');
  const current = document.body && document.body.dataset ? document.body.dataset.page : "";

  // Highlight current page in both navs
  if (current) {
    document.querySelectorAll('[data-nav="' + current + '"]').forEach(a => a.classList.add('nav-active'));
  }

  // Burger toggle
  if (menuBtn && mobile) {
    // Ensure initial hidden state for mobile menu
    if (!mobile.classList.contains('hidden')) {
      mobile.classList.add('hidden');
    }
    mobile.setAttribute('aria-hidden', 'true');

    menuBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
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
});
