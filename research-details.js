(() => {
 // Category videos: one per generator, swapped in place in the shared rollout player (rollouts.js adds its controls).
 const V='202611171200',tabs=[...document.querySelectorAll('[data-category]')],player=document.querySelector('.category-player'),video=player&&player.querySelector('video');
 const select=(key,focus=false)=>{
  const tab=tabs.find(t=>t.dataset.category===key);
  tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;if(active&&focus)t.focus();});
  document.querySelector('#category-panel').setAttribute('aria-labelledby',`category-tab-${key}`);
  video.poster=`media/categories/${key}.webp?v=${V}`;video.src=`media/categories/${key}.mp4?v=${V}`;
  video.setAttribute('aria-label',`${tab.dataset.title} generator: all parameters moving`);video.load();
  if(player.rolloutUpdate)player.rolloutUpdate();
 };
 if(video)tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab.dataset.category));
  tab.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
   const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
   select(tabs[next].dataset.category,true);
  });
 });
 const study=document.querySelector('#real-study'),backend=document.querySelector('#real-backend'),table=document.querySelector('#real-scores');
 fetch('real-world-results.json').then(r=>{if(!r.ok)throw new Error('Score data unavailable');return r.json();}).then(({studies})=>{
  const update=()=>{
   const rows=studies[study.value][backend.value],body=table.querySelector('tbody');body.replaceChildren();
   rows.forEach(({method,scores})=>{
    const row=document.createElement('tr'),heading=document.createElement('th');heading.scope='row';heading.textContent=method;
    if(method.startsWith('SimScale'))row.className='ours-score';row.append(heading);
    scores.forEach(score=>{const cell=document.createElement('td');cell.textContent=score.value===null?'Unavailable':score.value.toFixed(1)+score.flags;row.append(cell);});body.append(row);
   });
   document.querySelector('#real-study-note').textContent=study.value==='system'?'Complete-system comparison: SimScale uses one human source demonstration per task; the simulation baselines use 120, and Real-Demos uses 60 real demonstrations. Scores retain the manuscript’s recorded panels and flags.':'Asset-source comparison: the SimScale AssetEngine condition uses human source demonstrations, excluding agent-generated sources. Scores use common recorded object panels. Training budgets are not matched across conditions.';
  };study.addEventListener('change',update);backend.addEventListener('change',update);update();
 }).catch(()=>{document.querySelector('#real-study-note').textContent='The score table could not be loaded. Download the linked score data to view the results.';});
})();
