(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroVideo = document.querySelector('.hero-video');

  // The hero video plays once, from close-ups of single tasks out to the full scene. When it ends, the last
  // frame stays, darkens, and the title fades in.
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

  const comparisonTasks = [
    {
      id: 'task1', number: '01', title: 'PutPot', objects: ['White Pot', 'Gray Pot', 'Tall Pot', 'Steel Pot'],
      methods: [
        { key: 'ours', label: 'SimScale', detail: '1 human demo', outcomes: [['Success', ''], ['Success', ''], ['Success', ''], ['Success', '']] },
        { key: 'simfoundry', label: 'SimFoundry', detail: 'DexMimicGen, 120 human demos', outcomes: [['Success', 'Twin'], ['Success', 'Unseen'], ['Failure', 'Unseen'], ['Failure', 'Unseen']] },
        { key: 'articraft', label: 'Articraft', detail: 'DexMimicGen, 120 human demos', outcomes: [['Failure', ''], ['Failure', ''], ['Failure', ''], ['Failure', '']] }
      ]
    },
    {
      id: 'task2', number: '02', title: 'HangMug', objects: ['Green Mug', 'Bronze Mug', 'Cyan Mug', 'Pink Mug'],
      methods: [
        { key: 'ours', label: 'SimScale', detail: '1 human demo', outcomes: [['Success', ''], ['Success', ''], ['Success', ''], ['Success', '']] },
        { key: 'simfoundry', label: 'SimFoundry', detail: 'DexMimicGen, 120 human demos', outcomes: [['Success', 'Twin'], ['Success', 'Unseen'], ['Failure', 'Unseen'], ['Failure', 'Unseen']] },
        { key: 'articraft', label: 'Articraft', detail: 'DexMimicGen, 120 human demos', outcomes: [['Failure', ''], ['Failure', ''], ['Failure', ''], ['Failure', '']] }
      ]
    },
    {
      id: 'task3', number: '03', title: 'PutCharger', objects: ['Fabric Drawers', 'Tall Metal Cabinet', 'Black Drawers', 'White Drawers'],
      methods: [
        { key: 'ours', label: 'SimScale', detail: '1 human demo', outcomes: [['Success', ''], ['Success', ''], ['Success', ''], ['Success', '']] },
        { key: 'simfoundry', label: 'SimFoundry', detail: 'DexMimicGen, 120 human demos', outcomes: [['Success', 'Unseen'], ['Failure', 'Twin'], ['Failure', 'Unseen'], ['Failure', 'Unseen']] },
        { key: 'articraft', label: 'Articraft', detail: 'DexMimicGen, 120 human demos', outcomes: [['Success', ''], ['Failure', ''], ['Failure', ''], ['Success', '']] }
      ]
    }
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

      const heading = document.createElement('header');
      heading.className = 'comparison-task-heading';
      heading.innerHTML = "";
      panel.appendChild(heading);

      task.methods.forEach((method) => {
        const row = document.createElement('section');
        row.className = 'comparison-method';
        row.innerHTML = `<header><h3>${method.label}${method.key === 'ours' ? ' <span>(Ours)</span>' : ''}</h3></header>`;
        const grid = document.createElement('div');
        grid.className = 'comparison-rollout-grid';

        method.outcomes.forEach(([outcome, domain], index) => {
          const number = String(index + 1).padStart(2, '0');
          const prefix = `media/comparisons/${task.id}_${method.key}_${number}`;
          const figure = document.createElement('figure');
          figure.className = 'comparison-rollout';
          const status = outcome;
          figure.innerHTML = `<video muted loop playsinline preload="none" data-poster="${prefix}.jpg?v=202611230000" data-autoplay aria-label="${method.label}: ${task.objects[index]}, ${status}"><source src="${prefix}.mp4?v=202611230000" type="video/mp4"></video><figcaption><span class="comparison-outcome comparison-outcome-${outcome.toLowerCase()}">${status}</span></figcaption>`;
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

  // Posters of videos far down the page load only when the reader gets within about a screen of them.
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
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });  // tall blocks reveal as soon as their top enters the view

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
})();
