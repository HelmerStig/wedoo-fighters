const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),data=read('animation/knockdown-manifest.json');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
test('caduta e rialzata: i nove abbinamenti concatenano entrambe le sorgenti senza inversioni',()=>{
 assert.deepEqual(data.items.map(i=>i.character.toLowerCase()).sort(),['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz']);
 for(const item of data.items){
  const png=fs.readFileSync(path.join(root,item.png)),atlas=read(item.atlas),frames=Object.values(atlas.frames);
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  assert.equal(item.sources.length,2);assert.equal(item.sources[0].sourceAnimationName,'Sweep Knockdown');assert.equal(item.sources[1].sourceAnimationName,'Sweep Knockdown Recovery');
  assert.equal(frames.length,98);assert.equal(item.frames,98);
  for(const phase of item.sources){
   assert.equal(phase.frames,phase.sourceEnd-phase.sourceStart+1);
   frames.slice(phase.startFrame,phase.endFrame+1).forEach((f,i)=>{assert.equal(f.source_sheet_id,phase.sourceSheetId);assert.equal(f.source_frame,phase.sourceStart+i);assert.equal(f.phase,phase.id);});
  }
  assert.ok(frames.every(f=>f.frame.w===512&&f.frame.h===512&&f.frame.x+512<=png.readUInt32BE(16)&&f.frame.y+512<=png.readUInt32BE(20)));
 }
});
test('il player mantiene l appoggio a terra e passa alla rialzata a 700 ms, terminando a 1500 ms',()=>{
 for(const item of data.items){
  const a=context.window.MOVES_CATALOG.characters.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='knockdown');
  const at=(ms,speed=1,loop=false)=>advanceAnimation({frame:0,remainder:0},ms,a,speed,loop),fall=item.sources[0],recovery=item.sources[1];
  assert.equal(at(500).frame,fall.endFrame);assert.equal(at(699).frame,fall.endFrame);assert.equal(at(700).frame,recovery.startFrame);
  assert.equal(at(1500).ended,true);assert.equal(at(1500).frame,97);assert.equal(at(1500,1,true).frame,0);
  assert.equal(at(350,2).frame,recovery.startFrame);assert.equal(at(750,2).ended,true);
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-1500)<1e-6);
 }
});
