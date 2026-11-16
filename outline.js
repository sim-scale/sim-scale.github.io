// Contents menu in the top left corner: it appears once the reader scrolls past the hero, names the section
// in view, and opens a list of all sections.
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
  const update = () => {
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
