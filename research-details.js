(() => {
 // Category videos: one per generator, swapped in place in the shared rollout player (rollouts.js adds its controls).
 const V='202611180100',tabs=[...document.querySelectorAll('[data-category]')],player=document.querySelector('.category-player'),video=player&&player.querySelector('video');
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
})();
