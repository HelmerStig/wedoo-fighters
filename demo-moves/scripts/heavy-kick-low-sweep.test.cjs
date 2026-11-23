const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
test('Heavy Kick Low Sweep: nove selezioni, recupero incluso, impatto 500 ms e ciclo 900 ms',()=>{
 const m=read('animation/heavy-kick-low-sweep-manifest.json'),t=read('animation/heavy-kick-low-sweep-timing.json'),ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),ctx);
 assert.equal(m.creditsUsed,0);assert.equal(m.items.length,9);assert.equal(t.impactMs,500);assert.equal(t.durationMs,900);
 for(const item of m.items){
  const a=ctx.window.MOVES_CATALOG.characters.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='heavy-kick-low-sweep');
  const atlas=read(item.atlas),png=fs.readFileSync(path.join(root,item.png));
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  assert.equal(a.playbackMode,'forward');assert.equal(a.frames.length,item.sourceEnd-item.sourceStart+1);
  assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);assert.equal(a.impactMs,500);assert.equal(a.durationMs,900);
  assert.ok(Math.abs(a.frameDurations.slice(0,a.impactFrame).reduce((x,y)=>x+y,0)-500)<1e-7);
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-900)<1e-7);
  Object.values(atlas.frames).forEach((f,i)=>{assert.equal(f.source_frame,item.sourceStart+i);assert.equal(f.source_sheet_id,item.sourceSheetId);assert.match(f.rgbaSha256,/^[a-f0-9]{64}$/);assert.ok(f.frame.x+512<=png.readUInt32BE(16));assert.ok(f.frame.y+512<=png.readUInt32BE(20));});
 }
});

test('la prima passata scatta a 500 ms e il loop riparte a 900 ms',()=>{
 const {advanceAnimation}=require('../player-core.js'),ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),ctx);
 for(const c of ctx.window.MOVES_CATALOG.characters){
  const a=c.animations.find(a=>a.id==='heavy-kick-low-sweep');if(!a)continue;
  const at=(ms,speed=1,loop=true)=>advanceAnimation({frame:0,remainder:0},ms,a,speed,loop);
  for(const speed of [.5,1,2]){
   assert.equal(at(499.999/speed,speed).frame,a.impactFrame-1,c.id);
   assert.equal(at(500/speed,speed).frame,a.impactFrame,c.id);
   assert.equal(at(900/speed,speed).frame,0,c.id);
   assert.equal(at(900/speed,speed,false).ended,true,c.id);
  }
 }
});
