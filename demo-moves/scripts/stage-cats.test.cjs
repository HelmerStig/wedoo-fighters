const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const cats=require('../stage-cats-catalog.js'),{controller,balconies,create}=require('../stage-cats.js');
test('spritesheet dei tre gatti validi, celle vuote escluse e PNG intatti',()=>{
 assert.deepEqual(Object.keys(cats),['telma','tilda','tullio']);
 assert.deepEqual(Object.values(cats).map(c=>c.animations.run.frames.length),[48,39,41]);
 for(const cat of Object.values(cats))for(const [id,a]of Object.entries(cat.animations)){
  const png=fs.readFileSync(path.resolve(__dirname,'..',a.image));assert.equal(crypto.createHash('sha256').update(png).digest('hex'),a.sourceSha256);
  for(const [x,y,w,h]of a.frames)assert.ok(w===512&&h===512&&x>=0&&y>=0&&x+w<=png.readUInt32BE(16)&&y+h<=png.readUInt32BE(20));
  if(id==='jump')assert.equal(a.frames.length,15);
 }
});
test('corse sui balconi e salti collegano soltanto gli appoggi reali nei due sensi',()=>{
 const cat=controller({level:'balconies',zone:0,scale:.2},()=>.5);let jumps=0,previous=cat.state(),zones=new Set([0]);
 for(let t=100;t<=120000;t+=100){
  const state=cat.update(t);zones.add(state.zone);
  if(state.phase==='jump'&&previous.phase!=='jump')jumps++;
  if(state.phase!=='jump'){
   const zone=balconies[state.zone];assert.ok(state.x>=zone.minX&&state.x<=zone.maxX);assert.equal(state.y,zone.y);
  }else assert.ok(state.y>=570&&state.y<=710);
  assert.ok(Math.abs(state.x-previous.x)<30);assert.ok(Math.abs(state.y-previous.y)<35);previous=state;
 }
 assert.ok(jumps>=2);assert.equal(zones.size,2);
});
test('rendering usa i frame originali, segue il drag e libera il renderer',()=>{
 const source=cats.tullio,images={run:{},jump:{}},definition={id:'tullio',level:'ground',scale:.25,animations:Object.fromEntries(Object.entries(source.animations).map(([k,a])=>[k,{animation:a,imageObject:images[k]}]))};
 const draws=[],positions=[];const ctx={save(){},restore(){},translate(...a){positions.push(a);},scale(){},drawImage(...a){draws.push(a);}};
 const renderer=create([definition]);renderer.render(ctx,1000,0);assert.equal(draws.length,1);const x=positions[0][0];renderer.render(ctx,1000,315);assert.equal(positions[1][0],x-315);
 renderer.destroy();renderer.render(ctx,2000,0);assert.equal(draws.length,2);
});
