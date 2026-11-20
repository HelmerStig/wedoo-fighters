const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('animation/strong-kick-manifest.json');
const timing=read('animation/strong-kick-timing.json');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),context);

test('Calcio potente rispetta i nove abbinamenti del file e inverte solo i frame del taglio salvato',()=>{
  const text=fs.readFileSync(path.join(root,'primi-personaggi-da-cpmpletare.txt'),'utf8');
  const assignments=text.split(/^-[ \t]+/m).slice(1).map(block=>({slug:block.split(/\r?\n/)[0].trim().toLowerCase().replaceAll(' ','-'),name:block.match(/Calcio potente\s*\(([^)]+)\)/i)[1]}));
  assert.equal(manifest.items.length,assignments.length);assert.equal(manifest.creditsUsed,0);
  for(const item of manifest.items){
    const assigned=assignments.find(a=>a.slug===item.character.toLowerCase());
    assert.equal(item.sourceAnimationName.toLowerCase(),assigned.name.toLowerCase());
    const seq=Array.from({length:item.sourceEnd-item.sourceStart+1},(_,i)=>item.sourceStart+i);
    seq.push(...seq.slice(0,-1).reverse());
    assert.equal(item.playback,'forward-reverse');assert.deepEqual(item.frameSequence,seq);
    assert.equal(item.frames,seq.length);assert.equal(item.frameWidth,512);assert.equal(item.frameHeight,512);
    const atlas=read(item.atlas);assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
    assert.equal(Object.keys(atlas.frames).length,seq.length);
    for(let i=0;i<seq.length;i++)assert.equal(atlas.frames[i].source_frame,seq[i]);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,item.png))).digest('hex'),item.pngSha256);
    const pose=path.join(root,'demo-moves/reports/strong-kick-poses',item.character.toLowerCase()+'.png');
    assert.ok(fs.existsSync(pose));
  }
});

test('Calcio potente arriva alla posa finale a 500ms e torna alla guardia entro 900ms',()=>{
  for(const item of manifest.items){
    const entry=timing.items.find(t=>t.character===item.character);
    const animation=context.window.MOVES_CATALOG.characters.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='strong-kick');
    assert.equal(animation.name,'Calcio potente');assert.equal(animation.playbackMode,'forward-reverse');
    assert.equal(animation.impactMs,500);assert.equal(animation.durationMs,900);
    assert.equal(animation.playbackFps,item.frames*1000/900);
    assert.equal(entry.impactFrame,item.sourceEnd-item.sourceStart);
    assert.equal(item.frameSequence[entry.impactFrame],item.sourceEnd);
    assert.equal(item.frameSequence.at(-1),item.sourceStart);
    const atlas=read(item.atlas);
    assert.ok(Math.abs(animation.frameDurations.reduce((a,b)=>a+b,0)-900)<1e-8);
    for(let i=0;i<item.frames;i++)assert.equal(animation.frameDurations[i],atlas.frames[i].duration);
    for(const speed of [.5,1,2]){
      const start={frame:0,remainder:0};
      assert.ok(advanceAnimation(start,499/speed,animation,speed,true).frame<entry.impactFrame);
      assert.equal(advanceAnimation(start,500/speed,animation,speed,true).frame,entry.impactFrame);
      assert.equal(advanceAnimation(start,900/speed,animation,speed,true).frame,0);
      assert.equal(advanceAnimation(start,899/speed,animation,speed,false).ended,false);
      const end=advanceAnimation(start,900/speed,animation,speed,false);
      assert.equal(end.ended,true);assert.equal(end.frame,item.frames-1);
    }
  }
});
