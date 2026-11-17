const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {samples,particles,create}=require('../arm-trail.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../catalog.js'),'utf8'),ctx);
const characters=ctx.window.MOVES_CATALOG.characters;
const animation=characters.find(c=>c.id==='oscar').animations.find(a=>a.id==='medium-punch');
const {advanceAnimation}=require('../player-core.js');
const at=time=>advanceAnimation({frame:0,remainder:0},time,animation,1,false);
test('effetto disponibile su tutti e soli i pugni importati, legato a fogli e tagli correnti',()=>{
 const enabled=characters.flatMap(c=>c.animations.filter(a=>a.armTrail).map(a=>c.id+'/'+a.id));
 const expected=[];
 for(const move of ['light-punch','medium-punch']){
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../../animation/'+move+'-manifest.json'),'utf8').replace(/^\uFEFF/,''));
  for(const item of manifest.items){
   const id=item.character.toLowerCase(),a=characters.find(c=>c.id===id).animations.find(a=>a.id===move),profile=a.armTrail;
   expected.push(id+'/'+move);
   assert.equal(profile.sourceSheetId,item.sourceSheetId);assert.equal(profile.sourceStart,item.sourceStart);assert.equal(profile.sourceEnd,item.sourceEnd);
   assert.equal(profile.impactFrame,a.impactFrame);assert.equal(profile.frameIndexSpace,'exported-playback');
  }
 }
 assert.deepEqual(Array.from(enabled).sort(),expected.sort());
 assert.equal(animation.impactMs,500);assert.equal(animation.durationMs,750);
});
test('ogni profilo emette dall avambraccio e dal pugno, senza cambiare durata, pause o recupero',()=>{
 for(const c of characters)for(const a of c.animations){
  if(!a.armTrail)continue;
  const p=a.armTrail,peak={frame:a.impactFrame,remainder:0};
  const dots=particles(a,peak,.75);assert.ok(dots.length>0,c.id+'/'+a.id);
  assert.ok(dots.every(d=>d.width<=7&&d.height===1&&d.alpha>0));
  assert.deepEqual(particles(a,{frame:0,remainder:0},1),[]);
  const end=advanceAnimation({frame:0,remainder:0},a.durationMs-1,a,1,false);
  assert.deepEqual(particles(a,end,1),[],c.id+'/'+a.id);
  assert.deepEqual(samples(a,end,1),[],c.id+'/'+a.id);
  for(const [index,polygon] of Object.entries(p.polygons)){
   assert.ok(Number(index)<=a.impactFrame);
   assert.ok(polygon.every(([x,y])=>x>=0&&x<512&&y>=0&&y<300));
   const xs=polygon.map(v=>v[0]),ys=polygon.map(v=>v[1]);
   assert.ok(Math.max(...ys)-Math.min(...ys)<=64);
   assert.ok(Math.max(...xs)-Math.min(...xs)<=170);
  }
  assert.ok(Object.keys(p.particles.origins).every(i=>Number(i)<=a.impactFrame));
  assert.equal(new Set(samples(a,peak,1).map(s=>s.frame)).size,samples(a,peak,1).length);
 }
});
test('sagome limitate all estensione, maschere del braccio e sfumatura dopo impatto',()=>{
 assert.deepEqual(samples(animation,at(400),1),[]);
 const ghosts=samples(animation,at(500),1);
 assert.equal(ghosts.length,3);assert.deepEqual(ghosts.map(x=>x.frame),[28,29,30]);
 assert.ok(ghosts[0].alpha<ghosts[2].alpha);
 assert.ok(samples(animation,at(515),1)[0].alpha<ghosts[0].alpha);
 assert.deepEqual(samples(animation,at(531),1),[]);
 assert.deepEqual(samples(animation,at(600),1),[]);
 assert.deepEqual(samples(animation,at(500),0),[]);
 for(const polygon of Object.values(animation.armTrail.polygons)){
  assert.ok(polygon.length>=3);
  assert.ok(polygon.every(([x,y])=>x>=270&&x<=445&&y>=120&&y<=180));
 }
});
test('particelle luminose nascono dal braccio, viaggiano a sinistra e svaniscono senza accumulo nei loop',()=>{
 const born=particles(animation,at(437.5),.75),later=particles(animation,at(457.5),.75);
 assert.equal(born.length,11);assert.ok(later[0].x<born[0].x);
 assert.ok(later[0].alpha<born[0].alpha);
 const peak=particles(animation,at(500),.75);
 assert.equal(peak.length,55);assert.ok(peak.every(p=>p.width>=3&&p.width<=7&&p.height===1&&p.alpha>0&&p.alpha<=.75));
 assert.ok(peak.every(p=>['#c8efff','#9cd8f0','#79bddb'].includes(p.color)));
 assert.ok(peak.every(p=>p.x>=250&&p.x<=450&&p.y>=100&&p.y<=190));
 assert.deepEqual(particles(animation,at(420),1),[]);
 assert.deepEqual(particles(animation,at(725),1),[]);
 assert.deepEqual(particles(animation,at(500),0),[]);
 assert.deepEqual(particles(animation,at(500),.75),peak,'seeking gives the same particles');
 const loop=advanceAnimation({frame:0,remainder:0},750,animation,1,true);
 assert.deepEqual(particles(animation,loop,1),[]);
});
function context(){
 const calls=[],stack=[];return {calls,globalAlpha:1,fillStyle:'#000',save(){stack.push([this.globalAlpha,this.fillStyle]);},restore(){[this.globalAlpha,this.fillStyle]=stack.pop();},
 beginPath(){calls.push(['begin']);},moveTo(x,y){calls.push(['point',x,y]);},lineTo(x,y){calls.push(['point',x,y]);},closePath(){},clip(){calls.push(['clip']);},
 drawImage(...a){calls.push(['image',this.globalAlpha,...a]);},fillRect(...a){calls.push(['rect',this.globalAlpha,this.fillStyle,...a]);}};
}
test('maschere alpha ritagliate senza lettura pixel; cache e stato canvas isolati',()=>{
 const canvases=[];const doc={createElement(){const c=context();const canvas={getContext(){return c;},context:c};canvases.push(canvas);return canvas;}};
 const renderer=create(animation,doc),target=context(),image={};
 renderer.draw(target,image,at(500),.75);
 assert.equal(canvases.length,3);assert.equal(target.globalAlpha,1);
 assert.equal(target.calls.filter(c=>c[0]==='rect').length,55);
 assert.ok(canvases.every(c=>c.context.calls.some(x=>x[0]==='clip')));
 assert.ok(canvases.every(c=>c.context.calls.some(x=>x[0]==='image')));
 renderer.draw(target,image,at(500),.25);assert.equal(canvases.length,3);
 renderer.destroy();renderer.draw(target,image,at(500),1);assert.equal(canvases.length,6);
});

