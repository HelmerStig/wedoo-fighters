(() => {
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const container=document.querySelector('#stages-list');
  const stages=window.STAGES_CATALOG;
  document.querySelector('#stages-count').textContent=stages.length;
  container.innerHTML=stages.map(stage=>`<section class="stage-card" aria-labelledby="stage-${escape(stage.id)}"><div class="panel-header"><h2 id="stage-${escape(stage.id)}">${escape(stage.name)}</h2><span class="version-tag">PARALLAX</span></div><div class="stage-preview"><canvas width="${stage.viewportWidth ?? 1920}" tabindex="0" height="${stage.height}" role="img" aria-label="${escape(stage.name)}, Alberto a sinistra e Marsan a destra in idle, vista 16:9. Trascina o usa le frecce per esplorare i lati" aria-busy="true">Anteprima di ${escape(stage.name)}.</canvas><p class="stage-status" role="status"></p></div><div class="stage-toolbar"><p>Trascina per esplorare lo stage. Puoi usare anche le frecce.</p><button type="button" class="play-button" disabled>Pausa nuvole</button></div></section>`).join('');
  const players=[...container.querySelectorAll('.stage-card')].map((card,i)=>{
    const stage=stages[i];
    const fighters=(stage.fighters??[]).map(fighter=>{
      const character=window.MOVES_CATALOG.characters.find(c=>c.id===fighter.characterId);
      const animation=character?.animations.find(a=>a.id===fighter.animationId);
      if(!animation)throw new Error('Animazione mancante: '+fighter.characterId);
      return {...fighter,animation};
    });
    return StagesPlayer.install(card.querySelector('canvas'),card.querySelector('button'),card.querySelector('[role="status"]'),{...stage,fighters});
  });
  window.addEventListener('pagehide',()=>players.forEach(player=>player.destroy()));
})();
