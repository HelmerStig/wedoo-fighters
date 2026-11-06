const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {cloudPositions,install,dustParticles,shadowProjection}=require('../stage-player.js');
const stages=require('../stages-catalog.js');
const demo=path.resolve(__dirname,'..');

test('Villa Arduino usa le cinque immagini reali nelle dimensioni native e la villa davanti alle nuvole',()=>{
  const stage=stages[0];assert.equal(stage.name,'Villa Arduino');
  assert.equal(stage.layers.length,5);
  for(const layer of stage.layers){
    const png=fs.readFileSync(path.resolve(demo,layer.image));
    assert.equal(png.readUInt32BE(16),layer.width);
    assert.equal(png.readUInt32BE(20),layer.height);
  }
  const main=stage.layers.find(l=>l.id==='foreground');
  assert.equal(stage.width,main.width);assert.equal(stage.height,main.height);
  assert.deepEqual(stage.layers.map(l=>l.zIndex),[0,2,3,4,4]);
  assert.equal(stage.layers.at(-1).id,'foreground');
});

test('il post processing riceve il quadro completo e non modifica la fase delle idle',async()=>{
  const f=fixture(false,true);await f.load();const frames=[];
  f.player.setPostProcess((canvas,time)=>frames.push({canvas,time,actor:f.draws.at(-1)[0]}));
  f.tick(0);f.tick(100);
  assert.equal(frames.at(-1).canvas,f.canvas);assert.equal(frames.at(-1).actor,f.images[6]);
  assert.equal(frames.at(-1).time,100);
  f.canvas.listeners.keydown({key:'Home',preventDefault(){}});assert.equal(frames.at(-1).time,100);
  const length=frames.length;f.player.setPostProcess(null);f.tick(200);assert.equal(frames.length,length);
  f.player.destroy();
});

test('entrambi i piedi restano attaccati alla proiezione in tutti i frame idle, anche dopo riflesso e drag',()=>{
  const data=JSON.parse(fs.readFileSync(path.resolve(demo,'../animation/stage-foot-contacts.json'),'utf8'));
  const crypto=require('node:crypto');
  for(const fighter of stages[0].fighters){
    const item=data.items.find(i=>i.characterId===fighter.characterId);
    const bytes=fs.readFileSync(path.resolve(demo,item.image));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.pngSha256,'Rigenera i contatti dopo aver cambiato lo spritesheet');
    for(const feet of item.frames){
      assert.equal(feet.length,2);
      for(const camera of [0,315,630]){
        const [a,b,c,d,tx,ty]=shadowProjection(fighter,stages[0].shadow,feet,camera);
        for(const foot of feet){
          const u=foot.x-fighter.anchorX,v=foot.y-fighter.anchorY;
          const shadowX=a*u+c*v+tx,shadowY=b*u+d*v+ty;
          const actorX=fighter.x-camera+(fighter.flipX?-1:1)*fighter.scale*u;
          const actorY=fighter.groundY+fighter.scale*v;
          assert.ok(Math.abs(shadowX-actorX)<1e-8,fighter.characterId+' contatto X');
          assert.ok(Math.abs(shadowY-actorY)<1e-8,fighter.characterId+' contatto Y');
        }
      }
    }
  }
});

test('nuvole centrate con abbondaggio nativo, moto verso sinistra e loop senza salti',()=>{
  assert.deepEqual(cloudPositions(2550,5000,0,6),[-1225]);
  assert.ok(cloudPositions(2550,5000,1000,6)[0]<-1225);
  const clouds=stages[0].layers.filter(l=>l.speed);
  assert.ok(clouds[0].speed<clouds[1].speed&&clouds[1].speed<clouds[2].speed);
  for(const layer of clouds){
    assert.deepEqual(cloudPositions(2550,5000,5000/layer.speed*1000,layer.speed),[-1225]);
    for(const time of [0,10000,100000,250000,1000000]){
      const xs=cloudPositions(2550,5000,time,layer.speed);
      assert.ok(xs[0]<=0);assert.ok(xs.at(-1)+5000>=2550);
      for(let i=1;i<xs.length;i++)assert.equal(xs[i]-xs[i-1],5000);
    }
  }
});

function fixture(reduced=false,withFighters=false){
  function node(){return {listeners:{},hidden:false,disabled:false,textContent:'',setAttribute(){},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(k){delete this.listeners[k];}};}
  const images=[],draws=[],transforms=[],fills=[],paint=[],buffers=[],callbacks=new Map();let next=0;
  const document=node(),media=node();document.hidden=false;media.matches=reduced;
  document.createElement=()=>{
    const calls=[];
    const context={clearRect(){},drawImage(...args){calls.push(['draw',...args]);},save(){},restore(){},fillRect(...args){calls.push(['tint',this.globalCompositeOperation,this.fillStyle,...args]);}};
    const canvas={width:0,height:0,getContext:()=>context,calls};buffers.push(canvas);return canvas;
  };
  const env={document,matchMedia:()=>media,Image:class{constructor(){images.push(this);}},requestAnimationFrame:f=>{callbacks.set(++next,f);return next;},cancelAnimationFrame:id=>callbacks.delete(id)};
  const canvas=node(),button=node(),status=node();
  let captured=null;
  canvas.getBoundingClientRect=()=>({width:960});
  canvas.focus=()=>{};
  canvas.classList={add(){},remove(){}};
  canvas.setPointerCapture=id=>{captured=id;};
  canvas.hasPointerCapture=id=>captured===id;
  canvas.releasePointerCapture=()=>{captured=null;};
  canvas.getContext=()=>({clearRect(){paint.push({kind:'clear'});},fillRect(...args){fills.push(args);paint.push({kind:'fill',color:this.fillStyle,alpha:this.globalAlpha,args});},drawImage(...args){draws.push(args);paint.push({kind:'image',image:args[0]});},save(){},restore(){},transform(...args){transforms.push(['project',...args]);},translate(...args){transforms.push(['translate',...args]);},scale(...args){transforms.push(['scale',...args]);}});
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(demo,'catalog.js'),'utf8'),sandbox);
  const contacts=JSON.parse(fs.readFileSync(path.resolve(demo,'../animation/stage-foot-contacts.json'),'utf8'));
  const fighters=withFighters?stages[0].fighters.map(f=>({...f,footContacts:contacts.items.find(i=>i.characterId===f.characterId).frames,animation:sandbox.window.MOVES_CATALOG.characters.find(c=>c.id===f.characterId).animations.find(a=>a.id===f.animationId)})):[];
  const player=install(canvas,button,status,{...stages[0],fighters},env);
  function load(){images.forEach((image,i)=>{
    if(i<5)Object.assign(image,{naturalWidth:stages[0].layers[i].width,naturalHeight:1080});
    else{
      const png=fs.readFileSync(path.resolve(demo,fighters[i-5].animation.image));
      Object.assign(image,{naturalWidth:png.readUInt32BE(16),naturalHeight:png.readUInt32BE(20)});
    }
    image.onload();
  });return player.loaded;}
  function tick(time){const pending=[...callbacks.values()];callbacks.clear();pending.forEach(f=>f(time));}
  return {canvas,button,status,player,images,draws,transforms,fills,paint,buffers,callbacks,document,media,load,tick};
}

test('foschia soltanto dietro villa e personaggi; polvere a terra coerente con la camera',async()=>{
  const f=fixture(false,true);await f.load();
  f.paint.length=0;f.player.setEffects({fog:.4});
  const haze=f.paint.filter(p=>p.kind==='fill');assert.ok(haze.length>0);
  assert.ok(haze.every(p=>p.color==='#dae4ef'&&p.alpha<=.4*.5&&p.args[1]<1080*.7));
  const firstFog=f.paint.indexOf(haze[0]),lastFog=f.paint.indexOf(haze.at(-1));
  assert.ok(firstFog>f.paint.findIndex(p=>p.image===f.images[1]));
  assert.ok(lastFog<f.paint.findIndex(p=>p.image===f.images[3]),'nuvole vicine, villa e personaggi restano davanti alla foschia');
  f.paint.length=0;f.player.setEffects({dust:.45});
  const particles=f.paint.filter(p=>p.kind==='fill');assert.ok(particles.length>0);
  assert.ok(particles.every(p=>p.args[1]>1080*.8&&p.args[2]===p.args[3]&&[2,4,6].includes(p.args[2])));
  assert.ok(f.paint.indexOf(particles[0])>f.paint.findIndex(p=>p.image===f.images[4]));
  assert.ok(f.paint.indexOf(particles.at(-1))<f.paint.findIndex(p=>p.image===f.images[5]));
  f.paint.length=0;f.canvas.listeners.keydown({key:'Home',preventDefault(){}});
  const worldParticles=f.paint.filter(p=>p.kind==='fill');
  for(const particle of particles){
    const x=particle.args[0]+315;
    if(x+particle.args[2]<0||x>1920)continue;
    const same=worldParticles.find(p=>p.args[0]===x&&p.args[1]===particle.args[1]);
    assert.ok(same,'il drag trasla i granelli senza cambiare la fase');
  }
  f.paint.length=0;f.player.setEffects({});assert.equal(f.paint.filter(p=>p.kind==='fill').length,0);
  f.player.destroy();
});

test('polvere deterministica e limitata, animata anche con le nuvole ferme e statica con movimento ridotto',async()=>{
  assert.equal(dustParticles(2550,1080,0,0).length,0);
  const a=dustParticles(2550,1080,0,.45),b=dustParticles(2550,1080,500,.45);
  assert.equal(a.length,160);assert.equal(dustParticles(2550,1080,0,.65).length,160);assert.notDeepEqual(a,b);
  assert.deepEqual(a,dustParticles(2550,1080,0,.45));
  assert.ok(a.every(p=>p.x%2===0&&p.y%2===0&&p.alpha>=0&&p.alpha<=.45*.65));
  const f=fixture();await f.load();f.button.listeners.click();assert.equal(f.callbacks.size,0);
  f.player.setEffects({dust:.45});assert.equal(f.callbacks.size,1);
  f.paint.length=0;f.tick(0);f.tick(100);
  const lastDraw=f.paint.slice(f.paint.map(p=>p.kind).lastIndexOf('clear'));
  assert.ok(lastDraw.some(p=>p.kind==='fill'));
  f.player.setEffects({dust:0});f.tick(200);assert.equal(f.callbacks.size,0);
  f.player.destroy();
  const reduced=fixture(true);await reduced.load();reduced.player.setEffects({dust:.45,fog:.4});
  assert.equal(reduced.callbacks.size,0);assert.ok(reduced.paint.some(p=>p.kind==='fill'));reduced.player.destroy();
});

test('effetti reversibili: colorazione limitata ai pixel dei personaggi, ombre ancorate al mondo e frame invariati',async()=>{
  const f=fixture(false,true);await f.load();f.tick(0);f.tick(100);
  const frame=f.draws.at(-2).slice(1,5),position=f.transforms.slice(-4)[0];
  f.player.setEffects({shadows:.55,color:.35});
  assert.equal(f.fills.length,12,'tre piccole bande per ciascun piede');
  assert.ok(f.fills[0][0]<675-315,'contatto sotto il piede sinistro');
  assert.equal(f.buffers.length,4,'sagoma e colore hanno buffer separati');
  const colored=f.draws.at(-2)[0];
  assert.equal(colored.calls.at(-1)[1],'source-atop','colore applicato soltanto all’alpha del frame');
  const cached=colored.calls.length;
  f.player.setEffects({shadows:.55,color:.35});assert.equal(colored.calls.length,cached,'riusa il frame colorato');
  assert.deepEqual(f.transforms.slice(-4)[0],position);
  f.player.setEffects({shadows:0,color:0});
  assert.equal(f.draws.at(-2)[0],f.images[5]);assert.deepEqual(f.draws.at(-2).slice(1,5),frame);
  f.player.destroy();assert.ok(f.buffers.every(b=>b.width===0));
});

test('la sagoma usa lo stesso frame della idle, segue la camera e mantiene una luce comune dopo il riflesso',async()=>{
  const f=fixture(false,true);await f.load();f.player.setEffects({shadows:.55});
  const masks=f.buffers.slice();assert.equal(masks.length,2);
  for(const mask of masks){
    assert.equal(mask.calls.at(-1)[1],'source-in','la maschera conserva l’alpha del personaggio');
    assert.deepEqual(mask.calls[0].slice(2,6),[0,0,512,512]);
  }
  const projects=f.transforms.filter(t=>t[0]==='project');
  assert.ok(projects[0][1]>0);assert.ok(projects[1][1]<0);
  assert.equal(projects[0][3],projects[1][3],'stessa direzione orizzontale della luce');
  assert.equal(projects[0][4],projects[1][4],'stessa profondita sul pavimento');
  assert.ok(projects[0][3]<0&&projects[0][4]<0,'testa proiettata verso destra e in basso');
  f.tick(0);f.tick(100);
  const actorFrame=f.draws.at(-2).slice(1,5);
  assert.deepEqual(masks[0].calls.filter(c=>c[0]==='draw').at(-1).slice(2,6),actorFrame);
  const cached=masks[0].calls.length;
  f.player.setEffects({shadows:1});assert.equal(masks[0].calls.length,cached,'intensita non ricrea la sagoma');
  const before=f.transforms.filter(t=>t[0]==='project').at(-2)[5];
  f.canvas.listeners.keydown({key:'End',preventDefault(){}});
  assert.ok(Math.abs(f.transforms.filter(t=>t[0]==='project').at(-2)[5]-(before-315))<1e-8);
  assert.equal(masks[0].calls.length,cached,'drag non altera il frame o la sagoma');
  f.button.listeners.click();f.tick(200);f.tick(300);
  assert.ok(masks[0].calls.length>cached,'ombra e idle continuano con nuvole ferme');
  f.player.destroy();assert.ok(masks.every(mask=>mask.width===0));
});

test('Alberto e Marsan sono in idle a 24 fps sopra la villa; solo Marsan è riflesso',async()=>{
  const f=fixture(false,true);await f.load();
  assert.equal(f.images.length,7);
  assert.equal(f.draws.at(-2)[0],f.images[5]);assert.equal(f.draws.at(-1)[0],f.images[6]);
  assert.deepEqual(f.transforms.slice(-4),[
    ['translate',675-315,1025],['scale',4/3,4/3],
    ['translate',1890-315,1025],['scale',-4/3,4/3]
  ]);
  assert.equal(f.draws.at(-1).length,9,'copia il frame intero con i suoi margini');
  f.tick(0);f.tick(100);
  assert.deepEqual(f.draws.at(-2).slice(1,5),[1024,0,512,512],'frame 2 dopo 100 ms');
  const cloudX=f.draws.filter(d=>d[0]===f.images[1]).at(-1)[1];
  f.button.listeners.click();f.tick(200);f.tick(300);
  assert.equal(f.draws.filter(d=>d[0]===f.images[1]).at(-1)[1],cloudX,'pausa solo le nuvole');
  assert.deepEqual(f.draws.at(-2).slice(1,5),[2048,0,512,512],'idle continua durante la pausa delle nuvole');
  f.canvas.listeners.keydown({key:'End',preventDefault(){}});
  assert.deepEqual(f.transforms.slice(-4)[0],['translate',675-630,1025]);
  assert.deepEqual(f.draws.at(-2).slice(1,5),[2048,0,512,512],'la camera non cambia il frame idle');
  f.player.destroy();assert.equal(f.callbacks.size,0);
});

test('le idle rispettano il movimento ridotto e gli errori degli spritesheet',async()=>{
  const f=fixture(true,true);await f.load();assert.equal(f.callbacks.size,0);f.player.destroy();
  const broken=fixture(false,true);broken.images[5].naturalWidth=1;broken.images[5].naturalHeight=1;
  broken.images[5].onload();await broken.player.loaded;
  assert.match(broken.status.textContent,/Spritesheet non valido: alberto/);broken.player.destroy();
});

test('la finestra 16:9 parte centrata sul mondo e pausa, ripresa e scheda nascosta non accumulano salti',async()=>{
  const f=fixture();await f.load();
  assert.equal(f.canvas.width,1920);assert.equal(f.canvas.height,1080);
  assert.equal(f.draws.at(-1)[0],f.images[4]);
  assert.deepEqual(f.draws.at(-1).slice(1),[-315,0],'villa alla scala nativa, vista centrata');
  f.tick(0);f.tick(100);
  assert.ok(f.draws.filter(d=>d[0]===f.images[1]).at(-1)[1]<-1225);
  f.button.listeners.click();assert.equal(f.callbacks.size,0);
  f.button.listeners.click();f.tick(5000);
  const x=f.draws.filter(d=>d[0]===f.images[1]).at(-1)[1];
  f.document.hidden=true;f.document.listeners.visibilitychange();assert.equal(f.callbacks.size,0);
  f.document.hidden=false;f.document.listeners.visibilitychange();f.tick(50000);
  assert.equal(f.draws.filter(d=>d[0]===f.images[1]).at(-1)[1],x);
  f.player.destroy();assert.equal(f.callbacks.size,0);
});

test('drag scalato, limiti della camera e annullamento non influenzano il tempo delle nuvole',async()=>{
  const f=fixture(),reference=fixture();await Promise.all([f.load(),reference.load()]);
  const down=(x,id=1)=>f.canvas.listeners.pointerdown({pointerId:id,clientX:x,button:0,isPrimary:true});
  const move=(x,id=1)=>f.canvas.listeners.pointermove({pointerId:id,clientX:x});
  const up=()=>f.canvas.listeners.pointerup({pointerId:1});
  const villaX=()=>f.draws.filter(d=>d[0]===f.images[4]).at(-1)[1];
  down(400);move(500);
  assert.equal(villaX(),-115,'100 px CSS corrispondono a 200 px del mondo');
  move(5000);assert.equal(villaX(),0,'limite sinistro');
  move(-5000);assert.equal(villaX(),-630,'limite destro');
  f.canvas.listeners.pointercancel({pointerId:1});
  move(400);assert.equal(villaX(),-630,'il drag annullato non muove più la camera');
  down(400);move(500,2);assert.equal(villaX(),-630,'ignora altri puntatori');up();
  for(const time of [0,100,200]){f.tick(time);reference.tick(time);}
  for(const i of [1,2,3]){
    const cloud=f.draws.filter(d=>d[0]===f.images[i]).at(-1)[1];
    const refCloud=reference.draws.filter(d=>d[0]===reference.images[i]).at(-1)[1];
    const refVilla=reference.draws.filter(d=>d[0]===reference.images[4]).at(-1)[1];
    assert.ok(Math.abs((cloud-villaX())-(refCloud-refVilla))<1e-8,'stessa fase delle nuvole dopo il drag');
  }
  f.button.listeners.click();down(400);move(500);up();
  assert.equal(f.callbacks.size,0,'drag disponibile anche con nuvole ferme');
  f.canvas.listeners.keydown({key:'Home',preventDefault(){}});assert.equal(villaX(),0);
  f.canvas.listeners.keydown({key:'End',preventDefault(){}});assert.equal(villaX(),-630);
  f.player.destroy();reference.player.destroy();
  assert.equal(f.canvas.listeners.pointerdown,undefined);
});

test('movimento ridotto conserva lo stage statico; gli errori di immagini sono visibili',async()=>{
  const f=fixture(true);await f.load();assert.equal(f.callbacks.size,0);assert.equal(f.button.disabled,false);
  f.button.listeners.click();assert.equal(f.callbacks.size,1);f.player.destroy();
  const broken=fixture();broken.images[0].onerror();await broken.player.loaded;
  assert.match(broken.status.textContent,/Impossibile caricare/);assert.equal(broken.button.disabled,true);broken.player.destroy();
});

test('il server espone soltanto le cinque immagini dello stage e la nuova pagina',async t=>{
  const {createDemoServer}=await import('./serve.mjs');const server=createDemoServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port;
  for(const route of ['/demo-moves/stages.html',...stages[0].layers.map(l=>'/'+l.image.replace('../',''))]){
    const response=await fetch(base+route,{method:'HEAD'});assert.equal(response.status,200,route);
  }
  for(const route of ['/original-backgrounds/stages-1.png','/original-backgrounds/villa-arduino/nuvole-parallax-5000x1080.zip','/original-backgrounds/villa-arduino/anteprima-su-cielo.png'])assert.equal((await fetch(base+route)).status,403,route);
});
