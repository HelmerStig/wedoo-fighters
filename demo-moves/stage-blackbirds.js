(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StageBlackbirds=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function hash(seed){let n=Math.imul(seed^0x45d9f3b,0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;}
 function flock(time,seed=9253){
  return Array.from({length:10},(_,i)=>{
   const front=i>=7,id=seed+i*137,depth=front?1:.8+hash(id+1)*.12;
   const scale=front?1.25+hash(id+2)*.65:.42+hash(id+2)*.48;
   const speed=(front?75:35)*2.7+hash(id+3)*(front?65:45)*2.7,span=2750;
   const distance=Math.max(0,time)*speed/1000+hash(id+4)*span,cycle=Math.floor(distance/span),phase=distance%span;
   const right=hash(id+cycle*739+5)>.5;
   const baseY=(front?320:70)+hash(id+cycle*239+6)*(front?360:340);
   return {id:i,front,scale,depth,speed,right,x:right?-100+phase:2650-phase,
     y:baseY+Math.sin(time/1450+id)*10+Math.sin(time/3900+id*.7)*8,
     flap:Math.floor(time/(105+hash(id+7)*65)+i)%4};
  });
 }
 function sprite(ctx,image,bird,time,camera,groundImage){
  const onGround=bird.state==='ground';
  const frame=onGround?Math.min(146,Math.floor(bird.groundElapsed*24/1000))%49:Math.floor(time/1000*77+bird.id*7)%49;
  ctx.save();ctx.translate(Math.round(bird.x-camera*bird.depth),Math.round(bird.y));
  // Lo spritesheet originale guarda a sinistra: riflesso solo per il volo a destra.
  const scale=bird.scale*.2*(bird.groundScale??1);ctx.scale(bird.right?-scale:scale,scale);
  ctx.drawImage(onGround?groundImage:image,frame%7*128,Math.floor(frame/7)*128,128,128,-64,-(bird.anchorY??64),128,128);
  ctx.restore();
 }
 const GROUND_FPS=24,GROUND_LOOPS=3,GROUND_DURATION=49/GROUND_FPS*1000*GROUND_LOOPS;
 function create(image,seed=Math.floor(Math.random()*1000000),groundImage=null){
  let disposed=false,last=0;
  const states=flock(0,seed).filter(b=>b.front).map((b,i)=>({...b,state:'flying',cruiseY:b.y,nextLanding:8000+i*9000+hash(seed+i)*5000,turns:0,anchorY:64,groundScale:1}));
  function begin(b,state,time){b.state=state;b.started=time;b.fromX=b.x;b.fromY=b.y;}
  function update(time){
   if(time<last)return;
   while(last<time){
    let dt=Math.min(50,time-last);
    for(const b of states){
     const end=b.state==='ground'?b.started+GROUND_DURATION:(b.state==='landing'||b.state==='takeoff')?b.started+2200:Infinity;
     if(end>last+1e-7)dt=Math.min(dt,end-last);
    }
    last+=dt;
    for(const b of states){
     if(b.state==='flying'){
      b.x+=(b.right?1:-1)*b.speed*dt/1000;
      b.y=b.cruiseY+Math.sin(last/1450+b.id)*10;
      if(b.x>2650||b.x< -100){b.x=b.right?-100:2650;b.turns++;}
      if(groundImage&&last>=b.nextLanding&&b.x>100&&b.x<2450){
       const left=b.x<1275;const min=left?220:1750,max=left?850:2340;
       b.targetX=Math.max(min,Math.min(max,b.x+(b.right?100:-100)));
       b.groundY=970+hash(seed+b.id+b.turns)*30;begin(b,'landing',last);
      }
     }else if(b.state==='landing'){
      const p=Math.min(1,(last-b.started)/2200),smooth=p*p*(3-2*p);
      b.x=b.fromX+(b.targetX-b.fromX)*smooth;b.y=b.fromY+(b.groundY-b.fromY)*smooth;b.anchorY=64+40*smooth;b.groundScale=1+1.1*smooth;
      if(p===1){begin(b,'ground',last);b.groundElapsed=0;}
     }else if(b.state==='ground'){
      b.groundElapsed=last-b.started;
      if(b.groundElapsed>=GROUND_DURATION)begin(b,'takeoff',last);
     }else if(b.state==='takeoff'){
      const p=Math.min(1,(last-b.started)/2200),smooth=p*p*(3-2*p);
      b.x=b.fromX+(b.right?1:-1)*b.speed*(last-b.started)/1000;
      b.y=b.fromY+(b.cruiseY-b.fromY)*smooth;b.anchorY=104-40*smooth;b.groundScale=2.1-1.1*smooth;
      if(p===1){begin(b,'flying',last);b.nextLanding=last+22000+hash(seed+b.id+b.turns)*18000;}
     }
    }
   }
  }
  function render(ctx,time,camera,front){
   if(disposed||!image)return;update(time);
   ctx.save();ctx.imageSmoothingEnabled=false;
   const birds=front?states:flock(time,seed).filter(b=>!b.front);
   for(const bird of birds)sprite(ctx,image,bird,time,camera,groundImage);
   ctx.restore();
  }
  return {render,destroy(){disposed=true;image=null;groundImage=null;},snapshot(){return states.map(b=>({...b}));}};
 }
 return Object.freeze({create,flock,GROUND_DURATION,GROUND_FPS,GROUND_LOOPS});
});
