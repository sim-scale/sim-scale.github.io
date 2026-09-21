(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    root.style.setProperty('--scroll', progress.toFixed(4));
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  document.querySelectorAll('[data-dmg-showcase]').forEach((showcase) => {
    const tabs = [...showcase.querySelectorAll('[data-dmg-task]')];
    const panels = [...showcase.querySelectorAll('[data-dmg-panel]')];

    const selectTask = (task, moveFocus = false) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.dmgTask === task;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) tab.focus();
      });

      panels.forEach((panel) => {
        const selected = panel.dataset.dmgPanel === task;
        panel.hidden = !selected;
        panel.classList.toggle('active', selected);
        const video = panel.querySelector('video');
        if (!video) return;
        if (selected && !reducedMotion) video.play().catch(() => {});
        if (!selected) video.pause();
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTask(tab.dataset.dmgTask));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = (index + direction + tabs.length) % tabs.length;
        selectTask(tabs[next].dataset.dmgTask, true);
      });
    });
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
})();
