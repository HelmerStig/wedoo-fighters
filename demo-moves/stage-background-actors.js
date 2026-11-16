(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StageBackgroundActors=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function controller(definition,animations,random=Math.random){
    const {minX,maxX}=definition.path,speed=definition.speed??45;
    const greetFps=animations.saluto.playbackFps??24,count=animations.saluto.frames.length;
    if(!(maxX>minX&&speed>0&&count>=2&&greetFps>0&&animations.walk.frames.length))throw new Error('Percorso o animazioni di sfondo non validi.');
    if(definition.walkableRect){
      const rect=definition.walkableRect;
      for(const animation of Object.values(animations)){
        if(!animation.contentBounds)continue;
        const reach=Math.max(Math.abs(animation.contentBounds[0]-definition.anchorX),Math.abs(animation.contentBounds[2]-definition.anchorX))*definition.scale;
        const ground=animation.groundRange??[definition.anchorY,definition.anchorY];
        if(minX-reach<rect.left||maxX+reach>rect.right||definition.path.groundY+(ground[0]-definition.anchorY)*definition.scale<rect.top||definition.path.groundY+(ground[1]-definition.anchorY)*definition.scale>rect.bottom)throw new Error('Il percorso invade un ostacolo: '+definition.characterId);
      }
    }
    const nextGreeting=()=>6000+Math.max(0,Math.min(1,random()))*8000;
    let x=minX,direction=1,phase='walk',time=0,deadline=nextGreeting(),last=0;
    function advance(delta){
      while(delta>1e-8){
        if(phase==='walk'){
          const boundary=Math.abs((direction>0?maxX:minX)-x)/speed*1000;
          const step=Math.max(0,Math.min(delta,boundary,deadline-time));
          x=Math.max(minX,Math.min(maxX,x+direction*speed*step/1000));time+=step;delta-=step;
          if(boundary<=step+1e-8||time>=deadline-1e-8){phase='saluto';time=0;}
        }else{
          const duration=(phase==='saluto'?count:count-1)*1000/greetFps;
          const step=Math.min(delta,duration-time);time+=step;delta-=step;
          if(time>=duration-1e-8){
            if(phase==='saluto')phase='reverse';
            else {phase='walk';direction*=-1;deadline=nextGreeting();}
            time=0;
          }
        }
      }
    }
    function state(){
      const animation=phase==='walk'?'walk':'saluto';
      const frame=phase==='walk'?Math.floor(time*(animations.walk.playbackFps??24)/1000)%animations.walk.frames.length
        :phase==='saluto'?Math.min(count-1,Math.floor(time*greetFps/1000))
        :Math.max(0,count-2-Math.floor(time*greetFps/1000));
      return {x,direction,phase,animation,frame};
    }
    return {update(elapsed){advance(Math.max(0,elapsed-last));last=elapsed;return state();},state};
  }
  function create(actors,env=globalThis){
    const items=actors.map(actor=>({...actor,controller:controller(actor,Object.fromEntries(Object.entries(actor.animations).map(([id,asset])=>[id,asset.animation])),env.Math?.random??Math.random)}));
    return {render(context,elapsed,camera,reduced=false,shadowStrength=1){
      for(const actor of items){
        const state=reduced?actor.controller.state():actor.controller.update(elapsed);
        const asset=actor.animations[reduced?'walk':state.animation],frame=asset.animation.frames[reduced?0:state.frame];
        const [sx,sy,w,h]=frame,x=state.x-camera,y=actor.path.groundY;
        context.save();
        if(shadowStrength>0){
          context.globalAlpha=.24*shadowStrength;context.fillStyle='#1d1625';
          context.fillRect(x-24,y-1,48,4);context.fillRect(x-18,y+3,36,2);
        }
        context.globalAlpha=1;context.imageSmoothingEnabled=false;
        context.translate(x,y);context.scale(state.direction*actor.scale,actor.scale);
        context.drawImage(asset.imageObject,sx,sy,w,h,-actor.anchorX,-actor.anchorY,w,h);
        context.restore();
      }
    },destroy(){items.length=0;}};
  }
  return Object.freeze({controller,create});
});
