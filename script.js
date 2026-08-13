(() => {
  const root = document.documentElement;
  const langToggle = document.getElementById('langToggle');
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  let lang = 'en';

  function applyLanguage(next) {
    lang = next;
    root.lang = lang === 'ko' ? 'ko' : 'en';
    document.querySelectorAll('[data-en][data-ko]').forEach(el => {
      el.textContent = el.dataset[lang];
    });
    langToggle.textContent = lang === 'en' ? 'KR' : 'EN';
    langToggle.setAttribute('aria-pressed', lang === 'ko' ? 'true' : 'false');
    langToggle.setAttribute('aria-label', lang === 'en' ? '한국어로 보기' : 'View in English');
  }
  langToggle?.addEventListener('click', () => applyLanguage(lang === 'en' ? 'ko' : 'en'));

  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!open));
    menuToggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
    mobileNav.hidden = open;
  });
  mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded','false');
    menuToggle.setAttribute('aria-label','Open navigation');
  }));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold: .12});
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  applyLanguage('en');
})();
