const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js'),root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('animation/defeat-manifest.json'),roster=read('animation/crouch-manifest.json');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
test('Defeat usa nove sorgenti corrette, gli hash correnti e la provenienza originale e tutti i frame nel solo ordine avanti',()=>{
 assert.deepEqual(manifest.items.map(i=>i.character.toLowerCase()).sort(),roster.items.map(i=>i.character.toLowerCase()).sort());
 assert.equal(new Set(manifest.items.map(i=>i.sourceSheetId)).size,9);
 for(const item of manifest.items){
  assert.equal(item.characterId,roster.items.find(c=>c.character===item.character).characterId);
  assert.equal(item.sourceAnimationName,'Defeat');assert.equal(item.playback,'forward');
  assert.equal(item.frames,49);assert.equal(item.importedPngSha256??item.pngSha256,item.sourcePngSha256);if(item.localEdits){assert.ok(item.localEdits.changedFrames.length>0);assert.notEqual(item.pngSha256,item.importedPngSha256);}
  const png=fs.readFileSync(path.join(root,item.png)),atlas=read(item.atlas),frames=Object.values(atlas.frames);
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
  assert.equal(frames.length,item.frames);
  frames.forEach((f,i)=>{assert.equal(f.source_frame,item.sourceStart+i);assert.equal(f.duration,1000/item.frames);assert.equal(f.frame.w,512);assert.equal(f.frame.h,512);assert.ok(f.frame.x+512<=png.readUInt32BE(16)&&f.frame.y+512<=png.readUInt32BE(20));});
 }
});
test('Defeat termina dopo un secondo sulla posa finale; loop e velocita rispettano la durata',()=>{
 const animations=context.window.MOVES_CATALOG.characters.flatMap(c=>c.animations.filter(a=>a.id==='defeat'));
 assert.equal(animations.length,9);
 for(const a of animations){
  const at=(ms,speed=1,loop=false)=>advanceAnimation({frame:0,remainder:0},ms,a,speed,loop);
  assert.equal(a.durationMs,1000);assert.equal(a.playbackFps,49);assert.equal(a.playbackMode,'forward');
  assert.equal(at(999).ended,false);assert.equal(at(1000).ended,true);assert.equal(at(1000).frame,48);
  assert.equal(at(1000,1,true).frame,0);assert.equal(at(500,2).ended,true);
  assert.equal(a.impactMs,undefined);assert.equal(a.armTrail,undefined);
 }
});
