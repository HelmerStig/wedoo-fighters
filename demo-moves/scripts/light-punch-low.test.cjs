const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
function catalog(){const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),ctx);return ctx.window.MOVES_CATALOG.characters;}
test('low jab: solo i nove personaggi, pixel e intervalli selezionati coerenti senza doppio taglio',()=>{
 const m=read('animation/light-punch-low-manifest.json'),chars=catalog();assert.equal(m.creditsUsed,0);
 assert.deepEqual(m.items.map(i=>i.character.toLowerCase()).sort(),['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz']);
 assert.equal(chars.filter(c=>c.animations.some(a=>a.id==='light-punch-low')).length,9);
 for(const item of m.items){
  const png=fs.readFileSync(path.join(root,item.png)),atlas=read(item.atlas),a=chars.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='light-punch-low');
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  assert.equal(a.frames.length,item.sourceEnd-item.sourceStart+1);assert.equal(item.playback,'forward');assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);
  Object.values(atlas.frames).forEach((f,i)=>{assert.equal(f.source_frame,item.sourceStart+i);assert.equal(f.source_sheet_id,item.sourceSheetId);assert.match(f.rgbaSha256,/^[0-9a-f]{64}$/);assert.ok(f.frame.x+512<=png.readUInt32BE(16));assert.ok(f.frame.y+512<=png.readUInt32BE(20));});
 }
 const oscar=m.items.find(i=>i.character==='Oscar');assert.equal(oscar.sourceFrames,30);assert.equal(oscar.frames,18);assert.equal(oscar.sourceEnd,17);
});
test('impatto sincronizzato a 250 ms, ciclo a 500 ms e recupero nello stesso ordine',()=>{
 const timing=read('animation/light-punch-low-timing.json');assert.equal(timing.impactMs,250);assert.equal(timing.durationMs,500);
 for(const c of catalog()){
  const a=c.animations.find(a=>a.id==='light-punch-low');if(!a)continue;
  assert.equal(a.impactMs,250);assert.equal(a.durationMs,500);assert.equal(a.playbackMode,'forward');assert.equal(a.playbackFps,a.frames.length*2);
  assert.ok(Math.abs(a.frameDurations.slice(0,a.impactFrame).reduce((x,y)=>x+y,0)-250)<1e-7);
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-500)<1e-7);
  assert.ok(a.frameDurations.every(d=>d>0));assert.ok(a.impactFrame>0&&a.impactFrame<a.frames.length-1);
 }
});
