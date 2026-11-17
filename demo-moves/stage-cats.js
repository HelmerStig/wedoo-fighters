(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StageCats=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const balconies=[{minX:1165,maxX:1395,y:665},{minX:1620,maxX:1800,y:710}];
 function controller(definition,random=Math.random){
  const chance=()=>Math.max(0,Math.min(.999999,random()));
  const balcony=definition.level==='balconies';let zone=definition.zone??0;
  const area=()=>balcony?balconies[zone]:{minX:110,maxX:2440,y:definition.groundY??975};
  let a=area(),x=(a.minX+a.maxX)/2,y=a.y,direction=chance()<.5?-1:1,phase='run',last=0,phaseStart=0;
  let speed=(balcony?55:100)+chance()*(balcony?40:95),deadline=3000+chance()*5000,nextJump=8000+chance()*10000,jump=null;
  function state(){
   const progress=phase==='jump'?Math.min(1,(last-phaseStart)/jump.duration):0;
   return {x,y,direction,phase,animation:phase==='jump'?'jump':'run',time:last-phaseStart,progress,zone,scale:definition.scale};
  }
  return {state,update(time){
   while(last<time){const dt=Math.min(25,time-last);last+=dt;
    if(phase==='jump'){
     const p=Math.min(1,(last-phaseStart)/jump.duration);
     x=jump.x+(jump.toX-jump.x)*p;y=jump.y+(jump.toY-jump.y)*p-Math.sin(p*Math.PI)*jump.height;
     if(p>=1){zone=jump.zone;x=jump.toX;y=jump.toY;phase='run';phaseStart=last;nextJump=last+9000+chance()*13000;deadline=last+4000;}
     continue;
    }
    if(phase==='pause'){if(last>=deadline){phase='run';phaseStart=last;deadline=last+4000+chance()*5000;}continue;}
    a=area();x=Math.max(a.minX,Math.min(a.maxX,x+direction*speed*dt/1000));y=a.y;
    const edge=x===a.minX||x===a.maxX;
    const canCross=balcony&&((zone===0&&x===a.maxX&&direction>0)||(zone===1&&x===a.minX&&direction<0));
    if(last>=nextJump&&((balcony&&canCross)||(!balcony&&!edge))){
     const targetZone=balcony?1-zone:zone,target=balcony?balconies[targetZone]:a;
     const toX=balcony?(direction>0?target.minX:target.maxX):Math.max(a.minX,Math.min(a.maxX,x+direction*(140+chance()*110)));
     jump={x,y,toX,toY:target.y,zone:targetZone,duration:balcony?1100:850,height:balcony?85:45};phase='jump';phaseStart=last;continue;
    }
    if(edge){direction*=-1;if(chance()<.25){phase='pause';phaseStart=last;deadline=last+450+chance()*850;}}
    else if(last>=deadline){
     if(chance()<.35){phase='pause';phaseStart=last;deadline=last+400+chance()*1000;}
     else {direction=chance()<.5?-1:1;speed=(balcony?55:100)+chance()*(balcony?40:95);deadline=last+4000+chance()*6000;}
    }
   }
   return state();
  }};
 }
 function create(cats){
  let disposed=false;const entries=cats.map(cat=>({cat,motion:controller(cat)}));
  return {render(ctx,time,camera){
   if(disposed)return;ctx.save();ctx.imageSmoothingEnabled=false;
   for(const {cat,motion} of entries){
    const state=motion.update(time),asset=cat.animations[state.animation],animation=asset.animation;
    const index=state.phase==='jump'?Math.min(animation.frames.length-1,Math.floor(state.progress*animation.frames.length)):state.phase==='pause'?0:Math.floor(state.time*animation.playbackFps/1000)%animation.frames.length;
    const [sx,sy,w,h]=animation.frames[index];const box=animation.bounds[index];
    // Salto con traiettoria dello stage: appoggio della posa allineato al percorso.
    const ax=state.phase==='jump'?(box[0]+box[2])/2:animation.anchorX,ay=state.phase==='jump'?box[3]:animation.anchorY;
    ctx.save();ctx.translate(Math.round(state.x-camera),Math.round(state.y));ctx.scale(state.direction*cat.scale,cat.scale);
    ctx.drawImage(asset.imageObject,sx,sy,w,h,-ax,-ay,w,h);ctx.restore();
   }
   ctx.restore();
  },destroy(){disposed=true;}};
 }
 return Object.freeze({controller,create,balconies});
});
