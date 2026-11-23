const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
test('Medium Kick Low: nove selezioni, recupero incluso, impatto 500 ms e ciclo 800 ms',()=>{
 const m=read('animation/medium-kick-low-manifest.json'),t=read('animation/medium-kick-low-timing.json'),ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),ctx);
 assert.equal(m.creditsUsed,0);assert.equal(m.items.length,9);assert.equal(t.impactMs,500);assert.equal(t.durationMs,800);
 for(const item of m.items){
  const a=ctx.window.MOVES_CATALOG.characters.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='medium-kick-low');
  const atlas=read(item.atlas),png=fs.readFileSync(path.join(root,item.png));
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
  assert.equal(a.playbackMode,'forward');assert.equal(a.frames.length,item.sourceEnd-item.sourceStart+1);
  assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);assert.equal(a.impactMs,500);assert.equal(a.durationMs,800);
  assert.ok(Math.abs(a.frameDurations.slice(0,a.impactFrame).reduce((x,y)=>x+y,0)-500)<1e-7);
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-800)<1e-7);
  Object.values(atlas.frames).forEach((f,i)=>{assert.equal(f.source_frame,item.sourceStart+i);assert.equal(f.source_sheet_id,item.sourceSheetId);assert.match(f.rgbaSha256,/^[a-f0-9]{64}$/);assert.ok(f.frame.x+512<=png.readUInt32BE(16));assert.ok(f.frame.y+512<=png.readUInt32BE(20));});
 }
});
