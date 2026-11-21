const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
const expected=['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz'];
for(const move of ['hurt-medium','hurt-low','hurt-crouched']){
 test(move+': nove selezioni trimmed e pixel/atlas identificati senza alterare ordine o dimensioni',()=>{
  const manifest=read('animation/'+move+'-manifest.json');
  assert.equal(manifest.creditsUsed,0);assert.equal(manifest.durationMs,500);
  assert.deepEqual(manifest.items.map(i=>i.character.toLowerCase()).sort(),expected);
  for(const item of manifest.items){
   assert.equal(item.sourceAnimationName.toLowerCase(),move.replaceAll('-',' '));
   assert.equal(item.trimmed,true);assert.equal(item.playback,'forward');
   const atlas=read(item.atlas),frames=Object.values(atlas.frames),png=fs.readFileSync(path.join(root,item.png));
   assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
   assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);assert.equal(frames.length,item.frames);
   assert.equal(item.sourceEnd-item.sourceStart+1,item.frames);assert.equal(item.frameWidth,512);assert.equal(item.frameHeight,512);
   frames.forEach((f,i)=>{assert.equal(f.source_frame,item.sourceStart+i);assert.ok(f.frame.x+512<=png.readUInt32BE(16)&&f.frame.y+512<=png.readUInt32BE(20));assert.equal(f.duration,500/item.frames);});
  }
 });
 test(move+': termine a 500 ms, ciclo e velocita coerenti nel player',()=>{
  const entries=context.window.MOVES_CATALOG.characters.flatMap(c=>c.animations.filter(a=>a.id===move));
  assert.equal(entries.length,9);
  for(const a of entries){
   assert.equal(a.durationMs,500);assert.equal(a.playbackMode,'forward');assert.equal(a.playbackFps,a.frames.length*2);
   assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-500)<1e-6);
   assert.equal(advanceAnimation({frame:0,remainder:0},499,a,1,false).ended,false);
   assert.equal(advanceAnimation({frame:0,remainder:0},500,a,1,false).ended,true);
   assert.equal(advanceAnimation({frame:0,remainder:0},500,a,1,true).frame,0);
   assert.equal(advanceAnimation({frame:0,remainder:0},250,a,2,false).ended,true);
   assert.equal(a.impactMs,undefined);assert.equal(a.armTrail,undefined);
  }
 });
}
