(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PalazzoEffects=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function ripple(y,time){return Math.round(Math.sin(y*.15-time/380)*(4+y/22)+Math.sin(y*.31+time/510)*2);}
 function steam(time){
  const result=[];
  for(let vent=0;vent<2;vent++){
   const clock=((time+vent*9000)%22000+22000)%22000;
   if(clock>10500)continue;
   for(let i=0;i<12;i++){
    const age=clock-i*450,life=6000;if(age<0||age>life)continue;
    const p=age/life;
    result.push({x:Math.round((vent?1640:580)-p*42+Math.sin(p*5+i)*7),y:Math.round((vent?988:1020)-p*160),rx:14+p*45,ry:7+p*22,alpha:Math.sin(p*Math.PI)*.24,color:vent?'#cfe9f2':'#e3c7e3'});
   }
  }
  return result;
 }
 function create(image){
  const enabled={reflections:true,steam:true};
  function render(ctx,time,camera){
   if(!image)return;
   const t=Math.floor(time/1000*12)*1000/12;
   ctx.save();ctx.imageSmoothingEnabled=false;
   if(enabled.reflections){
    ctx.globalAlpha=1;
    for(let y=0;y<195;y+=3){const h=Math.min(3,195-y);ctx.drawImage(image,0,y,2550,h,ripple(y,t)-camera,885+y,2550,h);}
   }
   if(enabled.steam){
    for(const p of steam(t)){
     ctx.fillStyle=p.color;ctx.globalAlpha=p.alpha;
     for(let y=-Math.ceil(p.ry);y<=p.ry;y+=3){
      const width=Math.round(p.rx*Math.sqrt(Math.max(0,1-(y/p.ry)**2))/2)*2;
      if(width>0)ctx.fillRect(Math.round((p.x-width-camera)/2)*2,Math.round((p.y+y)/2)*2,width*2,3);
     }
    }
   }
   ctx.restore();
  }
  return {render,setEffect(key,value){if(Object.hasOwn(enabled,key))enabled[key]=Boolean(value);},destroy(){image=null;}};
 }
 return Object.freeze({create,ripple,steam});
});
