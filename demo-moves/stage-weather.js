(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StageWeather=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Moto e densità dalla demo Sanmauro: nessun file audio remoto o asset generato.
  function shootingStars(width,elapsed){
    const stars=[];
    for(let i=0;i<3;i++){
      const period=3200+i*700,clock=elapsed+i*1300,time=(clock%period-1200)/1000;
      if(time<0||time>=.85)continue;
      const cycle=Math.floor(clock/period);
      stars.push({x:(530+i*733+cycle*419)%width-time*591.5,y:75+(i*83+cycle*47)%190+time*269.75,alpha:Math.sin(Math.PI*time/.85)});
    }
    return stars;
  }
  function rainSplashes(width,height,elapsed,groundTop=.87){
    const splashes=[];
    for(let i=0;i<140;i++){
      const period=850+i%7*113,clock=elapsed+i*239,age=clock%period/1000;
      if(age>=.30)continue;
      const cycle=Math.floor(clock/period),jitter=((Math.imul(i+cycle*31+1,1597334677)>>>0)%65536)/65536,depth=((Math.imul(i+13,3812015801)>>>0)%65536)/65536;
      splashes.push({x:(i%20+.1+jitter*.8)*width/20,y:height*(groundTop+depth*(.99-groundTop)),age,depth,alpha:(1-age/.30)*(.30+depth*.25)});
    }
    return splashes;
  }
  function rainDrops(width,height,elapsed){
    const seconds=elapsed/1000,gust=80*Math.sin(seconds*.47)+28*Math.sin(seconds*1.13),slant=1.3+.9*Math.sin(seconds*.47)+.35*Math.cos(seconds*1.13),drift=elapsed*.14+gust;
    return Array.from({length:440},(_,i)=>{
      const seed=((Math.imul(i+1,1597334677)>>>0)%65536)/65536,variation=((Math.imul(i+37,3812015801)>>>0)%65536)/65536,depth=.45+variation*.7;
      const origin=(i%20+.1+seed*.8)*width/20,sway=8*Math.sin(seconds*.8+i*2.1);
      return {x:((origin-drift+sway)%width+width)%width,y:(variation*(height+60)+elapsed*(.65+depth*.55)+12*Math.sin(seconds*1.7+i))%(height+60)-30,
        depth,slant,alpha:.20+depth*.20,length:3+Math.floor(variation*3)};
    });
  }
  function create(stage,env=globalThis){
    const clouds=stage.webglClouds?env.StageCloudsWebGL?.create(env):null,audio=stage.lightning?env.StageStormAudio?.create(env):null;
    const supported=!stage.webglClouds||Boolean(clouds?.supported);
    function sky(ctx,{elapsed,camera,viewportWidth,reduced}){
      if(stage.shootingStars){
        ctx.save();ctx.filter='none';
        for(const star of shootingStars(stage.width,elapsed)){
          ctx.fillStyle='#b0ccff';
          for(let segment=17;segment>=0;segment--){const fade=1-segment/18;ctx.globalAlpha=star.alpha*fade*fade*.75;ctx.fillRect(Math.round((star.x+segment*6.37-camera)/2)*2,Math.round((star.y-segment*2.905)/2)*2,6,2);}
          ctx.fillStyle='#f2f7ff';ctx.globalAlpha=star.alpha;ctx.fillRect(Math.round((star.x-camera)/2)*2-2,Math.round(star.y/2)*2-2,4,4);
        }
        ctx.restore();
      }
      clouds?.render(ctx,viewportWidth,stage.height,elapsed,camera,stage.width,stage.lightning&&!reduced);
    }
    function background(ctx,{elapsed,rainElapsed,raining,camera,viewportWidth,reduced}){
      const flash=stage.lightning&&!reduced?env.StageCloudsWebGL?.lightningState?.(elapsed)?.flash??0:0;
      if(flash>0){ctx.save();ctx.filter='none';ctx.globalAlpha=flash*.20;ctx.fillStyle='#c2d3ff';ctx.fillRect(0,0,viewportWidth,stage.height);ctx.restore();}
      if(!raining)return;
      ctx.save();ctx.filter='none';ctx.fillStyle='#b9d0e5';
      for(const splash of rainSplashes(stage.width,stage.height,rainElapsed,stage.rainGroundTop??.87)){
        const x=Math.round((splash.x-camera)/2)*2,y=Math.round(splash.y/2)*2;if(x< -16||x>viewportWidth+16)continue;
        const size=.7+splash.depth*.8,spread=Math.round((2+splash.age*28)*size/2)*2,lift=Math.round(Math.max(0,Math.sin(splash.age/.30*Math.PI)*7*size)/2)*2;
        ctx.globalAlpha=splash.alpha;ctx.fillRect(x-spread,y-lift,2,2);ctx.fillRect(x+spread,y-lift,2,2);
        ctx.globalAlpha=splash.alpha*.55;ctx.fillRect(x-spread,y,4,2);ctx.fillRect(x+spread-2,y,4,2);if(splash.age<.08)ctx.fillRect(x,y-2,2,4);
      }
      ctx.restore();
    }
    function foreground(ctx,{rainElapsed,raining,camera,viewportWidth}){
      if(!raining)return;
      ctx.save();ctx.filter='none';ctx.fillStyle='#a8bdd8';
      for(const drop of rainDrops(stage.width,stage.height,rainElapsed)){
        ctx.globalAlpha=drop.alpha;
        for(const shift of [0,stage.width]){
          const x=drop.x-camera+shift;if(x<0||x>viewportWidth+32)continue;
          for(let step=0;step<drop.length;step++)ctx.fillRect(Math.round((x-step*drop.slant*drop.depth)/2)*2,Math.round((drop.y+step*5)/2)*2,drop.depth>1?3:2,5);
        }
      }
      ctx.restore();
    }
    return {supported,sky,background,foreground,async setAudio(value){return Boolean(await audio?.setEnabled(value));},updateAudio(view){audio?.update(view);},destroy(){clouds?.destroy();audio?.destroy();}};
  }
  return Object.freeze({create,shootingStars,rainSplashes,rainDrops});
});
