const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('animation/crouch-block-manifest.json'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);

test('parata accovacciata: nove selezioni salvate, Oscar v2, frame e PNG coerenti',()=>{
 assert.deepEqual(manifest.items.map(i=>i.character.toLowerCase()).sort(),['alberto','elisa','fabio-clara','fra-tavarone','marsan','oscar','peppo','pippo','sboz']);
 for(const item of manifest.items){
  assert.equal(item.sourceAnimationName,item.character==='Oscar'?'Crouch Block v2':'Crouch Block');
  const atlas=read(item.atlas),frames=Object.values(atlas.frames),bytes=fs.readFileSync(path.join(root,item.png));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.pngSha256);
  const forward=Array.from({length:item.sourceEnd-item.sourceStart+1},(_,i)=>item.sourceStart+i),sequence=[...forward,...forward.slice(0,-1).reverse()];
  assert.deepEqual(item.frameSequence,sequence);assert.deepEqual(frames.map(f=>f.source_frame),sequence);
  assert.equal(frames.length,item.frames);assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
  assert.equal(item.frameWidth,512);assert.equal(item.frameHeight,512);
  assert.ok(frames.every(f=>f.frame.x+512<=bytes.readUInt32BE(16)&&f.frame.y+512<=bytes.readUInt32BE(20)));
 }
});

test('posa di parata a 250 ms e ritorno a 500 ms, anche con velocita e loop',()=>{
 const animations=context.window.MOVES_CATALOG.characters.flatMap(c=>c.animations.filter(a=>a.id==='crouch-block'));
 assert.equal(animations.length,9);
 for(const a of animations){
  assert.equal(a.durationMs,500);assert.equal(a.blockMs,250);assert.equal(a.playbackMode,'forward-reverse');
  assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-500)<1e-6);
  assert.equal(advanceAnimation({frame:0,remainder:0},250,a,1,false).frame,a.blockFrame);
  assert.equal(advanceAnimation({frame:0,remainder:0},125,a,2,false).frame,a.blockFrame);
  assert.equal(advanceAnimation({frame:0,remainder:0},500,a,1,false).ended,true);
  assert.equal(advanceAnimation({frame:0,remainder:0},500,a,1,true).frame,0);
  assert.equal(a.armTrail,undefined);
 }
});
