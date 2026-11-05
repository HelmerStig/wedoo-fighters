const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));

test('tutti i salti raggiungono l’apice a 500 ms e restano sincronizzati nei loop successivi',()=>{
  const sandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),sandbox);
  const manifest=read('animation/jump-manifest.json'),timing=read('animation/jump-timing.json');
  const characters=sandbox.window.MOVES_CATALOG.characters;
  assert.equal(manifest.items.length,characters.length);
  assert.equal(timing.items.length,characters.length);
  assert.equal(new Set(timing.items.map(i=>i.character.toLowerCase())).size,characters.length);
  for(const character of characters){
    const a=character.animations.find(a=>a.id==='jump');
    const item=manifest.items.find(i=>i.character.toLowerCase()===character.id);
    const selected=timing.items.find(i=>i.character.toLowerCase()===character.id);
    for(const key of ['sourceSheetId','sourceStart','sourceEnd'])assert.equal(selected[key],item[key]);
    assert.equal(a.apexFrame,selected.apexFrame);
    assert.equal(a.frames.length,item.sourceEnd-item.sourceStart+1);
    assert.equal(a.apexMs,500);
    assert.equal(a.durationMs,1000);
    assert.equal(a.ascentFps,a.apexFrame*2);
    assert.equal(a.descentFps,(a.frames.length-a.apexFrame)*2);
    assert.ok(Math.abs(a.frameDurations.reduce((sum,v)=>sum+v,0)-1000)<1e-8);
    const initial={frame:0,remainder:0};
    for(const elapsed of [500,1500,5500])assert.equal(advanceAnimation(initial,elapsed,a,1,true).frame,a.apexFrame,character.name);
    assert.equal(advanceAnimation(initial,499.99,a,1,true).frame,a.apexFrame-1,character.name);
    assert.equal(advanceAnimation(initial,250,a,2,true).frame,a.apexFrame,character.name);
    assert.equal(advanceAnimation(initial,1000,a,1,true).frame,0,character.name);
    assert.equal(advanceAnimation(initial,1000,a,1,false).ended,true,character.name);
    const before=advanceAnimation(initial,321,a,1,false);
    assert.equal(advanceAnimation(before,179,a,1,false).frame,a.apexFrame,character.name);
    const atlas=read(item.atlas);
    for(let i=0;i<item.frames;i++){
      assert.equal(atlas.frames[i].source_frame,item.sourceStart+i);
      assert.ok(Math.abs(atlas.frames[i].duration-a.frameDurations[i])<1e-8);
    }
    assert.ok(fs.existsSync(path.join(root,'demo-moves/reports/jump-poses',character.id+'.png')));
  }
  const report=fs.readFileSync(path.join(root,'demo-moves/reports/jump-timing.html'),'utf8');
  assert.match(report,/mosse\.html\?move=jump/);
  assert.equal((report.match(/<th scope="row">/g)||[]).length,characters.length);
});
