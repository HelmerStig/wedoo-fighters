const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),sandbox);
const manifest=read('animation/light-kick-manifest.json');
const timing=read('animation/light-kick-timing.json');

test('Calcio leggero importa i nove Pro richiesti, con i tagli salvati e senza Storyboard',()=>{
  assert.equal(manifest.items.length,9);
  assert.equal(manifest.creditsUsed,0);
  for(const item of manifest.items){
    assert.equal(item.sourceAnimationName,['alberto','oscar','fabio-clara','fra-tavarone','marsan','pippo','peppo','sboz'].includes(item.character.toLowerCase())?'light kick':'Light Kick Pro');
    const sequence=Array.from({length:item.sourceEnd-item.sourceStart+1},(_,i)=>item.sourceStart+i);
    if(item.playback==='forward-reverse')sequence.push(...sequence.slice(0,-1).reverse());
    assert.equal(item.frames,sequence.length);
    const atlas=read(item.atlas);
    assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
    assert.equal(Object.keys(atlas.frames).length,item.frames);
    assert.equal(item.frameWidth,512);assert.equal(item.frameHeight,512);
    for(let i=0;i<item.frames;i++)assert.equal(atlas.frames[i].source_frame,sequence[i]);
    const selected=timing.items.find(t=>t.character===item.character);
    assert.equal(selected.sourceSheetId,item.sourceSheetId);
    assert.equal(selected.impactSourceFrame,item.sourceStart+selected.impactFrame);
    const pose=path.join(root,'demo-moves/reports/light-kick-poses',item.character.toLowerCase()+'.png');
    assert.ok(fs.existsSync(pose));
  }
  const oscar=manifest.items.find(i=>i.character.toLowerCase()==='oscar');
  assert.equal(oscar.sourceStart,0);assert.equal(oscar.sourceEnd,15);
  assert.equal(oscar.playback,'forward-reverse');assert.equal(oscar.frames,31);
  assert.equal(oscar.frameSequence[15],15);assert.equal(oscar.frameSequence[30],0);
  const alberto=manifest.items.find(i=>i.character.toLowerCase()==='alberto');
  assert.equal(alberto.sourceStart,0);assert.equal(alberto.sourceEnd,16);
  assert.equal(alberto.playback,'forward-reverse');assert.equal(alberto.frames,33);
  assert.equal(alberto.frameSequence[16],16);assert.equal(alberto.frameSequence[32],0);
  const fabio=manifest.items.find(i=>i.character.toLowerCase()==='fabio-clara');
  assert.equal(fabio.sourceStart,0);assert.equal(fabio.sourceEnd,22);
  assert.equal(fabio.playback,'forward-reverse');assert.equal(fabio.frames,45);
  assert.equal(fabio.frameSequence[22],22);assert.equal(fabio.frameSequence[44],0);
  const tavarone=manifest.items.find(i=>i.character.toLowerCase()==='fra-tavarone');
  assert.equal(tavarone.sourceStart,0);assert.equal(tavarone.sourceEnd,14);
  assert.equal(tavarone.playback,'forward-reverse');assert.equal(tavarone.frames,29);
  assert.equal(tavarone.frameSequence[14],14);assert.equal(tavarone.frameSequence[28],0);
  const marsan=manifest.items.find(i=>i.character.toLowerCase()==='marsan');
  assert.equal(marsan.sourceStart,0);assert.equal(marsan.sourceEnd,12);
  assert.equal(marsan.playback,'forward-reverse');assert.equal(marsan.frames,25);
  assert.equal(marsan.frameSequence[12],12);assert.equal(marsan.frameSequence[24],0);
  for(const [slug,end,count] of [['pippo',15,31],['peppo',19,39],['sboz',12,25]]){
    const item=manifest.items.find(i=>i.character.toLowerCase()===slug);
    assert.equal(item.sourceStart,0);assert.equal(item.sourceEnd,end);
    assert.equal(item.playback,'forward-reverse');assert.equal(item.frames,count);
    assert.equal(item.frameSequence[end],end);assert.equal(item.frameSequence[count-1],0);
  }
});

test('Calcio leggero sincronizza impatto a 300ms e ciclo a 600ms anche variando velocità',()=>{
  for(const item of manifest.items){
    const c=sandbox.window.MOVES_CATALOG.characters.find(c=>c.id===item.character.toLowerCase());
    const a=c.animations.find(a=>a.id==='light-kick');
    assert.equal(a.name,'Calcio leggero');assert.equal(a.durationMs,600);assert.equal(a.impactMs,300);
    assert.equal(a.playbackFps,item.frames*1000/600);
    const atlas=read(item.atlas);
    assert.ok(Math.abs(a.frameDurations.reduce((n,d)=>n+d,0)-600)<1e-8);
    for(let i=0;i<item.frames;i++)assert.equal(a.frameDurations[i],atlas.frames[i].duration);
    for(const speed of [0.5,1,2]){
      const start={frame:0,remainder:0};
      assert.ok(advanceAnimation(start,299/speed,a,speed,true).frame<a.impactFrame,c.id);
      assert.equal(advanceAnimation(start,300/speed,a,speed,true).frame,a.impactFrame,c.id);
      assert.equal(advanceAnimation(start,600/speed,a,speed,true).frame,0,c.id);
      assert.equal(advanceAnimation(start,599/speed,a,speed,false).ended,false,c.id);
      assert.equal(advanceAnimation(start,600/speed,a,speed,false).ended,true,c.id);
    }
  }
});
