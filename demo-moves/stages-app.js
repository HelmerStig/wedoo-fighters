(() => {
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const container=document.querySelector('#stages-list');
  const id=new URLSearchParams(location.search).get('id');
  const stages=window.STAGES_CATALOG.filter(stage=>stage.id===id);
  if(!stages.length){
    container.innerHTML='<p class="notice">Stage non trovato. <a href="stages.html">Torna agli stage</a>.</p>';
    document.querySelector('#stages-count').textContent='0';return;
  }
  document.title=stages[0].name+' - WEDOO Fighters';
  document.querySelector('#stage-page-name').textContent=stages[0].name;
  document.querySelector('#stage-breadcrumb').textContent=stages[0].name;
  const lightData=stage=>stage.lightFlicker===false?null:window.STAGE_LIGHTS_CATALOG?.[stage.id];
  const fighterNames=stage=>(stage.fighters??[]).map((f,index)=>escape(window.MOVES_CATALOG.characters.find(c=>c.id===f.characterId)?.name??f.characterId)+(index===0?' a sinistra':' a destra')).join(' e ');
  document.querySelector('#stages-count').textContent=stages.length;
  container.innerHTML=stages.map(stage=>`<section class="stage-card" style="--stage-aspect:${stage.viewportWidth ?? 1920}/${stage.height}" id="${escape(stage.id)}" aria-labelledby="stage-${escape(stage.id)}"><div class="panel-header"><h2 id="stage-${escape(stage.id)}">${escape(stage.name)}</h2><div class="stage-header-actions"><span class="version-tag">PARALLAX</span>${StageCrt.launcher(stage.id)}<button type="button" class="step-button stage-fullscreen-toggle" data-stage-fullscreen aria-pressed="false" aria-controls="stage-screen-${escape(stage.id)}">Fullscreen</button></div></div><div class="stage-screen" data-stage-screen id="stage-screen-${escape(stage.id)}"><div class="stage-preview"><canvas width="${stage.viewportWidth ?? 1920}" tabindex="0" height="${stage.height}" role="img" aria-label="${escape(stage.name)}, ${fighterNames(stage)} in idle, vista ${stage.viewportWidth ?? 1920} per ${stage.height}. Trascina o usa le frecce per esplorare i lati" aria-busy="true">Anteprima di ${escape(stage.name)}.</canvas><canvas class="stage-crt-output" aria-hidden="true" hidden></canvas><div class="stage-crt" aria-hidden="true"></div><p class="stage-status" role="status"></p></div><button type="button" class="step-button stage-fullscreen-exit" data-stage-fullscreen-exit aria-label="Esci da fullscreen">Esci da fullscreen</button></div><p class="stage-fullscreen-message" data-stage-fullscreen-message role="alert" hidden></p><div class="stage-toolbar"><p>Trascina per esplorare lo stage. Puoi usare anche le frecce.</p><button type="button" class="play-button" data-stage-cloud-toggle disabled>Pausa nuvole</button>${stage.ambient?'<button type="button" class="step-button" data-stage-ambient-toggle aria-pressed="true">Disattiva effetti piazza</button><button type="button" class="step-button" data-stage-cloud-shadows aria-pressed="true">Disattiva ombre nuvole</button><button type="button" class="step-button" data-stage-leaves aria-pressed="true">Disattiva foglie</button>':''}${stage.rain?'<button type="button" class="step-button" data-stage-rain-toggle aria-pressed="true">Disattiva pioggia</button>':''}${lightData(stage)?'<button type="button" class="step-button" data-stage-lights-toggle aria-pressed="true">Disattiva sfarfallio</button>':''}${stage.lightning||stage.trafficTrack?'<button type="button" class="step-button" data-stage-audio-toggle aria-pressed="false">'+(stage.trafficTrack?'Attiva traffico':'Attiva audio')+'</button>':''}${stage.trafficTrack?'<label class="traffic-volume">Volume traffico <input data-traffic-volume type="range" min="0" max="100" value="50" aria-label="Volume traffico"></label>':''}</div>${StageEffects.markup(stage.id)}${StageCrt.markup(stage.id,StageEffects.crtMarkup(stage.id))}</section>`).join('');
  const players=[...container.querySelectorAll('.stage-card')].map((card,i)=>{
    const stage={...stages[i],lights:lightData(stages[i])};
    const fighters=(stage.fighters??[]).map(fighter=>{
      const character=window.MOVES_CATALOG.characters.find(c=>c.id===fighter.characterId);
      const animation=character?.animations.find(a=>a.id===fighter.animationId);
      if(!animation)throw new Error('Animazione mancante: '+fighter.characterId);
      const contacts=window.STAGE_FOOT_CONTACTS?.items.find(item=>item.characterId===fighter.characterId);
      if(contacts&&(contacts.image!==animation.image||contacts.frames.length!==animation.frames.length))throw new Error('Rigenera i contatti dei piedi: '+fighter.characterId);
      return {...fighter,animation,footContacts:contacts?.frames};
    });
    const player=StagesPlayer.install(card.querySelector('canvas'),card.querySelector('[data-stage-cloud-toggle]'),card.querySelector('[role="status"]'),{...stage,fighters});
    const fullscreen=StageFullscreen.install(card);
    const crt=StageCrt.install(card,player,stage.id,globalThis,window.STAGE_CRT_PRESETS?.[stage.id]);
    const effects=StageEffects.install(card,player,crt);

    const ambientButton=stage.ambient?card.querySelector('[data-stage-ambient-toggle]'):null;
    let ambientEnabled=true;
    const toggleAmbient=()=>{ambientEnabled=!ambientEnabled;player.setAmbient(ambientEnabled);ambientButton.textContent=ambientEnabled?'Disattiva effetti piazza':'Attiva effetti piazza';ambientButton.setAttribute('aria-pressed',String(ambientEnabled));};
    ambientButton?.addEventListener('click',toggleAmbient);
    const ambientParts=[['cloudShadows','[data-stage-cloud-shadows]','ombre nuvole'],['leaves','[data-stage-leaves]','foglie']].map(([key,selector,label])=>{
      const button=card.querySelector(selector);let enabled=true;
      const toggle=()=>{enabled=!enabled;player.setAmbientPart(key,enabled);button.textContent=(enabled?'Disattiva ':'Attiva ')+label;button.setAttribute('aria-pressed',String(enabled));};
      button?.addEventListener('click',toggle);return {button,toggle};
    });
    const rainButton=stage.rain?card.querySelector('[data-stage-rain-toggle]'):null;
    const lightsButton=stage.lights?card.querySelector('[data-stage-lights-toggle]'):null;
    const traffic=stage.trafficTrack?window.StageLoopAudio.create(stage.trafficTrack):null;
    const volumeControl=card.querySelector('[data-traffic-volume]');
    const changeVolume=()=>traffic?.setVolume(Number(volumeControl.value)/100);
    volumeControl?.addEventListener('input',changeVolume);
    const audioButton=stage.lightning||stage.trafficTrack?card.querySelector('[data-stage-audio-toggle]'):null;
    let raining=Boolean(stage.rain),audioEnabled=false,disposed=false;
    let flickering=Boolean(stage.lights);
    const toggleLights=()=>{flickering=!flickering;player.setLights(flickering);lightsButton.textContent=flickering?'Disattiva sfarfallio':'Attiva sfarfallio';lightsButton.setAttribute('aria-pressed',String(flickering));};
    lightsButton?.addEventListener('click',toggleLights);
    const toggleRain=()=>{
      raining=!raining;player.setRain(raining);
      rainButton.textContent=raining?'Disattiva pioggia':'Attiva pioggia';rainButton.setAttribute('aria-pressed',String(raining));
    };
    const toggleAudio=async()=>{
      audioButton.disabled=true;const requested=!audioEnabled;
      audioEnabled=await (traffic?traffic.setEnabled(requested):player.setStormAudio(requested));if(disposed)return;
      audioButton.textContent=audioEnabled?(traffic?'Disattiva traffico':'Disattiva audio'):requested?'Audio non disponibile':(traffic?'Attiva traffico':'Attiva audio');
      audioButton.setAttribute('aria-pressed',String(audioEnabled));audioButton.disabled=false;
    };
    rainButton?.addEventListener('click',toggleRain);audioButton?.addEventListener('click',toggleAudio);

    return {destroy(){disposed=true;traffic?.destroy();volumeControl?.removeEventListener('input',changeVolume);ambientButton?.removeEventListener('click',toggleAmbient);ambientParts.forEach(({button,toggle})=>button?.removeEventListener('click',toggle));lightsButton?.removeEventListener('click',toggleLights);rainButton?.removeEventListener('click',toggleRain);audioButton?.removeEventListener('click',toggleAudio);effects.destroy();crt.destroy();fullscreen.destroy();player.destroy();}};
  });
  window.addEventListener('pagehide',()=>players.forEach(player=>player.destroy()));
})();
