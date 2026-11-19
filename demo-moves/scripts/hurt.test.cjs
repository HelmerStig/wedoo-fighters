const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {advanceAnimation,effectiveFps}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=json('animation/hurt-manifest.json');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),sandbox);
const roster=sandbox.window.MOVES_CATALOG.characters;
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');

test('Hurt e disponibile per tutti e solo i personaggi del file da completare',()=>{
  const names=[...fs.readFileSync(path.join(root,'primi-personaggi-da-cpmpletare.txt'),'utf8').matchAll(/^- (.+)\r?$/gm)].map(m=>norm(m[1]));
  assert.deepEqual(manifest.items.map(i=>norm(i.character)).sort(),names.sort());
  assert.deepEqual(Array.from(roster.filter(c=>c.animations.some(a=>a.id==='hurt')),c=>norm(c.id)).sort(),names);
  assert.equal(manifest.durationMs,500);
  assert.equal(manifest.creditsUsed,0);
});

test('Hurt termina esattamente a 500 ms e riparte in loop alle diverse velocita',()=>{
  for(const item of manifest.items){
    const animation=roster.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='hurt');
    assert.equal(animation.name,'Hurt');
    assert.equal(animation.durationMs,500);
    assert.equal(animation.playbackMode,'forward');
    assert.equal(animation.armTrail,undefined);
    assert.equal(animation.frames.length,item.frames);
    assert.equal(animation.frameDurations.length,item.frames);
    assert.ok(Math.abs(animation.frameDurations.reduce((a,b)=>a+b,0)-500)<1e-8);
    for(const speed of [0.5,1,2]){
      assert.equal(effectiveFps(animation,speed),item.frames*2*speed);
      assert.equal(advanceAnimation({frame:0,remainder:0},499/speed,animation,speed,false).ended,false,item.character);
      assert.equal(advanceAnimation({frame:0,remainder:0},500/speed,animation,speed,false).ended,true,item.character);
      assert.equal(advanceAnimation({frame:0,remainder:0},500/speed,animation,speed,true).frame,0,item.character);
      let state={frame:0,remainder:0};
      for(let i=0;i<50;i++)state=advanceAnimation(state,10/speed,animation,speed,true);
      assert.equal(state.frame,0,item.character);
    }
  }
});

test('PNG Hurt, tagli e atlas conservano provenienza, celle e padding verificati',()=>{
  for(const item of manifest.items){
    const png=fs.readFileSync(path.join(root,item.png));
    assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256,item.character);
    const atlas=json(item.atlas),frames=Object.values(atlas.frames);
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    assert.equal(frames.length,item.frames);
    assert.equal(item.frames,item.sourceEnd-item.sourceStart+1);
    assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
    assert.equal(atlas.meta.duration_ms,500);
    assert.equal(atlas.meta.fps,item.frames*2);
    for(const [index,entry] of frames.entries()){
      const f=entry.frame;
      assert.equal(f.w,512);assert.equal(f.h,512);
      assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=width&&f.y+f.h<=height);
      assert.equal(entry.source_frame,item.sourceStart+index);
      assert.ok(Math.abs(entry.duration-500/item.frames)<1e-8);
      assert.match(entry.rgbaSha256,/^[a-f0-9]{64}$/);
    }
  }
});

test('report Hurt e CSV includono tutte le sequenze da 500 ms',()=>{
  const html=fs.readFileSync(path.join(root,'demo-moves/reports/hurt-timing.html'),'utf8');
  const csv=fs.readFileSync(path.join(root,'demo-moves/reports/hurt-timing.csv'),'utf8');
  assert.ok(html.includes('500 ms (0,50 s)'));
  for(const item of manifest.items){
    assert.ok(html.includes(item.sourceSheetId));assert.ok(csv.includes(item.sourceSheetId));
    assert.ok(fs.existsSync(path.join(root,'demo-moves/reports/hurt-poses',item.character.toLowerCase()+'.png')));
  }
  assert.ok(fs.readFileSync(path.join(root,'demo-moves/app.js'),'utf8').includes("hurt:'reports/hurt-timing.html'"));
});
