/* Public site tabs share the existing guest routes. */
(() => {
  'use strict';

  const items = [
    {
      href: 'index.html',
      label: 'خانه',
      pages: ['index.html', 'search.html', 'search-results.html', 'categories.html', 'cities.html', 'regions.html', 'map.html', 'property.html', 'villa.html', 'cottage.html', 'luxury-villa.html'],
      icon: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>'
    },
    {
      href: 'favorites.html',
      label: 'علاقه‌مندی‌ها',
      pages: ['favorites.html', 'compare.html'],
      icon: '<path d="M20.8 8.6c0 4-8.8 9.8-8.8 9.8s-8.8-5.8-8.8-9.8a4.7 4.7 0 0 1 8.8-2.1 4.7 4.7 0 0 1 8.8 2.1Z"/>'
    },
    {
      href: 'my-reservations.html',
      label: 'سفرهای من',
      pages: ['my-reservations.html', 'account-bookings.html', 'reservation-status.html', 'booking.html', 'payment.html', 'payment-result.html', 'booking-voucher.html'],
      icon: '<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11v6m6-6v6"/>'
    },
    {
      href: 'messages.html',
      label: 'گفت‌وگو',
      pages: ['messages.html'],
      icon: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="M8 10h8m-8 3h5"/>'
    },
    {
      href: 'guest-dashboard.html',
      label: 'حساب من',
      pages: ['guest-dashboard.html', 'auth.html', 'register.html', 'notifications.html', 'wallet.html', 'my-reviews.html', 'my-searches.html'],
      icon: '<circle cx="12" cy="7.5" r="3.4"/><path d="M4.8 21v-1.5a4.6 4.6 0 0 1 4.6-4.6h5.2a4.6 4.6 0 0 1 4.6 4.6V21"/>'
    }
  ];
  const page = location.pathname.split('/').pop() || 'index.html';
  const nav = document.createElement('nav');
  nav.className = 'afra-mobile-nav';
  nav.dir = 'rtl';
  nav.setAttribute('aria-label', 'منوی دسترسی سریع افرا سفر');

  for (const { href, label, pages, icon } of items) {
    const link = document.createElement('a');
    link.href = href;
    if (pages.includes(page)) link.setAttribute('aria-current', href === page ? 'page' : 'location');
    link.innerHTML = '<span class="afra-mobile-nav__icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' +
      icon + '</svg></span><span class="afra-mobile-nav__label">' + label + '</span>';
    nav.append(link);
  }

  document.body.append(nav);
})();
