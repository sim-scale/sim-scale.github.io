(() => {
 const categories={
  tree:{label:'Mug trees',controls:[['Overall height','Changes the vertical arrangement of hanging locations.'],['Base diameter','Changes the support footprint.'],['Branch elevation','Changes the approach and hook geometry.']]},
  pot:{label:'Pots',controls:[['Body height','Changes the grasp and placement geometry.'],['Body diameter','Changes the pot footprint and separation of handles.'],['Handle reach','Changes where the robot can establish a grasp.']]},
  cabinet:{label:'Cabinets',controls:[['Overall height','Changes the drawer access height.'],['Body width','Changes the storage opening and object clearance.'],['Handle width','Changes the geometry available for opening the drawer.']]},
  kettle:{label:'Kettles',controls:[['Body height','Changes the object proportions.'],['Body diameter','Changes the body footprint.'],['Spout length','Changes the extent and silhouette of the pouring interface.']]}
 };
 const tabs=[...document.querySelectorAll('[data-category]')],video=document.querySelector('#category-video');
 const select=(key,focus=false)=>{
  const data=categories[key],playing=!video.paused;
  tabs.forEach(t=>{const active=t.dataset.category===key;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;if(active&&focus)t.focus();});
  document.querySelector('#category-panel').setAttribute('aria-labelledby',`category-tab-${key}`);
  document.querySelector('#category-title').textContent=data.label;
  const controls=document.querySelector('#category-parameters');controls.replaceChildren();
  data.controls.forEach(([name,description])=>{const article=document.createElement('article'),heading=document.createElement('strong'),p=document.createElement('p');heading.textContent=name;p.textContent=description;article.append(heading,p);controls.append(article);});
  video.pause();video.poster=`media/category-${key}-poster.webp`;video.querySelector('source').src=`media/category-${key}.mp4`;video.load();
  if(playing)video.play().catch(()=>{});
 };
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab.dataset.category));
  tab.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
   const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
   select(tabs[next].dataset.category,true);
  });
 });
 const study=document.querySelector('#real-study'),backend=document.querySelector('#real-backend'),table=document.querySelector('#real-scores');
 fetch('real-world-results.json').then(r=>{if(!r.ok)throw new Error('Score data unavailable');return r.json();}).then(({studies,source_commit})=>{
  const update=()=>{
   const rows=studies[study.value][backend.value],body=table.querySelector('tbody');body.replaceChildren();
   rows.forEach(({method,scores})=>{
    const row=document.createElement('tr'),heading=document.createElement('th');heading.scope='row';heading.textContent=method;
    if(method.startsWith('SimScale'))row.className='ours-score';row.append(heading);
    scores.forEach(score=>{const cell=document.createElement('td');cell.textContent=score.value===null?'Unavailable':score.value.toFixed(1)+score.flags;row.append(cell);});body.append(row);
   });
   document.querySelector('#real-study-note').textContent=study.value==='system'?'Complete-system comparison: SimScale uses one human source demonstration per task; the simulation baselines use 120, and Real-Demos uses 60 real demonstrations. Scores retain the manuscript’s recorded panels and flags.':'Asset-source comparison: the SimScale AssetEngine condition uses human source demonstrations, excluding agent-generated sources. Scores use common recorded object panels. Training budgets are not matched across conditions.';
   const file=study.value==='system'?'real_world_results.tex':'asset_source_real_results.tex';
   document.querySelector('#real-source-link').href=`https://github.com/kevin-thankyou-lin/ICRA27-Digtal-Cousins-Sim2Real/blob/${source_commit}/tables/${file}`;
  };study.addEventListener('change',update);backend.addEventListener('change',update);update();
 }).catch(()=>{document.querySelector('#real-study-note').textContent='The score table could not be loaded. Download the linked score data to view the results.';});
})();
