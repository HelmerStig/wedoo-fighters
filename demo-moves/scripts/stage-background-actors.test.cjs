const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const actors=require('../stage-background-actors.js'),{install}=require('../stage-player.js');
const stage=require('../stages-catalog.js').find(s=>s.id==='via-somis'),definition=stage.backgroundActors[0];
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../stage-actors-catalog.js'),'utf8'),sandbox);
const animations=sandbox.window.STAGE_ACTORS_CATALOG.tony.animations;

test('Tony saluta fermo, torna indietro nei frame e solo dopo cambia direzione',()=>{
  const c=actors.controller({...definition,greetingInterval:[6000,6000]},animations,()=>0),fps=animations.saluto.playbackFps,count=animations.saluto.frames.length;
  let s=c.update(6000);assert.equal(s.phase,'saluto');assert.equal(s.frame,0);assert.equal(s.direction,1);const x=s.x;
  s=c.update(6000+(count-1)*1000/fps+.001);assert.equal(s.frame,count-1);assert.equal(s.x,x);
  s=c.update(6000+count*1000/fps+.001);assert.equal(s.phase,'reverse');assert.equal(s.frame,count-2);assert.equal(s.direction,1);
  s=c.update(6000+(count*2-1)*1000/fps+.001);assert.equal(s.phase,'walk');assert.equal(s.direction,-1);
  const next=c.update(6000+(count*2-1)*1000/fps+100);assert.ok(next.x<x);
});

test('percorso limitato al pavimento, arresto prima dei limiti e fase indipendente dal drag',()=>{
  const c=actors.controller(definition,animations,()=>1);let previous=c.state(),left=false,right=false;
  for(let time=0;time<600000;time+=37){
    const s=c.update(time);assert.ok(s.x>=definition.path.minX&&s.x<=definition.path.maxX);
    assert.ok(s.frame>=0&&s.frame<animations[s.animation].frames.length);
    assert.deepEqual(c.update(time),s,'un ridisegno senza tempo trascorso non avanza la sequenza');
    if(previous.phase!=='walk'&&s.phase!=='walk')assert.equal(s.x,previous.x);
    left||=s.x===definition.path.minX;right||=s.x===definition.path.maxX;
    previous=s;
  }
  assert.ok(left&&right,'percorre entrambi i lati fino ai marciapiedi');
  const reach=Math.max(...Object.values(animations).flatMap(a=>[Math.abs(a.contentBounds[0]-definition.anchorX),Math.abs(a.contentBounds[2]-definition.anchorX)]))*definition.scale;
  const camera=(stage.width-stage.viewportWidth)/2;
  assert.ok(definition.path.minX+reach<camera,'puo uscire completamente a sinistra dalla vista centrata');
  assert.ok(definition.path.maxX-reach>camera+stage.viewportWidth,'puo uscire completamente a destra');
  assert.ok(Math.abs(definition.scale/.48-1.4)<1e-10);
  assert.throws(()=>actors.controller({...definition,path:{...definition.path,maxX:2500}},animations),/ostacolo/);
});

test('ombra proiettata dallo stesso frame, suole ancorate e direzione della luce stabile dopo il riflesso',()=>{
  const source=[],projections=[],sceneDraws=[];
  const buffer={clearRect(){},drawImage(...args){source.push(args);},save(){},restore(){},fillRect(){}};
  const scene={save(){},restore(){},fillRect(){},translate(){},scale(){},transform(...args){projections.push(args);},drawImage(...args){sceneDraws.push(args);}};
  const asset=Object.fromEntries(Object.entries(animations).map(([id,animation])=>[id,{animation,imageObject:{id}}]));
  const renderer=actors.create([{...definition,pixelSize:1,animations:asset}],{Math:{random:()=>0},document:{createElement(){return {getContext:()=>buffer};}}},stage.shadow);
  const reference=actors.controller(definition,animations,()=>0);
  for(const time of [1000,8300,11000]){
    const state=reference.update(time),animation=animations[state.animation],frame=animation.frames[state.frame];
    renderer.render(scene,time,315,false,.8);
    assert.equal(source.at(-1)[0].id,state.animation);
    assert.deepEqual(source.at(-1).slice(1,5),Array.from(frame));
    const [a,b,c,d,x,y]=projections.at(-1),anchor=animation.groundAnchors[state.frame];
    assert.equal(c,-stage.shadow.shearX*definition.scale);assert.equal(d,-stage.shadow.flattenY*definition.scale);
    for(const foot of actors.groundedFeet(animation,state.frame,definition.anchorX,anchor)){
      const u=foot.x-definition.anchorX,v=foot.y-anchor;
      assert.ok(Math.abs(a*u+c*v+x-(state.x-315+state.direction*definition.scale*u))<1e-8);
      assert.ok(Math.abs(b*u+d*v+y-(definition.path.groundY+definition.scale*v))<1e-8);
    }
  }
  renderer.destroy();
});

test('le suole restano attaccate alla proiezione in tutti i frame, in entrambi gli orientamenti',()=>{
  for(const animation of Object.values(animations))for(let frame=0;frame<animation.frames.length;frame++){
    const anchor=animation.groundAnchors[frame],feet=actors.groundedFeet(animation,frame,definition.anchorX,anchor);
    for(const direction of [-1,1])for(const camera of [0,315,630]){
      const x=1200,[a,b,c,d,tx,ty]=actors.projection(definition,{x,direction},feet,camera,stage.shadow,anchor);
      assert.ok((a*d-b*c)*direction<0,'la proiezione non si ribalta verticalmente durante il passo');
      for(const foot of feet){const u=foot.x-definition.anchorX,v=foot.y-anchor;
        assert.ok(Math.abs(a*u+c*v+tx-(x-camera+direction*definition.scale*u))<1e-8);
        assert.ok(Math.abs(b*u+d*v+ty-(definition.path.groundY+definition.scale*v))<1e-8);
      }
    }
  }
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
