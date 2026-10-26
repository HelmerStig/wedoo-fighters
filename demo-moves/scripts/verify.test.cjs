const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const vm=require('node:vm');
const {advance,effectiveFps}=require('../player-core.js');
const demo=path.resolve(__dirname,'..');
async function catalog(){const sandbox={window:{}};vm.runInNewContext(await fs.readFile(path.join(demo,'catalog.js'),'utf8'),sandbox);return sandbox.window.MOVES_CATALOG;}

test('tutti i personaggi e i frame corrispondono ai file esportati',async()=>{
  const {characters}=await catalog();
  const idleManifest=JSON.parse(await fs.readFile(path.resolve(demo,'../animation/manifest.json'),'utf8'));
  assert.equal(characters.length,idleManifest.items.length);assert.equal(new Set(characters.map(c=>c.id)).size,idleManifest.items.length);
  for(const c of characters){
    await fs.access(path.resolve(demo,decodeURIComponent(c.thumbnail)));
    for(const a of c.animations){
      const png=await fs.readFile(path.resolve(demo,decodeURIComponent(a.image)));
      const atlas=JSON.parse((await fs.readFile(path.resolve(demo,decodeURIComponent(a.atlas)),'utf8')).replace(/^\uFEFF/,''));
      assert.equal(a.frames.length,Object.keys(atlas.frames).length,c.name);
      assert.equal(a.frames.length,atlas.meta?.frame_count??Object.keys(atlas.frames).length,c.name);
      const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
      for(const [x,y,w,h]of a.frames)assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=width&&y+h<=height,c.name);
      assert.ok(effectiveFps(a,1)>0);
      assert.equal(effectiveFps(a,1),18,c.name);
    }
  }
  assert.match(characters.find(c=>c.id==='oscar').thumbnail,/OSCARE\.png$/);
  assert.match(characters.find(c=>c.id==='antonino').thumbnail,/(?:assets\/antonino|PNG\/ANTONINO)\.png$/);
  assert.equal(characters.find(c=>c.id==='mori').animations[0].frames.length,26);
});
test('il loop usa solo i frame esportati e conserva il tempo frazionario',()=>{
  const state=advance({frame:47,remainder:10},40,24,48,true);
  assert.equal(state.frame,0);assert.ok(Math.abs(state.remainder-(50-1000/24))<1e-8);assert.equal(state.ended,false);
  assert.equal(advance({frame:23,remainder:0},1000/24+1e-6,24,24,true).frame,0);
});
test('riproduzione singola e base uniforme a 18 fps',()=>{
  assert.equal(advance({frame:46,remainder:0},200,24,48,false).frame,47);
  assert.equal(advance({frame:46,remainder:0},200,24,48,false).ended,true);
  assert.equal(effectiveFps({baseFps:24,savedSpeed:1.5},.5),9);
  assert.equal(effectiveFps({baseFps:60,savedSpeed:2},1),18);
  assert.equal(effectiveFps({id:'walk',playbackFps:18,savedSpeed:2},1),18);
  assert.equal(effectiveFps({id:'walk',playbackFps:18},.5),9);
  assert.throws(()=>advance({frame:0,remainder:0},20,0,49,true));
});

test('walk usa esattamente il taglio salvato e 18 fps',async()=>{
  const {characters}=await catalog();
  const manifest=JSON.parse(await fs.readFile(path.resolve(demo,'../animation/walk-manifest.json'),'utf8'));
  assert.ok(manifest.items.length>=40);
  for(const item of manifest.items){
    const animation=characters.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='walk');
    assert.equal(animation.name,'Walk');assert.equal(effectiveFps(animation,1),18);
    assert.equal(animation.frames.length,item.sourceEnd-item.sourceStart+1);
    const atlas=JSON.parse(await fs.readFile(path.resolve(demo,decodeURIComponent(animation.atlas)),'utf8'));
    if(atlas.meta?.source_frame_start!==undefined||atlas.meta?.source_frame_end!==undefined){
      assert.equal(atlas.meta.source_frame_start,item.sourceStart);assert.equal(atlas.meta.source_frame_end,item.sourceEnd);
    }else{
      assert.equal(item.sourceStart,0);assert.equal(item.sourceEnd,item.frames-1);
    }
  }
});
test('victory usa i frame esportati e 18 fps',async()=>{
  const {characters}=await catalog();
  const manifest=JSON.parse(await fs.readFile(path.resolve(demo,'../animation/victory-manifest.json'),'utf8'));
  assert.ok(manifest.items.length>=1);
  for(const item of manifest.items){
    const animation=characters.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='victory');
    assert.equal(animation.name,'Victory');assert.equal(effectiveFps(animation,1),18);
    assert.equal(animation.frames.length,item.frames);
    const atlas=JSON.parse(await fs.readFile(path.resolve(demo,decodeURIComponent(animation.atlas)),'utf8'));
    assert.equal(atlas.meta?.frame_count??Object.keys(atlas.frames).length,item.frames);
  }
});
test('il server locale serve la demo e protegge il resto del repository',async t=>{
  const {createDemoServer}=await import('./serve.mjs');
  const server=createDemoServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(()=>new Promise(r=>server.close(r)));
  const base='http://127.0.0.1:'+server.address().port;
  for(const route of ['/demo-moves/','/demo-moves/personaggio.html?id=antonino','/demo-moves/styles.css','/demo-moves/app.js','/demo-moves/catalog.js','/PNG/ALBERTO.png','/animation/mori/mori-idle.png','/animation/tommaso/tommaso-walk.png','/animation/tommaso/tommaso-walk.json','/animation/tommaso/tommaso-victory.png','/animation/tommaso/tommaso-victory.json']){
    const response=await fetch(base+route);assert.equal(response.status,200,route);await response.arrayBuffer();
  }
  assert.equal((await fetch(base+'/autosprite-agent/session.ps1')).status,403);
  assert.equal((await fetch(base+'/portraits/oscar.png')).status,200);
  const fire=await fetch(base+'/portraits/fire.mp4');
  assert.equal(fire.status,200);assert.equal(fire.headers.get('content-type'),'video/mp4');
  assert.equal((await fire.arrayBuffer()).byteLength,(await fs.stat(path.resolve(demo,'../portraits/fire.mp4'))).size);
  assert.equal((await fetch(base+'/portraits/portraits.psd')).status,403);
  assert.equal((await fetch(base+'/.git/config')).status,403);
  assert.equal((await fetch(base+'/demo-moves/missing.png')).status,404);
});
