const test=require('node:test'),assert=require('node:assert/strict');
const {create,ripple,steam}=require('../stage-palazzo-effects.js');
test('increspature contenute e vapore intermittente vicino al suolo',()=>{
 for(const t of [0,500,3000,6000,15000])for(const y of [0,50,100,194])assert.ok(Math.abs(ripple(y,t))<=15);
 assert.notEqual(ripple(100,0),ripple(100,1200));
 assert.equal(steam(12000).length,0);
 assert.ok(steam(3000).length>=7);
 assert.ok(steam(3000).some(p=>p.rx>30&&p.alpha>.18));
 for(const p of steam(3000)){assert.ok(p.y>=825&&p.y<=1020);assert.ok(p.alpha>=0&&p.alpha<=.24);}
});
test('riflessi e vapore seguono il drag e si disattivano separatamente',()=>{
 const image={},draws=[],puffs=[];
 const ctx={save(){},restore(){},drawImage(...a){draws.push(a);},fillRect(...a){puffs.push(a);}};
 const renderer=create(image);renderer.render(ctx,3000,0);assert.equal(draws.length,65);assert.ok(puffs.length>0);
 const x=draws[0][5];draws.length=0;renderer.render(ctx,3000,315);assert.equal(draws[0][5],x-315);
 renderer.setEffect('reflections',false);draws.length=0;renderer.render(ctx,4000,0);assert.equal(draws.length,0);
 renderer.setEffect('steam',false);puffs.length=0;renderer.render(ctx,4000,0);assert.equal(puffs.length,0);
 renderer.destroy();renderer.render(ctx,3000,0);assert.equal(draws.length,0);
});

