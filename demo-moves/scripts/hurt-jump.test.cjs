const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js'),root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const data=read('animation/hurt-in-jump-manifest.json'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
test('hurt in salto unisce le nove selezioni e la rialzata locale, senza inversione o ridimensionamento',()=>{
 assert.deepEqual(data.items.map(i=>i.character.toLowerCase()).sort(),['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz']);
 let count=0;
 for(const item of data.items){
  const png=fs.readFileSync(path.join(root,item.png)),pngs=item.sheets.map(s=>fs.readFileSync(path.join(root,s.png))),atlas=read(item.atlas),frames=Object.values(atlas.frames),[fall,recovery]=item.sources;
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  assert.equal(fall.sourceAnimationName,'Hurt in Jump');assert.equal(recovery.sourceAnimationName,'Sweep Knockdown Recovery');
  assert.ok(recovery.localSegment.png.endsWith('-knockdown.png'));assert.equal(recovery.frames,49);
  assert.equal(item.frames,fall.frames+recovery.frames);assert.equal(frames.length,item.frames);
  if(['PEPPO','Elisa'].includes(item.character))assert.ok(recovery.localSegment.localEdits);
  for(const phase of item.sources){
   assert.equal(phase.frames,phase.sourceEnd-phase.sourceStart+1);
   frames.slice(phase.startFrame,phase.endFrame+1).forEach((f,i)=>{assert.equal(f.source_sheet_id,phase.sourceSheetId);assert.equal(f.source_frame,phase.sourceStart+i);assert.equal(f.phase,phase.id);});
  }
  assert.equal(item.sheets.length,2);assert.equal(item.sheets[1].png,recovery.localSegment.png);
  assert.ok(frames.every((f,i)=>f.sheet===(i<recovery.startFrame?0:1)&&f.frame.w===512&&f.frame.h===512&&f.frame.x+512<=pngs[f.sheet].readUInt32BE(16)&&f.frame.y+512<=pngs[f.sheet].readUInt32BE(20)));
  count+=frames.length;
 }
 assert.equal(count,876);
});
test('posa a terra da 600 a 800 ms, rialzata a 800 ms, fine e loop a 1600 ms',()=>{
 for(const item of data.items){
  const a=context.window.MOVES_CATALOG.characters.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='hurt-in-jump');
  const at=(ms,speed=1,loop=false)=>advanceAnimation({frame:0,remainder:0},ms,a,speed,loop),[fall,recovery]=item.sources;
  assert.equal(a.durationMs,1600);assert.equal(a.playbackMode,'sequence');
  assert.equal(a.images.length,2);assert.equal(a.frameImageIndices[recovery.startFrame],1);
  assert.equal(at(600).frame,fall.endFrame);assert.equal(at(799).frame,fall.endFrame);assert.equal(at(800).frame,recovery.startFrame);
  assert.equal(at(1600).ended,true);assert.equal(at(1600).frame,item.frames-1);assert.equal(at(1600,1,true).frame,0);
  assert.equal(at(400,2).frame,recovery.startFrame);assert.equal(at(800,2).ended,true);
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-1600)<1e-6);
 }
});
