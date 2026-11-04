/* Afra Safar — accessible, cross-page light/dark appearance switcher.
   Does not modify any application or Supabase logic. */
(function () {
  'use strict';
  const KEY = 'afra-theme-preference';
  const ROOT = document.documentElement;
  const MEDIA = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 14.2A8.4 8.4 0 0 1 9.8 3.6a8.5 8.5 0 1 0 10.6 10.6Z"/></svg>';
  const sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>';

  function storedPreference() {
    try {
      const value = localStorage.getItem(KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (_) { return null; }
  }
  function systemTheme() { return MEDIA && MEDIA.matches ? 'dark' : 'light'; }
  function currentTheme() { return ROOT.getAttribute('data-afra-theme') === 'dark' ? 'dark' : 'light'; }
  function renderToggle() {
    const btn = document.getElementById('afraThemeToggle');
    if (!btn) return;
    const isDark = currentTheme() === 'dark';
    const icon = btn.querySelector('.afra-theme-switch__icon');
    const caption = btn.querySelector('.afra-theme-switch__label');
    if (icon) icon.innerHTML = isDark ? sun : moon;
    if (caption) caption.textContent = isDark ? 'حالت روشن' : 'حالت تاریک';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'فعال کردن حالت روشن' : 'فعال کردن حالت تاریک');
    btn.title = isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک';
  }
  function applyTheme(value) {
    ROOT.setAttribute('data-afra-theme', value === 'dark' ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', value === 'dark' ? '#121212' : '#123d32');
    renderToggle();
  }
  function persist(value) {
    try { localStorage.setItem(KEY, value); } catch (_) { /* Still works for this page */ }
  }

  function install() {
    if (document.getElementById('afraThemeToggle')) return;
    const button = document.createElement('button');
    button.id = 'afraThemeToggle';
    button.className = 'afra-theme-switch';
    button.type = 'button';
    button.innerHTML = '<span class="afra-theme-switch__icon" aria-hidden="true"></span><span class="afra-theme-switch__label"></span>';

    // Find a natural, existing header action area. Registration has no action bar.
    const page = (document.body.getAttribute('data-afra-page') || location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const targets = {
      'index.html': '.header-inner',
      'cottage.html': '.header-actions',
      'villa.html': '.afv-header-inner',
      'luxury-villa.html': '.site-header .header-inner',
      'property.html': 'header.nav',
      'my-reservations.html': 'header .nav',
      'owner-login.html': 'header .header-inner',
      'owner-dashboard.html': '.top-actions',
      'owner-reservations.html': 'header',
      'admin.html': '.topbar'
    };
    const target = page === 'owner-register.html' ? null :
      (document.querySelector(targets[page] || 'header') || document.querySelector('header'));
    if (target) {
      target.appendChild(button);
    } else {
      button.classList.add('afra-theme-switch--floating');
      document.body.appendChild(button);
    }
    if (['index.html', 'owner-login.html', 'owner-dashboard.html', 'owner-reservations.html', 'admin.html'].includes(page)) {
      button.classList.add('afra-theme-switch--on-dark');
    }
    renderToggle();
    button.addEventListener('click', function () {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      persist(next);
      applyTheme(next);
    });
  }
  applyTheme(storedPreference() || systemTheme());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  if (MEDIA) {
    const syncOS = () => { if (!storedPreference()) applyTheme(systemTheme()); };
    if (typeof MEDIA.addEventListener === 'function') MEDIA.addEventListener('change', syncOS);
    else if (typeof MEDIA.addListener === 'function') MEDIA.addListener(syncOS);
  }
  window.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === null) applyTheme(storedPreference() || systemTheme());
  });
})();
