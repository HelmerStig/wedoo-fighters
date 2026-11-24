const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
function catalog(){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),c);return c.window.MOVES_CATALOG.characters;}
test('jump jab: nove personaggi, tagli salvati una volta e ritorno senza duplicare il vertice',()=>{
 const m=read('animation/light-punch-jump-manifest.json'),chars=catalog();assert.equal(m.creditsUsed,0);
 assert.deepEqual(m.items.map(i=>i.character.toLowerCase()).sort(),['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz']);
 assert.equal(chars.filter(c=>c.animations.some(a=>a.id==='light-punch-jump')).length,9);
 for(const item of m.items){
  const png=fs.readFileSync(path.join(root,item.png)),atlas=read(item.atlas),a=chars.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='light-punch-jump');
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  const forward=Array.from({length:item.sourceEnd-item.sourceStart+1},(_,i)=>i+item.sourceStart),seq=forward.concat(forward.slice(0,-1).reverse());
  assert.deepEqual(item.frameSequence,seq);assert.equal(item.frames,seq.length);assert.equal(item.sourceRangeFrames,forward.length);assert.equal(item.playback,'forward-reverse');
  assert.equal(a.frames.length,seq.length);assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);
  Object.values(atlas.frames).forEach((f,i)=>{assert.equal(f.source_frame,seq[i]);assert.equal(f.source_sheet_id,item.sourceSheetId);assert.match(f.rgbaSha256,/^[0-9a-f]{64}$/);assert.ok(f.frame.x+512<=png.readUInt32BE(16));assert.ok(f.frame.y+512<=png.readUInt32BE(20));assert.ok(Math.abs(f.duration-a.frameDurations[i])<1e-8);});
 }
});
test('jump jab: primo impatto a 250 ms e ciclo completo a 500 ms, salvata la velocita senza moltiplicarla',()=>{
 const t=read('animation/light-punch-jump-timing.json');assert.equal(t.impactMs,250);assert.equal(t.durationMs,500);
 for(const c of catalog()){
  const a=c.animations.find(a=>a.id==='light-punch-jump');if(!a)continue;
  assert.equal(a.impactMs,250);assert.equal(a.durationMs,500);assert.equal(a.playbackMode,'forward-reverse');assert.equal(a.playbackFps,a.frames.length*2);
  assert.ok(Math.abs(a.frameDurations.slice(0,a.impactFrame).reduce((x,y)=>x+y,0)-250)<1e-7);assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-500)<1e-7);
  assert.equal(advanceAnimation({frame:0,remainder:0},250+1e-6,a,1,false).frame,a.impactFrame);
  assert.equal(advanceAnimation({frame:0,remainder:0},500+1e-6,a,1,false).ended,true);
  assert.ok(a.frameDurations.every(d=>d>0));
 }
});
