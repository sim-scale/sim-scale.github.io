// Method walkthrough: image loops for the mug family and the HangMug storyboard. Each loop runs only while its step
// is on screen. The step-by-step reveals themselves are CSS animations keyed on the shared .reveal.visible class.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loop = (root, frames, period, onStep) => {
    let i = 0, timer = null;
    const show = (k) => { i = k; frames.forEach((f, j) => f.classList.toggle('on', j === k)); if (onStep) onStep(k); };
    const start = () => { if (!timer && !reducedMotion) timer = setInterval(() => { i = (i + 1) % frames.length; show(i); }, period); };
    const stop = () => { clearInterval(timer); timer = null; };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.3 }).observe(root);
    }
    show(0);
    return show;
  };

  // Mugs from one generator, one after another.
  document.querySelectorAll('[data-cycle]').forEach((root) => loop(root, [...root.querySelectorAll('img')], 1100));

  // Storyboard: the frame and its stage advance together. Clicking a stage jumps to it.
  document.querySelectorAll('[data-story]').forEach((root) => {
    const frames = [...root.querySelectorAll('.mv-story-frame img')];
    const stages = [...root.querySelectorAll('.mv-stages li')];
    const show = loop(root, frames, 1700, (k) => {
      const stage = Number(frames[k].dataset.stage);
      stages.forEach((li, j) => li.classList.toggle('on', j === stage));
    });
    stages.forEach((li, j) => {
      li.tabIndex = 0;
      const jump = () => show(frames.findIndex((f) => Number(f.dataset.stage) === j));
      li.addEventListener('click', jump);
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); } });
    });
  });
})();
