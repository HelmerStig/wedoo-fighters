(() => {
  'use strict';
  const stages=window.STAGES_CATALOG;
  const oldId=location.hash.slice(1);
  if(stages.some(s=>s.id===oldId)){location.replace('stage.html?id='+encodeURIComponent(oldId));return;}
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.querySelector('#stages-count').textContent=stages.length;
  const list=document.querySelector('#stages-list');list.className='stage-selection-grid';
  list.innerHTML=stages.map(stage=>`<a class="stage-selection-card" href="stage.html?id=${encodeURIComponent(stage.id)}"><img src="assets/stages/${encodeURIComponent(stage.id)}.webp" alt="${escape(stage.name)}" width="640" height="360" loading="lazy" decoding="async"><h2>${escape(stage.name)}</h2><p>Apri lo stage animato</p></a>`).join('');
})();
