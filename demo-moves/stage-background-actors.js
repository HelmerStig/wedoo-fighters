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
    const [greetMin,greetMax]=definition.greetingInterval??[6000,14000];
    const nextGreeting=(first=false)=>{const [min,max]=first?(definition.firstGreetingInterval??[greetMin,greetMax]):[greetMin,greetMax];return min+Math.max(0,Math.min(1,random()))*(max-min);};
    let x=Math.max(minX,Math.min(maxX,definition.startX??minX)),direction=1,phase='walk',time=0,deadline=nextGreeting(true),last=0;
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
  function groundedFeet(animation,index,anchorX,anchorY){
    const feet=animation.footContacts?.[index]??[{x:anchorX,y:anchorY,width:50}];
    const bottom=Math.max(...feet.map(f=>f.y));
    const support=feet.filter(f=>bottom-f.y<=18);
    if(support.length===2){
      const dx=Math.abs(support[1].x-support[0].x),dy=Math.abs(support[1].y-support[0].y);
      // Piedi sovrapposti o a quote troppo diverse non definiscono il piano a terra.
      if(dx<=20||dy/dx>.12)return [support[0].y>=support[1].y?support[0]:support[1]];
    }
    return support;
  }
  function projection(actor,state,feet,camera,style,anchorY){
    const slope=feet.length===2&&Math.abs(feet[1].x-feet[0].x)>20?(feet[1].y-feet[0].y)/(feet[1].x-feet[0].x):0;
    const offset=feet[0].y-anchorY-slope*(feet[0].x-actor.anchorX),s=actor.scale;
    return [s*(state.direction+style.shearX*slope),s*slope*(1+style.flattenY),-style.shearX*s,-style.flattenY*s,
      state.x-camera+style.shearX*s*offset,actor.path.groundY+s*offset*(1+style.flattenY)];
  }
  function create(actors,env=globalThis,shadowStyle={}){
    const style={color:'#1d1625',shearX:.5,flattenY:.11,opacity:.72,contactOpacity:.28,...shadowStyle};
    const items=actors.map(actor=>({...actor,controller:controller(actor,Object.fromEntries(Object.entries(actor.animations).map(([id,asset])=>[id,asset.animation])),env.Math?.random??Math.random)}));
    return {render(context,elapsed,camera,reduced=false,shadowStrength=1){
      for(const actor of items){
        const state=reduced?actor.controller.state():actor.controller.update(elapsed);
        const index=reduced?0:state.frame;
        const asset=actor.animations[reduced?'walk':state.animation],frame=asset.animation.frames[index];
        const anchorY=asset.animation.groundAnchors?.[index]??actor.anchorY;
        const feet=groundedFeet(asset.animation,index,actor.anchorX,anchorY);
        const [sx,sy,w,h]=frame,x=state.x-camera,y=actor.path.groundY;
        const pixelSize=Math.max(1,Math.round(actor.pixelSize??1));
        let frameImage=asset.imageObject,sourceRect=[sx,sy,w,h];
        if(pixelSize>1&&env.document?.createElement){
          if(!actor.pixelCanvas){actor.pixelCanvas=env.document.createElement('canvas');actor.pixelContext=actor.pixelCanvas.getContext('2d');}
          if(actor.pixelContext){
            const key=asset.animation.image+':'+index+':'+pixelSize;
            if(actor.pixelKey!==key){
              actor.pixelCanvas.width=Math.ceil(w/pixelSize);actor.pixelCanvas.height=Math.ceil(h/pixelSize);
              actor.pixelContext.imageSmoothingEnabled=false;
              actor.pixelContext.clearRect(0,0,actor.pixelCanvas.width,actor.pixelCanvas.height);
              actor.pixelContext.drawImage(asset.imageObject,sx,sy,w,h,0,0,actor.pixelCanvas.width,actor.pixelCanvas.height);
              actor.pixelKey=key;
            }
            frameImage=actor.pixelCanvas;sourceRect=[0,0,actor.pixelCanvas.width,actor.pixelCanvas.height];
          }
        }
        context.save();
        if(shadowStrength>0){
          if(!actor.shadowCanvas&&env.document?.createElement){
            actor.shadowCanvas=env.document.createElement('canvas');actor.shadowCanvas.width=w;actor.shadowCanvas.height=h;
            actor.shadowContext=actor.shadowCanvas.getContext('2d');
          }
          if(actor.shadowContext){
            const key=asset.animation.image+':'+index+':'+pixelSize,buffer=actor.shadowContext;
            if(actor.shadowKey!==key){
              buffer.clearRect(0,0,w,h);buffer.imageSmoothingEnabled=false;
              buffer.drawImage(frameImage,...sourceRect,0,0,w,h);
              buffer.save();buffer.globalCompositeOperation='source-in';buffer.fillStyle=style.color;buffer.fillRect(0,0,w,h);buffer.restore();actor.shadowKey=key;
            }
            context.save();context.globalAlpha=style.opacity*shadowStrength;
            context.transform(...projection(actor,state,feet,camera,style,anchorY));
            context.drawImage(actor.shadowCanvas,-actor.anchorX,-anchorY,w,h);context.restore();
          }
          context.globalAlpha=style.contactOpacity*shadowStrength;context.fillStyle=style.color;
          for(const foot of feet){
            const footX=x+state.direction*actor.scale*(foot.x-actor.anchorX),width=Math.max(8,foot.width*actor.scale);
            const footY=y+actor.scale*(foot.y-anchorY);
            context.fillRect(footX-width/2,footY-1,width,3);
          }
        }
        context.globalAlpha=1;context.imageSmoothingEnabled=false;
        context.translate(x,y);context.scale(state.direction*actor.scale,actor.scale);
        context.drawImage(frameImage,...sourceRect,-actor.anchorX,-anchorY,w,h);
        context.restore();
      }
    },destroy(){for(const item of items)for(const buffer of [item.shadowCanvas,item.pixelCanvas])if(buffer){buffer.width=0;buffer.height=0;}items.length=0;}};
  }
  return Object.freeze({controller,create,groundedFeet,projection});
});
