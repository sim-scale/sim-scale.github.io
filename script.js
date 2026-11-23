// Page-wide behavior: hero title, scroll progress, comparison and demo tabs, lazy posters, autoplay, reveal.
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroVideo = document.querySelector('.hero-video');

  // The hero video plays once; when it ends, the title fades in over the last frame.
  const hero = document.querySelector('.cinematic-hero');
  const showTitle = () => hero && hero.classList.add('hero-done');
  if (heroVideo && reducedMotion) {
    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
    showTitle();
  } else if (heroVideo) {
    heroVideo.addEventListener('ended', showTitle);
    heroVideo.addEventListener('error', showTitle);
    // If autoplay is blocked, show the title over the poster instead of waiting forever.
    setTimeout(() => { if (heroVideo.paused || heroVideo.readyState < 2) showTitle(); }, 4000);
  } else {
    showTitle();
  }

  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    root.style.setProperty('--scroll', progress.toFixed(4));
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  // Real-robot comparison clips: media/comparisons/<task>_<method>_<NN>.{mp4,jpg}, one per object.
  const S = 'Success', F = 'Failure';
  const methods = (simfoundry, articraft) => [
    { key: 'ours', label: 'SimScale', outcomes: [S, S, S, S] },
    { key: 'simfoundry', label: 'SimFoundry', outcomes: simfoundry },
    { key: 'articraft', label: 'Articraft', outcomes: articraft },
  ];
  const comparisonTasks = [
    { id: 'task1', objects: ['White Pot', 'Gray Pot', 'Tall Pot', 'Steel Pot'], methods: methods([S, S, F, F], [F, F, F, F]) },
    { id: 'task2', objects: ['Green Mug', 'Bronze Mug', 'Cyan Mug', 'Pink Mug'], methods: methods([S, S, F, F], [F, F, F, F]) },
    { id: 'task3', objects: ['Fabric Drawers', 'Tall Metal Cabinet', 'Black Drawers', 'White Drawers'], methods: methods([S, F, F, F], [S, F, F, S]) },
  ];

  document.querySelectorAll('[data-comparison-showcase]').forEach((showcase) => {
    const stage = showcase.querySelector('[data-comparison-stage]');
    const tabs = [...showcase.querySelectorAll('[data-comparison-task]')];

    comparisonTasks.forEach((task, taskIndex) => {
      const panel = document.createElement('section');
      panel.className = 'comparison-task';
      panel.id = `comparison-${task.id}`;
      panel.dataset.comparisonPanel = task.id;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `comparison-tab-${task.id}`);
      panel.hidden = taskIndex !== 0;

      task.methods.forEach((method) => {
        const row = document.createElement('section');
        row.className = 'comparison-method';
        row.innerHTML = `<header><h3>${method.label}${method.key === 'ours' ? ' <span>(Ours)</span>' : ''}</h3></header>`;
        const grid = document.createElement('div');
        grid.className = 'comparison-rollout-grid';

        method.outcomes.forEach((outcome, index) => {
          const prefix = `media/comparisons/${task.id}_${method.key}_${String(index + 1).padStart(2, '0')}`;
          const figure = document.createElement('figure');
          figure.className = 'comparison-rollout';
          figure.innerHTML = `<video muted loop playsinline preload="none" data-poster="${prefix}.jpg" data-autoplay aria-label="${method.label}: ${task.objects[index]}, ${outcome}"><source src="${prefix}.mp4" type="video/mp4"></video><figcaption><span class="comparison-outcome comparison-outcome-${outcome.toLowerCase()}">${outcome}</span></figcaption>`;
          grid.appendChild(figure);
        });

        row.appendChild(grid);
        panel.appendChild(row);
      });

      stage.appendChild(panel);
    });

    tabs.forEach((tab) => { tab.id = `comparison-tab-${tab.dataset.comparisonTask}`; });
    const panels = [...showcase.querySelectorAll('[data-comparison-panel]')];
    const selectTask = (task, moveFocus = false) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.comparisonTask === task;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) tab.focus();
      });
      panels.forEach((panel) => {
        const selected = panel.dataset.comparisonPanel === task;
        panel.hidden = !selected;
        panel.querySelectorAll('video').forEach((video) => {
          if (selected && !reducedMotion) video.play().catch(() => {});
          if (!selected) video.pause();
        });
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTask(tab.dataset.comparisonTask));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = (index + direction + tabs.length) % tabs.length;
        selectTask(tabs[next].dataset.comparisonTask, true);
      });
    });
  });

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

  // Lazy-load video posters about one screen ahead.
  const lazyPosters = [...document.querySelectorAll('video[data-poster]')];
  const showPoster = (video) => { video.poster = video.dataset.poster; video.removeAttribute('data-poster'); };
  if ('IntersectionObserver' in window) {
    const posterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { showPoster(entry.target); posterObserver.unobserve(entry.target); } });
    }, { rootMargin: '100% 0px 100% 0px' });
    lazyPosters.forEach((video) => posterObserver.observe(video));
  } else {
    lazyPosters.forEach(showPoster);
  }

  const ambientVideos = [...document.querySelectorAll('video[data-autoplay]')];
  if (reducedMotion) {
    ambientVideos.forEach((video) => video.pause());
  } else if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }, { threshold: 0.22 });
    ambientVideos.forEach((video) => videoObserver.observe(video));
  } else {
    ambientVideos.forEach((video) => video.play().catch(() => {}));
  }

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
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
})();
