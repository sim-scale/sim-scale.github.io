// Contents menu: appears after the hero, shows the current section, and opens a list of all sections.
(() => {
  const outline = document.getElementById('outline');
  if (!outline) return;
  const toggle = outline.querySelector('.outline-toggle');
  const label = outline.querySelector('.outline-current');
  const links = [...outline.querySelectorAll('nav a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const hero = document.querySelector('.cinematic-hero');
  const setOpen = (open) => { outline.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); };
  toggle.addEventListener('click', () => setOpen(!outline.classList.contains('open')));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', (e) => { if (!outline.contains(e.target)) setOpen(false); });
  // Match the text color to the section behind the menu.
  const backdrops = [hero, ...document.querySelectorAll('main > section, .section-divider')].filter(Boolean);
  const isDark = (el) => el === hero || el.classList.contains('dark-section') || el.classList.contains('section-divider') || el.classList.contains('abstract-section');
  const update = () => {
    const probe = Math.min(window.innerHeight * 0.3, 260);
    const behind = backdrops.find((el) => { const r = el.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    outline.classList.toggle('on-dark', !!behind && isDark(behind));
    outline.classList.toggle('shown', !hero || hero.getBoundingClientRect().bottom < 80);
    const mid = window.innerHeight * 0.35;
    let active = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= mid) active = s;
    links.forEach((a) => a.classList.toggle('active', !!active && a.getAttribute('href') === '#' + active.id));
    const current = links.find((a) => a.classList.contains('active'));
    label.textContent = current ? current.textContent : 'Contents';
  };
  let queued = false;
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
