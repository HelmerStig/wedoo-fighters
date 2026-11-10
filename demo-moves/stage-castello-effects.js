(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CastelloEffects=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const flags=[
    {rect:[1122,594,38,112],polygon:[[3,3],[31,54],[22,110],[2,96]],kind:'italian'},
    {rect:[1177,594,42,112],polygon:[[3,3],[39,61],[25,110],[8,95]],kind:'european'}
  ];
  const fountains=[{rect:[215,872,240,57],jets:[[319,918,46],[373,918,34]]},{rect:[620,869,180,60],jets:[[696,917,37],[750,917,51]]}];
  function inside(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [xi,yi]=points[i],[xj,yj]=points[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
  }return hit;}
  function flagPixel(r,g,b,kind){return kind==='italian'?(g>r*1.12&&g>b*1.1)||(r>g*1.4&&r>b*1.3)||(r>170&&g>160&&b>150):(b>r*1.3&&b>g*1.1)||(r>150&&g>130&&b<100&&Math.abs(r-g)<50);}
  function phase(time,offset=0){return Math.round(Math.sin(time/720+offset)*2);}
  function cloudCover(x,y,time){
    const span=3750,travel=((time*.018)%span+span)%span;
    let cover=0;
    for(const offset of [-span,0,span]){
      const center=1950-travel+offset;
      for(const [dx,dy,rx,ry] of [[0,730,650,430],[-370,850,470,350],[370,650,430,330]]){
        const d=Math.sqrt(((x-center-dx)/rx)**2+((y-dy)/ry)**2);
        cover=Math.max(cover,Math.max(0,Math.min(1,(1-d)/.38)));
      }
    }
    return cover*.32;
  }
  function leaves(time){
    const cycle=24000,local=((time%cycle)+cycle)%cycle;
    return [0,650,1400,2200,3100,4200,5400,6700,8100,9600].flatMap((start,i)=>{
      const age=local-start,life=7500;
      if(age<0||age>=life)return [];
      const p=age/life,size=[1,2,1,3,1,2,1,2,3,1][i];
      return [{x:Math.round((2450-(i*347)%1500-age*(.10+(i%3)*.025))/2)*2,
        y:Math.round((1022-(i%4)*10-Math.abs(Math.sin(p*Math.PI*3+i))*(16+size*4))/2)*2,
        size,alpha:Math.min(1,age/500,(life-age)/700)*.95,turn:Math.floor(age/130+i)%4,color:['#a46f31','#bd873c','#8c6935'][i%3]}];
    });
  }

  function create(image,env=globalThis,foreground=null){
    let shadowCanvas=null,shadowContext=null,shadowFrame=-1;
    const enabled={cloudShadows:true,leaves:true};
    if(foreground&&env.document){
      shadowCanvas=env.document.createElement('canvas');shadowCanvas.width=2550;shadowCanvas.height=1080;
      shadowContext=shadowCanvas.getContext('2d');
    }
    function groundEffects(context,time,camera){
      if(enabled.cloudShadows&&shadowContext){
        const frame=Math.floor(time/1000*12);
        if(frame!==shadowFrame){
          shadowContext.clearRect(0,0,2550,1080);shadowContext.fillStyle='#27304b';
          for(let y=240;y<1080;y+=12)for(let x=0;x<2550;x+=12){
            const alpha=cloudCover(x+6,y+6,frame*1000/12);
            if(alpha<=0)continue;
            shadowContext.globalAlpha=alpha;shadowContext.fillRect(x,y,12,12);
          }
          shadowContext.globalAlpha=1;shadowContext.globalCompositeOperation='destination-in';
          shadowContext.drawImage(foreground,0,0);shadowContext.globalCompositeOperation='source-over';shadowFrame=frame;
        }
        context.drawImage(shadowCanvas,-camera,0);
      }
      if(enabled.leaves){
        context.save();
        for(const leaf of leaves(time)){
          const x=leaf.x-camera,y=leaf.y;
          context.globalAlpha=leaf.alpha;context.fillStyle=leaf.color;
          const size=leaf.size;
          context.fillRect(x,y,(leaf.turn%2?4:8)*size,(leaf.turn%2?7:4)*size);
          context.fillStyle='#d2ac65';context.fillRect(x+2*size,y+size,2*size,2*size);
          context.fillStyle='#634823';context.fillRect(x-2*size,y+3*size,3*size,size);
        }
        context.restore();
      }
    }
    function render(context,time,camera){
      if(!image)return;
      const frame=Math.floor(time/1000*12),t=frame*1000/12;
      const tile=((frame%24)+24)%24;
      flags.forEach((flag,index)=>{
        const [x,y,w,h]=flag.rect;
        context.drawImage(image,tile*80+(index?38:0),0,w,h,x-camera,y,w,h);
      });
      context.save();
      for(let f=0;f<fountains.length;f++){
        const fountain=fountains[f];
        fountain.jets.forEach(([x,base,height],j)=>{
          for(let k=0;k<8;k++){
            const p=((t/1150+k/8+j*.13+f*.21)%1+1)%1;
            const y=Math.round((base-Math.sin(p*Math.PI)*height)/2)*2;
            const dx=Math.round((Math.sin(p*Math.PI*2+j)*3+phase(t,k)) /2)*2;
            context.globalAlpha=.65+.35*Math.sin(p*Math.PI);context.fillStyle=k%2?'#efffff':'#9de5ff';
            context.fillRect(x+dx-camera,y,4,k%3===0?8:4);
          }
        });
        // Scintillii bassi, interamente dentro la vasca esistente.
        for(let k=0;k<9;k++){
          context.globalAlpha=.45+.45*(.5+.5*Math.sin(t/210+k*2));context.fillStyle='#d5f7ff';
          const x=fountain.rect[0]+18+(k*23+frame*2)%(fountain.rect[2]-36);
          context.fillRect(Math.round(x/2)*2-camera,fountain.rect[1]+49+(k%2)*2,8,3);
        }
      }
      context.restore();
      groundEffects(context,time,camera);
    }
    return {render,setEffect(key,value){if(Object.hasOwn(enabled,key))enabled[key]=Boolean(value);},destroy(){image=null;if(shadowCanvas){shadowCanvas.width=0;shadowCanvas.height=0;}shadowCanvas=null;shadowContext=null;foreground=null;}};
  }
  return Object.freeze({create,flags,fountains,inside,flagPixel,phase,cloudCover,leaves});
});
