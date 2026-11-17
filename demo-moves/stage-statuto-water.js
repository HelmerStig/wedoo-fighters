(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StatutoWater=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function flow(y,time){return .18+.72*(.5+.5*Math.sin(y*.12-time*.018));}
 function create(image,env=globalThis,birdImage=null,groundImage=null){
  const birds=env.StageBlackbirds?.create(birdImage,undefined,groundImage);
  const enabled={water:true,birds:true};
  function render(ctx,time,camera){
   if(!image)return;
   if(enabled.birds)birds?.render(ctx,time,camera,true);
   if(!enabled.water)return;
   const t=Math.floor(time/1000*16)*1000/16;
   ctx.save();ctx.imageSmoothingEnabled=false;
   for(let y=0;y<550;y+=3){const h=Math.min(3,550-y);ctx.globalAlpha=flow(y,t);ctx.drawImage(image,0,y,210,h,1165-camera,400+y,210,h);}
   ctx.restore();
  }
  return {render,
   renderSky(ctx,time,camera){if(image&&enabled.birds)birds?.render(ctx,time,camera,false);},
   setEffect(key,value){if(Object.hasOwn(enabled,key))enabled[key]=Boolean(value);},
   destroy(){image=null;birds?.destroy();}};
 }
 return Object.freeze({create,flow});
});
