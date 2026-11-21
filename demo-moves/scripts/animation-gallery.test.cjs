const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const core=require('../player-core.js');

function fixture({reducedMotion=false,lazy=false,byMove=false,timed=false,crt=false,multiple=false}={}){
  const images=[],callbacks=new Map();let sequence=0,observer;
  function element(){return {listeners:{},attributes:{},dataset:{},hidden:false,disabled:false,value:'',checked:true,textContent:'',
    classList:{values:new Set(),toggle(name,on){on?this.values.add(name):this.values.delete(name);},add(name){this.values.add(name);}},
    addEventListener(type,fn){this.listeners[type]=fn;},removeEventListener(type){delete this.listeners[type];},
    setAttribute(k,v){this.attributes[k]=v;},scrollIntoView(){this.scrolled=true;},fire(type,extra={}){this.listeners[type]?.({target:this,preventDefault(){},...extra});}
  };}
  function card(){
    const result=element(),nodes={};
    for(const key of ['canvas','.stage','[data-role="timeline"]','[data-action="play"]','[data-action="step"]','[data-role="speed"]','[data-role="loop"]','.playing-dot','.frame-counter','.stage-loading','.stage-error','[data-role="fps"]'])nodes[key]=element();
    nodes['[data-role="speed"]'].value='1';
    nodes['.stage-error'].hidden=true;
    const canvas=nodes.canvas;canvas.width=512;canvas.height=512;canvas.draws=[];
    canvas.getContext=()=>({clearRect(){},drawImage(...args){canvas.draws.push(args);}});
    const swatches=['dark','light','checker'].map(background=>{const e=element();e.dataset.background=background;return e;});
    result.querySelector=selector=>nodes[selector];result.querySelectorAll=()=>swatches;result.nodes=nodes;result.swatches=swatches;return result;
  }
  const cards=[card(),card()],playAll=element(),pauseAll=element(),container=element(),crtToggle=element(),crtCalls=[];
  container.querySelectorAll=()=>cards;container.querySelector=s=>s.includes('crt-toggle')?crtToggle:s.includes('play-all')?playAll:pauseAll;
  const document=element();document.hidden=false;
  const media=element();media.matches=reducedMotion;
  const sandbox={MovesCore:core,document,matchMedia:()=>media,
    Image:class {constructor(){this.naturalWidth=512*60;this.naturalHeight=512;images.push(this);}},
    requestAnimationFrame(fn){const id=++sequence;callbacks.set(id,fn);return id;},cancelAnimationFrame(id){callbacks.delete(id);}
  };
  if(crt)sandbox.MovesSpriteCrt={create(){return {decorate(stage,canvas,enabled){crtCalls.push(['decorate',enabled]);},render(canvas,time){crtCalls.push(['render',time]);},destroy(){crtCalls.push(['destroy']);}};}};
  if(lazy)sandbox.IntersectionObserver=class {constructor(fn){this.callback=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../animation-gallery.js'),'utf8'),sandbox);
  const character={id:'oscar',name:'Oscar',animations:['idle','jump'].map((id,i)=>({id,name:id==='idle'?'Idle':'Jump',image:id+'.png',frameWidth:512,frameHeight:512,playbackFps:i?24:18,frames:Array.from({length:60},(_,f)=>[f*512,0,512,512])}))};
  if(multiple){const a=character.animations[1];a.images=['jump.png','recovery.png'];a.imageLabels=['salto','rialzata'];a.frameImageIndices=a.frames.map((_,i)=>i<30?0:1);a.frames=a.frames.map((_,i)=>[(i%30)*512,0,512,512]);}
  if(timed==='jump')character.animations.forEach((a,i)=>{a.apexFrame=i?40:10;a.apexMs=500;a.durationMs=1000;a.frameDurations=a.frames.map((_,f)=>f<a.apexFrame?500/a.apexFrame:500/(a.frames.length-a.apexFrame));});
  else if(timed==='hurt')character.animations.forEach(a=>{a.durationMs=500;a.frameDurations=a.frames.map(()=>500/a.frames.length);});
  else if(timed) character.animations.forEach((a,i)=>{a.impactFrame=i?40:10;a.impactMs=250;a.durationMs=500;a.frameDurations=a.frames.map((_,f)=>f<a.impactFrame?250/a.impactFrame:250/(a.frames.length-a.impactFrame));});
  if(byMove) character.animations.forEach((a,i)=>{a.characterId=i?'luana':'marco-balpo';a.characterName=i?'Luana':'Marco Balpo';});
  const gallery=sandbox.MovesGallery.install(container,character,byMove?{title:'Pugno leggero - Personaggi',description:'Confronta i personaggi.'}:{});
  return {cards,images,document,media,gallery,container,playAll,pauseAll,callbacks,crtToggle,crtCalls,
    load(){images.forEach(image=>image.onload());},
    step(time){const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn(time));},
    observe(index,isIntersecting){observer.callback([{target:cards[index],isIntersecting}]);},
    frame(index){return Number(cards[index].nodes['[data-role="timeline"]'].value);}
  };
}

test('tutte le mosse si animano insieme alle rispettive velocitÃ  e i controlli sono indipendenti',()=>{
  const f=fixture();assert.equal(f.images.length,2);f.load();
  assert.equal(f.callbacks.size,1,'un solo ciclo di rendering per la galleria');
  f.step(0);f.step(250);f.step(500);
  assert.equal(f.frame(0),9);assert.equal(f.frame(1),12);
  f.cards[0].nodes['[data-action="play"]'].fire('click');
  f.step(750);assert.equal(f.frame(0),9);assert.equal(f.frame(1),18);
  f.cards[0].nodes['[data-action="step"]'].fire('click');assert.equal(f.frame(0),10);assert.equal(f.frame(1),18);
  f.cards[1].nodes['[data-role="speed"]'].value='0.5';f.cards[1].nodes['[data-role="speed"]'].fire('change');
  assert.equal(f.cards[1].nodes['[data-role="fps"]'].textContent,'12 fps');
  f.step(1000);f.step(1250);assert.equal(f.frame(1),21);
  f.cards[0].swatches[1].fire('click');assert.equal(f.cards[0].nodes['.stage'].dataset.background,'light');assert.equal(f.cards[1].nodes['.stage'].dataset.background,undefined);
});

test('le reazioni con durata uniforme mostrano il tempo senza impatto NaN',()=>{
  const f=fixture({timed:'hurt'});f.load();
  assert.match(f.container.innerHTML,/0,5 s/);
  assert.doesNotMatch(f.container.innerHTML,/NaN|impatto/);
  f.gallery.destroy();
});

test('sequenza su due fogli: attende entrambi, cambia immagine nel raccordo, consente seek e loop',()=>{
  const f=fixture({multiple:true,crt:true});assert.equal(f.images.length,3);
  f.images[1].naturalWidth=f.images[2].naturalWidth=512*30;
  f.images[0].onload();f.images[1].onload();
  const canvas=f.cards[1].nodes.canvas;assert.equal(canvas.draws.length,0);
  f.images[2].onload();assert.equal(canvas.draws.at(-1)[0],f.images[1]);
  const slider=f.cards[1].nodes['[data-role="timeline"]'];slider.value='30';slider.fire('input');
  assert.equal(canvas.draws.at(-1)[0],f.images[2]);
  slider.value='59';slider.fire('input');f.cards[1].nodes['[data-action="play"]'].fire('click');f.step(0);f.step(100);
  assert.equal(canvas.draws.at(-1)[0],f.images[1]);
  assert.match(f.container.innerHTML,/PNG salto/);assert.match(f.container.innerHTML,/PNG rialzata/);
  const late=f.images[2].onload;f.gallery.destroy();const count=canvas.draws.length;late();assert.equal(canvas.draws.length,count);
});

test('errore nel secondo foglio ferma soltanto quel player e non avvia una sequenza parziale',()=>{
  const f=fixture({multiple:true});f.images[0].onload();f.images[2].onerror();f.images[1].onload();
  assert.equal(f.cards[1].nodes['.stage-error'].hidden,false);
  assert.equal(f.cards[1].nodes.canvas.draws.length,0);assert.ok(f.cards[0].nodes.canvas.draws.length>0);
  f.gallery.destroy();
});

test('pausa globale durante il caricamento e preferenza movimento ridotto non vengono sovrascritte',()=>{
  const f=fixture();f.pauseAll.fire('click');f.load();assert.equal(f.callbacks.size,0);
  f.playAll.fire('click');assert.equal(f.callbacks.size,1);f.step(0);f.step(250);assert.ok(f.frame(0)>0&&f.frame(1)>0);
  f.pauseAll.fire('click');assert.equal(f.callbacks.size,0);
  const reduced=fixture({reducedMotion:true});reduced.load();assert.equal(reduced.callbacks.size,0);
  reduced.cards[1].nodes.canvas.fire('keydown',{code:'Space'});assert.equal(reduced.callbacks.size,1);
  reduced.step(0);reduced.step(250);assert.equal(reduced.frame(0),0);assert.equal(reduced.frame(1),6);
});

test('caricamento progressivo e tab nascosta fermano il rendering senza recuperare tempo accumulato',()=>{
  const f=fixture({lazy:true});assert.equal(f.images.length,0);
  f.observe(0,true);assert.equal(f.images.length,1);f.images[0].onload();f.step(0);f.step(250);assert.equal(f.frame(0),4);
  f.observe(0,false);assert.equal(f.callbacks.size,0);
  f.observe(1,true);assert.equal(f.images.length,2);f.images[1].onload();f.step(1000);f.step(1250);assert.equal(f.frame(1),6);
  f.document.hidden=true;f.document.fire('visibilitychange');assert.equal(f.callbacks.size,0);
  f.document.hidden=false;f.document.fire('visibilitychange');f.step(5000);assert.equal(f.frame(1),6);
  f.step(5250);assert.equal(f.frame(1),12);
  f.gallery.destroy();assert.equal(f.callbacks.size,0);assert.equal(Object.keys(f.document.listeners).length,0);
});

test('un errore di caricamento resta nella propria scheda; riproduzione singola e tastiera funzionano',()=>{
  const f=fixture();f.images[0].onerror();f.images[1].onload();
  assert.equal(f.cards[0].nodes['.stage-error'].hidden,false);
  assert.equal(f.cards[1].nodes['.stage-error'].hidden,true);
  const timeline=f.cards[1].nodes['[data-role="timeline"]'];timeline.value='58';timeline.fire('input');
  f.cards[1].nodes['[data-role="loop"]'].checked=false;f.cards[1].nodes['[data-action="play"]'].fire('click');
  f.step(0);f.step(250);assert.equal(f.frame(1),59);assert.equal(f.callbacks.size,0);
  assert.equal(f.cards[0].nodes.canvas.draws.length,0);
  f.cards[1].nodes.canvas.fire('keydown',{key:'ArrowLeft'});assert.equal(f.frame(1),58);
  f.cards[1].nodes['[data-action="play"]'].fire('click');f.step(500);f.step(750);assert.equal(f.frame(1),59);
  f.cards[1].nodes['[data-action="play"]'].fire('click');assert.equal(f.frame(1),0);
});

test('la vista per mossa distingue titoli, link e download dei personaggi e conserva i controlli',()=>{
  const f=fixture({byMove:true});
  assert.match(f.container.innerHTML,/Pugno leggero - Personaggi/);
  assert.match(f.container.innerHTML,/personaggio\.html\?id=marco-balpo&amp;anim=idle/);
  assert.match(f.container.innerHTML,/>Marco Balpo<\/a>/);
  assert.match(f.container.innerHTML,/download="luana-jump\.png"/);
  assert.match(f.container.innerHTML,/Jump di Luana/);
  f.load();f.step(0);f.step(250);
  assert.equal(f.frame(0),4);assert.equal(f.frame(1),6);
  f.gallery.destroy();assert.equal(f.callbacks.size,0);
});

test('i pugni restano allineati anche quando la seconda scheda si carica in ritardo',()=>{
  const f=fixture({lazy:true,timed:true});
  f.observe(0,true);f.images[0].onload();f.step(0);f.step(100);
  f.observe(1,true);f.images[1].onload();f.step(100);f.step(250);
  assert.equal(f.frame(0),10);assert.equal(f.frame(1),40);
  f.pauseAll.fire('click');f.step(350);
  assert.equal(f.frame(0),10);assert.equal(f.frame(1),40);
  f.playAll.fire('click');assert.equal(f.frame(0),0);assert.equal(f.frame(1),0);
  f.step(400);f.step(650);assert.equal(f.frame(0),10);assert.equal(f.frame(1),40);
  f.step(900);assert.equal(f.frame(0),0);assert.equal(f.frame(1),0);
});

test('gli apici dei salti restano allineati con caricamento progressivo e nei loop successivi',()=>{
  const f=fixture({lazy:true,timed:'jump'});
  assert.match(f.container.innerHTML,/apice 0,5 s/);
  assert.doesNotMatch(f.container.innerHTML,/impatto/);
  f.observe(0,true);f.images[0].onload();f.step(0);f.step(250);
  f.observe(1,true);f.images[1].onload();f.step(250);f.step(500);
  assert.equal(f.frame(0),10);assert.equal(f.frame(1),40);
  f.step(750);f.step(1000);
  assert.equal(f.frame(0),0);assert.equal(f.frame(1),0);
  f.step(1250);f.step(1500);
  assert.equal(f.frame(0),10);assert.equal(f.frame(1),40);
  f.cards[1].nodes['[data-role="speed"]'].value='0.5';
  f.cards[1].nodes['[data-role="speed"]'].fire('change');
  assert.match(f.cards[1].nodes['[data-role="fps"]'].textContent,/apice 1 s/);
  f.gallery.destroy();
});


test('CRT condiviso attivo per default, toggle ridisegna anche in pausa e pulizia alla chiusura',()=>{
  const f=fixture({crt:true});f.load();f.pauseAll.fire('click');
  assert.equal(f.crtCalls.filter(c=>c[0]==='decorate'&&c[1]).length,2);
  const rendered=f.crtCalls.filter(c=>c[0]==='render').length;
  assert.ok(rendered>=2);
  f.crtToggle.fire('click');
  assert.equal(f.crtToggle.attributes['aria-pressed'],'false');
  assert.equal(f.crtCalls.filter(c=>c[0]==='render').length,rendered);
  assert.equal(f.callbacks.size,0);
  f.crtToggle.fire('click');
  assert.equal(f.crtToggle.attributes['aria-pressed'],'true');
  assert.equal(f.crtCalls.filter(c=>c[0]==='render').length,rendered+2);
  assert.equal(f.callbacks.size,0);
  f.gallery.destroy();assert.equal(f.crtCalls.filter(c=>c[0]==='destroy').length,1);
});
