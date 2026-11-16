(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StageWindStorm=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function hash(n){
    let seed=n+137;
    seed=Math.imul(seed^(seed>>>16),0x45d9f3b);
    seed=Math.imul(seed^(seed>>>16),0x45d9f3b);
    return ((seed^(seed>>>16))>>>0)/4294967296;
  }
  const wrap=(n,span)=>((n%span)+span)%span;
  // Un evento per fascia, con intervalli irregolari di circa 6-18 secondi.
  const strikeAt=id=>id*12000+2500+hash(id)*6000;
  const thunderAt=id=>strikeAt(id)+500+hash(id+71)*1100;
  function latest(elapsed,at){
    let id=Math.floor((elapsed-2500)/12000);
    if(id>=0&&at(id)>elapsed)id--;
    return {id,at:id>=0?at(id):-Infinity};
  }
  function lightningState(elapsed){
    const event=latest(elapsed,strikeAt),age=elapsed-event.at;
    const pulse=(t,decay)=>t>=0?Math.min(1,t/25)*Math.exp(-t/decay):0;
    return {...event,flash:event.id<0||age>850?0:Math.min(1,pulse(age,145)+pulse(age-185,110)*.38)};
  }
  const thunderState=elapsed=>latest(elapsed,thunderAt);
  const smooth=value=>{const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);};
  function bloomWeight(elapsed){
    const event=latest(elapsed,strikeAt),age=elapsed-event.at;
    if(event.id<0||age<0||age>=1400)return 0;
    return smooth(age/180)*(1-smooth((age-280)/1120));
  }
  function leaves(width,height,elapsed,strength=null){
    const level=strength===null?null:Math.max(0,Math.min(1,strength));
    const gust=(.35+.65*(.5+.5*Math.sin(elapsed/3100)))*(level===null?1:.25+level*.95);
    return Array.from({length:level===null?72:Math.round(12+level*108)},(_,i)=>{
      const depth=hash(i+200),speed=.18+depth*.18;
      const travel=elapsed*speed+260*Math.sin(elapsed/2400);
      const lift=Math.abs(Math.sin(elapsed/(550+hash(i+34)*550)+i))*(35+hash(i+57)*245)*gust;
      return {x:Math.round((wrap(width+120-hash(i)*width-travel,width+240)-120)/2)*2,
        y:Math.round((height*(.87+hash(i+8)*.10)-lift)/2)*2,
        size:depth>.7?3:depth>.25?2:1,front:depth>.55,
        alpha:.5+depth*.45,turn:Math.floor(elapsed/(90+hash(i+3)*90)+i)%4,
        color:['#b65e2f','#cf9b48','#8a6c37','#a43d28'][i%4]};
    });
  }
  function renderLeaves(ctx,stage,elapsed,camera,front,strength=null){
    ctx.save();ctx.filter='none';
    for(const leaf of leaves(stage.width,stage.height,elapsed,strength)){
      if(leaf.front!==front)continue;
      const x=leaf.x-camera,y=leaf.y,s=leaf.size;
      ctx.globalAlpha=leaf.alpha;ctx.fillStyle=leaf.color;
      ctx.fillRect(x,y,(leaf.turn%2?3:7)*s,(leaf.turn%2?6:3)*s);
      ctx.fillRect(x+2*s,y-s,3*s,2*s);
      ctx.fillStyle='#e4b66a';ctx.fillRect(x+2*s,y+s,2*s,s);
      ctx.fillStyle='#654025';ctx.fillRect(x-s,y+2*s,3*s,s);
    }
    ctx.restore();
  }
  function renderFlash(ctx,width,height,elapsed){
    const flash=lightningState(elapsed).flash;
    if(flash<=0)return;
    ctx.save();ctx.filter='none';ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=flash*.9;ctx.fillStyle='#eef3ff';ctx.fillRect(0,0,width,height);ctx.restore();
  }
  return Object.freeze({strikeAt,lightningState,thunderState,bloomWeight,leaves,renderLeaves,renderFlash});
});
