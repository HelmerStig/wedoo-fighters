const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),ctx);const roster=ctx.window.MOVES_CATALOG.characters;
const manifest=read('animation/strong-punch-low-manifest.json');
test('forte basso: nove sorgenti correnti, recupero inverso solo dove manca e hash dei PNG correnti',()=>{
 assert.deepEqual(manifest.items.map(i=>i.character.toLowerCase()).sort(),['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz']);assert.equal(manifest.creditsUsed,0);
 assert.equal(roster.filter(c=>c.animations.some(a=>a.id==='strong-punch-low')).length,9);
 for(const item of manifest.items){
  const slug=item.character.toLowerCase(),reverse=false,atlas=read(item.atlas),png=fs.readFileSync(path.join(root,item.png));
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  const seq=Array.from({length:item.sourceFrames},(_,i)=>item.sourceStart+i);if(reverse)seq.push(...seq.slice(0,-1).reverse());
  assert.equal(item.playback,reverse?'forward-reverse':'forward');assert.deepEqual(item.frameSequence,seq);assert.equal(seq.length,item.frames);
  assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
  Object.values(atlas.frames).forEach((f,i)=>{assert.equal(f.source_frame,seq[i]);assert.equal(f.source_sheet_id,item.sourceSheetId);assert.match(f.rgbaSha256,/^[0-9a-f]{64}$/);assert.equal(f.frame.w,512);assert.equal(f.frame.h,512);assert.ok(f.frame.x+512<=png.readUInt32BE(16));assert.ok(f.frame.y+512<=png.readUInt32BE(20));});
  if(reverse){assert.equal(seq.at(-1),seq[0]);assert.equal(seq.filter(i=>i===item.sourceEnd).length,1);}
 }
});
test('forte basso: impatto 500ms e durata 1000ms anche con velocita, loop e riproduzione singola',()=>{
 for(const c of roster){
  const a=c.animations.find(a=>a.id==='strong-punch-low');if(!a)continue;
  const normal=c.animations.find(a=>a.id==='strong-punch');assert.equal(a.impactMs,normal.impactMs);assert.equal(a.durationMs,normal.durationMs);
  assert.ok(a.frameDurations.every(d=>d>0));assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-1000)<1e-7);
  for(const speed of [.5,1,2]){
   const s={frame:0,remainder:0};
   assert.equal(advanceAnimation(s,499.999/speed,a,speed,true).frame,a.impactFrame-1,c.id);
   assert.equal(advanceAnimation(s,500/speed,a,speed,true).frame,a.impactFrame,c.id);
   assert.equal(advanceAnimation(s,1000/speed,a,speed,true).frame,0,c.id);
   const end=advanceAnimation(s,1000/speed,a,speed,false);assert.equal(end.frame,a.frames.length-1,c.id);assert.equal(end.ended,true,c.id);
  }
 }
});
test('report e pose sono collegati ai nove fogli selezionati',()=>{
 const html=fs.readFileSync(path.join(root,'demo-moves/reports/strong-punch-low-timing.html'),'utf8');assert.match(html,/0,50 s/);assert.match(html,/1,00 s/);
 for(const item of manifest.items){assert.ok(html.includes(item.sourceSheetId));assert.ok(fs.existsSync(path.join(root,'demo-moves/reports/strong-punch-low-poses',item.character.toLowerCase()+'.png')));}
});
test('controllo alpha riferito ai fogli correnti e difetti sorgente Marsan documentati',()=>{
 const audit=read('animation/strong-punch-low-alpha-review.json');assert.equal(audit.items.length,9);
 assert.equal(audit.items.reduce((n,i)=>n+i.framesChecked,0),441);
 for(const item of manifest.items){const entry=audit.items.find(e=>e.character===item.character);assert.equal(entry.sourceSheetId,item.sourceSheetId);assert.equal(entry.pngSha256,item.pngSha256);}
 assert.equal(audit.items.find(e=>e.character==='MARSAN').status,'source-defect');
 for(const file of audit.evidence)assert.ok(fs.existsSync(path.join(root,file)));
});
