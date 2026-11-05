const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));

test('Parata alta copre il roster e raggiunge la posa selezionata a 100 ms per ogni personaggio',()=>{
  const sandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),sandbox);
  const manifest=read('animation/block-manifest.json'),timing=read('animation/block-timing.json');
  const characters=sandbox.window.MOVES_CATALOG.characters;
  assert.equal(manifest.items.length,characters.length);
  assert.equal(new Set(manifest.items.map(i=>i.character.toLowerCase())).size,characters.length);
  for(const character of characters){
    const a=character.animations.find(a=>a.id==='block');
    const item=manifest.items.find(i=>i.character.toLowerCase()===character.id);
    const selected=timing.items.find(i=>i.character.toLowerCase()===character.id);
    assert.equal(a.name,'Parata alta');
    for(const key of ['sourceSheetId','sourceStart','sourceEnd'])assert.equal(selected[key],item[key]);
    assert.equal(a.frames.length,item.sourceEnd-item.sourceStart+1);
    assert.equal(a.blockMs,100);
    assert.equal(a.playbackFps,a.blockFrame*10);
    const initial={frame:0,remainder:0};
    assert.equal(advanceAnimation(initial,100,a,1,true).frame,a.blockFrame,character.name);
    assert.equal(advanceAnimation(initial,99.99,a,1,true).frame,a.blockFrame-1,character.name);
    assert.equal(advanceAnimation(initial,200,a,.5,true).frame,a.blockFrame,character.name);
    assert.equal(advanceAnimation(initial,a.durationMs,a,1,true).frame,0,character.name);
    assert.equal(advanceAnimation(initial,a.durationMs,a,1,false).ended,true,character.name);
    const atlas=read(item.atlas);
    for(let i=0;i<item.frames;i++)assert.equal(atlas.frames[i].source_frame,item.sourceStart+i);
    assert.ok(fs.existsSync(path.join(root,'demo-moves/reports/block-poses',character.id+'.png')));
  }
  const report=fs.readFileSync(path.join(root,'demo-moves/reports/block-timing.html'),'utf8');
  assert.match(report,/mosse\.html\?move=block/);
  assert.equal((report.match(/<th scope="row">/g)||[]).length,characters.length);
});
