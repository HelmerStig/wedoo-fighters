const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const actors=require('../stage-background-actors.js'),{install}=require('../stage-player.js');
const stage=require('../stages-catalog.js').find(s=>s.id==='via-somis'),definition=stage.backgroundActors[0];
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../stage-actors-catalog.js'),'utf8'),sandbox);
const animations=sandbox.window.STAGE_ACTORS_CATALOG.tony.animations;

test('Tony saluta fermo, torna indietro nei frame e solo dopo cambia direzione',()=>{
  const c=actors.controller(definition,animations,()=>0),fps=animations.saluto.playbackFps,count=animations.saluto.frames.length;
  let s=c.update(6000);assert.equal(s.phase,'saluto');assert.equal(s.frame,0);assert.equal(s.direction,1);const x=s.x;
  s=c.update(6000+(count-1)*1000/fps+.001);assert.equal(s.frame,count-1);assert.equal(s.x,x);
  s=c.update(6000+count*1000/fps+.001);assert.equal(s.phase,'reverse');assert.equal(s.frame,count-2);assert.equal(s.direction,1);
  s=c.update(6000+(count*2-1)*1000/fps+.001);assert.equal(s.phase,'walk');assert.equal(s.direction,-1);
  const next=c.update(6000+(count*2-1)*1000/fps+100);assert.ok(next.x<x);
});

test('percorso limitato al pavimento, arresto prima dei limiti e fase indipendente dal drag',()=>{
  const c=actors.controller(definition,animations,()=>1);let previous=c.state();
  for(let time=0;time<600000;time+=37){
    const s=c.update(time);assert.ok(s.x>=definition.path.minX&&s.x<=definition.path.maxX);
    assert.ok(s.frame>=0&&s.frame<animations[s.animation].frames.length);
    assert.deepEqual(c.update(time),s,'un ridisegno senza tempo trascorso non avanza la sequenza');
    if(previous.phase!=='walk'&&s.phase!=='walk')assert.equal(s.x,previous.x);
    previous=s;
  }
  assert.throws(()=>actors.controller({...definition,path:{...definition.path,maxX:1700}},animations),/ostacolo/);
});

test('player: carica i due asset di Tony, lo disegna dietro i combattenti e mantiene la posizione al drag',async()=>{
  const images=[],draws=[],transforms=[],callbacks=new Map();let next=0;
  const node=()=>({listeners:{},setAttribute(){},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(){}});
  const canvas=node(),button=node(),status=node(),document=node(),media={matches:false,addEventListener(){},removeEventListener(){}};
  document.hidden=false;canvas.classList={add(){},remove(){}};
  canvas.getContext=()=>({clearRect(){},drawImage(...v){draws.push(v);},fillRect(){},save(){},restore(){},translate(x,y){transforms.push([x,y]);},scale(){}});
  const env={document,Math:{random:()=>0},matchMedia:()=>media,STAGE_ACTORS_CATALOG:sandbox.window.STAGE_ACTORS_CATALOG,StageBackgroundActors:actors,
    Image:class{constructor(){images.push(this);}},requestAnimationFrame(f){callbacks.set(++next,f);return next;},cancelAnimationFrame(id){callbacks.delete(id);}};
  const fighter={characterId:'test',x:675,groundY:1025,scale:1,anchorX:256,anchorY:430,animation:{image:'../PNG/OSCARE.png',frames:[[0,0,512,512]]}};
  const player=install(canvas,button,status,{...stage,fighters:[fighter]},env);
  for(const image of images){const png=fs.readFileSync(path.resolve(__dirname,'..',image.src));image.naturalWidth=png.readUInt32BE(16);image.naturalHeight=png.readUInt32BE(20);image.onload();}
  await player.loaded;assert.equal(images.length,5);
  assert.equal(draws.at(-2)[0].src,animations.walk.image);assert.equal(draws.at(-1)[0].src,fighter.animation.image);
  const tony=transforms.at(-2);canvas.listeners.keydown({key:'End',preventDefault(){}});
  assert.equal(transforms.at(-2)[0],tony[0]-315);assert.equal(transforms.at(-2)[1],tony[1]);
  player.destroy();assert.equal(callbacks.size,0);
});
