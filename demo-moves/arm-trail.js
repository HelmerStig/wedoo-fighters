(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.MovesArmTrail=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function frameAt(durations,time){
    let frame=0;
    while(frame<durations.length-1&&time>=durations[frame]-1e-8){time-=durations[frame++];}
    return frame;
  }
  function samples(animation,state,strength=1){
    const p=animation.armTrail,d=animation.frameDurations;
    if(!p||!d||strength<=0||state.frame<p.startFrame||state.frame>p.forwardEndFrame)return [];
    const elapsed=d.slice(0,state.frame).reduce((a,b)=>a+b,0)+Math.max(0,state.remainder||0);
    const end=d.slice(0,p.endFrame).reduce((a,b)=>a+b,0);
    if(elapsed>=end+p.fadeOutMs)return [];
    const fade=elapsed<=end?1:Math.max(0,1-(elapsed-end)/p.fadeOutMs);
    const result=[];
    p.historyMs.forEach((age,i)=>{
      const time=elapsed-age;
      if(time<0)return;
      const frame=frameAt(d,time);
      // Each mask follows only the punching arm, in the forward stroke.
      if(frame<p.startFrame||frame>p.endFrame||!p.polygons[frame]||frame===state.frame)return;
      const alpha=p.opacities[i]*Math.min(1,strength)*fade;
      const duplicate=result.find(sample=>sample.frame===frame);
      if(duplicate)duplicate.alpha=Math.max(duplicate.alpha,alpha);
      else result.push({frame,alpha});
    });
    return result;
  }
  function particles(animation,state,strength=1){
    const profile=animation.armTrail,p=profile?.particles,d=animation.frameDurations;
    if(!p||!d||strength<=0)return [];
    const elapsed=d.slice(0,state.frame).reduce((a,b)=>a+b,0)+Math.max(0,state.remainder||0);
    const random=seed=>{const x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x);};
    const result=[];
    for(const [key,origins] of Object.entries(p.origins)){
      const frame=Number(key),birth=d.slice(0,frame).reduce((a,b)=>a+b,0),age=elapsed-birth;
      if(age<0||age>=p.lifetimeMs)continue;
      const count=Math.ceil(p.perBurst*Math.min(1,strength));
      for(let i=0;i<count;i++){
        const seed=frame*101+i*17,life=p.lifetimeMs*(.75+.25*random(seed));
        if(age>=life)continue;
        const [ox,oy]=origins[i%origins.length],seconds=age/1000,progress=age/life;
        const x=ox+(random(seed+1)-.5)*10-p.speedX*(.75+.6*random(seed+2))*seconds;
        const y=oy+(random(seed+3)-.5)*8+p.spreadY*(random(seed+4)*2-1)*seconds;
        result.push({x:Math.round(x/2)*2,y:Math.round(y/2)*2,width:p.widths[i%p.widths.length],height:p.heights[i%p.heights.length],color:p.colors[i%p.colors.length],alpha:.95*Math.min(1,strength)*Math.pow(1-progress,1.2)});
      }
    }
    return result;
  }
  function create(animation,document){
    const p=animation.armTrail,cache=new Map();
    let source=null;
    function masked(image,frame){
      if(source!==image){cache.clear();source=image;}
      if(cache.has(frame))return cache.get(frame);
      const canvas=document.createElement('canvas');
      canvas.width=animation.frameWidth;canvas.height=animation.frameHeight;
      const c=canvas.getContext('2d');if(!c)return null;
      const polygon=p.polygons[frame],[x,y,w,h]=animation.frames[frame];
      c.imageSmoothingEnabled=false;
      c.save();c.beginPath();polygon.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.clip();
      c.drawImage(image,x,y,w,h,0,0,canvas.width,canvas.height);
      c.globalCompositeOperation='source-in';c.fillStyle=p.tint;c.fillRect(0,0,canvas.width,canvas.height);c.restore();
      cache.set(frame,canvas);return canvas;
    }
    return {draw(context,image,state,strength){
      const ghosts=samples(animation,state,strength);
      const dust=particles(animation,state,strength);
      if(!ghosts.length&&!dust.length)return;
      context.save();context.imageSmoothingEnabled=false;
      for(const ghost of ghosts){
        const canvas=masked(image,ghost.frame);if(!canvas)continue;
        context.globalAlpha=ghost.alpha;
        context.drawImage(canvas,0,0,animation.frameWidth,animation.frameHeight);
      }
      for(const particle of dust){
        context.globalAlpha=particle.alpha;context.fillStyle=particle.color;
        context.fillRect(particle.x,particle.y,particle.width,particle.height);
      }
      context.restore();
    },destroy(){cache.clear();source=null;}};
  }
  return Object.freeze({samples,particles,create});
});
