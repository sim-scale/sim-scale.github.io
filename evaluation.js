(() => {
  const backend = document.querySelector('#eval-backend');
  const source = document.querySelector('#eval-source');
  const table = document.querySelector('#simulation-scores');
  if (!table) return;
  fetch('simulation-results.json').then(response => {
    if (!response.ok) throw new Error('Results file unavailable');
    return response.json();
  }).then(({data}) => {
    const names = ['RoboCasa', 'Articraft', 'SimFoundry twins', 'SimFoundry cousins', 'SimScale (ours)'];
    const update = () => {
      const scores = data[backend.value][source.value];
      const body = table.querySelector('tbody');
      body.replaceChildren();
      names.forEach((name, index) => {
        const row = document.createElement('tr');
        if (index === 4) row.className = 'ours-score';
        const heading = document.createElement('th');
        heading.scope = 'row'; heading.textContent = name; row.append(heading);
        scores.forEach(task => {
          const cell = document.createElement('td');
          const score = task[index];
          cell.textContent = score ? `${score[0].toFixed(1)} ± ${score[1].toFixed(1)}` : 'Not available';
          row.append(cell);
        });
        body.append(row);
      });
      document.querySelector('#evaluation-note').textContent = `${backend.options[backend.selectedIndex].text} evaluated on held-out ${source.options[source.selectedIndex].text} assets. Each available configuration is tested with 100 rollouts.`;
    };
    backend.addEventListener('change', update);
    source.addEventListener('change', update);
    update();
  }).catch(() => {
    document.querySelector('#evaluation-note').textContent = 'The results table could not be loaded. Use the manuscript link below to view the full scores.';
  });
})();
