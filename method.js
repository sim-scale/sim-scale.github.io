// Method section: the animated overview (inputs -> engines -> outputs) and the AssetEngine intro video.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inView = (el, cb, threshold = 0.3) => {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
  };
  const play = (v) => { if (v) { const p = v.play(); if (p) p.catch(() => {}); } };

  // Overview
  document.querySelectorAll('[data-ov]').forEach((ov) => {
    const els = [...ov.querySelectorAll('.ov-el')].sort((a, b) => a.dataset.t - b.dataset.t);
    const rows = [...ov.querySelectorAll('.ov-row')];
    const svg = ov.querySelector('.ov-links');
    const types = [...ov.querySelectorAll('.ov-type')];
    let timers = [], visible = false, started = false;

    // Dashed links from each row's output down to the next row's input.
    const links = rows.slice(1).map(() => document.createElementNS('http://www.w3.org/2000/svg', 'path'));
    links.forEach((p) => svg.appendChild(p));
    // Card position without its slide-in transform, so links drawn mid-animation land correctly.
    const settled = (el) => {
      const r = el.getBoundingClientRect(), host = el.closest('.ov-el');
      const t = host ? getComputedStyle(host).transform : 'none';
      const dy = t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0;
      return { left: r.left, width: r.width, top: r.top - dy, bottom: r.bottom - dy };
    };
    const layout = () => {
      const box = ov.getBoundingClientRect();
      // Arrows drop at the card center, or just past the longest label so they never cross text.
      const labelRight = Math.max(...rows.slice(1).map((row) => {
        const label = row.querySelector('.ov-in .ov-label'), r = document.createRange();
        r.selectNodeContents(label);
        return r.getBoundingClientRect().right - row.querySelector('.ov-in').getBoundingClientRect().left;
      }));
      rows.slice(1).forEach((row, i) => {
        const from = settled(rows[i].querySelector('.ov-out'));
        const to = settled(row.querySelector('.ov-in > :last-child'));
        const x1 = from.left + from.width / 2 - box.left, y1 = from.bottom - box.top;
        const x2 = to.left + Math.max(to.width / 2, labelRight + 18) - box.left, y2 = to.top - box.top;
        const ym = Math.round(y1 + 9);
        links[i].setAttribute('d', `M${x1} ${y1} V${ym} H${x2} V${y2 - 5.5}`);
        links[i].setAttribute('marker-end', 'url(#ovah)');
      });
    };
    window.addEventListener('resize', layout);

    const videos = () => els.filter((e) => e.classList.contains('on')).map((e) => e.querySelector('video')).filter(Boolean);
    const run = () => {
      timers.forEach(clearTimeout); timers = [];
      started = true;
      ov.classList.remove('typed');
      els.forEach((e) => e.classList.remove('on'));
      links.forEach((p) => p.classList.remove('on'));
      types.forEach((t) => { t.textContent = ''; t.classList.remove('typing'); });
      layout();
      const step = reducedMotion ? 0 : 900;
      els.forEach((el, i) => timers.push(setTimeout(() => {
        el.classList.add('on');
        const v = el.querySelector('video');
        if (v) { v.currentTime = 0; if (visible) play(v); }
        const row = rows.findIndex((r) => r.contains(el));
        if (row > 0 && el.classList.contains('ov-in')) { layout(); links[row - 1].classList.add('on'); }
      }, i * step + (i > 0 && !reducedMotion ? 900 : 0))));
      // Typewriter effect for the input text.
      let at = reducedMotion ? 0 : 150;
      types.forEach((t) => {
        const text = t.dataset.text;
        timers.push(setTimeout(() => { types.forEach((x) => x.classList.toggle('typing', x === t)); }, at));
        [...text].forEach((ch, i) => timers.push(setTimeout(() => { t.textContent = text.slice(0, i + 1); }, at + (reducedMotion ? 0 : i * 32))));
        if (!reducedMotion) at += text.length * 32 + 280;
      });
      timers.push(setTimeout(() => { ov.classList.add('typed'); types.forEach((x) => x.classList.remove('typing')); }, at + (reducedMotion ? 0 : 400)));
    };
    ov.querySelector('.ov-replay').addEventListener('click', run);
    inView(ov, (on) => {
      visible = on;
      if (on && !started) run();
      videos().forEach((v) => (on ? play(v) : v.pause()));
    }, 0.25);
  });

  // AssetEngine intro: play the video once, then show the paper figure.
  document.querySelectorAll('[data-ae]').forEach((ae) => {
    const film = ae.querySelector('.ae-film');
    const v = film.querySelector('video');
    const tabs = [...ae.querySelectorAll('.ae-tabs button')];
    const bar = ae.querySelector('.ae-bar');
    const btn = ae.querySelector('.ae-play');
    const seek = ae.querySelector('.ae-seek');
    const time = ae.querySelector('.ae-time');
    const cap = ae.querySelector('.ae-cap');
    const caps = [...ae.querySelectorAll('.ae-caps li')].map((li) => [+li.dataset.t, li.textContent]);
    const FIG = ae.dataset.figcap || '';
    const fig = film.querySelector('.ae-final');
    const fit = (wrap) => { const f = wrap.querySelector('.aef'); if (f) f.style.setProperty('--s', wrap.clientWidth / 1100); };
    if ('ResizeObserver' in window) new ResizeObserver(() => fit(fig)).observe(fig); else fit(fig);
    fig.addEventListener('click', () => {
      if (mode !== 'figure') return;
      const z = document.createElement('div');
      z.className = 'ae-zoom';
      const copy = fig.cloneNode(true);
      copy.classList.remove('ae-final');
      z.appendChild(copy);
      const close = () => { z.remove(); document.removeEventListener('keydown', esc); window.removeEventListener('resize', refit); };
      const esc = (e) => { if (e.key === 'Escape') close(); };
      const refit = () => fit(copy);
      z.addEventListener('click', close);
      document.addEventListener('keydown', esc);
      window.addEventListener('resize', refit);
      document.body.appendChild(z);
      refit();
    });
    const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
    let mode = 'video', autoPaused = false, started = false, raf = 0;
    const dur = () => (Number.isFinite(v.duration) && v.duration > 0 ? v.duration : +seek.max);
    const sync = () => {
      const t = v.currentTime;
      seek.max = dur(); seek.value = t;
      time.textContent = `${fmt(t)} / ${fmt(dur())}`;
      if (mode === 'video') {
        let c = caps[0][1];
        for (const [s0, txt] of caps) if (t >= s0) c = txt;
        if (cap.textContent !== c) cap.textContent = c;
      }
    };
    const loop = () => { sync(); if (!v.paused) raf = requestAnimationFrame(loop); };
    v.addEventListener('play', () => { btn.classList.add('on'); btn.setAttribute('aria-label', 'Pause'); cancelAnimationFrame(raf); loop(); });
    v.addEventListener('pause', () => { btn.classList.remove('on'); btn.setAttribute('aria-label', 'Play'); sync(); });
    v.addEventListener('seeked', sync);
    v.addEventListener('loadedmetadata', sync);
    const setMode = (m) => {
      mode = m;
      film.dataset.mode = m;
      tabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
      bar.hidden = m !== 'video';
      if (m === 'figure') { v.pause(); cap.textContent = FIG; } else sync();
    };
    const toggle = () => {
      autoPaused = false;
      if (v.paused) { if (v.ended || v.currentTime >= dur() - .05) v.currentTime = 0; started = true; play(v); } else v.pause();
    };
    v.addEventListener('ended', () => setMode('figure'));
    tabs.forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.mode === mode) return;
      setMode(b.dataset.mode);
      if (mode === 'video') { if (v.ended || v.currentTime >= dur() - .05) v.currentTime = 0; started = true; autoPaused = false; play(v); }
    }));
    btn.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    seek.addEventListener('input', () => { v.currentTime = +seek.value; sync(); });
    sync();
    if (reducedMotion) return;
    inView(film, (on) => {
      if (mode !== 'video') return;
      if (on && !started) { started = true; play(v); }
      else if (!on && !v.paused) { autoPaused = true; v.pause(); }
      else if (on && autoPaused) { autoPaused = false; play(v); }
    }, 0.5);
  });
})();
