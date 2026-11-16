// Full-width real-robot rollout players: a control strip below each video (play, progress, full screen), playback only
// while the player is on screen, and object switching for the pose-generalization videos. Videos use preload="none",
// so nothing is downloaded until a player comes into view, and a switcher only fetches the object that is selected.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  };
  document.querySelectorAll('.rollout-player').forEach((player) => {
    const video = player.querySelector('video');
    const name = video.getAttribute('aria-label') || 'Rollout';
    video.controls = false;
    player.dataset.enhanced = 'true';

    const bar = document.createElement('div');
    bar.className = 'rollout-bar';
    bar.innerHTML = `<button type="button" class="rollout-play" aria-label="Play ${name}">${icons.play}</button>`
      + `<input class="rollout-scrub" type="range" min="0" max="1" step="0.001" value="0" aria-label="${name} progress">`
      + `<button type="button" class="rollout-expand" aria-label="Full screen">${icons.expand}</button>`;
    player.appendChild(bar);
    const [playBtn, scrub, expandBtn] = [...bar.children];

    // A reader who pauses keeps it paused; otherwise the video plays whenever it is on screen.
    let userPaused = reducedMotion, onScreen = false;
    const syncPlay = () => {
      playBtn.innerHTML = video.paused ? icons.play : icons.pause;
      playBtn.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} ${name}`);
    };
    const update = () => { if (onScreen && !userPaused) video.play().catch(() => {}); else video.pause(); };
    player.rolloutUpdate = update;

    playBtn.addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) video.pause(); else video.play().catch(() => {});
    });
    video.addEventListener('click', () => playBtn.click());
    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPlay);
    video.addEventListener('timeupdate', () => {
      if (video.duration && document.activeElement !== scrub) scrub.value = (video.currentTime / video.duration).toFixed(3);
    });
    scrub.addEventListener('input', () => { if (video.duration) video.currentTime = scrub.value * video.duration; });
    expandBtn.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (player.requestFullscreen) player.requestFullscreen().catch(() => {});
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); }, { threshold: 0.35 }).observe(player);
    }
    syncPlay();
  });

  // Object switcher: swap the video in place and keep playing if the player is on screen.
  document.querySelectorAll('[data-rollout-switch]').forEach((demo) => {
    const player = demo.querySelector('.rollout-player');
    const video = player.querySelector('video');
    const thumbs = [...demo.querySelectorAll('.rollout-thumb')];
    const select = (thumb, focus) => {
      thumbs.forEach((t) => { const on = t === thumb; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) thumb.focus();
      if (video.currentSrc.endsWith(thumb.dataset.src)) return;
      video.poster = thumb.dataset.poster;
      video.src = thumb.dataset.src;
      video.setAttribute('aria-label', thumb.dataset.label);
      video.load();
      if (player.rolloutUpdate) player.rolloutUpdate();
    };
    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => select(thumb));
      thumb.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        select(thumbs[(i + (e.key === 'ArrowRight' ? 1 : -1) + thumbs.length) % thumbs.length], true);
      });
    });
  });
})();
