const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const demo=path.resolve(__dirname,'..'),stages=require('../stages-catalog.js'),stage=stages.find(s=>s.id==='porta-susa'),weather=require('../stage-weather.js'),clouds=require('../stage-clouds-webgl.js'),{install,shadowProjection}=require('../stage-player.js');

test('Porta Susa: due PNG nativi con z-index richiesti, Pippo e Peppo idle e ombre su tutti i frame',()=>{
  assert.equal(stage.width,2550);assert.equal(stage.height,1080);assert.equal(stage.viewportWidth,1920);
  assert.deepEqual(stage.layers.map(l=>l.zIndex),[0,1]);assert.deepEqual(stage.fighters.map(f=>[f.characterId,f.flipX]),[['pippo',false],['peppo',true]]);
  for(const l of stage.layers){const bytes=fs.readFileSync(path.resolve(demo,l.image));assert.equal(bytes.readUInt32BE(16),l.width);assert.equal(bytes.readUInt32BE(20),l.height);}
  const data=JSON.parse(fs.readFileSync(path.resolve(demo,'../animation/stage-foot-contacts.json'),'utf8'));
  for(const f of stage.fighters){const a=data.items.find(a=>a.characterId===f.characterId),bytes=fs.readFileSync(path.resolve(demo,a.image));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.pngSha256);
    for(const feet of a.frames){assert.equal(feet.length,2);const [xx,xy,yx,yy,tx,ty]=shadowProjection(f,stage.shadow,feet,315);for(const foot of feet){const u=foot.x-f.anchorX,v=foot.y-f.anchorY;assert.ok(Math.abs(xx*u+yx*v+tx-(f.x-315+(f.flipX?-1:1)*f.scale*u))<1e-8);assert.ok(Math.abs(xy*u+yy*v+ty-(f.groundY+f.scale*v))<1e-8);}}
  }
  assert.ok(stage.rain&&stage.lightning&&stage.webglClouds&&stage.shootingStars);
});
test('pioggia e stelle: traiettorie deterministiche, densità costante e spruzzi sul terreno',()=>{
  for(const t of [0,1000,5000,9700,50000]){
    const drops=weather.rainDrops(2550,1080,t);assert.equal(drops.length,440);assert.deepEqual(drops,weather.rainDrops(2550,1080,t));
    assert.ok(drops.every(d=>d.x>=0&&d.x<2550&&d.y>=-42&&d.y<1110&&d.alpha>0&&d.alpha<1));
    assert.ok(weather.rainSplashes(2550,1080,t).every(s=>s.y>=1080*.87&&s.y<=1080*.99&&s.age>=0&&s.age<.3));
  }
  const a=weather.shootingStars(2550,1500).find(s=>s.x<530),b=weather.shootingStars(2550,1600).find(s=>s.x<530);
  assert.ok(a&&b&&b.x<a.x&&b.y>a.y);assert.ok(a.alpha>0&&a.alpha<=1);
  assert.equal(clouds.lightningState(3700).flash,0);assert.ok(clouds.lightningState(3900).flash>0);assert.equal(clouds.lightningState(4800).flash,0);
});
test('player: nuvole dietro il fondale, pioggia davanti e clock indipendente dal drag',async()=>{
  const node=()=>({listeners:{},setAttribute(){},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(k){delete this.listeners[k];}});
  const images=[],paint=[],views=[],audio=[],callbacks=new Map(),canvas=node(),button=node(),status=node(),document=node(),media=node();let next=0,destroyed=false;
  document.hidden=false;media.matches=false;
  canvas.getContext=()=>({clearRect(){},drawImage(im){paint.push(im.src);},save(){},restore(){}});canvas.classList={add(){},remove(){}};
  const env={document,matchMedia:()=>media,Image:class{constructor(){images.push(this);}},requestAnimationFrame(f){callbacks.set(++next,f);return next;},cancelAnimationFrame(i){callbacks.delete(i);},
    StageWeather:{create(){return {supported:true,sky(ctx,v){paint.push('clouds');views.push({...v});},background(){paint.push('splashes');},foreground(ctx,v){paint.push('rain');views.push({...v});},updateAudio(v){audio.push(v);},async setAudio(v){return v;},destroy(){destroyed=true;}};}}};
  const player=install(canvas,button,status,{...stage,fighters:[]},env);
  images.forEach((im,i)=>{Object.assign(im,{naturalWidth:stage.layers[i].width,naturalHeight:1080});im.onload();});await player.loaded;
  assert.deepEqual(paint.slice(-5),[stage.layers[0].image,'clouds',stage.layers[1].image,'splashes','rain']);
  const tick=t=>{const pending=[...callbacks.values()];callbacks.clear();pending.forEach(f=>f(t));};tick(0);tick(100);
  const before=views.at(-1);canvas.listeners.keydown({key:'End',preventDefault(){}});assert.equal(views.at(-1).elapsed,before.elapsed);assert.equal(views.at(-1).camera,630);
  button.listeners.click();tick(200);const frozen=views.at(-1);tick(300);assert.equal(views.at(-1).elapsed,frozen.elapsed);assert.ok(views.at(-1).rainElapsed>frozen.rainElapsed);
  assert.equal(await player.setStormAudio(true),true);player.setRain(false);assert.equal(views.at(-1).raining,false);
  document.hidden=true;document.listeners.visibilitychange();assert.equal(audio.at(-1).hidden,true);
  player.destroy();assert.ok(destroyed);assert.equal(callbacks.size,0);
});
test('server: espone i layer, le maschere luci e i moduli del temporale, proteggendo i sorgenti di lavoro',async t=>{
  const {createDemoServer}=await import('./serve.mjs'),server=createDemoServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const base='http://127.0.0.1:'+server.address().port;
  for(const route of ['/original-backgrounds/porta-susa/cielo.png','/original-backgrounds/porta-susa/porta-susa.png','/original-backgrounds/porta-susa/lights-mask.png','/demo-moves/stage-weather.js','/demo-moves/stage-clouds-webgl.js','/demo-moves/stage-storm-audio.js','/demo-moves/stage-lights.js','/demo-moves/stage-lights-catalog.js'])assert.equal((await fetch(base+route,{method:'HEAD'})).status,200,route);
  assert.equal((await fetch(base+'/original-backgrounds/porta-susa/original-porta-susa.png')).status,403);
});

test('luci: maschere locali, due lampioni separati, cicli indipendenti e drag senza cambiare fase',()=>{
  const data=require('../stage-lights-catalog.js')['porta-susa'],lights=require('../stage-lights.js');
  assert.equal(data.points.filter(p=>p.kind==='lamp').length,2);assert.equal(data.points.filter(p=>p.kind==='window').length,12);
  const source=fs.readFileSync(path.resolve(demo,'../original-backgrounds/porta-susa/porta-susa.png'));assert.equal(crypto.createHash('sha256').update(source).digest('hex'),data.sourceSha256);
  const bytes=fs.readFileSync(path.resolve(demo,data.mask.image));assert.equal(bytes.readUInt32BE(16),data.mask.width);assert.equal(bytes.readUInt32BE(20),data.mask.height);
  const first=[];
  for(const point of data.points){
    const [x,y,w,h]=point.rect,[mx,my,mw,mh]=point.maskRect;assert.ok(x>=0&&y>=0&&x+w<=2550&&y+h<=1080);assert.ok(mx>=0&&my>=0&&mx+mw<=512&&my+mh<=1024);assert.ok(point.pixels>0);
    let dim=false,bright=false;
    for(let t=0;t<60000;t+=50){const value=lights.level(point,t);assert.ok(value>=.08-1e-8&&value<=1);assert.equal(value,lights.level(point,t));dim||=value<.5;bright||=value===1;}
    assert.ok(dim&&bright,point.id);first.push(lights.level(point,1000));
  }
  assert.ok(new Set(first).size>1,'le luci non lampeggiano tutte insieme');
  const draws=[],context={save(){},restore(){},drawImage(...v){draws.push(v);}};lights.render(context,{},data,1000,0);const before=[...draws];draws.length=0;lights.render(context,{},data,1000,315);
  assert.equal(before.length,draws.length);before.forEach((a,i)=>{assert.equal(draws[i][5],a[5]-315);assert.equal(draws[i][6],a[6]);});
});
