// Paper figures on the page.
// 1. Spotlight figures: a paper figure with a moving highlight that steps through its parts, each with a caption.
// 2. Bar charts rebuilt from the numbers of the paper figures. Bars grow when the chart scrolls into view, and
//    charts with two policy backends can switch between them.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whenVisible = (el, fn, threshold = 0.3) => {
    if (reducedMotion || !('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold });
    io.observe(el);
  };

  // ---------- Spotlight figures ----------
  // Regions are [left, top, width, height] in percent of the image.
  const SPOTS = {
    method: [
      { r: [15.5, 0.4, 54.8, 6.6], t: 'Input', d: 'All AssetEngine sub-agents receive the object category (Mug) and an optional task description (Hang a mug on a mug tree).' },
      { r: [2.4, 7.2, 67.6, 19.4], t: 'Generator Author', d: 'The Generator Author searches internet images to identify geometric variations, feature dependencies, and measurement ranges, and writes a draft category-level procedural generator in Python.' },
      { r: [2.4, 29.2, 15.6, 24.2], t: 'Coverage Critic', d: 'The Coverage Critic independently searches for ordinary mugs and compares them with sampled assets. It finds mugs with a rounded body outline that the draft generator cannot produce.' },
      { r: [21.6, 29.2, 48.6, 24.2], t: 'Geometry Validator', d: 'The Geometry Validator derives a mesh-quality checklist and a task-compatibility checklist, and checks compiled samples with a mesh probe library. It rejects drafts with a detached handle or a handle that is not a closed loop.' },
      { r: [74.4, 7.2, 23.8, 46.4], t: 'Asset Sampling', d: 'The generator is revised until it passes both reviews. Randomly sampling its parameters then yields diverse and physically plausible assets.' },
      { r: [15.4, 56.4, 78.4, 21], t: 'Storyboard', d: 'DemoEngine converts one human demonstration, teleoperated on one sampled mug and mug tree, into a storyboard of keyframes: left grasp, handover, left observes, and insert.' },
      { r: [29.6, 77.4, 68.6, 22.2], t: 'Source Demos on Other Assets', d: 'Guided by the storyboard, an agent writes a source-demo script that separates the shared task structure from geometry-dependent targets. Parallel agents then adapt it to the other assets.' },
      { r: [15.6, 84.6, 13.6, 9.4], t: 'DexMimicGen', d: 'DexMimicGen expands the source demonstrations of each asset to new object poses and keeps only executions that complete the task.' },
      { r: [0.4, 56.4, 14.8, 43.2], t: 'Policy', d: 'RGB visuomotor policies are trained on the resulting data and deployed zero-shot on unseen real-world objects.' }
    ],
    params: [
      { r: [8.5, 3.5, 33, 23], t: 'Body Outline', d: 'Discrete variable: a linear or a rounded body outline.' },
      { r: [52.5, 3.5, 47, 23], t: 'Rim Diameter', d: 'Continuous variable over the range of rim diameters found in internet images.' },
      { r: [3, 27, 44, 21], t: 'Body Height', d: 'Continuous absolute variable, sampled over its ordinary range.' },
      { r: [52.5, 27, 47, 21], t: 'Base Diameter', d: 'Continuous relative variable, defined relative to the rim diameter.' },
      { r: [8.5, 53, 33, 25], t: 'Handle Outline', d: 'Discrete variable: an oval or a squared handle.' },
      { r: [52.5, 53, 47, 24], t: 'Loop Height', d: 'Continuous variable for the height of the handle loop.' },
      { r: [1.5, 78, 49, 21.5], t: 'Loop Width', d: 'Continuous variable for how far the handle loop extends from the body.' },
      { r: [52.5, 78, 47, 21.5], t: 'Mount Height', d: 'Continuous variable for where the handle is mounted on the body.' }
    ],
    compare: [
      { r: [0.2, 0.2, 24.8, 99.6], t: 'SimFoundry Cousins', d: 'Digital cousins of a reconstructed mug. Physically implausible geometry appears in the wavy rim (third row) and the double-loop handle (last row).' },
      { r: [25.2, 0.2, 24.8, 99.6], t: 'Articraft', d: 'Assets generated individually by an agent. The ring-shaped handles are highly similar across assets.' },
      { r: [50.2, 0.2, 24.8, 99.6], t: 'GPT-6-Astra', d: 'Asked for many diverse mugs, the generator drifts into irregular body shapes (bottom three rows).' },
      { r: [75.2, 0.2, 24.6, 99.6], t: 'SimScale AssetEngine (Ours)', d: 'Samples from the category-level procedural generator vary widely in body shape and handle design while remaining physically plausible.' }
    ],
    tasks: [
      { r: [8.6, 0.5, 30.4, 99], t: 'PutPot', d: 'The robot grasps a pot with both arms and places it upright on a cooktop. Five sets of distinct objects.' },
      { r: [39.2, 0.5, 30.2, 99], t: 'HangMug', d: 'The robot picks up a mug, hands it over to the other arm, and hangs it on a mug tree. Five sets of distinct objects.' },
      { r: [69.6, 0.5, 30.2, 99], t: 'PutCharger', d: 'The robot picks up a charger, opens a drawer, places the charger inside, and closes the drawer. Five sets of distinct objects.' }
    ]
  };

  document.querySelectorAll('[data-spot]').forEach((fig) => {
    const steps = SPOTS[fig.dataset.spot];
    const stage = fig.querySelector('.spot-stage');
    if (!steps || !stage) return;
    const box = document.createElement('div');
    box.className = 'spot-box';
    box.setAttribute('aria-hidden', 'true');
    stage.appendChild(box);
    const nav = fig.querySelector('.spot-steps');
    const title = fig.querySelector('.spot-title');
    const text = fig.querySelector('.spot-text');
    const buttons = steps.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span>${i + 1}</span>${s.t}`;
      b.addEventListener('click', () => { stop(); show(i); });
      nav.appendChild(b);
      return b;
    });
    const all = document.createElement('button');
    all.type = 'button'; all.className = 'spot-all'; all.textContent = 'Full figure';
    all.addEventListener('click', () => { stop(); show(-1); });
    nav.appendChild(all);
    let current = -1, timer = null, visible = false, userStopped = false;
    const show = (i) => {
      current = i;
      buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      all.setAttribute('aria-pressed', String(i < 0));
      fig.classList.toggle('spot-on', i >= 0);
      if (i < 0) { title.textContent = fig.dataset.spotTitle || ''; text.textContent = fig.dataset.spotText || ''; return; }
      const [l, t, w, h] = steps[i].r;
      Object.assign(box.style, { left: l + '%', top: t + '%', width: w + '%', height: h + '%' });
      title.textContent = steps[i].t; text.textContent = steps[i].d;
    };
    const tick = () => show((current + 1) % steps.length);
    const start = () => { if (!timer && !userStopped && !reducedMotion) timer = setInterval(tick, 5200); };
    const stop = () => { userStopped = true; clearInterval(timer); timer = null; };
    show(-1);
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    new IntersectionObserver((entries) => entries.forEach((e) => {
      visible = e.isIntersecting;
      if (visible) { if (current < 0 && !userStopped) show(0); start(); }
      else { clearInterval(timer); timer = null; }
    }), { threshold: 0.45 }).observe(fig);
  });

  // ---------- Bar charts ----------
  const COLOR = {
    real: '#CC6677', twin: '#F2E3A6', cousins: '#E2BE5A', robocasa: '#C8C2BA', articraft: '#B9A5D0',
    astra: '#BCD3EC', astraAsset: '#8FBF9F', human: '#6E9FD3', ours: '#1F4E8C', oursAsset: '#6E9FD3'
  };
  const TASKS = ['PutPot', 'HangMug', 'PutCharger'];
  // Values follow the paper figures. Each task panel lists one value per series. For charts with two backends,
  // values are given for DINOv3 + FMT (dino) and GR00T N1.6 (groot). null marks a condition that does not exist.
  const CHARTS = {
    realworld: {
      series: [['Real-Demos (60 real-world demos)', COLOR.real], ['SimFoundry Cousins + DexMimicGen (120 human demos)', COLOR.cousins], ['SimScale (Ours, 1 human demo)', COLOR.ours, true]],
      backends: true,
      panels: TASKS.map((t, i) => ({ title: t, groups: [{ dino: [[50, 68, 90], [51, 56.5, 84.5], [51.1, 43.3, 84.5]][i], groot: [[53, 62, 80], [51, 50, 79.5], [67.6, 33.7, 85]][i] }] }))
    },
    seen: {
      series: [['Real-Demos', COLOR.real], ['SimFoundry Twin', COLOR.twin], ['SimFoundry Cousins', COLOR.cousins], ['SimScale (Ours)', COLOR.ours, true]],
      panels: [
        { title: '(a) Real-Demos vs. SimScale', groups: [{ label: 'Seen by Real-Demos', v: [65.9, null, null, 85.2] }, { label: 'Unseen by Real-Demos', v: [36.1, null, null, 82.1] }] },
        { title: '(b) SimFoundry vs. SimScale', groups: [{ label: 'Seen by SimFoundry', v: [null, 41.5, 69.8, 86.2] }, { label: 'Unseen by SimFoundry', v: [null, 26.9, 47.9, 83.4] }] }
      ]
    },
    sim2sim: {
      series: [['SimFoundry Twin', COLOR.twin], ['SimFoundry Cousins', COLOR.cousins], ['RoboCasa', COLOR.robocasa], ['Articraft', COLOR.articraft], ['SimScale AssetEngine (Ours)', COLOR.oursAsset, true]],
      panels: [
        { title: 'Held-out AssetEngine assets', groups: [{ v: [28.1, 35.2, 48.6, 54.3, 92.1] }] },
        { title: 'Held-out RoboCasa assets', groups: [{ v: [45.9, 53.8, 57.0, 33.6, 79.6] }] },
        { title: 'Digital twins of real objects', groups: [{ v: [47.8, 55.5, 57.4, 42.9, 85.7] }] }
      ]
    },
    assets: {
      series: [['SimFoundry Twin', COLOR.twin], ['SimFoundry Cousins', COLOR.cousins], ['RoboCasa', COLOR.robocasa], ['Articraft', COLOR.articraft], ['GPT-6-Astra', COLOR.astraAsset], ['SimScale AssetEngine (Ours)', COLOR.oursAsset, true]],
      backends: true,
      panels: TASKS.map((t, i) => ({ title: t, groups: [{
        // GPT-6-Astra assets were evaluated with DINOv3 + FMT only.
        dino: [[25, 68, 57, 5, 70, 82], [3.5, 56.5, 11, 38, 7.5, 87.5], [27.8, 43.3, null, 66.9, 52.8, 85.2]][i],
        groot: [[26, 62, 36, 11, null, 83], [47, 50, 30.5, 34.5, null, 84.5], [49.5, 33.7, null, 62.1, null, 90.8]][i]
      }] }))
    },
    demos: {
      series: [['GPT-6-Astra Programs', COLOR.astra], ['Human Demos per Asset (120 human demos)', COLOR.human], ['SimScale DemoEngine (Ours, 1 human demo)', COLOR.ours, true]],
      backends: true,
      panels: TASKS.map((t, i) => ({ title: t, groups: [{
        dino: [[0, 82, 90], [0, 87.5, 84.5], [7.2, 85.2, 84.5]][i],
        groot: [[0, 83, 80], [0, 84.5, 79.5], [5.1, 90.8, 85]][i]
      }] }))
    }
  };

  const fmt = (v) => v.toFixed(1);
  const countUp = (el, to, delay) => {
    if (reducedMotion) { el.textContent = fmt(to); return; }
    const from = parseFloat(el.dataset.v || '0'), t0 = performance.now() + delay, dur = 1000;
    el.dataset.v = to;
    const step = (now) => {
      const u = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - u, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  document.querySelectorAll('[data-chart]').forEach((host) => {
    const cfg = CHARTS[host.dataset.chart];
    if (!cfg) return;
    let backend = 'dino', shown = false;
    const head = document.createElement('div'); head.className = 'pc-head';
    const legend = document.createElement('ul'); legend.className = 'pc-legend';
    cfg.series.forEach(([name, color, ours, hatch]) => {
      const li = document.createElement('li');
      if (ours) li.className = 'ours';
      li.innerHTML = `<i style="--c:${color}"${hatch ? ' class="hatch"' : ''}></i>${name}`;
      legend.appendChild(li);
    });
    head.appendChild(legend);
    let toggles = [];
    if (cfg.backends) {
      const sw = document.createElement('div'); sw.className = 'pc-switch'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Policy backend');
      [['dino', 'DINOv3 + FMT'], ['groot', 'GR00T N1.6']].forEach(([k, label]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.k = k;
        b.setAttribute('aria-pressed', String(k === backend));
        b.addEventListener('click', () => { backend = k; toggles.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === k))); update(); });
        sw.appendChild(b); toggles.push(b);
      });
      head.appendChild(sw);
    }
    host.appendChild(head);
    const grid = document.createElement('div'); grid.className = 'pc-panels'; grid.style.setProperty('--n', cfg.panels.length);
    const bars = [];
    cfg.panels.forEach((p) => {
      const panel = document.createElement('div'); panel.className = 'pc-panel';
      panel.innerHTML = `<h5>${p.title}</h5>`;
      const plot = document.createElement('div'); plot.className = 'pc-plot';
      plot.innerHTML = [0, 25, 50, 75, 100].map((y) => `<span class="pc-tick" style="bottom:${y / 1.1}%"><b>${y}</b></span>`).join('');
      const groups = document.createElement('div'); groups.className = 'pc-groups';
      p.groups.forEach((g) => {
        const group = document.createElement('div'); group.className = 'pc-group';
        const row = document.createElement('div'); row.className = 'pc-bars';
        cfg.series.forEach(([name, color, ours, hatch], si) => {
          const pick = () => (g.v || g[backend])[si];
          if (g.v && g.v[si] === null) return;            // this series has no bar in this group
          const bar = document.createElement('div');
          bar.className = 'pc-bar' + (ours ? ' ours' : '') + (hatch ? ' hatch' : '');
          bar.style.setProperty('--c', color);
          bar.innerHTML = '<span class="pc-val">0.0</span>';
          bar.title = name;
          row.appendChild(bar);
          bars.push({ bar, val: bar.firstChild, pick, i: bars.length });
        });
        group.appendChild(row);
        if (g.label) { const l = document.createElement('div'); l.className = 'pc-glabel'; l.textContent = g.label; group.appendChild(l); }
        groups.appendChild(group);
      });
      plot.appendChild(groups);
      panel.appendChild(plot);
      grid.appendChild(panel);
    });
    host.appendChild(grid);
    const yl = document.createElement('p'); yl.className = 'pc-axis'; yl.textContent = 'Task score (%)'; host.insertBefore(yl, grid);
    const update = () => {
      bars.forEach(({ bar, val, pick, i }) => {
        const v = pick(), delay = shown ? 0 : i * 70;
        bar.style.transitionDelay = delay + 'ms';
        if (v === null) { bar.style.height = '0%'; bar.classList.add('na'); val.textContent = 'N/A'; val.dataset.v = 0; return; }
        bar.classList.remove('na');
        bar.style.height = (v / 1.1) + '%';
        countUp(val, v, delay);
      });
      shown = true;
    };
    whenVisible(host, update);
  });

  // ---------- User-study stacked bars ----------
  document.querySelectorAll('[data-stack]').forEach((host) => {
    const segs = [...host.querySelectorAll('.us-seg')];
    whenVisible(host, () => segs.forEach((s, i) => {
      s.style.transitionDelay = (reducedMotion ? 0 : i * 90) + 'ms';
      s.style.width = s.dataset.w + '%';
      countUp(s.querySelector('b'), parseFloat(s.dataset.w), reducedMotion ? 0 : i * 90);
    }));
  });
})();
