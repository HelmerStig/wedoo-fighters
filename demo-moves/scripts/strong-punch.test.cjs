const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');

test('Pugno forte di Pippo conserva il PNG sorgente e raggiunge impatto e recupero nei tempi previsti',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'animation/strong-punch-manifest.json'),'utf8'));
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
  const owners=context.window.MOVES_CATALOG.characters.filter(c=>c.animations.some(a=>a.id==='strong-punch'));
  assert.deepEqual(Array.from(owners,c=>c.id),['alberto','marsan','oscar','pippo']);
  const a=owners.find(c=>c.id==='pippo').animations.find(a=>a.id==='strong-punch'),item=manifest.items.find(i=>i.character.toLowerCase()==='pippo');
  const bytes=fs.readFileSync(path.join(root,item.png));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.pngSha256);
  assert.equal(a.name,'Pugno forte');
  assert.equal(a.frames.length,40);assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);
  assert.equal(a.playbackMode,'forward');assert.equal(a.durationMs,1000);
  assert.equal(new Set(a.frames.map(f=>f.join(','))).size,40);
  assert.equal(advanceAnimation({frame:0,remainder:0},500,a,1,false).frame,20);
  assert.equal(advanceAnimation({frame:0,remainder:0},999,a,1,false).frame,39);
  assert.equal(advanceAnimation({frame:0,remainder:0},1000,a,1,true).frame,0);
  assert.equal(a.armTrail.sourceSheetId,item.sourceSheetId);
  assert.equal(a.armTrail.enabled,true);assert.equal(a.armTrail.strength,.75);
});

test('Pugno forte di Oscar conserva il PNG e la sequenza avanti, con impatto a 500 ms e ciclo a 1000 ms',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'animation/strong-punch-manifest.json'),'utf8'));
  const item=manifest.items.find(i=>i.character.toLowerCase()==='oscar');
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
  const a=context.window.MOVES_CATALOG.characters.find(c=>c.id==='oscar').animations.find(a=>a.id==='strong-punch');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,item.png))).digest('hex'),item.pngSha256);
  assert.equal(a.name,'Pugno forte');assert.equal(a.playbackMode,'forward');
  assert.equal(a.frames.length,52);assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);
  assert.equal(new Set(a.frames.map(f=>f.join(','))).size,52);
  for(const speed of [.5,1,2]){
    assert.equal(advanceAnimation({frame:0,remainder:0},500/speed,a,speed,false).frame,25);
    assert.equal(advanceAnimation({frame:0,remainder:0},999/speed,a,speed,false).frame,51);
    assert.equal(advanceAnimation({frame:0,remainder:0},1000/speed,a,speed,true).frame,0);
  }
  assert.equal(a.armTrail.sourceSheetId,item.sourceSheetId);
  assert.equal(a.armTrail.enabled,true);assert.equal(a.armTrail.strength,.75);
});

test('Pugno forte di Alberto conserva il PNG e la sequenza avanti, con impatto a 500 ms e ciclo a 1000 ms',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'animation/strong-punch-manifest.json'),'utf8'));
  const item=manifest.items.find(i=>i.character.toLowerCase()==='alberto');
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
  const a=context.window.MOVES_CATALOG.characters.find(c=>c.id==='alberto').animations.find(a=>a.id==='strong-punch');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,item.png))).digest('hex'),item.pngSha256);
  assert.equal(a.name,'Pugno forte');assert.equal(a.playbackMode,'forward');
  assert.equal(a.frames.length,64);assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);
  assert.equal(new Set(a.frames.map(f=>f.join(','))).size,64);
  for(const speed of [.5,1,2]){
    assert.equal(advanceAnimation({frame:0,remainder:0},500/speed,a,speed,false).frame,16);
    assert.equal(advanceAnimation({frame:0,remainder:0},999/speed,a,speed,false).frame,63);
    assert.equal(advanceAnimation({frame:0,remainder:0},1000/speed,a,speed,true).frame,0);
  }
  assert.equal(a.armTrail.sourceSheetId,item.sourceSheetId);
  assert.equal(a.armTrail.enabled,true);assert.equal(a.armTrail.strength,.75);
});

test('Pugno forte di Marsan conserva il PNG e la sequenza avanti e indietro, con impatto a 500 ms e ciclo a 1000 ms',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'animation/strong-punch-manifest.json'),'utf8'));
  const item=manifest.items.find(i=>i.character.toLowerCase()==='marsan');
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);
  const a=context.window.MOVES_CATALOG.characters.find(c=>c.id==='marsan').animations.find(a=>a.id==='strong-punch');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,item.png))).digest('hex'),item.pngSha256);
  assert.equal(a.name,'Pugno forte');assert.equal(a.playbackMode,'forward-reverse');
  assert.equal(a.frames.length,83);assert.equal(a.frameWidth,512);assert.equal(a.frameHeight,512);
  assert.equal(new Set(a.frames.map(f=>f.join(','))).size,42);
  assert.deepEqual(Array.from(a.frames.at(-1)),Array.from(a.frames[0]));
  assert.equal(item.frameSequence.filter(i=>i===41).length,1);
  for(const speed of [.5,1,2]){
    assert.equal(advanceAnimation({frame:0,remainder:0},500/speed,a,speed,false).frame,18);
    assert.equal(advanceAnimation({frame:0,remainder:0},999/speed,a,speed,false).frame,82);
    assert.equal(advanceAnimation({frame:0,remainder:0},1000/speed,a,speed,true).frame,0);
  }
  assert.equal(a.armTrail.sourceSheetId,item.sourceSheetId);
  assert.equal(a.armTrail.enabled,true);assert.equal(a.armTrail.strength,.75);
});

