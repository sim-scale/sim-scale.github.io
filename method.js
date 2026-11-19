// Method section: the animated overview (inputs -> engines -> outputs, revealed in order) and the two engine
// players (scenes with a diagram, a caption, and a segmented progress bar, like a short video).
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inView = (el, cb, threshold = 0.3) => {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
  };
  const play = (v) => { if (v) { const p = v.play(); if (p) p.catch(() => {}); } };

  // ---------- Overview ----------
  document.querySelectorAll('[data-ov]').forEach((ov) => {
    const els = [...ov.querySelectorAll('.ov-el')].sort((a, b) => a.dataset.t - b.dataset.t);
    const rows = [...ov.querySelectorAll('.ov-row')];
    const svg = ov.querySelector('.ov-links');
    const types = [...ov.querySelectorAll('.ov-type')];
    let timers = [], visible = false, started = false;

    // Dashed links from each row's output down to the next row's input.
    const links = rows.slice(1).map(() => document.createElementNS('http://www.w3.org/2000/svg', 'path'));
    links.forEach((p) => svg.appendChild(p));
    const layout = () => {
      const box = ov.getBoundingClientRect();
      // Drop the arrows at the card center, or just past the longest label so the line never crosses its text.
      const labelRight = Math.max(...rows.slice(1).map((row) => {
        const label = row.querySelector('.ov-in .ov-label'), r = document.createRange();
        r.selectNodeContents(label);
        return r.getBoundingClientRect().right - row.querySelector('.ov-in').getBoundingClientRect().left;
      }));
      rows.slice(1).forEach((row, i) => {
        const from = rows[i].querySelector('.ov-out').getBoundingClientRect();
        const to = row.querySelector('.ov-in > :last-child').getBoundingClientRect();   // the input card, below its label
        const x1 = from.left + from.width / 2 - box.left, y1 = from.bottom - box.top;
        const x2 = to.left + Math.max(to.width / 2, labelRight + 18) - box.left, y2 = to.top - box.top;
        const ym = Math.round(y1 + 9);   // run across just below the output, then drop beside the label onto the card
        links[i].setAttribute('d', `M${x1} ${y1} V${ym} H${x2} V${y2 - 3}`);
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
      // Type the object categories, then the optional task description, while the input card appears.
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

  // ---------- Engine players ----------
  document.querySelectorAll('[data-player]').forEach((mp) => {
    const scenes = [...mp.querySelectorAll('.mp-scene')];
    const nodes = [...mp.querySelectorAll('.mp-diagram .n')];
    const edges = [...mp.querySelectorAll('.mp-diagram .e')];
    const caption = mp.querySelector('.mp-caption');
    const bars = mp.querySelector('.mp-bars');
    const btn = mp.querySelector('.mp-play');
    let cur = 0, t0 = 0, elapsed = 0, raf = 0, flip = 0, visible = false, paused = reducedMotion;
    const dur = (i) => Number(scenes[i].dataset.dur) || 5000;
    const segs = scenes.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Step ${i + 1}`);
      b.innerHTML = '<i></i>';
      bars.appendChild(b);
      b.addEventListener('click', () => show(i));
      return b;
    });

    function show(i) {
      cur = i; elapsed = 0; t0 = performance.now();
      const s = scenes[i];
      const ns = (s.dataset.n || '').split(' '), es = (s.dataset.e || '').split(' ').filter(Boolean);
      scenes.forEach((x, j) => {
        x.classList.toggle('active', j === i);
        const v = x.querySelector('video');
        if (v) { if (j === i) { v.currentTime = 0; if (visible && !paused) play(v); } else v.pause(); }
      });
      nodes.forEach((n) => n.classList.toggle('on', ns.includes(n.dataset.n)));
      edges.forEach((e) => e.classList.toggle('on', es.includes(e.dataset.e)));
      caption.textContent = s.dataset.caption;
      segs.forEach((b, j) => { b.firstChild.style.width = j < i ? '100%' : '0'; });
      clearInterval(flip);
      const imgs = [...s.querySelectorAll('[data-flip] img')];
      if (imgs.length) {
        let k = 0;
        imgs.forEach((im, j) => im.classList.toggle('on', j === 0));
        flip = setInterval(() => {
          if (paused || !visible) return;
          k = (k + 1) % imgs.length;
          imgs.forEach((im, j) => im.classList.toggle('on', j === k));
        }, 1000);
      }
    }
    const tick = (now) => {
      if (visible && !paused) {
        elapsed += now - t0;
        segs[cur].firstChild.style.width = `${Math.min(100, (elapsed / dur(cur)) * 100)}%`;
        if (elapsed >= dur(cur)) show((cur + 1) % scenes.length);
      }
      t0 = now;
      raf = requestAnimationFrame(tick);
    };
    const setPaused = (p) => {
      paused = p;
      btn.textContent = p ? '▶' : '❚❚';
      btn.setAttribute('aria-label', p ? 'Play' : 'Pause');
      const v = scenes[cur].querySelector('video');
      if (v) { if (p || !visible) v.pause(); else play(v); }
    };
    btn.addEventListener('click', () => setPaused(!paused));
    show(0);
    setPaused(paused);
    inView(mp, (on) => {
      visible = on;
      const v = scenes[cur].querySelector('video');
      if (v) { if (on && !paused) play(v); else v.pause(); }
      if (on && !raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); }
    });
  });
})();
