(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StagesPlayer=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function cloudPositions(stageWidth,layerWidth,elapsed,speed){
    let x=(stageWidth-layerWidth)/2-(elapsed*speed/1000)%layerWidth;
    while(x+layerWidth<=0)x+=layerWidth;
    const positions=[];
    for(;x<stageWidth;x+=layerWidth)positions.push(x);
    return positions;
  }
  function install(canvas,button,status,stage,env=globalThis){
    const context=canvas.getContext('2d');
    const media=env.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed=false,ready=false,playing=!media.matches,elapsed=0,last=null,request=null;
    let fighterElapsed=0,animateFighters=!media.matches;
    const viewportWidth=stage.viewportWidth??stage.height*16/9;
    const maxCamera=Math.max(0,stage.width-viewportWidth);
    let camera=maxCamera/2,drag=null;
    const layers=stage.layers.map((layer,index)=>({...layer,index,imageObject:null})).sort((a,b)=>a.zIndex-b.zIndex||a.index-b.index);
    const fighters=(stage.fighters??[]).map(fighter=>({...fighter,imageObject:null}));
    const assets=[...layers,...fighters];
    canvas.width=viewportWidth;canvas.height=stage.height;
    function draw(){
      if(!ready||disposed)return;
      context.clearRect(0,0,viewportWidth,stage.height);
      context.imageSmoothingEnabled=false;
      for(const layer of layers){
        const positions=layer.speed?cloudPositions(stage.width,layer.width,elapsed,layer.speed):[(stage.width-layer.width)/2];
        for(const x of positions)context.drawImage(layer.imageObject,x-camera,0);
      }
      for(const fighter of fighters){
        const animation=fighter.animation;
        const frame=Math.floor(fighterElapsed*(animation.playbackFps??24)/1000+1e-10)%animation.frames.length;
        const [sx,sy,w,h]=animation.frames[frame];
        context.save();
        context.translate(fighter.x-camera,fighter.groundY);
        context.scale(fighter.flipX?-fighter.scale:fighter.scale,fighter.scale);
        context.drawImage(fighter.imageObject,sx,sy,w,h,-fighter.anchorX,-fighter.anchorY,w,h);
        context.restore();
      }
    }
    function sync(){
      button.disabled=!ready;
      button.textContent=playing?'Pausa nuvole':'Avvia nuvole';
      button.setAttribute('aria-pressed',String(playing));
    }
    function schedule(){
      if(!disposed&&ready&&(playing||(animateFighters&&fighters.length))&&!env.document.hidden&&request===null)request=env.requestAnimationFrame(tick);
    }
    function tick(time){
      request=null;
      const delta=last===null?0:Math.max(0,Math.min(time-last,100));
      if(playing)elapsed+=delta;
      if(animateFighters)fighterElapsed+=delta;
      last=time;draw();schedule();
    }
    function resetClock(){
      last=null;
      if(request!==null){env.cancelAnimationFrame(request);request=null;}
      schedule();
    }
    function toggle(){playing=!playing;sync();resetClock();}
    function visibility(){resetClock();}
    function reduced(){animateFighters=!media.matches;if(media.matches)playing=false;sync();resetClock();}
    function moveCamera(value){camera=Math.max(0,Math.min(maxCamera,value));draw();}
    function pointerDown(event){
      if(!ready||drag||event.isPrimary===false||event.button!==0)return;
      drag={id:event.pointerId,x:event.clientX,camera,scale:viewportWidth/canvas.getBoundingClientRect().width};
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-dragging');
      canvas.focus({preventScroll:true});
    }
    function pointerMove(event){
      if(!drag||event.pointerId!==drag.id)return;
      moveCamera(drag.camera-(event.clientX-drag.x)*drag.scale);
    }
    function pointerEnd(event){
      if(!drag||event.pointerId!==drag.id)return;
      const id=drag.id;drag=null;canvas.classList.remove('is-dragging');
      if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    }
    function keyDown(event){
      const next={ArrowLeft:camera-64,ArrowRight:camera+64,Home:0,End:maxCamera}[event.key];
      if(next===undefined)return;
      event.preventDefault();moveCamera(next);
    }
    button.disabled=true;
    if(!context){status.textContent='Anteprima non supportata da questo browser.';return {destroy(){}};}
    button.addEventListener('click',toggle);
    canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointermove',pointerMove);
    canvas.addEventListener('pointerup',pointerEnd);
    canvas.addEventListener('pointercancel',pointerEnd);
    canvas.addEventListener('lostpointercapture',pointerEnd);
    canvas.addEventListener('keydown',keyDown);
    env.document.addEventListener('visibilitychange',visibility);
    media.addEventListener?.('change',reduced);
    status.textContent='Caricamento dello stage…';
    const loaded=Promise.all(assets.map(layer=>new Promise((resolve,reject)=>{
      const image=new env.Image();layer.imageObject=image;
      image.onload=()=>{
        if(layer.animation){
          const frames=layer.animation.frames;
          if(!frames?.length||frames.some(([x,y,w,h])=>![x,y,w,h].every(Number.isInteger)||x<0||y<0||w<=0||h<=0||x+w>image.naturalWidth||y+h>image.naturalHeight)){
            reject(new Error('Spritesheet non valido: '+layer.characterId));return;
          }
        }else if(image.naturalWidth!==layer.width||image.naturalHeight!==layer.height){reject(new Error('Dimensioni inattese: '+layer.id));return;}
        resolve();
      };
      image.onerror=()=>reject(new Error('Impossibile caricare lo stage. Verifica le immagini locali.'));
      image.src=layer.animation?.image??layer.image;
    }))).then(()=>{
      if(disposed)return;
      ready=true;status.textContent='';status.hidden=true;canvas.setAttribute('aria-busy','false');sync();draw();schedule();
    }).catch(error=>{
      if(disposed)return;
      status.textContent=error.message;canvas.setAttribute('aria-busy','false');
    });
    return {loaded,destroy(){
      disposed=true;resetClock();
      button.removeEventListener('click',toggle);
      if(drag)pointerEnd({pointerId:drag.id});
      for(const [type,handler] of [['pointerdown',pointerDown],['pointermove',pointerMove],['pointerup',pointerEnd],['pointercancel',pointerEnd],['lostpointercapture',pointerEnd],['keydown',keyDown]])canvas.removeEventListener(type,handler);
      env.document.removeEventListener('visibilitychange',visibility);
      media.removeEventListener?.('change',reduced);
      assets.forEach(layer=>{layer.imageObject.onload=null;layer.imageObject.onerror=null;});
    }};
  }
  return Object.freeze({install,cloudPositions});
});
