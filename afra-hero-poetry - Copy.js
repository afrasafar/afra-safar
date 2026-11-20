/* AFRA SAFAR — romantic Persian couplets, one per homepage refresh.
   The two hemistichs occupy separate marked regions on desktop.
   No click-to-change button; no server or Supabase dependency. */
(() => {
  'use strict';
  const spot = document.getElementById('afraHeroPoetry');
  const first = document.getElementById('afraPoetryFirst');
  const second = document.getElementById('afraPoetrySecond');
  if (!spot || !first || !second) return;

  /* Classical, public-domain romantic couplets; verified against Ganjoor. */
  const verses = [
    { x: 'من از آن روز که در بند توام آزادم', y: 'پادشاهم که به دست تو اسیر افتادم' },
    { x: 'تو مرا جان و جهانی چه کنم جان و جهان را', y: 'تو مرا گنج روانی چه کنم سود و زیان را' },
    { x: 'اگر آن ترک شیرازی به دست آرد دل ما را', y: 'به خال هندویش بخشم سمرقند و بخارا را' },
    { x: 'ای ساربان آهسته رو کآرام جانم می‌رود', y: 'وان دل که با خود داشتم با دلستانم می‌رود' },
    { x: 'تا تو به خاطر منی کس نگذشت بر دلم', y: 'مثل تو کیست در جهان تا ز تو مهر بگسلم' },
    { x: 'با دوست باش گر همه آفاق دشمنند', y: 'کاو مرهم است اگر دگران نیش می‌زنند' },
    { x: 'از هرچه می‌رود سخن دوست خوش‌تر است', y: 'پیغام آشنا نفس روح‌پرور است' },
    { x: 'عشق تو نهال حیرت آمد', y: 'وصل تو کمال حیرت آمد' }
  ];
  const key = 'afra-hero-poem-last-romantic-v1';
  let last = -1;
  try {
    const value = sessionStorage.getItem(key);
    if (value !== null) {
      const candidate = Number(value);
      if (Number.isInteger(candidate) && candidate >= 0 && candidate < verses.length) last = candidate;
    }
  } catch (_) { /* Private mode can disable storage. */ }
  let index = Math.floor(Math.random() * (verses.length - (last >= 0 ? 1 : 0)));
  if (last >= 0 && index >= last) index++;
  first.textContent = verses[index].x;
  second.textContent = verses[index].y;
  try { sessionStorage.setItem(key, String(index)); } catch (_) {}
  spot.classList.add('afra-poetry-change');

  // Long lines are fitted independently into each marked area.
  // Measuring after fonts load avoids clipped Nastaliq text on desktop.
  function fitPoetryLines() {
    if (window.matchMedia('(max-width: 1000px)').matches) {
      first.style.removeProperty('font-size');
      second.style.removeProperty('font-size');
      return;
    }
    [first, second].forEach((line) => {
      line.style.setProperty('font-size', '29px', 'important');
      const limit = Math.max(16, line.clientWidth - 4);
      let size = 29;
      while (size > 17 && line.scrollWidth > limit) {
        size -= .5;
        line.style.setProperty('font-size', size + 'px', 'important');
      }
    });
  }
  let raf = 0;
  function scheduleFit() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { raf = 0; fitPoetryLines(); });
  }
  scheduleFit();
  if (document.fonts?.ready) document.fonts.ready.then(scheduleFit).catch(() => {});
  window.addEventListener('resize', scheduleFit, { passive: true });
})();
