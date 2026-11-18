const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),ctx);
const roster=ctx.window.MOVES_CATALOG.characters;
const manifest=read('animation/medium-punch-manifest.json');
const timing=read('animation/medium-punch-timing.json');
const selected=['alberto','fabio-clara','sboz','pippo','peppo','oscar','elisa','fra-tavarone','marsan'];
test('Pugno medio disponibile esattamente per i nove personaggi richiesti',()=>{
 assert.deepEqual(manifest.items.map(i=>i.character.toLowerCase()).sort(),selected.slice().sort());
 assert.deepEqual(Array.from(roster.filter(c=>c.animations.some(a=>a.id==='medium-punch')),c=>c.id).sort(),selected.slice().sort());
 assert.equal(manifest.creditsUsed,0);
 for(const item of manifest.items){
  const a=roster.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='medium-punch');
  assert.equal(a.name,'Pugno medio');assert.equal(a.durationMs,750);assert.equal(a.impactMs,400);
  assert.equal(a.frames.length,item.frames);assert.equal(a.playbackMode,item.playback);
 }
});
test('impatto a 400 ms e ciclo a 750 ms, con loop, singola riproduzione e velocita diverse',()=>{
 for(const c of roster){
  const a=c.animations.find(a=>a.id==='medium-punch');if(!a)continue;
  assert.equal(a.frameDurations.length,a.frames.length,c.id);
  assert.ok(a.frameDurations.every(x=>x>0),c.id);
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-750)<1e-8,c.id);
  for(const speed of [.5,1,2]){
   const initial={frame:0,remainder:0};
   const before=advanceAnimation(initial,399.999/speed,a,speed,true);
   const hit=advanceAnimation(initial,400/speed,a,speed,true);
   assert.equal(before.frame,a.impactFrame-1,c.id);
   assert.equal(hit.frame,a.impactFrame,c.id);assert.ok(hit.remainder<1e-8,c.id);
   assert.equal(advanceAnimation(initial,750/speed,a,speed,true).frame,0,c.id);
   const end=advanceAnimation(initial,750/speed,a,speed,false);
   assert.equal(end.frame,a.frames.length-1,c.id);assert.equal(end.ended,true,c.id);
   assert.equal(advanceAnimation(initial,749/speed,a,speed,false).ended,false,c.id);
  }
  let accumulated={frame:0,remainder:0};
  for(let i=0;i<400;i++)accumulated=advanceAnimation(accumulated,1,a,1,true);
  assert.equal(accumulated.frame,a.impactFrame,c.id);
  for(let i=400;i<750;i++)accumulated=advanceAnimation(accumulated,1,a,1,true);
  assert.equal(accumulated.frame,0,c.id);
 }
});
test('sette recuperi inversi, Sboz ed Elisa solo avanti e PNG sorgenti conservati byte per byte',()=>{
 for(const item of manifest.items){
  const slug=item.character.toLowerCase();const atlas=read(item.atlas);
  const a=roster.find(c=>c.id===slug).animations.find(a=>a.id==='medium-punch');
  const forward=Array.from({length:item.sourceFrames},(_,i)=>item.sourceStart+i);
  const expected=['sboz','elisa'].includes(slug)?forward:[...forward,...forward.slice(0,-1).reverse()];
  assert.equal(item.playback,['sboz','elisa'].includes(slug)?'forward':'forward-reverse');
  assert.deepEqual(item.frameSequence,expected,slug);
  assert.equal(atlas.meta.source_frame_count,item.sourceSheetFrames);
  assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
  assert.equal(item.sourceFrames,item.sourceEnd-item.sourceStart+1);
  assert.equal(item.sourceStart,0);
  assert.equal(item.sourceEnd,slug==='marsan'?24:item.sourceSheetFrames-1);
  if(!['sboz','elisa'].includes(slug)){
   assert.equal(expected.at(-1),item.sourceStart);
   assert.equal(expected.filter(i=>i===item.sourceEnd).length,1);
   assert.deepEqual(Array.from(a.frames.at(-1)),Array.from(a.frames[0]),slug);
  }
  const png=fs.readFileSync(path.join(root,item.png));
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.sourcePngSha256,slug);
  for(let i=0;i<expected.length;i++){
   const f=atlas.frames[String(i)];
   assert.equal(f.source_frame,expected[i]);
   assert.equal(f.duration,a.frameDurations[i]);
   assert.equal(f.rgba_sha256,atlas.frames[String(expected.indexOf(expected[i]))].rgba_sha256);
  }
  const entry=timing.items.find(x=>x.character===item.character);
  assert.equal(expected[a.impactFrame],entry.impactSourceFrame);
 }
});
test('report HTML, CSV e pose corrispondono ai nove impatti selezionati',()=>{
 const html=fs.readFileSync(path.join(root,'demo-moves/reports/medium-punch-timing.html'),'utf8');
 const csv=fs.readFileSync(path.join(root,'demo-moves/reports/medium-punch-timing.csv'),'utf8');
 assert.match(html,/0,40 s/);assert.match(html,/0,75 s/);assert.match(html,/Solo avanti/);
 assert.match(html,/Avanti e indietro/);assert.match(html,/frame isolato finale/);
 for(const item of manifest.items){
  const slug=item.character.toLowerCase();
  const png=fs.readFileSync(path.join(root,'demo-moves/reports/medium-punch-poses/'+slug+'.png'));
  assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);
  assert.ok(csv.includes(item.sourceSheetId));assert.ok(html.includes(item.sourceSheetId));
  assert.ok(html.includes('../personaggio.html?id='+slug));
 }
 assert.equal((html.match(/<tr>/g)||[]).length,manifest.items.length+1);
});

