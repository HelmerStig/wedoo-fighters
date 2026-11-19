const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {advanceAnimation}=require('../player-core.js');
const root=path.resolve(__dirname,'../..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=json('animation/crouch-manifest.json');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'demo-moves/catalog.js'),'utf8'),sandbox);
const roster=sandbox.window.MOVES_CATALOG.characters;
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');

test('Crouch importa solo i nove personaggi richiesti, con tagli, PNG e celle originali',()=>{
  const list=fs.readFileSync(path.join(root,'primi-personaggi-da-cpmpletare.txt'),'utf8');
  const expected=[...list.matchAll(/^- (.+)\r?$/gm)].map(m=>norm(m[1])).sort();
  assert.deepEqual(manifest.items.map(i=>norm(i.character)).sort(),expected);
  assert.deepEqual(Array.from(roster.filter(c=>c.animations.some(a=>a.id==='crouch')),c=>norm(c.id)).sort(),expected);
  assert.equal((list.match(/^    - Crouch\r?$/gm)||[]).length,expected.length);
  assert.equal(manifest.creditsUsed,0);
  for(const item of manifest.items){
    const png=fs.readFileSync(path.join(root,item.png)),atlas=json(item.atlas);
    assert.equal(crypto.createHash('sha256').update(png).digest('hex'),item.pngSha256);
    assert.equal(atlas.meta.source_sheet_id,item.sourceSheetId);
    assert.equal(atlas.meta.source_frame_count,item.sourceFrames);
    assert.equal(item.frames,item.sourceEnd-item.sourceStart+1);
    assert.equal(Object.keys(atlas.frames).length,item.frames);
    for(const [index,frame] of Object.values(atlas.frames).entries()){
      const f=frame.frame;
      assert.equal(frame.source_frame,item.sourceStart+index);
      assert.equal(f.w,512);assert.equal(f.h,512);
      assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=png.readUInt32BE(16)&&f.y+f.h<=png.readUInt32BE(20));
      assert.match(frame.rgbaSha256,/^[a-f0-9]{64}$/);
    }
  }
});

test('Crouch dura 250 ms, termina sulla posa finale e riparte solo se il loop e attivo',()=>{
  assert.equal(manifest.durationMs,250);
  const report=fs.readFileSync(path.join(root,'demo-moves/reports/crouch-timing.html'),'utf8');
  for(const item of manifest.items){
    const a=roster.find(c=>c.id===item.character.toLowerCase()).animations.find(a=>a.id==='crouch');
    assert.equal(a.name,'Crouch');assert.equal(a.durationMs,250);
    assert.equal(a.playbackFps,item.frames*4);assert.equal(a.playbackMode,'forward');
    assert.equal(a.armTrail,undefined);
    assert.ok(Math.abs(a.frameDurations.reduce((x,y)=>x+y,0)-250)<1e-8);
    for(const speed of [0.5,1,2]){
      assert.equal(advanceAnimation({frame:0,remainder:0},249/speed,a,speed,false).ended,false);
      const end=advanceAnimation({frame:0,remainder:0},250/speed,a,speed,false);
      assert.equal(end.ended,true);assert.equal(end.frame,item.frames-1);
      assert.equal(advanceAnimation(end,1000/speed,a,speed,false).frame,item.frames-1);
      assert.equal(advanceAnimation({frame:0,remainder:0},250/speed,a,speed,true).frame,0);
    }
    assert.ok(report.includes(item.sourceSheetId));
    assert.ok(fs.existsSync(path.join(root,'demo-moves/reports/crouch-poses',item.character.toLowerCase()+'.png')));
  }
  assert.ok(report.includes('250 ms (0,25 s)'));
});
