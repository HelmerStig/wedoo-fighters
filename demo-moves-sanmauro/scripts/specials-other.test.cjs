const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const data=require('../specials-catalog.js'),scene=require('../specials-other-scene.js'),base=require('../stages-catalog.js')[0],roster=require('../assets/manifest.json');
const root=path.resolve(__dirname,'..'),assets=Object.fromEntries(data.animations.map(a=>[a.id,a]));
function stage(cid){const make=(id,x)=>{const c=roster.characters.find(c=>c.id===id),a=c.animations.find(a=>a.id==='idle');return {characterId:id,x,groundY:1025,scale:a.normalizedPreview.scale[0]*4/3*c.stageHeightMultiplier,anchorX:a.normalizedPreview.anchor[0],anchorY:a.normalizedPreview.anchor[1]};};return {...base,fighters:[make(cid,675),make(cid==='oscare'?'arianna':'oscare',1890)]};}
test('Macchia = Torpe; 14 mosse e Super nuove solo di Mangler, Peirò escluso',()=>{
  assert.equal(data.characters.find(c=>c.id==='torpe').alias,'Macchia');
  assert.equal(data.characters.flatMap(c=>c.moves).length,14);
  assert.deepEqual(data.characters.filter(c=>c.moves.some(m=>m.kind==='Super')).map(c=>c.id),['arianna','mangler']);
  assert.ok(!data.characters.some(c=>c.id==='peirolo'));
});
test('asset locali originali con hash, frame entro PNG e rapporti umani conservati',()=>{
  for(const c of data.characters.slice(1)){
    assert.ok(fs.existsSync(path.join(root,'reports',c.id+'-specials.html')));
    const idle=roster.characters.find(r=>r.id===c.id).animations.find(a=>a.id==='idle');
    for(const m of c.moves)for(const id of [...m.phases,...m.projectiles])assert.ok(assets[id],id);
    for(const a of data.animations.filter(a=>a.characterId===c.id)){
      const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
      assert.equal(hash(a.sourceImage),a.sourceSha256,a.id);
      assert.equal(hash(a.image),a.imageSha256,a.id);
      assert.equal(a.frames.length,a.frameDurations.length);assert.equal(a.frames.length,a.footContacts.length);
      assert.ok(Math.abs(a.frameDurations.reduce((s,t)=>s+t,0)-a.durationMs)<1e-6);
      for(const [x,y,w,h]of a.frames)assert.ok(x>=0&&y>=0&&x+w<=a.sheetWidth&&y+h<=a.sheetHeight,a.id);
      if(a.normalizedPreview){assert.deepEqual(a.normalizedPreview.anchor,idle.normalizedPreview.anchor);assert.deepEqual(a.sourceScale,idle.sourceTransform.scale);}
    }
  }
});
test('accensione Oscare, sostituzione frame di lancio e timeline TRES Torpe',()=>{
  assert.equal(assets.cigarette.sourceIndices[18],19);assert.equal(assets.cigarette.frames.length,29);
  const p=scene.plan(data,stage('oscare'),'cigarette');assert.ok(Math.abs(p.spawnMs-(20+18)/60*1000)<1e-6);
  assert.equal(scene.sample(p,100).actors[0].animation,'cigarette-light');
  assert.equal(scene.sample(p,400).actors[0].animation,'cigarette');
  assert.equal(assets.bottle.frames.length,64);assert.equal(assets.welding.frames.length,64);
  assert.notEqual(assets.bottle.image,assets.bottle.sourceImage);
  assert.ok(Math.abs(scene.plan(data,stage('torpe'),'bottle').spawnMs-37/64*1000)<1e-6);
});
test('Super Mangler: corsa, distanza di arresto, due rullate con otto impatti',()=>{
  const p=scene.plan(data,stage('mangler'),'drums');assert.equal(p.events.length,8);
  assert.equal(scene.sample(p,p.rush+50).actors[0].animation,'drums-rotate');
  assert.equal(scene.sample(p,p.contact+100).actors[0].animation,'drums-roll');
  assert.equal(scene.sample(p,p.contact+100).actors[0].x,p.target.x-130*p.unit);
  assert.equal(scene.sample(p,p.rollEnd+100).actors[1].animation,'target-ko');
  assert.ok(Math.abs(p.rollEnd-p.contact-1000)<1e-6);
});
test('cantanti: materializzazione, corsa, tre colpi, uscita dopo la sequenza corretta',()=>{
  for(const move of ['tom','baglioni']){
    const p=scene.plan(data,stage('bue'),move),q=p.projectiles[0];assert.equal(p.events.length,3);assert.equal(p.spawnMs,150);
    assert.equal(scene.sample(p,q.start+10).actors.at(-1).animation,move+'-materialize');
    assert.equal(scene.sample(p,q.attack+10).actors.at(-1).animation,move+'-slaps');
    assert.equal(scene.sample(p,q.exit+10).actors.at(-1).animation,move+'-run');
  }
});
test('forza modifica velocità; bottiglia segue arco e ruota; saldatura emette particelle',()=>{
  for(const [cid,move]of [['mangler','cymbals'],['oscare','cigarette'],['torpe','bottle'],['mileto','guitar']]){
    const light=scene.plan(data,stage(cid),move,'light'),heavy=scene.plan(data,stage(cid),move,'heavy');assert.ok(heavy.projectiles[0].speed>light.projectiles[0].speed);
  }
  const p=scene.plan(data,stage('torpe'),'bottle'),actor=scene.sample(p,p.spawnMs+200).actors.find(a=>a.projectile);assert.ok(actor.rotation>Math.PI/2);assert.ok(Number.isFinite(actor.y));
  const weld=scene.plan(data,stage('torpe'),'welding');assert.ok(scene.sample(weld,weld.spawnMs+100).particles.length>0);
});
test('tutte le nuove mosse: scrub deterministico, coordinate e frame validi, termine finito',()=>{
  for(const c of data.characters.slice(1))for(const m of c.moves)for(const strength of ['light','medium','heavy']){
    const p=scene.plan(data,stage(c.id),m.id,strength);assert.ok(Number.isFinite(p.end)&&p.end>0);
    for(let t=0;t<p.end+100;t+=73){
      const sample=scene.sample(p,t);assert.deepEqual(sample,scene.sample(p,t));
      for(const a of sample.actors){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.scale>0,m.id);assert.ok(assets[a.animation]||['caster-idle','target-idle','target-hurt','target-ko'].includes(a.animation),a.animation);}
    }
  }
});
