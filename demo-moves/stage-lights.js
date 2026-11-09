(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StageLights=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function hash(seed){let n=Math.imul(seed^0x45d9f3b,0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;}
  function level(point,elapsed){
    const lamp=point.kind==='lamp',period=(lamp?6500:10500)+hash(point.seed)*6000;
    const clock=Math.max(0,elapsed)+hash(point.seed+31)*period,cycle=Math.floor(clock/period),local=clock%period;
    const duration=650+hash(point.seed+cycle*17)*750;
    if(local>=duration)return 1;
    const step=lamp?160:220,index=Math.floor(local/step),phase=(local%step)/step;
    const at=i=>{if(i<0)return 1;const n=hash(point.seed+cycle*71+i*53);return n<.45?1:n<.75?.32:.08;};
    const blend=Math.min(1,phase*5),smooth=blend*blend*(3-2*blend);
    return at(index-1)+(at(index)-at(index-1))*smooth;
  }
  function render(context,image,data,elapsed,camera){
    context.save();context.filter='none';
    for(const point of data.points){
      const amount=1-level(point,elapsed);if(amount<.001)continue;
      const [x,y,w,h]=point.rect,[sx,sy,sw,sh]=point.maskRect;
      context.globalAlpha=amount;context.drawImage(image,sx,sy,sw,sh,x-camera,y,w,h);
    }
    context.restore();
  }
  return Object.freeze({level,render});
});
