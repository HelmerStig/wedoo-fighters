const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
function catalog(){const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),ctx);return ctx.window.MOVES_CATALOG.characters;}
test('calcio basso leggero: solo i nove personaggi, pixel e intervalli selezionati coerenti senza doppio taglio',()=>{
 const m=read('animation/light-kick-low-manifest.json'),chars=catalog();assert.equal(m.creditsUsed,0);
 assert.deepEqual(m.items.map(i=>i.character.toLowerCase()).sort(),['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz']);
 assert.equal(chars.filter(c=>c.animations.some(a=>a.id==='light-kick-low')).length,9);
 for(const item of m.items){
  const png=fs.readFileSync(path.join(root,item.png)),atlas=read(item.atlas),a=chars.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='light-kick-low');
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  assert.equal(a.frames.length,item.sourceEnd-item.sourceStart+1);assert.equal(item.playback,'forward');assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);
  Object.values(atlas.frames).forEach((f,i)=>{assert.equal(f.source_frame,item.sourceStart+i);assert.equal(f.source_sheet_id,item.sourceSheetId);assert.match(f.rgbaSha256,/^[0-9a-f]{64}$/);assert.ok(f.frame.x+512<=png.readUInt32BE(16));assert.ok(f.frame.y+512<=png.readUInt32BE(20));});
 }
 const oscar=m.items.find(i=>i.character==='Oscar');assert.equal(oscar.sourceFrames,48);assert.equal(oscar.frames,32);assert.equal(oscar.sourceStart,9);assert.equal(oscar.sourceEnd,40);
});
test('impatto sincronizzato a 300 ms, ciclo a 600 ms e recupero nello stesso ordine',()=>{
 const timing=read('animation/light-kick-low-timing.json');assert.equal(timing.impactMs,300);assert.equal(timing.durationMs,600);
 for(const c of catalog()){
  const a=c.animations.find(a=>a.id==='light-kick-low');if(!a)continue;
  assert.equal(a.impactMs,300);assert.equal(a.durationMs,600);assert.equal(a.playbackMode,'forward');assert.equal(a.playbackFps,a.frames.length*1000/600);
  assert.ok(Math.abs(a.frameDurations.slice(0,a.impactFrame).reduce((x,y)=>x+y,0)-300)<1e-7);
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-600)<1e-7);
  assert.ok(a.frameDurations.every(d=>d>0));assert.ok(a.impactFrame>0&&a.impactFrame<a.frames.length-1);
 }
});
